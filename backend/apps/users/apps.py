from django.apps import AppConfig
from django.conf import settings


class UsersConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.users'

    def ready(self):
        from config.mongodb import ensure_mongo_connection

        ensure_mongo_connection(settings.MONGODB_URI)
