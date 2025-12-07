import asyncio
import json
import uuid

import requests
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.security import OAuth2PasswordBearer

from app.composites.engagement_composite import get_service as get_engagement_service
from app.composites.history_composite import get_service as get_history_service
from app.composites.token_composite import get_service as get_token_service
from app.core.config import settings
from app.service.engagement_service import EngagementService
from app.service.history_service import HistoryService
from app.service.token_service import TokenService

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="ya s ruletom na balkone")


@router.get("/analyze")
async def analyze_engagements(
    video_id: uuid.UUID = Query(..., description="Video ID"),
    engagement_service: EngagementService = Depends(get_engagement_service),
    history_service: HistoryService = Depends(get_history_service),
    token_service: TokenService = Depends(get_token_service),
    token: str = Depends(oauth2_scheme),
):
    try:
        payload = token_service.validate_access_token(token)
        user_id = uuid.UUID(payload.sub)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid access token")

    engagements = await engagement_service.list_by_video(video_id=video_id)
    if not engagements:
        raise HTTPException(status_code=404, detail="Engagements not found for provided video_id")

    metrics = [
        {
            "timecode": engagement.timecode,
            "relaxation": engagement.relaxation,
            "concentration": engagement.concentration,
        }
        for engagement in engagements
    ]

    prompt = (
        "Ты аналитик вовлеченности пользователя в видео. "
        "Получишь список метрик с полями timecode (он в секундах - переведи в минуты:секунды), relaxation и concentration для одного видео. "
        "Кратко опиши, где наблюдаются максимальные и минимальные значения вовлеченности (ориентируйся на concentration), "
        "а также как на это влияет relaxation. Укажи ключевые таймкоды и дай лаконичные выводы."
        f"\n\nДанные: {json.dumps(metrics, ensure_ascii=False)}"
    )

    payload = {
        "messages": [
            {
                "content": prompt,
                "role": "user",
            }
        ],
        "temperature": 0.7,
        "stream": False,
    }

    response = await asyncio.to_thread(
        requests.post,
        f"{settings.AGENT_HOST}/chat",
        json=payload,
        timeout=30,
    )

    if response.status_code >= 400:
        raise HTTPException(status_code=502, detail=f"Upstream chat error: {response.text}")

    response_json = response.json()
    try:
        analysis_message = response_json["choices"][0]["message"]["content"]
    except (KeyError, IndexError, TypeError):
        raise HTTPException(status_code=502, detail="Unexpected upstream response structure")

    await history_service.save_entry(
        user_id=user_id,
        video_id=video_id,
        analysis=analysis_message,
    )

    return {"analysis": analysis_message}