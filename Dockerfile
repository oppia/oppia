FROM ubuntu:18.04

# Install sudo
RUN apt-get update && apt-get -y install sudo

RUN DEBIAN_FRONTEND="noninteractive" apt-get -y install tzdata

RUN ls

# Install prereqs
COPY scripts/install_prerequisites.sh /scripts/install_prerequisites.sh
RUN sh /scripts/install_prerequisites.sh

# Install SDK
RUN pip3 install --no-cache-dir apache-beam[gcp]==2.32.0

# Copy files from official SDK image, including script/dependencies
COPY --from=apache/beam_python3.7_sdk:2.32.0 /opt/apache/beam /opt/apache/beam

# Set the entrypoint to Apache Beam SDK launcher.
ENTRYPOINT ["/opt/apache/beam/boot"]
