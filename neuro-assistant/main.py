import os
import json
from typing import Any, AsyncGenerator, Dict, List, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel, Field
from dotenv import load_dotenv

load_dotenv()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
MODEL_ID = os.getenv("MODEL_ID", "qwen/qwen3-coder:free")
APP_NAME = os.getenv("APP_NAME", "NeuroAssistant")
REFERER = os.getenv("REFERER", "http://localhost")

if not OPENROUTER_API_KEY:
  raise RuntimeError("OPENROUTER_API_KEY is not set")


class ChatMessage(BaseModel):
  role: str
  content: str


class ChatRequest(BaseModel):
  messages: List[ChatMessage] = Field(..., description="Chat history in OpenAI format")
  stream: bool = True
  temperature: float = 0.7
  max_tokens: Optional[int] = None


app = FastAPI(title=APP_NAME)

# CORS (разрешаем запросы с фронта)
app.add_middleware(
  CORSMiddleware,
  allow_origins=["*"],
  allow_credentials=True,
  allow_methods=["*"],
  allow_headers=["*"],
)


async def stream_openrouter(payload: Dict[str, Any]) -> AsyncGenerator[str, None]:
  headers = {
    "Authorization": f"Bearer {OPENROUTER_API_KEY}",
    "HTTP-Referer": REFERER,
    "X-Title": APP_NAME,
    "Content-Type": "application/json",
  }
  async with httpx.AsyncClient(timeout=None) as client:
    async with client.stream(
      "POST",
      "https://openrouter.ai/api/v1/chat/completions",
      headers=headers,
      json=payload,
    ) as r:
      r.raise_for_status()
      async for chunk in r.aiter_text():
        # Просто прокидываем поток как есть; фронт парсит SSE/чанки
        yield chunk


@app.post("/chat")
async def chat(req: ChatRequest):
  payload = {
    "model": MODEL_ID,
    "messages": [m.dict() for m in req.messages],
    "stream": req.stream,
    "temperature": req.temperature,
  }
  if req.max_tokens:
    payload["max_tokens"] = req.max_tokens

  if req.stream:
    return StreamingResponse(stream_openrouter(payload), media_type="text/event-stream")

  async with httpx.AsyncClient(timeout=None) as client:
    r = await client.post(
      "https://openrouter.ai/api/v1/chat/completions",
      headers={
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "HTTP-Referer": REFERER,
        "X-Title": APP_NAME,
        "Content-Type": "application/json",
      },
      json=payload,
    )
    if r.status_code >= 400:
      raise HTTPException(status_code=r.status_code, detail=r.text)
    return JSONResponse(r.json())


@app.get("/health")
async def health():
  return {"status": "ok", "model": MODEL_ID}


if __name__ == "__main__":
  import uvicorn

  uvicorn.run(
    "main:app",
    host=os.getenv("HOST", "0.0.0.0"),
    port=int(os.getenv("PORT", "8090")),
    reload=True,
  )

