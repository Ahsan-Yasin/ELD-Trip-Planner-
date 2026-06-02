from mongoengine import Document, StringField, FloatField, DictField, ListField, BooleanField, DateTimeField
from datetime import datetime
from uuid import uuid4

class Trip(Document):
    user_id             = StringField(required=True)
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

    meta = {'collection': 'trips', 'indexes': ['trip_id', 'user_id', 'created_at']}
