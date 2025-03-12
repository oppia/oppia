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
from core.domain import question_domain
from core.domain import question_fetchers
from core.domain import skill_domain
from core.domain import skill_fetchers
from core.domain import story_domain
from core.domain import story_fetchers
from core.domain import subtopic_page_domain
from core.domain import subtopic_page_services
from core.domain import topic_domain
from core.domain import topic_fetchers
from core.domain import translation_fetchers

from typing import Dict, List, Optional, Sequence, TypedDict, Union

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import translation_models


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
    language_code: str


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
        question_domain.QuestionDict,
        Dict[str, feconf.TranslatedContentDict],
        classroom_domain.ClassroomDict,
        Dict[str, List[str]],
        None
    ]


class ActivityDataResponseDict(
        _ActivityDataResponseDictRequiredFields, total=False):
    """Dict representation of items returned in the activities response list."""

    version: Optional[int]
    language_code: Optional[str]


class AndroidActivityHandlerHandlerNormalizedRequestDict(TypedDict):
    """Dict representation of AndroidActivityHandler's normalized_request
    dictionary.
    """

    activity_type: str
    activities_data: List[ActivityDataRequestDict]
    offset: Optional[int]


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
                        constants.ACTIVITY_TYPE_CLASSROOM,
                        'question_skill_link',
                        'question'
                    ]
                },
            },
            'activities_data': {
                'schema': {
                    'type': 'custom',
                    'obj_type': 'JsonEncodedInString'
                }
            },
            'offset': {
                'schema': {
                    'type': 'int',
                    'validators': [{
                        'id': 'is_at_least',
                        'min_value': 0
                    }]
                },
                'default_value': None
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
        offset = self.normalized_request.get('offset')
        activities: List[ActivityDataResponseDict] = []

        hashed_activities_data = [
            tuple(sorted((k, v) for k, v in activity_data.items()))
            for activity_data in activities_data]
        if len(set(hashed_activities_data)) != len(hashed_activities_data):
            raise self.InvalidInputException(
                'Entries in activities_data should be unique'
            )

        if activity_type == constants.ACTIVITY_TYPE_SUBTOPIC:
            # Subtopic pages require special handling because their IDs are
            # compound keys (topic_id-subtopic_id) that need to be split and
            # processed separately.
            split_ids_and_versions = [
                (activity_data['id'].split('-'), activity_data.get('version'))
                for activity_data in activities_data]
            topic_subtopic_version_tuples = [
                (
                    topic_id,
                    int(stringified_subtopic_index),
                    subtopic_page_version
                )
                for (
                    (topic_id, stringified_subtopic_index),
                    subtopic_page_version
                ) in split_ids_and_versions
            ]
            subtopic_pages = (
                subtopic_page_services.get_subtopic_pages_with_ids_and_versions(
                    topic_subtopic_version_tuples))
            activities.extend([{
                'id': activity_data['id'],
                'version': activity_data.get('version'),
                'payload': (
                    subtopic_page.to_dict()
                    if subtopic_page is not None else None)
            } for (activity_data, subtopic_page) in zip(
                activities_data, subtopic_pages)])

        elif activity_type == 'question_skill_link':
            # Question skill links are unique in that they don't have
            # versions and represent a many-to-many relationship
            # between questions and skills.
            for activity_data in activities_data:
                if activity_data.get('version') is not None:
                    raise self.InvalidInputException(
                        'Version cannot be specified for '
                        'question_skill_link')

            if offset is None:
                raise self.InvalidInputException(
                    'Offset required for question_skill_link')          

            question_ids_by_skill_id = (
                question_fetchers.get_all_question_skill_links(offset=offset))
            for skill_id, question_ids in question_ids_by_skill_id.items():
                activities.append({
                    'id': skill_id,
                    'payload': {
                        'question_ids': question_ids
                    }
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
            # Translations require both version and language code, and use a
            # different payload structure than other activities.
            entity_type = feconf.TranslatableEntityType(
                feconf.ENTITY_TYPE_EXPLORATION)
            translation_references: List[
                translation_models.EntityTranslationReferenceDict
            ] = []
            for activity_data in activities_data:
                version = activity_data.get('version')
                language_code = activity_data.get('language_code')
                if version is None or language_code is None:
                    raise self.InvalidInputException(
                        'Version and language code must be specified '
                        'for translation'
                    )
                translation_references.append({
                    'entity_type': entity_type,
                    'entity_id': activity_data['id'],
                    'entity_version': version,
                    'language_code': language_code,
                })

            translations = (
                translation_fetchers.get_multiple_entity_translations(
                    translation_references))

            for activity_data, translation in zip(
                activities_data, translations):
                activities.append({
                    'id': activity_data['id'],
                    'version': activity_data.get('version'),
                    'language_code': activity_data.get('language_code'),
                    'payload': (
                        translation.to_dict()['translations']
                        if translation is not None else None)
                })

        else:
            # All other activities are standard versioned models
            # that can be fetched in bulk using their respective
            # get_multiple_*_by_ids_and_version methods.
            ids_and_versions = [
                (activity_data['id'], activity_data.get('version'))
                for activity_data in activities_data]

            fetched_entities: Sequence[Optional[Union[
                exp_domain.Exploration,
                story_domain.Story,
                skill_domain.Skill,
                question_domain.Question,
                topic_domain.Topic
            ]]] = []

            if activity_type == constants.ACTIVITY_TYPE_EXPLORATION:
                fetched_entities = (
                    exp_fetchers.get_multiple_explorations_by_ids_and_version(
                        ids_and_versions))
            elif activity_type == constants.ACTIVITY_TYPE_STORY:
                fetched_entities = (
                    story_fetchers.get_multiple_stories_by_ids_and_version(
                        ids_and_versions))
            elif activity_type == constants.ACTIVITY_TYPE_SKILL:
                fetched_entities = (
                    skill_fetchers.get_multiple_skills_by_ids_and_version(
                        ids_and_versions))
            elif activity_type == 'question':
                fetched_entities = (
                    question_fetchers.get_multiple_questions_by_ids_and_version(
                        ids_and_versions))
            else:
                fetched_entities = (
                    topic_fetchers.get_multiple_topics_by_ids_and_version(
                        ids_and_versions))

            for activity_data, entity in zip(activities_data, fetched_entities):
                response_dict: ActivityDataResponseDict = {
                    'id': activity_data['id'],
                    'version': activity_data.get('version'),
                    'payload': entity.to_dict() if entity is not None else None
                }
                activities.append(response_dict)

        self.render_json(activities)
