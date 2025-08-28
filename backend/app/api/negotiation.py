NEGOTIATION_PROMPT = """
You are a professional negotiation assistant. Create:
1. A polite email draft for contract revision
2. 3 key negotiation points
3. Alternative clause suggestions

Contract text: {text}

Provide ready-to-send email content and negotiation strategy.
"""

@router.post("/input_text")
async def negotiate_contract(input_data: TextInput):
    try:
        prompt = ANALYSIS_PROMPT.format(text=input_data.text)
        # Call your LLM here
        result = await call_llm(prompt)
        return {"analysis": result, "status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
