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

##########################################################################

# INSTRUCTIONS:
#
# Run this script from the oppia root folder:
#   bash scripts/create_expression_parser.sh
# The root folder MUST be named 'oppia'.
# It produces the expression parser.

if [ -z "$BASH_VERSION" ]
then
  echo ""
  echo "  Please run me using bash: "
  echo ""
  echo "     bash $0"
  echo ""
  return 1
fi

set -e
source $(dirname $0)/setup.sh || exit 1


EXPRESSION_PARSER_DEFINITION=core/templates/dev/head/expressions/parser.pegjs
EXPRESSION_PARSER_JS=core/templates/dev/head/expressions/ExpressionParserService.js

# Install the basic environment, e.g. nodejs.
bash scripts/install_third_party.sh

echo Checking whether pegjs is installed in $TOOLS_DIR
if [ ! -d "$NODE_MODULE_DIR/pegjs" ]; then
  echo Installing pegjs
  $NPM_INSTALL pegjs@0.8.0
fi

$NODE_MODULE_DIR/pegjs/bin/pegjs $EXPRESSION_PARSER_DEFINITION $EXPRESSION_PARSER_JS
sed -i "s/module\.exports.*$/angular.module('oppia').factory('ExpressionParserService', ['\$log', function(\$log) {/" $EXPRESSION_PARSER_JS
sed -i  's/^})();\s*$/}]);/' $EXPRESSION_PARSER_JS


echo Done!
