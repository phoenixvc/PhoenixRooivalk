# Production Environment Configuration
# Use this for production training and model deployment

org         = "nl"
environment = "prod"
project     = "rooivalk"

# Location
location       = "eastus"
location_short = "eus"

# Compute - higher performance for production
gpu_vm_size          = "Standard_NC6s_v3"  # V100 GPU, ~$3.06/hr
min_nodes            = 0                    # Scale to zero when idle
max_nodes            = 2                    # Allow parallel experiments
idle_timeout_minutes = 30                   # Longer timeout for production
use_spot_instances   = false                # Dedicated for reliability

# Optional resources
create_container_registry = true   # For custom environments
create_cpu_cluster        = true   # For data preprocessing

# Tags
tags = {
  cost_center = "phoenix-prod"
  owner       = "ml-team"
  criticality = "high"
}
