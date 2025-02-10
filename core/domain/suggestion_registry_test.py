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
from core.constants import constants
from core.domain import change_domain
from core.domain import exp_domain
from core.domain import exp_services
from core.domain import fs_services
from core.domain import html_validation_service
from core.domain import platform_parameter_list
from core.domain import question_domain
from core.domain import question_services
from core.domain import skill_services
from core.domain import state_domain
from core.domain import suggestion_registry
from core.domain import suggestion_services
from core.domain import topic_fetchers
from core.domain import translation_domain
from core.domain import translation_fetchers
from core.domain import user_services
from core.platform import models
from core.tests import test_utils
from extensions import domain

from typing import Dict, Final, List, Optional, TypedDict, Union, cast

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import opportunity_models
    from mypy_imports import suggestion_models

(
    suggestion_models, opportunity_models
) = models.Registry.import_models([
    models.Names.SUGGESTION, models.Names.OPPORTUNITY
])

ChangeType = Dict[
    str, Union[str, float, Dict[str, Union[str, int, state_domain.StateDict]]]
]


class MockInvalidSuggestion(suggestion_registry.BaseSuggestion):

    def __init__(self) -> None:  # pylint: disable=super-init-not-called
        pass


class BaseSuggestionUnitTests(test_utils.GenericTestBase):
    """Tests for the BaseSuggestion class."""

    def setUp(self) -> None:
        super().setUp()
        self.base_suggestion = MockInvalidSuggestion()

    def test_base_class_accept_raises_error(self) -> None:
        with self.assertRaisesRegex(
            NotImplementedError,
            'Subclasses of BaseSuggestion should implement accept.'):
            self.base_suggestion.accept('test_message')

    def test_base_class_pre_accept_validate_raises_error(self) -> None:
        with self.assertRaisesRegex(
            NotImplementedError,
            'Subclasses of BaseSuggestion should implement'
            ' pre_accept_validate.'):
            self.base_suggestion.pre_accept_validate()

    def test_base_class_populate_old_value_of_change_raises_error(self) -> None:
        with self.assertRaisesRegex(
            NotImplementedError,
            'Subclasses of BaseSuggestion should implement'
            ' populate_old_value_of_change.'):
            self.base_suggestion.populate_old_value_of_change()

    def test_base_class_pre_update_validate_raises_error(self) -> None:
        with self.assertRaisesRegex(
            NotImplementedError,
            'Subclasses of BaseSuggestion should implement'
            ' pre_update_validate.'):
            self.base_suggestion.pre_update_validate({})

    def test_base_class_get_all_html_content_strings(self) -> None:
        with self.assertRaisesRegex(
            NotImplementedError,
            'Subclasses of BaseSuggestion should implement'
            ' get_all_html_content_strings.'):
            self.base_suggestion.get_all_html_content_strings()

    def test_base_class_get_target_entity_html_strings(self) -> None:
        with self.assertRaisesRegex(
            NotImplementedError,
            'Subclasses of BaseSuggestion should implement'
            ' get_target_entity_html_strings.'):
            self.base_suggestion.get_target_entity_html_strings()

    def test_base_class_convert_html_in_suggestion_change(self) -> None:
        def conversion_fn(_: str) -> str:
            """Temporary function."""
            return 'abcd'
        with self.assertRaisesRegex(
            NotImplementedError,
            'Subclasses of BaseSuggestion should implement'
            ' convert_html_in_suggestion_change.'):
            self.base_suggestion.convert_html_in_suggestion_change(
                conversion_fn)


class SuggestionEditStateContentDict(TypedDict):
    """Dictionary representing the SuggestionEditStateContent object."""

    suggestion_id: str
    suggestion_type: str
    target_type: str
    target_id: str
    target_version_at_submission: int
    status: str
    author_name: str
    final_reviewer_id: Optional[str]
    change_cmd: Dict[str, change_domain.AcceptableChangeDictTypes]
    score_category: str
    language_code: Optional[str]
    last_updated: float
    created_on: float
    edited_by_reviewer: bool


class SuggestionEditStateContentUnitTests(test_utils.GenericTestBase):
    """Tests for the SuggestionEditStateContent class."""

    AUTHOR_EMAIL: Final = 'author@example.com'
    REVIEWER_EMAIL: Final = 'reviewer@example.com'
    ASSIGNED_REVIEWER_EMAIL: Final = 'assigned_reviewer@example.com'
    fake_date: datetime.datetime = datetime.datetime(2016, 4, 10, 0, 0, 0, 0)

    def setUp(self) -> None:
        super().setUp()

        self.signup(self.AUTHOR_EMAIL, 'author')
        self.author_id = self.get_user_id_from_email(self.AUTHOR_EMAIL)
        self.signup(self.REVIEWER_EMAIL, 'reviewer')
        self.reviewer_id = self.get_user_id_from_email(self.REVIEWER_EMAIL)
        self.suggestion_dict: SuggestionEditStateContentDict = {
            'suggestion_id': 'exploration.exp1.thread1',
            'suggestion_type': (
                feconf.SUGGESTION_TYPE_EDIT_STATE_CONTENT),
            'target_type': feconf.ENTITY_TYPE_EXPLORATION,
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
            'language_code': None,
            'last_updated': utils.get_time_in_millisecs(self.fake_date),
            'created_on': utils.get_time_in_millisecs(self.fake_date),
            'edited_by_reviewer': False
        }

    def test_create_suggestion_edit_state_content(self) -> None:
        expected_suggestion_dict = self.suggestion_dict

        observed_suggestion = suggestion_registry.SuggestionEditStateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change_cmd'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date,
            self.fake_date
        )

        self.assertDictEqual(
            observed_suggestion.to_dict(), expected_suggestion_dict)

    def test_validate_suggestion_edit_state_content(self) -> None:
        expected_suggestion_dict = self.suggestion_dict

        suggestion = suggestion_registry.SuggestionEditStateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change_cmd'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date,
            self.fake_date)

        suggestion.validate()

    def test_get_score_part_helper_methods(self) -> None:
        expected_suggestion_dict = self.suggestion_dict

        suggestion = suggestion_registry.SuggestionEditStateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change_cmd'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date,
            self.fake_date)

        self.assertEqual(suggestion.get_score_type(), 'content')
        self.assertEqual(suggestion.get_score_sub_type(), 'Algebra')

    def test_validate_suggestion_type(self) -> None:
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionEditStateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change_cmd'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date,
            self.fake_date)

        suggestion.validate()

        suggestion.suggestion_type = 'invalid_suggestion_type'
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected suggestion_type to be among allowed choices'
        ):
            suggestion.validate()

    def test_validate_target_type(self) -> None:
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionEditStateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change_cmd'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date,
            self.fake_date)

        suggestion.validate()

        suggestion.target_type = 'invalid_target_type'
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected target_type to be among allowed choices'
        ):
            suggestion.validate()

    def test_validate_target_id(self) -> None:
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionEditStateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change_cmd'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date,
            self.fake_date)

        suggestion.validate()

        # TODO(#13059): Here we use MyPy ignore because after we fully type the
        # codebase we plan to get rid of the tests that intentionally test wrong
        # inputs that we can normally catch by typing.
        suggestion.target_id = 0  # type: ignore[assignment]
        with self.assertRaisesRegex(
            utils.ValidationError, 'Expected target_id to be a string'
        ):
            suggestion.validate()

    def test_validate_target_version_at_submission(self) -> None:
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionEditStateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change_cmd'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date,
            self.fake_date)

        suggestion.validate()

        # TODO(#13059): Here we use MyPy ignore because after we fully type the
        # codebase we plan to get rid of the tests that intentionally test wrong
        # inputs that we can normally catch by typing.
        suggestion.target_version_at_submission = 'invalid_version'  # type: ignore[assignment]
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected target_version_at_submission to be an int'
        ):
            suggestion.validate()

    def test_validate_status(self) -> None:
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionEditStateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change_cmd'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date,
            self.fake_date)

        suggestion.validate()

        suggestion.status = 'invalid_status'
        with self.assertRaisesRegex(
            utils.ValidationError, 'Expected status to be among allowed choices'
        ):
            suggestion.validate()

    def test_validate_author_id(self) -> None:
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionEditStateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change_cmd'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date,
            self.fake_date)

        suggestion.validate()

        # TODO(#13059): Here we use MyPy ignore because after we fully type the
        # codebase we plan to get rid of the tests that intentionally test wrong
        # inputs that we can normally catch by typing.
        suggestion.author_id = 0  # type: ignore[assignment]
        with self.assertRaisesRegex(
            utils.ValidationError, 'Expected author_id to be a string'
        ):
            suggestion.validate()

    def test_validate_author_id_format(self) -> None:
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionEditStateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change_cmd'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date,
            self.fake_date)

        suggestion.validate()

        suggestion.author_id = self.PSEUDONYMOUS_ID
        suggestion.validate()

        suggestion.author_id = ''
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected author_id to be in a valid user ID format'
        ):
            suggestion.validate()

    def test_validate_final_reviewer_id(self) -> None:
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionEditStateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change_cmd'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date,
            self.fake_date)

        suggestion.validate()

        # TODO(#13059): Here we use MyPy ignore because after we fully type the
        # codebase we plan to get rid of the tests that intentionally test wrong
        # inputs that we can normally catch by typing.
        suggestion.final_reviewer_id = 1  # type: ignore[assignment]
        with self.assertRaisesRegex(
            utils.ValidationError, 'Expected final_reviewer_id to be a string'
        ):
            suggestion.validate()

    def test_validate_final_reviewer_id_format(self) -> None:
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionEditStateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change_cmd'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date,
            self.fake_date)

        suggestion.validate()

        suggestion.final_reviewer_id = self.PSEUDONYMOUS_ID
        suggestion.validate()

        suggestion.final_reviewer_id = ''
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected final_reviewer_id to be in a valid user ID format'
        ):
            suggestion.validate()

    def test_validate_score_category(self) -> None:
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionEditStateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change_cmd'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date,
            self.fake_date)

        suggestion.validate()

        # TODO(#13059): Here we use MyPy ignore because after we fully type the
        # codebase we plan to get rid of the tests that intentionally test wrong
        # inputs that we can normally catch by typing.
        suggestion.score_category = 0  # type: ignore[assignment]
        with self.assertRaisesRegex(
            utils.ValidationError, 'Expected score_category to be a string'
        ):
            suggestion.validate()

    def test_validate_score_category_format(self) -> None:
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionEditStateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change_cmd'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date,
            self.fake_date)

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

    def test_validate_score_type(self) -> None:
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionEditStateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change_cmd'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date,
            self.fake_date)

        suggestion.validate()

        suggestion.score_category = 'invalid_score_type.score_sub_type'
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected the first part of score_category to be among allowed'
            ' choices'
        ):
            suggestion.validate()

    def test_validate_change(self) -> None:
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionEditStateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change_cmd'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date,
            self.fake_date)

        suggestion.validate()

        # TODO(#13059): Here we use MyPy ignore because after we fully type the
        # codebase we plan to get rid of the tests that intentionally test wrong
        # inputs that we can normally catch by typing.
        suggestion.change_cmd = {}  # type: ignore[assignment]
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected change_cmd to be an ExplorationChange'
        ):
            suggestion.validate()

    def test_validate_score_type_content(self) -> None:
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionEditStateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change_cmd'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date,
            self.fake_date)

        suggestion.validate()

        suggestion.score_category = 'question.score_sub_type'
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected the first part of score_category to be content'
        ):
            suggestion.validate()

    def test_validate_change_cmd(self) -> None:
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionEditStateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change_cmd'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date,
            self.fake_date)
        suggestion.validate()

        suggestion.change_cmd.cmd = 'invalid_cmd'
        with self.assertRaisesRegex(
            utils.ValidationError, 'Expected cmd to be edit_state_property'
        ):
            suggestion.validate()

    def test_validate_change_property_name(self) -> None:
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionEditStateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change_cmd'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date,
            self.fake_date)

        suggestion.validate()

        # Here we use MyPy ignore because 'property_name' can only accept
        # 'content' string literal but here we are providing 'invalid_property'
        # which causes MyPy to throw an error. Thus to avoid the error, we used
        # ignore here.
        suggestion.change_cmd.property_name = 'invalid_property'  # type: ignore[assignment]
        with self.assertRaisesRegex(
            utils.ValidationError, 'Expected property_name to be content'
        ):
            suggestion.validate()

    def test_validate_language_code_fails_when_language_codes_do_not_match(
        self
    ) -> None:
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionEditStateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change_cmd'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date,
            self.fake_date)
        suggestion.validate()

        suggestion.language_code = 'wrong_language_code'

        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected language_code to be None, received wrong_language_code'
        ):
            suggestion.validate()

    def test_pre_accept_validate_state_name(self) -> None:
        self.save_new_default_exploration('exp1', self.author_id)
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionEditStateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change_cmd'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date,
            self.fake_date)

        suggestion.change_cmd.state_name = 'Introduction'

        suggestion.pre_accept_validate()

        suggestion.change_cmd.state_name = 'invalid_state_name'
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected invalid_state_name to be a valid state name'
        ):
            suggestion.pre_accept_validate()

    def test_populate_old_value_of_change_with_invalid_state(self) -> None:
        self.save_new_default_exploration('exp1', self.author_id)
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionEditStateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change_cmd'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date,
            self.fake_date)

        suggestion.change_cmd.state_name = 'invalid_state_name'

        self.assertIsNone(suggestion.change_cmd.old_value)

        suggestion.populate_old_value_of_change()

        self.assertIsNone(suggestion.change_cmd.old_value)

    def test_pre_update_validate_change_cmd(self) -> None:
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionEditStateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change_cmd'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date,
            self.fake_date)

        change_cmd = {
            'cmd': exp_domain.CMD_ADD_STATE,
            'property_name': exp_domain.STATE_PROPERTY_CONTENT,
            'state_name': suggestion.change_cmd.state_name,
            'new_value': 'new suggestion content',
            'old_value': None
        }
        with self.assertRaisesRegex(
            utils.ValidationError,
            'The following extra attributes are present: new_value, '
            'old_value, property_name'
        ):
            suggestion.pre_update_validate(
                exp_domain.EditExpStatePropertyContentCmd(change_cmd)
            )

    def test_pre_update_validate_change_property_name(self) -> None:
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionEditStateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change_cmd'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date,
            self.fake_date)

        change_cmd = {
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'property_name': exp_domain.STATE_PROPERTY_PARAM_CHANGES,
            'state_name': suggestion.change_cmd.state_name,
            'new_value': 'new suggestion content',
            'old_value': None
        }
        with self.assertRaisesRegex(
            utils.ValidationError,
            'The new change_cmd property_name must be equal to content'
        ):
            suggestion.pre_update_validate(
                exp_domain.EditExpStatePropertyContentCmd(change_cmd)
            )

    def test_pre_update_validate_change_state_name(self) -> None:
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionEditStateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change_cmd'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date,
            self.fake_date)

        change_cmd = {
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'property_name': exp_domain.STATE_PROPERTY_CONTENT,
            'state_name': 'invalid_state',
            'new_value': 'new suggestion content',
            'old_value': None
        }
        with self.assertRaisesRegex(
            utils.ValidationError,
            'The new change_cmd state_name must be equal to state_1'
        ):
            suggestion.pre_update_validate(
                exp_domain.EditExpStatePropertyContentCmd(change_cmd)
            )

    def test_pre_update_validate_change_new_value(self) -> None:
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionEditStateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change_cmd'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date,
            self.fake_date)
        new_content = state_domain.SubtitledHtml(
            'content', '<p>new suggestion html</p>').to_dict()

        suggestion.change_cmd.new_value = new_content

        change_cmd: Dict[
            str, Union[Optional[str], state_domain.SubtitledHtmlDict]
        ] = {
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'property_name': exp_domain.STATE_PROPERTY_CONTENT,
            'state_name': suggestion.change_cmd.state_name,
            'new_value': new_content,
            'old_value': None
        }
        with self.assertRaisesRegex(
            utils.ValidationError, 'The new html must not match the old html'
        ):
            suggestion.pre_update_validate(
                exp_domain.EditExpStatePropertyContentCmd(change_cmd)
            )

    def test_pre_update_validate_non_equal_change_cmd(self) -> None:
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionEditStateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change_cmd'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date,
            self.fake_date)

        with self.assertRaisesRegex(
            utils.ValidationError,
            'The new change_cmd cmd must be equal to edit_state_property'
        ):
            suggestion.pre_update_validate(
                exp_domain.EditExpStatePropertyContentCmd({
                    'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                    'property_name': 'title',
                    'new_value': 'Exploration 1 Albert title'
                })
            )

    def test_get_all_html_content_strings(self) -> None:
        change_dict: Dict[str, Union[Optional[str], Dict[str, str]]] = {
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
            self.suggestion_dict['language_code'], False, self.fake_date,
            self.fake_date)

        actual_outcome_list = suggestion.get_all_html_content_strings()
        expected_outcome_list = ['new suggestion content']
        self.assertEqual(expected_outcome_list, actual_outcome_list)

    def test_convert_html_in_suggestion_change(self) -> None:
        html_content = (
            '<p>Value</p><oppia-noninteractive-math raw_latex-with-value="&a'
            'mp;quot;+,-,-,+&amp;quot;"></oppia-noninteractive-math>')
        expected_html_content = (
            '<p>Value</p><oppia-noninteractive-math math_content-with-value='
            '"{&amp;quot;raw_latex&amp;quot;: &amp;quot;+,-,-,+&amp;quot;, &'
            'amp;quot;svg_filename&amp;quot;: &amp;quot;&amp;quot;}"></oppia'
            '-noninteractive-math>')

        change_cmd: Dict[str, Union[str, Dict[str, str]]] = {
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
            self.reviewer_id, change_cmd,
            self.suggestion_dict['score_category'],
            self.suggestion_dict['language_code'], False, self.fake_date,
            self.fake_date)

        suggestion.convert_html_in_suggestion_change(
            html_validation_service.
            add_math_content_to_math_rte_components)
        # Ruling out the possibility of any other type for mypy type checking.
        assert isinstance(suggestion.change_cmd.old_value, dict)
        self.assertEqual(
            suggestion.change_cmd.old_value['html'], expected_html_content)

    def test_get_target_entity_html_strings_returns_expected_strings(
        self
    ) -> None:
        change_dict: Dict[str, Union[str, Dict[str, str]]] = {
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
            self.suggestion_dict['language_code'], False, self.fake_date,
            self.fake_date)

        actual_outcome_list = suggestion.get_target_entity_html_strings()
        expected_outcome_list = ['Old content.']
        self.assertEqual(expected_outcome_list, actual_outcome_list)

    def test_get_target_entity_html_with_none_old_value(self) -> None:
        change_dict: Dict[str, Union[Optional[str], Dict[str, str]]] = {
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
            self.suggestion_dict['language_code'], False, self.fake_date,
            self.fake_date)

        actual_outcome_list = suggestion.get_target_entity_html_strings()
        self.assertEqual(actual_outcome_list, [])


class SuggestionTranslateContentUnitTests(test_utils.GenericTestBase):
    """Tests for the SuggestionEditStateContent class."""

    AUTHOR_EMAIL: Final = 'author@example.com'
    REVIEWER_EMAIL: Final = 'reviewer@example.com'
    ASSIGNED_REVIEWER_EMAIL: Final = 'assigned_reviewer@example.com'
    fake_date: datetime.datetime = datetime.datetime(2016, 4, 10, 0, 0, 0, 0)

    def setUp(self) -> None:
        super().setUp()

        self.signup(self.AUTHOR_EMAIL, 'author')
        self.author_id = self.get_user_id_from_email(self.AUTHOR_EMAIL)
        self.signup(self.REVIEWER_EMAIL, 'reviewer')
        self.reviewer_id = self.get_user_id_from_email(self.REVIEWER_EMAIL)
        self.suggestion_dict: suggestion_registry.BaseSuggestionDict = {
            'suggestion_id': 'exploration.exp1.thread1',
            'suggestion_type': (
                feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT),
            'target_type': feconf.ENTITY_TYPE_EXPLORATION,
            'target_id': 'exp1',
            'target_version_at_submission': 1,
            'status': suggestion_models.STATUS_ACCEPTED,
            'author_name': 'author',
            'final_reviewer_id': self.reviewer_id,
            'change_cmd': {
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
            'created_on': utils.get_time_in_millisecs(self.fake_date),
            'edited_by_reviewer': False
        }

        opportunity_models.ExplorationOpportunitySummaryModel(
            id='exp1',
            topic_id='Topic1',
            topic_name='New Topic',
            story_id='Story1',
            story_title='New Story',
            chapter_title='New chapter',
            content_count=10,
            translation_counts={},
            incomplete_translation_language_codes=[
                language['id']
                for language in constants.SUPPORTED_AUDIO_LANGUAGES
            ],
            language_codes_needing_voice_artists=['en']
        ).put()

    def test_pre_update_validate_fails_for_invalid_change_cmd(self) -> None:
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionTranslateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change_cmd'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False,
            self.fake_date, self.fake_date)

        change = {
            'cmd': exp_domain.CMD_DELETE_STATE,
            'state_name': 'Introduction'
        }
        with self.assertRaisesRegex(
            utils.ValidationError,
            'The new change_cmd cmd must be equal to %s' % (
                exp_domain.CMD_ADD_WRITTEN_TRANSLATION)
        ):
            suggestion.pre_update_validate(exp_domain.ExplorationChange(change))

    def test_pre_update_validate_change_state_name(self) -> None:
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionTranslateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change_cmd'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False,
            self.fake_date, self.fake_date)
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
            'The new change_cmd state_name must be equal to Introduction'
        ):
            suggestion.pre_update_validate(exp_domain.ExplorationChange(change))

    def test_pre_update_validate_change_language_code(self) -> None:
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionTranslateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change_cmd'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False,
            self.fake_date, self.fake_date)
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

    def test_pre_update_validate_change_content_html(self) -> None:
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionTranslateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change_cmd'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False,
            self.fake_date, self.fake_date)
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
            'The new change_cmd content_html must be equal to <p>This is a '
            'content.</p>'
        ):
            suggestion.pre_update_validate(
                exp_domain.ExplorationChange(change))

    def test_create_suggestion_add_translation(self) -> None:
        expected_suggestion_dict = self.suggestion_dict

        observed_suggestion = suggestion_registry.SuggestionTranslateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change_cmd'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date,
            self.fake_date
        )

        self.assertDictEqual(
            observed_suggestion.to_dict(), expected_suggestion_dict)

    def test_validate_suggestion_add_translation(self) -> None:
        expected_suggestion_dict = self.suggestion_dict

        suggestion = suggestion_registry.SuggestionTranslateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change_cmd'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date,
            self.fake_date)

        suggestion.validate()

    def test_get_score_part_helper_methods(self) -> None:
        expected_suggestion_dict = self.suggestion_dict

        suggestion = suggestion_registry.SuggestionTranslateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change_cmd'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date,
            self.fake_date)

        self.assertEqual(suggestion.get_score_type(), 'translation')
        self.assertEqual(suggestion.get_score_sub_type(), 'Algebra')

    def test_validate_suggestion_type(self) -> None:
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionTranslateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change_cmd'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date,
            self.fake_date)

        suggestion.validate()

        suggestion.suggestion_type = 'invalid_suggestion_type'
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected suggestion_type to be among allowed choices'
        ):
            suggestion.validate()

    def test_validate_target_type(self) -> None:
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionTranslateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change_cmd'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date,
            self.fake_date)

        suggestion.validate()

        suggestion.target_type = 'invalid_target_type'
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected target_type to be among allowed choices'
        ):
            suggestion.validate()

    def test_validate_target_id(self) -> None:
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionTranslateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change_cmd'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date,
            self.fake_date)

        suggestion.validate()

        # TODO(#13059): Here we use MyPy ignore because after we fully type the
        # codebase we plan to get rid of the tests that intentionally test wrong
        # inputs that we can normally catch by typing.
        suggestion.target_id = 0  # type: ignore[assignment]
        with self.assertRaisesRegex(
            utils.ValidationError, 'Expected target_id to be a string'
        ):
            suggestion.validate()

    def test_validate_target_version_at_submission(self) -> None:
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionTranslateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change_cmd'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date,
            self.fake_date)

        suggestion.validate()

        # TODO(#13059): Here we use MyPy ignore because after we fully type the
        # codebase we plan to get rid of the tests that intentionally test wrong
        # inputs that we can normally catch by typing.
        suggestion.target_version_at_submission = 'invalid_version'  # type: ignore[assignment]
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected target_version_at_submission to be an int'
        ):
            suggestion.validate()

    def test_validate_status(self) -> None:
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionTranslateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change_cmd'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date,
            self.fake_date)

        suggestion.validate()

        suggestion.status = 'invalid_status'
        with self.assertRaisesRegex(
            utils.ValidationError, 'Expected status to be among allowed choices'
        ):
            suggestion.validate()

    def test_validate_author_id(self) -> None:
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionTranslateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change_cmd'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date,
            self.fake_date)

        suggestion.validate()

        # TODO(#13059): Here we use MyPy ignore because after we fully type the
        # codebase we plan to get rid of the tests that intentionally test wrong
        # inputs that we can normally catch by typing.
        suggestion.author_id = 0  # type: ignore[assignment]
        with self.assertRaisesRegex(
            utils.ValidationError, 'Expected author_id to be a string'
        ):
            suggestion.validate()

    def test_validate_author_id_format(self) -> None:
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionTranslateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change_cmd'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date,
            self.fake_date)

        suggestion.validate()

        suggestion.author_id = ''
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected author_id to be in a valid user ID format.'
        ):
            suggestion.validate()

    def test_validate_final_reviewer_id(self) -> None:
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionTranslateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change_cmd'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date,
            self.fake_date)

        suggestion.validate()

        # TODO(#13059): Here we use MyPy ignore because after we fully type the
        # codebase we plan to get rid of the tests that intentionally test wrong
        # inputs that we can normally catch by typing.
        suggestion.final_reviewer_id = 1  # type: ignore[assignment]
        with self.assertRaisesRegex(
            utils.ValidationError, 'Expected final_reviewer_id to be a string'
        ):
            suggestion.validate()

    def test_validate_final_reviewer_id_format(self) -> None:
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionTranslateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change_cmd'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date,
            self.fake_date)

        suggestion.validate()

        suggestion.final_reviewer_id = ''
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected final_reviewer_id to be in a valid user ID format'
        ):
            suggestion.validate()

    def test_validate_score_category(self) -> None:
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionTranslateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change_cmd'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date,
            self.fake_date)

        suggestion.validate()

        # TODO(#13059): Here we use MyPy ignore because after we fully type the
        # codebase we plan to get rid of the tests that intentionally test wrong
        # inputs that we can normally catch by typing.
        suggestion.score_category = 0  # type: ignore[assignment]
        with self.assertRaisesRegex(
            utils.ValidationError, 'Expected score_category to be a string'
        ):
            suggestion.validate()

    def test_validate_score_category_format(self) -> None:
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionTranslateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change_cmd'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date,
            self.fake_date)

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

    def test_validate_score_type(self) -> None:
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionTranslateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change_cmd'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date,
            self.fake_date)

        suggestion.validate()

        suggestion.score_category = 'invalid_score_type.score_sub_type'
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected the first part of score_category to be among allowed'
            ' choices'
        ):
            suggestion.validate()

    def test_validate_change(self) -> None:
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionTranslateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change_cmd'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date,
            self.fake_date)

        suggestion.validate()

        # TODO(#13059): Here we use MyPy ignore because after we fully type the
        # codebase we plan to get rid of the tests that intentionally test wrong
        # inputs that we can normally catch by typing.
        suggestion.change_cmd = {}  # type: ignore[assignment]
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected change_cmd to be an ExplorationChange'
        ):
            suggestion.validate()

    def test_validate_score_type_translation(self) -> None:
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionTranslateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change_cmd'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date,
            self.fake_date)

        suggestion.validate()

        suggestion.score_category = 'question.score_sub_type'
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected the first part of score_category to be translation'
        ):
            suggestion.validate()

    def test_validate_change_cmd(self) -> None:
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionTranslateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change_cmd'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date,
            self.fake_date)

        suggestion.validate()

        suggestion.change_cmd.cmd = 'invalid_cmd'
        with self.assertRaisesRegex(
            utils.ValidationError, 'Expected cmd to be add_written_translation'
        ):
            suggestion.validate()

    def test_validate_translation_html_rte_tags(self) -> None:
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionTranslateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change_cmd'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date,
            self.fake_date)

        suggestion.validate()

        suggestion.change_cmd.translation_html = (
            '<oppia-noninteractive-image></oppia-noninteractive-image>')

        with self.assertRaisesRegex(
            utils.ValidationError,
            'Image tag does not have \'alt-with-value\' attribute.'
        ):
            suggestion.validate()

    def test_validate_language_code_fails_when_language_codes_do_not_match(
        self
    ) -> None:
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionTranslateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change_cmd'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date,
            self.fake_date)
        expected_language_code = (
            expected_suggestion_dict['change_cmd']['language_code']
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
        self
    ) -> None:
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionTranslateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change_cmd'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date,
            self.fake_date)
        suggestion.validate()

        # TODO(#13059): Here we use MyPy ignore because after we fully type the
        # codebase we plan to get rid of the tests that intentionally test wrong
        # inputs that we can normally catch by typing.
        suggestion.language_code = None  # type: ignore[assignment]

        with self.assertRaisesRegex(
            utils.ValidationError, 'language_code cannot be None'
        ):
            suggestion.validate()

    def test_validate_change_with_invalid_language_code_fails_validation(
        self
    ) -> None:
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionTranslateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change_cmd'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date,
            self.fake_date)

        suggestion.validate()

        suggestion.change_cmd.language_code = 'invalid_code'
        with self.assertRaisesRegex(
            utils.ValidationError, 'Invalid language_code: invalid_code'
        ):
            suggestion.validate()

    def test_pre_accept_validate_state_name(self) -> None:
        self.save_new_default_exploration('exp1', self.author_id)
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionTranslateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change_cmd'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date,
            self.fake_date)

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

        suggestion.change_cmd.state_name = 'Introduction'

        suggestion.pre_accept_validate()

        suggestion.change_cmd.state_name = 'invalid_state_name'
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected invalid_state_name to be a valid state name'
        ):
            suggestion.pre_accept_validate()

    def test_accept_suggestion_adds_translation_in_exploration(self) -> None:
        exp = self.save_new_default_exploration('exp1', self.author_id)
        translations = (
            translation_fetchers.get_all_entity_translations_for_entity(
                feconf.TranslatableEntityType.EXPLORATION,
                exp.id, exp.version))
        self.assertEqual(len(translations), 0)
        suggestion = suggestion_registry.SuggestionTranslateContent(
            self.suggestion_dict['suggestion_id'],
            self.suggestion_dict['target_id'],
            self.suggestion_dict['target_version_at_submission'],
            self.suggestion_dict['status'], self.author_id,
            self.reviewer_id, self.suggestion_dict['change_cmd'],
            self.suggestion_dict['score_category'],
            self.suggestion_dict['language_code'], False, self.fake_date,
            self.fake_date)

        suggestion.accept(
            'Accepted suggestion by translator: Add translation change.')

        translations = (
            translation_fetchers.get_all_entity_translations_for_entity(
                feconf.TranslatableEntityType.EXPLORATION,
                exp.id, exp.version))
        self.assertEqual(len(translations), 1)
        self.assertEqual(translations[0].language_code, 'hi')
        self.assertEqual(len(translations[0].translations), 1)

    def test_accept_suggestion_with_set_of_string_adds_translation(
        self
    ) -> None:
        exp = self.save_new_default_exploration('exp1', self.author_id)
        translations = (
            translation_fetchers.get_all_entity_translations_for_entity(
                feconf.TranslatableEntityType.EXPLORATION,
                exp.id, exp.version))
        self.assertEqual(len(translations), 0)
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
            self.suggestion_dict['language_code'], False, self.fake_date,
            self.fake_date)

        suggestion.accept(
            'Accepted suggestion by translator: Add translation change.')

        translations = (
            translation_fetchers.get_all_entity_translations_for_entity(
                feconf.TranslatableEntityType.EXPLORATION, exp.id, exp.version
            )
        )
        self.assertEqual(len(translations), 1)
        self.assertEqual(translations[0].language_code, 'hi')
        self.assertEqual(len(translations[0].translations), 1)

    def test_accept_suggestion_with_psedonymous_author_adds_translation(
        self
    ) -> None:
        exp = self.save_new_default_exploration('exp1', self.author_id)
        translations = (
            translation_fetchers.get_all_entity_translations_for_entity(
                feconf.TranslatableEntityType.EXPLORATION, exp.id, exp.version)
        )
        self.assertEqual(len(translations), 0)

        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionTranslateContent(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.PSEUDONYMOUS_ID,
            self.reviewer_id, expected_suggestion_dict['change_cmd'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date,
            self.fake_date)

        suggestion.accept(
            'Accepted suggestion by translator: Add translation change.')

        translations = (
            translation_fetchers.get_all_entity_translations_for_entity(
                feconf.TranslatableEntityType.EXPLORATION, exp.id, exp.version
            )
        )
        self.assertEqual(len(translations), 1)
        self.assertEqual(translations[0].language_code, 'hi')
        self.assertEqual(len(translations[0].translations), 1)

    def test_get_all_html_content_strings(self) -> None:
        suggestion = suggestion_registry.SuggestionTranslateContent(
            self.suggestion_dict['suggestion_id'],
            self.suggestion_dict['target_id'],
            self.suggestion_dict['target_version_at_submission'],
            self.suggestion_dict['status'], self.author_id,
            self.reviewer_id, self.suggestion_dict['change_cmd'],
            self.suggestion_dict['score_category'],
            self.suggestion_dict['language_code'], False, self.fake_date,
            self.fake_date)

        actual_outcome_list = suggestion.get_all_html_content_strings()

        expected_outcome_list = [
            '<p>This is translated html.</p>', '<p>This is a content.</p>']
        self.assertEqual(expected_outcome_list, actual_outcome_list)

    def test_get_all_html_content_strings_for_content_lists(self) -> None:
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
            self.suggestion_dict['language_code'], False, self.fake_date,
            self.fake_date)

        actual_outcome_list = suggestion.get_all_html_content_strings()

        expected_outcome_list = [
            'translated text1', 'translated text2', 'text1', 'text2']
        self.assertEqual(expected_outcome_list, actual_outcome_list)

    def test_get_target_entity_html_strings_returns_expected_strings(
        self
    ) -> None:
        suggestion = suggestion_registry.SuggestionTranslateContent(
            self.suggestion_dict['suggestion_id'],
            self.suggestion_dict['target_id'],
            self.suggestion_dict['target_version_at_submission'],
            self.suggestion_dict['status'], self.author_id,
            self.reviewer_id, self.suggestion_dict['change_cmd'],
            self.suggestion_dict['score_category'],
            self.suggestion_dict['language_code'], False, self.fake_date,
            self.fake_date)

        actual_outcome_list = suggestion.get_target_entity_html_strings()
        expected_outcome_list = (
            [self.suggestion_dict['change_cmd']['content_html']])
        self.assertEqual(expected_outcome_list, actual_outcome_list)

    def test_convert_html_in_suggestion_change(self) -> None:
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
            self.suggestion_dict['language_code'], False, self.fake_date,
            self.fake_date)
        suggestion.convert_html_in_suggestion_change(
            html_validation_service.add_math_content_to_math_rte_components)
        self.assertEqual(
            suggestion.change_cmd.content_html, expected_html_content)


TestChangeDictType = Dict[
    str,
    Union[
        str,
        float,
        Dict[str, Union[state_domain.StateDict, int, str, List[str]]]
    ]
]


class SuggestionAddQuestionTest(test_utils.GenericTestBase):
    """Tests for the SuggestionAddQuestion class."""

    AUTHOR_EMAIL: Final = 'author@example.com'
    REVIEWER_EMAIL: Final = 'reviewer@example.com'
    ASSIGNED_REVIEWER_EMAIL: Final = 'assigned_reviewer@example.com'
    fake_date: datetime.datetime = datetime.datetime(2016, 4, 10, 0, 0, 0, 0)

    def setUp(self) -> None:
        super().setUp()

        content_id_generator = translation_domain.ContentIdGenerator()
        self.signup(self.AUTHOR_EMAIL, 'author')
        self.author_id = self.get_user_id_from_email(self.AUTHOR_EMAIL)
        self.signup(self.REVIEWER_EMAIL, 'reviewer')
        self.reviewer_id = self.get_user_id_from_email(self.REVIEWER_EMAIL)
        self.suggestion_dict: suggestion_registry.BaseSuggestionDict = {
            'suggestion_id': 'skill1.thread1',
            'suggestion_type': feconf.SUGGESTION_TYPE_ADD_QUESTION,
            'target_type': feconf.ENTITY_TYPE_SKILL,
            'target_id': 'skill1',
            'target_version_at_submission': 1,
            'status': suggestion_models.STATUS_ACCEPTED,
            'author_name': 'author',
            'final_reviewer_id': self.reviewer_id,
            'change_cmd': {
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
            'created_on': utils.get_time_in_millisecs(self.fake_date),
            'edited_by_reviewer': False
        }

    def test_create_suggestion_add_question(self) -> None:
        expected_suggestion_dict = self.suggestion_dict

        observed_suggestion = suggestion_registry.SuggestionAddQuestion(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change_cmd'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date,
            self.fake_date
        )

        self.assertDictEqual(
            observed_suggestion.to_dict(), expected_suggestion_dict)

    def test_validate_suggestion_edit_state_content(self) -> None:
        expected_suggestion_dict = self.suggestion_dict

        suggestion = suggestion_registry.SuggestionAddQuestion(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change_cmd'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date,
            self.fake_date)

        suggestion.validate()

    def test_get_score_part_helper_methods(self) -> None:
        expected_suggestion_dict = self.suggestion_dict

        suggestion = suggestion_registry.SuggestionAddQuestion(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change_cmd'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date,
            self.fake_date)

        self.assertEqual(suggestion.get_score_type(), 'question')
        self.assertEqual(suggestion.get_score_sub_type(), 'topic_1')

    def test_validate_score_type(self) -> None:
        expected_suggestion_dict = self.suggestion_dict

        suggestion = suggestion_registry.SuggestionAddQuestion(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change_cmd'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date,
            self.fake_date)

        suggestion.validate()

        suggestion.score_category = 'content.score_sub_type'

        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected the first part of score_category to be "question"'
        ):
            suggestion.validate()

    def test_validate_change_type(self) -> None:
        expected_suggestion_dict = self.suggestion_dict

        suggestion = suggestion_registry.SuggestionAddQuestion(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change_cmd'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date,
            self.fake_date)

        suggestion.validate()

        # TODO(#13059): Here we use MyPy ignore because after we fully type the
        # codebase we plan to get rid of the tests that intentionally test wrong
        # inputs that we can normally catch by typing.
        suggestion.change_cmd = 'invalid_change'  # type: ignore[assignment]

        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected change_cmd to be an '
            'instance of QuestionSuggestionChange'
        ):
            suggestion.validate()

    def test_validate_change_cmd(self) -> None:
        expected_suggestion_dict = self.suggestion_dict

        suggestion = suggestion_registry.SuggestionAddQuestion(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change_cmd'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date,
            self.fake_date)

        suggestion.validate()

        suggestion.change_cmd.cmd = None

        with self.assertRaisesRegex(
            utils.ValidationError, 'Expected change_cmd to contain cmd'
        ):
            suggestion.validate()

    def test_validate_change_cmd_type(self) -> None:
        expected_suggestion_dict = self.suggestion_dict

        suggestion = suggestion_registry.SuggestionAddQuestion(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change_cmd'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date,
            self.fake_date)

        suggestion.validate()

        suggestion.change_cmd.cmd = 'invalid_cmd'

        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected cmd to be create_new_fully_specified_question'
        ):
            suggestion.validate()

    def test_validate_change_question_dict(self) -> None:
        expected_suggestion_dict = self.suggestion_dict

        suggestion = suggestion_registry.SuggestionAddQuestion(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change_cmd'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date,
            self.fake_date)

        suggestion.validate()

        # TODO(#13059): Here we use MyPy ignore because after we fully type the
        # codebase we plan to get rid of the tests that intentionally test wrong
        # inputs that we can normally catch by typing.
        suggestion.change_cmd.question_dict = None  # type: ignore[assignment]

        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected change_cmd to contain question_dict'
        ):
            suggestion.validate()

    def test_validate_change_question_state_data_schema_version(self) -> None:
        expected_suggestion_dict = self.suggestion_dict

        suggestion = suggestion_registry.SuggestionAddQuestion(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change_cmd'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date,
            self.fake_date)

        suggestion.validate()

        # We are not setting value in suggestion.change.question_dict
        # directly since pylint produces unsupported-assignment-operation
        # error. The detailed analysis for the same can be checked
        # in this issue: https://github.com/oppia/oppia/issues/7008.
        assert isinstance(suggestion.change_cmd.question_dict, dict)
        question_dict: question_domain.QuestionDict = (
            suggestion.change_cmd.question_dict
        )
        question_dict['question_state_data_schema_version'] = 0
        suggestion.change_cmd.question_dict = question_dict

        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected question state schema version to be %s, '
            'received 0' % feconf.CURRENT_STATE_SCHEMA_VERSION
        ):
            suggestion.validate()

    def test_validate_change_skill_difficulty_none(self) -> None:
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionAddQuestion(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change_cmd'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date,
            self.fake_date)
        suggestion.validate()

        # TODO(#13059): Here we use MyPy ignore because after we fully type the
        # codebase we plan to get rid of the tests that intentionally test wrong
        # inputs that we can normally catch by typing.
        suggestion.change_cmd.skill_difficulty = None  # type: ignore[assignment]

        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected change_cmd to contain skill_difficulty'
        ):
            suggestion.validate()

    def test_validate_change_skill_difficulty_invalid_value(self) -> None:
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionAddQuestion(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change_cmd'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date,
            self.fake_date)
        suggestion.validate()

        suggestion.change_cmd.skill_difficulty = 0.4

        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected change_cmd skill_difficulty to be one of '
        ):
            suggestion.validate()

    def test_pre_accept_validate_change_skill_id(self) -> None:
        expected_suggestion_dict = self.suggestion_dict

        suggestion = suggestion_registry.SuggestionAddQuestion(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change_cmd'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date,
            self.fake_date)

        skill_id = skill_services.get_new_skill_id()
        self.save_new_skill(skill_id, self.author_id, description='description')
        suggestion.change_cmd.skill_id = skill_id

        suggestion.pre_accept_validate()

        # TODO(#13059): Here we use MyPy ignore because after we fully type the
        # codebase we plan to get rid of the tests that intentionally test wrong
        # inputs that we can normally catch by typing.
        suggestion.change_cmd.skill_id = None  # type: ignore[assignment]

        with self.assertRaisesRegex(
            utils.ValidationError, 'Expected change_cmd to contain skill_id'
        ):
            suggestion.pre_accept_validate()

    def test_pre_accept_validate_change_invalid_skill_id(self) -> None:
        expected_suggestion_dict = self.suggestion_dict

        suggestion = suggestion_registry.SuggestionAddQuestion(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change_cmd'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date,
            self.fake_date)

        skill_id = skill_services.get_new_skill_id()
        self.save_new_skill(skill_id, self.author_id, description='description')
        suggestion.change_cmd.skill_id = skill_id

        suggestion.pre_accept_validate()

        suggestion.change_cmd.skill_id = skill_services.get_new_skill_id()

        with self.assertRaisesRegex(
            utils.ValidationError, 'The skill with the given id doesn\'t exist.'
        ):
            suggestion.pre_accept_validate()

    def test_populate_old_value_of_change(self) -> None:
        expected_suggestion_dict = self.suggestion_dict

        suggestion = suggestion_registry.SuggestionAddQuestion(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change_cmd'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date,
            self.fake_date)

        # Here we use MyPy ignore because method `populate_old_value_of_change`
        # does not return any value but for testing purpose we are still
        # comparing it's return value with None which causes MyPy to throw
        # error. Thus to avoid the error, we used ignore here.
        self.assertIsNone(suggestion.populate_old_value_of_change())  # type: ignore[func-returns-value]

    def test_cannot_accept_suggestion_with_invalid_skill_id(self) -> None:
        expected_suggestion_dict = self.suggestion_dict

        suggestion = suggestion_registry.SuggestionAddQuestion(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change_cmd'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date,
            self.fake_date)

        suggestion.change_cmd.skill_id = skill_services.get_new_skill_id()

        with self.assertRaisesRegex(
            utils.ValidationError,
            'The skill with the given id doesn\'t exist.'
        ):
            suggestion.accept('commit message')

    def test_pre_update_validate_change_cmd(self) -> None:
        expected_suggestion_dict = self.suggestion_dict

        suggestion = suggestion_registry.SuggestionAddQuestion(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change_cmd'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date,
            self.fake_date)

        change = {
            'cmd': question_domain.CMD_UPDATE_QUESTION_PROPERTY,
            'property_name': question_domain.QUESTION_PROPERTY_LANGUAGE_CODE,
            'new_value': 'bn',
            'old_value': 'en'
        }
        # TODO(#13059): Here we use MyPy ignore because after we fully type the
        # codebase we plan to get rid of the tests that intentionally test wrong
        # inputs that we can normally catch by typing.
        with self.assertRaisesRegex(
            utils.ValidationError,
            'The new change_cmd cmd must be equal to '
            'create_new_fully_specified_question'
        ):
            suggestion.pre_update_validate(
                question_domain.QuestionChange(change))  # type: ignore[arg-type]

    def test_pre_update_validate_change_skill_id(self) -> None:
        expected_suggestion_dict = self.suggestion_dict

        suggestion = suggestion_registry.SuggestionAddQuestion(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change_cmd'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date,
            self.fake_date)

        content_id_generator = translation_domain.ContentIdGenerator()
        change: ChangeType = {
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
            'The new change_cmd skill_id must be equal to skill_1'
        ):
            suggestion.pre_update_validate(
                question_domain.CreateNewFullySpecifiedQuestionCmd(
                    change
                )
            )

    def test_pre_update_validate_complains_if_nothing_changed(self) -> None:
        content_id_generator = translation_domain.ContentIdGenerator()
        change: ChangeType = {
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
            'question.topic_1', 'en', False, self.fake_date, self.fake_date)

        content_id_generator = translation_domain.ContentIdGenerator()
        new_change: ChangeType = {
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
                question_domain.CreateNewFullySpecifiedQuestionSuggestionCmd(
                    new_change
                )
            )

    def test_pre_update_validate_accepts_a_change_in_skill_difficulty_only(
        self
    ) -> None:
        content_id_generator = translation_domain.ContentIdGenerator()
        change: ChangeType = {
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
            'question.topic_1', 'en', False, self.fake_date, self.fake_date)

        content_id_generator = translation_domain.ContentIdGenerator()
        new_change: ChangeType = {
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

        # Here we use MyPy ignore because method `pre_update_validate` does not
        # return any value but for testing purpose we are still comparing it's
        # return value with None which causes MyPy to throw error. Thus to avoid
        # the error, we used ignore here.
        self.assertEqual(
            suggestion.pre_update_validate(  # type: ignore[func-returns-value]
                question_domain.CreateNewFullySpecifiedQuestionSuggestionCmd(
                    new_change
                )
            ),
            None
        )

    def test_pre_update_validate_accepts_a_change_in_state_data_only(
        self
    ) -> None:
        content_id_generator = translation_domain.ContentIdGenerator()
        change: ChangeType = {
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
            'question.topic_1', 'en', False, self.fake_date, self.fake_date)

        content_id_generator = translation_domain.ContentIdGenerator()
        new_change: ChangeType = {
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

        # Here we use MyPy ignore because method `pre_update_validate` does not
        # return any value but for testing purpose we are still comparing it's
        # return value with None which causes MyPy to throw error. Thus to avoid
        # the error, we used ignore here.
        self.assertEqual(
            suggestion.pre_update_validate(  # type: ignore[func-returns-value]
                question_domain.CreateNewFullySpecifiedQuestionSuggestionCmd(
                    new_change
                )
            ),
            None
        )

    def test_validate_author_id(self) -> None:
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionAddQuestion(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change_cmd'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date,
            self.fake_date)

        suggestion.validate()

        # TODO(#13059): Here we use MyPy ignore because after we fully type the
        # codebase we plan to get rid of the tests that intentionally test wrong
        # inputs that we can normally catch by typing.
        suggestion.author_id = 0  # type: ignore[assignment]
        with self.assertRaisesRegex(
            utils.ValidationError, 'Expected author_id to be a string'):
            suggestion.validate()

    def test_validate_author_id_format(self) -> None:
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionAddQuestion(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change_cmd'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date,
            self.fake_date)

        suggestion.validate()

        suggestion.author_id = ''
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected author_id to be in a valid user ID format.'):
            suggestion.validate()

    def test_validate_final_reviewer_id(self) -> None:
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionAddQuestion(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change_cmd'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date,
            self.fake_date)

        suggestion.validate()

        # TODO(#13059): Here we use MyPy ignore because after we fully type the
        # codebase we plan to get rid of the tests that intentionally test wrong
        # inputs that we can normally catch by typing.
        suggestion.final_reviewer_id = 1  # type: ignore[assignment]
        with self.assertRaisesRegex(
            utils.ValidationError, 'Expected final_reviewer_id to be a string'):
            suggestion.validate()

    def test_validate_final_reviewer_id_format(self) -> None:
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionAddQuestion(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change_cmd'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date,
            self.fake_date)

        suggestion.validate()

        suggestion.final_reviewer_id = ''
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected final_reviewer_id to be in a valid user ID format'):
            suggestion.validate()

    def test_validate_language_code_fails_when_language_codes_do_not_match(
        self
    ) -> None:
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionAddQuestion(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change_cmd'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date,
            self.fake_date)
        # Here we use cast because the value of `question_dict` key is a
        # Union of all allowed change dict types. So, to narrow down the type
        # to QuestionDict, we used assert here.
        assert isinstance(
            expected_suggestion_dict['change_cmd']['question_dict'], dict
        )
        expected_question_dict = (
            cast(
                question_domain.QuestionDict,
                expected_suggestion_dict['change_cmd']['question_dict']
            )
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
        self
    ) -> None:
        expected_suggestion_dict = self.suggestion_dict
        suggestion = suggestion_registry.SuggestionAddQuestion(
            expected_suggestion_dict['suggestion_id'],
            expected_suggestion_dict['target_id'],
            expected_suggestion_dict['target_version_at_submission'],
            expected_suggestion_dict['status'], self.author_id,
            self.reviewer_id, expected_suggestion_dict['change_cmd'],
            expected_suggestion_dict['score_category'],
            expected_suggestion_dict['language_code'], False, self.fake_date,
            self.fake_date)
        suggestion.validate()

        # TODO(#13059): Here we use MyPy ignore because after we fully type the
        # codebase we plan to get rid of the tests that intentionally test wrong
        # inputs that we can normally catch by typing.
        suggestion.language_code = None  # type: ignore[assignment]

        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected language_code to be en, received None'):
            suggestion.validate()

    def test_get_all_html_content_strings(self) -> None:
        suggestion = suggestion_registry.SuggestionAddQuestion(
            self.suggestion_dict['suggestion_id'],
            self.suggestion_dict['target_id'],
            self.suggestion_dict['target_version_at_submission'],
            self.suggestion_dict['status'], self.author_id,
            self.reviewer_id, self.suggestion_dict['change_cmd'],
            self.suggestion_dict['score_category'],
            self.suggestion_dict['language_code'], False, self.fake_date,
            self.fake_date)

        actual_outcome_list = suggestion.get_all_html_content_strings()
        expected_outcome_list = [
            '', '', '<p>This is a hint.</p>', '<p>This is a solution.</p>']
        self.assertEqual(expected_outcome_list, actual_outcome_list)

    def test_convert_html_in_suggestion_change(self) -> None:
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

        suggestion_dict: suggestion_registry.BaseSuggestionDict = {
            'suggestion_id': 'skill1.thread1',
            'suggestion_type': feconf.SUGGESTION_TYPE_ADD_QUESTION,
            'target_type': feconf.ENTITY_TYPE_SKILL,
            'target_id': 'skill1',
            'target_version_at_submission': 1,
            'status': suggestion_models.STATUS_ACCEPTED,
            'author_name': 'author',
            'final_reviewer_id': self.reviewer_id,
            'change_cmd': {
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
            'last_updated': utils.get_time_in_millisecs(self.fake_date),
            'created_on': utils.get_time_in_millisecs(self.fake_date),
            'edited_by_reviewer': False
        }
        suggestion = suggestion_registry.SuggestionAddQuestion(
            suggestion_dict['suggestion_id'], suggestion_dict['target_id'],
            suggestion_dict['target_version_at_submission'],
            suggestion_dict['status'], self.author_id, self.reviewer_id,
            suggestion_dict['change_cmd'], suggestion_dict['score_category'],
            suggestion_dict['language_code'], False, self.fake_date,
            self.fake_date)
        suggestion.convert_html_in_suggestion_change(
            html_validation_service.add_math_content_to_math_rte_components)
        # Ruling out the possibility of any other type for mypy type checking.
        assert isinstance(suggestion.change_cmd.question_dict, dict)
        question_dict: question_domain.QuestionDict = (
            suggestion.change_cmd.question_dict
        )
        self.assertEqual(
            question_dict['question_state_data']['content'][
                'html'], expected_html_content)

    def test_accept_suggestion_with_images(self) -> None:
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

        suggestion_dict: suggestion_registry.BaseSuggestionDict = {
            'suggestion_id': 'skill1.thread1',
            'suggestion_type': feconf.SUGGESTION_TYPE_ADD_QUESTION,
            'target_type': feconf.ENTITY_TYPE_SKILL,
            'target_id': 'skill1',
            'target_version_at_submission': 1,
            'status': suggestion_models.STATUS_ACCEPTED,
            'author_name': 'author',
            'final_reviewer_id': self.reviewer_id,
            'change_cmd': {
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
            'last_updated': utils.get_time_in_millisecs(self.fake_date),
            'created_on': utils.get_time_in_millisecs(self.fake_date),
            'edited_by_reviewer': False
        }
        suggestion = suggestion_registry.SuggestionAddQuestion(
            suggestion_dict['suggestion_id'], suggestion_dict['target_id'],
            suggestion_dict['target_version_at_submission'],
            suggestion_dict['status'], self.author_id, self.reviewer_id,
            suggestion_dict['change_cmd'], suggestion_dict['score_category'],
            suggestion_dict['language_code'], False, self.fake_date,
            self.fake_date)
        suggestion.accept('commit_message')

    def test_accept_suggestion_with_image_region_interactions(self) -> None:
        with utils.open_file(
            os.path.join(feconf.TESTS_DATA_DIR, 'img.png'), 'rb',
            encoding=None) as f:
            original_image_content = f.read()
        fs_services.save_original_and_compressed_versions_of_image(
            'image.png', 'question_suggestions', 'skill1',
            original_image_content, 'image', True)

        image_and_region_ca_dict: domain.ImageAndRegionDict = {
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

        # Here, the expected type for `solution` key is SolutionDict but
        # for testing purposes here we are providing None which causes
        # MyPy to throw `Incompatible types` error. Thus to avoid the
        # error, we used ignore here.
        question_state_dict: state_domain.StateDict = {
            'content': {
                'html': '<p>Text</p>',
                'content_id': 'content_0'
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
                                'content_id': 'feedback_2'
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
                        'value': image_and_region_ca_dict
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
                        'content_id': 'default_outcome_1'
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
                            'content_id': 'hint_3'
                        }
                    }
                ],
                'id': 'ImageClickInput', 'solution': None
            },
            'param_changes': [],
            'recorded_voiceovers': {
                'voiceovers_mapping': {
                    'content_0': {},
                    'default_outcome_1': {},
                    'feedback_2': {},
                    'hint_3': {}
                }
            },
            'solicit_answer_details': False,
            'card_is_checkpoint': False,
            'inapplicable_skill_misconception_ids': []
        }
        suggestion_dict: suggestion_registry.BaseSuggestionDict = {
            'suggestion_id': 'skill1.thread1',
            'suggestion_type': feconf.SUGGESTION_TYPE_ADD_QUESTION,
            'target_type': feconf.ENTITY_TYPE_SKILL,
            'target_id': 'skill1',
            'target_version_at_submission': 1,
            'status': suggestion_models.STATUS_ACCEPTED,
            'author_name': 'author',
            'final_reviewer_id': self.reviewer_id,
            'change_cmd': {
                'cmd': question_domain.CMD_CREATE_NEW_FULLY_SPECIFIED_QUESTION,
                'question_dict': {
                    'question_state_data': question_state_dict,
                    'language_code': 'en',
                    'question_state_data_schema_version': (
                        feconf.CURRENT_STATE_SCHEMA_VERSION),
                    'linked_skill_ids': ['skill1'],
                    'next_content_id_index': 4,
                    'inapplicable_skill_misconception_ids': []
                },
                'skill_id': 'skill1',
                'skill_difficulty': 0.3,
            },
            'score_category': 'question.skill1',
            'language_code': 'en',
            'last_updated': utils.get_time_in_millisecs(self.fake_date),
            'created_on': utils.get_time_in_millisecs(self.fake_date),
            'edited_by_reviewer': False
        }
        self.save_new_skill(
            'skill1', self.author_id, description='description')
        suggestion = suggestion_registry.SuggestionAddQuestion(
            suggestion_dict['suggestion_id'], suggestion_dict['target_id'],
            suggestion_dict['target_version_at_submission'],
            suggestion_dict['status'], self.author_id, self.reviewer_id,
            suggestion_dict['change_cmd'], suggestion_dict['score_category'],
            suggestion_dict['language_code'], False, self.fake_date,
            self.fake_date)

        suggestion.accept('commit_message')

        question = question_services.get_questions_by_skill_ids(
            1, ['skill1'], False)[0]
        destination_fs = fs_services.GcsFileSystem(
            feconf.ENTITY_TYPE_QUESTION, question.id)
        self.assertTrue(destination_fs.isfile('image/%s' % 'image.png'))
        self.assertEqual(
            suggestion.status,
            suggestion_models.STATUS_ACCEPTED)

    def test_contructor_updates_state_shema_in_change_cmd(self) -> None:
        score_category = '%s%sskill_id' % (
            suggestion_models.SCORE_TYPE_QUESTION,
            suggestion_models.SCORE_CATEGORY_DELIMITER)
        change: TestChangeDictType = {
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
        # Ruling out the possibility of any other type for mypy type checking.
        assert isinstance(change['question_dict'], dict)
        self.assertEqual(
            change['question_dict']['question_state_data_schema_version'], 27)

        suggestion = suggestion_registry.SuggestionAddQuestion(
            'suggestionId', 'target_id', 1, suggestion_models.STATUS_IN_REVIEW,
            self.author_id, 'test_reviewer', change, score_category, 'en',
            False, self.fake_date, self.fake_date)
        # Ruling out the possibility of any other type for mypy type checking.
        assert isinstance(suggestion.change_cmd.question_dict, dict)
        self.assertEqual(
            suggestion.change_cmd.question_dict[
                'question_state_data_schema_version'],
            feconf.CURRENT_STATE_SCHEMA_VERSION)

    def test_contructor_raise_exception_for_invalid_state_shema_version(
        self
    ) -> None:
        score_category = '%s%sskill_id' % (
            suggestion_models.SCORE_TYPE_QUESTION,
            suggestion_models.SCORE_CATEGORY_DELIMITER)
        change: TestChangeDictType = {
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
        # Ruling out the possibility of any other type for mypy type checking.
        assert isinstance(change['question_dict'], dict)
        self.assertEqual(
            change['question_dict']['question_state_data_schema_version'], 23)

        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected state schema version to be in between 25'
        ):
            suggestion_registry.SuggestionAddQuestion(
                'suggestionId', 'target_id', 1,
                suggestion_models.STATUS_IN_REVIEW, self.author_id,
                'test_reviewer', change, score_category, 'en', False,
                self.fake_date, self.fake_date)


class CommunityContributionStatsUnitTests(test_utils.GenericTestBase):
    """Tests for the CommunityContributionStats class."""

    translation_reviewer_counts_by_lang_code: Dict[str, int] = {
        'hi': 0,
        'en': 1
    }

    translation_suggestion_counts_by_lang_code: Dict[str, int] = {
        'fr': 6,
        'en': 5
    }

    question_reviewer_count: int = 1
    question_suggestion_count: int = 4

    negative_count: int = -1
    non_integer_count: str = 'non_integer_count'
    sample_language_code: str = 'en'
    invalid_language_code: str = 'invalid'

    def _assert_community_contribution_stats_is_in_default_state(self) -> None:
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

    def test_initial_object_with_valid_arguments_has_correct_properties(
        self
    ) -> None:
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
        self
    ) -> None:
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
        self
    ) -> None:
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
        self
    ) -> None:
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
        self
    ) -> None:
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
        self
    ) -> None:
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
        self
    ) -> None:
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
        self
    ) -> None:
        stats = suggestion_services.get_community_contribution_stats()
        stats.set_translation_suggestion_count_for_language_code(
            self.sample_language_code, 1)

        language_codes_that_need_reviewers = (
            stats.get_translation_language_codes_that_need_reviewers()
        )

        self.assertEqual(
            language_codes_that_need_reviewers, {self.sample_language_code})

    def test_get_translation_language_codes_that_need_reviewers_for_multi_lang(
        self
    ) -> None:
        stats = suggestion_services.get_community_contribution_stats()
        stats.set_translation_suggestion_count_for_language_code('hi', 1)
        stats.set_translation_suggestion_count_for_language_code('fr', 1)

        language_codes_that_need_reviewers = (
            stats.get_translation_language_codes_that_need_reviewers()
        )

        self.assertEqual(
            language_codes_that_need_reviewers, {'hi', 'fr'})

    def test_get_translation_language_codes_that_need_reviewers_for_no_lang(
        self
    ) -> None:
        stats = suggestion_services.get_community_contribution_stats()

        language_codes_that_need_reviewers = (
            stats.get_translation_language_codes_that_need_reviewers()
        )

        self.assertEqual(
            language_codes_that_need_reviewers, set())

    def test_translation_reviewers_are_needed_if_suggestions_but_no_reviewers(
        self
    ) -> None:
        stats = suggestion_services.get_community_contribution_stats()
        stats.set_translation_suggestion_count_for_language_code(
            self.sample_language_code, 1)

        self.assertTrue(
            stats.are_translation_reviewers_needed_for_lang_code(
                self.sample_language_code))

    @test_utils.set_platform_parameters([
        (platform_parameter_list.ParamName.MAX_NUMBER_OF_SUGGESTIONS_PER_REVIEWER, 1) # pylint: disable=line-too-long
    ])
    def test_translation_reviewers_are_needed_if_num_suggestions_past_max(
        self
    ) -> None:
        stats = suggestion_services.get_community_contribution_stats()
        stats.set_translation_suggestion_count_for_language_code(
            self.sample_language_code, 2)
        stats.set_translation_reviewer_count_for_language_code(
            self.sample_language_code, 1)

        reviewers_are_needed = (
            stats.are_translation_reviewers_needed_for_lang_code(
                self.sample_language_code))

        self.assertTrue(reviewers_are_needed)

    @test_utils.set_platform_parameters([
        (platform_parameter_list.ParamName.MAX_NUMBER_OF_SUGGESTIONS_PER_REVIEWER, 1) # pylint: disable=line-too-long
    ])
    def test_translation_reviewers_not_needed_if_num_suggestions_eqs_max(
        self
    ) -> None:
        stats = suggestion_services.get_community_contribution_stats()
        stats.set_translation_suggestion_count_for_language_code(
            self.sample_language_code, 2)
        stats.set_translation_reviewer_count_for_language_code(
            self.sample_language_code, 2)

        reviewers_are_needed = (
            stats.are_translation_reviewers_needed_for_lang_code(
                self.sample_language_code))

        self.assertFalse(reviewers_are_needed)

    @test_utils.set_platform_parameters([
        (platform_parameter_list.ParamName.MAX_NUMBER_OF_SUGGESTIONS_PER_REVIEWER, 1) # pylint: disable=line-too-long
    ])
    def test_translation_reviewers_not_needed_if_num_suggestions_less_max(
        self
    ) -> None:
        stats = suggestion_services.get_community_contribution_stats()
        stats.set_translation_suggestion_count_for_language_code(
            self.sample_language_code, 1)
        stats.set_translation_reviewer_count_for_language_code(
            self.sample_language_code, 2)

        reviewers_are_needed = (
            stats.are_translation_reviewers_needed_for_lang_code(
                self.sample_language_code))

        self.assertFalse(reviewers_are_needed)

    def test_translation_reviewers_not_needed_if_reviewers_and_no_sugestions(
        self
    ) -> None:
        stats = suggestion_services.get_community_contribution_stats()
        stats.set_translation_reviewer_count_for_language_code(
            self.sample_language_code, 1)

        self.assertFalse(
            stats.are_translation_reviewers_needed_for_lang_code(
                self.sample_language_code))

    def test_translation_reviewers_not_needed_if_no_reviewers_no_sugestions(
        self
    ) -> None:
        stats = suggestion_services.get_community_contribution_stats()
        self._assert_community_contribution_stats_is_in_default_state()

        self.assertFalse(
            stats.are_translation_reviewers_needed_for_lang_code(
                self.sample_language_code))

    def test_question_reviewers_are_needed_if_suggestions_zero_reviewers(
        self
    ) -> None:
        stats = suggestion_services.get_community_contribution_stats()
        stats.question_suggestion_count = 1

        self.assertTrue(stats.are_question_reviewers_needed())

    @test_utils.set_platform_parameters([
        (platform_parameter_list.ParamName.MAX_NUMBER_OF_SUGGESTIONS_PER_REVIEWER, 1) # pylint: disable=line-too-long
    ])
    def test_question_reviewers_are_needed_if_num_suggestions_past_max(
        self
    ) -> None:
        stats = suggestion_services.get_community_contribution_stats()
        stats.question_suggestion_count = 2
        stats.question_reviewer_count = 1

        reviewers_are_needed = stats.are_question_reviewers_needed()

        self.assertTrue(reviewers_are_needed)

    @test_utils.set_platform_parameters([
        (platform_parameter_list.ParamName.MAX_NUMBER_OF_SUGGESTIONS_PER_REVIEWER, 1) # pylint: disable=line-too-long
    ])
    def test_question_reviewers_not_needed_if_num_suggestions_eqs_max(
        self
    ) -> None:
        stats = suggestion_services.get_community_contribution_stats()
        stats.question_suggestion_count = 2
        stats.question_reviewer_count = 2

        reviewers_are_needed = stats.are_question_reviewers_needed()

        self.assertFalse(reviewers_are_needed)

    @test_utils.set_platform_parameters([
        (platform_parameter_list.ParamName.MAX_NUMBER_OF_SUGGESTIONS_PER_REVIEWER, 1) # pylint: disable=line-too-long
    ])
    def test_question_reviewers_not_needed_if_num_suggestions_less_max(
        self
    ) -> None:
        stats = suggestion_services.get_community_contribution_stats()
        stats.question_suggestion_count = 1
        stats.question_reviewer_count = 2

        reviewers_are_needed = stats.are_question_reviewers_needed()

        self.assertFalse(reviewers_are_needed)

    def test_question_reviewers_not_needed_if_no_reviewers_no_sugestions(
        self
    ) -> None:
        stats = suggestion_services.get_community_contribution_stats()
        self._assert_community_contribution_stats_is_in_default_state()

        self.assertFalse(stats.are_question_reviewers_needed())

    def test_validate_translation_reviewer_counts_fails_for_negative_counts(
        self
    ) -> None:
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
        self
    ) -> None:
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

    def test_validate_question_reviewer_count_fails_for_negative_count(
        self
    ) -> None:
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

    def test_validate_question_suggestion_count_fails_for_negative_count(
        self
    ) -> None:
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

    # TODO(#13059): Here we use MyPy ignore because after we fully type the
    # codebase we plan to get rid of the tests that intentionally test wrong
    # inputs that we can normally catch by typing.
    def test_validate_translation_reviewer_counts_fails_for_non_integer_counts(
        self
    ) -> None:
        community_contribution_stats = (
            suggestion_services.get_community_contribution_stats()
        )
        (
            community_contribution_stats
            .set_translation_reviewer_count_for_language_code(
                self.sample_language_code, self.non_integer_count)  # type: ignore[arg-type]
        )

        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected the translation reviewer count to be an integer for '
            '%s language code, received: %s.' % (
                self.sample_language_code, self.non_integer_count)
        ):
            community_contribution_stats.validate()

    # TODO(#13059): Here we use MyPy ignore because after we fully type the
    # codebase we plan to get rid of the tests that intentionally test wrong
    # inputs that we can normally catch by typing.
    def test_validate_translation_suggestion_counts_fails_for_non_integer_count(
        self
    ) -> None:
        community_contribution_stats = (
            suggestion_services.get_community_contribution_stats()
        )
        (
            community_contribution_stats
            .set_translation_suggestion_count_for_language_code(
                self.sample_language_code, self.non_integer_count)  # type: ignore[arg-type]
        )

        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected the translation suggestion count to be an integer for '
            '%s language code, received: %s.' % (
                self.sample_language_code, self.non_integer_count)
        ):
            community_contribution_stats.validate()

    # TODO(#13059): Here we use MyPy ignore because after we fully type the
    # codebase we plan to get rid of the tests that intentionally test wrong
    # inputs that we can normally catch by typing.
    def test_validate_question_reviewer_count_fails_for_non_integer_count(
        self
    ) -> None:
        community_contribution_stats = (
            suggestion_services.get_community_contribution_stats()
        )
        community_contribution_stats.question_reviewer_count = (
            self.non_integer_count  # type: ignore[assignment]
        )

        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected the question reviewer count to be an integer, '
            'received: %s.' % (
                community_contribution_stats.question_reviewer_count)
        ):
            community_contribution_stats.validate()

    # TODO(#13059): Here we use MyPy ignore because after we fully type the
    # codebase we plan to get rid of the tests that intentionally test wrong
    # inputs that we can normally catch by typing.
    def test_validate_question_suggestion_count_fails_for_non_integer_count(
        self
    ) -> None:
        community_contribution_stats = (
            suggestion_services.get_community_contribution_stats()
        )
        community_contribution_stats.question_suggestion_count = (
            self.non_integer_count  # type: ignore[assignment]
        )

        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected the question suggestion count to be an integer, '
            'received: %s.' % (
                community_contribution_stats.question_suggestion_count)
        ):
            community_contribution_stats.validate()

    def test_validate_translation_reviewer_counts_fails_for_invalid_lang_code(
        self
    ) -> None:
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
        self
    ) -> None:
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

    suggestion_type: str = feconf.SUGGESTION_TYPE_ADD_QUESTION
    language_code: str = 'en'
    suggestion_content: str = 'sample question'
    submission_datetime: datetime.datetime = datetime.datetime.utcnow()

    def test_initial_object_with_valid_arguments_has_correct_properties(
        self
    ) -> None:
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


class TranslationReviewStatsUnitTests(test_utils.GenericTestBase):
    """Tests for the TranslationReviewStats class."""

    LANGUAGE_CODE: Final = 'es'
    CONTRIBUTOR_USER_ID: Final = 'uid_01234567890123456789012345678912'
    TOPIC_ID: Final = 'topic_id'
    REVIEWED_TRANSLATIONS_COUNT: Final = 2
    REVIEWED_TRANSLATION_WORD_COUNT: Final = 100
    ACCEPTED_TRANSLATIONS_COUNT: Final = 1
    ACCEPTED_TRANSLATIONS_WITH_REVIEWER_EDITS_COUNT: Final = 0
    ACCEPTED_TRANSLATION_WORD_COUNT: Final = 50
    FIRST_CONTRIBUTION_DATE: Final = datetime.date.fromtimestamp(1616173836)
    LAST_CONTRIBUTION_DATE: Final = datetime.date.fromtimestamp(1616173836)

    def test_create_translation_review_stats(self) -> None:
        expected_stats_dict = {
            'language_code': self.LANGUAGE_CODE,
            'contributor_user_id': self.CONTRIBUTOR_USER_ID,
            'topic_id': self.TOPIC_ID,
            'reviewed_translations_count': self.REVIEWED_TRANSLATIONS_COUNT,
            'reviewed_translation_word_count': (
                self.REVIEWED_TRANSLATION_WORD_COUNT),
            'accepted_translations_count': self.ACCEPTED_TRANSLATIONS_COUNT,
            'accepted_translation_word_count': (
                self.ACCEPTED_TRANSLATION_WORD_COUNT),
            'accepted_translations_with_reviewer_edits_count': (
                self.ACCEPTED_TRANSLATIONS_WITH_REVIEWER_EDITS_COUNT),
            'first_contribution_date': self.FIRST_CONTRIBUTION_DATE,
            'last_contribution_date': self.LAST_CONTRIBUTION_DATE,
        }

        actual_stats = suggestion_registry.TranslationReviewStats(
            self.LANGUAGE_CODE, self.CONTRIBUTOR_USER_ID,
            self.TOPIC_ID, self.REVIEWED_TRANSLATIONS_COUNT,
            self.REVIEWED_TRANSLATION_WORD_COUNT,
            self.ACCEPTED_TRANSLATIONS_COUNT,
            self.ACCEPTED_TRANSLATION_WORD_COUNT,
            self.ACCEPTED_TRANSLATIONS_WITH_REVIEWER_EDITS_COUNT,
            self.FIRST_CONTRIBUTION_DATE, self.LAST_CONTRIBUTION_DATE
        )

        self.assertDictEqual(
            actual_stats.to_dict(), expected_stats_dict)


class QuestionContributionStatsUnitTests(test_utils.GenericTestBase):
    """Tests for the QuestionContributionStats class."""

    CONTRIBUTOR_USER_ID: Final = 'uid_01234567890123456789012345678912'
    TOPIC_ID: Final = 'topic_id'
    SUBMITTED_QUESTION_COUNT: Final = 2
    ACCEPTED_QUESTIONS_COUNT: Final = 1
    ACCEPTED_QUESTIONS_WITHOUT_REVIEWER_EDITS_COUNT: Final = 0
    FIRST_CONTRIBUTION_DATE: Final = datetime.date.fromtimestamp(1616173836)
    LAST_CONTRIBUTION_DATE: Final = datetime.date.fromtimestamp(1616173836)

    def test_create_question_contribution_stats(self) -> None:
        expected_stats_dict = {
            'contributor_user_id': self.CONTRIBUTOR_USER_ID,
            'topic_id': self.TOPIC_ID,
            'submitted_questions_count': (
                self.SUBMITTED_QUESTION_COUNT),
            'accepted_questions_count': (
                self.ACCEPTED_QUESTIONS_COUNT),
            'accepted_questions_without_reviewer_edits_count': (
                self
                .ACCEPTED_QUESTIONS_WITHOUT_REVIEWER_EDITS_COUNT),
            'first_contribution_date': (
                self.FIRST_CONTRIBUTION_DATE),
            'last_contribution_date': (
                self.LAST_CONTRIBUTION_DATE)
        }

        actual_stats = suggestion_registry.QuestionContributionStats(
            self.CONTRIBUTOR_USER_ID, self.TOPIC_ID,
            self.SUBMITTED_QUESTION_COUNT, self.ACCEPTED_QUESTIONS_COUNT,
            self.ACCEPTED_QUESTIONS_WITHOUT_REVIEWER_EDITS_COUNT,
            self.FIRST_CONTRIBUTION_DATE, self.LAST_CONTRIBUTION_DATE
        )

        self.assertDictEqual(
            actual_stats.to_dict(), expected_stats_dict)


class QuestionReviewStatsUnitTests(test_utils.GenericTestBase):
    """Tests for the QuestionReviewStats class."""

    CONTRIBUTOR_USER_ID: Final = 'uid_01234567890123456789012345678912'
    TOPIC_ID: Final = 'topic_id'
    REVIEWED_QUESTIONS_COUNT: Final = 2
    ACCEPTED_QUESTIONS_COUNT: Final = 1
    ACCEPTED_QUESTIONS_WITH_REVIEWER_EDITS_COUNT: Final = 0
    FIRST_CONTRIBUTION_DATE: Final = datetime.date.fromtimestamp(1616173836)
    LAST_CONTRIBUTION_DATE: Final = datetime.date.fromtimestamp(1616173836)

    def test_create_question_review_stats(self) -> None:
        expected_stats_dict = {
            'contributor_user_id': self.CONTRIBUTOR_USER_ID,
            'topic_id': self.TOPIC_ID,
            'reviewed_questions_count': self.REVIEWED_QUESTIONS_COUNT,
            'accepted_questions_count': (
                self.ACCEPTED_QUESTIONS_COUNT),
            'accepted_questions_with_reviewer_edits_count': (
                self.ACCEPTED_QUESTIONS_WITH_REVIEWER_EDITS_COUNT),
            'first_contribution_date': (
                self.FIRST_CONTRIBUTION_DATE),
            'last_contribution_date': self.LAST_CONTRIBUTION_DATE
        }

        actual_stats = suggestion_registry.QuestionReviewStats(
            self.CONTRIBUTOR_USER_ID, self.TOPIC_ID,
            self.REVIEWED_QUESTIONS_COUNT,
            self.ACCEPTED_QUESTIONS_COUNT,
            self.ACCEPTED_QUESTIONS_WITH_REVIEWER_EDITS_COUNT,
            self.FIRST_CONTRIBUTION_DATE, self.LAST_CONTRIBUTION_DATE
        )

        self.assertDictEqual(
            actual_stats.to_dict(), expected_stats_dict)


class ContributorMilestoneEmailInfoUnitTests(test_utils.GenericTestBase):
    """Tests for the ContributorMilestoneEmailInfo class."""

    CONTRIBUTOR_USER_ID: Final = 'uid_01234567890123456789012345678912'
    CONTRIBUTION_TYPE: Final = 'translation'
    CONTRIBUTION_SUBTYPE: Final = 'submission'
    LANGUAGE_CODE: Final = 'es'
    RANK_NAME: Final = 'Initial Contributor'

    def test_create_contribution_milestone_email_info(self) -> None:
        actual_info = suggestion_registry.ContributorMilestoneEmailInfo(
            self.CONTRIBUTOR_USER_ID, self.CONTRIBUTION_TYPE,
            self.CONTRIBUTION_SUBTYPE, self.LANGUAGE_CODE,
            self.RANK_NAME
        )

        self.assertEqual(
            actual_info.contributor_user_id, self.CONTRIBUTOR_USER_ID
        )
        self.assertEqual(
            actual_info.contribution_type, self.CONTRIBUTION_TYPE
        )
        self.assertEqual(
            actual_info.contribution_subtype, self.CONTRIBUTION_SUBTYPE
        )
        self.assertEqual(
            actual_info.language_code, self.LANGUAGE_CODE
        )
        self.assertEqual(
            actual_info.rank_name, self.RANK_NAME
        )


class ContributorStatsSummaryUnitTests(test_utils.GenericTestBase):
    """Tests for the ContributorStatsSummary class."""

    LANGUAGE_CODE: Final = 'es'
    CONTRIBUTOR_USER_ID: Final = 'user_01'
    TOPIC_ID: Final = 'topic_id'
    SUBMITTED_TRANSLATIONS_COUNT: Final = 2
    SUBMITTED_TRANSLATION_WORD_COUNT: Final = 100
    REJECTED_TRANSLATIONS_COUNT: Final = 0
    REJECTED_TRANSLATION_WORD_COUNT: Final = 0
    # Timestamp dates in sec since epoch for Mar 19 2021 UTC.
    CONTRIBUTION_DATES: Final = {
        datetime.date.fromtimestamp(1616173836),
        datetime.date.fromtimestamp(1616173837)
    }
    REVIEWED_TRANSLATIONS_COUNT: Final = 2
    REVIEWED_TRANSLATION_WORD_COUNT: Final = 100
    ACCEPTED_TRANSLATIONS_COUNT: Final = 1
    ACCEPTED_TRANSLATIONS_WITH_REVIEWER_EDITS_COUNT: Final = 0
    ACCEPTED_TRANSLATIONS_WITHOUT_REVIEWER_EDITS_COUNT: Final = 0
    ACCEPTED_TRANSLATION_WORD_COUNT: Final = 50
    SUBMITTED_QUESTION_COUNT: Final = 2
    ACCEPTED_QUESTIONS_COUNT: Final = 1
    ACCEPTED_QUESTIONS_WITHOUT_REVIEWER_EDITS_COUNT: Final = 0
    REVIEWED_QUESTIONS_COUNT: Final = 2
    ACCEPTED_QUESTIONS_WITH_REVIEWER_EDITS_COUNT: Final = 0
    FIRST_CONTRIBUTION_DATE: Final = datetime.date.fromtimestamp(1616173836)
    LAST_CONTRIBUTION_DATE: Final = datetime.date.fromtimestamp(1616173836)

    def test_create_contribution_stats_summary(self) -> None:
        expected_translation_contribution_stats = {
            'language_code': self.LANGUAGE_CODE,
            'contributor_user_id': self.CONTRIBUTOR_USER_ID,
            'topic_id': self.TOPIC_ID,
            'submitted_translations_count': self.SUBMITTED_TRANSLATIONS_COUNT,
            'submitted_translation_word_count': (
                self.SUBMITTED_TRANSLATION_WORD_COUNT),
            'accepted_translations_count': self.ACCEPTED_TRANSLATIONS_COUNT,
            'accepted_translations_without_reviewer_edits_count': (
                self.ACCEPTED_TRANSLATIONS_WITHOUT_REVIEWER_EDITS_COUNT),
            'accepted_translation_word_count': (
                self.ACCEPTED_TRANSLATION_WORD_COUNT),
            'rejected_translations_count': self.REJECTED_TRANSLATIONS_COUNT,
            'rejected_translation_word_count': (
                self.REJECTED_TRANSLATION_WORD_COUNT),
            'contribution_dates': self.CONTRIBUTION_DATES
        }
        expected_translation_review_stats = {
            'language_code': self.LANGUAGE_CODE,
            'contributor_user_id': self.CONTRIBUTOR_USER_ID,
            'topic_id': self.TOPIC_ID,
            'reviewed_translations_count': self.REVIEWED_TRANSLATIONS_COUNT,
            'reviewed_translation_word_count': (
                self.REVIEWED_TRANSLATION_WORD_COUNT),
            'accepted_translations_count': self.ACCEPTED_TRANSLATIONS_COUNT,
            'accepted_translation_word_count': (
                self.ACCEPTED_TRANSLATION_WORD_COUNT),
            'accepted_translations_with_reviewer_edits_count': (
                self.ACCEPTED_TRANSLATIONS_WITH_REVIEWER_EDITS_COUNT),
            'first_contribution_date': self.FIRST_CONTRIBUTION_DATE,
            'last_contribution_date': self.LAST_CONTRIBUTION_DATE,
        }
        expected_question_contribution_stats = {
            'contributor_user_id': self.CONTRIBUTOR_USER_ID,
            'topic_id': self.TOPIC_ID,
            'submitted_questions_count': (
                self.SUBMITTED_QUESTION_COUNT),
            'accepted_questions_count': (
                self.ACCEPTED_QUESTIONS_COUNT),
            'accepted_questions_without_reviewer_edits_count': (
                self
                .ACCEPTED_QUESTIONS_WITHOUT_REVIEWER_EDITS_COUNT),
            'first_contribution_date': (
                self.FIRST_CONTRIBUTION_DATE),
            'last_contribution_date': (
                self.LAST_CONTRIBUTION_DATE)
        }
        expected_question_review_stats = {
            'contributor_user_id': self.CONTRIBUTOR_USER_ID,
            'topic_id': self.TOPIC_ID,
            'reviewed_questions_count': self.REVIEWED_QUESTIONS_COUNT,
            'accepted_questions_count': (
                self.ACCEPTED_QUESTIONS_COUNT),
            'accepted_questions_with_reviewer_edits_count': (
                self.ACCEPTED_QUESTIONS_WITH_REVIEWER_EDITS_COUNT),
            'first_contribution_date': (
                self.FIRST_CONTRIBUTION_DATE),
            'last_contribution_date': self.LAST_CONTRIBUTION_DATE
        }
        expected_contribution_summary = {
            'contributor_user_id': self.CONTRIBUTOR_USER_ID,
            'translation_contribution_stats': [
                expected_translation_contribution_stats],
            'question_contribution_stats': [
                expected_question_contribution_stats],
            'translation_review_stats': [expected_translation_review_stats],
            'question_review_stats': [expected_question_review_stats]
        }
        translation_contribution_stats = (
            suggestion_registry).TranslationContributionStats(
                self.LANGUAGE_CODE,
                self.CONTRIBUTOR_USER_ID,
                self.TOPIC_ID,
                self.SUBMITTED_TRANSLATIONS_COUNT,
                self.SUBMITTED_TRANSLATION_WORD_COUNT,
                self.ACCEPTED_TRANSLATIONS_COUNT,
                (
                    self
                    .ACCEPTED_TRANSLATIONS_WITHOUT_REVIEWER_EDITS_COUNT
                ),
                self.ACCEPTED_TRANSLATION_WORD_COUNT,
                self.REJECTED_TRANSLATIONS_COUNT,
                self.REJECTED_TRANSLATION_WORD_COUNT,
                self.CONTRIBUTION_DATES
            )
        translation_review_stats = suggestion_registry.TranslationReviewStats(
            self.LANGUAGE_CODE, self.CONTRIBUTOR_USER_ID,
            self.TOPIC_ID, self.REVIEWED_TRANSLATIONS_COUNT,
            self.REVIEWED_TRANSLATION_WORD_COUNT,
            self.ACCEPTED_TRANSLATIONS_COUNT,
            self.ACCEPTED_TRANSLATION_WORD_COUNT,
            self.ACCEPTED_TRANSLATIONS_WITH_REVIEWER_EDITS_COUNT,
            self.FIRST_CONTRIBUTION_DATE, self.LAST_CONTRIBUTION_DATE
        )
        question_contribution_stats = (
            suggestion_registry).QuestionContributionStats(
                self.CONTRIBUTOR_USER_ID, self.TOPIC_ID,
                self.SUBMITTED_QUESTION_COUNT, self.ACCEPTED_QUESTIONS_COUNT,
                self.ACCEPTED_QUESTIONS_WITHOUT_REVIEWER_EDITS_COUNT,
                self.FIRST_CONTRIBUTION_DATE, self.LAST_CONTRIBUTION_DATE
            )
        question_review_stats = suggestion_registry.QuestionReviewStats(
            self.CONTRIBUTOR_USER_ID, self.TOPIC_ID,
            self.REVIEWED_QUESTIONS_COUNT,
            self.ACCEPTED_QUESTIONS_COUNT,
            self.ACCEPTED_QUESTIONS_WITH_REVIEWER_EDITS_COUNT,
            self.FIRST_CONTRIBUTION_DATE, self.LAST_CONTRIBUTION_DATE
        )

        contribution_summary = suggestion_registry.ContributorStatsSummary(
            self.CONTRIBUTOR_USER_ID,
            [translation_contribution_stats], [question_contribution_stats],
            [translation_review_stats], [question_review_stats]
        )

        self.assertDictEqual(
            contribution_summary.to_dict(), expected_contribution_summary
        )


class TranslationSubmitterTotalContributionStatsUnitTests(
    test_utils.GenericTestBase):
    """Tests for the TranslationSubmitterTotalContributionStats class."""

    SUGGESTION_LANGUAGE_CODE: Final = 'es'
    TOPIC_IDS_WITH_TRANSLATION_SUBMISSIONS: Final = ['topic1', 'topic2']
    RECENT_REVIEW_OUTCOMES: Final = ['accepted', 'rejected']
    RECENT_PERFORMANCE: Final = 2
    OVERALL_ACCURACY: Final = 2.0
    SUBMITTED_TRANSLATIONS_COUNT: Final = 2
    SUBMITTED_TRANSLATION_WORD_COUNT: Final = 100
    ACCEPTED_TRANSLATIONS_COUNT: Final = 1
    ACCEPTED_TRANSLATIONS_WITHOUT_REVIEWER_EDITS_COUNT: Final = 0
    ACCEPTED_TRANSLATION_WORD_COUNT: Final = 50
    REJECTED_TRANSLATIONS_COUNT: Final = 0
    REJECTED_TRANSLATION_WORD_COUNT: Final = 0
    FIRST_CONTRIBUTION_DATE = datetime.date.today()
    LAST_CONTRIBUTION_DATE = (
        datetime.date.today() - datetime.timedelta(25))
    user_id: str = 'user_id'
    story_id_1: str = 'story_1'
    story_id_2: str = 'story_2'
    story_id_3: str = 'story_3'
    subtopic_id: int = 1
    skill_id_1: str = 'skill_1'
    skill_id_2: str = 'skill_2'

    def test_to_frontend_dict(self) -> None:
        auth_id = 'someUser'
        username = 'username'
        user_settings = user_services.create_new_user(
            auth_id, 'user@example.com')
        user_services.set_username(user_settings.user_id, username)
        topic_id_1 = topic_fetchers.get_new_topic_id()
        topic_id_2 = topic_fetchers.get_new_topic_id()
        self.save_new_topic(
            topic_id_1, self.user_id, name='topic1',
            abbreviated_name='name1', url_fragment='name-one',
            description='Description',
            canonical_story_ids=[self.story_id_1, self.story_id_2],
            additional_story_ids=[self.story_id_3],
            uncategorized_skill_ids=[self.skill_id_1, self.skill_id_2],
            subtopics=[], next_subtopic_id=1)
        self.save_new_topic(
            topic_id_2, self.user_id, name='topic2',
            abbreviated_name='name2', url_fragment='name-two',
            description='Description',
            canonical_story_ids=[self.story_id_1, self.story_id_2],
            additional_story_ids=[self.story_id_3],
            uncategorized_skill_ids=[self.skill_id_1, self.skill_id_2],
            subtopics=[], next_subtopic_id=1)
        expected_frontend_dict = {
            'language_code': self.SUGGESTION_LANGUAGE_CODE,
            'contributor_name': username,
            'topic_names': (
                self.TOPIC_IDS_WITH_TRANSLATION_SUBMISSIONS),
            'recent_performance': self.RECENT_PERFORMANCE,
            'overall_accuracy': self.OVERALL_ACCURACY,
            'submitted_translations_count': (
                self.SUBMITTED_TRANSLATIONS_COUNT),
            'submitted_translation_word_count': (
                self.SUBMITTED_TRANSLATION_WORD_COUNT),
            'accepted_translations_count': (
                self.ACCEPTED_TRANSLATIONS_COUNT),
            'accepted_translations_without_reviewer_edits_count': (
                self
                .ACCEPTED_TRANSLATIONS_WITHOUT_REVIEWER_EDITS_COUNT),
            'accepted_translation_word_count': (
                self.ACCEPTED_TRANSLATION_WORD_COUNT),
            'rejected_translations_count': (
                self.REJECTED_TRANSLATIONS_COUNT),
            'rejected_translation_word_count': (
                self.REJECTED_TRANSLATION_WORD_COUNT),
            'first_contribution_date': (
                self.FIRST_CONTRIBUTION_DATE.strftime('%b %d, %Y')),
            'last_contributed_in_days': (
                utils.get_number_of_days_since_date(
                    self.LAST_CONTRIBUTION_DATE))
        }

        actual_stats = suggestion_registry.TranslationSubmitterTotalContributionStats( # pylint: disable=line-too-long
            self.SUGGESTION_LANGUAGE_CODE,
            user_settings.user_id,
            [topic_id_1, topic_id_2],
            self.RECENT_REVIEW_OUTCOMES, self.RECENT_PERFORMANCE,
            self.OVERALL_ACCURACY,
            self.SUBMITTED_TRANSLATIONS_COUNT,
            self.SUBMITTED_TRANSLATION_WORD_COUNT,
            self.ACCEPTED_TRANSLATIONS_COUNT,
            self.ACCEPTED_TRANSLATIONS_WITHOUT_REVIEWER_EDITS_COUNT,
            self.ACCEPTED_TRANSLATION_WORD_COUNT,
            self.REJECTED_TRANSLATIONS_COUNT,
            self.REJECTED_TRANSLATION_WORD_COUNT,
            self.FIRST_CONTRIBUTION_DATE, self.LAST_CONTRIBUTION_DATE
        )

        self.assertDictEqual(
            actual_stats.to_frontend_dict(), expected_frontend_dict)


class TranslationReviewerTotalContributionStatsUnitTests(
    test_utils.GenericTestBase):
    """Tests for the TranslationReviewerTotalContributionStats class."""

    SUGGESTION_LANGUAGE_CODE: Final = 'es'
    TOPIC_IDS_WITH_TRANSLATION_REVIEWS: Final = ['topic1', 'topic2']
    REVIEWED_TRANSLATIONS_COUNT: Final = 2
    ACCEPTED_TRANSLATIONS_COUNT: Final = 1
    ACCEPTED_TRANSLATIONS_WITH_REVIEWER_EDITS_COUNT: Final = 0
    ACCEPTED_TRANSLATION_WORD_COUNT: Final = 1
    REJECTED_TRANSLATIONS_COUNT: Final = 0
    FIRST_CONTRIBUTION_DATE = datetime.date.today()
    LAST_CONTRIBUTION_DATE = (
        datetime.date.today() - datetime.timedelta(25))
    user_id: str = 'user_id'
    story_id_1: str = 'story_1'
    story_id_2: str = 'story_2'
    story_id_3: str = 'story_3'
    subtopic_id: int = 1
    skill_id_1: str = 'skill_1'
    skill_id_2: str = 'skill_2'

    def test_to_frontend_dict(self) -> None:
        auth_id = 'someUser'
        username = 'username'
        user_settings = user_services.create_new_user(
            auth_id, 'user@example.com')
        user_services.set_username(user_settings.user_id, username)
        topic_id_1 = topic_fetchers.get_new_topic_id()
        topic_id_2 = topic_fetchers.get_new_topic_id()
        self.save_new_topic(
            topic_id_1, self.user_id, name='topic1',
            abbreviated_name='name1', url_fragment='name-one',
            description='Description',
            canonical_story_ids=[self.story_id_1, self.story_id_2],
            additional_story_ids=[self.story_id_3],
            uncategorized_skill_ids=[self.skill_id_1, self.skill_id_2],
            subtopics=[], next_subtopic_id=1)
        self.save_new_topic(
            topic_id_2, self.user_id, name='topic2',
            abbreviated_name='name2', url_fragment='name-two',
            description='Description',
            canonical_story_ids=[self.story_id_1, self.story_id_2],
            additional_story_ids=[self.story_id_3],
            uncategorized_skill_ids=[self.skill_id_1, self.skill_id_2],
            subtopics=[], next_subtopic_id=1)
        expected_stats_dict = {
            'language_code': self.SUGGESTION_LANGUAGE_CODE,
            'contributor_name': username,
            'topic_names': (
                self.TOPIC_IDS_WITH_TRANSLATION_REVIEWS),
            'reviewed_translations_count': (
                self.REVIEWED_TRANSLATIONS_COUNT),
            'accepted_translations_count': (
                self.ACCEPTED_TRANSLATIONS_COUNT),
            'accepted_translations_with_reviewer_edits_count': (
                self
                .ACCEPTED_TRANSLATIONS_WITH_REVIEWER_EDITS_COUNT),
            'accepted_translation_word_count': (
                self.ACCEPTED_TRANSLATION_WORD_COUNT),
            'rejected_translations_count': (
                self.REJECTED_TRANSLATIONS_COUNT),
            'first_contribution_date': (
                self.FIRST_CONTRIBUTION_DATE.strftime('%b %d, %Y')),
            'last_contributed_in_days': (
                utils.get_number_of_days_since_date(
                    self.LAST_CONTRIBUTION_DATE))
        }

        actual_stats = suggestion_registry.TranslationReviewerTotalContributionStats( # pylint: disable=line-too-long
            self.SUGGESTION_LANGUAGE_CODE,
            user_settings.user_id,
            [topic_id_1, topic_id_2],
            self.REVIEWED_TRANSLATIONS_COUNT,
            self.ACCEPTED_TRANSLATIONS_COUNT,
            self.ACCEPTED_TRANSLATIONS_WITH_REVIEWER_EDITS_COUNT,
            self.ACCEPTED_TRANSLATION_WORD_COUNT,
            self.REJECTED_TRANSLATIONS_COUNT,
            self.FIRST_CONTRIBUTION_DATE, self.LAST_CONTRIBUTION_DATE
        )

        self.assertDictEqual(
            actual_stats.to_frontend_dict(), expected_stats_dict)


class QuestionSubmitterTotalContributionStatsUnitTests(
    test_utils.GenericTestBase):
    """Tests for the QuestionSubmitterTotalContributionStats class."""

    TOPIC_IDS_WITH_QUESTION_SUBMISSIONS: Final = ['topic1', 'topic2']
    RECENT_REVIEW_OUTCOMES: Final = ['accepted', 'rejected']
    RECENT_PERFORMANCE: Final = 2
    OVERALL_ACCURACY: Final = 2.0
    SUBMITTED_QUESTIONS_COUNT: Final = 2
    SUBMITTED_QUESTION_WORD_COUNT: Final = 100
    ACCEPTED_QUESTIONS_COUNT: Final = 1
    ACCEPTED_QUESTIONS_WITHOUT_REVIEWER_EDITS_COUNT: Final = 0
    ACCEPTED_QUESTION_WORD_COUNT: Final = 50
    REJECTED_QUESTIONS_COUNT: Final = 0
    REJECTED_QUESTION_WORD_COUNT: Final = 0
    FIRST_CONTRIBUTION_DATE = datetime.date.today()
    LAST_CONTRIBUTION_DATE = (
        datetime.date.today() - datetime.timedelta(25))
    user_id: str = 'user_id'
    story_id_1: str = 'story_1'
    story_id_2: str = 'story_2'
    story_id_3: str = 'story_3'
    subtopic_id: int = 1
    skill_id_1: str = 'skill_1'
    skill_id_2: str = 'skill_2'

    def test_to_frontend_dict(self) -> None:
        auth_id = 'someUser'
        username = 'username'
        user_settings = user_services.create_new_user(
            auth_id, 'user@example.com')
        user_services.set_username(user_settings.user_id, username)
        topic_id_1 = topic_fetchers.get_new_topic_id()
        topic_id_2 = topic_fetchers.get_new_topic_id()
        self.save_new_topic(
            topic_id_1, self.user_id, name='topic1',
            abbreviated_name='name1', url_fragment='name-one',
            description='Description',
            canonical_story_ids=[self.story_id_1, self.story_id_2],
            additional_story_ids=[self.story_id_3],
            uncategorized_skill_ids=[self.skill_id_1, self.skill_id_2],
            subtopics=[], next_subtopic_id=1)
        self.save_new_topic(
            topic_id_2, self.user_id, name='topic2',
            abbreviated_name='name2', url_fragment='name-two',
            description='Description',
            canonical_story_ids=[self.story_id_1, self.story_id_2],
            additional_story_ids=[self.story_id_3],
            uncategorized_skill_ids=[self.skill_id_1, self.skill_id_2],
            subtopics=[], next_subtopic_id=1)
        expected_stats_dict = {
            'contributor_name': username,
            'topic_names': (
                self.TOPIC_IDS_WITH_QUESTION_SUBMISSIONS),
            'recent_performance': self.RECENT_PERFORMANCE,
            'overall_accuracy': self.OVERALL_ACCURACY,
            'submitted_questions_count': (
                self.SUBMITTED_QUESTIONS_COUNT),
            'accepted_questions_count': (
                self.ACCEPTED_QUESTIONS_COUNT),
            'accepted_questions_without_reviewer_edits_count': (
                self
                .ACCEPTED_QUESTIONS_WITHOUT_REVIEWER_EDITS_COUNT),
            'rejected_questions_count': (
                self.REJECTED_QUESTIONS_COUNT),
            'first_contribution_date': (
                self.FIRST_CONTRIBUTION_DATE.strftime('%b %d, %Y')),
            'last_contributed_in_days': (
                utils.get_number_of_days_since_date(
                    self.LAST_CONTRIBUTION_DATE))
        }

        actual_stats = suggestion_registry.QuestionSubmitterTotalContributionStats( # pylint: disable=line-too-long
            user_settings.user_id,
            [topic_id_1, topic_id_2],
            self.RECENT_REVIEW_OUTCOMES, self.RECENT_PERFORMANCE,
            self.OVERALL_ACCURACY,
            self.SUBMITTED_QUESTIONS_COUNT,
            self.ACCEPTED_QUESTIONS_COUNT,
            self.ACCEPTED_QUESTIONS_WITHOUT_REVIEWER_EDITS_COUNT,
            self.REJECTED_QUESTIONS_COUNT,
            self.FIRST_CONTRIBUTION_DATE, self.LAST_CONTRIBUTION_DATE
        )

        self.assertDictEqual(
            actual_stats.to_frontend_dict(), expected_stats_dict)


class QuestionReviewerTotalContributionStatsUnitTests(
    test_utils.GenericTestBase):
    """Tests for the QuestionReviewerTotalContributionStats class."""

    TOPIC_IDS_WITH_QUESTION_REVIEWS: Final = ['topic1', 'topic2']
    REVIEWED_QUESTIONS_COUNT: Final = 2
    ACCEPTED_QUESTIONS_COUNT: Final = 1
    ACCEPTED_QUESTIONS_WITH_REVIEWER_EDITS_COUNT: Final = 0
    REJECTED_QUESTIONS_COUNT: Final = 0
    FIRST_CONTRIBUTION_DATE = datetime.date.today()
    LAST_CONTRIBUTION_DATE = (
        datetime.date.today() - datetime.timedelta(25))
    user_id: str = 'user_id'
    story_id_1: str = 'story_1'
    story_id_2: str = 'story_2'
    story_id_3: str = 'story_3'
    subtopic_id: int = 1
    skill_id_1: str = 'skill_1'
    skill_id_2: str = 'skill_2'

    def test_to_frontend_dict(self) -> None:
        auth_id = 'someUser'
        username = 'username'
        user_settings = user_services.create_new_user(
            auth_id, 'user@example.com')
        user_services.set_username(user_settings.user_id, username)
        topic_id_1 = topic_fetchers.get_new_topic_id()
        topic_id_2 = topic_fetchers.get_new_topic_id()
        self.save_new_topic(
            topic_id_1, self.user_id, name='topic1',
            abbreviated_name='name1', url_fragment='name-one',
            description='Description',
            canonical_story_ids=[self.story_id_1, self.story_id_2],
            additional_story_ids=[self.story_id_3],
            uncategorized_skill_ids=[self.skill_id_1, self.skill_id_2],
            subtopics=[], next_subtopic_id=1)
        self.save_new_topic(
            topic_id_2, self.user_id, name='topic2',
            abbreviated_name='name2', url_fragment='name-two',
            description='Description',
            canonical_story_ids=[self.story_id_1, self.story_id_2],
            additional_story_ids=[self.story_id_3],
            uncategorized_skill_ids=[self.skill_id_1, self.skill_id_2],
            subtopics=[], next_subtopic_id=1)
        expected_stats_dict = {
            'contributor_name': username,
            'topic_names': (
                self.TOPIC_IDS_WITH_QUESTION_REVIEWS),
            'reviewed_questions_count': (
                self.REVIEWED_QUESTIONS_COUNT),
            'accepted_questions_count': (
                self.ACCEPTED_QUESTIONS_COUNT),
            'accepted_questions_with_reviewer_edits_count': (
                self
                .ACCEPTED_QUESTIONS_WITH_REVIEWER_EDITS_COUNT),
            'rejected_questions_count': (
                self.REJECTED_QUESTIONS_COUNT),
            'first_contribution_date': (
                self.FIRST_CONTRIBUTION_DATE.strftime('%b %d, %Y')),
            'last_contributed_in_days': (
                utils.get_number_of_days_since_date(
                self.LAST_CONTRIBUTION_DATE))
        }

        actual_stats = suggestion_registry.QuestionReviewerTotalContributionStats( # pylint: disable=line-too-long
            user_settings.user_id,
            [topic_id_1, topic_id_2],
            self.REVIEWED_QUESTIONS_COUNT,
            self.ACCEPTED_QUESTIONS_COUNT,
            self.ACCEPTED_QUESTIONS_WITH_REVIEWER_EDITS_COUNT,
            self.REJECTED_QUESTIONS_COUNT,
            self.FIRST_CONTRIBUTION_DATE, self.LAST_CONTRIBUTION_DATE
        )

        self.assertDictEqual(
            actual_stats.to_frontend_dict(), expected_stats_dict)
