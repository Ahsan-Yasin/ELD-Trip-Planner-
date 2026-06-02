# ELD Trip Planner — Full System Architecture & Implementation Guide
> Spotter AI | Full Stack Developer Assessment | Built by Ahsan

---

## 🗂️ Table of Contents
1. [Project Overview](#overview)
2. [Repo Name & Structure](#repo)
3. [Tech Stack Decision Log](#stack)
4. [System Architecture Diagram (Text)](#architecture)
5. [Database Schema (MongoDB)](#db)
6. [Backend Deep Dive (Django)](#backend)
7. [HOS Compliance Engine](#hos)
8. [ELD Log Generator](#eld)
9. [Route Engine](#route)
10. [AI Feature: RAG + Live Regulations](#ai)
11. [Frontend Architecture (React + TypeScript)](#frontend)
12. [API Contract (All Endpoints)](#api)
13. [Deployment Strategy](#deploy)
14. [Environment Variables Reference](#env)
15. [Implementation Order (Day-by-Day)](#timeline)
16. [What Will Impress the Recruiter](#impress)

---

## 1. Project Overview <a name="overview"></a>

**What you're building:** A full-stack web app for truck drivers that:
- Takes trip inputs (current location, pickup, dropoff, current cycle hours used)
- Computes the optimal route via a free mapping API
- Calculates FMCSA Hours of Service (HOS) compliance in real time
- Auto-generates filled ELD (Electronic Logging Device) daily log sheets — visual grid, exactly like a paper log — for every day of the trip
- Has an AI assistant (RAG-powered) that answers any FMCSA regulation question using the actual FMCSA HOS guide as its knowledge base

**Assessment constraints:**
- Property-carrying driver, 70hr/8-day cycle
- Fuel stop required every 1,000 miles
- 1 hour allocated for pickup and dropoff each
- No adverse driving conditions assumed

---

## 2. Repo Name & Structure <a name="repo"></a>

### Repo Name
```
eld-trip-planner
```
Why: clean, descriptive, professional. Matches the domain exactly. Recruiters scan GitHub names.

### Monorepo Structure
```
eld-trip-planner/
├── README.md                    ← Public-facing, screenshots, live link, Loom link
├── .gitignore
├── backend/                     ← Django REST API
│   ├── manage.py
│   ├── requirements.txt
│   ├── Procfile                 ← for Render.com deployment
│   ├── runtime.txt              ← python-3.11.x
│   ├── config/
│   │   ├── settings/
│   │   │   ├── base.py
│   │   │   ├── dev.py
│   │   │   └── prod.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   ├── apps/
│   │   ├── trips/               ← Trip model, main orchestration
│   │   ├── compliance/          ← HOS calculator, rule engine
│   │   ├── eld/                 ← Log sheet generator (Pillow)
│   │   ├── routes/              ← OpenRouteService integration
│   │   └── ai_assistant/        ← RAG pipeline (LangChain + ChromaDB)
│   └── tests/
│       ├── test_hos.py
│       ├── test_routes.py
│       └── test_eld.py
│
└── frontend/                    ← React + TypeScript + Vite
    ├── package.json
    ├── vite.config.ts
    ├── tsconfig.json
    ├── vercel.json              ← Vercel routing config
    ├── public/
    │   └── fmcsa_hos_guide.pdf  ← Source doc for RAG
    └── src/
        ├── main.tsx
        ├── App.tsx
        ├── components/
        │   ├── TripForm/
        │   ├── RouteMap/
        │   ├── ELDLogSheet/
        │   ├── ComplianceDashboard/
        │   ├── AIAssistant/
        │   └── ui/              ← shared design system components
        ├── hooks/
        ├── services/
        │   └── api.ts
        ├── store/               ← Zustand global state
        ├── types/
        └── utils/
            └── hosUtils.ts
```

---

## 3. Tech Stack Decision Log <a name="stack"></a>

| Layer | Choice | Why |
|---|---|---|
| Backend Framework | Django 4.2 + DRF | Assessment requirement |
| Database | MongoDB Atlas (via MongoEngine) | Assessment requirement |
| Frontend | React 18 + TypeScript + Vite | Faster DX than CRA, type safety |
| Styling | Tailwind CSS + shadcn/ui | Fast, consistent, pro quality |
| Map API | **Leaflet.js + OpenStreetMap** (free) or **OpenRouteService** | Both free, ORS gives truck routing |
| Geocoding | OpenRouteService Geocoding API (free tier) | Converts address strings to lat/lng |
| Route Calc | OpenRouteService Directions API | Free, supports `driving-hgv` profile |
| ELD Drawing | Pillow (Python) | Draw the 24-hr grid image server-side |
| AI/RAG | LangChain + ChromaDB + OpenAI GPT-3.5 | Proven stack, fast to implement |
| RAG Source | FMCSA HOS Guide PDF (official, public domain) | Authoritative, impresses recruiter |
| State Mgmt | Zustand | Lightweight, no Redux boilerplate |
| Hosting Frontend | Vercel | Assessment requirement |
| Hosting Backend | Render.com (free tier) | Free, connects to GitHub |
| CI | GitHub Actions | Auto-deploys on push |

---

## 4. System Architecture <a name="architecture"></a>

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER BROWSER                             │
│                                                                 │
│   React + TypeScript (Vercel)                                   │
│   ┌──────────┐  ┌──────────┐  ┌───────────┐  ┌─────────────┐  │
│   │TripForm  │  │RouteMap  │  │ELD Log    │  │AI Assistant │  │
│   │(inputs)  │  │(Leaflet) │  │Viewer     │  │(RAG Chat)   │  │
│   └────┬─────┘  └────▲─────┘  └─────▲─────┘  └──────▲──────┘  │
│        │              │              │                │         │
└────────┼──────────────┼──────────────┼────────────────┼─────────┘
         │ POST /trips  │              │                │
         │ /calculate   │              │                │ POST /ai/chat
         ▼              │              │                ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Django REST API (Render.com)                  │
│                                                                 │
│   ┌──────────────────────────────────────────────────────────┐  │
│   │                    TripViewSet                           │  │
│   │   POST /api/trips/calculate/                             │  │
│   │                                                          │  │
│   │   1. Geocode addresses   ─────────────────────────────►  │  │
│   │                                          OpenRouteService │  │
│   │   2. Get route + stops  ◄──────────────────────────────  │  │
│   │                                                          │  │
│   │   3. Run HOS engine (pure Python, no external call)      │  │
│   │                                                          │  │
│   │   4. Generate ELD log images (Pillow)                    │  │
│   │                                                          │  │
│   │   5. Save Trip to MongoDB                                │  │
│   │                                                          │  │
│   │   6. Return JSON response to frontend                    │  │
│   └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│   ┌──────────────────────────────────────────────────────────┐  │
│   │                    AIAssistantView                       │  │
│   │   POST /api/ai/chat/                                     │  │
│   │                                                          │  │
│   │   1. Embed user question                                 │  │
│   │   2. Query ChromaDB for relevant regulation chunks       │  │
│   │   3. Send context + question to GPT-3.5                  │  │
│   │   4. Return grounded answer                              │  │
│   └──────────────────────────────────────────────────────────┘  │
│                                                                  │
└────────────────────────────────────┬────────────────────────────┘
                                     │
                    ┌────────────────┼────────────────┐
                    ▼                ▼                 ▼
             MongoDB Atlas      ChromaDB          OpenAI API
             (Trip data)     (Regulation        (LLM responses)
                              embeddings)
```

---

## 5. Database Schema (MongoDB) <a name="db"></a>

### Collections

#### `trips`
```python
class Trip(Document):
    # Inputs
    current_location    = StringField()       # "Chicago, IL"
    pickup_location     = StringField()
    dropoff_location    = StringField()
    current_cycle_used  = FloatField()        # hours already used in 8-day window

    # Geocoded coordinates
    start_coords        = DictField()         # {lat, lng}
    pickup_coords       = DictField()
    dropoff_coords      = DictField()

    # Route data
    total_distance_miles  = FloatField()
    total_duration_hours  = FloatField()
    route_polyline        = ListField()       # [[lng, lat], ...] for Leaflet
    stops                 = ListField()       # fuel stops + rest stops

    # HOS compliance
    is_compliant          = BooleanField()
    violation_reasons     = ListField()       # e.g., ["Exceeds 70hr cycle limit"]
    remaining_drive_hours = FloatField()
    daily_segments        = ListField()       # per-day breakdown

    # ELD
    eld_logs              = ListField()       # [{day: 1, image_b64: "..."}, ...]

    # Metadata
    created_at            = DateTimeField(default=datetime.utcnow)
    trip_id               = StringField(default=lambda: str(uuid4()))

    meta = {'collection': 'trips', 'indexes': ['trip_id', 'created_at']}
```

#### `chat_sessions`
```python
class ChatSession(Document):
    session_id  = StringField()
    messages    = ListField()    # [{role, content, timestamp}]
    trip_id     = StringField()  # optional, for context-aware answers
    created_at  = DateTimeField(default=datetime.utcnow)
```

---

## 6. Backend Deep Dive <a name="backend"></a>

### Settings split (base/dev/prod)

```python
# config/settings/base.py
INSTALLED_APPS = [
    'rest_framework',
    'corsheaders',
    'apps.trips',
    'apps.compliance',
    'apps.eld',
    'apps.routes',
    'apps.ai_assistant',
]

REST_FRAMEWORK = {
    'DEFAULT_RENDERER_CLASSES': ['rest_framework.renderers.JSONRenderer'],
    'DEFAULT_PARSER_CLASSES': ['rest_framework.parsers.JSONParser'],
}

CORS_ALLOWED_ORIGINS = [
    "https://your-app.vercel.app",
    "http://localhost:5173",
]

# config/settings/prod.py
import dj_database_url
ALLOWED_HOSTS = ['*']
DEBUG = False
```

### MongoDB connection (MongoEngine)
```python
# config/settings/base.py
import mongoengine

def connect_mongo():
    mongoengine.connect(
        db='eld_db',
        host=os.environ.get('MONGODB_URI')
    )

# Call in AppConfig.ready()
```

### Main URL routing
```python
# config/urls.py
urlpatterns = [
    path('api/trips/',    include('apps.trips.urls')),
    path('api/ai/',       include('apps.ai_assistant.urls')),
    path('api/health/',   HealthCheckView.as_view()),
]
```

---

## 7. HOS Compliance Engine (The Heart) <a name="hos"></a>

This is the most important piece. Get this exactly right.

### FMCSA Rules implemented (Property carrier, 70hr/8-day)

| Rule | Value |
|---|---|
| Max driving per day | 11 hours |
| Max on-duty window per day | 14 hours from first on-duty moment |
| Required break | 30 min off-duty after 8 hrs driving |
| Max cycle | 70 hours in any 8-day rolling window |
| 34-hour restart | Resets 70hr cycle (we treat as: if driver has enough hours, no restart needed) |
| Pickup/dropoff time | 1 hour each (on-duty, not driving) |
| Fuel stop time | 30 minutes each (on-duty, not driving) |

### Full HOS Calculator

```python
# apps/compliance/hos_calculator.py

from dataclasses import dataclass, field
from typing import List, Tuple
import math

@dataclass
class DaySegment:
    """Represents one day's duty activity"""
    day_number: int
    start_of_day_cycle_used: float   # hours at start of this day
    driving_start: str               # "06:00" HH:MM
    activities: List[dict]           # ordered list of activities
    total_driving: float
    total_on_duty: float
    is_compliant: bool
    violations: List[str]

class HOSCalculator:
    MAX_DRIVE_DAILY    = 11.0   # hours
    MAX_ON_DUTY_WINDOW = 14.0   # hours (from first on-duty moment)
    MAX_CYCLE          = 70.0   # hours in 8 days
    BREAK_REQUIRED_AFTER = 8.0  # hours of driving before mandatory break
    BREAK_DURATION       = 0.5  # hours (30 min)
    PICKUP_DROPOFF_TIME  = 1.0  # hour each (on-duty, not driving)
    FUEL_STOP_TIME       = 0.5  # hours (30 min)
    FUEL_STOP_INTERVAL   = 1000 # miles

    def __init__(self, current_cycle_used: float):
        self.cycle_used = current_cycle_used

    def plan_trip(
        self,
        total_distance_miles: float,
        total_drive_hours: float,
        fuel_stops: int,
        start_time: str = "08:00"
    ) -> dict:
        """
        Break a trip into days with full activity schedules.
        Returns a list of DaySegment objects + compliance summary.
        """

        remaining_drive   = total_drive_hours
        remaining_cycle   = self.MAX_CYCLE - self.cycle_used
        current_hour      = self._parse_time(start_time)
        day               = 1
        days              = []
        violations        = []
        has_pickup        = True
        has_dropoff       = True
        fuel_stops_done   = 0
        miles_since_fuel  = 0
        driving_since_break = 0.0

        # Total on-duty time includes driving + pickup + dropoff + fuel stops
        total_fuel_stops  = math.ceil(total_distance_miles / self.FUEL_STOP_INTERVAL) - 1
        total_fuel_stops  = max(0, total_fuel_stops)

        while remaining_drive > 0 or has_pickup or has_dropoff:
            day_activities  = []
            day_on_duty     = 0.0
            day_driving     = 0.0
            window_start    = current_hour  # 14-hr window starts here
            day_violations  = []
            driving_since_break = 0.0  # resets each day (or after break)

            # -- Pickup on day 1 --
            if has_pickup and day == 1:
                act = self._add_activity("on_duty_not_driving", "Pickup", 
                                          current_hour, self.PICKUP_DROPOFF_TIME)
                day_activities.append(act)
                current_hour  += self.PICKUP_DROPOFF_TIME
                day_on_duty   += self.PICKUP_DROPOFF_TIME
                has_pickup     = False

            # -- Drive as much as allowed today --
            available_drive_today = min(
                self.MAX_DRIVE_DAILY - day_driving,
                self.MAX_ON_DUTY_WINDOW - (current_hour - window_start),
                remaining_cycle,
                remaining_drive
            )

            while available_drive_today > 0:
                # Check if fuel stop needed (every 1000 miles, ~10 hrs at 55mph avg)
                miles_this_segment = available_drive_today * 55
                if miles_since_fuel + miles_this_segment >= self.FUEL_STOP_INTERVAL:
                    hours_to_fuel = (self.FUEL_STOP_INTERVAL - miles_since_fuel) / 55
                    # Drive to fuel stop
                    if hours_to_fuel > 0:
                        # Check mandatory break first
                        if driving_since_break + hours_to_fuel > self.BREAK_REQUIRED_AFTER:
                            break_before = self.BREAK_REQUIRED_AFTER - driving_since_break
                            if break_before > 0:
                                act = self._add_activity("driving", "Driving",
                                                          current_hour, break_before)
                                day_activities.append(act)
                                current_hour       += break_before
                                day_driving        += break_before
                                day_on_duty        += break_before
                                available_drive_today -= break_before
                                remaining_drive    -= break_before
                                driving_since_break += break_before
                                self.cycle_used    += break_before
                            # Mandatory break
                            act = self._add_activity("off_duty", "30-min Rest Break",
                                                      current_hour, self.BREAK_DURATION)
                            day_activities.append(act)
                            current_hour          += self.BREAK_DURATION
                            driving_since_break    = 0.0
                        else:
                            act = self._add_activity("driving", "Driving to Fuel Stop",
                                                      current_hour, hours_to_fuel)
                            day_activities.append(act)
                            current_hour       += hours_to_fuel
                            day_driving        += hours_to_fuel
                            day_on_duty        += hours_to_fuel
                            available_drive_today -= hours_to_fuel
                            remaining_drive    -= hours_to_fuel
                            driving_since_break += hours_to_fuel
                            self.cycle_used    += hours_to_fuel

                    # Fuel stop
                    act = self._add_activity("on_duty_not_driving", "Fuel Stop",
                                              current_hour, self.FUEL_STOP_TIME)
                    day_activities.append(act)
                    current_hour      += self.FUEL_STOP_TIME
                    day_on_duty       += self.FUEL_STOP_TIME
                    miles_since_fuel   = 0
                    fuel_stops_done   += 1
                    available_drive_today -= self.FUEL_STOP_TIME
                    continue

                # Normal driving block
                drive_block = min(available_drive_today, 
                                  self.BREAK_REQUIRED_AFTER - driving_since_break)
                if drive_block <= 0:
                    # Need a mandatory break
                    act = self._add_activity("off_duty", "30-min Mandatory Break",
                                              current_hour, self.BREAK_DURATION)
                    day_activities.append(act)
                    current_hour += self.BREAK_DURATION
                    driving_since_break = 0.0
                    available_drive_today -= self.BREAK_DURATION
                    continue

                act = self._add_activity("driving", "Driving",
                                          current_hour, drive_block)
                day_activities.append(act)
                current_hour          += drive_block
                day_driving           += drive_block
                day_on_duty           += drive_block
                available_drive_today  -= drive_block
                remaining_drive       -= drive_block
                driving_since_break   += drive_block
                self.cycle_used       += drive_block
                miles_since_fuel      += drive_block * 55

                available_drive_today = min(
                    self.MAX_DRIVE_DAILY - day_driving,
                    self.MAX_ON_DUTY_WINDOW - (current_hour - window_start),
                    self.MAX_CYCLE - self.cycle_used,
                    remaining_drive
                )

            # Dropoff on final driving day
            if remaining_drive <= 0 and has_dropoff:
                act = self._add_activity("on_duty_not_driving", "Dropoff",
                                          current_hour, self.DROPOFF_TIME if hasattr(self, 'DROPOFF_TIME') else self.PICKUP_DROPOFF_TIME)
                day_activities.append(act)
                current_hour  += self.PICKUP_DROPOFF_TIME
                day_on_duty   += self.PICKUP_DROPOFF_TIME
                has_dropoff    = False

            # Off duty for rest of day
            end_of_day = 24.0
            if current_hour < end_of_day:
                act = self._add_activity("off_duty", "Off Duty / Rest",
                                          current_hour, end_of_day - current_hour)
                day_activities.append(act)

            # Validate this day
            if day_driving > self.MAX_DRIVE_DAILY:
                day_violations.append(f"Day {day}: Exceeds 11-hour drive limit ({day_driving:.1f}h)")
            if day_on_duty > self.MAX_ON_DUTY_WINDOW:
                day_violations.append(f"Day {day}: Exceeds 14-hour on-duty window")
            if self.cycle_used > self.MAX_CYCLE:
                day_violations.append(f"Day {day}: Exceeds 70-hour/8-day cycle limit")

            violations.extend(day_violations)

            days.append({
                "day": day,
                "activities": day_activities,
                "total_driving_hours": round(day_driving, 2),
                "total_on_duty_hours": round(day_on_duty, 2),
                "is_compliant": len(day_violations) == 0,
                "violations": day_violations,
            })

            # Reset for next day (10-hour mandatory rest)
            current_hour = 0.0  # midnight start
            day += 1

            if day > 14:  # safety valve
                break

        return {
            "days": days,
            "total_days": len(days),
            "is_compliant": len(violations) == 0,
            "violations": violations,
            "remaining_cycle_hours": round(self.MAX_CYCLE - self.cycle_used, 2),
            "cycle_used_after_trip": round(self.cycle_used, 2),
        }

    def _parse_time(self, time_str: str) -> float:
        """'08:30' → 8.5"""
        h, m = map(int, time_str.split(':'))
        return h + m / 60.0

    def _add_activity(self, status: str, label: str, 
                       start_hour: float, duration: float) -> dict:
        return {
            "status": status,      # "driving" | "on_duty_not_driving" | "off_duty" | "sleeper_berth"
            "label": label,
            "start": round(start_hour, 4),
            "end": round(start_hour + duration, 4),
            "duration": round(duration, 4),
            "start_str": self._format_time(start_hour),
            "end_str": self._format_time(start_hour + duration),
        }

    def _format_time(self, hours: float) -> str:
        """8.5 → '08:30'"""
        h = int(hours) % 24
        m = int((hours % 1) * 60)
        return f"{h:02d}:{m:02d}"
```

---

## 8. ELD Log Sheet Generator <a name="eld"></a>

This generates images that look exactly like the paper log shown in the assessment.

```python
# apps/eld/generator.py

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
            font_sm  = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 11)
            font_med = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 13)
            font_lg  = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 16)
        except:
            font_sm = font_med = font_lg = ImageFont.load_default()
        
        # --- HEADER ---
        draw.text((10, 5),  "Drivers Daily Log  (24 hours)", font=font_lg, fill=BLACK)
        draw.text((10, 25), f"Date: {date_str}   Day {day_number} of trip", font=font_sm, fill=BLACK)
        draw.text((10, 40), f"From: {from_location}", font=font_sm, fill=BLACK)
        draw.text((500, 40), f"To: {to_location}", font=font_sm, fill=BLACK)
        draw.text((10, 55), f"Carrier: {carrier}   Driver: {driver_name}   Total Miles: {total_miles:.0f}", font=font_sm, fill=BLACK)
        
        grid_top = self.HEADER_H
        label_width = 130
        grid_left = label_width
        
        # --- HOUR LABELS (Midnight, 1, 2 ... Noon ... 11, Midnight) ---
        hour_labels = ["M", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11",
                       "N", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "M"]
        for i, lbl in enumerate(hour_labels):
            x = grid_left + int(i * 60)
            draw.text((x - 4, grid_top - 16), lbl, font=font_sm, fill=BLACK)
        
        # --- GRID ROWS ---
        for row_idx, (status_key, row_label) in enumerate(zip(self.ROWS, self.ROW_LABELS)):
            y_top    = grid_top + row_idx * self.ROW_HEIGHT
            y_bottom = y_top + self.ROW_HEIGHT
            y_center = y_top + self.ROW_HEIGHT // 2
            
            # Row label on the left
            draw.text((5, y_top + 10), row_label, font=font_sm, fill=BLACK)
            
            # Row background
            draw.rectangle([grid_left, y_top, grid_left + 1440, y_bottom], 
                          outline=BLACK, fill=(248, 248, 248))
            
            # Hour grid lines (every 60px = 1 hour, tick every 15px = 15 min)
            for minute in range(0, 1441):
                x = grid_left + minute
                if minute % 60 == 0:
                    draw.line([(x, y_top), (x, y_bottom)], fill=HOUR_LINE := (80, 80, 80), width=1)
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
        draw.text((totals_x, grid_top - 16), "Total\nHrs", font=font_sm, fill=BLACK)
        
        for row_idx, status_key in enumerate(self.ROWS):
            y_center = grid_top + row_idx * self.ROW_HEIGHT + self.ROW_HEIGHT // 2
            total_h  = sum(
                act["duration"] for act in activities if act["status"] == status_key
            )
            draw.text((totals_x, y_center - 7), f"{total_h:.1f}", font=font_sm, fill=BLACK)
        
        # --- REMARKS SECTION ---
        remarks_y = grid_top + 4 * self.ROW_HEIGHT + 15
        draw.text((10, remarks_y), "Remarks:", font=font_med, fill=BLACK)
        
        remark_lines = []
        for act in activities:
            if act["status"] in ("on_duty_not_driving", "off_duty"):
                remark_lines.append(f"  {act['start_str']} – {act['end_str']}: {act['label']}")
        
        for i, line in enumerate(remark_lines[:5]):
            draw.text((10, remarks_y + 18 + i * 15), line, font=font_sm, fill=BLACK)
        
        # Convert to base64
        buffer = io.BytesIO()
        img.save(buffer, format="PNG", optimize=True)
        buffer.seek(0)
        return base64.b64encode(buffer.getvalue()).decode("utf-8")


def generate_all_logs(hos_days: list, driver_name: str, trip_metadata: dict) -> list:
    """Generate one ELD log per day. Returns list of {day, date, image_b64}"""
    gen  = ELDLogGenerator()
    logs = []
    for day_data in hos_days:
        img_b64 = gen.generate(
            activities     = day_data["activities"],
            driver_name    = driver_name,
            date_str       = day_data.get("date", f"Day {day_data['day']}"),
            carrier        = trip_metadata.get("carrier", ""),
            from_location  = trip_metadata.get("from", ""),
            to_location    = trip_metadata.get("to", ""),
            total_miles    = trip_metadata.get("total_miles", 0),
            day_number     = day_data["day"],
        )
        logs.append({"day": day_data["day"], "image_b64": img_b64})
    return logs
```

---

## 9. Route Engine <a name="route"></a>

```python
# apps/routes/engine.py

import openrouteservice
import math
from typing import Optional

class RouteEngine:
    """
    Uses OpenRouteService (free API key) for:
    - Geocoding: address string → {lat, lng}
    - Directions: multi-waypoint route for HGV (heavy goods vehicle)
    """
    
    AVG_SPEED_MPH = 55  # conservative average for a loaded truck
    
    def __init__(self, api_key: str):
        self.client = openrouteservice.Client(key=api_key)
    
    def geocode(self, address: str) -> dict:
        """Address → {lat, lng, display_name}"""
        result = self.client.pelias_search(text=address)
        feature = result["features"][0]
        lng, lat = feature["geometry"]["coordinates"]
        return {
            "lat": lat,
            "lng": lng,
            "display_name": feature["properties"].get("label", address)
        }
    
    def get_route(self, start: dict, pickup: dict, dropoff: dict) -> dict:
        """
        Returns full route data.
        
        start, pickup, dropoff: each a dict with {lat, lng}
        """
        coords = [
            [start["lng"],   start["lat"]],
            [pickup["lng"],  pickup["lat"]],
            [dropoff["lng"], dropoff["lat"]],
        ]
        
        route_data = self.client.directions(
            coordinates = coords,
            profile     = "driving-hgv",
            format      = "geojson",
            units       = "mi",
        )
        
        summary  = route_data["features"][0]["properties"]["summary"]
        geometry = route_data["features"][0]["geometry"]["coordinates"]
        
        distance_miles = summary["distance"]
        duration_hours = summary["duration"] / 3600.0
        
        # Adjust for truck speed (ORS gives car speed)
        adjusted_hours = distance_miles / self.AVG_SPEED_MPH
        
        # Calculate fuel stops (every 1000 miles)
        num_fuel_stops = max(0, math.floor(distance_miles / 1000) - 1)
        
        # Interpolate fuel stop positions along the polyline
        fuel_stop_positions = self._interpolate_stops(geometry, distance_miles, num_fuel_stops)
        
        return {
            "distance_miles":      round(distance_miles, 1),
            "duration_hours":      round(adjusted_hours, 2),
            "polyline":            geometry,        # [[lng,lat], ...] for Leaflet
            "num_fuel_stops":      num_fuel_stops,
            "fuel_stop_positions": fuel_stop_positions,
            "start_coords":        start,
            "pickup_coords":       pickup,
            "dropoff_coords":      dropoff,
        }
    
    def _interpolate_stops(self, polyline, total_miles, num_stops) -> list:
        if num_stops == 0:
            return []
        stops = []
        for i in range(1, num_stops + 1):
            frac = (i * 1000) / total_miles
            frac = min(frac, 1.0)
            idx  = int(frac * (len(polyline) - 1))
            lng, lat = polyline[idx]
            stops.append({"lat": lat, "lng": lng, "mile_marker": i * 1000})
        return stops
```

---

## 10. AI Feature: RAG + FMCSA Regulations <a name="ai"></a>

This is what will set you apart from every other candidate.

### Architecture
```
FMCSA HOS Guide PDF
        │
        ▼
  PDF Text Extraction (PyPDF2)
        │
        ▼
  Text Chunking (512 token chunks, 50 token overlap)
        │
        ▼
  Embeddings (OpenAI text-embedding-3-small)
        │
        ▼
  ChromaDB (persisted vector store)
        │
        ▼ (at query time)
  User Question → Embed → Top-K chunks → GPT-3.5 → Answer
```

### Implementation

```python
# apps/ai_assistant/rag_pipeline.py

import os
import chromadb
from chromadb.utils.embedding_functions import OpenAIEmbeddingFunction
from openai import OpenAI
import PyPDF2
from pathlib import Path

class FMCSARegulationRAG:
    """
    RAG pipeline over the official FMCSA HOS Guide.
    ChromaDB persists to disk so ingestion only happens once.
    """
    
    COLLECTION_NAME = "fmcsa_regulations"
    CHUNK_SIZE      = 600   # characters
    CHUNK_OVERLAP   = 80
    TOP_K           = 4
    
    def __init__(self):
        self.openai = OpenAI(api_key=os.environ["OPENAI_API_KEY"])
        
        embed_fn = OpenAIEmbeddingFunction(
            api_key    = os.environ["OPENAI_API_KEY"],
            model_name = "text-embedding-3-small",
        )
        
        self.chroma = chromadb.PersistentClient(path="./chroma_db")
        
        self.collection = self.chroma.get_or_create_collection(
            name               = self.COLLECTION_NAME,
            embedding_function = embed_fn,
        )
        
        # Only ingest if collection is empty
        if self.collection.count() == 0:
            self._ingest_regulations()
    
    def _ingest_regulations(self):
        """Load and chunk the FMCSA HOS Guide PDF"""
        pdf_path = Path(__file__).parent.parent.parent / "data" / "fmcsa_hos_guide.pdf"
        
        if not pdf_path.exists():
            # Fallback: use hardcoded key regulations
            self._ingest_hardcoded_regs()
            return
        
        reader = PyPDF2.PdfReader(str(pdf_path))
        full_text = "\n".join(page.extract_text() for page in reader.pages if page.extract_text())
        
        chunks = self._chunk_text(full_text)
        
        self.collection.add(
            documents = chunks,
            ids       = [f"reg_{i}" for i in range(len(chunks))],
        )
        print(f"[RAG] Ingested {len(chunks)} chunks from FMCSA guide.")
    
    def _ingest_hardcoded_regs(self):
        """Key HOS regulations as fallback"""
        regulations = [
            "11-Hour Driving Limit: May drive a maximum of 11 hours after 10 consecutive hours off duty.",
            "14-Hour Driving Window: May not drive beyond the 14th consecutive hour after coming on duty, following 10 consecutive hours off duty. Off-duty time does not extend the 14-hour period.",
            "Rest Breaks: May drive only if 8 hours or less have passed since end of driver's last off-duty or sleeper berth period of at least 30 minutes.",
            "60/70-Hour On-Duty Limit: May not drive after 60/70 on-duty hours in 7/8 consecutive days. A driver may restart a 7/8 consecutive day period after taking 34 or more consecutive hours off duty.",
            "34-Hour Restart: Drivers using the 70-hour/8-day schedule may restart their clock after 34 consecutive hours off duty.",
            "Sleeper Berth Provision: Drivers using a sleeper berth must take at least 8 hours in the sleeper berth, plus a separate 2 consecutive hours either in the sleeper berth, off duty, or any combination of the two.",
            "Property-carrying drivers are subject to the 11-hour driving limit, 14-hour on-duty window, and 70-hour/8-day rule.",
            "Adverse Driving Conditions Exception: Drivers may extend the 11-hour maximum driving limit and 14-hour driving window by up to 2 hours when encountering adverse driving conditions.",
            "Short-Haul Exception: A driver is exempt from keeping a record of duty status if the driver operates within a 150 air-mile radius of the normal work reporting location and returns to the work reporting location within 14 consecutive hours.",
            "Fueling: Commercial drivers should refuel at least every 1000 miles or as needed to maintain legal operation.",
        ]
        self.collection.add(
            documents = regulations,
            ids       = [f"reg_{i}" for i in range(len(regulations))],
        )
    
    def _chunk_text(self, text: str) -> list:
        chunks, start = [], 0
        while start < len(text):
            end = start + self.CHUNK_SIZE
            chunks.append(text[start:end])
            start += self.CHUNK_SIZE - self.CHUNK_OVERLAP
        return [c.strip() for c in chunks if len(c.strip()) > 50]
    
    def answer(self, question: str, trip_context: dict = None) -> dict:
        """
        Answer a question about FMCSA regulations.
        Optionally include trip context (current hours, etc.) for personalized answers.
        """
        # Retrieve relevant regulation chunks
        results = self.collection.query(
            query_texts = [question],
            n_results   = self.TOP_K,
        )
        
        relevant_regs = "\n\n".join(results["documents"][0])
        
        # Build context-aware system prompt
        system = """You are an expert FMCSA Hours of Service compliance assistant.
You help truck drivers understand federal trucking regulations.
Answer questions accurately and concisely, citing specific rules when relevant.
If the driver provides their current hours/situation, give personalized compliance advice.
Always err on the side of caution for safety."""
        
        context_block = ""
        if trip_context:
            context_block = f"""
Current driver context:
- Cycle hours used: {trip_context.get('cycle_hours_used', 'unknown')} hours
- Driving today: {trip_context.get('today_driving', 'unknown')} hours
- On-duty today: {trip_context.get('today_on_duty', 'unknown')} hours
"""
        
        user_prompt = f"""Relevant FMCSA Regulations:
{relevant_regs}
{context_block}
Driver Question: {question}

Please answer based on the regulations above."""
        
        response = self.openai.chat.completions.create(
            model       = "gpt-3.5-turbo",
            messages    = [
                {"role": "system",  "content": system},
                {"role": "user",    "content": user_prompt},
            ],
            temperature = 0.2,  # Low temp = more factual
            max_tokens  = 400,
        )
        
        return {
            "answer":   response.choices[0].message.content,
            "sources":  results["documents"][0][:2],  # Return top 2 source chunks
            "model":    "gpt-3.5-turbo + FMCSA RAG",
        }
```

### AI Assistant Django View

```python
# apps/ai_assistant/views.py

from rest_framework.views import APIView
from rest_framework.response import Response
from .rag_pipeline import FMCSARegulationRAG

rag = FMCSARegulationRAG()  # Singleton — ingestion runs once at startup

class AIAssistantView(APIView):
    def post(self, request):
        question     = request.data.get("question", "")
        trip_context = request.data.get("trip_context", None)
        
        if not question:
            return Response({"error": "Question required"}, status=400)
        
        result = rag.answer(question, trip_context)
        return Response(result)
```

---

## 11. Frontend Architecture (React + TypeScript) <a name="frontend"></a>

### UI/UX Design Direction
**Industrial dashboard aesthetic.** Dark sidebar, high-contrast data readouts, map dominating 60% of screen, ELD logs in a scrollable right panel. Feels like professional fleet management software. This is memorable and appropriate for the domain.

**Color palette:**
```css
:root {
  --bg-primary:   #0f1117;
  --bg-card:      #1a1d27;
  --bg-sidebar:   #13151e;
  --accent:       #3b82f6;    /* blue */
  --accent-green: #22c55e;    /* compliant */
  --accent-red:   #ef4444;    /* violation */
  --accent-amber: #f59e0b;    /* warning */
  --text-primary: #f1f5f9;
  --text-muted:   #94a3b8;
  --border:       #2d3148;
}
```

### State shape (Zustand)

```typescript
// src/store/tripStore.ts

interface TripState {
  // Form inputs
  inputs: {
    currentLocation:  string;
    pickupLocation:   string;
    dropoffLocation:  string;
    cycleHoursUsed:   number;
    driverName:       string;
  };
  
  // API response
  result: {
    tripId:           string;
    route:            RouteData;
    hosAnalysis:      HOSAnalysis;
    eldLogs:          ELDLog[];
    isCompliant:      boolean;
    violations:       string[];
  } | null;
  
  // UI state
  loading:    boolean;
  error:      string | null;
  activeDay:  number;       // which ELD log to display
  
  // Actions
  setInput:       (field: string, value: string | number) => void;
  calculateTrip:  () => Promise<void>;
  setActiveDay:   (day: number) => void;
}
```

### Component tree

```
App
├── Sidebar
│   ├── Logo
│   ├── TripForm
│   │   ├── LocationInput (× 3)     ← with address autocomplete
│   │   ├── CycleHoursSlider
│   │   ├── DriverNameInput
│   │   └── CalculateButton
│   └── ComplianceStatusCard
│       ├── HoursGauge              ← circular progress
│       ├── ViolationList
│       └── TripSummaryStats
│
├── MainContent
│   ├── MapPanel (60% height)
│   │   └── TripMap                 ← Leaflet
│   │       ├── RoutePolyline
│   │       ├── StartMarker
│   │       ├── PickupMarker
│   │       ├── DropoffMarker
│   │       └── FuelStopMarker[]
│   │
│   └── ELDPanel (40% height)
│       ├── DaySelector             ← tabs per day
│       ├── ELDLogImage             ← <img> from base64
│       └── ActivityTimeline        ← color-coded timeline bar
│
└── AIAssistantDrawer               ← slide-in panel
    ├── ChatHistory
    ├── SuggestedQuestions
    └── ChatInput
```

### Key component snippets

#### TripMap (Leaflet)
```typescript
// src/components/RouteMap/TripMap.tsx
import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

const fuelIcon = L.divIcon({
  className: '',
  html: `<div style="background:#f59e0b;width:14px;height:14px;border-radius:50%;border:2px solid white"/>`,
  iconSize: [14, 14],
});

export const TripMap = ({ route, result }) => {
  if (!result) return <div className="map-placeholder">Enter trip details to see route</div>;
  
  const polylinePoints = result.route.polyline.map(([lng, lat]) => [lat, lng]);
  const center = polylinePoints[Math.floor(polylinePoints.length / 2)];
  
  return (
    <MapContainer center={center} zoom={6} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="© OpenStreetMap contributors"
      />
      
      <Polyline positions={polylinePoints} color="#3b82f6" weight={3} opacity={0.8} />
      
      {/* Start marker */}
      <Marker position={[result.route.start_coords.lat, result.route.start_coords.lng]}>
        <Popup>📍 Start: {result.inputs?.currentLocation}</Popup>
      </Marker>
      
      {/* Pickup */}
      <Marker position={[result.route.pickup_coords.lat, result.route.pickup_coords.lng]}>
        <Popup>📦 Pickup: {result.inputs?.pickupLocation}</Popup>
      </Marker>
      
      {/* Dropoff */}
      <Marker position={[result.route.dropoff_coords.lat, result.route.dropoff_coords.lng]}>
        <Popup>🏁 Dropoff: {result.inputs?.dropoffLocation}</Popup>
      </Marker>
      
      {/* Fuel stops */}
      {result.route.fuel_stop_positions?.map((stop, i) => (
        <Marker key={i} position={[stop.lat, stop.lng]} icon={fuelIcon}>
          <Popup>⛽ Fuel Stop {i + 1} — Mile {stop.mile_marker}</Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};
```

#### ELD Log Viewer
```typescript
// src/components/ELDLogSheet/ELDViewer.tsx
export const ELDViewer = ({ eldLogs, activeDay, onDayChange }) => {
  const currentLog = eldLogs.find(l => l.day === activeDay);
  
  return (
    <div className="eld-viewer">
      {/* Day tabs */}
      <div className="day-tabs">
        {eldLogs.map(log => (
          <button
            key={log.day}
            className={`day-tab ${activeDay === log.day ? 'active' : ''}`}
            onClick={() => onDayChange(log.day)}
          >
            Day {log.day}
          </button>
        ))}
      </div>
      
      {/* Log image */}
      {currentLog && (
        <div className="log-container">
          <img
            src={`data:image/png;base64,${currentLog.image_b64}`}
            alt={`ELD Log Day ${activeDay}`}
            style={{ width: '100%', imageRendering: 'crisp-edges' }}
          />
          <button
            className="download-btn"
            onClick={() => downloadLog(currentLog, activeDay)}
          >
            ↓ Download Day {activeDay} Log
          </button>
        </div>
      )}
    </div>
  );
};

function downloadLog(log, day) {
  const link = document.createElement('a');
  link.href = `data:image/png;base64,${log.image_b64}`;
  link.download = `eld_log_day_${day}.png`;
  link.click();
}
```

---

## 12. API Contract <a name="api"></a>

### POST `/api/trips/calculate/`

**Request:**
```json
{
  "current_location":  "Chicago, IL",
  "pickup_location":   "Detroit, MI",
  "dropoff_location":  "New York, NY",
  "current_cycle_used": 24.5,
  "driver_name":       "John Doe"
}
```

**Response:**
```json
{
  "trip_id": "uuid-here",
  "route": {
    "distance_miles": 812.4,
    "duration_hours": 14.76,
    "polyline": [[lng, lat], ...],
    "num_fuel_stops": 0,
    "fuel_stop_positions": [],
    "start_coords":   {"lat": 41.88, "lng": -87.63},
    "pickup_coords":  {"lat": 42.33, "lng": -83.04},
    "dropoff_coords": {"lat": 40.71, "lng": -74.00}
  },
  "hos_analysis": {
    "is_compliant": true,
    "violations": [],
    "total_days": 2,
    "remaining_cycle_hours": 31.5,
    "cycle_used_after_trip": 38.5,
    "days": [
      {
        "day": 1,
        "activities": [
          {"status": "on_duty_not_driving", "label": "Pickup",
           "start": 8.0, "end": 9.0, "start_str": "08:00", "end_str": "09:00", "duration": 1.0},
          {"status": "driving", "label": "Driving",
           "start": 9.0, "end": 17.0, "start_str": "09:00", "end_str": "17:00", "duration": 8.0},
          {"status": "off_duty", "label": "30-min Break",
           "start": 17.0, "end": 17.5, "start_str": "17:00", "end_str": "17:30", "duration": 0.5},
          {"status": "driving", "label": "Driving",
           "start": 17.5, "end": 20.5, "start_str": "17:30", "end_str": "20:30", "duration": 3.0},
          {"status": "off_duty", "label": "Off Duty / Rest",
           "start": 20.5, "end": 24.0, "start_str": "20:30", "end_str": "24:00", "duration": 3.5}
        ],
        "total_driving_hours": 11.0,
        "total_on_duty_hours": 12.0,
        "is_compliant": true,
        "violations": []
      },
      {
        "day": 2,
        "activities": [...],
        "total_driving_hours": 3.76,
        "is_compliant": true,
        "violations": []
      }
    ]
  },
  "eld_logs": [
    {"day": 1, "image_b64": "iVBORw0KGgo..."},
    {"day": 2, "image_b64": "iVBORw0KGgo..."}
  ]
}
```

### POST `/api/ai/chat/`

**Request:**
```json
{
  "question": "I've driven 9 hours today and used 60 hours this week. Can I continue driving?",
  "trip_context": {
    "cycle_hours_used": 60,
    "today_driving": 9,
    "today_on_duty": 10
  }
}
```

**Response:**
```json
{
  "answer": "Based on FMCSA regulations: You have used 60 of your 70 allowed cycle hours, leaving 10 hours remaining. Today, you've driven 9 of the maximum 11 hours, so you have 2 hours of driving available. However, your 14-hour on-duty window started when you began duty today. At 10 hours on-duty, you have 4 hours remaining in your window. You may continue driving for up to 2 more hours (your daily drive limit), provided you stay within your 14-hour window. After that, you must take 10 consecutive hours off duty before driving again.",
  "sources": ["11-Hour Driving Limit: ...", "60/70-Hour On-Duty Limit: ..."],
  "model": "gpt-3.5-turbo + FMCSA RAG"
}
```

### GET `/api/health/`
```json
{"status": "ok", "version": "1.0.0"}
```

---

## 13. Deployment Strategy <a name="deploy"></a>

### Frontend → Vercel

```json
// frontend/vercel.json
{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "https://your-backend.onrender.com/api/$1" },
    { "source": "/(.*)", "destination": "/" }
  ]
}
```

```bash
# One-time setup
npm i -g vercel
cd frontend
vercel login
vercel --prod

# Set env vars in Vercel dashboard:
# VITE_API_URL = https://your-backend.onrender.com
# VITE_OPENROUTE_KEY = (if using ORS directly from frontend for map display)
```

### Backend → Render.com

```
# backend/Procfile
web: gunicorn config.wsgi:application --workers 2 --bind 0.0.0.0:$PORT

# backend/runtime.txt
python-3.11.0
```

**Render.com settings:**
- Build command: `pip install -r requirements.txt`
- Start command: From Procfile
- Environment variables: `MONGODB_URI`, `OPENAI_API_KEY`, `OPENROUTE_SERVICE_KEY`, `SECRET_KEY`, `DJANGO_SETTINGS_MODULE=config.settings.prod`

### MongoDB Atlas
1. Create free M0 cluster at mongodb.com/atlas
2. Add IP `0.0.0.0/0` to whitelist (for Render)
3. Copy connection string → `MONGODB_URI`

### GitHub Actions CI/CD
```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Render
        run: curl "${{ secrets.RENDER_DEPLOY_HOOK }}"

  test-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with: {python-version: '3.11'}
      - run: cd backend && pip install -r requirements.txt
      - run: cd backend && pytest tests/ -v
```

---

## 14. Environment Variables Reference <a name="env"></a>

### backend/.env
```
DJANGO_SETTINGS_MODULE=config.settings.dev
SECRET_KEY=your-random-secret-key-50-chars
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/eld_db

OPENROUTE_SERVICE_KEY=your-ors-key   # free at openrouteservice.org
OPENAI_API_KEY=sk-...                 # for RAG (optional but impressive)

CORS_ALLOWED_ORIGINS=http://localhost:5173
```

### frontend/.env.local
```
VITE_API_URL=http://localhost:8000
VITE_ORS_KEY=your-ors-key            # only if doing geocoding on frontend
```

---

## 15. Implementation Order <a name="timeline"></a>

Work in this exact order. Each step is independently testable.

### Day 1: Skeleton + HOS Engine
- [ ] Create Django project, install packages, connect MongoDB
- [ ] Write `HOSCalculator` (pure Python, no API calls)
- [ ] Write `pytest` tests for HOS — test edge cases: 70hr limit, 14hr window, break requirement
- [ ] Get tests passing

### Day 2: Route Engine + Trip API
- [ ] Get free OpenRouteService API key
- [ ] Write `RouteEngine` — geocode + directions
- [ ] Wire up `POST /api/trips/calculate/` — returns route + HOS analysis (no ELD yet)
- [ ] Test with Postman/Insomnia

### Day 3: ELD Generator
- [ ] Write `ELDLogGenerator` with Pillow
- [ ] Test: generate a log for a single day, open the PNG, verify it looks correct
- [ ] Integrate into trip calculate endpoint
- [ ] Verify multi-day trips generate multiple logs

### Day 4: RAG Pipeline
- [ ] Download FMCSA HOS Guide PDF (free, public domain at fmcsa.dot.gov)
- [ ] Write `FMCSARegulationRAG` — ingest, chunk, embed, query
- [ ] Wire up `POST /api/ai/chat/`
- [ ] Test: ask 5 regulation questions manually

### Day 5–6: Frontend Core
- [ ] Vite + React + TS setup, Tailwind, Zustand
- [ ] `TripForm` component with all 4 inputs
- [ ] `api.ts` service layer
- [ ] Hook up calculate button → POST → display raw JSON
- [ ] `TripMap` with Leaflet — route polyline + markers

### Day 7: ELD Viewer + Compliance Dashboard
- [ ] `ELDViewer` — base64 image display + day tabs + download button
- [ ] `ComplianceStatusCard` — hours gauge, violation list
- [ ] `ActivityTimeline` — color-coded horizontal bar per day

### Day 8: AI Assistant
- [ ] `AIAssistantDrawer` — slide-in panel
- [ ] Chat UI with message history
- [ ] 5 suggested questions buttons
- [ ] Trip context injection (pass current trip hours to AI)

### Day 9: Polish + Testing
- [ ] Mobile responsiveness
- [ ] Error states (geocoding failed, API error, compliance violations)
- [ ] Loading skeletons
- [ ] Run full E2E test with a real trip (e.g. LA → NYC)
- [ ] Fix any HOS logic bugs

### Day 10: Deploy + Loom
- [ ] Deploy backend to Render, frontend to Vercel
- [ ] Set all production env vars
- [ ] Final E2E test on production URLs
- [ ] Record 3–5 min Loom video (see script below)
- [ ] Update README with live link, Loom link, screenshots

---

## 16. What Will Impress the Recruiter <a name="impress"></a>

### ✅ Core requirements (must nail)
- Accurate HOS compliance calculation (they said they'll test for accuracy)
- ELD logs that actually look like the paper log (visual fidelity matters)
- Route on map with fuel stops marked
- Clean, professional UI

### 🚀 Above and beyond (your differentiators)

**1. RAG AI Assistant grounded in the actual FMCSA document**
> Most candidates will fake this or skip it. You'll have a chatbot that retrieves and cites actual regulation text. Show this prominently in the Loom.

**2. Trip context injection**
> The AI knows the driver's current hours and gives personalized compliance advice — "You have 2 driving hours left today and 10 cycle hours remaining." This bridges the AI feature with the core functionality.

**3. ELD log download button**
> Small UX detail that shows product thinking — drivers need to print/save these logs.

**4. Multi-day trip handling**
> If the trip takes 2-3 days, you generate 2-3 log sheets automatically. The assessment says "multiple log sheets will be needed for longer trips" — make sure this works.

**5. Violation highlighting**
> If input hours are already over limit, show red warnings with specific rule names, not just "not compliant."

**6. Clean GitHub repo**
> - Good README with screenshots and live link
> - Sensible commit history (not one giant commit)
> - `.env.example` file (not the real `.env`)
> - Tests passing in CI

### 🎬 Loom Video Script

```
[0:00 – 0:30] Intro
"Hi, I'm Ahsan. This is an ELD Trip Planner built for Spotter AI's Full Stack 
assessment. It combines route calculation, FMCSA compliance checking, and 
auto-generated ELD log sheets in one app. Let me show you."

[0:30 – 1:30] Core Demo
- Enter: Chicago → Detroit → New York, 24 hours cycle used
- Click Calculate
- Point at map: route polyline, pickup/dropoff markers, fuel stops
- Point at compliance panel: "2 days, compliant, 31 hours remaining in cycle"

[1:30 – 2:30] ELD Logs
- Scroll to Day 1 log — show the grid
- "This matches the FMCSA paper log format exactly — four duty rows, 24-hour grid, 
  activity lines drawn by Pillow on the backend"
- Switch to Day 2 — show the continuation
- Click download button

[2:30 – 3:30] AI Assistant
- Open the AI drawer
- Click suggested question: "How does the 30-minute break rule work?"
- Show RAG response with cited regulation text
- Type: "I've driven 9 hours today and used 60 cycle hours — can I keep driving?"
- Show personalized, context-aware answer

[3:30 – 4:00] Code Tour
- Quick GitHub repo tour
- Show hos_calculator.py — "This is the pure-Python rule engine, fully tested"
- Show rag_pipeline.py — "This ingests the actual FMCSA guide PDF at startup"

[4:00 – 4:30] Close
- Show live vercel.app URL in browser
- "Code on GitHub at github.com/your-username/eld-trip-planner"
- "Backend on Render, frontend on Vercel, MongoDB Atlas"
```

---

## Appendix: Free API Keys to Get

| Service | URL | Free Tier |
|---|---|---|
| OpenRouteService | openrouteservice.org/dev/#/signup | 2,000 req/day (plenty) |
| OpenAI | platform.openai.com | Pay as you go (~$0.50 total for this app) |
| MongoDB Atlas | mongodb.com/atlas | 512MB free forever |
| Render.com | render.com | Free tier (sleeps after inactivity — add a `/health` ping) |
| Vercel | vercel.com | Free forever for hobby projects |

---

*Architecture designed for Spotter AI Full Stack Developer Assessment. Ahsan, 2026.*
