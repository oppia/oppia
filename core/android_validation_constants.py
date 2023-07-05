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

"""Constants that are relevant to the validation of new structures for Android
app. This file should only contain validations which affect UI display and
general functionality on Android.
"""

from __future__ import annotations

import re

from core.constants import constants


# These are the valid interactions that are allowed in an exploration
# that is to be viewed on the Android app. If, in the future, this is
# changed, just this array has to be modified to include the new
# interactions or remove existing ones.
# These are linked to the ALLOWED_EXPLORATION_IN_STORY_INTERACTION_CATEGORIES
# constants in constants.ts.
VALID_INTERACTION_IDS = [
    'AlgebraicExpressionInput', 'Continue', 'DragAndDropSortInput',
    'EndExploration', 'FractionInput', 'ImageClickInput', 'ItemSelectionInput',
    'MathEquationInput', 'MultipleChoiceInput', 'NumericExpressionInput',
    'NumericInput', 'NumberWithUnits', 'RatioExpressionInput', 'TextInput'
]

# This is linked to SUPPORTED_CONTENT_LANGUAGES_FOR_ANDROID in constants.ts.
SUPPORTED_LANGUAGES = ['en']

# This is linked to VALID_RTE_COMPONENTS_FOR_ANDROID in constants.ts.
VALID_RTE_COMPONENTS = ['image', 'math', 'skillreview']

# If any of the following values are changed, edit the corresponding value in
# app.constants.ts as well.
MAX_CHARS_IN_TOPIC_NAME = 39
MAX_CHARS_IN_ABBREV_TOPIC_NAME = 12
MAX_CHARS_IN_TOPIC_DESCRIPTION = 240
MAX_CHARS_IN_SUBTOPIC_TITLE = 64
MAX_CHARS_IN_SUBTOPIC_URL_FRAGMENT = 25
SUBTOPIC_URL_FRAGMENT_REGEXP = '^[a-z]+(-[a-z]+)*$'
MAX_CHARS_IN_SKILL_DESCRIPTION = 100
MAX_CHARS_IN_STORY_TITLE = 39
MAX_CHARS_IN_STORY_DESCRIPTION = 1000
MAX_CHARS_IN_EXPLORATION_TITLE = 36
MAX_CHARS_IN_CHAPTER_DESCRIPTION = 152
MAX_CHARS_IN_MISCONCEPTION_NAME = 100

# The URL that Android feedback reports are sent to.
INCOMING_ANDROID_FEEDBACK_REPORT_URL = (
    '/appfeedbackreporthandler/incoming_android_report')

# Constants used to validate Android message request headers.
ANDROID_API_KEY = ''
ANDROID_APP_PACKAGE_NAME = 'org.oppia.android'
APP_VERSION_WITH_HASH_REGEXP = re.compile(
    constants.PLATFORM_PARAMETER_APP_VERSION_WITH_HASH_REGEXP)
