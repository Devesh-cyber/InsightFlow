from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr
from app.services.supabase_client import supabase

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

class AuthSchema(BaseModel):
    email: EmailStr
    password: str

@router.post("/register")
def register_user(payload: AuthSchema):
    try:
        response = supabase.auth.sign_up({
            "email": payload.email,
            "password": payload.password
        })
        return {"message": "Registration successful. Please check your email for verification if enabled.", "user": response.user}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/login")
def login_user(payload: AuthSchema):
    try:
        response = supabase.auth.sign_in_with_password({
            "email": payload.email,
            "password": payload.password
        })
        return {
            "access_token": response.session.access_token,
            "refresh_token": response.session.refresh_token,
            "token_type": "bearer"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )