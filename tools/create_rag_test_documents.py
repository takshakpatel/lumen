"""Create three known-answer files for testing Lumen ingestion and retrieval."""

from pathlib import Path

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.shared import Inches, Pt
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle


OUTPUT_DIR = Path(__file__).resolve().parents[1] / "rag_test_documents"
TITLE = "Project Northstar Operations Brief"
SUBTITLE = "Known answer document for Lumen format testing"
INTRO = (
    "Project Northstar is a fictional customer-support pilot for Harbor and Pine. "
    "Its purpose is to reduce the time customers wait for a first human response."
)
FACTS = [
    ("Pilot launch", "Tuesday, 18 November 2026"),
    ("Project owner", "Mira Shah"),
    ("Operating method", "Indigo protocol"),
    ("Approved budget", "INR 480,000"),
    ("Baseline first response time", "10 hours"),
    ("Target first response time", "7 hours"),
    ("Success threshold", "A 30 percent reduction in first response time"),
]
RISKS = [
    "The first risk is that weekend staffing may be too low during the first month.",
    "The second risk is that the Indigo protocol may be applied inconsistently by new agents.",
]
DECISION = (
    "The operations team will review the pilot after 28 days. If the 7-hour target is met, "
    "Harbor and Pine will extend Project Northstar to its returns-support team."
)


def add_docx() -> None:
    doc = Document()
    section = doc.sections[0]
    section.top_margin = Inches(0.75)
    section.bottom_margin = Inches(0.75)
    section.left_margin = Inches(0.8)
    section.right_margin = Inches(0.8)

    title = doc.add_paragraph(style="Title")
    title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = title.add_run(TITLE)
    run.font.size = Pt(24)

    subtitle = doc.add_paragraph()
    subtitle.alignment = WD_ALIGN_PARAGRAPH.CENTER
    subtitle.add_run(SUBTITLE).italic = True
    doc.add_paragraph(INTRO)

    doc.add_heading("Pilot facts", level=1)
    table = doc.add_table(rows=1, cols=2)
    table.style = "Table Grid"
    header = table.rows[0].cells
    header[0].text = "Item"
    header[1].text = "Details"
    for label, value in FACTS:
        cells = table.add_row().cells
        cells[0].text = label
        cells[1].text = value

    doc.add_heading("Risks", level=1)
    for risk in RISKS:
        doc.add_paragraph(risk, style="List Bullet")

    doc.add_heading("Review decision", level=1)
    doc.add_paragraph(DECISION)
    doc.save(OUTPUT_DIR / "northstar_test.docx")


def add_pdf() -> None:
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(name="NorthstarTitle", parent=styles["Title"], fontSize=22, leading=27, alignment=1))
    styles.add(ParagraphStyle(name="NorthstarSubtitle", parent=styles["Normal"], fontSize=10, leading=14, alignment=1, textColor=colors.HexColor("#4b5563")))
    doc = SimpleDocTemplate(
        str(OUTPUT_DIR / "northstar_test.pdf"),
        pagesize=A4,
        rightMargin=1.8 * cm,
        leftMargin=1.8 * cm,
        topMargin=1.8 * cm,
        bottomMargin=1.8 * cm,
    )
    story = [
        Paragraph(TITLE, styles["NorthstarTitle"]),
        Spacer(1, 8),
        Paragraph(SUBTITLE, styles["NorthstarSubtitle"]),
        Spacer(1, 18),
        Paragraph(INTRO, styles["BodyText"]),
        Spacer(1, 14),
        Paragraph("Pilot facts", styles["Heading1"]),
    ]
    data = [["Item", "Details"], *FACTS]
    table = Table(data, colWidths=[5.2 * cm, 10.0 * cm])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1f4e78")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#b8c4ce")),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("BACKGROUND", (0, 1), (-1, -1), colors.HexColor("#f5f8fa")),
        ("LEFTPADDING", (0, 0), (-1, -1), 7),
        ("RIGHTPADDING", (0, 0), (-1, -1), 7),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.extend([table, Spacer(1, 14), Paragraph("Risks", styles["Heading1"])])
    for risk in RISKS:
        story.append(Paragraph("- " + risk, styles["BodyText"]))
        story.append(Spacer(1, 4))
    story.extend([Spacer(1, 8), Paragraph("Review decision", styles["Heading1"]), Paragraph(DECISION, styles["BodyText"])])
    doc.build(story)


def add_html() -> None:
    rows = "\n".join(f"      <tr><th>{label}</th><td>{value}</td></tr>" for label, value in FACTS)
    risks = "\n".join(f"      <li>{risk}</li>" for risk in RISKS)
    html = f"""<!doctype html>
<html lang=\"en\">
<head>
  <meta charset=\"utf-8\">
  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">
  <title>{TITLE}</title>
</head>
<body>
  <main>
    <h1>{TITLE}</h1>
    <p>{SUBTITLE}</p>
    <p>{INTRO}</p>
    <h2>Pilot facts</h2>
    <table>
      <thead><tr><th>Item</th><th>Details</th></tr></thead>
      <tbody>
{rows}
      </tbody>
    </table>
    <h2>Risks</h2>
    <ul>
{risks}
    </ul>
    <h2>Review decision</h2>
    <p>{DECISION}</p>
  </main>
</body>
</html>
"""
    (OUTPUT_DIR / "northstar_test.html").write_text(html, encoding="utf-8")


def main() -> None:
    OUTPUT_DIR.mkdir(exist_ok=True)
    add_docx()
    add_pdf()
    add_html()
    print(f"Created test files in {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
