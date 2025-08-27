from fastapi import APIRouter, Depends, HTTPException, status

authRoutes=APIRouter()

@authRoutes.post("/login")
async def login():
    return {"message": "Login successful"}

