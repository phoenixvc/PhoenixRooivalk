#!/usr/bin/env python3
"""
CUAS Sandbox 2026 - Auxiliary Supporting Document

A professional supporting document for the CUAS application.
Uses the modular pdf_generator library.
"""

import sys
from pathlib import Path
from reportlab.lib.units import inch

# Add parent to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from pdf_generator import (
    DocumentBuilder,
    CoverPage,
    SectionHeader,
    MetricsRow,
    DataTable,
    Callout,
    BulletList,
    KeyValueTable,
)


def generate_cuas_auxiliary(output_path: str) -> str:
    """Generate the CUAS Sandbox 2026 auxiliary document."""

    # Create builder
    doc = DocumentBuilder(
        output_path,
        title="CUAS Sandbox 2026 - Supporting Documentation",
        company="Phoenix Rooivalk Inc.",
    )

    # Cover page with key metrics
    cover = CoverPage(
        title="CUAS Sandbox 2026",
        subtitle="Technical Evidence & Capability Summary",
        company="Phoenix Rooivalk Inc.",
        status="draft",
        version="1.0",
        document_type="Auxiliary Supporting Materials",
        metrics=[
            ("<50ms", "Detection"),
            ("99.7%", "Accuracy"),
            ("TRL 6", "Readiness"),
            ("SAE L4", "Autonomy"),
        ],
    )
    doc.add_cover(cover)

    # Executive Summary
    doc.add(SectionHeader("Executive Summary", number="1"))
    doc.add_paragraph(
        "Phoenix Rooivalk presents an autonomous counter-UAS defense system designed for "
        "the CUAS Sandbox 2026 program. Our solution addresses critical capability gaps "
        "through innovative multi-sensor fusion, edge AI processing, and modular defeat "
        "mechanisms."
    )
    doc.add_spacer(0.15)

    doc.add(SectionHeader("Key Differentiators", level=2))
    doc.add(BulletList([
        "<b>Speed:</b> Sub-200ms end-to-end response (10-150x faster than competitors)",
        "<b>Autonomy:</b> SAE Level 4 in RF-denied, GPS-denied environments",
        "<b>Evidence:</b> Blockchain-anchored chain of custody for legal accountability",
        "<b>Modularity:</b> Adaptable defeat mechanisms for any threat environment",
    ]))

    doc.add(Callout(
        title="Why Phoenix Rooivalk?",
        content="We are the only counter-UAS solution combining sub-200ms response time, "
                "true offline autonomy, and legally defensible evidence generation. Our "
                "modular architecture scales from consumer drone defense to military-grade "
                "installations.",
    ))

    # Technology Readiness
    doc.add_page_break()
    doc.add(SectionHeader("Technology Readiness Assessment", number="2"))
    doc.add_paragraph(
        "Our system components have been developed and validated through systematic "
        "prototyping and testing. The following table summarizes Technology Readiness "
        "Levels for each major subsystem."
    )
    doc.add_spacer(0.15)

    trl_table = DataTable(
        headers=["Component", "TRL", "Evidence", "Status"],
        rows=[
            ["Multi-Sensor Fusion", "6", "Field trials completed", "Validated"],
            ["Optical Detection (ConvNeXt)", "6", "98%+ accuracy validated", "Validated"],
            ["RF Detection", "5", "Integration testing complete", "Complete"],
            ["Radar Track Analysis", "5", "Algorithm validation", "Complete"],
            ["Acoustic Detection", "5", "Field testing in progress", "In Progress"],
            ["Interceptor Drone", "5", "Prototype flight tests", "Complete"],
            ["Edge AI Processing", "6", "Production hardware tested", "Validated"],
            ["Blockchain Evidence", "5", "Protocol on testnet", "Complete"],
        ],
        col_widths=[2 * inch, 0.5 * inch, 2 * inch, 1 * inch],
        center_columns=[1, 3],
    )
    doc.add(trl_table)
    doc.add_spacer(0.2)

    doc.add(SectionHeader("TRL Definitions", level=2))
    doc.add(BulletList([
        "<b>TRL 5:</b> Component validation in relevant environment",
        "<b>TRL 6:</b> System prototype demonstration in relevant environment",
        "<b>TRL 7:</b> System prototype demonstration in operational environment",
    ]))

    # System Architecture
    doc.add_page_break()
    doc.add(SectionHeader("System Architecture", number="3"))
    doc.add_paragraph(
        "The Phoenix Rooivalk system employs a layered architecture designed for "
        "maximum reliability, minimal latency, and operational flexibility."
    )

    doc.add(SectionHeader("Sensor Layer", level=2))
    sensor_table = DataTable(
        headers=["Sensor Type", "Range", "Latency", "Conditions"],
        rows=[
            ["Radar Detection", "5+ km", "<10ms", "All-weather, day/night"],
            ["RF Spectrum Analysis", "3+ km", "<5ms", "Active transmitter required"],
            ["EO/IR Camera", "2+ km", "<20ms", "Visual line of sight"],
            ["Acoustic Array", "500m", "<50ms", "Low ambient noise"],
        ],
        col_widths=[1.6 * inch, 1 * inch, 1 * inch, 2 * inch],
        center_columns=[1, 2],
    )
    doc.add(sensor_table)
    doc.add_spacer(0.2)

    doc.add(SectionHeader("Processing Layer", level=2))
    doc.add_paragraph(
        "The Cognitive Mesh Processor performs multi-sensor fusion using edge AI, "
        "enabling real-time threat assessment without cloud connectivity."
    )
    doc.add(BulletList([
        "Multi-target tracking with Kalman filtering (100+ simultaneous tracks)",
        "Deep learning classification using ConvNeXt (98%+ accuracy)",
        "Threat level assessment with configurable rules of engagement",
        "Engagement coordination for multi-effector response",
    ]))

    doc.add(SectionHeader("Effector Layer", level=2))
    effector_table = DataTable(
        headers=["Effector", "Range", "Method", "Use Case"],
        rows=[
            ["Net Launcher", "50-100m", "Pneumatic capture", "Evidence preservation"],
            ["Interceptor Drone", "500m-2km", "Kinetic defeat", "High-value defense"],
            ["RF Jammer", "500m", "Link disruption", "Communication denial"],
        ],
        col_widths=[1.3 * inch, 1 * inch, 1.4 * inch, 1.8 * inch],
        center_columns=[1],
    )
    doc.add(effector_table)

    # Performance Metrics
    doc.add_page_break()
    doc.add(SectionHeader("Performance Metrics", number="4"))
    doc.add_paragraph(
        "The following metrics have been validated through laboratory testing, "
        "field trials, and prototype demonstrations."
    )

    doc.add(SectionHeader("Response Time Comparison", level=2))
    response_table = DataTable(
        headers=["Metric", "Phoenix Rooivalk", "Industry Average", "Improvement"],
        rows=[
            ["Detection Latency", "<50ms", "500ms-2s", "10-40x"],
            ["Classification Time", "<100ms", "1-5s", "10-50x"],
            ["Track Initiation", "<200ms", "2-10s", "10-50x"],
            ["Engagement Decision", "<500ms", "5-30s", "10-60x"],
            ["End-to-End Response", "<200ms", "5-30s", "25-150x"],
        ],
        col_widths=[1.5 * inch, 1.4 * inch, 1.4 * inch, 1.1 * inch],
        center_columns=[1, 2, 3],
    )
    doc.add(response_table)
    doc.add_spacer(0.25)

    doc.add(SectionHeader("Detection Accuracy", level=2))
    accuracy_table = DataTable(
        headers=["Target Type", "Detection", "Classification", "False Positive"],
        rows=[
            ["Commercial Quadcopter", "99.8%", "98.5%", "<0.1%"],
            ["Fixed-Wing Drone", "99.5%", "97.2%", "<0.2%"],
            ["FPV Racing Drone", "99.2%", "96.8%", "<0.3%"],
            ["Drone Swarm (5+)", "98.5%", "95.1%", "<0.5%"],
            ["Bird Discrimination", "N/A", "99.7%", "<0.1%"],
        ],
        col_widths=[1.6 * inch, 1.1 * inch, 1.3 * inch, 1.2 * inch],
        center_columns=[1, 2, 3],
    )
    doc.add(accuracy_table)

    # Team
    doc.add_page_break()
    doc.add(SectionHeader("Team & Experience", number="5"))
    doc.add_paragraph(
        "Phoenix Rooivalk's founding team brings over 60 years of combined experience "
        "in defense systems, AI/ML, embedded hardware, and enterprise software."
    )
    doc.add_spacer(0.15)

    team_table = DataTable(
        headers=["Name", "Role", "Expertise", "Background"],
        rows=[
            ["Jurie Smit", "CTO", "Edge AI/ML, Architecture", "15+ yrs fintech/SaaS"],
            ["Martyn Redelinghuys", "CEO", "Defense, Business Dev", "20+ yrs energy/defense"],
            ["Pieter La Grange", "Hardware Lead", "Embedded Systems", "15+ yrs medical devices"],
            ["Eben Mare", "CFO", "Finance, Quant Analysis", "15+ yrs investment banking"],
        ],
        col_widths=[1.2 * inch, 0.9 * inch, 1.5 * inch, 1.8 * inch],
    )
    doc.add(team_table)
    doc.add_spacer(0.25)

    doc.add(SectionHeader("Relevant Experience", level=2))
    doc.add(BulletList([
        "<b>Enterprise SaaS:</b> High-availability platforms, millions of transactions daily",
        "<b>Edge AI Systems:</b> Real-time computer vision with sub-millisecond latency",
        "<b>Defense Relationships:</b> SA defense contractors and international suppliers",
        "<b>Certifications:</b> Experience with FDA/CE for safety-critical systems",
    ]))

    # Canadian Partnership
    doc.add_page_break()
    doc.add(SectionHeader("Canadian Partnership Strategy", number="6"))
    doc.add_paragraph(
        "Phoenix Rooivalk is committed to establishing meaningful Canadian content "
        "and partnerships as part of the CUAS Sandbox 2026 program."
    )

    partnership_table = DataTable(
        headers=["Area", "Potential Partners", "Value Creation"],
        rows=[
            ["Manufacturing", "Aerospace suppliers", "Local sensor housing production"],
            ["Testing", "Canadian test ranges", "Live-fire, environmental validation"],
            ["Integration", "Defense primes", "C4ISR integration, platform mounting"],
            ["Research", "Universities", "AI/ML research, student co-ops"],
            ["Supply Chain", "Electronics suppliers", "PCB assembly, cable harnesses"],
        ],
        col_widths=[1.2 * inch, 1.6 * inch, 2.6 * inch],
    )
    doc.add(partnership_table)
    doc.add_spacer(0.25)

    doc.add(SectionHeader("Economic Benefits", level=2))
    doc.add(BulletList([
        "<b>Job Creation:</b> 5-10 Canadian positions within 24 months",
        "<b>Technology Transfer:</b> Edge AI expertise shared with partners",
        "<b>Export Potential:</b> Canadian components for global deployments",
        "<b>Research:</b> Joint R&D with academic institutions",
    ]))

    # Appendix
    doc.add_page_break()
    doc.add(SectionHeader("Appendix: Technical Specifications", number="A"))

    doc.add(SectionHeader("Interceptor Specifications", level=2))
    interceptor_specs = KeyValueTable([
        ("Maximum Speed:", "120 km/h"),
        ("Operational Range:", "2 km"),
        ("Endurance:", "15 min (combat), 25 min (patrol)"),
        ("Payload:", "500g defeat package"),
        ("Launch:", "Pneumatic tube or catapult"),
        ("Navigation:", "GPS + INS + Visual odometry"),
        ("Communication:", "Encrypted mesh (RF-denied capable)"),
    ])
    doc.add(interceptor_specs)
    doc.add_spacer(0.4)

    # Contact
    doc.add(SectionHeader("Contact Information", level=2))
    contact = KeyValueTable([
        ("Primary Contact:", "Jurie Smit, CTO"),
        ("Email:", "jurie@phoenixrooivalk.com"),
        ("Website:", "https://phoenixrooivalk.com"),
        ("Documentation:", "https://docs.phoenixrooivalk.com"),
    ])
    doc.add(contact)

    # Build
    return doc.build()


if __name__ == "__main__":
    import os

    # Default output location
    output_dir = os.environ.get("OUTPUT_DIR", "/tmp")
    output_file = os.path.join(output_dir, "CUAS_Sandbox_2026_Auxiliary.pdf")

    generate_cuas_auxiliary(output_file)
