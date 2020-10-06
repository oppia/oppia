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

"""Models for storing the audit logs."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.platform import models
import feconf

(base_models,) = models.Registry.import_models([models.NAMES.base_model])
datastore_services = models.Registry.import_datastore_services()


class RoleQueryAuditModel(base_models.BaseModel):
    """Records the data for query made to the role structure using admin
    interface.

    Instances of this class are keyed by a custom Id.
    [user_id].[timestamp_in_sec].[intent].[random_number]
    """

    # The user_id of the user making query.
    user_id = datastore_services.StringProperty(required=True, indexed=True)
    # The intent of making query (viewing (by role or username)
    # or updating role).
    intent = datastore_services.StringProperty(required=True, choices=[
        feconf.ROLE_ACTION_UPDATE,
        feconf.ROLE_ACTION_VIEW_BY_ROLE,
        feconf.ROLE_ACTION_VIEW_BY_USERNAME
    ], indexed=True)
    # The role being queried for.
    role = datastore_services.StringProperty(default=None, indexed=True)
    # The username in the query.
    username = datastore_services.StringProperty(default=None, indexed=True)

    @staticmethod
    def get_deletion_policy():
        """Audit logs are kept for investigation purposes."""
        return base_models.DELETION_POLICY.KEEP

    @classmethod
    def get_export_policy(cls):
        """Model does not contain user data."""
        return dict(super(cls, cls).get_export_policy(), **{
            'user_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'intent': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'role': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'username': base_models.EXPORT_POLICY.NOT_APPLICABLE
        })

    @classmethod
    def has_reference_to_user_id(cls, user_id):
        """Check whether RoleQueryAuditModel exists for the given user.

        Args:
            user_id: str. The ID of the user whose data should be checked.

        Returns:
            bool. Whether any models refer to the given user ID.
        """
        return cls.query(cls.user_id == user_id).get(keys_only=True) is not None


class UsernameChangeAuditModel(base_models.BaseModel):
    """Records the changes made to usernames via the admin panel.

    Instances of this class are keyed by a custom Id.
    [committer_id].[timestamp_in_sec]
    """

    # The ID of the user that is making the change.
    # (Note that this is typically an admin user, who would be a different user
    # from the one whose username is being changed.)
    committer_id = (
        datastore_services.StringProperty(required=True, indexed=True))
    # The old username that is being changed.
    old_username = (
        datastore_services.StringProperty(required=True, indexed=True))
    # The new username that the old one is being changed to.
    new_username = (
        datastore_services.StringProperty(required=True, indexed=True))

    @staticmethod
    def get_deletion_policy():
        """Audit logs are kept for investigation purposes."""
        return base_models.DELETION_POLICY.KEEP

    @classmethod
    def get_export_policy(cls):
        """Model does not contain user data."""
        return dict(super(cls, cls).get_export_policy(), **{
            'committer_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'old_username': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'new_username': base_models.EXPORT_POLICY.NOT_APPLICABLE
        })

    @classmethod
    def has_reference_to_user_id(cls, user_id):
        """Check whether UsernameChangeAuditModel exists for the given user.

        Args:
            user_id: str. The ID of the user who has made the username changes.

        Returns:
            bool. Whether any models refer to the given user ID.
        """
        return cls.query(
            cls.committer_id == user_id).get(keys_only=True) is not None
