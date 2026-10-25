"""Parse endpoint: accepts match screenshot and returns extracted structured data."""
import logging

from fastapi import APIRouter, File, HTTPException, Request, UploadFile, status
from fastapi.concurrency import run_in_threadpool

from server.app.config import MAX_UPLOAD_BYTES
from server.app.repositories import alias_repo, match_repo
from server.app.schemas import ParseResponse
from server.app.services.gemini_ocr import parse_scoreboard_image

logger = logging.getLogger("codm.parse")

router = APIRouter(prefix="/parse", tags=["OCR Ingestion"])

@router.post("", response_model=ParseResponse)
async def parse_screenshot(request: Request, file: UploadFile = File(None)):
    """Parse scoreboard screenshot via Gemini OCR and detect duplicates."""
    content_type = request.headers.get("content-type", "")
    image_bytes = None
    mime = "image/jpeg"

    # Support multipart file upload
    if file is not None:
        image_bytes = await file.read()
        mime = file.content_type or "image/jpeg"
    # Support direct binary body upload (for backward compatibility with old frontend)
    elif content_type.startswith("image/"):
        image_bytes = await request.body()
        mime = content_type
    else:
        # Check if raw body is non-empty
        raw_body = await request.body()
        if raw_body and len(raw_body) > 100:
            image_bytes = raw_body
            mime = "image/jpeg"

    if not image_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No screenshot image data provided. Send as multipart form-data or raw image bytes."
        )

    if len(image_bytes) > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Image exceeds {MAX_UPLOAD_BYTES // 1_000_000}MB limit"
        )

    aliases = await alias_repo.get_all_aliases()

    try:
        # The Gemini client is synchronous. Run it off the event loop.
        parsed_match = await run_in_threadpool(
            parse_scoreboard_image,
            image_bytes,
            mime_type=mime,
            aliases=aliases
        )
    except RuntimeError as e:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e)) from e
    except Exception as e:
        logger.exception("Unexpected OCR failure")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="OCR failed. Check the server logs."
        ) from e

    # Check for duplicate
    existing = await match_repo.get_match_by_id(parsed_match["id"])
    is_duplicate = existing is not None

    return ParseResponse(
        match=parsed_match,
        duplicate=is_duplicate
    )
