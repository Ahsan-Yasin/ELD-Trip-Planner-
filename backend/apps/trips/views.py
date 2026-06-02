from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
import os

from apps.routes.engine import RouteEngine
from apps.compliance.hos_calculator import HOSCalculator
from apps.eld.generator import generate_all_logs
from .models import Trip

class CalculateTripView(APIView):
    def post(self, request):
        data = request.data
        
        current_location = data.get('current_location', 'Chicago, IL')
        pickup = data.get('pickup_location', 'Detroit, MI')
        dropoff = data.get('dropoff_location', 'New York, NY')
        cycle_used = float(data.get('current_cycle_used', 0.0))
        
        # 1. Geocode
        api_key = os.environ.get('OPENROUTESERVICE_API_KEY', '')
        route_engine = RouteEngine(api_key=api_key)
        
        start_coords = route_engine.geocode(current_location)
        pickup_coords = route_engine.geocode(pickup)
        dropoff_coords = route_engine.geocode(dropoff)
        
        # 2. Get Route
        route_data = route_engine.get_route(start_coords, pickup_coords, dropoff_coords)
        
        # 3. Calculate HOS
        hos_engine = HOSCalculator(current_cycle_used=cycle_used)
        hos_results = hos_engine.plan_trip(
            total_distance_miles=route_data['total_distance_miles'],
            total_drive_hours=route_data['total_duration_hours'],
            fuel_stops=int(route_data['total_distance_miles'] // 1000)
        )
        
        # 4. Generate ELD Logs
        trip_meta = {
            "from": current_location,
            "to": dropoff,
            "total_miles": route_data['total_distance_miles']
        }
        eld_logs = generate_all_logs(hos_results['days'], "John Doe", trip_meta)
        
        # 5. Save to MongoDB
        trip = Trip(
            current_location=current_location,
            pickup_location=pickup,
            dropoff_location=dropoff,
            current_cycle_used=cycle_used,
            start_coords=start_coords,
            pickup_coords=pickup_coords,
            dropoff_coords=dropoff_coords,
            total_distance_miles=route_data['total_distance_miles'],
            total_duration_hours=route_data['total_duration_hours'],
            route_polyline=route_data['route_polyline'],
            is_compliant=hos_results['is_compliant'],
            violation_reasons=hos_results['violations'],
            remaining_drive_hours=hos_results['remaining_cycle_hours'],
            daily_segments=hos_results['days'],
            eld_logs=eld_logs
        )
        trip.save()
        
        # 6. Response
        return Response({
            "trip_id": trip.trip_id,
            "route": {
                "distance_mi": route_data['total_distance_miles'],
                "duration_hr": route_data['total_duration_hours'],
                "polyline": route_data['route_polyline']
            },
            "compliance": {
                "is_compliant": hos_results['is_compliant'],
                "violations": hos_results['violations'],
                "days_required": hos_results['total_days'],
                "remaining_cycle_hours": hos_results['remaining_cycle_hours'],
                "drive_hours_used": sum(d['total_driving_hours'] for d in hos_results['days']),
                "daily_segments": hos_results['days']
            },
            "eld_logs": eld_logs
        }, status=status.HTTP_200_OK)
