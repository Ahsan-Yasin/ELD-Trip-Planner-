import logging

import mongoengine
from mongoengine.connection import DEFAULT_CONNECTION_NAME

logger = logging.getLogger(__name__)


def ensure_mongo_connection(mongodb_uri: str, db_name: str = "eld_db") -> None:
    """
    Register MongoEngine's default connection once.

    MongoEngine raises "You have not defined a default connection" when a
    document is queried before this alias exists. Keeping the setup in one
    helper lets settings and app startup share the same idempotent behavior.
    """
    if DEFAULT_CONNECTION_NAME in mongoengine.connection._connection_settings:
        return

    if not mongodb_uri:
        raise ValueError("MONGODB_URI is empty")

    mongoengine.connect(
        db_name,
        alias=DEFAULT_CONNECTION_NAME,
        host=mongodb_uri,
        connect=False,
        serverSelectionTimeoutMS=5000,
    )
    logger.info("MongoDB default connection registered")
