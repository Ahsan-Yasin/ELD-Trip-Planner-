import bcrypt
import jwt
import datetime
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
import logging
from .models import User

logger = logging.getLogger(__name__)

# Basic JWT config
JWT_SECRET = settings.SECRET_KEY
JWT_ALGORITHM = 'HS256'
JWT_EXP_DELTA_DAYS = 7


def create_token(user_id: str, email: str) -> str:
    payload = {
        'user_id': user_id,
        'email': email,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(days=JWT_EXP_DELTA_DAYS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_token(token: str) -> dict:
    return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])


class RegisterView(APIView):
    """
    POST /api/users/register/
    Body: { "email": "...", "password": "..." }
    """
    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        password = request.data.get('password', '')

        if not email or not password:
            return Response({"error": "Email and password required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Check if user already exists
            if User.objects(email=email).first():
                return Response({"error": "Email already registered"}, status=status.HTTP_400_BAD_REQUEST)

            # Hash password and create user
            hashed_pw = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            user = User(email=email, password_hash=hashed_pw)
            user.save()

            token = create_token(str(user.user_id), user.email)
            return Response({
                "token": token,
                "user": {"id": str(user.user_id), "email": user.email}
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            logger.error(f"Registration error: {e}", exc_info=True)
            return Response({"error": "Internal server error"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class LoginView(APIView):
    """
    POST /api/users/login/
    Body: { "email": "...", "password": "..." }
    """
    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        password = request.data.get('password', '')

        if not email or not password:
            return Response({"error": "Email and password required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects(email=email).first()
            if not user:
                return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)

            # Verify password
            stored_hash = user.password_hash if isinstance(user.password_hash, bytes) else user.password_hash.encode('utf-8')
            if not bcrypt.checkpw(password.encode('utf-8'), stored_hash):
                return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)

            token = create_token(str(user.user_id), user.email)
            return Response({
                "token": token,
                "user": {"id": str(user.user_id), "email": user.email}
            }, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Login error: {e}", exc_info=True)
            return Response({"error": "Internal server error"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class MeView(APIView):
    """
    GET /api/users/me/
    Header: Authorization: Bearer <token>
    """
    def get(self, request):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return Response({"error": "Missing or invalid token"}, status=status.HTTP_401_UNAUTHORIZED)

        token = auth_header.split(' ')[1]
        try:
            payload = decode_token(token)
            user_id = payload.get('user_id')
            user = User.objects.get(user_id=user_id)
            return Response({
                "user": {"id": user.user_id, "email": user.email}
            }, status=status.HTTP_200_OK)
        except jwt.ExpiredSignatureError:
            return Response({"error": "Token expired"}, status=status.HTTP_401_UNAUTHORIZED)
        except jwt.InvalidTokenError:
            return Response({"error": "Invalid token"}, status=status.HTTP_401_UNAUTHORIZED)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
