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

from core import utils
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
TAG_PROBLEMS = 'PROBLEMS'
TAG_ADD_AUTH = 'ADD_AUTH'
TAG_SET_FIREBASE_AUTH_ID = 'SET_FIREBASE_AUTH_ID'
TAG_ADD_REVERSE = 'ADD_REVERSE'

# Matches the length of the IDs that Firebase generates.
_FIREBASE_AUTH_ID_LENGTH = 28


class UserModels(TypedDict):
    """The models of one user, grouped by kind."""

    auth: list[auth_models.UserAuthDetailsModel]
    settings: list[user_models.UserSettingsModel]
    reverse: list[auth_models.UserIdByFirebaseAuthIdModel]


User = tuple[str, UserModels]


class RepairMissingUserAuthDetailsJobBase(base_jobs.JobBase):
    """Gives users the auth models that FirebaseServerSyncJob needs.

    Attributes:
        DRY_RUN: bool. Whether to only report the repairs without saving them.
    """

    DRY_RUN = True

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Returns the job's results, and saves the repairs unless DRY_RUN.

        Returns:
            PCollection. The count of OK users, the count of repaired models,
            and one error for each user that could not be safely repaired.
        """
        # NOTE: Deleted models are included because users that have them must
        # not be repaired.
        auth_models_by_user_id = (
            self.pipeline
            | 'Get UserAuthDetailsModels'
            >> ndb_io.GetModels(
                auth_models.UserAuthDetailsModel.get_all(include_deleted=True)
            )
            | 'Key UserAuthDetailsModels' >> beam.WithKeys(lambda m: m.id)
        )
        settings_models_by_user_id = (
            self.pipeline
            | 'Get UserSettingsModels'
            >> ndb_io.GetModels(
                user_models.UserSettingsModel.get_all(include_deleted=True)
            )
            | 'Key UserSettingsModels' >> beam.WithKeys(lambda m: m.id)
        )
        reverse_models_by_user_id = (
            self.pipeline
            | 'Get UserIdByFirebaseAuthIdModels'
            >> ndb_io.GetModels(
                auth_models.UserIdByFirebaseAuthIdModel.get_all(
                    include_deleted=True
                )
            )
            | 'Key UserIdByFirebaseAuthIdModels'
            >> beam.WithKeys(lambda m: m.user_id)
        )
        users = {
            'auth': auth_models_by_user_id,
            'settings': settings_models_by_user_id,
            'reverse': reverse_models_by_user_id,
        } | 'Join models by user id' >> beam.CoGroupByKey()

        # NOTE: Users that share an email block FirebaseServerSyncJob, so they
        # must not be repaired.
        shared_emails = (
            users
            | 'Get Firebase emails' >> beam.FlatMap(_get_firebase_email)
            | 'Count users per email' >> beam.combiners.Count.PerElement()
            | 'Keep shared emails' >> beam.Filter(lambda kv: kv[1] > 1)
        )

        (
            ok_users,
            problems,
            user_ids_missing_auth,
            auth_models_missing_firebase_auth_id,
            user_ids_missing_reverse,
        ) = operator.itemgetter(
            TAG_OK,
            TAG_PROBLEMS,
            TAG_ADD_AUTH,
            TAG_SET_FIREBASE_AUTH_ID,
            TAG_ADD_REVERSE,
        )(
            users
            | 'Diagnose users'
            >> beam.FlatMap(
                _diagnose_user, shared_emails=beam.pvalue.AsDict(shared_emails)
            ).with_outputs(
                TAG_OK,
                TAG_PROBLEMS,
                TAG_ADD_AUTH,
                TAG_SET_FIREBASE_AUTH_ID,
                TAG_ADD_REVERSE,
            )
        )

        repaired_models = (
            user_ids_missing_auth
            | 'Build UserAuthDetailsModels' >> beam.Map(_build_auth_model),
            auth_models_missing_firebase_auth_id
            | 'Set firebase_auth_ids' >> beam.Map(_set_firebase_auth_id),
            user_ids_missing_reverse
            | 'Build UserIdByFirebaseAuthIdModels'
            >> beam.Map(_build_reverse_model),
        ) | 'Merge repaired models' >> beam.Flatten()

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
) -> abc.Iterator[beam.TaggedOutput]:
    """Tags the user as OK, as a problem, or with each repair it needs."""
    user_id, user_models_by_kind = user
    auth_model, settings_model, reverse_models = _unpack(user_models_by_kind)
    if settings_model is None:
        yield beam.TaggedOutput(
            TAG_PROBLEMS, f'{user_id} is missing its UserSettingsModel'
        )
        return
    match auth_model, settings_model:
        # NOTE: FirebaseServerSyncJob fails on users with only one of these
        # models deleted.
        case (
            auth_models.UserAuthDetailsModel(deleted=True),
            user_models.UserSettingsModel(deleted=False),
        ):
            yield beam.TaggedOutput(
                TAG_PROBLEMS, f'{user_id} has a deleted UserAuthDetailsModel'
            )
            return
        case (
            auth_models.UserAuthDetailsModel(deleted=False),
            user_models.UserSettingsModel(deleted=True),
        ):
            yield beam.TaggedOutput(
                TAG_PROBLEMS, f'{user_id} has a deleted UserSettingsModel'
            )
            return
        case auth_models.UserAuthDetailsModel(parent_user_id=str()), _:
            yield beam.TaggedOutput(TAG_OK, user_id)
            return
        case _:
            pass

    if _is_linked_to_firebase(user_id, auth_model, reverse_models):
        yield beam.TaggedOutput(TAG_OK, user_id)
        return
    if problem := _find_problem(
        user_id, settings_model, reverse_models, shared_emails
    ):
        yield beam.TaggedOutput(TAG_PROBLEMS, f'{user_id} {problem}')
        return
    if auth_model is None:
        yield beam.TaggedOutput(TAG_ADD_AUTH, user_id)
    elif not auth_model.firebase_auth_id:
        yield beam.TaggedOutput(TAG_SET_FIREBASE_AUTH_ID, auth_model)
    # NOTE: Users with any other reverse models were reported above.
    if not reverse_models:
        yield beam.TaggedOutput(TAG_ADD_REVERSE, user_id)


def _find_problem(
    user_id: str,
    settings_model: user_models.UserSettingsModel,
    reverse_models: list[auth_models.UserIdByFirebaseAuthIdModel],
    shared_emails: abc.Mapping[str, int],
) -> str | None:
    """Returns why the user can't be safely repaired, or None if it can."""
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


# NOTE: The builders below need an NDB context because NDB can't create models
# without one.
def _build_auth_model(user_id: str) -> auth_models.UserAuthDetailsModel:
    """Returns a new UserAuthDetailsModel for the user."""
    with datastore_services.get_ndb_context():
        model = auth_models.UserAuthDetailsModel(
            id=user_id, firebase_auth_id=_generate_firebase_auth_id(user_id)
        )
        model.update_timestamps()
    return model


def _set_firebase_auth_id(
    auth_model: auth_models.UserAuthDetailsModel,
) -> auth_models.UserAuthDetailsModel:
    """Returns a copy of the model with the user's firebase_auth_id set.

    NOTE: Beam inputs must not be changed, so we change a copy.
    """
    with datastore_services.get_ndb_context():
        model = job_utils.clone_model(
            auth_model,
            firebase_auth_id=_generate_firebase_auth_id(auth_model.id),
        )
        model.update_timestamps()
    return model


def _build_reverse_model(
    user_id: str,
) -> auth_models.UserIdByFirebaseAuthIdModel:
    """Returns a new UserIdByFirebaseAuthIdModel for the user."""
    with datastore_services.get_ndb_context():
        model = auth_models.UserIdByFirebaseAuthIdModel(
            id=_generate_firebase_auth_id(user_id), user_id=user_id
        )
        model.update_timestamps()
    return model


def _get_firebase_email(user: User) -> abc.Iterator[str]:
    """Yields the user's email if the user may have a Firebase account.

    NOTE: Deleted users keep a disabled Firebase account, so their email is
    still taken.
    """
    _, user_models_by_kind = user
    auth_model, settings_model, _ = _unpack(user_models_by_kind)
    if settings_model is None or _is_profile_user(auth_model):
        return
    if not settings_model.deleted or (
        auth_model is not None and auth_model.firebase_auth_id
    ):
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
) -> bool:
    """Returns whether the user is a profile, which has no Firebase account.

    NOTE: This matches FirebaseServerSyncJob, which skips only users whose
    auth model has a parent_user_id.
    """
    return auth_model is not None and auth_model.parent_user_id is not None


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
    if firebase_auth_id != _generate_firebase_auth_id(user_id):
        return True
    return _has_live_reverse_model(firebase_auth_id, reverse_models)


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
