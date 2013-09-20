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
# Unless required by applicable law or agreed to in writing, softwar
# distributed under the License is distributed on an "AS-IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Tests for classification of TarFileStrings."""

__author__ = 'Tarashish Mishra'

import base64
import os
import unittest

from extensions.rules import tar_file_string
import utils


class TarFileStringRuleUnitTests(unittest.TestCase):
    """Tests for rules operating on UnicodeString objects."""

    def test_wrapper_name_rule(self):

        TEST_DATA_DIR = 'extensions/rules/testdata'
        rule = tar_file_string.ChecksWrapperDirName('myproject-0.1')

        file_name = 'bad-4.tar.gz'
        encoded_content = base64.b64encode(utils.get_file_contents(
            os.path.join(TEST_DATA_DIR, file_name), raw_bytes=True))
        self.assertTrue(rule.eval(encoded_content))

        file_name = 'good.tar.gz'
        encoded_content = base64.b64encode(utils.get_file_contents(
            os.path.join(TEST_DATA_DIR, file_name), raw_bytes=True))
        self.assertFalse(rule.eval(encoded_content))

    def test_wrapper_presence_rule(self):

        TEST_DATA_DIR = 'extensions/rules/testdata'
        rule = tar_file_string.ChecksWrapperDirPresence()

        file_name = 'bad-1.tar.gz'
        encoded_content = base64.b64encode(utils.get_file_contents(
            os.path.join(TEST_DATA_DIR, file_name), raw_bytes=True))
        self.assertTrue(rule.eval(encoded_content))

        file_name = 'good.tar.gz'
        encoded_content = base64.b64encode(utils.get_file_contents(
            os.path.join(TEST_DATA_DIR, file_name), raw_bytes=True))
        self.assertFalse(rule.eval(encoded_content))

    def test_unexpected_file_rule(self):

        TEST_DATA_DIR = 'extensions/rules/testdata'
        rule = tar_file_string.HasUnexpectedFile(
            ["myproject-0.1", "myproject-0.1/hello.c", "myproject-0.1/Makefile"])

        file_name = 'bad-5.tar.gz'
        encoded_content = base64.b64encode(utils.get_file_contents(
            os.path.join(TEST_DATA_DIR, file_name), raw_bytes=True))
        self.assertTrue(rule.eval(encoded_content))

        file_name = 'good.tar.gz'
        encoded_content = base64.b64encode(utils.get_file_contents(
            os.path.join(TEST_DATA_DIR, file_name), raw_bytes=True))
        self.assertFalse(rule.eval(encoded_content))

    def test_unexpected_content_rule(self):

        TEST_DATA_DIR = 'extensions/rules/testdata'
        rule = tar_file_string.HasUnexpectedContent(
            ['hello.c', 'Makefile'] )

        file_name = 'bad-3.tar.gz'
        encoded_content = base64.b64encode(utils.get_file_contents(
            os.path.join(TEST_DATA_DIR, file_name), raw_bytes=True))
        self.assertTrue(rule.eval(encoded_content))

        file_name = 'good.tar.gz'
        encoded_content = base64.b64encode(utils.get_file_contents(
            os.path.join(TEST_DATA_DIR, file_name), raw_bytes=True))
        self.assertFalse(rule.eval(encoded_content))