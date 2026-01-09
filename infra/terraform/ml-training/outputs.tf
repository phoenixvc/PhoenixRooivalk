# Outputs for Azure ML Training Infrastructure

# =============================================================================
# Resource Group
# =============================================================================

output "resource_group_name" {
  description = "Name of the resource group"
  value       = azurerm_resource_group.ml.name
}

output "resource_group_id" {
  description = "ID of the resource group"
  value       = azurerm_resource_group.ml.id
}

# =============================================================================
# ML Workspace
# =============================================================================

output "ml_workspace_name" {
  description = "Name of the Azure ML workspace"
  value       = azurerm_machine_learning_workspace.ml.name
}

output "ml_workspace_id" {
  description = "ID of the Azure ML workspace"
  value       = azurerm_machine_learning_workspace.ml.id
}

output "ml_workspace_discovery_url" {
  description = "Discovery URL for the ML workspace"
  value       = azurerm_machine_learning_workspace.ml.discovery_url
}

# =============================================================================
# Compute
# =============================================================================

output "gpu_cluster_name" {
  description = "Name of the GPU compute cluster"
  value       = azurerm_machine_learning_compute_cluster.gpu.name
}

output "gpu_cluster_id" {
  description = "ID of the GPU compute cluster"
  value       = azurerm_machine_learning_compute_cluster.gpu.id
}

output "cpu_cluster_name" {
  description = "Name of the CPU compute cluster (if created)"
  value       = var.create_cpu_cluster ? azurerm_machine_learning_compute_cluster.cpu[0].name : null
}

# =============================================================================
# Storage
# =============================================================================

output "storage_account_name" {
  description = "Name of the storage account"
  value       = azurerm_storage_account.ml.name
}

output "storage_account_id" {
  description = "ID of the storage account"
  value       = azurerm_storage_account.ml.id
}

output "datasets_container_name" {
  description = "Name of the datasets container"
  value       = azurerm_storage_container.datasets.name
}

output "models_container_name" {
  description = "Name of the models container"
  value       = azurerm_storage_container.models.name
}

# =============================================================================
# Key Vault
# =============================================================================

output "key_vault_name" {
  description = "Name of the Key Vault"
  value       = azurerm_key_vault.ml.name
}

output "key_vault_uri" {
  description = "URI of the Key Vault"
  value       = azurerm_key_vault.ml.vault_uri
}

# =============================================================================
# Application Insights
# =============================================================================

output "app_insights_name" {
  description = "Name of Application Insights"
  value       = azurerm_application_insights.ml.name
}

output "app_insights_instrumentation_key" {
  description = "Instrumentation key for Application Insights"
  value       = azurerm_application_insights.ml.instrumentation_key
  sensitive   = true
}

output "app_insights_connection_string" {
  description = "Connection string for Application Insights"
  value       = azurerm_application_insights.ml.connection_string
  sensitive   = true
}

# =============================================================================
# Container Registry
# =============================================================================

output "container_registry_name" {
  description = "Name of the Container Registry (if created)"
  value       = var.create_container_registry ? azurerm_container_registry.ml[0].name : null
}

output "container_registry_login_server" {
  description = "Login server for the Container Registry (if created)"
  value       = var.create_container_registry ? azurerm_container_registry.ml[0].login_server : null
}

# =============================================================================
# CLI Commands (for convenience)
# =============================================================================

output "cli_commands" {
  description = "Useful CLI commands for working with the ML workspace"
  value = {
    connect_workspace = "az ml workspace show --name ${azurerm_machine_learning_workspace.ml.name} --resource-group ${azurerm_resource_group.ml.name}"

    submit_training_job = "az ml job create --file apps/detector/azure-ml/job.yaml --resource-group ${azurerm_resource_group.ml.name} --workspace-name ${azurerm_machine_learning_workspace.ml.name}"

    upload_dataset = "az ml data create --name drone-dataset --path ./data/combined --type uri_folder --resource-group ${azurerm_resource_group.ml.name} --workspace-name ${azurerm_machine_learning_workspace.ml.name}"

    list_jobs = "az ml job list --resource-group ${azurerm_resource_group.ml.name} --workspace-name ${azurerm_machine_learning_workspace.ml.name}"

    stream_job = "az ml job stream --name <JOB_NAME> --resource-group ${azurerm_resource_group.ml.name} --workspace-name ${azurerm_machine_learning_workspace.ml.name}"
  }
}

# =============================================================================
# Cost Estimates
# =============================================================================

output "estimated_costs" {
  description = "Estimated costs for training"
  value = {
    gpu_vm_size         = var.gpu_vm_size
    gpu_hourly_cost     = var.gpu_vm_size == "Standard_NC4as_T4_v3" ? "$0.53/hr" : (var.gpu_vm_size == "Standard_NC6s_v3" ? "$3.06/hr" : "$3.67/hr")
    spot_instances      = var.use_spot_instances ? "Yes (up to 80% discount, may be preempted)" : "No (dedicated)"
    idle_timeout        = "${var.idle_timeout_minutes} minutes"
    mvp_training_cost   = var.gpu_vm_size == "Standard_NC4as_T4_v3" ? "$3-5 (6-10 hours)" : "$10-20"
    full_training_cost  = var.gpu_vm_size == "Standard_NC4as_T4_v3" ? "$10-15 (20-30 hours)" : "$30-50"
  }
}
