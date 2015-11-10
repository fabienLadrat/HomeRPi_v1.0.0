# HomeRPi_v1.0.0
| HomeRPi domotic project  

| Installation of nodejs and npm on rapsberry pi  

wget http://nodejs.org/dist/v0.10.28/node-v0.10.28-linux-arm-pi.tar.gz  
tar -xzf node-v0.10.28-linux-arm-pi.tar.gz  
mkdir /opt/node  
nano /etc/profile  

add into /etc/profile  
    PATH=$PATH:/opt/node/bin  
before  
    export PATH  

sudo cp -r node-v0.10.28-linux-arm-pi/* /opt/node  
cd /var/www  

| node module installation in node_modules directory  
npm install express  
npm install socket.io  
npm install request  
npm install sqlite3  
npm install daemon  
npm install log4js  
npm install ejs  
npm install aimlinterpreter  
npm install android-gcm  
npm install body-parser  
npm install date-utils  
npm install dom-js  
npm install exec-sync  
npm install request-sync  
npm install sqli  
npm install sync-request  

| Installation of libraries to manage gpio, lirc  

sudo apt-get install git-core  

git clone git://git.drogon.net/wiringPi  
cd wiringPi  
./build  

git clone https://github.com/r10r/rcswitch-pi.git  
cd rcswitch-pi  
make  

| Lib installation to manago ir transmitter  

sudo apt-get install lirc liblircclient-dev  

Edit file /etc/lirc/hardware.conf like this :  

nano /etc/lirc/hardware.conf  

    # Arguments which will be used when launching lircd
    LIRCD_ARGS="--uinput"
     
    # Don't start lircmd even if there seems to be a good config file
    # START_LIRCMD=false
     
    # Don't start irexec, even if a good config file seems to exist.
    # START_IREXEC=false
     
    # Try to load appropriate kernel modules
    LOAD_MODULES=true
     
    # Run "lircd --driver=help" for a list of supported drivers.
    DRIVER="default"
    # usually /dev/lirc0 is the correct setting for systems using udev
    DEVICE="/dev/lirc0"
    MODULES="lirc_rpi"
     
    # Default configuration files for your hardware if any
    LIRCD_CONF=""
    LIRCMD_CONF=""

| TEST reception  

sudo /etc/init.d/lirc stop  
mode2 -d /dev/lirc0  

