# coding: utf-8
#
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

"""Unit tests for scripts/docstrings_checker."""

from __future__ import annotations

from core.tests import test_utils
from . import docstrings_checker  # isort:skip

import astroid  # isort:skip
from pylint.checkers import utils # isort:skip


class DocstringsCheckerTest(test_utils.GenericTestBase):
    """Class for testing the docstrings_checker script."""

    def test_space_indentation(self) -> None:
        sample_string = '     This is a sample string.'
        self.assertEqual(
            docstrings_checker.space_indentation(sample_string), 5
        )

    def test_possible_exc_types_with_inference_error(self) -> None:

        raise_node = astroid.extract_node(
            """
        def func():
            raise Exception('An exception.') #@
        """)
        node_ignores_exception_swap = self.swap(
            utils, 'node_ignores_exception',
            lambda _, __: (_ for _ in ()).throw(astroid.InferenceError())
        )

        with node_ignores_exception_swap:
            exceptions = docstrings_checker.possible_exc_types(raise_node)
        self.assertEqual(exceptions, set([]))

    def test_possible_exc_types_with_exception_message(self) -> None:
        raise_node = astroid.extract_node(
            """
        def func():
            \"\"\"Function to test raising exceptions.\"\"\"
            raise Exception('An exception.') #@
        """)

        exceptions = docstrings_checker.possible_exc_types(raise_node)
        self.assertEqual(exceptions, set(['Exception']))

    def test_possible_exc_types_with_no_exception(self) -> None:
        raise_node = astroid.extract_node(
            """
        def func():
            \"\"\"Function to test raising exceptions.\"\"\"
            raise #@
        """)

        exceptions = docstrings_checker.possible_exc_types(raise_node)
        self.assertEqual(exceptions, set([]))

    def test_possible_exc_types_with_exception_inside_function(self) -> None:
        raise_node = astroid.extract_node(
            """
        def func():
            try:
                raise Exception('An exception.')
            except Exception:
                raise #@
        """)

        exceptions = docstrings_checker.possible_exc_types(raise_node)
        self.assertEqual(exceptions, set(['Exception']))
