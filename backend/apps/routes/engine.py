import openrouteservice
import math
from typing import Optional, List


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
        try:
            result = self.client.pelias_search(text=address)
            if not result or not result.get("features"):
                raise ValueError(f"Could not geocode address: {address}")
            feature = result["features"][0]
            lng, lat = feature["geometry"]["coordinates"]
            return {
                "lat": lat,
                "lng": lng,
                "display_name": feature["properties"].get("label", address)
            }
        except Exception as e:
            print(f"Geocoding error for {address}: {e}")
            return self._fallback_geocode(address)

    def _fallback_geocode(self, address: str) -> dict:
        """Fallback coordinates for common cities when API is unavailable."""
        addr_lower = address.lower()
        city_map = {
            "chicago": {"lat": 41.8781, "lng": -87.6298, "display_name": "Chicago, IL"},
            "new york": {"lat": 40.7128, "lng": -74.0060, "display_name": "New York, NY"},
            "ny": {"lat": 40.7128, "lng": -74.0060, "display_name": "New York, NY"},
            "detroit": {"lat": 42.3314, "lng": -83.0458, "display_name": "Detroit, MI"},
            "los angeles": {"lat": 34.0522, "lng": -118.2437, "display_name": "Los Angeles, CA"},
            "la": {"lat": 34.0522, "lng": -118.2437, "display_name": "Los Angeles, CA"},
            "dallas": {"lat": 32.7767, "lng": -96.7970, "display_name": "Dallas, TX"},
            "houston": {"lat": 29.7604, "lng": -95.3698, "display_name": "Houston, TX"},
            "phoenix": {"lat": 33.4484, "lng": -112.0740, "display_name": "Phoenix, AZ"},
            "seattle": {"lat": 47.6062, "lng": -122.3321, "display_name": "Seattle, WA"},
            "denver": {"lat": 39.7392, "lng": -104.9903, "display_name": "Denver, CO"},
            "atlanta": {"lat": 33.7490, "lng": -84.3880, "display_name": "Atlanta, GA"},
            "boston": {"lat": 42.3601, "lng": -71.0589, "display_name": "Boston, MA"},
            "miami": {"lat": 25.7617, "lng": -80.1918, "display_name": "Miami, FL"},
            "portland": {"lat": 45.5051, "lng": -122.6750, "display_name": "Portland, OR"},
            "san francisco": {"lat": 37.7749, "lng": -122.4194, "display_name": "San Francisco, CA"},
            "sf": {"lat": 37.7749, "lng": -122.4194, "display_name": "San Francisco, CA"},
            "minneapolis": {"lat": 44.9778, "lng": -93.2650, "display_name": "Minneapolis, MN"},
            "nashville": {"lat": 36.1627, "lng": -86.7816, "display_name": "Nashville, TN"},
            "kansas city": {"lat": 39.0997, "lng": -94.5786, "display_name": "Kansas City, MO"},
            "st. louis": {"lat": 38.6270, "lng": -90.1994, "display_name": "St. Louis, MO"},
        }
        for key, coords in city_map.items():
            if key in addr_lower:
                return coords
        return {"lat": 39.8283, "lng": -98.5795, "display_name": address}  # center of USA

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

        try:
            route_data = self.client.directions(
                coordinates=coords,
                profile="driving-hgv",
                format="geojson",
                units="mi"
            )

            properties = route_data["features"][0]["properties"]
            geometry = route_data["features"][0]["geometry"]["coordinates"]

            total_distance_miles = properties["summary"]["distance"]
            total_duration_hours = properties["summary"]["duration"] / 3600.0

            return {
                "total_distance_miles": total_distance_miles,
                "total_duration_hours": total_duration_hours,
                "route_polyline": geometry,  # [[lng, lat], ...]
            }
        except Exception as e:
            print(f"Routing error: {e}")
            # Generate a mock polyline between the three points
            return {
                "total_distance_miles": self._haversine_distance(start, pickup) + self._haversine_distance(pickup, dropoff),
                "total_duration_hours": (self._haversine_distance(start, pickup) + self._haversine_distance(pickup, dropoff)) / self.AVG_SPEED_MPH,
                "route_polyline": [
                    [start["lng"], start["lat"]],
                    [pickup["lng"], pickup["lat"]],
                    [dropoff["lng"], dropoff["lat"]],
                ],
            }

    def get_fuel_stop_positions(self, polyline: List, num_stops: int) -> List[dict]:
        """
        Evenly distribute `num_stops` fuel stop markers along the route polyline.
        Returns list of {lat, lng, label} dicts.
        """
        if not polyline or num_stops <= 0:
            return []

        stops = []
        step = max(1, len(polyline) // (num_stops + 1))

        for i in range(1, num_stops + 1):
            idx = min(i * step, len(polyline) - 1)
            point = polyline[idx]
            if isinstance(point, (list, tuple)) and len(point) >= 2:
                stops.append({
                    "lat": point[1],
                    "lng": point[0],
                    "label": f"Fuel/Rest Stop {i}"
                })

        return stops

    def _haversine_distance(self, coord1: dict, coord2: dict) -> float:
        """Calculate distance in miles between two lat/lng coordinates."""
        R = 3958.8  # Earth radius in miles
        lat1, lon1 = math.radians(coord1["lat"]), math.radians(coord1["lng"])
        lat2, lon2 = math.radians(coord2["lat"]), math.radians(coord2["lng"])
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        a = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return R * c
