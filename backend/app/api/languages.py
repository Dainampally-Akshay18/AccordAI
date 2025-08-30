from fastapi import APIRouter
from deep_translator import GoogleTranslator

router = APIRouter()

@router.get("/languages")
def get_languages():
    langs = GoogleTranslator().get_supported_languages(as_dict=True)
    return langs
