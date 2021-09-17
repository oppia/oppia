FROM ubuntu-bionic

# Install SDK
RUN pip install --no-cache-dir apache-beam[gcp]==2.32.0

# Copy files from official SDK image, including script/dependencies
COPY --from=apache/beam_python3.7_sdk:2.32.0 /opt/apache/beam /opt/apache/beam

# Set the entrypoint to Apache Beam SDK launcher.
ENTRYPOINT ["/opt/apache/beam/boot"]
