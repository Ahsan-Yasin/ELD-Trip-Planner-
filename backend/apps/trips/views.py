from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
import os
import logging

from django.utils.decorators import method_decorator
from apps.users.auth import require_auth
from apps.routes.engine import RouteEngine
from apps.compliance.hos_calculator import HOSCalculator
from apps.eld.generator import generate_all_logs
from .models import Trip

logger = logging.getLogger(__name__)


class CalculateTripView(APIView):
    """
    POST /api/trips/calculate/
    Body: { current_location, pickup_location, dropoff_location, current_cycle_used, driver_name }
    Header: Authorization: Bearer <token>
    """

    @method_decorator(require_auth)
    def post(self, request):
        user_id = request.user_id
        data = request.data

        current_location = data.get('current_location', 'Chicago, IL')
        pickup = data.get('pickup_location', 'Detroit, MI')
        dropoff = data.get('dropoff_location', 'New York, NY')
        cycle_used = float(data.get('current_cycle_used', 0.0))
        driver_name = data.get('driver_name', 'John Doe')

        # 1. Geocode + Route
        api_key = os.environ.get('OPENROUTESERVICE_API_KEY', '')
        route_engine = RouteEngine(api_key=api_key)

        start_coords = route_engine.geocode(current_location)
        pickup_coords = route_engine.geocode(pickup)
        dropoff_coords = route_engine.geocode(dropoff)

        route_data = route_engine.get_route(start_coords, pickup_coords, dropoff_coords)

        # 2. HOS Calculation
        hos_engine = HOSCalculator(current_cycle_used=cycle_used)
        fuel_stops_count = max(0, int(route_data['total_distance_miles'] // 1000) - 1)
        hos_results = hos_engine.plan_trip(
            total_distance_miles=route_data['total_distance_miles'],
            total_drive_hours=route_data['total_duration_hours'],
            fuel_stops=fuel_stops_count
        )

        # 3. ELD Logs
        trip_meta = {
            "from": current_location,
            "to": dropoff,
            "total_miles": route_data['total_distance_miles'],
            "carrier": "Spotter AI Logistics",
        }
        eld_logs = generate_all_logs(hos_results['days'], driver_name, trip_meta)

        # 4. Fuel stop waypoints for map display
        fuel_stop_positions = route_engine.get_fuel_stop_positions(
            route_data['route_polyline'],
            fuel_stops_count
        )

        # 5. Save to MongoDB
        trip = Trip(
            user_id=user_id,
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
        try:
            trip.save()
        except Exception as e:
            logger.warning(f"Could not save trip to MongoDB: {e}")

        # 6. Build response
        drive_hours_used = sum(d['total_driving_hours'] for d in hos_results['days'])

        return Response({
            "trip_id": trip.trip_id,
            "route": {
                "distance_mi": route_data['total_distance_miles'],
                "duration_hr": route_data['total_duration_hours'],
                "polyline": route_data['route_polyline'],
                "fuel_stop_positions": fuel_stop_positions,
                "start_coords": start_coords,
                "pickup_coords": pickup_coords,
                "dropoff_coords": dropoff_coords,
            },
            "compliance": {
                "is_compliant": hos_results['is_compliant'],
                "violations": hos_results['violations'],
                "days_required": hos_results['total_days'],
                "remaining_cycle_hours": hos_results['remaining_cycle_hours'],
                "drive_hours_used": drive_hours_used,
                "daily_segments": hos_results['days'],
            },
            "eld_logs": eld_logs
        }, status=status.HTTP_200_OK)


class TripListView(APIView):
    """
    GET /api/trips/list/
    """
    @method_decorator(require_auth)
    def get(self, request):
        user_id = request.user_id
        page = int(request.GET.get('page', 1))
        page_size = int(request.GET.get('page_size', 10))
        skip = (page - 1) * page_size

        try:
            trips = Trip.objects.filter(user_id=user_id).order_by('-created_at').skip(skip).limit(page_size)
            total = Trip.objects.filter(user_id=user_id).count()

            result = []
            for trip in trips:
                result.append({
                    "trip_id": trip.trip_id,
                    "current_location": trip.current_location,
                    "pickup_location": trip.pickup_location,
                    "dropoff_location": trip.dropoff_location,
                    "total_distance_miles": trip.total_distance_miles,
                    "total_duration_hours": trip.total_duration_hours,
                    "is_compliant": trip.is_compliant,
                    "violation_reasons": trip.violation_reasons,
                    "days_required": len(trip.daily_segments) if trip.daily_segments else 0,
                    "created_at": trip.created_at.isoformat() if trip.created_at else None,
                    "has_eld_logs": bool(trip.eld_logs),
                    "eld_log_count": len(trip.eld_logs) if trip.eld_logs else 0,
                })

            return Response({
                "trips": result,
                "total": total,
                "page": page,
                "page_size": page_size,
                "total_pages": max(1, (total + page_size - 1) // page_size)
            }, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Error fetching trips: {e}")
            return Response({
                "trips": [],
                "total": 0,
                "page": 1,
                "page_size": 10,
                "total_pages": 1,
                "is_mock": False
            }, status=status.HTTP_200_OK)


class TripDetailView(APIView):
    """
    GET /api/trips/<trip_id>/
    """
    @method_decorator(require_auth)
    def get(self, request, trip_id):
        user_id = request.user_id
        try:
            trip = Trip.objects.get(trip_id=trip_id, user_id=user_id)
            return Response({
                "trip_id": trip.trip_id,
                "current_location": trip.current_location,
                "pickup_location": trip.pickup_location,
                "dropoff_location": trip.dropoff_location,
                "current_cycle_used": trip.current_cycle_used,
                "route": {
                    "distance_mi": trip.total_distance_miles,
                    "duration_hr": trip.total_duration_hours,
                    "polyline": trip.route_polyline,
                    "start_coords": trip.start_coords,
                    "pickup_coords": trip.pickup_coords,
                    "dropoff_coords": trip.dropoff_coords,
                },
                "compliance": {
                    "is_compliant": trip.is_compliant,
                    "violations": trip.violation_reasons,
                    "days_required": len(trip.daily_segments) if trip.daily_segments else 0,
                    "remaining_cycle_hours": trip.remaining_drive_hours,
                    "daily_segments": trip.daily_segments,
                },
                "eld_logs": trip.eld_logs,
                "created_at": trip.created_at.isoformat() if trip.created_at else None,
            }, status=status.HTTP_200_OK)
        except Trip.DoesNotExist:
            return Response({"error": "Trip not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error fetching trip {trip_id}: {e}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



