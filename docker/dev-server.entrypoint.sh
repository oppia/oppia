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

build_cmd="python -m scripts.build"
dev_appserver_cmd="/app/vm_deps/google-cloud-sdk/bin/dev_appserver.py \
--runtime=python39 \
--host=0.0.0.0 \
--port=8181 \
--admin_host=0.0.0.0 \
--admin_port=8000 \
--skip_sdk_update_check=true \
--log_level=info \
--dev_appserver_log_level=info"

if [ "$prod_env" = "true" ]; then
  build_cmd+=" --prod_env"
  dev_appserver_cmd+=" /app/oppia/app.yaml"
else
  dev_appserver_cmd+=" /app/oppia/app_dev_docker.yaml"
fi
if [ "$maintenance_mode" = "true" ]; then
  build_cmd+=" --maintenance_mode"
fi
if [ "$source_maps" = "true" ]; then
  build_cmd+=" --source_maps"
fi
if [ "$disable_host_checking" != "true" ]; then
  dev_appserver_cmd+=" --enable_host_checking"
fi
if [ "$no_auto_restart" = "true" ]; then
  dev_appserver_cmd+=" --automatic_restart=false"
else
  dev_appserver_cmd+=" --automatic_restart=true"
fi

$build_cmd
$dev_appserver_cmd
