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

from google.protobuf import duration_pb2  # type: ignore
from google.protobuf import timestamp_pb2  # type: ignore
from google.type import dayofweek_pb2  # type: ignore


__protobuf__ = proto.module(
    package="google.firestore.admin.v1",
    manifest={
        "BackupSchedule",
        "DailyRecurrence",
        "WeeklyRecurrence",
    },
)


class BackupSchedule(proto.Message):
    r"""A backup schedule for a Cloud Firestore Database.

    This resource is owned by the database it is backing up, and is
    deleted along with the database. The actual backups are not
    though.

    This message has `oneof`_ fields (mutually exclusive fields).
    For each oneof, at most one member field can be set at the same time.
    Setting any member of the oneof automatically clears all other
    members.

    .. _oneof: https://proto-plus-python.readthedocs.io/en/stable/fields.html#oneofs-mutually-exclusive-fields

    Attributes:
        name (str):
            Output only. The unique backup schedule identifier across
            all locations and databases for the given project.

            This will be auto-assigned.

            Format is
            ``projects/{project}/databases/{database}/backupSchedules/{backup_schedule}``
        create_time (google.protobuf.timestamp_pb2.Timestamp):
            Output only. The timestamp at which this
            backup schedule was created and effective since.

            No backups will be created for this schedule
            before this time.
        update_time (google.protobuf.timestamp_pb2.Timestamp):
            Output only. The timestamp at which this backup schedule was
            most recently updated. When a backup schedule is first
            created, this is the same as create_time.
        retention (google.protobuf.duration_pb2.Duration):
            At what relative time in the future, compared
            to its creation time, the backup should be
            deleted, e.g. keep backups for 7 days.

            The maximum supported retention period is 14
            weeks.
        daily_recurrence (google.cloud.firestore_admin_v1.types.DailyRecurrence):
            For a schedule that runs daily.

            This field is a member of `oneof`_ ``recurrence``.
        weekly_recurrence (google.cloud.firestore_admin_v1.types.WeeklyRecurrence):
            For a schedule that runs weekly on a specific
            day.

            This field is a member of `oneof`_ ``recurrence``.
    """

    name: str = proto.Field(
        proto.STRING,
        number=1,
    )
    create_time: timestamp_pb2.Timestamp = proto.Field(
        proto.MESSAGE,
        number=3,
        message=timestamp_pb2.Timestamp,
    )
    update_time: timestamp_pb2.Timestamp = proto.Field(
        proto.MESSAGE,
        number=10,
        message=timestamp_pb2.Timestamp,
    )
    retention: duration_pb2.Duration = proto.Field(
        proto.MESSAGE,
        number=6,
        message=duration_pb2.Duration,
    )
    daily_recurrence: "DailyRecurrence" = proto.Field(
        proto.MESSAGE,
        number=7,
        oneof="recurrence",
        message="DailyRecurrence",
    )
    weekly_recurrence: "WeeklyRecurrence" = proto.Field(
        proto.MESSAGE,
        number=8,
        oneof="recurrence",
        message="WeeklyRecurrence",
    )


class DailyRecurrence(proto.Message):
    r"""Represents a recurring schedule that runs every day.

    The time zone is UTC.

    """


class WeeklyRecurrence(proto.Message):
    r"""Represents a recurring schedule that runs on a specified day
    of the week.
    The time zone is UTC.

    Attributes:
        day (google.type.dayofweek_pb2.DayOfWeek):
            The day of week to run.

            DAY_OF_WEEK_UNSPECIFIED is not allowed.
    """

    day: dayofweek_pb2.DayOfWeek = proto.Field(
        proto.ENUM,
        number=2,
        enum=dayofweek_pb2.DayOfWeek,
    )


__all__ = tuple(sorted(__protobuf__.manifest))
