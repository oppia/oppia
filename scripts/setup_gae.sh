# Copyright 2014 The Oppia Authors. All Rights Reserved.
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

# This file should not be invoked directly, but sourced from other sh scripts.
# Bash execution environment setup for scripts that require GAE.


if [ "$SETUP_GAE_DONE" ]; then
  return 0
fi

export GOOGLE_APP_ENGINE_HOME=$TOOLS_DIR/google_appengine_1.9.67/google_appengine
export GOOGLE_CLOUD_SDK_HOME=$TOOLS_DIR/google-cloud-sdk-222.0.0/google-cloud-sdk
export COVERAGE_HOME=$TOOLS_DIR/coverage-4.5.1

# Note that if the following line is changed so that it uses webob_1_1_1, PUT requests from the frontend fail.
export PYTHONPATH=.:$COVERAGE_HOME:$GOOGLE_APP_ENGINE_HOME:$GOOGLE_APP_ENGINE_HOME/lib/webob_0_9:$TOOLS_DIR/webtest-1.4.2:$PYTHONPATH

# Delete old *.pyc files
find . -iname "*.pyc" -exec rm -f {} \;

echo Checking whether Google App Engine is installed in $GOOGLE_APP_ENGINE_HOME
if [ ! -d "$GOOGLE_APP_ENGINE_HOME" ]; then
  echo "Downloading Google App Engine (this may take a little while)..."
  mkdir -p $GOOGLE_APP_ENGINE_HOME
  curl -o gae-download.zip https://storage.googleapis.com/appengine-sdks/featured/google_appengine_1.9.67.zip
  # $? contains the (exit) status code of previous command.
  # If curl was successful, $? will be 0 else non-zero.
  if [ 0 -eq $? ]; then
    echo "Download complete. Installing Google App Engine..."
  else
    echo "Error downloading Google App Engine. Exiting."
    exit 1
  fi
  unzip -q gae-download.zip -d $TOOLS_DIR/google_appengine_1.9.67/
  rm gae-download.zip
fi

echo Checking whether google-cloud-sdk is installed in $GOOGLE_CLOUD_SDK_HOME
if [ ! -d "$GOOGLE_CLOUD_SDK_HOME" ]; then
  echo "Downloading Google Cloud SDK (this may take a little while)..."
  mkdir -p $GOOGLE_CLOUD_SDK_HOME
  curl -o gcloud-sdk.tar.gz https://dl.google.com/dl/cloudsdk/channels/rapid/downloads/google-cloud-sdk-222.0.0-linux-x86_64.tar.gz
  # $? contains the (exit) status code of previous command.
  # If curl was successful, $? will be 0 else non-zero.
  if [ 0 -eq $? ]; then
    echo "Download complete. Installing Google Cloud SDK..."
  else
    echo "Error downloading Google Cloud SDK. Exiting."
    exit 1
  fi
  tar xzf gcloud-sdk.tar.gz -C $TOOLS_DIR/google-cloud-sdk-222.0.0/
  rm gcloud-sdk.tar.gz
fi

export SETUP_GAE_DONE=true
