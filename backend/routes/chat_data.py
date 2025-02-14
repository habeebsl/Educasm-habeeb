from fastapi import APIRouter
from utils.redis_utils import get_messages


chat_router = APIRouter()

@chat_router.get("/history/{session_id}")
async def get_hat_history(session_id: str):
    messages = get_messages(session_id)
    return {"messages": messages}