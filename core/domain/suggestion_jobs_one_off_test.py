# coding: utf-8
#
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


""" Tests for Suggestion-related one-off jobs"""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import datetime
import os

from constants import constants
from core.domain import exp_domain
from core.domain import exp_fetchers
from core.domain import exp_services
from core.domain import fs_domain
from core.domain import question_domain
from core.domain import suggestion_jobs_one_off
from core.domain import suggestion_services
from core.domain import user_services
from core.platform import models
from core.tests import test_utils
import feconf
import python_utils
import utils

(suggestion_models, feedback_models, user_models,) = (
    models.Registry.import_models([
        models.NAMES.suggestion, models.NAMES.feedback, models.NAMES.user]))


class QuestionSuggestionMigrationJobManagerTests(test_utils.GenericTestBase):

    ALBERT_EMAIL = 'albert@example.com'
    ALBERT_NAME = 'albert'

    QUESTION_ID = 'question_id'

    def setUp(self):
        super(QuestionSuggestionMigrationJobManagerTests, self).setUp()

        self.signup(self.ALBERT_EMAIL, self.ALBERT_NAME)
        self.albert_id = self.get_user_id_from_email(self.ALBERT_EMAIL)
        self.process_and_flush_pending_mapreduce_tasks()
        self.skill_id = 'skill_id'
        self.save_new_skill(
            self.skill_id, self.albert_id, description='Skill Description')

    def _run_job_and_verify_output(self, expected_output):
        """Runs the QuestionSuggestionMigrationJobManager and
        verifies that the output matches the expected output.

        Args:
            expected_output: list(str). The expected output from the one off
                job.
        """
        job_id = (
            suggestion_jobs_one_off
            .QuestionSuggestionMigrationJobManager.create_new())
        (
            suggestion_jobs_one_off
            .QuestionSuggestionMigrationJobManager.enqueue(job_id)
        )
        self.process_and_flush_pending_mapreduce_tasks()

        actual_output = (
            suggestion_jobs_one_off
            .QuestionSuggestionMigrationJobManager.get_output(job_id))

        self.assertItemsEqual(actual_output, expected_output)

    def test_migration_job_does_not_convert_up_to_date_suggestion(self):
        suggestion_change = {
            'cmd': (
                question_domain
                .CMD_CREATE_NEW_FULLY_SPECIFIED_QUESTION),
            'question_dict': {
                'question_state_data': self._create_valid_question_data(
                    'default_state').to_dict(),
                'language_code': 'en',
                'question_state_data_schema_version': (
                    feconf.CURRENT_STATE_SCHEMA_VERSION),
                'linked_skill_ids': [self.skill_id],
                'inapplicable_skill_misconception_ids': []
            },
            'skill_id': self.skill_id,
            'skill_difficulty': 0.3
        }

        suggestion = suggestion_services.create_suggestion(
            feconf.SUGGESTION_TYPE_ADD_QUESTION,
            feconf.ENTITY_TYPE_SKILL, self.skill_id, 1,
            self.albert_id, suggestion_change, 'test description')

        self.assertEqual(
            suggestion.change.question_dict[
                'question_state_data_schema_version'],
            feconf.CURRENT_STATE_SCHEMA_VERSION)

        expected_output = [u'[u\'SUCCESS\', 1]']
        self._run_job_and_verify_output(expected_output)

        updated_suggestion = suggestion_services.get_suggestion_by_id(
            suggestion.suggestion_id)
        self.assertEqual(
            updated_suggestion.change.question_dict[
                'question_state_data_schema_version'],
            feconf.CURRENT_STATE_SCHEMA_VERSION)

    def test_migration_job_after_deleting_question_suggestion(self):
        suggestion_id = (
            self.save_new_question_suggestion_with_state_data_schema_v27(
                self.albert_id, self.skill_id))
        suggestion_models.GeneralSuggestionModel.delete_by_id(suggestion_id)

        suggestion = suggestion_services.get_suggestion_by_id(suggestion_id)
        self.assertEqual(suggestion, None)

        expected_output = []
        self._run_job_and_verify_output(expected_output)

    def test_migration_job_converts_old_question_suggestion(self):
        suggestion_id = (
            self.save_new_question_suggestion_with_state_data_schema_v27(
                self.albert_id, self.skill_id))
        old_suggestion_model = (
            suggestion_models.GeneralSuggestionModel.get_by_id(suggestion_id))
        self.assertEqual(
            old_suggestion_model.change_cmd['question_dict'][
                'question_state_data_schema_version'], 27)

        expected_output = [u'[u\'SUCCESS\', 1]']
        self._run_job_and_verify_output(expected_output)

        updated_suggestion_model = (
            suggestion_models.GeneralSuggestionModel.get_by_id(suggestion_id))
        self.assertEqual(
            updated_suggestion_model.change_cmd['question_dict'][
                'question_state_data_schema_version'],
            feconf.CURRENT_STATE_SCHEMA_VERSION)

    def test_migration_job_output_with_invalid_question_suggestion(self):
        suggestion_id = (
            self.save_new_question_suggestion_with_state_data_schema_v27(
                self.albert_id, self.skill_id, suggestion_id='suggestion456'))

        suggestion_model = (
            suggestion_models.GeneralSuggestionModel.get_by_id(suggestion_id))

        # Adding some invalid values in suggestion.
        suggestion_model.language_code = None
        suggestion_model.update_timestamps(update_last_updated_time=False)
        suggestion_model.put()

        expected_output = [
            u'[u\'POST_MIGRATION_VALIDATION_FALIURE\', '
            '[u"(\'suggestion456\', '
            'ValidationError(u\'Expected language_code '
            'to be en, received None\',))"]]'
        ]
        self._run_job_and_verify_output(expected_output)

    def test_migration_job_yields_no_output_for_non_question_suggestion(self):
        exp_id = 'expId1'
        exploration = (
            self.save_new_linear_exp_with_state_names_and_interactions(
                exp_id, self.albert_id, ['State 1', 'State 2'],
                ['TextInput'], category='Algebra'))

        add_translation_change_dict = {
            'cmd': exp_domain.CMD_ADD_TRANSLATION,
            'state_name': 'State 1',
            'content_id': 'content',
            'language_code': 'hi',
            'content_html': exploration.states['State 1'].content.html,
            'translation_html': '<p>This is translated html.</p>'
        }

        suggestion_services.create_suggestion(
            feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            feconf.ENTITY_TYPE_EXPLORATION,
            exp_id, 1, self.albert_id, add_translation_change_dict,
            'test description')

        expected_output = []
        self._run_job_and_verify_output(expected_output)

    def test_migration_job_yields_exception_message(self):
        def mock_raise_expection_method(item):
            raise Exception(item.id)

        suggestion_id = 'suggestion456'
        self.save_new_question_suggestion_with_state_data_schema_v27(
            self.albert_id, self.skill_id, suggestion_id=suggestion_id)

        with self.swap(
            suggestion_services, 'get_suggestion_from_model',
            mock_raise_expection_method):
            expected_output = [
                u'[u\'MIGRATION_FAILURE\', [u"(\'suggestion456\', '
                'Exception(\'suggestion456\',))"]]']
            self._run_job_and_verify_output(expected_output)


class SuggestionMathRteAuditOneOffJobTests(test_utils.GenericTestBase):

    target_id = 'exp1'
    target_version_at_submission = 1
    AUTHOR_EMAIL = 'author@example.com'
    REVIEWER_EMAIL = 'reviewer@example.com'
    EXPLORATION_THREAD_ID = 'exploration.exp1.thread_1'
    SKILL_THREAD_ID = 'skill1.thread1'
    fake_date = datetime.datetime(2016, 4, 10, 0, 0, 0, 0)

    def setUp(self):
        super(SuggestionMathRteAuditOneOffJobTests, self).setUp()
        self.signup(self.AUTHOR_EMAIL, 'author')
        self.author_id = self.get_user_id_from_email(self.AUTHOR_EMAIL)
        self.signup(self.REVIEWER_EMAIL, 'reviewer')
        self.reviewer_id = self.get_user_id_from_email(self.REVIEWER_EMAIL)
        self.process_and_flush_pending_mapreduce_tasks()

    def mock_generate_new_exploration_thread_id(
            self, unused_entity_type, unused_entity_id):
        return self.EXPLORATION_THREAD_ID

    def mock_generate_new_skill_thread_id(
            self, unused_entity_type, unused_entity_id):
        return self.SKILL_THREAD_ID

    def test_for_html_in_suggestions_with_math_rte(self):
        """Checks that correct number of hints are tabulated when
        there is single exploration.
        """
        html_content = (
            '<p>Value</p><oppia-noninteractive-math math_content-with-value='
            '"{&amp;quot;raw_latex&amp;quot;: &amp;quot;+,-,-,+&amp;quot;, &'
            'amp;quot;svg_filename&amp;quot;: &amp;quot;&amp;quot;}"></oppia'
            '-noninteractive-math>')

        state_dict = {
            'classifier_model_id': None,
            'content': {
                'content_id': 'content',
                'html': html_content
            },
            'interaction': {
                'answer_groups': [],
                'confirmed_unclassified_answers': [],
                'customization_args': {},
                'default_outcome': {
                    'dest': 'Introduction',
                    'feedback': {
                        'content_id': 'default_outcome',
                        'html': html_content
                    },
                    'labelled_as_correct': False,
                    'param_changes': [],
                    'refresher_exploration_id': None,
                    'missing_prerequisite_skill_id': None
                },
                'hints': [],
                'id': None,
                'solution': None,
            },
            'next_content_id_index': 0,
            'param_changes': [],
            'recorded_voiceovers': {
                'voiceovers_mapping': {
                    'content': {},
                    'default_outcome': {}
                }
            },
            'solicit_answer_details': False,
            'written_translations': {
                'translations_mapping': {
                    'content': {},
                    'default_outcome': {}
                }
            }
        }
        states = {
            'Introduction': state_dict
        }
        exploration = (
            exp_domain.Exploration(
                'exp1', feconf.DEFAULT_EXPLORATION_TITLE,
                feconf.DEFAULT_EXPLORATION_CATEGORY,
                feconf.DEFAULT_EXPLORATION_OBJECTIVE,
                constants.DEFAULT_LANGUAGE_CODE, [], '', '',
                feconf.CURRENT_STATE_SCHEMA_VERSION,
                feconf.DEFAULT_INIT_STATE_NAME, states, {}, [], 0, False,
                False))
        exp_services.save_new_exploration(self.author_id, exploration)
        add_translation_change_dict = {
            'cmd': 'add_translation',
            'state_name': 'Introduction',
            'content_id': 'content',
            'language_code': 'hi',
            'content_html': html_content,
            'translation_html': html_content
        }
        with self.swap(
            feedback_models.GeneralFeedbackThreadModel,
            'generate_new_thread_id',
            self.mock_generate_new_exploration_thread_id):
            suggestion_services.create_suggestion(
                feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
                feconf.ENTITY_TYPE_EXPLORATION,
                self.target_id, self.target_version_at_submission,
                self.author_id, add_translation_change_dict, 'test description')
        answer_group = {
            'outcome': {
                'dest': None,
                'feedback': {
                    'content_id': 'feedback_1',
                    'html': html_content
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
        question_state_dict_with_math = {
            'content': {
                'content_id': 'content_1',
                'html': 'Question 1'
            },
            'recorded_voiceovers': {
                'voiceovers_mapping': {
                    'ca_choices_0': {},
                    'content_1': {},
                    'feedback_1': {},
                    'feedback_2': {},
                    'hint_1': {},
                    'solution': {}
                }
            },
            'written_translations': {
                'translations_mapping': {
                    'ca_choices_0': {},
                    'content_1': {},
                    'feedback_1': {},
                    'feedback_2': {},
                    'hint_1': {},
                    'solution': {
                        'en': {
                            'data_format': 'html',
                            'translation': html_content,
                            'needs_update': True
                        }
                    }
                }
            },
            'interaction': {
                'answer_groups': [answer_group],
                'confirmed_unclassified_answers': [],
                'customization_args': {
                    'choices': {
                        'value': [{
                            'content_id': 'ca_choices_0',
                            'html': html_content
                        }]
                    },
                    'showChoicesInShuffledOrder': {
                        'value': True
                    }
                },
                'default_outcome': {
                    'dest': None,
                    'feedback': {
                        'content_id': 'feedback_2',
                        'html': html_content
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
            'next_content_id_index': 3,
            'param_changes': [],
            'solicit_answer_details': False,
            'classifier_model_id': None
        }
        suggestion_dict_with_math = {
            'suggestion_id': 'skill2.thread1',
            'suggestion_type': feconf.SUGGESTION_TYPE_ADD_QUESTION,
            'target_type': feconf.ENTITY_TYPE_SKILL,
            'target_id': 'skill2',
            'target_version_at_submission': 1,
            'status': suggestion_models.STATUS_ACCEPTED,
            'author_name': 'author',
            'final_reviewer_id': self.reviewer_id,
            'change': {
                'cmd': question_domain.CMD_CREATE_NEW_FULLY_SPECIFIED_QUESTION,
                'question_dict': {
                    'question_state_data': question_state_dict_with_math,
                    'language_code': 'en',
                    'question_state_data_schema_version': (
                        feconf.CURRENT_STATE_SCHEMA_VERSION),
                    'linked_skill_ids': ['skill_2'],
                    'inapplicable_skill_misconception_ids': ['skillid12345-1']
                },
                'skill_id': 'skill_2',
                'skill_difficulty': 0.3,
            },
            'score_category': 'question.skill1',
            'last_updated': utils.get_time_in_millisecs(self.fake_date)
        }
        with self.swap(
            feedback_models.GeneralFeedbackThreadModel,
            'generate_new_thread_id', self.mock_generate_new_skill_thread_id):
            suggestion_services.create_suggestion(
                feconf.SUGGESTION_TYPE_ADD_QUESTION,
                feconf.ENTITY_TYPE_SKILL,
                'skill1', feconf.CURRENT_STATE_SCHEMA_VERSION,
                self.author_id, suggestion_dict_with_math['change'],
                'test description')

        job_id = (
            suggestion_jobs_one_off.
            SuggestionMathRteAuditOneOffJob.create_new())
        suggestion_jobs_one_off.SuggestionMathRteAuditOneOffJob.enqueue(job_id)
        self.process_and_flush_pending_mapreduce_tasks()

        actual_output = (
            suggestion_jobs_one_off.
            SuggestionMathRteAuditOneOffJob.get_output(job_id))
        self.assertRegexpMatches(
            python_utils.UNICODE(actual_output),
            '2 suggestions have Math components in them')

    def test_for_html_in_suggestion_edit_content_with_math_rte(self):
        """Checks that correct number of hints are tabulated when
        there is single exploration.
        """
        html_content = (
            '<p>Value</p><oppia-noninteractive-math raw_latex-with-value="&a'
            'mp;quot;+,-,-,+&amp;quot;"></oppia-noninteractive-math>')

        state_dict = {
            'classifier_model_id': None,
            'content': {
                'content_id': 'content',
                'html': html_content
            },
            'interaction': {
                'answer_groups': [],
                'confirmed_unclassified_answers': [],
                'customization_args': {},
                'default_outcome': {
                    'dest': 'Introduction',
                    'feedback': {
                        'content_id': 'default_outcome',
                        'html': html_content
                    },
                    'labelled_as_correct': False,
                    'param_changes': [],
                    'refresher_exploration_id': None,
                    'missing_prerequisite_skill_id': None
                },
                'hints': [],
                'id': None,
                'solution': None,
            },
            'next_content_id_index': 0,
            'param_changes': [],
            'recorded_voiceovers': {
                'voiceovers_mapping': {
                    'content': {},
                    'default_outcome': {}
                }
            },
            'solicit_answer_details': False,
            'written_translations': {
                'translations_mapping': {
                    'content': {},
                    'default_outcome': {}
                }
            }
        }
        states = {
            'Introduction': state_dict
        }
        exploration = (
            exp_domain.Exploration(
                'exp1', feconf.DEFAULT_EXPLORATION_TITLE,
                feconf.DEFAULT_EXPLORATION_CATEGORY,
                feconf.DEFAULT_EXPLORATION_OBJECTIVE,
                constants.DEFAULT_LANGUAGE_CODE, [], '', '',
                feconf.CURRENT_STATE_SCHEMA_VERSION,
                feconf.DEFAULT_INIT_STATE_NAME, states, {}, [], 0, False,
                False))
        exp_services.save_new_exploration(self.author_id, exploration)
        change_dict = {
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'property_name': exp_domain.STATE_PROPERTY_CONTENT,
            'state_name': 'Introduction',
            'new_value': {
                'content_id': 'content',
                'html': 'suggestion content'
            },
            'old_value': {
                'content_id': 'content',
                'html': html_content
            }
        }
        with self.swap(
            feedback_models.GeneralFeedbackThreadModel,
            'generate_new_thread_id',
            self.mock_generate_new_exploration_thread_id):
            suggestion_services.create_suggestion(
                feconf.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
                feconf.ENTITY_TYPE_EXPLORATION,
                self.target_id, self.target_version_at_submission,
                self.author_id, change_dict, 'test description')

        job_id = (
            suggestion_jobs_one_off.
            SuggestionMathRteAuditOneOffJob.create_new())
        suggestion_jobs_one_off.SuggestionMathRteAuditOneOffJob.enqueue(job_id)
        self.process_and_flush_pending_mapreduce_tasks()

        actual_output = (
            suggestion_jobs_one_off.
            SuggestionMathRteAuditOneOffJob.get_output(job_id))
        self.assertRegexpMatches(
            python_utils.UNICODE(actual_output),
            '1 suggestions have Math components in them')

    def test_for_html_in_suggestion_with_no_math_rte(self):
        html_content = '<p>This has no Math components</p>'
        answer_group = {
            'outcome': {
                'dest': None,
                'feedback': {
                    'content_id': 'feedback_1',
                    'html': html_content
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

        question_state_dict_without_math = {
            'content': {
                'content_id': 'content_1',
                'html': 'Question 1'
            },
            'recorded_voiceovers': {
                'voiceovers_mapping': {
                    'ca_choices_0': {},
                    'content_1': {},
                    'feedback_1': {},
                    'feedback_2': {},
                    'hint_1': {},
                    'solution': {}
                }
            },
            'written_translations': {
                'translations_mapping': {
                    'ca_choices_0': {},
                    'content_1': {},
                    'feedback_1': {},
                    'feedback_2': {},
                    'hint_1': {},
                    'solution': {
                        'en': {
                            'data_format': 'html',
                            'translation': html_content,
                            'needs_update': True
                        }
                    }
                }
            },
            'interaction': {
                'answer_groups': [answer_group],
                'confirmed_unclassified_answers': [],
                'customization_args': {
                    'choices': {
                        'value': [{
                            'content_id': 'ca_choices_0',
                            'html': html_content
                        }]
                    },
                    'showChoicesInShuffledOrder': {
                        'value': True
                    }
                },
                'default_outcome': {
                    'dest': None,
                    'feedback': {
                        'content_id': 'feedback_2',
                        'html': html_content
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
            'next_content_id_index': 3,
            'param_changes': [],
            'solicit_answer_details': False,
            'classifier_model_id': None
        }
        suggestion_dict_without_math = {
            'suggestion_id': 'skill2.thread1',
            'suggestion_type': feconf.SUGGESTION_TYPE_ADD_QUESTION,
            'target_type': feconf.ENTITY_TYPE_SKILL,
            'target_id': 'skill2',
            'target_version_at_submission': 1,
            'status': suggestion_models.STATUS_ACCEPTED,
            'author_name': 'author',
            'final_reviewer_id': self.reviewer_id,
            'change': {
                'cmd': question_domain.CMD_CREATE_NEW_FULLY_SPECIFIED_QUESTION,
                'question_dict': {
                    'question_state_data': question_state_dict_without_math,
                    'language_code': 'en',
                    'question_state_data_schema_version': (
                        feconf.CURRENT_STATE_SCHEMA_VERSION),
                    'linked_skill_ids': ['skill_2'],
                    'inapplicable_skill_misconception_ids': ['skillid12345-1']
                },
                'skill_id': 'skill_2',
                'skill_difficulty': 0.3,
            },
            'score_category': 'question.skill1',
            'last_updated': utils.get_time_in_millisecs(self.fake_date)
        }
        with self.swap(
            feedback_models.GeneralFeedbackThreadModel,
            'generate_new_thread_id', self.mock_generate_new_skill_thread_id):
            suggestion_services.create_suggestion(
                feconf.SUGGESTION_TYPE_ADD_QUESTION,
                feconf.ENTITY_TYPE_SKILL,
                'skill1', feconf.CURRENT_STATE_SCHEMA_VERSION,
                self.author_id, suggestion_dict_without_math['change'],
                'test description')

        job_id = (
            suggestion_jobs_one_off.
            SuggestionMathRteAuditOneOffJob.create_new())
        suggestion_jobs_one_off.SuggestionMathRteAuditOneOffJob.enqueue(job_id)
        self.process_and_flush_pending_mapreduce_tasks()

        actual_output = (
            suggestion_jobs_one_off.
            SuggestionMathRteAuditOneOffJob.get_output(job_id))
        self.assertEqual(len(actual_output), 0)


class SuggestionSvgFilenameValidationOneOffJobTests(test_utils.GenericTestBase):
    target_id_1 = 'exp1'
    target_version_at_submission = 1
    AUTHOR_EMAIL_1 = 'author1@example.com'
    REVIEWER_EMAIL_1 = 'reviewer1@example.com'

    class MockExploration(python_utils.OBJECT):
        """Mocks an exploration. To be used only for testing."""

        def __init__(self, exploration_id, states):
            self.id = exploration_id
            self.states = states
            self.category = 'Algebra'

        def get_content_html(self, state_name, content_id):
            """Used to mock the get_content_html method for explorations."""
            # state_name and content_id are used here to suppress the unused
            # arguments warning. The main goal of this method is to just
            # produce content html for the tests.
            return '<p>State name: %s, Content id: %s</p>' % (
                state_name, content_id
            )

    # All mock explorations created for testing.
    explorations = [
        MockExploration('exp1', {'state_1': {}, 'state_2': {}}),
        MockExploration('exp2', {'state_1': {}, 'state_2': {}}),
        MockExploration('exp3', {'state_1': {}, 'state_2': {}}),
    ]

    def mock_generate_new_skill_thread_id(
            self, unused_entity_type, unused_entity_id):
        return 'skill1.thread1'

    def mock_get_exploration_by_id(self, exp_id):
        for exp in self.explorations:
            if exp.id == exp_id:
                return exp

    def setUp(self):
        super(SuggestionSvgFilenameValidationOneOffJobTests, self).setUp()

        self.signup(self.AUTHOR_EMAIL_1, 'author1')
        self.author_id_1 = self.get_user_id_from_email(self.AUTHOR_EMAIL_1)
        self.signup(self.REVIEWER_EMAIL_1, 'reviewer1')
        self.reviewer_id_1 = self.get_user_id_from_email(self.REVIEWER_EMAIL_1)
        self.process_and_flush_pending_mapreduce_tasks()

    def test_job_when_suggestions_have_invalid_filenames(self):
        invalid_html_content1 = (
            '<oppia-noninteractive-math math_content-with-value="{&amp;'
            'quot;raw_latex&amp;quot;: &amp;quot;-,-,-,-&amp;quot;, &amp;'
            'quot;svg_filename&amp;quot;: &amp;quot;&amp;quot;}"></oppia'
            '-noninteractive-math>'
        )
        invalid_html_content2 = (
            '<oppia-noninteractive-math math_content-with-value="{&amp;'
            'quot;raw_latex&amp;quot;: &amp;quot;+,+,+,+&amp;quot;, &amp;'
            'quot;svg_filename&amp;quot;: &amp;quot;&amp;quot;}"></oppia'
            '-noninteractive-math>'
        )

        change1 = {
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'property_name': exp_domain.STATE_PROPERTY_CONTENT,
            'state_name': 'state_1',
            'new_value': {
                'content_id': 'content',
                'html': '<p>Suggestion html</p>'
            },
            'old_value': {
                'content_id': 'content',
                'html': invalid_html_content1
            }
        }

        change2 = {
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'property_name': exp_domain.STATE_PROPERTY_CONTENT,
            'state_name': 'state_2',
            'new_value': {
                'content_id': 'content',
                'html': '<p>Suggestion html2</p>'
            },
            'old_value': {
                'content_id': 'content',
                'html': invalid_html_content2
            }
        }

        with self.swap(
            exp_fetchers, 'get_exploration_by_id',
            self.mock_get_exploration_by_id):

            suggestion1 = suggestion_services.create_suggestion(
                feconf.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
                feconf.ENTITY_TYPE_EXPLORATION,
                self.target_id_1, self.target_version_at_submission,
                self.author_id_1, change1, 'test description')

            suggestion2 = suggestion_services.create_suggestion(
                feconf.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
                feconf.ENTITY_TYPE_EXPLORATION,
                self.target_id_1, self.target_version_at_submission,
                self.author_id_1, change2, 'test description')

        job_id = (
            suggestion_jobs_one_off.
            SuggestionSvgFilenameValidationOneOffJob.create_new())
        (
            suggestion_jobs_one_off.
            SuggestionSvgFilenameValidationOneOffJob.enqueue(job_id))
        self.process_and_flush_pending_mapreduce_tasks()

        actual_output = (
            suggestion_jobs_one_off.
            SuggestionSvgFilenameValidationOneOffJob.get_output(job_id))
        expected_output = [
            u'[u\'Overall result\', {u\'number_of_suggestions_with_no_svgs\': '
            u'2, u\'number_of_math_tags_with_invalid_svg_filename\': 2}]',
            u'[u\'math tags with no SVGs in suggestion with ID %s\', '
            u'[u\'%s\']]' % (suggestion1.suggestion_id, invalid_html_content1),
            u'[u\'math tags with no SVGs in suggestion with ID %s\', '
            u'[u\'%s\']]' % (suggestion2.suggestion_id, invalid_html_content2),
        ]
        self.assertEqual(sorted(actual_output), sorted(expected_output))

    def test_job_when_suggestions_have_valid_filenames(self):
        valid_html_content1 = (
            '<oppia-noninteractive-math math_content-with-value="{&amp;'
            'quot;raw_latex&amp;quot;: &amp;quot;-,-,-,-&amp;quot;, &amp;'
            'quot;svg_filename&amp;quot;: &amp;quot;file1.svg&amp;quot;}">'
            '</oppia-noninteractive-math>'
        )
        with python_utils.open_file(
            os.path.join(feconf.TESTS_DATA_DIR, 'test_svg.svg'), 'rb',
            encoding=None) as f:
            raw_image = f.read()
        fs = fs_domain.AbstractFileSystem(
            fs_domain.GcsFileSystem(
                feconf.ENTITY_TYPE_EXPLORATION, self.target_id_1))
        fs.commit('image/file1.svg', raw_image, mimetype='image/svg+xml')

        change1 = {
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'property_name': exp_domain.STATE_PROPERTY_CONTENT,
            'state_name': 'state_1',
            'new_value': {
                'content_id': 'content',
                'html': '<p>Suggestion html</p>'
            },
            'old_value': {
                'content_id': 'content',
                'html': valid_html_content1
            }
        }

        with self.swap(
            exp_fetchers, 'get_exploration_by_id',
            self.mock_get_exploration_by_id):

            suggestion_services.create_suggestion(
                feconf.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
                feconf.ENTITY_TYPE_EXPLORATION,
                self.target_id_1, self.target_version_at_submission,
                self.author_id_1, change1, 'test description')

        job_id = (
            suggestion_jobs_one_off.
            SuggestionSvgFilenameValidationOneOffJob.create_new())
        (
            suggestion_jobs_one_off.
            SuggestionSvgFilenameValidationOneOffJob.enqueue(job_id))
        self.process_and_flush_pending_mapreduce_tasks()

        actual_output = (
            suggestion_jobs_one_off.
            SuggestionSvgFilenameValidationOneOffJob.get_output(job_id))
        self.assertEqual(actual_output, [])

    def test_job_when_suggestions_have_invalid_math_tags(self):
        invalid_html = (
            '<oppia-noninteractive-math></oppia-noninteractive-math>')
        with python_utils.open_file(
            os.path.join(feconf.TESTS_DATA_DIR, 'test_svg.svg'), 'rb',
            encoding=None) as f:
            raw_image = f.read()
        fs = fs_domain.AbstractFileSystem(
            fs_domain.GcsFileSystem(
                feconf.ENTITY_TYPE_EXPLORATION, self.target_id_1))
        fs.commit('image/file1.svg', raw_image, mimetype='image/svg+xml')

        change1 = {
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'property_name': exp_domain.STATE_PROPERTY_CONTENT,
            'state_name': 'state_1',
            'new_value': {
                'content_id': 'content',
                'html': '<p>Suggestion html</p>'
            },
            'old_value': {
                'content_id': 'content',
                'html': invalid_html
            }
        }

        with self.swap(
            exp_fetchers, 'get_exploration_by_id',
            self.mock_get_exploration_by_id):

            suggestion = suggestion_services.create_suggestion(
                feconf.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
                feconf.ENTITY_TYPE_EXPLORATION,
                self.target_id_1, self.target_version_at_submission,
                self.author_id_1, change1, 'test description')

        job_id = (
            suggestion_jobs_one_off.
            SuggestionSvgFilenameValidationOneOffJob.create_new())
        (
            suggestion_jobs_one_off.
            SuggestionSvgFilenameValidationOneOffJob.enqueue(job_id))
        self.process_and_flush_pending_mapreduce_tasks()

        actual_output = (
            suggestion_jobs_one_off.
            SuggestionSvgFilenameValidationOneOffJob.get_output(job_id))
        expected_output = [
            u'[u\'invalid-math-content-attribute-in-math-tag\', [u\'%s\']]' % (
                suggestion.suggestion_id)]
        self.assertEqual(actual_output, expected_output)

    def test_job_acts_only_on_suggestion_edit_state_content(self):

        change1 = {
            'cmd': question_domain.CMD_CREATE_NEW_FULLY_SPECIFIED_QUESTION,
            'question_dict': {
                'question_state_data': self._create_valid_question_data(
                    'default_state').to_dict(),
                'language_code': 'en',
                'question_state_data_schema_version': (
                    feconf.CURRENT_STATE_SCHEMA_VERSION),
                'linked_skill_ids': ['skill_1'],
                'inapplicable_skill_misconception_ids': ['skillid12345-1']
            },
            'skill_id': 'skill_1',
            'skill_difficulty': 0.3,
        }

        with self.swap(
            feedback_models.GeneralFeedbackThreadModel,
            'generate_new_thread_id', self.mock_generate_new_skill_thread_id):
            suggestion_services.create_suggestion(
                feconf.SUGGESTION_TYPE_ADD_QUESTION,
                feconf.ENTITY_TYPE_SKILL,
                'skill_1', feconf.CURRENT_STATE_SCHEMA_VERSION,
                self.author_id_1, change1, 'test description')

        change2 = {
            'cmd': exp_domain.CMD_ADD_TRANSLATION,
            'state_name': 'state_1',
            'content_id': 'content',
            'language_code': 'hi',
            'content_html': '<p>State name: state_1, Content id: content</p>',
            'translation_html': '<p>This is translated html.</p>'
        }
        with self.swap(
            exp_fetchers, 'get_exploration_by_id',
            self.mock_get_exploration_by_id):
            with self.swap(
                exp_domain.Exploration, 'get_content_html',
                self.MockExploration.get_content_html):
                suggestion_services.create_suggestion(
                    feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
                    feconf.ENTITY_TYPE_EXPLORATION,
                    self.target_id_1, 1, self.author_id_1,
                    change2, 'test description')

        job_id = (
            suggestion_jobs_one_off.
            SuggestionSvgFilenameValidationOneOffJob.create_new())
        (
            suggestion_jobs_one_off.
            SuggestionSvgFilenameValidationOneOffJob.enqueue(job_id))
        self.process_and_flush_pending_mapreduce_tasks()

        actual_output = (
            suggestion_jobs_one_off.
            SuggestionSvgFilenameValidationOneOffJob.get_output(job_id))
        self.assertEqual(actual_output, [])


class PopulateContributionStatsOneOffJobTests(
        test_utils.GenericTestBase):

    target_id = 'exp1'
    target_version_at_submission = 1
    sample_language_code = 'hi'
    AUTHOR_EMAIL = 'author1@example.com'
    REVIEWER_1_EMAIL = 'reviewer1@community.org'
    REVIEWER_2_EMAIL = 'reviewer2@community.org'
    COMMIT_MESSAGE = 'commit message'

    class MockExploration(python_utils.OBJECT):
        """Mocks an exploration. To be used only for testing."""

        def __init__(self, exploration_id, states):
            self.id = exploration_id
            self.states = states
            self.category = 'Algebra'

        def get_content_html(self, unused_state_name, unused_content_id):
            """Used to mock the get_content_html method for explorations."""
            return '<p>This is html to translate.</p>'

    # A mock exploration created for testing.
    explorations = [
        MockExploration('exp1', {'state_1': {}, 'state_2': {}})
    ]

    def mock_get_exploration_by_id(self, exp_id):
        for exp in self.explorations:
            if exp.id == exp_id:
                return exp

    def mock_update_exploration(
            self, unused_user_id, unused_exploration_id, unused_change_list,
            commit_message, is_suggestion):
        self.assertTrue(is_suggestion)
        self.assertEqual(
            commit_message, 'Accepted suggestion by %s: %s' % (
                'author', self.COMMIT_MESSAGE))

    def mock_accept_suggestion(
            self, suggestion_id, reviewer_id, commit_message, review_message):
        """Sets up the appropriate mocks to successfully call
        accept_suggestion.
        """
        with self.swap(
            exp_services, 'update_exploration',
            self.mock_update_exploration):
            with self.swap(
                exp_fetchers, 'get_exploration_by_id',
                self.mock_get_exploration_by_id):
                with self.swap(
                    exp_domain.Exploration, 'get_content_html',
                    self.MockExploration.get_content_html):
                    suggestion_services.accept_suggestion(
                        suggestion_id, reviewer_id, commit_message,
                        review_message
                    )

    def _create_edit_state_content_suggestion(self):
        """Creates an "edit state content" suggestion."""

        edit_state_content_change_dict = {
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'property_name': exp_domain.STATE_PROPERTY_CONTENT,
            'state_name': 'Introduction',
            'new_value': {
                'content_id': 'content',
                'html': 'new html content'
            },
            'old_value': {
                'content_id': 'content',
                'html': 'old html content'
            }
        }

        with self.swap(
            exp_fetchers, 'get_exploration_by_id',
            self.mock_get_exploration_by_id):
            edit_state_content_suggestion = (
                suggestion_services.create_suggestion(
                    feconf.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
                    feconf.ENTITY_TYPE_EXPLORATION,
                    self.target_id, self.target_version_at_submission,
                    self.author_id, edit_state_content_change_dict,
                    'test description')
            )

        return edit_state_content_suggestion

    def _create_translation_suggestion_with_language_code(self, language_code):
        """Creates a translation suggestion in the given language_code."""
        add_translation_change_dict = {
            'cmd': exp_domain.CMD_ADD_TRANSLATION,
            'state_name': 'state_1',
            'content_id': 'content',
            'language_code': language_code,
            'content_html': '<p>This is html to translate.</p>',
            'translation_html': '<p>This is translated html.</p>'
        }

        with self.swap(
            exp_fetchers, 'get_exploration_by_id',
            self.mock_get_exploration_by_id):
            with self.swap(
                exp_domain.Exploration, 'get_content_html',
                self.MockExploration.get_content_html):
                translation_suggestion = (
                    suggestion_services.create_suggestion(
                        feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
                        feconf.ENTITY_TYPE_EXPLORATION,
                        self.target_id, self.target_version_at_submission,
                        self.author_id, add_translation_change_dict,
                        'test description')
                )

        return translation_suggestion

    def _create_question_suggestion_with_skill_id(self, skill_id):
        """Creates a question suggestion with the given skill_id."""
        add_question_change_dict = {
            'cmd': (
                question_domain
                .CMD_CREATE_NEW_FULLY_SPECIFIED_QUESTION),
            'question_dict': {
                'question_state_data': self._create_valid_question_data(
                    'default_state').to_dict(),
                'language_code': 'en',
                'question_state_data_schema_version': (
                    feconf.CURRENT_STATE_SCHEMA_VERSION),
                'linked_skill_ids': ['skill_1'],
                'inapplicable_skill_misconception_ids': ['skillid12345-1']
            },
            'skill_id': skill_id,
            'skill_difficulty': 0.3
        }

        question_suggestion = suggestion_services.create_suggestion(
            feconf.SUGGESTION_TYPE_ADD_QUESTION,
            feconf.ENTITY_TYPE_SKILL,
            skill_id, feconf.CURRENT_STATE_SCHEMA_VERSION,
            self.author_id, add_question_change_dict,
            'test description')

        return question_suggestion

    def _run_job_and_verify_output(self, expected_output):
        """Runs the PopulateContributionStatsOneOffJob and verifies
        that the output matches the expected output.

        Args:
            expected_output: list(str). The expected output from the one off
                job.
        """
        job_id = (
            suggestion_jobs_one_off
            .PopulateContributionStatsOneOffJob.create_new())
        (
            suggestion_jobs_one_off
            .PopulateContributionStatsOneOffJob
            .enqueue(job_id)
        )
        self.process_and_flush_pending_tasks()
        self.process_and_flush_pending_mapreduce_tasks()

        actual_output = (
            suggestion_jobs_one_off
            .PopulateContributionStatsOneOffJob
            .get_output(job_id)
        )

        self.assertEqual(len(actual_output), len(expected_output))
        self.assertEqual(sorted(actual_output), sorted(expected_output))

    def setUp(self):
        super(
            PopulateContributionStatsOneOffJobTests,
            self).setUp()

        self.signup(self.AUTHOR_EMAIL, 'author')
        self.author_id = self.get_user_id_from_email(self.AUTHOR_EMAIL)
        self.signup(self.REVIEWER_1_EMAIL, 'reviewer1')
        self.reviewer_1_id = self.get_user_id_from_email(
            self.REVIEWER_1_EMAIL)
        self.signup(self.REVIEWER_2_EMAIL, 'reviewer2')
        self.reviewer_2_id = self.get_user_id_from_email(
            self.REVIEWER_2_EMAIL)

        self.process_and_flush_pending_tasks()

    def test_no_action_is_performed_for_suggestions_that_are_marked_deleted(
            self):
        question_suggestion = self._create_question_suggestion_with_skill_id(
            'skill_1')
        expected_output = []

        suggestion_model = suggestion_models.GeneralSuggestionModel.get_by_id(
            question_suggestion.suggestion_id
        )
        suggestion_model.deleted = True
        suggestion_model.update_timestamps()
        suggestion_model.put()

        self._run_job_and_verify_output(expected_output)

    def test_no_action_is_performed_for_suggestion_that_has_been_deleted(self):
        question_suggestion = self._create_question_suggestion_with_skill_id(
            'skill_1')
        expected_output = []

        suggestion_model = suggestion_models.GeneralSuggestionModel.get_by_id(
            question_suggestion.suggestion_id
        )
        suggestion_model.delete()

        self._run_job_and_verify_output(expected_output)

    def test_no_action_is_performed_for_user_contribution_rights_marked_deleted(
            self):
        # Allowing the reviewer to review questions will create an associated
        # user contribution rights model, if it doesn't already exist.
        user_services.allow_user_to_review_question(self.reviewer_1_id)
        expected_output = []

        user_contribution_rights_model = (
            user_models.UserContributionRightsModel.get_by_id(
                self.reviewer_1_id)
        )
        user_contribution_rights_model.deleted = True
        user_contribution_rights_model.update_timestamps()
        user_contribution_rights_model.put()

        self._run_job_and_verify_output(expected_output)

    def test_no_action_is_performed_for_deleted_user_contribution_rights(self):
        # Allowing the reviewer to review questions will create an associated
        # user contribution rights model, if it doesn't already exist.
        user_services.allow_user_to_review_question(self.reviewer_1_id)
        expected_output = []

        # Removing the contribution reviewer deletes their user contribution
        # rights model.
        user_services.remove_contribution_reviewer(self.reviewer_1_id)

        self._run_job_and_verify_output(expected_output)

    def test_no_action_taken_for_suggestions_not_on_the_contributor_dashboard(
            self):
        self._create_edit_state_content_suggestion()
        expected_output = []

        self._run_job_and_verify_output(expected_output)

    def test_no_action_is_performed_for_rejected_suggestions(self):
        question_suggestion = self._create_question_suggestion_with_skill_id(
            'skill_1'
        )
        expected_output = []
        suggestion_services.reject_suggestion(
            question_suggestion.suggestion_id, self.reviewer_1_id,
            'reject message'
        )

        self._run_job_and_verify_output(expected_output)

    def test_no_action_is_performed_for_accepted_suggestions(self):
        translation_suggestion = (
            self._create_translation_suggestion_with_language_code(
                self.sample_language_code)
        )
        expected_output = []

        self.mock_accept_suggestion(
            translation_suggestion.suggestion_id, self.reviewer_1_id,
            'commit message', 'review message'
        )

        self._run_job_and_verify_output(expected_output)

    def test_job_updates_counts_for_translation_suggestions_in_same_lang_code(
            self):
        self._create_translation_suggestion_with_language_code(
            self.sample_language_code)
        self._create_translation_suggestion_with_language_code(
            self.sample_language_code)
        expected_output = [
            '[u\'suggestion.translate_content.%s\', 2]' % (
                self.sample_language_code)
        ]

        self._run_job_and_verify_output(expected_output)

        community_contribution_stats = (
            suggestion_services.get_community_contribution_stats()
        )
        self.assertEqual(
            (
                community_contribution_stats
                .translation_suggestion_counts_by_lang_code[
                    self.sample_language_code]
            ), 2)

    def test_job_updates_counts_for_translation_suggestions_in_diff_lang_code(
            self):
        self._create_translation_suggestion_with_language_code('hi')
        self._create_translation_suggestion_with_language_code('en')
        expected_output = [
            '[u\'suggestion.translate_content.hi\', 1]',
            '[u\'suggestion.translate_content.en\', 1]'
        ]

        self._run_job_and_verify_output(expected_output)

        community_contribution_stats = (
            suggestion_services.get_community_contribution_stats()
        )
        self.assertEqual(
            (
                community_contribution_stats
                .translation_suggestion_counts_by_lang_code['hi']
            ), 1)
        self.assertEqual(
            (
                community_contribution_stats
                .translation_suggestion_counts_by_lang_code['en']
            ), 1)

    def test_job_updates_counts_for_translation_reviewers_in_same_lang_code(
            self):
        user_services.allow_user_to_review_translation_in_language(
            self.reviewer_1_id, self.sample_language_code)
        user_services.allow_user_to_review_translation_in_language(
            self.reviewer_2_id, self.sample_language_code)
        expected_output = [
            '[u\'reviewer.translation.%s\', 2]' % self.sample_language_code
        ]

        self._run_job_and_verify_output(expected_output)

        community_contribution_stats = (
            suggestion_services.get_community_contribution_stats()
        )
        self.assertEqual(
            (
                community_contribution_stats
                .translation_reviewer_counts_by_lang_code[
                    self.sample_language_code]
            ), 2)

    def test_job_updates_counts_for_translation_reviewers_in_diff_lang_code(
            self):
        user_services.allow_user_to_review_translation_in_language(
            self.reviewer_1_id, 'hi')
        user_services.allow_user_to_review_translation_in_language(
            self.reviewer_2_id, 'en')
        expected_output = [
            '[u\'reviewer.translation.hi\', 1]',
            '[u\'reviewer.translation.en\', 1]'
        ]

        self._run_job_and_verify_output(expected_output)

        community_contribution_stats = (
            suggestion_services.get_community_contribution_stats()
        )
        self.assertEqual(
            (
                community_contribution_stats
                .translation_reviewer_counts_by_lang_code['hi']
            ), 1)
        self.assertEqual(
            (
                community_contribution_stats
                .translation_reviewer_counts_by_lang_code['en']
            ), 1)

    def test_job_updates_question_suggestion_count(self):
        self._create_question_suggestion_with_skill_id('skill_1')
        self._create_question_suggestion_with_skill_id('skill_2')
        expected_output = ['[u\'suggestion.add_question.en\', 2]']

        self._run_job_and_verify_output(expected_output)

        community_contribution_stats = (
            suggestion_services.get_community_contribution_stats()
        )
        self.assertEqual(
            community_contribution_stats.question_suggestion_count, 2
        )

    def test_job_updates_question_reviewer_count(
            self):
        user_services.allow_user_to_review_question(self.reviewer_1_id)
        user_services.allow_user_to_review_question(self.reviewer_2_id)
        expected_output = ['[u\'reviewer.question.en\', 2]']

        self._run_job_and_verify_output(expected_output)

        community_contribution_stats = (
            suggestion_services.get_community_contribution_stats()
        )
        self.assertEqual(
            community_contribution_stats.question_reviewer_count, 2)

    def test_job_updates_both_reviewer_and_suggestion_counts(self):
        # Create two question suggestions.
        self._create_question_suggestion_with_skill_id('skill_1')
        self._create_question_suggestion_with_skill_id('skill_2')
        # Create three translation suggestions.
        self._create_translation_suggestion_with_language_code('hi')
        self._create_translation_suggestion_with_language_code('en')
        self._create_translation_suggestion_with_language_code('en')
        # Create question reviewers.
        user_services.allow_user_to_review_question(self.reviewer_1_id)
        user_services.allow_user_to_review_question(self.reviewer_2_id)
        # Create translation reviewers.
        user_services.allow_user_to_review_translation_in_language(
            self.reviewer_1_id, 'hi')
        user_services.allow_user_to_review_translation_in_language(
            self.reviewer_2_id, 'hi')
        user_services.allow_user_to_review_translation_in_language(
            self.reviewer_2_id, 'en')
        expected_output = [
            '[u\'reviewer.translation.en\', 1]',
            '[u\'reviewer.translation.hi\', 2]',
            '[u\'reviewer.question.en\', 2]',
            '[u\'suggestion.add_question.en\', 2]',
            '[u\'suggestion.translate_content.en\', 2]',
            '[u\'suggestion.translate_content.hi\', 1]'
        ]

        self._run_job_and_verify_output(expected_output)

        community_contribution_stats = (
            suggestion_services.get_community_contribution_stats()
        )
        self.assertEqual(
            community_contribution_stats.question_suggestion_count, 2)
        self.assertEqual(
            (
                community_contribution_stats
                .translation_suggestion_counts_by_lang_code['hi']
            ), 1)
        self.assertEqual(
            (
                community_contribution_stats
                .translation_suggestion_counts_by_lang_code['en']
            ), 2)
        self.assertEqual(
            community_contribution_stats.question_reviewer_count, 2)
        self.assertEqual(
            (
                community_contribution_stats
                .translation_reviewer_counts_by_lang_code['hi']
            ), 2)
        self.assertEqual(
            (
                community_contribution_stats
                .translation_reviewer_counts_by_lang_code['en']
            ), 1)


class PopulateFinalReviewerIdOneOffJobTests(test_utils.GenericTestBase):

    target_id = 'exp1'
    target_version_at_submission = 1
    exploration_category = 'Algebra'
    EXPLORATION_THREAD_ID = 'exploration.exp1.thread_1'
    SKILL_THREAD_ID = 'skill1.thread1'
    AUTHOR_EMAIL = 'author1@example.com'
    REVIEWER_EMAIL = 'reviewer@example.com'

    edit_state_content_change_dict = {
        'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
        'property_name': exp_domain.STATE_PROPERTY_CONTENT,
        'state_name': 'Introduction',
        'new_value': {
            'content_id': 'content',
            'html': 'new html content'
        },
        'old_value': {
            'content_id': 'content',
            'html': 'old html content'
        }
    }

    # The question_state_data is set to valid state data in the setup.
    add_question_change_dict = {
        'cmd': question_domain.CMD_CREATE_NEW_FULLY_SPECIFIED_QUESTION,
        'question_dict': {
            'question_state_data': {},
            'language_code': 'en',
            'question_state_data_schema_version': (
                feconf.CURRENT_STATE_SCHEMA_VERSION),
            'linked_skill_ids': ['skill_1'],
            'inapplicable_skill_misconception_ids': ['skillid12345-1']
        },
        'skill_id': 'skill_1',
        'skill_difficulty': 0.3,
    }

    def _run_job_and_verify_output(self, expected_output):
        """Runs the PopulateFinalReviewerIdOneOffJobTests and
        verifies that the output matches the expected output.

        Args:
            expected_output: list(str). The expected output from the one off
                job.
        """
        job_id = (
            suggestion_jobs_one_off
            .PopulateFinalReviewerIdOneOffJob.create_new())
        (
            suggestion_jobs_one_off
            .PopulateFinalReviewerIdOneOffJob.enqueue(job_id)
        )
        self.process_and_flush_pending_mapreduce_tasks()

        actual_output = (
            suggestion_jobs_one_off
            .PopulateFinalReviewerIdOneOffJob.get_output(job_id))

        self.assertEqual(actual_output, expected_output)

    def setUp(self):
        super(PopulateFinalReviewerIdOneOffJobTests, self).setUp()
        self.signup(self.AUTHOR_EMAIL, 'author')
        self.author_id = self.get_user_id_from_email(self.AUTHOR_EMAIL)
        self.signup(self.REVIEWER_EMAIL, 'reviewer')
        self.reviewer_id = self.get_user_id_from_email(self.REVIEWER_EMAIL)
        # Add valid question state data to the question dict.
        self.add_question_change_dict['question_dict'][
            'question_state_data'] = self._create_valid_question_data(
                'default_state').to_dict()
        self.process_and_flush_pending_mapreduce_tasks()

    def test_no_action_is_performed_for_suggestions_that_are_marked_deleted(
            self):
        suggestion_models.GeneralSuggestionModel(
            id=self.EXPLORATION_THREAD_ID,
            suggestion_type=(
                feconf.SUGGESTION_TYPE_EDIT_STATE_CONTENT),
            target_type=feconf.ENTITY_TYPE_EXPLORATION,
            target_id=self.target_id,
            target_version_at_submission=self.target_version_at_submission,
            status=suggestion_models.STATUS_ACCEPTED,
            author_id=self.author_id,
            final_reviewer_id=None,
            change_cmd=self.edit_state_content_change_dict,
            score_category='score_category'
        ).put()

        suggestion_model = suggestion_models.GeneralSuggestionModel.get_by_id(
            self.EXPLORATION_THREAD_ID)
        suggestion_model.deleted = True
        suggestion_model.update_timestamps()
        suggestion_model.put()

        expected_output = [u'[u\'DELETED_MODELS\', 1]']
        self._run_job_and_verify_output(expected_output)

        suggestion_model = suggestion_models.GeneralSuggestionModel.get_by_id(
            self.EXPLORATION_THREAD_ID)
        self.assertEqual(suggestion_model.final_reviewer_id, None)

    def test_job_does_not_changes_valid_models(self):
        suggestion_models.GeneralSuggestionModel(
            id=self.EXPLORATION_THREAD_ID,
            suggestion_type=(
                feconf.SUGGESTION_TYPE_EDIT_STATE_CONTENT),
            target_type=feconf.ENTITY_TYPE_EXPLORATION,
            target_id=self.target_id,
            target_version_at_submission=self.target_version_at_submission,
            status=suggestion_models.STATUS_ACCEPTED,
            author_id=self.author_id,
            final_reviewer_id=self.reviewer_id,
            change_cmd=self.edit_state_content_change_dict,
            score_category='score_category'
        ).put()

        expected_output = [u'[u\'UNCHANGED_MODELS\', 1]']
        self._run_job_and_verify_output(expected_output)
        suggestion_model = suggestion_models.GeneralSuggestionModel.get_by_id(
            self.EXPLORATION_THREAD_ID)
        self.assertEqual(suggestion_model.final_reviewer_id, self.reviewer_id)

    def test_accepted_suggestion_with_none_final_reviewer_id_gets_updated(self):
        suggestion_models.GeneralSuggestionModel(
            id=self.EXPLORATION_THREAD_ID,
            suggestion_type=(
                feconf.SUGGESTION_TYPE_EDIT_STATE_CONTENT),
            target_type=feconf.ENTITY_TYPE_EXPLORATION,
            target_id=self.target_id,
            target_version_at_submission=self.target_version_at_submission,
            status=suggestion_models.STATUS_ACCEPTED,
            author_id=self.author_id,
            final_reviewer_id=None,
            change_cmd=self.edit_state_content_change_dict,
            score_category='score_category'
        ).put()

        feedback_models.GeneralFeedbackMessageModel(
            id=self.EXPLORATION_THREAD_ID + '.0',
            thread_id=self.EXPLORATION_THREAD_ID,
            message_id=0,
            author_id=self.reviewer_id,
            updated_status=feedback_models.STATUS_CHOICES_FIXED
        ).put()

        expected_output = [u'[u\'CHANGED_MODELS\', 1]']
        self._run_job_and_verify_output(expected_output)
        suggestion_model = suggestion_models.GeneralSuggestionModel.get_by_id(
            self.EXPLORATION_THREAD_ID)
        self.assertEqual(suggestion_model.final_reviewer_id, self.reviewer_id)

    def test_rejected_suggestion_with_none_final_reviewer_id_gets_updated(self):
        suggestion_models.GeneralSuggestionModel(
            id=self.EXPLORATION_THREAD_ID,
            suggestion_type=(
                feconf.SUGGESTION_TYPE_EDIT_STATE_CONTENT),
            target_type=feconf.ENTITY_TYPE_EXPLORATION,
            target_id=self.target_id,
            target_version_at_submission=self.target_version_at_submission,
            status=suggestion_models.STATUS_REJECTED,
            author_id=self.author_id,
            final_reviewer_id=None,
            change_cmd=self.edit_state_content_change_dict,
            score_category='score_category'
        ).put()

        feedback_models.GeneralFeedbackMessageModel(
            id=self.EXPLORATION_THREAD_ID + '.0',
            thread_id=self.EXPLORATION_THREAD_ID,
            message_id=0,
            author_id=self.reviewer_id,
            updated_status=feedback_models.STATUS_CHOICES_IGNORED
        ).put()

        expected_output = [u'[u\'CHANGED_MODELS\', 1]']
        self._run_job_and_verify_output(expected_output)
        suggestion_model = suggestion_models.GeneralSuggestionModel.get_by_id(
            self.EXPLORATION_THREAD_ID)
        self.assertEqual(suggestion_model.final_reviewer_id, self.reviewer_id)

    def test_job_with_no_message_model_yields_without_update(self):
        suggestion_models.GeneralSuggestionModel(
            id=self.EXPLORATION_THREAD_ID,
            suggestion_type=(
                feconf.SUGGESTION_TYPE_EDIT_STATE_CONTENT),
            target_type=feconf.ENTITY_TYPE_EXPLORATION,
            target_id=self.target_id,
            target_version_at_submission=self.target_version_at_submission,
            status=suggestion_models.STATUS_ACCEPTED,
            author_id=self.author_id,
            final_reviewer_id=None,
            change_cmd=self.edit_state_content_change_dict,
            score_category='score_category'
        ).put()

        expected_output = [
            u'[u\'FAILED_NONE_MESSAGE_MODEL\', '
            '[u"(\'exploration.exp1.thread_1\', u\'accepted\')"]]']
        self._run_job_and_verify_output(expected_output)
        suggestion_model = suggestion_models.GeneralSuggestionModel.get_by_id(
            self.EXPLORATION_THREAD_ID)
        self.assertEqual(suggestion_model.final_reviewer_id, None)

    def test_job_with_multi_message_models_yields_without_update(self):
        suggestion_models.GeneralSuggestionModel(
            id=self.EXPLORATION_THREAD_ID,
            suggestion_type=(
                feconf.SUGGESTION_TYPE_EDIT_STATE_CONTENT),
            target_type=feconf.ENTITY_TYPE_EXPLORATION,
            target_id=self.target_id,
            target_version_at_submission=self.target_version_at_submission,
            status=suggestion_models.STATUS_ACCEPTED,
            author_id=self.author_id,
            final_reviewer_id=None,
            change_cmd=self.edit_state_content_change_dict,
            score_category='score_category'
        ).put()

        feedback_models.GeneralFeedbackMessageModel(
            id=self.EXPLORATION_THREAD_ID + '.0',
            thread_id=self.EXPLORATION_THREAD_ID,
            message_id=0,
            author_id=self.reviewer_id,
            updated_status=feedback_models.STATUS_CHOICES_FIXED
        ).put()
        feedback_models.GeneralFeedbackMessageModel(
            id=self.EXPLORATION_THREAD_ID + '.1',
            thread_id=self.EXPLORATION_THREAD_ID,
            message_id=1,
            author_id=self.reviewer_id,
            updated_status=feedback_models.STATUS_CHOICES_FIXED
        ).put()

        expected_output = [
            u'[u\'FAILED_MULTIPLE_MESSAGE_MODEL\', '
            '[u"(\'exploration.exp1.thread_1\', u\'accepted\')"]]']
        self._run_job_and_verify_output(expected_output)
        suggestion_model = suggestion_models.GeneralSuggestionModel.get_by_id(
            self.EXPLORATION_THREAD_ID)
        self.assertEqual(suggestion_model.final_reviewer_id, None)
