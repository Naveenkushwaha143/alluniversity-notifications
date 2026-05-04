#!/bin/bash
cd /home/z/my-project

# Start notification service
(cd mini-services/notification-service && exec bun --hot index.ts) &
NS_PID=$!

# Start dev server
exec npx next dev -p 3000
