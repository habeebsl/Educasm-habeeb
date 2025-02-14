import os
import redis
import json
from dotenv import load_dotenv 

load_dotenv()

redis_client = redis.Redis(
  host=os.getenv("REDIS_HOST"),
  port=os.getenv("REDIS_PORT"),
  password=os.getenv("REDIS_PASSWORD"),
  ssl=True
)

def save_message(session_id: str, role: str, content: str):
    messages = get_messages(session_id)
    messages.append({"role": role, "content": content})
    redis_client.set(session_id, json.dumps(messages))

def get_messages(session_id: str):
    messages = redis_client.get(session_id)
    return json.loads(messages) if messages else []
