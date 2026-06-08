# Copyright 2021 The Oppia Authors. All Rights Reserved.
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

"""Tests for the domain_objects_validator."""

from __future__ import annotations

import copy
import datetime
import os

from core import feconf, utils
from core.constants import constants
from core.controllers import domain_objects_validator
from core.domain import (
    blog_services,
    change_domain,
    general_feedback_domain,
    improvements_domain,
    question_domain,
    state_domain,
    stats_domain,
    translation_domain,
)
from core.tests import test_utils

from typing import Dict, List, Mapping, Optional, Union, cast


class ValidateSuggestionChangeTests(test_utils.GenericTestBase):
    """Tests to validate domain objects coming from frontend."""

    def test_incorrect_exp_domain_object_raises_exception(self) -> None:
        incorrect_change_dict = {
            'state_name': 'State 3',
            'content_id': 'content_0',
            'language_code': 'hi',
            'content_html': '<p>old content html</p>',
            'translation_html': '<p>In Hindi</p>',
            'data_format': 'html',
        }
        with self.assertRaisesRegex(
            Exception, 'Missing cmd key in change dict'
        ):
            domain_objects_validator.validate_suggestion_change(
                incorrect_change_dict
            )

        incorrect_change_dict = {
            'cmd': 'add_subtopic',
            'state_name': 'State 3',
            'content_id': 'content_0',
            'language_code': 'hi',
            'content_html': '<p>old content html</p>',
            'translation_html': '<p>In Hindi</p>',
            'data_format': 'html',
        }
        with self.assertRaisesRegex(
            Exception, '%s cmd is not allowed.' % incorrect_change_dict['cmd']
        ):
            domain_objects_validator.validate_suggestion_change(
                incorrect_change_dict
            )

    def test_correct_exp_domain_object_do_not_raises_exception(self) -> None:
        correct_change_dict = {
            'cmd': 'add_written_translation',
            'state_name': 'State 3',
            'content_id': 'content_0',
            'language_code': 'hi',
            'content_html': '<p>old content html</p>',
            'translation_html': '<p>In हिन्दी (Hindi)</p>',
            'data_format': 'html',
        }
        domain_objects_validator.validate_suggestion_change(correct_change_dict)

    def test_correct_question_domain_object_do_not_raises_exception(
        self,
    ) -> None:
        content_id_generator: translation_domain.ContentIdGenerator = (
            translation_domain.ContentIdGenerator()
        )
        question_dict: question_domain.QuestionDict = {
            'question_state_data': self._create_valid_question_data(
                'default_state', content_id_generator
            ).to_dict(),
            'language_code': 'en',
            'question_state_data_schema_version': (
                feconf.CURRENT_STATE_SCHEMA_VERSION
            ),
            'linked_skill_ids': ['skill_1'],
            'inapplicable_skill_misconception_ids': ['skillid12345-1'],
            'next_content_id_index': (
                content_id_generator.next_content_id_index
            ),
            'version': 44,
            'id': '',
        }
        correct_change_dict: Mapping[
            str, change_domain.AcceptableChangeDictTypes
        ] = {
            'cmd': 'create_new_fully_specified_question',
            'question_dict': question_dict,
            'skill_id': 'skill_123',
            'skill_difficulty': 0.3,
        }
        domain_objects_validator.validate_suggestion_change(correct_change_dict)


class ValidateNewPlatformParamsValueForBlogAdminTests(
    test_utils.GenericTestBase
):
    """Tests to validate platform parameters dict coming from API."""

    def test_valid_params_values_raises_no_exception(self) -> None:
        new_platform_parameter_values = {
            'max_number_of_tags_assigned_to_blog_post': 20,
        }
        domain_objects_validator.validate_platform_params_values_for_blog_admin(
            new_platform_parameter_values
        )

        new_platform_parameter_values = {
            'promo_bar_enabled': False,
        }
        domain_objects_validator.validate_platform_params_values_for_blog_admin(
            new_platform_parameter_values
        )

    def test_difference_of_incoming_value_and_parameter_data_type_raise_error(
        self,
    ) -> None:
        new_platform_parameter_values = {
            'max_number_of_tags_assigned_to_blog_post': 'str'
        }
        with self.assertRaisesRegex(
            Exception,
            'The value of platform parameter max_number_of_tags_'
            'assigned_to_blog_post is of type \'str\', expected it to be '
            'of type \'number\'',
        ):
            (
                domain_objects_validator.validate_platform_params_values_for_blog_admin(
                    new_platform_parameter_values
                )
            )

    def test_param_name_type_other_than_str_raises_error(self) -> None:
        new_platform_parameter_values = {
            1234: 20,
        }
        with self.assertRaisesRegex(
            Exception,
            'Platform parameter name should be a string, received'
            ': %s' % 1234,
        ):
            (
                # TODO(#13059): Here we use MyPy ignore because after we fully
                # type the codebase we plan to get rid of the tests that
                # intentionally test wrong inputs that we can normally catch
                # by typing.
                domain_objects_validator.validate_platform_params_values_for_blog_admin(
                    new_platform_parameter_values  # type: ignore[arg-type]
                )
            )

    def test_with_invalid_type_raises_error(self) -> None:
        new_platform_parameter_values = {
            'max_number_of_tags_assigned_to_blog_post': [20]
        }
        with self.assertRaisesRegex(
            Exception,
            'The value of max_number_of_tags_assigned_to_blog_post '
            'platform parameter is not of valid type, it should be one of '
            'typing.Union\\[str, int, bool, float].',
        ):
            (
                # TODO(#13059): Here we use MyPy ignore because after we fully
                # type the codebase we plan to get rid of the tests that
                # intentionally test wrong inputs that we can normally catch
                # by typing.
                domain_objects_validator.validate_platform_params_values_for_blog_admin(
                    new_platform_parameter_values  # type: ignore[arg-type]
                )
            )

    def test_value_less_or_equal_0_for_max_no_of_tags_raises_errors(
        self,
    ) -> None:
        new_platform_parameter_values = {
            'max_number_of_tags_assigned_to_blog_post': -2
        }
        with self.assertRaisesRegex(
            Exception,
            'The value of max_number_of_tags_assigned_to_blog_post '
            'should be greater than 0, it is -2.',
        ):
            (
                domain_objects_validator.validate_platform_params_values_for_blog_admin(
                    new_platform_parameter_values
                )
            )


class ValidateNewDefaultValueForPlatformParametersTests(
    test_utils.GenericTestBase
):
    """Tests to validate default value dict coming from API."""

    def test_valid_object_raises_no_exception(self) -> None:
        default_value = {'value': False}
        (
            domain_objects_validator.validate_new_default_value_of_platform_parameter(
                default_value
            )
        )

    def test_invalid_type_raises_exception(self) -> None:
        default_value = {'value': [10]}
        with self.assertRaisesRegex(
            Exception,
            (
                'Expected type to be typing.Union\\[str, int, bool, float] '
                'but received \\[10]'
            ),
        ):
            # TODO(#13059): Here we use MyPy ignore because after we fully
            # type the codebase we plan to get rid of the tests that
            # intentionally test wrong inputs that we can normally catch
            # by typing.
            (
                domain_objects_validator.validate_new_default_value_of_platform_parameter(
                    default_value  # type: ignore[arg-type]
                )
            )


class ValidateChangeDictForBlogPost(test_utils.GenericTestBase):
    """Tests to validate change_dict containing updated values for blog
    post object coming from API."""

    # TODO(#13059): Here we use MyPy ignore because after we fully type the
    # codebase we plan to get rid of the tests that intentionally test wrong
    # inputs that we can normally catch by typing.
    def test_invalid_title_raises_exception(self) -> None:
        blog_post_change: blog_services.BlogPostChangeDict = {
            'title': 123,  # type: ignore[typeddict-item]
            'tags': ['News'],
            'thumbnail_filename': 'name.svg',
            'content': 'hi',
        }
        with self.assertRaisesRegex(
            utils.ValidationError, 'Title should be a string'
        ):
            domain_objects_validator.validate_change_dict_for_blog_post(
                blog_post_change
            )

    def test_invalid_tags_raises_exception(self) -> None:
        blog_post_change: blog_services.BlogPostChangeDict = {
            'title': 'Hello Bloggers',
            'tags': ['News', 'Some Tag'],
            'thumbnail_filename': 'name.svg',
            'content': 'hi',
        }
        with self.assertRaisesRegex(
            Exception, 'Invalid tags provided. Tags not in default tags list.'
        ):
            domain_objects_validator.validate_change_dict_for_blog_post(
                blog_post_change
            )

        # TODO(#13059): Here we use MyPy ignore because after we fully type the
        # codebase we plan to get rid of the tests that intentionally test wrong
        # inputs that we can normally catch by typing.
        blog_post_change = {
            'title': 'Hello',
            'tags': ['News', 123],  # type: ignore[list-item]
            'thumbnail_filename': 'name.svg',
            'content': 'hi',
        }
        with self.assertRaisesRegex(
            Exception,
            'Expected each tag in \'tags\' to be a string,'
            ' received: \'123\'',
        ):
            domain_objects_validator.validate_change_dict_for_blog_post(
                blog_post_change
            )

    def test_omit_optional_fields_raises_no_exception(self) -> None:
        # There should be no exception for missing fields because:
        # 1. When saving blog drafts, only the title and content are required.
        # 2. When unpublising blogs, the `change_dict` is empty.
        blog_post_change_no_tags = {
            'title': 'Hello Bloggers',
            'thumbnail_filename': 'name.svg',
            'content': 'hi',
        }
        # TODO(#13059): Here we use MyPy ignore because after we fully type the
        # codebase we plan to get rid of the tests that intentionally test wrong
        # inputs that we can normally catch by typing.
        domain_objects_validator.validate_change_dict_for_blog_post(
            blog_post_change_no_tags  # type: ignore[arg-type]
        )

        blog_post_change_no_thumbnail = {
            'title': 'Hello Bloggers',
            'tags': ['News', 'Learners'],
            'content': 'hi',
        }
        # TODO(#13059): Here we use MyPy ignore because after we fully type the
        # codebase we plan to get rid of the tests that intentionally test wrong
        # inputs that we can normally catch by typing.
        domain_objects_validator.validate_change_dict_for_blog_post(
            blog_post_change_no_thumbnail  # type: ignore[arg-type]
        )

        blog_post_change_no_content = {
            'title': 'Hello Bloggers',
            'tags': ['News', 'Learners'],
            'thumbnail_filename': 'name.svg',
        }
        # TODO(#13059): Here we use MyPy ignore because after we fully type the
        # codebase we plan to get rid of the tests that intentionally test wrong
        # inputs that we can normally catch by typing.
        domain_objects_validator.validate_change_dict_for_blog_post(
            blog_post_change_no_content  # type: ignore[arg-type]
        )

        blog_post_change_no_title = {
            'tags': ['News', 'Learners'],
            'thumbnail_filename': 'name.svg',
            'content': 'hi',
        }
        # TODO(#13059): Here we use MyPy ignore because after we fully type the
        # codebase we plan to get rid of the tests that intentionally test wrong
        # inputs that we can normally catch by typing.
        domain_objects_validator.validate_change_dict_for_blog_post(
            blog_post_change_no_title  # type: ignore[arg-type]
        )

    def test_valid_dict_raises_no_exception(self) -> None:
        blog_post_change: blog_services.BlogPostChangeDict = {
            'title': 'Hello Bloggers',
            'tags': ['News', 'Learners'],
            'thumbnail_filename': 'name.svg',
            'content': 'hi',
        }
        domain_objects_validator.validate_change_dict_for_blog_post(
            blog_post_change
        )

        blog_post_change = {
            'title': 'Hello Bloggers',
            'tags': ['News', 'Learners'],
            'thumbnail_filename': 'name.svg',
            'content': 'hi',
        }
        domain_objects_validator.validate_change_dict_for_blog_post(
            blog_post_change
        )


class ValidateStateDictInStateYamlHandler(test_utils.GenericTestBase):
    """Tests to validate state_dict of StateYamlHandler."""

    def test_valid_object_raises_no_exception(self) -> None:
        state_dict: state_domain.StateDict = {
            'content': {'content_id': 'content_0', 'html': ''},
            'param_changes': [],
            'interaction': {
                'solution': None,
                'answer_groups': [],
                'default_outcome': {
                    'param_changes': [],
                    'feedback': {'content_id': 'default_outcome_1', 'html': ''},
                    'dest': 'State A',
                    'dest_if_really_stuck': None,
                    'refresher_exploration_id': None,
                    'missing_prerequisite_skill_id': None,
                    'labelled_as_correct': False,
                },
                'customization_args': {
                    'rows': {'value': 1},
                    'placeholder': {
                        'value': {
                            'unicode_str': '',
                            'content_id': 'ca_placeholder_2',
                        }
                    },
                    'catchMisspellings': {'value': False},
                },
                'confirmed_unclassified_answers': [],
                'id': 'TextInput',
                'hints': [],
            },
            'linked_skill_id': None,
            'classifier_model_id': None,
            'card_is_checkpoint': False,
            'solicit_answer_details': False,
            'inapplicable_skill_misconception_ids': [],
        }
        domain_objects_validator.validate_state_dict(state_dict)

    def test_invalid_object_raises_exception(self) -> None:
        invalid_state_dict: Dict[
            str,
            Optional[Union[int, bool, Dict[str, Dict[str, Dict[str, str]]]]],
        ] = {
            'classifier_model_id': None,
            'written_translations': {
                'translations_mapping': {
                    'content': {},
                    'default_outcome': {},
                    'ca_placeholder_0': {},
                }
            },
            'next_content_id_index': 1,
            'card_is_checkpoint': False,
            'solicit_answer_details': False,
        }
        # TODO(#13059): Here we use MyPy ignore because after we fully type the
        # codebase we plan to get rid of the tests that intentionally test wrong
        # inputs that we can normally catch by typing.
        # The error is representing the keyerror.
        with self.assertRaisesRegex(Exception, 'content'):
            domain_objects_validator.validate_state_dict(invalid_state_dict)  # type: ignore[arg-type]


class ValidateQuestionStateDict(test_utils.GenericTestBase):
    """Tests to validate question_state_dict coming from frontend."""

    def test_valid_object_raises_no_exception(self) -> None:
        choices_subtitled_dicts: List[state_domain.SubtitledHtmlDict] = [
            {'html': '<p>1</p>', 'content_id': 'ca_choices_2'},
            {'html': '<p>2</p>', 'content_id': 'ca_choices_3'},
        ]
        question_state_dict: state_domain.StateDict = {
            'content': {'html': '', 'content_id': 'content_0'},
            'classifier_model_id': None,
            'linked_skill_id': None,
            'interaction': {
                'answer_groups': [
                    {
                        'rule_specs': [
                            {'rule_type': 'Equals', 'inputs': {'x': 0}}
                        ],
                        'outcome': {
                            'dest': None,
                            'dest_if_really_stuck': None,
                            'feedback': {
                                'html': '',
                                'content_id': 'feedback_4',
                            },
                            'labelled_as_correct': True,
                            'param_changes': [],
                            'refresher_exploration_id': None,
                            'missing_prerequisite_skill_id': None,
                        },
                        'training_data': [],
                        'tagged_skill_misconception_id': None,
                    },
                    {
                        'rule_specs': [
                            {'rule_type': 'Equals', 'inputs': {'x': 1}}
                        ],
                        'outcome': {
                            'dest': None,
                            'dest_if_really_stuck': None,
                            'feedback': {
                                'html': '',
                                'content_id': 'feedback_5',
                            },
                            'labelled_as_correct': False,
                            'param_changes': [],
                            'refresher_exploration_id': None,
                            'missing_prerequisite_skill_id': None,
                        },
                        'training_data': [],
                        'tagged_skill_misconception_id': 'pBi3XobmC4zq-0',
                    },
                ],
                'confirmed_unclassified_answers': [],
                'customization_args': {
                    'showChoicesInShuffledOrder': {'value': True},
                    'choices': {'value': choices_subtitled_dicts},
                },
                'default_outcome': {
                    'dest': None,
                    'dest_if_really_stuck': None,
                    'feedback': {'html': '', 'content_id': 'default_outcome_1'},
                    'labelled_as_correct': False,
                    'param_changes': [],
                    'refresher_exploration_id': None,
                    'missing_prerequisite_skill_id': None,
                },
                'hints': [],
                'id': 'MultipleChoiceInput',
                'solution': None,
            },
            'param_changes': [],
            'solicit_answer_details': False,
            'card_is_checkpoint': False,
            'inapplicable_skill_misconception_ids': [],
        }
        domain_objects_validator.validate_question_state_dict(
            question_state_dict
        )

    def test_invalid_object_raises_exception(self) -> None:
        invalid_question_state_dict: Dict[
            str,
            Optional[Union[int, bool, Dict[str, Dict[str, Dict[str, str]]]]],
        ] = {
            'classifier_model_id': None,
            'written_questions': {
                'questions_mapping': {
                    'content': {},
                    'default_outcome': {},
                    'ca_placeholder_0': {},
                }
            },
            'next_content_id_index': 1,
            'card_is_checkpoint': False,
            'solicit_answer_details': False,
        }
        # TODO(#13059): Here we use MyPy ignore because after we fully type the
        # codebase we plan to get rid of the tests that intentionally test wrong
        # inputs that we can normally catch by typing.
        # The error is representing the keyerror.
        with self.assertRaisesRegex(Exception, 'content'):
            domain_objects_validator.validate_question_state_dict(
                invalid_question_state_dict  # type: ignore[arg-type]
            )


class ValidateSuggestionImagesTests(test_utils.GenericTestBase):
    """Tests to validate suggestion images coming from frontend."""

    # TODO(#13059): Here we use MyPy ignore because after we fully type the
    # codebase we plan to get rid of the tests that intentionally test wrong
    # inputs that we can normally catch by typing.
    def test_invalid_images_raises_exception(self) -> None:
        files = {'file.svg': None}
        with self.assertRaisesRegex(Exception, 'No image supplied'):
            domain_objects_validator.validate_suggestion_images(files)  # type: ignore[arg-type]

    def test_valid_images_do_not_raises_exception(self) -> None:
        file_names = ['img.png', 'test2_svg.svg']
        files = {}
        for filename in file_names:
            with open(
                os.path.join(feconf.TESTS_DATA_DIR, filename),
                'rb',
                encoding=None,
            ) as f:
                files[filename] = f.read()
        domain_objects_validator.validate_suggestion_images(files)


class ValidateEmailDashboardDataTests(test_utils.GenericTestBase):
    """Tests to validates email dashboard data."""

    def test_invalid_email_raises_exception(self) -> None:
        data: Dict[str, Optional[Union[bool, int]]] = {
            'inactive_in_last_n_days': True,
            'has_not_logged_in_for_n_days': None,
            'created_fewer_than_n_exps': False,
            'created_collection': 6,
            'have_fun': 6,
            'explore': True,
        }
        with self.assertRaisesRegex(Exception, '400 Invalid input for query.'):
            domain_objects_validator.validate_email_dashboard_data(data)

    def test_valid_email_do_not_raise_exception(self) -> None:
        data: Dict[str, Optional[Union[bool, int]]] = {
            'inactive_in_last_n_days': False,
            'has_not_logged_in_for_n_days': False,
            'created_at_least_n_exps': True,
            'created_fewer_than_n_exps': None,
            'edited_at_least_n_exps': True,
            'edited_fewer_than_n_exps': None,
            'created_collection': 7,
        }
        domain_objects_validator.validate_email_dashboard_data(data)


class ValidarteTaskEntriesTests(test_utils.GenericTestBase):
    """Tests to validate task entries"""

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.mock_date = datetime.datetime(2023, 4, 17, 22, 0, 0, 123456)
        self.task_entry_dict = improvements_domain.TaskEntry(
            constants.TASK_ENTITY_TYPE_EXPLORATION,
            'eid',
            1,
            constants.TASK_TYPE_HIGH_BOUNCE_RATE,
            constants.TASK_TARGET_TYPE_STATE,
            feconf.DEFAULT_INIT_STATE_NAME,
            'issue description',
            constants.TASK_STATUS_RESOLVED,
            self.owner_id,
            self.mock_date,
        ).to_dict()

    def _test_missing_field(self, field: str) -> None:
        """Check if `domain_objects_validator.validate_task_entries` raises
        an exception when a field is missing.

        Args:
            field: str. The name of the field that should be removed from the
                task entry dictionary before validation.

        Raises:
            Exception. If the validation does not raise an exception with
                the message "No [field name] provided".
        """
        task_entry_without_field = self.task_entry_dict
        # TODO(#13059): Here we use MyPy ignore because after we fully type the
        # codebase we plan to get rid of the tests that intentionally test wrong
        # inputs that we can normally catch by typing.
        task_entry_without_field.pop(field)  # type: ignore[misc]

        with self.assertRaisesRegex(Exception, 'No %s provided' % field):
            domain_objects_validator.validate_task_entries(
                task_entry_without_field
            )

    def test_missing_entity_version_raises_exception(self) -> None:
        self._test_missing_field('entity_version')

    def test_missing_task_type_raises_exception(self) -> None:
        self._test_missing_field('task_type')

    def test_missing_target_id_raises_exception(self) -> None:
        self._test_missing_field('target_id')

    def test_missing_status_raises_exception(self) -> None:
        self._test_missing_field('status')

    def test_valid_dict_raises_no_exception(self) -> None:
        task_entry_no_entity_version = self.task_entry_dict
        domain_objects_validator.validate_task_entries(
            task_entry_no_entity_version
        )


class ValidateAggregatedStatsTests(test_utils.GenericTestBase):
    """Tests for validate aggregated stats tests.

    The tests here are copied from core.domain.stats_domain_test in
    SessionStateStatsTests class, because validate_aggregated_stats simply
    forwards its argument to SessionStateStats.validate_aggregated_stats_dict,
    which is already tested in SessionStateStatsTests.
    """

    # TODO(#13528): Here we use MyPy ignore because we remove this test after
    # the backend is fully type-annotated. Here ignore[typeddict-item] is used
    # to test that num_starts must be in aggregated stats dict.
    def test_aggregated_stats_validation_when_session_property_is_missing(
        self,
    ) -> None:
        sessions_state_stats: stats_domain.AggregatedStatsDict = {  # type: ignore[typeddict-item]
            'num_actual_starts': 1,
            'num_completions': 1,
            'state_stats_mapping': {
                'Home': {
                    'total_hit_count': 1,
                    'first_hit_count': 1,
                    'total_answers_count': 1,
                    'useful_feedback_count': 1,
                    'num_times_solution_viewed': 1,
                    'num_completions': 1,
                }
            },
        }
        with self.assertRaisesRegex(
            utils.ValidationError, 'num_starts not in aggregated stats dict.'
        ):
            domain_objects_validator.validate_aggregated_stats(
                sessions_state_stats
            )

    # TODO(#13528): Here we use MyPy ignore because we remove this test after
    # the backend is fully type-annotated. Here ignore[typeddict-item] is used
    # to test that num_actual_starts must be an int.
    def test_aggregated_stats_validation_when_session_property_type_is_invalid(
        self,
    ) -> None:
        sessions_state_stats: stats_domain.AggregatedStatsDict = {
            'num_starts': 1,
            'num_actual_starts': 'invalid_type',  # type: ignore[typeddict-item]
            'num_completions': 1,
            'state_stats_mapping': {
                'Home': {
                    'total_hit_count': 1,
                    'first_hit_count': 1,
                    'total_answers_count': 1,
                    'useful_feedback_count': 1,
                    'num_times_solution_viewed': 1,
                    'num_completions': 1,
                }
            },
        }
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected num_actual_starts to be an int, received invalid_type',
        ):
            domain_objects_validator.validate_aggregated_stats(
                sessions_state_stats
            )

    def test_aggregated_stats_validation_when_state_property_type_is_missing(
        self,
    ) -> None:
        sessions_state_stats: stats_domain.AggregatedStatsDict = {
            'num_starts': 1,
            'num_actual_starts': 1,
            'num_completions': 1,
            'state_stats_mapping': {
                'Home': {
                    'total_hit_count': 1,
                    'first_hit_count': 1,
                    'useful_feedback_count': 1,
                    'num_times_solution_viewed': 1,
                    'num_completions': 1,
                }
            },
        }
        with self.assertRaisesRegex(
            utils.ValidationError,
            'total_answers_count not in state stats mapping of Home in '
            'aggregated stats dict.',
        ):
            domain_objects_validator.validate_aggregated_stats(
                sessions_state_stats
            )

    # TODO(#13528): Here we use MyPy ignore because we remove this test after
    # the backend is fully type-annotated. Here ignore[dict-item] is used to
    # test that first_hit_count must be an int.
    def test_aggregated_stats_validation_when_state_property_type_is_invalid(
        self,
    ) -> None:
        sessions_state_stats: stats_domain.AggregatedStatsDict = {
            'num_starts': 1,
            'num_actual_starts': 1,
            'num_completions': 1,
            'state_stats_mapping': {
                'Home': {
                    'total_hit_count': 1,
                    'first_hit_count': 'invalid_count',  # type: ignore[dict-item]
                    'total_answers_count': 1,
                    'useful_feedback_count': 1,
                    'num_times_solution_viewed': 1,
                    'num_completions': 1,
                }
            },
        }
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected first_hit_count to be an int, received invalid_count',
        ):
            domain_objects_validator.validate_aggregated_stats(
                sessions_state_stats
            )

    def test_aggregated_stats_validation_when_fully_valid(self) -> None:
        sessions_state_stats: stats_domain.AggregatedStatsDict = {
            'num_starts': 1,
            'num_actual_starts': 1,
            'num_completions': 1,
            'state_stats_mapping': {
                'Home': {
                    'total_hit_count': 1,
                    'first_hit_count': 1,
                    'total_answers_count': 1,
                    'useful_feedback_count': 1,
                    'num_times_solution_viewed': 1,
                    'num_completions': 1,
                }
            },
        }
        self.assertEqual(
            domain_objects_validator.validate_aggregated_stats(
                sessions_state_stats
            ),
            sessions_state_stats,
        )


class ValidateSkillIdsTests(test_utils.GenericTestBase):
    """Tests to validate skill ids"""

    def test_invalid_skill_ids_raises_exception(self) -> None:
        # The entire skill_ids string is invalid.
        entirely_invalid_skill_ids: str = 'not_valid_skill_id_123'
        with self.assertRaisesRegex(Exception, 'Invalid skill id'):
            domain_objects_validator.validate_skill_ids(
                entirely_invalid_skill_ids
            )

        # Only part of the skill_ids string is invalid.
        partially_invalid_skill_ids: str = 'skillid12345,not_valid_skill_id_123'
        with self.assertRaisesRegex(Exception, 'Invalid skill id'):
            domain_objects_validator.validate_skill_ids(
                partially_invalid_skill_ids
            )

    def test_valid_skill_ids_do_not_raise_exception(self) -> None:
        valid_skill_ids: str = 'skillid12345'
        domain_objects_validator.validate_skill_ids(valid_skill_ids)


class ValidateGeneralFeedbackSessionInfoTests(test_utils.GenericTestBase):
    """Tests for general feedback session_info validation."""

    # Here we use object because session-info diagnostics include heterogeneous
    # nested dict/list payload values from client logs.
    def _as_dict(self, value: object) -> Dict[object, object]:
        """Returns value after asserting it is a dict."""
        if not isinstance(value, dict):
            raise AssertionError('Expected dict.')
        return value

    # Here we use object because session-info diagnostics include heterogeneous
    # nested dict/list payload values from client logs.
    def _as_list_of_dicts(self, value: object) -> List[Dict[object, object]]:
        """Returns value after asserting it is a list of dicts."""
        if not isinstance(value, list):
            raise AssertionError('Expected list.')
        for item in value:
            if not isinstance(item, dict):
                raise AssertionError('Expected dict item.')
        return value

    def setUp(self) -> None:
        super().setUp()
        # Here we use object because session-info diagnostics are heterogeneous
        # JSON-like payloads (nested dict/list values) from client logs.
        self.session_info: Dict[str, object] = {
            'console_logs_json': [
                {
                    'error_message': 'TypeError: Cannot read properties of undefined',
                    'log_level': 'error',
                    'timestamp_msecs': 1767225600000,
                    'stack_trace': (
                        'TypeError: Cannot read properties of undefined\n'
                        ' at FeedbackComponent.submit (feedback.component.ts:45)'
                    ),
                }
            ],
            'failed_requests_json': [
                {
                    'url': '/createhandler/web_feedback',
                    'method': 'POST',
                    'status_code': 500,
                    'timestamp_msecs': 1767225601000,
                    'status_text': 'Internal Server Error',
                    'error_message': 'Request failed with status code 500',
                }
            ],
            'navigation_history_json': [
                {
                    'path': '/learn/math',
                    'timestamp_msecs': 1767225590000,
                },
                {
                    'path': '/explore/exp0',
                    'timestamp_msecs': 1767225600000,
                },
            ],
            'environment_json': {
                'client_time_msecs': 1767225602000,
                'timezone_offset_mins': -330,
                'user_agent': (
                    'Mozilla/5.0 (X11; Linux x86_64) '
                    'AppleWebKit/537.36 Chrome/136.0 Safari/537.36'
                ),
                'viewport': {
                    'width': 1920,
                    'height': 1080,
                },
                'page': {
                    'url': 'http://oppia.org/explore/exp0',
                    'title': 'Fractions Exploration',
                },
                'locale': {
                    'language_code': 'en',
                    'direction': 'ltr',
                },
            },
        }

    def test_is_feedback_submission_from_allowed_feedback_page_hostname(
        self,
    ) -> None:
        for hostname in feconf.ALLOWED_FEEDBACK_PAGE_HOSTS:
            self.assertTrue(
                domain_objects_validator.is_feedback_submission_from_allowed_feedback_page_hostname(
                    hostname
                )
            )
        self.assertTrue(
            domain_objects_validator.is_feedback_submission_from_allowed_feedback_page_hostname(
                'www.oppia.org'
            )
        )
        self.assertTrue(
            domain_objects_validator.is_feedback_submission_from_allowed_feedback_page_hostname(
                'oppiatestserver.org'
            )
        )
        self.assertTrue(
            domain_objects_validator.is_feedback_submission_from_allowed_feedback_page_hostname(
                'subdomain.oppiatestserver.org'
            )
        )
        self.assertFalse(
            domain_objects_validator.is_feedback_submission_from_allowed_feedback_page_hostname(
                'fakeoppia.org'
            )
        )

    def test_validate_general_feedback_page_url(self) -> None:
        with self.assertRaisesRegex(
            Exception, 'Page URL must start with http:// or https://.'
        ):
            domain_objects_validator.validate_general_feedback_page_url(
                'httpps://fakeoppia.org'
            )
        with self.assertRaisesRegex(
            Exception,
            'Hostname of the page URL is not allowed for feedback submission.',
        ):
            domain_objects_validator.validate_general_feedback_page_url(
                'http://fakeoppia.org'
            )
        with self.assertRaisesRegex(
            Exception,
            'Page URL exceeds maximum length of %d characters.'
            % (feconf.MAX_PAGE_URL_LENGTH),
        ):
            domain_objects_validator.validate_general_feedback_page_url(
                'https://www.oppia.org/%s' % ('a' * feconf.MAX_PAGE_URL_LENGTH)
            )
        self.assertEqual(
            domain_objects_validator.validate_general_feedback_page_url(
                '  https://www.oppia.org/learn/math  '
            ),
            'https://www.oppia.org/learn/math',
        )

    def test_localhost_is_allowed_in_non_prod_env(self) -> None:
        with self.swap(feconf, 'ENV_IS_OPPIA_ORG_PRODUCTION_SERVER', False):
            self.assertTrue(
                domain_objects_validator.is_feedback_submission_from_allowed_feedback_page_hostname(
                    'localhost'
                )
            )

    def test_localhost_is_rejected_in_prod_env(self) -> None:
        with self.swap(feconf, 'ENV_IS_OPPIA_ORG_PRODUCTION_SERVER', True):
            self.assertFalse(
                domain_objects_validator.is_feedback_submission_from_allowed_feedback_page_hostname(
                    'localhost'
                )
            )

    def _create_valid_feedback_payload(
        self,
    ) -> general_feedback_domain.GeneralFeedbackNormalizedSubmitPayloadDict:
        """Returns a valid general feedback payload."""
        return {
            'category': 'platform',
            'description': 'Useful feedback.',
            'page_url': 'http://localhost:8181',
            'language_code': 'en',
            'rating': 5,
            'target_type': 'general',
            'target_id': None,
            'screenshot_filename': None,
            'submit_anonymously': True,
            'include_session_info': False,
            'session_info': None,
            'captcha_token': None,
            'screenshot_file': None,
        }

    def _copy_feedback_payload(
        self,
        payload: (
            general_feedback_domain.GeneralFeedbackNormalizedSubmitPayloadDict
        ),
    ) -> general_feedback_domain.GeneralFeedbackNormalizedSubmitPayloadDict:
        """Returns a copy of a general feedback payload."""
        # Here we use cast because copy.deepcopy() does not preserve the exact
        # TypedDict type in Oppia's current type checker.
        return cast(
            general_feedback_domain.GeneralFeedbackNormalizedSubmitPayloadDict,
            copy.deepcopy(payload),
        )

    def _cast_to_screenshot_files(
        self, files: Dict[Union[str, int], Union[str, int]]
    ) -> Dict[str, str]:
        """Returns files cast to the screenshot file dict type."""
        # Here we use cast because these tests intentionally pass invalid
        # screenshot file dicts to exercise runtime validation.
        return cast(Dict[str, str], files)

    def test_validate_general_feedback_submit_payload_coupling(self) -> None:
        payload = self._create_valid_feedback_payload()

        # Valid payload.
        domain_objects_validator.validate_general_feedback_submit_payload_coupling(
            payload
        )

        with self.assertRaisesRegex(
            Exception,
            'Session info must be provided if include_session_info is True.',
        ):
            invalid_payload = self._copy_feedback_payload(payload)
            invalid_payload['include_session_info'] = True
            domain_objects_validator.validate_general_feedback_submit_payload_coupling(
                invalid_payload
            )

        with self.assertRaisesRegex(
            Exception,
            'Session info should not be provided when include_session_info is '
            'False.',
        ):
            invalid_payload = self._copy_feedback_payload(payload)
            invalid_payload['session_info'] = self.session_info
            domain_objects_validator.validate_general_feedback_submit_payload_coupling(
                invalid_payload
            )

        valid_payload = self._copy_feedback_payload(payload)
        valid_payload['include_session_info'] = True
        valid_payload['session_info'] = self.session_info

        domain_objects_validator.validate_general_feedback_submit_payload_coupling(
            valid_payload
        )

        with self.assertRaisesRegex(
            Exception,
            'Description is required.',
        ):
            invalid_payload = self._copy_feedback_payload(payload)
            invalid_payload['description'] = '   '
            domain_objects_validator.validate_general_feedback_submit_payload_coupling(
                invalid_payload
            )

        with self.assertRaisesRegex(
            Exception,
            'Description is required.',
        ):
            invalid_payload = self._copy_feedback_payload(payload)
            # Here we use cast because this test intentionally passes None for
            # the description to exercise runtime validation.
            invalid_payload['description'] = cast(str, None)
            domain_objects_validator.validate_general_feedback_submit_payload_coupling(
                invalid_payload
            )

        with self.assertRaisesRegex(
            Exception,
            'Lesson feedback requires target_type=exploration.',
        ):
            invalid_payload = self._copy_feedback_payload(payload)
            invalid_payload['category'] = 'lesson'
            domain_objects_validator.validate_general_feedback_submit_payload_coupling(
                invalid_payload
            )

        with self.assertRaisesRegex(
            Exception,
            'Lesson feedback requires target_id.',
        ):
            invalid_payload = self._copy_feedback_payload(payload)
            invalid_payload['category'] = 'lesson'
            invalid_payload['target_type'] = 'exploration'
            domain_objects_validator.validate_general_feedback_submit_payload_coupling(
                invalid_payload
            )

        valid_lesson_payload = self._copy_feedback_payload(payload)
        valid_lesson_payload.update(
            {
                'category': 'lesson',
                'target_type': 'exploration',
                'target_id': 'exp_id',
            }
        )

        domain_objects_validator.validate_general_feedback_submit_payload_coupling(
            valid_lesson_payload
        )

        with self.assertRaisesRegex(
            Exception,
            'Platform feedback requires target_type=general.',
        ):
            invalid_payload = self._copy_feedback_payload(payload)
            invalid_payload['target_type'] = 'exploration'
            domain_objects_validator.validate_general_feedback_submit_payload_coupling(
                invalid_payload
            )

        with self.assertRaisesRegex(
            Exception,
            'Platform feedback should not specify target_id.',
        ):
            invalid_payload = self._copy_feedback_payload(payload)
            invalid_payload['target_id'] = 'exp_id'
            domain_objects_validator.validate_general_feedback_submit_payload_coupling(
                invalid_payload
            )

        with self.assertRaisesRegex(
            Exception,
            'Screenshot file requires a screenshot filename.',
        ):
            invalid_payload = self._copy_feedback_payload(payload)
            invalid_payload['screenshot_file'] = {'screenshot.png': 'data'}
            domain_objects_validator.validate_general_feedback_submit_payload_coupling(
                invalid_payload
            )

        with self.assertRaisesRegex(
            Exception,
            'Screenshot filename requires screenshot file data.',
        ):
            invalid_payload = self._copy_feedback_payload(payload)
            invalid_payload['screenshot_filename'] = 'screenshot.png'
            domain_objects_validator.validate_general_feedback_submit_payload_coupling(
                invalid_payload
            )

        with self.assertRaisesRegex(
            Exception,
            'Screenshot filename is invalid.',
        ):
            invalid_payload = self._copy_feedback_payload(payload)
            invalid_payload['screenshot_filename'] = 'invalid.txt'
            invalid_payload['screenshot_file'] = {'invalid.txt': 'data'}
            domain_objects_validator.validate_general_feedback_submit_payload_coupling(
                invalid_payload
            )

        valid_screenshot_payload = self._copy_feedback_payload(payload)
        valid_screenshot_payload.update(
            {
                'screenshot_filename': 'screenshot.png',
                'screenshot_file': {
                    'screenshot.png': 'data',
                },
            }
        )

        domain_objects_validator.validate_general_feedback_submit_payload_coupling(
            valid_screenshot_payload
        )

    def test_validate_general_feedback_screenshot_file(self) -> None:
        self.assertIsNone(
            domain_objects_validator.validate_general_feedback_screenshot_file(
                None
            )
        )
        valid_file = {'screenshot.png': 'data'}
        self.assertEqual(
            domain_objects_validator.validate_general_feedback_screenshot_file(
                valid_file
            ),
            valid_file,
        )

        with self.assertRaisesRegex(
            Exception, 'Only one screenshot file is allowed.'
        ):
            domain_objects_validator.validate_general_feedback_screenshot_file(
                {
                    'first.png': 'data',
                    'second.png': 'data',
                }
            )
        invalid_files = self._cast_to_screenshot_files({1: 'data'})
        with self.assertRaisesRegex(Exception, 'Filename should be a string.'):
            domain_objects_validator.validate_general_feedback_screenshot_file(
                invalid_files
            )

        invalid_files = self._cast_to_screenshot_files({'screenshot.png': 1})
        with self.assertRaisesRegex(
            Exception, 'Screenshot data should be a string.'
        ):
            domain_objects_validator.validate_general_feedback_screenshot_file(
                invalid_files
            )

    def test_validate_general_feedback_session_info_log_entries_happy_path(
        self,
    ) -> None:
        validated_info = domain_objects_validator.validate_general_feedback_session_info_log_entries(
            self.session_info
        )
        environment_json = self._as_dict(validated_info['environment_json'])
        page_json = self._as_dict(environment_json['page'])
        self.assertEqual(
            page_json['url'],
            'http://oppia.org/explore/exp0',
        )

    def test_validate_general_feedback_session_info_rejects_unknown_top_level_keys(
        self,
    ) -> None:
        invalid_session_info = copy.deepcopy(self.session_info)
        invalid_session_info['unknown_key'] = True
        with self.assertRaisesRegex(
            Exception, 'Session info contains unknown keys: unknown_key'
        ):
            domain_objects_validator.validate_general_feedback_session_info_log_entries(
                invalid_session_info
            )

    def test_validate_general_feedback_session_info_rejects_invalid_top_level_types(
        self,
    ) -> None:
        test_cases = [
            (
                'console_logs_json',
                'not_a_list',
                'console_logs_json should be a list.',
            ),
            (
                'failed_requests_json',
                'not_a_list',
                'failed_requests_json should be a list.',
            ),
            (
                'navigation_history_json',
                'not_a_list',
                'navigation_history_json should be a list.',
            ),
            (
                'environment_json',
                'not_a_dict',
                'environment_json should be a dict.',
            ),
        ]
        for key, value, expected_error in test_cases:
            invalid_session_info = copy.deepcopy(self.session_info)
            invalid_session_info[key] = value
            with self.assertRaisesRegex(Exception, expected_error):
                (
                    domain_objects_validator.validate_general_feedback_session_info_log_entries(
                        invalid_session_info
                    )
                )

    def test_validate_general_feedback_session_info_rejects_too_many_entries(
        self,
    ) -> None:
        invalid_session_info = copy.deepcopy(self.session_info)
        invalid_session_info['console_logs_json'] = [{}] * (
            feconf.MAX_SESSION_INFO_LOG_ENTRIES + 1
        )
        with self.assertRaisesRegex(
            Exception, 'Session info log entries exceed maximum allowed limit.'
        ):
            domain_objects_validator.validate_general_feedback_session_info_log_entries(
                invalid_session_info
            )

    def test_validate_general_feedback_session_info_rejects_invalid_console_error_fields(
        self,
    ) -> None:
        invalid_session_info = copy.deepcopy(self.session_info)
        invalid_session_info['console_logs_json'] = ['not_a_dict']
        with self.assertRaisesRegex(
            Exception, 'console_logs_json should be a list of dicts.'
        ):
            domain_objects_validator.validate_general_feedback_session_info_log_entries(
                invalid_session_info
            )

        invalid_session_info = copy.deepcopy(self.session_info)
        console_logs_json = self._as_list_of_dicts(
            invalid_session_info['console_logs_json']
        )
        console_logs_json[0]['error_message'] = 1
        with self.assertRaisesRegex(
            Exception,
            'error_message in console_logs_json should be a string.',
        ):
            domain_objects_validator.validate_general_feedback_session_info_log_entries(
                invalid_session_info
            )

        invalid_session_info = copy.deepcopy(self.session_info)
        console_logs_json = self._as_list_of_dicts(
            invalid_session_info['console_logs_json']
        )
        console_logs_json[0]['error_message'] = 'a' * (
            feconf.MAX_SESSION_INFO_LOG_MESSAGE_LENGTH + 1
        )
        with self.assertRaisesRegex(
            Exception,
            'error_message in console_logs_json exceeds maximum length of %d characters.'
            % feconf.MAX_SESSION_INFO_LOG_MESSAGE_LENGTH,
        ):
            domain_objects_validator.validate_general_feedback_session_info_log_entries(
                invalid_session_info
            )

        invalid_session_info = copy.deepcopy(self.session_info)
        console_logs_json = self._as_list_of_dicts(
            invalid_session_info['console_logs_json']
        )
        console_logs_json[0]['timestamp_msecs'] = 'not_an_int'
        with self.assertRaisesRegex(
            Exception,
            'Session info console_logs_json.timestamp_msecs should be an int.',
        ):
            domain_objects_validator.validate_general_feedback_session_info_log_entries(
                invalid_session_info
            )

        invalid_session_info = copy.deepcopy(self.session_info)
        console_logs_json = self._as_list_of_dicts(
            invalid_session_info['console_logs_json']
        )
        console_logs_json[0]['log_level'] = 'not_a_valid_log_level'
        with self.assertRaisesRegex(
            Exception, 'Invalid log_level in console_logs_json.'
        ):
            domain_objects_validator.validate_general_feedback_session_info_log_entries(
                invalid_session_info
            )

        invalid_session_info = copy.deepcopy(self.session_info)
        console_logs_json = self._as_list_of_dicts(
            invalid_session_info['console_logs_json']
        )
        console_logs_json[0]['stack_trace'] = 1
        with self.assertRaisesRegex(
            Exception, 'stack_trace in console_logs_json should be a string.'
        ):
            domain_objects_validator.validate_general_feedback_session_info_log_entries(
                invalid_session_info
            )

        invalid_session_info = copy.deepcopy(self.session_info)
        console_logs_json = self._as_list_of_dicts(
            invalid_session_info['console_logs_json']
        )
        console_logs_json[0]['stack_trace'] = 'a' * (
            feconf.MAX_SESSION_INFO_STACK_TRACE_LENGTH + 1
        )
        with self.assertRaisesRegex(
            Exception,
            'stack_trace in console_logs_json exceeds maximum length of %d characters.'
            % feconf.MAX_SESSION_INFO_STACK_TRACE_LENGTH,
        ):
            domain_objects_validator.validate_general_feedback_session_info_log_entries(
                invalid_session_info
            )

    def test_validate_general_feedback_session_info_rejects_invalid_failed_request_fields(
        self,
    ) -> None:
        invalid_session_info = copy.deepcopy(self.session_info)
        invalid_session_info['failed_requests_json'] = ['not_a_dict']
        with self.assertRaisesRegex(
            Exception, 'failed_requests_json should be a list of dicts.'
        ):
            domain_objects_validator.validate_general_feedback_session_info_log_entries(
                invalid_session_info
            )

        invalid_session_info = copy.deepcopy(self.session_info)
        failed_requests_json = self._as_list_of_dicts(
            invalid_session_info['failed_requests_json']
        )
        failed_requests_json[0]['url'] = 1
        with self.assertRaisesRegex(
            Exception, 'url in failed_requests_json should be a string.'
        ):
            domain_objects_validator.validate_general_feedback_session_info_log_entries(
                invalid_session_info
            )

        invalid_session_info = copy.deepcopy(self.session_info)
        failed_requests_json = self._as_list_of_dicts(
            invalid_session_info['failed_requests_json']
        )
        failed_requests_json[0]['url'] = 'a' * (feconf.MAX_PAGE_URL_LENGTH + 1)
        with self.assertRaisesRegex(
            Exception,
            'url in failed_requests_json exceeds maximum length of %d characters.'
            % feconf.MAX_PAGE_URL_LENGTH,
        ):
            domain_objects_validator.validate_general_feedback_session_info_log_entries(
                invalid_session_info
            )

        invalid_session_info = copy.deepcopy(self.session_info)
        failed_requests_json = self._as_list_of_dicts(
            invalid_session_info['failed_requests_json']
        )
        failed_requests_json[0]['method'] = 100
        with self.assertRaisesRegex(
            Exception, 'method in failed_requests_json should be a string.'
        ):
            domain_objects_validator.validate_general_feedback_session_info_log_entries(
                invalid_session_info
            )

        invalid_session_info = copy.deepcopy(self.session_info)
        failed_requests_json = self._as_list_of_dicts(
            invalid_session_info['failed_requests_json']
        )
        failed_requests_json[0]['method'] = 'a' * (
            feconf.MAX_SESSION_INFO_METHOD_LENGTH + 1
        )
        with self.assertRaisesRegex(
            Exception,
            'method in failed_requests_json exceeds maximum length of %d characters.'
            % feconf.MAX_SESSION_INFO_METHOD_LENGTH,
        ):
            domain_objects_validator.validate_general_feedback_session_info_log_entries(
                invalid_session_info
            )

        invalid_session_info = copy.deepcopy(self.session_info)
        failed_requests_json = self._as_list_of_dicts(
            invalid_session_info['failed_requests_json']
        )
        failed_requests_json[0]['status_code'] = '500'
        with self.assertRaisesRegex(
            Exception,
            'Session info failed_requests_json.status_code should be an int.',
        ):
            domain_objects_validator.validate_general_feedback_session_info_log_entries(
                invalid_session_info
            )

        invalid_session_info = copy.deepcopy(self.session_info)
        failed_requests_json = self._as_list_of_dicts(
            invalid_session_info['failed_requests_json']
        )
        failed_requests_json[0]['timestamp_msecs'] = 'not_an_int'
        with self.assertRaisesRegex(
            Exception,
            'Session info failed_requests_json.timestamp_msecs should be an int.',
        ):
            domain_objects_validator.validate_general_feedback_session_info_log_entries(
                invalid_session_info
            )

        invalid_session_info = copy.deepcopy(self.session_info)
        failed_requests_json = self._as_list_of_dicts(
            invalid_session_info['failed_requests_json']
        )
        failed_requests_json[0]['status_text'] = 1
        with self.assertRaisesRegex(
            Exception, 'status_text in failed_requests_json should be a string.'
        ):
            domain_objects_validator.validate_general_feedback_session_info_log_entries(
                invalid_session_info
            )

    def test_validate_general_feedback_session_info_rejects_invalid_navigation_and_environment_fields(
        self,
    ) -> None:
        invalid_session_info = copy.deepcopy(self.session_info)
        invalid_session_info['navigation_history_json'] = ['not_a_dict']
        with self.assertRaisesRegex(
            Exception, 'navigation_history_json should be a list of dicts.'
        ):
            domain_objects_validator.validate_general_feedback_session_info_log_entries(
                invalid_session_info
            )

        invalid_session_info = copy.deepcopy(self.session_info)
        failed_requests_json = self._as_list_of_dicts(
            invalid_session_info['failed_requests_json']
        )
        failed_requests_json[0]['status_text'] = 'a' * (
            feconf.MAX_SESSION_INFO_STATUS_TEXT_LENGTH + 1
        )
        with self.assertRaisesRegex(
            Exception,
            'status_text in failed_requests_json exceeds maximum length of %d characters.'
            % feconf.MAX_SESSION_INFO_STATUS_TEXT_LENGTH,
        ):
            domain_objects_validator.validate_general_feedback_session_info_log_entries(
                invalid_session_info
            )

        invalid_session_info = copy.deepcopy(self.session_info)
        failed_requests_json = self._as_list_of_dicts(
            invalid_session_info['failed_requests_json']
        )
        failed_requests_json[0]['error_message'] = 1
        with self.assertRaisesRegex(
            Exception,
            'error_message in failed_requests_json should be a string.',
        ):
            domain_objects_validator.validate_general_feedback_session_info_log_entries(
                invalid_session_info
            )

        invalid_session_info = copy.deepcopy(self.session_info)
        failed_requests_json = self._as_list_of_dicts(
            invalid_session_info['failed_requests_json']
        )
        failed_requests_json[0]['error_message'] = 'a' * (
            feconf.MAX_SESSION_INFO_LOG_MESSAGE_LENGTH + 1
        )
        with self.assertRaisesRegex(
            Exception,
            'error_message in failed_requests_json exceeds maximum length of %d characters.'
            % feconf.MAX_SESSION_INFO_LOG_MESSAGE_LENGTH,
        ):
            domain_objects_validator.validate_general_feedback_session_info_log_entries(
                invalid_session_info
            )

    def test_validate_general_feedback_session_info_rejects_invalid_navigation_fields(
        self,
    ) -> None:
        invalid_session_info = copy.deepcopy(self.session_info)
        invalid_session_info['navigation_history_json'] = ['not_a_dict']
        with self.assertRaisesRegex(
            Exception, 'navigation_history_json should be a list of dicts.'
        ):
            domain_objects_validator.validate_general_feedback_session_info_log_entries(
                invalid_session_info
            )

        invalid_session_info = copy.deepcopy(self.session_info)
        navigation_history_json = self._as_list_of_dicts(
            invalid_session_info['navigation_history_json']
        )
        navigation_history_json[0]['path'] = 1
        with self.assertRaisesRegex(
            Exception, 'path in navigation_history_json should be a string.'
        ):
            domain_objects_validator.validate_general_feedback_session_info_log_entries(
                invalid_session_info
            )

        invalid_session_info = copy.deepcopy(self.session_info)
        navigation_history_json = self._as_list_of_dicts(
            invalid_session_info['navigation_history_json']
        )
        navigation_history_json[0]['path'] = 'a' * (
            feconf.MAX_PAGE_URL_LENGTH + 1
        )
        with self.assertRaisesRegex(
            Exception,
            'path in navigation_history_json exceeds maximum length of %d characters.'
            % feconf.MAX_PAGE_URL_LENGTH,
        ):
            domain_objects_validator.validate_general_feedback_session_info_log_entries(
                invalid_session_info
            )

        invalid_session_info = copy.deepcopy(self.session_info)
        navigation_history_json = self._as_list_of_dicts(
            invalid_session_info['navigation_history_json']
        )
        navigation_history_json[0]['timestamp_msecs'] = 'not_an_int'
        with self.assertRaisesRegex(
            Exception,
            'Session info navigation_history_json.timestamp_msecs should be an int.',
        ):
            domain_objects_validator.validate_general_feedback_session_info_log_entries(
                invalid_session_info
            )

    def test_validate_general_feedback_session_info_rejects_invalid_environment_fields(
        self,
    ) -> None:
        invalid_session_info = copy.deepcopy(self.session_info)
        environment_json = self._as_dict(
            invalid_session_info['environment_json']
        )
        environment_json['page'] = 'not_a_dict'
        with self.assertRaisesRegex(
            Exception, 'page in environment_json should be a dict.'
        ):
            domain_objects_validator.validate_general_feedback_session_info_log_entries(
                invalid_session_info
            )

        invalid_session_info = copy.deepcopy(self.session_info)
        environment_json = self._as_dict(
            invalid_session_info['environment_json']
        )
        page_json = self._as_dict(environment_json['page'])
        page_json['url'] = 1
        with self.assertRaisesRegex(
            Exception, 'Session info page.url should be a string.'
        ):
            domain_objects_validator.validate_general_feedback_session_info_log_entries(
                invalid_session_info
            )

        invalid_session_info = copy.deepcopy(self.session_info)
        environment_json = self._as_dict(
            invalid_session_info['environment_json']
        )
        page_json = self._as_dict(environment_json['page'])
        page_json['title'] = 1
        with self.assertRaisesRegex(
            Exception, 'Session info page.title should be a string.'
        ):
            domain_objects_validator.validate_general_feedback_session_info_log_entries(
                invalid_session_info
            )

        invalid_session_info = copy.deepcopy(self.session_info)
        environment_json = self._as_dict(
            invalid_session_info['environment_json']
        )
        page_json = self._as_dict(environment_json['page'])
        page_json['title'] = 'a' * (
            feconf.MAX_SESSION_INFO_PAGE_FIELD_LENGTH + 1
        )
        with self.assertRaisesRegex(
            Exception, 'Session info page.title is too long.'
        ):
            domain_objects_validator.validate_general_feedback_session_info_log_entries(
                invalid_session_info
            )

        invalid_session_info = copy.deepcopy(self.session_info)
        environment_json = self._as_dict(
            invalid_session_info['environment_json']
        )
        environment_json['viewport'] = 'not_a_dict'
        with self.assertRaisesRegex(
            Exception, 'Session info viewport should be a dict.'
        ):
            domain_objects_validator.validate_general_feedback_session_info_log_entries(
                invalid_session_info
            )

        invalid_session_info = copy.deepcopy(self.session_info)
        environment_json = self._as_dict(
            invalid_session_info['environment_json']
        )
        viewport_json = self._as_dict(environment_json['viewport'])
        viewport_json['width'] = 'not_an_int'
        with self.assertRaisesRegex(
            Exception, 'Session info viewport.width should be an int.'
        ):
            domain_objects_validator.validate_general_feedback_session_info_log_entries(
                invalid_session_info
            )

        invalid_session_info = copy.deepcopy(self.session_info)
        environment_json = self._as_dict(
            invalid_session_info['environment_json']
        )
        environment_json['locale'] = 'not_a_dict'
        with self.assertRaisesRegex(
            Exception, 'Session info locale should be a dict.'
        ):
            domain_objects_validator.validate_general_feedback_session_info_log_entries(
                invalid_session_info
            )

        invalid_session_info = copy.deepcopy(self.session_info)
        environment_json = self._as_dict(
            invalid_session_info['environment_json']
        )
        locale_json = self._as_dict(environment_json['locale'])
        locale_json['language_code'] = 1
        with self.assertRaisesRegex(
            Exception, 'Session info locale.language_code should be a string.'
        ):
            domain_objects_validator.validate_general_feedback_session_info_log_entries(
                invalid_session_info
            )

        invalid_session_info = copy.deepcopy(self.session_info)
        environment_json = self._as_dict(
            invalid_session_info['environment_json']
        )
        locale_json = self._as_dict(environment_json['locale'])
        locale_json['language_code'] = 'invalid_code'
        with self.assertRaisesRegex(
            Exception, 'Session info locale.language_code is invalid.'
        ):
            domain_objects_validator.validate_general_feedback_session_info_log_entries(
                invalid_session_info
            )

        invalid_session_info = copy.deepcopy(self.session_info)
        environment_json = self._as_dict(
            invalid_session_info['environment_json']
        )
        locale_json = self._as_dict(environment_json['locale'])
        locale_json['direction'] = 'invalid'
        with self.assertRaisesRegex(
            Exception,
            'Session info locale.direction should be "ltr" or "rtl".',
        ):
            domain_objects_validator.validate_general_feedback_session_info_log_entries(
                invalid_session_info
            )

    def test_validate_general_feedback_session_info_rejects_invalid_user_agent_and_timestamps(
        self,
    ) -> None:
        invalid_session_info = copy.deepcopy(self.session_info)
        environment_json = self._as_dict(
            invalid_session_info['environment_json']
        )
        environment_json['user_agent'] = 100
        with self.assertRaisesRegex(
            Exception, 'user_agent in environment_json should be a string.'
        ):
            domain_objects_validator.validate_general_feedback_session_info_log_entries(
                invalid_session_info
            )

        invalid_session_info = copy.deepcopy(self.session_info)
        environment_json = self._as_dict(
            invalid_session_info['environment_json']
        )
        environment_json['client_time_msecs'] = 'not_an_int'
        with self.assertRaisesRegex(
            Exception, 'Session info client_time_msecs should be an int.'
        ):
            domain_objects_validator.validate_general_feedback_session_info_log_entries(
                invalid_session_info
            )

        invalid_session_info = copy.deepcopy(self.session_info)
        environment_json = self._as_dict(
            invalid_session_info['environment_json']
        )
        environment_json['user_agent'] = 'a' * (
            feconf.MAX_SESSION_INFO_USER_AGENT_LENGTH + 1
        )
        with self.assertRaisesRegex(
            Exception,
            'user_agent in environment_json exceeds maximum length of %d characters.'
            % feconf.MAX_SESSION_INFO_USER_AGENT_LENGTH,
        ):
            domain_objects_validator.validate_general_feedback_session_info_log_entries(
                invalid_session_info
            )

        invalid_session_info = copy.deepcopy(self.session_info)
        environment_json = self._as_dict(
            invalid_session_info['environment_json']
        )
        environment_json['timezone_offset_mins'] = 'not_an_int'
        with self.assertRaisesRegex(
            Exception, 'Session info timezone_offset_mins should be an int.'
        ):
            domain_objects_validator.validate_general_feedback_session_info_log_entries(
                invalid_session_info
            )
