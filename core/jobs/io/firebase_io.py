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

"""Provides PTransforms for operating on Firebase records."""

from __future__ import annotations

from core.jobs.io import ndb_io
from core.jobs.types import firebase_adapters
from core.platform import models
from core.platform.auth import firebase_auth_services

import apache_beam as beam
import firebase_admin.auth as firebase_auth
from apache_beam import pvalue
from typing import Iterable, TypedDict

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import auth_models, user_models

auth_models, user_models = models.Registry.import_models(
    [models.Names.AUTH, models.Names.USER]
)


# TODO(#15613): Here we use MyPy ignore because Apache Beam lacks type hints.
class GetStrongRecords(beam.PTransform):  # type: ignore[misc]
    """Gets the collection of "strong" records directly from Firebase.

    These records are considered to be "strong" because they are based on
    Firebase's _real_ data. In other words, this collection represents the
    source of truth.
    """

    def expand(
        self, pbegin: pvalue.PBegin
    ) -> beam.PCollection[firebase_adapters.StrongRecord]:
        """Returns all of the records directly from Firebase."""

        return (
            pbegin
            | 'Create singleton PCollection to begin with exactly ONE worker'
            >> beam.Create((None,))
            | 'Load all Firebase records into worker with Firebase Admin SDK'
            >> beam.ParDo(self._list_users)
            | 'Build adapter records'
            >> beam.Map(firebase_adapters.StrongRecord.from_export)
        )

    def _list_users(
        self, _: None
    ) -> Iterable[firebase_auth.ExportedUserRecord]:
        """Yields all records provided from the Firebase Admin SDK."""
        firebase_auth_services.establish_firebase_connection()
        yield from firebase_auth.list_users().iterate_all()


# TODO(#15613): Here we use MyPy ignore because Apache Beam lacks type hints.
class GetWeakRecords(beam.PTransform):  # type: ignore[misc]
    """Gets the collection of "weak" records from Oppia's user & auth models.

    These records are considered to be "weak" because they are NOT based on real
    data. Instead, they are built using Oppia's internal association models,
    under the assumption that they are consistent with "strong" (real) records.
    """

    def expand(
        self, pbegin: pvalue.PBegin
    ) -> beam.PCollection[firebase_adapters.WeakRecord]:
        """Returns all of the "weak" records from Oppia's user & auth models."""

        key_with_id_fn = lambda model: (model.id, model)

        settings_pcoll = (
            pbegin
            | 'Get UserSettingsModels'
            >> ndb_io.GetModels(
                user_models.UserSettingsModel.get_all(include_deleted=True)
            )
            | 'Key UserSettingsModels by ID' >> beam.Map(key_with_id_fn)
        )

        auth_details_pcoll = (
            pbegin
            | 'Get UserAuthDetailsModels'
            >> ndb_io.GetModels(
                auth_models.UserAuthDetailsModel.get_all(include_deleted=True)
            )
            | 'Key UserAuthDetailsModels by ID' >> beam.Map(key_with_id_fn)
        )

        return (
            {'settings': settings_pcoll, 'auth_details': auth_details_pcoll}
            | 'Group Models by ID' >> beam.CoGroupByKey()
            | 'Zip Into Weak Records' >> beam.ParDo(_ZipIntoWeakRecords())
        )


# TODO(#15613): Here we use MyPy ignore because Apache Beam lacks type hints.
class _ZipIntoWeakRecords(beam.DoFn):  # type: ignore[misc]
    """Zips fields in Oppia's user/auth models into "weak" Firebase records."""

    class OppiaUserAuthModels(TypedDict):
        """Type returned by CoGroupByKey() when grouping models by ID."""

        settings: Iterable[user_models.UserSettingsModel]
        auth_details: Iterable[auth_models.UserAuthDetailsModel]

    def process(
        self, id_to_models: tuple[str, OppiaUserAuthModels]
    ) -> Iterable[firebase_adapters.WeakRecord]:
        """Yields 0-1 weak Firebase records by zipping the input models."""

        user_id = id_to_models[0]
        settings_list = list(id_to_models[1]['settings'])
        auth_details_list = list(id_to_models[1]['auth_details'])
        try:
            strictly_zipped = zip(settings_list, auth_details_list, strict=True)
            [(settings, auth_details)] = strictly_zipped
        except ValueError as e:
            raise ValueError(
                f'Oppia users need EXACTLY ONE of each model, but {user_id=!r} '
                f'has {len(settings_list)} UserSettingsModels and '
                f'{len(auth_details_list)} UserAuthDetailsModels'
            ) from e
        if weak_record := firebase_adapters.WeakRecord.from_oppia_models(
            settings, auth_details
        ):
            yield weak_record
