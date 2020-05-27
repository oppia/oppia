from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from constants import constants
from core.domain import exp_domain
from core.domain import exp_fetchers
from core.domain import exp_services
from core.domain import feedback_services
from core.domain import rights_manager
from core.domain import state_domain
from core.domain import suggestion_registry
from core.domain import suggestion_services
from core.domain import user_services
from core.platform import models
from core.tests import test_utils
import feconf
import python_utils
import utils

(suggestion_models, feedback_models) = models.Registry.import_models([
    models.NAMES.suggestion, models.NAMES.feedback])


from core.domain import suggestion_services
from core.domain import suggestion_jobs_one_off


class SuggestionAuditOneOffJobTests(test_utils.GenericTestBase):

    ALBERT_EMAIL = 'albert@example.com'
    ALBERT_NAME = 'albert'

    VALID_EXP_ID = 'exp_id0'
    NEW_EXP_ID = 'exp_id1'
    EXP_TITLE = 'title'

    score_category = (
        suggestion_models.SCORE_TYPE_CONTENT +
        suggestion_models.SCORE_CATEGORY_DELIMITER + 'Algebra')

    target_id = 'exp1'
    target_version_at_submission = 1
    change = {
        'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
        'property_name': exp_domain.STATE_PROPERTY_CONTENT,
        'state_name': 'state_1',
        'new_value': 'new suggestion content'
    }

    AUTHOR_EMAIL = 'author@example.com'
    REVIEWER_EMAIL = 'reviewer@example.com'
    NORMAL_USER_EMAIL = 'normal@example.com'

    THREAD_ID = 'exploration.exp1.thread_1'

    COMMIT_MESSAGE = 'commit message'
    EMPTY_COMMIT_MESSAGE = ' '

    suggestion_id = THREAD_ID


    def setUp(self):
        super(SuggestionAuditOneOffJobTests, self).setUp()
        self.signup(self.AUTHOR_EMAIL, 'author')
        self.author_id = self.get_user_id_from_email(self.AUTHOR_EMAIL)
        self.signup(self.REVIEWER_EMAIL, 'reviewer')
        self.reviewer_id = self.get_user_id_from_email(self.REVIEWER_EMAIL)
        self.signup(self.NORMAL_USER_EMAIL, 'normaluser')
        self.normal_user_id = self.get_user_id_from_email(
            self.NORMAL_USER_EMAIL)
        # self.save_new_valid_exploration(
        #     self.target_id, self.author_id, category='Algebra')

        self.process_and_flush_pending_tasks()

    class MockExploration(python_utils.OBJECT):
        """Mocks an exploration. To be used only for testing."""
        def __init__(self, exploration_id, states):
            self.id = exploration_id
            self.states = states
            self.category = 'Algebra'

    # All mock explorations created for testing.
    explorations = [
        MockExploration('exp1', {'state_1': {'content':{'content_id':'saa','html':'sdsddsdssd'}}, 'state_2': {}})
    ]

    def mock_get_exploration_by_id(self, exp_id):
        for exp in self.explorations:
            if exp.id == exp_id:
                return exp
    def mock_generate_new_thread_id(self, unused_entity_type, unused_entity_id):
        return self.THREAD_ID

    def test_number_of_hints_tabulated_are_correct_in_single_exp(self):
        """Checks that correct number of hints are tabulated when
        there is single exploration.
        """
        expected_dict = {
            'classifier_model_id': None,
            'content': {
                'content_id': 'content',
                'html': ''
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
            'Introduction': expected_dict
        }

        exploration = exp_domain.Exploration(
                     "exp1",
                    feconf.DEFAULT_EXPLORATION_TITLE,
                    feconf.DEFAULT_EXPLORATION_CATEGORY,
                    feconf.DEFAULT_EXPLORATION_OBJECTIVE,
                    constants.DEFAULT_LANGUAGE_CODE,
                    [],
                    '',
                    '',
                    feconf.CURRENT_STATE_SCHEMA_VERSION,
                    feconf.DEFAULT_INIT_STATE_NAME,
                    states,
                    {},
                    [],
                    0,
                    False,
                    False)
        exp_services.save_new_exploration(self.author_id, exploration)

        add_translation_change_dict = {
            'cmd': 'add_translation',
            'state_name': 'Introduction',
            'content_id': 'content',
            'language_code': 'hi',
            'content_html': '',
            'translation_html': '<p>Translation for invalid content.</p>'
        }
        #
        # with self.swap(
        #     feedback_models.GeneralFeedbackThreadModel,
        #     'generate_new_thread_id', self.mock_generate_new_thread_id):
        # with self.swap(
        #     exp_fetchers, 'get_exploration_by_id',
        #     self.mock_get_exploration_by_id):
        suggestion_services.create_suggestion(
            suggestion_models.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            suggestion_models.TARGET_TYPE_EXPLORATION,
            self.target_id, self.target_version_at_submission,
            self.author_id, add_translation_change_dict, 'test description',
            self.reviewer_id)


        job_id = suggestion_jobs_one_off.SuggestionAuditOneOffJob.create_new()
        suggestion_jobs_one_off.SuggestionAuditOneOffJob.enqueue(job_id)
        self.process_and_flush_pending_tasks()

        actual_output = suggestion_jobs_one_off.SuggestionAuditOneOffJob.get_output(job_id)
        expected_output = [
            '[u\'1\', [u\'exp_id0 State2\']]',
            '[u\'2\', [u\'exp_id0 State1\']]'
        ]
        self.assertEqual(len(actual_output), 1)

    # def test_number_of_hints_tabulated_are_correct_in_multiple_exps(self):
    #     """Checks that correct number of hints are tabulated when
    #     there are multiple explorations.
    #     """
    #
    #     exploration1 = exp_domain.Exploration.create_default_exploration(
    #         self.VALID_EXP_ID, title='title', category='category')
    #
    #     exploration1.add_states(['State1', 'State2', 'State3'])
    #
    #     state1 = exploration1.states['State1']
    #     state2 = exploration1.states['State2']
    #
    #     hint_list1 = [
    #         state_domain.Hint(
    #             state_domain.SubtitledHtml(
    #                 'hint1', '<p>Hello, this is html1 for state1</p>')
    #         ),
    #         state_domain.Hint(
    #             state_domain.SubtitledHtml(
    #                 'hint2', '<p>Hello, this is html2 for state1</p>')
    #         ),
    #     ]
    #     hint_list2 = [
    #         state_domain.Hint(
    #             state_domain.SubtitledHtml(
    #                 'hint1', '<p>Hello, this is html1 for state2</p>'
    #             )
    #         )
    #     ]
    #
    #     state1.update_interaction_hints(hint_list1)
    #
    #     state2.update_interaction_hints(hint_list2)
    #
    #     exp_services.save_new_exploration(self.albert_id, exploration1)
    #
    #     exploration2 = exp_domain.Exploration.create_default_exploration(
    #         self.NEW_EXP_ID, title='title', category='category')
    #
    #     exploration2.add_states(['State1', 'State2'])
    #
    #     state1 = exploration2.states['State1']
    #
    #     hint_list1 = [
    #         state_domain.Hint(
    #             state_domain.SubtitledHtml(
    #                 'hint1', '<p>Hello, this is html1 for state1</p>'
    #             )
    #         ),
    #     ]
    #
    #     state1.update_interaction_hints(hint_list1)
    #
    #     exp_services.save_new_exploration(self.albert_id, exploration2)
    #
    #     # Start HintsAuditOneOff job on sample exploration.
    #     job_id = exp_jobs_one_off.HintsAuditOneOffJob.create_new()
    #     exp_jobs_one_off.HintsAuditOneOffJob.enqueue(job_id)
    #     self.process_and_flush_pending_tasks()
    #
    #     actual_output = exp_jobs_one_off.HintsAuditOneOffJob.get_output(job_id)
    #
    #     actual_output_dict = {}
    #
    #     for item in [ast.literal_eval(value) for value in actual_output]:
    #         actual_output_dict[item[0]] = set(item[1])
    #
    #     expected_output_dict = {
    #         '1': set(['exp_id0 State2', 'exp_id1 State1']),
    #         '2': set(['exp_id0 State1'])
    #     }
    #
    #     self.assertEqual(actual_output_dict, expected_output_dict)
    #
    # def test_no_action_is_performed_for_deleted_exploration(self):
    #     """Test that no action is performed on deleted explorations."""
    #
    #     exploration = exp_domain.Exploration.create_default_exploration(
    #         self.VALID_EXP_ID, title='title', category='category')
    #
    #     exploration.add_states(['State1'])
    #
    #     state1 = exploration.states['State1']
    #
    #     hint_list = [
    #         state_domain.Hint(
    #             state_domain.SubtitledHtml(
    #                 'hint1', '<p>Hello, this is html1 for state1</p>'
    #             )
    #         ),
    #         state_domain.Hint(
    #             state_domain.SubtitledHtml(
    #                 'hint2', '<p>Hello, this is html2 for state1</p>'
    #             )
    #         )
    #     ]
    #
    #     state1.update_interaction_hints(hint_list)
    #     exp_services.save_new_exploration(self.albert_id, exploration)
    #     exp_services.delete_exploration(self.albert_id, self.VALID_EXP_ID)
    #
    #     run_job_for_deleted_exp(self, exp_jobs_one_off.HintsAuditOneOffJob)
