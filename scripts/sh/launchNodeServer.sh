#!/bin/bash
NOW=$(date +"%Y%m%d%k%M")
file="/var/www/logs/output.log"
if [ -e "$file" ]
then
	mv /var/www/logs/output.log /var/www/logs/output.log.$NOW
fi
cd /var/www
sudo node serveur.js &
exit 0;
