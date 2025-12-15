"""
Reusable PDF Components

Building blocks for creating professional PDF documents.
"""

from datetime import datetime
from typing import List, Tuple, Optional, Union, Dict, Any

from reportlab.lib.units import inch, cm
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.platypus import (
    Paragraph, Spacer, Table, TableStyle, PageBreak,
    KeepTogether, HRFlowable, Flowable
)

from .styles import Colors, PhoenixStyles


class CoverPage:
    """
    Generate a professional cover page.

    Usage:
        cover = CoverPage(
            title="CUAS Sandbox 2026",
            subtitle="Supporting Documentation",
            company="Phoenix Rooivalk Inc.",
            status="draft",
        )
        elements = cover.build(styles)
    """

    def __init__(
        self,
        title: str,
        subtitle: Optional[str] = None,
        company: str = "Phoenix Rooivalk Inc.",
        status: str = "draft",
        version: str = "1.0",
        date: Optional[str] = None,
        document_type: str = "Technical Document",
        classification: str = "CONFIDENTIAL - Business Sensitive",
        metrics: Optional[List[Tuple[str, str]]] = None,
    ):
        self.title = title
        self.subtitle = subtitle
        self.company = company
        self.status = status.upper()
        self.version = version
        self.date = date or datetime.now().strftime('%B %d, %Y')
        self.document_type = document_type
        self.classification = classification
        self.metrics = metrics or []

    def build(self, styles: PhoenixStyles) -> List[Flowable]:
        """Build cover page elements."""
        elements = []

        # Top spacing
        elements.append(Spacer(1, 1.5 * inch))

        # Company name
        elements.append(Paragraph(self.company, styles.cover_company))
        elements.append(Spacer(1, 0.5 * inch))

        # Main title
        elements.append(Paragraph(self.title, styles.cover_title))

        # Subtitle
        if self.subtitle:
            elements.append(Paragraph(self.subtitle, styles.cover_subtitle))

        elements.append(Spacer(1, 0.5 * inch))

        # Status badge
        status_colors = {
            'DRAFT': (Colors.WARNING_LIGHT, Colors.WARNING_DARK),
            'FINAL': (Colors.SUCCESS_LIGHT, Colors.SUCCESS_DARK),
            'SUBMITTED': (Colors.INFO_LIGHT, Colors.INFO_DARK),
        }
        bg, fg = status_colors.get(self.status, (Colors.SLATE_200, Colors.SLATE_700))

        status_table = Table([[self.status]], colWidths=[1.5 * inch])
        status_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), bg),
            ('TEXTCOLOR', (0, 0), (-1, -1), fg),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('BOX', (0, 0), (-1, -1), 1, fg),
        ]))
        elements.append(status_table)

        elements.append(Spacer(1, 0.6 * inch))

        # Key metrics (if provided)
        if self.metrics:
            elements.extend(MetricsRow(self.metrics).build(styles))
            elements.append(Spacer(1, 0.4 * inch))

        # Document info table
        info_data = [
            ['Document Type:', self.document_type],
            ['Version:', self.version],
            ['Date:', self.date],
            ['Classification:', self.classification],
        ]

        info_table = Table(info_data, colWidths=[1.8 * inch, 3.5 * inch])
        info_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
            ('ALIGN', (1, 0), (1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('TEXTCOLOR', (0, 0), (-1, -1), Colors.SLATE_600),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ]))
        elements.append(info_table)

        elements.append(Spacer(1, 0.8 * inch))

        # Confidential notice
        elements.append(Paragraph(self.classification, styles.confidential))
        elements.append(Paragraph(
            f"&copy; {datetime.now().year} {self.company}. All rights reserved.",
            styles.footer
        ))

        elements.append(PageBreak())
        return elements


class SectionHeader:
    """
    Create a section header with optional numbering and accent line.

    Usage:
        header = SectionHeader("Executive Summary", number="1")
        elements = header.build(styles)
    """

    def __init__(
        self,
        text: str,
        number: Optional[str] = None,
        level: int = 1,
        accent_line: bool = False,
    ):
        self.text = text
        self.number = number
        self.level = level
        self.accent_line = accent_line

    def build(self, styles: PhoenixStyles) -> List[Flowable]:
        """Build header elements."""
        elements = []

        # Choose style based on level
        style_map = {1: 'section', 2: 'subsection', 3: 'subsubsection'}
        style = styles.get(style_map.get(self.level, 'section'))

        # Build text with optional number
        text = f"{self.number}. {self.text}" if self.number else self.text

        if self.accent_line and self.level == 1:
            # Add accent line for main sections
            elements.append(HRFlowable(
                width="100%",
                thickness=2,
                color=Colors.ORANGE,
                spaceBefore=16,
                spaceAfter=4,
            ))

        elements.append(Paragraph(text, style))
        return elements


class MetricsRow:
    """
    Display key metrics in a horizontal row.

    Usage:
        metrics = MetricsRow([
            ("<50ms", "Detection Latency"),
            ("99.7%", "Accuracy"),
            ("TRL 6", "Readiness"),
        ])
        elements = metrics.build(styles)
    """

    def __init__(
        self,
        metrics: List[Tuple[str, str]],
        columns: Optional[int] = None,
    ):
        self.metrics = metrics
        self.columns = columns or len(metrics)

    def build(self, styles: PhoenixStyles) -> List[Flowable]:
        """Build metrics row."""
        elements = []

        # Build metric cells
        row_values = []
        row_labels = []

        for value, label in self.metrics:
            row_values.append(Paragraph(f"<b>{value}</b>", styles.metric_value))
            row_labels.append(Paragraph(label, styles.metric_label))

        data = [row_values, row_labels]
        col_width = 6 * inch / len(self.metrics)

        table = Table(data, colWidths=[col_width] * len(self.metrics))
        table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('BOX', (0, 0), (-1, -1), 1, Colors.SLATE_200),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, Colors.SLATE_200),
        ]))

        elements.append(table)
        return elements


class DataTable:
    """
    Create a styled data table.

    Usage:
        table = DataTable(
            headers=["Component", "TRL", "Status"],
            rows=[
                ["Sensor Fusion", "6", "Validated"],
                ["AI Processing", "5", "Complete"],
            ],
            col_widths=[2*inch, 0.8*inch, 1.5*inch],
        )
        elements = table.build(styles)
    """

    def __init__(
        self,
        headers: List[str],
        rows: List[List[str]],
        col_widths: Optional[List[float]] = None,
        header_bg: Any = None,
        stripe_rows: bool = True,
        center_columns: Optional[List[int]] = None,
    ):
        self.headers = headers
        self.rows = rows
        self.col_widths = col_widths
        self.header_bg = header_bg or Colors.ORANGE_DARK
        self.stripe_rows = stripe_rows
        self.center_columns = center_columns or []

    def build(self, styles: PhoenixStyles) -> List[Flowable]:
        """Build table elements."""
        elements = []

        # Combine headers and rows
        data = [self.headers] + self.rows

        # Calculate column widths if not provided
        if not self.col_widths:
            total_width = 6 * inch
            self.col_widths = [total_width / len(self.headers)] * len(self.headers)

        table = Table(data, colWidths=self.col_widths)

        # Build table style
        style_commands = [
            # Header styling
            ('BACKGROUND', (0, 0), (-1, 0), self.header_bg),
            ('TEXTCOLOR', (0, 0), (-1, 0), Colors.WHITE),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 9),
            ('ALIGN', (0, 0), (-1, 0), 'CENTER'),

            # Body styling
            ('FONTSIZE', (0, 1), (-1, -1), 9),
            ('TEXTCOLOR', (0, 1), (-1, -1), Colors.DARK_SLATE),

            # Grid
            ('GRID', (0, 0), (-1, -1), 0.5, Colors.SLATE_400),
            ('BOX', (0, 0), (-1, -1), 1, Colors.DARK_SLATE),

            # Padding
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
            ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ]

        # Center specified columns
        for col in self.center_columns:
            style_commands.append(('ALIGN', (col, 1), (col, -1), 'CENTER'))

        # Add row striping
        if self.stripe_rows:
            for i in range(1, len(data), 2):
                style_commands.append(('BACKGROUND', (0, i), (-1, i), Colors.SLATE_100))

        table.setStyle(TableStyle(style_commands))
        elements.append(table)
        return elements


class Callout:
    """
    Create a highlighted callout box.

    Usage:
        callout = Callout(
            title="Key Insight",
            content="Our system is 10-150x faster than competitors.",
            variant="info",
        )
        elements = callout.build(styles)
    """

    VARIANTS = {
        'default': (Colors.ORANGE_LIGHT, Colors.ORANGE, Colors.DARK_SLATE),
        'info': (Colors.INFO_LIGHT, Colors.INFO, Colors.INFO_DARK),
        'success': (Colors.SUCCESS_LIGHT, Colors.SUCCESS, Colors.SUCCESS_DARK),
        'warning': (Colors.WARNING_LIGHT, Colors.WARNING, Colors.WARNING_DARK),
        'error': (Colors.ERROR_LIGHT, Colors.ERROR, Colors.ERROR_DARK),
    }

    def __init__(
        self,
        content: str,
        title: Optional[str] = None,
        variant: str = 'default',
    ):
        self.content = content
        self.title = title
        self.variant = variant

    def build(self, styles: PhoenixStyles) -> List[Flowable]:
        """Build callout box."""
        elements = []

        bg, border, text = self.VARIANTS.get(self.variant, self.VARIANTS['default'])

        # Build content
        full_content = ""
        if self.title:
            full_content = f"<b>{self.title}</b><br/><br/>"
        full_content += self.content

        callout_para = Paragraph(full_content, styles.callout)

        table = Table([[callout_para]], colWidths=[6 * inch])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), bg),
            ('BOX', (0, 0), (-1, -1), 2, border),
            ('LEFTPADDING', (0, 0), (-1, -1), 16),
            ('RIGHTPADDING', (0, 0), (-1, -1), 16),
            ('TOPPADDING', (0, 0), (-1, -1), 12),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ]))

        elements.append(table)
        elements.append(Spacer(1, 0.2 * inch))
        return elements


class BulletList:
    """
    Create a bullet point list.

    Usage:
        bullets = BulletList([
            "First point with <b>bold</b> text",
            "Second point",
            "Third point",
        ])
        elements = bullets.build(styles)
    """

    def __init__(
        self,
        items: List[str],
        bullet_char: str = "\u2022",
        nested: bool = False,
    ):
        self.items = items
        self.bullet_char = bullet_char
        self.nested = nested

    def build(self, styles: PhoenixStyles) -> List[Flowable]:
        """Build bullet list."""
        elements = []

        for item in self.items:
            text = f"{self.bullet_char} {item}"
            style = styles.bullet
            if self.nested:
                # Increase indent for nested items
                style = styles.bullet.clone(
                    'NestedBullet',
                    leftIndent=40,
                    bulletIndent=28,
                )
            elements.append(Paragraph(text, style))

        elements.append(Spacer(1, 0.1 * inch))
        return elements


class KeyValueTable:
    """
    Create a simple key-value display table (no headers).

    Usage:
        kv = KeyValueTable([
            ("Contact:", "Jurie Smit"),
            ("Email:", "jurie@phoenixrooivalk.com"),
        ])
        elements = kv.build(styles)
    """

    def __init__(
        self,
        items: List[Tuple[str, str]],
        key_width: float = 2 * inch,
        value_width: float = 4 * inch,
    ):
        self.items = items
        self.key_width = key_width
        self.value_width = value_width

    def build(self, styles: PhoenixStyles) -> List[Flowable]:
        """Build key-value table."""
        elements = []

        table = Table(self.items, colWidths=[self.key_width, self.value_width])
        table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('TEXTCOLOR', (0, 0), (-1, -1), Colors.SLATE_600),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ]))

        elements.append(table)
        return elements
