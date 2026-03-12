@echo off
title Social Poster
cd /d C:\Users\ANNMARIYA\Desktop\codex
if not exist node_modules (
  echo Dependencies are missing. Running npm install first...
  call npm install
)
echo Starting app on http://localhost:3000
echo Keep this window open while using the app.
node server\app.js
pause
