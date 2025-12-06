import uuid
from pathlib import Path

from fastapi import APIRouter, File, UploadFile

from app.core.config import settings

router = APIRouter()


@router.post("/photos")
async def upload_photo(file: UploadFile = File(...)) -> dict[str, str]:
    upload_dir = Path(settings.UPLOAD_DIR)
    upload_dir.mkdir(parents=True, exist_ok=True)

    suffix = Path(file.filename).suffix if file.filename else ""
    stored_name = f"{uuid.uuid4()}{suffix}"
    file_path = upload_dir / stored_name

    content = await file.read()
    file_path.write_bytes(content)

    url = f"/uploads/{stored_name}"
    return {"url": url}
