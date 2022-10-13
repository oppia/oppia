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

(base_models, learner_group_models) = models.Registry.import_models([
    models.Names.BASE_MODEL, models.Names.LEARNER_GROUP
])


class LearnerGroupModelUnitTest(test_utils.GenericTestBase):
    """Test the LearnerGroupModel class."""

    def setUp(self) -> None:
        """Set up learner group model in datastore for use in testing."""
        super().setUp()

        self.learner_group_model = learner_group_models.LearnerGroupModel(
            id='learner_group_32',
            title='title',
            description='description',
            facilitator_user_ids=['facilitator_1', 'facilitator_2'],
            learner_user_ids=['learner_1', 'learner_2', 'learner_3'],
            invited_learner_user_ids=['invited_user_1', 'invited_user_2'],
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
            'learner_user_ids': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'invited_learner_user_ids':
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

    def test_export_data_on_learners(self) -> None:
        """Test export data on users that are learners of the learner group."""

        learner_user_data = (
            learner_group_models.LearnerGroupModel.export_data('learner_1'))
        expected_learner_user_data = {
            'learner_group_32': {
                'title': 'title',
                'description': 'description',
                'role_in_group': 'learner',
                'subtopic_page_ids': ['subtopic_1', 'subtopic_2'],
                'story_ids': ['story_1', 'story_2']
            }
        }
        self.assertEqual(expected_learner_user_data, learner_user_data)

    def test_export_data_on_invited_learners(self) -> None:
        """Test export data on learners that have been invited to join the
        learner group.
        """
        invited_learner_data = (
            learner_group_models.LearnerGroupModel.export_data(
                'invited_user_2'))
        expected_invited_learner_data = {
            'learner_group_32': {
                'title': 'title',
                'description': 'description',
                'role_in_group': 'invited_learner',
                'subtopic_page_ids': [],
                'story_ids': []
            }
        }
        self.assertEqual(expected_invited_learner_data, invited_learner_data)

    def test_export_data_on_facilitators(self) -> None:
        """Test export data on users that are facilitators of
        the learner group.
        """
        facilitator_user_data = (
            learner_group_models.LearnerGroupModel.export_data('facilitator_1')
        )
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
            learner_group_models.LearnerGroupModel.export_data('learner_21'))
        expected_uninvolved_user_data: Dict[str, Union[str, List[str]]] = {}

        self.assertEqual(
            expected_uninvolved_user_data,
            uninvolved_user_data)

    def test_apply_deletion_policy_on_learners(self) -> None:
        """Test apply_deletion_policy on users that are learners of
        the learner group.
        """
        self.assertTrue(
            learner_group_models.LearnerGroupModel
            .has_reference_to_user_id('learner_1'))

        learner_group_models.LearnerGroupModel.apply_deletion_policy(
            'learner_1')

        self.assertFalse(
            learner_group_models.LearnerGroupModel
            .has_reference_to_user_id('learner_1'))

    def test_apply_deletion_policy_on_invited_users(self) -> None:
        """Test apply_deletion_policy on users that have been
        invited to join the learner group.
        """
        self.assertTrue(
            learner_group_models.LearnerGroupModel
            .has_reference_to_user_id('invited_user_1'))

        learner_group_models.LearnerGroupModel.apply_deletion_policy(
            'invited_user_1')

        self.assertFalse(
            learner_group_models.LearnerGroupModel
            .has_reference_to_user_id('invited_user_1'))

    def test_apply_deletion_policy_on_facilitators(self) -> None:
        """Test apply_deletion_policy on users that are facilitators of
        the learner group.
        """
        self.assertTrue(
            learner_group_models.LearnerGroupModel
            .has_reference_to_user_id('facilitator_1'))
        self.assertTrue(
            learner_group_models.LearnerGroupModel
            .has_reference_to_user_id('facilitator_2'))

        # Deleting a facilitator when more than 1 facilitators are present.
        learner_group_models.LearnerGroupModel.apply_deletion_policy(
            'facilitator_1')

        self.assertFalse(
            learner_group_models.LearnerGroupModel
            .has_reference_to_user_id('facilitator_1'))

        # Deleting a facilitator when only 1 facilitator is present.
        learner_group_models.LearnerGroupModel.apply_deletion_policy(
            'facilitator_2')

        self.assertFalse(
            learner_group_models.LearnerGroupModel
            .has_reference_to_user_id('facilitator_2'))

    def test_get_by_facilitator_id(self) -> None:
        """Test get_by_facilitator_id."""
        learner_group_model = (
            learner_group_models.LearnerGroupModel.get_by_facilitator_id(
                'facilitator_1'))
        self.assertEqual(learner_group_model[0].id, 'learner_group_32')

    def test_get_by_invited_learner_user_id(self) -> None:
        """Test get_by_invited_learner_user_id."""
        learner_grp_models = (
            learner_group_models.LearnerGroupModel
                .get_by_invited_learner_user_id(
                    'facilitator_1'))
        self.assertEqual(len(learner_grp_models), 0)

        learner_grp_models = (
            learner_group_models.LearnerGroupModel
                .get_by_invited_learner_user_id(
                    'learner_2'))
        self.assertEqual(len(learner_grp_models), 0)

        learner_grp_models = (
            learner_group_models.LearnerGroupModel
                .get_by_invited_learner_user_id(
                    'invited_user_1'))
        self.assertEqual(learner_grp_models[0].id, 'learner_group_32')

    def test_get_by_learner_user_id(self) -> None:
        """Test get_by_learner_user_id."""
        learner_grp_models = (
            learner_group_models.LearnerGroupModel.get_by_learner_user_id(
                'facilitator_1'))
        self.assertEqual(len(learner_grp_models), 0)

        learner_grp_models = (
            learner_group_models.LearnerGroupModel.get_by_learner_user_id(
                'invited_user_1'))
        self.assertEqual(len(learner_grp_models), 0)

        learner_grp_models = (
            learner_group_models.LearnerGroupModel.get_by_learner_user_id(
                'learner_2'))
        self.assertEqual(learner_grp_models[0].id, 'learner_group_32')
