@echo off
echo ===================================================
echo Starting HydroLab - 3D Services
echo ===================================================

echo Starting Python Chemistry Engine (Port 8001)...
start "HydroLab - Chemistry Engine" cmd /c "cd chemistry-engine && .venv\Scripts\uvicorn main:app --port 8001 --reload || echo Failed to start! Did you run 'pip install -r requirements.txt'? && pause"

echo Starting Node.js Backend (Port 3000)...
start "HydroLab - Backend" cmd /c "cd backend && npm run dev || echo Failed to start! && pause"

echo Starting React Frontend (Port 5173)...
start "HydroLab - Frontend" cmd /c "cd frontend && npm run dev || echo Failed to start! && pause"

echo All services launched in separate windows!
echo Close this window to exit the launcher (the services will keep running).
pause
