"""Auth endpoints: me and logout. Signup/login handled by Supabase Auth on the frontend."""

from fastapi import APIRouter, Depends, Response

from backend.gateway.middleware.auth import ProfileData, get_current_user
from backend.shared.schemas import UserOut

router = APIRouter()


@router.get("/me")
async def me(user: ProfileData = Depends(get_current_user)):
    return {
        "user": UserOut(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            role=user.role,
            org_id=user.org_id,
            org_name=user.org.name,
            org_slug=user.org.slug,
            org_plan=user.org.plan,
        ).model_dump()
    }


@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie("mazou_session")
    return {"ok": True}
