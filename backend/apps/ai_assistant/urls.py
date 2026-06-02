from django.urls import path
from .views import AIChatView, ChatHistoryView

urlpatterns = [
    path('chat/', AIChatView.as_view(), name='ai_chat'),
    path('chat/<str:session_id>/history/', ChatHistoryView.as_view(), name='chat_history'),
]
