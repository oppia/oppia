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

"""Tests for Learner group models."""

from __future__ import annotations

import types

from core.platform import models
from core.tests import test_utils

from typing import Dict, List, Union

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import base_models
    from mypy_imports import learner_group_models

(base_models, learner_group_models) = models.Registry.import_models(
        [models.NAMES.base_model, models.NAMES.learner_group])


class LearnerGroupModelUnitTest(test_utils.GenericTestBase):
    """Test the LearnerGroupModel class."""

    def setUp(self) -> None:
        """Set up learner group model in datastore for use in testing."""
        super(LearnerGroupModelUnitTest, self).setUp()

        self.learner_group_model = learner_group_models.LearnerGroupModel(
            id='learner_group_32',
            title='title',
            description='description',
            facilitator_user_ids=['user_1', 'user_11'],
            student_user_ids=['user_2', 'user_3', 'user_4'],
            invited_student_user_ids=['user_5', 'user_6'],
            subtopic_page_ids=['subtopic_1', 'subtopic_2'],
            story_ids=['story_1', 'story_2'])
        self.learner_group_model.update_timestamps()
        self.learner_group_model.put()

    def test_get_deletion_policy(self) -> None:
        self.assertEqual(
            learner_group_models.LearnerGroupModel.get_deletion_policy(),
            base_models.DELETION_POLICY.DELETE)

    def test_get_model_association_to_user(self) -> None:
        self.assertEqual(
            learner_group_models.LearnerGroupModel.
                get_model_association_to_user(),
            base_models.MODEL_ASSOCIATION_TO_USER.
                MULTIPLE_INSTANCES_PER_USER
        )

    def test_get_export_policy(self) -> None:
        expected_export_policy_dict = {
            'created_on': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'last_updated': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'deleted': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'title': base_models.EXPORT_POLICY.EXPORTED,
            'description': base_models.EXPORT_POLICY.EXPORTED,
            'facilitator_user_ids': base_models.EXPORT_POLICY.EXPORTED,
            'student_user_ids': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'invited_student_user_ids':
                base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'subtopic_page_ids': base_models.EXPORT_POLICY.EXPORTED,
            'story_ids': base_models.EXPORT_POLICY.EXPORTED
        }
        self.assertEqual(
            learner_group_models.LearnerGroupModel.get_export_policy(),
            expected_export_policy_dict
        )

    def test_raise_exception_by_mocking_collision(self) -> None:
        """Tests get_new_id method for raising exception."""

        learner_group_model_cls = (
            learner_group_models.LearnerGroupModel)

        # Test create method.
        with self.assertRaisesRegex(
            Exception,
            'A learner group with the given group ID exists already.'
        ):
            # Swap dependent method get_by_id to simulate collision every time.
            with self.swap(
                learner_group_model_cls, 'get_by_id',
                types.MethodType(
                    lambda x, y: True,
                    learner_group_model_cls)):
                learner_group_model_cls.create('Abcd', 'title', 'description')

        # Test get_new_id method.
        with self.assertRaisesRegex(
            Exception,
            'New id generator is producing too many collisions.'
        ):
            # Swap dependent method get_by_id to simulate collision every time.
            with self.swap(
                learner_group_model_cls, 'get_by_id',
                types.MethodType(
                    lambda x, y: True,
                    learner_group_model_cls)):
                learner_group_model_cls.get_new_id()

    def test_creating_new_learner_group_model_instance(self) -> None:
        learner_group_model_id = (
            learner_group_models.LearnerGroupModel.get_new_id())
        learner_group_model_instance = (
            learner_group_models.LearnerGroupModel.create(
                learner_group_model_id, 'title', 'description'))
        self.assertEqual(
            learner_group_model_instance.id, learner_group_model_id)
        self.assertEqual(
            learner_group_model_instance.title, 'title')
        self.assertEqual(
            learner_group_model_instance.description, 'description')

    def test_get_field_names_for_takeout(self) -> None:
        expected_results = {
            'facilitator_user_ids': 'role_in_group',
        }
        self.assertEqual(
            learner_group_models.LearnerGroupModel
            .get_field_names_for_takeout(),
            expected_results)

    def test_export_data_on_students(self) -> None:
        """Test export data on users that are students of the learner group."""

        student_user_data = (
            learner_group_models.LearnerGroupModel.export_data('user_2'))
        expected_student_user_data = {
            'learner_group_32': {
                'title': 'title',
                'description': 'description',
                'role_in_group': 'student',
                'subtopic_page_ids': ['subtopic_1', 'subtopic_2'],
                'story_ids': ['story_1', 'story_2']
            }
        }
        self.assertEqual(expected_student_user_data, student_user_data)

    def test_export_data_on_invited_students(self) -> None:
        """Test export data on students that have been invited to join the
        learner group.
        """
        invited_student_data = (
            learner_group_models.LearnerGroupModel.export_data('user_6'))
        expected_invited_student_data = {
            'learner_group_32': {
                'title': 'title',
                'description': 'description',
                'role_in_group': 'invited_student',
                'subtopic_page_ids': [],
                'story_ids': []
            }
        }
        self.assertEqual(expected_invited_student_data, invited_student_data)

    def test_export_data_on_facilitators(self) -> None:
        """Test export data on users that are facilitators of
        the learner group.
        """
        facilitator_user_data = (
            learner_group_models.LearnerGroupModel.export_data('user_1'))
        expected_facilitator_user_data = {
            'learner_group_32': {
                'title': 'title',
                'description': 'description',
                'role_in_group': 'facilitator',
                'subtopic_page_ids': ['subtopic_1', 'subtopic_2'],
                'story_ids': ['story_1', 'story_2']
            }
        }
        self.assertEqual(expected_facilitator_user_data, facilitator_user_data)

    def test_export_data_on_uninvolved_user(self) -> None:
        """Test export data on users who do not have any involvement with
        the learner group.
        """
        uninvolved_user_data = (
            learner_group_models.LearnerGroupModel.export_data('user_31'))
        expected_uninvolved_user_data: Dict[str, Union[str, List[str]]] = {}

        self.assertEqual(
            expected_uninvolved_user_data,
            uninvolved_user_data)

    def test_apply_deletion_policy_on_students(self) -> None:
        """Test apply_deletion_policy on users that are students of
        the learner group.
        """
        self.assertTrue(
            learner_group_models.LearnerGroupModel
            .has_reference_to_user_id('user_2'))

        learner_group_models.LearnerGroupModel.apply_deletion_policy('user_2')

        self.assertFalse(
            learner_group_models.LearnerGroupModel
            .has_reference_to_user_id('user_2'))

    def test_apply_deletion_policy_on_invited_users(self) -> None:
        """Test apply_deletion_policy on users that have been
        invited to join the learner group.
        """
        self.assertTrue(
            learner_group_models.LearnerGroupModel
            .has_reference_to_user_id('user_5'))

        learner_group_models.LearnerGroupModel.apply_deletion_policy('user_5')

        self.assertFalse(
            learner_group_models.LearnerGroupModel
            .has_reference_to_user_id('user_5'))

    def test_apply_deletion_policy_on_facilitators(self) -> None:
        """Test apply_deletion_policy on users that are facilitators of
        the learner group.
        """
        self.assertTrue(
            learner_group_models.LearnerGroupModel
            .has_reference_to_user_id('user_1'))
        self.assertTrue(
            learner_group_models.LearnerGroupModel
            .has_reference_to_user_id('user_11'))

        # Deleting a facilitator when more than 1 facilitators are present.
        learner_group_models.LearnerGroupModel.apply_deletion_policy('user_1')

        self.assertFalse(
            learner_group_models.LearnerGroupModel
            .has_reference_to_user_id('user_1'))

        # Deleting a facilitator when only 1 facilitator is present.
        learner_group_models.LearnerGroupModel.apply_deletion_policy('user_11')

        self.assertFalse(
            learner_group_models.LearnerGroupModel
            .has_reference_to_user_id('user_11'))

    def test_get_by_facilitator_id(self) -> None:
        """Test get_by_facilitator_id."""
        learner_group_model = (
            learner_group_models.LearnerGroupModel.get_by_facilitator_id(
                'user_1'))
        self.assertEqual(learner_group_model[0].id, 'learner_group_32')
