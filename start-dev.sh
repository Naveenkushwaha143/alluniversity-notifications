#!/bin/bash
cd /home/z/my-project
exec npx next dev -p 3000 > /tmp/next-dev.log 2>&1
