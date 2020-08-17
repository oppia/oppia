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
from core.domain import suggestion_registry
from core.domain import suggestion_services
from core.platform import models
from core.tests import test_utils
import feconf
import python_utils
import utils

(suggestion_models, feedback_models) = models.Registry.import_models([
    models.NAMES.suggestion, models.NAMES.feedback])


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
        self.process_and_flush_pending_tasks()

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
                suggestion_models.SUGGESTION_TYPE_TRANSLATE_CONTENT,
                suggestion_models.TARGET_TYPE_EXPLORATION,
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
            'rule_input_translations': {},
            'rule_types_to_inputs': {
                'Equals': [{'x': 0}]
            },
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
            'suggestion_type': suggestion_models.SUGGESTION_TYPE_ADD_QUESTION,
            'target_type': suggestion_models.TARGET_TYPE_SKILL,
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
                    'linked_skill_ids': ['skill_2']
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
                suggestion_models.SUGGESTION_TYPE_ADD_QUESTION,
                suggestion_models.TARGET_TYPE_SKILL,
                'skill1', feconf.CURRENT_STATE_SCHEMA_VERSION,
                self.author_id, suggestion_dict_with_math['change'],
                'test description')

        job_id = (
            suggestion_jobs_one_off.
            SuggestionMathRteAuditOneOffJob.create_new())
        suggestion_jobs_one_off.SuggestionMathRteAuditOneOffJob.enqueue(job_id)
        self.process_and_flush_pending_tasks()

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
                suggestion_models.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
                suggestion_models.TARGET_TYPE_EXPLORATION,
                self.target_id, self.target_version_at_submission,
                self.author_id, change_dict, 'test description')

        job_id = (
            suggestion_jobs_one_off.
            SuggestionMathRteAuditOneOffJob.create_new())
        suggestion_jobs_one_off.SuggestionMathRteAuditOneOffJob.enqueue(job_id)
        self.process_and_flush_pending_tasks()

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
            'rule_input_translations': {},
            'rule_types_to_inputs': {
                'Equals': [{'x': 0}]
            },
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
            'suggestion_type': suggestion_models.SUGGESTION_TYPE_ADD_QUESTION,
            'target_type': suggestion_models.TARGET_TYPE_SKILL,
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
                    'linked_skill_ids': ['skill_2']
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
                suggestion_models.SUGGESTION_TYPE_ADD_QUESTION,
                suggestion_models.TARGET_TYPE_SKILL,
                'skill1', feconf.CURRENT_STATE_SCHEMA_VERSION,
                self.author_id, suggestion_dict_without_math['change'],
                'test description')

        job_id = (
            suggestion_jobs_one_off.
            SuggestionMathRteAuditOneOffJob.create_new())
        suggestion_jobs_one_off.SuggestionMathRteAuditOneOffJob.enqueue(job_id)
        self.process_and_flush_pending_tasks()

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
        self.process_and_flush_pending_tasks()

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
                suggestion_models.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
                suggestion_models.TARGET_TYPE_EXPLORATION,
                self.target_id_1, self.target_version_at_submission,
                self.author_id_1, change1, 'test description')

            suggestion2 = suggestion_services.create_suggestion(
                suggestion_models.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
                suggestion_models.TARGET_TYPE_EXPLORATION,
                self.target_id_1, self.target_version_at_submission,
                self.author_id_1, change2, 'test description')

        job_id = (
            suggestion_jobs_one_off.
            SuggestionSvgFilenameValidationOneOffJob.create_new())
        (
            suggestion_jobs_one_off.
            SuggestionSvgFilenameValidationOneOffJob.enqueue(job_id))
        self.process_and_flush_pending_tasks()

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
                suggestion_models.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
                suggestion_models.TARGET_TYPE_EXPLORATION,
                self.target_id_1, self.target_version_at_submission,
                self.author_id_1, change1, 'test description')

        job_id = (
            suggestion_jobs_one_off.
            SuggestionSvgFilenameValidationOneOffJob.create_new())
        (
            suggestion_jobs_one_off.
            SuggestionSvgFilenameValidationOneOffJob.enqueue(job_id))
        self.process_and_flush_pending_tasks()

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
                suggestion_models.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
                suggestion_models.TARGET_TYPE_EXPLORATION,
                self.target_id_1, self.target_version_at_submission,
                self.author_id_1, change1, 'test description')

        job_id = (
            suggestion_jobs_one_off.
            SuggestionSvgFilenameValidationOneOffJob.create_new())
        (
            suggestion_jobs_one_off.
            SuggestionSvgFilenameValidationOneOffJob.enqueue(job_id))
        self.process_and_flush_pending_tasks()

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
                'linked_skill_ids': ['skill_1']
            },
            'skill_id': 'skill_1',
            'skill_difficulty': 0.3,
        }

        with self.swap(
            feedback_models.GeneralFeedbackThreadModel,
            'generate_new_thread_id', self.mock_generate_new_skill_thread_id):
            suggestion_services.create_suggestion(
                suggestion_models.SUGGESTION_TYPE_ADD_QUESTION,
                suggestion_models.TARGET_TYPE_SKILL,
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
                    suggestion_models.SUGGESTION_TYPE_TRANSLATE_CONTENT,
                    suggestion_models.TARGET_TYPE_EXPLORATION,
                    self.target_id_1, 1, self.author_id_1,
                    change2, 'test description')

        job_id = (
            suggestion_jobs_one_off.
            SuggestionSvgFilenameValidationOneOffJob.create_new())
        (
            suggestion_jobs_one_off.
            SuggestionSvgFilenameValidationOneOffJob.enqueue(job_id))
        self.process_and_flush_pending_tasks()

        actual_output = (
            suggestion_jobs_one_off.
            SuggestionSvgFilenameValidationOneOffJob.get_output(job_id))
        self.assertEqual(actual_output, [])


class SuggestionMathMigrationOneOffJobTests(test_utils.GenericTestBase):

    target_id = 'exp1'
    target_version_at_submission = 1
    AUTHOR_EMAIL = 'author@example.com'
    REVIEWER_EMAIL = 'reviewer@example.com'
    EXPLORATION_THREAD_ID = 'exploration.exp1.thread_1'
    SKILL_THREAD_ID = 'skill1.thread1'
    fake_date = datetime.datetime(2016, 4, 10, 0, 0, 0, 0)

    def setUp(self):
        super(SuggestionMathMigrationOneOffJobTests, self).setUp()
        self.signup(self.AUTHOR_EMAIL, 'author')
        self.author_id = self.get_user_id_from_email(self.AUTHOR_EMAIL)
        self.signup(self.REVIEWER_EMAIL, 'reviewer')
        self.reviewer_id = self.get_user_id_from_email(self.REVIEWER_EMAIL)
        self.process_and_flush_pending_tasks()

    def mock_generate_new_exploration_thread_id(
            self, unused_entity_type, unused_entity_id):
        return self.EXPLORATION_THREAD_ID

    def mock_generate_new_skill_thread_id(
            self, unused_entity_type, unused_entity_id):
        return self.SKILL_THREAD_ID

    def test_migrate_suggestion_with_math_rte_correctly(self):
        state_dict = {
            'classifier_model_id': None,
            'content': {
                'content_id': 'content',
                'html': 'this is the content HTML'
            },
            'interaction': {
                'answer_groups': [],
                'confirmed_unclassified_answers': [],
                'customization_args': {},
                'default_outcome': {
                    'dest': 'Introduction',
                    'feedback': {
                        'content_id': 'default_outcome',
                        'html': ''
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

        exploration = exp_domain.Exploration(
            'exp1', feconf.DEFAULT_EXPLORATION_TITLE, 'Algebra',
            feconf.DEFAULT_EXPLORATION_OBJECTIVE,
            constants.DEFAULT_LANGUAGE_CODE, [], '', '',
            feconf.CURRENT_STATE_SCHEMA_VERSION,
            feconf.DEFAULT_INIT_STATE_NAME, states, {}, [], 0, False,
            False)
        exp_services.save_new_exploration(self.author_id, exploration)
        html_content = (
            '<p>Value</p><oppia-noninteractive-math raw_latex-with-value="&a'
            'mp;quot;+,-,-,+&amp;quot;"></oppia-noninteractive-math>')
        expected_html_content = (
            '<p>Value</p><oppia-noninteractive-math math_content-with-value='
            '"{&amp;quot;raw_latex&amp;quot;: &amp;quot;+,-,-,+&amp;quot;, &'
            'amp;quot;svg_filename&amp;quot;: &amp;quot;&amp;quot;}"></oppia'
            '-noninteractive-math>')
        add_translation_change_dict = {
            'cmd': 'add_translation',
            'state_name': 'Introduction',
            'content_id': 'content',
            'language_code': 'hi',
            'content_html': 'this is the content HTML',
            'translation_html': html_content
        }
        with self.swap(
            feedback_models.GeneralFeedbackThreadModel,
            'generate_new_thread_id',
            self.mock_generate_new_exploration_thread_id):
            suggestion_services.create_suggestion(
                suggestion_models.SUGGESTION_TYPE_TRANSLATE_CONTENT,
                suggestion_models.TARGET_TYPE_EXPLORATION,
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
            'rule_input_translations': {},
            'rule_types_to_inputs': {
                'Equals': [{'x': 0}]
            },
            'training_data': [],
            'tagged_skill_misconception_id': None
        }

        question_state_dict = {
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
                    'solution': {}
                }
            },
            'interaction': {
                'answer_groups': [answer_group],
                'confirmed_unclassified_answers': [],
                'customization_args': {
                    'choices': {
                        'value': [{
                            'content_id': 'ca_choices_0',
                            'html': 'option 1'
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
            'next_content_id_index': 3,
            'param_changes': [],
            'solicit_answer_details': False,
            'classifier_model_id': None
        }
        suggestion_dict = {
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
                    'question_state_data': question_state_dict,
                    'language_code': 'en',
                    'question_state_data_schema_version': (
                        feconf.CURRENT_STATE_SCHEMA_VERSION),
                    'linked_skill_ids': ['skill_1']
                },
                'skill_id': 'skill_1',
                'skill_difficulty': 0.3,
            },
            'score_category': 'question.skill1',
            'last_updated': utils.get_time_in_millisecs(self.fake_date)
        }
        with self.swap(
            feedback_models.GeneralFeedbackThreadModel,
            'generate_new_thread_id', self.mock_generate_new_skill_thread_id):
            suggestion_services.create_suggestion(
                suggestion_models.SUGGESTION_TYPE_ADD_QUESTION,
                suggestion_models.TARGET_TYPE_SKILL,
                'skill1', feconf.CURRENT_STATE_SCHEMA_VERSION,
                self.author_id, suggestion_dict['change'], 'test description')
        job_id = (
            suggestion_jobs_one_off.
            SuggestionMathMigrationOneOffJob.create_new())
        (
            suggestion_jobs_one_off.
            SuggestionMathMigrationOneOffJob.enqueue(job_id))
        self.process_and_flush_pending_tasks()
        observed_translation_suggestion = (
            suggestion_services.get_suggestion_by_id(
                'exploration.exp1.thread_1'))
        expected_suggestion_change_dict = {
            'cmd': 'add_translation',
            'state_name': 'Introduction',
            'content_id': 'content',
            'language_code': 'hi',
            'content_html': 'this is the content HTML',
            'translation_html': expected_html_content
        }
        self.assertEqual(
            expected_suggestion_change_dict,
            observed_translation_suggestion.to_dict()['change'])
        observed_question_suggestion = (
            suggestion_services.get_suggestion_by_id('skill1.thread1'))
        migrated_html = (
            observed_question_suggestion.change.question_dict[
                'question_state_data']['interaction']['answer_groups'][0][
                    'outcome']['feedback']['html'])
        self.assertEqual(migrated_html, expected_html_content)

    def test_migrate_in_suggestion_edit_content_with_math_rte_correctly(self):
        """Checks that correct number of hints are tabulated when
        there is single exploration.
        """
        html_content = (
            '<p>Value</p><oppia-noninteractive-math raw_latex-with-value="&a'
            'mp;quot;+,-,-,+&amp;quot;"></oppia-noninteractive-math>')
        expected_html_content = (
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
                'exp1', feconf.DEFAULT_EXPLORATION_TITLE, 'Algebra',
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
                'html': 'new suggestion'
            },
            'old_value': {
                'content_id': 'content',
                'html': html_content
            }
        }
        expected_change_dict = {
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'property_name': exp_domain.STATE_PROPERTY_CONTENT,
            'state_name': 'Introduction',
            'new_value': {
                'content_id': 'content',
                'html': 'new suggestion'
            },
            'old_value': {
                'content_id': 'content',
                'html': expected_html_content
            }
        }

        with self.swap(
            feedback_models.GeneralFeedbackThreadModel,
            'generate_new_thread_id',
            self.mock_generate_new_exploration_thread_id):
            suggestion_services.create_suggestion(
                suggestion_models.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
                suggestion_models.TARGET_TYPE_EXPLORATION,
                self.target_id, self.target_version_at_submission,
                self.author_id, change_dict, 'test description')

        job_id = (
            suggestion_jobs_one_off.
            SuggestionMathMigrationOneOffJob.create_new())
        suggestion_jobs_one_off.SuggestionMathMigrationOneOffJob.enqueue(job_id)
        self.process_and_flush_pending_tasks()
        observed_translation_suggestion = (
            suggestion_services.get_suggestion_by_id(
                'exploration.exp1.thread_1'))
        self.assertEqual(
            expected_change_dict,
            observed_translation_suggestion.to_dict()['change'])

    def test_skip_migration_for_suggestion_with_new_math_schema(self):
        """Tests that a suggestion already having the new math_schema is not
        migrated.
        """
        expected_html_content = (
            '<p>Value</p><oppia-noninteractive-math math_content-with-value='
            '"{&amp;quot;raw_latex&amp;quot;: &amp;quot;+,-,-,+&amp;quot;, &'
            'amp;quot;svg_filename&amp;quot;: &amp;quot;&amp;quot;}"></oppia'
            '-noninteractive-math>')

        state_dict = {
            'classifier_model_id': None,
            'content': {
                'content_id': 'content',
                'html': expected_html_content
            },
            'interaction': {
                'answer_groups': [],
                'confirmed_unclassified_answers': [],
                'customization_args': {},
                'default_outcome': {
                    'dest': 'Introduction',
                    'feedback': {
                        'content_id': 'default_outcome',
                        'html': expected_html_content
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
                'exp1', feconf.DEFAULT_EXPLORATION_TITLE, 'Algebra',
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
                'html': 'new suggestion'
            },
            'old_value': {
                'content_id': 'content',
                'html': expected_html_content
            }
        }

        with self.swap(
            feedback_models.GeneralFeedbackThreadModel,
            'generate_new_thread_id',
            self.mock_generate_new_exploration_thread_id):
            suggestion_services.create_suggestion(
                suggestion_models.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
                suggestion_models.TARGET_TYPE_EXPLORATION,
                self.target_id, self.target_version_at_submission,
                self.author_id, change_dict, 'test description')

        job_id = (
            suggestion_jobs_one_off.
            SuggestionMathMigrationOneOffJob.create_new())
        suggestion_jobs_one_off.SuggestionMathMigrationOneOffJob.enqueue(job_id)
        self.process_and_flush_pending_tasks()

        actual_output = (
            suggestion_jobs_one_off.
            SuggestionMathMigrationOneOffJob.get_output(job_id))
        self.assertEqual(len(actual_output), 0)

    def test_migration_skips_suggestions_failing_validation(self):
        html_content = (
            '<p>Value</p><oppia-noninteractive-math raw_latex-with-value="&a'
            'mp;quot;+,-,-,+&amp;quot;"></oppia-noninteractive-math>')
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
            'rule_input_translations': {},
            'rule_types_to_inputs': {
                'Equals': [{'x': 0}]
            },
            'training_data': [],
            'tagged_skill_misconception_id': None
        }
        question_state_dict = {
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
                    'solution': {}
                }
            },
            'interaction': {
                'answer_groups': [answer_group],
                'confirmed_unclassified_answers': [],
                'customization_args': {
                    'choices': {
                        'value': [{
                            'content_id': 'ca_choices_0',
                            'html': 'option 1'
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
            'next_content_id_index': 3,
            'param_changes': [],
            'solicit_answer_details': False,
            'classifier_model_id': None
        }
        suggestion_dict = {
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
                    'question_state_data': question_state_dict,
                    'language_code': 'en',
                    'question_state_data_schema_version': (
                        feconf.CURRENT_STATE_SCHEMA_VERSION),
                    'linked_skill_ids': ['skill_1']
                },
                'skill_id': 'skill_1',
                'skill_difficulty': 0.3,
            },
            'score_category': 'question.skill1',
            'last_updated': utils.get_time_in_millisecs(self.fake_date)
        }
        with self.swap(
            feedback_models.GeneralFeedbackThreadModel,
            'generate_new_thread_id', self.mock_generate_new_skill_thread_id):
            suggestion_services.create_suggestion(
                suggestion_models.SUGGESTION_TYPE_ADD_QUESTION,
                suggestion_models.TARGET_TYPE_SKILL,
                'skill1', feconf.CURRENT_STATE_SCHEMA_VERSION,
                self.author_id, suggestion_dict['change'], 'test description')

        def _mock_get_suggestion_by_id(unused_suggestion_id):
            """Mocks get_suggestion_by_id()."""
            return 'invalid_suggestion'
        get_suggestion_by_id_swap = (
            self.swap(
                suggestion_services, 'get_suggestion_by_id',
                _mock_get_suggestion_by_id))

        with get_suggestion_by_id_swap:
            job_id = (
                suggestion_jobs_one_off.SuggestionMathMigrationOneOffJob.
                create_new())
            (
                suggestion_jobs_one_off.
                SuggestionMathMigrationOneOffJob.enqueue(job_id))
            self.process_and_flush_pending_tasks()
        actual_output = (
            suggestion_jobs_one_off.SuggestionMathMigrationOneOffJob.
            get_output(job_id))
        expected_output = (
            u'[u\'validation_error\', [u"Suggestion skill1.thread1 failed v' +
            'alidation: \'unicode\' object has no attribute \'validate\'"]]')
        self.assertEqual(actual_output, [expected_output])

    def test_yield_validation_error_after_migration(self):
        html_content = (
            '<p>Value</p><oppia-noninteractive-math raw_latex-with-value="&a'
            'mp;quot;+,-,-,+&amp;quot;"></oppia-noninteractive-math>')
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
            'rule_input_translations': {},
            'rule_types_to_inputs': {
                'Equals': [{'x': 0}]
            },
            'training_data': [],
            'tagged_skill_misconception_id': None
        }
        question_state_dict = {
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
                    'solution': {}
                }
            },
            'interaction': {
                'answer_groups': [answer_group],
                'confirmed_unclassified_answers': [],
                'customization_args': {
                    'choices': {
                        'value': [{
                            'content_id': 'ca_choices_0',
                            'html': 'option 1'
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
            'next_content_id_index': 3,
            'param_changes': [],
            'solicit_answer_details': False,
            'classifier_model_id': None
        }
        suggestion_dict = {
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
                    'question_state_data': question_state_dict,
                    'language_code': 'en',
                    'question_state_data_schema_version': (
                        feconf.CURRENT_STATE_SCHEMA_VERSION),
                    'linked_skill_ids': ['skill_1']
                },
                'skill_id': 'skill_1',
                'skill_difficulty': 0.3,
            },
            'score_category': 'question.skill1',
            'last_updated': utils.get_time_in_millisecs(self.fake_date)
        }
        with self.swap(
            feedback_models.GeneralFeedbackThreadModel,
            'generate_new_thread_id', self.mock_generate_new_skill_thread_id):
            suggestion_services.create_suggestion(
                suggestion_models.SUGGESTION_TYPE_ADD_QUESTION,
                suggestion_models.TARGET_TYPE_SKILL,
                'skill1', feconf.CURRENT_STATE_SCHEMA_VERSION,
                self.author_id, suggestion_dict['change'], 'test description')

        def _mock_convert_html_in_suggestion_change(
                unused_self, unused_conversion_fn):
            """Mocks convert_html_in_suggestion_change()."""
            unused_self.change = {}

        _mock_convert_html_in_suggestion_change_swap = (
            self.swap(
                suggestion_registry.SuggestionAddQuestion,
                'convert_html_in_suggestion_change',
                _mock_convert_html_in_suggestion_change))
        with _mock_convert_html_in_suggestion_change_swap:
            job_id = (
                suggestion_jobs_one_off.SuggestionMathMigrationOneOffJob.
                create_new())
            (
                suggestion_jobs_one_off.
                SuggestionMathMigrationOneOffJob.enqueue(job_id))
            self.process_and_flush_pending_tasks()
        actual_output = (
            suggestion_jobs_one_off.SuggestionMathMigrationOneOffJob.
            get_output(job_id))
        expected_output = (
            u'[u\'validation_error_after_migration\', [u\'Suggestion skill1.t'
            'hread1 failed validation: Expected change to be an instance of '
            'QuestionSuggestionChange\']]')
        self.assertEqual(actual_output, [expected_output])
