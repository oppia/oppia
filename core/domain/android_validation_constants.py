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
app.
"""

from __future__ import unicode_literals  # pylint: disable=import-only-modules

# These are the valid interactions that are allowed in an exploration
# that is to be viewed on the Android app. If, in the future, this is
# changed, just this array has to be modified to include the new
# interactions or remove existing ones.
VALID_INTERACTION_IDS = [
    'Continue', 'DragAndDropSortInput', 'EndExploration', 'FractionInput',
    'ItemSelectionInput', 'MultipleChoiceInput', 'NumericInput',
    'NumberWithUnits', 'TextInput'
]

SUPPORTED_LANGUAGES = ['en']

VALID_RTE_COMPONENTS = ['image', 'link', 'skillreview']

# If any of the following values are changed, edit the corresponding value in
# app.constants.ts as well.
MAX_CHARS_IN_TOPIC_NAME = 39
MAX_CHARS_IN_ABBREV_TOPIC_NAME = 12
MAX_CHARS_IN_TOPIC_DESCRIPTION = 240
MAX_CHARS_IN_SUBTOPIC_TITLE = 64
MAX_CHARS_IN_SKILL_DESCRIPTION = 100
MAX_CHARS_IN_STORY_TITLE = 39
MAX_CHARS_IN_CHAPTER_TITLE = 36
MAX_CHARS_IN_CHAPTER_DESCRIPTION = 152
MAX_CHARS_IN_MISCONCEPTION_NAME = 100
