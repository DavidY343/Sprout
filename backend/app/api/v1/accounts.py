from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.dependencies import get_current_user_id, get_db
from app.services.account_service import create_account, get_user_accounts
from app.schemas.account import AccountCreate, AccountResponse

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