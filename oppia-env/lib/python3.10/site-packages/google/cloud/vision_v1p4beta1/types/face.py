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
    package="google.cloud.vision.v1p4beta1",
    manifest={
        "FaceRecognitionParams",
        "Celebrity",
        "FaceRecognitionResult",
    },
)


class FaceRecognitionParams(proto.Message):
    r"""Parameters for a celebrity recognition request.

    Attributes:
        celebrity_set (MutableSequence[str]):
            The resource names for one or more
            [CelebritySet][google.cloud.vision.v1p4beta1.CelebritySet]s.
            A celebrity set is preloaded and can be specified as
            "builtin/default". If this is specified, the algorithm will
            try to match the faces detected in the input image to the
            Celebrities in the CelebritySets.
    """

    celebrity_set: MutableSequence[str] = proto.RepeatedField(
        proto.STRING,
        number=1,
    )


class Celebrity(proto.Message):
    r"""A Celebrity is a group of Faces with an identity.

    Attributes:
        name (str):
            The resource name of the preloaded Celebrity. Has the format
            ``builtin/{mid}``.
        display_name (str):
            The Celebrity's display name.
        description (str):
            The Celebrity's description.
    """

    name: str = proto.Field(
        proto.STRING,
        number=1,
    )
    display_name: str = proto.Field(
        proto.STRING,
        number=2,
    )
    description: str = proto.Field(
        proto.STRING,
        number=3,
    )


class FaceRecognitionResult(proto.Message):
    r"""Information about a face's identity.

    Attributes:
        celebrity (google.cloud.vision_v1p4beta1.types.Celebrity):
            The [Celebrity][google.cloud.vision.v1p4beta1.Celebrity]
            that this face was matched to.
        confidence (float):
            Recognition confidence. Range [0, 1].
    """

    celebrity: "Celebrity" = proto.Field(
        proto.MESSAGE,
        number=1,
        message="Celebrity",
    )
    confidence: float = proto.Field(
        proto.FLOAT,
        number=2,
    )


__all__ = tuple(sorted(__protobuf__.manifest))
