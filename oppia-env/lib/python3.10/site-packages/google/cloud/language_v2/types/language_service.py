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
    package="google.cloud.language.v2",
    manifest={
        "EncodingType",
        "Document",
        "Sentence",
        "Entity",
        "Sentiment",
        "EntityMention",
        "TextSpan",
        "ClassificationCategory",
        "AnalyzeSentimentRequest",
        "AnalyzeSentimentResponse",
        "AnalyzeEntitiesRequest",
        "AnalyzeEntitiesResponse",
        "ClassifyTextRequest",
        "ClassifyTextResponse",
        "ModerateTextRequest",
        "ModerateTextResponse",
        "AnnotateTextRequest",
        "AnnotateTextResponse",
    },
)


class EncodingType(proto.Enum):
    r"""Represents the text encoding that the caller uses to process the
    output. Providing an ``EncodingType`` is recommended because the API
    provides the beginning offsets for various outputs, such as tokens
    and mentions, and languages that natively use different text
    encodings may access offsets differently.

    Values:
        NONE (0):
            If ``EncodingType`` is not specified, encoding-dependent
            information (such as ``begin_offset``) will be set at
            ``-1``.
        UTF8 (1):
            Encoding-dependent information (such as ``begin_offset``) is
            calculated based on the UTF-8 encoding of the input. C++ and
            Go are examples of languages that use this encoding
            natively.
        UTF16 (2):
            Encoding-dependent information (such as ``begin_offset``) is
            calculated based on the UTF-16 encoding of the input. Java
            and JavaScript are examples of languages that use this
            encoding natively.
        UTF32 (3):
            Encoding-dependent information (such as ``begin_offset``) is
            calculated based on the UTF-32 encoding of the input. Python
            is an example of a language that uses this encoding
            natively.
    """
    NONE = 0
    UTF8 = 1
    UTF16 = 2
    UTF32 = 3


class Document(proto.Message):
    r"""Represents the input to API methods.

    This message has `oneof`_ fields (mutually exclusive fields).
    For each oneof, at most one member field can be set at the same time.
    Setting any member of the oneof automatically clears all other
    members.

    .. _oneof: https://proto-plus-python.readthedocs.io/en/stable/fields.html#oneofs-mutually-exclusive-fields

    Attributes:
        type_ (google.cloud.language_v2.types.Document.Type):
            Required. If the type is not set or is ``TYPE_UNSPECIFIED``,
            returns an ``INVALID_ARGUMENT`` error.
        content (str):
            The content of the input in string format.
            Cloud audit logging exempt since it is based on
            user data.

            This field is a member of `oneof`_ ``source``.
        gcs_content_uri (str):
            The Google Cloud Storage URI where the file content is
            located. This URI must be of the form:
            gs://bucket_name/object_name. For more details, see
            https://cloud.google.com/storage/docs/reference-uris. NOTE:
            Cloud Storage object versioning is not supported.

            This field is a member of `oneof`_ ``source``.
        language_code (str):
            Optional. The language of the document (if not specified,
            the language is automatically detected). Both ISO and BCP-47
            language codes are accepted. `Language
            Support <https://cloud.google.com/natural-language/docs/languages>`__
            lists currently supported languages for each API method. If
            the language (either specified by the caller or
            automatically detected) is not supported by the called API
            method, an ``INVALID_ARGUMENT`` error is returned.
    """

    class Type(proto.Enum):
        r"""The document types enum.

        Values:
            TYPE_UNSPECIFIED (0):
                The content type is not specified.
            PLAIN_TEXT (1):
                Plain text
            HTML (2):
                HTML
        """
        TYPE_UNSPECIFIED = 0
        PLAIN_TEXT = 1
        HTML = 2

    type_: Type = proto.Field(
        proto.ENUM,
        number=1,
        enum=Type,
    )
    content: str = proto.Field(
        proto.STRING,
        number=2,
        oneof="source",
    )
    gcs_content_uri: str = proto.Field(
        proto.STRING,
        number=3,
        oneof="source",
    )
    language_code: str = proto.Field(
        proto.STRING,
        number=4,
    )


class Sentence(proto.Message):
    r"""Represents a sentence in the input document.

    Attributes:
        text (google.cloud.language_v2.types.TextSpan):
            The sentence text.
        sentiment (google.cloud.language_v2.types.Sentiment):
            For calls to [AnalyzeSentiment][] or if
            [AnnotateTextRequest.Features.extract_document_sentiment][google.cloud.language.v2.AnnotateTextRequest.Features.extract_document_sentiment]
            is set to true, this field will contain the sentiment for
            the sentence.
    """

    text: "TextSpan" = proto.Field(
        proto.MESSAGE,
        number=1,
        message="TextSpan",
    )
    sentiment: "Sentiment" = proto.Field(
        proto.MESSAGE,
        number=2,
        message="Sentiment",
    )


class Entity(proto.Message):
    r"""Represents a phrase in the text that is a known entity, such
    as a person, an organization, or location. The API associates
    information, such as probability and mentions, with entities.

    Attributes:
        name (str):
            The representative name for the entity.
        type_ (google.cloud.language_v2.types.Entity.Type):
            The entity type.
        metadata (MutableMapping[str, str]):
            Metadata associated with the entity.

            For the metadata
            associated with other entity types, see the Type
            table below.
        mentions (MutableSequence[google.cloud.language_v2.types.EntityMention]):
            The mentions of this entity in the input
            document. The API currently supports proper noun
            mentions.
        sentiment (google.cloud.language_v2.types.Sentiment):
            For calls to [AnalyzeEntitySentiment][] or if
            [AnnotateTextRequest.Features.extract_entity_sentiment][google.cloud.language.v2.AnnotateTextRequest.Features.extract_entity_sentiment]
            is set to true, this field will contain the aggregate
            sentiment expressed for this entity in the provided
            document.
    """

    class Type(proto.Enum):
        r"""The type of the entity. The table
        below lists the associated fields for entities that have
        different metadata.

        Values:
            UNKNOWN (0):
                Unknown
            PERSON (1):
                Person
            LOCATION (2):
                Location
            ORGANIZATION (3):
                Organization
            EVENT (4):
                Event
            WORK_OF_ART (5):
                Artwork
            CONSUMER_GOOD (6):
                Consumer product
            OTHER (7):
                Other types of entities
            PHONE_NUMBER (9):
                Phone number

                The metadata lists the phone number, formatted according to
                local convention, plus whichever additional elements appear
                in the text:

                -  ``number`` - the actual number, broken down into sections
                   as per local convention
                -  ``national_prefix`` - country code, if detected
                -  ``area_code`` - region or area code, if detected
                -  ``extension`` - phone extension (to be dialed after
                   connection), if detected
            ADDRESS (10):
                Address

                The metadata identifies the street number and locality plus
                whichever additional elements appear in the text:

                -  ``street_number`` - street number
                -  ``locality`` - city or town
                -  ``street_name`` - street/route name, if detected
                -  ``postal_code`` - postal code, if detected
                -  ``country`` - country, if detected
                -  ``broad_region`` - administrative area, such as the
                   state, if detected
                -  ``narrow_region`` - smaller administrative area, such as
                   county, if detected
                -  ``sublocality`` - used in Asian addresses to demark a
                   district within a city, if detected
            DATE (11):
                Date

                The metadata identifies the components of the date:

                -  ``year`` - four digit year, if detected
                -  ``month`` - two digit month number, if detected
                -  ``day`` - two digit day number, if detected
            NUMBER (12):
                Number

                The metadata is the number itself.
            PRICE (13):
                Price

                The metadata identifies the ``value`` and ``currency``.
        """
        UNKNOWN = 0
        PERSON = 1
        LOCATION = 2
        ORGANIZATION = 3
        EVENT = 4
        WORK_OF_ART = 5
        CONSUMER_GOOD = 6
        OTHER = 7
        PHONE_NUMBER = 9
        ADDRESS = 10
        DATE = 11
        NUMBER = 12
        PRICE = 13

    name: str = proto.Field(
        proto.STRING,
        number=1,
    )
    type_: Type = proto.Field(
        proto.ENUM,
        number=2,
        enum=Type,
    )
    metadata: MutableMapping[str, str] = proto.MapField(
        proto.STRING,
        proto.STRING,
        number=3,
    )
    mentions: MutableSequence["EntityMention"] = proto.RepeatedField(
        proto.MESSAGE,
        number=5,
        message="EntityMention",
    )
    sentiment: "Sentiment" = proto.Field(
        proto.MESSAGE,
        number=6,
        message="Sentiment",
    )


class Sentiment(proto.Message):
    r"""Represents the feeling associated with the entire text or
    entities in the text.

    Attributes:
        magnitude (float):
            A non-negative number in the [0, +inf) range, which
            represents the absolute magnitude of sentiment regardless of
            score (positive or negative).
        score (float):
            Sentiment score between -1.0 (negative
            sentiment) and 1.0 (positive sentiment).
    """

    magnitude: float = proto.Field(
        proto.FLOAT,
        number=1,
    )
    score: float = proto.Field(
        proto.FLOAT,
        number=2,
    )


class EntityMention(proto.Message):
    r"""Represents a mention for an entity in the text. Currently,
    proper noun mentions are supported.

    Attributes:
        text (google.cloud.language_v2.types.TextSpan):
            The mention text.
        type_ (google.cloud.language_v2.types.EntityMention.Type):
            The type of the entity mention.
        sentiment (google.cloud.language_v2.types.Sentiment):
            For calls to [AnalyzeEntitySentiment][] or if
            [AnnotateTextRequest.Features.extract_entity_sentiment][google.cloud.language.v2.AnnotateTextRequest.Features.extract_entity_sentiment]
            is set to true, this field will contain the sentiment
            expressed for this mention of the entity in the provided
            document.
        probability (float):
            Probability score associated with the entity.

            The score shows the probability of the entity mention being
            the entity type. The score is in (0, 1] range.
    """

    class Type(proto.Enum):
        r"""The supported types of mentions.

        Values:
            TYPE_UNKNOWN (0):
                Unknown
            PROPER (1):
                Proper name
            COMMON (2):
                Common noun (or noun compound)
        """
        TYPE_UNKNOWN = 0
        PROPER = 1
        COMMON = 2

    text: "TextSpan" = proto.Field(
        proto.MESSAGE,
        number=1,
        message="TextSpan",
    )
    type_: Type = proto.Field(
        proto.ENUM,
        number=2,
        enum=Type,
    )
    sentiment: "Sentiment" = proto.Field(
        proto.MESSAGE,
        number=3,
        message="Sentiment",
    )
    probability: float = proto.Field(
        proto.FLOAT,
        number=4,
    )


class TextSpan(proto.Message):
    r"""Represents a text span in the input document.

    Attributes:
        content (str):
            The content of the text span, which is a
            substring of the document.
        begin_offset (int):
            The API calculates the beginning offset of the content in
            the original document according to the
            [EncodingType][google.cloud.language.v2.EncodingType]
            specified in the API request.
    """

    content: str = proto.Field(
        proto.STRING,
        number=1,
    )
    begin_offset: int = proto.Field(
        proto.INT32,
        number=2,
    )


class ClassificationCategory(proto.Message):
    r"""Represents a category returned from the text classifier.

    Attributes:
        name (str):
            The name of the category representing the
            document.
        confidence (float):
            The classifier's confidence of the category.
            Number represents how certain the classifier is
            that this category represents the given text.
        severity (float):
            Optional. The classifier's severity of the category. This is
            only present when the ModerateTextRequest.ModelVersion is
            set to MODEL_VERSION_2, and the corresponding category has a
            severity score.
    """

    name: str = proto.Field(
        proto.STRING,
        number=1,
    )
    confidence: float = proto.Field(
        proto.FLOAT,
        number=2,
    )
    severity: float = proto.Field(
        proto.FLOAT,
        number=3,
    )


class AnalyzeSentimentRequest(proto.Message):
    r"""The sentiment analysis request message.

    Attributes:
        document (google.cloud.language_v2.types.Document):
            Required. Input document.
        encoding_type (google.cloud.language_v2.types.EncodingType):
            The encoding type used by the API to
            calculate sentence offsets.
    """

    document: "Document" = proto.Field(
        proto.MESSAGE,
        number=1,
        message="Document",
    )
    encoding_type: "EncodingType" = proto.Field(
        proto.ENUM,
        number=2,
        enum="EncodingType",
    )


class AnalyzeSentimentResponse(proto.Message):
    r"""The sentiment analysis response message.

    Attributes:
        document_sentiment (google.cloud.language_v2.types.Sentiment):
            The overall sentiment of the input document.
        language_code (str):
            The language of the text, which will be the same as the
            language specified in the request or, if not specified, the
            automatically-detected language. See [Document.language][]
            field for more details.
        sentences (MutableSequence[google.cloud.language_v2.types.Sentence]):
            The sentiment for all the sentences in the
            document.
        language_supported (bool):
            Whether the language is officially supported.
            The API may still return a response when the
            language is not supported, but it is on a best
            effort basis.
    """

    document_sentiment: "Sentiment" = proto.Field(
        proto.MESSAGE,
        number=1,
        message="Sentiment",
    )
    language_code: str = proto.Field(
        proto.STRING,
        number=2,
    )
    sentences: MutableSequence["Sentence"] = proto.RepeatedField(
        proto.MESSAGE,
        number=3,
        message="Sentence",
    )
    language_supported: bool = proto.Field(
        proto.BOOL,
        number=4,
    )


class AnalyzeEntitiesRequest(proto.Message):
    r"""The entity analysis request message.

    Attributes:
        document (google.cloud.language_v2.types.Document):
            Required. Input document.
        encoding_type (google.cloud.language_v2.types.EncodingType):
            The encoding type used by the API to
            calculate offsets.
    """

    document: "Document" = proto.Field(
        proto.MESSAGE,
        number=1,
        message="Document",
    )
    encoding_type: "EncodingType" = proto.Field(
        proto.ENUM,
        number=2,
        enum="EncodingType",
    )


class AnalyzeEntitiesResponse(proto.Message):
    r"""The entity analysis response message.

    Attributes:
        entities (MutableSequence[google.cloud.language_v2.types.Entity]):
            The recognized entities in the input
            document.
        language_code (str):
            The language of the text, which will be the same as the
            language specified in the request or, if not specified, the
            automatically-detected language. See [Document.language][]
            field for more details.
        language_supported (bool):
            Whether the language is officially supported.
            The API may still return a response when the
            language is not supported, but it is on a best
            effort basis.
    """

    entities: MutableSequence["Entity"] = proto.RepeatedField(
        proto.MESSAGE,
        number=1,
        message="Entity",
    )
    language_code: str = proto.Field(
        proto.STRING,
        number=2,
    )
    language_supported: bool = proto.Field(
        proto.BOOL,
        number=3,
    )


class ClassifyTextRequest(proto.Message):
    r"""The document classification request message.

    Attributes:
        document (google.cloud.language_v2.types.Document):
            Required. Input document.
    """

    document: "Document" = proto.Field(
        proto.MESSAGE,
        number=1,
        message="Document",
    )


class ClassifyTextResponse(proto.Message):
    r"""The document classification response message.

    Attributes:
        categories (MutableSequence[google.cloud.language_v2.types.ClassificationCategory]):
            Categories representing the input document.
        language_code (str):
            The language of the text, which will be the same as the
            language specified in the request or, if not specified, the
            automatically-detected language. See [Document.language][]
            field for more details.
        language_supported (bool):
            Whether the language is officially supported.
            The API may still return a response when the
            language is not supported, but it is on a best
            effort basis.
    """

    categories: MutableSequence["ClassificationCategory"] = proto.RepeatedField(
        proto.MESSAGE,
        number=1,
        message="ClassificationCategory",
    )
    language_code: str = proto.Field(
        proto.STRING,
        number=2,
    )
    language_supported: bool = proto.Field(
        proto.BOOL,
        number=3,
    )


class ModerateTextRequest(proto.Message):
    r"""The document moderation request message.

    Attributes:
        document (google.cloud.language_v2.types.Document):
            Required. Input document.
        model_version (google.cloud.language_v2.types.ModerateTextRequest.ModelVersion):
            Optional. The model version to use for
            ModerateText.
    """

    class ModelVersion(proto.Enum):
        r"""The model version to use for ModerateText.

        Values:
            MODEL_VERSION_UNSPECIFIED (0):
                The default model version.
            MODEL_VERSION_1 (1):
                Use the v1 model, this model is used by
                default when not provided. The v1 model only
                returns probability (confidence) score for each
                category.
            MODEL_VERSION_2 (2):
                Use the v2 model.
                The v2 model only returns probability
                (confidence) score for each category, and
                returns severity score for a subset of the
                categories.
        """
        MODEL_VERSION_UNSPECIFIED = 0
        MODEL_VERSION_1 = 1
        MODEL_VERSION_2 = 2

    document: "Document" = proto.Field(
        proto.MESSAGE,
        number=1,
        message="Document",
    )
    model_version: ModelVersion = proto.Field(
        proto.ENUM,
        number=2,
        enum=ModelVersion,
    )


class ModerateTextResponse(proto.Message):
    r"""The document moderation response message.

    Attributes:
        moderation_categories (MutableSequence[google.cloud.language_v2.types.ClassificationCategory]):
            Harmful and sensitive categories representing
            the input document.
        language_code (str):
            The language of the text, which will be the same as the
            language specified in the request or, if not specified, the
            automatically-detected language. See [Document.language][]
            field for more details.
        language_supported (bool):
            Whether the language is officially supported.
            The API may still return a response when the
            language is not supported, but it is on a best
            effort basis.
    """

    moderation_categories: MutableSequence[
        "ClassificationCategory"
    ] = proto.RepeatedField(
        proto.MESSAGE,
        number=1,
        message="ClassificationCategory",
    )
    language_code: str = proto.Field(
        proto.STRING,
        number=2,
    )
    language_supported: bool = proto.Field(
        proto.BOOL,
        number=3,
    )


class AnnotateTextRequest(proto.Message):
    r"""The request message for the text annotation API, which can
    perform multiple analysis types in one call.

    Attributes:
        document (google.cloud.language_v2.types.Document):
            Required. Input document.
        features (google.cloud.language_v2.types.AnnotateTextRequest.Features):
            Required. The enabled features.
        encoding_type (google.cloud.language_v2.types.EncodingType):
            The encoding type used by the API to
            calculate offsets.
    """

    class Features(proto.Message):
        r"""All available features.
        Setting each one to true will enable that specific analysis for
        the input.

        Attributes:
            extract_entities (bool):
                Optional. Extract entities.
            extract_document_sentiment (bool):
                Optional. Extract document-level sentiment.
            classify_text (bool):
                Optional. Classify the full document into
                categories.
            moderate_text (bool):
                Optional. Moderate the document for harmful
                and sensitive categories.
        """

        extract_entities: bool = proto.Field(
            proto.BOOL,
            number=1,
        )
        extract_document_sentiment: bool = proto.Field(
            proto.BOOL,
            number=2,
        )
        classify_text: bool = proto.Field(
            proto.BOOL,
            number=4,
        )
        moderate_text: bool = proto.Field(
            proto.BOOL,
            number=5,
        )

    document: "Document" = proto.Field(
        proto.MESSAGE,
        number=1,
        message="Document",
    )
    features: Features = proto.Field(
        proto.MESSAGE,
        number=2,
        message=Features,
    )
    encoding_type: "EncodingType" = proto.Field(
        proto.ENUM,
        number=3,
        enum="EncodingType",
    )


class AnnotateTextResponse(proto.Message):
    r"""The text annotations response message.

    Attributes:
        sentences (MutableSequence[google.cloud.language_v2.types.Sentence]):
            Sentences in the input document. Populated if the user
            enables
            [AnnotateTextRequest.Features.extract_document_sentiment][google.cloud.language.v2.AnnotateTextRequest.Features.extract_document_sentiment].
        entities (MutableSequence[google.cloud.language_v2.types.Entity]):
            Entities, along with their semantic information, in the
            input document. Populated if the user enables
            [AnnotateTextRequest.Features.extract_entities][google.cloud.language.v2.AnnotateTextRequest.Features.extract_entities]
            or
            [AnnotateTextRequest.Features.extract_entity_sentiment][google.cloud.language.v2.AnnotateTextRequest.Features.extract_entity_sentiment].
        document_sentiment (google.cloud.language_v2.types.Sentiment):
            The overall sentiment for the document. Populated if the
            user enables
            [AnnotateTextRequest.Features.extract_document_sentiment][google.cloud.language.v2.AnnotateTextRequest.Features.extract_document_sentiment].
        language_code (str):
            The language of the text, which will be the same as the
            language specified in the request or, if not specified, the
            automatically-detected language. See [Document.language][]
            field for more details.
        categories (MutableSequence[google.cloud.language_v2.types.ClassificationCategory]):
            Categories identified in the input document.
        moderation_categories (MutableSequence[google.cloud.language_v2.types.ClassificationCategory]):
            Harmful and sensitive categories identified
            in the input document.
        language_supported (bool):
            Whether the language is officially supported
            by all requested features. The API may still
            return a response when the language is not
            supported, but it is on a best effort basis.
    """

    sentences: MutableSequence["Sentence"] = proto.RepeatedField(
        proto.MESSAGE,
        number=1,
        message="Sentence",
    )
    entities: MutableSequence["Entity"] = proto.RepeatedField(
        proto.MESSAGE,
        number=2,
        message="Entity",
    )
    document_sentiment: "Sentiment" = proto.Field(
        proto.MESSAGE,
        number=3,
        message="Sentiment",
    )
    language_code: str = proto.Field(
        proto.STRING,
        number=4,
    )
    categories: MutableSequence["ClassificationCategory"] = proto.RepeatedField(
        proto.MESSAGE,
        number=5,
        message="ClassificationCategory",
    )
    moderation_categories: MutableSequence[
        "ClassificationCategory"
    ] = proto.RepeatedField(
        proto.MESSAGE,
        number=6,
        message="ClassificationCategory",
    )
    language_supported: bool = proto.Field(
        proto.BOOL,
        number=7,
    )


__all__ = tuple(sorted(__protobuf__.manifest))
