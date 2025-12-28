@echo off
echo Starting Backend...
cd backend
start cmd /k "python main.py"

echo Starting Frontend...
cd ../frontend
start cmd /k "npm run dev"

echo Project Started Successfully!
pause
