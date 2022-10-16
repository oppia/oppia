#!/bin/bash
# Start docker
# Command: bash start_docker.sh /path/to/oppia/folder

args=($@)
oppia_loc=${args[0]}

docker build -t oppia -f ubuntu_dockerfile .

docker run -p 8181:8181 -p 9099:9099 -p 4000:4000 -v ${oppia_loc}:/home/opensource/oppia -it oppia /bin/bash
