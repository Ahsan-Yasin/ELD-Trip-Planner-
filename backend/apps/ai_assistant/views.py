from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import ChatSession
from uuid import uuid4

class AIChatView(APIView):
    def post(self, request):
        message = request.data.get('message', '')
        session_id = request.data.get('session_id', str(uuid4()))
        
        # Mocking the AI response since we are skipping full RAG for now unless we add ChromaDB
        response_text = f"I've received your message: '{message}'. According to FMCSA rules, you must take a 30-minute break after 8 hours of driving."
        
        # Save to Mongo
        try:
            session = ChatSession.objects.get(session_id=session_id)
        except ChatSession.DoesNotExist:
            session = ChatSession(session_id=session_id)
            
        session.messages.append({"role": "user", "content": message})
        session.messages.append({"role": "assistant", "content": response_text})
        session.save()
        
        return Response({
            "session_id": session.session_id,
            "response": response_text
        }, status=status.HTTP_200_OK)
