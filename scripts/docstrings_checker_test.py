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

import contextlib
import unittest

from . import docstrings_checker  # isort:skip

import astroid  # isort:skip
from pylint.checkers import utils # isort:skip


class DocstringsCheckerTest(unittest.TestCase):
    """Class for testing the docstrings_checker script."""

    def test_space_indentation(self):
        sample_string = '     This is a sample string.'
        self.assertEqual(docstrings_checker.space_indentation(sample_string), 5)

    def test_get_setters_property_name_with_setter(self):
        setter_node = astroid.extract_node(
            """
        @test.setter
        def func():
            pass
        """)
        property_name = docstrings_checker.get_setters_property_name(
            setter_node)
        self.assertEqual(property_name, 'test')

    def test_get_setters_property_name_without_setter(self):
        none_node = astroid.extract_node(
            """
        @attribute
        def func():
            pass
        """)
        none_return = docstrings_checker.get_setters_property_name(none_node)
        self.assertEqual(none_return, None)

    def test_get_setters_property_with_setter_and_property(self):
        node = astroid.extract_node(
            """
        class TestClass():
            @test.setter
            @property
            def func():
                pass
        """)

        temp = node.getattr('func')
        setter_property = docstrings_checker.get_setters_property(temp[0])
        self.assertEqual(isinstance(setter_property, astroid.FunctionDef), True)

    def test_get_setters_property_with_setter_no_property(self):
        testnode2 = astroid.extract_node(
            """
        class TestClass():
            @test.setter
            def func():
                pass
        """)

        temp = testnode2.getattr('func')
        setter_property = docstrings_checker.get_setters_property(temp[0])
        self.assertEqual(setter_property, None)

    def test_get_setters_property_no_class(self):
        testnode3 = astroid.extract_node(
            """
        @test.setter
        def func():
            pass
        """)

        setter_property = docstrings_checker.get_setters_property(testnode3)
        self.assertEqual(setter_property, None)

    def test_get_setters_property_no_setter_no_property(self):
        testnode4 = astroid.extract_node(
            """
        class TestClass():
            def func():
                pass
        """)

        temp = testnode4.getattr('func')
        setter_property = docstrings_checker.get_setters_property(temp[0])
        self.assertEqual(setter_property, None)

    def test_returns_something_with_value_retur(self):
        return_node = astroid.extract_node(
            """
        return True
        """)

        self.assertEqual(
            docstrings_checker.returns_something(return_node),
            True)

    def test_returns_something_with_none_return(self):
        return_none_node = astroid.extract_node(
            """
        return None
        """)

        self.assertEqual(
            docstrings_checker.returns_something(return_none_node),
            False)

    def test_returns_something_with_empty_return(self):
        none_return_node = astroid.extract_node(
            """
        return
        """)

        self.assertEqual(
            docstrings_checker.returns_something(none_return_node),
            False)

    def test_possible_exc_types_with_valid_name(self):
        raise_node = astroid.extract_node(
            """
        def func():
            raise IndexError #@
        """)

        exceptions = docstrings_checker.possible_exc_types(raise_node)
        self.assertEqual(exceptions, set(['IndexError']))

    def test_possible_exc_types_with_invalid_name(self):
        raise_node = astroid.extract_node(
            """
        def func():
            raise AInvalidError #@
        """)

        exceptions = docstrings_checker.possible_exc_types(raise_node)
        self.assertEqual(exceptions, set([]))

    def test_possible_exc_types_with_function_call_no_return(self):
        raise_node = astroid.extract_node(
            """
        def testFunc():
            pass

        def func():
            raise testFunc() #@
        """)

        excpetions = docstrings_checker.possible_exc_types(raise_node)
        self.assertEqual(excpetions, set([]))

    def test_possible_exc_types_with_function_call_valid_errors(self):
        raise_node = astroid.extract_node(
            """
        def testFunc():
            if True:
                return IndexError
            else:
                return ValueError

        def func():
            raise testFunc() #@
        """)

        excpetions = docstrings_checker.possible_exc_types(raise_node)
        self.assertEqual(excpetions, set(['IndexError', 'ValueError']))

    def test_possible_exc_types_with_function_call_invalid_error(self):
        raise_node = astroid.extract_node(
            """
        def testFunc():
            return AInvalidError

        def func():
            raise testFunc() #@
        """)

        excpetions = docstrings_checker.possible_exc_types(raise_node)
        self.assertEqual(excpetions, set([]))

    def test_possible_exc_types_with_function_return_out_of_frame(self):
        raise_node = astroid.extract_node(
            """
        def testFunc():
            def inner():
                return IndexError

            pass

        def func():
            raise testFunc() #@
        """)

        exceptions = docstrings_checker.possible_exc_types(raise_node)
        self.assertEqual(exceptions, set([]))

    def test_possible_exc_types_with_undefined_function_call(self):
        raise_node = astroid.extract_node(
            """
        def func():
            raise testFunc() #@
        """)

        excpetions = docstrings_checker.possible_exc_types(raise_node)
        self.assertEqual(excpetions, set([]))

    def test_possible_exc_types_with_constaint_raise(self):
        raise_node = astroid.extract_node(
            """
        def func():
            raise True #@
        """)

        exceptions = docstrings_checker.possible_exc_types(raise_node)
        self.assertEqual(exceptions, set([]))

    def test_possible_exc_types_with_inference_error(self):

        @contextlib.contextmanager
        def swap(obj, attr, newvalue):
            """Swap an object's attribute value within the context of a
            'with' statement. The object can be anything that supports
            getattr and setattr, such as class instances, modules, etc.
            """
            original = getattr(obj, attr)
            setattr(obj, attr, newvalue)
            try:
                yield
            finally:
                setattr(obj, attr, original)

        raise_node = astroid.extract_node(
            """
        def func():
            raise Exception('An exception.') #@
        """)
        node_ignores_exception_swap = swap(
            utils, 'node_ignores_exception',
            lambda _, __: (_ for _ in ()).throw(astroid.InferenceError()))

        with node_ignores_exception_swap:
            exceptions = docstrings_checker.possible_exc_types(raise_node)
        self.assertEqual(exceptions, set([]))

    def test_possible_exc_types_with_exception_message(self):
        raise_node = astroid.extract_node(
            """
        def func():
            \"\"\"Function to test raising exceptions.\"\"\"
            raise Exception('An exception.') #@
        """)

        exceptions = docstrings_checker.possible_exc_types(raise_node)
        self.assertEqual(exceptions, set(['Exception']))

    def test_possible_exc_types_with_no_exception(self):
        raise_node = astroid.extract_node(
            """
        def func():
            \"\"\"Function to test raising exceptions.\"\"\"
            raise #@
        """)

        exceptions = docstrings_checker.possible_exc_types(raise_node)
        self.assertEqual(exceptions, set([]))

    def test_possible_exc_types_with_exception_inside_function(self):
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

    def test_docstringify_with_okey_docstring(self):
        okey_docstring = """Docstring that is correctly formated
            according to the Google Python Style Guide.

            Args:
                test_value: bool. Just a test argument.
            """
        is_okey = isinstance(
            docstrings_checker.docstringify(okey_docstring),
            docstrings_checker.GoogleDocstring)

        self.assertEqual(is_okey, True)

    def test_docstringify_with_bad_docstring(self):
        not_okey_dockstring = """Docstring that is incorrectly
            formated according to the Google Python Style Guide.
            """
        is_okey = isinstance(
            docstrings_checker.docstringify(not_okey_dockstring),
            docstrings_checker.GoogleDocstring)

        self.assertEqual(is_okey, False)
