import uuid

from fastapi import APIRouter, Depends, File, UploadFile

from app.adapters.rest.v1.controllers.video import VideoController
from app.composites.video_composite import get_controller
from app.domains.video import Video


router = APIRouter()


@router.post("/videos", response_model=Video)
async def upload_video(
    file: UploadFile = File(...),
    controller: VideoController = Depends(get_controller),
):
    content = await file.read()
    return await controller.upload(file.filename, content)


@router.get("/videos/{video_id}", response_model=Video)
async def get_video(
    video_id: uuid.UUID,
    controller: VideoController = Depends(get_controller),
):
    return await controller.get_one(video_id)


@router.get("/videos", response_model=list[Video])
async def list_videos(
    controller: VideoController = Depends(get_controller),
):
    return await controller.get_all()
