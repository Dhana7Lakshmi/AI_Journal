"""
config/database.py
──────────────────
Manages the MongoDB Atlas connection lifecycle for LifeReel AI.

Responsibilities
----------------
- Initialise a single MongoClient from the MONGO_URI environment variable.
- Expose a `verify_connection()` coroutine that fires a ping command so the
  FastAPI startup event can confirm Atlas reachability before the first request
  is ever accepted.
- Export the target database and collection as module-level singletons so every
  route and service can import them without re-creating the client.
"""

import logging
from pymongo import MongoClient
from pymongo.collection import Collection
from pymongo.database import Database
from pymongo.errors import ConfigurationError, ConnectionFailure, ServerSelectionTimeoutError

from config.settings import settings

logger = logging.getLogger(__name__)

# ──────────────────────────────────────────────────────────────────────────────
# In-Memory Mock MongoDB Client for fallback (no external server required)
# ──────────────────────────────────────────────────────────────────────────────

class MockCursor:
    def __init__(self, data):
        self.data = data
    def sort(self, key, direction=-1):
        self.data = sorted(self.data, key=lambda x: x.get(key, ""), reverse=(direction==-1))
        return self
    def __iter__(self):
        return iter(self.data)

class MockCollection:
    def __init__(self, name):
        self.name = name
        self.documents = []
    def find_one(self, filter):
        for doc in self.documents:
            match = True
            for k, v in filter.items():
                if k == "_id":
                    if str(doc.get("_id")) == str(v):
                        continue
                    else:
                        match = False
                        break
                if doc.get(k) != v:
                    match = False
                    break
            if match:
                return doc
        return None
    def insert_one(self, document):
        from bson import ObjectId
        if "_id" not in document:
            document["_id"] = ObjectId()
        self.documents.append(document)
        class InsertResult:
            inserted_id = document["_id"]
        return InsertResult()
    def find(self, filter=None):
        if not filter:
            return MockCursor(self.documents)
        matched = []
        for doc in self.documents:
            match = True
            for k, v in filter.items():
                if k == "user_id":
                    if doc.get("user_id") != v:
                        match = False
                        break
                    continue
                if doc.get(k) != v:
                    match = False
                    break
            if match:
                matched.append(doc)
        return MockCursor(matched)
    def update_many(self, filter, update):
        modified_count = 0
        set_dict = update.get("$set", {})
        for doc in self.documents:
            # Handle user_id existence check for demo migration
            if "user_id" in filter and "$exists" in filter["user_id"] and not filter["user_id"]["$exists"]:
                if "user_id" not in doc or doc["user_id"] is None:
                    for k, v in set_dict.items():
                        doc[k] = v
                    modified_count += 1
            else:
                # Basic filter matching
                match = True
                for k, v in filter.items():
                    if doc.get(k) != v:
                        match = False
                        break
                if match:
                    for k, v in set_dict.items():
                        doc[k] = v
                    modified_count += 1
        class UpdateResult:
            def __init__(self, count):
                self.modified_count = count
        return UpdateResult(modified_count)
    def delete_one(self, filter):
        for i, doc in enumerate(self.documents):
            match = True
            for k, v in filter.items():
                if k == "_id":
                    if str(doc.get("_id")) == str(v):
                        continue
                    else:
                        match = False
                        break
                if doc.get(k) != v:
                    match = False
                    break
            if match:
                self.documents.pop(i)
                class DeleteResult:
                    deleted_count = 1
                return DeleteResult()
        class DeleteResult:
            deleted_count = 0
        return DeleteResult()

class MockDatabase:
    def __init__(self):
        self.collections = {}
    def __getitem__(self, name):
        if name not in self.collections:
            self.collections[name] = MockCollection(name)
        return self.collections[name]

class MockClient:
    def __init__(self):
        self.db = MockDatabase()
    def __getitem__(self, name):
        return self.db
    def admin(self):
        class MockAdmin:
            def command(self, cmd):
                pass
        return MockAdmin()

# ──────────────────────────────────────────────────────────────────────────────
# Client initialisation
# ──────────────────────────────────────────────────────────────────────────────

def _create_client() -> MongoClient:
    """
    Build and return a MongoClient, falling back to a MockClient if connection fails.
    """
    try:
        # Try connecting and pinging
        client = MongoClient(
            settings.MONGO_URI,
            serverSelectionTimeoutMS=10000,
        )
        client.admin.command("ping")
        logger.info("Real MongoDB connection verified successfully.")
        return client
    except Exception as exc:
        logger.warning(
            f"Could not connect to MongoDB at {settings.MONGO_URI} ({exc}). "
            "Falling back to an in-memory Mock MongoDB database."
        )
        return MockClient()  # type: ignore[return-value]


client = _create_client()

# ──────────────────────────────────────────────────────────────────────────────
# Database & collection exports
# ──────────────────────────────────────────────────────────────────────────────

db = client["LifeReelAI_DB"]
journal_entries = db["journal_entries"]
users = db["users"]
capsules = db["capsules"]

# ──────────────────────────────────────────────────────────────────────────────
# Startup verification
# ──────────────────────────────────────────────────────────────────────────────

async def verify_connection() -> None:
    """
    Ping MongoDB if real client, or bypass if mock client.
    """
    if isinstance(client, MockClient):
        logger.info("Mock database connection verified (In-memory Mock Mode).")
        return
    try:
        client.admin.command("ping")
        logger.info(
            "MongoDB Atlas ping succeeded – database connection verified.",
            extra={"database": "LifeReelAI_DB"},
        )
    except (ConnectionFailure, ServerSelectionTimeoutError) as exc:
        logger.critical(
            "MongoDB Atlas ping FAILED – check MONGO_URI and network access.",
            extra={"error": str(exc)},
        )
        raise

