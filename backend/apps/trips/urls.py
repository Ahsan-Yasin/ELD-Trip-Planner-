from django.urls import path
from .views import CalculateTripView, TripListView, TripDetailView

urlpatterns = [
    path('calculate/', CalculateTripView.as_view(), name='calculate_trip'),
    path('list/', TripListView.as_view(), name='trip_list'),
    path('<str:trip_id>/', TripDetailView.as_view(), name='trip_detail'),
]
