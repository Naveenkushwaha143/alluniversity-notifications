#!/bin/bash
cd /home/z/my-project
while true; do
  echo "[$(date)] Starting Next.js dev server..." >> /tmp/keep-alive.log
  npx next dev -p 3000 >> /tmp/next-dev.log 2>&1
  echo "[$(date)] Server died, restarting in 3s..." >> /tmp/keep-alive.log
  sleep 3
done
