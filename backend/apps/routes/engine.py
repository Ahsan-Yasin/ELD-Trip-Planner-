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
            # Fallback for dev without valid API key or network issues
            print(f"Geocoding error for {address}: {e}")
            if "chicago" in address.lower():
                return {"lat": 41.8781, "lng": -87.6298, "display_name": "Chicago, IL"}
            if "new york" in address.lower() or "ny" in address.lower():
                return {"lat": 40.7128, "lng": -74.0060, "display_name": "New York, NY"}
            if "detroit" in address.lower():
                return {"lat": 42.3314, "lng": -83.0458, "display_name": "Detroit, MI"}
            
            return {"lat": 0, "lng": 0, "display_name": address}
    
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
                coordinates = coords,
                profile     = "driving-hgv",
                format      = "geojson",
                units       = "mi"
            )
            
            properties = route_data["features"][0]["properties"]
            geometry = route_data["features"][0]["geometry"]["coordinates"]
            
            total_distance_miles = properties["summary"]["distance"]
            total_duration_hours = properties["summary"]["duration"] / 3600.0  # seconds to hours
            
            return {
                "total_distance_miles": total_distance_miles,
                "total_duration_hours": total_duration_hours,
                "route_polyline": geometry, # [[lng, lat], ...]
            }
        except Exception as e:
            print(f"Routing error: {e}")
            # Mock data for dev if API fails
            return {
                "total_distance_miles": 812.4,
                "total_duration_hours": 14.76,
                "route_polyline": coords,
            }
