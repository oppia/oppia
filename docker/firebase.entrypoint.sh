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

/app/oppia/node_modules/firebase-tools/lib/bin/firebase.js \
emulators:start \
--only auth \
--project=dev-project-id \
--config=/app/oppia/.firebase_docker.json \
$([ "$save_datastore" = "true" ] && echo "--import=/app/firebase_emulator_cache") \
--export-on-exit=/app/firebase_emulator_cache
