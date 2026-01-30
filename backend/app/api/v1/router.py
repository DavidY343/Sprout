from fastapi import APIRouter
from app.api.v1.portfolio import router as portfolio_router
from app.api.v1.trades import router as trades_router
from app.api.v1.auth import router as auth_router

api_router = APIRouter()
api_router.include_router(
    portfolio_router,
    prefix="/portfolio",
    tags=["portfolio"]
)


api_router.include_router(
    trades_router,
    prefix="/trades",
    tags=["trades"]
)

api_router.include_router(
    auth_router,
    prefix="/auth",
    tags=["auth"]
)