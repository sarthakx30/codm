"""Alias endpoints: list and save player aliases."""
from typing import Dict
from fastapi import APIRouter, status
from server.app.repositories import alias_repo

router = APIRouter(prefix="/aliases", tags=["Aliases"])

@router.get("", response_model=Dict[str, str])
async def list_aliases():
    """Retrieve all raw name to canonical name alias mappings."""
    return await alias_repo.get_all_aliases()

@router.post("", status_code=status.HTTP_200_OK)
async def update_aliases(aliases: Dict[str, str]):
    """Save or update alias mappings."""
    await alias_repo.save_aliases_batch(aliases)
    return {"saved": True, "count": len(aliases)}
