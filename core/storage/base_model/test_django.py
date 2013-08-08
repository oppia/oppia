# coding: utf-8
#
# Copyright 2013 Google Inc. All Rights Reserved.
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

"""Tests for the BaseModel and Converter."""

__author__ = 'Tarashish Mishra'

from core.django_utils import Converter
import core.storage.base_model.models as base_models
from django.utils import unittest


def inheritors(klass):
    """Get all the subclasses which inherit from a class"""
    subclasses = set()
    work = [klass]
    while work:
        parent = work.pop()
        for child in parent.__subclasses__():
            if child not in subclasses:
                subclasses.add(child)
                work.append(child)
    return subclasses


class ConverterUnitTests(unittest.TestCase):
    """Test the Converter class."""

    def test_encoding_builtin_types(self):
        """Test encoding of built-in datatypes."""
        value = 'test string'
        encoded_value = Converter.encode(value)
        self.assertEqual(encoded_value, u'test string')

        value = [1, 'a string', 3.5, [2, 3]]
        encoded_value = Converter.encode(value)
        self.assertEqual(encoded_value, [1, u'a string', 3.5, [2, 3]])

        value = (1, 2, 3)
        with self.assertRaises(NotImplementedError):
            encoded_value = Converter.encode(value)

        value = {1, 2, 3}
        with self.assertRaises(NotImplementedError):
            encoded_value = Converter.encode(value)

        value = {'mango': 'fruit', '1': 'number'}
        encoded_value = Converter.encode(value)
        self.assertEqual(encoded_value, {'mango': 'fruit', '1': 'number'})

    def test_encoding_objects(self):
        """Test encoding of objects, nested objects, list and dict
        of nested objects"""
        class A():
            def __init__(self, a):
                self.a = a

        class B():
            def __init__(self, b):
                self.b = b

        value = A(3)
        encoded_value = Converter.encode(value)
        self.assertEqual(encoded_value, {'__A__': {'a': 3}})

        value = A(B(2))
        encoded_value = Converter.encode(value)
        self.assertEqual(encoded_value, {'__A__': {'a': {'__B__': {'b': 2}}}})

        value = [A(3), A(5)]
        encoded_value = Converter.encode(value)
        self.assertEqual(
            encoded_value, [{'__A__': {'a': 3}}, {'__A__': {'a': 5}}]
        )

        value = [A(B(2)), A(B(3))]
        encoded_value = Converter.encode(value)
        self.assertEqual(
            encoded_value,
            [{'__A__': {'a': {'__B__': {'b': 2}}}},
             {'__A__': {'a': {'__B__': {'b': 3}}}}]
        )

        value = {1: [A(B(2)), A(B(3))], 2: [A(B(4)), A(B(5))]}
        encoded_value = Converter.encode(value)
        self.assertEqual(
            encoded_value,
            {
                1: [{'__A__': {'a': {'__B__': {'b': 2}}}},
                    {'__A__': {'a': {'__B__': {'b': 3}}}}],
                2: [{'__A__': {'a': {'__B__': {'b': 4}}}},
                    {'__A__': {'a': {'__B__': {'b': 5}}}}]
            })


class AttrListUnitTests(unittest.TestCase):
    """Test the attr_list of the subclasses"""

    def test_elements_of_attr_lists_for_all_classes_are_strings(self):
        subclasses = inheritors(base_models.BaseModel)
        primitive = (basestring, bool, float, int)
        for subclass in subclasses:
            attr_list = subclass.attr_list()
            self.assertNotEqual(attr_list, [])
            self.assertIsInstance(attr_list, list)
            for value in attr_list:
                self.assertIsInstance(value, basestring)


class BaseModelUnitTests(unittest.TestCase):
    """Test the generic base model."""

    def test_get_error_cases(self):
        """Test the error cases for the get() method."""
        FakeModel = base_models.FakeModel

        with self.assertRaises(FakeModel.EntityNotFoundError):
            FakeModel.get('Invalid id')
        with self.assertRaises(FakeModel.EntityNotFoundError):
            FakeModel.get('Invalid id', strict=True)

        # The get() method should fail silently when strict == False.
        self.assertIsNone(FakeModel.get('Invalid id', strict=False))
