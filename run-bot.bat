@echo off
title Mnemo Discord Bot Launcher
echo ===================================================
echo Starting Mnemo Discord Bot in crash-recovery loop...
echo ===================================================
:loop
cd /d "c:\Users\anuro\Documents\Mnemo"
node start-bot.js
echo.
echo [Warning] Bot crashed or exited. Restarting in 5 seconds...
timeout /t 5
goto loop
