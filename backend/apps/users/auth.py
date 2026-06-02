from rest_framework.response import Response
from rest_framework import status
import jwt
from django.conf import settings
from functools import wraps
import logging

logger = logging.getLogger(__name__)

JWT_SECRET = settings.SECRET_KEY
JWT_ALGORITHM = 'HS256'

def require_auth(view_func):
    """
    Decorator for APIViews to require a valid JWT token.
    Extracts user_id and injects it into request.user_id.
    """
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return Response({"error": "Unauthorized. Missing or invalid token"}, status=status.HTTP_401_UNAUTHORIZED)
        
        token = auth_header.split(' ')[1]
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            request.user_id = payload.get('user_id')
        except jwt.ExpiredSignatureError:
            return Response({"error": "Token expired"}, status=status.HTTP_401_UNAUTHORIZED)
        except jwt.InvalidTokenError:
            return Response({"error": "Invalid token"}, status=status.HTTP_401_UNAUTHORIZED)
        except Exception as e:
            logger.error(f"Auth error: {e}")
            return Response({"error": "Authentication error"}, status=status.HTTP_401_UNAUTHORIZED)

        return view_func(request, *args, **kwargs)

    return wrapper
