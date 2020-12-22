# coding: utf-8
#
# Copyright 2020 The Oppia Authors. All Rights Reserved.
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

"""Models for managing user authentication."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.platform import models

base_models, = models.Registry.import_models([models.NAMES.base_model])
datastore_services = models.Registry.import_datastore_services()


class UserIdByFirebaseAuthIdModel(base_models.BaseModel):
    """Stores the relationship between user ID and Firebase auth ID.

    Instances of this class are keyed by Firebase auth ID.
    """

    user_id = datastore_services.StringProperty(required=True, indexed=True)

    @staticmethod
    def get_deletion_policy():
        """Model has data to delete corresponding to users: id and user_id."""
        return base_models.DELETION_POLICY.DELETE_AT_END

    @staticmethod
    def get_model_association_to_user():
        """Currently, the model holds IDs relevant only for backend that should
        not be exported.
        """
        return base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER

    @classmethod
    def get_export_policy(cls):
        """Model doesn't contain any data directly corresponding to a user.
        Currently, the model holds authentication details relevant only for
        backend, and no exportable user data. It may contain user data in the
        future.
        """
        return dict(
            super(UserIdByFirebaseAuthIdModel, cls).get_export_policy(),
            **{'user_id': base_models.EXPORT_POLICY.NOT_APPLICABLE})

    @classmethod
    def apply_deletion_policy(cls, user_id):
        """Delete instances of UserIdByFirebaseAuthIdModel for the user.

        Args:
            user_id: str. The ID of the user whose data should be deleted.
        """
        datastore_services.delete_multi(
            cls.query(cls.user_id == user_id).fetch(keys_only=True))

    @classmethod
    def has_reference_to_user_id(cls, user_id):
        """Check whether UserIdByFirebaseAuthIdModel exists for given user.

        Args:
            user_id: str. The ID of the user whose data should be checked.

        Returns:
            bool. Whether any UserIdByFirebaseAuthIdModel refers to the given
            user ID.
        """
        return cls.query(cls.user_id == user_id).get(keys_only=True) is not None

    @classmethod
    def get_by_user_id(cls, user_id):
        """Fetch an entry by user ID.

        Args:
            user_id: str. The user ID.

        Returns:
            UserIdByFirebaseAuthIdModel. The model with user_id field equal
            to user_id argument.
        """
        return cls.query(cls.user_id == user_id).get()
