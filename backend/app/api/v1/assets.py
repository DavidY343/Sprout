from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.dependencies import get_current_user_id, get_db
from app.services.assets_service import create_asset, get_user_assets
from app.schemas.asset import AssetCreate, AssetResponse

router = APIRouter()

@router.post("/create", response_model=AssetResponse, status_code=201, summary="Create a new asset")
async def create_new_asset(asset_data: AssetCreate, db: AsyncSession = Depends(get_db)):
    """
    Create a new asset in the system.
    
    Assets are global (not user-specific).
    Checks for duplicates by name, ticker, or ISIN.
    """
    try:
        asset = await create_asset(db, asset_data)
        return asset
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    

@router.get("/user-assets", response_model=list[AssetResponse], summary="Get assets associated with the current user")
async def get_user_all_assets(user_id: int = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    """
    Retrieve all assets that have operations in the accounts of the authenticated user.
    """
    try:
        assets = await get_user_assets(db, user_id)
        return assets
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
