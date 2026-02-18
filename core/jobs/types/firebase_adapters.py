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

"""Adapter classes for Firebase accounts."""

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


@dataclasses.dataclass(frozen=True, unsafe_hash=True, eq=False)
class StrongRecord:
    """Adapts Firebase records fetched directly from the Firebase Admin SDK."""

    auth_id: str = dataclasses.field(hash=True)
    email: str = dataclasses.field(hash=True)
    disabled: bool = dataclasses.field(hash=True)

    # Here we use object because Python requires `==` to work between ALL types.
    def __eq__(self, other: object) -> bool:
        if not isinstance(other, StrongRecord):
            return NotImplemented
        return (self.auth_id, self.email, self.disabled) == (
            other.auth_id,
            other.email,
            other.disabled,
        )

    def into_import(self) -> firebase_auth.ImportUserRecord:
        """Converts self into firebase_auth.ImportUserRecord."""
        return firebase_auth.ImportUserRecord(
            uid=self.auth_id, email=self.email, disabled=self.disabled
        )

    @classmethod
    def from_export(
        cls, record: firebase_auth.ExportedUserRecord
    ) -> 'StrongRecord':
        """Creates a strong record corresponding to the ExportedUserRecord."""
        return StrongRecord(record.uid, record.email, record.disabled)


@dataclasses.dataclass(frozen=True, unsafe_hash=True, eq=False)
class WeakRecord(StrongRecord):
    """Adapts Firebase records ASSUMED to exist based on Oppia's auth models."""

    user_id: str = dataclasses.field(hash=False)

    @classmethod
    def from_export(cls, _: firebase_auth.ExportedUserRecord) -> 'WeakRecord':
        """Always raises because Firebase records do not keep Oppia User IDs.

        Raises:
            TypeError. Always, since Firebase records lack a valid `user_id`.
        """
        raise TypeError('Firebase records have no Oppia User ID')

    @classmethod
    def from_oppia_models(
        cls,
        settings: user_models.UserSettingsModel,
        auth_details: auth_models.UserAuthDetailsModel,
    ) -> 'WeakRecord | None':
        """Returns WeakRecord from Oppia's user models if valid, else None."""
        if settings.id != auth_details.id:
            raise ValueError(
                f'UserSettingsModel.id={settings.id} does not match '
                f'UserAuthDetailsModel.id={auth_details.id}'
            )
        if settings.deleted != auth_details.deleted:
            raise ValueError(
                f'UserSettingsModel(id={settings.id})'
                f'.deleted={settings.deleted} does not match '
                f'UserAuthDetailsModel(id={auth_details.id})'
                f'.deleted={auth_details.deleted}'
            )
        if auth_details.parent_user_id is not None:
            return None
        return WeakRecord(
            auth_details.firebase_auth_id,
            settings.email,
            settings.deleted,
            settings.id,
        )
