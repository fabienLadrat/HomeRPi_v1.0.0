#!/usr/bin/python3
import sys
import subprocess as sp
#import os
hostname = "192.168.0.16" #example
#response = os.system("ping -c 1 " + hostname)
status,result = sp.getstatusoutput("ping -c1 -w2 " + hostname)

#and then check the response...
if status == 0:
	print (hostname + ' is up!')
else:
	print (hostname + ' is down!')

sys.stdout.flush()
