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

from google.protobuf import timestamp_pb2  # type: ignore
import proto  # type: ignore

__protobuf__ = proto.module(
    package="google.cloud.translation.v3beta1",
    manifest={
        "TranslateTextGlossaryConfig",
        "TranslateTextRequest",
        "TranslateTextResponse",
        "Translation",
        "DetectLanguageRequest",
        "DetectedLanguage",
        "DetectLanguageResponse",
        "GetSupportedLanguagesRequest",
        "SupportedLanguages",
        "SupportedLanguage",
        "GcsSource",
        "InputConfig",
        "GcsDestination",
        "OutputConfig",
        "DocumentInputConfig",
        "DocumentOutputConfig",
        "TranslateDocumentRequest",
        "DocumentTranslation",
        "TranslateDocumentResponse",
        "BatchTranslateTextRequest",
        "BatchTranslateMetadata",
        "BatchTranslateResponse",
        "GlossaryInputConfig",
        "Glossary",
        "CreateGlossaryRequest",
        "GetGlossaryRequest",
        "DeleteGlossaryRequest",
        "ListGlossariesRequest",
        "ListGlossariesResponse",
        "CreateGlossaryMetadata",
        "DeleteGlossaryMetadata",
        "DeleteGlossaryResponse",
        "BatchTranslateDocumentRequest",
        "BatchDocumentInputConfig",
        "BatchDocumentOutputConfig",
        "BatchTranslateDocumentResponse",
        "BatchTranslateDocumentMetadata",
    },
)


class TranslateTextGlossaryConfig(proto.Message):
    r"""Configures which glossary should be used for a specific
    target language, and defines options for applying that glossary.

    Attributes:
        glossary (str):
            Required. Specifies the glossary used for this translation.
            Use this format: projects/\ */locations/*/glossaries/\*
        ignore_case (bool):
            Optional. Indicates match is
            case-insensitive. Default value is false if
            missing.
    """

    glossary: str = proto.Field(
        proto.STRING,
        number=1,
    )
    ignore_case: bool = proto.Field(
        proto.BOOL,
        number=2,
    )


class TranslateTextRequest(proto.Message):
    r"""The request message for synchronous translation.

    Attributes:
        contents (MutableSequence[str]):
            Required. The content of the input in string
            format. We recommend the total content be less
            than 30k codepoints. The max length of this
            field is 1024.
            Use BatchTranslateText for larger text.
        mime_type (str):
            Optional. The format of the source text, for
            example, "text/html",  "text/plain". If left
            blank, the MIME type defaults to "text/html".
        source_language_code (str):
            Optional. The BCP-47 language code of the input text if
            known, for example, "en-US" or "sr-Latn". Supported language
            codes are listed in `Language
            Support <https://cloud.google.com/translate/docs/languages>`__.
            If the source language isn't specified, the API attempts to
            identify the source language automatically and returns the
            source language within the response.
        target_language_code (str):
            Required. The BCP-47 language code to use for translation of
            the input text, set to one of the language codes listed in
            `Language
            Support <https://cloud.google.com/translate/docs/languages>`__.
        parent (str):
            Required. Project or location to make a call. Must refer to
            a caller's project.

            Format: ``projects/{project-number-or-id}`` or
            ``projects/{project-number-or-id}/locations/{location-id}``.

            For global calls, use
            ``projects/{project-number-or-id}/locations/global`` or
            ``projects/{project-number-or-id}``.

            Non-global location is required for requests using AutoML
            models or custom glossaries.

            Models and glossaries must be within the same region (have
            same location-id), otherwise an INVALID_ARGUMENT (400) error
            is returned.
        model (str):
            Optional. The ``model`` type requested for this translation.

            The format depends on model type:

            -  AutoML Translation models:
               ``projects/{project-number-or-id}/locations/{location-id}/models/{model-id}``

            -  General (built-in) models:
               ``projects/{project-number-or-id}/locations/{location-id}/models/general/nmt``,

            For global (non-regionalized) requests, use ``location-id``
            ``global``. For example,
            ``projects/{project-number-or-id}/locations/global/models/general/nmt``.

            If not provided, the default Google model (NMT) will be used
        glossary_config (google.cloud.translate_v3beta1.types.TranslateTextGlossaryConfig):
            Optional. Glossary to be applied. The glossary must be
            within the same region (have the same location-id) as the
            model, otherwise an INVALID_ARGUMENT (400) error is
            returned.
        labels (MutableMapping[str, str]):
            Optional. The labels with user-defined
            metadata for the request.
            Label keys and values can be no longer than 63
            characters (Unicode codepoints), can only
            contain lowercase letters, numeric characters,
            underscores and dashes. International characters
            are allowed. Label values are optional. Label
            keys must start with a letter.

            See
            https://cloud.google.com/translate/docs/labels
            for more information.
    """

    contents: MutableSequence[str] = proto.RepeatedField(
        proto.STRING,
        number=1,
    )
    mime_type: str = proto.Field(
        proto.STRING,
        number=3,
    )
    source_language_code: str = proto.Field(
        proto.STRING,
        number=4,
    )
    target_language_code: str = proto.Field(
        proto.STRING,
        number=5,
    )
    parent: str = proto.Field(
        proto.STRING,
        number=8,
    )
    model: str = proto.Field(
        proto.STRING,
        number=6,
    )
    glossary_config: "TranslateTextGlossaryConfig" = proto.Field(
        proto.MESSAGE,
        number=7,
        message="TranslateTextGlossaryConfig",
    )
    labels: MutableMapping[str, str] = proto.MapField(
        proto.STRING,
        proto.STRING,
        number=10,
    )


class TranslateTextResponse(proto.Message):
    r"""

    Attributes:
        translations (MutableSequence[google.cloud.translate_v3beta1.types.Translation]):
            Text translation responses with no glossary applied. This
            field has the same length as
            [``contents``][google.cloud.translation.v3beta1.TranslateTextRequest.contents].
        glossary_translations (MutableSequence[google.cloud.translate_v3beta1.types.Translation]):
            Text translation responses if a glossary is provided in the
            request. This can be the same as
            [``translations``][google.cloud.translation.v3beta1.TranslateTextResponse.translations]
            if no terms apply. This field has the same length as
            [``contents``][google.cloud.translation.v3beta1.TranslateTextRequest.contents].
    """

    translations: MutableSequence["Translation"] = proto.RepeatedField(
        proto.MESSAGE,
        number=1,
        message="Translation",
    )
    glossary_translations: MutableSequence["Translation"] = proto.RepeatedField(
        proto.MESSAGE,
        number=3,
        message="Translation",
    )


class Translation(proto.Message):
    r"""A single translation response.

    Attributes:
        translated_text (str):
            Text translated into the target language.
            If an error occurs during translation, this
            field might be excluded from the response.
        model (str):
            Only present when ``model`` is present in the request.
            ``model`` here is normalized to have project number.

            For example: If the ``model`` requested in
            TranslationTextRequest is
            ``projects/{project-id}/locations/{location-id}/models/general/nmt``
            then ``model`` here would be normalized to
            ``projects/{project-number}/locations/{location-id}/models/general/nmt``.
        detected_language_code (str):
            The BCP-47 language code of source text in
            the initial request, detected automatically, if
            no source language was passed within the initial
            request. If the source language was passed,
            auto-detection of the language does not occur
            and this field is empty.
        glossary_config (google.cloud.translate_v3beta1.types.TranslateTextGlossaryConfig):
            The ``glossary_config`` used for this translation.
    """

    translated_text: str = proto.Field(
        proto.STRING,
        number=1,
    )
    model: str = proto.Field(
        proto.STRING,
        number=2,
    )
    detected_language_code: str = proto.Field(
        proto.STRING,
        number=4,
    )
    glossary_config: "TranslateTextGlossaryConfig" = proto.Field(
        proto.MESSAGE,
        number=3,
        message="TranslateTextGlossaryConfig",
    )


class DetectLanguageRequest(proto.Message):
    r"""The request message for language detection.

    .. _oneof: https://proto-plus-python.readthedocs.io/en/stable/fields.html#oneofs-mutually-exclusive-fields

    Attributes:
        parent (str):
            Required. Project or location to make a call. Must refer to
            a caller's project.

            Format:
            ``projects/{project-number-or-id}/locations/{location-id}``
            or ``projects/{project-number-or-id}``.

            For global calls, use
            ``projects/{project-number-or-id}/locations/global`` or
            ``projects/{project-number-or-id}``.

            Only models within the same region (has same location-id)
            can be used. Otherwise an INVALID_ARGUMENT (400) error is
            returned.
        model (str):
            Optional. The language detection model to be used.

            Format:
            ``projects/{project-number-or-id}/locations/{location-id}/models/language-detection/{model-id}``

            Only one language detection model is currently supported:
            ``projects/{project-number-or-id}/locations/{location-id}/models/language-detection/default``.

            If not specified, the default model is used.
        content (str):
            The content of the input stored as a string.

            This field is a member of `oneof`_ ``source``.
        mime_type (str):
            Optional. The format of the source text, for
            example, "text/html", "text/plain". If left
            blank, the MIME type defaults to "text/html".
        labels (MutableMapping[str, str]):
            Optional. The labels with user-defined
            metadata for the request.
            Label keys and values can be no longer than 63
            characters (Unicode codepoints), can only
            contain lowercase letters, numeric characters,
            underscores and dashes. International characters
            are allowed. Label values are optional. Label
            keys must start with a letter.

            See
            https://cloud.google.com/translate/docs/labels
            for more information.
    """

    parent: str = proto.Field(
        proto.STRING,
        number=5,
    )
    model: str = proto.Field(
        proto.STRING,
        number=4,
    )
    content: str = proto.Field(
        proto.STRING,
        number=1,
        oneof="source",
    )
    mime_type: str = proto.Field(
        proto.STRING,
        number=3,
    )
    labels: MutableMapping[str, str] = proto.MapField(
        proto.STRING,
        proto.STRING,
        number=6,
    )


class DetectedLanguage(proto.Message):
    r"""The response message for language detection.

    Attributes:
        language_code (str):
            The BCP-47 language code of source content in
            the request, detected automatically.
        confidence (float):
            The confidence of the detection result for
            this language.
    """

    language_code: str = proto.Field(
        proto.STRING,
        number=1,
    )
    confidence: float = proto.Field(
        proto.FLOAT,
        number=2,
    )


class DetectLanguageResponse(proto.Message):
    r"""The response message for language detection.

    Attributes:
        languages (MutableSequence[google.cloud.translate_v3beta1.types.DetectedLanguage]):
            A list of detected languages sorted by
            detection confidence in descending order. The
            most probable language first.
    """

    languages: MutableSequence["DetectedLanguage"] = proto.RepeatedField(
        proto.MESSAGE,
        number=1,
        message="DetectedLanguage",
    )


class GetSupportedLanguagesRequest(proto.Message):
    r"""The request message for discovering supported languages.

    Attributes:
        parent (str):
            Required. Project or location to make a call. Must refer to
            a caller's project.

            Format: ``projects/{project-number-or-id}`` or
            ``projects/{project-number-or-id}/locations/{location-id}``.

            For global calls, use
            ``projects/{project-number-or-id}/locations/global`` or
            ``projects/{project-number-or-id}``.

            Non-global location is required for AutoML models.

            Only models within the same region (have same location-id)
            can be used, otherwise an INVALID_ARGUMENT (400) error is
            returned.
        display_language_code (str):
            Optional. The language to use to return
            localized, human readable names of supported
            languages. If missing, then display names are
            not returned in a response.
        model (str):
            Optional. Get supported languages of this model.

            The format depends on model type:

            -  AutoML Translation models:
               ``projects/{project-number-or-id}/locations/{location-id}/models/{model-id}``

            -  General (built-in) models:
               ``projects/{project-number-or-id}/locations/{location-id}/models/general/nmt``,

            Returns languages supported by the specified model. If
            missing, we get supported languages of Google general NMT
            model.
    """

    parent: str = proto.Field(
        proto.STRING,
        number=3,
    )
    display_language_code: str = proto.Field(
        proto.STRING,
        number=1,
    )
    model: str = proto.Field(
        proto.STRING,
        number=2,
    )


class SupportedLanguages(proto.Message):
    r"""The response message for discovering supported languages.

    Attributes:
        languages (MutableSequence[google.cloud.translate_v3beta1.types.SupportedLanguage]):
            A list of supported language responses. This
            list contains an entry for each language the
            Translation API supports.
    """

    languages: MutableSequence["SupportedLanguage"] = proto.RepeatedField(
        proto.MESSAGE,
        number=1,
        message="SupportedLanguage",
    )


class SupportedLanguage(proto.Message):
    r"""A single supported language response corresponds to
    information related to one supported language.

    Attributes:
        language_code (str):
            Supported language code, generally consisting
            of its ISO 639-1 identifier, for example, 'en',
            'ja'. In certain cases, BCP-47 codes including
            language and region identifiers are returned
            (for example, 'zh-TW' and 'zh-CN')
        display_name (str):
            Human readable name of the language localized
            in the display language specified in the
            request.
        support_source (bool):
            Can be used as source language.
        support_target (bool):
            Can be used as target language.
    """

    language_code: str = proto.Field(
        proto.STRING,
        number=1,
    )
    display_name: str = proto.Field(
        proto.STRING,
        number=2,
    )
    support_source: bool = proto.Field(
        proto.BOOL,
        number=3,
    )
    support_target: bool = proto.Field(
        proto.BOOL,
        number=4,
    )


class GcsSource(proto.Message):
    r"""The Google Cloud Storage location for the input content.

    Attributes:
        input_uri (str):
            Required. Source data URI. For example,
            ``gs://my_bucket/my_object``.
    """

    input_uri: str = proto.Field(
        proto.STRING,
        number=1,
    )


class InputConfig(proto.Message):
    r"""Input configuration for BatchTranslateText request.

    .. _oneof: https://proto-plus-python.readthedocs.io/en/stable/fields.html#oneofs-mutually-exclusive-fields

    Attributes:
        mime_type (str):
            Optional. Can be "text/plain" or "text/html". For ``.tsv``,
            "text/html" is used if mime_type is missing. For ``.html``,
            this field must be "text/html" or empty. For ``.txt``, this
            field must be "text/plain" or empty.
        gcs_source (google.cloud.translate_v3beta1.types.GcsSource):
            Required. Google Cloud Storage location for the source
            input. This can be a single file (for example,
            ``gs://translation-test/input.tsv``) or a wildcard (for
            example, ``gs://translation-test/*``). If a file extension
            is ``.tsv``, it can contain either one or two columns. The
            first column (optional) is the id of the text request. If
            the first column is missing, we use the row number (0-based)
            from the input file as the ID in the output file. The second
            column is the actual text to be translated. We recommend
            each row be <= 10K Unicode codepoints, otherwise an error
            might be returned. Note that the input tsv must be RFC 4180
            compliant.

            You could use https://github.com/Clever/csvlint to check
            potential formatting errors in your tsv file. csvlint
            --delimiter='\t' your_input_file.tsv

            The other supported file extensions are ``.txt`` or
            ``.html``, which is treated as a single large chunk of text.

            This field is a member of `oneof`_ ``source``.
    """

    mime_type: str = proto.Field(
        proto.STRING,
        number=1,
    )
    gcs_source: "GcsSource" = proto.Field(
        proto.MESSAGE,
        number=2,
        oneof="source",
        message="GcsSource",
    )


class GcsDestination(proto.Message):
    r"""The Google Cloud Storage location for the output content.

    Attributes:
        output_uri_prefix (str):
            Required. There must be no files under 'output_uri_prefix'.
            'output_uri_prefix' must end with "/" and start with
            "gs://", otherwise an INVALID_ARGUMENT (400) error is
            returned.
    """

    output_uri_prefix: str = proto.Field(
        proto.STRING,
        number=1,
    )


class OutputConfig(proto.Message):
    r"""Output configuration for BatchTranslateText request.

    .. _oneof: https://proto-plus-python.readthedocs.io/en/stable/fields.html#oneofs-mutually-exclusive-fields

    Attributes:
        gcs_destination (google.cloud.translate_v3beta1.types.GcsDestination):
            Google Cloud Storage destination for output content. For
            every single input file (for example,
            gs://a/b/c.[extension]), we generate at most 2 \* n output
            files. (n is the # of target_language_codes in the
            BatchTranslateTextRequest).

            Output files (tsv) generated are compliant with RFC 4180
            except that record delimiters are '\n' instead of '\r\n'. We
            don't provide any way to change record delimiters.

            While the input files are being processed, we write/update
            an index file 'index.csv' under 'output_uri_prefix' (for
            example, gs://translation-test/index.csv) The index file is
            generated/updated as new files are being translated. The
            format is:

            input_file,target_language_code,translations_file,errors_file,
            glossary_translations_file,glossary_errors_file

            input_file is one file we matched using
            gcs_source.input_uri. target_language_code is provided in
            the request. translations_file contains the translations.
            (details provided below) errors_file contains the errors
            during processing of the file. (details below). Both
            translations_file and errors_file could be empty strings if
            we have no content to output. glossary_translations_file and
            glossary_errors_file are always empty strings if the
            input_file is tsv. They could also be empty if we have no
            content to output.

            Once a row is present in index.csv, the input/output
            matching never changes. Callers should also expect all the
            content in input_file are processed and ready to be consumed
            (that is, no partial output file is written).

            Since index.csv will be keeping updated during the process,
            please make sure there is no custom retention policy applied
            on the output bucket that may avoid file updating.
            (https://cloud.google.com/storage/docs/bucket-lock#retention-policy)

            The format of translations_file (for target language code
            'trg') is:
            ``gs://translation_test/a_b_c_'trg'_translations.[extension]``

            If the input file extension is tsv, the output has the
            following columns: Column 1: ID of the request provided in
            the input, if it's not provided in the input, then the input
            row number is used (0-based). Column 2: source sentence.
            Column 3: translation without applying a glossary. Empty
            string if there is an error. Column 4 (only present if a
            glossary is provided in the request): translation after
            applying the glossary. Empty string if there is an error
            applying the glossary. Could be same string as column 3 if
            there is no glossary applied.

            If input file extension is a txt or html, the translation is
            directly written to the output file. If glossary is
            requested, a separate glossary_translations_file has format
            of
            ``gs://translation_test/a_b_c_'trg'_glossary_translations.[extension]``

            The format of errors file (for target language code 'trg')
            is: ``gs://translation_test/a_b_c_'trg'_errors.[extension]``

            If the input file extension is tsv, errors_file contains the
            following: Column 1: ID of the request provided in the
            input, if it's not provided in the input, then the input row
            number is used (0-based). Column 2: source sentence. Column
            3: Error detail for the translation. Could be empty. Column
            4 (only present if a glossary is provided in the request):
            Error when applying the glossary.

            If the input file extension is txt or html,
            glossary_error_file will be generated that contains error
            details. glossary_error_file has format of
            ``gs://translation_test/a_b_c_'trg'_glossary_errors.[extension]``

            This field is a member of `oneof`_ ``destination``.
    """

    gcs_destination: "GcsDestination" = proto.Field(
        proto.MESSAGE,
        number=1,
        oneof="destination",
        message="GcsDestination",
    )


class DocumentInputConfig(proto.Message):
    r"""A document translation request input config.

    This message has `oneof`_ fields (mutually exclusive fields).
    For each oneof, at most one member field can be set at the same time.
    Setting any member of the oneof automatically clears all other
    members.

    .. _oneof: https://proto-plus-python.readthedocs.io/en/stable/fields.html#oneofs-mutually-exclusive-fields

    Attributes:
        content (bytes):
            Document's content represented as a stream of
            bytes.

            This field is a member of `oneof`_ ``source``.
        gcs_source (google.cloud.translate_v3beta1.types.GcsSource):
            Google Cloud Storage location. This must be a single file.
            For example: gs://example_bucket/example_file.pdf

            This field is a member of `oneof`_ ``source``.
        mime_type (str):
            Specifies the input document's mime_type.

            If not specified it will be determined using the file
            extension for gcs_source provided files. For a file provided
            through bytes content the mime_type must be provided.
            Currently supported mime types are:

            -  application/pdf
            -  application/vnd.openxmlformats-officedocument.wordprocessingml.document
            -  application/vnd.openxmlformats-officedocument.presentationml.presentation
            -  application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
    """

    content: bytes = proto.Field(
        proto.BYTES,
        number=1,
        oneof="source",
    )
    gcs_source: "GcsSource" = proto.Field(
        proto.MESSAGE,
        number=2,
        oneof="source",
        message="GcsSource",
    )
    mime_type: str = proto.Field(
        proto.STRING,
        number=4,
    )


class DocumentOutputConfig(proto.Message):
    r"""A document translation request output config.

    .. _oneof: https://proto-plus-python.readthedocs.io/en/stable/fields.html#oneofs-mutually-exclusive-fields

    Attributes:
        gcs_destination (google.cloud.translate_v3beta1.types.GcsDestination):
            Optional. Google Cloud Storage destination for the
            translation output, e.g., ``gs://my_bucket/my_directory/``.

            The destination directory provided does not have to be
            empty, but the bucket must exist. If a file with the same
            name as the output file already exists in the destination an
            error will be returned.

            For a DocumentInputConfig.contents provided document, the
            output file will have the name
            "output_[trg]_translations.[ext]", where

            -  [trg] corresponds to the translated file's language code,
            -  [ext] corresponds to the translated file's extension
               according to its mime type.

            For a DocumentInputConfig.gcs_uri provided document, the
            output file will have a name according to its URI. For
            example: an input file with URI: ``gs://a/b/c.[extension]``
            stored in a gcs_destination bucket with name "my_bucket"
            will have an output URI:
            ``gs://my_bucket/a_b_c_[trg]_translations.[ext]``, where

            -  [trg] corresponds to the translated file's language code,
            -  [ext] corresponds to the translated file's extension
               according to its mime type.

            If the document was directly provided through the request,
            then the output document will have the format:
            ``gs://my_bucket/translated_document_[trg]_translations.[ext]``,
            where

            -  [trg] corresponds to the translated file's language code,
            -  [ext] corresponds to the translated file's extension
               according to its mime type.

            If a glossary was provided, then the output URI for the
            glossary translation will be equal to the default output URI
            but have ``glossary_translations`` instead of
            ``translations``. For the previous example, its glossary URI
            would be:
            ``gs://my_bucket/a_b_c_[trg]_glossary_translations.[ext]``.

            Thus the max number of output files will be 2 (Translated
            document, Glossary translated document).

            Callers should expect no partial outputs. If there is any
            error during document translation, no output will be stored
            in the Cloud Storage bucket.

            This field is a member of `oneof`_ ``destination``.
        mime_type (str):
            Optional. Specifies the translated document's mime_type. If
            not specified, the translated file's mime type will be the
            same as the input file's mime type. Currently only support
            the output mime type to be the same as input mime type.

            -  application/pdf
            -  application/vnd.openxmlformats-officedocument.wordprocessingml.document
            -  application/vnd.openxmlformats-officedocument.presentationml.presentation
            -  application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
    """

    gcs_destination: "GcsDestination" = proto.Field(
        proto.MESSAGE,
        number=1,
        oneof="destination",
        message="GcsDestination",
    )
    mime_type: str = proto.Field(
        proto.STRING,
        number=3,
    )


class TranslateDocumentRequest(proto.Message):
    r"""A document translation request.

    Attributes:
        parent (str):
            Required. Location to make a regional call.

            Format:
            ``projects/{project-number-or-id}/locations/{location-id}``.

            For global calls, use
            ``projects/{project-number-or-id}/locations/global``.

            Non-global location is required for requests using AutoML
            models or custom glossaries.

            Models and glossaries must be within the same region (have
            the same location-id), otherwise an INVALID_ARGUMENT (400)
            error is returned.
        source_language_code (str):
            Optional. The BCP-47 language code of the input document if
            known, for example, "en-US" or "sr-Latn". Supported language
            codes are listed in `Language
            Support <https://cloud.google.com/translate/docs/languages>`__.
            If the source language isn't specified, the API attempts to
            identify the source language automatically and returns the
            source language within the response. Source language must be
            specified if the request contains a glossary or a custom
            model.
        target_language_code (str):
            Required. The BCP-47 language code to use for translation of
            the input document, set to one of the language codes listed
            in `Language
            Support <https://cloud.google.com/translate/docs/languages>`__.
        document_input_config (google.cloud.translate_v3beta1.types.DocumentInputConfig):
            Required. Input configurations.
        document_output_config (google.cloud.translate_v3beta1.types.DocumentOutputConfig):
            Optional. Output configurations.
            Defines if the output file should be stored
            within Cloud Storage as well as the desired
            output format. If not provided the translated
            file will only be returned through a byte-stream
            and its output mime type will be the same as the
            input file's mime type.
        model (str):
            Optional. The ``model`` type requested for this translation.

            The format depends on model type:

            -  AutoML Translation models:
               ``projects/{project-number-or-id}/locations/{location-id}/models/{model-id}``

            -  General (built-in) models:
               ``projects/{project-number-or-id}/locations/{location-id}/models/general/nmt``,

            If not provided, the default Google model (NMT) will be used
            for translation.
        glossary_config (google.cloud.translate_v3beta1.types.TranslateTextGlossaryConfig):
            Optional. Glossary to be applied. The glossary must be
            within the same region (have the same location-id) as the
            model, otherwise an INVALID_ARGUMENT (400) error is
            returned.
        labels (MutableMapping[str, str]):
            Optional. The labels with user-defined
            metadata for the request.
            Label keys and values can be no longer than 63
            characters (Unicode codepoints), can only
            contain lowercase letters, numeric characters,
            underscores and dashes. International characters
            are allowed. Label values are optional. Label
            keys must start with a letter.

            See
            https://cloud.google.com/translate/docs/advanced/labels
            for more information.
        customized_attribution (str):
            Optional. This flag is to support user customized
            attribution. If not provided, the default is
            ``Machine Translated by Google``. Customized attribution
            should follow rules in
            https://cloud.google.com/translate/attribution#attribution_and_logos
        is_translate_native_pdf_only (bool):
            Optional. is_translate_native_pdf_only field for external
            customers. If true, the page limit of online native pdf
            translation is 300 and only native pdf pages will be
            translated.
        enable_shadow_removal_native_pdf (bool):
            Optional. If true, use the text removal server to remove the
            shadow text on background image for native pdf translation.
            Shadow removal feature can only be enabled when
            is_translate_native_pdf_only: false && pdf_native_only:
            false
        enable_rotation_correction (bool):
            Optional. If true, enable auto rotation
            correction in DVS.
    """

    parent: str = proto.Field(
        proto.STRING,
        number=1,
    )
    source_language_code: str = proto.Field(
        proto.STRING,
        number=2,
    )
    target_language_code: str = proto.Field(
        proto.STRING,
        number=3,
    )
    document_input_config: "DocumentInputConfig" = proto.Field(
        proto.MESSAGE,
        number=4,
        message="DocumentInputConfig",
    )
    document_output_config: "DocumentOutputConfig" = proto.Field(
        proto.MESSAGE,
        number=5,
        message="DocumentOutputConfig",
    )
    model: str = proto.Field(
        proto.STRING,
        number=6,
    )
    glossary_config: "TranslateTextGlossaryConfig" = proto.Field(
        proto.MESSAGE,
        number=7,
        message="TranslateTextGlossaryConfig",
    )
    labels: MutableMapping[str, str] = proto.MapField(
        proto.STRING,
        proto.STRING,
        number=8,
    )
    customized_attribution: str = proto.Field(
        proto.STRING,
        number=10,
    )
    is_translate_native_pdf_only: bool = proto.Field(
        proto.BOOL,
        number=11,
    )
    enable_shadow_removal_native_pdf: bool = proto.Field(
        proto.BOOL,
        number=12,
    )
    enable_rotation_correction: bool = proto.Field(
        proto.BOOL,
        number=13,
    )


class DocumentTranslation(proto.Message):
    r"""A translated document message.

    Attributes:
        byte_stream_outputs (MutableSequence[bytes]):
            The array of translated documents. It is
            expected to be size 1 for now. We may produce
            multiple translated documents in the future for
            other type of file formats.
        mime_type (str):
            The translated document's mime type.
        detected_language_code (str):
            The detected language for the input document.
            If the user did not provide the source language
            for the input document, this field will have the
            language code automatically detected. If the
            source language was passed, auto-detection of
            the language does not occur and this field is
            empty.
    """

    byte_stream_outputs: MutableSequence[bytes] = proto.RepeatedField(
        proto.BYTES,
        number=1,
    )
    mime_type: str = proto.Field(
        proto.STRING,
        number=2,
    )
    detected_language_code: str = proto.Field(
        proto.STRING,
        number=3,
    )


class TranslateDocumentResponse(proto.Message):
    r"""A translated document response message.

    Attributes:
        document_translation (google.cloud.translate_v3beta1.types.DocumentTranslation):
            Translated document.
        glossary_document_translation (google.cloud.translate_v3beta1.types.DocumentTranslation):
            The document's translation output if a glossary is provided
            in the request. This can be the same as
            [TranslateDocumentResponse.document_translation] if no
            glossary terms apply.
        model (str):
            Only present when 'model' is present in the request. 'model'
            is normalized to have a project number.

            For example: If the 'model' field in
            TranslateDocumentRequest is:
            ``projects/{project-id}/locations/{location-id}/models/general/nmt``
            then ``model`` here would be normalized to
            ``projects/{project-number}/locations/{location-id}/models/general/nmt``.
        glossary_config (google.cloud.translate_v3beta1.types.TranslateTextGlossaryConfig):
            The ``glossary_config`` used for this translation.
    """

    document_translation: "DocumentTranslation" = proto.Field(
        proto.MESSAGE,
        number=1,
        message="DocumentTranslation",
    )
    glossary_document_translation: "DocumentTranslation" = proto.Field(
        proto.MESSAGE,
        number=2,
        message="DocumentTranslation",
    )
    model: str = proto.Field(
        proto.STRING,
        number=3,
    )
    glossary_config: "TranslateTextGlossaryConfig" = proto.Field(
        proto.MESSAGE,
        number=4,
        message="TranslateTextGlossaryConfig",
    )


class BatchTranslateTextRequest(proto.Message):
    r"""The batch translation request.

    Attributes:
        parent (str):
            Required. Location to make a call. Must refer to a caller's
            project.

            Format:
            ``projects/{project-number-or-id}/locations/{location-id}``.

            The ``global`` location is not supported for batch
            translation.

            Only AutoML Translation models or glossaries within the same
            region (have the same location-id) can be used, otherwise an
            INVALID_ARGUMENT (400) error is returned.
        source_language_code (str):
            Required. Source language code. Supported language codes are
            listed in `Language
            Support <https://cloud.google.com/translate/docs/languages>`__.
        target_language_codes (MutableSequence[str]):
            Required. Specify up to 10 language codes here. Supported
            language codes are listed in `Language
            Support <https://cloud.google.com/translate/docs/languages>`__.
        models (MutableMapping[str, str]):
            Optional. The models to use for translation. Map's key is
            target language code. Map's value is model name. Value can
            be a built-in general model, or an AutoML Translation model.

            The value format depends on model type:

            -  AutoML Translation models:
               ``projects/{project-number-or-id}/locations/{location-id}/models/{model-id}``

            -  General (built-in) models:
               ``projects/{project-number-or-id}/locations/{location-id}/models/general/nmt``,

            If the map is empty or a specific model is not requested for
            a language pair, then default google model (nmt) is used.
        input_configs (MutableSequence[google.cloud.translate_v3beta1.types.InputConfig]):
            Required. Input configurations.
            The total number of files matched should be <=
            100. The total content size should be <= 100M
            Unicode codepoints. The files must use UTF-8
            encoding.
        output_config (google.cloud.translate_v3beta1.types.OutputConfig):
            Required. Output configuration.
            If 2 input configs match to the same file (that
            is, same input path), we don't generate output
            for duplicate inputs.
        glossaries (MutableMapping[str, google.cloud.translate_v3beta1.types.TranslateTextGlossaryConfig]):
            Optional. Glossaries to be applied for
            translation. It's keyed by target language code.
        labels (MutableMapping[str, str]):
            Optional. The labels with user-defined
            metadata for the request.
            Label keys and values can be no longer than 63
            characters (Unicode codepoints), can only
            contain lowercase letters, numeric characters,
            underscores and dashes. International characters
            are allowed. Label values are optional. Label
            keys must start with a letter.

            See
            https://cloud.google.com/translate/docs/labels
            for more information.
    """

    parent: str = proto.Field(
        proto.STRING,
        number=1,
    )
    source_language_code: str = proto.Field(
        proto.STRING,
        number=2,
    )
    target_language_codes: MutableSequence[str] = proto.RepeatedField(
        proto.STRING,
        number=3,
    )
    models: MutableMapping[str, str] = proto.MapField(
        proto.STRING,
        proto.STRING,
        number=4,
    )
    input_configs: MutableSequence["InputConfig"] = proto.RepeatedField(
        proto.MESSAGE,
        number=5,
        message="InputConfig",
    )
    output_config: "OutputConfig" = proto.Field(
        proto.MESSAGE,
        number=6,
        message="OutputConfig",
    )
    glossaries: MutableMapping[str, "TranslateTextGlossaryConfig"] = proto.MapField(
        proto.STRING,
        proto.MESSAGE,
        number=7,
        message="TranslateTextGlossaryConfig",
    )
    labels: MutableMapping[str, str] = proto.MapField(
        proto.STRING,
        proto.STRING,
        number=9,
    )


class BatchTranslateMetadata(proto.Message):
    r"""State metadata for the batch translation operation.

    Attributes:
        state (google.cloud.translate_v3beta1.types.BatchTranslateMetadata.State):
            The state of the operation.
        translated_characters (int):
            Number of successfully translated characters
            so far (Unicode codepoints).
        failed_characters (int):
            Number of characters that have failed to
            process so far (Unicode codepoints).
        total_characters (int):
            Total number of characters (Unicode
            codepoints). This is the total number of
            codepoints from input files times the number of
            target languages and appears here shortly after
            the call is submitted.
        submit_time (google.protobuf.timestamp_pb2.Timestamp):
            Time when the operation was submitted.
    """

    class State(proto.Enum):
        r"""State of the job.

        Values:
            STATE_UNSPECIFIED (0):
                Invalid.
            RUNNING (1):
                Request is being processed.
            SUCCEEDED (2):
                The batch is processed, and at least one item
                was successfully processed.
            FAILED (3):
                The batch is done and no item was
                successfully processed.
            CANCELLING (4):
                Request is in the process of being canceled
                after caller invoked
                longrunning.Operations.CancelOperation on the
                request id.
            CANCELLED (5):
                The batch is done after the user has called
                the longrunning.Operations.CancelOperation. Any
                records processed before the cancel command are
                output as specified in the request.
        """
        STATE_UNSPECIFIED = 0
        RUNNING = 1
        SUCCEEDED = 2
        FAILED = 3
        CANCELLING = 4
        CANCELLED = 5

    state: State = proto.Field(
        proto.ENUM,
        number=1,
        enum=State,
    )
    translated_characters: int = proto.Field(
        proto.INT64,
        number=2,
    )
    failed_characters: int = proto.Field(
        proto.INT64,
        number=3,
    )
    total_characters: int = proto.Field(
        proto.INT64,
        number=4,
    )
    submit_time: timestamp_pb2.Timestamp = proto.Field(
        proto.MESSAGE,
        number=5,
        message=timestamp_pb2.Timestamp,
    )


class BatchTranslateResponse(proto.Message):
    r"""Stored in the
    [google.longrunning.Operation.response][google.longrunning.Operation.response]
    field returned by BatchTranslateText if at least one sentence is
    translated successfully.

    Attributes:
        total_characters (int):
            Total number of characters (Unicode
            codepoints).
        translated_characters (int):
            Number of successfully translated characters
            (Unicode codepoints).
        failed_characters (int):
            Number of characters that have failed to
            process (Unicode codepoints).
        submit_time (google.protobuf.timestamp_pb2.Timestamp):
            Time when the operation was submitted.
        end_time (google.protobuf.timestamp_pb2.Timestamp):
            The time when the operation is finished and
            [google.longrunning.Operation.done][google.longrunning.Operation.done]
            is set to true.
    """

    total_characters: int = proto.Field(
        proto.INT64,
        number=1,
    )
    translated_characters: int = proto.Field(
        proto.INT64,
        number=2,
    )
    failed_characters: int = proto.Field(
        proto.INT64,
        number=3,
    )
    submit_time: timestamp_pb2.Timestamp = proto.Field(
        proto.MESSAGE,
        number=4,
        message=timestamp_pb2.Timestamp,
    )
    end_time: timestamp_pb2.Timestamp = proto.Field(
        proto.MESSAGE,
        number=5,
        message=timestamp_pb2.Timestamp,
    )


class GlossaryInputConfig(proto.Message):
    r"""Input configuration for glossaries.

    .. _oneof: https://proto-plus-python.readthedocs.io/en/stable/fields.html#oneofs-mutually-exclusive-fields

    Attributes:
        gcs_source (google.cloud.translate_v3beta1.types.GcsSource):
            Required. Google Cloud Storage location of glossary data.
            File format is determined based on the filename extension.
            API returns [google.rpc.Code.INVALID_ARGUMENT] for
            unsupported URI-s and file formats. Wildcards are not
            allowed. This must be a single file in one of the following
            formats:

            For unidirectional glossaries:

            -  TSV/CSV (``.tsv``/``.csv``): 2 column file, tab- or
               comma-separated. The first column is source text. The
               second column is target text. The file must not contain
               headers. That is, the first row is data, not column
               names.

            -  TMX (``.tmx``): TMX file with parallel data defining
               source/target term pairs.

            For equivalent term sets glossaries:

            -  CSV (``.csv``): Multi-column CSV file defining equivalent
               glossary terms in multiple languages. See documentation
               for more information -
               `glossaries <https://cloud.google.com/translate/docs/advanced/glossary>`__.

            This field is a member of `oneof`_ ``source``.
    """

    gcs_source: "GcsSource" = proto.Field(
        proto.MESSAGE,
        number=1,
        oneof="source",
        message="GcsSource",
    )


class Glossary(proto.Message):
    r"""Represents a glossary built from user provided data.

    This message has `oneof`_ fields (mutually exclusive fields).
    For each oneof, at most one member field can be set at the same time.
    Setting any member of the oneof automatically clears all other
    members.

    .. _oneof: https://proto-plus-python.readthedocs.io/en/stable/fields.html#oneofs-mutually-exclusive-fields

    Attributes:
        name (str):
            Required. The resource name of the glossary. Glossary names
            have the form
            ``projects/{project-number-or-id}/locations/{location-id}/glossaries/{glossary-id}``.
        language_pair (google.cloud.translate_v3beta1.types.Glossary.LanguageCodePair):
            Used with unidirectional glossaries.

            This field is a member of `oneof`_ ``languages``.
        language_codes_set (google.cloud.translate_v3beta1.types.Glossary.LanguageCodesSet):
            Used with equivalent term set glossaries.

            This field is a member of `oneof`_ ``languages``.
        input_config (google.cloud.translate_v3beta1.types.GlossaryInputConfig):
            Required. Provides examples to build the
            glossary from. Total glossary must not exceed
            10M Unicode codepoints.
        entry_count (int):
            Output only. The number of entries defined in
            the glossary.
        submit_time (google.protobuf.timestamp_pb2.Timestamp):
            Output only. When CreateGlossary was called.
        end_time (google.protobuf.timestamp_pb2.Timestamp):
            Output only. When the glossary creation was
            finished.
    """

    class LanguageCodePair(proto.Message):
        r"""Used with unidirectional glossaries.

        Attributes:
            source_language_code (str):
                Required. The BCP-47 language code of the input text, for
                example, "en-US". Expected to be an exact match for
                GlossaryTerm.language_code.
            target_language_code (str):
                Required. The BCP-47 language code for translation output,
                for example, "zh-CN". Expected to be an exact match for
                GlossaryTerm.language_code.
        """

        source_language_code: str = proto.Field(
            proto.STRING,
            number=1,
        )
        target_language_code: str = proto.Field(
            proto.STRING,
            number=2,
        )

    class LanguageCodesSet(proto.Message):
        r"""Used with equivalent term set glossaries.

        Attributes:
            language_codes (MutableSequence[str]):
                The BCP-47 language code(s) for terms defined in the
                glossary. All entries are unique. The list contains at least
                two entries. Expected to be an exact match for
                GlossaryTerm.language_code.
        """

        language_codes: MutableSequence[str] = proto.RepeatedField(
            proto.STRING,
            number=1,
        )

    name: str = proto.Field(
        proto.STRING,
        number=1,
    )
    language_pair: LanguageCodePair = proto.Field(
        proto.MESSAGE,
        number=3,
        oneof="languages",
        message=LanguageCodePair,
    )
    language_codes_set: LanguageCodesSet = proto.Field(
        proto.MESSAGE,
        number=4,
        oneof="languages",
        message=LanguageCodesSet,
    )
    input_config: "GlossaryInputConfig" = proto.Field(
        proto.MESSAGE,
        number=5,
        message="GlossaryInputConfig",
    )
    entry_count: int = proto.Field(
        proto.INT32,
        number=6,
    )
    submit_time: timestamp_pb2.Timestamp = proto.Field(
        proto.MESSAGE,
        number=7,
        message=timestamp_pb2.Timestamp,
    )
    end_time: timestamp_pb2.Timestamp = proto.Field(
        proto.MESSAGE,
        number=8,
        message=timestamp_pb2.Timestamp,
    )


class CreateGlossaryRequest(proto.Message):
    r"""Request message for CreateGlossary.

    Attributes:
        parent (str):
            Required. The project name.
        glossary (google.cloud.translate_v3beta1.types.Glossary):
            Required. The glossary to create.
    """

    parent: str = proto.Field(
        proto.STRING,
        number=1,
    )
    glossary: "Glossary" = proto.Field(
        proto.MESSAGE,
        number=2,
        message="Glossary",
    )


class GetGlossaryRequest(proto.Message):
    r"""Request message for GetGlossary.

    Attributes:
        name (str):
            Required. The name of the glossary to
            retrieve.
    """

    name: str = proto.Field(
        proto.STRING,
        number=1,
    )


class DeleteGlossaryRequest(proto.Message):
    r"""Request message for DeleteGlossary.

    Attributes:
        name (str):
            Required. The name of the glossary to delete.
    """

    name: str = proto.Field(
        proto.STRING,
        number=1,
    )


class ListGlossariesRequest(proto.Message):
    r"""Request message for ListGlossaries.

    Attributes:
        parent (str):
            Required. The name of the project from which
            to list all of the glossaries.
        page_size (int):
            Optional. Requested page size. The server may
            return fewer glossaries than requested. If
            unspecified, the server picks an appropriate
            default.
        page_token (str):
            Optional. A token identifying a page of results the server
            should return. Typically, this is the value of
            [ListGlossariesResponse.next_page_token] returned from the
            previous call to ``ListGlossaries`` method. The first page
            is returned if ``page_token``\ is empty or missing.
        filter (str):
            Optional. Filter specifying constraints of a
            list operation. Specify the constraint by the
            format of "key=value", where key must be "src"
            or "tgt", and the value must be a valid language
            code. For multiple restrictions, concatenate
            them by "AND" (uppercase only), such as:
            "src=en-US AND tgt=zh-CN". Notice that the exact
            match is used here, which means using 'en-US'
            and 'en' can lead to different results, which
            depends on the language code you used when you
            create the glossary. For the unidirectional
            glossaries, the "src" and "tgt" add restrictions
            on the source and target language code
            separately. For the equivalent term set
            glossaries, the "src" and/or "tgt" add
            restrictions on the term set.
            For example: "src=en-US AND tgt=zh-CN" will only
            pick the unidirectional glossaries which exactly
            match the source language code as "en-US" and
            the target language code "zh-CN", but all
            equivalent term set glossaries which contain
            "en-US" and "zh-CN" in their language set will
            be picked. If missing, no filtering is
            performed.
    """

    parent: str = proto.Field(
        proto.STRING,
        number=1,
    )
    page_size: int = proto.Field(
        proto.INT32,
        number=2,
    )
    page_token: str = proto.Field(
        proto.STRING,
        number=3,
    )
    filter: str = proto.Field(
        proto.STRING,
        number=4,
    )


class ListGlossariesResponse(proto.Message):
    r"""Response message for ListGlossaries.

    Attributes:
        glossaries (MutableSequence[google.cloud.translate_v3beta1.types.Glossary]):
            The list of glossaries for a project.
        next_page_token (str):
            A token to retrieve a page of results. Pass this value in
            the [ListGlossariesRequest.page_token] field in the
            subsequent call to ``ListGlossaries`` method to retrieve the
            next page of results.
    """

    @property
    def raw_page(self):
        return self

    glossaries: MutableSequence["Glossary"] = proto.RepeatedField(
        proto.MESSAGE,
        number=1,
        message="Glossary",
    )
    next_page_token: str = proto.Field(
        proto.STRING,
        number=2,
    )


class CreateGlossaryMetadata(proto.Message):
    r"""Stored in the
    [google.longrunning.Operation.metadata][google.longrunning.Operation.metadata]
    field returned by CreateGlossary.

    Attributes:
        name (str):
            The name of the glossary that is being
            created.
        state (google.cloud.translate_v3beta1.types.CreateGlossaryMetadata.State):
            The current state of the glossary creation
            operation.
        submit_time (google.protobuf.timestamp_pb2.Timestamp):
            The time when the operation was submitted to
            the server.
    """

    class State(proto.Enum):
        r"""Enumerates the possible states that the creation request can
        be in.

        Values:
            STATE_UNSPECIFIED (0):
                Invalid.
            RUNNING (1):
                Request is being processed.
            SUCCEEDED (2):
                The glossary was successfully created.
            FAILED (3):
                Failed to create the glossary.
            CANCELLING (4):
                Request is in the process of being canceled
                after caller invoked
                longrunning.Operations.CancelOperation on the
                request id.
            CANCELLED (5):
                The glossary creation request was
                successfully canceled.
        """
        STATE_UNSPECIFIED = 0
        RUNNING = 1
        SUCCEEDED = 2
        FAILED = 3
        CANCELLING = 4
        CANCELLED = 5

    name: str = proto.Field(
        proto.STRING,
        number=1,
    )
    state: State = proto.Field(
        proto.ENUM,
        number=2,
        enum=State,
    )
    submit_time: timestamp_pb2.Timestamp = proto.Field(
        proto.MESSAGE,
        number=3,
        message=timestamp_pb2.Timestamp,
    )


class DeleteGlossaryMetadata(proto.Message):
    r"""Stored in the
    [google.longrunning.Operation.metadata][google.longrunning.Operation.metadata]
    field returned by DeleteGlossary.

    Attributes:
        name (str):
            The name of the glossary that is being
            deleted.
        state (google.cloud.translate_v3beta1.types.DeleteGlossaryMetadata.State):
            The current state of the glossary deletion
            operation.
        submit_time (google.protobuf.timestamp_pb2.Timestamp):
            The time when the operation was submitted to
            the server.
    """

    class State(proto.Enum):
        r"""Enumerates the possible states that the creation request can
        be in.

        Values:
            STATE_UNSPECIFIED (0):
                Invalid.
            RUNNING (1):
                Request is being processed.
            SUCCEEDED (2):
                The glossary was successfully deleted.
            FAILED (3):
                Failed to delete the glossary.
            CANCELLING (4):
                Request is in the process of being canceled
                after caller invoked
                longrunning.Operations.CancelOperation on the
                request id.
            CANCELLED (5):
                The glossary deletion request was
                successfully canceled.
        """
        STATE_UNSPECIFIED = 0
        RUNNING = 1
        SUCCEEDED = 2
        FAILED = 3
        CANCELLING = 4
        CANCELLED = 5

    name: str = proto.Field(
        proto.STRING,
        number=1,
    )
    state: State = proto.Field(
        proto.ENUM,
        number=2,
        enum=State,
    )
    submit_time: timestamp_pb2.Timestamp = proto.Field(
        proto.MESSAGE,
        number=3,
        message=timestamp_pb2.Timestamp,
    )


class DeleteGlossaryResponse(proto.Message):
    r"""Stored in the
    [google.longrunning.Operation.response][google.longrunning.Operation.response]
    field returned by DeleteGlossary.

    Attributes:
        name (str):
            The name of the deleted glossary.
        submit_time (google.protobuf.timestamp_pb2.Timestamp):
            The time when the operation was submitted to
            the server.
        end_time (google.protobuf.timestamp_pb2.Timestamp):
            The time when the glossary deletion is finished and
            [google.longrunning.Operation.done][google.longrunning.Operation.done]
            is set to true.
    """

    name: str = proto.Field(
        proto.STRING,
        number=1,
    )
    submit_time: timestamp_pb2.Timestamp = proto.Field(
        proto.MESSAGE,
        number=2,
        message=timestamp_pb2.Timestamp,
    )
    end_time: timestamp_pb2.Timestamp = proto.Field(
        proto.MESSAGE,
        number=3,
        message=timestamp_pb2.Timestamp,
    )


class BatchTranslateDocumentRequest(proto.Message):
    r"""The BatchTranslateDocument request.

    Attributes:
        parent (str):
            Required. Location to make a regional call.

            Format:
            ``projects/{project-number-or-id}/locations/{location-id}``.

            The ``global`` location is not supported for batch
            translation.

            Only AutoML Translation models or glossaries within the same
            region (have the same location-id) can be used, otherwise an
            INVALID_ARGUMENT (400) error is returned.
        source_language_code (str):
            Required. The BCP-47 language code of the input document if
            known, for example, "en-US" or "sr-Latn". Supported language
            codes are listed in `Language
            Support <https://cloud.google.com/translate/docs/languages>`__.
        target_language_codes (MutableSequence[str]):
            Required. The BCP-47 language code to use for translation of
            the input document. Specify up to 10 language codes here.
            Supported language codes are listed in `Language
            Support <https://cloud.google.com/translate/docs/languages>`__.
        input_configs (MutableSequence[google.cloud.translate_v3beta1.types.BatchDocumentInputConfig]):
            Required. Input configurations.
            The total number of files matched should be <=
            100. The total content size to translate should
            be <= 100M Unicode codepoints. The files must
            use UTF-8 encoding.
        output_config (google.cloud.translate_v3beta1.types.BatchDocumentOutputConfig):
            Required. Output configuration.
            If 2 input configs match to the same file (that
            is, same input path), we don't generate output
            for duplicate inputs.
        models (MutableMapping[str, str]):
            Optional. The models to use for translation. Map's key is
            target language code. Map's value is the model name. Value
            can be a built-in general model, or an AutoML Translation
            model.

            The value format depends on model type:

            -  AutoML Translation models:
               ``projects/{project-number-or-id}/locations/{location-id}/models/{model-id}``

            -  General (built-in) models:
               ``projects/{project-number-or-id}/locations/{location-id}/models/general/nmt``,

            If the map is empty or a specific model is not requested for
            a language pair, then default google model (nmt) is used.
        glossaries (MutableMapping[str, google.cloud.translate_v3beta1.types.TranslateTextGlossaryConfig]):
            Optional. Glossaries to be applied. It's
            keyed by target language code.
        format_conversions (MutableMapping[str, str]):
            Optional. File format conversion map to be applied to all
            input files. Map's key is the original mime_type. Map's
            value is the target mime_type of translated documents.

            Supported file format conversion includes:

            -  ``application/pdf`` to
               ``application/vnd.openxmlformats-officedocument.wordprocessingml.document``

            If nothing specified, output files will be in the same
            format as the original file.
        customized_attribution (str):
            Optional. This flag is to support user customized
            attribution. If not provided, the default is
            ``Machine Translated by Google``. Customized attribution
            should follow rules in
            https://cloud.google.com/translate/attribution#attribution_and_logos
        enable_shadow_removal_native_pdf (bool):
            Optional. If true, use the text removal server to remove the
            shadow text on background image for native pdf translation.
            Shadow removal feature can only be enabled when
            is_translate_native_pdf_only: false && pdf_native_only:
            false
        enable_rotation_correction (bool):
            Optional. If true, enable auto rotation
            correction in DVS.
    """

    parent: str = proto.Field(
        proto.STRING,
        number=1,
    )
    source_language_code: str = proto.Field(
        proto.STRING,
        number=2,
    )
    target_language_codes: MutableSequence[str] = proto.RepeatedField(
        proto.STRING,
        number=3,
    )
    input_configs: MutableSequence["BatchDocumentInputConfig"] = proto.RepeatedField(
        proto.MESSAGE,
        number=4,
        message="BatchDocumentInputConfig",
    )
    output_config: "BatchDocumentOutputConfig" = proto.Field(
        proto.MESSAGE,
        number=5,
        message="BatchDocumentOutputConfig",
    )
    models: MutableMapping[str, str] = proto.MapField(
        proto.STRING,
        proto.STRING,
        number=6,
    )
    glossaries: MutableMapping[str, "TranslateTextGlossaryConfig"] = proto.MapField(
        proto.STRING,
        proto.MESSAGE,
        number=7,
        message="TranslateTextGlossaryConfig",
    )
    format_conversions: MutableMapping[str, str] = proto.MapField(
        proto.STRING,
        proto.STRING,
        number=8,
    )
    customized_attribution: str = proto.Field(
        proto.STRING,
        number=10,
    )
    enable_shadow_removal_native_pdf: bool = proto.Field(
        proto.BOOL,
        number=11,
    )
    enable_rotation_correction: bool = proto.Field(
        proto.BOOL,
        number=12,
    )


class BatchDocumentInputConfig(proto.Message):
    r"""Input configuration for BatchTranslateDocument request.

    .. _oneof: https://proto-plus-python.readthedocs.io/en/stable/fields.html#oneofs-mutually-exclusive-fields

    Attributes:
        gcs_source (google.cloud.translate_v3beta1.types.GcsSource):
            Google Cloud Storage location for the source input. This can
            be a single file (for example,
            ``gs://translation-test/input.docx``) or a wildcard (for
            example, ``gs://translation-test/*``).

            File mime type is determined based on extension. Supported
            mime type includes:

            -  ``pdf``, application/pdf
            -  ``docx``,
               application/vnd.openxmlformats-officedocument.wordprocessingml.document
            -  ``pptx``,
               application/vnd.openxmlformats-officedocument.presentationml.presentation
            -  ``xlsx``,
               application/vnd.openxmlformats-officedocument.spreadsheetml.sheet

            The max file size to support for ``.docx``, ``.pptx`` and
            ``.xlsx`` is 100MB. The max file size to support for
            ``.pdf`` is 1GB and the max page limit is 1000 pages. The
            max file size to support for all input documents is 1GB.

            This field is a member of `oneof`_ ``source``.
    """

    gcs_source: "GcsSource" = proto.Field(
        proto.MESSAGE,
        number=1,
        oneof="source",
        message="GcsSource",
    )


class BatchDocumentOutputConfig(proto.Message):
    r"""Output configuration for BatchTranslateDocument request.

    .. _oneof: https://proto-plus-python.readthedocs.io/en/stable/fields.html#oneofs-mutually-exclusive-fields

    Attributes:
        gcs_destination (google.cloud.translate_v3beta1.types.GcsDestination):
            Google Cloud Storage destination for output content. For
            every single input document (for example,
            gs://a/b/c.[extension]), we generate at most 2 \* n output
            files. (n is the # of target_language_codes in the
            BatchTranslateDocumentRequest).

            While the input documents are being processed, we
            write/update an index file ``index.csv`` under
            ``gcs_destination.output_uri_prefix`` (for example,
            gs://translation_output/index.csv) The index file is
            generated/updated as new files are being translated. The
            format is:

            input_document,target_language_code,translation_output,error_output,
            glossary_translation_output,glossary_error_output

            ``input_document`` is one file we matched using
            gcs_source.input_uri. ``target_language_code`` is provided
            in the request. ``translation_output`` contains the
            translations. (details provided below) ``error_output``
            contains the error message during processing of the file.
            Both translations_file and errors_file could be empty
            strings if we have no content to output.
            ``glossary_translation_output`` and
            ``glossary_error_output`` are the translated output/error
            when we apply glossaries. They could also be empty if we
            have no content to output.

            Once a row is present in index.csv, the input/output
            matching never changes. Callers should also expect all the
            content in input_file are processed and ready to be consumed
            (that is, no partial output file is written).

            Since index.csv will be keeping updated during the process,
            please make sure there is no custom retention policy applied
            on the output bucket that may avoid file updating.
            (https://cloud.google.com/storage/docs/bucket-lock#retention-policy)

            The naming format of translation output files follows (for
            target language code [trg]): ``translation_output``:
            ``gs://translation_output/a_b_c_[trg]_translation.[extension]``
            ``glossary_translation_output``:
            ``gs://translation_test/a_b_c_[trg]_glossary_translation.[extension]``.
            The output document will maintain the same file format as
            the input document.

            The naming format of error output files follows (for target
            language code [trg]): ``error_output``:
            ``gs://translation_test/a_b_c_[trg]_errors.txt``
            ``glossary_error_output``:
            ``gs://translation_test/a_b_c_[trg]_glossary_translation.txt``
            The error output is a txt file containing error details.

            This field is a member of `oneof`_ ``destination``.
    """

    gcs_destination: "GcsDestination" = proto.Field(
        proto.MESSAGE,
        number=1,
        oneof="destination",
        message="GcsDestination",
    )


class BatchTranslateDocumentResponse(proto.Message):
    r"""Stored in the
    [google.longrunning.Operation.response][google.longrunning.Operation.response]
    field returned by BatchTranslateDocument if at least one document is
    translated successfully.

    Attributes:
        total_pages (int):
            Total number of pages to translate in all
            documents. Documents without clear page
            definition (such as XLSX) are not counted.
        translated_pages (int):
            Number of successfully translated pages in
            all documents. Documents without clear page
            definition (such as XLSX) are not counted.
        failed_pages (int):
            Number of pages that failed to process in all
            documents. Documents without clear page
            definition (such as XLSX) are not counted.
        total_billable_pages (int):
            Number of billable pages in documents with
            clear page definition (such as PDF, DOCX, PPTX)
        total_characters (int):
            Total number of characters (Unicode
            codepoints) in all documents.
        translated_characters (int):
            Number of successfully translated characters
            (Unicode codepoints) in all documents.
        failed_characters (int):
            Number of characters that have failed to
            process (Unicode codepoints) in all documents.
        total_billable_characters (int):
            Number of billable characters (Unicode
            codepoints) in documents without clear page
            definition, such as XLSX.
        submit_time (google.protobuf.timestamp_pb2.Timestamp):
            Time when the operation was submitted.
        end_time (google.protobuf.timestamp_pb2.Timestamp):
            The time when the operation is finished and
            [google.longrunning.Operation.done][google.longrunning.Operation.done]
            is set to true.
    """

    total_pages: int = proto.Field(
        proto.INT64,
        number=1,
    )
    translated_pages: int = proto.Field(
        proto.INT64,
        number=2,
    )
    failed_pages: int = proto.Field(
        proto.INT64,
        number=3,
    )
    total_billable_pages: int = proto.Field(
        proto.INT64,
        number=4,
    )
    total_characters: int = proto.Field(
        proto.INT64,
        number=5,
    )
    translated_characters: int = proto.Field(
        proto.INT64,
        number=6,
    )
    failed_characters: int = proto.Field(
        proto.INT64,
        number=7,
    )
    total_billable_characters: int = proto.Field(
        proto.INT64,
        number=8,
    )
    submit_time: timestamp_pb2.Timestamp = proto.Field(
        proto.MESSAGE,
        number=9,
        message=timestamp_pb2.Timestamp,
    )
    end_time: timestamp_pb2.Timestamp = proto.Field(
        proto.MESSAGE,
        number=10,
        message=timestamp_pb2.Timestamp,
    )


class BatchTranslateDocumentMetadata(proto.Message):
    r"""State metadata for the batch translation operation.

    Attributes:
        state (google.cloud.translate_v3beta1.types.BatchTranslateDocumentMetadata.State):
            The state of the operation.
        total_pages (int):
            Total number of pages to translate in all
            documents so far. Documents without clear page
            definition (such as XLSX) are not counted.
        translated_pages (int):
            Number of successfully translated pages in
            all documents so far. Documents without clear
            page definition (such as XLSX) are not counted.
        failed_pages (int):
            Number of pages that failed to process in all
            documents so far. Documents without clear page
            definition (such as XLSX) are not counted.
        total_billable_pages (int):
            Number of billable pages in documents with
            clear page definition (such as PDF, DOCX, PPTX)
            so far.
        total_characters (int):
            Total number of characters (Unicode
            codepoints) in all documents so far.
        translated_characters (int):
            Number of successfully translated characters
            (Unicode codepoints) in all documents so far.
        failed_characters (int):
            Number of characters that have failed to
            process (Unicode codepoints) in all documents so
            far.
        total_billable_characters (int):
            Number of billable characters (Unicode
            codepoints) in documents without clear page
            definition (such as XLSX) so far.
        submit_time (google.protobuf.timestamp_pb2.Timestamp):
            Time when the operation was submitted.
    """

    class State(proto.Enum):
        r"""State of the job.

        Values:
            STATE_UNSPECIFIED (0):
                Invalid.
            RUNNING (1):
                Request is being processed.
            SUCCEEDED (2):
                The batch is processed, and at least one item
                was successfully processed.
            FAILED (3):
                The batch is done and no item was
                successfully processed.
            CANCELLING (4):
                Request is in the process of being canceled
                after caller invoked
                longrunning.Operations.CancelOperation on the
                request id.
            CANCELLED (5):
                The batch is done after the user has called
                the longrunning.Operations.CancelOperation. Any
                records processed before the cancel command are
                output as specified in the request.
        """
        STATE_UNSPECIFIED = 0
        RUNNING = 1
        SUCCEEDED = 2
        FAILED = 3
        CANCELLING = 4
        CANCELLED = 5

    state: State = proto.Field(
        proto.ENUM,
        number=1,
        enum=State,
    )
    total_pages: int = proto.Field(
        proto.INT64,
        number=2,
    )
    translated_pages: int = proto.Field(
        proto.INT64,
        number=3,
    )
    failed_pages: int = proto.Field(
        proto.INT64,
        number=4,
    )
    total_billable_pages: int = proto.Field(
        proto.INT64,
        number=5,
    )
    total_characters: int = proto.Field(
        proto.INT64,
        number=6,
    )
    translated_characters: int = proto.Field(
        proto.INT64,
        number=7,
    )
    failed_characters: int = proto.Field(
        proto.INT64,
        number=8,
    )
    total_billable_characters: int = proto.Field(
        proto.INT64,
        number=9,
    )
    submit_time: timestamp_pb2.Timestamp = proto.Field(
        proto.MESSAGE,
        number=10,
        message=timestamp_pb2.Timestamp,
    )


__all__ = tuple(sorted(__protobuf__.manifest))
