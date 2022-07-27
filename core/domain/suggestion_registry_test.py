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

from __future__ import annotations

import datetime
import os

from core import feconf
from core import utils
from core.domain import config_services
from core.domain import exp_domain
from core.domain import exp_fetchers
from core.domain import exp_services
from core.domain import fs_services
from core.domain import html_validation_service
from core.domain import question_domain
from core.domain import question_services
from core.domain import skill_services
from core.domain import state_domain
from core.domain import suggestion_registry
from core.domain import suggestion_services
from core.domain import translation_domain
from core.platform import models
from core.tests import test_utils

(suggestion_models,) = models.Registry.import_models([models.NAMES.suggestion])


class MockInvalidSuggestion(suggestion_registry.BaseSuggestion):

    def __init__(self):  # pylint: disable=super-init-not-called
        pass


class BaseSuggestionUnitTests(test_utils.GenericTestBase):
    """Tests for the BaseSuggestion class."""

    def setUp(self):
        super(BaseSuggestionUnitTests, self).setUp()
        self.base_suggestion = MockInvalidSuggestion()

    def test_base_class_accept_raises_error(self):
        with self.assertRaisesRegex(
            NotImplementedError,
            'Subclasses of BaseSuggestion should implement accept.'):
            self.base_suggestion.accept()

    def test_base_class_get_change_list_for_accepting_suggestion_raises_error(
            self):
        with self.assertRaisesRegex(
            NotImplementedError,
            'Subclasses of BaseSuggestion should implement '
            'get_change_list_for_accepting_suggestion.'):
            self.base_suggestion.get_change_list_for_accepting_suggestion()

    def test_base_class_pre_accept_validate_raises_error(self):
        with self.assertRaisesRegex(
            NotImplementedError,
            'Subclasses of BaseSuggestion should implement'
            ' pre_accept_validate.'):
            self.base_suggestion.pre_accept_validate()

    def test_base_class_populate_old_value_of_change_raises_error(self):
        with self.assertRaisesRegex(
            NotImplementedError,
            'Subclasses of BaseSuggestion should implement'
            ' populate_old_value_of_change.'):
            self.base_suggestion.populate_old_value_of_change()

    def test_base_class_pre_update_validate_raises_error(self):
        with self.assertRaisesRegex(
            NotImplementedError,
            'Subclasses of BaseSuggestion should implement'
            ' pre_update_validate.'):
            self.base_suggestion.pre_update_validate({})

    def test_base_class_get_all_html_content_strings(self):
        with self.assertRaisesRegex(
            NotImplementedError,
            'Subclasses of BaseSuggestion should implement'
            ' get_all_html_content_strings.'):
            self.base_suggestion.get_all_html_content_strings()

    def test_base_class_get_target_entity_html_strings(self):
        with self.assertRaisesRegex(
            NotImplementedError,
            'Subclasses of BaseSuggestion should implement'
            ' get_target_entity_html_strings.'):
            self.base_suggestion.get_target_entity_html_strings()

    def test_base_class_convert_html_in_suggestion_change(self):
        def conversion_fn():
            """Temporary function."""
            pass
        with self.assertRaisesRegex(
            NotImplementedError,
            'Subclasses of BaseSuggestion should implement'
            ' convert_html_in_suggestion_change.'):
            self.base_suggestion.convert_html_in_suggestion_change(
                conversion_fn)


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
                feconf.SUGGESTION_TYPE_EDIT_STATE_CONTENT),
            'target_type': feconf.ENTITY_TYPE_EXPLORATION,
            'target_id': 'exp1',
            'target_version_at_submission': 1,
            'status': suggestion_models.STATUS_ACCEPTED,
            'author_name': 'author',
            'final_reviewer_id': self.reviewer_id,
            'change': {
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'property_name': exp_domain.STATE_PROPERTY_CONTENT,
                'state_name': 'state_1',
                'new_value': 'new suggestion content',
                'old_value': None
            },
            'score_category': 'content.Algebra',
            'language_code': None,
            'last_updated': utils.get_time_in_millisecs(self.fake_date),
            'edited_by_reviewer': False
        }

    def test_create_suggestion_edit_state_content(self):
        expected_suggestion_dict = self.suggestion_dict

        observed_suggestion = suggestion_registry.SuggestionEditStateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date)

        self.assertDictEqual(
            observed_suggestion.to_dict(), expected_suggestion_dict)

    def test_validate_suggestion_edit_state_content(self):
        expected_suggestion_dict = self.suggestion_dict

        suggestion = suggestion_registry.SuggestionEditStateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date)

        suggestion.validate()

    def test_get_score_part_helper_methods(self):
        expected_suggestion_dict = self.suggestion_dict

        suggestion = suggestion_registry.SuggestionEditStateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date)

        self.assertEqual(suggestion.get_score_type(), 'content')
        self.assertEqual(suggestion.get_score_sub_type(), 'Algebra')

    def test_validate_suggestion_type(self):
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionEditStateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date)

        suggestion.validate()

        suggestion.suggestion_type = 'invalid_suggestion_type'
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected suggestion_type to be among allowed choices'
        ):
            suggestion.validate()

    def test_validate_target_type(self):
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionEditStateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date)

        suggestion.validate()

        suggestion.target_type = 'invalid_target_type'
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected target_type to be among allowed choices'
        ):
            suggestion.validate()

    def test_validate_target_id(self):
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionEditStateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date)

        suggestion.validate()

        suggestion.target_id = 0
        with self.assertRaisesRegex(
            utils.ValidationError, 'Expected target_id to be a string'
        ):
            suggestion.validate()

    def test_validate_target_version_at_submission(self):
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionEditStateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date)

        suggestion.validate()

        suggestion.target_version_at_submission = 'invalid_version'
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected target_version_at_submission to be an int'
        ):
            suggestion.validate()

    def test_validate_status(self):
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionEditStateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date)

        suggestion.validate()

        suggestion.status = 'invalid_status'
        with self.assertRaisesRegex(
            utils.ValidationError, 'Expected status to be among allowed choices'
        ):
            suggestion.validate()

    def test_validate_author_id(self):
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionEditStateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date)

        suggestion.validate()

        suggestion.author_id = 0
        with self.assertRaisesRegex(
            utils.ValidationError, 'Expected author_id to be a string'
        ):
            suggestion.validate()

    def test_validate_author_id_format(self):
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionEditStateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date)

        suggestion.validate()

        suggestion.author_id = self.PSEUDONYMOUS_ID
        suggestion.validate()

        suggestion.author_id = ''
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected author_id to be in a valid user ID format'
        ):
            suggestion.validate()

    def test_validate_final_reviewer_id(self):
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionEditStateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date)

        suggestion.validate()

        suggestion.final_reviewer_id = 1
        with self.assertRaisesRegex(
            utils.ValidationError, 'Expected final_reviewer_id to be a string'
        ):
            suggestion.validate()

    def test_validate_final_reviewer_id_format(self):
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionEditStateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date)

        suggestion.validate()

        suggestion.final_reviewer_id = self.PSEUDONYMOUS_ID
        suggestion.validate()

        suggestion.final_reviewer_id = ''
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected final_reviewer_id to be in a valid user ID format'
        ):
            suggestion.validate()

    def test_validate_score_category(self):
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionEditStateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date)

        suggestion.validate()

        suggestion.score_category = 0
        with self.assertRaisesRegex(
            utils.ValidationError, 'Expected score_category to be a string'
        ):
            suggestion.validate()

    def test_validate_score_category_format(self):
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionEditStateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date)

        suggestion.validate()

        suggestion.score_category = 'score.score_type.score_sub_type'
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected score_category to be of the form'
            ' score_type.score_sub_type'
        ):
            suggestion.validate()

        suggestion.score_category = 'invalid_score_category'
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected score_category to be of the form'
            ' score_type.score_sub_type'
        ):
            suggestion.validate()

    def test_validate_score_type(self):
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionEditStateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date)

        suggestion.validate()

        suggestion.score_category = 'invalid_score_type.score_sub_type'
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected the first part of score_category to be among allowed'
            ' choices'
        ):
            suggestion.validate()

    def test_validate_change(self):
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionEditStateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date)

        suggestion.validate()

        suggestion.change = {}
        with self.assertRaisesRegex(
            utils.ValidationError, 'Expected change to be an ExplorationChange'
        ):
            suggestion.validate()

    def test_validate_score_type_content(self):
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionEditStateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date)

        suggestion.validate()

        suggestion.score_category = 'question.score_sub_type'
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected the first part of score_category to be content'
        ):
            suggestion.validate()

    def test_validate_change_cmd(self):
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionEditStateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date)
        suggestion.validate()

        suggestion.change.cmd = 'invalid_cmd'
        with self.assertRaisesRegex(
            utils.ValidationError, 'Expected cmd to be edit_state_property'
        ):
            suggestion.validate()

    def test_validate_change_property_name(self):
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionEditStateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date)

        suggestion.validate()

        suggestion.change.property_name = 'invalid_property'
        with self.assertRaisesRegex(
            utils.ValidationError, 'Expected property_name to be content'
        ):
            suggestion.validate()

    def test_validate_language_code_fails_when_language_codes_do_not_match(
            self):
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionEditStateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date)
        suggestion.validate()

        suggestion.language_code = 'wrong_language_code'

        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected language_code to be None, received wrong_language_code'
        ):
            suggestion.validate()

    def test_pre_accept_validate_state_name(self):
        self.save_new_default_exploration('exp1', self.author_id)
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionEditStateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date)

        suggestion.change.state_name = 'Introduction'

        suggestion.pre_accept_validate()

        suggestion.change.state_name = 'invalid_state_name'
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected invalid_state_name to be a valid state name'
        ):
            suggestion.pre_accept_validate()

    def test_populate_old_value_of_change_with_invalid_state(self):
        self.save_new_default_exploration('exp1', self.author_id)
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionEditStateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date)

        suggestion.change.state_name = 'invalid_state_name'

        self.assertIsNone(suggestion.change.old_value)

        suggestion.populate_old_value_of_change()

        self.assertIsNone(suggestion.change.old_value)

    def test_pre_update_validate_change_cmd(self):
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionEditStateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date)

        change = {
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'property_name': exp_domain.STATE_PROPERTY_CONTENT,
            'state_name': suggestion.change.state_name,
            'new_value': 'new suggestion content',
            'old_value': None
        }
        with self.assertRaisesRegex(
            utils.ValidationError,
            'The following extra attributes are present: new_value, '
            'old_value, property_name'
        ):
            suggestion.pre_update_validate(exp_domain.ExplorationChange(change))

    def test_pre_update_validate_change_property_name(self):
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionEditStateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date)

        change = {
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'property_name': exp_domain.STATE_PROPERTY_PARAM_CHANGES,
            'state_name': suggestion.change.state_name,
            'new_value': 'new suggestion content',
            'old_value': None
        }
        with self.assertRaisesRegex(
            utils.ValidationError,
            'The new change property_name must be equal to content'
        ):
            suggestion.pre_update_validate(exp_domain.ExplorationChange(change))

    def test_pre_update_validate_change_state_name(self):
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionEditStateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date)

        change = {
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'property_name': exp_domain.STATE_PROPERTY_CONTENT,
            'state_name': 'invalid_state',
            'new_value': 'new suggestion content',
            'old_value': None
        }
        with self.assertRaisesRegex(
            utils.ValidationError,
            'The new change state_name must be equal to state_1'
        ):
            suggestion.pre_update_validate(exp_domain.ExplorationChange(change))

    def test_pre_update_validate_change_new_value(self):
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionEditStateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date)
        new_content = state_domain.SubtitledHtml(
            'content', '<p>new suggestion html</p>').to_dict()

        suggestion.change.new_value = new_content

        change = {
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'property_name': exp_domain.STATE_PROPERTY_CONTENT,
            'state_name': suggestion.change.state_name,
            'new_value': new_content,
            'old_value': None
        }
        with self.assertRaisesRegex(
            utils.ValidationError, 'The new html must not match the old html'
        ):
            suggestion.pre_update_validate(exp_domain.ExplorationChange(change))

    def test_pre_update_validate_non_equal_change_cmd(self):
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionEditStateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date)

        with self.assertRaisesRegex(
            utils.ValidationError,
            'The new change cmd must be equal to edit_state_property'
        ):
            suggestion.pre_update_validate(exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                'property_name': 'title',
                'new_value': 'Exploration 1 Albert title'
            }))

    def test_get_all_html_content_strings(self):
        change_dict = {
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'property_name': exp_domain.STATE_PROPERTY_CONTENT,
            'state_name': 'state_1',
            'new_value': {
                'content_id': 'content',
                'html': 'new suggestion content'
            },
            'old_value': None
        }
        suggestion = suggestion_registry.SuggestionEditStateContent(
            self.suggestion_dict['suggestion_id'],
            self.suggestion_dict['target_id'],
            self.suggestion_dict['target_version_at_submission'],
            self.suggestion_dict['status'], self.author_id,
            self.reviewer_id, change_dict,
            self.suggestion_dict['score_category'],
            self.suggestion_dict['language_code'], False, self.fake_date)

        actual_outcome_list = suggestion.get_all_html_content_strings()
        expected_outcome_list = [u'new suggestion content']
        self.assertEqual(expected_outcome_list, actual_outcome_list)

    def test_convert_html_in_suggestion_change(self):
        html_content = (
            '<p>Value</p><oppia-noninteractive-math raw_latex-with-value="&a'
            'mp;quot;+,-,-,+&amp;quot;"></oppia-noninteractive-math>')
        expected_html_content = (
            '<p>Value</p><oppia-noninteractive-math math_content-with-value='
            '"{&amp;quot;raw_latex&amp;quot;: &amp;quot;+,-,-,+&amp;quot;, &'
            'amp;quot;svg_filename&amp;quot;: &amp;quot;&amp;quot;}"></oppia'
            '-noninteractive-math>')

        change = {
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'property_name': exp_domain.STATE_PROPERTY_CONTENT,
            'state_name': 'Introduction',
            'new_value': {
                'content_id': 'content',
                'html': '<p>suggestion</p>'
            },
            'old_value': {
                'content_id': 'content',
                'html': html_content
            }
        }
        suggestion = suggestion_registry.SuggestionEditStateContent(
            self.suggestion_dict['suggestion_id'],
            self.suggestion_dict['target_id'],
            self.suggestion_dict['target_version_at_submission'],
            self.suggestion_dict['status'], self.author_id,
            self.reviewer_id, change,
            self.suggestion_dict['score_category'],
            self.suggestion_dict['language_code'], False, self.fake_date)

        suggestion.convert_html_in_suggestion_change(
            html_validation_service.
            add_math_content_to_math_rte_components)
        self.assertEqual(
            suggestion.change.old_value['html'], expected_html_content)

    def test_get_target_entity_html_strings_returns_expected_strings(self):
        change_dict = {
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'property_name': exp_domain.STATE_PROPERTY_CONTENT,
            'state_name': 'state_1',
            'new_value': {
                'content_id': 'content',
                'html': 'new suggestion content'
            },
            'old_value': {
                'content_id': 'content',
                'html': 'Old content.'
            }
        }
        suggestion = suggestion_registry.SuggestionEditStateContent(
            self.suggestion_dict['suggestion_id'],
            self.suggestion_dict['target_id'],
            self.suggestion_dict['target_version_at_submission'],
            self.suggestion_dict['status'], self.author_id,
            self.reviewer_id, change_dict,
            self.suggestion_dict['score_category'],
            self.suggestion_dict['language_code'], False, self.fake_date)

        actual_outcome_list = suggestion.get_target_entity_html_strings()
        expected_outcome_list = [u'Old content.']
        self.assertEqual(expected_outcome_list, actual_outcome_list)

    def test_get_target_entity_html_with_none_old_value(self):
        change_dict = {
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'property_name': exp_domain.STATE_PROPERTY_CONTENT,
            'state_name': 'state_1',
            'new_value': {
                'content_id': 'content',
                'html': 'new suggestion content'
            },
            'old_value': None
        }
        suggestion = suggestion_registry.SuggestionEditStateContent(
            self.suggestion_dict['suggestion_id'],
            self.suggestion_dict['target_id'],
            self.suggestion_dict['target_version_at_submission'],
            self.suggestion_dict['status'], self.author_id,
            self.reviewer_id, change_dict,
            self.suggestion_dict['score_category'],
            self.suggestion_dict['language_code'], False, self.fake_date)

        actual_outcome_list = suggestion.get_target_entity_html_strings()
        self.assertEqual(actual_outcome_list, [])


class SuggestionTranslateContentUnitTests(test_utils.GenericTestBase):
    """Tests for the SuggestionEditStateContent class."""

    AUTHOR_EMAIL = 'author@example.com'
    REVIEWER_EMAIL = 'reviewer@example.com'
    ASSIGNED_REVIEWER_EMAIL = 'assigned_reviewer@example.com'
    fake_date = datetime.datetime(2016, 4, 10, 0, 0, 0, 0)

    def setUp(self):
        super(SuggestionTranslateContentUnitTests, self).setUp()

        self.signup(self.AUTHOR_EMAIL, 'author')
        self.author_id = self.get_user_id_from_email(self.AUTHOR_EMAIL)
        self.signup(self.REVIEWER_EMAIL, 'reviewer')
        self.reviewer_id = self.get_user_id_from_email(self.REVIEWER_EMAIL)
        self.suggestion_dict = {
            'suggestion_id': 'exploration.exp1.thread1',
            'suggestion_type': (
                feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT),
            'target_type': feconf.ENTITY_TYPE_EXPLORATION,
            'target_id': 'exp1',
            'target_version_at_submission': 1,
            'status': suggestion_models.STATUS_ACCEPTED,
            'author_name': 'author',
            'final_reviewer_id': self.reviewer_id,
            'change': {
                'cmd': exp_domain.CMD_ADD_WRITTEN_TRANSLATION,
                'state_name': 'Introduction',
                'content_id': 'content',
                'language_code': 'hi',
                'content_html': '<p>This is a content.</p>',
                'translation_html': '<p>This is translated html.</p>',
                'data_format': 'html'
            },
            'score_category': 'translation.Algebra',
            'language_code': 'hi',
            'last_updated': utils.get_time_in_millisecs(self.fake_date),
            'edited_by_reviewer': False
        }

    def test_pre_update_validate_fails_for_invalid_change_cmd(self):
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionTranslateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], self.fake_date)

        change = {
            'cmd': exp_domain.CMD_DELETE_STATE,
            'state_name': 'Introduction'
        }
        with self.assertRaisesRegex(
            utils.ValidationError,
            'The new change cmd must be equal to %s' % (
                exp_domain.CMD_ADD_WRITTEN_TRANSLATION)
        ):
            suggestion.pre_update_validate(exp_domain.ExplorationChange(change))

    def test_pre_update_validate_change_state_name(self):
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionTranslateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], self.fake_date)
        change = {
            'cmd': exp_domain.CMD_ADD_WRITTEN_TRANSLATION,
            'state_name': 'State 1',
            'content_id': 'content',
            'language_code': 'hi',
            'content_html': '<p>This is a content.</p>',
            'translation_html': '<p>This is the updated translated html.</p>',
            'data_format': 'html'
        }
        with self.assertRaisesRegex(
            utils.ValidationError,
            'The new change state_name must be equal to Introduction'
        ):
            suggestion.pre_update_validate(exp_domain.ExplorationChange(change))

    def test_pre_update_validate_change_language_code(self):
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionTranslateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], self.fake_date)
        change = {
            'cmd': exp_domain.CMD_ADD_WRITTEN_TRANSLATION,
            'state_name': 'Introduction',
            'content_id': 'content',
            'language_code': 'en',
            'content_html': '<p>This is a content.</p>',
            'translation_html': '<p>This is the updated translated html.</p>',
            'data_format': 'html'
        }
        with self.assertRaisesRegex(
            utils.ValidationError,
            'The language code must be equal to hi'
        ):
            suggestion.pre_update_validate(exp_domain.ExplorationChange(change))

    def test_pre_update_validate_change_content_html(self):
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionTranslateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], self.fake_date)
        change = {
            'cmd': exp_domain.CMD_ADD_WRITTEN_TRANSLATION,
            'state_name': 'Introduction',
            'content_id': 'content',
            'language_code': 'en',
            'content_html': '<p>This is the changed content.</p>',
            'translation_html': '<p>This is the updated translated html.</p>',
            'data_format': 'html'
        }
        with self.assertRaisesRegex(
            utils.ValidationError,
            'The new change content_html must be equal to <p>This is a ' +
            'content.</p>'
        ):
            suggestion.pre_update_validate(
                exp_domain.ExplorationChange(change))

    def test_create_suggestion_add_translation(self):
        expected_suggestion_dict = self.suggestion_dict

        observed_suggestion = suggestion_registry.SuggestionTranslateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date)

        self.assertDictEqual(
            observed_suggestion.to_dict(), expected_suggestion_dict)

    def test_validate_suggestion_add_translation(self):
        expected_suggestion_dict = self.suggestion_dict

        suggestion = suggestion_registry.SuggestionTranslateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date)

        suggestion.validate()

    def test_get_score_part_helper_methods(self):
        expected_suggestion_dict = self.suggestion_dict

        suggestion = suggestion_registry.SuggestionTranslateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date)

        self.assertEqual(suggestion.get_score_type(), 'translation')
        self.assertEqual(suggestion.get_score_sub_type(), 'Algebra')

    def test_validate_suggestion_type(self):
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionTranslateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date)

        suggestion.validate()

        suggestion.suggestion_type = 'invalid_suggestion_type'
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected suggestion_type to be among allowed choices'
        ):
            suggestion.validate()

    def test_validate_target_type(self):
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionTranslateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date)

        suggestion.validate()

        suggestion.target_type = 'invalid_target_type'
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected target_type to be among allowed choices'
        ):
            suggestion.validate()

    def test_validate_target_id(self):
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionTranslateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date)

        suggestion.validate()

        suggestion.target_id = 0
        with self.assertRaisesRegex(
            utils.ValidationError, 'Expected target_id to be a string'
        ):
            suggestion.validate()

    def test_validate_target_version_at_submission(self):
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionTranslateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date)

        suggestion.validate()

        suggestion.target_version_at_submission = 'invalid_version'
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected target_version_at_submission to be an int'
        ):
            suggestion.validate()

    def test_validate_status(self):
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionTranslateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date)

        suggestion.validate()

        suggestion.status = 'invalid_status'
        with self.assertRaisesRegex(
            utils.ValidationError, 'Expected status to be among allowed choices'
        ):
            suggestion.validate()

    def test_validate_author_id(self):
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionTranslateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date)

        suggestion.validate()

        suggestion.author_id = 0
        with self.assertRaisesRegex(
            utils.ValidationError, 'Expected author_id to be a string'
        ):
            suggestion.validate()

    def test_validate_author_id_format(self):
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionTranslateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date)

        suggestion.validate()

        suggestion.author_id = ''
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected author_id to be in a valid user ID format.'
        ):
            suggestion.validate()

    def test_validate_final_reviewer_id(self):
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionTranslateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date)

        suggestion.validate()

        suggestion.final_reviewer_id = 1
        with self.assertRaisesRegex(
            utils.ValidationError, 'Expected final_reviewer_id to be a string'
        ):
            suggestion.validate()

    def test_validate_final_reviewer_id_format(self):
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionTranslateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date)

        suggestion.validate()

        suggestion.final_reviewer_id = ''
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected final_reviewer_id to be in a valid user ID format'
        ):
            suggestion.validate()

    def test_validate_score_category(self):
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionTranslateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date)

        suggestion.validate()

        suggestion.score_category = 0
        with self.assertRaisesRegex(
            utils.ValidationError, 'Expected score_category to be a string'
        ):
            suggestion.validate()

    def test_validate_score_category_format(self):
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionTranslateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date)

        suggestion.validate()

        suggestion.score_category = 'score.score_type.score_sub_type'
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected score_category to be of the form'
            ' score_type.score_sub_type'
        ):
            suggestion.validate()

        suggestion.score_category = 'invalid_score_category'
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected score_category to be of the form'
            ' score_type.score_sub_type'
        ):
            suggestion.validate()

    def test_validate_score_type(self):
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionTranslateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date)

        suggestion.validate()

        suggestion.score_category = 'invalid_score_type.score_sub_type'
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected the first part of score_category to be among allowed'
            ' choices'
        ):
            suggestion.validate()

    def test_validate_change(self):
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionTranslateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date)

        suggestion.validate()

        suggestion.change = {}
        with self.assertRaisesRegex(
            utils.ValidationError, 'Expected change to be an ExplorationChange'
        ):
            suggestion.validate()

    def test_validate_score_type_translation(self):
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionTranslateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date)

        suggestion.validate()

        suggestion.score_category = 'question.score_sub_type'
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected the first part of score_category to be translation'
        ):
            suggestion.validate()

    def test_validate_change_cmd(self):
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionTranslateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date)

        suggestion.validate()

        suggestion.change.cmd = 'invalid_cmd'
        with self.assertRaisesRegex(
            utils.ValidationError, 'Expected cmd to be add_written_translation'
        ):
            suggestion.validate()

    def test_validate_language_code_fails_when_language_codes_do_not_match(
            self):
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionTranslateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date)
        expected_language_code = (
            expected_suggestion_dict['change']['language_code']
        )
        suggestion.validate()

        suggestion.language_code = 'wrong_language_code'

        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected language_code to be %s, '
            'received wrong_language_code' % expected_language_code
        ):
            suggestion.validate()

    def test_validate_language_code_fails_when_language_code_is_set_to_none(
            self):
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionTranslateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date)
        suggestion.validate()

        suggestion.language_code = None

        with self.assertRaisesRegex(
            utils.ValidationError, 'language_code cannot be None'
        ):
            suggestion.validate()

    def test_validate_change_with_invalid_language_code_fails_validation(self):
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionTranslateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date)

        suggestion.validate()

        suggestion.change.language_code = 'invalid_code'
        with self.assertRaisesRegex(
            utils.ValidationError, 'Invalid language_code: invalid_code'
        ):
            suggestion.validate()

    def test_pre_accept_validate_state_name(self):
        self.save_new_default_exploration('exp1', self.author_id)
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionTranslateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date)

        exp_services.update_exploration(
            self.author_id, 'exp1', [
                exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                    'property_name': exp_domain.STATE_PROPERTY_CONTENT,
                    'new_value': {
                        'content_id': 'content',
                        'html': '<p>This is a content.</p>'
                    },
                    'state_name': 'Introduction',
                })
            ], 'Added state')
        suggestion.change.state_name = 'Introduction'

        suggestion.pre_accept_validate()

        suggestion.change.state_name = 'invalid_state_name'
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected invalid_state_name to be a valid state name'
        ):
            suggestion.pre_accept_validate()

    def test_accept_suggestion_adds_translation_in_exploration(self):
        self.save_new_default_exploration('exp1', self.author_id)
        exploration = exp_fetchers.get_exploration_by_id('exp1')
        self.assertEqual(exploration.get_translation_counts(), {})
        suggestion = suggestion_registry.SuggestionTranslateContent(
            self.suggestion_dict['suggestion_id'],
            self.suggestion_dict['target_id'],
            self.suggestion_dict['target_version_at_submission'],
            self.suggestion_dict['status'], self.author_id,
            self.reviewer_id, self.suggestion_dict['change'],
            self.suggestion_dict['score_category'],
            self.suggestion_dict['language_code'], False, self.fake_date)

        suggestion.accept(
            'Accepted suggestion by translator: Add translation change.')

        exploration = exp_fetchers.get_exploration_by_id('exp1')
        self.assertEqual(exploration.get_translation_counts(), {
            'hi': 1
        })

    def test_accept_suggestion_with_set_of_string_adds_translation(self):
        self.save_new_default_exploration('exp1', self.author_id)
        exploration = exp_fetchers.get_exploration_by_id('exp1')
        self.assertEqual(exploration.get_translation_counts(), {})
        suggestion = suggestion_registry.SuggestionTranslateContent(
            self.suggestion_dict['suggestion_id'],
            self.suggestion_dict['target_id'],
            self.suggestion_dict['target_version_at_submission'],
            self.suggestion_dict['status'], self.author_id,
            self.reviewer_id,
            {
                'cmd': exp_domain.CMD_ADD_WRITTEN_TRANSLATION,
                'state_name': 'Introduction',
                'content_id': 'content',
                'language_code': 'hi',
                'content_html': ['text1', 'text2'],
                'translation_html': ['translated text1', 'translated text2'],
                'data_format': 'set_of_normalized_string'
            },
            self.suggestion_dict['score_category'],
            self.suggestion_dict['language_code'], False, self.fake_date)

        suggestion.accept(
            'Accepted suggestion by translator: Add translation change.')

        exploration = exp_fetchers.get_exploration_by_id('exp1')
        self.assertEqual(exploration.get_translation_counts(), {
            'hi': 1
        })

    def test_accept_suggestion_with_psedonymous_author_adds_translation(self):
        self.save_new_default_exploration('exp1', self.author_id)

        exploration = exp_fetchers.get_exploration_by_id('exp1')
        self.assertEqual(exploration.get_translation_counts(), {})

        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionTranslateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.PSEUDONYMOUS_ID,
            self.reviewer_id, expected_suggestion_dict['change'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date)

        suggestion.accept(
            'Accepted suggestion by translator: Add translation change.')

        exploration = exp_fetchers.get_exploration_by_id('exp1')

        self.assertEqual(exploration.get_translation_counts(), {
            'hi': 1
        })

    def test_get_all_html_content_strings(self):
        suggestion = suggestion_registry.SuggestionTranslateContent(
            self.suggestion_dict['suggestion_id'],
            self.suggestion_dict['target_id'],
            self.suggestion_dict['target_version_at_submission'],
            self.suggestion_dict['status'], self.author_id,
            self.reviewer_id, self.suggestion_dict['change'],
            self.suggestion_dict['score_category'],
            self.suggestion_dict['language_code'], False, self.fake_date)

        actual_outcome_list = suggestion.get_all_html_content_strings()

        expected_outcome_list = [
            u'<p>This is translated html.</p>', u'<p>This is a content.</p>']
        self.assertEqual(expected_outcome_list, actual_outcome_list)

    def test_get_all_html_content_strings_for_content_lists(self):
        suggestion = suggestion_registry.SuggestionTranslateContent(
            self.suggestion_dict['suggestion_id'],
            self.suggestion_dict['target_id'],
            self.suggestion_dict['target_version_at_submission'],
            self.suggestion_dict['status'], self.author_id,
            self.reviewer_id,
            {
                'cmd': exp_domain.CMD_ADD_WRITTEN_TRANSLATION,
                'state_name': 'Introduction',
                'content_id': 'content',
                'language_code': 'hi',
                'content_html': ['text1', 'text2'],
                'translation_html': ['translated text1', 'translated text2'],
                'data_format': 'set_of_normalized_string'
            },
            self.suggestion_dict['score_category'],
            self.suggestion_dict['language_code'], False, self.fake_date)

        actual_outcome_list = suggestion.get_all_html_content_strings()

        expected_outcome_list = [
            'translated text1', 'translated text2', 'text1', 'text2']
        self.assertEqual(expected_outcome_list, actual_outcome_list)

    def test_get_target_entity_html_strings_returns_expected_strings(self):
        suggestion = suggestion_registry.SuggestionTranslateContent(
            self.suggestion_dict['suggestion_id'],
            self.suggestion_dict['target_id'],
            self.suggestion_dict['target_version_at_submission'],
            self.suggestion_dict['status'], self.author_id,
            self.reviewer_id, self.suggestion_dict['change'],
            self.suggestion_dict['score_category'],
            self.suggestion_dict['language_code'], False, self.fake_date)

        actual_outcome_list = suggestion.get_target_entity_html_strings()
        expected_outcome_list = [self.suggestion_dict['change']['content_html']]
        self.assertEqual(expected_outcome_list, actual_outcome_list)

    def test_convert_html_in_suggestion_change(self):
        html_content = (
            '<p>Value</p><oppia-noninteractive-math raw_latex-with-value="&a'
            'mp;quot;+,-,-,+&amp;quot;"></oppia-noninteractive-math>')
        expected_html_content = (
            '<p>Value</p><oppia-noninteractive-math math_content-with-value='
            '"{&amp;quot;raw_latex&amp;quot;: &amp;quot;+,-,-,+&amp;quot;, &'
            'amp;quot;svg_filename&amp;quot;: &amp;quot;&amp;quot;}"></oppia'
            '-noninteractive-math>')
        change_dict = {
            'cmd': exp_domain.CMD_ADD_WRITTEN_TRANSLATION,
            'state_name': 'Introduction',
            'content_id': 'content',
            'language_code': 'hi',
            'content_html': html_content,
            'translation_html': '<p>This is translated html.</p>',
            'data_format': 'html'
        }
        suggestion = suggestion_registry.SuggestionTranslateContent(
            self.suggestion_dict['suggestion_id'],
            self.suggestion_dict['target_id'],
            self.suggestion_dict['target_version_at_submission'],
            self.suggestion_dict['status'], self.author_id,
            self.reviewer_id, change_dict,
            self.suggestion_dict['score_category'],
            self.suggestion_dict['language_code'], False, self.fake_date)
        suggestion.convert_html_in_suggestion_change(
            html_validation_service.add_math_content_to_math_rte_components)
        self.assertEqual(
            suggestion.change.content_html, expected_html_content)


class SuggestionAddQuestionTest(test_utils.GenericTestBase):
    """Tests for the SuggestionAddQuestion class."""

    AUTHOR_EMAIL = 'author@example.com'
    REVIEWER_EMAIL = 'reviewer@example.com'
    ASSIGNED_REVIEWER_EMAIL = 'assigned_reviewer@example.com'
    fake_date = datetime.datetime(2016, 4, 10, 0, 0, 0, 0)

    def setUp(self):
        super(SuggestionAddQuestionTest, self).setUp()

        content_id_generator = translation_domain.ContentIdGenerator()
        self.signup(self.AUTHOR_EMAIL, 'author')
        self.author_id = self.get_user_id_from_email(self.AUTHOR_EMAIL)
        self.signup(self.REVIEWER_EMAIL, 'reviewer')
        self.reviewer_id = self.get_user_id_from_email(self.REVIEWER_EMAIL)
        self.suggestion_dict = {
            'suggestion_id': 'skill1.thread1',
            'suggestion_type': feconf.SUGGESTION_TYPE_ADD_QUESTION,
            'target_type': feconf.ENTITY_TYPE_SKILL,
            'target_id': 'skill1',
            'target_version_at_submission': 1,
            'status': suggestion_models.STATUS_ACCEPTED,
            'author_name': 'author',
            'final_reviewer_id': self.reviewer_id,
            'change': {
                'cmd': question_domain.CMD_CREATE_NEW_FULLY_SPECIFIED_QUESTION,
                'question_dict': {
                    'question_state_data': self._create_valid_question_data(
                        'default_state', content_id_generator).to_dict(),
                    'language_code': 'en',
                    'question_state_data_schema_version': (
                        feconf.CURRENT_STATE_SCHEMA_VERSION),
                    'linked_skill_ids': ['skill_1'],
                    'inapplicable_skill_misconception_ids': ['skillid12345-1'],
                    'next_content_id_index': (
                        content_id_generator.next_content_id_index)
                },
                'skill_id': 'skill_1',
                'skill_difficulty': 0.3,
            },
            'score_category': 'question.topic_1',
            'language_code': 'en',
            'last_updated': utils.get_time_in_millisecs(self.fake_date),
            'edited_by_reviewer': False
        }

    def test_create_suggestion_add_question(self):
        expected_suggestion_dict = self.suggestion_dict

        observed_suggestion = suggestion_registry.SuggestionAddQuestion(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date)

        self.assertDictEqual(
            observed_suggestion.to_dict(), expected_suggestion_dict)

    def test_validate_suggestion_edit_state_content(self):
        expected_suggestion_dict = self.suggestion_dict

        suggestion = suggestion_registry.SuggestionAddQuestion(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date)

        suggestion.validate()

    def test_get_score_part_helper_methods(self):
        expected_suggestion_dict = self.suggestion_dict

        suggestion = suggestion_registry.SuggestionAddQuestion(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date)

        self.assertEqual(suggestion.get_score_type(), 'question')
        self.assertEqual(suggestion.get_score_sub_type(), 'topic_1')

    def test_validate_score_type(self):
        expected_suggestion_dict = self.suggestion_dict

        suggestion = suggestion_registry.SuggestionAddQuestion(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date)

        suggestion.validate()

        suggestion.score_category = 'content.score_sub_type'

        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected the first part of score_category to be "question"'
        ):
            suggestion.validate()

    def test_validate_change_type(self):
        expected_suggestion_dict = self.suggestion_dict

        suggestion = suggestion_registry.SuggestionAddQuestion(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date)

        suggestion.validate()

        suggestion.change = 'invalid_change'

        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected change to be an instance of QuestionSuggestionChange'
        ):
            suggestion.validate()

    def test_validate_change_cmd(self):
        expected_suggestion_dict = self.suggestion_dict

        suggestion = suggestion_registry.SuggestionAddQuestion(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date)

        suggestion.validate()

        suggestion.change.cmd = None

        with self.assertRaisesRegex(
            utils.ValidationError, 'Expected change to contain cmd'
        ):
            suggestion.validate()

    def test_validate_change_cmd_type(self):
        expected_suggestion_dict = self.suggestion_dict

        suggestion = suggestion_registry.SuggestionAddQuestion(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date)

        suggestion.validate()

        suggestion.change.cmd = 'invalid_cmd'

        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected cmd to be create_new_fully_specified_question'
        ):
            suggestion.validate()

    def test_validate_change_question_dict(self):
        expected_suggestion_dict = self.suggestion_dict

        suggestion = suggestion_registry.SuggestionAddQuestion(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date)

        suggestion.validate()

        suggestion.change.question_dict = None

        with self.assertRaisesRegex(
            utils.ValidationError, 'Expected change to contain question_dict'
        ):
            suggestion.validate()

    def test_validate_change_question_state_data_schema_version(self):
        expected_suggestion_dict = self.suggestion_dict

        suggestion = suggestion_registry.SuggestionAddQuestion(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date)

        suggestion.validate()

        # We are not setting value in suggestion.change.question_dict
        # directly since pylint produces unsupported-assignment-operation
        # error. The detailed analysis for the same can be checked
        # in this issue: https://github.com/oppia/oppia/issues/7008.
        question_dict = suggestion.change.question_dict
        question_dict['question_state_data_schema_version'] = 0
        suggestion.change.question_dict = question_dict

        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected question state schema version to be %s, '
            'received 0' % feconf.CURRENT_STATE_SCHEMA_VERSION
        ):
            suggestion.validate()

    def test_validate_change_skill_difficulty_none(self):
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionAddQuestion(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date)
        suggestion.validate()

        suggestion.change.skill_difficulty = None

        with self.assertRaisesRegex(
            utils.ValidationError, 'Expected change to contain skill_difficulty'
        ):
            suggestion.validate()

    def test_validate_change_skill_difficulty_invalid_value(self):
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionAddQuestion(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date)
        suggestion.validate()

        suggestion.change.skill_difficulty = 0.4

        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected change skill_difficulty to be one of '
        ):
            suggestion.validate()

    def test_pre_accept_validate_change_skill_id(self):
        expected_suggestion_dict = self.suggestion_dict

        suggestion = suggestion_registry.SuggestionAddQuestion(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date)

        skill_id = skill_services.get_new_skill_id()
        self.save_new_skill(skill_id, self.author_id, description='description')
        suggestion.change.skill_id = skill_id

        suggestion.pre_accept_validate()

        suggestion.change.skill_id = None

        with self.assertRaisesRegex(
            utils.ValidationError, 'Expected change to contain skill_id'
        ):
            suggestion.pre_accept_validate()

    def test_pre_accept_validate_change_invalid_skill_id(self):
        expected_suggestion_dict = self.suggestion_dict

        suggestion = suggestion_registry.SuggestionAddQuestion(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date)

        skill_id = skill_services.get_new_skill_id()
        self.save_new_skill(skill_id, self.author_id, description='description')
        suggestion.change.skill_id = skill_id

        suggestion.pre_accept_validate()

        suggestion.change.skill_id = skill_services.get_new_skill_id()

        with self.assertRaisesRegex(
            utils.ValidationError, 'The skill with the given id doesn\'t exist.'
        ):
            suggestion.pre_accept_validate()

    def test_get_change_list_for_accepting_suggestion(self):
        expected_suggestion_dict = self.suggestion_dict

        suggestion = suggestion_registry.SuggestionAddQuestion(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date)

        self.assertIsNone(suggestion.get_change_list_for_accepting_suggestion())

    def test_populate_old_value_of_change(self):
        expected_suggestion_dict = self.suggestion_dict

        suggestion = suggestion_registry.SuggestionAddQuestion(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date)

        self.assertIsNone(suggestion.populate_old_value_of_change())

    def test_cannot_accept_suggestion_with_invalid_skill_id(self):
        expected_suggestion_dict = self.suggestion_dict

        suggestion = suggestion_registry.SuggestionAddQuestion(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date)

        suggestion.change.skill_id = skill_services.get_new_skill_id()

        with self.assertRaisesRegex(
            utils.ValidationError,
            'The skill with the given id doesn\'t exist.'
        ):
            suggestion.accept('commit message')

    def test_pre_update_validate_change_cmd(self):
        expected_suggestion_dict = self.suggestion_dict

        suggestion = suggestion_registry.SuggestionAddQuestion(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date)

        change = {
            'cmd': question_domain.CMD_UPDATE_QUESTION_PROPERTY,
            'property_name': question_domain.QUESTION_PROPERTY_LANGUAGE_CODE,
            'new_value': 'bn',
            'old_value': 'en'
        }
        with self.assertRaisesRegex(
            utils.ValidationError,
            'The new change cmd must be equal to '
            'create_new_fully_specified_question'
        ):
            suggestion.pre_update_validate(
                question_domain.QuestionChange(change))

    def test_pre_update_validate_change_skill_id(self):
        expected_suggestion_dict = self.suggestion_dict

        suggestion = suggestion_registry.SuggestionAddQuestion(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date)

        content_id_generator = translation_domain.ContentIdGenerator()
        change = {
            'cmd': question_domain.CMD_CREATE_NEW_FULLY_SPECIFIED_QUESTION,
            'question_dict': {
                'question_state_data': self._create_valid_question_data(
                    'default_state', content_id_generator).to_dict(),
                'language_code': 'en',
                'question_state_data_schema_version': (
                    feconf.CURRENT_STATE_SCHEMA_VERSION),
                'next_content_id_index': (
                    content_id_generator.next_content_id_index)
            },
            'skill_id': 'skill_2'
        }

        with self.assertRaisesRegex(
            utils.ValidationError,
            'The new change skill_id must be equal to skill_1'
        ):
            suggestion.pre_update_validate(
                question_domain.QuestionChange(change))

    def test_pre_update_validate_complains_if_nothing_changed(self):
        content_id_generator = translation_domain.ContentIdGenerator()
        change = {
            'cmd': question_domain.CMD_CREATE_NEW_FULLY_SPECIFIED_QUESTION,
            'question_dict': {
                'question_state_data': self._create_valid_question_data(
                    'default_state', content_id_generator).to_dict(),
                'language_code': 'en',
                'question_state_data_schema_version': (
                    feconf.CURRENT_STATE_SCHEMA_VERSION),
                'next_content_id_index': (
                    content_id_generator.next_content_id_index)
            },
            'skill_id': 'skill_1',
            'skill_difficulty': 0.3
        }

        suggestion = suggestion_registry.SuggestionAddQuestion(
            'exploration.exp1.thread1', 'exp1', 1,
            suggestion_models.STATUS_ACCEPTED, self.author_id,
            self.reviewer_id, change,
            'question.topic_1', 'en', self.fake_date)

        content_id_generator = translation_domain.ContentIdGenerator()
        new_change = {
            'cmd': question_domain.CMD_CREATE_NEW_FULLY_SPECIFIED_QUESTION,
            'question_dict': {
                'question_state_data': self._create_valid_question_data(
                    'default_state', content_id_generator).to_dict(),
                'language_code': 'en',
                'question_state_data_schema_version': (
                    feconf.CURRENT_STATE_SCHEMA_VERSION),
                'next_content_id_index': (
                    content_id_generator.next_content_id_index)
            },
            'skill_id': 'skill_1',
            'skill_difficulty': 0.3
        }

        with self.assertRaisesRegex(
            utils.ValidationError,
            'At least one of the new skill_difficulty or question_dict '
            'should be changed.'):
            suggestion.pre_update_validate(
                question_domain.QuestionSuggestionChange(new_change))

    def test_pre_update_validate_accepts_a_change_in_skill_difficulty_only(
            self):
        content_id_generator = translation_domain.ContentIdGenerator()
        change = {
            'cmd': question_domain.CMD_CREATE_NEW_FULLY_SPECIFIED_QUESTION,
            'question_dict': {
                'question_state_data': self._create_valid_question_data(
                    'default_state', content_id_generator).to_dict(),
                'language_code': 'en',
                'question_state_data_schema_version': (
                    feconf.CURRENT_STATE_SCHEMA_VERSION),
                'next_content_id_index': (
                    content_id_generator.next_content_id_index)
            },
            'skill_id': 'skill_1',
            'skill_difficulty': 0.3
        }

        suggestion = suggestion_registry.SuggestionAddQuestion(
            'exploration.exp1.thread1', 'exp1', 1,
            suggestion_models.STATUS_ACCEPTED, self.author_id,
            self.reviewer_id, change,
            'question.topic_1', 'en', self.fake_date)

        content_id_generator = translation_domain.ContentIdGenerator()
        new_change = {
            'cmd': question_domain.CMD_CREATE_NEW_FULLY_SPECIFIED_QUESTION,
            'question_dict': {
                'question_state_data': self._create_valid_question_data(
                    'default_state', content_id_generator).to_dict(),
                'language_code': 'en',
                'question_state_data_schema_version': (
                    feconf.CURRENT_STATE_SCHEMA_VERSION),
                'next_content_id_index': (
                    content_id_generator.next_content_id_index)
            },
            'skill_id': 'skill_1',
            'skill_difficulty': 0.6
        }

        self.assertEqual(
            suggestion.pre_update_validate(
                question_domain.QuestionSuggestionChange(new_change)), None)

    def test_pre_update_validate_accepts_a_change_in_state_data_only(self):
        content_id_generator = translation_domain.ContentIdGenerator()
        change = {
            'cmd': question_domain.CMD_CREATE_NEW_FULLY_SPECIFIED_QUESTION,
            'question_dict': {
                'question_state_data': self._create_valid_question_data(
                    'default_state', content_id_generator).to_dict(),
                'language_code': 'en',
                'question_state_data_schema_version': (
                    feconf.CURRENT_STATE_SCHEMA_VERSION),
                'next_content_id_index': (
                    content_id_generator.next_content_id_index)
            },
            'skill_id': 'skill_1',
            'skill_difficulty': 0.3
        }

        suggestion = suggestion_registry.SuggestionAddQuestion(
            'exploration.exp1.thread1', 'exp1', 1,
            suggestion_models.STATUS_ACCEPTED, self.author_id,
            self.reviewer_id, change,
            'question.topic_1', 'en', self.fake_date)

        content_id_generator = translation_domain.ContentIdGenerator()
        new_change = {
            'cmd': question_domain.CMD_CREATE_NEW_FULLY_SPECIFIED_QUESTION,
            'question_dict': {
                'question_state_data': self._create_valid_question_data(
                    'default_state', content_id_generator).to_dict(),
                'language_code': 'hi',
                'question_state_data_schema_version': (
                    feconf.CURRENT_STATE_SCHEMA_VERSION),
                    'next_content_id_index': (
                        content_id_generator.next_content_id_index)
            },
            'skill_id': 'skill_1',
            'skill_difficulty': 0.3
        }

        self.assertEqual(
            suggestion.pre_update_validate(
                question_domain.QuestionSuggestionChange(new_change)), None)

    def test_validate_author_id(self):
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionAddQuestion(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date)

        suggestion.validate()

        suggestion.author_id = 0
        with self.assertRaisesRegex(
            utils.ValidationError, 'Expected author_id to be a string'):
            suggestion.validate()

    def test_validate_author_id_format(self):
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionAddQuestion(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date)

        suggestion.validate()

        suggestion.author_id = ''
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected author_id to be in a valid user ID format.'):
            suggestion.validate()

    def test_validate_final_reviewer_id(self):
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionAddQuestion(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date)

        suggestion.validate()

        suggestion.final_reviewer_id = 1
        with self.assertRaisesRegex(
            utils.ValidationError, 'Expected final_reviewer_id to be a string'):
            suggestion.validate()

    def test_validate_final_reviewer_id_format(self):
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionAddQuestion(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date)

        suggestion.validate()

        suggestion.final_reviewer_id = ''
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected final_reviewer_id to be in a valid user ID format'):
            suggestion.validate()

    def test_validate_language_code_fails_when_language_codes_do_not_match(
            self):
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionAddQuestion(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date)
        expected_question_dict = (
            expected_suggestion_dict['change']['question_dict']
        )
        suggestion.validate()

        expected_question_dict['language_code'] = 'wrong_language_code'
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected question language_code.wrong_language_code. to be same '
            'as suggestion language_code.en.'
        ):
            suggestion.validate()

    def test_validate_language_code_fails_when_language_code_is_set_to_none(
            self):
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionAddQuestion(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date)
        suggestion.validate()

        suggestion.language_code = None

        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected language_code to be en, received None'):
            suggestion.validate()

    def test_get_all_html_conztent_strings(self):
        suggestion = suggestion_registry.SuggestionAddQuestion(
            self.suggestion_dict['suggestion_id'],
            self.suggestion_dict['target_id'],
            self.suggestion_dict['target_version_at_submission'],
            self.suggestion_dict['status'], self.author_id,
            self.reviewer_id, self.suggestion_dict['change'],
            self.suggestion_dict['score_category'],
            self.suggestion_dict['language_code'], self.fake_date)

        actual_outcome_list = suggestion.get_all_html_content_strings()
        expected_outcome_list = [
            u'', u'<p>This is a hint.</p>', u'<p>This is a solution.</p>', u'']
        self.assertEqual(expected_outcome_list, actual_outcome_list)

    def test_convert_html_in_suggestion_change(self):
        html_content = (
            '<p>Value</p><oppia-noninteractive-math raw_latex-with-value="&a'
            'mp;quot;+,-,-,+&amp;quot;"></oppia-noninteractive-math>')
        expected_html_content = (
            '<p>Value</p><oppia-noninteractive-math math_content-with-value='
            '"{&amp;quot;raw_latex&amp;quot;: &amp;quot;+,-,-,+&amp;quot;, &'
            'amp;quot;svg_filename&amp;quot;: &amp;quot;&amp;quot;}"></oppia'
            '-noninteractive-math>')
        answer_group = {
            'outcome': {
                'dest': None,
                'dest_if_really_stuck': None,
                'feedback': {
                    'content_id': 'feedback_1',
                    'html': ''
                },
                'labelled_as_correct': True,
                'param_changes': [],
                'refresher_exploration_id': None,
                'missing_prerequisite_skill_id': None
            },
            'rule_specs': [{
                'inputs': {
                    'x': 0
                },
                'rule_type': 'Equals'
            }],
            'training_data': [],
            'tagged_skill_misconception_id': None
        }

        question_state_dict = {
            'content': {
                'content_id': 'content_1',
                'html': html_content
            },
            'recorded_voiceovers': {
                'voiceovers_mapping': {
                    'content_1': {},
                    'feedback_1': {},
                    'feedback_2': {},
                    'hint_1': {},
                    'solution': {}
                }
            },
            'written_translations': {
                'translations_mapping': {
                    'content_1': {},
                    'feedback_1': {},
                    'feedback_2': {},
                    'hint_1': {},
                    'solution': {}
                }
            },
            'interaction': {
                'answer_groups': [answer_group],
                'confirmed_unclassified_answers': [],
                'customization_args': {
                    'choices': {
                        'value': [{
                            'html': 'option 1',
                            'content_id': 'ca_choices_0'
                        }]
                    },
                    'showChoicesInShuffledOrder': {
                        'value': True
                    }
                },
                'default_outcome': {
                    'dest': None,
                    'dest_if_really_stuck': None,
                    'feedback': {
                        'content_id': 'feedback_2',
                        'html': 'Correct Answer'
                    },
                    'param_changes': [],
                    'refresher_exploration_id': None,
                    'labelled_as_correct': True,
                    'missing_prerequisite_skill_id': None
                },
                'hints': [{
                    'hint_content': {
                        'content_id': 'hint_1',
                        'html': 'Hint 1'
                    }
                }],
                'solution': {
                    'answer_is_exclusive': False,
                    'correct_answer': 0,
                    'explanation': {
                        'content_id': 'solution',
                        'html': '<p>This is a solution.</p>'
                    }
                },
                'id': 'MultipleChoiceInput'
            },
            'param_changes': [],
            'solicit_answer_details': False,
            'classifier_model_id': None
        }

        suggestion_dict = {
            'suggestion_id': 'skill1.thread1',
            'suggestion_type': feconf.SUGGESTION_TYPE_ADD_QUESTION,
            'target_type': feconf.ENTITY_TYPE_SKILL,
            'target_id': 'skill1',
            'target_version_at_submission': 1,
            'status': suggestion_models.STATUS_ACCEPTED,
            'author_name': 'author',
            'final_reviewer_id': self.reviewer_id,
            'change': {
                'cmd': question_domain.CMD_CREATE_NEW_FULLY_SPECIFIED_QUESTION,
                'question_dict': {
                    'question_state_data': question_state_dict,
                    'language_code': 'en',
                    'question_state_data_schema_version': (
                        feconf.CURRENT_STATE_SCHEMA_VERSION),
                    'linked_skill_ids': ['skill_1'],
                    'inapplicable_skill_misconception_ids': ['skillid12345-1']
                },
                'skill_id': 'skill_1',
                'skill_difficulty': 0.3,
            },
            'score_category': 'question.skill1',
            'language_code': 'en',
            'last_updated': utils.get_time_in_millisecs(self.fake_date)
        }
        suggestion = suggestion_registry.SuggestionAddQuestion(
            suggestion_dict['suggestion_id'], suggestion_dict['target_id'],
            suggestion_dict['target_version_at_submission'],
            suggestion_dict['status'], self.author_id, self.reviewer_id,
            suggestion_dict['change'], suggestion_dict['score_category'],
            suggestion_dict['language_code'], False, self.fake_date)
        suggestion.convert_html_in_suggestion_change(
            html_validation_service.add_math_content_to_math_rte_components)
        self.assertEqual(
            suggestion.change.question_dict['question_state_data']['content'][
                'html'], expected_html_content)

    def test_accept_suggestion_with_images(self):
        html_content = (
            '<p>Value</p><oppia-noninteractive-math math_content-with-value='
            '"{&amp;quot;raw_latex&amp;quot;: &amp;quot;+,-,-,+&amp;quot;, &'
            'amp;quot;svg_filename&amp;quot;: &amp;quot;img.svg&amp;quot;}">'
            '</oppia-noninteractive-math>')
        content_id_generator = translation_domain.ContentIdGenerator()
        question_state_dict = self._create_valid_question_data(
            'default_state', content_id_generator).to_dict()
        question_state_dict['content']['html'] = html_content
        with utils.open_file(
            os.path.join(feconf.TESTS_DATA_DIR, 'test_svg.svg'),
            'rb', encoding=None) as f:
            raw_image = f.read()
        image_context = feconf.IMAGE_CONTEXT_QUESTION_SUGGESTIONS
        fs_services.save_original_and_compressed_versions_of_image(
            'img.svg', image_context, 'skill1',
            raw_image, 'image', False)
        self.save_new_skill('skill1', self.author_id, description='description')

        suggestion_dict = {
            'suggestion_id': 'skill1.thread1',
            'suggestion_type': feconf.SUGGESTION_TYPE_ADD_QUESTION,
            'target_type': feconf.ENTITY_TYPE_SKILL,
            'target_id': 'skill1',
            'target_version_at_submission': 1,
            'status': suggestion_models.STATUS_ACCEPTED,
            'author_name': 'author',
            'final_reviewer_id': self.reviewer_id,
            'change': {
                'cmd': question_domain.CMD_CREATE_NEW_FULLY_SPECIFIED_QUESTION,
                'question_dict': {
                    'question_state_data': question_state_dict,
                    'language_code': 'en',
                    'question_state_data_schema_version': (
                        feconf.CURRENT_STATE_SCHEMA_VERSION),
                    'linked_skill_ids': ['skill_1'],
                    'inapplicable_skill_misconception_ids': [],
                    'next_content_id_index': (
                        content_id_generator.next_content_id_index)
                },
                'skill_id': 'skill1',
                'skill_difficulty': 0.3,
            },
            'score_category': 'question.skill1',
            'language_code': 'en',
            'last_updated': utils.get_time_in_millisecs(self.fake_date)
        }
        suggestion = suggestion_registry.SuggestionAddQuestion(
            suggestion_dict['suggestion_id'], suggestion_dict['target_id'],
            suggestion_dict['target_version_at_submission'],
            suggestion_dict['status'], self.author_id, self.reviewer_id,
            suggestion_dict['change'], suggestion_dict['score_category'],
            suggestion_dict['language_code'], False, self.fake_date)
        suggestion.accept('commit_message')

    def test_accept_suggestion_with_image_region_interactions(self):
        with utils.open_file(
            os.path.join(feconf.TESTS_DATA_DIR, 'img.png'), 'rb',
            encoding=None) as f:
            original_image_content = f.read()
        fs_services.save_original_and_compressed_versions_of_image(
            'image.png', 'question_suggestions', 'skill1',
            original_image_content, 'image', True)

        question_state_dict = {
            'content': {
                'html': '<p>Text</p>',
                'content_id': 'content'
            },
            'classifier_model_id': None,
            'linked_skill_id': None,
            'interaction': {
                'answer_groups': [
                    {
                        'rule_specs': [
                            {
                                'rule_type': 'IsInRegion',
                                'inputs': {'x': 'Region1'}
                            }
                        ],
                        'outcome': {
                            'dest': None,
                            'dest_if_really_stuck': None,
                            'feedback': {
                                'html': '<p>assas</p>',
                                'content_id': 'feedback_0'
                            },
                            'labelled_as_correct': True,
                            'param_changes': [],
                            'refresher_exploration_id': None,
                            'missing_prerequisite_skill_id': None
                        },
                        'training_data': [],
                        'tagged_skill_misconception_id': None
                    }
                ],
                'confirmed_unclassified_answers': [],
                'customization_args': {
                    'imageAndRegions': {
                        'value': {
                            'imagePath': 'image.png',
                            'labeledRegions': [
                                {
                                    'label': 'Region1',
                                    'region': {
                                        'regionType': 'Rectangle',
                                        'area': [
                                            [
                                                0.2644628099173554,
                                                0.21807065217391305
                                            ],
                                            [
                                                0.9201101928374655,
                                                0.8847373188405797
                                            ]
                                        ]
                                    }
                                }
                            ]
                        }
                    },
                    'highlightRegionsOnHover': {
                        'value': False
                    }
                },
                'default_outcome': {
                    'dest': None,
                    'dest_if_really_stuck': None,
                    'feedback': {
                        'html': '<p>wer</p>',
                        'content_id': 'default_outcome'
                    },
                    'labelled_as_correct': False,
                    'param_changes': [],
                    'refresher_exploration_id': None,
                    'missing_prerequisite_skill_id': None
                },
                'hints': [
                    {
                        'hint_content': {
                            'html': '<p>assaas</p>',
                            'content_id': 'hint_1'
                        }
                    }
                ],
                'id': 'ImageClickInput', 'solution': None
            },
            'param_changes': [],
            'recorded_voiceovers': {
                'voiceovers_mapping': {
                    'content': {},
                    'default_outcome': {},
                    'feedback_0': {},
                    'hint_1': {}
                }
            },
            'solicit_answer_details': False,
            'card_is_checkpoint': False,
            'written_translations': {
                'translations_mapping': {
                    'content': {},
                    'default_outcome': {},
                    'feedback_0': {},
                    'hint_1': {}
                }
            },
            'next_content_id_index': 2
        }
        suggestion_dict = {
            'suggestion_id': 'skill1.thread1',
            'suggestion_type': feconf.SUGGESTION_TYPE_ADD_QUESTION,
            'target_type': feconf.ENTITY_TYPE_SKILL,
            'target_id': 'skill1',
            'target_version_at_submission': 1,
            'status': suggestion_models.STATUS_ACCEPTED,
            'author_name': 'author',
            'final_reviewer_id': self.reviewer_id,
            'change': {
                'cmd': question_domain.CMD_CREATE_NEW_FULLY_SPECIFIED_QUESTION,
                'question_dict': {
                    'question_state_data': question_state_dict,
                    'language_code': 'en',
                    'question_state_data_schema_version': (
                        feconf.CURRENT_STATE_SCHEMA_VERSION),
                    'linked_skill_ids': ['skill1'],
                    'inapplicable_skill_misconception_ids': []
                },
                'skill_id': 'skill1',
                'skill_difficulty': 0.3,
            },
            'score_category': 'question.skill1',
            'language_code': 'en',
            'last_updated': utils.get_time_in_millisecs(self.fake_date)
        }
        self.save_new_skill(
            'skill1', self.author_id, description='description')
        suggestion = suggestion_registry.SuggestionAddQuestion(
            suggestion_dict['suggestion_id'], suggestion_dict['target_id'],
            suggestion_dict['target_version_at_submission'],
            suggestion_dict['status'], self.author_id, self.reviewer_id,
            suggestion_dict['change'], suggestion_dict['score_category'],
            suggestion_dict['language_code'], False, self.fake_date)

        suggestion.accept('commit_message')

        question = question_services.get_questions_by_skill_ids(
            1, ['skill1'], False)[0]
        destination_fs = fs_services.GcsFileSystem(
            feconf.ENTITY_TYPE_QUESTION, question.id)
        self.assertTrue(destination_fs.isfile('image/%s' % 'image.png'))
        self.assertEqual(
            suggestion.status,
            suggestion_models.STATUS_ACCEPTED)

    def test_contructor_updates_state_shema_in_change_cmd(self):
        score_category = (
            suggestion_models.SCORE_TYPE_QUESTION +
            suggestion_models.SCORE_CATEGORY_DELIMITER + 'skill_id')
        change = {
            'cmd': (
                question_domain
                .CMD_CREATE_NEW_FULLY_SPECIFIED_QUESTION),
            'question_dict': {
                'question_state_data': self.VERSION_27_STATE_DICT,
                'question_state_data_schema_version': 27,
                'language_code': 'en',
                'linked_skill_ids': ['skill_id'],
                'inapplicable_skill_misconception_ids': []
            },
            'skill_id': 'skill_id',
            'skill_difficulty': 0.3
        }
        self.assertEqual(
            change['question_dict']['question_state_data_schema_version'], 27)

        suggestion = suggestion_registry.SuggestionAddQuestion(
            'suggestionId', 'target_id', 1, suggestion_models.STATUS_IN_REVIEW,
            self.author_id, None, change, score_category, 'en', False,
            self.fake_date)
        self.assertEqual(
            suggestion.change.question_dict[
                'question_state_data_schema_version'],
            feconf.CURRENT_STATE_SCHEMA_VERSION)

    def test_contructor_raise_exception_for_invalid_state_shema_version(self):
        score_category = (
            suggestion_models.SCORE_TYPE_QUESTION +
            suggestion_models.SCORE_CATEGORY_DELIMITER + 'skill_id')
        change = {
            'cmd': (
                question_domain
                .CMD_CREATE_NEW_FULLY_SPECIFIED_QUESTION),
            'question_dict': {
                'question_state_data': self.VERSION_27_STATE_DICT,
                'question_state_data_schema_version': 23,
                'language_code': 'en',
                'linked_skill_ids': ['skill_id'],
                'inapplicable_skill_misconception_ids': []
            },
            'skill_id': 'skill_id',
            'skill_difficulty': 0.3
        }
        self.assertEqual(
            change['question_dict']['question_state_data_schema_version'], 23)

        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected state schema version to be in between 25'
        ):
            suggestion_registry.SuggestionAddQuestion(
                'suggestionId', 'target_id', 1,
                suggestion_models.STATUS_IN_REVIEW, self.author_id, None,
                change, score_category, 'en', False, self.fake_date)


class MockInvalidVoiceoverApplication(
        suggestion_registry.BaseVoiceoverApplication):

    def __init__(self):  # pylint: disable=super-init-not-called
        pass


class BaseVoiceoverApplicationUnitTests(test_utils.GenericTestBase):
    """Tests for the BaseVoiceoverApplication class."""

    def setUp(self):
        super(BaseVoiceoverApplicationUnitTests, self).setUp()
        self.base_voiceover_application = MockInvalidVoiceoverApplication()

    def test_base_class_init_raises_error(self):
        with self.assertRaisesRegex(
            NotImplementedError,
            'Subclasses of BaseVoiceoverApplication should implement '
            '__init__.'):
            suggestion_registry.BaseVoiceoverApplication()

    def test_base_class_accept_raises_error(self):
        with self.assertRaisesRegex(
            NotImplementedError,
            'Subclasses of BaseVoiceoverApplication should implement accept.'):
            self.base_voiceover_application.accept()

    def test_base_class_reject_raises_error(self):
        with self.assertRaisesRegex(
            NotImplementedError,
            'Subclasses of BaseVoiceoverApplication should implement reject.'):
            self.base_voiceover_application.reject()


class ExplorationVoiceoverApplicationUnitTest(test_utils.GenericTestBase):
    """Tests for the ExplorationVoiceoverApplication class."""

    def setUp(self):
        super(ExplorationVoiceoverApplicationUnitTest, self).setUp()
        self.signup('author@example.com', 'author')
        self.author_id = self.get_user_id_from_email('author@example.com')

        self.signup('reviewer@example.com', 'reviewer')
        self.reviewer_id = self.get_user_id_from_email('reviewer@example.com')

        self.voiceover_application = (
            suggestion_registry.ExplorationVoiceoverApplication(
                'application_id', 'exp_id', suggestion_models.STATUS_IN_REVIEW,
                self.author_id, None, 'en', 'audio_file.mp3', '<p>Content</p>',
                None))

    def test_validation_with_invalid_target_type_raise_exception(self):
        self.voiceover_application.validate()

        self.voiceover_application.target_type = 'invalid_target'
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected target_type to be among allowed choices, '
            'received invalid_target'
        ):
            self.voiceover_application.validate()

    def test_validation_with_invalid_target_id_raise_exception(self):
        self.voiceover_application.validate()

        self.voiceover_application.target_id = 123
        with self.assertRaisesRegex(
            utils.ValidationError, 'Expected target_id to be a string'
        ):
            self.voiceover_application.validate()

    def test_validation_with_invalid_status_raise_exception(self):
        self.voiceover_application.validate()

        self.voiceover_application.status = 'invalid_status'
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected status to be among allowed choices, '
            'received invalid_status'
        ):
            self.voiceover_application.validate()

    def test_validation_with_invalid_author_id_raise_exception(self):
        self.voiceover_application.validate()

        self.voiceover_application.author_id = 123
        with self.assertRaisesRegex(
            utils.ValidationError, 'Expected author_id to be a string'
        ):
            self.voiceover_application.validate()

    def test_validation_with_invalid_final_reviewer_id_raise_exception(self):
        self.assertEqual(
            self.voiceover_application.status,
            suggestion_models.STATUS_IN_REVIEW)
        self.assertEqual(self.voiceover_application.final_reviewer_id, None)
        self.voiceover_application.validate()

        self.voiceover_application.final_reviewer_id = 123
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected final_reviewer_id to be None as the '
            'voiceover application is not yet handled.'
        ):
            self.voiceover_application.validate()

    def test_validation_for_handled_application_with_invalid_final_review(self):
        self.assertEqual(
            self.voiceover_application.status,
            suggestion_models.STATUS_IN_REVIEW)
        self.assertEqual(self.voiceover_application.final_reviewer_id, None)
        self.voiceover_application.validate()

        self.voiceover_application.status = suggestion_models.STATUS_ACCEPTED
        with self.assertRaisesRegex(
            utils.ValidationError, 'Expected final_reviewer_id to be a string'
        ):
            self.voiceover_application.validate()

    def test_validation_for_rejected_application_with_no_message(self):
        self.assertEqual(
            self.voiceover_application.status,
            suggestion_models.STATUS_IN_REVIEW)
        self.assertEqual(self.voiceover_application.rejection_message, None)
        self.voiceover_application.validate()

        self.voiceover_application.final_reviewer_id = 'reviewer_id'
        self.voiceover_application.status = suggestion_models.STATUS_REJECTED
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected rejection_message to be a string for a '
            'rejected application'
        ):
            self.voiceover_application.validate()

    def test_validation_for_accepted_application_with_message(self):
        self.assertEqual(
            self.voiceover_application.status,
            suggestion_models.STATUS_IN_REVIEW)
        self.assertEqual(self.voiceover_application.rejection_message, None)
        self.voiceover_application.validate()

        self.voiceover_application.final_reviewer_id = 'reviewer_id'
        self.voiceover_application.status = suggestion_models.STATUS_ACCEPTED
        self.voiceover_application.rejection_message = 'Invalid message'
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected rejection_message to be None for the accepted '
            'voiceover application, received Invalid message'
        ):
            self.voiceover_application.validate()

    def test_validation_with_invalid_language_code_type_raise_exception(self):
        self.assertEqual(self.voiceover_application.language_code, 'en')
        self.voiceover_application.validate()

        self.voiceover_application.language_code = 1
        with self.assertRaisesRegex(
            utils.ValidationError, 'Expected language_code to be a string'
        ):
            self.voiceover_application.validate()

    def test_validation_with_invalid_language_code_raise_exception(self):
        self.assertEqual(self.voiceover_application.language_code, 'en')
        self.voiceover_application.validate()

        self.voiceover_application.language_code = 'invalid language'
        with self.assertRaisesRegex(
            utils.ValidationError, 'Invalid language_code: invalid language'
        ):
            self.voiceover_application.validate()

    def test_validation_with_invalid_filename_type_raise_exception(self):
        self.assertEqual(self.voiceover_application.filename, 'audio_file.mp3')
        self.voiceover_application.validate()

        self.voiceover_application.filename = 1
        with self.assertRaisesRegex(
            utils.ValidationError, 'Expected filename to be a string'
        ):
            self.voiceover_application.validate()

    def test_validation_with_invalid_content_type_raise_exception(self):
        self.assertEqual(self.voiceover_application.content, '<p>Content</p>')
        self.voiceover_application.validate()

        self.voiceover_application.content = 1
        with self.assertRaisesRegex(
            utils.ValidationError, 'Expected content to be a string'
        ):
            self.voiceover_application.validate()

    def test_to_dict_returns_correct_dict(self):
        self.voiceover_application.accept(self.reviewer_id)
        expected_dict = {
            'voiceover_application_id': 'application_id',
            'target_type': 'exploration',
            'target_id': 'exp_id',
            'status': 'accepted',
            'author_name': 'author',
            'final_reviewer_name': 'reviewer',
            'language_code': 'en',
            'content': '<p>Content</p>',
            'filename': 'audio_file.mp3',
            'rejection_message': None
        }
        self.assertEqual(
            self.voiceover_application.to_dict(), expected_dict)

    def test_is_handled_property_returns_correct_value(self):
        self.assertFalse(self.voiceover_application.is_handled)

        self.voiceover_application.accept(self.reviewer_id)

        self.assertTrue(self.voiceover_application.is_handled)

    def test_accept_voiceover_application(self):
        self.assertEqual(self.voiceover_application.final_reviewer_id, None)
        self.assertEqual(self.voiceover_application.status, 'review')

        self.voiceover_application.accept(self.reviewer_id)

        self.assertEqual(
            self.voiceover_application.final_reviewer_id, self.reviewer_id)
        self.assertEqual(self.voiceover_application.status, 'accepted')

    def test_reject_voiceover_application(self):
        self.assertEqual(self.voiceover_application.final_reviewer_id, None)
        self.assertEqual(self.voiceover_application.status, 'review')

        self.voiceover_application.reject(self.reviewer_id, 'rejection message')

        self.assertEqual(
            self.voiceover_application.final_reviewer_id, self.reviewer_id)
        self.assertEqual(self.voiceover_application.status, 'rejected')
        self.assertEqual(
            self.voiceover_application.rejection_message, 'rejection message')


class CommunityContributionStatsUnitTests(test_utils.GenericTestBase):
    """Tests for the CommunityContributionStats class."""

    translation_reviewer_counts_by_lang_code = {
        'hi': 0,
        'en': 1
    }

    translation_suggestion_counts_by_lang_code = {
        'fr': 6,
        'en': 5
    }

    question_reviewer_count = 1
    question_suggestion_count = 4

    negative_count = -1
    non_integer_count = 'non_integer_count'
    sample_language_code = 'en'
    invalid_language_code = 'invalid'

    def _assert_community_contribution_stats_is_in_default_state(self):
        """Checks if the community contribution stats is in its default
        state.
        """
        community_contribution_stats = (
            suggestion_services.get_community_contribution_stats()
        )

        self.assertEqual(
            (
                community_contribution_stats
                .translation_reviewer_counts_by_lang_code
            ), {})
        self.assertEqual(
            (
                community_contribution_stats
                .translation_suggestion_counts_by_lang_code
            ), {})
        self.assertEqual(
            community_contribution_stats.question_reviewer_count, 0)
        self.assertEqual(
            community_contribution_stats.question_suggestion_count, 0)

    def test_initial_object_with_valid_arguments_has_correct_properties(self):
        community_contribution_stats = (
            suggestion_registry.CommunityContributionStats(
                self.translation_reviewer_counts_by_lang_code,
                self.translation_suggestion_counts_by_lang_code,
                self.question_reviewer_count,
                self.question_suggestion_count
            )
        )
        community_contribution_stats.validate()

        self.assertEqual(
            (
                community_contribution_stats
                .translation_reviewer_counts_by_lang_code
            ),
            self.translation_reviewer_counts_by_lang_code)
        self.assertEqual(
            (
                community_contribution_stats
                .translation_suggestion_counts_by_lang_code
            ),
            self.translation_suggestion_counts_by_lang_code
        )
        self.assertEqual(
            community_contribution_stats.question_reviewer_count,
            self.question_reviewer_count
        )
        self.assertEqual(
            community_contribution_stats.question_suggestion_count,
            self.question_suggestion_count
        )

    def test_set_translation_reviewer_count_for_lang_code_updates_empty_dict(
            self):
        community_contribution_stats = (
            suggestion_services.get_community_contribution_stats()
        )
        self._assert_community_contribution_stats_is_in_default_state()

        (
            community_contribution_stats
            .set_translation_reviewer_count_for_language_code(
                self.sample_language_code, 2)
        )

        self.assertDictEqual(
            (
                community_contribution_stats
                .translation_reviewer_counts_by_lang_code
            ),
            {self.sample_language_code: 2}
        )

    def test_set_translation_reviewer_count_for_lang_code_updates_count_value(
            self):
        community_contribution_stats = (
            suggestion_services.get_community_contribution_stats()
        )
        self._assert_community_contribution_stats_is_in_default_state()
        (
            community_contribution_stats
            .translation_reviewer_counts_by_lang_code
        ) = {self.sample_language_code: 1}

        (
            community_contribution_stats
            .set_translation_reviewer_count_for_language_code(
                self.sample_language_code, 2)
        )

        self.assertDictEqual(
            (
                community_contribution_stats
                .translation_reviewer_counts_by_lang_code
            ),
            {self.sample_language_code: 2}
        )

    def test_set_translation_reviewer_count_for_lang_code_adds_new_lang_key(
            self):
        community_contribution_stats = (
            suggestion_services.get_community_contribution_stats()
        )
        self._assert_community_contribution_stats_is_in_default_state()
        (
            community_contribution_stats
            .translation_reviewer_counts_by_lang_code
        ) = {'en': 1}

        (
            community_contribution_stats
            .set_translation_reviewer_count_for_language_code('hi', 2)
        )

        self.assertDictEqual(
            (
                community_contribution_stats
                .translation_reviewer_counts_by_lang_code
            ),
            {'en': 1, 'hi': 2}
        )

    def test_set_translation_suggestion_count_for_lang_code_updates_empty_dict(
            self):
        community_contribution_stats = (
            suggestion_services.get_community_contribution_stats()
        )
        self._assert_community_contribution_stats_is_in_default_state()

        (
            community_contribution_stats
            .set_translation_suggestion_count_for_language_code(
                self.sample_language_code, 2)
        )

        self.assertDictEqual(
            (
                community_contribution_stats
                .translation_suggestion_counts_by_lang_code
            ), {self.sample_language_code: 2}
        )

    def test_set_translation_suggestion_count_for_lang_code_updates_count_value(
            self):
        community_contribution_stats = (
            suggestion_services.get_community_contribution_stats()
        )
        self._assert_community_contribution_stats_is_in_default_state()
        (
            community_contribution_stats
            .translation_suggestion_counts_by_lang_code
        ) = {self.sample_language_code: 1}

        (
            community_contribution_stats
            .set_translation_suggestion_count_for_language_code(
                self.sample_language_code, 2)
        )

        self.assertDictEqual(
            (
                community_contribution_stats
                .translation_suggestion_counts_by_lang_code
            ),
            {self.sample_language_code: 2}
        )

    def test_set_translation_suggestion_count_for_lang_code_adds_new_lang_key(
            self):
        community_contribution_stats = (
            suggestion_services.get_community_contribution_stats()
        )
        self._assert_community_contribution_stats_is_in_default_state()
        (
            community_contribution_stats
            .translation_suggestion_counts_by_lang_code
        ) = {'en': 1}

        (
            community_contribution_stats
            .set_translation_suggestion_count_for_language_code('hi', 2)
        )

        self.assertDictEqual(
            (
                community_contribution_stats
                .translation_suggestion_counts_by_lang_code
            ),
            {'en': 1, 'hi': 2}
        )

    def test_get_translation_language_codes_that_need_reviewers_for_one_lang(
            self):
        stats = suggestion_services.get_community_contribution_stats()
        stats.set_translation_suggestion_count_for_language_code(
            self.sample_language_code, 1)

        language_codes_that_need_reviewers = (
            stats.get_translation_language_codes_that_need_reviewers()
        )

        self.assertEqual(
            language_codes_that_need_reviewers, {self.sample_language_code})

    def test_get_translation_language_codes_that_need_reviewers_for_multi_lang(
            self):
        stats = suggestion_services.get_community_contribution_stats()
        stats.set_translation_suggestion_count_for_language_code('hi', 1)
        stats.set_translation_suggestion_count_for_language_code('fr', 1)

        language_codes_that_need_reviewers = (
            stats.get_translation_language_codes_that_need_reviewers()
        )

        self.assertEqual(
            language_codes_that_need_reviewers, {'hi', 'fr'})

    def test_get_translation_language_codes_that_need_reviewers_for_no_lang(
            self):
        stats = suggestion_services.get_community_contribution_stats()

        language_codes_that_need_reviewers = (
            stats.get_translation_language_codes_that_need_reviewers()
        )

        self.assertEqual(
            language_codes_that_need_reviewers, set())

    def test_translation_reviewers_are_needed_if_suggestions_but_no_reviewers(
            self):
        stats = suggestion_services.get_community_contribution_stats()
        stats.set_translation_suggestion_count_for_language_code(
            self.sample_language_code, 1)

        self.assertTrue(
            stats.are_translation_reviewers_needed_for_lang_code(
                self.sample_language_code))

    def test_translation_reviewers_are_needed_if_num_suggestions_past_max(self):
        stats = suggestion_services.get_community_contribution_stats()
        stats.set_translation_suggestion_count_for_language_code(
            self.sample_language_code, 2)
        stats.set_translation_reviewer_count_for_language_code(
            self.sample_language_code, 1)
        config_services.set_property(
            'committer_id', 'max_number_of_suggestions_per_reviewer', 1)

        reviewers_are_needed = (
            stats.are_translation_reviewers_needed_for_lang_code(
                self.sample_language_code))

        self.assertTrue(reviewers_are_needed)

    def test_translation_reviewers_not_needed_if_num_suggestions_eqs_max(self):
        stats = suggestion_services.get_community_contribution_stats()
        stats.set_translation_suggestion_count_for_language_code(
            self.sample_language_code, 2)
        stats.set_translation_reviewer_count_for_language_code(
            self.sample_language_code, 2)
        config_services.set_property(
            'committer_id', 'max_number_of_suggestions_per_reviewer', 1)

        reviewers_are_needed = (
            stats.are_translation_reviewers_needed_for_lang_code(
                self.sample_language_code))

        self.assertFalse(reviewers_are_needed)

    def test_translation_reviewers_not_needed_if_num_suggestions_less_max(self):
        stats = suggestion_services.get_community_contribution_stats()
        stats.set_translation_suggestion_count_for_language_code(
            self.sample_language_code, 1)
        stats.set_translation_reviewer_count_for_language_code(
            self.sample_language_code, 2)
        config_services.set_property(
            'committer_id', 'max_number_of_suggestions_per_reviewer', 1)

        reviewers_are_needed = (
            stats.are_translation_reviewers_needed_for_lang_code(
                self.sample_language_code))

        self.assertFalse(reviewers_are_needed)

    def test_translation_reviewers_not_needed_if_reviewers_and_no_sugestions(
            self):
        stats = suggestion_services.get_community_contribution_stats()
        stats.set_translation_reviewer_count_for_language_code(
            self.sample_language_code, 1)

        self.assertFalse(
            stats.are_translation_reviewers_needed_for_lang_code(
                self.sample_language_code))

    def test_translation_reviewers_not_needed_if_no_reviewers_no_sugestions(
            self):
        stats = suggestion_services.get_community_contribution_stats()
        self._assert_community_contribution_stats_is_in_default_state()

        self.assertFalse(
            stats.are_translation_reviewers_needed_for_lang_code(
                self.sample_language_code))

    def test_question_reviewers_are_needed_if_suggestions_zero_reviewers(
            self):
        stats = suggestion_services.get_community_contribution_stats()
        stats.question_suggestion_count = 1

        self.assertTrue(stats.are_question_reviewers_needed())

    def test_question_reviewers_are_needed_if_num_suggestions_past_max(self):
        stats = suggestion_services.get_community_contribution_stats()
        stats.question_suggestion_count = 2
        stats.question_reviewer_count = 1
        config_services.set_property(
            'committer_id', 'max_number_of_suggestions_per_reviewer', 1)

        reviewers_are_needed = stats.are_question_reviewers_needed()

        self.assertTrue(reviewers_are_needed)

    def test_question_reviewers_not_needed_if_num_suggestions_eqs_max(self):
        stats = suggestion_services.get_community_contribution_stats()
        stats.question_suggestion_count = 2
        stats.question_reviewer_count = 2
        config_services.set_property(
            'committer_id', 'max_number_of_suggestions_per_reviewer', 1)

        reviewers_are_needed = stats.are_question_reviewers_needed()

        self.assertFalse(reviewers_are_needed)

    def test_question_reviewers_not_needed_if_num_suggestions_less_max(self):
        stats = suggestion_services.get_community_contribution_stats()
        stats.question_suggestion_count = 1
        stats.question_reviewer_count = 2
        config_services.set_property(
            'committer_id', 'max_number_of_suggestions_per_reviewer', 1)

        reviewers_are_needed = stats.are_question_reviewers_needed()

        self.assertFalse(reviewers_are_needed)

    def test_question_reviewers_not_needed_if_no_reviewers_no_sugestions(
            self):
        stats = suggestion_services.get_community_contribution_stats()
        self._assert_community_contribution_stats_is_in_default_state()

        self.assertFalse(stats.are_question_reviewers_needed())

    def test_validate_translation_reviewer_counts_fails_for_negative_counts(
            self):
        community_contribution_stats = (
            suggestion_services.get_community_contribution_stats()
        )
        (
            community_contribution_stats
            .set_translation_reviewer_count_for_language_code(
                self.sample_language_code, self.negative_count)
        )

        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected the translation reviewer count to be non-negative for '
            '%s language code, received: %s.' % (
                self.sample_language_code, self.negative_count)
        ):
            community_contribution_stats.validate()

    def test_validate_translation_suggestion_counts_fails_for_negative_counts(
            self):
        community_contribution_stats = (
            suggestion_services.get_community_contribution_stats()
        )
        (
            community_contribution_stats
            .set_translation_suggestion_count_for_language_code(
                self.sample_language_code, self.negative_count)
        )

        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected the translation suggestion count to be non-negative for '
            '%s language code, received: %s.' % (
                self.sample_language_code, self.negative_count)
        ):
            community_contribution_stats.validate()

    def test_validate_question_reviewer_count_fails_for_negative_count(self):
        community_contribution_stats = (
            suggestion_services.get_community_contribution_stats()
        )
        community_contribution_stats.question_reviewer_count = (
            self.negative_count
        )

        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected the question reviewer count to be non-negative, '
            'received: %s.' % (
                community_contribution_stats.question_reviewer_count)
        ):
            community_contribution_stats.validate()

    def test_validate_question_suggestion_count_fails_for_negative_count(self):
        community_contribution_stats = (
            suggestion_services.get_community_contribution_stats()
        )
        community_contribution_stats.question_suggestion_count = (
            self.negative_count
        )

        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected the question suggestion count to be non-negative, '
            'received: %s.' % (
                community_contribution_stats.question_suggestion_count)
        ):
            community_contribution_stats.validate()

    def test_validate_translation_reviewer_counts_fails_for_non_integer_counts(
            self):
        community_contribution_stats = (
            suggestion_services.get_community_contribution_stats()
        )
        (
            community_contribution_stats
            .set_translation_reviewer_count_for_language_code(
                self.sample_language_code, self.non_integer_count)
        )

        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected the translation reviewer count to be an integer for '
            '%s language code, received: %s.' % (
                self.sample_language_code, self.non_integer_count)
        ):
            community_contribution_stats.validate()

    def test_validate_translation_suggestion_counts_fails_for_non_integer_count(
            self):
        community_contribution_stats = (
            suggestion_services.get_community_contribution_stats()
        )
        (
            community_contribution_stats
            .set_translation_suggestion_count_for_language_code(
                self.sample_language_code, self.non_integer_count)
        )

        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected the translation suggestion count to be an integer for '
            '%s language code, received: %s.' % (
                self.sample_language_code, self.non_integer_count)
        ):
            community_contribution_stats.validate()

    def test_validate_question_reviewer_count_fails_for_non_integer_count(
            self):
        community_contribution_stats = (
            suggestion_services.get_community_contribution_stats()
        )
        community_contribution_stats.question_reviewer_count = (
            self.non_integer_count
        )

        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected the question reviewer count to be an integer, '
            'received: %s.' % (
                community_contribution_stats.question_reviewer_count)
        ):
            community_contribution_stats.validate()

    def test_validate_question_suggestion_count_fails_for_non_integer_count(
            self):
        community_contribution_stats = (
            suggestion_services.get_community_contribution_stats()
        )
        community_contribution_stats.question_suggestion_count = (
            self.non_integer_count
        )

        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected the question suggestion count to be an integer, '
            'received: %s.' % (
                community_contribution_stats.question_suggestion_count)
        ):
            community_contribution_stats.validate()

    def test_validate_translation_reviewer_counts_fails_for_invalid_lang_code(
            self):
        community_contribution_stats = (
            suggestion_services.get_community_contribution_stats()
        )
        (
            community_contribution_stats
            .set_translation_reviewer_count_for_language_code(
                self.invalid_language_code, 1)
        )

        with self.assertRaisesRegex(
            utils.ValidationError,
            'Invalid language code for the translation reviewer counts: '
            '%s.' % self.invalid_language_code
        ):
            community_contribution_stats.validate()

    def test_validate_translation_suggestion_counts_fails_for_invalid_lang_code(
            self):
        community_contribution_stats = (
            suggestion_services.get_community_contribution_stats()
        )
        (
            community_contribution_stats
            .set_translation_suggestion_count_for_language_code(
                self.invalid_language_code, 1)
        )

        with self.assertRaisesRegex(
            utils.ValidationError,
            'Invalid language code for the translation suggestion counts: '
            '%s.' % self.invalid_language_code
        ):
            community_contribution_stats.validate()


class ReviewableSuggestionEmailInfoUnitTests(test_utils.GenericTestBase):
    """Tests for the ReviewableSuggestionEmailInfo class."""

    suggestion_type = feconf.SUGGESTION_TYPE_ADD_QUESTION
    language_code = 'en'
    suggestion_content = 'sample question'
    submission_datetime = datetime.datetime.utcnow()

    def test_initial_object_with_valid_arguments_has_correct_properties(self):
        reviewable_suggestion_email_info = (
            suggestion_registry.ReviewableSuggestionEmailInfo(
                self.suggestion_type, self.language_code,
                self.suggestion_content, self.submission_datetime
            )
        )

        self.assertEqual(
            reviewable_suggestion_email_info.suggestion_type,
            self.suggestion_type)
        self.assertEqual(
            reviewable_suggestion_email_info.language_code,
            self.language_code)
        self.assertEqual(
            reviewable_suggestion_email_info.suggestion_content,
            self.suggestion_content)
        self.assertEqual(
            reviewable_suggestion_email_info.submission_datetime,
            self.submission_datetime)
