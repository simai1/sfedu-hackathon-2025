from fastapi import APIRouter, Depends, Body, Query
from fastapi.security import OAuth2PasswordBearer

from app.adapters.rest.v1.controllers.organization import OrganizationController
from app.composites.organization_composite import get_controller
from app.domains.organization import Organization, JoinOrganizationResponse, OrganizationMember
from app.domains.user import User

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="ya s ruletom na balkone")


@router.post("/", response_model=Organization)
async def create_organization(
    name: str = Body(..., embed=True),
    code: str | None = Body(None, embed=True),
    token: str = Depends(oauth2_scheme),
    controller: OrganizationController = Depends(get_controller),
):
    return await controller.create(access_token=token, name=name, code=code)


@router.post("/join", response_model=JoinOrganizationResponse)
async def join_organization(
    code: str = Body(..., embed=True),
    token: str = Depends(oauth2_scheme),
    controller: OrganizationController = Depends(get_controller),
):
    return await controller.join(access_token=token, code=code)


@router.get("/members", response_model=list[OrganizationMember])
async def list_members(
    token: str = Depends(oauth2_scheme),
    controller: OrganizationController = Depends(get_controller),
):
    return await controller.members(access_token=token)

