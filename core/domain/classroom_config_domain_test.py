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
from core.domain import classroom_config_domain
from core.tests import test_utils


class ClassroomDomainTests(test_utils.GenericTestBase):

    def setUp(self) -> None:
        super().setUp()
        self.classroom = classroom_config_domain.Classroom(
            'classroom_id', 'math', 'math',
            'Curated math foundations course.',
            'Start from the basics with our first topic.',
            {
                'topic_id_1': ['topic_id_2', 'topic_id_3'],
                'topic_id_2': [],
                'topic_id_3': []
            }
        )
        self.classroom_dict: classroom_config_domain.ClassroomDict = {
            'classroom_id': 'classroom_id',
            'name': 'math',
            'url_fragment': 'math',
            'course_details': 'Curated math foundations course.',
            'topic_list_intro': 'Start from the basics with our first topic.',
            'topic_id_to_prerequisite_topic_ids': {
                'topic_id_1': ['topic_id_2', 'topic_id_3'],
                'topic_id_2': [],
                'topic_id_3': []
            }
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
        self.classroom.validate()

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
            self.classroom.validate()

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
            self.classroom.validate()

        self.classroom.name = ''
        error_msg = 'Name field should not be empty'
        with self.assertRaisesRegex(
            utils.ValidationError, error_msg):
            self.classroom.validate()

        self.classroom.name = 'Long classroom name' * 5
        error_msg = (
            'Classroom name should be at most 39 characters, received '
            '%s.' % self.classroom.name)
        with self.assertRaisesRegex(
            utils.ValidationError, error_msg):
            self.classroom.validate()

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
            self.classroom.validate()

        self.classroom.url_fragment = ''
        error_msg = 'Url fragment field should not be empty'
        with self.assertRaisesRegex(
            utils.ValidationError, error_msg):
            self.classroom.validate()

        self.classroom.url_fragment = 'long-url-fragment' * 2
        error_msg = (
            'Classroom URL Fragment field should not exceed 20 characters, '
            'received %s.' % self.classroom.url_fragment)
        with self.assertRaisesRegex(
            utils.ValidationError, error_msg):
            self.classroom.validate()

    # TODO(#13059): Here we use MyPy ignore because after we fully type
    # the codebase we plan to get rid of the tests that intentionally
    # test wrong inputs that we can normally catch by typing.
    def test_invalid_course_details_should_raise_exception(
        self
    ) -> None:
        self.classroom.course_details = 1 # type: ignore[assignment]
        error_msg = (
            'Expected course_details of the classroom to be a string, '
            'received: 1.'
        )
        with self.assertRaisesRegex(
            utils.ValidationError, error_msg):
            self.classroom.validate()

    # TODO(#13059): Here we use MyPy ignore because after we fully type
    # the codebase we plan to get rid of the tests that intentionally
    # test wrong inputs that we can normally catch by typing.
    def test_invalid_topic_list_intro_should_raise_exception(
        self
    ) -> None:
        self.classroom.topic_list_intro = 1 # type: ignore[assignment]
        error_msg = (
            'Expected topic list intro of the classroom to be a string, '
            'received: 1.'
        )
        with self.assertRaisesRegex(
            utils.ValidationError, error_msg):
            self.classroom.validate()

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
            self.classroom.validate()

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
            self.classroom.validate()

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
            self.classroom.validate()

    def test_valid_topic_id_to_prerequisite_topic_ids_graph(self) -> None:
        # Test valid graph 1.
        self.classroom.topic_id_to_prerequisite_topic_ids = {
            'topic_id_1': [],
            'topic_id_2': ['topic_id_1'],
            'topic_id_3': ['topic_id_2']
        }
        self.classroom.validate()

        # Test valid graph 2.
        self.classroom.topic_id_to_prerequisite_topic_ids = {
            'topic_id_1': [],
            'topic_id_2': ['topic_id_1', 'topic_id_4'],
            'topic_id_3': ['topic_id_1', 'topic_id_2'],
            'topic_id_4': []
        }
        self.classroom.validate()

        # Test valid graph 3.
        self.classroom.topic_id_to_prerequisite_topic_ids = {}
        self.classroom.validate()

        # Test valid graph 4.
        self.classroom.topic_id_to_prerequisite_topic_ids = {
            'topic_id_1': []
        }
        self.classroom.validate()

        # Test valid graph 5.
        self.classroom.topic_id_to_prerequisite_topic_ids = {
            'topic_id_1': [],
            'topic_id_2': ['topic_id_1'],
            'topic_id_3': ['topic_id_2', 'topic_id_1']
        }
        self.classroom.validate()
