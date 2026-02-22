use anyhow::{Context, Result};
use clap::{Arg, Command};
use phoenix_evidence::hash::sha256_hex;
use reqwest::Client;
use serde_json::{json, Value};
use std::fs;

/// Build the CLI command definition.
///
/// Extracted so tests can call `build_cli().try_get_matches_from(...)` without
/// hitting `std::process::exit` on parse errors.
fn build_cli() -> Command {
    Command::new("record-evidence")
        .about("Record evidence and optionally submit to Phoenix API for anchoring")
        .version("0.1.0")
        .arg(
            Arg::new("event_type")
                .help("Short type label, e.g., engagement_summary")
                .required(true)
                .index(1),
        )
        .arg(
            Arg::new("payload")
                .help("Inline JSON (e.g., '{\"a\":1}') or @path/to/file.json to load from file")
                .required(true)
                .index(2),
        )
        .arg(
            Arg::new("api-url")
                .long("api-url")
                .help("Phoenix API URL for evidence submission")
                .default_value("http://localhost:8080"),
        )
        .arg(
            Arg::new("submit")
                .long("submit")
                .help("Submit evidence to API for anchoring")
                .action(clap::ArgAction::SetTrue),
        )
        .arg(
            Arg::new("output-format")
                .long("output-format")
                .help("Output format: json, digest-only")
                .default_value("json"),
        )
}

/// Resolve the payload argument: inline JSON string or `@/path/to/file.json`.
fn resolve_payload(payload_arg: &str) -> Result<Value> {
    if let Some(path) = payload_arg.strip_prefix('@') {
        let content = fs::read_to_string(path)
            .with_context(|| format!("Failed to read payload file: {}", path))?;
        serde_json::from_str(&content)
            .with_context(|| format!("Failed to parse JSON from file: {}", path))
    } else {
        serde_json::from_str(payload_arg).with_context(|| "Failed to parse inline JSON payload")
    }
}

#[tokio::main]
async fn main() -> Result<()> {
    let matches = build_cli().get_matches();

    let event_type = matches.get_one::<String>("event_type").unwrap();
    let payload_arg = matches.get_one::<String>("payload").unwrap();
    let api_url = matches.get_one::<String>("api-url").unwrap();
    let submit = matches.get_flag("submit");
    let output_format = matches.get_one::<String>("output-format").unwrap();

    // Load payload
    let payload = resolve_payload(payload_arg)?;

    // Compute digest
    let canonical_json = serde_json::to_string(&payload)?;
    let digest = sha256_hex(canonical_json.as_bytes());

    // Create evidence record
    let evidence_record = json!({
        "event_type": event_type,
        "digest": digest,
        "payload": payload,
        "timestamp": chrono::Utc::now().to_rfc3339()
    });

    if submit {
        // Submit to API
        let client = Client::new();
        let submit_payload = json!({
            "digest_hex": digest,
            "payload_mime": "application/json",
            "metadata": {
                "event_type": event_type,
                "timestamp": chrono::Utc::now().to_rfc3339()
            }
        });

        let response = client
            .post(format!("{}/evidence", api_url))
            .json(&submit_payload)
            .send()
            .await
            .context("Failed to submit evidence to API")?;

        if !response.status().is_success() {
            let status = response.status();
            let error_text = response.text().await.unwrap_or_default();
            anyhow::bail!("API request failed with status {}: {}", status, error_text);
        }

        let api_response: Value = response
            .json()
            .await
            .context("Failed to parse API response")?;

        match output_format.as_str() {
            "digest-only" => println!("{}", digest),
            "json" => {
                let output = json!({
                    "digest": digest,
                    "event_type": event_type,
                    "api_response": api_response,
                    "submitted": true
                });
                println!("{}", serde_json::to_string_pretty(&output)?);
            }
            _ => anyhow::bail!("Invalid output format: {}", output_format),
        }
    } else {
        // Local processing only
        match output_format.as_str() {
            "digest-only" => println!("{}", digest),
            "json" => {
                let output = json!({
                    "digest": digest,
                    "event_type": event_type,
                    "evidence_record": evidence_record,
                    "submitted": false
                });
                println!("{}", serde_json::to_string_pretty(&output)?);
            }
            _ => anyhow::bail!("Invalid output format: {}", output_format),
        }
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Write;
    use tempfile::NamedTempFile;

    // ---------------------------------------------------------------------------
    // Argument parsing
    // ---------------------------------------------------------------------------

    #[test]
    fn test_cli_requires_event_type_and_payload() {
        // Missing both positional args — should fail to parse
        let result = build_cli().try_get_matches_from(["record-evidence"]);
        assert!(result.is_err(), "expected parse error when args are missing");
    }

    #[test]
    fn test_cli_parses_positional_args() {
        let m = build_cli()
            .try_get_matches_from(["record-evidence", "engagement_summary", r#"{"a":1}"#])
            .expect("valid args should parse");

        assert_eq!(
            m.get_one::<String>("event_type").unwrap(),
            "engagement_summary"
        );
        assert_eq!(
            m.get_one::<String>("payload").unwrap(),
            r#"{"a":1}"#
        );
        // Defaults
        assert_eq!(
            m.get_one::<String>("api-url").unwrap(),
            "http://localhost:8080"
        );
        assert!(!m.get_flag("submit"));
        assert_eq!(m.get_one::<String>("output-format").unwrap(), "json");
    }

    #[test]
    fn test_cli_parses_optional_flags() {
        let m = build_cli()
            .try_get_matches_from([
                "record-evidence",
                "test_event",
                "{}",
                "--submit",
                "--api-url",
                "http://api.example.com",
                "--output-format",
                "digest-only",
            ])
            .expect("valid args with flags should parse");

        assert!(m.get_flag("submit"));
        assert_eq!(
            m.get_one::<String>("api-url").unwrap(),
            "http://api.example.com"
        );
        assert_eq!(
            m.get_one::<String>("output-format").unwrap(),
            "digest-only"
        );
    }

    // ---------------------------------------------------------------------------
    // Payload resolution
    // ---------------------------------------------------------------------------

    #[test]
    fn test_resolve_payload_inline_json() {
        let v = resolve_payload(r#"{"event":"test","count":3}"#).unwrap();
        assert_eq!(v["event"], "test");
        assert_eq!(v["count"], 3);
    }

    #[test]
    fn test_resolve_payload_inline_array() {
        let v = resolve_payload("[1,2,3]").unwrap();
        assert!(v.is_array());
        assert_eq!(v.as_array().unwrap().len(), 3);
    }

    #[test]
    fn test_resolve_payload_inline_invalid_json() {
        let result = resolve_payload("{not valid json}");
        assert!(result.is_err(), "invalid JSON should return an error");
    }

    #[test]
    fn test_resolve_payload_from_file() {
        let mut tmp = NamedTempFile::new().unwrap();
        write!(tmp, r#"{{"source":"file","value":42}}"#).unwrap();

        let path_arg = format!("@{}", tmp.path().display());
        let v = resolve_payload(&path_arg).unwrap();

        assert_eq!(v["source"], "file");
        assert_eq!(v["value"], 42);
    }

    #[test]
    fn test_resolve_payload_file_not_found() {
        let result = resolve_payload("@/nonexistent/path/payload.json");
        assert!(result.is_err(), "missing file should return an error");
        let msg = format!("{}", result.unwrap_err());
        assert!(
            msg.contains("Failed to read payload file"),
            "error should name the failing file, got: {}",
            msg
        );
    }

    #[test]
    fn test_resolve_payload_file_invalid_json() {
        let mut tmp = NamedTempFile::new().unwrap();
        write!(tmp, "this is not json").unwrap();

        let path_arg = format!("@{}", tmp.path().display());
        let result = resolve_payload(&path_arg);
        assert!(result.is_err(), "invalid JSON in file should return an error");
    }

    // ---------------------------------------------------------------------------
    // Hash computation
    // ---------------------------------------------------------------------------

    #[test]
    fn test_sha256_hex_known_vector() {
        // SHA-256("") = e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
        assert_eq!(
            sha256_hex(b""),
            "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
        );
    }

    #[test]
    fn test_sha256_hex_hello() {
        // SHA-256("hello") = 2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824
        assert_eq!(
            sha256_hex(b"hello"),
            "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824"
        );
    }

    #[test]
    fn test_digest_is_deterministic_for_same_payload() {
        let payload: Value = serde_json::from_str(r#"{"key":"value"}"#).unwrap();
        let canonical = serde_json::to_string(&payload).unwrap();

        let digest_a = sha256_hex(canonical.as_bytes());
        let digest_b = sha256_hex(canonical.as_bytes());

        assert_eq!(digest_a, digest_b);
        assert_eq!(digest_a.len(), 64, "SHA-256 hex digest must be 64 chars");
        assert!(
            digest_a.chars().all(|c| c.is_ascii_hexdigit()),
            "digest must be lowercase hex"
        );
    }

    #[test]
    fn test_digest_differs_for_different_payloads() {
        let a: Value = serde_json::from_str(r#"{"x":1}"#).unwrap();
        let b: Value = serde_json::from_str(r#"{"x":2}"#).unwrap();

        let digest_a = sha256_hex(serde_json::to_string(&a).unwrap().as_bytes());
        let digest_b = sha256_hex(serde_json::to_string(&b).unwrap().as_bytes());

        assert_ne!(digest_a, digest_b);
    }
}
