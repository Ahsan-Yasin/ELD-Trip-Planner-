from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from uuid import uuid4
import logging

from django.utils.decorators import method_decorator
from apps.users.auth import require_auth
from .models import ChatSession
from .rag_engine import answer_compliance_question

logger = logging.getLogger(__name__)


class AIChatView(APIView):
    """
    POST /api/ai/chat/
    Body: { "message": str, "session_id": str (optional), "trip_context": dict (optional) }
    Header: Authorization: Bearer <token>
    """

    @method_decorator(require_auth)
    def post(self, request):
        user_id = request.user_id
        message = request.data.get('message', '').strip()
        session_id = request.data.get('session_id', '') or str(uuid4())
        trip_context = request.data.get('trip_context', None)

        if not message:
            return Response(
                {"error": "Message cannot be empty"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # --- Load or create session ---
        try:
            session = ChatSession.objects.get(session_id=session_id, user_id=user_id)
        except ChatSession.DoesNotExist:
            session = ChatSession(session_id=session_id, user_id=user_id)
        except Exception as e:
            # Fallback for when MongoDB is offline
            logger.warning(f"Could not load session from MongoDB: {e}")
            session = None

        # --- Get conversation history for context ---
        if session:
            conversation_history = list(session.messages) if session.messages else []
        else:
            conversation_history = []

        # --- Call RAG pipeline ---
        try:
            ai_response = answer_compliance_question(
                user_message=message,
                conversation_history=conversation_history,
                trip_context=trip_context
            )
        except Exception as e:
            logger.error(f"RAG pipeline error: {e}")
            ai_response = (
                "I'm sorry, I encountered an error processing your question. "
                "Please ensure the backend services are running and try again. "
                "For immediate FMCSA guidance, visit fmcsa.dot.gov."
            )

        # --- Save messages to session ---
        if session:
            session.messages.append({"role": "user", "content": message})
            session.messages.append({"role": "assistant", "content": ai_response})

            try:
                session.save()
            except Exception as e:
                logger.warning(f"Could not save chat session to MongoDB: {e}")

        return Response({
            "session_id": session_id,
            "response": ai_response
        }, status=status.HTTP_200_OK)


class ChatHistoryView(APIView):
    """
    GET /api/ai/chat/<session_id>/history/
    """
    @method_decorator(require_auth)
    def get(self, request, session_id):
        user_id = request.user_id
        try:
            session = ChatSession.objects.get(session_id=session_id, user_id=user_id)
            return Response({
                "session_id": session_id,
                "messages": session.messages
            }, status=status.HTTP_200_OK)
        except ChatSession.DoesNotExist:
            return Response(
                {"session_id": session_id, "messages": []},
                status=status.HTTP_200_OK
            )
