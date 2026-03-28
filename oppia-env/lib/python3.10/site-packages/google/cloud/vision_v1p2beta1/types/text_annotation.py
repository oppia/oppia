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

from google.cloud.vision_v1p2beta1.types import geometry

__protobuf__ = proto.module(
    package="google.cloud.vision.v1p2beta1",
    manifest={
        "TextAnnotation",
        "Page",
        "Block",
        "Paragraph",
        "Word",
        "Symbol",
    },
)


class TextAnnotation(proto.Message):
    r"""TextAnnotation contains a structured representation of OCR extracted
    text. The hierarchy of an OCR extracted text structure is like this:
    TextAnnotation -> Page -> Block -> Paragraph -> Word -> Symbol Each
    structural component, starting from Page, may further have their own
    properties. Properties describe detected languages, breaks etc..
    Please refer to the
    [TextAnnotation.TextProperty][google.cloud.vision.v1p2beta1.TextAnnotation.TextProperty]
    message definition below for more detail.

    Attributes:
        pages (MutableSequence[google.cloud.vision_v1p2beta1.types.Page]):
            List of pages detected by OCR.
        text (str):
            UTF-8 text detected on the pages.
    """

    class DetectedLanguage(proto.Message):
        r"""Detected language for a structural component.

        Attributes:
            language_code (str):
                The BCP-47 language code, such as "en-US" or "sr-Latn". For
                more information, see
                http://www.unicode.org/reports/tr35/#Unicode_locale_identifier.
            confidence (float):
                Confidence of detected language. Range [0, 1].
        """

        language_code: str = proto.Field(
            proto.STRING,
            number=1,
        )
        confidence: float = proto.Field(
            proto.FLOAT,
            number=2,
        )

    class DetectedBreak(proto.Message):
        r"""Detected start or end of a structural component.

        Attributes:
            type_ (google.cloud.vision_v1p2beta1.types.TextAnnotation.DetectedBreak.BreakType):
                Detected break type.
            is_prefix (bool):
                True if break prepends the element.
        """

        class BreakType(proto.Enum):
            r"""Enum to denote the type of break found. New line, space etc.

            Values:
                UNKNOWN (0):
                    Unknown break label type.
                SPACE (1):
                    Regular space.
                SURE_SPACE (2):
                    Sure space (very wide).
                EOL_SURE_SPACE (3):
                    Line-wrapping break.
                HYPHEN (4):
                    End-line hyphen that is not present in text; does not
                    co-occur with ``SPACE``, ``LEADER_SPACE``, or
                    ``LINE_BREAK``.
                LINE_BREAK (5):
                    Line break that ends a paragraph.
            """
            UNKNOWN = 0
            SPACE = 1
            SURE_SPACE = 2
            EOL_SURE_SPACE = 3
            HYPHEN = 4
            LINE_BREAK = 5

        type_: "TextAnnotation.DetectedBreak.BreakType" = proto.Field(
            proto.ENUM,
            number=1,
            enum="TextAnnotation.DetectedBreak.BreakType",
        )
        is_prefix: bool = proto.Field(
            proto.BOOL,
            number=2,
        )

    class TextProperty(proto.Message):
        r"""Additional information detected on the structural component.

        Attributes:
            detected_languages (MutableSequence[google.cloud.vision_v1p2beta1.types.TextAnnotation.DetectedLanguage]):
                A list of detected languages together with
                confidence.
            detected_break (google.cloud.vision_v1p2beta1.types.TextAnnotation.DetectedBreak):
                Detected start or end of a text segment.
        """

        detected_languages: MutableSequence[
            "TextAnnotation.DetectedLanguage"
        ] = proto.RepeatedField(
            proto.MESSAGE,
            number=1,
            message="TextAnnotation.DetectedLanguage",
        )
        detected_break: "TextAnnotation.DetectedBreak" = proto.Field(
            proto.MESSAGE,
            number=2,
            message="TextAnnotation.DetectedBreak",
        )

    pages: MutableSequence["Page"] = proto.RepeatedField(
        proto.MESSAGE,
        number=1,
        message="Page",
    )
    text: str = proto.Field(
        proto.STRING,
        number=2,
    )


class Page(proto.Message):
    r"""Detected page from OCR.

    Attributes:
        property (google.cloud.vision_v1p2beta1.types.TextAnnotation.TextProperty):
            Additional information detected on the page.
        width (int):
            Page width. For PDFs the unit is points. For
            images (including TIFFs) the unit is pixels.
        height (int):
            Page height. For PDFs the unit is points. For
            images (including TIFFs) the unit is pixels.
        blocks (MutableSequence[google.cloud.vision_v1p2beta1.types.Block]):
            List of blocks of text, images etc on this
            page.
        confidence (float):
            Confidence of the OCR results on the page. Range [0, 1].
    """

    property: "TextAnnotation.TextProperty" = proto.Field(
        proto.MESSAGE,
        number=1,
        message="TextAnnotation.TextProperty",
    )
    width: int = proto.Field(
        proto.INT32,
        number=2,
    )
    height: int = proto.Field(
        proto.INT32,
        number=3,
    )
    blocks: MutableSequence["Block"] = proto.RepeatedField(
        proto.MESSAGE,
        number=4,
        message="Block",
    )
    confidence: float = proto.Field(
        proto.FLOAT,
        number=5,
    )


class Block(proto.Message):
    r"""Logical element on the page.

    Attributes:
        property (google.cloud.vision_v1p2beta1.types.TextAnnotation.TextProperty):
            Additional information detected for the
            block.
        bounding_box (google.cloud.vision_v1p2beta1.types.BoundingPoly):
            The bounding box for the block. The vertices are in the
            order of top-left, top-right, bottom-right, bottom-left.
            When a rotation of the bounding box is detected the rotation
            is represented as around the top-left corner as defined when
            the text is read in the 'natural' orientation. For example:

            -  when the text is horizontal it might look like:

               ::

                    0----1
                    |    |
                    3----2

            -  when it's rotated 180 degrees around the top-left corner
               it becomes:

               ::

                    2----3
                    |    |
                    1----0

               and the vertice order will still be (0, 1, 2, 3).
        paragraphs (MutableSequence[google.cloud.vision_v1p2beta1.types.Paragraph]):
            List of paragraphs in this block (if this
            blocks is of type text).
        block_type (google.cloud.vision_v1p2beta1.types.Block.BlockType):
            Detected block type (text, image etc) for
            this block.
        confidence (float):
            Confidence of the OCR results on the block. Range [0, 1].
    """

    class BlockType(proto.Enum):
        r"""Type of a block (text, image etc) as identified by OCR.

        Values:
            UNKNOWN (0):
                Unknown block type.
            TEXT (1):
                Regular text block.
            TABLE (2):
                Table block.
            PICTURE (3):
                Image block.
            RULER (4):
                Horizontal/vertical line box.
            BARCODE (5):
                Barcode block.
        """
        UNKNOWN = 0
        TEXT = 1
        TABLE = 2
        PICTURE = 3
        RULER = 4
        BARCODE = 5

    property: "TextAnnotation.TextProperty" = proto.Field(
        proto.MESSAGE,
        number=1,
        message="TextAnnotation.TextProperty",
    )
    bounding_box: geometry.BoundingPoly = proto.Field(
        proto.MESSAGE,
        number=2,
        message=geometry.BoundingPoly,
    )
    paragraphs: MutableSequence["Paragraph"] = proto.RepeatedField(
        proto.MESSAGE,
        number=3,
        message="Paragraph",
    )
    block_type: BlockType = proto.Field(
        proto.ENUM,
        number=4,
        enum=BlockType,
    )
    confidence: float = proto.Field(
        proto.FLOAT,
        number=5,
    )


class Paragraph(proto.Message):
    r"""Structural unit of text representing a number of words in
    certain order.

    Attributes:
        property (google.cloud.vision_v1p2beta1.types.TextAnnotation.TextProperty):
            Additional information detected for the
            paragraph.
        bounding_box (google.cloud.vision_v1p2beta1.types.BoundingPoly):
            The bounding box for the paragraph. The vertices are in the
            order of top-left, top-right, bottom-right, bottom-left.
            When a rotation of the bounding box is detected the rotation
            is represented as around the top-left corner as defined when
            the text is read in the 'natural' orientation. For example:

            -  when the text is horizontal it might look like: 0----1 \|
               \| 3----2
            -  when it's rotated 180 degrees around the top-left corner
               it becomes: 2----3 \| \| 1----0 and the vertice order
               will still be (0, 1, 2, 3).
        words (MutableSequence[google.cloud.vision_v1p2beta1.types.Word]):
            List of words in this paragraph.
        confidence (float):
            Confidence of the OCR results for the paragraph. Range [0,
            1].
    """

    property: "TextAnnotation.TextProperty" = proto.Field(
        proto.MESSAGE,
        number=1,
        message="TextAnnotation.TextProperty",
    )
    bounding_box: geometry.BoundingPoly = proto.Field(
        proto.MESSAGE,
        number=2,
        message=geometry.BoundingPoly,
    )
    words: MutableSequence["Word"] = proto.RepeatedField(
        proto.MESSAGE,
        number=3,
        message="Word",
    )
    confidence: float = proto.Field(
        proto.FLOAT,
        number=4,
    )


class Word(proto.Message):
    r"""A word representation.

    Attributes:
        property (google.cloud.vision_v1p2beta1.types.TextAnnotation.TextProperty):
            Additional information detected for the word.
        bounding_box (google.cloud.vision_v1p2beta1.types.BoundingPoly):
            The bounding box for the word. The vertices are in the order
            of top-left, top-right, bottom-right, bottom-left. When a
            rotation of the bounding box is detected the rotation is
            represented as around the top-left corner as defined when
            the text is read in the 'natural' orientation. For example:

            -  when the text is horizontal it might look like: 0----1 \|
               \| 3----2
            -  when it's rotated 180 degrees around the top-left corner
               it becomes: 2----3 \| \| 1----0 and the vertice order
               will still be (0, 1, 2, 3).
        symbols (MutableSequence[google.cloud.vision_v1p2beta1.types.Symbol]):
            List of symbols in the word.
            The order of the symbols follows the natural
            reading order.
        confidence (float):
            Confidence of the OCR results for the word. Range [0, 1].
    """

    property: "TextAnnotation.TextProperty" = proto.Field(
        proto.MESSAGE,
        number=1,
        message="TextAnnotation.TextProperty",
    )
    bounding_box: geometry.BoundingPoly = proto.Field(
        proto.MESSAGE,
        number=2,
        message=geometry.BoundingPoly,
    )
    symbols: MutableSequence["Symbol"] = proto.RepeatedField(
        proto.MESSAGE,
        number=3,
        message="Symbol",
    )
    confidence: float = proto.Field(
        proto.FLOAT,
        number=4,
    )


class Symbol(proto.Message):
    r"""A single symbol representation.

    Attributes:
        property (google.cloud.vision_v1p2beta1.types.TextAnnotation.TextProperty):
            Additional information detected for the
            symbol.
        bounding_box (google.cloud.vision_v1p2beta1.types.BoundingPoly):
            The bounding box for the symbol. The vertices are in the
            order of top-left, top-right, bottom-right, bottom-left.
            When a rotation of the bounding box is detected the rotation
            is represented as around the top-left corner as defined when
            the text is read in the 'natural' orientation. For example:

            -  when the text is horizontal it might look like: 0----1 \|
               \| 3----2
            -  when it's rotated 180 degrees around the top-left corner
               it becomes: 2----3 \| \| 1----0 and the vertice order
               will still be (0, 1, 2, 3).
        text (str):
            The actual UTF-8 representation of the
            symbol.
        confidence (float):
            Confidence of the OCR results for the symbol. Range [0, 1].
    """

    property: "TextAnnotation.TextProperty" = proto.Field(
        proto.MESSAGE,
        number=1,
        message="TextAnnotation.TextProperty",
    )
    bounding_box: geometry.BoundingPoly = proto.Field(
        proto.MESSAGE,
        number=2,
        message=geometry.BoundingPoly,
    )
    text: str = proto.Field(
        proto.STRING,
        number=3,
    )
    confidence: float = proto.Field(
        proto.FLOAT,
        number=4,
    )


__all__ = tuple(sorted(__protobuf__.manifest))
