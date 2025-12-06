import uuid
from fastapi import APIRouter, Depends, Body, Path, UploadFile, File
from fastapi.security import OAuth2PasswordBearer

from app.adapters.rest.v1.controllers.group import GroupController
from app.composites.group_composite import get_controller
from app.domains.group import Group, GroupWithMembers, CreateGroup, GroupMember, GroupSession

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="ya s ruletom na balkone")


@router.post("/", response_model=Group)
async def create_group(
    payload: CreateGroup = Body(...),
    token: str = Depends(oauth2_scheme),
    controller: GroupController = Depends(get_controller),
):
    return await controller.create(access_token=token, data=payload)


@router.get("/", response_model=list[GroupWithMembers])
async def list_groups(
    token: str = Depends(oauth2_scheme),
    controller: GroupController = Depends(get_controller),
):
    return await controller.list(access_token=token)


@router.post("/{group_id}/members", response_model=GroupMember)
async def add_member(
    group_id: uuid.UUID = Path(...),
    member_user_id: uuid.UUID = Body(..., embed=True),
    token: str = Depends(oauth2_scheme),
    controller: GroupController = Depends(get_controller),
):
    return await controller.add_member(access_token=token, group_id=group_id, member_user_id=member_user_id)


@router.post("/{group_id}/sessions", response_model=GroupSession)
async def add_session(
    group_id: uuid.UUID = Path(...),
    file: UploadFile = File(...),
    token: str = Depends(oauth2_scheme),
    controller: GroupController = Depends(get_controller),
):
    content = await file.read()
    return await controller.add_session(access_token=token, group_id=group_id, filename=file.filename, content=content)


@router.delete("/{group_id}/sessions", status_code=204)
async def delete_sessions(
    group_id: uuid.UUID = Path(...),
    token: str = Depends(oauth2_scheme),
    controller: GroupController = Depends(get_controller),
):
    await controller.delete_sessions(access_token=token, group_id=group_id)


@router.get("/my", response_model=list[GroupWithMembers])
async def list_my_groups(
    token: str = Depends(oauth2_scheme),
    controller: GroupController = Depends(get_controller),
):
    return await controller.list_for_user(access_token=token)

