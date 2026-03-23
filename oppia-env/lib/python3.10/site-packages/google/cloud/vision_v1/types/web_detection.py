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
    package="google.cloud.vision.v1",
    manifest={
        "WebDetection",
    },
)


class WebDetection(proto.Message):
    r"""Relevant information for the image from the Internet.

    Attributes:
        web_entities (MutableSequence[google.cloud.vision_v1.types.WebDetection.WebEntity]):
            Deduced entities from similar images on the
            Internet.
        full_matching_images (MutableSequence[google.cloud.vision_v1.types.WebDetection.WebImage]):
            Fully matching images from the Internet.
            Can include resized copies of the query image.
        partial_matching_images (MutableSequence[google.cloud.vision_v1.types.WebDetection.WebImage]):
            Partial matching images from the Internet.
            Those images are similar enough to share some
            key-point features. For example an original
            image will likely have partial matching for its
            crops.
        pages_with_matching_images (MutableSequence[google.cloud.vision_v1.types.WebDetection.WebPage]):
            Web pages containing the matching images from
            the Internet.
        visually_similar_images (MutableSequence[google.cloud.vision_v1.types.WebDetection.WebImage]):
            The visually similar image results.
        best_guess_labels (MutableSequence[google.cloud.vision_v1.types.WebDetection.WebLabel]):
            The service's best guess as to the topic of
            the request image. Inferred from similar images
            on the open web.
    """

    class WebEntity(proto.Message):
        r"""Entity deduced from similar images on the Internet.

        Attributes:
            entity_id (str):
                Opaque entity ID.
            score (float):
                Overall relevancy score for the entity.
                Not normalized and not comparable across
                different image queries.
            description (str):
                Canonical description of the entity, in
                English.
        """

        entity_id: str = proto.Field(
            proto.STRING,
            number=1,
        )
        score: float = proto.Field(
            proto.FLOAT,
            number=2,
        )
        description: str = proto.Field(
            proto.STRING,
            number=3,
        )

    class WebImage(proto.Message):
        r"""Metadata for online images.

        Attributes:
            url (str):
                The result image URL.
            score (float):
                (Deprecated) Overall relevancy score for the
                image.
        """

        url: str = proto.Field(
            proto.STRING,
            number=1,
        )
        score: float = proto.Field(
            proto.FLOAT,
            number=2,
        )

    class WebPage(proto.Message):
        r"""Metadata for web pages.

        Attributes:
            url (str):
                The result web page URL.
            score (float):
                (Deprecated) Overall relevancy score for the
                web page.
            page_title (str):
                Title for the web page, may contain HTML
                markups.
            full_matching_images (MutableSequence[google.cloud.vision_v1.types.WebDetection.WebImage]):
                Fully matching images on the page.
                Can include resized copies of the query image.
            partial_matching_images (MutableSequence[google.cloud.vision_v1.types.WebDetection.WebImage]):
                Partial matching images on the page.
                Those images are similar enough to share some
                key-point features. For example an original
                image will likely have partial matching for its
                crops.
        """

        url: str = proto.Field(
            proto.STRING,
            number=1,
        )
        score: float = proto.Field(
            proto.FLOAT,
            number=2,
        )
        page_title: str = proto.Field(
            proto.STRING,
            number=3,
        )
        full_matching_images: MutableSequence[
            "WebDetection.WebImage"
        ] = proto.RepeatedField(
            proto.MESSAGE,
            number=4,
            message="WebDetection.WebImage",
        )
        partial_matching_images: MutableSequence[
            "WebDetection.WebImage"
        ] = proto.RepeatedField(
            proto.MESSAGE,
            number=5,
            message="WebDetection.WebImage",
        )

    class WebLabel(proto.Message):
        r"""Label to provide extra metadata for the web detection.

        Attributes:
            label (str):
                Label for extra metadata.
            language_code (str):
                The BCP-47 language code for ``label``, such as "en-US" or
                "sr-Latn". For more information, see
                http://www.unicode.org/reports/tr35/#Unicode_locale_identifier.
        """

        label: str = proto.Field(
            proto.STRING,
            number=1,
        )
        language_code: str = proto.Field(
            proto.STRING,
            number=2,
        )

    web_entities: MutableSequence[WebEntity] = proto.RepeatedField(
        proto.MESSAGE,
        number=1,
        message=WebEntity,
    )
    full_matching_images: MutableSequence[WebImage] = proto.RepeatedField(
        proto.MESSAGE,
        number=2,
        message=WebImage,
    )
    partial_matching_images: MutableSequence[WebImage] = proto.RepeatedField(
        proto.MESSAGE,
        number=3,
        message=WebImage,
    )
    pages_with_matching_images: MutableSequence[WebPage] = proto.RepeatedField(
        proto.MESSAGE,
        number=4,
        message=WebPage,
    )
    visually_similar_images: MutableSequence[WebImage] = proto.RepeatedField(
        proto.MESSAGE,
        number=6,
        message=WebImage,
    )
    best_guess_labels: MutableSequence[WebLabel] = proto.RepeatedField(
        proto.MESSAGE,
        number=8,
        message=WebLabel,
    )


__all__ = tuple(sorted(__protobuf__.manifest))
