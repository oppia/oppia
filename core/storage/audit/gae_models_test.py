# coding: utf-8
#
# Copyright 2017 The Oppia Authors. All Rights Reserved.
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

"""Test for audit models."""

from __future__ import annotations

import datetime

from core import feconf
from core.platform import models
from core.tests import test_utils

from typing import Final

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import audit_models, base_models

(audit_models, base_models) = models.Registry.import_models(
    [models.Names.AUDIT, models.Names.BASE_MODEL]
)


class RoleQueryAuditModelUnitTests(test_utils.GenericTestBase):
    """Unit tests for the RoleQueryAuditModel class."""

    NONEXISTENT_USER_ID: Final = 'id_x'
    USER_ID: Final = 'user_id'
    ID: Final = 'user_id.111.update.111'
    USERNAME: Final = 'username'
    ROLE: Final = 'role'

    def setUp(self) -> None:
        """Set up user models in datastore for use in testing."""
        super().setUp()

        audit_models.RoleQueryAuditModel(
            id=self.ID,
            user_id=self.USER_ID,
            intent=feconf.ROLE_ACTION_ADD,
            role=self.ROLE,
            username=self.USERNAME,
        ).put()

    def test_get_deletion_policy(self) -> None:
        self.assertEqual(
            audit_models.RoleQueryAuditModel.get_deletion_policy(),
            base_models.DELETION_POLICY.KEEP,
        )

    def test_get_export_policy(self) -> None:
        sample_dict = {
            'user_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'intent': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'role': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'username': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'created_on': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'last_updated': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'deleted': base_models.EXPORT_POLICY.NOT_APPLICABLE,
        }
        self.assertEqual(
            audit_models.RoleQueryAuditModel.get_export_policy(), sample_dict
        )

    def test_get_model_association_to_user(self) -> None:
        self.assertEqual(
            audit_models.RoleQueryAuditModel.get_model_association_to_user(),
            base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER,
        )

    def test_has_reference_to_user_id(self) -> None:
        self.assertTrue(
            audit_models.RoleQueryAuditModel.has_reference_to_user_id(
                self.USER_ID
            )
        )
        self.assertFalse(
            audit_models.RoleQueryAuditModel.has_reference_to_user_id(
                self.NONEXISTENT_USER_ID
            )
        )

    def test_get_model(self) -> None:
        audit_model = audit_models.RoleQueryAuditModel.get(self.ID)

        self.assertEqual(audit_model.id, self.ID)
        self.assertEqual(audit_model.intent, feconf.ROLE_ACTION_ADD)
        self.assertEqual(audit_model.user_id, self.USER_ID)
        self.assertEqual(audit_model.role, self.ROLE)
        self.assertEqual(audit_model.username, self.USERNAME)


class UsernameChangeAuditModelUnitTests(test_utils.GenericTestBase):
    """Unit tests for the UsernameChangeAuditModel class."""

    NONEXISTENT_COMMITTER_ID: Final = 'id_x'
    COMMITTER_ID: Final = 'committer_id'
    ID: Final = 'committer_id.111.222'
    OLD_USERNAME: Final = 'old_username'
    NEW_USERNAME: Final = 'new_username'

    def setUp(self) -> None:
        """Set up user models in datastore for use in testing."""
        super().setUp()

        audit_models.UsernameChangeAuditModel(
            id=self.ID,
            committer_id=self.COMMITTER_ID,
            old_username=self.OLD_USERNAME,
            new_username=self.NEW_USERNAME,
        ).put()

    def test_get_deletion_policy(self) -> None:
        self.assertEqual(
            audit_models.UsernameChangeAuditModel.get_deletion_policy(),
            base_models.DELETION_POLICY.KEEP,
        )

    def test_get_export_policy(self) -> None:
        sample_dict = {
            'committer_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'old_username': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'new_username': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'created_on': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'last_updated': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'deleted': base_models.EXPORT_POLICY.NOT_APPLICABLE,
        }
        self.assertEqual(
            audit_models.UsernameChangeAuditModel.get_export_policy(),
            sample_dict,
        )

    def test_get_model_association_to_user(self) -> None:
        self.assertEqual(
            audit_models.UsernameChangeAuditModel.get_model_association_to_user(),
            base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER,
        )

    def test_has_reference_to_user_id(self) -> None:
        self.assertTrue(
            audit_models.UsernameChangeAuditModel.has_reference_to_user_id(
                self.COMMITTER_ID
            )
        )
        self.assertFalse(
            audit_models.UsernameChangeAuditModel.has_reference_to_user_id(
                self.NONEXISTENT_COMMITTER_ID
            )
        )

    def test_get_model(self) -> None:
        audit_model = audit_models.UsernameChangeAuditModel.get(self.ID)

        self.assertEqual(audit_model.id, self.ID)
        self.assertEqual(audit_model.committer_id, self.COMMITTER_ID)
        self.assertEqual(audit_model.old_username, self.OLD_USERNAME)
        self.assertEqual(audit_model.new_username, self.NEW_USERNAME)


class FeatureFlagChangeAuditModelUnitTests(test_utils.GenericTestBase):
    """Unit tests for the FeatureFlagChangeAuditModel class."""

    NONEXISTENT_COMMITTER_ID: Final = 'id_x'
    COMMITTER_ID: Final = 'committer_id'
    FEATURE_FLAG_NAME: Final = 'feature_a'

    def setUp(self) -> None:
        """Set up audit models in datastore for use in testing."""
        super().setUp()

        self.old_config = {
            'force_enable_for_all_users': False,
            'rollout_percentage': 0,
            'user_group_ids': [],
        }
        self.new_config = {
            'force_enable_for_all_users': False,
            'rollout_percentage': 20,
            'user_group_ids': ['group_1'],
        }

        self.older_model = audit_models.FeatureFlagChangeAuditModel(
            id='feature_a.111.1',
            feature_flag_name=self.FEATURE_FLAG_NAME,
            committer_id=self.COMMITTER_ID,
            old_config=self.old_config,
            new_config=self.new_config,
        )
        self.older_model.update_timestamps()
        self.older_model.put()

        self.newer_model = audit_models.FeatureFlagChangeAuditModel(
            id='feature_a.222.2',
            feature_flag_name=self.FEATURE_FLAG_NAME,
            committer_id=self.COMMITTER_ID,
            old_config=self.new_config,
            new_config=self.old_config,
        )
        self.newer_model.update_timestamps()
        self.newer_model.put()

        # A change to a different flag, which should not be returned when
        # fetching the history of feature_a.
        other_model = audit_models.FeatureFlagChangeAuditModel(
            id='feature_b.333.3',
            feature_flag_name='feature_b',
            committer_id=self.COMMITTER_ID,
            old_config=self.old_config,
            new_config=self.new_config,
        )
        other_model.update_timestamps()
        other_model.put()

    def test_get_deletion_policy(self) -> None:
        self.assertEqual(
            audit_models.FeatureFlagChangeAuditModel.get_deletion_policy(),
            base_models.DELETION_POLICY.KEEP,
        )

    def test_get_export_policy(self) -> None:
        sample_dict = {
            'feature_flag_name': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'committer_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'old_config': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'new_config': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'created_on': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'last_updated': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'deleted': base_models.EXPORT_POLICY.NOT_APPLICABLE,
        }
        self.assertEqual(
            audit_models.FeatureFlagChangeAuditModel.get_export_policy(),
            sample_dict,
        )

    def test_get_model_association_to_user(self) -> None:
        model_class = audit_models.FeatureFlagChangeAuditModel
        self.assertEqual(
            model_class.get_model_association_to_user(),
            base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER,
        )

    def test_has_reference_to_user_id(self) -> None:
        model_class = audit_models.FeatureFlagChangeAuditModel
        self.assertTrue(model_class.has_reference_to_user_id(self.COMMITTER_ID))
        self.assertFalse(
            model_class.has_reference_to_user_id(self.NONEXISTENT_COMMITTER_ID)
        )

    def test_get_by_feature_flag_name_returns_newest_first(self) -> None:
        # The datastore emulator may give both models the same timestamp, so
        # the newer one is set explicitly to make the ordering deterministic.
        self.newer_model.created_on = self.older_model.created_on + (
            datetime.timedelta(seconds=1)
        )
        self.newer_model.update_timestamps(update_last_updated_time=False)
        self.newer_model.put()

        change_models = (
            audit_models.FeatureFlagChangeAuditModel.get_by_feature_flag_name(
                self.FEATURE_FLAG_NAME
            )
        )

        self.assertEqual(
            [model.id for model in change_models],
            [self.newer_model.id, self.older_model.id],
        )

    def test_get_by_feature_flag_name_with_no_changes_returns_empty(
        self,
    ) -> None:
        self.assertEqual(
            audit_models.FeatureFlagChangeAuditModel.get_by_feature_flag_name(
                'feature_with_no_changes'
            ),
            [],
        )
