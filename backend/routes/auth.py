from fastapi import APIRouter, Depends, HTTPException, status
from typing import Annotated
from models.user import UserCreate, UserLogin, UserResponse, Token
from services.auth_service import (
    verify_password, get_password_hash, create_access_token,
    get_user_by_email, create_user_in_db,
    get_current_user, require_role
)

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register_user(
    user_data: UserCreate,
    current_user: Annotated[dict, Depends(require_role("hr"))]
):
    existing = get_user_by_email(user_data.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user_dict = user_data.model_dump()
    user_dict["password_hash"] = get_password_hash(user_dict.pop("password"))

    user_id = create_user_in_db(user_dict)  # balance auto-created inside this function
    return {"message": "User created successfully", "user_id": user_id}

@router.post("/login", response_model=Token)
async def login(user_credentials: UserLogin):
    user = get_user_by_email(user_credentials.email)
    if not user or not verify_password(user_credentials.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Incorrect email or password")

    access_token = create_access_token(
        data={"sub": str(user["user_id"]), "role": user["role"]}
    )
    return {"access_token": access_token, "token_type": "bearer", "role": user["role"]}

@router.get("/me")
async def get_current_user_info(
    current_user: Annotated[dict, Depends(get_current_user)]
):
    return current_user

@router.post("/logout")
async def logout():
    return {"message": "Logged out"}