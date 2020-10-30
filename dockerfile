FROM python:2.7-jessie

# Install packages needed in Dockerfile
RUN apt-get update && \
   apt-get install -y sudo && \
   apt-get install -y wget && \
   apt-get install -y nodejs && \
   apt-get install -y npm && \
   apt install -y tzdata && \
   apt-get clean

# Create oppia directory in Docker container
RUN mkdir /home/oppia

# Install prerequisites. The yes package responds "yes" to all prompts.
COPY ./scripts/install_prerequisites.sh /home/oppia/scripts/
RUN bash /home/oppia/scripts/install_prerequisites.sh

# Install chrome.
COPY ./scripts/install_chrome.sh /home/oppia/scripts/
RUN bash /home/oppia/scripts/install_chrome.sh
