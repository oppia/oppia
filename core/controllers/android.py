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
from core.domain import classroom_domain
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
from core.domain import translation_fetchers

from typing import Dict, List, Optional, TypedDict, Union


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


class ActivityDataRequestDict(TypedDict):
    """Dict representation of items in activities_data."""

    id: str
    version: Optional[int]
    language_code: Optional[str]


class _ActivityDataResponseDictRequiredFields(TypedDict):
    """Required fields for items returned in the activities response list.

    Note: See https://stackoverflow.com/a/74843909. NotRequired isn't available
    yet for us to use here.
    """

    id: str
    payload: Union[
        exp_domain.ExplorationDict,
        story_domain.StoryDict,
        skill_domain.SkillDict,
        subtopic_page_domain.SubtopicPageDict,
        classroom_config_domain.ClassroomDict,
        topic_domain.TopicDict,
        Dict[str, feconf.TranslatedContentDict],
        classroom_domain.ClassroomDict,
        None
    ]


class ActivityDataResponseDict(
        _ActivityDataResponseDictRequiredFields, total=False):
    """Dict representation of items returned in the activities response list."""

    version: Optional[int]
    language_code: str


class AndroidActivityHandlerHandlerNormalizedRequestDict(TypedDict):
    """Dict representation of AndroidActivityHandler's normalized_request
    dictionary.
    """

    activity_type: str
    activities_data: List[ActivityDataRequestDict]


class AndroidActivityHandler(base.BaseHandler[
    Dict[str, str], AndroidActivityHandlerHandlerNormalizedRequestDict
]):
    """Handler for providing activities to Android."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
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
            'activities_data': {
                'schema': {
                    'type': 'custom',
                    'obj_type': 'JsonEncodedInString'
                }
            }
        }
    }

    # Here, the 'secret' url_path_argument is not used in the function body
    # because the actual usage of 'secret' lies within the
    # 'is_from_oppia_android_build' decorator, and here we are getting 'secret'
    # because the decorator always passes every url_path_args to HTTP methods.
    @acl_decorators.is_from_oppia_android_build
    def get(self) -> None:
        """Handles GET requests."""
        assert self.normalized_request is not None
        activities_data = self.normalized_request['activities_data']
        activity_type = self.normalized_request['activity_type']
        activities: List[ActivityDataResponseDict] = []

        hashed_activities_data = [
            tuple(sorted((k, v) for k, v in activity_data.items()))
            for activity_data in activities_data]
        if len(set(hashed_activities_data)) != len(hashed_activities_data):
            raise self.InvalidInputException(
                'Entries in activities_data should be unique'
            )

        if activity_type == constants.ACTIVITY_TYPE_EXPLORATION:
            for activity_data in activities_data:
                exploration = exp_fetchers.get_exploration_by_id(
                    activity_data['id'],
                    strict=False,
                    version=activity_data.get('version'))
                activities.append({
                    'id': activity_data['id'],
                    'version': activity_data.get('version'),
                    'payload': (
                        exploration.to_dict() if exploration is not None
                        else None)
                })
        elif activity_type == constants.ACTIVITY_TYPE_STORY:
            for activity_data in activities_data:
                story = story_fetchers.get_story_by_id(
                    activity_data['id'],
                    strict=False,
                    version=activity_data.get('version'))
                activities.append({
                    'id': activity_data['id'],
                    'version': activity_data.get('version'),
                    'payload': (
                        story.to_dict() if story is not None else None)
                })
        elif activity_type == constants.ACTIVITY_TYPE_SKILL:
            for activity_data in activities_data:
                skill = skill_fetchers.get_skill_by_id(
                    activity_data['id'],
                    strict=False,
                    version=activity_data.get('version'))
                activities.append({
                    'id': activity_data['id'],
                    'version': activity_data.get('version'),
                    'payload': (
                        skill.to_dict() if skill is not None else None)
                })
        elif activity_type == constants.ACTIVITY_TYPE_SUBTOPIC:
            for activity_data in activities_data:
                topic_id, subtopic_page_id = activity_data['id'].split('-')
                subtopic_page = subtopic_page_services.get_subtopic_page_by_id(
                    topic_id,
                    int(subtopic_page_id),
                    strict=False,
                    version=activity_data.get('version')
                )
                activities.append({
                    'id': activity_data['id'],
                    'version': activity_data.get('version'),
                    'payload': (
                        subtopic_page.to_dict() if subtopic_page is not None
                        else None)
                })
        elif activity_type == constants.ACTIVITY_TYPE_CLASSROOM:
            for activity_data in activities_data:
                if activity_data.get('version') is not None:
                    raise self.InvalidInputException(
                        'Version cannot be specified for classroom')
                classroom = (
                    classroom_config_services.get_classroom_by_url_fragment(
                        activity_data['id']))
                activities.append({
                    'id': activity_data['id'],
                    'payload': (
                        classroom.to_dict() if classroom is not None else None)
                })
        elif activity_type == constants.ACTIVITY_TYPE_EXPLORATION_TRANSLATIONS:
            entity_type = feconf.TranslatableEntityType(
                feconf.ENTITY_TYPE_EXPLORATION)
            for activity_data in activities_data:
                version = activity_data.get('version')
                language_code = activity_data.get('language_code')
                if version is None or language_code is None:
                    raise self.InvalidInputException(
                        'Version and language code must be specified '
                        'for translation'
                    )
                translation = translation_fetchers.get_entity_translation(
                    entity_type,
                    activity_data['id'],
                    version,
                    language_code
                )
                activities.append({
                    'id': activity_data['id'],
                    'version': version,
                    'language_code': language_code,
                    'payload': (
                        translation.to_dict()['translations']
                        if translation is not None
                        else None)
                })
        else:
            for activity_data in activities_data:
                topic = topic_fetchers.get_topic_by_id(
                    activity_data['id'],
                    strict=False,
                    version=activity_data.get('version'))
                activities.append({
                    'id': activity_data['id'],
                    'version': activity_data.get('version'),
                    'payload': (
                        topic.to_dict() if topic is not None else None)
                })

        self.render_json(activities)
