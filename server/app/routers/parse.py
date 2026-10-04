"""Parse endpoint: accepts match screenshot and returns extracted structured data."""
from fastapi import APIRouter, File, HTTPException, Request, UploadFile, status
from server.app.repositories import alias_repo, match_repo
from server.app.schemas import ParseResponse
from server.app.services.gemini_ocr import parse_scoreboard_image

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

    if len(image_bytes) > 15_000_000:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Image exceeds 15MB limit"
        )

    aliases = await alias_repo.get_all_aliases()

    try:
        parsed_match = parse_scoreboard_image(image_bytes, mime_type=mime, aliases=aliases)
    except RuntimeError as e:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"OCR error: {e}")

    # Check for duplicate
    existing = await match_repo.get_match_by_id(parsed_match["id"])
    is_duplicate = existing is not None

    return ParseResponse(
        match=parsed_match,
        duplicate=is_duplicate
    )
