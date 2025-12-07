import uuid

from fastapi import APIRouter, Depends, File, UploadFile

from app.adapters.rest.v1.controllers.audio import AudioController
from app.composites.audio_composite import get_controller
from app.domains.audio import Audio


router = APIRouter()


@router.post("/audios", response_model=Audio)
async def upload_audio(
    file: UploadFile = File(...),
    controller: AudioController = Depends(get_controller),
):
    content = await file.read()
    return await controller.upload(file.filename, content)


@router.get("/audios/{audio_id}", response_model=Audio)
async def get_audio(
    audio_id: uuid.UUID,
    controller: AudioController = Depends(get_controller),
):
    return await controller.get_one(audio_id)


@router.get("/audios", response_model=list[Audio])
async def list_audios(
    controller: AudioController = Depends(get_controller),
):
    return await controller.get_all()

