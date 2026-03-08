"""Admin authentication guard: requires superadmin role."""

from fastapi import Depends, HTTPException

from backend.gateway.middleware.auth import ProfileData, get_current_user


async def require_superadmin(user: ProfileData = Depends(get_current_user)) -> ProfileData:
    """Dependency that ensures the current user is a superadmin."""
    if not user.is_superadmin:
        raise HTTPException(status_code=403, detail="Superadmin access required")
    return user
