#!/bin/bash
# Copyright 2023 The Oppia Authors. All Rights Reserved.
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

datastore_cmd="/app/vm_deps/google-cloud-sdk/bin/gcloud beta emulators datastore start \
--project=dev-project-id \
--data-dir=/app/cloud_datastore_emulator_cache \
--host-port=0.0.0.0:8089 \
--consistency=1.0 \
--quiet"
if [ "$save_datastore" != "true" ]; then
  datastore_cmd+=" --no-store-on-disk"
fi

$datastore_cmd
