from mongoengine import Document, StringField, ListField, DateTimeField, DictField
from datetime import datetime

class ChatSession(Document):
    session_id  = StringField(required=True, unique=True)
    user_id     = StringField(required=True)
    messages    = ListField(DictField())    # [{role, content, timestamp}]
    trip_id     = StringField()  # optional, for context-aware answers
    created_at  = DateTimeField(default=datetime.utcnow)

    meta = {'collection': 'chat_sessions', 'indexes': ['session_id', 'user_id']}
