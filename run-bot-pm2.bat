@echo off
echo Starting Mnemo Discord Bot with PM2...
pm2 start start-bot.js --name "mnemo-discord-bot"
pm2 save --force
echo.
echo PM2 is now managing the Discord bot! 
echo To see logs, type: pm2 logs mnemo-discord-bot
echo.
pause
