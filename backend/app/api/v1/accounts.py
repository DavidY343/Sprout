from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.dependencies import get_current_user_id, get_db
from app.services.account_service import create_account, get_user_accounts
from app.services.backfill_service import backfill_account_prices, backfill_portfolio_prices
from app.schemas.account import AccountCreate, AccountResponse, AccountUpdate
from sqlalchemy import text

router = APIRouter()

@router.post("/create", response_model=AccountResponse, status_code=201, summary="Create a new account for the current user")
async def create_new_account(account_data: AccountCreate, user_id: int = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    """
    Create a new account for the authenticated user.
    
    Accounts are user-specific.
    Checks for duplicates by name for the same user.
    """
    try:
        account = await create_account(db, account_data, user_id)
        from app.core.cache import clear_user_cache
        clear_user_cache(user_id)
        return account
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    
@router.get("/user-accounts", response_model=list[AccountResponse], summary="Get accounts associated with the current user")
async def get_user_all_accounts(user_id: int = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    """
    Retrieve all active accounts for the authenticated user.
    """
    try:
        accounts = await get_user_accounts(db, user_id)
        return accounts
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.patch("/{account_id}", response_model=AccountResponse, summary="Update account details")
async def update_account(account_id: int, update: AccountUpdate, user_id: int = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    """Update account details (name, type)."""
    check = await db.execute(
        text("SELECT 1 FROM accounts WHERE user_id = :uid AND account_id = :aid"),
        {"uid": user_id, "aid": account_id}
    )
    if not check.fetchone():
        raise HTTPException(status_code=404, detail="Account not found or not yours")

    sets = []
    params: dict = {"aid": account_id}
    if update.name is not None:
        sets.append("name = :name")
        params["name"] = update.name
    if update.type is not None:
        sets.append("type = :type")
        params["type"] = update.type
    if not sets:
        raise HTTPException(status_code=400, detail="Nothing to update")

    await db.execute(text(f"UPDATE accounts SET {', '.join(sets)} WHERE account_id = :aid"), params)
    await db.commit()
    from app.core.cache import clear_user_cache
    clear_user_cache(user_id)

    result = await db.execute(text("SELECT * FROM accounts WHERE account_id = :aid"), {"aid": account_id})
    row = result.mappings().fetchone()
    return dict(row)

@router.delete("/{account_id}", summary="Delete an account and cascade delete operations and transactions")
async def delete_account(account_id: int, user_id: int = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    """Delete an account completely including all associated transactions and operations."""
    try:
        check = await db.execute(
            text("SELECT 1 FROM accounts WHERE user_id = :uid AND account_id = :aid"),
            {"uid": user_id, "aid": account_id}
        )
        if not check.fetchone():
            raise HTTPException(status_code=404, detail="Account not found or not yours")

        # Cascade deletes
        await db.execute(text("DELETE FROM transactions WHERE account_id = :aid"), {"aid": account_id})
        await db.execute(text("DELETE FROM operations WHERE account_id = :aid"), {"aid": account_id})
        await db.execute(text("DELETE FROM accounts WHERE account_id = :aid"), {"aid": account_id})
        await db.commit()
        from app.core.cache import clear_user_cache
        clear_user_cache(user_id)
        return {"detail": "Account deleted successfully"}
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{account_id}/sync", summary="Sincronizar histórico de precios para todos los activos de la cuenta")
async def sync_account_prices(
    account_id: int, 
    background_tasks: BackgroundTasks,
    user_id: int = Depends(get_current_user_id), 
    db: AsyncSession = Depends(get_db)
):
    """
    Inicia un proceso en segundo plano para obtener el histórico de precios de Yahoo Finance
    de todos los activos asociados a esta cuenta desde la fecha de su primera operación.
    """
    check = await db.execute(
        text("SELECT 1 FROM accounts WHERE user_id = :uid AND account_id = :aid"),
        {"uid": user_id, "aid": account_id}
    )
    if not check.fetchone():
        raise HTTPException(status_code=404, detail="Cuenta no encontrada o no pertenece al usuario")

    background_tasks.add_task(backfill_account_prices, account_id)
    return {"detail": "Sincronización del histórico iniciada en segundo plano."}

@router.post("/sync-all", summary="Sincronizar histórico de precios de toda la cartera del usuario")
async def sync_all_portfolio_prices(
    background_tasks: BackgroundTasks,
    user_id: int = Depends(get_current_user_id), 
    db: AsyncSession = Depends(get_db)
):
    """
    Inicia un proceso en segundo plano para obtener el histórico de precios de Yahoo Finance
    de todos los activos asociados a todas las cuentas del usuario.
    """
    background_tasks.add_task(backfill_portfolio_prices, user_id)
    return {"detail": "Sincronización de toda la cartera iniciada en segundo plano."}