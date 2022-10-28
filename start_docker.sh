#!/bin/bash
# Start docker
# Command: bash start_docker.sh /path/to/oppia/folder

args=($@)
oppia_loc=${args[0]}

# Creates the image
docker build -t oppia -f ubuntu_dockerfile .

# Using the image a contianer is created.
docker run -p 8181:8181 -p 9099:9099 -p 4400:4400 -v ${oppia_loc}:/home/opensource/ -it oppia /bin/bash
