FROM ubuntu:latest

RUN apt-get update && \
   apt-get install -y sudo && \
   apt-get install -y vim

# Install Python and OpenJDK-8
RUN apt-get update && \
   apt-get install -y curl python-setuptools git python-dev python-pip python-yaml && \
   apt-get install -y wget && \
   apt-get install -y nodejs && \
   apt-get install -y npm && \
   apt-get install -y openjdk-8-jdk && \
   apt-get install -y ant && \
   apt-get clean

# Fix certificate issues
RUN apt-get update && \
   apt-get install ca-certificates-java && \
   apt-get clean && \
   update-ca-certificates -f

# Setup JAVA_HOME
ENV JAVA_HOME /usr/lib/jvm/java-8-openjdk-amd64/
ENV PATH $PATH:$JAVA_HOME/bin
RUN export JAVA_HOME

# Install dumb-init (Signal handling of SIGINT/SIGTERM/SIGKILL etc.)
RUN wget https://github.com/Yelp/dumb-init/releases/download/v1.2.0/dumb-init_1.2.0_amd64.deb
RUN dpkg -i dumb-init_*.deb
ENTRYPOINT ["dumb-init"]

# Install packages needed for Google Chrome
RUN apt-get update && \
   apt-get install -y fonts-liberation libappindicator3-1 libgtk-3-0 libxss1 lsb-release xdg-utils

# Install Google Chrome for frontend tests
RUN wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
RUN sudo dpkg -i google-chrome-stable_current_amd64.deb

# Copy oppia files into container
RUN mkdir /home/oppia
COPY . /home/oppia/

# Allow docker to have sudo privileges
RUN useradd -m docker && echo "docker:docker" | chpasswd && adduser docker sudo
USER docker

WORKDIR /home/oppia/
