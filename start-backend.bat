@echo off
echo Starting Chain Reaction Backend...
cd backend
call venv\Scripts\activate
uvicorn main:app --reload --port 8001
