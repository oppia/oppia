# Copyright 2020 The Oppia Authors. All Rights Reserved.
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

"""Tests that the corresponding constants in android_validation_constants and
constants are the same.
"""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from constants import constants
from core.domain import android_validation_constants
from core.tests import test_utils


class AndroidValidationConstantsTest(test_utils.GenericTestBase):
    """Tests verifying the character limits."""

    def test_that_character_limits_in_both_files_are_equal(self):
        self.assertEqual(
            android_validation_constants.MAX_CHARS_IN_ABBREV_TOPIC_NAME,
            constants.MAX_CHARS_IN_ABBREV_TOPIC_NAME)
        self.assertEqual(
            android_validation_constants.MAX_CHARS_IN_CLASSROOM_URL_FRAGMENT,
            constants.MAX_CHARS_IN_CLASSROOM_URL_FRAGMENT)
        self.assertEqual(
            android_validation_constants.MAX_CHARS_IN_TOPIC_NAME,
            constants.MAX_CHARS_IN_TOPIC_NAME)
        self.assertEqual(
            android_validation_constants.MAX_CHARS_IN_TOPIC_DESCRIPTION,
            constants.MAX_CHARS_IN_TOPIC_DESCRIPTION)
        self.assertEqual(
            android_validation_constants.MAX_CHARS_IN_SUBTOPIC_TITLE,
            constants.MAX_CHARS_IN_SUBTOPIC_TITLE)
        self.assertEqual(
            android_validation_constants.MAX_CHARS_IN_SKILL_DESCRIPTION,
            constants.MAX_CHARS_IN_SKILL_DESCRIPTION)
        self.assertEqual(
            android_validation_constants.MAX_CHARS_IN_STORY_TITLE,
            constants.MAX_CHARS_IN_STORY_TITLE)
        self.assertEqual(
            android_validation_constants.MAX_CHARS_IN_CHAPTER_TITLE,
            constants.MAX_CHARS_IN_CHAPTER_TITLE)
        self.assertEqual(
            android_validation_constants.MAX_CHARS_IN_CHAPTER_DESCRIPTION,
            constants.MAX_CHARS_IN_CHAPTER_DESCRIPTION)
        self.assertEqual(
            android_validation_constants.MAX_CHARS_IN_MISCONCEPTION_NAME,
            constants.MAX_CHARS_IN_MISCONCEPTION_NAME)
