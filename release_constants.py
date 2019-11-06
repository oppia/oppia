# coding: utf-8
#
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

"""Stores various constants for Oppia release."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import os

# Affirmative user confirmations.
AFFIRMATIVE_CONFIRMATIONS = ['y', 'ye', 'yes']

# PyGithub can fetch milestone only by using the milestone number. Milestones
# are numbered sequentially as they are created and the number remains fixed.
# The number for blocking_bugs milestone is 39 which is used to fetch this
# milestone.
BLOCKING_BUG_MILESTONE_NUMBER = 39

LABEL_FOR_CURRENT_RELEASE_PRS = 'PR: for current release'
LABEL_FOR_RELEASED_PRS = 'PR: released'

# The path for generating release_summary.md file for the current release.
RELEASE_SUMMARY_FILEPATH = os.path.join(
    os.getcwd(), os.pardir, 'release_summary.md')

REMOTE_URL = 'git@github.com:oppia/oppia.git'

RELEASE_BRANCH_TYPE = 'release'
HOTFIX_BRANCH_TYPE = 'hotfix'
