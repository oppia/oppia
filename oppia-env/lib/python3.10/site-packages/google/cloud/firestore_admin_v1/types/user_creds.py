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

from google.protobuf import timestamp_pb2  # type: ignore


__protobuf__ = proto.module(
    package="google.firestore.admin.v1",
    manifest={
        "UserCreds",
    },
)


class UserCreds(proto.Message):
    r"""A Cloud Firestore User Creds.

    .. _oneof: https://proto-plus-python.readthedocs.io/en/stable/fields.html#oneofs-mutually-exclusive-fields

    Attributes:
        name (str):
            Identifier. The resource name of the UserCreds. Format:
            ``projects/{project}/databases/{database}/userCreds/{user_creds}``
        create_time (google.protobuf.timestamp_pb2.Timestamp):
            Output only. The time the user creds were
            created.
        update_time (google.protobuf.timestamp_pb2.Timestamp):
            Output only. The time the user creds were
            last updated.
        state (google.cloud.firestore_admin_v1.types.UserCreds.State):
            Output only. Whether the user creds are
            enabled or disabled. Defaults to ENABLED on
            creation.
        secure_password (str):
            Output only. The plaintext server-generated
            password for the user creds. Only populated in
            responses for CreateUserCreds and
            ResetUserPassword.
        resource_identity (google.cloud.firestore_admin_v1.types.UserCreds.ResourceIdentity):
            Resource Identity descriptor.

            This field is a member of `oneof`_ ``UserCredsIdentity``.
    """

    class State(proto.Enum):
        r"""The state of the user creds (ENABLED or DISABLED).

        Values:
            STATE_UNSPECIFIED (0):
                The default value. Should not be used.
            ENABLED (1):
                The user creds are enabled.
            DISABLED (2):
                The user creds are disabled.
        """
        STATE_UNSPECIFIED = 0
        ENABLED = 1
        DISABLED = 2

    class ResourceIdentity(proto.Message):
        r"""Describes a Resource Identity principal.

        Attributes:
            principal (str):
                Output only. Principal identifier string.
                See:
                https://cloud.google.com/iam/docs/principal-identifiers
        """

        principal: str = proto.Field(
            proto.STRING,
            number=1,
        )

    name: str = proto.Field(
        proto.STRING,
        number=1,
    )
    create_time: timestamp_pb2.Timestamp = proto.Field(
        proto.MESSAGE,
        number=2,
        message=timestamp_pb2.Timestamp,
    )
    update_time: timestamp_pb2.Timestamp = proto.Field(
        proto.MESSAGE,
        number=3,
        message=timestamp_pb2.Timestamp,
    )
    state: State = proto.Field(
        proto.ENUM,
        number=4,
        enum=State,
    )
    secure_password: str = proto.Field(
        proto.STRING,
        number=5,
    )
    resource_identity: ResourceIdentity = proto.Field(
        proto.MESSAGE,
        number=6,
        oneof="UserCredsIdentity",
        message=ResourceIdentity,
    )


__all__ = tuple(sorted(__protobuf__.manifest))
