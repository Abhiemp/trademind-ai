@echo off
echo ========================================================
echo Starting TradeMind AI - FastAPI Backend (Port 8000)
echo ========================================================
cd backend
call .venv\Scripts\activate.bat
python run.py
pause

