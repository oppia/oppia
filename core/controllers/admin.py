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
from core.domain import fs_services
from core.domain import opportunity_services
from core.domain import platform_feature_services as feature_services
from core.domain import platform_parameter_domain as parameter_domain
from core.domain import platform_parameter_list
from core.domain import platform_parameter_registry as registry
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
from core.domain import translation_domain
from core.domain import user_services
from core.domain import wipeout_service

from typing import Dict, List, Optional, TypedDict, Union, cast

# Platform paramters that we plan to show on the the release-coordinator page.
PLATFORM_PARAMS_TO_SHOW_IN_RC_PAGE = set([
    platform_parameter_list.ParamNames.PROMO_BAR_ENABLED.value,
    platform_parameter_list.ParamNames.PROMO_BAR_MESSAGE.value
])

# Platform parameters that we plan to show on the blog admin page.
PLATFORM_PARAMS_TO_SHOW_IN_BLOG_ADMIN_PAGE = set([
    (
        platform_parameter_list.ParamNames.
        MAX_NUMBER_OF_TAGS_ASSIGNED_TO_BLOG_POST.value
    )
])

supported_languages: List[str] = [
    lang['id'] for lang in constants.SUPPORTED_AUDIO_LANGUAGES]


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
    platform_param_name: Optional[str]
    commit_message: Optional[str]
    new_rules: Optional[List[parameter_domain.PlatformParameterRule]]
    exp_id: Optional[str]
    default_value: Dict[str, parameter_domain.PlatformDataTypes]


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
                        'update_platform_parameter_rules',
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
            'platform_param_name': {
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
            },
            'default_value': {
                'schema': {
                    'type': 'object_dict',
                    'validation_method': (
                        validation_method.
                        validate_new_default_value_of_platform_parameter)
                },
                'default_value': None
            }
        }
    }

    @acl_decorators.can_access_admin_page
    def get(self) -> None:
        """Populates the data on the admin page."""
        demo_exploration_ids = list(feconf.DEMO_EXPLORATIONS.keys())

        topic_summaries = topic_fetchers.get_all_topic_summaries()
        topic_summary_dicts = [
            summary.to_dict() for summary in topic_summaries]

        platform_params_dicts = (
            feature_services.
            get_all_platform_parameters_except_feature_flag_dicts()
        )
        # Removes promo-bar related and blog related platform params as
        # they are handled in release-coordinator page and blog admin page
        # respectively.
        platform_params_dicts = [
            param for param in platform_params_dicts
            if (
                param['name'] not in PLATFORM_PARAMS_TO_SHOW_IN_RC_PAGE and
                param['name'] not in PLATFORM_PARAMS_TO_SHOW_IN_BLOG_ADMIN_PAGE
            )
        ]

        config_properties = config_domain.Registry.get_config_property_schemas()

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
            'platform_params_dicts': platform_params_dicts,
        })

    @acl_decorators.can_access_admin_page
    def post(self) -> None:
        """Performs a series of actions based on the action parameter on the
        admin page.

        Raises:
            Exception. The exploration_id must be provided when the action
                is reload_exploration.
            Exception. The collection_id must be provided when the action
                is reload_collection.
            Exception. The num_dummy_exps_to_generate must be provided when
                the action is generate_dummy_explorations.
            Exception. The num_dummy_exps_to_publish must be provided when
                the action is generate_dummy_explorations.
            InvalidInputException. Generate count cannot be less than publish
                count.
            Exception. The new_config_property_values must be provided
                when the action is save_config_properties.
            Exception. The config_property_id must be provided when the
                action is revert_config_property.
            Exception. The data must be provided when the action is
                upload_topic_similarities.
            Exception. The topic_id must be provided when the action is
                regenerate_topic_related_opportunities.
            Exception. The exp_id' must be provided when the action is
                rollback_exploration_to_safe_state.
            Exception. The platform_param_name must be provided when the action
                is update_platform_parameter_rules.
            Exception. The new_rules must be provided when the action is
                update_platform_parameter_rules.
            Exception. The commit_message must be provided when the action
                is update_platform_parameter_rules.
            InvalidInputException. The input provided is not valid.
        """
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
                # must be 'update_platform_parameter_rules' if this branch is
                # executed.
                assert action == 'update_platform_parameter_rules'
                platform_param_name = self.normalized_payload.get(
                    'platform_param_name'
                )
                if platform_param_name is None:
                    raise Exception(
                        'The \'platform_param_name\' must be provided when '
                        'the action is update_platform_parameter_rules.'
                    )
                new_rules = self.normalized_payload.get('new_rules')
                if new_rules is None:
                    raise Exception(
                        'The \'new_rules\' must be provided when the action'
                        ' is update_platform_parameter_rules.'
                    )
                commit_message = self.normalized_payload.get('commit_message')
                if commit_message is None:
                    raise Exception(
                        'The \'commit_message\' must be provided when the '
                        'action is update_platform_parameter_rules.'
                    )
                default_value = self.normalized_payload.get('default_value')
                assert default_value is not None

                try:
                    registry.Registry.update_platform_parameter(
                        platform_param_name, self.user_id, commit_message,
                        new_rules,
                        default_value['value']
                    )
                except (
                    utils.ValidationError,
                    feature_services.PlatformParameterNotFoundException
                ) as e:
                    raise self.InvalidInputException(e)

                new_rule_dicts = [rule.to_dict() for rule in new_rules]
                logging.info(
                    '[ADMIN] %s updated feature %s with new rules: '
                    '%s.' % (self.user_id, platform_param_name, new_rule_dicts))
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
        content_id_generator = translation_domain.ContentIdGenerator()

        state = state_domain.State.create_default_state(
            'ABC',
            content_id_generator.generate(
                translation_domain.ContentType.CONTENT),
            content_id_generator.generate(
                translation_domain.ContentType.DEFAULT_OUTCOME),
            is_initial_state=True)

        state.update_interaction_id('TextInput')
        state.update_interaction_customization_args({
            'placeholder': {
                'value': {
                    'content_id': content_id_generator.generate(
                        translation_domain.ContentType.CUSTOMIZATION_ARG
                    ),
                    'unicode_str': ''
                }
            },
            'rows': {'value': 1},
            'catchMisspellings': {
                'value': False
            }
        })

        state.update_linked_skill_id(None)
        state.update_content(state_domain.SubtitledHtml(
            'content_0', question_content))

        solution = state_domain.Solution(
            'TextInput', False, 'Solution', state_domain.SubtitledHtml(
                content_id_generator.generate(
                    translation_domain.ContentType.SOLUTION),
                '<p>This is a solution.</p>'))
        hints_list = [
            state_domain.Hint(
                state_domain.SubtitledHtml(
                    content_id_generator.generate(
                        translation_domain.ContentType.HINT),
                    '<p>This is a hint.</p>')
            )
        ]

        state.update_interaction_solution(solution)
        state.update_interaction_hints(hints_list)
        state.update_interaction_default_outcome(
            state_domain.Outcome(
                None, None,
                state_domain.SubtitledHtml(
                    content_id_generator.generate(
                        translation_domain.ContentType.DEFAULT_OUTCOME),
                    '<p>Dummy Feedback</p>'),
                True, [], None, None
            )
        )
        question = question_domain.Question(
            question_id, state,
            feconf.CURRENT_STATE_SCHEMA_VERSION,
            constants.DEFAULT_LANGUAGE_CODE, 0, linked_skill_ids, [],
            content_id_generator.next_content_id_index)
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
            story_id = story_services.get_new_story_id()

            skill_id_1 = skill_services.get_new_skill_id()
            skill_id_2 = skill_services.get_new_skill_id()
            skill_id_3 = skill_services.get_new_skill_id()

            question_id_1 = question_services.get_new_question_id()
            question_id_2 = question_services.get_new_question_id()
            question_id_3 = question_services.get_new_question_id()
            question_id_4 = question_services.get_new_question_id()
            question_id_5 = question_services.get_new_question_id()

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
            question_4 = self._create_dummy_question(
                question_id_4, 'Question 4', [skill_id_1])
            question_5 = self._create_dummy_question(
                question_id_5, 'Question 5', [skill_id_1])
            question_services.add_question(self.user_id, question_1)
            question_services.add_question(self.user_id, question_2)
            question_services.add_question(self.user_id, question_3)
            question_services.add_question(self.user_id, question_4)
            question_services.add_question(self.user_id, question_5)

            question_services.create_new_question_skill_link(
                self.user_id, question_id_1, skill_id_1, 0.3)
            question_services.create_new_question_skill_link(
                self.user_id, question_id_4, skill_id_1, 0.3)
            question_services.create_new_question_skill_link(
                self.user_id, question_id_5, skill_id_1, 0.3)
            question_services.create_new_question_skill_link(
                self.user_id, question_id_2, skill_id_2, 0.5)
            question_services.create_new_question_skill_link(
                self.user_id, question_id_3, skill_id_3, 0.7)

            topic_1 = topic_domain.Topic.create_default_topic(
                topic_id_1, 'Dummy Topic 1', 'dummy-topic-one', 'description',
                'fragm')

            topic_1.update_meta_tag_content('dummy-meta')
            raw_image = b'<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="770" viewBox="0 0 1080 770" version="1.1"><path d="M 297 293.500 L 297 341 317.864 341 C 346.924 341, 355.458 339.004, 365.452 329.869 C 371.784 324.083, 375.391 317.372, 377.486 307.483 C 381.386 289.074, 377.656 270.256, 368.019 259.711 C 357.651 248.367, 349.264 246.036, 318.750 246.015 L 297 246 297 293.500 M 316 293.400 L 316 325 326.318 325 C 339.780 325, 346.104 323.159, 351.632 317.632 C 357.086 312.177, 359 305.742, 359 292.856 C 359 281.279, 356.786 274.088, 351.752 269.310 C 345.645 263.514, 342.677 262.594, 328.750 262.179 L 316 261.799 316 293.400 M 508.183 270.139 C 505.808 271.314, 502.681 273.760, 501.234 275.574 C 499.786 277.388, 498.242 278.649, 497.801 278.377 C 497.360 278.105, 497 275.884, 497 273.441 L 497 269 488.500 269 L 480 269 480 305 L 480 341 488.919 341 L 497.839 341 498.169 317.750 C 498.470 296.622, 498.687 294.143, 500.550 290.592 C 504.637 282.803, 515.634 280.548, 520.717 286.457 C 522.967 289.074, 523 289.481, 523 315.056 L 523 341 531.873 341 L 540.745 341 541.177 318.237 C 541.648 293.423, 542.392 289.896, 548.023 285.788 C 553.474 281.813, 562.575 282.656, 565.288 287.387 C 566.126 288.847, 566.600 297.454, 566.825 315.250 L 567.149 341 576.143 341 L 585.137 341 584.819 312.250 C 584.509 284.345, 584.430 283.358, 582.129 278.684 C 578.676 271.671, 573.862 268.819, 564.461 268.216 C 554.726 267.591, 549.472 269.521, 544.006 275.730 C 541.789 278.249, 539.851 280.127, 539.697 279.905 C 533.272 270.566, 528.899 268.055, 519 268.023 C 514.342 268.008, 511.277 268.607, 508.183 270.139 M 632.183 270.139 C 629.808 271.314, 626.681 273.760, 625.234 275.574 C 623.786 277.388, 622.242 278.649, 621.801 278.377 C 621.360 278.105, 621 275.884, 621 273.441 L 621 269 612.500 269 L 604 269 604 305 L 604 341 612.919 341 L 621.839 341 622.169 317.750 C 622.470 296.622, 622.687 294.143, 624.550 290.592 C 628.637 282.803, 639.634 280.548, 644.717 286.457 C 646.967 289.074, 647 289.481, 647 315.056 L 647 341 655.873 341 L 664.745 341 665.177 318.237 C 665.648 293.423, 666.392 289.896, 672.023 285.788 C 677.474 281.813, 686.575 282.656, 689.288 287.387 C 690.126 288.847, 690.600 297.454, 690.825 315.250 L 691.149 341 700.143 341 L 709.137 341 708.819 312.250 C 708.509 284.345, 708.430 283.358, 706.129 278.684 C 702.676 271.671, 697.862 268.819, 688.461 268.216 C 678.726 267.591, 673.472 269.521, 668.006 275.730 C 665.789 278.249, 663.851 280.127, 663.697 279.905 C 657.272 270.566, 652.899 268.055, 643 268.023 C 638.342 268.008, 635.277 268.607, 632.183 270.139 M 396.006 296.250 C 396.009 311.419, 396.457 325.104, 397.016 327.118 C 399.806 337.161, 406.920 342, 418.896 342 C 428.086 342, 434.011 339.468, 437.861 333.895 C 439.313 331.794, 440.837 330.059, 441.250 330.038 C 441.663 330.017, 442 332.475, 442 335.500 L 442 341 450.500 341 L 459 341 459 305 L 459 269 450.065 269 L 441.131 269 440.815 292.750 C 440.515 315.405, 440.395 316.668, 438.234 320.144 C 434.482 326.178, 425.944 328.754, 419.472 325.805 C 414.384 323.487, 414 321.258, 414 294.050 L 414 269 405 269 L 396 269 396.006 296.250 M 720 269.750 C 720 270.163, 726.354 287.018, 734.120 307.207 L 748.240 343.915 746.302 347.651 C 743.420 353.203, 740.007 355.321, 733.787 355.418 C 730.879 355.463, 727.104 355.141, 725.398 354.703 L 722.295 353.906 720.799 361.425 L 719.303 368.945 722.656 370.051 C 728.252 371.898, 741.220 371.438, 746.247 369.215 C 751.614 366.841, 756.766 361.684, 760.351 355.096 C 762.936 350.348, 793 271.956, 793 269.966 C 793 269.417, 789.172 269, 784.136 269 L 775.273 269 771.678 279.250 C 769.701 284.887, 765.766 296.137, 762.933 304.250 C 760.100 312.363, 757.440 319, 757.022 319 C 756.605 319, 752.266 307.753, 747.382 294.006 L 738.500 269.012 729.250 269.006 C 724.163 269.003, 720 269.337, 720 269.750 M 823 426.295 C 817.975 428.025, 815.287 433.678, 816.912 439.102 C 818.323 443.808, 821.975 446.455, 827.062 446.455 C 833.925 446.455, 838.333 442.366, 838.333 436 C 838.333 428.145, 831.039 423.528, 823 426.295 M 281 476.500 L 281 527 289.918 527 L 298.836 527 299.168 504.250 C 299.460 484.245, 299.732 481.033, 301.420 477.632 C 304.710 471.004, 312.705 467.696, 320.091 469.909 C 326.941 471.961, 327.385 473.818, 327.822 502.250 L 328.202 527 337.101 527 L 346 527 345.994 503.250 C 345.988 476.225, 345.190 469.450, 341.270 463.140 C 337.574 457.191, 332.480 454.629, 323.420 454.163 C 314.908 453.725, 307.642 456.366, 303.087 461.554 C 301.493 463.369, 299.921 464.588, 299.594 464.261 C 299.267 463.934, 299 455.192, 299 444.833 L 299 426 290 426 L 281 426 281 476.500 M 573 476.461 L 573 527 582 527 L 591 527 591 522.297 L 591 517.594 594.750 521.248 C 599.722 526.093, 604.623 528, 612.102 528 C 620.504 528, 625.302 526.367, 630.601 521.702 C 638.799 514.486, 642.578 502.835, 641.694 487.500 C 640.980 475.108, 638.200 467.926, 631.623 461.479 C 625.920 455.890, 621.215 454, 613 454 C 605.516 454, 600.543 455.770, 595.463 460.241 L 591.045 464.131 590.772 445.315 L 590.500 426.500 581.750 426.211 L 573 425.922 573 476.461 M 857.022 470.250 C 857.042 511.240, 857.181 514.802, 858.905 518.599 C 861.883 525.156, 866.020 527.447, 875.500 527.788 C 879.900 527.947, 884.054 527.700, 884.731 527.241 C 885.611 526.644, 885.784 524.493, 885.337 519.703 L 884.711 513 881.427 513 C 874.807 513, 875 514.350, 875 467.929 L 875 426 866 426 L 857 426 857.022 470.250 M 195 440 L 195 448 208.500 448 L 222 448 222 487.500 L 222 527 231.500 527 L 241 527 241 487.500 L 241 448 254.500 448 L 268 448 268 440 L 268 432 231.500 432 L 195 432 195 440 M 477.134 455.540 C 475.283 456.343, 472.020 458.913, 469.884 461.250 L 466 465.499 466 460.250 L 466 455 457 455 L 448 455 448 491 L 448 527 456.893 527 L 465.786 527 466.200 504.250 C 466.524 486.449, 466.956 480.721, 468.186 477.918 C 471.163 471.133, 478.480 467.683, 485.193 469.899 C 491.270 471.904, 491.461 472.809, 491.835 501.250 L 492.174 527 501.087 527 L 510 527 510.022 504.250 C 510.041 484.088, 510.259 481.025, 511.938 477.328 C 512.980 475.033, 514.978 472.405, 516.378 471.488 C 519.717 469.300, 525.793 468.557, 529.298 469.909 C 534.405 471.877, 535 475.277, 535 502.468 L 535 527 544.068 527 L 553.135 527 552.818 497.750 C 552.514 469.758, 552.404 468.321, 550.278 464.345 C 546.002 456.349, 539.822 453.492, 528.392 454.225 C 520.125 454.756, 514.144 457.825, 511.162 463.066 C 509.563 465.876, 507 467.069, 507 465.003 C 507 462.775, 499.622 455.989, 496.152 455.025 C 490.908 453.569, 481.059 453.835, 477.134 455.540 M 687.123 456.626 C 684.030 458.167, 680.954 460.641, 679.677 462.614 C 678.479 464.463, 677.163 465.981, 676.750 465.988 C 676.337 465.994, 676 463.525, 676 460.500 L 676 455 667.500 455 L 659 455 659 491 L 659 527 667.935 527 L 676.869 527 677.185 503.071 C 677.479 480.732, 677.637 478.958, 679.562 476.382 C 683.492 471.123, 686.673 469.500, 693.051 469.500 C 698.168 469.500, 699.324 469.869, 701.727 472.271 L 704.500 475.042 704.811 501.021 L 705.123 527 714.118 527 L 723.113 527 722.806 498.250 C 722.514 470.827, 722.398 469.310, 720.294 465.376 C 715.953 457.261, 709.718 454.016, 698.446 454.006 C 693.908 454.001, 691.073 454.657, 687.123 456.626 M 758.718 455.037 C 751.814 456.762, 740 464.111, 740 466.681 C 740 468.297, 746.190 477.957, 747.241 477.982 C 747.649 477.992, 749.992 476.466, 752.447 474.592 C 757.982 470.367, 762.837 468.714, 769.711 468.714 C 776.236 468.714, 779 470.784, 779 475.670 C 779 480.060, 775.194 482.449, 765.631 484.062 C 745.492 487.459, 738 493.635, 738 506.838 C 738 520.381, 746.101 528, 760.500 528 C 768.740 528, 772.668 526.374, 777.189 521.092 L 780.757 516.924 782.802 520.388 C 785.907 525.651, 789.063 527.250, 796.347 527.250 C 804.677 527.250, 806.783 526.097, 806.291 521.803 C 805.229 512.529, 805.114 512.256, 802.476 512.760 C 797.363 513.737, 797 512.366, 797 492.059 C 797 466.542, 795.401 461.793, 785 456.420 C 780.947 454.327, 764.936 453.484, 758.718 455.037 M 364.187 483.250 C 364.470 507.795, 364.748 512.023, 366.304 515.486 C 370.269 524.309, 376.521 527.944, 387.790 527.978 C 396.565 528.004, 401.119 526.016, 406.393 519.854 L 410 515.640 410 521.320 L 410 527 419 527 L 428 527 428 491 L 428 455 419.095 455 L 410.190 455 409.845 477.750 C 409.535 498.106, 409.289 500.914, 407.500 504.435 C 404.475 510.388, 400.948 512.500, 394.032 512.500 C 387.235 512.500, 384.570 510.710, 383.011 505.100 C 382.461 503.120, 382.009 491.038, 382.006 478.250 L 382 455 372.930 455 L 363.861 455 364.187 483.250 M 818 491 L 818 527 827 527 L 836 527 836 491 L 836 455 827 455 L 818 455 818 491 M 601.643 469.977 C 594.389 472.281, 591.053 478.895, 591.022 491.038 C 590.997 500.713, 593.272 506.758, 598.323 510.441 C 602.312 513.349, 611.747 513.324, 615.677 510.395 C 621.199 506.279, 622.500 502.581, 622.500 491 C 622.500 479.582, 621.178 475.690, 616 471.860 C 613.037 469.669, 605.659 468.701, 601.643 469.977 M 776.069 492.936 C 775.282 493.434, 771.761 494.385, 768.244 495.048 C 759.560 496.687, 756 499.701, 756 505.415 C 756 508.595, 756.599 510.214, 758.402 511.908 C 763.612 516.802, 773.440 514.953, 777.243 508.361 C 779.644 504.201, 780.877 491.994, 778.895 492.015 C 778.128 492.024, 776.856 492.438, 776.069 492.936" stroke="none" fill="#f8f9f9" fill-rule="evenodd"/><path d="M 0 385.001 L 0 770.002 540.250 769.751 L 1080.500 769.500 1080.751 384.750 L 1081.003 0 540.501 0 L 0 0 0 385.001 M 0.495 385.500 C 0.495 597.250, 0.610 683.726, 0.750 577.669 C 0.890 471.611, 0.890 298.361, 0.750 192.669 C 0.610 86.976, 0.495 173.750, 0.495 385.500 M 297 293.500 L 297 341 317.864 341 C 346.924 341, 355.458 339.004, 365.452 329.869 C 371.784 324.083, 375.391 317.372, 377.486 307.483 C 381.386 289.074, 377.656 270.256, 368.019 259.711 C 357.651 248.367, 349.264 246.036, 318.750 246.015 L 297 246 297 293.500 M 316 293.400 L 316 325 326.318 325 C 339.780 325, 346.104 323.159, 351.632 317.632 C 357.086 312.177, 359 305.742, 359 292.856 C 359 281.279, 356.786 274.088, 351.752 269.310 C 345.645 263.514, 342.677 262.594, 328.750 262.179 L 316 261.799 316 293.400 M 508.183 270.139 C 505.808 271.314, 502.681 273.760, 501.234 275.574 C 499.786 277.388, 498.242 278.649, 497.801 278.377 C 497.360 278.105, 497 275.884, 497 273.441 L 497 269 488.500 269 L 480 269 480 305 L 480 341 488.919 341 L 497.839 341 498.169 317.750 C 498.470 296.622, 498.687 294.143, 500.550 290.592 C 504.637 282.803, 515.634 280.548, 520.717 286.457 C 522.967 289.074, 523 289.481, 523 315.056 L 523 341 531.873 341 L 540.745 341 541.177 318.237 C 541.648 293.423, 542.392 289.896, 548.023 285.788 C 553.474 281.813, 562.575 282.656, 565.288 287.387 C 566.126 288.847, 566.600 297.454, 566.825 315.250 L 567.149 341 576.143 341 L 585.137 341 584.819 312.250 C 584.509 284.345, 584.430 283.358, 582.129 278.684 C 578.676 271.671, 573.862 268.819, 564.461 268.216 C 554.726 267.591, 549.472 269.521, 544.006 275.730 C 541.789 278.249, 539.851 280.127, 539.697 279.905 C 533.272 270.566, 528.899 268.055, 519 268.023 C 514.342 268.008, 511.277 268.607, 508.183 270.139 M 632.183 270.139 C 629.808 271.314, 626.681 273.760, 625.234 275.574 C 623.786 277.388, 622.242 278.649, 621.801 278.377 C 621.360 278.105, 621 275.884, 621 273.441 L 621 269 612.500 269 L 604 269 604 305 L 604 341 612.919 341 L 621.839 341 622.169 317.750 C 622.470 296.622, 622.687 294.143, 624.550 290.592 C 628.637 282.803, 639.634 280.548, 644.717 286.457 C 646.967 289.074, 647 289.481, 647 315.056 L 647 341 655.873 341 L 664.745 341 665.177 318.237 C 665.648 293.423, 666.392 289.896, 672.023 285.788 C 677.474 281.813, 686.575 282.656, 689.288 287.387 C 690.126 288.847, 690.600 297.454, 690.825 315.250 L 691.149 341 700.143 341 L 709.137 341 708.819 312.250 C 708.509 284.345, 708.430 283.358, 706.129 278.684 C 702.676 271.671, 697.862 268.819, 688.461 268.216 C 678.726 267.591, 673.472 269.521, 668.006 275.730 C 665.789 278.249, 663.851 280.127, 663.697 279.905 C 657.272 270.566, 652.899 268.055, 643 268.023 C 638.342 268.008, 635.277 268.607, 632.183 270.139 M 396.006 296.250 C 396.009 311.419, 396.457 325.104, 397.016 327.118 C 399.806 337.161, 406.920 342, 418.896 342 C 428.086 342, 434.011 339.468, 437.861 333.895 C 439.313 331.794, 440.837 330.059, 441.250 330.038 C 441.663 330.017, 442 332.475, 442 335.500 L 442 341 450.500 341 L 459 341 459 305 L 459 269 450.065 269 L 441.131 269 440.815 292.750 C 440.515 315.405, 440.395 316.668, 438.234 320.144 C 434.482 326.178, 425.944 328.754, 419.472 325.805 C 414.384 323.487, 414 321.258, 414 294.050 L 414 269 405 269 L 396 269 396.006 296.250 M 720 269.750 C 720 270.163, 726.354 287.018, 734.120 307.207 L 748.240 343.915 746.302 347.651 C 743.420 353.203, 740.007 355.321, 733.787 355.418 C 730.879 355.463, 727.104 355.141, 725.398 354.703 L 722.295 353.906 720.799 361.425 L 719.303 368.945 722.656 370.051 C 728.252 371.898, 741.220 371.438, 746.247 369.215 C 751.614 366.841, 756.766 361.684, 760.351 355.096 C 762.936 350.348, 793 271.956, 793 269.966 C 793 269.417, 789.172 269, 784.136 269 L 775.273 269 771.678 279.250 C 769.701 284.887, 765.766 296.137, 762.933 304.250 C 760.100 312.363, 757.440 319, 757.022 319 C 756.605 319, 752.266 307.753, 747.382 294.006 L 738.500 269.012 729.250 269.006 C 724.163 269.003, 720 269.337, 720 269.750 M 823 426.295 C 817.975 428.025, 815.287 433.678, 816.912 439.102 C 818.323 443.808, 821.975 446.455, 827.062 446.455 C 833.925 446.455, 838.333 442.366, 838.333 436 C 838.333 428.145, 831.039 423.528, 823 426.295 M 281 476.500 L 281 527 289.918 527 L 298.836 527 299.168 504.250 C 299.460 484.245, 299.732 481.033, 301.420 477.632 C 304.710 471.004, 312.705 467.696, 320.091 469.909 C 326.941 471.961, 327.385 473.818, 327.822 502.250 L 328.202 527 337.101 527 L 346 527 345.994 503.250 C 345.988 476.225, 345.190 469.450, 341.270 463.140 C 337.574 457.191, 332.480 454.629, 323.420 454.163 C 314.908 453.725, 307.642 456.366, 303.087 461.554 C 301.493 463.369, 299.921 464.588, 299.594 464.261 C 299.267 463.934, 299 455.192, 299 444.833 L 299 426 290 426 L 281 426 281 476.500 M 573 476.461 L 573 527 582 527 L 591 527 591 522.297 L 591 517.594 594.750 521.248 C 599.722 526.093, 604.623 528, 612.102 528 C 620.504 528, 625.302 526.367, 630.601 521.702 C 638.799 514.486, 642.578 502.835, 641.694 487.500 C 640.980 475.108, 638.200 467.926, 631.623 461.479 C 625.920 455.890, 621.215 454, 613 454 C 605.516 454, 600.543 455.770, 595.463 460.241 L 591.045 464.131 590.772 445.315 L 590.500 426.500 581.750 426.211 L 573 425.922 573 476.461 M 857.022 470.250 C 857.042 511.240, 857.181 514.802, 858.905 518.599 C 861.883 525.156, 866.020 527.447, 875.500 527.788 C 879.900 527.947, 884.054 527.700, 884.731 527.241 C 885.611 526.644, 885.784 524.493, 885.337 519.703 L 884.711 513 881.427 513 C 874.807 513, 875 514.350, 875 467.929 L 875 426 866 426 L 857 426 857.022 470.250 M 195 440 L 195 448 208.500 448 L 222 448 222 487.500 L 222 527 231.500 527 L 241 527 241 487.500 L 241 448 254.500 448 L 268 448 268 440 L 268 432 231.500 432 L 195 432 195 440 M 477.134 455.540 C 475.283 456.343, 472.020 458.913, 469.884 461.250 L 466 465.499 466 460.250 L 466 455 457 455 L 448 455 448 491 L 448 527 456.893 527 L 465.786 527 466.200 504.250 C 466.524 486.449, 466.956 480.721, 468.186 477.918 C 471.163 471.133, 478.480 467.683, 485.193 469.899 C 491.270 471.904, 491.461 472.809, 491.835 501.250 L 492.174 527 501.087 527 L 510 527 510.022 504.250 C 510.041 484.088, 510.259 481.025, 511.938 477.328 C 512.980 475.033, 514.978 472.405, 516.378 471.488 C 519.717 469.300, 525.793 468.557, 529.298 469.909 C 534.405 471.877, 535 475.277, 535 502.468 L 535 527 544.068 527 L 553.135 527 552.818 497.750 C 552.514 469.758, 552.404 468.321, 550.278 464.345 C 546.002 456.349, 539.822 453.492, 528.392 454.225 C 520.125 454.756, 514.144 457.825, 511.162 463.066 C 509.563 465.876, 507 467.069, 507 465.003 C 507 462.775, 499.622 455.989, 496.152 455.025 C 490.908 453.569, 481.059 453.835, 477.134 455.540 M 687.123 456.626 C 684.030 458.167, 680.954 460.641, 679.677 462.614 C 678.479 464.463, 677.163 465.981, 676.750 465.988 C 676.337 465.994, 676 463.525, 676 460.500 L 676 455 667.500 455 L 659 455 659 491 L 659 527 667.935 527 L 676.869 527 677.185 503.071 C 677.479 480.732, 677.637 478.958, 679.562 476.382 C 683.492 471.123, 686.673 469.500, 693.051 469.500 C 698.168 469.500, 699.324 469.869, 701.727 472.271 L 704.500 475.042 704.811 501.021 L 705.123 527 714.118 527 L 723.113 527 722.806 498.250 C 722.514 470.827, 722.398 469.310, 720.294 465.376 C 715.953 457.261, 709.718 454.016, 698.446 454.006 C 693.908 454.001, 691.073 454.657, 687.123 456.626 M 758.718 455.037 C 751.814 456.762, 740 464.111, 740 466.681 C 740 468.297, 746.190 477.957, 747.241 477.982 C 747.649 477.992, 749.992 476.466, 752.447 474.592 C 757.982 470.367, 762.837 468.714, 769.711 468.714 C 776.236 468.714, 779 470.784, 779 475.670 C 779 480.060, 775.194 482.449, 765.631 484.062 C 745.492 487.459, 738 493.635, 738 506.838 C 738 520.381, 746.101 528, 760.500 528 C 768.740 528, 772.668 526.374, 777.189 521.092 L 780.757 516.924 782.802 520.388 C 785.907 525.651, 789.063 527.250, 796.347 527.250 C 804.677 527.250, 806.783 526.097, 806.291 521.803 C 805.229 512.529, 805.114 512.256, 802.476 512.760 C 797.363 513.737, 797 512.366, 797 492.059 C 797 466.542, 795.401 461.793, 785 456.420 C 780.947 454.327, 764.936 453.484, 758.718 455.037 M 364.187 483.250 C 364.470 507.795, 364.748 512.023, 366.304 515.486 C 370.269 524.309, 376.521 527.944, 387.790 527.978 C 396.565 528.004, 401.119 526.016, 406.393 519.854 L 410 515.640 410 521.320 L 410 527 419 527 L 428 527 428 491 L 428 455 419.095 455 L 410.190 455 409.845 477.750 C 409.535 498.106, 409.289 500.914, 407.500 504.435 C 404.475 510.388, 400.948 512.500, 394.032 512.500 C 387.235 512.500, 384.570 510.710, 383.011 505.100 C 382.461 503.120, 382.009 491.038, 382.006 478.250 L 382 455 372.930 455 L 363.861 455 364.187 483.250 M 818 491 L 818 527 827 527 L 836 527 836 491 L 836 455 827 455 L 818 455 818 491 M 601.643 469.977 C 594.389 472.281, 591.053 478.895, 591.022 491.038 C 590.997 500.713, 593.272 506.758, 598.323 510.441 C 602.312 513.349, 611.747 513.324, 615.677 510.395 C 621.199 506.279, 622.500 502.581, 622.500 491 C 622.500 479.582, 621.178 475.690, 616 471.860 C 613.037 469.669, 605.659 468.701, 601.643 469.977 M 776.069 492.936 C 775.282 493.434, 771.761 494.385, 768.244 495.048 C 759.560 496.687, 756 499.701, 756 505.415 C 756 508.595, 756.599 510.214, 758.402 511.908 C 763.612 516.802, 773.440 514.953, 777.243 508.361 C 779.644 504.201, 780.877 491.994, 778.895 492.015 C 778.128 492.024, 776.856 492.438, 776.069 492.936" stroke="none" fill="#04645c" fill-rule="evenodd"/></svg>' # pylint: disable=line-too-long
            fs_services.save_original_and_compressed_versions_of_image(
            'thumbnail.svg', feconf.ENTITY_TYPE_TOPIC, topic_id_1, raw_image,
            'thumbnail', False)
            topic_services.update_thumbnail_filename(topic_1, 'thumbnail.svg')
            topic_1.update_thumbnail_bg_color('#C6DCDA')
            topic_1.add_canonical_story(story_id)
            topic_1.add_uncategorized_skill_id(skill_id_1)
            topic_1.add_uncategorized_skill_id(skill_id_2)
            topic_1.add_uncategorized_skill_id(skill_id_3)
            topic_1.update_skill_ids_for_diagnostic_test([skill_id_1])
            topic_1.add_subtopic(1, 'Dummy Subtopic Title', 'dummysubtopic')
            topic_services.update_subtopic_thumbnail_filename(
                topic_1, 1, 'thumbnail.svg')
            topic_1.update_subtopic_thumbnail_bg_color(
                1, constants.ALLOWED_THUMBNAIL_BG_COLORS['subtopic'][0])
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
            topic_services.publish_topic(topic_id_1, self.user_id)
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

            skill_id_1 = skill_services.get_new_skill_id()
            skill_id_2 = skill_services.get_new_skill_id()
            skill_id_3 = skill_services.get_new_skill_id()
            skill_id_4 = skill_services.get_new_skill_id()
            skill_id_5 = skill_services.get_new_skill_id()

            question_id_1 = question_services.get_new_question_id()
            question_id_2 = question_services.get_new_question_id()
            question_id_3 = question_services.get_new_question_id()
            question_id_4 = question_services.get_new_question_id()
            question_id_5 = question_services.get_new_question_id()
            question_id_6 = question_services.get_new_question_id()
            question_id_7 = question_services.get_new_question_id()
            question_id_8 = question_services.get_new_question_id()
            question_id_9 = question_services.get_new_question_id()
            question_id_10 = question_services.get_new_question_id()
            question_id_11 = question_services.get_new_question_id()
            question_id_12 = question_services.get_new_question_id()
            question_id_13 = question_services.get_new_question_id()
            question_id_14 = question_services.get_new_question_id()
            question_id_15 = question_services.get_new_question_id()

            question_1 = self._create_dummy_question(
                question_id_1, 'Question 1', [skill_id_1])
            question_2 = self._create_dummy_question(
                question_id_2, 'Question 2', [skill_id_1])
            question_3 = self._create_dummy_question(
                question_id_3, 'Question 3', [skill_id_1])
            question_4 = self._create_dummy_question(
                question_id_4, 'Question 4', [skill_id_2])
            question_5 = self._create_dummy_question(
                question_id_5, 'Question 5', [skill_id_2])
            question_6 = self._create_dummy_question(
                question_id_6, 'Question 6', [skill_id_2])
            question_7 = self._create_dummy_question(
                question_id_7, 'Question 7', [skill_id_3])
            question_8 = self._create_dummy_question(
                question_id_8, 'Question 8', [skill_id_3])
            question_9 = self._create_dummy_question(
                question_id_9, 'Question 9', [skill_id_3])
            question_10 = self._create_dummy_question(
                question_id_10, 'Question 10', [skill_id_4])
            question_11 = self._create_dummy_question(
                question_id_11, 'Question 11', [skill_id_4])
            question_12 = self._create_dummy_question(
                question_id_12, 'Question 12', [skill_id_4])
            question_13 = self._create_dummy_question(
                question_id_13, 'Question 13', [skill_id_5])
            question_14 = self._create_dummy_question(
                question_id_14, 'Question 14', [skill_id_5])
            question_15 = self._create_dummy_question(
                question_id_15, 'Question 15', [skill_id_5])

            topic_1 = topic_domain.Topic.create_default_topic(
                topic_id_1, 'Addition', 'add', 'description', 'fragm')
            topic_1.skill_ids_for_diagnostic_test = [skill_id_1]
            topic_1.thumbnail_filename = 'thumbnail.svg'
            topic_1.thumbnail_bg_color = '#C6DCDA'
            topic_1.subtopics = [
                topic_domain.Subtopic(
                    1, 'Title', [skill_id_1], 'image.svg',
                    constants.ALLOWED_THUMBNAIL_BG_COLORS['subtopic'][0], 21131,
                    'dummy-subtopic-three')]
            topic_1.next_subtopic_id = 2

            topic_2 = topic_domain.Topic.create_default_topic(
                topic_id_2, 'Subtraction', 'subtraction',
                'description', 'fragm'
            )
            topic_2.skill_ids_for_diagnostic_test = [skill_id_2]
            topic_2.thumbnail_filename = 'thumbnail.svg'
            topic_2.thumbnail_bg_color = '#C6DCDA'
            topic_2.subtopics = [
                topic_domain.Subtopic(
                    1, 'Title', [skill_id_2], 'image.svg',
                    constants.ALLOWED_THUMBNAIL_BG_COLORS['subtopic'][0], 21131,
                    'dummy-subtopic-three')]
            topic_2.next_subtopic_id = 2

            topic_3 = topic_domain.Topic.create_default_topic(
                topic_id_3, 'Multiplication', 'multiplication',
                'description', 'fragm'
            )
            topic_3.skill_ids_for_diagnostic_test = [skill_id_3]
            topic_3.thumbnail_filename = 'thumbnail.svg'
            topic_3.thumbnail_bg_color = '#C6DCDA'
            topic_3.subtopics = [
                topic_domain.Subtopic(
                    1, 'Title', [skill_id_3], 'image.svg',
                    constants.ALLOWED_THUMBNAIL_BG_COLORS['subtopic'][0], 21131,
                    'dummy-subtopic-three')]
            topic_3.next_subtopic_id = 2

            topic_4 = topic_domain.Topic.create_default_topic(
                topic_id_4, 'Division', 'division', 'description', 'fragm')
            topic_4.skill_ids_for_diagnostic_test = [skill_id_4]
            topic_4.thumbnail_filename = 'thumbnail.svg'
            topic_4.thumbnail_bg_color = '#C6DCDA'
            topic_4.subtopics = [
                topic_domain.Subtopic(
                    1, 'Title', [skill_id_4], 'image.svg',
                    constants.ALLOWED_THUMBNAIL_BG_COLORS['subtopic'][0], 21131,
                    'dummy-subtopic-three')]
            topic_4.next_subtopic_id = 2

            topic_5 = topic_domain.Topic.create_default_topic(
                topic_id_5, 'Fraction', 'fraction', 'description', 'fragm')
            topic_5.skill_ids_for_diagnostic_test = [skill_id_5]
            topic_5.thumbnail_filename = 'thumbnail.svg'
            topic_5.thumbnail_bg_color = '#C6DCDA'
            topic_5.subtopics = [
                topic_domain.Subtopic(
                    1, 'Title', [skill_id_5], 'image.svg',
                    constants.ALLOWED_THUMBNAIL_BG_COLORS['subtopic'][0], 21131,
                    'dummy-subtopic-three')]
            topic_5.next_subtopic_id = 2

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

            question_services.add_question(self.user_id, question_1)
            question_services.add_question(self.user_id, question_2)
            question_services.add_question(self.user_id, question_3)
            question_services.add_question(self.user_id, question_4)
            question_services.add_question(self.user_id, question_5)
            question_services.add_question(self.user_id, question_6)
            question_services.add_question(self.user_id, question_7)
            question_services.add_question(self.user_id, question_8)
            question_services.add_question(self.user_id, question_9)
            question_services.add_question(self.user_id, question_10)
            question_services.add_question(self.user_id, question_11)
            question_services.add_question(self.user_id, question_12)
            question_services.add_question(self.user_id, question_13)
            question_services.add_question(self.user_id, question_14)
            question_services.add_question(self.user_id, question_15)

            skill_services.save_new_skill(self.user_id, skill_1)
            skill_services.save_new_skill(self.user_id, skill_2)
            skill_services.save_new_skill(self.user_id, skill_3)
            skill_services.save_new_skill(self.user_id, skill_4)
            skill_services.save_new_skill(self.user_id, skill_5)

            topic_services.save_new_topic(self.user_id, topic_1)
            topic_services.publish_topic(topic_id_1, self.user_id)

            topic_services.save_new_topic(self.user_id, topic_2)
            topic_services.publish_topic(topic_id_2, self.user_id)

            topic_services.save_new_topic(self.user_id, topic_3)
            topic_services.publish_topic(topic_id_3, self.user_id)

            topic_services.save_new_topic(self.user_id, topic_4)
            topic_services.publish_topic(topic_id_4, self.user_id)

            topic_services.save_new_topic(self.user_id, topic_5)
            topic_services.publish_topic(topic_id_5, self.user_id)

            question_services.create_new_question_skill_link(
                self.user_id, question_id_1, skill_id_1, 0.5)
            question_services.create_new_question_skill_link(
                self.user_id, question_id_2, skill_id_1, 0.5)
            question_services.create_new_question_skill_link(
                self.user_id, question_id_3, skill_id_1, 0.5)
            question_services.create_new_question_skill_link(
                self.user_id, question_id_4, skill_id_2, 0.5)
            question_services.create_new_question_skill_link(
                self.user_id, question_id_5, skill_id_2, 0.5)
            question_services.create_new_question_skill_link(
                self.user_id, question_id_6, skill_id_2, 0.5)
            question_services.create_new_question_skill_link(
                self.user_id, question_id_7, skill_id_3, 0.5)
            question_services.create_new_question_skill_link(
                self.user_id, question_id_8, skill_id_3, 0.5)
            question_services.create_new_question_skill_link(
                self.user_id, question_id_9, skill_id_3, 0.5)
            question_services.create_new_question_skill_link(
                self.user_id, question_id_10, skill_id_4, 0.5)
            question_services.create_new_question_skill_link(
                self.user_id, question_id_11, skill_id_4, 0.5)
            question_services.create_new_question_skill_link(
                self.user_id, question_id_12, skill_id_4, 0.5)
            question_services.create_new_question_skill_link(
                self.user_id, question_id_13, skill_id_5, 0.5)
            question_services.create_new_question_skill_link(
                self.user_id, question_id_14, skill_id_5, 0.5)
            question_services.create_new_question_skill_link(
                self.user_id, question_id_15, skill_id_5, 0.5)

            classroom_id_1 = classroom_config_services.get_new_classroom_id()

            classroom_name_1 = 'Math'

            classroom_url_fragment_1 = 'math'

            topic_dependency_for_classroom_1: Dict[str, list[str]] = {
                topic_id_1: [],
                topic_id_2: [topic_id_1],
                topic_id_3: [topic_id_1],
                topic_id_4: [topic_id_2],
                topic_id_5: [topic_id_2, topic_id_3]
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

            classroom_1 = classroom_config_domain.Classroom.from_dict(
                classroom_dict_1)

            classroom_config_services.update_or_create_classroom_model(
                classroom_1)

            classroom_pages_data = [{
                'name': 'math',
                'url_fragment': 'math',
                'course_details': '',
                'topic_list_intro': '',
                'topic_ids': [
                    topic_id_1,
                    topic_id_2,
                    topic_id_3,
                    topic_id_4,
                    topic_id_5
                ],
            }]
            config_services.set_property(
                self.user_id, 'classroom_pages_data', classroom_pages_data)
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

    @acl_decorators.open_access
    def get(self) -> None:
        """Retrieves information about users based on different filter
        criteria to populate the roles tab.

        Raises:
            Exception. The role must be provided when the filter criterion
                is 'role'.
            Exception. The username must be provided when the filter
                criterion is 'username'.
            InvalidInputException. User with given username does not exist.
        """
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
            coordinated_language_ids = []
            if feconf.ROLE_ID_TOPIC_MANAGER in user_roles:
                managed_topic_ids = [
                    rights.id for rights in
                    topic_fetchers.get_topic_rights_with_user(user_id)]
            if feconf.ROLE_ID_TRANSLATION_COORDINATOR in user_roles:
                coordinated_language_ids = [
                    rights.language_id for rights in
                    user_services.get_translation_rights_with_user(
                        user_id)]
            user_roles_dict = {
                'roles': user_roles,
                'managed_topic_ids': managed_topic_ids,
                'coordinated_language_ids': coordinated_language_ids,
                'banned': user_settings.banned
            }
            self.render_json(user_roles_dict)

    @acl_decorators.can_access_admin_page
    def put(self) -> None:
        """Adds a role to a user.

        Raises:
            InvalidInputException. User with given username does not exist.
            InvalidInputException. Unsupported role for this handler.
        """
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
        """Removes a role from a user.

        Raises:
            InvalidInputException. User with given username does not exist.
        """
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

        if role == feconf.ROLE_ID_TRANSLATION_COORDINATOR:
            user_services.deassign_user_from_all_languages(
                self.user, user_id)

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
        """Adds or removes the topic-manager role for a user in the context
        of a specific topic.

        Raises:
            InvalidInputException. User with given username does not exist.
        """
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
        """Marks a user as banned.

        Raises:
            InvalidInputException. User with given username does not exist.
        """
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
        """Removes the banned status of the user.

        Raises:
            InvalidInputException. User with given username does not exist.
        """
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
        """Grants super admin privileges to a user.

        Raises:
            UnauthorizedUserException. Only the default system admin can
                manage super admins.
            InvalidInputException. No such user exists.
        """
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
        """Revokes super admin privileges from a user.

        Raises:
            UnauthorizedUserException. Only the default system admin can
                manage super admins.
            InvalidInputException. No such user exists.
            InvalidInputException. Cannot revoke privileges from the default
                super admin account.
        """
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
        """Generates a CSV file containing topic similarities."""
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
        """Retrieves a specified number of submitted answers for a particular
        state within an exploration.

        Raises:
            InvalidInputException. Entity not found.
            InvalidInputException. Exploration does not have such state.
            Exception. No state answer exists.
        """
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
        """Sends a dummy email to the admin if the application is
        configured to send emails.

        Raises:
            InvalidInputException. This app cannot send emails.
        """
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
        """Updates the username for a user.

        Raises:
            InvalidInputException. Invalid username.
            InvalidInputException. The user does not have a profile picture
                with png extension.
            InvalidInputException. The user does not have a profile picture
                with webp extension.
        """
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

        # Update profile picture.
        old_fs = fs_services.GcsFileSystem(
            feconf.ENTITY_TYPE_USER, old_username)
        new_fs = fs_services.GcsFileSystem(
            feconf.ENTITY_TYPE_USER, new_username)

        if not old_fs.isfile('profile_picture.png'):
            raise self.InvalidInputException(
                'The user with username %s does not have a '
                'profile picture with png extension.' % old_username
            )

        if not old_fs.isfile('profile_picture.webp'):
            raise self.InvalidInputException(
                'The user with username %s does not have a '
                'profile picture with webp extension.' % old_username
            )

        image_png = old_fs.get('profile_picture.png')
        old_fs.delete('profile_picture.png')
        new_fs.commit(
            'profile_picture.png', image_png, mimetype='image/png')

        image_webp = old_fs.get('profile_picture.webp')
        old_fs.delete('profile_picture.webp')
        new_fs.commit(
            'profile_picture.webp', image_webp, mimetype='image/webp')

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
        """Retrieves the number of pending deletion requests for models."""
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
        """Checks if a user with a specific user_id has been deleted and
        if there are related models or not.
        """
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
        """Initiates the pre-deletion process for a user.

        Raises:
            InvalidInputException. The username doesn't belong to any user.
            InvalidInputException. The user ID retrieved from the username
                and the user ID provided by admin differ.
        """
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
        """Updates the author and published date of a blog post.

        Raises:
            InvalidInputException. Invalid username.
            InvalidInputException. User does not have enough rights to be
                blog post author.
            PageNotFoundException. The blog post with the given id or url
                doesn't exist.
        """
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


class TranslationCoordinatorRoleHandlerNormalizedPayloadDict(TypedDict):
    """Dict representation of TranslationCoordinatorRoleHandler's
    normalized_payload dictionary.
    """

    username: str
    action: str
    language_id: str


class TranslationCoordinatorRoleHandler(
    base.BaseHandler[
        TranslationCoordinatorRoleHandlerNormalizedPayloadDict, Dict[str, str]
    ]
):
    """Handler to assign or deassigning coordinator to a language."""

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
            'language_id': {
                'schema': {
                    'type': 'basestring',
                    'choices': supported_languages
                }
            }
        }
    }

    @acl_decorators.can_access_admin_page
    def put(self) -> None:
        """Adds or removes the translation-coordinator role for a user in the
        context of a specific language.

        Raises:
            InvalidInputException. User with given username does not exist.
        """
        assert self.normalized_payload is not None
        username = self.normalized_payload['username']
        action = self.normalized_payload['action']
        language_id = self.normalized_payload['language_id']

        user_settings = user_services.get_user_settings_from_username(username)

        if user_settings is None:
            raise self.InvalidInputException(
                'User with given username does not exist.')

        user_id = user_settings.user_id
        if action == 'assign':
            if not feconf.ROLE_ID_TRANSLATION_COORDINATOR in (
                user_settings.roles):
                user_services.add_user_role(
                    user_id, feconf.ROLE_ID_TRANSLATION_COORDINATOR)

            language_coordinator = user_services.get_user_actions_info(user_id)

            user_services.assign_coordinator(
                user_services.get_system_user(),
                language_coordinator, language_id)
        else:
            # The handler schema defines the possible values of 'action'.
            # If 'action' has a value other than those defined in the schema,
            # a Bad Request error will be thrown. Hence, 'action' must be
            # 'deassign' if this branch is executed.
            assert action == 'deassign'
            language_coordinator = user_services.get_user_actions_info(user_id)
            user_services.deassign_coordinator(
                user_services.get_system_user(),
                language_coordinator, language_id)

        self.render_json({})
