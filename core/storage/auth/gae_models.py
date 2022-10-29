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

from __future__ import annotations

from core import feconf
from core.platform import models

from typing import Dict, Final, Optional

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import base_models
    from mypy_imports import datastore_services
    from mypy_imports import user_models

base_models, user_models = models.Registry.import_models([
    models.Names.BASE_MODEL, models.Names.USER
])
datastore_services = models.Registry.import_datastore_services()

ONLY_FIREBASE_SEED_MODEL_ID: Final = '1'


class UserAuthDetailsModel(base_models.BaseModel):
    """Stores the authentication details for a particular user.

    Instances of this class are keyed by user id.
    """

    # Authentication identifier from Google AppEngine (GAE). Exists only for
    # full users. None for profile users.
    gae_id = datastore_services.StringProperty(indexed=True)
    # Authentication identifier from the Firebase authentication server.
    firebase_auth_id = datastore_services.StringProperty(indexed=True)
    # For profile users, the user ID of the full user associated with them.
    # None for full users. Required for profiles because gae_id/firebase_auth_id
    # attribute is None for them, hence this attribute stores their association
    # with a full user who do have a gae_id/firebase_auth_id.
    parent_user_id = (
        datastore_services.StringProperty(indexed=True, default=None))

    @staticmethod
    def get_deletion_policy() -> base_models.DELETION_POLICY:
        """Model contains data to delete corresponding to a user: id, gae_id,
        firebase_auth_id, and parent_user_id fields.
        """
        return base_models.DELETION_POLICY.DELETE_AT_END

    @staticmethod
    def get_model_association_to_user(
    ) -> base_models.MODEL_ASSOCIATION_TO_USER:
        """Currently, the model holds authentication details relevant only for
        backend. Currently the only relevant user data is the username of the
        parent.
        """
        return base_models.MODEL_ASSOCIATION_TO_USER.ONE_INSTANCE_PER_USER

    @staticmethod
    def get_field_names_for_takeout() -> Dict[str, str]:
        """We do not want to export the internal user id for the parent, so we
        export the username instead.
        """
        return {
            'parent_user_id': 'parent_username'
        }

    @classmethod
    def get_export_policy(cls) -> Dict[str, base_models.EXPORT_POLICY]:
        """Model doesn't contain any data directly corresponding to a user.
        Currently, the model holds authentication details relevant only for
        backend, and no exportable user data. It may contain user data in the
        future.
        """
        return dict(super(cls, cls).get_export_policy(), **{
            'gae_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'firebase_auth_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'parent_user_id': base_models.EXPORT_POLICY.EXPORTED
        })

    @classmethod
    def export_data(cls, user_id: str) -> Dict[str, str]:
        """Exports the username of the parent."""
        user_auth_model = cls.get(user_id, strict=False)
        if user_auth_model and user_auth_model.parent_user_id:
            parent_model = user_models.UserSettingsModel.get(
                user_auth_model.parent_user_id)
            parent_username = parent_model.username
            return {'parent_username': parent_username}
        else:
            return {}

    @classmethod
    def apply_deletion_policy(cls, user_id: str) -> None:
        """Delete instances of UserAuthDetailsModel for the user.

        Args:
            user_id: str. The ID of the user whose data should be deleted.
        """
        cls.delete_by_id(user_id)

    @classmethod
    def has_reference_to_user_id(cls, user_id: str) -> bool:
        """Check whether UserAuthDetailsModel exists for the given user.

        Args:
            user_id: str. The ID of the user whose data should be checked.

        Returns:
            bool. Whether any UserAuthDetailsModel refers to the given user ID.
        """
        return cls.get_by_id(user_id) is not None

    @classmethod
    def get_by_auth_id(
        cls, provider_id: str, auth_id: str
    ) -> Optional[UserAuthDetailsModel]:
        """Fetch a user entry by auth_id of a particular auth service.

        Args:
            provider_id: str. Name of the provider of the auth ID.
            auth_id: str. Authentication detail corresponding to the
                authentication provider.

        Returns:
            UserAuthDetailsModel. The UserAuthDetailsModel instance having a
            particular user mapped to the given auth_id and the auth provider
            if there exists one, else None.
        """

        if provider_id == feconf.GAE_AUTH_PROVIDER_ID:
            return cls.query(cls.gae_id == auth_id).get()
        elif provider_id == feconf.FIREBASE_AUTH_PROVIDER_ID:
            return cls.query(cls.firebase_auth_id == auth_id).get()
        else:
            return None


class UserIdentifiersModel(base_models.BaseModel):
    """Stores the relationship between user ID and GAE ID.

    Instances of this class are keyed by GAE ID.
    """

    user_id = datastore_services.StringProperty(required=True, indexed=True)

    @staticmethod
    def get_deletion_policy() -> base_models.DELETION_POLICY:
        """Model contains data to delete corresponding to a user: id, and
        user_id fields.
        """
        return base_models.DELETION_POLICY.DELETE_AT_END

    @staticmethod
    def get_model_association_to_user(
    ) -> base_models.MODEL_ASSOCIATION_TO_USER:
        """Currently, the model holds identifiers relevant only for backend that
        should not be exported.
        """
        return base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER

    @classmethod
    def get_export_policy(cls) -> Dict[str, base_models.EXPORT_POLICY]:
        """Model doesn't contain any data directly corresponding to a user.
        Currently, the model holds authentication details relevant only for
        backend, and no exportable user data. It may contain user data in the
        future.
        """
        return dict(super(cls, cls).get_export_policy(), **{
            'user_id': base_models.EXPORT_POLICY.NOT_APPLICABLE
        })

    @classmethod
    def apply_deletion_policy(cls, user_id: str) -> None:
        """Delete instances of UserIdentifiersModel for the user.

        Args:
            user_id: str. The ID of the user whose data should be deleted.
        """
        keys = cls.query(cls.user_id == user_id).fetch(keys_only=True)
        datastore_services.delete_multi(keys)

    @classmethod
    def has_reference_to_user_id(cls, user_id: str) -> bool:
        """Check whether UserIdentifiersModel exists for the given user.

        Args:
            user_id: str. The ID of the user whose data should be checked.

        Returns:
            bool. Whether any UserIdentifiersModel refers to the given user ID.
        """
        return cls.query(cls.user_id == user_id).get(keys_only=True) is not None

    @classmethod
    def get_by_gae_id(cls, gae_id: str) -> Optional[UserIdentifiersModel]:
        """Fetch an entry by GAE ID.

        Args:
            gae_id: str. The GAE ID.

        Returns:
            UserIdentifiersModel. The model with user_id field equal to user_id
            argument.
        """
        return cls.get_by_id(gae_id)

    @classmethod
    def get_by_user_id(cls, user_id: str) -> Optional[UserIdentifiersModel]:
        """Fetch an entry by user ID.

        Args:
            user_id: str. The user ID.

        Returns:
            UserIdentifiersModel. The model with user_id field equal to user_id
            argument.
        """
        return cls.query(cls.user_id == user_id).get()


class UserIdByFirebaseAuthIdModel(base_models.BaseModel):
    """Stores the relationship between user ID and Firebase auth ID.

    Instances of this class are keyed by Firebase auth ID.
    """

    user_id = datastore_services.StringProperty(required=True, indexed=True)

    @staticmethod
    def get_deletion_policy() -> base_models.DELETION_POLICY:
        """Model has data to delete corresponding to users: id and user_id."""
        return base_models.DELETION_POLICY.DELETE_AT_END

    @staticmethod
    def get_model_association_to_user(
    ) -> base_models.MODEL_ASSOCIATION_TO_USER:
        """Currently, the model holds IDs relevant only for backend that should
        not be exported.
        """
        return base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER

    @classmethod
    def get_export_policy(cls) -> Dict[str, base_models.EXPORT_POLICY]:
        """Model doesn't contain any data directly corresponding to a user.
        Currently, the model holds authentication details relevant only for
        backend, and no exportable user data. It may contain user data in the
        future.
        """
        return dict(
            super(UserIdByFirebaseAuthIdModel, cls).get_export_policy(),
            **{'user_id': base_models.EXPORT_POLICY.NOT_APPLICABLE})

    @classmethod
    def apply_deletion_policy(cls, user_id: str) -> None:
        """Delete instances of UserIdByFirebaseAuthIdModel for the user.

        Args:
            user_id: str. The ID of the user whose data should be deleted.
        """
        keys = cls.query(cls.user_id == user_id).fetch(keys_only=True)
        datastore_services.delete_multi(keys)

    @classmethod
    def has_reference_to_user_id(cls, user_id: str) -> bool:
        """Check whether UserIdByFirebaseAuthIdModel exists for given user.

        Args:
            user_id: str. The ID of the user whose data should be checked.

        Returns:
            bool. Whether any UserIdByFirebaseAuthIdModel refers to the given
            user ID.
        """
        return cls.query(cls.user_id == user_id).get(keys_only=True) is not None

    @classmethod
    def get_by_user_id(
        cls, user_id: str
    ) -> Optional[UserIdByFirebaseAuthIdModel]:
        """Fetch an entry by user ID.

        Args:
            user_id: str. The user ID.

        Returns:
            UserIdByFirebaseAuthIdModel. The model with user_id field equal
            to user_id argument.
        """
        return cls.query(cls.user_id == user_id).get()


class FirebaseSeedModel(base_models.BaseModel):
    """Dummy model used to kick-off the DestroyFirebaseAccountsOneOffJob."""

    @staticmethod
    def get_deletion_policy() -> base_models.DELETION_POLICY:
        """Model should never be erased."""
        return base_models.DELETION_POLICY.KEEP

    @staticmethod
    def get_model_association_to_user(
    ) -> base_models.MODEL_ASSOCIATION_TO_USER:
        """Model does not correspond to any users."""
        return base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER

    @classmethod
    def has_reference_to_user_id(cls, unused_user_id: str) -> bool:
        """Model does not correspond to any users."""
        return False
