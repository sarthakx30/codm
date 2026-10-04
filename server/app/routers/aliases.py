"""Alias endpoints: list, save, and delete player aliases."""
from typing import Any, Dict, List
from fastapi import APIRouter, status
from server.app.repositories import alias_repo

router = APIRouter(prefix="/aliases", tags=["Aliases"])

@router.get("", response_model=Dict[str, str])
async def list_aliases():
    """Retrieve all raw name to canonical name alias mappings."""
    return await alias_repo.get_all_aliases()

@router.get("/records", response_model=List[Dict[str, Any]])
async def list_alias_records():
    """Retrieve all alias records with metadata."""
    return await alias_repo.get_all_alias_records()

@router.post("", status_code=status.HTTP_200_OK)
async def update_aliases(aliases: Dict[str, str]):
    """Save or update alias mappings."""
    await alias_repo.save_aliases_batch(aliases)
    return {"saved": True, "count": len(aliases)}

@router.delete("/{raw_name}", status_code=status.HTTP_200_OK)
async def delete_alias(raw_name: str):
    """Delete a raw name to canonical name alias mapping."""
    await alias_repo.delete_alias(raw_name)
    return {"deleted": True, "raw_name": raw_name}
