from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse


def health_check(request):
    """Quick health check endpoint."""
    return JsonResponse({"status": "ok", "service": "ELD Trip Planner API"})


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/users/', include('apps.users.urls')),
    path('api/trips/', include('apps.trips.urls')),
    path('api/ai/', include('apps.ai_assistant.urls')),
    path('health/', health_check, name='health_check'),
]
