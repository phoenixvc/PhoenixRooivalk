"""
Phoenix Rooivalk Brand Styles

Centralized color scheme and paragraph styles for consistent branding.
"""

from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY, TA_RIGHT


class Colors:
    """Phoenix Rooivalk brand colors."""

    # Primary brand
    ORANGE = colors.HexColor('#f97316')
    ORANGE_DARK = colors.HexColor('#ea580c')
    ORANGE_LIGHT = colors.HexColor('#fed7aa')
    ORANGE_LIGHTEST = colors.HexColor('#fff7ed')

    # Neutrals
    DARK_SLATE = colors.HexColor('#1e293b')
    SLATE_700 = colors.HexColor('#334155')
    SLATE_600 = colors.HexColor('#475569')
    SLATE_500 = colors.HexColor('#64748b')
    SLATE_400 = colors.HexColor('#94a3b8')
    SLATE_300 = colors.HexColor('#cbd5e1')
    SLATE_200 = colors.HexColor('#e2e8f0')
    SLATE_100 = colors.HexColor('#f1f5f9')
    WHITE = colors.white

    # Status colors
    SUCCESS = colors.HexColor('#22c55e')
    SUCCESS_LIGHT = colors.HexColor('#dcfce7')
    SUCCESS_DARK = colors.HexColor('#166534')

    WARNING = colors.HexColor('#f59e0b')
    WARNING_LIGHT = colors.HexColor('#fef3c7')
    WARNING_DARK = colors.HexColor('#92400e')

    ERROR = colors.HexColor('#ef4444')
    ERROR_LIGHT = colors.HexColor('#fee2e2')
    ERROR_DARK = colors.HexColor('#dc2626')

    INFO = colors.HexColor('#3b82f6')
    INFO_LIGHT = colors.HexColor('#dbeafe')
    INFO_DARK = colors.HexColor('#1e40af')


class PhoenixStyles:
    """
    Centralized paragraph and table styles.

    Usage:
        styles = PhoenixStyles()
        para = Paragraph("Hello", styles.body)
    """

    def __init__(self):
        self._base = getSampleStyleSheet()
        self._custom = {}
        self._build_styles()

    def _build_styles(self):
        """Build all custom styles."""

        # Cover page styles
        self._custom['cover_title'] = ParagraphStyle(
            name='CoverTitle',
            parent=self._base['Title'],
            fontSize=36,
            textColor=Colors.DARK_SLATE,
            spaceAfter=12,
            alignment=TA_CENTER,
            fontName='Helvetica-Bold',
            leading=42,
        )

        self._custom['cover_subtitle'] = ParagraphStyle(
            name='CoverSubtitle',
            parent=self._base['Normal'],
            fontSize=18,
            textColor=Colors.SLATE_600,
            spaceAfter=24,
            alignment=TA_CENTER,
            fontName='Helvetica',
            leading=24,
        )

        self._custom['cover_company'] = ParagraphStyle(
            name='CoverCompany',
            parent=self._base['Normal'],
            fontSize=14,
            textColor=Colors.SLATE_500,
            spaceAfter=8,
            alignment=TA_CENTER,
            fontName='Helvetica',
            textTransform='uppercase',
            letterSpacing=2,
        )

        # Section headers
        self._custom['section'] = ParagraphStyle(
            name='SectionHeader',
            parent=self._base['Heading1'],
            fontSize=18,
            textColor=Colors.ORANGE_DARK,
            spaceBefore=24,
            spaceAfter=12,
            fontName='Helvetica-Bold',
            leading=22,
        )

        self._custom['subsection'] = ParagraphStyle(
            name='SubsectionHeader',
            parent=self._base['Heading2'],
            fontSize=14,
            textColor=Colors.DARK_SLATE,
            spaceBefore=16,
            spaceAfter=8,
            fontName='Helvetica-Bold',
            leading=18,
        )

        self._custom['subsubsection'] = ParagraphStyle(
            name='SubsubsectionHeader',
            parent=self._base['Heading3'],
            fontSize=12,
            textColor=Colors.SLATE_700,
            spaceBefore=12,
            spaceAfter=6,
            fontName='Helvetica-Bold',
            leading=15,
        )

        # Body text
        self._custom['body'] = ParagraphStyle(
            name='Body',
            parent=self._base['Normal'],
            fontSize=10,
            textColor=Colors.DARK_SLATE,
            spaceAfter=8,
            alignment=TA_JUSTIFY,
            leading=14,
        )

        self._custom['body_tight'] = ParagraphStyle(
            name='BodyTight',
            parent=self._base['Normal'],
            fontSize=10,
            textColor=Colors.DARK_SLATE,
            spaceAfter=4,
            alignment=TA_LEFT,
            leading=13,
        )

        self._custom['small'] = ParagraphStyle(
            name='Small',
            parent=self._base['Normal'],
            fontSize=9,
            textColor=Colors.SLATE_600,
            spaceAfter=6,
            leading=12,
        )

        # Metric styles
        self._custom['metric_value'] = ParagraphStyle(
            name='MetricValue',
            parent=self._base['Normal'],
            fontSize=28,
            textColor=Colors.ORANGE,
            alignment=TA_CENTER,
            fontName='Helvetica-Bold',
            spaceAfter=2,
        )

        self._custom['metric_label'] = ParagraphStyle(
            name='MetricLabel',
            parent=self._base['Normal'],
            fontSize=9,
            textColor=Colors.SLATE_600,
            alignment=TA_CENTER,
            spaceAfter=8,
        )

        # Callout/quote
        self._custom['callout'] = ParagraphStyle(
            name='Callout',
            parent=self._base['Normal'],
            fontSize=10,
            textColor=Colors.DARK_SLATE,
            alignment=TA_LEFT,
            leading=14,
            leftIndent=12,
            rightIndent=12,
        )

        # Footer
        self._custom['footer'] = ParagraphStyle(
            name='Footer',
            parent=self._base['Normal'],
            fontSize=8,
            textColor=Colors.SLATE_400,
            alignment=TA_CENTER,
        )

        self._custom['confidential'] = ParagraphStyle(
            name='Confidential',
            parent=self._base['Normal'],
            fontSize=9,
            textColor=Colors.ERROR_DARK,
            alignment=TA_CENTER,
            fontName='Helvetica-Bold',
            spaceAfter=8,
        )

        # Bullet/list
        self._custom['bullet'] = ParagraphStyle(
            name='Bullet',
            parent=self._base['Normal'],
            fontSize=10,
            textColor=Colors.DARK_SLATE,
            spaceAfter=4,
            leftIndent=20,
            bulletIndent=8,
            leading=13,
        )

    def __getattr__(self, name):
        """Get style by attribute name."""
        if name.startswith('_'):
            raise AttributeError(name)
        if name in self._custom:
            return self._custom[name]
        if name in self._base:
            return self._base[name]
        raise AttributeError(f"Style '{name}' not found")

    def get(self, name, default=None):
        """Get style by name with optional default."""
        try:
            return getattr(self, name)
        except AttributeError:
            return default
