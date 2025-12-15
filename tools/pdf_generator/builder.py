"""
Document Builder

Main class for constructing PDF documents using components.
"""

from datetime import datetime
from typing import List, Callable, Optional

from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Spacer, PageBreak, Flowable

from .styles import Colors, PhoenixStyles


class DocumentBuilder:
    """
    Build professional PDF documents.

    Usage:
        builder = DocumentBuilder("output.pdf", title="My Document")
        builder.add_cover(...)
        builder.add_section("Introduction", [...])
        builder.build()
    """

    def __init__(
        self,
        output_path: str,
        title: str = "Document",
        pagesize: tuple = letter,
        margins: Optional[dict] = None,
        show_header: bool = True,
        show_footer: bool = True,
        company: str = "Phoenix Rooivalk Inc.",
    ):
        self.output_path = output_path
        self.title = title
        self.pagesize = pagesize
        self.margins = margins or {
            'left': 0.75 * inch,
            'right': 0.75 * inch,
            'top': 1 * inch,
            'bottom': 0.75 * inch,
        }
        self.show_header = show_header
        self.show_footer = show_footer
        self.company = company

        self.styles = PhoenixStyles()
        self.elements: List[Flowable] = []
        self._cover_added = False

    def add(self, *items: Flowable) -> 'DocumentBuilder':
        """Add flowable elements to the document."""
        for item in items:
            if hasattr(item, 'build'):
                # It's a component - build it
                self.elements.extend(item.build(self.styles))
            else:
                # It's a raw flowable
                self.elements.append(item)
        return self

    def add_paragraph(self, text: str, style: str = 'body') -> 'DocumentBuilder':
        """Add a paragraph with the specified style."""
        from reportlab.platypus import Paragraph
        para_style = self.styles.get(style, self.styles.body)
        self.elements.append(Paragraph(text, para_style))
        return self

    def add_spacer(self, height: float = 0.2) -> 'DocumentBuilder':
        """Add vertical space (in inches)."""
        self.elements.append(Spacer(1, height * inch))
        return self

    def add_page_break(self) -> 'DocumentBuilder':
        """Add a page break."""
        self.elements.append(PageBreak())
        return self

    def add_cover(self, cover) -> 'DocumentBuilder':
        """Add a cover page (should be first)."""
        self._cover_added = True
        self.elements.extend(cover.build(self.styles))
        return self

    def _header_footer(self, canvas, doc):
        """Add header and footer to each page."""
        canvas.saveState()

        # Header
        if self.show_header:
            # Orange accent line
            canvas.setStrokeColor(Colors.ORANGE)
            canvas.setLineWidth(2)
            canvas.line(
                self.margins['left'],
                self.pagesize[1] - 0.5 * inch,
                self.pagesize[0] - self.margins['right'],
                self.pagesize[1] - 0.5 * inch,
            )

            # Company name (left)
            canvas.setFont('Helvetica-Bold', 9)
            canvas.setFillColor(Colors.DARK_SLATE)
            canvas.drawString(
                self.margins['left'],
                self.pagesize[1] - 0.4 * inch,
                self.company,
            )

            # Document title (right)
            canvas.setFont('Helvetica', 9)
            canvas.setFillColor(Colors.SLATE_600)
            canvas.drawRightString(
                self.pagesize[0] - self.margins['right'],
                self.pagesize[1] - 0.4 * inch,
                self.title,
            )

        # Footer
        if self.show_footer:
            # Gray line
            canvas.setStrokeColor(Colors.SLATE_200)
            canvas.setLineWidth(1)
            canvas.line(
                self.margins['left'],
                0.55 * inch,
                self.pagesize[0] - self.margins['right'],
                0.55 * inch,
            )

            # Confidential (left)
            canvas.setFont('Helvetica', 8)
            canvas.setFillColor(Colors.SLATE_400)
            canvas.drawString(
                self.margins['left'],
                0.35 * inch,
                "CONFIDENTIAL - Business Sensitive",
            )

            # Page number (center)
            page_text = f"Page {doc.page}"
            canvas.drawCentredString(
                self.pagesize[0] / 2,
                0.35 * inch,
                page_text,
            )

            # Date (right)
            canvas.drawRightString(
                self.pagesize[0] - self.margins['right'],
                0.35 * inch,
                datetime.now().strftime('%Y-%m-%d'),
            )

        canvas.restoreState()

    def _cover_template(self, canvas, doc):
        """Template for cover page (no header/footer)."""
        pass

    def build(self) -> str:
        """Build and save the PDF document."""
        doc = SimpleDocTemplate(
            self.output_path,
            pagesize=self.pagesize,
            rightMargin=self.margins['right'],
            leftMargin=self.margins['left'],
            topMargin=self.margins['top'],
            bottomMargin=self.margins['bottom'],
        )

        # Determine page templates
        if self._cover_added:
            doc.build(
                self.elements,
                onFirstPage=self._cover_template,
                onLaterPages=self._header_footer,
            )
        else:
            doc.build(
                self.elements,
                onFirstPage=self._header_footer,
                onLaterPages=self._header_footer,
            )

        print(f"PDF generated: {self.output_path}")
        return self.output_path
