FROM ubuntu:latest

# Install packages needed in Dockerfile
RUN apt-get update && \
   apt-get install -y sudo && \
   apt-get install -y vim && \
   apt-get install -y wget && \
   apt-get install -y nodejs && \
   apt-get install -y npm && \
   apt-get install -y yes && \
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
COPY . /home/oppia/
RUN rm /home/oppia/Dockerfile

# Allow docker to have sudo privileges
RUN useradd -m docker && echo "docker:docker" | chpasswd && adduser docker sudo
USER docker

WORKDIR /home/oppia/
