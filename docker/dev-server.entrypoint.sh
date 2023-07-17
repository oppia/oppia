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

python -m scripts.build \
$([ "$prod_env" = "true" ] && echo "--prod_env") \
$([ "$maintenance_mode" = "true" ] && echo "--maintenance_mode") \
$([ "$source_maps" = "true" ] && echo "--source_maps")

/google-cloud-sdk/bin/dev_appserver.py \
$([ "$prod_env" = "true" ] && echo "/app/oppia/app.yaml" || echo "/app/oppia/app_dev_docker.yaml") \
--runtime=python38 \
--host=0.0.0.0 \
--port=8181 \
--admin_host=0.0.0.0 \
--admin_port=8000 \
--skip_sdk_update_check=true \
$([ "no_auto_restart" = "true" ] && echo "--automatic_restart=false" || echo "--automatic_restart=true") \
--log_level=info \
--dev_appserver_log_level=info \
$([ "$disable_host_checking" != "true" ] && echo "--enable_host_checking")
