#!/bin/bash
echo "#---------------------CRUISE CSRqry Start at $(date '+%Y%m%d %H:%M:%S')"
export NODE_OPTIONS=--max_old_space_size=4096 && pm2 -n csrqry start -i 2 npm -- run start src/index.mjs
