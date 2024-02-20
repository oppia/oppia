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
from core.domain import platform_parameter_domain as parameter_domain
from core.domain import platform_parameter_list
from core.domain import platform_parameter_registry as registry
from core.domain import platform_parameter_services as parameter_services
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
    platform_parameter_list.ParamName.PROMO_BAR_ENABLED.value,
    platform_parameter_list.ParamName.PROMO_BAR_MESSAGE.value
])

# Platform parameters that we plan to show on the blog admin page.
PLATFORM_PARAMS_TO_SHOW_IN_BLOG_ADMIN_PAGE = set([
    (
        platform_parameter_list.ParamName.
        MAX_NUMBER_OF_TAGS_ASSIGNED_TO_BLOG_POST.value
    )
])

supported_languages: List[str] = [
    lang['id'] for lang in constants.SUPPORTED_AUDIO_LANGUAGES]

EDUCATION_BLOG_POST_TITLE = 'Education'

EDUCATION_BLOG_POST_CONTENT = """
    <p>
        Education is a constantly evolving landscape, and innovation lies at its core. 
        This summer, Oppia had the privilege of hosting a group of exceptional minds 
        through the prestigious Google Summer of Code (GSoC) program. These talented 
        individuals embarked on a journey to transform learning, one code at a time.
    </p>\n
    <p>
        You should check out main 
        <oppia-noninteractive-link 
            text-with-value=\"&amp;quot;website.&amp;quot;\" 
            url-with-value=\"&amp;quot;https://www.oppia.org&amp;quot;\">
        </oppia-noninteractive-link><br>\n&nbsp;
    </p>\n\n
    <p>Introduction to Oppia - Youtube Video</p>
    <oppia-noninteractive-video 
        autoplay-with-value=\"false\" 
        end-with-value=\"0\" 
        start-with-value=\"0\" 
        video_id-with-value=\"&amp;quot;Wmvt-HH5-dI&amp;quot;\">
    </oppia-noninteractive-video>
"""

FORMATTING_BLOG_POST_TITLE = 'Blog with different font formatting'

FORMATTING_BLOG_POST_CONTENT = """
    <h1>Heading</h1>\n\n
    <p>This is the normal text.</p>\n\n
    <p><strong>Bold Text.</strong></p>\n\n
    <p><em>Italic Text.</em></p>\n\n
    <p><em><strong>Bold Italic.</strong></em></p>\n\n
    Numbered List:</div>\n\n<ol>\n\t<li>List item&nbsp;</li>\n\t<li>List item\n\t<ol>\n\t\t<li>Sub list item</li>\n\t</ol>\n\t</li>\n</ol>\n\n
    <p>Bullet List:</p>\n\n<ul>\n\t<li>List item</li>\n\t<li>List item\n\t<ul>\n\t\t<li>Sub list item</li>\n\t</ul>\n\t</li>\n</ul>\n\n
    <pre>This is content in pre.</pre>\n\n
    <blockquote>\n<p>Quote from some famous person. Two empty lines after this quote.</p>\n</blockquote>\n\n
    <p>&nbsp;</p>\n\n<p>&nbsp;</p>\n\n<p>End of blog.</p>
"""

ARABIC_BLOG_POST_TITLE = 'Leading The Arabic Translations Team'

ARABIC_BLOG_POST_CONTENT = """
    <h1>Introduction:</h1>\n
    <oppia-noninteractive-image alt-with-value=\"Oppia Arabic Blogpost Graphic\" caption-with-value=\"&amp;quot;&amp;quot;\" filepath-with-value=\"&amp;quot;blog_post_image_height_326_width_490.svg&amp;quot;\"></oppia-noninteractive-image>\n\n
    <p><strong>Editor’s note:</strong> <em>The Arabic team at Oppia plays a pivotal role in breaking down language barriers and making educational content accessible to Arabic-speaking learners. One of the primary challenges lies in finding a suitable tone and language that can resonate with all Arabic-speaking regions, each of which has its unique dialects.</em></p>\n\n
    <p><em>In this blog post, our team lead, Sarah, explains how teamwork can lead not only to professional accomplishments but also personal growth and lasting connections. The Arabic team's journey exemplifies the transformative power of collaboration, cultural exchange, and the profound impact of education on individuals and communities.</em></p>\n\n<p>Translating educational lessons presents a unique set of challenges, particularly when it comes to bridging language barriers and adapting content to suit diverse regional dialects. In this blog post, we will delve into the experiences of our dedicated team and explore how we tackled these obstacles head-on. We will also highlight the inspiring stories of past members, shedding light on their motivations and the invaluable skills they acquired through their contributions.</p>\n\n<p>&nbsp;</p>\n\n<h1>Finding the Right Tone and Language</h1>\n\n\n
    <p>Contributing to this project offered more than just an opportunity to make a difference. For many of us, it served as a valuable stepping stone in our career paths. As an example, some of our team members were students, and through their involvement, they received practical experience and exposure to real-world challenges. This helped them develop essential skills such as teamwork, project management, and time management. We expect these acquired competencies to prove beneficial in their future professional endeavors.</p>\n\n
    <h1>Conclusion</h1>\n\n
    <p>Overcoming the challenges associated with translating lessons into Arabic required a dedicated and passionate team. By focusing on finding the right tone and language, our team members collaborated to ensure that educational content reached a wider audience across diverse Arabic-speaking regions. Through their contributions, they not only empowered learners but also experienced personal growth and acquired valuable skills. With this blog post, I would like to thank and celebrate the contributions of all the members of Oppia’s Arabic translation team. Our journey together stands as a testament to the power of teamwork, cultural exchange, and the positive impact of education on individuals and communities.</p>\n\n
    <h1>Arabic hashtags:</h1>\n\n
    <p>&nbsp;#تحديات_الترجمة</p>\n\n
    <p>&nbsp;#حاجز_اللغة</p>\n\n
    <p>&nbsp;#محتوى_تعليمي</p>\n\n
    <p>&nbsp;#ترجمة_عربية</p>\n\n
    <p>&nbsp;#تبادل_ثقافي</p>\n\n
    <p>&nbsp;#العمل_الجماعي</p>\n\n
    <p>&nbsp;#مسار_المهنة</p>\n\n
    <p>&nbsp;#التعليم_مهم</p>\n\n
    <h1>Credit:</h1>\n\n
    <ul>\n\t
    <li>This blogpost was written by Sarah Bendiff who currently leads Oppia's Arabic Translations Team.</li>\n\t
    <li>Edits were done by all of the marketing team! (Thanks to the best teammates)</li>
    </ul>
"""


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
    blog_post_title: Optional[str]
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
                        'generate_dummy_blog_post',
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
            'blog_post_title': {
                'schema': {
                    'type': 'basestring',
                    'choices': [
                        ARABIC_BLOG_POST_TITLE,
                        EDUCATION_BLOG_POST_TITLE,
                        FORMATTING_BLOG_POST_TITLE,
                    ]
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
            parameter_services.
            get_all_platform_parameters_dicts()
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
            elif action == 'generate_dummy_blog_post':
                blog_post_title = self.normalized_payload.get('blog_post_title')
                if blog_post_title is None:
                    raise Exception(
                        'The \'blog_post_title\' must be provided when the'
                        ' action is generate_dummy_blog_post.'
                    )
                self._load_dummy_blog_post(blog_post_title)
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
                    parameter_services.PlatformParameterNotFoundException
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

    def _load_dummy_blog_post(self, blog_post_title: str) -> None:
        """Loads the database with a blog post.

        Raises:
            Exception. Cannot load new blog post in production mode.
        """
        assert self.user_id is not None
        if not constants.DEV_MODE:
            raise Exception('Cannot load new blog post in production mode.')

        blog_post = blog_services.create_new_blog_post(self.user_id)
        fs = fs_services.GcsFileSystem('blog_post', blog_post.id)
        with open(
            './assets/images/general/learner1.png', 'rb'
        ) as thumbnail:
            fs.commit(
                'thumbnail/blog_thumbnail.png',
                thumbnail.read(),
                'image/png'
            )
        with open(
            './assets/images/subjects/Art.svg', 'rb'
        ) as image:
            fs.commit(
                'image/blog_post_image_height_326_width_490.svg',
                image.read(),
                'image/svg+xml'
            )

        if blog_post_title == EDUCATION_BLOG_POST_TITLE:
            blog_services.update_blog_post(blog_post.id, {
                'title':
                    '%s-%s' % (EDUCATION_BLOG_POST_TITLE, blog_post.id),
                'thumbnail_filename': 'blog_thumbnail.png',
                'content': EDUCATION_BLOG_POST_CONTENT,
                'tags': ['Community']
            })
        elif blog_post_title == FORMATTING_BLOG_POST_TITLE:
            blog_services.update_blog_post(blog_post.id, {
                'title':
                    '%s-%s' % (FORMATTING_BLOG_POST_TITLE, blog_post.id),
                'content': FORMATTING_BLOG_POST_CONTENT,
                'tags': ['Learners', 'Languages'],
                'thumbnail_filename': 'blog_thumbnail.png'
            })
        else:
            # The handler schema defines the possible values of
            # 'blog_post_title'. If 'blog_post_title' has a value other than
            # those defined in the schema, a Bad Request error will be thrown.
            # Hence, 'blog_post_title' must be 'ARABIC_BLOG_POST_TITLE' if
            # this branch is executed.
            assert blog_post_title == ARABIC_BLOG_POST_TITLE
            blog_services.update_blog_post(blog_post.id, {
                'title':
                    '%s-%s' % (ARABIC_BLOG_POST_TITLE, blog_post.id),
                'content': ARABIC_BLOG_POST_CONTENT,
                'tags': [
                    'Learners',
                    'Volunteer',
                    'New features',
                    'Community',
                    'Languages'
                ],
                'thumbnail_filename': 'blog_thumbnail.png'
            })
        blog_services.publish_blog_post(blog_post.id)

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
            raw_image = b''
            with open(
                'core/tests/data/thumbnail.svg', 'rt',
                encoding='utf-8') as svg_file:
                svg_file_content = svg_file.read()
                raw_image = svg_file_content.encode('ascii')
            fs_services.save_original_and_compressed_versions_of_image(
                'thumbnail.svg', feconf.ENTITY_TYPE_TOPIC, topic_id_1,
                raw_image, 'thumbnail', False)
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


class InteractionsByExplorationIdHandlerNormalizedRequestDict(TypedDict):
    """Dict representation of InteractionsByExplorationIdHandler's
    normalized_request dictionary.
    """

    exp_id: str


class InteractionsByExplorationIdHandler(
    base.BaseHandler[
        InteractionsByExplorationIdHandlerNormalizedRequestDict, Dict[str, str]
    ]
):
    """Handler for admin to retrive the list of interactions used in
    an exploration.
    """

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS = {
        'GET': {
            'exp_id': {
                'schema': {
                    'type': 'basestring'
                }
            }
        }
    }

    @acl_decorators.can_access_admin_page
    def get(self) -> None:
        assert self.normalized_request is not None
        exploration_id = self.normalized_request['exp_id']

        exploration = exp_fetchers.get_exploration_by_id(
            exploration_id, strict=False)
        if exploration is None:
            raise self.InvalidInputException('Exploration does not exist.')

        interaction_ids = [
            {'id': state.interaction.id}
            for state in exploration.states.values()
            if state.interaction.id is not None
        ]

        self.render_json({'interactions': list(interaction_ids)})
