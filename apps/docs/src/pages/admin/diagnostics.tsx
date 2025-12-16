/**
 * System Diagnostics Page
 *
 * Shows configuration status and helps debug Azure/cloud service issues.
 * Access: /admin/diagnostics
 */

import React, { useEffect, useState } from "react";
import Layout from "@theme/Layout";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import {
  getCloudServices,
  getProviderStatus,
  isCloudConfigured,
} from "@site/src/services/cloud/provider";

interface DiagnosticResult {
  name: string;
  status: "ok" | "warning" | "error" | "unknown";
  message: string;
  details?: string;
  fix?: string;
}

interface ConfigValue {
  name: string;
  envVar: string;
  isSet: boolean;
  isSensitive: boolean;
  required: boolean;
  purpose: string;
}

export default function DiagnosticsPage(): React.ReactElement {
  const { siteConfig } = useDocusaurusContext();
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([]);
  const [configValues, setConfigValues] = useState<ConfigValue[]>([]);
  const [functionsTest, setFunctionsTest] = useState<{
    status: "pending" | "testing" | "success" | "error";
    message: string;
  }>({ status: "pending", message: "Not tested" });
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    runDiagnostics();
  }, []);

  const runDiagnostics = () => {
    const azureConfig = siteConfig.customFields?.azureConfig as
      | Record<string, string>
      | undefined;

    // Check configuration values
    const configs: ConfigValue[] = [
      {
        name: "Tenant ID",
        envVar: "AZURE_ENTRA_TENANT_ID",
        isSet: Boolean(azureConfig?.tenantId),
        isSensitive: false,
        required: true,
        purpose: "Azure Entra ID authentication",
      },
      {
        name: "Client ID",
        envVar: "AZURE_ENTRA_CLIENT_ID",
        isSet: Boolean(azureConfig?.clientId),
        isSensitive: false,
        required: true,
        purpose: "Azure Entra ID app registration",
      },
      {
        name: "Functions Base URL",
        envVar: "AZURE_FUNCTIONS_BASE_URL",
        isSet: Boolean(azureConfig?.functionsBaseUrl),
        isSensitive: false,
        required: true,
        purpose: "AI features, database proxy, comments",
      },
      {
        name: "Authority URL",
        envVar: "AZURE_ENTRA_AUTHORITY",
        isSet: Boolean(azureConfig?.authority),
        isSensitive: false,
        required: false,
        purpose: "Custom authentication authority",
      },
      {
        name: "App Insights",
        envVar: "AZURE_APP_INSIGHTS_CONNECTION_STRING",
        isSet: Boolean(azureConfig?.appInsightsConnectionString),
        isSensitive: true,
        required: false,
        purpose: "Analytics and monitoring",
      },
    ];
    setConfigValues(configs);

    // Run diagnostic checks
    const results: DiagnosticResult[] = [];

    // 1. Cloud Provider Status
    const providerStatus = getProviderStatus();
    results.push({
      name: "Cloud Provider",
      status: providerStatus.active === "azure" ? "ok" : "warning",
      message: `Active: ${providerStatus.active}`,
      details: `Available providers: ${providerStatus.available.join(", ")}`,
      fix:
        providerStatus.active === "offline"
          ? "Configure Azure secrets in GitHub repository settings"
          : undefined,
    });

    // 2. Azure Functions Configuration
    const functionsConfigured = Boolean(azureConfig?.functionsBaseUrl);
    results.push({
      name: "Azure Functions",
      status: functionsConfigured ? "ok" : "error",
      message: functionsConfigured
        ? `Configured: ${azureConfig?.functionsBaseUrl}`
        : "Not configured",
      details: functionsConfigured
        ? "AI features should be available"
        : "AI Functions, inline comments, and database features will not work",
      fix: !functionsConfigured
        ? "Set AZURE_FUNCTIONS_BASE_URL in GitHub Secrets (e.g., https://func-phoenix-rooivalk.azurewebsites.net)"
        : undefined,
    });

    // 3. Authentication Configuration
    const authConfigured = Boolean(
      azureConfig?.tenantId && azureConfig?.clientId,
    );
    results.push({
      name: "Authentication",
      status: authConfigured ? "ok" : "warning",
      message: authConfigured ? "Configured" : "Not configured",
      details: authConfigured
        ? "User sign-in should work"
        : "Users cannot sign in - comments and personalization disabled",
      fix: !authConfigured
        ? "Set AZURE_ENTRA_TENANT_ID and AZURE_ENTRA_CLIENT_ID in GitHub Secrets"
        : undefined,
    });

    // 4. Cloud Services Status
    const cloudConfigured = isCloudConfigured();
    results.push({
      name: "Cloud Services Overall",
      status: cloudConfigured ? "ok" : "error",
      message: cloudConfigured ? "Configured" : "Not configured",
      details: cloudConfigured
        ? "Cloud-dependent features are available"
        : "Running in offline mode - limited functionality",
    });

    // 5. Functions Service Status
    const services = getCloudServices();
    results.push({
      name: "Functions Service",
      status: services.functions.isConfigured() ? "ok" : "error",
      message: services.functions.isConfigured()
        ? "Service initialized"
        : "Service not available",
      details: services.functions.isConfigured()
        ? "Ready to call Azure Functions"
        : "AI features will show 'AI Functions not available' error",
    });

    setDiagnostics(results);
  };

  const testFunctionsConnectivity = async () => {
    setFunctionsTest({ status: "testing", message: "Testing connection..." });

    const azureConfig = siteConfig.customFields?.azureConfig as
      | Record<string, string>
      | undefined;

    if (!azureConfig?.functionsBaseUrl) {
      setFunctionsTest({
        status: "error",
        message: "Cannot test - AZURE_FUNCTIONS_BASE_URL not configured",
      });
      return;
    }

    try {
      const healthUrl = `${azureConfig.functionsBaseUrl}/api/health`;
      const response = await fetch(healthUrl, {
        method: "GET",
        headers: { Accept: "application/json" },
      });

      if (response.ok) {
        const data = await response.json();
        setFunctionsTest({
          status: "success",
          message: `Connected! Status: ${data.status || "healthy"}`,
        });
      } else {
        setFunctionsTest({
          status: "error",
          message: `HTTP ${response.status}: ${response.statusText}`,
        });
      }
    } catch (error) {
      setFunctionsTest({
        status: "error",
        message: `Connection failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    }
  };

  const getStatusIcon = (
    status: "ok" | "warning" | "error" | "unknown",
  ): string => {
    switch (status) {
      case "ok":
        return "\u2705"; // green check
      case "warning":
        return "\u26A0\uFE0F"; // warning
      case "error":
        return "\u274C"; // red x
      default:
        return "\u2753"; // question mark
    }
  };

  const getStatusColor = (
    status: "ok" | "warning" | "error" | "unknown",
  ): string => {
    switch (status) {
      case "ok":
        return "#28a745";
      case "warning":
        return "#ffc107";
      case "error":
        return "#dc3545";
      default:
        return "#6c757d";
    }
  };

  if (!isClient) {
    return (
      <Layout title="System Diagnostics">
        <div className="container margin-vert--lg">
          <p>Loading diagnostics...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      title="System Diagnostics"
      description="Check Azure configuration and cloud service status"
    >
      <main className="container margin-vert--lg">
        <h1>System Diagnostics</h1>
        <p>
          This page helps diagnose configuration issues with Azure services.
          <br />
          <strong>Note:</strong> This page is for administrators only.
        </p>

        {/* Quick Status */}
        <section style={{ marginBottom: "2rem" }}>
          <h2>Quick Status</h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "1rem",
            }}
          >
            {diagnostics.map((d) => (
              <div
                key={d.name}
                style={{
                  padding: "1rem",
                  border: `2px solid ${getStatusColor(d.status)}`,
                  borderRadius: "8px",
                  backgroundColor: `${getStatusColor(d.status)}15`,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <span style={{ fontSize: "1.5rem" }}>
                    {getStatusIcon(d.status)}
                  </span>
                  <strong>{d.name}</strong>
                </div>
                <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.9rem" }}>
                  {d.message}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Configuration Values */}
        <section style={{ marginBottom: "2rem" }}>
          <h2>Configuration Values</h2>
          <p>
            These values are set at <strong>build time</strong> from GitHub
            Secrets/Variables.
          </p>
          <table>
            <thead>
              <tr>
                <th>Setting</th>
                <th>Environment Variable</th>
                <th>Status</th>
                <th>Required</th>
                <th>Purpose</th>
              </tr>
            </thead>
            <tbody>
              {configValues.map((config) => (
                <tr key={config.envVar}>
                  <td>
                    <strong>{config.name}</strong>
                  </td>
                  <td>
                    <code>{config.envVar}</code>
                  </td>
                  <td>
                    {config.isSet ? (
                      <span style={{ color: "#28a745" }}>
                        {"\u2705"} Configured
                      </span>
                    ) : (
                      <span style={{ color: "#dc3545" }}>
                        {"\u274C"} Not set
                      </span>
                    )}
                  </td>
                  <td>{config.required ? "Yes" : "No"}</td>
                  <td>{config.purpose}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Azure Functions Connectivity Test */}
        <section style={{ marginBottom: "2rem" }}>
          <h2>Azure Functions Connectivity Test</h2>
          <p>Test if the docs site can reach the Azure Functions backend.</p>
          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            <button
              onClick={testFunctionsConnectivity}
              disabled={functionsTest.status === "testing"}
              style={{
                padding: "0.5rem 1rem",
                cursor:
                  functionsTest.status === "testing"
                    ? "not-allowed"
                    : "pointer",
              }}
            >
              {functionsTest.status === "testing"
                ? "Testing..."
                : "Test Connection"}
            </button>
            <span
              style={{
                color:
                  functionsTest.status === "success"
                    ? "#28a745"
                    : functionsTest.status === "error"
                      ? "#dc3545"
                      : "#6c757d",
              }}
            >
              {functionsTest.status === "success" && "\u2705 "}
              {functionsTest.status === "error" && "\u274C "}
              {functionsTest.message}
            </span>
          </div>
        </section>

        {/* Detailed Diagnostics */}
        <section style={{ marginBottom: "2rem" }}>
          <h2>Detailed Diagnostics</h2>
          {diagnostics.map((d) => (
            <div
              key={d.name}
              style={{
                marginBottom: "1rem",
                padding: "1rem",
                border: "1px solid var(--ifm-color-emphasis-300)",
                borderRadius: "4px",
              }}
            >
              <h3 style={{ margin: 0 }}>
                {getStatusIcon(d.status)} {d.name}
              </h3>
              <p>
                <strong>Status:</strong> {d.message}
              </p>
              {d.details && (
                <p style={{ color: "var(--ifm-color-emphasis-700)" }}>
                  {d.details}
                </p>
              )}
              {d.fix && (
                <div
                  style={{
                    backgroundColor:
                      "var(--ifm-color-warning-contrast-background)",
                    padding: "0.5rem 1rem",
                    borderRadius: "4px",
                    marginTop: "0.5rem",
                  }}
                >
                  <strong>Fix:</strong> {d.fix}
                </div>
              )}
            </div>
          ))}
        </section>

        {/* How to Fix */}
        <section style={{ marginBottom: "2rem" }}>
          <h2>How to Fix Configuration Issues</h2>

          <h3>1. Deploy Azure Infrastructure</h3>
          <p>First, ensure Azure resources are deployed:</p>
          <pre>
            <code>
              {`# Option A: Use GitHub Actions (recommended)
# Go to: Actions → "Deploy Azure Infrastructure" → Run workflow

# Option B: Manual CLI deployment
cd infra/azure
./scripts/setup-all.sh dev eastus`}
            </code>
          </pre>

          <h3>2. Configure GitHub Secrets</h3>
          <p>
            Set the following in GitHub: <br />
            <strong>
              Settings → Secrets and variables → Actions → Secrets
            </strong>
          </p>
          <table>
            <thead>
              <tr>
                <th>Secret Name</th>
                <th>Value Source</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <code>AZURE_FUNCTIONS_BASE_URL</code>
                </td>
                <td>
                  <code>https://[your-function-app].azurewebsites.net</code>
                </td>
              </tr>
              <tr>
                <td>
                  <code>AZURE_ENTRA_TENANT_ID</code>
                </td>
                <td>Azure Portal → Entra ID → Overview</td>
              </tr>
              <tr>
                <td>
                  <code>AZURE_ENTRA_CLIENT_ID</code>
                </td>
                <td>Azure Portal → Entra ID → App registrations</td>
              </tr>
            </tbody>
          </table>

          <h3>3. Redeploy the Docs Site</h3>
          <p>
            After setting secrets, trigger a new deployment to rebuild with the
            configuration:
          </p>
          <pre>
            <code>
              {`# Push a change to main branch, OR
# Go to: Actions → "Deploy Docusaurus to Azure Static Web Apps" → Run workflow`}
            </code>
          </pre>
        </section>

        {/* Links */}
        <section>
          <h2>Related Documentation</h2>
          <ul>
            <li>
              <a href="https://github.com/JustAGhosT/PhoenixRooivalk/blob/main/.github/AZURE_SETUP.md">
                Azure Setup Guide (.github/AZURE_SETUP.md)
              </a>
            </li>
            <li>
              <a href="https://github.com/JustAGhosT/PhoenixRooivalk/blob/main/.github/DEPLOYMENT_SEQUENCE.md">
                Deployment Sequence (.github/DEPLOYMENT_SEQUENCE.md)
              </a>
            </li>
            <li>
              <a href="https://github.com/JustAGhosT/PhoenixRooivalk/blob/main/apps/docs/CONFIGURATION.md">
                Docs Configuration (apps/docs/CONFIGURATION.md)
              </a>
            </li>
          </ul>
        </section>
      </main>
    </Layout>
  );
}
