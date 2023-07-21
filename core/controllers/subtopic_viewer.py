# Copyright 2019 The Oppia Authors. All Rights Reserved.
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

"""Controllers for the subtopic viewer page."""

from __future__ import annotations

from core import feconf
from core.constants import constants
from core.controllers import acl_decorators
from core.controllers import base
from core.domain import subtopic_page_services
from core.domain import topic_fetchers

from typing import Dict


class SubtopicViewerPage(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
    """Renders the subtopic viewer page."""

    URL_PATH_ARGS_SCHEMAS = {
        'classroom_url_fragment': constants.SCHEMA_FOR_CLASSROOM_URL_FRAGMENTS,
        'topic_url_fragment': constants.SCHEMA_FOR_TOPIC_URL_FRAGMENTS,
        'subtopic_url_fragment': {
            'schema': {
                'type': 'basestring',
                'validators': [{
                    'id': 'is_regex_matched',
                    'regex_pattern': constants.VALID_URL_FRAGMENT_REGEX
                }, {
                    'id': 'has_length_at_most',
                    'max_value': constants.MAX_CHARS_IN_SUBTOPIC_URL_FRAGMENT
                }]
            }
        }
    }
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

    @acl_decorators.can_access_subtopic_viewer_page
    def get(self, *args: str) -> None:
        """Handles GET requests.

        Args:
            *args: list(*). Variable-length argument list, not accessed.
        """

        self.render_template('subtopic-viewer-page.mainpage.html')


class SubtopicPageDataHandler(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
    """Manages the data that needs to be displayed to a learner on the
    subtopic page.
    """

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {
        'classroom_url_fragment': constants.SCHEMA_FOR_CLASSROOM_URL_FRAGMENTS,
        'topic_url_fragment': constants.SCHEMA_FOR_TOPIC_URL_FRAGMENTS,
        'subtopic_url_fragment': {
            'schema': {
                'type': 'basestring',
                'validators': [{
                    'id': 'is_regex_matched',
                    'regex_pattern': constants.VALID_URL_FRAGMENT_REGEX
                }, {
                    'id': 'has_length_at_most',
                    'max_value': constants.MAX_CHARS_IN_SUBTOPIC_URL_FRAGMENT
                }]
            }
        }
    }
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

    @acl_decorators.can_access_subtopic_viewer_page
    def get(self, topic_name: str, subtopic_id: int) -> None:
        """Handles GET requests.

        Args:
            topic_name: str. The name of the topic that the subtopic is present
                in.
            subtopic_id: str. The id of the subtopic, which is an integer in
                string form.
        """

        subtopic_id = int(subtopic_id)
        topic = topic_fetchers.get_topic_by_name(topic_name)
        next_subtopic_dict = None
        prev_subtopic_dict = None
        for index, subtopic in enumerate(topic.subtopics):
            if subtopic.id == subtopic_id:
                subtopic_title = subtopic.title
                if index != len(topic.subtopics) - 1:
                    next_subtopic_dict = topic.subtopics[index + 1].to_dict()
                # Checking greater than 1 here, since otherwise the only
                # subtopic page of the topic would always link to itself at the
                # bottom of the subtopic page which isn't expected.
                elif len(topic.subtopics) > 1:
                    prev_subtopic_dict = topic.subtopics[index - 1].to_dict()
                break
        subtopic_page_contents = (
            subtopic_page_services.get_subtopic_page_contents_by_id(
                topic.id, subtopic_id))
        subtopic_page_contents_dict = subtopic_page_contents.to_dict()

        self.values.update({
            'topic_id': topic.id,
            'topic_name': topic.name,
            'page_contents': subtopic_page_contents_dict,
            'subtopic_title': subtopic_title,
            'next_subtopic_dict': next_subtopic_dict,
            'prev_subtopic_dict': prev_subtopic_dict,
        })
        self.render_json(self.values)
