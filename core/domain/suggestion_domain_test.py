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

"""Tests for suggestion domain objects."""

from core.domain import suggestion_domain
from core.platform import models
from core.tests import test_utils

(suggestion_models,) = models.Registry.import_models([models.NAMES.suggestion])


class SuggestionDomainUnitTests(test_utils.GenericTestBase):
    """Tests for the suggestion class."""

    AUTHOR_EMAIL = 'author@example.com'
    REVIEWER_EMAIL = 'reviewer@example.com'
    ASSIGNED_REVIEWER_EMAIL = 'assigned_reviewer@example.com'

    def setUp(self):
        super(SuggestionDomainUnitTests, self).setUp()

        self.signup(self.AUTHOR_EMAIL, 'author')
        self.author_id = self.get_user_id_from_email(self.AUTHOR_EMAIL)
        self.signup(self.REVIEWER_EMAIL, 'reviewer')
        self.reviewer_id = self.get_user_id_from_email(self.REVIEWER_EMAIL)
        self.signup(self.ASSIGNED_REVIEWER_EMAIL, 'assignedReviewer')
        self.assigned_reviewer_id = self.get_user_id_from_email(
            self.ASSIGNED_REVIEWER_EMAIL)

    def test_to_dict(self):
        expected_suggestion_dict = {
            'suggestion_id': 'exploration.exp1.thread1',
            'suggestion_type': suggestion_models.SUGGESTION_EDIT_STATE_CONTENT,
            'target_type': suggestion_models.TARGET_TYPE_EXPLORATION,
            'target_id': 'exp1',
            'target_version_at_submission': 1,
            'status': suggestion_models.STATUS_ACCEPTED,
            'author_id': self.author_id,
            'final_reviewer_id': self.reviewer_id,
            'assigned_reviewer_id': self.assigned_reviewer_id,
            'change_cmd': {},
            'score_category': 'translation.English'
        }

        observed_suggestion = suggestion_domain.Suggestion(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['suggestion_type'],
            expected_suggestion_dict['target_type'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.assigned_reviewer_id, self.reviewer_id,
            expected_suggestion_dict['change_cmd'],
            expected_suggestion_dict['score_category'])

        self.assertDictEqual(
            observed_suggestion.to_dict(), expected_suggestion_dict)
