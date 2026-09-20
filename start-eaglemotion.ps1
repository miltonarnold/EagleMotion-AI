$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

$backend = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectRoot\Backend'; java -jar '.\target\eagle-motion-backend-1.0.0.jar'" -PassThru

Start-Sleep -Seconds 5

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectRoot\frontend'; npx serve . -l 3000"

Start-Sleep -Seconds 3

Start-Process "https://eaglemotion-ai.onrender.com/index.html"
