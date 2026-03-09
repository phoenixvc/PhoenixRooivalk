/**
 * Sidebar for docs-staging only.
 * Used when the build includes docs-staging as the doc source.
 * Do not merge with the main sidebars.ts (which is for the real docs).
 */

import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

const sidebarsStaging: SidebarsConfig = {
  docsStaging: [
    {
      type: "category",
      label: "Engineering",
      collapsed: false,
      items: [
        "engineering/index",
        {
          type: "category",
          label: "Common modules",
          collapsed: false,
          items: [
            "engineering/common/index",
            "engineering/common/power",
            "engineering/common/networking",
            "engineering/common/actuator",
            "engineering/common/compute",
            "engineering/common/alarms",
            "engineering/common/shared-parts",
            "engineering/common/wiring-safety",
          ],
        },
        {
          type: "category",
          label: "Phase-1",
          collapsed: true,
          items: [
            "engineering/phase1/index",
            "engineering/phase1/buy-now-vs-later",
            "engineering/phase1/avoid-list",
            "engineering/phase1/safety-boundary",
            "engineering/phase1/platform-bom-v1",
            {
              type: "category",
              label: "Products",
              collapsed: true,
              items: [
                "engineering/phase1/products/index",
                "engineering/phase1/products/skywatch-nano",
                "engineering/phase1/products/skywatch-standard",
                "engineering/phase1/products/mesh-demo",
                "engineering/phase1/products/netsnare-lite-turret",
                "engineering/phase1/products/skysnare-handheld-spotter",
                "engineering/phase1/products/response-relay-demo",
              ],
            },
          ],
        },
        {
          type: "category",
          label: "Playbooks",
          collapsed: true,
          items: [
            "engineering/playbooks/index",
            "engineering/playbooks/virtual-turret-poc",
            "engineering/playbooks/component-qualification-checklist",
          ],
        },
        {
          type: "category",
          label: "Decisions",
          collapsed: true,
          items: ["engineering/decisions/placement-common-modules-engineering"],
        },
      ],
    },
    {
      type: "category",
      label: "Technical",
      collapsed: true,
      items: [
        "technical/index",
        {
          type: "category",
          label: "Architecture",
          collapsed: true,
          items: [
            "technical/architecture/index",
            "technical/architecture/application-structure",
            {
              type: "category",
              label: "Diagrams",
              collapsed: true,
              items: [
                "technical/architecture/diagrams/index",
                "technical/architecture/diagrams/system-stack",
                "technical/architecture/diagrams/tracking-actuator-bridge",
              ],
            },
            {
              type: "category",
              label: "Interfaces",
              collapsed: true,
              items: [
                "technical/architecture/interfaces/index",
                "technical/architecture/interfaces/transport-abstraction",
                "technical/architecture/interfaces/vision-to-actuator-contracts",
              ],
            },
            {
              type: "category",
              label: "Products",
              collapsed: true,
              items: [
                "technical/architecture/products/index",
                "technical/architecture/products/c2c-portal-architecture",
              ],
            },
            {
              type: "category",
              label: "ADRs",
              collapsed: true,
              items: [
                "technical/architecture/adr-0202-x402-data-marketplace",
              ],
            },
            "technical/architecture/subsystems/index",
          ],
        },
        {
          type: "category",
          label: "Hardware",
          collapsed: true,
          items: [
            "technical/hardware/index",
            "technical/hardware/board-bringup-and-flashing",
            "technical/hardware/power-budgeting-and-rail-isolation",
            "technical/hardware/prototype-compute-tiers",
            "technical/hardware/servo-selection-and-calibration",
            "technical/hardware/salvage-and-zero-budget-hardware",
          ],
        },
        {
          type: "category",
          label: "Control",
          collapsed: true,
          items: [
            "technical/control/index",
            "technical/control/tracking-control-loop",
            "technical/control/authority-and-safety-controller",
            "technical/control/control-interface-options",
          ],
        },
        "technical/ml/index",
      ],
    },
    {
      type: "category",
      label: "Business",
      collapsed: true,
      items: [
        "business/index",
        {
          type: "category",
          label: "Portfolio",
          collapsed: true,
          items: [
            "business/portfolio/index",
            "business/portfolio/product-list",
            "business/portfolio/product-catalog-source",
          ],
        },
        {
          type: "category",
          label: "PRDs",
          collapsed: true,
          items: [
            "business/prd/index",
            "business/prd/depin-network-strategy",
            "business/prd/data-marketplace-prd",
            "business/prd/partnership-strategy",
            "business/prd/depin-competitive-landscape",
          ],
        },
      ],
    },
    {
      type: "category",
      label: "Operations",
      collapsed: true,
      items: [
        "operations/index",
        {
          type: "category",
          label: "Runbooks",
          collapsed: true,
          items: [
            "operations/runbooks/index",
            "operations/runbooks/prototype-test-procedures",
            "operations/runbooks/field-test-procedures",
          ],
        },
      ],
    },
    {
      type: "category",
      label: "Legal",
      collapsed: true,
      items: [
        "legal/index",
        {
          type: "category",
          label: "Compliance",
          collapsed: true,
          items: [
            "legal/compliance/index",
            "legal/compliance/drone-data-privacy",
            "legal/compliance/data-marketplace-legal",
            "legal/compliance/operator-licensing",
          ],
        },
        "legal/policies/index",
      ],
    },
    {
      type: "category",
      label: "Internal",
      collapsed: true,
      items: [
        "internal/index",
        {
          type: "category",
          label: "Catalog",
          collapsed: true,
          items: [
            "internal/catalog/index",
            "internal/catalog/tier-model",
            "internal/catalog/normalization",
            "internal/catalog/source-of-truth",
            "internal/catalog/export-interop",
            "internal/catalog/changelog-template",
          ],
        },
        {
          type: "category",
          label: "EDR",
          collapsed: true,
          items: [
            "internal/edr/index",
            "internal/edr/edr-template",
            "internal/edr/2025-03-04-transport-abstraction-baseline",
          ],
        },
        {
          type: "category",
          label: "Decisions",
          collapsed: true,
          items: [
            "internal/decisions/conversation-gap-analysis-control-turret",
            "internal/decisions/conversation-gap-analysis-salvage-rc-control-architecture",
            "internal/decisions/conversation-gap-analysis-phase1-bom-evolution",
            "internal/decisions/conversation-gap-analysis-r2000-cart-rc-transport",
            "internal/decisions/lessons-from-rc-drone-and-platform-bom",
            "internal/decisions/catalog-refactor-llm-prompts",
          ],
        },
      ],
    },
  ],
};

export { sidebarsStaging };
