@echo off
echo ========================================================
echo Starting Mnemo Discord Bot...
echo Please KEEP THIS WINDOW OPEN to keep the bot online!
echo ========================================================
echo.

:start
node ./node_modules/tsx/dist/cli.mjs discord-bot/index.ts
echo.
echo Bot crashed or stopped! Restarting in 5 seconds...
timeout /t 5
goto start
