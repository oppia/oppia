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

"""Jobs that fix users who can't be synced to Firebase.

FirebaseServerSyncJob creates each user's Firebase account with
uid=UserAuthDetailsModel.firebase_auth_id, and Oppia finds the user who signed
in through UserIdByFirebaseAuthIdModel(id=firebase_auth_id). A user who is
missing either model can't be synced, and can't sign in after a sync. These
jobs create whichever model is missing.

These jobs only read and write the datastore. They never call Firebase; the
next FirebaseServerSyncJob run creates the Firebase accounts.

A user who has no firebase_auth_id gets one derived from their user ID (see
_get_deterministic_auth_id). The ID is the same on every run, so rerunning the
job finishes any fix that an earlier run left half-written.

A user is reported instead of fixed when their email is missing or is shared
with another user, because FirebaseServerSyncJob can't sync them either way. A
user whose UserAuthDetailsModel is marked as deleted is also reported instead
of fixed, so that the deleted model isn't overwritten.
"""

from __future__ import annotations

import dataclasses
import operator
import types
from collections import abc

from core import utils
from core.jobs import base_jobs
from core.jobs.io import ndb_io
from core.jobs.transforms import job_result_transforms
from core.jobs.types import job_run_result
from core.platform import models

import apache_beam as beam
from typing import TypedDict

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import (
        auth_models,
        base_models,
        datastore_services,
        user_models,
    )

auth_models, base_models, user_models = models.Registry.import_models(
    [models.Names.AUTH, models.Names.BASE_MODEL, models.Names.USER]
)

datastore_services = models.Registry.import_datastore_services()

TAG_OK = 'OK'
TAG_ERR = 'ERR'
TAG_FIX = 'FIX'
TAG_DEL = 'DEL'

# NOTE: Firebase accepts any string of 1 to 128 characters as a uid. This
# length is used only so that generated IDs look like the ones Firebase
# generates.
_FIREBASE_AUTH_ID_LENGTH = 28


class CoGroupByKeyModels(TypedDict):
    """The models that CoGroupByKey grouped under one user ID.

    NOTE: CoGroupByKey only promises iterables, which may be read only once.

    Attributes:
        auth: Iterable(UserAuthDetailsModel). The user's auth model, if any.
            Its ID is the user ID, so there is at most one.
        settings: Iterable(UserSettingsModel). The user's settings model, if
            any. Its ID is the user ID, so there is at most one.
        backlinks: Iterable(UserIdByFirebaseAuthIdModel). Every model whose
            user_id is the user ID. There can be any number of them, because
            their ID is a Firebase auth ID and the datastore doesn't enforce
            that user_id is unique.
    """

    auth: abc.Iterable[auth_models.UserAuthDetailsModel]
    settings: abc.Iterable[user_models.UserSettingsModel]
    backlinks: abc.Iterable[auth_models.UserIdByFirebaseAuthIdModel]


@dataclasses.dataclass(frozen=True, kw_only=True)
class GroupedUserModels:
    """The fields of a user's models that this job needs.

    Attributes:
        user_id: str. The user ID that the models were grouped under.
        auth_id: str|None. The firebase_auth_id of the user's
            UserAuthDetailsModel, or None if the user has no such model or its
            firebase_auth_id is empty.
        auth_deleted: bool. Whether the user's UserAuthDetailsModel is marked
            as deleted.
        email: str|None. The email of the user's UserSettingsModel, or None if
            the user has no such model or its email is empty.
        backlink_ids: frozenset(str). The IDs (Firebase auth IDs) of every
            UserIdByFirebaseAuthIdModel whose user_id is the user ID.
    """

    user_id: str
    auth_id: str | None
    auth_deleted: bool
    email: str | None
    backlink_ids: frozenset[str]


class RepairMissingUserAuthDetailsJobBase(base_jobs.JobBase):
    """Gives users the auth models that FirebaseServerSyncJob needs.

    A "user" is any user ID that has a UserAuthDetailsModel, a
    UserSettingsModel, or a UserIdByFirebaseAuthIdModel pointing to it. Profiles
    (users whose UserAuthDetailsModel have a parent_user_id) are skipped to stay
    consistent with the FirebaseServerSyncJob.

    After a run with DRY_RUN=False that outputs no errors, every user (that is
    not a profile) has ALL of the following, where USER_ID and FIREBASE_AUTH_ID
    are consistent in all three models:

    1. UserSettingsModel(id=USER_ID) with globally unique email (ignoring case).
    2. UserAuthDetailsModel(id=USER_ID, firebase_auth_id=FIREBASE_AUTH_ID).
    3. UserIdByFirebaseAuthIdModel(id=FIREBASE_AUTH_ID, user_id=USER_ID);
    4. There is no other UserIdByFirebaseAuthIdModel with user_id=USER_ID.

    FIREBASE_AUTH_ID is the user's existing firebase_auth_id if they have one,
    otherwise a new one generated by `_get_deterministic_auth_id`.

    The job never creates or changes a UserSettingsModel, and never updates an
    existing firebase_auth_id. Users that break rule 1 or whose
    UserAuthDetailsModel is marked as deleted are reported as errors and left
    unchanged; fix them by hand and rerun the job.

    The job outputs:
        OK <n>: The number of users that already had all three models. Their
            other UserIdByFirebaseAuthIdModels are still deleted.
        ERR: <message> (stderr): One line per user that was not fixed.
        PUT <n> / WOULD PUT <n>: The number of models created.
        DEL <n> / WOULD DEL <n>: The number of UserIdByFirebaseAuthIdModels
            deleted.

    Attributes:
        DRY_RUN: bool. Whether to only report the fixes without saving them.
    """

    DRY_RUN = True

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        keyed_auth_models = (
            self.pipeline
            | 'Get Auth Models'
            >> ndb_io.GetModels(
                auth_models.UserAuthDetailsModel.get_all(include_deleted=True)
            )
            | 'Key Auth Models' >> beam.Map(lambda m: (m.id, m))
        )
        keyed_settings_models = (
            self.pipeline
            | 'Get Settings Models'
            >> ndb_io.GetModels(user_models.UserSettingsModel.get_all())
            | 'Key Settings Models' >> beam.Map(lambda m: (m.id, m))
        )
        keyed_backlink_models = (
            self.pipeline
            | 'Get Backlink Models'
            >> ndb_io.GetModels(
                auth_models.UserIdByFirebaseAuthIdModel.get_all()
            )
            | 'Key Backlink Models' >> beam.Map(lambda m: (m.user_id, m))
        )

        grouped_user_models = (
            {
                'auth': keyed_auth_models,
                'settings': keyed_settings_models,
                'backlinks': keyed_backlink_models,
            }
            | beam.CoGroupByKey()
            | beam.FlatMapTuple(_build_grouped_user_models)
        )

        # NOTE: Emails are lowercased because Firebase ignores their case.
        shared_emails = (
            grouped_user_models
            | 'Get emails'
            >> beam.FlatMap(lambda g: [g.email.lower()] if g.email else [])
            | 'Count emails' >> beam.combiners.Count.PerElement()
            | 'Keep shared emails' >> beam.Filter(lambda kv: kv[1] > 1)
        )

        oks, errs, needs_fix, needs_del = operator.itemgetter(
            TAG_OK, TAG_ERR, TAG_FIX, TAG_DEL
        )(
            grouped_user_models
            | 'Diagnose per-user actions'
            >> beam.FlatMap(
                _diagnose_user_models,
                shared_emails=beam.pvalue.AsDict(shared_emails),
            ).with_outputs(TAG_OK, TAG_ERR, TAG_FIX, TAG_DEL)
        )

        outputs = [
            oks
            | 'Count OKs' >> beam.CombineGlobally(sum)
            | 'Format OKs' >> beam.Map(lambda num: f'OK {num}')
            | 'To stdout' >> beam.Map(job_run_result.JobRunResult.as_stdout),
            errs
            | 'Format Errs' >> beam.Map(lambda msg: f'ERR: {msg}')
            | 'To stderr' >> beam.Map(job_run_result.JobRunResult.as_stderr),
        ]

        needs_put = needs_fix | 'Apply fixes' >> beam.FlatMap(_fix_user_models)

        if self.DRY_RUN:
            outputs.append(
                needs_put
                | 'Count fixed models'
                >> job_result_transforms.CountObjectsToJobRunResult('WOULD PUT')
            )
            outputs.append(
                needs_del
                | 'Count deleted models'
                >> job_result_transforms.CountObjectsToJobRunResult('WOULD DEL')
            )
        else:
            deletion = needs_del | ndb_io.DeleteModels()
            creation = (
                needs_put
                | 'Wait on deletion' >> beam.WaitOn(deletion)
                | ndb_io.PutModels()
            )

            outputs.append(
                needs_del
                | 'Wait on deletion before counting' >> beam.WaitOn(deletion)
                | 'Count deletions'
                >> job_result_transforms.CountObjectsToJobRunResult('DEL'),
            )
            outputs.append(
                needs_put
                | 'Wait on creation before counting' >> beam.WaitOn(creation)
                | 'Count creations'
                >> job_result_transforms.CountObjectsToJobRunResult('PUT')
            )

        return outputs | 'Flatten outputs' >> beam.Flatten()


class AuditMissingUserAuthDetailsJob(RepairMissingUserAuthDetailsJobBase):
    """Reports the fixes without saving them."""

    DRY_RUN = True


class RepairMissingUserAuthDetailsJob(RepairMissingUserAuthDetailsJobBase):
    """Saves the fixes to the datastore."""

    DRY_RUN = False


def _build_grouped_user_models(
    user_id: str,
    group_dict: CoGroupByKeyModels,
) -> abc.Iterator[GroupedUserModels]:
    """Yields the fields of a user's models, unless the user is a profile.

    NOTE: Profiles have no Firebase account, so they need no auth models.

    Args:
        user_id: str. The ID of the user.
        group_dict: CoGroupByKeyModels. The user's models, grouped by kind.

    Yields:
        GroupedUserModels. The fields of the user's models.
    """
    auth_model = next(iter(group_dict['auth']), None)
    if auth_model and auth_model.parent_user_id:
        return
    settings_model = next(iter(group_dict['settings']), None)
    backlink_models = group_dict['backlinks']
    yield GroupedUserModels(
        user_id=user_id,
        auth_id=auth_model.firebase_auth_id if auth_model else None,
        auth_deleted=bool(auth_model and auth_model.deleted),
        email=settings_model.email if settings_model else None,
        backlink_ids=frozenset(m.id for m in backlink_models),
    )


def _fix_user_models(
    user: GroupedUserModels,
) -> abc.Iterator[base_models.BaseModel]:
    """Yields the auth models that the user is missing.

    Args:
        user: GroupedUserModels. The fields of the user's models.

    Yields:
        BaseModel. A new UserAuthDetailsModel or UserIdByFirebaseAuthIdModel.
    """
    auth_id = user.auth_id
    if not auth_id:
        auth_id = _get_deterministic_auth_id(user)
        yield _build_missing_auth_model(user.user_id, auth_id)
    if auth_id not in user.backlink_ids:
        yield _build_missing_backlink_model(user.user_id, auth_id)


def _diagnose_user_models(
    user: GroupedUserModels,
    shared_emails: abc.Mapping[str, int] = types.MappingProxyType({}),
) -> abc.Iterator[beam.TaggedOutput]:
    """Tags users that are OK, have errors, or need to be fixed.

    Args:
        user: GroupedUserModels. The fields of the user's models.
        shared_emails: Mapping(str, int). The number of users with each
            lowercased email, for emails that more than one user has.

    Yields:
        TaggedOutput. TAG_OK with 1, TAG_ERR with an error messages, TAG_DEL
        with keys to stray UserIdByFirebaseAuthIdModels, or TAG_FIX with models.
    """
    if user.auth_deleted:
        # NOTE: The deleted model is a tombstone. Repairing the user would
        # overwrite it with a live model, so they're left unchanged.
        yield beam.TaggedOutput(
            TAG_ERR,
            f'UserAuthDetailsModel(id={user.user_id}) is marked as deleted',
        )
    elif not user.email:
        yield beam.TaggedOutput(
            TAG_ERR,
            f'UserSettingsModel(id={user.user_id}) is missing an email',
        )
    elif user.email.lower() in shared_emails:
        yield beam.TaggedOutput(
            TAG_ERR,
            f'UserSettingsModel(id={user.user_id}) is sharing an email',
        )
    elif not user.auth_id or user.auth_id not in user.backlink_ids:
        auth_id = user.auth_id or _get_deterministic_auth_id(user)
        for backlink_id in user.backlink_ids - {auth_id}:
            yield beam.TaggedOutput(TAG_DEL, _build_backlink_key(backlink_id))
        yield beam.TaggedOutput(TAG_FIX, user)
    else:
        any_dels = False
        for backlink_id in user.backlink_ids - {user.auth_id}:
            any_dels = True
            yield beam.TaggedOutput(TAG_DEL, _build_backlink_key(backlink_id))
        if not any_dels:
            yield beam.TaggedOutput(TAG_OK, 1)


def _build_backlink_key(backlink_id: str) -> datastore_services.Key:
    """Returns the key of the UserIdByFirebaseAuthIdModel with the given ID."""
    with datastore_services.get_ndb_context():
        return datastore_services.Key(
            auth_models.UserIdByFirebaseAuthIdModel, backlink_id
        )


def _build_missing_auth_model(
    user_id: str, auth_id: str
) -> auth_models.UserAuthDetailsModel:
    """Returns a new UserAuthDetailsModel for the user."""
    with datastore_services.get_ndb_context():
        model = auth_models.UserAuthDetailsModel(
            id=user_id,
            firebase_auth_id=auth_id,
        )
        model.update_timestamps()
    return model


def _build_missing_backlink_model(
    user_id: str, auth_id: str
) -> auth_models.UserIdByFirebaseAuthIdModel:
    """Returns a new UserIdByFirebaseAuthIdModel for the user."""
    with datastore_services.get_ndb_context():
        model = auth_models.UserIdByFirebaseAuthIdModel(
            id=auth_id,
            user_id=user_id,
        )
        model.update_timestamps()
    return model


def _get_deterministic_auth_id(user: GroupedUserModels) -> str:
    """Returns the user's firebase_auth_id, or the one this job gives them.

    The generated ID is a hash of the user ID, rather than one from Firebase,
    because:

    1. The Firebase Admin SDK can't reserve a uid without creating an account,
       and these jobs must not touch Firebase. FirebaseServerSyncJob creates
       the account later, with whatever uid the UserAuthDetailsModel has.
    2. The same user always gets the same ID, so a rerun after an interrupted
       run creates the same models instead of conflicting ones.

    Args:
        user: GroupedUserModels. The fields of the user's models.

    Returns:
        str. The user's firebase_auth_id if they have one, or else the
        28-character hash of their user ID.
    """
    return user.auth_id or utils.convert_to_hash(
        user.user_id, _FIREBASE_AUTH_ID_LENGTH
    )
