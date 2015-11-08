# coding: utf-8
#
# Copyright 2014 The Oppia Authors. All Rights Reserved.
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

"""Tests for classification of UnicodeStrings."""

__author__ = 'Tarashish Mishra'

import base64

from core.domain import fs_domain
from core.tests import test_utils
from extensions.rules import unicode_string


class UnicodeStringRuleUnitTests(test_utils.GenericTestBase):
    """Tests for rules operating on UnicodeString objects."""

    def test_equals_rule(self):
        rule = unicode_string.Equals('hello world')

        self.assertFuzzyTrue(rule.eval('hello world'))
        self.assertFuzzyTrue(rule.eval('Hello World'))
        self.assertFuzzyFalse(rule.eval('goodbye world'))

    def test_case_sensitive_equals_rule(self):
        rule = unicode_string.CaseSensitiveEquals('hello world')

        self.assertFuzzyTrue(rule.eval('hello world'))
        self.assertFuzzyFalse(rule.eval('Hello World'))
        self.assertFuzzyFalse(rule.eval('goodbye world'))

    def test_starts_with_rule(self):
        self.assertFuzzyTrue(unicode_string.StartsWith('he').eval('hello world'))
        self.assertFuzzyTrue(unicode_string.StartsWith('HE').eval('hello world'))
        self.assertFuzzyFalse(unicode_string.StartsWith('hello').eval('he'))

    def test_contains_rule(self):
        self.assertFuzzyTrue(unicode_string.Contains('he').eval('hello world'))
        self.assertFuzzyTrue(unicode_string.Contains('HE').eval('hello world'))
        self.assertFuzzyTrue(unicode_string.Contains('ll').eval('hello world'))
        self.assertFuzzyFalse(unicode_string.Contains('ol').eval('hello world'))

    def test_matches_base64encoded_file_rule(self):
        TEST_DATA_DIR = 'extensions/rules/testdata'
        fs = fs_domain.AbstractFileSystem(
            fs_domain.DiskBackedFileSystem(TEST_DATA_DIR))

        file_names = ['test.c', 'test.png', 'test.tar.gz']

        for file_name in file_names:
            encoded_content = base64.b64encode(fs.get(file_name))
            rule = unicode_string.MatchesBase64EncodedFile(
                file_name).set_fs(fs)
            self.assertFuzzyTrue(rule.eval(encoded_content))
