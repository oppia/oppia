# Copyright 2019 The Oppia Authors. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS-IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

##########################################################################

# INSTRUCTIONS:
#
# This Dockerfile allows for an easy installation of Oppia for Windows
# users and a more reliable testing environment for running test scripts.
#
# Current known limitations:
#   - no support for run_e2e_tests.sh
#   - run_frontend_tests.py might not run correctly every time
#
# For more detailed instructions, go to the Windows page on here:
# https://github.com/oppia/oppia/wiki/Installing-Oppia-%28Windows%29
#
##########################################################################
###################### TO SET UP THE OPPIA REPOSITORY ####################
##########################################################################
#
########## START DOCKER
#
# STEP 1
# Download Docker Desktop for Windows.
# Windows Enterprise and Pro: 
#   https://hub.docker.com/editions/community/docker-ce-desktop-windows
# Windows 10 Home: 
#   https://docs.docker.com/toolbox/toolbox_install_windows/
#
# STEP 2
# Start Docker by clicking on the Docker application (a Docker icon should
# appear in your taskbar tray).
#
########## BUILD THE DOCKER IMAGE
#
# STEP 3
# Build the Docker image from the Oppia root folder (note the "." at the
# end of the command):
#
#   docker build -t {image_name} -f ubuntu_dockerfile .
#      where you should replace {image_name} with whatever you want to call
#      your Docker image (say oppia_image).
#
# Expect up to a 2 minute delay until the first line of output is printed.
# Runtime: 15-25 minutes
#
########## BUILD A DOCKER CONTAINER BASED ON IMAGE
#
# STEP 4
# Create a Docker container using the Docker image:
#
#   docker run -u 0 -it -p 8181:8181 --name {container_name} 
#   -v {path_to_oppia_parent_dir}:/home {image_name}:latest bash
#      where you should replace {container_name} with whatever you want to
#      call your Docker container (say oppia_container),
#      {path_to_oppia_parent_dir} with the absolute path to your oppia
#      folder's parent directory, and {image_name} with the name of your
#      Docker image.
#
# STEP 5
# At this point, a container is built with your current oppia directory.
# Now you should have a new terminal prompt "root@...". This is a Linux
# terminal. Type “exit” to return to your Command Prompt.
#
##########################################################################
######################## TO START THE OPPIA SERVER #######################
##########################################################################
#
########## ENSURE CONTAINER IS RUNNING
#
# STEP 1
# Run:
#
#   docker ps
#
# If this outputs a container, move on to step 3.
# Note: the {container_name} in the following steps can be found under the
# “NAMES” column of the output of “docker ps”.
#
# If this does not output a container, move on to step 2.
# Otherwise, move on to step 3.
#
# STEP 2
# Run:
#
#   docker ps -a
#
# If this outputs names of containers, find the NAME of the most recent
# container and run:
#   docker start {container_name}
#
# If this does not output names of containers, run:
#   docker images
# to get the name of a previously built image and follow step 4 from the
# prerequisite instructions.
#
# Then return to step 1 to ensure that the container is running.
#
########## START BASH AND RUN THE START SCRIPT
#
# STEP 3
# Start bash in the updated Docker container:
#
#   docker exec -it {container_name} bash
#
# STEP 4
# Now you should have a new terminal prompt "root@...". Run the start.sh
# script:
#
#   python -m scripts.start
#
# Runtime: 10-20 minutes
# The script opens a server at localhost:8181. After the terminal prints
# "INFO ... http://0.0.0.0:8181" or "+ 27 hidden modules", open
# localhost:8181 in your local computer browser. If the Oppia server does
# not load, restart this step.
#
##########################################################################
########################## TO RUN FRONTEND TESTS #########################
##########################################################################
#
# STEP 1
# If you are in the Docker container bash, type exit to return to your
# Command Prompt.
#
# STEP 2
# Ensure that node.js is installed on your Windows computer by running
# node -v. If not, install it: https://nodejs.org/en/download/
#
# STEP 3
# Run pip install future
#
# STEP 4
# Compile the frontend tests and then run the tests:
#
#   node .\node_modules\typescript\bin\tsc --project .
#   node .\node_modules\karma\bin\karma start .\core\tests\karma.conf.ts
#
# If this runs correctly, you will see a SIGKILL at the end. That is okay.
# If this does not run correctly, visit:
#   https://github.com/oppia/oppia/wiki/Installing-Oppia-%28Windows%29

##########################################################################

# Use latest version of Ubuntu that supports python 2
# TODO(#11292): Revise docker ubuntu version once back end is updated to python 3
FROM ubuntu:18.04 

# To bypass tzdata configuration. 
ENV DEBIAN_FRONTEND noninteractive
ENV TZ "UTC"

# Install packages needed in Dockerfile
RUN apt-get update && \
   apt-get install -y sudo && \
   apt-get install -y vim && \
   apt-get install -y wget && \
   apt-get install -y nodejs && \
   apt-get install -y npm && \
   apt-get install -y yes && \
   apt install -y tzdata && \
   apt-get clean

# Create oppia directory in Docker container
RUN mkdir /home/oppia

# Install prerequisites. The yes package responds "yes" to all prompts.
COPY ./scripts/install_prerequisites.sh /home/oppia/scripts/
RUN yes | bash /home/oppia/scripts/install_prerequisites.sh

# Fix certificate issues
RUN apt-get update && \
   apt-get install ca-certificates-java && \
   apt-get clean && \
   update-ca-certificates -f

# Setup JAVA_HOME
ENV JAVA_HOME /usr/lib/jvm/java-8-openjdk-amd64/
ENV PATH $PATH:$JAVA_HOME/bin
RUN export JAVA_HOME

# Install dumb-init (Signal handling of SIGINT/SIGTERM/SIGKILL and all other unhandled signals)
# When a process is executed in a Docker container, it is given a PID of 1. Linux kernels give
# special permissions to the process with a PID of 1. In particular, if the process does not handle
# a specific signal, then it will not respond to that signal. Unhandled signals for processes of
# PID other than 1 are set to the default response for the signal. So, we install dumb-init as a
# reliable process for the Linux kernel to give special permissions to. dumb-init then executes all
# other processes as child processes (PID other than 1), such that their unhandled signals are
# automatically handled as expected.
RUN wget https://github.com/Yelp/dumb-init/releases/download/v1.2.0/dumb-init_1.2.0_amd64.deb
RUN dpkg -i dumb-init_*.deb
ENTRYPOINT ["dumb-init"]

# Install packages needed for Google Chrome
RUN apt-get update && \
   apt-get install -y fonts-liberation libappindicator3-1 libgtk-3-0 libxss1 libgbm1 lsb-release xdg-utils

# Install Google Chrome for frontend tests
RUN wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
RUN sudo dpkg -i google-chrome-stable_current_amd64.deb

# Copy oppia files into container
COPY . /home/oppia/

# Allow docker to have sudo privileges
RUN useradd -m docker && echo "docker:docker" | chpasswd && adduser docker sudo
USER docker

WORKDIR /home/oppia/
