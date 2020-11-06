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

RUN pip install enum34==1.1.10 protobuf==3.13.0 wheel==0.35.0

# Setup JAVA_HOME
ENV JAVA_HOME /usr/lib/jvm/java-8-openjdk-amd64/
ENV PATH $PATH:$JAVA_HOME/bin
RUN export JAVA_HOME
