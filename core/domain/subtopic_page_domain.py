# coding: utf-8
#
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

"""Domain objects for the pages for subtopics, and related models."""

import copy

from constants import constants
from core.domain import html_cleaner
from core.platform import models
import utils

(topic_models,) = models.Registry.import_models([models.NAMES.topic])

SUBTOPIC_PAGE_PROPERTY_HTML_DATA = 'html_data'

CMD_ADD_SUBTOPIC = 'add_subtopic'
CMD_CREATE_NEW = 'create_new'
CMD_DELETE_SUBTOPIC = 'delete_subtopic'
# These take additional 'property_name' and 'new_value' parameters and,
# optionally, 'old_value'.
CMD_UPDATE_SUBTOPIC_PAGE_PROPERTY = 'update_subtopic_page_property'


class SubtopicPageChange(object):
    """Domain object for changes made to subtopic_page object."""

    SUBTOPIC_PAGE_PROPERTIES = (SUBTOPIC_PAGE_PROPERTY_HTML_DATA,)

    OPTIONAL_CMD_ATTRIBUTE_NAMES = [
        'property_name', 'new_value', 'old_value', 'name', 'subtopic_id',
        'topic_id'
    ]

    def __init__(self, change_dict):
        """Initialize a SubtopicPageChange object from a dict.

        Args:
            change_dict: dict. Represents a command. It should have a 'cmd'
                key, and one or more other keys. The keys depend on what the
                value for 'cmd' is. The possible values for 'cmd' are listed
                below, together with the other keys in the dict:
                - 'update_topic_property' (with property_name, new_value
                and old_value)

        Raises:
            Exception: The given change dict is not valid.
        """
        if 'cmd' not in change_dict:
            raise Exception('Invalid change_dict: %s' % change_dict)
        self.cmd = change_dict['cmd']

        if self.cmd == CMD_UPDATE_SUBTOPIC_PAGE_PROPERTY:
            if (change_dict['property_name'] not in
                    self.SUBTOPIC_PAGE_PROPERTIES):
                raise Exception('Invalid change_dict: %s' % change_dict)
            self.property_name = change_dict['property_name']
            self.new_value = copy.deepcopy(change_dict['new_value'])
            self.old_value = copy.deepcopy(change_dict['old_value'])
            self.id = change_dict['subtopic_id']
        elif self.cmd == CMD_CREATE_NEW:
            self.topic_id = change_dict['topic_id']
        else:
            raise Exception('Invalid change_dict: %s' % change_dict)

    def to_dict(self):
        """Returns a dict representing the SubtopicPageChange domain object.

        Returns:
            A dict, mapping all fields of SubtopicPageChange instance.
        """
        subtopic_page_change_dict = {}
        subtopic_page_change_dict['cmd'] = self.cmd
        for attribute_name in self.OPTIONAL_CMD_ATTRIBUTE_NAMES:
            if hasattr(self, attribute_name):
                subtopic_page_change_dict[attribute_name] = getattr(
                    self, attribute_name)

        return subtopic_page_change_dict


class SubtopicPage(object):
    """Domain object for a Subtopic page."""

    def __init__(
            self, subtopic_page_id, topic_id, html_data, language_code,
            version):
        """Constructs a SubtopicPage domain object.

        Args:
            subtopic_page_id: str. The unique ID of the subtopic page.
            topic_id: str. The ID of the topic that this subtopic is a part of.
            html_data: str. The HTML content of the subtopic page.
            language_code: str. The ISO 639-1 code for the language this
                subtopic page is written in.
            version: int. The current version of the subtopic.
        """
        self.id = subtopic_page_id
        self.topic_id = topic_id
        self.html_data = html_cleaner.clean(html_data)
        self.language_code = language_code
        self.version = version

    def to_dict(self):
        """Returns a dict representing this SubtopicPage domain object.

        Returns:
            A dict, mapping all fields of SubtopicPage instance.
        """
        return {
            'id': self.id,
            'topic_id': self.topic_id,
            'html_data': self.html_data,
            'language_code': self.language_code,
            'version': self.version
        }

    @classmethod
    def get_subtopic_page_id(cls, topic_id, subtopic_id):
        """Returns the subtopic page id from the topic_id and subtopic_id.

        Args:
            topic_id: str. The id of the topic that the subtopic is a part of.
            subtopic_id: int. The id of the subtopic.

        Returns:
            str. The subtopic_page_id calculated from the given values.
        """
        return '%s-%s' % (topic_id, subtopic_id)

    @classmethod
    def create_default_subtopic_page(cls, subtopic_id, topic_id):
        """Creates a SubtopicPage object with default values.

        Args:
            subtopic_id: str. ID of the subtopic.
            topic_id: str. The Id of the topic to which this page is linked
                with.

        Returns:
            SubtopicPage. A subtopic object with given id, topic_id and empty
                html_data field.
        """
        subtopic_page_id = cls.get_subtopic_page_id(topic_id, subtopic_id)
        return cls(
            subtopic_page_id, topic_id, '', constants.DEFAULT_LANGUAGE_CODE, 0)

    def get_subtopic_id_from_subtopic_page_id(self):
        """Returns the subtopic id from the subtopic page id of the object.

        Returns:
            int. The subtopic_id of the object.
        """
        return int(self.id[len(self.topic_id) + 1:])

    def update_html_data(self, new_html_data):
        """The new value for the html data field.

        Args:
            new_html_data: str. The new html data for the subtopic page.
        """
        self.html_data = html_cleaner.clean(new_html_data)

    def validate(self):
        """Validates various properties of the SubtopicPage object.

        Raises:
            ValidationError: One or more attributes of the subtopic page are
                invalid.
        """
        if not isinstance(self.topic_id, basestring):
            raise utils.ValidationError(
                'Expected topic_id to be a string, received %s' %
                self.topic_id)
        if not isinstance(self.version, int):
            raise utils.ValidationError(
                'Expected version number to be an int, received %s' %
                self.version)
        if not isinstance(self.html_data, basestring):
            raise utils.ValidationError(
                'Expected html data to be a string, received %s' %
                self.html_data)

        if not isinstance(self.language_code, basestring):
            raise utils.ValidationError(
                'Expected language code to be a string, received %s' %
                self.language_code)
        if not any([self.language_code == lc['code']
                    for lc in constants.ALL_LANGUAGE_CODES]):
            raise utils.ValidationError(
                'Invalid language code: %s' % self.language_code)
