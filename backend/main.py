from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.chat_data import chat_router
from routes.ai_response import response_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat_router, prefix="/api")
app.include_router(response_router, prefix="/api")




