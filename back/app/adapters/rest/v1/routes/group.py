import uuid
from fastapi import APIRouter, Depends, Body, Path
from fastapi.security import OAuth2PasswordBearer

from app.adapters.rest.v1.controllers.group import GroupController
from app.composites.group_composite import get_controller
from app.domains.group import Group, GroupWithMembers, CreateGroup, GroupMember

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

