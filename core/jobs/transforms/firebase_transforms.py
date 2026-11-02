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

"""Provides generic transforms for working with the Firebase Admin SDK."""

from __future__ import annotations

from collections import abc

from core import feconf, utils
from core.jobs import job_utils
from core.jobs.types import firebase_domain
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

# The length of generated Firebase auth IDs. This matches the length of the IDs
# that Firebase generates for its own accounts.
_FIREBASE_AUTH_ID_LENGTH = 28


# TODO(#15613): Here we use MyPy ignore because Apache Beam lacks type hints.
class DiffFirebaseRecords(beam.PTransform):  # type: ignore[misc]
    """Returns the diff between two PCollections of FirebaseRecord objects.

    This transform expects a tuple of PCollection[FirebaseRecord] with exactly 2
    elements. The first PCollection is considered the "expected records" (i.e.
    the ones built from Oppia's user models), and the second PCollection is
    considered to be the "actual records" (i.e. the ones exported directly from
    Firebase).

    Attributes:
        TAG_OK: PCollection[int] that can be summed to find the number of
            records present in both PCollections.
        TAG_ADD: PCollection[FirebaseRecord] with the records that are present
            in the expected records but absent from the actual ones.
        TAG_DEL: PCollection[FirebaseRecord] with the records that are absent
            from the expected records but present in the actual ones.
        TAG_OPPIA_USER_COLLISION: PCollection[str] describing Oppia-side
            data-integrity collisions: multiple Oppia users sharing one email
            address, or multiple Oppia users sharing one Firebase account ID.
            These are NOT actionable by this job because Oppia is the source of
            truth and is itself inconsistent.
        TAG_FIREBASE_ACCOUNT_COLLISION: PCollection[str] describing multiple
            Firebase accounts sharing one email address. This IS actionable: the
            diff resolves it by deleting the extra Firebase accounts.
    """

    class OutputDict(TypedDict):
        """Mapping from each output tag to its PCollection."""

        OK: beam.PCollection[int]
        ADD: beam.PCollection[firebase_domain.FirebaseRecord]
        DEL: beam.PCollection[firebase_domain.FirebaseRecord]
        OPPIA_USER_COLLISION: beam.PCollection[str]
        FIREBASE_ACCOUNT_COLLISION: beam.PCollection[str]

    # NOTE: Tag values are taken from the runtime keys of OutputDict to keep
    # them DRY. These MUST be kept in the same order to keep the mapping correct
    # (verified with tests).
    (
        TAG_OK,
        TAG_ADD,
        TAG_DEL,
        TAG_OPPIA_USER_COLLISION,
        TAG_FIREBASE_ACCOUNT_COLLISION,
    ) = OutputDict.__annotations__.keys()

    def __init__(
        self,
        auth_pairs: beam.PCollection[tuple[str, str]],
        label: str | None = None,
    ) -> None:
        """Initializes the DiffFirebaseRecords PTransform.

        This transform expects a tuple of PCollection[FirebaseRecord] with
        exactly 2 elements. The first PCollection is considered the "expected
        records" (i.e. the ones built from Oppia's user models), and the second
        PCollection is considered to be the "actual records" (i.e. the ones
        exported directly from Firebase).

        Args:
            auth_pairs: PCollection. Collection of (firebase id, oppia user id)
                pairs for every Firebase-linked Oppia user. Used to detect auth
                ID conflicts and to annotate email conflicts.
            label: str|None. The label of the PTransform.
        """
        super().__init__(label=label)
        self._auth_pairs = auth_pairs

    def expand(
        self,
        records: tuple[
            beam.PCollection[firebase_domain.FirebaseRecord],
            beam.PCollection[firebase_domain.FirebaseRecord],
        ],
    ) -> DiffFirebaseRecords.OutputDict:
        """Computes the diff between the input pair of Firebase records.

        Args:
            records: tuple. The pair of FirebaseRecord collections to be diffed.
                The first PCollection is considered the "expected records" (i.e.
                the ones built from Oppia's user models), and the second
                PCollection is considered the "actual records" (i.e. the ones
                exported directly from Firebase).

        Returns:
            OutputDict. A mapping from each tag to its PCollection. The tags
            encode the actions needed to bring the actual records in-sync with
            the expected records, and all data-integrity conflicts found which
            aren't actionable (by this job).
        """

        expected_records, actual_records = records

        keyed_expected_records = (
            expected_records
            | 'Get expected records with email keys'
            >> beam.Map(lambda r: (r.email, r))
        )

        keyed_actual_records = (
            actual_records
            | 'Get actual records with email keys'
            >> beam.Map(lambda r: (r.email, r))
        )

        diff_outputs = (
            (keyed_expected_records, keyed_actual_records)
            | 'Group records by email' >> beam.CoGroupByKey()
            | 'Drop email keys' >> beam.MapTuple(lambda _, grouped: grouped)
            | 'Compute diff'
            >> beam.FlatMapTuple(
                self._yield_diffs,
                beam.pvalue.AsMultiMap(self._auth_pairs),
            ).with_outputs(
                self.TAG_OK,
                self.TAG_ADD,
                self.TAG_DEL,
                self.TAG_OPPIA_USER_COLLISION,
                self.TAG_FIREBASE_ACCOUNT_COLLISION,
            )
        )

        auth_id_collisions = (
            self._auth_pairs
            | 'Group Oppia user ids by Firebase account id' >> beam.GroupByKey()
            | 'Only keep Firebase account ids associated with more than 1 user'
            >> beam.Filter(lambda keyed_user_id: len(set(keyed_user_id[1])) > 1)
            | 'Format Firebase account id collisions'
            >> beam.MapTuple(self._format_auth_id_collision)
        )

        # Both "multiple Oppia users share an email" (from the diff) and
        # "multiple Oppia users share a Firebase account id" (from the auth
        # pairs) are Oppia-side collisions, so they share one output.
        oppia_user_collisions = (
            diff_outputs[self.TAG_OPPIA_USER_COLLISION],
            auth_id_collisions,
        ) | 'Merge Oppia user collisions' >> beam.Flatten()

        return DiffFirebaseRecords.OutputDict(
            OK=diff_outputs[self.TAG_OK],
            ADD=diff_outputs[self.TAG_ADD],
            DEL=diff_outputs[self.TAG_DEL],
            OPPIA_USER_COLLISION=oppia_user_collisions,
            FIREBASE_ACCOUNT_COLLISION=diff_outputs[
                self.TAG_FIREBASE_ACCOUNT_COLLISION
            ],
        )

    @classmethod
    def _yield_diffs(
        cls,
        expected_iter: abc.Iterable[firebase_domain.FirebaseRecord],
        actual_iter: abc.Iterable[firebase_domain.FirebaseRecord],
        user_ids_by_auth_id: abc.Mapping[str, abc.Iterable[str]] | None = None,
    ) -> abc.Iterator[beam.TaggedOutput]:
        """Yields diffs between the given records using tagged outputs."""
        user_ids_by_auth_id = user_ids_by_auth_id or {}

        if len(expected_set := set(expected_iter)) > 1:
            user_ids = sorted(
                {
                    user_id
                    for record in expected_set
                    for user_id in user_ids_by_auth_id[record.auth_id]
                }
            )
            yield beam.TaggedOutput(
                cls.TAG_OPPIA_USER_COLLISION,
                f'Oppia users ({user_ids=!r}) are sharing the same email',
            )

        if len(actual_set := set(actual_iter)) > 1:
            auth_ids = sorted(record.auth_id for record in actual_set)
            yield beam.TaggedOutput(
                cls.TAG_FIREBASE_ACCOUNT_COLLISION,
                f'Firebase accounts ({auth_ids=!r}) are sharing the same email',
            )

        if ok_records := expected_set & actual_set:
            yield beam.TaggedOutput(cls.TAG_OK, len(ok_records))

        for record_to_add in expected_set - actual_set:
            yield beam.TaggedOutput(cls.TAG_ADD, record_to_add)

        for record_to_del in actual_set - expected_set:
            yield beam.TaggedOutput(cls.TAG_DEL, record_to_del)

    @classmethod
    def _format_auth_id_collision(
        cls, auth_id: str, user_id_iter: abc.Iterable[str]
    ) -> str:
        """Formats the collision message for an auth ID with multiple users."""

        user_ids = sorted(set(user_id_iter))
        return (
            f'Oppia users ({user_ids=!r}) are sharing the same Firebase '
            f'account ({auth_id=!r})'
        )


# TODO(#15613): Here we use MyPy ignore because Apache Beam lacks type hints.
class RepairUserAuthDetailsModels(beam.PTransform):  # type: ignore[misc]
    """Repairs users whose auth models are missing or broken.

    This transform expects a tuple of PCollections with exactly 3 elements:
    every UserAuthDetailsModel, UserSettingsModel and
    UserIdByFirebaseAuthIdModel, including deleted ones. It emits the model
    writes needed for every live, full user to have a firebase_auth_id that
    FirebaseRecord.from_oppia_models can rebuild a Firebase record from, and a
    UserIdByFirebaseAuthIdModel that maps the ID back to the user.

    Repaired users get the firebase_auth_id utils.convert_to_hash(user_id).
    Because the ID is deterministic, a rerun finishes the repairs that an
    interrupted run left half-written.

    Users are reported as problems instead of being repaired when:

    - Their UserAuthDetailsModel or UserSettingsModel is marked deleted.
    - A UserIdByFirebaseAuthIdModel with a different (or deleted) ID already
      maps to them, because the right firebase_auth_id is then ambiguous.
    - Another live, full user shares their email (ignoring case), because
      FirebaseServerSyncJob refuses to sync while Oppia users share an email.
    - They are missing their UserSettingsModel, because this transform never
      deletes models.

    Profile users are never repaired, because they have no Firebase account.
    They are recognized by the parent_user_id of their UserAuthDetailsModel or,
    when that model is missing, by the mobile learner role that every profile
    user has.

    Attributes:
        TAG_OK: PCollection[int] that can be summed to find the number of users
            that don't need to be repaired.
        TAG_PUT: PCollection[UserAuthDetailsModel|UserIdByFirebaseAuthIdModel]
            with the new or updated models that need to be put.
        TAG_PROBLEMS: PCollection[str] describing the broken users that were
            not repaired, and why.
    """

    class OutputDict(TypedDict):
        """Mapping from each output tag to its PCollection."""

        OK: beam.PCollection[int]
        PUT: beam.PCollection[
            auth_models.UserAuthDetailsModel
            | auth_models.UserIdByFirebaseAuthIdModel
        ]
        PROBLEMS: beam.PCollection[str]

    # NOTE: Tag values are taken from the runtime keys of OutputDict to keep
    # them DRY. These MUST be kept in the same order to keep the mapping correct
    # (verified with tests).
    (
        TAG_OK,
        TAG_PUT,
        TAG_PROBLEMS,
    ) = OutputDict.__annotations__.keys()

    def expand(
        self,
        input_models: tuple[
            beam.PCollection[auth_models.UserAuthDetailsModel],
            beam.PCollection[user_models.UserSettingsModel],
            beam.PCollection[auth_models.UserIdByFirebaseAuthIdModel],
        ],
    ) -> RepairUserAuthDetailsModels.OutputDict:
        """Computes the repairs needed by each user.

        Args:
            input_models: tuple. The UserAuthDetailsModels, UserSettingsModels
                and UserIdByFirebaseAuthIdModels to repair, including deleted
                ones.

        Returns:
            OutputDict. A mapping from each tag to its PCollection.
        """
        (
            user_auth_details_models,
            user_settings_models,
            user_id_by_firebase_auth_id_models,
        ) = input_models

        grouped_models = (
            user_auth_details_models
            | 'Key UserAuthDetailsModels by user id'
            >> beam.Map(lambda m: (m.id, m)),
            user_settings_models
            | 'Key UserSettingsModels by user id'
            >> beam.Map(lambda m: (m.id, m)),
            user_id_by_firebase_auth_id_models
            | 'Key UserIdByFirebaseAuthIdModels by user id'
            >> beam.Map(lambda m: (m.user_id, m)),
        ) | 'Group models by user id' >> beam.CoGroupByKey()

        # NOTE: FirebaseServerSyncJob reports an Oppia user collision (and then
        # refuses to sync anything) when users that get a Firebase account
        # share an email. Only live, full users get a Firebase account, so
        # those are the only users that can collide with a repaired user.
        shared_email_user_ids = (
            grouped_models
            | 'Get emails of live full users'
            >> beam.FlatMapTuple(self._yield_live_full_user_email)
            | 'Group user ids by email' >> beam.GroupByKey()
            | 'Sort user ids' >> beam.MapTuple(lambda e, ids: (e, sorted(ids)))
            | 'Keep emails shared by multiple users'
            >> beam.Filter(lambda email_and_ids: len(email_and_ids[1]) > 1)
        )

        # NOTE: The method is bound to a local variable so that the lambda below
        # doesn't need to pickle this PTransform.
        yield_repairs = self._yield_repairs
        repair_outputs = grouped_models | 'Compute repairs' >> (
            # NOTE: FlatMapTuple requires defaults for side inputs, so FlatMap
            # is used instead and the (user_id, grouped) pair is unpacked here.
            beam.FlatMap(
                lambda pair, user_ids_by_shared_email: yield_repairs(
                    pair[0], pair[1], user_ids_by_shared_email
                ),
                user_ids_by_shared_email=beam.pvalue.AsDict(
                    shared_email_user_ids
                ),
            ).with_outputs(self.TAG_OK, self.TAG_PUT, self.TAG_PROBLEMS)
        )

        return RepairUserAuthDetailsModels.OutputDict(
            OK=repair_outputs[self.TAG_OK],
            PUT=repair_outputs[self.TAG_PUT],
            PROBLEMS=repair_outputs[self.TAG_PROBLEMS],
        )

    @classmethod
    def _yield_repairs(
        cls,
        user_id: str,
        grouped: tuple[
            abc.Iterable[auth_models.UserAuthDetailsModel],
            abc.Iterable[user_models.UserSettingsModel],
            abc.Iterable[auth_models.UserIdByFirebaseAuthIdModel],
        ],
        user_ids_by_shared_email: abc.Mapping[str, list[str]],
    ) -> abc.Iterator[beam.TaggedOutput]:
        """Yields the repairs needed by the given user using tagged outputs."""
        auth_model_iter, settings_model_iter, reverse_model_iter = grouped
        # NOTE: Both models are keyed by user id, so there is at most one each.
        auth_model = next(iter(auth_model_iter), None)
        settings_model = next(iter(settings_model_iter), None)
        reverse_models = list(reverse_model_iter)

        if settings_model is None:
            if auth_model is None:
                for reverse_model in reverse_models:
                    yield cls._report(
                        user_id,
                        'is missing its UserAuthDetailsModel and '
                        'UserSettingsModel',
                        'it still has a UserIdByFirebaseAuthIdModel '
                        f'(firebase_auth_id={reverse_model.id!r})',
                    )
            else:
                firebase_auth_ids = sorted(m.id for m in reverse_models)
                yield cls._report(
                    user_id,
                    'is missing its UserSettingsModel',
                    'it still has a UserAuthDetailsModel and '
                    f'UserIdByFirebaseAuthIdModels ({firebase_auth_ids=!r})',
                )
            return

        # NOTE: The ID is a hash of the user ID, so reruns of a repair job
        # always assign the same ID to the same user.
        firebase_auth_id = utils.convert_to_hash(
            user_id, _FIREBASE_AUTH_ID_LENGTH
        )
        has_reverse_model = any(
            m.id == firebase_auth_id and not m.deleted for m in reverse_models
        )

        if cls._is_profile_user(auth_model, settings_model):
            yield beam.TaggedOutput(cls.TAG_OK, 1)
            return

        if auth_model is None:
            problem = 'is missing its UserAuthDetailsModel'
        elif not auth_model.firebase_auth_id:
            problem = 'is missing its firebase_auth_id'
        elif (
            auth_model.firebase_auth_id == firebase_auth_id
            and not has_reverse_model
        ):
            problem = 'is missing its UserIdByFirebaseAuthIdModel'
        else:
            yield beam.TaggedOutput(cls.TAG_OK, 1)
            return

        if auth_model is not None and auth_model.deleted:
            yield cls._report(
                user_id, problem, 'its UserAuthDetailsModel is marked deleted'
            )
        elif settings_model.deleted:
            yield cls._report(
                user_id, problem, 'its UserSettingsModel is marked deleted'
            )
        elif any(m.id != firebase_auth_id or m.deleted for m in reverse_models):
            firebase_auth_ids = sorted(m.id for m in reverse_models)
            yield cls._report(
                user_id,
                problem,
                'UserIdByFirebaseAuthIdModels already map to it '
                f'({firebase_auth_ids=!r})',
            )
        elif settings_model.email.lower() in user_ids_by_shared_email:
            user_ids = [
                i
                for i in user_ids_by_shared_email[settings_model.email.lower()]
                if i != user_id
            ]
            yield cls._report(
                user_id,
                problem,
                f'other Oppia users share its email ({user_ids=!r})',
            )
        else:
            models_to_put: list[
                auth_models.UserAuthDetailsModel
                | auth_models.UserIdByFirebaseAuthIdModel
            ] = []
            with datastore_services.get_ndb_context():
                if auth_model is None or not auth_model.firebase_auth_id:
                    # NOTE: Apache Beam requires inputs to be treated as
                    # immutable, so the input model is cloned before being
                    # changed.
                    new_auth_model = (
                        auth_models.UserAuthDetailsModel(id=user_id)
                        if auth_model is None
                        else job_utils.clone_model(auth_model)
                    )
                    new_auth_model.firebase_auth_id = firebase_auth_id
                    models_to_put.append(new_auth_model)
                if not has_reverse_model:
                    models_to_put.append(
                        auth_models.UserIdByFirebaseAuthIdModel(
                            id=firebase_auth_id, user_id=user_id
                        )
                    )
                for model in models_to_put:
                    model.update_timestamps()
            for model in models_to_put:
                yield beam.TaggedOutput(cls.TAG_PUT, model)

    @staticmethod
    def _yield_live_full_user_email(
        user_id: str,
        grouped: tuple[
            abc.Iterable[auth_models.UserAuthDetailsModel],
            abc.Iterable[user_models.UserSettingsModel],
            abc.Iterable[auth_models.UserIdByFirebaseAuthIdModel],
        ],
    ) -> abc.Iterator[tuple[str, str]]:
        """Yields the (email, user_id) pair of a live, full user.

        NOTE: The email is lowercased because Firebase stores emails in
        lowercase, so emails that differ only by case still collide.
        """
        auth_model_iter, settings_model_iter, _ = grouped
        auth_model = next(iter(auth_model_iter), None)
        settings_model = next(iter(settings_model_iter), None)
        if (
            settings_model is not None
            and not settings_model.deleted
            and not RepairUserAuthDetailsModels._is_profile_user(
                auth_model, settings_model
            )
        ):
            yield (settings_model.email.lower(), user_id)

    @staticmethod
    def _is_profile_user(
        auth_model: auth_models.UserAuthDetailsModel | None,
        settings_model: user_models.UserSettingsModel,
    ) -> bool:
        """Returns whether the given models belong to a profile user.

        NOTE: Only UserAuthDetailsModel stores the parent_user_id, so profile
        users missing that model are recognized by their mobile learner role
        instead. Every profile user is created with that role, and
        user_services forbids changing it.
        """
        if auth_model is not None and auth_model.parent_user_id is not None:
            return True
        return feconf.ROLE_ID_MOBILE_LEARNER in settings_model.roles

    @classmethod
    def _report(
        cls, user_id: str, problem: str, reason: str
    ) -> beam.TaggedOutput:
        """Returns the message explaining why the given user is a problem."""
        return beam.TaggedOutput(
            cls.TAG_PROBLEMS, f'{user_id=!r} {problem}, but {reason}'
        )
