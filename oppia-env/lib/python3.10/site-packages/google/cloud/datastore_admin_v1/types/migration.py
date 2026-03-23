# -*- coding: utf-8 -*-
# Copyright 2025 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#
from __future__ import annotations

from typing import MutableMapping, MutableSequence

import proto  # type: ignore


__protobuf__ = proto.module(
    package="google.datastore.admin.v1",
    manifest={
        "MigrationState",
        "MigrationStep",
        "MigrationStateEvent",
        "MigrationProgressEvent",
    },
)


class MigrationState(proto.Enum):
    r"""States for a migration.

    Values:
        MIGRATION_STATE_UNSPECIFIED (0):
            Unspecified.
        RUNNING (1):
            The migration is running.
        PAUSED (2):
            The migration is paused.
        COMPLETE (3):
            The migration is complete.
    """
    MIGRATION_STATE_UNSPECIFIED = 0
    RUNNING = 1
    PAUSED = 2
    COMPLETE = 3


class MigrationStep(proto.Enum):
    r"""Steps in a migration.

    Values:
        MIGRATION_STEP_UNSPECIFIED (0):
            Unspecified.
        PREPARE (6):
            Pre-migration: the database is prepared for
            migration.
        START (1):
            Start of migration.
        APPLY_WRITES_SYNCHRONOUSLY (7):
            Writes are applied synchronously to at least
            one replica.
        COPY_AND_VERIFY (2):
            Data is copied to Cloud Firestore and then
            verified to match the data in Cloud Datastore.
        REDIRECT_EVENTUALLY_CONSISTENT_READS (3):
            Eventually-consistent reads are redirected to
            Cloud Firestore.
        REDIRECT_STRONGLY_CONSISTENT_READS (4):
            Strongly-consistent reads are redirected to
            Cloud Firestore.
        REDIRECT_WRITES (5):
            Writes are redirected to Cloud Firestore.
    """
    MIGRATION_STEP_UNSPECIFIED = 0
    PREPARE = 6
    START = 1
    APPLY_WRITES_SYNCHRONOUSLY = 7
    COPY_AND_VERIFY = 2
    REDIRECT_EVENTUALLY_CONSISTENT_READS = 3
    REDIRECT_STRONGLY_CONSISTENT_READS = 4
    REDIRECT_WRITES = 5


class MigrationStateEvent(proto.Message):
    r"""An event signifying a change in state of a `migration from Cloud
    Datastore to Cloud Firestore in Datastore
    mode <https://cloud.google.com/datastore/docs/upgrade-to-firestore>`__.

    Attributes:
        state (google.cloud.datastore_admin_v1.types.MigrationState):
            The new state of the migration.
    """

    state: "MigrationState" = proto.Field(
        proto.ENUM,
        number=1,
        enum="MigrationState",
    )


class MigrationProgressEvent(proto.Message):
    r"""An event signifying the start of a new step in a `migration from
    Cloud Datastore to Cloud Firestore in Datastore
    mode <https://cloud.google.com/datastore/docs/upgrade-to-firestore>`__.

    This message has `oneof`_ fields (mutually exclusive fields).
    For each oneof, at most one member field can be set at the same time.
    Setting any member of the oneof automatically clears all other
    members.

    .. _oneof: https://proto-plus-python.readthedocs.io/en/stable/fields.html#oneofs-mutually-exclusive-fields

    Attributes:
        step (google.cloud.datastore_admin_v1.types.MigrationStep):
            The step that is starting.

            An event with step set to ``START`` indicates that the
            migration has been reverted back to the initial
            pre-migration state.
        prepare_step_details (google.cloud.datastore_admin_v1.types.MigrationProgressEvent.PrepareStepDetails):
            Details for the ``PREPARE`` step.

            This field is a member of `oneof`_ ``step_details``.
        redirect_writes_step_details (google.cloud.datastore_admin_v1.types.MigrationProgressEvent.RedirectWritesStepDetails):
            Details for the ``REDIRECT_WRITES`` step.

            This field is a member of `oneof`_ ``step_details``.
    """

    class ConcurrencyMode(proto.Enum):
        r"""Concurrency modes for transactions in Cloud Firestore.

        Values:
            CONCURRENCY_MODE_UNSPECIFIED (0):
                Unspecified.
            PESSIMISTIC (1):
                Pessimistic concurrency.
            OPTIMISTIC (2):
                Optimistic concurrency.
            OPTIMISTIC_WITH_ENTITY_GROUPS (3):
                Optimistic concurrency with entity groups.
        """
        CONCURRENCY_MODE_UNSPECIFIED = 0
        PESSIMISTIC = 1
        OPTIMISTIC = 2
        OPTIMISTIC_WITH_ENTITY_GROUPS = 3

    class PrepareStepDetails(proto.Message):
        r"""Details for the ``PREPARE`` step.

        Attributes:
            concurrency_mode (google.cloud.datastore_admin_v1.types.MigrationProgressEvent.ConcurrencyMode):
                The concurrency mode this database will use when it reaches
                the ``REDIRECT_WRITES`` step.
        """

        concurrency_mode: "MigrationProgressEvent.ConcurrencyMode" = proto.Field(
            proto.ENUM,
            number=1,
            enum="MigrationProgressEvent.ConcurrencyMode",
        )

    class RedirectWritesStepDetails(proto.Message):
        r"""Details for the ``REDIRECT_WRITES`` step.

        Attributes:
            concurrency_mode (google.cloud.datastore_admin_v1.types.MigrationProgressEvent.ConcurrencyMode):
                Ths concurrency mode for this database.
        """

        concurrency_mode: "MigrationProgressEvent.ConcurrencyMode" = proto.Field(
            proto.ENUM,
            number=1,
            enum="MigrationProgressEvent.ConcurrencyMode",
        )

    step: "MigrationStep" = proto.Field(
        proto.ENUM,
        number=1,
        enum="MigrationStep",
    )
    prepare_step_details: PrepareStepDetails = proto.Field(
        proto.MESSAGE,
        number=2,
        oneof="step_details",
        message=PrepareStepDetails,
    )
    redirect_writes_step_details: RedirectWritesStepDetails = proto.Field(
        proto.MESSAGE,
        number=3,
        oneof="step_details",
        message=RedirectWritesStepDetails,
    )


__all__ = tuple(sorted(__protobuf__.manifest))
