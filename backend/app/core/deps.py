from fastapi import Header, HTTPException, status
from app.services.supabase_client import supabase

def get_current_user(authorization: str = Header(...)):
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials format"
        )
    parts = authorization.split(" ", 1)
    if len(parts) != 2 or not parts[1].strip():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials format"
        )
    token = parts[1]
    try:
        # Verify the JWT token with Supabase Auth
        user_response = supabase.auth.get_user(token)
        if not user_response or not user_response.user:
            raise HTTPException(status_code=401, detail="User not found or token expired")
        return user_response.user
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Could not validate credentials: {str(e)}"
        )


def get_user_id(user) -> str:
    """
    Safely extracts the user id whether 'user' is a Supabase user object
    or a plain dict. Raises 401 if it can't be determined.
    """
    user_id = getattr(user, "id", None) or (
        user.get("id") if isinstance(user, dict) else None
    )
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user session context.",
        )
    return user_id