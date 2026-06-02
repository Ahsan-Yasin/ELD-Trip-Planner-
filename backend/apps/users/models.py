from mongoengine import Document, StringField, DateTimeField
from datetime import datetime
from uuid import uuid4

class User(Document):
    user_id = StringField(default=lambda: str(uuid4()), unique=True)
    email = StringField(required=True, unique=True)
    password_hash = StringField(required=True)
    created_at = DateTimeField(default=datetime.utcnow)

    meta = {'collection': 'users', 'indexes': ['user_id', 'email']}
