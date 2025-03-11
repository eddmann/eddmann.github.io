#!/usr/bin/env bash

SERVER_USER="vagrant"
GIT_USER="git"

# essentials
yum install -y vim git

# disable firewall
/etc/init.d/iptables stop
chkconfig iptables off

# create ssh key
sudo -u $SERVER_USER ssh-keygen -q -t rsa -C "test@server.com" -N "" -f /home/$SERVER_USER/.ssh/id_rsa
cp /home/$SERVER_USER/.ssh/id_rsa.pub /tmp/server.pub
echo "StrictHostKeyChecking no" > /home/$SERVER_USER/.ssh/config

# install gitolite from epel
rpm -Uvh http://download.fedoraproject.org/pub/epel/6/x86_64/epel-release-6-8.noarch.rpm
yum install -y gitolite3

# setup git
sudo -u $SERVER_USER git config --global user.name "Test Server"
sudo -u $SERVER_USER git config --global user.email "test@server.com"

# setup gitolite
useradd -U $GIT_USER
sudo -u $GIT_USER gitolite setup -pk /tmp/server.pub
rm /tmp/server.pub

# clone down gitolite repo
cd /home/$SERVER_USER
sudo -u $SERVER_USER git clone $GIT_USER@localhost:gitolite-admin.git
cd /home/$SERVER_USER/gitolite-admin

# display available repos
sudo -u $SERVER_USER ssh $GIT_USER@localhost info

exit 0