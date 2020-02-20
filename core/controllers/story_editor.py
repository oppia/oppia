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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.controllers import acl_decorators
from core.controllers import base
from core.domain import skill_services
from core.domain import story_domain
from core.domain import story_fetchers
from core.domain import story_services
from core.domain import topic_fetchers
from core.domain import topic_services
import feconf
import utils


class StoryEditorPage(base.BaseHandler):
    """The editor page for a single story."""

    @acl_decorators.can_edit_story
    def get(self, _):
        """Handles GET requests."""

        self.render_template('story-editor-page.mainpage.html')


class EditableStoryDataHandler(base.BaseHandler):
    """A data handler for stories which support writing."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    def _require_valid_version(self, version_from_payload, story_version):
        """Check that the payload version matches the given story
        version.
        """
        if version_from_payload is None:
            raise base.BaseHandler.InvalidInputException(
                'Invalid POST request: a version must be specified.')

        if version_from_payload != story_version:
            raise base.BaseHandler.InvalidInputException(
                'Trying to update version %s of story from version %s, '
                'which is too old. Please reload the page and try again.'
                % (story_version, version_from_payload))

    @acl_decorators.can_edit_story
    def get(self, storyId):
        """Populates the data on the individual story page."""
        story = story_fetchers.get_story_by_id(storyId, strict=False)
        topicId = story.correspondingTopicId
        topic = topic_fetchers.get_topic_by_id(topicId, strict=False)
        skillIds = topic.get_all_skill_ids()
        skillSummaries = skill_services.get_multi_skill_summaries(skillIds)
        skillSummaryDicts = [summary.to_dict() for summary in skillSummaries]

        for story_reference in topic.canonical_story_references:
            if story_reference.storyId == storyId:
                storyIsPublished = story_reference.storyIsPublished

        self.values.update({
            'story': story.to_dict(),
            'topicName': topic.name,
            'storyIsPublished': storyIsPublished,
            'skillSummaries': skillSummaryDicts
        })

        self.render_json(self.values)

    @acl_decorators.can_edit_story
    def put(self, storyId):
        """Updates properties of the given story."""
        story = story_fetchers.get_story_by_id(storyId, strict=False)

        version = self.payload.get('version')
        self._require_valid_version(version, story.version)

        commitMessage = self.payload.get('commitMessage')
        changeDicts = self.payload.get('changeDicts')
        change_list = [
            story_domain.StoryChange(changeDict)
            for changeDict in changeDicts
        ]
        try:
            story_services.update_story(
                self.userId, storyId, changeList, commitMessage)
        except utils.ValidationError as e:
            raise self.InvalidInputException(e)

        storyDict = story_fetchers.get_story_by_id(storyId).to_dict()

        self.values.update({
            'story': storyDict
        })

        self.render_json(self.values)

    @acl_decorators.can_delete_story
    def delete(self, storyId):
        """Handles Delete requests."""
        story_services.delete_story(self.userId, storyId)
        self.render_json(self.values)


class StoryPublishHandler(base.BaseHandler):
    """A data handler for publishing and unpublishing stories."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    @acl_decorators.can_edit_story
    def put(self, storyId):
        """Published/unpublished given story."""
        story = story_fetchers.get_story_by_id(storyId, strict=False)
        topicId = story.correspondingTopicId

        new_story_status_is_public = self.payload.get(
            'newStoryStatusIsPublic')
        if not isinstance(newStoryStatusIsPublic, bool):
            raise self.InvalidInputException

        if newStoryStatusIsPublic:
            topic_services.publish_story(topicId, storyId, self.userId)
        else:
            topic_services.unpublish_story(topicId, storyId, self.userId)

        self.render_json(self.values)
