# Staging Environment Configuration
# Use this for pre-production validation and parallel experiment runs
#
# NOTE: environment = "staging" (not "stg") is required by the validation
# constraint in variables.tf: contains(["dev", "staging", "prod"], var.environment)
# Azure Bicep uses the short form "stg" in its own parameters, but Terraform
# enforces the long form here. Keep these consistent if variables.tf is updated.

org         = "nl"
environment = "staging"
project     = "rooivalk"

# Location
location       = "eastus"
location_short = "eus"

# Compute - T4 GPU kept for cost efficiency; max_nodes=2 allows parallel
# experiment runs matching prod capacity without the V100 cost uplift.
# Spot instances are enabled: staging can tolerate preemption and spot saves
# ~60-80% vs dedicated on NC4as_T4_v3.
gpu_vm_size          = "Standard_NC4as_T4_v3"  # T4 GPU, ~$0.53/hr dedicated
min_nodes            = 0                        # Scale to zero when idle
max_nodes            = 2                        # Parallel experiments like prod
idle_timeout_minutes = 20                       # Between dev (15) and prod (30)
use_spot_instances   = true                     # Cost saving; interruptions tolerable

# Optional resources
create_container_registry = true   # Required for pre-prod image validation
create_cpu_cluster        = false  # Not needed for staging workloads

# Tags
tags = {
  cost_center = "phoenix-stg"
  owner       = "ml-team"
}
