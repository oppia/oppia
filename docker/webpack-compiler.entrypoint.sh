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

webpack_compiler_cmd="node"
if [ "$prod_env" = "true" ]; then
  webpack_compiler_cmd+=" --max_old_space_size=8192"
fi
webpack_compiler_cmd+=" /app/oppia/node_modules/webpack/bin/webpack.js \
--config"

if [ "$prod_env" = "true" ]; then
  if [ "$source_maps" = "true" ]; then
    webpack_compiler_cmd+=" /app/oppia/webpack.prod.sourcemap.config.ts"
  else
    webpack_compiler_cmd+=" /app/oppia/webpack.prod.config.ts"
  fi
else
  if [ "$source_maps" = "true" ]; then
    webpack_compiler_cmd+=" /app/oppia/webpack.dev.sourcemap.config.ts --watch --color --progress"
  else
    webpack_compiler_cmd+=" /app/oppia/webpack.dev.config.ts --watch --color --progress"
  fi
fi

$webpack_compiler_cmd
