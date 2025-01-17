# Copyright 2022 The Oppia Authors. All Rights Reserved.
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

"""Unit tests for scripts/create_expression_parser.py."""

from __future__ import annotations

import os
import subprocess

from core.tests import test_utils

from . import common
from . import create_expression_parser


class CreateExpressionParserTests(test_utils.GenericTestBase):
    """Unit tests for scripts/create_expression_parser.py."""

    def test_expression_parser_is_produced_correctly(self) -> None:
        cmd_token_list = []
        def mock_check_call(
            cmd_tokens: list[str], **unused_kwargs: str
        ) -> None:  # pylint: disable=unused-argument
            cmd_token_list.append(cmd_tokens)

        libraries_installed = []
        def mock_install_npm_library(
            library_name: str, library_version: str, path: str) -> None:
            libraries_installed.append([library_name, library_version, path])

        swap_check_call = self.swap(
            subprocess, 'check_call', mock_check_call)
        swap_install_npm_library = self.swap(
            common, 'install_npm_library', mock_install_npm_library)

        expression_parser_definition = os.path.join(
            'core', 'templates', 'expressions', 'parser.pegjs')
        expression_parser_js = os.path.join(
            'core', 'templates', 'expressions', 'parser.js')
        cmd = [os.path.join(common.NODE_MODULES_PATH, 'pegjs', 'bin', 'pegjs'),
            expression_parser_definition, expression_parser_js]

        with swap_check_call, swap_install_npm_library:
            create_expression_parser.main(args=[])

        self.assertEqual(libraries_installed[0][0], 'pegjs')
        self.assertIn(cmd, cmd_token_list)
