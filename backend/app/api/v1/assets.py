from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.core.dependencies import get_current_user_id, get_db
from app.services.assets_service import create_asset, get_user_assets, get_all_assets_with_prices
from app.schemas.asset import AssetCreate, AssetResponse

router = APIRouter()

@router.post("/create", response_model=AssetResponse, status_code=201, summary="Create a new asset")
async def create_new_asset(asset_data: AssetCreate, user_id: int = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    """
    Create a new asset in the system.
    
    Assets are global (not user-specific).
    Checks for duplicates by name, ticker, or ISIN.
    """
    try:
        asset = await create_asset(db, asset_data, user_id)
        return asset
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/with-prices", summary="Get all assets with latest price from worker")
async def get_assets_with_prices(user_id: int = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    """Returns assets visible to the current user, with their latest price."""
    try:
        return await get_all_assets_with_prices(db, user_id)
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


@router.delete("/{asset_id}", summary="Remove an asset from user — deletes all associated operations and transactions")
async def remove_asset_from_user(asset_id: int, user_id: int = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    """
    Completely removes an asset from the user's portfolio:
    - Deletes all operations for this asset in user's accounts
    - Deletes the corresponding 'Inversión' transactions
    - Removes user_assets visibility entry
    Does NOT delete the asset itself (other users may have it).
    """
    try:
        # Get user's account IDs
        result = await db.execute(
            text("SELECT account_id FROM accounts WHERE user_id = :uid AND is_active = TRUE"),
            {"uid": user_id}
        )
        account_ids = [row[0] for row in result.fetchall()]
        if not account_ids:
            raise ValueError("No accounts found")

        # Delete transactions linked to operations of this asset (category='Inversión')
        await db.execute(
            text("""
                DELETE FROM transactions
                WHERE account_id = ANY(:aids)
                  AND category = 'Inversión'
                  AND date IN (
                      SELECT date FROM operations
                      WHERE asset_id = :asset_id AND account_id = ANY(:aids)
                  )
                  AND amount IN (
                      SELECT quantity * price + COALESCE(fees, 0)
                      FROM operations
                      WHERE asset_id = :asset_id AND account_id = ANY(:aids)
                  )
            """),
            {"aids": account_ids, "asset_id": asset_id}
        )

        # Delete all operations for this asset in user's accounts
        await db.execute(
            text("DELETE FROM operations WHERE asset_id = :asset_id AND account_id = ANY(:aids)"),
            {"aids": account_ids, "asset_id": asset_id}
        )

        # Remove visibility
        await db.execute(
            text("DELETE FROM user_assets WHERE user_id = :uid AND asset_id = :asset_id"),
            {"uid": user_id, "asset_id": asset_id}
        )

        await db.commit()
        return {"detail": "Asset removed successfully"}
    except ValueError as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Error removing asset: {str(e)}")
