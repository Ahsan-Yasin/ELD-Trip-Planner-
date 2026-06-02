from PIL import Image, ImageDraw, ImageFont
import base64
import io
from typing import List

class ELDLogGenerator:
    """
    Generates a 24-hour ELD grid image matching the FMCSA paper log format.
    
    Grid rows (top to bottom):
      Row 1: Off Duty
      Row 2: Sleeper Berth
      Row 3: Driving
      Row 4: On Duty (Not Driving)
    
    Each row is 1440 pixels wide = 1 pixel per minute.
    """
    
    # Image dimensions
    IMG_WIDTH   = 1440   # 24 hours × 60 minutes
    ROW_HEIGHT  = 40
    HEADER_H    = 80
    FOOTER_H    = 120
    
    ROWS = ["off_duty", "sleeper_berth", "driving", "on_duty_not_driving"]
    ROW_LABELS = ["1. Off Duty", "2. Sleeper Berth", "3. Driving", "4. On Duty\n(not driving)"]
    
    # Colors
    BG          = (255, 255, 255)
    GRID_LINE   = (180, 180, 180)
    HOUR_LINE   = (100, 100, 100)
    BLACK       = (0, 0, 0)
    
    # Status fill colors (solid black line on the active row, white elsewhere)
    STATUS_COLORS = {
        "off_duty":             (50, 50, 50),
        "sleeper_berth":        (80, 80, 200),
        "driving":              (200, 50, 50),
        "on_duty_not_driving":  (50, 180, 50),
    }
    
    LINE_THICKNESS = 3  # pixels for the activity line

    def generate(
        self, 
        activities: List[dict],
        driver_name: str,
        date_str: str,          # "2024-01-15"
        carrier: str = "",
        from_location: str = "",
        to_location: str = "",
        total_miles: float = 0,
        day_number: int = 1,
    ) -> str:
        """
        Returns base64-encoded PNG of the ELD log sheet.
        """
        total_height = self.HEADER_H + (self.ROW_HEIGHT * 4) + 40 + self.FOOTER_H
        img  = Image.new("RGB", (self.IMG_WIDTH + 160, total_height), self.BG)
        draw = ImageDraw.Draw(img)
        
        try:
            # We fallback to load_default if ttf not available
            font_sm = font_med = font_lg = ImageFont.load_default()
        except:
            font_sm = font_med = font_lg = ImageFont.load_default()
        
        # --- HEADER ---
        draw.text((10, 5),  "Drivers Daily Log  (24 hours)", font=font_lg, fill=self.BLACK)
        draw.text((10, 25), f"Date: {date_str}   Day {day_number} of trip", font=font_sm, fill=self.BLACK)
        draw.text((10, 40), f"From: {from_location}", font=font_sm, fill=self.BLACK)
        draw.text((500, 40), f"To: {to_location}", font=font_sm, fill=self.BLACK)
        draw.text((10, 55), f"Carrier: {carrier}   Driver: {driver_name}   Total Miles: {total_miles:.0f}", font=font_sm, fill=self.BLACK)
        
        grid_top = self.HEADER_H
        label_width = 130
        grid_left = label_width
        
        # --- HOUR LABELS (Midnight, 1, 2 ... Noon ... 11, Midnight) ---
        hour_labels = ["M", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11",
                       "N", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "M"]
        for i, lbl in enumerate(hour_labels):
            x = grid_left + int(i * 60)
            draw.text((x - 4, grid_top - 16), lbl, font=font_sm, fill=self.BLACK)
        
        # --- GRID ROWS ---
        for row_idx, (status_key, row_label) in enumerate(zip(self.ROWS, self.ROW_LABELS)):
            y_top    = grid_top + row_idx * self.ROW_HEIGHT
            y_bottom = y_top + self.ROW_HEIGHT
            y_center = y_top + self.ROW_HEIGHT // 2
            
            # Row label on the left
            draw.text((5, y_top + 10), row_label, font=font_sm, fill=self.BLACK)
            
            # Row background
            draw.rectangle([grid_left, y_top, grid_left + 1440, y_bottom], 
                          outline=self.BLACK, fill=(248, 248, 248))
            
            # Hour grid lines (every 60px = 1 hour, tick every 15px = 15 min)
            for minute in range(0, 1441):
                x = grid_left + minute
                if minute % 60 == 0:
                    draw.line([(x, y_top), (x, y_bottom)], fill=(80, 80, 80), width=1)
                elif minute % 15 == 0:
                    draw.line([(x, y_top + self.ROW_HEIGHT//3), 
                               (x, y_bottom - self.ROW_HEIGHT//3)], 
                              fill=self.GRID_LINE, width=1)
            
            # Draw activity lines on this row
            for act in activities:
                if act["status"] != status_key:
                    continue
                
                start_min = int(act["start"] * 60)
                end_min   = int(act["end"]   * 60)
                start_min = max(0, min(1440, start_min))
                end_min   = max(0, min(1440, end_min))
                
                if start_min >= end_min:
                    continue
                
                color = self.STATUS_COLORS[status_key]
                
                # Draw solid horizontal line across this status row for the duration
                draw.line(
                    [(grid_left + start_min, y_center),
                     (grid_left + end_min,   y_center)],
                    fill=color,
                    width=self.LINE_THICKNESS
                )
                # Draw vertical connectors at start and end
                draw.line([(grid_left + start_min, y_top + 5),
                           (grid_left + start_min, y_bottom - 5)],
                          fill=color, width=1)
                draw.line([(grid_left + end_min, y_top + 5),
                           (grid_left + end_min, y_bottom - 5)],
                          fill=color, width=1)
        
        # --- TOTALS COLUMN ---
        totals_x = grid_left + 1445
        draw.text((totals_x, grid_top - 16), "Total\nHrs", font=font_sm, fill=self.BLACK)
        
        for row_idx, status_key in enumerate(self.ROWS):
            y_center = grid_top + row_idx * self.ROW_HEIGHT + self.ROW_HEIGHT // 2
            total_h  = sum(
                act["duration"] for act in activities if act["status"] == status_key
            )
            draw.text((totals_x, y_center - 7), f"{total_h:.1f}", font=font_sm, fill=self.BLACK)
        
        # --- REMARKS SECTION ---
        remarks_y = grid_top + 4 * self.ROW_HEIGHT + 15
        draw.text((10, remarks_y), "Remarks:", font=font_med, fill=self.BLACK)
        
        remark_lines = []
        for act in activities:
            if act["status"] in ("on_duty_not_driving", "off_duty"):
                remark_lines.append(f"  {act['start_str']} – {act['end_str']}: {act['label']}")
        
        for i, line in enumerate(remark_lines[:5]):
            draw.text((10, remarks_y + 18 + i * 15), line, font=font_sm, fill=self.BLACK)
        
        # Convert to base64
        buffer = io.BytesIO()
        img.save(buffer, format="PNG", optimize=True)
        buffer.seek(0)
        return "data:image/png;base64," + base64.b64encode(buffer.getvalue()).decode("utf-8")


def generate_all_logs(hos_days: list, driver_name: str, trip_metadata: dict) -> list:
    """Generate one ELD log per day. Returns list of {day, date, image_b64}"""
    gen  = ELDLogGenerator()
    logs = []
    for day_data in hos_days:
        img_b64 = gen.generate(
            activities     = day_data["activities"],
            driver_name    = driver_name,
            date_str       = day_data.get("date", f"Day {day_data['day']}"),
            carrier        = trip_metadata.get("carrier", "Spotter AI"),
            from_location  = trip_metadata.get("from", ""),
            to_location    = trip_metadata.get("to", ""),
            total_miles    = trip_metadata.get("total_miles", 0),
            day_number     = day_data["day"],
        )
        logs.append({"day": day_data["day"], "image_b64": img_b64})
    return logs
