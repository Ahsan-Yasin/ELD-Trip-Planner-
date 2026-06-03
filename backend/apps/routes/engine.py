import googlemaps
import googlemaps.convert
import math
import requests
from typing import Optional, List


class RouteEngine:
    """
    Uses Google Maps APIs for:
    - Geocoding: address string → {lat, lng, display_name}
    - Directions: multi-waypoint driving route with real distance/duration
    """

    AVG_SPEED_MPH = 55  # conservative average for a loaded truck
    OSRM_ROUTE_URL = "https://router.project-osrm.org/route/v1/driving/{coords}"

    def __init__(self, api_key: str):
        self.api_key = api_key
        if api_key:
            self.client = googlemaps.Client(key=api_key)
        else:
            self.client = None

    def geocode(self, address: str) -> dict:
        """Address → {lat, lng, display_name}"""
        if not self.client:
            print(f"[WARN] No Google Maps API key set; using fallback geocode for: {address}")
            return self._fallback_geocode(address)

        try:
            results = self.client.geocode(address)
            if not results:
                raise ValueError(f"No geocode results for: {address}")
            result = results[0]
            location = result["geometry"]["location"]
            return {
                "lat": location["lat"],
                "lng": location["lng"],
                "display_name": result.get("formatted_address", address),
            }
        except Exception as e:
            print(f"[WARN] Google geocoding error for '{address}': {e} — using fallback")
            return self._fallback_geocode(address)

    def _fallback_geocode(self, address: str) -> dict:
        """Fallback coordinates for common cities when API is unavailable."""
        addr_lower = address.lower()
        city_map = {
            "chicago": {"lat": 41.8781, "lng": -87.6298, "display_name": "Chicago, IL"},
            "new york": {"lat": 40.7128, "lng": -74.0060, "display_name": "New York, NY"},
            "ny": {"lat": 40.7128, "lng": -74.0060, "display_name": "New York, NY"},
            "detroit": {"lat": 42.3314, "lng": -83.0458, "display_name": "Detroit, MI"},
            "south bend": {"lat": 41.6764, "lng": -86.2520, "display_name": "South Bend, IN"},
            "toledo": {"lat": 41.6528, "lng": -83.5379, "display_name": "Toledo, OH"},
            "cleveland": {"lat": 41.4993, "lng": -81.6944, "display_name": "Cleveland, OH"},
            "columbus": {"lat": 39.9612, "lng": -82.9988, "display_name": "Columbus, OH"},
            "indianapolis": {"lat": 39.7684, "lng": -86.1581, "display_name": "Indianapolis, IN"},
            "fort wayne": {"lat": 41.0793, "lng": -85.1394, "display_name": "Fort Wayne, IN"},
            "grand rapids": {"lat": 42.9634, "lng": -85.6681, "display_name": "Grand Rapids, MI"},
            "milwaukee": {"lat": 43.0389, "lng": -87.9065, "display_name": "Milwaukee, WI"},
            "madison": {"lat": 43.0722, "lng": -89.4008, "display_name": "Madison, WI"},
            "omaha": {"lat": 41.2565, "lng": -95.9345, "display_name": "Omaha, NE"},
            "saint paul": {"lat": 44.9537, "lng": -93.0900, "display_name": "Saint Paul, MN"},
            "st paul": {"lat": 44.9537, "lng": -93.0900, "display_name": "Saint Paul, MN"},
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

        nominatim_result = self._nominatim_geocode(address)
        if nominatim_result:
            return nominatim_result

        return {"lat": 39.8283, "lng": -98.5795, "display_name": address}  # center of USA

    def _nominatim_geocode(self, address: str) -> Optional[dict]:
        """Last-resort public geocoding fallback for cities not in city_map."""
        try:
            response = requests.get(
                "https://nominatim.openstreetmap.org/search",
                params={
                    "q": address,
                    "format": "json",
                    "limit": 1,
                    "countrycodes": "us",
                },
                headers={"User-Agent": "LogisticsPro-ELD-Trip-Planner/1.0"},
                timeout=8,
            )
            response.raise_for_status()
            results = response.json()
            if not results:
                return None

            result = results[0]
            return {
                "lat": float(result["lat"]),
                "lng": float(result["lon"]),
                "display_name": result.get("display_name", address),
            }
        except Exception as e:
            print(f"[WARN] Nominatim geocoding error for '{address}': {e}")
            return None

    def get_route(self, start: dict, pickup: dict, dropoff: dict) -> dict:
        """
        Returns full route data using Google Maps Directions API.
        start, pickup, dropoff: each a dict with {lat, lng}
        """
        if not self.client:
            print("[WARN] No Google Maps API key set; using OSRM road-route fallback.")
            return self._osrm_route_fallback(start, pickup, dropoff)

        try:
            origin = (start["lat"], start["lng"])
            destination = (dropoff["lat"], dropoff["lng"])
            waypoints = [(pickup["lat"], pickup["lng"])]

            directions = self.client.directions(
                origin=origin,
                destination=destination,
                waypoints=waypoints,
                mode="driving",
                units="imperial",
            )

            if not directions:
                raise ValueError("Google Directions API returned no routes")

            route = directions[0]

            # Sum distance (meters) and duration (seconds) across all legs
            total_distance_meters = 0
            total_duration_seconds = 0
            for leg in route["legs"]:
                total_distance_meters += leg["distance"]["value"]
                total_duration_seconds += leg["duration"]["value"]

            # Convert units
            total_distance_miles = total_distance_meters / 1609.34
            total_duration_hours = total_duration_seconds / 3600.0

            # Decode the overview polyline: Google returns [{lat, lng}, ...]
            encoded_polyline = route["overview_polyline"]["points"]
            decoded_points = googlemaps.convert.decode_polyline(encoded_polyline)
            # Convert to [[lng, lat], ...] to match the existing frontend contract
            route_polyline = [[p["lng"], p["lat"]] for p in decoded_points]

            return {
                "total_distance_miles": total_distance_miles,
                "total_duration_hours": total_duration_hours,
                "route_polyline": route_polyline,
            }

        except Exception as e:
            print(f"[WARN] Google Directions API error: {e} - using OSRM road-route fallback")
            return self._osrm_route_fallback(start, pickup, dropoff)

    def _osrm_route_fallback(self, start: dict, pickup: dict, dropoff: dict) -> dict:
        """Road-route fallback when Google Directions is unavailable."""
        coords = ";".join(
            f"{point['lng']},{point['lat']}"
            for point in (start, pickup, dropoff)
        )

        try:
            response = requests.get(
                self.OSRM_ROUTE_URL.format(coords=coords),
                params={"overview": "full", "geometries": "geojson"},
                timeout=20,
            )
            response.raise_for_status()
            data = response.json()
            if data.get("code") != "Ok" or not data.get("routes"):
                raise ValueError(data.get("message", "OSRM returned no route"))

            route = data["routes"][0]
            return {
                "total_distance_miles": route["distance"] / 1609.34,
                "total_duration_hours": route["duration"] / 3600.0,
                "route_polyline": route["geometry"]["coordinates"],
            }
        except Exception as e:
            print(f"[WARN] OSRM routing error: {e} - falling back to haversine distances")
            return self._haversine_fallback(start, pickup, dropoff)

    def _haversine_fallback(self, start: dict, pickup: dict, dropoff: dict) -> dict:
        """Straight-line distance fallback when API is unavailable."""
        dist = self._haversine_distance(start, pickup) + self._haversine_distance(pickup, dropoff)
        return {
            "total_distance_miles": dist,
            "total_duration_hours": dist / self.AVG_SPEED_MPH,
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
                    "label": f"Fuel/Rest Stop {i}",
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
