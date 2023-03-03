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

"""Controller for initializing android specific structures."""

from __future__ import annotations

from core import feconf
from core.constants import constants
from core.controllers import acl_decorators
from core.controllers import base
from core.domain import android_services
from core.domain import classroom_config_domain
from core.domain import classroom_config_services
from core.domain import classroom_services
from core.domain import config_domain
from core.domain import exp_domain
from core.domain import exp_fetchers
from core.domain import skill_domain
from core.domain import skill_fetchers
from core.domain import story_domain
from core.domain import story_fetchers
from core.domain import subtopic_page_domain
from core.domain import subtopic_page_services
from core.domain import topic_domain
from core.domain import topic_fetchers
from core.domain import translation_domain
from core.domain import translation_fetchers

from typing import Dict, Optional, TypedDict, Union


class InitializeAndroidTestDataHandler(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
    """Handler to initialize android specific structures."""

    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'POST': {}}

    @acl_decorators.open_access
    def post(self) -> None:
        """Generates structures for Android end-to-end tests.

        This handler generates structures for Android end-to-end tests in
        order to evaluate the integration of network requests from the
        Android client to the backend. This handler should only be called
        once (or otherwise raises an exception), and can only be used in
        development mode (this handler is unavailable in production).

        The specific structures that are generated:
            Topic: A topic with both a test story and a subtopic.
            Story: A story with 'android_interactions' as an exploration node.
            Exploration: 'android_interactions' from the local assets.
            Subtopic: A dummy subtopic to validate the topic.
            Skill: A dummy skill to validate the subtopic.

        Raises:
            Exception. When used in production mode.
            InvalidInputException. The topic is already created but not
                published.
            InvalidInputException. The topic is already published.
        """
        if not constants.DEV_MODE:
            raise Exception('Cannot load new structures data in production.')

        topic_id = android_services.initialize_android_test_data()
        self.render_json({
            'generated_topic_id': topic_id
        })



class AndroidActivityHandlerHandlerNormalizedRequestDict(TypedDict):
    """Dict representation of AndroidActivityHandler's normalized_request
    dictionary.
    """

    activity_type: str
    activity_id: str
    activity_version: int
    api_key: str


class AndroidActivityHandler(base.BaseHandler[
    Dict[str, str], AndroidActivityHandlerHandlerNormalizedRequestDict
]):
    """Handler for providing activities to Android."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    URL_PATH_ARGS_SCHEMAS = {}
    HANDLER_ARGS_SCHEMAS = {
        'GET': {
            'activity_type': {
                'schema': {
                    'type': 'basestring',
                    'choices': [
                        constants.ACTIVITY_TYPE_EXPLORATION,
                        constants.ACTIVITY_TYPE_EXPLORATION_TRANSLATIONS,
                        constants.ACTIVITY_TYPE_STORY,
                        constants.ACTIVITY_TYPE_SKILL,
                        constants.ACTIVITY_TYPE_SUBTOPIC,
                        constants.ACTIVITY_TYPE_LEARN_TOPIC,
                        constants.ACTIVITY_TYPE_CLASSROOM
                    ]
                },
            },
            'activity_id': {
                'schema': {
                    'type': 'basestring'
                }
            },
            'activity_version': {
                'schema': {
                    'type': 'int'
                },
                'default_value': None
            },
            'language_code': {
                'schema': {
                    'type': 'basestring'
                },
                'default_value': None
            },
            'secret': {
                'schema': {
                    'type': 'basestring'
                }
            }
        }
    }

    ACTIVITY_TYPE_TO_FETCHER = {
        constants.ACTIVITY_TYPE_EXPLORATION: exp_fetchers.get_exploration_by_id,
        constants.ACTIVITY_TYPE_STORY: story_fetchers.get_story_by_id,
        constants.ACTIVITY_TYPE_SKILL: skill_fetchers.get_skill_by_id,
        constants.ACTIVITY_TYPE_SUBTOPIC: (
            subtopic_page_services.get_subtopic_page_by_id),
        constants.ACTIVITY_TYPE_LEARN_TOPIC: topic_fetchers.get_topic_by_id
    }

    # Here, the 'secret' url_path_argument is not used in the function body
    # because the actual usage of 'secret' lies within the
    # 'is_from_oppia_android_build' decorator, and here we are getting 'secret'
    # because the decorator always passes every url_path_args to HTTP methods.
    @acl_decorators.is_from_oppia_android_build
    def get(self) -> None:
        """Handles GET requests."""
        assert self.normalized_request is not None
        activity_id = self.normalized_request['activity_id']
        activity_type = self.normalized_request['activity_type']
        activity_version = self.normalized_request.get('activity_version')
        language_code = self.normalized_request.get('language_code')
        activity: Optional[Union[
            exp_domain.Exploration,
            story_domain.Story,
            skill_domain.Skill,
            subtopic_page_domain.SubtopicPage,
            classroom_config_domain.Classroom,
            topic_domain.Topic,
            translation_domain.EntityTranslation
        ]] = None

        if activity_type == constants.ACTIVITY_TYPE_EXPLORATION:
            activity = exp_fetchers.get_exploration_by_id(
                activity_id, strict=False, version=activity_version)
        elif activity_type == constants.ACTIVITY_TYPE_STORY:
            activity = story_fetchers.get_story_by_id(
                activity_id, strict=False, version=activity_version)
        elif activity_type == constants.ACTIVITY_TYPE_SKILL:
            activity = skill_fetchers.get_skill_by_id(
                activity_id, strict=False, version=activity_version)
        elif activity_type == constants.ACTIVITY_TYPE_SUBTOPIC:
            topic_id, subtopic_page_id = activity_id.split('-')
            activity = subtopic_page_services.get_subtopic_page_by_id(
                topic_id,
                int(subtopic_page_id),
                strict=False,
                version=activity_version
            )
        elif activity_type == constants.ACTIVITY_TYPE_CLASSROOM:
            if activity_version is not None:
                raise self.InvalidInputException(
                    'Version cannot be specified for classroom')
            matching_classroom_fragment = next(
                classroom['url_fragment']
                for classroom in config_domain.CLASSROOM_PAGES_DATA.value
                if classroom['name'] == activity_id)

            activity = classroom_config_services.get_classroom_by_url_fragment(
                activity_id) or (
                classroom_services.get_classroom_by_url_fragment(
                    matching_classroom_fragment))
        elif activity_type == constants.ACTIVITY_TYPE_EXPLORATION_TRANSLATIONS:
            entity_type = feconf.TranslatableEntityType(
                feconf.ENTITY_TYPE_EXPLORATION)
            activity = translation_fetchers.get_entity_translation(
                entity_type, activity_id, activity_version, language_code)
        else:
            activity = topic_fetchers.get_topic_by_id(
                activity_id, strict=False, version=activity_version)

        if activity is None:
            raise self.PageNotFoundException('Activity does not exist')

        self.render_json(activity.to_dict())
