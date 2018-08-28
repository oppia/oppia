#!/usr/bin/env bash

# Copyright 2018 The Oppia Authors. All Rights Reserved.
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

install_node_module jasmine-core 2.5.2
install_node_module karma 1.5.0
install_node_module karma-jasmine 1.1.0
install_node_module karma-jasmine-jquery 0.1.1
install_node_module karma-json-fixtures-preprocessor 0.0.6
install_node_module karma-coverage 1.1.1
install_node_module karma-ng-html2js-preprocessor 1.0.0
install_node_module karma-chrome-launcher 2.0.0
install_node_module protractor 5.3.1
install_node_module protractor-screenshot-reporter 0.0.5
install_node_module jasmine-spec-reporter 3.2.0
