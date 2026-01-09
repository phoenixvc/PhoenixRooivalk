# Phoenix Rooivalk - Azure ML Training Infrastructure
#
# This Terraform configuration provisions Azure Machine Learning resources
# for training the YOLO drone detection model.
#
# Usage:
#   cd infra/terraform/ml-training
#   terraform init
#   terraform plan -var-file="environments/dev.tfvars"
#   terraform apply -var-file="environments/dev.tfvars"
#
# Resources created:
#   - Resource Group
#   - Azure ML Workspace
#   - Storage Account (for datasets and models)
#   - Key Vault (for secrets)
#   - Application Insights (for monitoring)
#   - Container Registry (for custom environments)
#   - GPU Compute Cluster (for training)

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.85"
    }
    azapi = {
      source  = "azure/azapi"
      version = "~> 1.10"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }

  # Uncomment to use remote backend (recommended for team use)
  # backend "azurerm" {
  #   resource_group_name  = "rg-terraform-state"
  #   storage_account_name = "stterraformstate"
  #   container_name       = "tfstate"
  #   key                  = "ml-training.tfstate"
  # }
}

provider "azurerm" {
  features {
    key_vault {
      purge_soft_delete_on_destroy    = false
      recover_soft_deleted_key_vaults = true
    }
    resource_group {
      prevent_deletion_if_contains_resources = false
    }
  }
}

provider "azapi" {}

# Random suffix for globally unique names
resource "random_string" "suffix" {
  length  = 4
  special = false
  upper   = false
}

locals {
  # Naming convention: {org}-{env}-{project}-{resource}-{region}
  name_prefix = "${var.org}-${var.environment}-${var.project}"
  name_suffix = random_string.suffix.result

  # Common tags
  tags = merge(var.tags, {
    org         = var.org
    environment = var.environment
    project     = var.project
    managed_by  = "terraform"
    repository  = "PhoenixRooivalk"
  })
}

# =============================================================================
# Resource Group
# =============================================================================

resource "azurerm_resource_group" "ml" {
  name     = "rg-${local.name_prefix}-ml-${var.location_short}"
  location = var.location
  tags     = local.tags
}

# =============================================================================
# Storage Account (for ML workspace data)
# =============================================================================

resource "azurerm_storage_account" "ml" {
  name                     = "st${var.org}${var.environment}ml${local.name_suffix}"
  location                 = azurerm_resource_group.ml.location
  resource_group_name      = azurerm_resource_group.ml.name
  account_tier             = "Standard"
  account_replication_type = "LRS"
  account_kind             = "StorageV2"

  # Enable hierarchical namespace for better ML performance
  is_hns_enabled = false

  # Security settings
  min_tls_version                 = "TLS1_2"
  allow_nested_items_to_be_public = false

  blob_properties {
    versioning_enabled = true

    delete_retention_policy {
      days = 7
    }

    container_delete_retention_policy {
      days = 7
    }
  }

  tags = local.tags
}

# Storage container for datasets
resource "azurerm_storage_container" "datasets" {
  name                  = "datasets"
  storage_account_name  = azurerm_storage_account.ml.name
  container_access_type = "private"
}

# Storage container for models
resource "azurerm_storage_container" "models" {
  name                  = "models"
  storage_account_name  = azurerm_storage_account.ml.name
  container_access_type = "private"
}

# =============================================================================
# Key Vault (for secrets)
# =============================================================================

data "azurerm_client_config" "current" {}

resource "azurerm_key_vault" "ml" {
  name                = "kv-${local.name_prefix}-${local.name_suffix}"
  location            = azurerm_resource_group.ml.location
  resource_group_name = azurerm_resource_group.ml.name
  tenant_id           = data.azurerm_client_config.current.tenant_id
  sku_name            = "standard"

  # Security settings (environment-controlled via variables)
  soft_delete_retention_days = 7
  purge_protection_enabled   = var.enable_purge_protection

  # Network access control (restrict in production)
  public_network_access_enabled = var.enable_public_network_access

  network_acls {
    default_action = var.enable_public_network_access ? "Allow" : "Deny"
    bypass         = "AzureServices"
    # In production, add virtual_network_subnet_ids and ip_rules as needed
  }

  # Allow Azure ML to access secrets
  access_policy {
    tenant_id = data.azurerm_client_config.current.tenant_id
    object_id = data.azurerm_client_config.current.object_id

    secret_permissions = [
      "Get", "List", "Set", "Delete", "Purge", "Recover"
    ]
  }

  tags = local.tags
}

# =============================================================================
# Application Insights (for ML monitoring)
# =============================================================================

resource "azurerm_log_analytics_workspace" "ml" {
  name                = "law-${local.name_prefix}-${local.name_suffix}"
  location            = azurerm_resource_group.ml.location
  resource_group_name = azurerm_resource_group.ml.name
  sku                 = "PerGB2018"
  retention_in_days   = 30

  tags = local.tags
}

resource "azurerm_application_insights" "ml" {
  name                = "appi-${local.name_prefix}-${local.name_suffix}"
  location            = azurerm_resource_group.ml.location
  resource_group_name = azurerm_resource_group.ml.name
  workspace_id        = azurerm_log_analytics_workspace.ml.id
  application_type    = "other"

  tags = local.tags
}

# =============================================================================
# Container Registry (for custom ML environments)
# =============================================================================

resource "azurerm_container_registry" "ml" {
  count = var.create_container_registry ? 1 : 0

  name                = "cr${var.org}${var.environment}ml${local.name_suffix}"
  location            = azurerm_resource_group.ml.location
  resource_group_name = azurerm_resource_group.ml.name
  sku                 = "Basic"

  # Admin access disabled by default - use managed identity + RBAC instead
  # Set var.acr_admin_enabled = true only if required for specific integrations
  admin_enabled = var.acr_admin_enabled

  tags = local.tags
}

# =============================================================================
# Azure Machine Learning Workspace
# =============================================================================

resource "azurerm_machine_learning_workspace" "ml" {
  name                = "mlw-${local.name_prefix}-${local.name_suffix}"
  location            = azurerm_resource_group.ml.location
  resource_group_name = azurerm_resource_group.ml.name

  application_insights_id = azurerm_application_insights.ml.id
  key_vault_id            = azurerm_key_vault.ml.id
  storage_account_id      = azurerm_storage_account.ml.id
  container_registry_id   = var.create_container_registry ? azurerm_container_registry.ml[0].id : null

  # Identity for accessing resources
  identity {
    type = "SystemAssigned"
  }

  # Public network access (environment-controlled via variable)
  # Set var.enable_public_network_access = false in prod.tfvars
  public_network_access_enabled = var.enable_public_network_access

  # Friendly name and description
  friendly_name = "Phoenix Rooivalk ML Workspace (${var.environment})"
  description   = "Azure ML workspace for drone detection model training"

  tags = local.tags
}

# =============================================================================
# GPU Compute Cluster
# =============================================================================

resource "azurerm_machine_learning_compute_cluster" "gpu" {
  name                          = var.compute_cluster_name
  location                      = azurerm_resource_group.ml.location
  machine_learning_workspace_id = azurerm_machine_learning_workspace.ml.id

  vm_size  = var.gpu_vm_size
  vm_priority = var.use_spot_instances ? "LowPriority" : "Dedicated"

  scale_settings {
    min_node_count                       = var.min_nodes
    max_node_count                       = var.max_nodes
    scale_down_nodes_after_idle_duration = "PT${var.idle_timeout_minutes}M"
  }

  identity {
    type = "SystemAssigned"
  }

  tags = local.tags
}

# Optional: CPU cluster for data preprocessing
resource "azurerm_machine_learning_compute_cluster" "cpu" {
  count = var.create_cpu_cluster ? 1 : 0

  name                          = "cpu-cluster"
  location                      = azurerm_resource_group.ml.location
  machine_learning_workspace_id = azurerm_machine_learning_workspace.ml.id

  vm_size  = "Standard_DS3_v2"
  vm_priority = "LowPriority"

  scale_settings {
    min_node_count                       = 0
    max_node_count                       = 2
    scale_down_nodes_after_idle_duration = "PT15M"
  }

  identity {
    type = "SystemAssigned"
  }

  tags = local.tags
}

# =============================================================================
# RBAC: Grant ML workspace access to storage
# =============================================================================

resource "azurerm_role_assignment" "ml_storage_blob_contributor" {
  scope                = azurerm_storage_account.ml.id
  role_definition_name = "Storage Blob Data Contributor"
  principal_id         = azurerm_machine_learning_workspace.ml.identity[0].principal_id
}

resource "azurerm_role_assignment" "ml_storage_contributor" {
  scope                = azurerm_storage_account.ml.id
  role_definition_name = "Contributor"
  principal_id         = azurerm_machine_learning_workspace.ml.identity[0].principal_id
}
