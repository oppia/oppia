#!/usr/bin/sh
if [[ ${OS} == "Darwin" ]]; then
	sudo easy_install setuptools
	sudo easy_install pip
elif [[ ${OS} == "Linux" ]]; then
	sudo apt-get install curl python-setuptools git python-dev python-pip
fi
