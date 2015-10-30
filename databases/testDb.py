#!/usr/bin/env python

import sqlite3

conn=sqlite3.connect('jarvis.db')

curs=conn.cursor()

print "\nEntire database contents:\n"
for row in curs.execute("SELECT * FROM table1"):
    print row

print "\nDatabase entries :\n"
for row in curs.execute("SELECT * FROM table1 WHERE two='10'"):
    print row

conn.close()
