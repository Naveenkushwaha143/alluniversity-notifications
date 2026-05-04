#!/bin/bash
cd /home/z/my-project/mini-services/notification-service
while true; do
  echo "[$(date)] Starting notification service..." >> /tmp/ns-alive.log
  bun --hot index.ts >> /tmp/ns.log 2>&1
  echo "[$(date)] NS died, restarting in 3s..." >> /tmp/ns-alive.log
  sleep 3
done
