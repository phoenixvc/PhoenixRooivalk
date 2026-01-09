# Variables for Azure ML Training Infrastructure

# =============================================================================
# Organization & Environment
# =============================================================================

variable "org" {
  description = "Organization code for naming"
  type        = string
  default     = "nl"

  validation {
    condition     = length(var.org) >= 2 && length(var.org) <= 5
    error_message = "Organization code must be 2-5 characters."
  }
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "dev"

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}

variable "project" {
  description = "Project name for naming"
  type        = string
  default     = "rooivalk"
}

# =============================================================================
# Location
# =============================================================================

variable "location" {
  description = "Azure region for resources"
  type        = string
  default     = "eastus"
}

variable "location_short" {
  description = "Short code for Azure region"
  type        = string
  default     = "eus"
}

# =============================================================================
# Compute Cluster Configuration
# =============================================================================

variable "compute_cluster_name" {
  description = "Name of the GPU compute cluster"
  type        = string
  default     = "gpu-cluster"
}

variable "gpu_vm_size" {
  description = "VM size for GPU cluster. Options: Standard_NC4as_T4_v3 (T4, ~$0.53/hr), Standard_NC6s_v3 (V100, ~$3.06/hr), Standard_NC24ads_A100_v4 (A100, ~$3.67/hr)"
  type        = string
  default     = "Standard_NC4as_T4_v3"

  validation {
    condition = contains([
      "Standard_NC4as_T4_v3",   # NVIDIA T4, cost-effective
      "Standard_NC8as_T4_v3",   # NVIDIA T4 x2
      "Standard_NC6s_v3",       # NVIDIA V100
      "Standard_NC12s_v3",      # NVIDIA V100 x2
      "Standard_NC24ads_A100_v4", # NVIDIA A100
    ], var.gpu_vm_size)
    error_message = "GPU VM size must be a valid NVIDIA GPU SKU."
  }
}

variable "min_nodes" {
  description = "Minimum number of nodes (0 for auto-scale to zero)"
  type        = number
  default     = 0

  validation {
    condition     = var.min_nodes >= 0 && var.min_nodes <= 10
    error_message = "Minimum nodes must be between 0 and 10."
  }
}

variable "max_nodes" {
  description = "Maximum number of nodes"
  type        = number
  default     = 1

  validation {
    condition     = var.max_nodes >= 1 && var.max_nodes <= 10
    error_message = "Maximum nodes must be between 1 and 10."
  }
}

variable "idle_timeout_minutes" {
  description = "Minutes of idle time before scaling down"
  type        = number
  default     = 30

  validation {
    condition     = var.idle_timeout_minutes >= 5 && var.idle_timeout_minutes <= 120
    error_message = "Idle timeout must be between 5 and 120 minutes."
  }
}

variable "use_spot_instances" {
  description = "Use spot/low-priority instances for cost savings (may be preempted)"
  type        = bool
  default     = false
}

# =============================================================================
# Optional Resources
# =============================================================================

variable "create_container_registry" {
  description = "Create Azure Container Registry for custom environments"
  type        = bool
  default     = false
}

variable "create_cpu_cluster" {
  description = "Create CPU cluster for data preprocessing"
  type        = bool
  default     = false
}

# =============================================================================
# Tags
# =============================================================================

variable "tags" {
  description = "Additional tags for resources"
  type        = map(string)
  default     = {}
}

# =============================================================================
# Cost Estimates (for reference)
# =============================================================================
#
# GPU VM Pricing (East US, as of 2024):
# - Standard_NC4as_T4_v3:    ~$0.53/hr (T4 16GB) - RECOMMENDED for MVP
# - Standard_NC8as_T4_v3:    ~$1.06/hr (T4 x2)
# - Standard_NC6s_v3:        ~$3.06/hr (V100 16GB)
# - Standard_NC24ads_A100_v4: ~$3.67/hr (A100 80GB)
#
# Estimated training costs (100 epochs):
# - MVP dataset (T4):     ~$3-5 (6-10 hours)
# - Full dataset (T4):    ~$10-15 (20-30 hours)
# - Full dataset (V100):  ~$15-25 (5-8 hours)
# =============================================================================
