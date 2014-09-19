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

bash scripts/create_expr_parser.sh

# The node interpreter binary doesn't take multiple input files as arguments,
# so we concatenate the two input files and send them as one chunk through
# stdin to node. Also adding core/templates/dev/head/expressions to NODE_PATH
# allows "node" to find parser.js.
cat core/templates/dev/head/expressions/evaluator.js core/templates/dev/head/expressions/test.js | NODE_PATH=$NODE_PATH:core/templates/dev/head/expressions node
