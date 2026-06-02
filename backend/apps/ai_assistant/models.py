from mongoengine import Document, StringField, ListField, DateTimeField
from datetime import datetime

class ChatSession(Document):
    session_id  = StringField()
    messages    = ListField()    # [{role, content, timestamp}]
    trip_id     = StringField()  # optional, for context-aware answers
    created_at  = DateTimeField(default=datetime.utcnow)

    meta = {'collection': 'chat_sessions', 'indexes': ['session_id']}
