"""Match endpoints: list, create, update, delete."""
from typing import Any, Dict, List
from fastapi import APIRouter, HTTPException, status
from server.app.repositories import match_repo
from server.app.schemas import MatchOut, MatchSaveRequest, MatchUpdate

router = APIRouter(prefix="/matches", tags=["Matches"])

@router.get("", response_model=List[MatchOut])
async def list_matches():
    """Retrieve all matches with nested us and them rosters."""
    return await match_repo.get_all_matches()

@router.get("/{match_id}", response_model=MatchOut)
async def get_match(match_id: str):
    """Retrieve a single match by id."""
    match = await match_repo.get_match_by_id(match_id)
    if not match:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Match not found")
    return match

@router.post("", response_model=MatchOut, status_code=status.HTTP_201_CREATED)
async def save_match(req: MatchSaveRequest):
    """Save or update a match, its player rosters, and any alias renames."""
    saved = await match_repo.save_match(req.match, req.renames)
    if not saved:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to save match")
    return saved

@router.patch("/{match_id}", response_model=MatchOut)
async def update_match(match_id: str, update: MatchUpdate):
    """Update match metadata (opponent, tier, game_type)."""
    updated = await match_repo.update_match_metadata(match_id, update)
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Match not found")
    return updated

@router.delete("/{match_id}", status_code=status.HTTP_200_OK)
async def delete_match(match_id: str):
    """Delete a match and its player records."""
    deleted = await match_repo.delete_match(match_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Match not found")
    return {"deleted": True, "id": match_id}
