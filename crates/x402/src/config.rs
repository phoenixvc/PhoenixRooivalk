//! Configuration for x402 payment integration

use serde::{Deserialize, Serialize};

/// Configuration for x402 payment processing
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct X402Config {
    /// Solana wallet address for receiving payments
    pub wallet_address: String,

    /// x402 facilitator endpoint URL
    pub facilitator_url: String,

    /// Solana RPC endpoint for payment verification
    pub solana_rpc_url: String,

    /// Whether x402 payments are enabled
    pub enabled: bool,

    /// Network (mainnet, devnet, testnet)
    pub network: String,

    /// Minimum payment amount in USDC (prevents dust attacks)
    pub min_payment_usdc: String,
}

impl X402Config {
    /// Create configuration from environment variables
    pub fn from_env() -> Result<Self, crate::X402Error> {
        Ok(Self {
            wallet_address: std::env::var("X402_WALLET_ADDRESS").map_err(|_| {
                crate::X402Error::ConfigError("X402_WALLET_ADDRESS not set".to_string())
            })?,
            facilitator_url: std::env::var("X402_FACILITATOR_URL")
                .unwrap_or_else(|_| "https://x402.org/facilitator".to_string()),
            solana_rpc_url: std::env::var("SOLANA_RPC_URL")
                .unwrap_or_else(|_| "https://api.devnet.solana.com".to_string()),
            enabled: std::env::var("X402_ENABLED")
                .map(|v| v == "true" || v == "1")
                .unwrap_or(false),
            network: std::env::var("SOLANA_NETWORK").unwrap_or_else(|_| "devnet".to_string()),
            min_payment_usdc: std::env::var("X402_MIN_PAYMENT")
                .unwrap_or_else(|_| "0.001".to_string()),
        })
    }

    /// Create a devnet configuration for testing
    pub fn devnet(wallet_address: &str) -> Self {
        Self {
            wallet_address: wallet_address.to_string(),
            facilitator_url: "https://x402.org/facilitator".to_string(),
            solana_rpc_url: "https://api.devnet.solana.com".to_string(),
            enabled: true,
            network: "devnet".to_string(),
            min_payment_usdc: "0.001".to_string(),
        }
    }

    /// Create a mainnet configuration for production
    pub fn mainnet(wallet_address: &str) -> Self {
        Self {
            wallet_address: wallet_address.to_string(),
            facilitator_url: "https://x402.org/facilitator".to_string(),
            solana_rpc_url: "https://api.mainnet-beta.solana.com".to_string(),
            enabled: true,
            network: "mainnet-beta".to_string(),
            min_payment_usdc: "0.001".to_string(),
        }
    }
}

impl Default for X402Config {
    fn default() -> Self {
        Self {
            wallet_address: String::new(),
            facilitator_url: "https://x402.org/facilitator".to_string(),
            solana_rpc_url: "https://api.devnet.solana.com".to_string(),
            enabled: false,
            network: "devnet".to_string(),
            min_payment_usdc: "0.001".to_string(),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_devnet_config() {
        let config = X402Config::devnet("PhxRvk123");
        assert_eq!(config.wallet_address, "PhxRvk123");
        assert_eq!(config.network, "devnet");
        assert!(config.enabled);
        assert!(config.solana_rpc_url.contains("devnet"));
    }

    #[test]
    fn test_mainnet_config() {
        let config = X402Config::mainnet("PhxRvk456");
        assert_eq!(config.wallet_address, "PhxRvk456");
        assert_eq!(config.network, "mainnet-beta");
        assert!(config.enabled);
        assert!(config.solana_rpc_url.contains("mainnet"));
    }

    #[test]
    fn test_default_config() {
        let config = X402Config::default();
        assert!(!config.enabled);
        assert!(config.wallet_address.is_empty());
    }
}
