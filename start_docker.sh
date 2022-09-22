#!/bin/bash
# Start docker
# Command: bash start_docker.sh /path/to/oppia/folder

args=($@)
oppia_loc=${args[0]}

docker build -t oppia -f Dockerfile .

docker run -p 8181:8181 -v ${oppia_loc}:/home/opensource/oppia -it oppia /bin/bash
