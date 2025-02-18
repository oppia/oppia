# coding: utf-8
#
# Copyright 2022 The Oppia Authors. All Rights Reserved.
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

"""Domain objects for Classroom."""

from __future__ import annotations

import copy
from core import utils
from core.constants import constants

from typing import Dict, List, TypedDict


class ClassroomDict(TypedDict):
    """Dict type for Classroom object."""

    classroom_id: str
    name: str
    url_fragment: str
    course_details: str
    teaser_text: str
    topic_list_intro: str
    topic_id_to_prerequisite_topic_ids: Dict[str, List[str]]
    is_published: bool
    is_diagnostic_test_enabled: bool
    thumbnail_data: ImageDataDict
    banner_data: ImageDataDict
    index: int

# TODO(#17246): Currently, the classroom data is stored in the config model and
# we are planning to migrate the storage into a new Classroom model. After the
# successful migration, this file should be renamed as classroom_domain and
# the exiting classroom domain file should be deleted, until then both of
# the files will exist simultaneously.


class Classroom:
    """Domain object for a classroom."""

    def __init__(
        self,
        classroom_id: str,
        name: str,
        url_fragment: str,
        course_details: str,
        teaser_text: str,
        topic_list_intro: str,
        topic_id_to_prerequisite_topic_ids: Dict[str, List[str]],
        is_published: bool,
        is_diagnostic_test_enabled: bool,
        thumbnail_data: ImageData,
        banner_data: ImageData,
        index: int
    ) -> None:
        """Constructs a Classroom domain object.

        Args:
            classroom_id: str. The ID of the classroom.
            name: str. The name of the classroom.
            url_fragment: str. The url fragment of the classroom.
            course_details: str. Course details for the classroom.
            teaser_text: str. A text to provide a summary of the classroom.
            topic_list_intro: str. Topic list introduction for the classroom.
            topic_id_to_prerequisite_topic_ids: dict(str, list(str)). A dict
                with topic ID as key and a list of prerequisite topic IDs as
                value.
            is_published: bool. Whether this classroom is published or not.
            is_diagnostic_test_enabled: bool. Whether this classroom 
                is published or not.
            thumbnail_data: ImageData. Image data object for classroom
                thumbnail.
            banner_data: ImageData. Image data object for classroom banner.
            index: int. The index of the classroom.
        """
        self.classroom_id = classroom_id
        self.name = name
        self.url_fragment = url_fragment
        self.course_details = course_details
        self.teaser_text = teaser_text
        self.topic_list_intro = topic_list_intro
        self.topic_id_to_prerequisite_topic_ids = (
            topic_id_to_prerequisite_topic_ids)
        self.is_published = is_published
        self.is_diagnostic_test_enabled = is_diagnostic_test_enabled
        self.thumbnail_data = thumbnail_data
        self.banner_data = banner_data
        self.index = index

    @classmethod
    def from_dict(cls, classroom_dict: ClassroomDict) -> Classroom:
        """Returns a classroom domain object from a dict.

        Args:
            classroom_dict: dict. The dict representation of the Classroom
                object.

        Returns:
            Classroom. The classroom object instance.
        """
        return cls(
            classroom_dict['classroom_id'],
            classroom_dict['name'],
            classroom_dict['url_fragment'],
            classroom_dict['course_details'],
            classroom_dict['teaser_text'],
            classroom_dict['topic_list_intro'],
            classroom_dict['topic_id_to_prerequisite_topic_ids'],
            classroom_dict['is_published'],
            classroom_dict['is_diagnostic_test_enabled'],
            ImageData.from_dict(classroom_dict['thumbnail_data']),
            ImageData.from_dict(classroom_dict['banner_data']),
            classroom_dict['index']
        )

    def to_dict(self) -> ClassroomDict:
        """Returns a dict representing a classroom domain object.

        Returns:
            dict. A dict, mapping all fields of classroom instance.
        """
        return {
            'classroom_id': self.classroom_id,
            'name': self.name,
            'url_fragment': self.url_fragment,
            'course_details': self.course_details,
            'teaser_text': self.teaser_text,
            'topic_list_intro': self.topic_list_intro,
            'topic_id_to_prerequisite_topic_ids': (
                self.topic_id_to_prerequisite_topic_ids),
            'is_published': self.is_published,
            'is_diagnostic_test_enabled': self.is_diagnostic_test_enabled,
            'thumbnail_data': self.thumbnail_data.to_dict(),
            'banner_data': self.banner_data.to_dict(),
            'index': self.index
        }

    def get_topic_ids(self) -> List[str]:
        """Returns the list of topic IDs associated with the given classroom.

        Returns:
            list(str). The list of topic IDs.
        """
        return list(self.topic_id_to_prerequisite_topic_ids.keys())

    @classmethod
    def require_valid_name(cls, name: str) -> None:
        """Checks whether the name of the classroom is a valid one.

        Args:
            name: str. The name to validate.
        """
        if not isinstance(name, str):
            raise utils.ValidationError(
                'Expected name of the classroom to be a string, received: %s.'
                % name)

        if name == '':
            raise utils.ValidationError('Name field should not be empty')

        if len(name) > constants.MAX_CHARS_IN_CLASSROOM_NAME:
            raise utils.ValidationError(
                'Classroom name should be at most %d characters, received %s.'
                % (constants.MAX_CHARS_IN_CLASSROOM_NAME, name))

    @classmethod
    def require_valid_teaser_text(cls, teaser_text: str) -> None:
        """Checks whether the teaser text of the classroom is a valid one.

        Args:
            teaser_text: str. The teaser text to validate.
        """
        if not isinstance(teaser_text, str):
            raise utils.ValidationError(
                'Expected teaser_text of the classroom to be a string, '
                'received: %s.' % teaser_text)

        if teaser_text == '':
            raise utils.ValidationError('teaser_text field should not be empty')

        if len(teaser_text) > constants.MAX_CHARS_IN_CLASSROOM_TEASER_TEXT:
            error_message = (
                'Classroom teaser_text should be at most %d characters, '
                'received %s.' % (
                    constants.MAX_CHARS_IN_CLASSROOM_TEASER_TEXT,
                    teaser_text
                )
            )
            raise utils.ValidationError(error_message)

    @classmethod
    def require_valid_topic_list_intro(cls, topic_list_intro: str) -> None:
        """Checks whether the teaser text of the classroom is a valid one.

        Args:
            topic_list_intro: str. The topic list intro to validate.
        """
        if not isinstance(topic_list_intro, str):
            raise utils.ValidationError(
                'Expected topic_list_intro of the classroom to be a string, '
                'received: %s.' % topic_list_intro)

        if topic_list_intro == '':
            raise utils.ValidationError(
                'topic_list_intro field should not be empty')

        if len(
            topic_list_intro
        ) > constants.MAX_CHARS_IN_CLASSROOM_TOPIC_LIST_INTRO:
            error_message = (
                'Classroom topic_list_intro should be at most %d '
                'characters, received %s.' % (
                    constants.MAX_CHARS_IN_CLASSROOM_TOPIC_LIST_INTRO,
                    topic_list_intro
                )
            )
            raise utils.ValidationError(error_message)

    @classmethod
    def require_valid_course_details(cls, course_details: str) -> None:
        """Checks whether the teaser text of the classroom is a valid one.

        Args:
            course_details: str. The course details to validate.
        """
        if not isinstance(course_details, str):
            raise utils.ValidationError(
                'Expected course_details of the classroom to be a string, '
                'received: %s.' % course_details)

        if course_details == '':
            raise utils.ValidationError(
                'course_details field should not be empty')

        if len(
            course_details
            ) > constants.MAX_CHARS_IN_CLASSROOM_COURSE_DETAILS:
            error_message = (
                'Classroom course_details should be at most %d characters, '
                'received %s.' % (
                    constants.MAX_CHARS_IN_CLASSROOM_COURSE_DETAILS,
                        course_details
                )
            )
            raise utils.ValidationError(error_message)

    @classmethod
    def require_valid_url_fragment(cls, url_fragment: str) -> None:
        """Checks whether the url fragment of the classroom is a valid one.

        Args:
            url_fragment: str. The url fragment to validate.
        """
        if not isinstance(url_fragment, str):
            raise utils.ValidationError(
                'Expected url fragment of the classroom to be a string, '
                'received: %s.' % url_fragment)

        if url_fragment == '':
            raise utils.ValidationError(
                'Url fragment field should not be empty'
            )

        utils.require_valid_url_fragment(
            url_fragment, 'Classroom URL Fragment',
            constants.MAX_CHARS_IN_CLASSROOM_URL_FRAGMENT
        )

    @classmethod
    def require_valid_bg_color(
        cls, bg_color: str, is_thumbnail: bool) -> None:
        """Checks whether the image bg_color of the classroom is valid.

        Args:
            bg_color: str. The background color of the image.
            is_thumbnail: bool. Whether the image is thumbnail or not.
        """
        image_type = 'thumbnail' if is_thumbnail else 'banner'

        if bg_color == '':
            raise utils.ValidationError(
                f'{image_type}_bg_color field should not be empty')

        if (
            bg_color not in (
                constants.ALLOWED_THUMBNAIL_BG_COLORS['classroom'])):
            raise utils.ValidationError(
                f'Classroom {image_type} background color '
                f'{bg_color} is not supported.')

    @classmethod
    def check_for_cycles_in_topic_id_to_prerequisite_topic_ids(
        cls, topic_id_to_prerequisite_topic_ids: Dict[str, List[str]]
        ) -> None:
        """Checks for loop in topic_id_to_prerequisite_topic_ids.

        Args:
            topic_id_to_prerequisite_topic_ids: 
                Dict[str, List[str]]. The topic ID to prerequisite ID mapping.
        """
        if not isinstance(topic_id_to_prerequisite_topic_ids, dict):
            raise utils.ValidationError(
                'Expected topic ID to prerequisite topic IDs of the classroom '
                'to be a string, received: %s.' % (
                    topic_id_to_prerequisite_topic_ids))
        cyclic_check_error = (
            'The topic ID to prerequisite topic IDs graph '
            'should not contain any cycles.'
        )
        for topic_id in topic_id_to_prerequisite_topic_ids:
            ancestors = copy.deepcopy(
                topic_id_to_prerequisite_topic_ids[topic_id])
            visited_topic_ids_for_current_node = []
            while len(ancestors) > 0:
                if topic_id in ancestors:
                    raise utils.ValidationError(cyclic_check_error)

                ancestor_topic_id = ancestors.pop()

                if ancestor_topic_id in visited_topic_ids_for_current_node:
                    continue

                ancestors.extend(
                    topic_id_to_prerequisite_topic_ids.get(
                        ancestor_topic_id, []
                    )
                )
                visited_topic_ids_for_current_node.append(ancestor_topic_id)

    def validate(self, strict: bool = False) -> None:
        """Validates various properties of the Classroom."""

        if not isinstance(self.classroom_id, str):
            raise utils.ValidationError(
                'Expected ID of the classroom to be a string, received: %s.'
                % self.classroom_id)
        self.require_valid_name(self.name)
        self.require_valid_url_fragment(self.url_fragment)
        self.check_for_cycles_in_topic_id_to_prerequisite_topic_ids(
            self.topic_id_to_prerequisite_topic_ids)
        if not isinstance(self.is_published, bool):
            raise utils.ValidationError(
                'Expected is_published of the classroom to be a boolean, '
                'received: %s.' % self.is_published)

        if not isinstance(self.is_diagnostic_test_enabled, bool):
            raise utils.ValidationError(
                'Expected is_diagnostic_test_enabled of the classroom to '
                'be a boolean, received: %s.' % (
                    self.is_diagnostic_test_enabled))

        if strict:
            if not isinstance(self.index, int):
                raise utils.ValidationError(
                    'Expected index of the classroom to be a boolean, '
                    'received: %s.' % self.index)

            if not isinstance(self.thumbnail_data, ImageData):
                raise utils.ValidationError(
                    'Expected thumbnail_data of the classroom to be a string, '
                    'received: %s.' % self.thumbnail_data
                )
            if not isinstance(self.banner_data, ImageData):
                raise utils.ValidationError(
                    'Expected banner_data of the classroom to be a string, '
                    'received: %s.' % self.banner_data
                )
            if self.thumbnail_data.filename == '':
                raise utils.ValidationError(
                    'thumbnail_filename field should not be empty')
            if self.banner_data.filename == '':
                raise utils.ValidationError(
                    'banner_filename field should not be empty')
            if not self.topic_id_to_prerequisite_topic_ids:
                raise utils.ValidationError(
                    'A classroom should have at least one topic.'
                )
            self.require_valid_teaser_text(self.teaser_text)
            self.require_valid_topic_list_intro(self.topic_list_intro)
            self.require_valid_course_details(self.course_details)
            self.require_valid_bg_color(self.thumbnail_data.bg_color, True)
            self.require_valid_bg_color(self.banner_data.bg_color, False)
            utils.require_valid_image_filename(self.banner_data.filename)
            utils.require_valid_thumbnail_filename(self.thumbnail_data.filename)


class ImageDataDict(TypedDict, total=False):
    """Dict type for thumbnail and banner image"""

    filename: str
    bg_color: str
    size_in_bytes: int


class ImageData:
    """Domain object for a image."""

    def __init__(
        self,
        filename: str,
        bg_color: str,
        size_in_bytes: int,
    ) -> None:
        """Constructs a ImageData domain object.

        Args:
            filename: str. The filename of the image.
            bg_color: str. The background color of the image.
            size_in_bytes: int. The size of image in bytes.
        """
        self.filename = filename
        self.bg_color = bg_color
        self.size_in_bytes = size_in_bytes

    @classmethod
    def from_dict(cls, image_data_dict: ImageDataDict) -> ImageData:
        """Returns a image data domain object from a dict.

        Args:
            image_data_dict: dict. The dict representation of the image
                object.

        Returns:
            ImageData. The image data object instance.
        """
        return cls(
            image_data_dict['filename'],
            image_data_dict['bg_color'],
            image_data_dict['size_in_bytes']
        )

    def to_dict(self) -> ImageDataDict:
        """Returns a dict representing a image data domain object.

        Returns:
            dict. A dict, mapping all fields of image data instance.
        """
        return {
            'filename': self.filename,
            'bg_color': self.bg_color,
            'size_in_bytes': self.size_in_bytes,
        }


class ClassroomIdToIndexDict(TypedDict):
    """Dict type for ClassroomIdToIndex object."""

    classroom_id: str
    classroom_name: str
    classroom_index: int
