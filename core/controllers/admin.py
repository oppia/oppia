# Copyright 2014 The Oppia Authors. All Rights Reserved.
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

"""Controllers for the admin view."""

from __future__ import annotations

import io
import logging
import random

from core import feconf
from core import utils
from core.constants import constants
from core.controllers import acl_decorators
from core.controllers import base
from core.controllers import domain_objects_validator as validation_method
from core.domain import auth_services
from core.domain import blog_services
from core.domain import classroom_config_domain
from core.domain import classroom_config_services
from core.domain import collection_services
from core.domain import config_domain
from core.domain import config_services
from core.domain import email_manager
from core.domain import exp_domain
from core.domain import exp_fetchers
from core.domain import exp_services
from core.domain import opportunity_services
from core.domain import platform_feature_services as feature_services
from core.domain import platform_parameter_domain as parameter_domain
from core.domain import question_domain
from core.domain import question_services
from core.domain import recommendations_services
from core.domain import rights_manager
from core.domain import role_services
from core.domain import search_services
from core.domain import skill_domain
from core.domain import skill_services
from core.domain import state_domain
from core.domain import stats_services
from core.domain import story_domain
from core.domain import story_services
from core.domain import subtopic_page_domain
from core.domain import subtopic_page_services
from core.domain import topic_domain
from core.domain import topic_fetchers
from core.domain import topic_services
from core.domain import user_services
from core.domain import wipeout_service

from typing import Dict, List, Optional, TypedDict, Union, cast


class ClassroomPageDataDict(TypedDict):
    """Dict representation of classroom page's data dictionary."""

    course_details: str
    name: str
    topic_ids: List[str]
    topic_list_intro: str
    url_fragment: str


AllowedAdminConfigPropertyValueTypes = Union[
    str, bool, float, Dict[str, str], List[str], ClassroomPageDataDict
]


class AdminPage(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
    """Admin page shown in the App Engine admin console."""

    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

    @acl_decorators.can_access_admin_page
    def get(self) -> None:
        """Handles GET requests."""

        self.render_template('admin-page.mainpage.html')


class AdminHandlerNormalizePayloadDict(TypedDict):
    """Dict representation of AdminHandler's normalized_payload
    dictionary.
    """

    action: Optional[str]
    exploration_id: Optional[str]
    collection_id: Optional[str]
    num_dummy_exps_to_generate: Optional[int]
    num_dummy_exps_to_publish: Optional[int]
    new_config_property_values: Optional[
        Dict[str, AllowedAdminConfigPropertyValueTypes]
    ]
    config_property_id: Optional[str]
    data: Optional[str]
    topic_id: Optional[str]
    feature_name: Optional[str]
    commit_message: Optional[str]
    new_rules: Optional[List[parameter_domain.PlatformParameterRule]]
    exp_id: Optional[str]


class AdminHandler(
    base.BaseHandler[AdminHandlerNormalizePayloadDict, Dict[str, str]]
):
    """Handler for the admin page."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS = {
        'GET': {},
        'POST': {
            'action': {
                'schema': {
                    'type': 'basestring',
                    'choices': [
                        'reload_exploration', 'reload_collection',
                        'generate_dummy_explorations', 'clear_search_index',
                        'generate_dummy_new_structures_data',
                        'generate_dummy_new_skill_data',
                        'generate_dummy_classroom',
                        'save_config_properties', 'revert_config_property',
                        'upload_topic_similarities',
                        'regenerate_topic_related_opportunities',
                        'update_feature_flag_rules',
                        'rollback_exploration_to_safe_state'
                    ]
                },
                # TODO(#13331): Remove default_value when it is confirmed that,
                # for clearing the search indices of exploration & collection
                # 'action' field must be provided in the payload.
                'default_value': None
            },
            'exploration_id': {
                'schema': {
                    'type': 'basestring'
                },
                'default_value': None
            },
            'collection_id': {
                'schema': {
                    'type': 'basestring'
                },
                'default_value': None
            },
            'num_dummy_exps_to_generate': {
                'schema': {
                    'type': 'int'
                },
                'default_value': None
            },
            'num_dummy_exps_to_publish': {
                'schema': {
                    'type': 'int'
                },
                'default_value': None
            },
            'new_config_property_values': {
                'schema': {
                    'type': 'object_dict',
                    'validation_method': (
                        validation_method.validate_new_config_property_values)
                },
                'default_value': None
            },
            'config_property_id': {
                'schema': {
                    'type': 'basestring'
                },
                'default_value': None
            },
            'data': {
                'schema': {
                    'type': 'basestring'
                },
                'default_value': None
            },
            'topic_id': {
                'schema': {
                    'type': 'basestring'
                },
                'default_value': None
            },
            'feature_name': {
                'schema': {
                    'type': 'basestring'
                },
                'default_value': None
            },
            'commit_message': {
                'schema': {
                    'type': 'basestring'
                },
                'default_value': None
            },
            'new_rules': {
                'schema': {
                    'type': 'list',
                    'items': {
                        'type': 'object_dict',
                        'object_class': parameter_domain.PlatformParameterRule
                    }
                },
                'default_value': None
            },
            'exp_id': {
                'schema': {
                    'type': 'basestring'
                },
                'default_value': None
            }
        }
    }

    @acl_decorators.can_access_admin_page
    def get(self) -> None:
        """Handles GET requests."""
        demo_exploration_ids = list(feconf.DEMO_EXPLORATIONS.keys())

        topic_summaries = topic_fetchers.get_all_topic_summaries()
        topic_summary_dicts = [
            summary.to_dict() for summary in topic_summaries]

        feature_flag_dicts = feature_services.get_all_feature_flag_dicts()

        config_properties = config_domain.Registry.get_config_property_schemas()
        # Removes promo-bar related configs as promo-bar is handled by
        # release coordinators in /release-coordinator page.
        del config_properties['promo_bar_enabled']
        del config_properties['promo_bar_message']

        # Remove blog related configs as they will be handled by 'blog admins'
        # on blog admin page.
        del config_properties['max_number_of_tags_assigned_to_blog_post']
        del config_properties['list_of_default_tags_for_blog_post']

        self.render_json({
            'config_properties': config_properties,
            'demo_collections': sorted(feconf.DEMO_COLLECTIONS.items()),
            'demo_explorations': sorted(feconf.DEMO_EXPLORATIONS.items()),
            'demo_exploration_ids': demo_exploration_ids,
            'updatable_roles': role_services.UPDATABLE_ROLES,
            'viewable_roles': role_services.VIEWABLE_ROLES,
            'human_readable_roles': role_services.HUMAN_READABLE_ROLES,
            'role_to_actions': role_services.get_role_actions(),
            'topic_summaries': topic_summary_dicts,
            'feature_flags': feature_flag_dicts,
        })

    @acl_decorators.can_access_admin_page
    def post(self) -> None:
        """Handles POST requests."""
        assert self.user_id is not None
        assert self.normalized_payload is not None
        action = self.normalized_payload.get('action')
        try:
            result = {}
            if action == 'reload_exploration':
                exploration_id = self.normalized_payload.get('exploration_id')
                if exploration_id is None:
                    raise Exception(
                        'The \'exploration_id\' must be provided when the'
                        ' action is reload_exploration.'
                    )
                self._reload_exploration(exploration_id)
            elif action == 'reload_collection':
                collection_id = self.normalized_payload.get('collection_id')
                if collection_id is None:
                    raise Exception(
                        'The \'collection_id\' must be provided when the'
                        ' action is reload_collection.'
                    )
                self._reload_collection(collection_id)
            elif action == 'generate_dummy_explorations':
                num_dummy_exps_to_generate = self.normalized_payload.get(
                    'num_dummy_exps_to_generate')
                if num_dummy_exps_to_generate is None:
                    raise Exception(
                        'The \'num_dummy_exps_to_generate\' must be provided'
                        ' when the action is generate_dummy_explorations.'
                    )
                num_dummy_exps_to_publish = self.normalized_payload.get(
                    'num_dummy_exps_to_publish')
                if num_dummy_exps_to_publish is None:
                    raise Exception(
                        'The \'num_dummy_exps_to_publish\' must be provided'
                        ' when the action is generate_dummy_explorations.'
                    )

                if num_dummy_exps_to_generate < num_dummy_exps_to_publish:
                    raise self.InvalidInputException(
                        'Generate count cannot be less than publish count')

                self._generate_dummy_explorations(
                    num_dummy_exps_to_generate, num_dummy_exps_to_publish)
            elif action == 'clear_search_index':
                search_services.clear_collection_search_index()
                search_services.clear_exploration_search_index()
                search_services.clear_blog_post_summaries_search_index()
            elif action == 'generate_dummy_new_structures_data':
                self._load_dummy_new_structures_data()
            elif action == 'generate_dummy_new_skill_data':
                self._generate_dummy_skill_and_questions()
            elif action == 'generate_dummy_classroom':
                self._generate_dummy_classroom()
            elif action == 'save_config_properties':
                new_config_property_values = self.normalized_payload.get(
                    'new_config_property_values')
                if new_config_property_values is None:
                    raise Exception(
                        'The \'new_config_property_values\' must be provided'
                        ' when the action is save_config_properties.'
                    )
                logging.info(
                    '[ADMIN] %s saved config property values: %s' %
                    (self.user_id, new_config_property_values))
                for (name, value) in new_config_property_values.items():
                    config_services.set_property(self.user_id, name, value)
            elif action == 'revert_config_property':
                config_property_id = self.normalized_payload.get(
                    'config_property_id')
                if config_property_id is None:
                    raise Exception(
                        'The \'config_property_id\' must be provided'
                        ' when the action is revert_config_property.'
                    )
                logging.info(
                    '[ADMIN] %s reverted config property: %s' %
                    (self.user_id, config_property_id))
                config_services.revert_property(
                    self.user_id, config_property_id)
            elif action == 'upload_topic_similarities':
                data = self.normalized_payload.get('data')
                if data is None:
                    raise Exception(
                        'The \'data\' must be provided when the action'
                        ' is upload_topic_similarities.'
                    )
                recommendations_services.update_topic_similarities(data)
            elif action == 'regenerate_topic_related_opportunities':
                topic_id = self.normalized_payload.get('topic_id')
                if topic_id is None:
                    raise Exception(
                        'The \'topic_id\' must be provided when the action'
                        ' is regenerate_topic_related_opportunities.'
                    )
                opportunities_count = (
                    opportunity_services
                    .regenerate_opportunities_related_to_topic(
                        topic_id, delete_existing_opportunities=True))
                result = {
                    'opportunities_count': opportunities_count
                }
            elif action == 'rollback_exploration_to_safe_state':
                exp_id = self.normalized_payload.get('exp_id')
                if exp_id is None:
                    raise Exception(
                        'The \'exp_id\' must be provided when the action'
                        ' is rollback_exploration_to_safe_state.'
                    )
                version = (
                    exp_services.rollback_exploration_to_safe_state(exp_id))
                result = {
                    'version': version
                }
            else:
                # The handler schema defines the possible values of 'action'.
                # If 'action' has a value other than those defined in the
                # schema, a Bad Request error will be thrown. Hence, 'action'
                # must be 'update_feature_flag_rules' if this branch is
                # executed.
                assert action == 'update_feature_flag_rules'
                feature_name = self.normalized_payload.get('feature_name')
                if feature_name is None:
                    raise Exception(
                        'The \'feature_name\' must be provided when the action'
                        ' is update_feature_flag_rules.'
                    )
                new_rules = self.normalized_payload.get('new_rules')
                if new_rules is None:
                    raise Exception(
                        'The \'new_rules\' must be provided when the action'
                        ' is update_feature_flag_rules.'
                    )
                commit_message = self.normalized_payload.get('commit_message')
                if commit_message is None:
                    raise Exception(
                        'The \'commit_message\' must be provided when the '
                        'action is update_feature_flag_rules.'
                    )

                try:
                    feature_services.update_feature_flag_rules(
                        feature_name, self.user_id, commit_message,
                        new_rules)
                except (
                        utils.ValidationError,
                        feature_services.FeatureFlagNotFoundException) as e:
                    raise self.InvalidInputException(e)

                new_rule_dicts = [rules.to_dict() for rules in new_rules]
                logging.info(
                    '[ADMIN] %s updated feature %s with new rules: '
                    '%s.' % (self.user_id, feature_name, new_rule_dicts))
            self.render_json(result)
        except Exception as e:
            logging.exception('[ADMIN] %s', e)
            self.render_json({'error': str(e)})
            raise e

    def _reload_exploration(self, exploration_id: str) -> None:
        """Reloads the exploration in dev_mode corresponding to the given
        exploration id.

        Args:
            exploration_id: str. The exploration id.

        Raises:
            Exception. Cannot reload an exploration in production.
        """
        if constants.DEV_MODE:
            logging.info(
                '[ADMIN] %s reloaded exploration %s' %
                (self.user_id, exploration_id))
            exp_services.load_demo(exploration_id)
            rights_manager.release_ownership_of_exploration(
                user_services.get_system_user(), exploration_id)
        else:
            raise Exception('Cannot reload an exploration in production.')

    def _create_dummy_question(
        self,
        question_id: str,
        question_content: str,
        linked_skill_ids: List[str]
    ) -> question_domain.Question:
        """Creates a dummy question object with the given question ID.

        Args:
            question_id: str. The ID of the question to be created.
            question_content: str. The question content.
            linked_skill_ids: list(str). The IDs of the skills to which the
                question is linked to.

        Returns:
            Question. The dummy question with given values.
        """
        state = state_domain.State.create_default_state(
            'ABC', is_initial_state=True)
        state.update_interaction_id('TextInput')
        state.update_interaction_customization_args({
            'placeholder': {
                'value': {
                    'content_id': 'ca_placeholder_0',
                    'unicode_str': ''
                }
            },
            'rows': {'value': 1}
        })

        state.update_next_content_id_index(1)
        state.update_linked_skill_id(None)
        state.update_content(state_domain.SubtitledHtml('1', question_content))
        recorded_voiceovers = state_domain.RecordedVoiceovers({})
        written_translations = state_domain.WrittenTranslations({})
        recorded_voiceovers.add_content_id_for_voiceover('ca_placeholder_0')
        recorded_voiceovers.add_content_id_for_voiceover('1')
        recorded_voiceovers.add_content_id_for_voiceover('default_outcome')
        written_translations.add_content_id_for_translation('ca_placeholder_0')
        written_translations.add_content_id_for_translation('1')
        written_translations.add_content_id_for_translation('default_outcome')

        state.update_recorded_voiceovers(recorded_voiceovers)
        state.update_written_translations(written_translations)
        solution = state_domain.Solution(
            'TextInput', False, 'Solution', state_domain.SubtitledHtml(
                'solution', '<p>This is a solution.</p>'))
        hints_list = [
            state_domain.Hint(
                state_domain.SubtitledHtml('hint_1', '<p>This is a hint.</p>')
            )
        ]

        state.update_interaction_solution(solution)
        state.update_interaction_hints(hints_list)
        state.update_interaction_default_outcome(
            state_domain.Outcome(
                None, None, state_domain.SubtitledHtml(
                    'feedback_id', '<p>Dummy Feedback</p>'),
                True, [], None, None
            )
        )
        question = question_domain.Question(
            question_id, state,
            feconf.CURRENT_STATE_SCHEMA_VERSION,
            constants.DEFAULT_LANGUAGE_CODE, 0, linked_skill_ids, [])
        return question

    def _create_dummy_skill(
        self, skill_id: str, skill_description: str, explanation: str
    ) -> skill_domain.Skill:
        """Creates a dummy skill object with the given values.

        Args:
            skill_id: str. The ID of the skill to be created.
            skill_description: str. The description of the skill.
            explanation: str. The review material for the skill.

        Returns:
            Skill. The dummy skill with given values.
        """
        rubrics = [
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[0], ['Explanation 1']),
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[1], ['Explanation 2']),
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[2], ['Explanation 3'])]
        skill = skill_domain.Skill.create_default_skill(
            skill_id, skill_description, rubrics)
        skill.update_explanation(state_domain.SubtitledHtml('1', explanation))
        return skill

    def _load_dummy_new_structures_data(self) -> None:
        """Loads the database with two topics (one of which is empty), a story
        and three skills in the topic (two of them in a subtopic) and a question
        attached to each skill.

        Raises:
            Exception. Cannot load new structures data in production mode.
            Exception. User does not have enough rights to generate data.
        """
        assert self.user_id is not None
        if constants.DEV_MODE:
            if feconf.ROLE_ID_CURRICULUM_ADMIN not in self.user.roles:
                raise Exception(
                    'User does not have enough rights to generate data.')
            topic_id_1 = topic_fetchers.get_new_topic_id()
            topic_id_2 = topic_fetchers.get_new_topic_id()
            story_id = story_services.get_new_story_id()
            skill_id_1 = skill_services.get_new_skill_id()
            skill_id_2 = skill_services.get_new_skill_id()
            skill_id_3 = skill_services.get_new_skill_id()
            question_id_1 = question_services.get_new_question_id()
            question_id_2 = question_services.get_new_question_id()
            question_id_3 = question_services.get_new_question_id()

            skill_1 = self._create_dummy_skill(
                skill_id_1, 'Dummy Skill 1', '<p>Dummy Explanation 1</p>')
            skill_2 = self._create_dummy_skill(
                skill_id_2, 'Dummy Skill 2', '<p>Dummy Explanation 2</p>')
            skill_3 = self._create_dummy_skill(
                skill_id_3, 'Dummy Skill 3', '<p>Dummy Explanation 3</p>')

            question_1 = self._create_dummy_question(
                question_id_1, 'Question 1', [skill_id_1])
            question_2 = self._create_dummy_question(
                question_id_2, 'Question 2', [skill_id_2])
            question_3 = self._create_dummy_question(
                question_id_3, 'Question 3', [skill_id_3])
            question_services.add_question(self.user_id, question_1)
            question_services.add_question(self.user_id, question_2)
            question_services.add_question(self.user_id, question_3)

            question_services.create_new_question_skill_link(
                self.user_id, question_id_1, skill_id_1, 0.3)
            question_services.create_new_question_skill_link(
                self.user_id, question_id_2, skill_id_2, 0.5)
            question_services.create_new_question_skill_link(
                self.user_id, question_id_3, skill_id_3, 0.7)

            topic_1 = topic_domain.Topic.create_default_topic(
                topic_id_1, 'Dummy Topic 1', 'dummy-topic-one', 'description',
                'fragm')
            topic_2 = topic_domain.Topic.create_default_topic(
                topic_id_2, 'Empty Topic', 'empty-topic', 'description',
                'fragm')

            topic_1.add_canonical_story(story_id)
            topic_1.add_uncategorized_skill_id(skill_id_1)
            topic_1.add_uncategorized_skill_id(skill_id_2)
            topic_1.add_uncategorized_skill_id(skill_id_3)
            topic_1.add_subtopic(1, 'Dummy Subtopic Title', 'dummysubtopic')
            topic_1.move_skill_id_to_subtopic(None, 1, skill_id_2)
            topic_1.move_skill_id_to_subtopic(None, 1, skill_id_3)

            subtopic_page = (
                subtopic_page_domain.SubtopicPage.create_default_subtopic_page(
                    1, topic_id_1))
            # These explorations were chosen since they pass the validations
            # for published stories.
            self._reload_exploration('6')
            self._reload_exploration('25')
            self._reload_exploration('13')
            exp_services.update_exploration(
                self.user_id, '6', [exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                    'property_name': 'correctness_feedback_enabled',
                    'new_value': True
                })], 'Changed correctness_feedback_enabled.')
            exp_services.update_exploration(
                self.user_id, '25', [exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                    'property_name': 'correctness_feedback_enabled',
                    'new_value': True
                })], 'Changed correctness_feedback_enabled.')
            exp_services.update_exploration(
                self.user_id, '13', [exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                    'property_name': 'correctness_feedback_enabled',
                    'new_value': True
                })], 'Changed correctness_feedback_enabled.')

            story = story_domain.Story.create_default_story(
                story_id, 'Help Jaime win the Arcade', 'Description',
                topic_id_1, 'help-jamie-win-arcade')

            story_node_dicts = [{
                'exp_id': '6',
                'title': 'What are the place values?',
                'description': 'Jaime learns the place value of each digit ' +
                               'in a big number.'
            }, {
                'exp_id': '25',
                'title': 'Finding the value of a number',
                'description': 'Jaime understands the value of his ' +
                               'arcade score.'
            }, {
                'exp_id': '13',
                'title': 'Comparing Numbers',
                'description': 'Jaime learns if a number is smaller or ' +
                               'greater than another number.'
            }]

            def generate_dummy_story_nodes(
                node_id: int, exp_id: str, title: str, description: str
            ) -> None:
                """Generates and connects sequential story nodes.

                Args:
                    node_id: int. The node id.
                    exp_id: str. The exploration id.
                    title: str. The title of the story node.
                    description: str. The description of the story node.
                """
                assert self.user_id is not None
                story.add_node(
                    '%s%d' % (story_domain.NODE_ID_PREFIX, node_id),
                    title)
                story.update_node_description(
                    '%s%d' % (story_domain.NODE_ID_PREFIX, node_id),
                    description)
                story.update_node_exploration_id(
                    '%s%d' % (story_domain.NODE_ID_PREFIX, node_id), exp_id)

                if node_id != len(story_node_dicts):
                    story.update_node_destination_node_ids(
                        '%s%d' % (story_domain.NODE_ID_PREFIX, node_id),
                        ['%s%d' % (story_domain.NODE_ID_PREFIX, node_id + 1)])

                exp_services.update_exploration(
                    self.user_id, exp_id, [exp_domain.ExplorationChange({
                        'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
                        'property_name': 'category',
                        'new_value': 'Astronomy'
                    })], 'Change category')

            for i, story_node_dict in enumerate(story_node_dicts):
                generate_dummy_story_nodes(i + 1, **story_node_dict)

            skill_services.save_new_skill(self.user_id, skill_1)
            skill_services.save_new_skill(self.user_id, skill_2)
            skill_services.save_new_skill(self.user_id, skill_3)
            story_services.save_new_story(self.user_id, story)
            topic_services.save_new_topic(self.user_id, topic_1)
            topic_services.save_new_topic(self.user_id, topic_2)
            subtopic_page_services.save_subtopic_page(
                self.user_id, subtopic_page, 'Added subtopic',
                [topic_domain.TopicChange({
                    'cmd': topic_domain.CMD_ADD_SUBTOPIC,
                    'subtopic_id': 1,
                    'title': 'Dummy Subtopic Title',
                    'url_fragment': 'dummy-fragment'
                })]
            )

            # Generates translation opportunities for the Contributor Dashboard.
            exp_ids_in_story = story.story_contents.get_all_linked_exp_ids()
            opportunity_services.add_new_exploration_opportunities(
                story_id, exp_ids_in_story)

            topic_services.publish_story(topic_id_1, story_id, self.user_id)
        else:
            raise Exception('Cannot load new structures data in production.')

    def _generate_dummy_skill_and_questions(self) -> None:
        """Generate and loads the database with a skill and 15 questions
        linked to the skill.

        Raises:
            Exception. Cannot load new structures data in production mode.
            Exception. User does not have enough rights to generate data.
        """
        assert self.user_id is not None
        if constants.DEV_MODE:
            if feconf.ROLE_ID_CURRICULUM_ADMIN not in self.user.roles:
                raise Exception(
                    'User does not have enough rights to generate data.')
            skill_id = skill_services.get_new_skill_id()
            skill_name = 'Dummy Skill %s' % str(random.getrandbits(32))
            skill = self._create_dummy_skill(
                skill_id, skill_name, '<p>Dummy Explanation 1</p>')
            skill_services.save_new_skill(self.user_id, skill)
            for i in range(15):
                question_id = question_services.get_new_question_id()
                question_name = 'Question number %s %s' % (str(i), skill_name)
                question = self._create_dummy_question(
                    question_id, question_name, [skill_id])
                question_services.add_question(self.user_id, question)
                question_difficulty = list(
                    constants.SKILL_DIFFICULTY_LABEL_TO_FLOAT.values())
                random_difficulty = random.choice(question_difficulty)
                question_services.create_new_question_skill_link(
                    self.user_id, question_id, skill_id, random_difficulty)
        else:
            raise Exception('Cannot generate dummy skills in production.')

    def _reload_collection(self, collection_id: str) -> None:
        """Reloads the collection in dev_mode corresponding to the given
        collection id.

        Args:
            collection_id: str. The collection id.

        Raises:
            Exception. Cannot reload a collection in production.
        """
        assert self.user_id is not None
        if constants.DEV_MODE:
            logging.info(
                '[ADMIN] %s reloaded collection %s' %
                (self.user_id, collection_id))
            collection_services.load_demo(collection_id)
            rights_manager.release_ownership_of_collection(
                user_services.get_system_user(), collection_id)
        else:
            raise Exception('Cannot reload a collection in production.')

    def _generate_dummy_explorations(
        self, num_dummy_exps_to_generate: int, num_dummy_exps_to_publish: int
    ) -> None:
        """Generates and publishes the given number of dummy explorations.

        Args:
            num_dummy_exps_to_generate: int. Count of dummy explorations to
                be generated.
            num_dummy_exps_to_publish: int. Count of explorations to
                be published.

        Raises:
            Exception. Environment is not DEVMODE.
        """
        assert self.user_id is not None
        if constants.DEV_MODE:
            logging.info(
                '[ADMIN] %s generated %s number of dummy explorations' %
                (self.user_id, num_dummy_exps_to_generate))
            possible_titles = ['Hulk Neuroscience', 'Quantum Starks',
                               'Wonder Anatomy',
                               'Elvish, language of "Lord of the Rings',
                               'The Science of Superheroes']
            exploration_ids_to_publish = []
            for i in range(num_dummy_exps_to_generate):
                title = random.choice(possible_titles)
                category = random.choice(constants.SEARCH_DROPDOWN_CATEGORIES)
                new_exploration_id = exp_fetchers.get_new_exploration_id()
                exploration = exp_domain.Exploration.create_default_exploration(
                    new_exploration_id, title=title, category=category,
                    objective='Dummy Objective')
                exp_services.save_new_exploration(self.user_id, exploration)
                if i <= num_dummy_exps_to_publish - 1:
                    exploration_ids_to_publish.append(new_exploration_id)
                    rights_manager.publish_exploration(
                        self.user, new_exploration_id)
            exp_services.index_explorations_given_ids(
                exploration_ids_to_publish)
        else:
            raise Exception('Cannot generate dummy explorations in production.')

    def _generate_dummy_classroom(self) -> None:
        """Generate and loads the database with a classroom.

        Raises:
            Exception. Cannot generate dummy classroom in production.
            Exception. User does not have enough rights to generate data.
        """
        assert self.user_id is not None
        if constants.DEV_MODE:
            if feconf.ROLE_ID_CURRICULUM_ADMIN not in self.user.roles:
                raise Exception(
                    'User does not have enough rights to generate data.')
            logging.info(
                '[ADMIN] %s generated dummy classroom.' % self.user_id)

            topic_id_1 = topic_fetchers.get_new_topic_id()
            topic_id_2 = topic_fetchers.get_new_topic_id()
            topic_id_3 = topic_fetchers.get_new_topic_id()
            topic_id_4 = topic_fetchers.get_new_topic_id()
            topic_id_5 = topic_fetchers.get_new_topic_id()
            topic_id_6 = topic_fetchers.get_new_topic_id()

            skill_id_1 = skill_services.get_new_skill_id()
            skill_id_2 = skill_services.get_new_skill_id()
            skill_id_3 = skill_services.get_new_skill_id()
            skill_id_4 = skill_services.get_new_skill_id()
            skill_id_5 = skill_services.get_new_skill_id()
            skill_id_6 = skill_services.get_new_skill_id()

            topic_1 = topic_domain.Topic.create_default_topic(
                topic_id_1, 'Topic1', 'topic-one', 'description', 'fragm')
            topic_2 = topic_domain.Topic.create_default_topic(
                topic_id_2, 'Topic2', 'topic-two', 'description', 'fragm')
            topic_3 = topic_domain.Topic.create_default_topic(
                topic_id_3, 'Topic3', 'topic-three', 'description', 'fragm')
            topic_4 = topic_domain.Topic.create_default_topic(
                topic_id_4, 'Topic4', 'topic-four', 'description', 'fragm')
            topic_5 = topic_domain.Topic.create_default_topic(
                topic_id_5, 'Topic5', 'topic-five', 'description', 'fragm')
            topic_6 = topic_domain.Topic.create_default_topic(
                topic_id_6, 'Topic6', 'topic-six', 'description', 'fragm')

            skill_1 = self._create_dummy_skill(
                skill_id_1, 'Skill1', '<p>Dummy Explanation 1</p>')
            skill_2 = self._create_dummy_skill(
                skill_id_2, 'Skill2', '<p>Dummy Explanation 2</p>')
            skill_3 = self._create_dummy_skill(
                skill_id_3, 'Skill3', '<p>Dummy Explanation 3</p>')
            skill_4 = self._create_dummy_skill(
                skill_id_4, 'Skill4', '<p>Dummy Explanation 4</p>')
            skill_5 = self._create_dummy_skill(
                skill_id_5, 'Skill5', '<p>Dummy Explanation 5</p>')
            skill_6 = self._create_dummy_skill(
                skill_id_6, 'Skill6', '<p>Dummy Explanation 6</p>')

            skill_services.save_new_skill(self.user_id, skill_1)
            skill_services.save_new_skill(self.user_id, skill_2)
            skill_services.save_new_skill(self.user_id, skill_3)
            skill_services.save_new_skill(self.user_id, skill_4)
            skill_services.save_new_skill(self.user_id, skill_5)
            skill_services.save_new_skill(self.user_id, skill_6)

            topic_1.add_uncategorized_skill_id(skill_id_1)
            topic_2.add_uncategorized_skill_id(skill_id_2)
            topic_3.add_uncategorized_skill_id(skill_id_3)
            topic_4.add_uncategorized_skill_id(skill_id_4)
            topic_5.add_uncategorized_skill_id(skill_id_5)
            topic_6.add_uncategorized_skill_id(skill_id_6)

            topic_services.save_new_topic(self.user_id, topic_1)
            topic_services.save_new_topic(self.user_id, topic_2)
            topic_services.save_new_topic(self.user_id, topic_3)
            topic_services.save_new_topic(self.user_id, topic_4)
            topic_services.save_new_topic(self.user_id, topic_5)
            topic_services.save_new_topic(self.user_id, topic_6)

            classroom_id_1 = classroom_config_services.get_new_classroom_id()
            classroom_id_2 = classroom_config_services.get_new_classroom_id()

            classroom_name_1 = 'Dummy Classroom with 5 topics'
            classroom_name_2 = 'Dummy Classroom with 1 topic'

            classroom_url_fragment_1 = 'first-classroom'
            classroom_url_fragment_2 = 'second-classroom'

            topic_dependency_for_classroom_1: Dict[str, list[str]] = {
                topic_id_1: [],
                topic_id_2: [topic_id_1],
                topic_id_3: [topic_id_1],
                topic_id_4: [topic_id_2],
                topic_id_5: [topic_id_3]
            }
            topic_dependency_for_classroom_2: Dict[str, List[str]] = {
                topic_id_6: []
            }

            classroom_dict_1: classroom_config_domain.ClassroomDict = {
                'classroom_id': classroom_id_1,
                'name': classroom_name_1,
                'url_fragment': classroom_url_fragment_1,
                'course_details': '',
                'topic_list_intro': '',
                'topic_id_to_prerequisite_topic_ids': (
                    topic_dependency_for_classroom_1)
            }
            classroom_dict_2: classroom_config_domain.ClassroomDict = {
                'classroom_id': classroom_id_2,
                'name': classroom_name_2,
                'url_fragment': classroom_url_fragment_2,
                'course_details': '',
                'topic_list_intro': '',
                'topic_id_to_prerequisite_topic_ids': (
                    topic_dependency_for_classroom_2)
            }

            classroom_1 = classroom_config_domain.Classroom.from_dict(
                classroom_dict_1)
            classroom_2 = classroom_config_domain.Classroom.from_dict(
                classroom_dict_2)

            classroom_config_services.update_or_create_classroom_model(
                classroom_1)
            classroom_config_services.update_or_create_classroom_model(
                classroom_2)
        else:
            raise Exception('Cannot generate dummy classroom in production.')


class AdminRoleHandlerNormalizedGetRequestDict(TypedDict):
    """Dict representation of AdminRoleHandler's GET normalized_request
    dictionary.
    """

    filter_criterion: str
    role: Optional[str]
    username: Optional[str]


class AdminRoleHandlerNormalizedDeleteRequestDict(TypedDict):
    """Dict representation of AdminRoleHandler's DELETE normalized_request
    dictionary.
    """

    role: str
    username: str


class AdminRoleHandlerNormalizedPayloadDict(TypedDict):
    """Dict representation of AdminRoleHandler's normalized_payload
    dictionary.
    """

    role: str
    username: str


class AdminRoleHandler(
    base.BaseHandler[
        AdminRoleHandlerNormalizedPayloadDict,
        Union[
            AdminRoleHandlerNormalizedGetRequestDict,
            AdminRoleHandlerNormalizedDeleteRequestDict
        ]
    ]
):
    """Handler for roles tab of admin page. Used to view and update roles."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS = {
        'GET': {
            'filter_criterion': {
                'schema': {
                    'type': 'basestring',
                    'choices': [
                        feconf.USER_FILTER_CRITERION_ROLE,
                        feconf.USER_FILTER_CRITERION_USERNAME
                    ]
                }
            },
            'role': {
                'schema': {
                    'type': 'basestring',
                    'choices': role_services.VIEWABLE_ROLES
                },
                'default_value': None
            },
            'username': {
                'schema': {
                    'type': 'basestring'
                },
                'default_value': None
            }
        },
        'PUT': {
            'role': {
                'schema': {
                    'type': 'basestring',
                    'choices': feconf.ALLOWED_USER_ROLES
                }
            },
            'username': {
                'schema': {
                    'type': 'basestring'
                }
            }
        },
        'DELETE': {
            'role': {
                'schema': {
                    'type': 'basestring',
                    'choices': feconf.ALLOWED_USER_ROLES
                }
            },
            'username': {
                'schema': {
                    'type': 'basestring'
                }
            }
        }
    }

    @acl_decorators.can_access_admin_page
    def get(self) -> None:
        assert self.user_id is not None
        # Here we use cast because we are narrowing down the type of
        # 'normalized_request' from Union of request TypedDicts to a
        # particular TypedDict that was defined according to the schemas.
        # So that the type of fetched values is not considered as Any type.
        request_data = cast(
            AdminRoleHandlerNormalizedGetRequestDict,
            self.normalized_request
        )
        filter_criterion = request_data['filter_criterion']
        if filter_criterion == feconf.USER_FILTER_CRITERION_ROLE:
            role = request_data.get(feconf.USER_FILTER_CRITERION_ROLE)
            if role is None:
                raise Exception(
                    'The role must be provided when the filter criterion '
                    'is \'role\'.'
                )
            role_services.log_role_query(
                self.user_id, feconf.ROLE_ACTION_VIEW_BY_ROLE,
                role=role)
            self.render_json({
                'usernames': (
                    user_services.get_usernames_by_role(role) if role else []
                )
            })
        else:
            # The handler schema defines the possible values of
            # 'filter_criterion'. If 'filter_criterion' has a value other than
            # those defined in the schema, a Bad Request error will be thrown.
            # Hence, 'filter_criterion' must be
            # 'feconf.USER_FILTER_CRITERION_USERNAME' if this branch is
            # executed.
            assert filter_criterion == (
                feconf.USER_FILTER_CRITERION_USERNAME)
            username = request_data.get(feconf.USER_FILTER_CRITERION_USERNAME)
            if username is None:
                raise Exception(
                    'The username must be provided when the filter criterion '
                    'is \'username\'.'
                )
            user_id = (
                user_services.get_user_id_from_username(username)
            )
            role_services.log_role_query(
                self.user_id, feconf.ROLE_ACTION_VIEW_BY_USERNAME,
                username=username)
            if user_id is None:
                raise self.InvalidInputException(
                    'User with given username does not exist.')

            user_settings = user_services.get_user_settings(user_id)
            user_roles = user_settings.roles
            managed_topic_ids = []
            if feconf.ROLE_ID_TOPIC_MANAGER in user_roles:
                managed_topic_ids = [
                    rights.id for rights in
                    topic_fetchers.get_topic_rights_with_user(user_id)]
            user_roles_dict = {
                'roles': user_roles,
                'managed_topic_ids': managed_topic_ids,
                'banned': user_settings.banned
            }
            self.render_json(user_roles_dict)

    @acl_decorators.can_access_admin_page
    def put(self) -> None:
        assert self.normalized_payload is not None
        username = self.normalized_payload['username']
        role = self.normalized_payload['role']
        user_settings = user_services.get_user_settings_from_username(username)

        if user_settings is None:
            raise self.InvalidInputException(
                'User with given username does not exist.')

        if role == feconf.ROLE_ID_TOPIC_MANAGER:
            # The Topic manager role assignment is handled via
            # TopicManagerRoleHandler.
            raise self.InvalidInputException(
                'Unsupported role for this handler.')

        user_services.add_user_role(user_settings.user_id, role)

        self.render_json({})

    @acl_decorators.can_access_admin_page
    def delete(self) -> None:
        # Here we use cast because we are narrowing down the type of
        # 'normalized_request' from Union of request TypedDicts to a
        # particular TypedDict that was defined according to the schemas.
        # So that the type of fetched values is not considered as Any type.
        request_data = cast(
            AdminRoleHandlerNormalizedDeleteRequestDict,
            self.normalized_request
        )
        username = request_data['username']
        role = request_data['role']

        user_id = user_services.get_user_id_from_username(username)
        if user_id is None:
            raise self.InvalidInputException(
                'User with given username does not exist.')

        if role == feconf.ROLE_ID_TOPIC_MANAGER:
            topic_services.deassign_user_from_all_topics(self.user, user_id)

        user_services.remove_user_role(user_id, role)

        self.render_json({})


class TopicManagerRoleHandlerNormalizedPayloadDict(TypedDict):
    """Dict representation of TopicManagerRoleHandler's normalized_payload
    dictionary.
    """

    username: str
    action: str
    topic_id: str


class TopicManagerRoleHandler(
    base.BaseHandler[
        TopicManagerRoleHandlerNormalizedPayloadDict, Dict[str, str]
    ]
):
    """Handler to assign or deassigning manager to a topic."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS = {
        'PUT': {
            'username': {
                'schema': {
                    'type': 'basestring'
                }
            },
            'action': {
                'schema': {
                    'type': 'basestring',
                    'choices': ['assign', 'deassign']
                }
            },
            'topic_id': {
                'schema': {
                    'type': 'basestring'
                }
            }
        }
    }

    @acl_decorators.can_access_admin_page
    def put(self) -> None:
        assert self.normalized_payload is not None
        username = self.normalized_payload['username']
        action = self.normalized_payload['action']
        topic_id = self.normalized_payload['topic_id']

        user_settings = user_services.get_user_settings_from_username(username)

        if user_settings is None:
            raise self.InvalidInputException(
                'User with given username does not exist.')

        user_id = user_settings.user_id
        if action == 'assign':
            if not feconf.ROLE_ID_TOPIC_MANAGER in user_settings.roles:
                user_services.add_user_role(
                    user_id, feconf.ROLE_ID_TOPIC_MANAGER)

            topic_manager = user_services.get_user_actions_info(user_id)
            topic_services.assign_role(
                user_services.get_system_user(),
                topic_manager, topic_domain.ROLE_MANAGER, topic_id)
        else:
            # The handler schema defines the possible values of 'action'.
            # If 'action' has a value other than those defined in the schema,
            # a Bad Request error will be thrown. Hence, 'action' must be
            # 'deassign' if this branch is executed.
            assert action == 'deassign'
            topic_services.deassign_manager_role_from_topic(
                user_services.get_system_user(), user_id, topic_id)

            # The case where user does not have manager rights it will be
            # caught before in topic_services.deassign_manager_role_from_topic
            # method.
            assert not topic_fetchers.get_topic_rights_with_user(user_id)
            user_services.remove_user_role(
                user_id, feconf.ROLE_ID_TOPIC_MANAGER)

        self.render_json({})


class BannedUsersHandlerNormalizedPayloadDict(TypedDict):
    """Dict representation of BannedUsersHandler's normalized_payload
    dictionary.
    """

    username: str


class BannedUsersHandlerNormalizedRequestDict(TypedDict):
    """Dict representation of BannedUsersHandler's normalized_request
    dictionary.
    """

    username: str


class BannedUsersHandler(
    base.BaseHandler[
        BannedUsersHandlerNormalizedPayloadDict,
        BannedUsersHandlerNormalizedRequestDict
    ]
):
    """Handler to ban and unban users."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS = {
        'PUT': {
            'username': {
                'schema': {
                    'type': 'basestring'
                }
            }
        },
        'DELETE': {
            'username': {
                'schema': {
                    'type': 'basestring'
                }
            }
        }
    }

    @acl_decorators.can_access_admin_page
    def put(self) -> None:
        assert self.normalized_payload is not None
        username = self.normalized_payload['username']
        user_id = user_services.get_user_id_from_username(username)

        if user_id is None:
            raise self.InvalidInputException(
                'User with given username does not exist.')
        topic_services.deassign_user_from_all_topics(self.user, user_id)
        user_services.mark_user_banned(user_id)

        self.render_json({})

    @acl_decorators.can_access_admin_page
    def delete(self) -> None:
        assert self.normalized_request is not None
        username = self.normalized_request['username']
        user_id = user_services.get_user_id_from_username(username)

        if user_id is None:
            raise self.InvalidInputException(
                'User with given username does not exist.')
        user_services.unmark_user_banned(user_id)

        self.render_json({})


class AdminSuperAdminPrivilegesHandlerNormalizedPayloadDict(TypedDict):
    """Dict representation of AdminSuperAdminPrivilegesHandler's
    normalized_payload dictionary.
    """

    username: str


class AdminSuperAdminPrivilegesHandlerNormalizedRequestDict(TypedDict):
    """Dict representation of AdminSuperAdminPrivilegesHandler's
    normalized_request dictionary.
    """

    username: str


class AdminSuperAdminPrivilegesHandler(
    base.BaseHandler[
        AdminSuperAdminPrivilegesHandlerNormalizedPayloadDict,
        AdminSuperAdminPrivilegesHandlerNormalizedRequestDict
    ]
):
    """Handler for granting a user super admin privileges."""

    PUT_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    DELETE_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS = {
        'PUT': {
            'username': {
                'schema': {
                    'type': 'basestring'
                }
            }
        },
        'DELETE': {
            'username': {
                'schema': {
                    'type': 'basestring'
                }
            }
        }
    }

    @acl_decorators.can_access_admin_page
    def put(self) -> None:
        assert self.normalized_payload is not None
        if self.email != feconf.ADMIN_EMAIL_ADDRESS:
            raise self.UnauthorizedUserException(
                'Only the default system admin can manage super admins')
        username = self.normalized_payload['username']

        user_id = user_services.get_user_id_from_username(username)
        if user_id is None:
            raise self.InvalidInputException('No such user exists')

        auth_services.grant_super_admin_privileges(user_id)
        self.render_json(self.values)

    @acl_decorators.can_access_admin_page
    def delete(self) -> None:
        assert self.normalized_request is not None
        if self.email != feconf.ADMIN_EMAIL_ADDRESS:
            raise self.UnauthorizedUserException(
                'Only the default system admin can manage super admins')
        username = self.normalized_request['username']

        user_settings = user_services.get_user_settings_from_username(username)
        if user_settings is None:
            raise self.InvalidInputException('No such user exists')

        if user_settings.email == feconf.ADMIN_EMAIL_ADDRESS:
            raise self.InvalidInputException(
                'Cannot revoke privileges from the default super admin account')

        auth_services.revoke_super_admin_privileges(user_settings.user_id)
        self.render_json(self.values)


class AdminTopicsCsvFileDownloader(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
    """Retrieves topic similarity data for download."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_DOWNLOADABLE
    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

    @acl_decorators.can_access_admin_page
    def get(self) -> None:
        topic_similarities = (
            recommendations_services.get_topic_similarities_as_csv()
        )
        # Downloadable file accepts only bytes, so we need to encode
        # topic_similarities to bytes.
        self.render_downloadable_file(
            io.BytesIO(topic_similarities.encode('utf-8')),
            'topic_similarities.csv',
            'text/csv'
        )


class DataExtractionQueryHandlerNormalizedRequestDict(TypedDict):
    """Dict representation of DataExtractionQueryHandler's
    normalized_request dictionary.
    """

    exp_id: str
    exp_version: int
    state_name: str
    num_answers: int


class DataExtractionQueryHandler(
    base.BaseHandler[
        Dict[str, str], DataExtractionQueryHandlerNormalizedRequestDict
    ]
):
    """Handler for data extraction query."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS = {
        'GET': {
            'exp_id': {
                'schema': {
                    'type': 'basestring'
                }
            },
            'exp_version': {
                'schema': {
                    'type': 'int'
                }
            },
            'state_name': {
                'schema': {
                    'type': 'basestring'
                }
            },
            'num_answers': {
                'schema': {
                    'type': 'int'
                }
            }
        }
    }

    @acl_decorators.can_access_admin_page
    def get(self) -> None:
        assert self.normalized_request is not None
        exp_id = self.normalized_request['exp_id']
        exp_version = self.normalized_request['exp_version']

        exploration = exp_fetchers.get_exploration_by_id(
            exp_id, strict=False, version=exp_version)
        if exploration is None:
            raise self.InvalidInputException(
                'Entity for exploration with id %s and version %s not found.'
                % (exp_id, exp_version))

        state_name = self.normalized_request['state_name']
        num_answers = self.normalized_request['num_answers']

        if state_name not in exploration.states:
            raise self.InvalidInputException(
                'Exploration \'%s\' does not have \'%s\' state.'
                % (exp_id, state_name))

        state_answers = stats_services.get_state_answers(
            exp_id, exp_version, state_name)
        if state_answers is None:
            raise Exception(
                'No state answer exists for the given exp_id: %s,'
                ' exp_version: %s and state_name: %s' %
                (exp_id, exp_version, state_name)

            )
        extracted_answers = state_answers.get_submitted_answer_dict_list()

        if num_answers > 0:
            extracted_answers = extracted_answers[:num_answers]

        response = {
            'data': extracted_answers
        }
        self.render_json(response)


class SendDummyMailToAdminHandler(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
    """This function handles sending test emails."""

    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'POST': {}}

    @acl_decorators.can_access_admin_page
    def post(self) -> None:
        username = self.username
        assert username is not None
        if feconf.CAN_SEND_EMAILS:
            email_manager.send_dummy_mail_to_admin(username)
            self.render_json({})
        else:
            raise self.InvalidInputException('This app cannot send emails.')


class UpdateUsernameHandlerNormalizedPayloadDict(TypedDict):
    """Dict representation of UpdateUsernameHandler's
    normalized_payload dictionary.
    """

    old_username: str
    new_username: str


class UpdateUsernameHandler(
    base.BaseHandler[
        UpdateUsernameHandlerNormalizedPayloadDict, Dict[str, str]
    ]
):
    """Handler for renaming usernames."""

    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS = {
        'PUT': {
            'old_username': {
                'schema': {
                    'type': 'basestring'
                }
            },
            'new_username': {
                'schema': {
                    'type': 'basestring',
                    'validators': [{
                        'id': 'has_length_at_most',
                        'max_value': constants.MAX_USERNAME_LENGTH
                    }]
                }
            }
        }
    }

    @acl_decorators.can_access_admin_page
    def put(self) -> None:
        assert self.user_id is not None
        assert self.normalized_payload is not None
        old_username = self.normalized_payload['old_username']
        new_username = self.normalized_payload['new_username']

        user_id = user_services.get_user_id_from_username(old_username)
        if user_id is None:
            raise self.InvalidInputException(
                'Invalid username: %s' % old_username)

        if user_services.is_username_taken(new_username):
            raise self.InvalidInputException('Username already taken.')

        user_services.set_username(user_id, new_username)
        user_services.log_username_change(
            self.user_id, old_username, new_username)
        self.render_json({})


class NumberOfDeletionRequestsHandler(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
    """Handler for getting the number of pending deletion requests via admin
    page.
    """

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

    @acl_decorators.can_access_admin_page
    def get(self) -> None:
        self.render_json({
            'number_of_pending_deletion_models': (
                wipeout_service.get_number_of_pending_deletion_requests())
        })


class VerifyUserModelsDeletedHandlerNormalizedRequestDict(TypedDict):
    """Dict representation of VerifyUserModelsDeletedHandler's
    normalized_request dictionary.
    """

    user_id: str


class VerifyUserModelsDeletedHandler(
    base.BaseHandler[
        Dict[str, str], VerifyUserModelsDeletedHandlerNormalizedRequestDict
    ]
):
    """Handler for getting whether any models exist for specific user ID."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS = {
        'GET': {
            'user_id': {
                'schema': {
                    'type': 'basestring'
                }
            }
        }
    }

    @acl_decorators.can_access_admin_page
    def get(self) -> None:
        assert self.normalized_request is not None
        user_id = self.normalized_request['user_id']

        user_is_deleted = wipeout_service.verify_user_deleted(
            user_id, include_delete_at_end_models=True)
        self.render_json({'related_models_exist': not user_is_deleted})


class DeleteUserHandlerNormalizedRequestDict(TypedDict):
    """Dict representation of DeleteUserHandler's
    normalized_request dictionary.
    """

    user_id: str
    username: str


class DeleteUserHandler(
    base.BaseHandler[
        Dict[str, str], DeleteUserHandlerNormalizedRequestDict
    ]
):
    """Handler for deleting a user with specific ID."""

    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS = {
        'DELETE': {
            'user_id': {
                'schema': {
                    'type': 'basestring'
                }
            },
            'username': {
                'schema': {
                    'type': 'basestring'
                }
            }
        }
    }

    @acl_decorators.can_delete_any_user
    def delete(self) -> None:
        assert self.normalized_request is not None
        user_id = self.normalized_request['user_id']
        username = self.normalized_request['username']

        user_id_from_username = (
            user_services.get_user_id_from_username(username))
        if user_id_from_username is None:
            raise self.InvalidInputException(
                'The username doesn\'t belong to any user'
            )
        if user_id_from_username != user_id:
            raise self.InvalidInputException(
                'The user ID retrieved from the username and '
                'the user ID provided by admin differ.'
            )
        wipeout_service.pre_delete_user(user_id)
        self.render_json({'success': True})


class UpdateBlogPostHandlerNormalizedPayloadDict(TypedDict):
    """Dict representation of UpdateBlogPostHandler's
    normalized_payload dictionary.
    """

    blog_post_id: str
    author_username: str
    published_on: str


class UpdateBlogPostHandler(
    base.BaseHandler[
        UpdateBlogPostHandlerNormalizedPayloadDict, Dict[str, str]
    ]
):
    """Handler for changing author ids and published on date in
    blog posts."""

    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS = {
        'PUT': {
            'blog_post_id': {
                'schema': {
                    'type': 'basestring'
                }
            },
            'author_username': {
                'schema': {
                    'type': 'basestring',
                    'validators': [{
                        'id': 'has_length_at_most',
                        'max_value': constants.MAX_USERNAME_LENGTH
                    }]
                }
            },
            'published_on': {
                'schema': {
                    'type': 'basestring'
                }
            }
        }
    }

    @acl_decorators.can_access_admin_page
    def put(self) -> None:
        assert self.normalized_payload is not None
        blog_post_id = self.normalized_payload['blog_post_id']
        author_username = self.normalized_payload['author_username']
        published_on = self.normalized_payload['published_on']

        author_id = user_services.get_user_id_from_username(author_username)
        if author_id is None:
            raise self.InvalidInputException(
                'Invalid username: %s' % author_username)

        user_actions = user_services.get_user_actions_info(author_id).actions
        if role_services.ACTION_ACCESS_BLOG_DASHBOARD not in user_actions:
            raise self.InvalidInputException(
                'User does not have enough rights to be blog post author.')

        blog_post = (
            blog_services.get_blog_post_by_id(blog_post_id, strict=False))
        if blog_post is None:
            raise self.PageNotFoundException(
                Exception(
                    'The blog post with the given id or url doesn\'t exist.'))

        blog_services.update_blog_models_author_and_published_on_date(
            blog_post_id, author_id, published_on)
        self.render_json({})
