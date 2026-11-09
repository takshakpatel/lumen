import io
import os
from pathlib import Path
import matplotlib.pyplot as plt
import numpy as np
import pymupdf as fitz
from PIL import Image, ImageDraw, ImageFont

OUT_PATH = Path("e:/Project/sample_documents/Project_Apex_Autonomous_Logistics.pdf")
OUT_PATH.parent.mkdir(parents=True, exist_ok=True)


def create_chart_1_financials() -> bytes:
    """Quarterly Capex vs Opex stacked bar chart."""
    fig, ax = plt.subplots(figsize=(6.5, 3.2), dpi=180)
    quarters = ["Q1 26", "Q2 26", "Q3 26", "Q4 26", "Q1 27", "Q2 27"]
    capex = [6.2, 9.4, 11.5, 8.8, 6.1, 5.0]
    opex = [1.8, 2.5, 3.2, 3.8, 4.2, 4.5]

    x = np.arange(len(quarters))
    width = 0.55

    bars1 = ax.bar(x, capex, width, label="Capex ($M)", color="#2563eb", edgecolor="#1d4ed8")
    bars2 = ax.bar(x, opex, width, bottom=capex, label="Opex ($M)", color="#10b981", edgecolor="#059669")

    ax.set_title("Project Apex: Quarterly Capital vs Operating Expenditure (2026-2027)", fontsize=11, fontweight="bold", pad=10)
    ax.set_ylabel("Expenditure ($ Millions USD)", fontsize=9)
    ax.set_xticks(x)
    ax.set_xticklabels(quarters, fontsize=9)
    ax.set_ylim(0, 18)
    ax.grid(axis="y", linestyle="--", alpha=0.4)
    ax.legend(frameon=True, facecolor="#f8fafc", loc="upper right")

    # Add data values on top of bars
    for i, (c, o) in enumerate(zip(capex, opex)):
        tot = c + o
        ax.text(i, tot + 0.35, f"${tot:.1f}M", ha="center", va="bottom", fontsize=8, fontweight="semibold", color="#1e293b")

    plt.tight_layout()
    buf = io.BytesIO()
    plt.savefig(buf, format="png", bbox_inches="tight")
    plt.close()
    return buf.getvalue()


def create_chart_2_telemetry() -> bytes:
    """Payload vs Range & Power curve dual-axis plot."""
    fig, ax1 = plt.subplots(figsize=(6.5, 3.2), dpi=180)

    payloads = np.array([1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0])
    range_km = np.array([54.0, 49.5, 45.0, 40.2, 35.5, 31.0, 27.2, 23.8, 20.5, 17.8])
    power_watts = np.array([620, 710, 820, 950, 1100, 1280, 1470, 1690, 1920, 2180])

    color_range = "#0284c7"
    ax1.set_xlabel("Payload Weight (kg)", fontsize=9, fontweight="semibold")
    ax1.set_ylabel("Operational Flight Range (km)", color=color_range, fontsize=9, fontweight="semibold")
    l1 = ax1.plot(payloads, range_km, color=color_range, marker="o", linewidth=2.2, label="Flight Range (km)")
    ax1.tick_params(axis="y", labelcolor=color_range)
    ax1.grid(True, linestyle=":", alpha=0.5)
    ax1.set_ylim(10, 60)

    ax2 = ax1.twinx()
    color_power = "#e11d48"
    ax2.set_ylabel("Power Consumption (Watts)", color=color_power, fontsize=9, fontweight="semibold")
    l2 = ax2.plot(payloads, power_watts, color=color_power, marker="s", linestyle="--", linewidth=2.0, label="Power Draw (W)")
    ax2.tick_params(axis="y", labelcolor=color_power)
    ax2.set_ylim(400, 2500)

    lines = l1 + l2
    labels = [l.get_label() for l in lines]
    ax1.legend(lines, labels, loc="upper right", frameon=True, facecolor="#f8fafc", fontsize=8)
    plt.title("Helios-4 Propulsion: Payload Degradation vs Range & Battery Draw", fontsize=11, fontweight="bold", pad=10)

    plt.tight_layout()
    buf = io.BytesIO()
    plt.savefig(buf, format="png", bbox_inches="tight")
    plt.close()
    return buf.getvalue()


def create_diagram_architecture() -> bytes:
    """Create a high-resolution workflow diagram image."""
    img = Image.new("RGB", (700, 240), color="#f8fafc")
    draw = ImageDraw.Draw(img)

    # Box styles
    boxes = [
        {"x": 30, "y": 70, "w": 130, "h": 90, "title": "Central Dispatch", "sub": "Kubernetes Cluster\nDynamic Routing"},
        {"x": 200, "y": 70, "w": 130, "h": 90, "title": "5G Edge Relay", "sub": "Ultra-Low Latency\nTelemetry Broker"},
        {"x": 370, "y": 70, "w": 140, "h": 90, "title": "Apex Drone Core", "sub": "Zephyr-7 SLAM\nDual Flight-Control"},
        {"x": 550, "y": 70, "w": 120, "h": 90, "title": "Smart Pods", "sub": "Automated Landing\nBattery Swap Hub"},
    ]

    for b in boxes:
        draw.rounded_rectangle([b["x"], b["y"], b["x"] + b["w"], b["y"] + b["h"]], radius=8, fill="#ffffff", outline="#3b82f6", width=2)
        draw.text((b["x"] + 10, b["y"] + 12), b["title"], fill="#0f172a", font_size=13)
        draw.text((b["x"] + 10, b["y"] + 38), b["sub"], fill="#475569", font_size=10)

    # Draw arrows
    for i in range(len(boxes) - 1):
        x1 = boxes[i]["x"] + boxes[i]["w"]
        x2 = boxes[i + 1]["x"]
        y = 115
        draw.line([(x1 + 4, y), (x2 - 8, y)], fill="#2563eb", width=3)
        draw.polygon([(x2 - 2, y), (x2 - 10, y - 5), (x2 - 10, y + 5)], fill="#2563eb")

    draw.text((30, 20), "Figure 1: Project Apex End-to-End Autonomous Control Pipeline", fill="#1e293b", font_size=14)

    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def draw_table_on_page(page, start_x, start_y, col_widths, headers, rows):
    """Draw a clean, grid-bordered table that PyMuPDF find_tables recognizes."""
    total_w = sum(col_widths)
    row_h = 24
    num_rows = len(rows) + 1
    total_h = row_h * num_rows

    # Outer border
    rect = fitz.Rect(start_x, start_y, start_x + total_w, start_y + total_h)
    page.draw_rect(rect, color=(0.3, 0.4, 0.5), width=1)

    # Horizontal row lines
    for i in range(1, num_rows):
        y = start_y + i * row_h
        page.draw_line(fitz.Point(start_x, y), fitz.Point(start_x + total_w, y), color=(0.4, 0.5, 0.6), width=0.8)

    # Vertical column lines
    curr_x = start_x
    for w in col_widths[:-1]:
        curr_x += w
        page.draw_line(fitz.Point(curr_x, start_y), fitz.Point(curr_x, start_y + total_h), color=(0.4, 0.5, 0.6), width=0.8)

    # Insert headers
    curr_x = start_x
    for i, h in enumerate(headers):
        page.insert_text(fitz.Point(curr_x + 6, start_y + 16), h, fontsize=9, fontname="helv", color=(0.05, 0.1, 0.2))
        curr_x += col_widths[i]

    # Insert data rows
    for r_idx, row in enumerate(rows):
        curr_y = start_y + (r_idx + 1) * row_h + 16
        curr_x = start_x
        for c_idx, cell in enumerate(row):
            page.insert_text(fitz.Point(curr_x + 6, curr_y), str(cell), fontsize=8.5, fontname="helv", color=(0.1, 0.15, 0.25))
            curr_x += col_widths[c_idx]

    return start_y + total_h + 15


def build_pdf():
    doc = fitz.open()

    # ─────────────────────────────────────────────────────────────
    # PAGE 1: Executive Overview, Architecture & Operational Targets
    # ─────────────────────────────────────────────────────────────
    p1 = doc.new_page(width=612, height=792)

    # Top brand bar
    p1.draw_rect(fitz.Rect(50, 40, 562, 44), fill=(0.15, 0.35, 0.8), color=None)
    p1.insert_text(fitz.Point(50, 68), "SkyFleet Dynamics — Internal Operations & Investment Brief", fontsize=9, color=(0.4, 0.45, 0.5))
    p1.insert_text(fitz.Point(50, 95), "Project Apex: Autonomous Logistics Prospectus", fontsize=18, fontname="helv", color=(0.05, 0.1, 0.2))
    p1.insert_text(fitz.Point(50, 114), "Next-Generation Urban Drone Delivery Network & Operations Framework", fontsize=10, color=(0.3, 0.35, 0.4))

    intro_text = (
        "Project Apex is SkyFleet Dynamics' flagship commercial autonomous logistics initiative. "
        "The project is engineered to deploy a commercial fleet of 250 electric autonomous quadcopters "
        "across three metropolitan pilot corridors: Austin, Denver, and Seattle. Operating under the "
        "proprietary Zephyr-7 autonomous guidance protocol, Project Apex reduces urban parcel transit "
        "latency from an industry average of 48 minutes down to a verified target of 14 minutes. "
        "The initiative is directed by Program Owner Elena Vance, with avionics led by Dr. Marcus Brody."
    )
    p1.insert_textbox(fitz.Rect(50, 130, 562, 195), intro_text, fontsize=9.5, fontname="helv", color=(0.15, 0.2, 0.25), lineheight=1.35)

    # Table 1: Operational Targets
    p1.insert_text(fitz.Point(50, 215), "Table 1: Operational Targets & Fleet Benchmarks", fontsize=11, fontname="helv", color=(0.1, 0.15, 0.3))
    t1_headers = ["Performance Metric", "Baseline Standard", "Target Specification", "Validation Milestone"]
    t1_rows = [
        ["Autonomous Flight Radius", "12.0 km", "35.0 km", "Phase 1 - Month 6"],
        ["Maximum Payload Capacity", "2.5 kg", "8.0 kg", "Phase 2 - Month 9"],
        ["Average Delivery Latency", "48 minutes", "14 minutes", "Phase 1 - Month 3"],
        ["Fleet Operational Availability", "88.5%", "99.4%", "Commercial Launch"],
        ["Acoustic Noise Footprint (50m)", "68.5 dBA", "49.0 dBA", "Phase 1 - Month 6"],
        ["Battery Swap Turnaround Time", "15.0 minutes", "90 seconds", "Automated Pod Beta"],
    ]
    next_y = draw_table_on_page(p1, 50, 225, [145, 115, 125, 127], t1_headers, t1_rows)

    # Insert Architecture Diagram
    diagram_bytes = create_diagram_architecture()
    p1.insert_image(fitz.Rect(50, next_y + 10, 562, next_y + 195), stream=diagram_bytes)
    p1.insert_text(fitz.Point(50, next_y + 212), "Figure 1: High-reliability dispatch-to-drone edge telemetry pipeline.", fontsize=8.5, color=(0.4, 0.45, 0.5))

    # ─────────────────────────────────────────────────────────────
    # PAGE 2: Financial Capital Allocation & Division Budgets
    # ─────────────────────────────────────────────────────────────
    p2 = doc.new_page(width=612, height=792)

    p2.insert_text(fitz.Point(50, 55), "Section 2: Capital Budget Allocation & Multi-Year Financial Plan", fontsize=15, fontname="helv", color=(0.05, 0.1, 0.2))

    financial_narrative = (
        "The overall approved budget for Project Apex is $47.0 Million USD, approved unanimously "
        "by the Board of Directors on January 14, 2026. The capital budget is structured across five "
        "operating divisions, with the largest share directed toward Autonomous AI Navigation ($18.5M) "
        "and Avionics & Airframe Engineering ($14.2M). Program expenditures are projected to peak in "
        "Q3 2026 at $14.7M before stabilizing as the smart pod infrastructure matures into self-sustaining operations."
    )
    p2.insert_textbox(fitz.Rect(50, 70, 562, 130), financial_narrative, fontsize=9.5, fontname="helv", color=(0.15, 0.2, 0.25), lineheight=1.35)

    # Chart 1: Financials
    chart1_bytes = create_chart_1_financials()
    p2.insert_image(fitz.Rect(50, 135, 562, 380), stream=chart1_bytes)
    p2.insert_text(fitz.Point(50, 395), "Figure 2: 2026-2027 Quarterly Capital vs Operating Expenditure (Total: $47.0M).", fontsize=8.5, color=(0.4, 0.45, 0.5))

    # Table 2: Budget Breakdown
    p2.insert_text(fitz.Point(50, 420), "Table 2: Departmental Capital Allocation & Primary Deliverables", fontsize=11, fontname="helv", color=(0.1, 0.15, 0.3))
    t2_headers = ["Division / Department", "Allocated Budget", "Department Lead", "Primary Strategic Deliverable"]
    t2_rows = [
        ["Avionics & Airframe R&D", "$14.2 Million", "Dr. Marcus Brody", "Carbon-composite chassis & Helios-4 motors"],
        ["Autonomous AI & Navigation", "$18.5 Million", "Sarah Chen", "Zephyr-7 LiDAR/Vision SLAM flight computer"],
        ["Regulatory & FAA Part 135", "$4.8 Million", "David O'Reilly", "Beyond Visual Line of Sight (BVLOS) waiver"],
        ["Smart Pod Landing Infrastructure", "$9.5 Million", "Aisha Patel", "60 automated battery-swapping landing pods"],
        ["Total Approved Budget", "$47.0 Million", "Elena Vance (COO)", "Full commercial network deployment across 3 cities"],
    ]
    draw_table_on_page(p2, 50, 432, [145, 95, 110, 162], t2_headers, t2_rows)

    # ─────────────────────────────────────────────────────────────
    # PAGE 3: Propulsion, Telemetry & Payload Degradation
    # ─────────────────────────────────────────────────────────────
    p3 = doc.new_page(width=612, height=792)

    p3.insert_text(fitz.Point(50, 55), "Section 3: Propulsion Benchmarks & Battery Telemetry", fontsize=15, fontname="helv", color=(0.05, 0.1, 0.2))

    telemetry_narrative = (
        "Flight endurance is driven by the proprietary Helios-4 quad-rotor propulsion system and "
        "Silicon-Anode Solid-State battery cells (480 Wh/kg specific energy). As payload increases from "
        "1.0 kg to the maximum 10.0 kg stress ceiling, aerodynamic drag and motor draw increase non-linearly. "
        "Field telemetry indicates an operational sweet spot between 3.0 kg and 6.0 kg, preserving 31-45 km range "
        "while sustaining under 1,300 Watts average power draw."
    )
    p3.insert_textbox(fitz.Rect(50, 70, 562, 130), telemetry_narrative, fontsize=9.5, fontname="helv", color=(0.15, 0.2, 0.25), lineheight=1.35)

    # Chart 2: Telemetry
    chart2_bytes = create_chart_2_telemetry()
    p3.insert_image(fitz.Rect(50, 135, 562, 380), stream=chart2_bytes)
    p3.insert_text(fitz.Point(50, 395), "Figure 3: Empirical payload weight vs flight range and electrical power consumption curve.", fontsize=8.5, color=(0.4, 0.45, 0.5))

    safety_rules = (
        "Battery & Telemetry Safety Protocols:\n"
        "• Geofence Return-to-Base (RTB): Automatic landing sequence triggers if charge drops below 22%.\n"
        "• Thermal Throttling: Rotor speed governed if motor stator temperatures exceed 62°C.\n"
        "• Telemetry Frequency: 5G mmWave primary channel with dual-redundant 915 MHz long-range mesh radio."
    )
    p3.insert_textbox(fitz.Rect(50, 420, 562, 530), safety_rules, fontsize=9.5, fontname="helv", color=(0.15, 0.2, 0.25), lineheight=1.45)

    # ─────────────────────────────────────────────────────────────
    # PAGE 4: Risk Matrix, Regulatory Approvals & Final Recommendation
    # ─────────────────────────────────────────────────────────────
    p4 = doc.new_page(width=612, height=792)

    p4.insert_text(fitz.Point(50, 55), "Section 4: Risk Assessment, Governance & Protocol Sign-Off", fontsize=15, fontname="helv", color=(0.05, 0.1, 0.2))

    # Table 3: Risk Evaluation
    p4.insert_text(fitz.Point(50, 80), "Table 3: Risk Assessment Matrix & Safety Mitigation Protocols", fontsize=11, fontname="helv", color=(0.1, 0.15, 0.3))
    t3_headers = ["Identified Risk Event", "Likelihood", "Severity", "Mandated Mitigation Protocol"]
    t3_rows = [
        ["GNSS / GPS Jamming in Dense Urban Canyons", "Medium", "High", "Multi-constellation GNSS fused with Visual Inertial Odometry (VIO)"],
        ["Severe Wind Gusts (>42 knots) Near Coastlines", "High", "Medium", "Micro-Doppler radar telemetry with automated holding patterns"],
        ["FAA Part 135 Regulatory Waiver Delays", "Low", "Critical", "Redundant optical sense-and-avoid safety suite certification"],
        ["Acoustic Noise Resistance in Residential Zones", "Medium", "Low", "Variable-pitch toroidal silent rotor blades (<50 dBA at 50m)"],
        ["Smart Pod Battery Swap Mechanical Jam", "Low", "Medium", "Dual-actuator robotic arm with manual override safety sensors"],
    ]
    next_y = draw_table_on_page(p4, 50, 92, [145, 65, 65, 237], t3_headers, t3_rows)

    conclusion_text = (
        "Executive Review Decision & Protocol Adoption:\n\n"
        "The Executive Steering Committee has authorized the adoption of the Cobalt Protocol for all flight "
        "operations starting October 1, 2026. A formal 45-day operational review is scheduled for December 15, 2026. "
        "Upon achieving the 14-minute average delivery latency and sustaining zero critical incidents across 10,000 "
        "test sorties, Project Apex will expand commercial services into healthcare specimen transport and cold-chain logistics.\n\n"
        "Approved and Signed by:\n"
        "• Elena Vance, Chief Operating Officer & Program Sponsor\n"
        "• Dr. Marcus Brody, VP of Avionics & Engineering\n"
        "• Sarah Chen, Principal Architect of Autonomous Flight Intelligence"
    )
    p4.insert_textbox(fitz.Rect(50, next_y + 10, 562, 700), conclusion_text, fontsize=9.5, fontname="helv", color=(0.15, 0.2, 0.25), lineheight=1.4)

    # Save PDF
    doc.save(str(OUT_PATH))
    doc.close()
    print(f"Successfully generated complex document at: {OUT_PATH}")


if __name__ == "__main__":
    build_pdf()
