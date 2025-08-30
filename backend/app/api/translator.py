from fastapi import APIRouter
from pydantic import BaseModel
from app.services.translator_service import translate_text

router = APIRouter()

class TranslationRequest(BaseModel):
    source_lang: str
    target_lang: str
    text: str

@router.post("/translate")
def translate(req: TranslationRequest):
    result = translate_text(req.source_lang, req.target_lang, req.text)
    return result
