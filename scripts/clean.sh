#!/usr/bin/env bash

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

set -e
source $(dirname $0)/setup.sh || exit 1

rm -rf $TOOLS_DIR
rm -rf $NODE_MODULE_DIR
rm -rf third_party
rm -rf build
rm -rf backend_prod_files
rm -f .coverage
rm -rf local_compiled_js
rm -rf tmpcompiledjs*
rm -f .viminfo

echo Temporary and installed files deleted.
