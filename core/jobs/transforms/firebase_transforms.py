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

import hashlib
import string
from collections import abc

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

# The characters used to encode generated Firebase auth IDs (i.e. base62).
_FIREBASE_AUTH_ID_ALPHABET = f'{string.digits}{string.ascii_letters}'

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
class ZipUserSettingsAndUserAuthDetailsModels(beam.PTransform):  # type: ignore[misc]
    """Groups UserAuthDetailsModels and UserSettingsModels by their user ID.

    This transform expects a tuple of PCollections with exactly 2 elements: the
    first is a PCollection[UserAuthDetailsModel] and the second is a
    PCollection[UserSettingsModel]. Both models are keyed by the user's ID, so
    each output element pairs a user ID with all of the models belonging to it.
    """

    def expand(
        self,
        model_pairs: tuple[
            beam.PCollection[auth_models.UserAuthDetailsModel],
            beam.PCollection[user_models.UserSettingsModel],
        ],
    ) -> beam.PCollection[
        tuple[
            str,
            tuple[
                abc.Iterable[auth_models.UserAuthDetailsModel],
                abc.Iterable[user_models.UserSettingsModel],
            ],
        ]
    ]:
        """Groups the input pair of model collections by user ID.

        Args:
            model_pairs: tuple. The pair of model collections to be grouped. The
                first PCollection holds UserAuthDetailsModels and the second
                holds UserSettingsModels.

        Returns:
            PCollection. The (user_id, (user_auth_details_models,
            user_settings_models)) pairs. Either iterable may be empty when a
            user is missing the corresponding model.
        """

        user_auth_details_models, user_settings_models = model_pairs

        keyed_user_auth_details_models = (
            user_auth_details_models
            | 'Get UserAuthDetailsModels keyed with id'
            >> beam.Map(lambda m: (m.id, m))
        )

        keyed_user_settings_models = (
            user_settings_models
            | 'Get UserSettingsModels keyed with id'
            >> beam.Map(lambda m: (m.id, m))
        )

        return (
            keyed_user_auth_details_models,
            keyed_user_settings_models,
        ) | 'Group models by user id' >> beam.CoGroupByKey()


# TODO(#15613): Here we use MyPy ignore because Apache Beam lacks type hints.
class RepairUserAuthDetailsModels(beam.PTransform):  # type: ignore[misc]
    """Repairs users whose auth models are missing or broken.

    This transform expects the output of ZipUserSettingsAndUserAuthDetailsModels
    (i.e. a PCollection of (user_id, (user_auth_details_models,
    user_settings_models)) pairs), and emits the model writes needed for every
    user to have a UserAuthDetailsModel that FirebaseRecord.from_oppia_models
    can rebuild a Firebase record from. Users are repaired as follows:

    - A user with a UserSettingsModel but no UserAuthDetailsModel gets a new
      UserAuthDetailsModel and UserIdByFirebaseAuthIdModel.
    - A user whose UserAuthDetailsModel has no parent_user_id and no
      firebase_auth_id gets its firebase_auth_id filled in, and a new
      UserIdByFirebaseAuthIdModel.

    Users whose UserAuthDetailsModel or UserSettingsModel is marked deleted are
    never repaired, and neither are users that would get a new firebase_auth_id
    while a UserIdByFirebaseAuthIdModel already maps to them (because the right
    firebase_auth_id would then be ambiguous). These users are reported as
    problems instead, as are the auth models of users without a
    UserSettingsModel, which this transform never deletes.

    NOTE: Profile users (i.e. users with a parent_user_id) that are missing
    their UserAuthDetailsModel can't be told apart from full users, so they are
    repaired as full users.

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

    def __init__(
        self,
        user_id_by_firebase_auth_id_models: beam.PCollection[
            auth_models.UserIdByFirebaseAuthIdModel
        ],
        label: str | None = None,
    ) -> None:
        """Initializes the RepairUserAuthDetailsModels PTransform.

        Args:
            user_id_by_firebase_auth_id_models: PCollection. Every
                UserIdByFirebaseAuthIdModel, including deleted ones. Used to
                find the reverse mappings belonging to each user.
            label: str|None. The label of the PTransform.
        """
        super().__init__(label=label)
        self._user_id_by_firebase_auth_id_models = (
            user_id_by_firebase_auth_id_models
        )

    def expand(
        self,
        grouped_models: beam.PCollection[
            tuple[
                str,
                tuple[
                    abc.Iterable[auth_models.UserAuthDetailsModel],
                    abc.Iterable[user_models.UserSettingsModel],
                ],
            ]
        ],
    ) -> RepairUserAuthDetailsModels.OutputDict:
        """Computes the repairs needed by each of the given users.

        Args:
            grouped_models: PCollection. The (user_id, (user_auth_details_models,
                user_settings_models)) pairs emitted by
                ZipUserSettingsAndUserAuthDetailsModels.

        Returns:
            OutputDict. A mapping from each tag to its PCollection.
        """

        keyed_user_id_by_firebase_auth_id_models = (
            self._user_id_by_firebase_auth_id_models
            | 'Get UserIdByFirebaseAuthIdModels keyed with user_id'
            >> beam.Map(lambda m: (m.user_id, m))
        )

        repair_outputs = (
            (grouped_models, keyed_user_id_by_firebase_auth_id_models)
            | 'Group reverse models by user id' >> beam.CoGroupByKey()
            | 'Compute repairs'
            >> beam.FlatMapTuple(self._yield_repairs).with_outputs(
                self.TAG_OK, self.TAG_PUT, self.TAG_PROBLEMS
            )
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
            abc.Iterable[
                tuple[
                    abc.Iterable[auth_models.UserAuthDetailsModel],
                    abc.Iterable[user_models.UserSettingsModel],
                ]
            ],
            abc.Iterable[auth_models.UserIdByFirebaseAuthIdModel],
        ],
    ) -> abc.Iterator[beam.TaggedOutput]:
        """Yields the repairs needed by the given user using tagged outputs."""
        grouped_models_iter, reverse_model_iter = grouped
        # NOTE: The iterable is empty when only reverse models refer to the
        # user, and otherwise has exactly one element because both of its
        # inputs are grouped by user id.
        user_auth_details_model_iter, user_settings_model_iter = next(
            iter(grouped_models_iter), ((), ())
        )
        # NOTE: Both models are keyed by user id, so there is at most one each.
        user_auth_details_model = next(iter(user_auth_details_model_iter), None)
        user_settings_model = next(iter(user_settings_model_iter), None)
        reverse_models = list(reverse_model_iter)

        if user_auth_details_model is None:
            if user_settings_model is None:
                for reverse_model in reverse_models:
                    yield cls._report(
                        user_id,
                        'is missing its UserAuthDetailsModel and '
                        'UserSettingsModel',
                        'it still has a UserIdByFirebaseAuthIdModel '
                        f'(firebase_auth_id={reverse_model.id!r})',
                    )
                return

            problem = 'is missing its UserAuthDetailsModel'
            if user_settings_model.deleted:
                yield cls._report(
                    user_id, problem, 'its UserSettingsModel is marked deleted'
                )
            elif reverse_models:
                yield cls._report_ambiguous(user_id, problem, reverse_models)
            else:
                with datastore_services.get_ndb_context():
                    new_model = auth_models.UserAuthDetailsModel(id=user_id)
                yield from cls._yield_firebase_auth_id_assignment(new_model)

        elif user_settings_model is None:
            firebase_auth_ids = sorted(m.id for m in reverse_models)
            yield cls._report(
                user_id,
                'is missing its UserSettingsModel',
                'it still has a UserAuthDetailsModel and '
                f'UserIdByFirebaseAuthIdModels ({firebase_auth_ids=!r})',
            )

        elif (
            user_auth_details_model.parent_user_id is None
            and not user_auth_details_model.firebase_auth_id
        ):
            problem = 'is missing its firebase_auth_id'
            if user_auth_details_model.deleted:
                yield cls._report(
                    user_id,
                    problem,
                    'its UserAuthDetailsModel is marked deleted',
                )
            elif user_settings_model.deleted:
                yield cls._report(
                    user_id, problem, 'its UserSettingsModel is marked deleted'
                )
            elif reverse_models:
                yield cls._report_ambiguous(user_id, problem, reverse_models)
            else:
                # NOTE: Apache Beam requires inputs to be treated as immutable,
                # so the input model is cloned before being changed.
                yield from cls._yield_firebase_auth_id_assignment(
                    job_utils.clone_model(user_auth_details_model)
                )

        else:
            yield beam.TaggedOutput(cls.TAG_OK, 1)

    @classmethod
    def _yield_firebase_auth_id_assignment(
        cls, user_auth_details_model: auth_models.UserAuthDetailsModel
    ) -> abc.Iterator[beam.TaggedOutput]:
        """Assigns a generated firebase_auth_id to the given (unshared) model.

        Yields the given model, updated with the generated firebase_auth_id,
        and a new UserIdByFirebaseAuthIdModel mapping that ID back to the user.
        """
        user_id = user_auth_details_model.id
        firebase_auth_id = _generate_firebase_auth_id(user_id)
        with datastore_services.get_ndb_context():
            user_auth_details_model.firebase_auth_id = firebase_auth_id
            user_auth_details_model.update_timestamps()
            reverse_model = auth_models.UserIdByFirebaseAuthIdModel(
                id=firebase_auth_id, user_id=user_id
            )
            reverse_model.update_timestamps()
        yield beam.TaggedOutput(cls.TAG_PUT, user_auth_details_model)
        yield beam.TaggedOutput(cls.TAG_PUT, reverse_model)

    @classmethod
    def _report_ambiguous(
        cls,
        user_id: str,
        problem: str,
        reverse_models: abc.Iterable[auth_models.UserIdByFirebaseAuthIdModel],
    ) -> beam.TaggedOutput:
        """Returns the problem for a user with existing reverse models."""
        firebase_auth_ids = sorted(m.id for m in reverse_models)
        return cls._report(
            user_id,
            problem,
            'UserIdByFirebaseAuthIdModels already map to it '
            f'({firebase_auth_ids=!r})',
        )

    @classmethod
    def _report(
        cls, user_id: str, problem: str, reason: str
    ) -> beam.TaggedOutput:
        """Returns the message explaining why the given user is a problem."""
        return beam.TaggedOutput(
            cls.TAG_PROBLEMS, f'{user_id=!r} {problem}, but {reason}'
        )


def _generate_firebase_auth_id(user_id: str) -> str:
    """Returns a Firebase auth ID generated deterministically from a user ID.

    The ID is the base62-encoding of the user ID's SHA-256 digest (read as a
    big-endian integer), truncated to the length of Firebase's own IDs. Being
    deterministic makes repairs idempotent: Apache Beam retries and reruns of a
    repair job always assign the same ID to the same user.

    Args:
        user_id: str. The ID of the user to generate a Firebase auth ID for.

    Returns:
        str. The generated Firebase auth ID.
    """
    value = int.from_bytes(hashlib.sha256(user_id.encode()).digest(), 'big')
    digits = []
    while value:
        value, remainder = divmod(value, len(_FIREBASE_AUTH_ID_ALPHABET))
        digits.append(_FIREBASE_AUTH_ID_ALPHABET[remainder])
    # NOTE: Digits are produced least-significant first, so they are reversed
    # to read most-significant first before truncating.
    return ''.join(reversed(digits))[:_FIREBASE_AUTH_ID_LENGTH]
