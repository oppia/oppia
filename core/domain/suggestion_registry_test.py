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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import datetime

from core.domain import exp_domain
from core.domain import exp_fetchers
from core.domain import exp_services
from core.domain import question_domain
from core.domain import skill_services
from core.domain import state_domain
from core.domain import suggestion_registry
from core.platform import models
from core.tests import test_utils
import feconf
import utils

(suggestion_models,) = models.Registry.import_models([models.NAMES.suggestion])


class MockInvalidSuggestion(suggestion_registry.BaseSuggestion):

    def __init__(self):  # pylint: disable=super-init-not-called
        pass


class BaseSuggestionUnitTests(test_utils.GenericTestBase):
    """Tests for the BaseSuggestion class."""

    def setUp(self):
        super(BaseSuggestionUnitTests, self).setUp()
        self.base_suggestion = MockInvalidSuggestion()

    def test_base_class_init_raises_error(self):
        with self.assertRaisesRegexp(
            NotImplementedError,
            'Subclasses of BaseSuggestion should implement __init__.'):
            suggestion_registry.BaseSuggestion()

    def test_base_class_accept_raises_error(self):
        with self.assertRaisesRegexp(
            NotImplementedError,
            'Subclasses of BaseSuggestion should implement accept.'):
            self.base_suggestion.accept()

    def test_base_class_get_change_list_for_accepting_suggestion_raises_error(
            self):
        with self.assertRaisesRegexp(
            NotImplementedError,
            'Subclasses of BaseSuggestion should implement '
            'get_change_list_for_accepting_suggestion.'):
            self.base_suggestion.get_change_list_for_accepting_suggestion()

    def test_base_class_pre_accept_validate_raises_error(self):
        with self.assertRaisesRegexp(
            NotImplementedError,
            'Subclasses of BaseSuggestion should implement'
            ' pre_accept_validate.'):
            self.base_suggestion.pre_accept_validate()

    def test_base_class_populate_old_value_of_change_raises_error(self):
        with self.assertRaisesRegexp(
            NotImplementedError,
            'Subclasses of BaseSuggestion should implement'
            ' populate_old_value_of_change.'):
            self.base_suggestion.populate_old_value_of_change()

    def test_base_class_pre_update_validate_raises_error(self):
        with self.assertRaisesRegexp(
            NotImplementedError,
            'Subclasses of BaseSuggestion should implement'
            ' pre_update_validate.'):
            self.base_suggestion.pre_update_validate({})


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
            'change': {
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
            self.reviewer_id, expected_suggestion_dict['change'],
            expected_suggestion_dict['score_category'], self.fake_date)

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
            expected_suggestion_dict['score_category'], self.fake_date)

        suggestion.validate()

    def test_get_score_part_helper_methods(self):
        expected_suggestion_dict = self.suggestion_dict

        suggestion = suggestion_registry.SuggestionEditStateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change'],
            expected_suggestion_dict['score_category'], self.fake_date)

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
            expected_suggestion_dict['score_category'], self.fake_date)

        suggestion.validate()

        suggestion.suggestion_type = 'invalid_suggestion_type'
        with self.assertRaisesRegexp(
            Exception, 'Expected suggestion_type to be among allowed choices'):
            suggestion.validate()

    def test_validate_target_type(self):
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionEditStateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change'],
            expected_suggestion_dict['score_category'], self.fake_date)

        suggestion.validate()

        suggestion.target_type = 'invalid_target_type'
        with self.assertRaisesRegexp(
            Exception, 'Expected target_type to be among allowed choices'):
            suggestion.validate()

    def test_validate_target_id(self):
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionEditStateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change'],
            expected_suggestion_dict['score_category'], self.fake_date)

        suggestion.validate()

        suggestion.target_id = 0
        with self.assertRaisesRegexp(
            Exception, 'Expected target_id to be a string'):
            suggestion.validate()

    def test_validate_target_version_at_submission(self):
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionEditStateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change'],
            expected_suggestion_dict['score_category'], self.fake_date)

        suggestion.validate()

        suggestion.target_version_at_submission = 'invalid_version'
        with self.assertRaisesRegexp(
            Exception, 'Expected target_version_at_submission to be an int'):
            suggestion.validate()

    def test_validate_status(self):
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionEditStateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change'],
            expected_suggestion_dict['score_category'], self.fake_date)

        suggestion.validate()

        suggestion.status = 'invalid_status'
        with self.assertRaisesRegexp(
            Exception, 'Expected status to be among allowed choices'):
            suggestion.validate()

    def test_validate_author_id(self):
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionEditStateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change'],
            expected_suggestion_dict['score_category'], self.fake_date)

        suggestion.validate()

        suggestion.author_id = 0
        with self.assertRaisesRegexp(
            Exception, 'Expected author_id to be a string'):
            suggestion.validate()

    def test_validate_final_reviewer_id(self):
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionEditStateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change'],
            expected_suggestion_dict['score_category'], self.fake_date)

        suggestion.validate()

        suggestion.final_reviewer_id = 1
        with self.assertRaisesRegexp(
            Exception, 'Expected final_reviewer_id to be a string'):
            suggestion.validate()

    def test_validate_score_category(self):
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionEditStateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change'],
            expected_suggestion_dict['score_category'], self.fake_date)

        suggestion.validate()

        suggestion.score_category = 0
        with self.assertRaisesRegexp(
            Exception, 'Expected score_category to be a string'):
            suggestion.validate()

    def test_validate_score_category_format(self):
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionEditStateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change'],
            expected_suggestion_dict['score_category'], self.fake_date)

        suggestion.validate()

        suggestion.score_category = 'score.score_type.score_sub_type'
        with self.assertRaisesRegexp(
            Exception,
            'Expected score_category to be of the form'
            ' score_type.score_sub_type'):
            suggestion.validate()

        suggestion.score_category = 'invalid_score_category'
        with self.assertRaisesRegexp(
            Exception,
            'Expected score_category to be of the form'
            ' score_type.score_sub_type'):
            suggestion.validate()

    def test_validate_score_type(self):
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionEditStateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change'],
            expected_suggestion_dict['score_category'], self.fake_date)

        suggestion.validate()

        suggestion.score_category = 'invalid_score_type.score_sub_type'
        with self.assertRaisesRegexp(
            Exception,
            'Expected the first part of score_category to be among allowed'
            ' choices'):
            suggestion.validate()

    def test_validate_change(self):
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionEditStateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change'],
            expected_suggestion_dict['score_category'], self.fake_date)

        suggestion.validate()

        suggestion.change = {}
        with self.assertRaisesRegexp(
            Exception, 'Expected change to be an ExplorationChange'):
            suggestion.validate()

    def test_validate_score_type_content(self):
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionEditStateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change'],
            expected_suggestion_dict['score_category'], self.fake_date)

        suggestion.validate()

        suggestion.score_category = 'question.score_sub_type'
        with self.assertRaisesRegexp(
            Exception,
            'Expected the first part of score_category to be content'):
            suggestion.validate()

    def test_validate_score_sub_type(self):
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionEditStateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change'],
            expected_suggestion_dict['score_category'], self.fake_date)

        suggestion.validate()

        suggestion.score_category = 'content.invalid_score_sub_type'
        with self.assertRaisesRegexp(
            Exception,
            'Expected the second part of score_category to be a valid'
            ' category'):
            suggestion.validate()

    def test_validate_change_cmd(self):
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionEditStateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change'],
            expected_suggestion_dict['score_category'], self.fake_date)

        suggestion.validate()

        suggestion.change.cmd = 'invalid_cmd'
        with self.assertRaisesRegexp(
            Exception, 'Expected cmd to be edit_state_property'):
            suggestion.validate()

    def test_validate_change_property_name(self):
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionEditStateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change'],
            expected_suggestion_dict['score_category'], self.fake_date)

        suggestion.validate()

        suggestion.change.property_name = 'invalid_property'
        with self.assertRaisesRegexp(
            Exception, 'Expected property_name to be content'):
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
            expected_suggestion_dict['score_category'], self.fake_date)

        exp_services.update_exploration(
            self.author_id, 'exp1', [
                exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_ADD_STATE,
                    'state_name': 'State A',
                })
            ], 'Added state')
        suggestion.change.state_name = 'State A'

        suggestion.pre_accept_validate()

        suggestion.change.state_name = 'invalid_state_name'
        with self.assertRaisesRegexp(
            Exception, 'Expected invalid_state_name to be a valid state name'):
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
            expected_suggestion_dict['score_category'], self.fake_date)

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
            expected_suggestion_dict['score_category'], self.fake_date)

        change = {
            'cmd': exp_domain.CMD_ADD_STATE,
            'property_name': exp_domain.STATE_PROPERTY_CONTENT,
            'state_name': suggestion.change.state_name,
            'new_value': 'new suggestion content',
            'old_value': None
        }
        with self.assertRaisesRegexp(
            Exception, (
                'The following extra attributes are present: new_value, '
                'old_value, property_name')):
            suggestion.pre_update_validate(exp_domain.ExplorationChange(change))

    def test_pre_update_validate_change_property_name(self):
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionEditStateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change'],
            expected_suggestion_dict['score_category'], self.fake_date)

        change = {
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'property_name': exp_domain.STATE_PROPERTY_PARAM_CHANGES,
            'state_name': suggestion.change.state_name,
            'new_value': 'new suggestion content',
            'old_value': None
        }
        with self.assertRaisesRegexp(
            Exception, 'The new change property_name must be equal to content'):
            suggestion.pre_update_validate(exp_domain.ExplorationChange(change))

    def test_pre_update_validate_change_state_name(self):
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionEditStateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change'],
            expected_suggestion_dict['score_category'], self.fake_date)

        change = {
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'property_name': exp_domain.STATE_PROPERTY_CONTENT,
            'state_name': 'invalid_state',
            'new_value': 'new suggestion content',
            'old_value': None
        }
        with self.assertRaisesRegexp(
            Exception, 'The new change state_name must be equal to state_1'):
            suggestion.pre_update_validate(exp_domain.ExplorationChange(change))

    def test_pre_update_validate_change_new_value(self):
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionEditStateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change'],
            expected_suggestion_dict['score_category'], self.fake_date)
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
        with self.assertRaisesRegexp(
            Exception, 'The new html must not match the old html'):
            suggestion.pre_update_validate(exp_domain.ExplorationChange(change))

    def test_pre_update_validate_non_equal_change_cmd(self):
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionEditStateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change'],
            expected_suggestion_dict['score_category'], self.fake_date)

        with self.assertRaisesRegexp(
            Exception,
            'The new change cmd must be equal to edit_state_property'):
            suggestion.pre_update_validate(exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                'property_name': 'title',
                'new_value': 'Exploration 1 Albert title'
            }))


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
                suggestion_models.SUGGESTION_TYPE_TRANSLATE_CONTENT),
            'target_type': suggestion_models.TARGET_TYPE_EXPLORATION,
            'target_id': 'exp1',
            'target_version_at_submission': 1,
            'status': suggestion_models.STATUS_ACCEPTED,
            'author_name': 'author',
            'final_reviewer_id': self.reviewer_id,
            'change': {
                'cmd': exp_domain.CMD_ADD_TRANSLATION,
                'state_name': 'Introduction',
                'content_id': 'content',
                'language_code': 'hi',
                'content_html': '<p>This is a content.</p>',
                'translation_html': '<p>This is translated html.</p>'
            },
            'score_category': 'translation.Algebra',
            'last_updated': utils.get_time_in_millisecs(self.fake_date)
        }

    def test_create_suggestion_add_translation(self):
        expected_suggestion_dict = self.suggestion_dict

        observed_suggestion = suggestion_registry.SuggestionTranslateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change'],
            expected_suggestion_dict['score_category'], self.fake_date)

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
            expected_suggestion_dict['score_category'], self.fake_date)

        suggestion.validate()

    def test_get_score_part_helper_methods(self):
        expected_suggestion_dict = self.suggestion_dict

        suggestion = suggestion_registry.SuggestionTranslateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change'],
            expected_suggestion_dict['score_category'], self.fake_date)

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
            expected_suggestion_dict['score_category'], self.fake_date)

        suggestion.validate()

        suggestion.suggestion_type = 'invalid_suggestion_type'
        with self.assertRaisesRegexp(
            Exception, 'Expected suggestion_type to be among allowed choices'):
            suggestion.validate()

    def test_validate_target_type(self):
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionTranslateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change'],
            expected_suggestion_dict['score_category'], self.fake_date)

        suggestion.validate()

        suggestion.target_type = 'invalid_target_type'
        with self.assertRaisesRegexp(
            Exception, 'Expected target_type to be among allowed choices'):
            suggestion.validate()

    def test_validate_target_id(self):
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionTranslateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change'],
            expected_suggestion_dict['score_category'], self.fake_date)

        suggestion.validate()

        suggestion.target_id = 0
        with self.assertRaisesRegexp(
            Exception, 'Expected target_id to be a string'):
            suggestion.validate()

    def test_validate_target_version_at_submission(self):
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionTranslateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change'],
            expected_suggestion_dict['score_category'], self.fake_date)

        suggestion.validate()

        suggestion.target_version_at_submission = 'invalid_version'
        with self.assertRaisesRegexp(
            Exception, 'Expected target_version_at_submission to be an int'):
            suggestion.validate()

    def test_validate_status(self):
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionTranslateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change'],
            expected_suggestion_dict['score_category'], self.fake_date)

        suggestion.validate()

        suggestion.status = 'invalid_status'
        with self.assertRaisesRegexp(
            Exception, 'Expected status to be among allowed choices'):
            suggestion.validate()

    def test_validate_author_id(self):
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionTranslateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change'],
            expected_suggestion_dict['score_category'], self.fake_date)

        suggestion.validate()

        suggestion.author_id = 0
        with self.assertRaisesRegexp(
            Exception, 'Expected author_id to be a string'):
            suggestion.validate()

    def test_validate_final_reviewer_id(self):
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionTranslateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change'],
            expected_suggestion_dict['score_category'], self.fake_date)

        suggestion.validate()

        suggestion.final_reviewer_id = 1
        with self.assertRaisesRegexp(
            Exception, 'Expected final_reviewer_id to be a string'):
            suggestion.validate()

    def test_validate_score_category(self):
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionTranslateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change'],
            expected_suggestion_dict['score_category'], self.fake_date)

        suggestion.validate()

        suggestion.score_category = 0
        with self.assertRaisesRegexp(
            Exception, 'Expected score_category to be a string'):
            suggestion.validate()

    def test_validate_score_category_format(self):
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionTranslateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change'],
            expected_suggestion_dict['score_category'], self.fake_date)

        suggestion.validate()

        suggestion.score_category = 'score.score_type.score_sub_type'
        with self.assertRaisesRegexp(
            Exception,
            'Expected score_category to be of the form'
            ' score_type.score_sub_type'):
            suggestion.validate()

        suggestion.score_category = 'invalid_score_category'
        with self.assertRaisesRegexp(
            Exception,
            'Expected score_category to be of the form'
            ' score_type.score_sub_type'):
            suggestion.validate()

    def test_validate_score_type(self):
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionTranslateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change'],
            expected_suggestion_dict['score_category'], self.fake_date)

        suggestion.validate()

        suggestion.score_category = 'invalid_score_type.score_sub_type'
        with self.assertRaisesRegexp(
            Exception,
            'Expected the first part of score_category to be among allowed'
            ' choices'):
            suggestion.validate()

    def test_validate_change(self):
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionTranslateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change'],
            expected_suggestion_dict['score_category'], self.fake_date)

        suggestion.validate()

        suggestion.change = {}
        with self.assertRaisesRegexp(
            Exception, 'Expected change to be an ExplorationChange'):
            suggestion.validate()

    def test_validate_score_type_translation(self):
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionTranslateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change'],
            expected_suggestion_dict['score_category'], self.fake_date)

        suggestion.validate()

        suggestion.score_category = 'question.score_sub_type'
        with self.assertRaisesRegexp(
            Exception,
            'Expected the first part of score_category to be translation'):
            suggestion.validate()

    def test_validate_score_sub_type(self):
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionTranslateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change'],
            expected_suggestion_dict['score_category'], self.fake_date)

        suggestion.validate()

        suggestion.score_category = 'translation.invalid_score_sub_type'
        with self.assertRaisesRegexp(
            Exception,
            'Expected the second part of score_category to be a valid'
            ' category'):
            suggestion.validate()

    def test_validate_change_cmd(self):
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionTranslateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change'],
            expected_suggestion_dict['score_category'], self.fake_date)

        suggestion.validate()

        suggestion.change.cmd = 'invalid_cmd'
        with self.assertRaisesRegexp(
            Exception, 'Expected cmd to be add_translation'):
            suggestion.validate()

    def test_validate_change_with_invalid_language_code_fails_validation(self):
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionTranslateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change'],
            expected_suggestion_dict['score_category'], self.fake_date)

        suggestion.validate()

        suggestion.change.language_code = 'invalid_code'
        with self.assertRaisesRegexp(
            Exception, 'Invalid language_code: invalid_code'):
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
            expected_suggestion_dict['score_category'], self.fake_date)

        exp_services.update_exploration(
            self.author_id, 'exp1', [
                exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_ADD_STATE,
                    'state_name': 'State A',
                }),
                exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                    'property_name': exp_domain.STATE_PROPERTY_CONTENT,
                    'new_value': {
                        'content_id': 'content',
                        'html': '<p>This is a content.</p>'
                    },
                    'state_name': 'State A',
                })
            ], 'Added state')
        suggestion.change.state_name = 'State A'

        suggestion.pre_accept_validate()

        suggestion.change.state_name = 'invalid_state_name'
        with self.assertRaisesRegexp(
            Exception, 'Expected invalid_state_name to be a valid state name'):
            suggestion.pre_accept_validate()

    def test_pre_accept_validate_content_html(self):
        self.save_new_default_exploration('exp1', self.author_id)
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionTranslateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change'],
            expected_suggestion_dict['score_category'], self.fake_date)

        exp_services.update_exploration(
            self.author_id, 'exp1', [
                exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_ADD_STATE,
                    'state_name': 'State A',
                }),
                exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                    'property_name': exp_domain.STATE_PROPERTY_CONTENT,
                    'new_value': {
                        'content_id': 'content',
                        'html': '<p>This is a content.</p>'
                    },
                    'state_name': 'State A',
                })
            ], 'Added state')
        suggestion.change.state_name = 'State A'

        suggestion.pre_accept_validate()

        suggestion.change.content_html = 'invalid content_html'
        with self.assertRaisesRegexp(
            Exception,
            'The given content_html does not match the content of the'
            ' exploration.'):
            suggestion.pre_accept_validate()

    def test_accept_suggestion_adds_translation_in_exploration(self):
        self.save_new_default_exploration('exp1', self.author_id)

        exploration = exp_fetchers.get_exploration_by_id('exp1')
        self.assertEqual(exploration.get_translation_counts(), {})

        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionTranslateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change'],
            expected_suggestion_dict['score_category'], self.fake_date)

        suggestion.accept(
            'Accepted suggestion by translator: Add translation change.')

        exploration = exp_fetchers.get_exploration_by_id('exp1')

        self.assertEqual(exploration.get_translation_counts(), {
            'hi': 1
        })


class SuggestionAddQuestionTest(test_utils.GenericTestBase):
    """Tests for the SuggestionAddQuestion class."""
    AUTHOR_EMAIL = 'author@example.com'
    REVIEWER_EMAIL = 'reviewer@example.com'
    ASSIGNED_REVIEWER_EMAIL = 'assigned_reviewer@example.com'
    fake_date = datetime.datetime(2016, 4, 10, 0, 0, 0, 0)

    def setUp(self):
        super(SuggestionAddQuestionTest, self).setUp()

        self.signup(self.AUTHOR_EMAIL, 'author')
        self.author_id = self.get_user_id_from_email(self.AUTHOR_EMAIL)
        self.signup(self.REVIEWER_EMAIL, 'reviewer')
        self.reviewer_id = self.get_user_id_from_email(self.REVIEWER_EMAIL)
        self.suggestion_dict = {
            'suggestion_id': 'skill1.thread1',
            'suggestion_type': suggestion_models.SUGGESTION_TYPE_ADD_QUESTION,
            'target_type': suggestion_models.TARGET_TYPE_SKILL,
            'target_id': 'skill1',
            'target_version_at_submission': 1,
            'status': suggestion_models.STATUS_ACCEPTED,
            'author_name': 'author',
            'final_reviewer_id': self.reviewer_id,
            'change': {
                'cmd': question_domain.CMD_CREATE_NEW_FULLY_SPECIFIED_QUESTION,
                'question_dict': {
                    'question_state_data': self._create_valid_question_data(
                        'default_state').to_dict(),
                    'language_code': 'en',
                    'question_state_data_schema_version': (
                        feconf.CURRENT_STATE_SCHEMA_VERSION),
                    'linked_skill_ids': ['skill_1']
                },
                'skill_id': 'skill_1',
                'topic_name': 'topic_1'
            },
            'score_category': 'question.topic_1',
            'last_updated': utils.get_time_in_millisecs(self.fake_date)
        }

    def test_create_suggestion_add_question(self):
        expected_suggestion_dict = self.suggestion_dict

        observed_suggestion = suggestion_registry.SuggestionAddQuestion(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change'],
            expected_suggestion_dict['score_category'], self.fake_date)

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
            expected_suggestion_dict['score_category'], self.fake_date)

        suggestion.validate()

    def test_get_score_part_helper_methods(self):
        expected_suggestion_dict = self.suggestion_dict

        suggestion = suggestion_registry.SuggestionAddQuestion(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change'],
            expected_suggestion_dict['score_category'], self.fake_date)

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
            expected_suggestion_dict['score_category'], self.fake_date)

        suggestion.validate()

        suggestion.score_category = 'content.score_sub_type'

        with self.assertRaisesRegexp(
            Exception,
            'Expected the first part of score_category to be "question"'):
            suggestion.validate()

    def test_validate_change_type(self):
        expected_suggestion_dict = self.suggestion_dict

        suggestion = suggestion_registry.SuggestionAddQuestion(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change'],
            expected_suggestion_dict['score_category'], self.fake_date)

        suggestion.validate()

        suggestion.change = 'invalid_change'

        with self.assertRaisesRegexp(
            Exception,
            'Expected change to be an instance of QuestionChange'):
            suggestion.validate()

    def test_validate_change_cmd(self):
        expected_suggestion_dict = self.suggestion_dict

        suggestion = suggestion_registry.SuggestionAddQuestion(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change'],
            expected_suggestion_dict['score_category'], self.fake_date)

        suggestion.validate()

        suggestion.change.cmd = None

        with self.assertRaisesRegexp(
            Exception, 'Expected change to contain cmd'):
            suggestion.validate()

    def test_validate_change_cmd_type(self):
        expected_suggestion_dict = self.suggestion_dict

        suggestion = suggestion_registry.SuggestionAddQuestion(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change'],
            expected_suggestion_dict['score_category'], self.fake_date)

        suggestion.validate()

        suggestion.change.cmd = 'invalid_cmd'

        with self.assertRaisesRegexp(
            Exception,
            'Expected cmd to be create_new_fully_specified_question'):
            suggestion.validate()

    def test_validate_change_question_dict(self):
        expected_suggestion_dict = self.suggestion_dict

        suggestion = suggestion_registry.SuggestionAddQuestion(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change'],
            expected_suggestion_dict['score_category'], self.fake_date)

        suggestion.validate()

        suggestion.change.question_dict = None

        with self.assertRaisesRegexp(
            Exception, 'Expected change to contain question_dict'):
            suggestion.validate()

    def test_validate_change_question_state_data_schema_version(self):
        expected_suggestion_dict = self.suggestion_dict

        suggestion = suggestion_registry.SuggestionAddQuestion(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change'],
            expected_suggestion_dict['score_category'], self.fake_date)

        suggestion.validate()

        # We are not setting value in suggestion.change.question_dict
        # directly since pylint produces unsupported-assignment-operation
        # error. The detailed analysis for the same can be checked
        # in this issue: https://github.com/oppia/oppia/issues/7008.
        question_dict = suggestion.change.question_dict
        question_dict['question_state_data_schema_version'] = 0
        suggestion.change.question_dict = question_dict

        with self.assertRaisesRegexp(
            Exception,
            'Expected question state schema version to be between 1 and '
            '%s' % feconf.CURRENT_STATE_SCHEMA_VERSION):
            suggestion.validate()

    def test_pre_accept_validate_change_skill_id(self):
        expected_suggestion_dict = self.suggestion_dict

        suggestion = suggestion_registry.SuggestionAddQuestion(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change'],
            expected_suggestion_dict['score_category'], self.fake_date)

        skill_id = skill_services.get_new_skill_id()
        self.save_new_skill(skill_id, self.author_id, description='description')
        suggestion.change.skill_id = skill_id

        suggestion.pre_accept_validate()

        suggestion.change.skill_id = None

        with self.assertRaisesRegexp(
            Exception, 'Expected change to contain skill_id'):
            suggestion.pre_accept_validate()

    def test_pre_accept_validate_change_question_state_data_schema_version(
            self):
        expected_suggestion_dict = self.suggestion_dict

        suggestion = suggestion_registry.SuggestionAddQuestion(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change'],
            expected_suggestion_dict['score_category'], self.fake_date)

        skill_id = skill_services.get_new_skill_id()
        self.save_new_skill(skill_id, self.author_id, description='description')
        suggestion.change.skill_id = skill_id

        suggestion.pre_accept_validate()

        # We are not setting value in suggestion.change.question_dict
        # directly since pylint produces unsupported-assignment-operation
        # error. The detailed analysis for the same can be checked
        # in this issue: https://github.com/oppia/oppia/issues/7008.
        question_dict = suggestion.change.question_dict
        question_dict['question_state_data_schema_version'] = 1
        suggestion.change.question_dict = question_dict

        with self.assertRaisesRegexp(
            Exception, 'Question state schema version is not up to date.'):
            suggestion.pre_accept_validate()

    def test_pre_accept_validate_change_invalid_skill_id(self):
        expected_suggestion_dict = self.suggestion_dict

        suggestion = suggestion_registry.SuggestionAddQuestion(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change'],
            expected_suggestion_dict['score_category'], self.fake_date)

        skill_id = skill_services.get_new_skill_id()
        self.save_new_skill(skill_id, self.author_id, description='description')
        suggestion.change.skill_id = skill_id

        suggestion.pre_accept_validate()

        suggestion.change.skill_id = skill_services.get_new_skill_id()

        with self.assertRaisesRegexp(
            Exception, 'The skill with the given id doesn\'t exist.'):
            suggestion.pre_accept_validate()

    def test_get_change_list_for_accepting_suggestion(self):
        expected_suggestion_dict = self.suggestion_dict

        suggestion = suggestion_registry.SuggestionAddQuestion(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change'],
            expected_suggestion_dict['score_category'], self.fake_date)

        self.assertIsNone(suggestion.get_change_list_for_accepting_suggestion())

    def test_populate_old_value_of_change(self):
        expected_suggestion_dict = self.suggestion_dict

        suggestion = suggestion_registry.SuggestionAddQuestion(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change'],
            expected_suggestion_dict['score_category'], self.fake_date)

        self.assertIsNone(suggestion.populate_old_value_of_change())

    def test_cannot_accept_suggestion_with_invalid_skill_id(self):
        expected_suggestion_dict = self.suggestion_dict

        suggestion = suggestion_registry.SuggestionAddQuestion(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change'],
            expected_suggestion_dict['score_category'], self.fake_date)

        suggestion.change.skill_id = skill_services.get_new_skill_id()

        with self.assertRaisesRegexp(
            Exception, 'The skill with the given id doesn\'t exist.'):
            suggestion.accept('commit message')

    def test_pre_update_validate_change_cmd(self):
        expected_suggestion_dict = self.suggestion_dict

        suggestion = suggestion_registry.SuggestionAddQuestion(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change'],
            expected_suggestion_dict['score_category'], self.fake_date)

        change = {
            'cmd': question_domain.CMD_UPDATE_QUESTION_PROPERTY,
            'property_name': question_domain.QUESTION_PROPERTY_LANGUAGE_CODE,
            'new_value': 'bn',
            'old_value': 'en'
        }
        with self.assertRaisesRegexp(
            Exception,
            'The new change cmd must be equal to '
            'create_new_fully_specified_question'):
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
            expected_suggestion_dict['score_category'], self.fake_date)

        change = {
            'cmd': question_domain.CMD_CREATE_NEW_FULLY_SPECIFIED_QUESTION,
            'question_dict': {
                'question_state_data': self._create_valid_question_data(
                    'default_state').to_dict(),
                'language_code': 'en',
                'question_state_data_schema_version': (
                    feconf.CURRENT_STATE_SCHEMA_VERSION)
            },
            'skill_id': 'skill_2'
        }

        with self.assertRaisesRegexp(
            Exception, 'The new change skill_id must be equal to skill_1'):
            suggestion.pre_update_validate(
                question_domain.QuestionChange(change))

    def test_pre_update_validate_change_question_dict(self):
        change = {
            'cmd': question_domain.CMD_CREATE_NEW_FULLY_SPECIFIED_QUESTION,
            'question_dict': {
                'question_state_data': self._create_valid_question_data(
                    'default_state').to_dict(),
                'language_code': 'en',
                'question_state_data_schema_version': (
                    feconf.CURRENT_STATE_SCHEMA_VERSION)
            },
            'skill_id': 'skill_1'
        }

        suggestion = suggestion_registry.SuggestionAddQuestion(
            'exploration.exp1.thread1', 'exp1', 1,
            suggestion_models.STATUS_ACCEPTED, self.author_id,
            self.reviewer_id, change,
            'question.topic_1', self.fake_date)

        with self.assertRaisesRegexp(
            Exception,
            'The new change question_dict must not be equal to the '
            'old question_dict'):
            suggestion.pre_update_validate(
                question_domain.QuestionChange(change))


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
        with self.assertRaisesRegexp(
            NotImplementedError,
            'Subclasses of BaseVoiceoverApplication should implement '
            '__init__.'):
            suggestion_registry.BaseVoiceoverApplication()

    def test_base_class_accept_raises_error(self):
        with self.assertRaisesRegexp(
            NotImplementedError,
            'Subclasses of BaseVoiceoverApplication should implement accept.'):
            self.base_voiceover_application.accept()

    def test_base_class_reject_raises_error(self):
        with self.assertRaisesRegexp(
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

    def test_validation_with_invalid_target_type_rasie_exception(self):
        self.voiceover_application.validate()

        self.voiceover_application.target_type = 'invalid_target'
        with self.assertRaisesRegexp(
            Exception, 'Expected target_type to be among allowed choices, '
            'received invalid_target'):
            self.voiceover_application.validate()

    def test_validation_with_invalid_target_id_rasie_exception(self):
        self.voiceover_application.validate()

        self.voiceover_application.target_id = 123
        with self.assertRaisesRegexp(
            Exception, 'Expected target_id to be a string'):
            self.voiceover_application.validate()

    def test_validation_with_invalid_status_rasie_exception(self):
        self.voiceover_application.validate()

        self.voiceover_application.status = 'invalid_status'
        with self.assertRaisesRegexp(
            Exception, 'Expected status to be among allowed choices, '
            'received invalid_status'):
            self.voiceover_application.validate()

    def test_validation_with_invalid_author_id_rasie_exception(self):
        self.voiceover_application.validate()

        self.voiceover_application.author_id = 123
        with self.assertRaisesRegexp(
            Exception, 'Expected author_id to be a string'):
            self.voiceover_application.validate()

    def test_validation_with_invalid_final_reviewer_id_rasie_exception(self):
        self.assertEqual(
            self.voiceover_application.status,
            suggestion_models.STATUS_IN_REVIEW)
        self.assertEqual(self.voiceover_application.final_reviewer_id, None)
        self.voiceover_application.validate()

        self.voiceover_application.final_reviewer_id = 123
        with self.assertRaisesRegexp(
            Exception, 'Expected final_reviewer_id to be None as the '
            'voiceover application is not yet handled.'):
            self.voiceover_application.validate()

    def test_validation_for_handled_application_with_invalid_final_review(self):
        self.assertEqual(
            self.voiceover_application.status,
            suggestion_models.STATUS_IN_REVIEW)
        self.assertEqual(self.voiceover_application.final_reviewer_id, None)
        self.voiceover_application.validate()

        self.voiceover_application.status = suggestion_models.STATUS_ACCEPTED
        with self.assertRaisesRegexp(
            Exception, 'Expected final_reviewer_id to be a string'):
            self.voiceover_application.validate()

    def test_validation_for_rejected_application_with_no_message(self):
        self.assertEqual(
            self.voiceover_application.status,
            suggestion_models.STATUS_IN_REVIEW)
        self.assertEqual(self.voiceover_application.rejection_message, None)
        self.voiceover_application.validate()

        self.voiceover_application.final_reviewer_id = 'reviewer_id'
        self.voiceover_application.status = suggestion_models.STATUS_REJECTED
        with self.assertRaisesRegexp(
            Exception, 'Expected rejection_message to be a string for a '
            'rejected application'):
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
        with self.assertRaisesRegexp(
            Exception, 'Expected rejection_message to be None for the accepted '
            'voiceover application, received Invalid message'):
            self.voiceover_application.validate()

    def test_validation_with_invalid_language_code_type_raise_exception(self):
        self.assertEqual(self.voiceover_application.language_code, 'en')
        self.voiceover_application.validate()

        self.voiceover_application.language_code = 1
        with self.assertRaisesRegexp(
            Exception, 'Expected language_code to be a string'):
            self.voiceover_application.validate()

    def test_validation_with_invalid_language_code_raise_exception(self):
        self.assertEqual(self.voiceover_application.language_code, 'en')
        self.voiceover_application.validate()

        self.voiceover_application.language_code = 'invalid language'
        with self.assertRaisesRegexp(
            Exception, 'Invalid language_code: invalid language'):
            self.voiceover_application.validate()

    def test_validation_with_invalid_filename_type_raise_exception(self):
        self.assertEqual(self.voiceover_application.filename, 'audio_file.mp3')
        self.voiceover_application.validate()

        self.voiceover_application.filename = 1
        with self.assertRaisesRegexp(
            Exception, 'Expected filename to be a string'):
            self.voiceover_application.validate()

    def test_validation_with_invalid_content_type_raise_exception(self):
        self.assertEqual(self.voiceover_application.content, '<p>Content</p>')
        self.voiceover_application.validate()

        self.voiceover_application.content = 1
        with self.assertRaisesRegexp(
            Exception, 'Expected content to be a string'):
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
