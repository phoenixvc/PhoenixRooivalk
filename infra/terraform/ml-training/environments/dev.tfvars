# Development Environment Configuration
# Use this for initial setup and testing

org         = "nl"
environment = "dev"
project     = "rooivalk"

# Location
location       = "eastus"
location_short = "eus"

# Compute - cost-effective for development
gpu_vm_size          = "Standard_NC4as_T4_v3"  # T4 GPU, ~$0.53/hr
min_nodes            = 0                        # Scale to zero when idle
max_nodes            = 1                        # Single node for dev
idle_timeout_minutes = 15                       # Quick scale-down for dev
use_spot_instances   = false                    # Dedicated for reliability

# Optional resources
create_container_registry = false  # Not needed for MVP
create_cpu_cluster        = false  # Not needed for MVP

# Tags
tags = {
  cost_center = "phoenix-dev"
  owner       = "ml-team"
}
