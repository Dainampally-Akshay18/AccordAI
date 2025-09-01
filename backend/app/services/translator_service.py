from deep_translator import GoogleTranslator

def translate_text(source_lang: str, target_lang: str, text: str) -> str:
    try:
        translator = GoogleTranslator(source=source_lang, target=target_lang)
        print("Translator initialized successfully.")
        return translator.translate(text)
    except Exception as e:
        return str(e)
