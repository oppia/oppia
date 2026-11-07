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

"""Jobs that repair users who can't be synced to Firebase.

FirebaseServerSyncJob can only sync a user who has a firebase_auth_id and a
UserIdByFirebaseAuthIdModel for it. These jobs create whichever is missing.

Each repaired user gets an ID derived from their user ID. The ID is the same
on every run, so rerunning the job finishes any interrupted repair.

Users are reported instead of repaired when a repair would be unsafe.
"""

from __future__ import annotations

import operator
from collections import abc

from core import feconf, utils
from core.jobs import base_jobs, job_utils
from core.jobs.io import ndb_io
from core.jobs.transforms import job_result_transforms
from core.jobs.types import job_run_result
from core.platform import models

import apache_beam as beam
from typing import TypedDict

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import auth_models, datastore_services, user_models

auth_models, user_models = models.Registry.import_models(
    [models.Names.AUTH, models.Names.USER]
)

datastore_services = models.Registry.import_datastore_services()

TAG_OK = 'OK'
TAG_REPAIR = 'REPAIR'
TAG_PROBLEMS = 'PROBLEMS'

# Matches the length of the IDs that Firebase generates.
_FIREBASE_AUTH_ID_LENGTH = 28


class UserModels(TypedDict):
    """The models of one user, grouped by kind."""

    auth: list[auth_models.UserAuthDetailsModel]
    settings: list[user_models.UserSettingsModel]
    reverse: list[auth_models.UserIdByFirebaseAuthIdModel]


User = tuple[str, UserModels]
RepairedModel = (
    auth_models.UserAuthDetailsModel | auth_models.UserIdByFirebaseAuthIdModel
)


class RepairMissingUserAuthDetailsJobBase(base_jobs.JobBase):
    """Gives users the auth models that FirebaseServerSyncJob needs.

    Attributes:
        DRY_RUN: bool. Whether to only report the repairs without saving them.
    """

    DRY_RUN = True

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        # NOTE: Deleted models are included because users that have them must
        # not be repaired.
        users = {
            'auth': self.pipeline
            | 'Get UserAuthDetailsModels'
            >> ndb_io.GetModels(
                auth_models.UserAuthDetailsModel.get_all(include_deleted=True)
            )
            | 'Key UserAuthDetailsModels' >> beam.WithKeys(lambda m: m.id),
            'settings': self.pipeline
            | 'Get UserSettingsModels'
            >> ndb_io.GetModels(
                user_models.UserSettingsModel.get_all(include_deleted=True)
            )
            | 'Key UserSettingsModels' >> beam.WithKeys(lambda m: m.id),
            'reverse': self.pipeline
            | 'Get UserIdByFirebaseAuthIdModels'
            >> ndb_io.GetModels(
                auth_models.UserIdByFirebaseAuthIdModel.get_all(
                    include_deleted=True
                )
            )
            | 'Key UserIdByFirebaseAuthIdModels'
            >> beam.WithKeys(lambda m: m.user_id),
        } | 'Join models by user id' >> beam.CoGroupByKey()

        # NOTE: Users that share an email block FirebaseServerSyncJob, so they
        # must not be repaired.
        shared_emails = (
            users
            | 'Get emails of live full users'
            >> beam.FlatMap(_get_live_full_user_email)
            | 'Count users per email' >> beam.combiners.Count.PerElement()
            | 'Keep shared emails' >> beam.Filter(lambda kv: kv[1] > 1)
        )

        ok_users, repairable_users, problems = operator.itemgetter(
            TAG_OK, TAG_REPAIR, TAG_PROBLEMS
        )(
            users
            | 'Diagnose users'
            >> beam.Map(
                _diagnose_user,
                shared_emails=beam.pvalue.AsDict(shared_emails),
            ).with_outputs(TAG_OK, TAG_REPAIR, TAG_PROBLEMS)
        )

        repaired_models = repairable_users | 'Build repaired models' >> (
            beam.FlatMap(_build_repaired_models)
        )
        if not self.DRY_RUN:
            unused_put_result = (
                repaired_models | 'Put repaired models' >> ndb_io.PutModels()
            )

        return (
            ok_users
            | 'Count OK users'
            >> job_result_transforms.CountObjectsToJobRunResult(TAG_OK),
            repaired_models
            | 'Count repaired models'
            >> job_result_transforms.CountObjectsToJobRunResult(
                'WOULD PUT' if self.DRY_RUN else 'PUT'
            ),
            problems
            | 'Report problems'
            >> beam.Map(job_run_result.JobRunResult.as_stderr),
        ) | 'Merge results' >> beam.Flatten()


class AuditMissingUserAuthDetailsJob(RepairMissingUserAuthDetailsJobBase):
    """Reports the repairs without saving them."""

    DRY_RUN = True


class RepairMissingUserAuthDetailsJob(RepairMissingUserAuthDetailsJobBase):
    """Saves the repairs to the datastore."""

    DRY_RUN = False


def _diagnose_user(
    user: User, shared_emails: abc.Mapping[str, int]
) -> beam.TaggedOutput:
    """Tags the user as OK, as needing a repair, or as a problem."""
    user_id, user_models_by_kind = user
    auth_model, settings_model, reverse_models = _unpack(user_models_by_kind)
    if settings_model is not None and (
        _is_profile_user(auth_model, settings_model)
        or _is_linked_to_firebase(user_id, auth_model, reverse_models)
    ):
        return beam.TaggedOutput(TAG_OK, user_id)
    problem = _find_problem(
        user_id, auth_model, settings_model, reverse_models, shared_emails
    )
    if problem is not None:
        return beam.TaggedOutput(TAG_PROBLEMS, f'{user_id} {problem}')
    return beam.TaggedOutput(TAG_REPAIR, user)


def _find_problem(
    user_id: str,
    auth_model: auth_models.UserAuthDetailsModel | None,
    settings_model: user_models.UserSettingsModel | None,
    reverse_models: list[auth_models.UserIdByFirebaseAuthIdModel],
    shared_emails: abc.Mapping[str, int],
) -> str | None:
    """Returns why the user can't be safely repaired, or None if it can."""
    if settings_model is None:
        return 'is missing its UserSettingsModel'
    if auth_model is not None and auth_model.deleted:
        return 'has a deleted UserAuthDetailsModel'
    if settings_model.deleted:
        return 'has a deleted UserSettingsModel'
    if any(
        m.id != _generate_firebase_auth_id(user_id) or m.deleted
        for m in reverse_models
    ):
        return 'has unexpected UserIdByFirebaseAuthIdModels'
    if _get_email(settings_model) in shared_emails:
        return 'shares its email with another user'
    return None


def _build_repaired_models(user: User) -> list[RepairedModel]:
    """Returns the models to save to repair the user."""
    user_id, user_models_by_kind = user
    auth_model, _, reverse_models = _unpack(user_models_by_kind)
    firebase_auth_id = _generate_firebase_auth_id(user_id)
    repaired_models: list[RepairedModel] = []
    with datastore_services.get_ndb_context():
        if auth_model is None:
            repaired_models.append(
                auth_models.UserAuthDetailsModel(
                    id=user_id, firebase_auth_id=firebase_auth_id
                )
            )
        elif not auth_model.firebase_auth_id:
            # NOTE: Beam inputs must not be changed, so we change a copy.
            repaired_models.append(
                job_utils.clone_model(
                    auth_model, firebase_auth_id=firebase_auth_id
                )
            )
        if not _has_live_reverse_model(firebase_auth_id, reverse_models):
            repaired_models.append(
                auth_models.UserIdByFirebaseAuthIdModel(
                    id=firebase_auth_id, user_id=user_id
                )
            )
        for model in repaired_models:
            model.update_timestamps()
    return repaired_models


def _get_live_full_user_email(user: User) -> abc.Iterator[str]:
    """Yields the user's email if the user can have a Firebase account."""
    _, user_models_by_kind = user
    auth_model, settings_model, _ = _unpack(user_models_by_kind)
    if settings_model is None or settings_model.deleted:
        return
    if not _is_profile_user(auth_model, settings_model):
        yield _get_email(settings_model)


def _unpack(
    user_models_by_kind: UserModels,
) -> tuple[
    auth_models.UserAuthDetailsModel | None,
    user_models.UserSettingsModel | None,
    list[auth_models.UserIdByFirebaseAuthIdModel],
]:
    """Returns the user's auth model, settings model and reverse models.

    NOTE: A user has at most one auth model and one settings model.
    """
    return (
        next(iter(user_models_by_kind['auth']), None),
        next(iter(user_models_by_kind['settings']), None),
        list(user_models_by_kind['reverse']),
    )


def _is_profile_user(
    auth_model: auth_models.UserAuthDetailsModel | None,
    settings_model: user_models.UserSettingsModel,
) -> bool:
    """Returns whether the user is a profile, which never has a Firebase
    account.

    NOTE: Every profile has the mobile learner role, so a profile can still be
    recognized when its UserAuthDetailsModel is missing.
    """
    if auth_model is not None and auth_model.parent_user_id is not None:
        return True
    return feconf.ROLE_ID_MOBILE_LEARNER in settings_model.roles


def _is_linked_to_firebase(
    user_id: str,
    auth_model: auth_models.UserAuthDetailsModel | None,
    reverse_models: list[auth_models.UserIdByFirebaseAuthIdModel],
) -> bool:
    """Returns whether FirebaseServerSyncJob can already sync the user.

    NOTE: Only IDs created by this job need a check for their reverse model.
    Other IDs came from Firebase and are left alone.
    """
    if auth_model is None or not auth_model.firebase_auth_id:
        return False
    firebase_auth_id: str = auth_model.firebase_auth_id
    return firebase_auth_id != _generate_firebase_auth_id(
        user_id
    ) or _has_live_reverse_model(firebase_auth_id, reverse_models)


def _has_live_reverse_model(
    firebase_auth_id: str,
    reverse_models: list[auth_models.UserIdByFirebaseAuthIdModel],
) -> bool:
    """Returns whether a non-deleted reverse model uses the given ID."""
    return any(
        m.id == firebase_auth_id and not m.deleted for m in reverse_models
    )


def _generate_firebase_auth_id(user_id: str) -> str:
    """Returns the ID that this job gives the user, which never changes."""
    return utils.convert_to_hash(user_id, _FIREBASE_AUTH_ID_LENGTH)


def _get_email(settings_model: user_models.UserSettingsModel) -> str:
    """Returns the user's email in lowercase, because Firebase ignores case."""
    email: str = settings_model.email
    return email.lower()
