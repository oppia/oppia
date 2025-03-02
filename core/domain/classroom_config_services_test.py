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
# successful migration, this file should be renamed as classroom_services_test
# and the exiting classroom services test file should be deleted, until then
# both of the files will exist simultaneously.

"""Tests for classroom services."""

from __future__ import annotations

from core.constants import constants
from core.domain import classroom_config_domain
from core.domain import classroom_config_services
from core.platform import models
from core.tests import test_utils

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import classroom_models

(classroom_models,) = models.Registry.import_models([models.Names.CLASSROOM])


class ClassroomServicesTests(test_utils.GenericTestBase):
    """Tests for classroom services."""

    def setUp(self) -> None:
        super().setUp()
        self.dummy_thumbnail_data = classroom_config_domain.ImageData(
            'thumbnail.svg', 'transparent', 1000
        )
        self.dummy_banner_data = classroom_config_domain.ImageData(
            'banner.png', 'transparent', 1000
        )

        self.math_classroom_dict: classroom_config_domain.ClassroomDict = {
            'classroom_id': 'math_classroom_id',
            'name': 'math',
            'url_fragment': 'math',
            'course_details': 'Curated math foundations course.',
            'teaser_text': 'Teaser test for math classroom',
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
        self.math_classroom = classroom_config_domain.Classroom.from_dict(
            self.math_classroom_dict)
        classroom_models.ClassroomModel.create(
            self.math_classroom.classroom_id,
            self.math_classroom.name,
            self.math_classroom.url_fragment,
            self.math_classroom.course_details,
            self.math_classroom.teaser_text,
            self.math_classroom.topic_list_intro,
            self.math_classroom.topic_id_to_prerequisite_topic_ids,
            self.math_classroom.is_published,
            self.math_classroom.is_diagnostic_test_enabled,
            self.math_classroom.thumbnail_data.filename,
            self.math_classroom.thumbnail_data.bg_color,
            self.math_classroom.thumbnail_data.size_in_bytes,
            self.math_classroom.banner_data.filename,
            self.math_classroom.banner_data.bg_color,
            self.math_classroom.banner_data.size_in_bytes,
            self.math_classroom.index
        )

        self.physics_classroom_dict: classroom_config_domain.ClassroomDict = {
            'classroom_id': 'physics_classroom_id',
            'name': 'physics',
            'url_fragment': 'physics',
            'course_details': 'Curated physics foundations course.',
            'teaser_text': 'Teaser test for physics classroom',
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
            'index': 1
        }
        self.physics_classroom = classroom_config_domain.Classroom.from_dict(
            self.physics_classroom_dict)
        classroom_models.ClassroomModel.create(
            self.physics_classroom.classroom_id,
            self.physics_classroom.name,
            self.physics_classroom.url_fragment,
            self.physics_classroom.course_details,
            self.physics_classroom.teaser_text,
            self.physics_classroom.topic_list_intro,
            self.physics_classroom.topic_id_to_prerequisite_topic_ids,
            self.physics_classroom.is_published,
            self.physics_classroom.is_diagnostic_test_enabled,
            self.physics_classroom.thumbnail_data.filename,
            self.physics_classroom.thumbnail_data.bg_color,
            self.physics_classroom.thumbnail_data.size_in_bytes,
            self.physics_classroom.banner_data.filename,
            self.physics_classroom.banner_data.bg_color,
            self.physics_classroom.banner_data.size_in_bytes,
            self.physics_classroom.index
        )

    def test_get_classroom_by_id(self) -> None:
        classroom = classroom_config_services.get_classroom_by_id(
            'math_classroom_id')
        self.assertEqual(classroom.to_dict(), self.math_classroom_dict)

        self.assertIsNone(
            classroom_config_services.get_classroom_by_id(
                'incorrect_id', strict=False)
        )

    def test_get_classroom_by_url_fragment(self) -> None:
        classroom = classroom_config_services.get_classroom_by_url_fragment(
            'math')
        # Ruling out the possibility of None for mypy type checking.
        assert classroom is not None
        self.assertEqual(classroom.to_dict(), self.math_classroom_dict)

        self.assertIsNone(
            classroom_config_services.get_classroom_by_url_fragment(
                'incorrect_url_fragment'))

    def test_get_classroom_url_fragment_and_name_for_existing_topic(
            self) -> None:
        chemistry_classroom_dict: classroom_config_domain.ClassroomDict = {
            'classroom_id': 'chem_classroom_id',
            'name': 'chem',
            'url_fragment': 'chem',
            'course_details': 'Curated Chemistry foundations course.',
            'teaser_text': 'Teaser test for chemistry classroom',
            'topic_list_intro': 'Start from the basics with our first topic.',
            'topic_id_to_prerequisite_topic_ids': {'topic_id_chem': []},
            'is_published': True,
            'is_diagnostic_test_enabled': False,
            'thumbnail_data': self.dummy_thumbnail_data.to_dict(),
            'banner_data': self.dummy_banner_data.to_dict(),
            'index': 2
        }
        chemistry_classroom = classroom_config_domain.Classroom.from_dict(
            chemistry_classroom_dict)
        classroom_models.ClassroomModel.create(
            chemistry_classroom.classroom_id,
            chemistry_classroom.name,
            chemistry_classroom.url_fragment,
            chemistry_classroom.course_details,
            chemistry_classroom.teaser_text,
            chemistry_classroom.topic_list_intro,
            chemistry_classroom.topic_id_to_prerequisite_topic_ids,
            chemistry_classroom.is_published,
            chemistry_classroom.is_diagnostic_test_enabled,
            chemistry_classroom.thumbnail_data.filename,
            chemistry_classroom.thumbnail_data.bg_color,
            chemistry_classroom.thumbnail_data.size_in_bytes,
            chemistry_classroom.banner_data.filename,
            chemistry_classroom.banner_data.bg_color,
            chemistry_classroom.banner_data.size_in_bytes,
            chemistry_classroom.index
        )
        classroom_url_fragment = (
            classroom_config_services.
            get_classroom_url_fragment_for_topic_id('topic_id_chem'))
        classroom_name = (
            classroom_config_services.
            get_classroom_name_for_topic_id('topic_id_chem'))

        self.assertEqual(classroom_url_fragment, 'chem')
        self.assertEqual(classroom_name, 'chem')

    def test_get_classroom_url_fragment_and_name_for_non_existing_topic(
            self) -> None:
        classroom_url_fragment = (
            classroom_config_services.
            get_classroom_url_fragment_for_topic_id(
            'non_existing_topic_id'))
        classroom_name = (
            classroom_config_services.
            get_classroom_name_for_topic_id(
            'non_existing_topic_id'))

        self.assertEqual(
            classroom_url_fragment,
            constants.CLASSROOM_URL_FRAGMENT_FOR_UNATTACHED_TOPICS)
        self.assertEqual(
            classroom_name,
            constants.CLASSROOM_NAME_FOR_UNATTACHED_TOPICS)

    def test_get_all_classrooms(self) -> None:
        classrooms = classroom_config_services.get_all_classrooms()
        classroom_dicts = [classroom.to_dict() for classroom in classrooms]

        self.assertEqual(
            classroom_dicts,
            [self.math_classroom_dict, self.physics_classroom_dict]
        )

    def test_get_classroom_id_to_classroom_name_dict(self) -> None:
        classroom_id_to_classroom_name_dict = {
            'math_classroom_id': 'math',
            'physics_classroom_id': 'physics'
        }
        self.assertEqual(
            classroom_config_services.get_classroom_id_to_classroom_name_dict(),
            classroom_id_to_classroom_name_dict
        )

    def test_get_new_classroom_id(self) -> None:
        classroom_id = classroom_config_services.get_new_classroom_id()
        self.assertFalse(classroom_id == self.math_classroom.classroom_id)
        self.assertFalse(classroom_id == self.physics_classroom.classroom_id)

    def test_create_new_classroom_model(self) -> None:
        new_classroom_id = classroom_config_services.get_new_classroom_id()
        chemistry_classroom = classroom_config_domain.Classroom(
            new_classroom_id, 'chemistry', 'chemistry',
            'Curated chemistry foundations course.',
            'Teaser test for chemistry classroom',
            'Start from the basics with our first topic.',
            {
                'topic_id_1': ['topic_id_2', 'topic_id_3'],
                'topic_id_2': [],
                'topic_id_3': []
            }, True, False, self.dummy_thumbnail_data, self.dummy_banner_data, 2
        )
        self.assertIsNone(
            classroom_config_services.get_classroom_by_id(
                new_classroom_id, strict=False)
        )

        classroom_config_services.create_new_classroom(
            chemistry_classroom)
        self.assertEqual(
            classroom_config_services.get_classroom_by_id(
                new_classroom_id).to_dict(),
            chemistry_classroom.to_dict()
        )

    def test_update_existing_classroom_model(self) -> None:
        self.assertEqual(
            classroom_config_services.get_classroom_by_id(
                'physics_classroom_id').name,
            'physics'
        )

        self.physics_classroom.name = 'Quantum physics'
        classroom_config_services.update_classroom(
            self.physics_classroom)

        self.assertEqual(
            classroom_config_services.get_classroom_by_id(
                'physics_classroom_id').name,
            'Quantum physics'
        )

    def test_do_not_update_invalid_classroom(self) -> None:
        self.physics_classroom.classroom_id = 'invalid'
        self.physics_classroom.name = 'Updated physics'
        classroom_config_services.update_classroom(
            self.physics_classroom)

        self.assertEqual(
            classroom_config_services.get_classroom_by_id(
                'physics_classroom_id').name,
            'physics'
        )
        self.assertEqual(
            classroom_config_services.get_classroom_by_id(
                'physics_classroom_id').index,
            1
        )

    def test_delete_classroom_model(self) -> None:
        self.assertIsNotNone(
            classroom_config_services.get_classroom_by_id('math_classroom_id'))

        classroom_config_services.delete_classroom('math_classroom_id')

        self.assertIsNone(
            classroom_config_services.get_classroom_by_id(
                'math_classroom_id', strict=False))

    def test_create_new_default_classroom(self) -> None:
        classroom_id = classroom_config_services.get_new_classroom_id()
        history_classroom = (
            classroom_config_services.create_new_default_classroom(
            classroom_id, 'history', 'history'
        ))
        history_classroom_data = classroom_config_services.get_classroom_by_id(
            classroom_id
        )

        self.assertEqual(history_classroom.name, history_classroom_data.name)
        self.assertEqual(
            history_classroom.url_fragment, history_classroom_data.url_fragment
        )
        self.assertFalse(history_classroom_data.is_published)

    def test_update_classroom_id_to_index_mappings(self) -> None:
        self.save_new_valid_classroom(
            'history', 'history', 'history', is_published=True
        )
        self.save_new_valid_classroom(
            'math', 'math', 'math', is_published=True
        )

        classroom_index_mappings = [
            {
                'classroom_id': 'history',
                'classroom_name': 'History',
                'classroom_index': '1'
            },
            {
                'classroom_id': 'math',
                'classroom_name': 'Math',
                'classroom_index': '0'
            }
        ]
        classroom_config_services.update_classroom_id_to_index_mappings(
            classroom_index_mappings
        )

        updated_history_classroom = (
            classroom_config_services.get_classroom_by_id(
                'history')
        )
        updated_math_classroom = classroom_config_services.get_classroom_by_id(
            'math'
        )

        self.assertEqual(updated_history_classroom.index, 1)
        self.assertEqual(updated_math_classroom.index, 0)
