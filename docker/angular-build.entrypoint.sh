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

trap "rm /app/oppia/node_modules/@angular/compiler-cli/ngcc/__ngcc_lock_file__" EXIT

ng_build_cmd="npx ng build"
if [ "$prod_env" = "true" ]; then
  ng_build_cmd+=" --prod"
else
  ng_build_cmd+=" --watch"
fi

$ng_build_cmd
