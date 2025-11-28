//! Rate limiting middleware for x402 premium endpoints
//!
//! Provides per-IP rate limiting to prevent abuse of the payment endpoints.

use axum::{
    extract::ConnectInfo,
    http::{Request, StatusCode},
    response::{IntoResponse, Response},
    Json,
};
use governor::{
    clock::DefaultClock,
    state::{InMemoryState, NotKeyed},
    Quota, RateLimiter,
};
use serde_json::json;
use std::{
    collections::HashMap,
    net::SocketAddr,
    num::NonZeroU32,
    sync::{Arc, RwLock},
    time::Duration,
};

/// Type alias for rate limiter map to reduce complexity
type RateLimiterMap =
    Arc<RwLock<HashMap<String, Arc<RateLimiter<NotKeyed, InMemoryState, DefaultClock>>>>>;

/// Rate limiter configuration for x402 endpoints
#[derive(Clone)]
pub struct X402RateLimiter {
    /// Per-IP rate limiters for premium verification
    verify_limiters: RateLimiterMap,
    /// Per-IP rate limiters for status checks
    status_limiters: RateLimiterMap,
    /// Quota for premium verification (more restrictive)
    verify_quota: Quota,
    /// Quota for status checks (less restrictive)
    status_quota: Quota,
}

impl X402RateLimiter {
    /// Create a new rate limiter with default quotas
    ///
    /// Default quotas:
    /// - Premium verification: 10 requests per minute per IP
    /// - Status checks: 60 requests per minute per IP
    pub fn new() -> Self {
        Self::with_quotas(
            Quota::per_minute(NonZeroU32::new(10).unwrap()),
            Quota::per_minute(NonZeroU32::new(60).unwrap()),
        )
    }

    /// Create a new rate limiter with custom quotas
    pub fn with_quotas(verify_quota: Quota, status_quota: Quota) -> Self {
        Self {
            verify_limiters: Arc::new(RwLock::new(HashMap::new())),
            status_limiters: Arc::new(RwLock::new(HashMap::new())),
            verify_quota,
            status_quota,
        }
    }

    /// Create a rate limiter for testing with higher limits
    pub fn for_testing() -> Self {
        Self::with_quotas(
            Quota::per_second(NonZeroU32::new(100).unwrap()),
            Quota::per_second(NonZeroU32::new(100).unwrap()),
        )
    }

    /// Get or create a rate limiter for an IP address (verify endpoint)
    fn get_verify_limiter(
        &self,
        ip: &str,
    ) -> Arc<RateLimiter<NotKeyed, InMemoryState, DefaultClock>> {
        // Try read lock first
        {
            let limiters = self.verify_limiters.read().unwrap();
            if let Some(limiter) = limiters.get(ip) {
                return limiter.clone();
            }
        }

        // Need to create new limiter
        let mut limiters = self.verify_limiters.write().unwrap();
        // Double-check after acquiring write lock
        if let Some(limiter) = limiters.get(ip) {
            return limiter.clone();
        }

        let limiter = Arc::new(RateLimiter::direct(self.verify_quota));
        limiters.insert(ip.to_string(), limiter.clone());
        limiter
    }

    /// Get or create a rate limiter for an IP address (status endpoint)
    fn get_status_limiter(
        &self,
        ip: &str,
    ) -> Arc<RateLimiter<NotKeyed, InMemoryState, DefaultClock>> {
        // Try read lock first
        {
            let limiters = self.status_limiters.read().unwrap();
            if let Some(limiter) = limiters.get(ip) {
                return limiter.clone();
            }
        }

        // Need to create new limiter
        let mut limiters = self.status_limiters.write().unwrap();
        // Double-check after acquiring write lock
        if let Some(limiter) = limiters.get(ip) {
            return limiter.clone();
        }

        let limiter = Arc::new(RateLimiter::direct(self.status_quota));
        limiters.insert(ip.to_string(), limiter.clone());
        limiter
    }

    /// Check rate limit for premium verification endpoint
    /// Returns Ok(()) if allowed, Err(Response) if rate limited
    #[allow(clippy::result_large_err)]
    pub fn check_verify(&self, ip: &str) -> Result<(), Response> {
        let limiter = self.get_verify_limiter(ip);
        match limiter.check() {
            Ok(_) => Ok(()),
            Err(not_until) => {
                let wait_time =
                    not_until.wait_time_from(governor::clock::Clock::now(&DefaultClock::default()));
                Err(rate_limit_response(wait_time))
            }
        }
    }

    /// Check rate limit for status endpoint
    /// Returns Ok(()) if allowed, Err(Response) if rate limited
    #[allow(clippy::result_large_err)]
    pub fn check_status(&self, ip: &str) -> Result<(), Response> {
        let limiter = self.get_status_limiter(ip);
        match limiter.check() {
            Ok(_) => Ok(()),
            Err(not_until) => {
                let wait_time =
                    not_until.wait_time_from(governor::clock::Clock::now(&DefaultClock::default()));
                Err(rate_limit_response(wait_time))
            }
        }
    }

    /// Clean up old rate limiters (call periodically)
    /// Removes limiters that haven't been used recently
    pub fn cleanup(&self) {
        // For now, we just clear all limiters
        // A more sophisticated implementation would track last access time
        let mut verify_limiters = self.verify_limiters.write().unwrap();
        let mut status_limiters = self.status_limiters.write().unwrap();

        // Only cleanup if we have more than 10000 entries
        if verify_limiters.len() > 10000 {
            verify_limiters.clear();
        }
        if status_limiters.len() > 10000 {
            status_limiters.clear();
        }
    }
}

impl Default for X402RateLimiter {
    fn default() -> Self {
        Self::new()
    }
}

/// Create a 429 Too Many Requests response
fn rate_limit_response(retry_after: Duration) -> Response {
    let retry_secs = retry_after.as_secs().max(1);

    let mut response = (
        StatusCode::TOO_MANY_REQUESTS,
        Json(json!({
            "error": "Rate limit exceeded",
            "retry_after_seconds": retry_secs,
            "hint": "Please wait before making another request"
        })),
    )
        .into_response();

    // Add Retry-After header
    response.headers_mut().insert(
        axum::http::header::RETRY_AFTER,
        axum::http::HeaderValue::from_str(&retry_secs.to_string()).unwrap(),
    );

    response
}

/// Extract client IP from request
/// Checks X-Forwarded-For header first (for proxied requests), then falls back to socket address
pub fn extract_client_ip<B>(
    req: &Request<B>,
    connect_info: Option<&ConnectInfo<SocketAddr>>,
) -> String {
    // Check X-Forwarded-For header first
    if let Some(forwarded) = req.headers().get("x-forwarded-for") {
        if let Ok(forwarded_str) = forwarded.to_str() {
            // Take the first IP in the chain (original client)
            if let Some(first_ip) = forwarded_str.split(',').next() {
                return first_ip.trim().to_string();
            }
        }
    }

    // Check X-Real-IP header
    if let Some(real_ip) = req.headers().get("x-real-ip") {
        if let Ok(ip_str) = real_ip.to_str() {
            return ip_str.trim().to_string();
        }
    }

    // Fall back to connection info
    if let Some(ConnectInfo(addr)) = connect_info {
        return addr.ip().to_string();
    }

    // Ultimate fallback
    "unknown".to_string()
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::num::NonZeroU32;

    #[test]
    fn test_rate_limiter_creation() {
        let limiter = X402RateLimiter::new();
        assert!(limiter.check_verify("127.0.0.1").is_ok());
        assert!(limiter.check_status("127.0.0.1").is_ok());
    }

    #[test]
    fn test_rate_limiter_exhaustion() {
        // Create a very restrictive limiter: 2 requests per minute
        let limiter = X402RateLimiter::with_quotas(
            Quota::per_minute(NonZeroU32::new(2).unwrap()),
            Quota::per_minute(NonZeroU32::new(2).unwrap()),
        );

        let ip = "192.168.1.1";

        // First two requests should pass
        assert!(limiter.check_verify(ip).is_ok());
        assert!(limiter.check_verify(ip).is_ok());

        // Third request should be rate limited
        assert!(limiter.check_verify(ip).is_err());
    }

    #[test]
    fn test_per_ip_isolation() {
        let limiter = X402RateLimiter::with_quotas(
            Quota::per_minute(NonZeroU32::new(1).unwrap()),
            Quota::per_minute(NonZeroU32::new(1).unwrap()),
        );

        // Each IP gets its own quota
        assert!(limiter.check_verify("10.0.0.1").is_ok());
        assert!(limiter.check_verify("10.0.0.2").is_ok());
        assert!(limiter.check_verify("10.0.0.3").is_ok());

        // But second request from same IP is blocked
        assert!(limiter.check_verify("10.0.0.1").is_err());
    }

    #[test]
    fn test_separate_endpoint_quotas() {
        let limiter = X402RateLimiter::with_quotas(
            Quota::per_minute(NonZeroU32::new(1).unwrap()), // verify: 1/min
            Quota::per_minute(NonZeroU32::new(5).unwrap()), // status: 5/min
        );

        let ip = "172.16.0.1";

        // Verify endpoint: 1 allowed
        assert!(limiter.check_verify(ip).is_ok());
        assert!(limiter.check_verify(ip).is_err());

        // Status endpoint: 5 allowed (separate quota)
        assert!(limiter.check_status(ip).is_ok());
        assert!(limiter.check_status(ip).is_ok());
        assert!(limiter.check_status(ip).is_ok());
        assert!(limiter.check_status(ip).is_ok());
        assert!(limiter.check_status(ip).is_ok());
        assert!(limiter.check_status(ip).is_err());
    }

    #[test]
    fn test_cleanup() {
        let limiter = X402RateLimiter::new();

        // Create many limiters
        for i in 0..100 {
            limiter.check_verify(&format!("192.168.1.{}", i)).ok();
        }

        // Cleanup shouldn't panic
        limiter.cleanup();
    }

    #[test]
    fn test_extract_client_ip_no_headers() {
        let req = Request::builder().uri("/test").body(()).unwrap();

        let addr: SocketAddr = "192.168.1.100:8080".parse().unwrap();
        let connect_info = ConnectInfo(addr);

        let ip = extract_client_ip(&req, Some(&connect_info));
        assert_eq!(ip, "192.168.1.100");
    }

    #[test]
    fn test_extract_client_ip_forwarded_for() {
        let req = Request::builder()
            .uri("/test")
            .header("x-forwarded-for", "10.0.0.1, 192.168.1.1")
            .body(())
            .unwrap();

        let ip = extract_client_ip(&req, None);
        assert_eq!(ip, "10.0.0.1");
    }

    #[test]
    fn test_extract_client_ip_real_ip() {
        let req = Request::builder()
            .uri("/test")
            .header("x-real-ip", "10.0.0.5")
            .body(())
            .unwrap();

        let ip = extract_client_ip(&req, None);
        assert_eq!(ip, "10.0.0.5");
    }
}
