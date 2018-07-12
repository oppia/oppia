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

"""Tests for suggestion registry classes."""

import datetime

from core.domain import exp_domain
from core.domain import suggestion_registry
from core.platform import models
from core.tests import test_utils
import utils

(suggestion_models,) = models.Registry.import_models([models.NAMES.suggestion])


class BaseSuggestionUnitTests(test_utils.GenericTestBase):
    """Tests for the BaseSuggestion class."""

    def test_base_class_methods_raises_error(self):
        with self.assertRaisesRegexp(
            NotImplementedError,
            'Subclasses of BaseSuggestion should implement __init__.'):
            suggestion_registry.BaseSuggestion()

        with self.assertRaisesRegexp(
            NotImplementedError,
            'Subclasses of BaseSuggestion should implement from_dict.'):
            suggestion_registry.BaseSuggestion.from_dict()


class SuggestionEditStateContentUnitTests(test_utils.GenericTestBase):
    """Tests for the SuggestionEditStateContent class."""

    AUTHOR_EMAIL = 'author@example.com'
    REVIEWER_EMAIL = 'reviewer@example.com'
    ASSIGNED_REVIEWER_EMAIL = 'assigned_reviewer@example.com'
    fake_date = datetime.datetime(2016, 4, 10, 0, 0, 0, 0)

    def setUp(self):
        super(SuggestionEditStateContentUnitTests, self).setUp()

        self.signup(self.AUTHOR_EMAIL, 'author')
        self.author_id = self.get_user_id_from_email(self.AUTHOR_EMAIL)
        self.signup(self.REVIEWER_EMAIL, 'reviewer')
        self.reviewer_id = self.get_user_id_from_email(self.REVIEWER_EMAIL)
        self.suggestion_dict = {
            'suggestion_id': 'exploration.exp1.thread1',
            'suggestion_type': (
                suggestion_models.SUGGESTION_TYPE_EDIT_STATE_CONTENT),
            'target_type': suggestion_models.TARGET_TYPE_EXPLORATION,
            'target_id': 'exp1',
            'target_version_at_submission': 1,
            'status': suggestion_models.STATUS_ACCEPTED,
            'author_name': 'author',
            'final_reviewer_id': self.reviewer_id,
            'change_cmd': {
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'property_name': exp_domain.STATE_PROPERTY_CONTENT,
                'state_name': 'state_1',
                'new_value': 'new suggestion content',
                'old_value': None
            },
            'score_category': 'content.Algebra',
            'last_updated': utils.get_time_in_millisecs(self.fake_date)
        }

    def test_create_suggestion_edit_state_content(self):
        expected_suggestion_dict = self.suggestion_dict

        observed_suggestion = suggestion_registry.SuggestionEditStateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change_cmd'],
            expected_suggestion_dict['score_category'], self.fake_date)

        self.assertDictEqual(
            observed_suggestion.to_dict(), expected_suggestion_dict)

    def test_from_dict_suggestion_edit_state_content(self):
        suggestion_dict_to_be_passed = {
            'suggestion_id': 'exploration.exp1.thread1',
            'suggestion_type': (
                suggestion_models.SUGGESTION_TYPE_EDIT_STATE_CONTENT),
            'target_type': suggestion_models.TARGET_TYPE_EXPLORATION,
            'target_id': 'exp1',
            'target_version_at_submission': 1,
            'status': suggestion_models.STATUS_ACCEPTED,
            'author_id': self.author_id,
            'final_reviewer_id': self.reviewer_id,
            'change_cmd': {
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'property_name': exp_domain.STATE_PROPERTY_CONTENT,
                'state_name': 'state_1',
                'new_value': 'new suggestion content',
                'old_value': None
            },
            'score_category': 'content.Algebra',
            'last_updated': self.fake_date
        }
        observed_suggestion = (
            suggestion_registry.SuggestionEditStateContent.from_dict(
                suggestion_dict_to_be_passed))
        self.assertDictEqual(
            observed_suggestion.to_dict(), self.suggestion_dict)
        self.assertIsInstance(
            observed_suggestion, suggestion_registry.SuggestionEditStateContent)

    def test_validate_suggestion_edit_state_content(self):
        expected_suggestion_dict = self.suggestion_dict

        suggestion = suggestion_registry.SuggestionEditStateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change_cmd'],
            expected_suggestion_dict['score_category'], self.fake_date)

        suggestion.validate()

    def test_get_score_part_helper_methods(self):
        expected_suggestion_dict = self.suggestion_dict

        suggestion = suggestion_registry.SuggestionEditStateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change_cmd'],
            expected_suggestion_dict['score_category'], self.fake_date)

        self.assertEqual(suggestion.get_score_type(), 'content')
        self.assertEqual(suggestion.get_score_sub_type(), 'Algebra')
