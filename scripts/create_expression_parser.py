# Copyright 2019 The Oppia Authors. All Rights Reserved.
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

"""It produces the expression parser."""
from __future__ import absolute_import  # pylint: disable=import-only-modules

import fileinput
import os
import re
import subprocess

import python_utils

from . import common
from . import install_third_party_libs
from . import setup


def main():
    """Produces the expression parser."""
    setup.main()

    expression_parser_definition = (
        'core/templates/dev/head/expressions/parser.pegjs')
    expression_parser_js = (
        'core/templates/dev/head/expressions/ExpressionParserService.js')

    # Install the basic environment, e.g. nodejs.
    install_third_party_libs.main()

    python_utils.PRINT(
        'Checking whether pegjs is installed in %s' % common.OPPIA_TOOLS_DIR)
    if not os.path.exists('node_modules/pegjs'):
        python_utils.PRINT('Installing pegjs')
        subprocess.call((
            '%s/bin/npm install pegjs@0.8.0' % common.NODE_PATH).split())

    subprocess.call((
        'node_modules/pegjs/bin/pegjs %s %s'
        % (expression_parser_definition, expression_parser_js)).split())

    for line in fileinput.input(files=[expression_parser_js], inplace=True):
        python_utils.PRINT(
            re.sub(
                r'module\.exports.*$',
                'angular.module(\'oppia\').factory('
                '\'ExpressionParserService\', [\'$log\', function($log) {',
                line), end='')

    for line in fileinput.input(files=[expression_parser_js], inplace=True):
        python_utils.PRINT(
            re.sub(r'^})();\s*$', '}]);', line), end='')

    python_utils.PRINT('Done!')


if __name__ == '__main__':
    main()
