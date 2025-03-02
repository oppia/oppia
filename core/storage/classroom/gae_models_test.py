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

"""Tests for classroom models."""

from __future__ import annotations

import types

from core.platform import models
from core.tests import test_utils

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import base_models
    from mypy_imports import classroom_models

(base_models, classroom_models) = models.Registry.import_models([
    models.Names.BASE_MODEL, models.Names.CLASSROOM
])


class ClassroomModelUnitTest(test_utils.GenericTestBase):
    """Test the ClassroomModel class."""

    def setUp(self) -> None:
        super().setUp()
        self.classroom_model = classroom_models.ClassroomModel(
            id='id',
            name='math',
            url_fragment='math',
            course_details='Curated math foundations course.',
            teaser_text='Learn math through fun stories!',
            topic_list_intro='Start from the basics with our first topic.',
            topic_id_to_prerequisite_topic_ids={},
            is_published=True, thumbnail_filename='thumbnail.svg',
            thumbnail_bg_color='transparent', thumbnail_size_in_bytes=1000,
            banner_filename='banner.png', banner_bg_color='transparent',
            banner_size_in_bytes=1000,
            index=0
        )
        self.classroom_model.update_timestamps()
        self.classroom_model.put()

    def test_create_new_model(self) -> None:
        classroom_id = (
            classroom_models.ClassroomModel.generate_new_classroom_id())
        classroom_model_instance = (classroom_models.ClassroomModel.create(
            classroom_id, 'physics', 'physics', 'Curated physics course.',
            'Learn physics through fun stories!', 
            'Start from the basic physics.', {}, False, False,
            'thumbnail.svg', 'transparent', 1000, 'banner.png',
            'transparent', 1000, 0))

        self.assertEqual(classroom_model_instance.name, 'physics')
        self.assertEqual(classroom_model_instance.url_fragment, 'physics')
        self.assertEqual(
            classroom_model_instance.course_details, 'Curated physics course.')
        self.assertEqual(
            classroom_model_instance.teaser_text,
                'Learn physics through fun stories!')
        self.assertEqual(
            classroom_model_instance.topic_list_intro,
                'Start from the basic physics.')
        self.assertEqual(classroom_model_instance.is_published, False)
        self.assertEqual(
            classroom_model_instance.thumbnail_filename, 'thumbnail.svg')
        self.assertEqual(
            classroom_model_instance.thumbnail_bg_color, 'transparent')
        self.assertEqual(
            classroom_model_instance.thumbnail_size_in_bytes, 1000)
        self.assertEqual(
            classroom_model_instance.banner_filename, 'banner.png')
        self.assertEqual(
            classroom_model_instance.banner_bg_color, 'transparent')
        self.assertEqual(
            classroom_model_instance.banner_size_in_bytes, 1000)
        self.assertEqual(
            classroom_model_instance.index, 0)

    def test_get_export_policy_not_applicable(self) -> None:
        self.assertEqual(
            classroom_models.ClassroomModel.get_export_policy(),
            {
                'created_on': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'deleted': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'last_updated': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'name': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'url_fragment': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'course_details': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'teaser_text': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'topic_list_intro': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'topic_id_to_prerequisite_topic_ids': (
                    base_models.EXPORT_POLICY.NOT_APPLICABLE),
                'is_published': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'is_diagnostic_test_enabled': (
                    base_models.EXPORT_POLICY.NOT_APPLICABLE),
                'thumbnail_filename': (
                    base_models.EXPORT_POLICY.NOT_APPLICABLE),
                'thumbnail_bg_color': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'thumbnail_size_in_bytes': (
                    base_models.EXPORT_POLICY.NOT_APPLICABLE),
                'banner_filename': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'banner_bg_color': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'banner_size_in_bytes': (
                    base_models.EXPORT_POLICY.NOT_APPLICABLE
                ),
                'index': base_models.EXPORT_POLICY.NOT_APPLICABLE
            }
        )

    def test_get_model_association_to_user_not_corresponding_to_user(
        self
    ) -> None:
        self.assertEqual(
            classroom_models.ClassroomModel.get_model_association_to_user(),
            base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER)

    def test_get_deletion_policy_not_applicable(self) -> None:
        self.assertEqual(
            classroom_models.ClassroomModel.get_deletion_policy(),
            base_models.DELETION_POLICY.NOT_APPLICABLE)

    def test_get_model_by_url_fragment(self) -> None:
        self.assertEqual(
            classroom_models.ClassroomModel.get_by_url_fragment('math'),
            self.classroom_model)
        self.assertEqual(
            classroom_models.ClassroomModel.get_by_url_fragment(
                'incorrect_url_fragment'), None)

    def test_get_model_by_name(self) -> None:
        self.assertEqual(
            classroom_models.ClassroomModel.get_by_name('math'),
            self.classroom_model)
        self.assertEqual(
            classroom_models.ClassroomModel.get_by_name('incorrect_name'),
            None)

    def test_get_model_by_id(self) -> None:
        self.assertEqual(
            classroom_models.ClassroomModel.get_by_id('id'),
            self.classroom_model)
        self.assertEqual(
            classroom_models.ClassroomModel.get_by_id('incorrect_id'),
            None)

    def test_raise_exception_by_mocking_collision(self) -> None:
        """Tests create and generate_new_classroom_id methods for raising
        exception.
        """
        classroom_model_cls = classroom_models.ClassroomModel

        # Test create method.
        with self.assertRaisesRegex(
            Exception,
            'A classroom with the given classroom ID already exists.'
        ):
            # Swap dependent method get_by_id to simulate collision every time.
            with self.swap(
                classroom_model_cls, 'get_by_id',
                types.MethodType(
                    lambda x, y: True,
                    classroom_model_cls
                )
            ):
                classroom_model_cls.create(
                    'classroom_id', 'math', 'math',
                    'Curated math foundations course.',
                    'Learn math through fun stories!',
                    'Start from the basic math.', {}, True, False,
                    'thumbnail.svg', 'transparent', 1000, 'banner.png',
                    'transparent', 1000, 0
                )

        # Test generate_new_classroom_id method.
        with self.assertRaisesRegex(
            Exception,
            'New classroom id generator is producing too many collisions.'
        ):
            # Swap dependent method get_by_id to simulate collision every time.
            with self.swap(
                classroom_model_cls, 'get_by_id',
                types.MethodType(
                    lambda x, y: True,
                    classroom_model_cls
                )
            ):
                classroom_model_cls.generate_new_classroom_id()
