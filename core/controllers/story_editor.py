# Copyright 2018 The Oppia Authors. All Rights Reserved.
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

"""Controllers for the story editor."""

from __future__ import annotations

from core import feconf
from core import utils
from core.constants import constants
from core.controllers import acl_decorators
from core.controllers import base
from core.domain import classroom_config_services
from core.domain import skill_services
from core.domain import story_domain
from core.domain import story_fetchers
from core.domain import story_services
from core.domain import topic_fetchers
from core.domain import topic_services

from typing import Dict, List, TypedDict

SCHEMA_FOR_STORY_ID = {
    'type': 'basestring',
    'validators': [{
        'id': 'has_length',
        'value': constants.STORY_ID_LENGTH
    }]
}


class EditableStoryDataHandlerNormalizedPayloadDict(TypedDict):
    """Dict representation of EditableStoryDataHandler's
    normalized_payload dictionary.
    """

    version: int
    commit_message: str
    change_dicts: List[story_domain.StoryChange]


class EditableStoryDataHandler(
    base.BaseHandler[
        EditableStoryDataHandlerNormalizedPayloadDict,
        Dict[str, str]
    ]
):
    """A data handler for stories which support writing."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {
        'story_id': {
            'schema': SCHEMA_FOR_STORY_ID
        }
    }
    HANDLER_ARGS_SCHEMAS = {
        'GET': {},
        'PUT': {
            'version': {
                'schema': {
                    'type': 'int',
                    'validators': [{
                        'id': 'is_at_least',
                        # Version must be greater than zero.
                        'min_value': 1
                    }]
                }
            },
            'commit_message': {
                'schema': {
                    'type': 'basestring',
                    'validators': [{
                        'id': 'has_length_at_most',
                        'max_value': constants.MAX_COMMIT_MESSAGE_LENGTH
                    }]
                }
            },
            'change_dicts': {
                'schema': {
                    'type': 'list',
                    'items': {
                        'type': 'object_dict',
                        'object_class': story_domain.StoryChange
                    }
                }
            }
        },
        'DELETE': {}
    }

    def _require_valid_version(
        self,
        version_from_payload: int,
        story_version: int
    ) -> None:
        """Check that the payload version matches the given story
        version.

        Args:
            version_from_payload: int. The payload version.
            story_version: int. The story version.

        Raises:
            InvalidInputException. Error in updating story version.
        """
        if version_from_payload != story_version:
            raise base.BaseHandler.InvalidInputException(
                'Trying to update version %s of story from version %s, '
                'which is too old. Please reload the page and try again.'
                % (story_version, version_from_payload))

    @acl_decorators.can_edit_story
    def get(self, story_id: str) -> None:
        """Populates the data on the individual story page.

        Args:
            story_id: str. The story ID.
        """
        story = story_fetchers.get_story_by_id(story_id, strict=True)
        topic_id = story.corresponding_topic_id
        topic = topic_fetchers.get_topic_by_id(topic_id, strict=True)
        skill_ids = topic.get_all_skill_ids()

        skill_summaries = skill_services.get_multi_skill_summaries(skill_ids)
        skill_summary_dicts = [summary.to_dict() for summary in skill_summaries]
        classroom_url_fragment = (
            classroom_config_services.get_classroom_url_fragment_for_topic_id(
                topic.id))

        for story_reference in topic.canonical_story_references:
            if story_reference.story_id == story_id:
                story_is_published = story_reference.story_is_published

        self.values.update({
            'story': story.to_dict(),
            'topic_name': topic.name,
            'story_is_published': story_is_published,
            'skill_summaries': skill_summary_dicts,
            'topic_url_fragment': topic.url_fragment,
            'classroom_url_fragment': classroom_url_fragment
        })

        self.render_json(self.values)

    @acl_decorators.can_edit_story
    def put(self, story_id: str) -> None:
        """Updates properties of the given story.

        Args:
            story_id: str. The story ID.

        Raises:
            InvalidInputException. The input provided is not valid.
        """
        assert self.user_id is not None
        assert self.normalized_payload is not None
        story = story_fetchers.get_story_by_id(story_id, strict=True)
        version = self.normalized_payload['version']
        commit_message = self.normalized_payload['commit_message']
        change_dicts = self.normalized_payload['change_dicts']
        self._require_valid_version(version, story.version)

        try:
            # Update the Story and its corresponding TopicSummary.
            topic_services.update_story_and_topic_summary(
                self.user_id, story_id, change_dicts, commit_message,
                story.corresponding_topic_id)
        except utils.ValidationError as e:
            raise self.InvalidInputException(e)

        story_dict = story_fetchers.get_story_by_id(story_id).to_dict()

        self.values.update({
            'story': story_dict
        })

        self.render_json(self.values)

    @acl_decorators.can_delete_story
    def delete(self, story_id: str) -> None:
        """Deletes a story.

        Args:
            story_id: str. The story ID.
        """
        assert self.user_id is not None
        story_services.delete_story(self.user_id, story_id)
        self.render_json(self.values)


class StoryPublishHandlerNormalizedPayloadDict(TypedDict):
    """Dict representation of StoryPublishHandler's
    normalized_payload dictionary.
    """

    new_story_status_is_public: bool


class StoryPublishHandler(
    base.BaseHandler[
        StoryPublishHandlerNormalizedPayloadDict,
        Dict[str, str]
    ]
):
    """A data handler for publishing and unpublishing stories."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {
        'story_id': {
            'schema': SCHEMA_FOR_STORY_ID
        }
    }
    HANDLER_ARGS_SCHEMAS = {
        'PUT': {
            'new_story_status_is_public': {
                'schema': {
                    'type': 'bool'
                },
            }
        }
    }

    @acl_decorators.can_edit_story
    def put(self, story_id: str) -> None:
        """Publishes/unpublishes a given story.

        Args:
            story_id: str. The story ID.
        """
        assert self.user_id is not None
        assert self.normalized_payload is not None
        story = story_fetchers.get_story_by_id(story_id, strict=True)
        topic_id = story.corresponding_topic_id

        new_story_status_is_public = self.normalized_payload[
            'new_story_status_is_public']

        if new_story_status_is_public:
            topic_services.publish_story(topic_id, story_id, self.user_id)
        else:
            topic_services.unpublish_story(topic_id, story_id, self.user_id)

        self.render_json(self.values)


class ValidateExplorationsHandlerNormalizedRequestDict(TypedDict):
    """Dict representation of ValidateExplorationsHandler's
    normalized_request dictionary.
    """

    comma_separated_exp_ids: str


# TODO(#16538): Change the type of `comma_separated_exp_ids` handler
# argument to `JsonEncodedInString`.
class ValidateExplorationsHandler(
    base.BaseHandler[
        Dict[str, str],
        ValidateExplorationsHandlerNormalizedRequestDict
    ]
):
    """A data handler for validating the explorations in a story."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {
        'story_id': {
            'schema': SCHEMA_FOR_STORY_ID
        }
    }
    HANDLER_ARGS_SCHEMAS = {
        'GET': {
            'comma_separated_exp_ids': {
                'schema': {
                    'type': 'basestring'
                }
            }
        }
    }

    @acl_decorators.can_edit_story
    def get(self, unused_story_id: str) -> None:
        """Handler that receives a list of exploration IDs, checks whether the
        corresponding explorations are supported on mobile and returns the
        validation error messages (if any).

        Args:
            unused_story_id: str. The unused story ID.
        """
        assert self.normalized_request is not None
        comma_separated_exp_ids = self.normalized_request[
            'comma_separated_exp_ids']
        exp_ids = comma_separated_exp_ids.split(',')
        validation_error_messages = (
            story_services.validate_explorations_for_story(exp_ids, False))
        self.values.update({
            'validation_error_messages': validation_error_messages
        })
        self.render_json(self.values)


class StoryUrlFragmentHandler(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
    """A data handler for checking if a story with given url fragment exists.
    """

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {
        'story_url_fragment': constants.SCHEMA_FOR_STORY_URL_FRAGMENTS
    }
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

    @acl_decorators.open_access
    def get(self, story_url_fragment: str) -> None:
        """Handler that receives a story url fragment and checks whether
        a story with the same url fragment exists or not.

        Args:
            story_url_fragment: str. The story URL fragment.
        """
        self.values.update({
            'story_url_fragment_exists': (
                story_services.does_story_exist_with_url_fragment(
                    story_url_fragment))
        })
        self.render_json(self.values)
