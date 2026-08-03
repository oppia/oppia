# coding: utf-8
#
# Copyright 2026 The Oppia Authors. All Rights Reserved.
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

"""Job-only domain objects for Firebase accounts."""

from __future__ import annotations

import dataclasses

from core.platform import models

import firebase_admin.auth as firebase_auth

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import auth_models, user_models

auth_models, user_models = models.Registry.import_models(
    [models.Names.AUTH, models.Names.USER]
)


@dataclasses.dataclass(frozen=True, unsafe_hash=True, order=True, kw_only=True)
class FirebaseRecord:
    """Adapts Firebase records fetched directly from the Firebase Admin SDK."""

    auth_id: str
    email: str
    disabled: bool

    def to_import(self) -> firebase_auth.ImportUserRecord:
        """Converts self into firebase_auth.ImportUserRecord.

        Returns:
            firebase_auth.ImportUserRecord. Holds the same auth_id, email, and
            disabled values.
        """
        return firebase_auth.ImportUserRecord(
            uid=self.auth_id, email=self.email, disabled=self.disabled
        )

    @staticmethod
    def from_export(
        record: firebase_auth.ExportedUserRecord,
    ) -> 'FirebaseRecord':
        """Returns the record corresponding to the ExportedUserRecord.

        Args:
            record: firebase_auth.ExportedUserRecord. The record to convert.

        Returns:
            firebase_domain.FirebaseRecord. Holds the same auth_id, email, and
            disabled values.

        Raises:
            ValueError. If any required fields are missing from the record.
        """
        if not record.uid or not record.email:
            raise ValueError('ExportedUserRecord needs non-empty uid and email')
        return FirebaseRecord(
            auth_id=record.uid, email=record.email, disabled=record.disabled
        )

    @staticmethod
    def from_oppia_models(
        user_auth_details_model: auth_models.UserAuthDetailsModel,
        user_settings_model: user_models.UserSettingsModel,
    ) -> 'FirebaseRecord | None':
        """Returns FirebaseRecord from Oppia's user models if valid, else None.

        Args:
            user_auth_details_model: UserAuthDetailsModel. Auth details for a
                user.
            user_settings_model: UserSettingsModel. User settings for a user.

        Returns:
            FirebaseRecord | None. A record if the given models are consistent
            with each other (i.e. they have the same id and the same deleted
            status) and are not subaccounts (i.e. `parent_user_id is not None`),
            otherwise None.

        Raises:
            ValueError. If given models have inconsistent fields.
        """
        if user_auth_details_model.id != user_settings_model.id:
            raise ValueError(
                f'{user_auth_details_model.id=!r} must match '
                f'{user_settings_model.id=!r}'
            )
        if user_auth_details_model.deleted != user_settings_model.deleted:
            raise ValueError(
                f'{user_auth_details_model.id=!r} with '
                f'deleted={user_auth_details_model.deleted} must match '
                f'{user_settings_model.id=!r} with '
                f'deleted={user_settings_model.deleted}'
            )
        if user_auth_details_model.parent_user_id is not None:
            return None
        if not user_auth_details_model.firebase_auth_id:
            raise ValueError(
                f'{user_auth_details_model.id=!r} must have non-empty'
                ' firebase_auth_id'
            )
        return FirebaseRecord(
            auth_id=user_auth_details_model.firebase_auth_id,
            email=user_settings_model.email,
            disabled=user_settings_model.deleted,
        )
