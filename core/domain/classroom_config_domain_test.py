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

# Currently, the classroom data is stored in the config model and we are
# planning to migrate the storage into a new Classroom model. After the
# successful migration, this file should be renamed as classroom_domain_test and
# the exiting classroom domain test file should be deleted, until then both of
# the files will exist simultaneously.

"""Unit tests for classroom_config_domain.py."""

from __future__ import annotations

from core import utils
from core.constants import constants
from core.domain import classroom_config_domain
from core.tests import test_utils


class ClassroomDomainTests(test_utils.GenericTestBase):

    def setUp(self) -> None:
        super().setUp()
        self.dummy_thumbnail_data = classroom_config_domain.ImageData(
            'thumbnail.svg', 'transparent', 1000
        )
        self.dummy_banner_data = classroom_config_domain.ImageData(
            'banner.png', 'transparent', 1000
        )
        self.classroom = classroom_config_domain.Classroom(
            'classroom_id', 'math', 'math',
            'Curated math foundations course.',
            'Learn math through fun stories!',
            'Start from the basics with our first topic.',
            {
                'topic_id_1': ['topic_id_2', 'topic_id_3'],
                'topic_id_2': [],
                'topic_id_3': []
            }, True, False, self.dummy_thumbnail_data,
            self.dummy_banner_data, 0
        )
        self.classroom_dict: classroom_config_domain.ClassroomDict = {
            'classroom_id': 'classroom_id',
            'name': 'math',
            'url_fragment': 'math',
            'course_details': 'Curated math foundations course.',
            'teaser_text': 'Learn math through fun stories!',
            'topic_list_intro': 'Start from the basics with our first topic.',
            'topic_id_to_prerequisite_topic_ids': {
                'topic_id_1': ['topic_id_2', 'topic_id_3'],
                'topic_id_2': [],
                'topic_id_3': []
            },
            'is_published': True,
            'is_diagnostic_test_enabled': False,
            'thumbnail_data': self.dummy_thumbnail_data.to_dict(),
            'banner_data': self.dummy_banner_data.to_dict(),
            'index': 0
        }

    def test_that_domain_object_is_created_correctly(self) -> None:
        self.assertEqual(self.classroom.classroom_id, 'classroom_id')
        self.assertEqual(self.classroom.name, 'math')
        self.assertEqual(self.classroom.url_fragment, 'math')
        self.assertEqual(
            self.classroom.course_details,
            'Curated math foundations course.'
        )
        self.assertEqual(
            self.classroom.teaser_text,
            'Learn math through fun stories!'
        )
        self.assertEqual(
            self.classroom.topic_list_intro,
            'Start from the basics with our first topic.'
        )
        self.assertEqual(
            self.classroom.topic_id_to_prerequisite_topic_ids,
            {
                'topic_id_1': ['topic_id_2', 'topic_id_3'],
                'topic_id_2': [],
                'topic_id_3': []
            }
        )
        self.assertListEqual(
            self.classroom.get_topic_ids(),
            ['topic_id_1', 'topic_id_2', 'topic_id_3']
        )
        self.assertTrue(self.classroom.is_published)
        self.assertEqual(
            self.classroom.thumbnail_data, self.dummy_thumbnail_data
        )
        self.assertEqual(self.classroom.banner_data, self.dummy_banner_data)
        self.assertEqual(self.classroom.index, 0)
        self.classroom.validate(strict=True)

    def test_from_dict_method(self) -> None:
        classroom = classroom_config_domain.Classroom.from_dict(
            self.classroom_dict)

        self.assertEqual(classroom.classroom_id, 'classroom_id')
        self.assertEqual(classroom.name, 'math')
        self.assertEqual(classroom.url_fragment, 'math')
        self.assertEqual(
            classroom.course_details,
            'Curated math foundations course.'
        )
        self.assertEqual(
            classroom.teaser_text,
            'Learn math through fun stories!'
        )
        self.assertEqual(
            classroom.topic_list_intro,
            'Start from the basics with our first topic.'
        )
        self.assertEqual(
            classroom.topic_id_to_prerequisite_topic_ids,
            {
                'topic_id_1': ['topic_id_2', 'topic_id_3'],
                'topic_id_2': [],
                'topic_id_3': []
            }
        )
        self.assertTrue(classroom.is_published)
        self.assertEqual(
            classroom.thumbnail_data.to_dict(),
            self.dummy_thumbnail_data.to_dict()
        )
        self.assertEqual(
            classroom.banner_data.to_dict(),
            self.dummy_banner_data.to_dict()
        )
        self.assertEqual(classroom.index, 0)

    def test_to_dict_method(self) -> None:
        self.assertEqual(self.classroom.to_dict(), self.classroom_dict)

    # TODO(#13059): Here we use MyPy ignore because after we fully type
    # the codebase we plan to get rid of the tests that intentionally
    # test wrong inputs that we can normally catch by typing.
    def test_invalid_classroom_id_should_raise_exception(self) -> None:
        self.classroom.classroom_id = 1 # type: ignore[assignment]
        error_msg = (
            'Expected ID of the classroom to be a string, received: 1.')
        with self.assertRaisesRegex(
            utils.ValidationError, error_msg):
            self.classroom.validate(strict=True)

    # TODO(#13059): Here we use MyPy ignore because after we fully type
    # the codebase we plan to get rid of the tests that intentionally
    # test wrong inputs that we can normally catch by typing.
    def test_invalid_classroom_name_should_raise_exception(
        self
    ) -> None:
        self.classroom.name = 1 # type: ignore[assignment]
        error_msg = (
            'Expected name of the classroom to be a string, received: 1.')
        with self.assertRaisesRegex(
            utils.ValidationError, error_msg):
            self.classroom.validate(strict=True)

        self.classroom.name = ''
        error_msg = 'Name field should not be empty'
        with self.assertRaisesRegex(
            utils.ValidationError, error_msg):
            self.classroom.validate(strict=True)

        self.classroom.name = 'Long classroom name' * 5
        error_msg = (
            'Classroom name should be at most 39 characters, received '
            '%s.' % self.classroom.name)
        with self.assertRaisesRegex(
            utils.ValidationError, error_msg):
            self.classroom.validate(strict=True)

    # TODO(#13059): Here we use MyPy ignore because after we fully type
    # the codebase we plan to get rid of the tests that intentionally
    # test wrong inputs that we can normally catch by typing.
    def test_invalid_classroom_url_fragment_should_raise_exception(
        self
    ) -> None:
        self.classroom.url_fragment = 1 # type: ignore[assignment]
        error_msg = (
            'Expected url fragment of the classroom to be a string, received: '
            '1.'
        )
        with self.assertRaisesRegex(
            utils.ValidationError, error_msg):
            self.classroom.validate(strict=True)

        self.classroom.url_fragment = ''
        error_msg = 'Url fragment field should not be empty'
        with self.assertRaisesRegex(
            utils.ValidationError, error_msg):
            self.classroom.validate(strict=True)

        self.classroom.url_fragment = 'long-url-fragment' * 2
        error_msg = (
            'Classroom URL Fragment field should not exceed 20 characters, '
            'received %s.' % self.classroom.url_fragment)
        with self.assertRaisesRegex(
            utils.ValidationError, error_msg):
            self.classroom.validate(strict=True)

    # TODO(#13059): Here we use MyPy ignore because after we fully type
    # the codebase we plan to get rid of the tests that intentionally
    # test wrong inputs that we can normally catch by typing.
    def test_invalid_teaser_text_should_raise_exception(self) -> None:
        self.classroom.teaser_text = 1 # type: ignore[assignment]
        error_msg = (
            'Expected teaser_text of the classroom to be a string, received: 1.'
        )
        with self.assertRaisesRegex(
            utils.ValidationError, error_msg):
            self.classroom.validate(strict=True)

        self.classroom.teaser_text = ''
        error_msg = 'teaser_text field should not be empty'
        with self.assertRaisesRegex(
            utils.ValidationError, error_msg):
            self.classroom.validate(strict=True)

        self.classroom.teaser_text = 'long-teaser-text' * 10
        error_msg = (
            'Classroom teaser_text should be at most %d characters, '
            'received %s.' %
            (
                constants.MAX_CHARS_IN_CLASSROOM_TEASER_TEXT,
                self.classroom.teaser_text
            )
        )
        with self.assertRaisesRegex(
            utils.ValidationError, error_msg):
            self.classroom.validate(strict=True)

    # TODO(#13059): Here we use MyPy ignore because after we fully type
    # the codebase we plan to get rid of the tests that intentionally
    # test wrong inputs that we can normally catch by typing.
    def test_invalid_topic_list_intro_should_raise_exception(self) -> None:
        self.classroom.topic_list_intro = 1 # type: ignore[assignment]
        error_msg = (
            'Expected topic_list_intro of the classroom to be a string, '
            'received: 1.'
        )
        with self.assertRaisesRegex(
            utils.ValidationError, error_msg):
            self.classroom.validate(strict=True)

        self.classroom.topic_list_intro = ''
        error_msg = 'topic_list_intro field should not be empty'
        with self.assertRaisesRegex(
            utils.ValidationError, error_msg):
            self.classroom.validate(strict=True)

        self.classroom.topic_list_intro = 'a' * 241
        error_msg = (
            'Classroom topic_list_intro should be at most %d characters, '
            'received %s.' %
            (
                constants.MAX_CHARS_IN_CLASSROOM_TOPIC_LIST_INTRO,
                self.classroom.topic_list_intro
            )
        )
        with self.assertRaisesRegex(
            utils.ValidationError, error_msg):
            self.classroom.validate(strict=True)

    # TODO(#13059): Here we use MyPy ignore because after we fully type
    # the codebase we plan to get rid of the tests that intentionally
    # test wrong inputs that we can normally catch by typing.
    def test_invalid_course_details_should_raise_exception(self) -> None:
        self.classroom.course_details = 1 # type: ignore[assignment]
        error_msg = (
            'Expected course_details of the classroom to be a string, '
            'received: 1.'
        )
        with self.assertRaisesRegex(
            utils.ValidationError, error_msg):
            self.classroom.validate(strict=True)

        self.classroom.course_details = ''
        error_msg = 'course_details field should not be empty'
        with self.assertRaisesRegex(
            utils.ValidationError, error_msg):
            self.classroom.validate(strict=True)

        self.classroom.course_details = 'a' * 721
        error_msg = (
            'Classroom course_details should be at most %d '
            'characters, received %s.' %
            (
                constants.MAX_CHARS_IN_CLASSROOM_COURSE_DETAILS,
                self.classroom.course_details
            )
        )
        with self.assertRaisesRegex(
            utils.ValidationError, error_msg):
            self.classroom.validate(strict=True)

    # TODO(#13059): Here we use MyPy ignore because after we fully type
    # the codebase we plan to get rid of the tests that intentionally
    # test wrong inputs that we can normally catch by typing.
    def test_invalid_topic_dependency_dict_should_raise_exception(
        self
    ) -> None:
        self.classroom.topic_id_to_prerequisite_topic_ids = 1 # type: ignore[assignment]
        error_msg = (
            'Expected topic ID to prerequisite topic IDs of the classroom to '
            'be a string, received: 1.'
        )
        with self.assertRaisesRegex(
            utils.ValidationError, error_msg):
            self.classroom.validate(strict=True)

    # TODO(#13059): Here we use MyPy ignore because after we fully type
    # the codebase we plan to get rid of the tests that intentionally
    # test wrong inputs that we can normally catch by typing.
    def test_invalid_is_published_should_raise_exception(self) -> None:
        self.classroom.is_published = 1 # type: ignore[assignment]
        error_msg = (
            'Expected is_published of the classroom to be a boolean, '
            'received: 1.'
        )
        with self.assertRaisesRegex(
            utils.ValidationError, error_msg):
            self.classroom.validate(strict=True)

    # TODO(#13059): Here we use MyPy ignore because after we fully type
    # the codebase we plan to get rid of the tests that intentionally
    # test wrong inputs that we can normally catch by typing.
    def test_invalid_is_diagnostic_test_enabled_should_raise_exception(
            self) -> None:
        self.classroom.is_diagnostic_test_enabled = 1 # type: ignore[assignment]
        error_msg = (
            'Expected is_diagnostic_test_enabled of the classroom to be'
            ' a boolean, received: 1.'
        )
        with self.assertRaisesRegex(
            utils.ValidationError, error_msg):
            self.classroom.validate(strict=True)

    # TODO(#13059): Here we use MyPy ignore because after we fully type
    # the codebase we plan to get rid of the tests that intentionally
    # test wrong inputs that we can normally catch by typing.
    def test_invalid_index_should_raise_exception(self) -> None:
        self.classroom.index = 'index' # type: ignore[assignment]
        error_msg = (
            'Expected index of the classroom to be a boolean, '
            'received: index.'
        )
        with self.assertRaisesRegex(
            utils.ValidationError, error_msg):
            self.classroom.validate(strict=True)

    def test_cycle_between_topic_id_and_prerequisites_should_raise_exception(
        self
    ) -> None:
        error_msg = (
            'The topic ID to prerequisite topic IDs graph should not contain '
            'any cycles.'
        )

        # Cyclic graph 1.
        self.classroom.topic_id_to_prerequisite_topic_ids = {
            'topic_id_1': ['topic_id_2', 'topic_id_3'],
            'topic_id_2': [],
            'topic_id_3': ['topic_id_1']
        }
        with self.assertRaisesRegex(
            utils.ValidationError, error_msg):
            self.classroom.validate(strict=True)

        self.classroom.topic_id_to_prerequisite_topic_ids = {
            'topic_id_1': ['topic_id_2', 'topic_id_3'],
            'topic_id_2': [],
            'topic_id_3': ['topic_id_1']
        }

        # Cyclic graph 2.
        self.classroom.topic_id_to_prerequisite_topic_ids = {
            'topic_id_1': ['topic_id_3'],
            'topic_id_2': ['topic_id_1'],
            'topic_id_3': ['topic_id_2']
        }
        with self.assertRaisesRegex(
            utils.ValidationError, error_msg):
            self.classroom.validate(strict=True)

        error_msg = 'A classroom should have at least one topic.'
        self.classroom.topic_id_to_prerequisite_topic_ids = {}
        with self.assertRaisesRegex(
            utils.ValidationError, error_msg):
            self.classroom.validate(strict=True)

    def test_valid_topic_id_to_prerequisite_topic_ids_graph(self) -> None:
        # Test valid graph 1.
        self.classroom.topic_id_to_prerequisite_topic_ids = {
            'topic_id_1': [],
            'topic_id_2': ['topic_id_1'],
            'topic_id_3': ['topic_id_2']
        }
        self.classroom.validate(strict=True)

        # Test valid graph 2.
        self.classroom.topic_id_to_prerequisite_topic_ids = {
            'topic_id_1': [],
            'topic_id_2': ['topic_id_1', 'topic_id_4'],
            'topic_id_3': ['topic_id_1', 'topic_id_2'],
            'topic_id_4': []
        }
        self.classroom.validate(strict=True)

        # Test valid graph 3.
        self.classroom.topic_id_to_prerequisite_topic_ids = {
            'topic_id_1': []
        }
        self.classroom.validate(strict=True)

        # Test valid graph 4.
        self.classroom.topic_id_to_prerequisite_topic_ids = {
            'topic_id_1': [],
            'topic_id_2': ['topic_id_1'],
            'topic_id_3': ['topic_id_2', 'topic_id_1']
        }
        self.classroom.validate(strict=True)

    # TODO(#13059): Here we use MyPy ignore because after we fully type
    # the codebase we plan to get rid of the tests that intentionally
    # test wrong inputs that we can normally catch by typing.
    def test_invalid_thumbnail_data_should_raise_exception(self) -> None:
        self.classroom.thumbnail_data = 1 # type: ignore[assignment]
        error_msg = (
            'Expected thumbnail_data of the classroom to be a string, '
            'received: 1.'
        )
        with self.assertRaisesRegex(
            utils.ValidationError, error_msg):
            self.classroom.validate(strict=True)

    # TODO(#13059): Here we use MyPy ignore because after we fully type
    # the codebase we plan to get rid of the tests that intentionally
    # test wrong inputs that we can normally catch by typing.
    def test_invalid_banner_data_should_raise_exception(self) -> None:
        self.classroom.banner_data = 1 # type: ignore[assignment]
        error_msg = (
            'Expected banner_data of the classroom to be a string, '
            'received: 1.')
        with self.assertRaisesRegex(
            utils.ValidationError, error_msg):
            self.classroom.validate(strict=True)

    def test_invalid_thumbnail_bg_color_should_raise_exception(self) -> None:
        error_msg = 'thumbnail_bg_color field should not be empty'
        self.classroom.thumbnail_data = classroom_config_domain.ImageData(
            'valid_thumbnail.svg', '', 1000)
        with self.assertRaisesRegex(
            utils.ValidationError, error_msg):
            self.classroom.validate(strict=True)

        error_msg = (
            'Classroom thumbnail background color #FFFF is not supported.'
        )
        self.classroom.thumbnail_data.bg_color = '#FFFF'
        with self.assertRaisesRegex(
            utils.ValidationError, error_msg):
            self.classroom.validate(strict=True)

    def test_invalid_banner_bg_color_should_raise_exception(self) -> None:
        error_msg = 'banner_bg_color field should not be empty'
        self.classroom.banner_data = classroom_config_domain.ImageData(
            'valid_banner.png', '', 1000)
        with self.assertRaisesRegex(
            utils.ValidationError, error_msg):
            self.classroom.validate(strict=True)

        error_msg = (
            'Classroom banner background color #FFFF is not supported.'
        )
        self.classroom.banner_data.bg_color = '#FFFF'
        with self.assertRaisesRegex(
            utils.ValidationError, error_msg):
            self.classroom.validate(strict=True)

    def test_invalid_banner_filename_should_raise_exception(self) -> None:
        error_msg = (
            'Image filename should include an extension.'
        )
        self.classroom.banner_data = classroom_config_domain.ImageData(
            'invalid_banner', 'transparent', 1000)
        with self.assertRaisesRegex(
            utils.ValidationError, error_msg):
            self.classroom.validate(strict=True)
        error_msg = (
            'banner_filename field should not be empty'
        )
        self.classroom.banner_data = classroom_config_domain.ImageData(
            '', 'transparent', 1000)
        with self.assertRaisesRegex(
            utils.ValidationError, error_msg):
            self.classroom.validate(strict=True)

    def test_invalid_thumbnail_filename_should_raise_exception(self) -> None:
        error_msg = (
            'Expected a filename ending in svg, received invalid_thumbnail.png'
        )
        self.classroom.thumbnail_data = classroom_config_domain.ImageData(
            'invalid_thumbnail.png', 'transparent', 1000)
        with self.assertRaisesRegex(
            utils.ValidationError, error_msg):
            self.classroom.validate(strict=True)
        error_msg = (
            'thumbnail_filename field should not be empty'
        )
        self.classroom.thumbnail_data = classroom_config_domain.ImageData(
            '', 'transparent', 1000)
        with self.assertRaisesRegex(
            utils.ValidationError, error_msg):
            self.classroom.validate(strict=True)


class ImageDomainTests(test_utils.GenericTestBase):

    def setUp(self) -> None:
        self.filename = 'test_image.png'
        self.bg_color = '#FFFFFF'
        self.size_in_bytes = 2048

        self.image = classroom_config_domain.ImageData(
            filename=self.filename,
            bg_color=self.bg_color,
            size_in_bytes=self.size_in_bytes
        )

        self.image_dict: classroom_config_domain.ImageDataDict = {
            'filename': self.filename,
            'bg_color': self.bg_color,
            'size_in_bytes': self.size_in_bytes
        }

    def test_initialization(self) -> None:
        self.assertEqual(self.image.filename, self.filename)
        self.assertEqual(self.image.bg_color, self.bg_color)
        self.assertEqual(self.image.size_in_bytes, self.size_in_bytes)

    def test_to_dict(self) -> None:
        self.assertEqual(self.image.to_dict(), self.image_dict)

    def test_from_dict(self) -> None:
        image_from_dict = classroom_config_domain.ImageData.from_dict(
            self.image_dict
        )
        self.assertEqual(image_from_dict.filename, self.filename)
        self.assertEqual(image_from_dict.bg_color, self.bg_color)
        self.assertEqual(image_from_dict.size_in_bytes, self.size_in_bytes)
