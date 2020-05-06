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

BRANCH_TYPE_RELEASE = 'release'
BRANCH_TYPE_HOTFIX = 'hotfix'

RELEASE_DRIVE_URL = (
    'https://drive.google.com/drive/folders/0B9KSjiibL_WDNjJyYlEtbTNvY3c')
RELEASE_NOTES_URL = (
    'https://docs.google.com/document/d/'
    '1pmcDNfM2KtmkZeYipuInC48RE5JfkSJWQYdIQAkD0hQ/edit#')
RELEASE_ROTA_URL = (
    'https://github.com/oppia/oppia/wiki/Release-Schedule#'
    'release-coordinators-and-qa-coordinators-for-upcoming-releases')

JOBS_SPREADSHEETS_URL = (
    'https://docs.google.com/spreadsheets/d/'
    '1Wegd0rZhVOm3Q3VCIw0xMbLC7IWtRyrEahiPn61Fhoo/edit#gid=948463314')

ISSUE_FILING_URL = 'https://github.com/oppia/oppia/milestone/39'
CREDITS_FORM_URL = (
    'https://docs.google.com/forms/d/'
    '1yH6ZO2UiD_VspgKJR40byRSjUP1AaBF9ARSe814p8K0/edit#responses')
RELEASE_NOTES_TEMPLATE_URL = (
    'https://docs.google.com/document/d/'
    '1VBa3pdRLnvobNlfmZB6-uRYJHBz_Gc-6eN_ilSoVlhE/edit#')
RELEASE_NOTES_EXAMPLE_URL = (
    'https://docs.google.com/document/d/'
    '1OUwgMPNORABJAz7DS0iuDUr5A2FxcXg4Y5-qUEdgo-M/edit#heading=h.l3dbee3s55ti')
JOBS_FORM_URL = 'https://goo.gl/forms/XIj00RJ2h5L55XzU2'

OPPIA_DEV_GROUP_URL = 'https://groups.google.com/forum/#!forum/oppia-dev'

INVALID_EMAIL_SUFFIX = 'users.noreply.github.com'

NEW_AUTHORS_HEADER = '### New Authors:\n'
EXISTING_AUTHORS_HEADER = '### Existing Authors:\n'
NEW_CONTRIBUTORS_HEADER = '### New Contributors:\n'
EMAIL_HEADER = '### Email C&P Blurbs about authors:\n'
CHANGELOG_HEADER = '### Changelog:\n'
COMMIT_HISTORY_HEADER = '### Commit History:\n'
ISSUES_HEADER = '### Issues mentioned in commits:\n'
