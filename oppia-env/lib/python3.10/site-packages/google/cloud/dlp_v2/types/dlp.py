# -*- coding: utf-8 -*-
# Copyright 2022 Google LLC
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
from google.protobuf import duration_pb2  # type: ignore
from google.protobuf import empty_pb2  # type: ignore
from google.protobuf import field_mask_pb2  # type: ignore
from google.protobuf import timestamp_pb2  # type: ignore
from google.rpc import status_pb2  # type: ignore
from google.type import date_pb2  # type: ignore
from google.type import dayofweek_pb2  # type: ignore
from google.type import timeofday_pb2  # type: ignore
import proto  # type: ignore

from google.cloud.dlp_v2.types import storage

__protobuf__ = proto.module(
    package="google.privacy.dlp.v2",
    manifest={
        "TransformationResultStatusType",
        "TransformationContainerType",
        "TransformationType",
        "RelationalOperator",
        "MatchingType",
        "ContentOption",
        "MetadataType",
        "InfoTypeSupportedBy",
        "DlpJobType",
        "StoredInfoTypeState",
        "ResourceVisibility",
        "EncryptionStatus",
        "ExcludeInfoTypes",
        "ExclusionRule",
        "InspectionRule",
        "InspectionRuleSet",
        "InspectConfig",
        "ByteContentItem",
        "ContentItem",
        "Table",
        "InspectResult",
        "Finding",
        "Location",
        "ContentLocation",
        "MetadataLocation",
        "StorageMetadataLabel",
        "DocumentLocation",
        "RecordLocation",
        "TableLocation",
        "Container",
        "Range",
        "ImageLocation",
        "BoundingBox",
        "RedactImageRequest",
        "Color",
        "RedactImageResponse",
        "DeidentifyContentRequest",
        "DeidentifyContentResponse",
        "ReidentifyContentRequest",
        "ReidentifyContentResponse",
        "InspectContentRequest",
        "InspectContentResponse",
        "OutputStorageConfig",
        "InfoTypeStats",
        "InspectDataSourceDetails",
        "HybridInspectStatistics",
        "InfoTypeDescription",
        "InfoTypeCategory",
        "VersionDescription",
        "ListInfoTypesRequest",
        "ListInfoTypesResponse",
        "RiskAnalysisJobConfig",
        "QuasiId",
        "StatisticalTable",
        "PrivacyMetric",
        "AnalyzeDataSourceRiskDetails",
        "ValueFrequency",
        "Value",
        "QuoteInfo",
        "DateTime",
        "DeidentifyConfig",
        "ImageTransformations",
        "TransformationErrorHandling",
        "PrimitiveTransformation",
        "TimePartConfig",
        "CryptoHashConfig",
        "CryptoDeterministicConfig",
        "ReplaceValueConfig",
        "ReplaceDictionaryConfig",
        "ReplaceWithInfoTypeConfig",
        "RedactConfig",
        "CharsToIgnore",
        "CharacterMaskConfig",
        "FixedSizeBucketingConfig",
        "BucketingConfig",
        "CryptoReplaceFfxFpeConfig",
        "CryptoKey",
        "TransientCryptoKey",
        "UnwrappedCryptoKey",
        "KmsWrappedCryptoKey",
        "DateShiftConfig",
        "InfoTypeTransformations",
        "FieldTransformation",
        "RecordTransformations",
        "RecordSuppression",
        "RecordCondition",
        "TransformationOverview",
        "TransformationSummary",
        "TransformationDescription",
        "TransformationDetails",
        "TransformationLocation",
        "RecordTransformation",
        "TransformationResultStatus",
        "TransformationDetailsStorageConfig",
        "Schedule",
        "Manual",
        "InspectTemplate",
        "DeidentifyTemplate",
        "Error",
        "JobTrigger",
        "Action",
        "TransformationConfig",
        "CreateInspectTemplateRequest",
        "UpdateInspectTemplateRequest",
        "GetInspectTemplateRequest",
        "ListInspectTemplatesRequest",
        "ListInspectTemplatesResponse",
        "DeleteInspectTemplateRequest",
        "CreateJobTriggerRequest",
        "ActivateJobTriggerRequest",
        "UpdateJobTriggerRequest",
        "GetJobTriggerRequest",
        "CreateDlpJobRequest",
        "ListJobTriggersRequest",
        "ListJobTriggersResponse",
        "DeleteJobTriggerRequest",
        "InspectJobConfig",
        "DataProfileAction",
        "DataProfileJobConfig",
        "DataProfileLocation",
        "DlpJob",
        "GetDlpJobRequest",
        "ListDlpJobsRequest",
        "ListDlpJobsResponse",
        "CancelDlpJobRequest",
        "FinishDlpJobRequest",
        "DeleteDlpJobRequest",
        "CreateDeidentifyTemplateRequest",
        "UpdateDeidentifyTemplateRequest",
        "GetDeidentifyTemplateRequest",
        "ListDeidentifyTemplatesRequest",
        "ListDeidentifyTemplatesResponse",
        "DeleteDeidentifyTemplateRequest",
        "LargeCustomDictionaryConfig",
        "LargeCustomDictionaryStats",
        "StoredInfoTypeConfig",
        "StoredInfoTypeStats",
        "StoredInfoTypeVersion",
        "StoredInfoType",
        "CreateStoredInfoTypeRequest",
        "UpdateStoredInfoTypeRequest",
        "GetStoredInfoTypeRequest",
        "ListStoredInfoTypesRequest",
        "ListStoredInfoTypesResponse",
        "DeleteStoredInfoTypeRequest",
        "HybridInspectJobTriggerRequest",
        "HybridInspectDlpJobRequest",
        "HybridContentItem",
        "HybridFindingDetails",
        "HybridInspectResponse",
        "DataRiskLevel",
        "DataProfileConfigSnapshot",
        "TableDataProfile",
        "ProfileStatus",
        "InfoTypeSummary",
        "OtherInfoTypeSummary",
        "DataProfilePubSubCondition",
        "DataProfilePubSubMessage",
    },
)


class TransformationResultStatusType(proto.Enum):
    r"""Enum of possible outcomes of transformations. SUCCESS if
    transformation and storing of transformation was successful,
    otherwise, reason for not transforming.
    """
    STATE_TYPE_UNSPECIFIED = 0
    INVALID_TRANSFORM = 1
    BIGQUERY_MAX_ROW_SIZE_EXCEEDED = 2
    METADATA_UNRETRIEVABLE = 3
    SUCCESS = 4


class TransformationContainerType(proto.Enum):
    r"""Describes functionality of a given container in its original
    format.
    """
    TRANSFORM_UNKNOWN_CONTAINER = 0
    TRANSFORM_BODY = 1
    TRANSFORM_METADATA = 2
    TRANSFORM_TABLE = 3


class TransformationType(proto.Enum):
    r"""An enum of rules that can be used to transform a value. Can be a
    record suppression, or one of the transformation rules specified
    under ``PrimitiveTransformation``.
    """
    TRANSFORMATION_TYPE_UNSPECIFIED = 0
    RECORD_SUPPRESSION = 1
    REPLACE_VALUE = 2
    REPLACE_DICTIONARY = 15
    REDACT = 3
    CHARACTER_MASK = 4
    CRYPTO_REPLACE_FFX_FPE = 5
    FIXED_SIZE_BUCKETING = 6
    BUCKETING = 7
    REPLACE_WITH_INFO_TYPE = 8
    TIME_PART = 9
    CRYPTO_HASH = 10
    DATE_SHIFT = 12
    CRYPTO_DETERMINISTIC_CONFIG = 13
    REDACT_IMAGE = 14


class RelationalOperator(proto.Enum):
    r"""Operators available for comparing the value of fields."""
    RELATIONAL_OPERATOR_UNSPECIFIED = 0
    EQUAL_TO = 1
    NOT_EQUAL_TO = 2
    GREATER_THAN = 3
    LESS_THAN = 4
    GREATER_THAN_OR_EQUALS = 5
    LESS_THAN_OR_EQUALS = 6
    EXISTS = 7


class MatchingType(proto.Enum):
    r"""Type of the match which can be applied to different ways of
    matching, like Dictionary, regular expression and intersecting
    with findings of another info type.
    """
    MATCHING_TYPE_UNSPECIFIED = 0
    MATCHING_TYPE_FULL_MATCH = 1
    MATCHING_TYPE_PARTIAL_MATCH = 2
    MATCHING_TYPE_INVERSE_MATCH = 3


class ContentOption(proto.Enum):
    r"""Deprecated and unused."""
    CONTENT_UNSPECIFIED = 0
    CONTENT_TEXT = 1
    CONTENT_IMAGE = 2


class MetadataType(proto.Enum):
    r"""Type of metadata containing the finding."""
    METADATATYPE_UNSPECIFIED = 0
    STORAGE_METADATA = 2


class InfoTypeSupportedBy(proto.Enum):
    r"""Parts of the APIs which use certain infoTypes."""
    ENUM_TYPE_UNSPECIFIED = 0
    INSPECT = 1
    RISK_ANALYSIS = 2


class DlpJobType(proto.Enum):
    r"""An enum to represent the various types of DLP jobs."""
    DLP_JOB_TYPE_UNSPECIFIED = 0
    INSPECT_JOB = 1
    RISK_ANALYSIS_JOB = 2


class StoredInfoTypeState(proto.Enum):
    r"""State of a StoredInfoType version."""
    STORED_INFO_TYPE_STATE_UNSPECIFIED = 0
    PENDING = 1
    READY = 2
    FAILED = 3
    INVALID = 4


class ResourceVisibility(proto.Enum):
    r"""How broadly a resource has been shared. New items may be
    added over time. A higher number means more restricted.
    """
    RESOURCE_VISIBILITY_UNSPECIFIED = 0
    RESOURCE_VISIBILITY_PUBLIC = 10
    RESOURCE_VISIBILITY_RESTRICTED = 20


class EncryptionStatus(proto.Enum):
    r"""How a resource is encrypted."""
    ENCRYPTION_STATUS_UNSPECIFIED = 0
    ENCRYPTION_GOOGLE_MANAGED = 1
    ENCRYPTION_CUSTOMER_MANAGED = 2


class ExcludeInfoTypes(proto.Message):
    r"""List of excluded infoTypes.

    Attributes:
        info_types (Sequence[google.cloud.dlp_v2.types.InfoType]):
            InfoType list in ExclusionRule rule drops a finding when it
            overlaps or contained within with a finding of an infoType
            from this list. For example, for
            ``InspectionRuleSet.info_types`` containing
            "PHONE_NUMBER"``and``\ exclusion_rule\ ``containing``\ exclude_info_types.info_types\`
            with "EMAIL_ADDRESS" the phone number findings are dropped
            if they overlap with EMAIL_ADDRESS finding. That leads to
            "555-222-2222@example.org" to generate only a single
            finding, namely email address.
    """

    info_types = proto.RepeatedField(
        proto.MESSAGE,
        number=1,
        message=storage.InfoType,
    )


class ExclusionRule(proto.Message):
    r"""The rule that specifies conditions when findings of infoTypes
    specified in ``InspectionRuleSet`` are removed from results.

    This message has `oneof`_ fields (mutually exclusive fields).
    For each oneof, at most one member field can be set at the same time.
    Setting any member of the oneof automatically clears all other
    members.

    .. _oneof: https://proto-plus-python.readthedocs.io/en/stable/fields.html#oneofs-mutually-exclusive-fields

    Attributes:
        dictionary (google.cloud.dlp_v2.types.CustomInfoType.Dictionary):
            Dictionary which defines the rule.

            This field is a member of `oneof`_ ``type``.
        regex (google.cloud.dlp_v2.types.CustomInfoType.Regex):
            Regular expression which defines the rule.

            This field is a member of `oneof`_ ``type``.
        exclude_info_types (google.cloud.dlp_v2.types.ExcludeInfoTypes):
            Set of infoTypes for which findings would
            affect this rule.

            This field is a member of `oneof`_ ``type``.
        matching_type (google.cloud.dlp_v2.types.MatchingType):
            How the rule is applied, see MatchingType
            documentation for details.
    """

    dictionary = proto.Field(
        proto.MESSAGE,
        number=1,
        oneof="type",
        message=storage.CustomInfoType.Dictionary,
    )
    regex = proto.Field(
        proto.MESSAGE,
        number=2,
        oneof="type",
        message=storage.CustomInfoType.Regex,
    )
    exclude_info_types = proto.Field(
        proto.MESSAGE,
        number=3,
        oneof="type",
        message="ExcludeInfoTypes",
    )
    matching_type = proto.Field(
        proto.ENUM,
        number=4,
        enum="MatchingType",
    )


class InspectionRule(proto.Message):
    r"""A single inspection rule to be applied to infoTypes, specified in
    ``InspectionRuleSet``.

    This message has `oneof`_ fields (mutually exclusive fields).
    For each oneof, at most one member field can be set at the same time.
    Setting any member of the oneof automatically clears all other
    members.

    .. _oneof: https://proto-plus-python.readthedocs.io/en/stable/fields.html#oneofs-mutually-exclusive-fields

    Attributes:
        hotword_rule (google.cloud.dlp_v2.types.CustomInfoType.DetectionRule.HotwordRule):
            Hotword-based detection rule.

            This field is a member of `oneof`_ ``type``.
        exclusion_rule (google.cloud.dlp_v2.types.ExclusionRule):
            Exclusion rule.

            This field is a member of `oneof`_ ``type``.
    """

    hotword_rule = proto.Field(
        proto.MESSAGE,
        number=1,
        oneof="type",
        message=storage.CustomInfoType.DetectionRule.HotwordRule,
    )
    exclusion_rule = proto.Field(
        proto.MESSAGE,
        number=2,
        oneof="type",
        message="ExclusionRule",
    )


class InspectionRuleSet(proto.Message):
    r"""Rule set for modifying a set of infoTypes to alter behavior
    under certain circumstances, depending on the specific details
    of the rules within the set.

    Attributes:
        info_types (Sequence[google.cloud.dlp_v2.types.InfoType]):
            List of infoTypes this rule set is applied
            to.
        rules (Sequence[google.cloud.dlp_v2.types.InspectionRule]):
            Set of rules to be applied to infoTypes. The
            rules are applied in order.
    """

    info_types = proto.RepeatedField(
        proto.MESSAGE,
        number=1,
        message=storage.InfoType,
    )
    rules = proto.RepeatedField(
        proto.MESSAGE,
        number=2,
        message="InspectionRule",
    )


class InspectConfig(proto.Message):
    r"""Configuration description of the scanning process. When used with
    redactContent only info_types and min_likelihood are currently used.

    Attributes:
        info_types (Sequence[google.cloud.dlp_v2.types.InfoType]):
            Restricts what info_types to look for. The values must
            correspond to InfoType values returned by ListInfoTypes or
            listed at
            https://cloud.google.com/dlp/docs/infotypes-reference.

            When no InfoTypes or CustomInfoTypes are specified in a
            request, the system may automatically choose what detectors
            to run. By default this may be all types, but may change
            over time as detectors are updated.

            If you need precise control and predictability as to what
            detectors are run you should specify specific InfoTypes
            listed in the reference, otherwise a default list will be
            used, which may change over time.
        min_likelihood (google.cloud.dlp_v2.types.Likelihood):
            Only returns findings equal or above this
            threshold. The default is POSSIBLE.
            See https://cloud.google.com/dlp/docs/likelihood
            to learn more.
        limits (google.cloud.dlp_v2.types.InspectConfig.FindingLimits):
            Configuration to control the number of findings returned.
            This is not used for data profiling.

            When redacting sensitive data from images, finding limits
            don't apply. They can cause unexpected or inconsistent
            results, where only some data is redacted. Don't include
            finding limits in
            [RedactImage][google.privacy.dlp.v2.DlpService.RedactImage]
            requests. Otherwise, Cloud DLP returns an error.
        include_quote (bool):
            When true, a contextual quote from the data that triggered a
            finding is included in the response; see
            [Finding.quote][google.privacy.dlp.v2.Finding.quote]. This
            is not used for data profiling.
        exclude_info_types (bool):
            When true, excludes type information of the
            findings. This is not used for data profiling.
        custom_info_types (Sequence[google.cloud.dlp_v2.types.CustomInfoType]):
            CustomInfoTypes provided by the user. See
            https://cloud.google.com/dlp/docs/creating-custom-infotypes
            to learn more.
        content_options (Sequence[google.cloud.dlp_v2.types.ContentOption]):
            Deprecated and unused.
        rule_set (Sequence[google.cloud.dlp_v2.types.InspectionRuleSet]):
            Set of rules to apply to the findings for
            this InspectConfig. Exclusion rules, contained
            in the set are executed in the end, other rules
            are executed in the order they are specified for
            each info type.
    """

    class FindingLimits(proto.Message):
        r"""Configuration to control the number of findings returned for
        inspection. This is not used for de-identification or data
        profiling.

        When redacting sensitive data from images, finding limits don't
        apply. They can cause unexpected or inconsistent results, where only
        some data is redacted. Don't include finding limits in
        [RedactImage][google.privacy.dlp.v2.DlpService.RedactImage]
        requests. Otherwise, Cloud DLP returns an error.

        Attributes:
            max_findings_per_item (int):
                Max number of findings that will be returned for each item
                scanned. When set within ``InspectJobConfig``, the maximum
                returned is 2000 regardless if this is set higher. When set
                within ``InspectContentRequest``, this field is ignored.
            max_findings_per_request (int):
                Max number of findings that will be returned per
                request/job. When set within ``InspectContentRequest``, the
                maximum returned is 2000 regardless if this is set higher.
            max_findings_per_info_type (Sequence[google.cloud.dlp_v2.types.InspectConfig.FindingLimits.InfoTypeLimit]):
                Configuration of findings limit given for
                specified infoTypes.
        """

        class InfoTypeLimit(proto.Message):
            r"""Max findings configuration per infoType, per content item or
            long running DlpJob.

            Attributes:
                info_type (google.cloud.dlp_v2.types.InfoType):
                    Type of information the findings limit applies to. Only one
                    limit per info_type should be provided. If InfoTypeLimit
                    does not have an info_type, the DLP API applies the limit
                    against all info_types that are found but not specified in
                    another InfoTypeLimit.
                max_findings (int):
                    Max findings limit for the given infoType.
            """

            info_type = proto.Field(
                proto.MESSAGE,
                number=1,
                message=storage.InfoType,
            )
            max_findings = proto.Field(
                proto.INT32,
                number=2,
            )

        max_findings_per_item = proto.Field(
            proto.INT32,
            number=1,
        )
        max_findings_per_request = proto.Field(
            proto.INT32,
            number=2,
        )
        max_findings_per_info_type = proto.RepeatedField(
            proto.MESSAGE,
            number=3,
            message="InspectConfig.FindingLimits.InfoTypeLimit",
        )

    info_types = proto.RepeatedField(
        proto.MESSAGE,
        number=1,
        message=storage.InfoType,
    )
    min_likelihood = proto.Field(
        proto.ENUM,
        number=2,
        enum=storage.Likelihood,
    )
    limits = proto.Field(
        proto.MESSAGE,
        number=3,
        message=FindingLimits,
    )
    include_quote = proto.Field(
        proto.BOOL,
        number=4,
    )
    exclude_info_types = proto.Field(
        proto.BOOL,
        number=5,
    )
    custom_info_types = proto.RepeatedField(
        proto.MESSAGE,
        number=6,
        message=storage.CustomInfoType,
    )
    content_options = proto.RepeatedField(
        proto.ENUM,
        number=8,
        enum="ContentOption",
    )
    rule_set = proto.RepeatedField(
        proto.MESSAGE,
        number=10,
        message="InspectionRuleSet",
    )


class ByteContentItem(proto.Message):
    r"""Container for bytes to inspect or redact.

    Attributes:
        type_ (google.cloud.dlp_v2.types.ByteContentItem.BytesType):
            The type of data stored in the bytes string. Default will be
            TEXT_UTF8.
        data (bytes):
            Content data to inspect or redact.
    """

    class BytesType(proto.Enum):
        r"""The type of data being sent for inspection. To learn more, see
        `Supported file
        types <https://cloud.google.com/dlp/docs/supported-file-types>`__.
        """
        BYTES_TYPE_UNSPECIFIED = 0
        IMAGE = 6
        IMAGE_JPEG = 1
        IMAGE_BMP = 2
        IMAGE_PNG = 3
        IMAGE_SVG = 4
        TEXT_UTF8 = 5
        WORD_DOCUMENT = 7
        PDF = 8
        POWERPOINT_DOCUMENT = 9
        EXCEL_DOCUMENT = 10
        AVRO = 11
        CSV = 12
        TSV = 13

    type_ = proto.Field(
        proto.ENUM,
        number=1,
        enum=BytesType,
    )
    data = proto.Field(
        proto.BYTES,
        number=2,
    )


class ContentItem(proto.Message):
    r"""Container structure for the content to inspect.

    This message has `oneof`_ fields (mutually exclusive fields).
    For each oneof, at most one member field can be set at the same time.
    Setting any member of the oneof automatically clears all other
    members.

    .. _oneof: https://proto-plus-python.readthedocs.io/en/stable/fields.html#oneofs-mutually-exclusive-fields

    Attributes:
        value (str):
            String data to inspect or redact.

            This field is a member of `oneof`_ ``data_item``.
        table (google.cloud.dlp_v2.types.Table):
            Structured content for inspection. See
            https://cloud.google.com/dlp/docs/inspecting-text#inspecting_a_table
            to learn more.

            This field is a member of `oneof`_ ``data_item``.
        byte_item (google.cloud.dlp_v2.types.ByteContentItem):
            Content data to inspect or redact. Replaces ``type`` and
            ``data``.

            This field is a member of `oneof`_ ``data_item``.
    """

    value = proto.Field(
        proto.STRING,
        number=3,
        oneof="data_item",
    )
    table = proto.Field(
        proto.MESSAGE,
        number=4,
        oneof="data_item",
        message="Table",
    )
    byte_item = proto.Field(
        proto.MESSAGE,
        number=5,
        oneof="data_item",
        message="ByteContentItem",
    )


class Table(proto.Message):
    r"""Structured content to inspect. Up to 50,000 ``Value``\ s per request
    allowed. See
    https://cloud.google.com/dlp/docs/inspecting-structured-text#inspecting_a_table
    to learn more.

    Attributes:
        headers (Sequence[google.cloud.dlp_v2.types.FieldId]):
            Headers of the table.
        rows (Sequence[google.cloud.dlp_v2.types.Table.Row]):
            Rows of the table.
    """

    class Row(proto.Message):
        r"""Values of the row.

        Attributes:
            values (Sequence[google.cloud.dlp_v2.types.Value]):
                Individual cells.
        """

        values = proto.RepeatedField(
            proto.MESSAGE,
            number=1,
            message="Value",
        )

    headers = proto.RepeatedField(
        proto.MESSAGE,
        number=1,
        message=storage.FieldId,
    )
    rows = proto.RepeatedField(
        proto.MESSAGE,
        number=2,
        message=Row,
    )


class InspectResult(proto.Message):
    r"""All the findings for a single scanned item.

    Attributes:
        findings (Sequence[google.cloud.dlp_v2.types.Finding]):
            List of findings for an item.
        findings_truncated (bool):
            If true, then this item might have more
            findings than were returned, and the findings
            returned are an arbitrary subset of all
            findings. The findings list might be truncated
            because the input items were too large, or
            because the server reached the maximum amount of
            resources allowed for a single API call. For
            best results, divide the input into smaller
            batches.
    """

    findings = proto.RepeatedField(
        proto.MESSAGE,
        number=1,
        message="Finding",
    )
    findings_truncated = proto.Field(
        proto.BOOL,
        number=2,
    )


class Finding(proto.Message):
    r"""Represents a piece of potentially sensitive content.

    Attributes:
        name (str):
            Resource name in format
            projects/{project}/locations/{location}/findings/{finding}
            Populated only when viewing persisted findings.
        quote (str):
            The content that was found. Even if the content is not
            textual, it may be converted to a textual representation
            here. Provided if ``include_quote`` is true and the finding
            is less than or equal to 4096 bytes long. If the finding
            exceeds 4096 bytes in length, the quote may be omitted.
        info_type (google.cloud.dlp_v2.types.InfoType):
            The type of content that might have been found. Provided if
            ``excluded_types`` is false.
        likelihood (google.cloud.dlp_v2.types.Likelihood):
            Confidence of how likely it is that the ``info_type`` is
            correct.
        location (google.cloud.dlp_v2.types.Location):
            Where the content was found.
        create_time (google.protobuf.timestamp_pb2.Timestamp):
            Timestamp when finding was detected.
        quote_info (google.cloud.dlp_v2.types.QuoteInfo):
            Contains data parsed from quotes. Only populated if
            include_quote was set to true and a supported infoType was
            requested. Currently supported infoTypes: DATE,
            DATE_OF_BIRTH and TIME.
        resource_name (str):
            The job that stored the finding.
        trigger_name (str):
            Job trigger name, if applicable, for this
            finding.
        labels (Mapping[str, str]):
            The labels associated with this ``Finding``.

            Label keys must be between 1 and 63 characters long and must
            conform to the following regular expression:
            ``[a-z]([-a-z0-9]*[a-z0-9])?``.

            Label values must be between 0 and 63 characters long and
            must conform to the regular expression
            ``([a-z]([-a-z0-9]*[a-z0-9])?)?``.

            No more than 10 labels can be associated with a given
            finding.

            Examples:

            -  ``"environment" : "production"``
            -  ``"pipeline" : "etl"``
        job_create_time (google.protobuf.timestamp_pb2.Timestamp):
            Time the job started that produced this
            finding.
        job_name (str):
            The job that stored the finding.
        finding_id (str):
            The unique finding id.
    """

    name = proto.Field(
        proto.STRING,
        number=14,
    )
    quote = proto.Field(
        proto.STRING,
        number=1,
    )
    info_type = proto.Field(
        proto.MESSAGE,
        number=2,
        message=storage.InfoType,
    )
    likelihood = proto.Field(
        proto.ENUM,
        number=3,
        enum=storage.Likelihood,
    )
    location = proto.Field(
        proto.MESSAGE,
        number=4,
        message="Location",
    )
    create_time = proto.Field(
        proto.MESSAGE,
        number=6,
        message=timestamp_pb2.Timestamp,
    )
    quote_info = proto.Field(
        proto.MESSAGE,
        number=7,
        message="QuoteInfo",
    )
    resource_name = proto.Field(
        proto.STRING,
        number=8,
    )
    trigger_name = proto.Field(
        proto.STRING,
        number=9,
    )
    labels = proto.MapField(
        proto.STRING,
        proto.STRING,
        number=10,
    )
    job_create_time = proto.Field(
        proto.MESSAGE,
        number=11,
        message=timestamp_pb2.Timestamp,
    )
    job_name = proto.Field(
        proto.STRING,
        number=13,
    )
    finding_id = proto.Field(
        proto.STRING,
        number=15,
    )


class Location(proto.Message):
    r"""Specifies the location of the finding.

    Attributes:
        byte_range (google.cloud.dlp_v2.types.Range):
            Zero-based byte offsets delimiting the
            finding. These are relative to the finding's
            containing element. Note that when the content
            is not textual, this references the UTF-8
            encoded textual representation of the content.
            Omitted if content is an image.
        codepoint_range (google.cloud.dlp_v2.types.Range):
            Unicode character offsets delimiting the
            finding. These are relative to the finding's
            containing element. Provided when the content is
            text.
        content_locations (Sequence[google.cloud.dlp_v2.types.ContentLocation]):
            List of nested objects pointing to the
            precise location of the finding within the file
            or record.
        container (google.cloud.dlp_v2.types.Container):
            Information about the container where this
            finding occurred, if available.
    """

    byte_range = proto.Field(
        proto.MESSAGE,
        number=1,
        message="Range",
    )
    codepoint_range = proto.Field(
        proto.MESSAGE,
        number=2,
        message="Range",
    )
    content_locations = proto.RepeatedField(
        proto.MESSAGE,
        number=7,
        message="ContentLocation",
    )
    container = proto.Field(
        proto.MESSAGE,
        number=8,
        message="Container",
    )


class ContentLocation(proto.Message):
    r"""Precise location of the finding within a document, record,
    image, or metadata container.

    This message has `oneof`_ fields (mutually exclusive fields).
    For each oneof, at most one member field can be set at the same time.
    Setting any member of the oneof automatically clears all other
    members.

    .. _oneof: https://proto-plus-python.readthedocs.io/en/stable/fields.html#oneofs-mutually-exclusive-fields

    Attributes:
        container_name (str):
            Name of the container where the finding is located. The top
            level name is the source file name or table name. Names of
            some common storage containers are formatted as follows:

            -  BigQuery tables: ``{project_id}:{dataset_id}.{table_id}``
            -  Cloud Storage files: ``gs://{bucket}/{path}``
            -  Datastore namespace: {namespace}

            Nested names could be absent if the embedded object has no
            string identifier (for example, an image contained within a
            document).
        record_location (google.cloud.dlp_v2.types.RecordLocation):
            Location within a row or record of a database
            table.

            This field is a member of `oneof`_ ``location``.
        image_location (google.cloud.dlp_v2.types.ImageLocation):
            Location within an image's pixels.

            This field is a member of `oneof`_ ``location``.
        document_location (google.cloud.dlp_v2.types.DocumentLocation):
            Location data for document files.

            This field is a member of `oneof`_ ``location``.
        metadata_location (google.cloud.dlp_v2.types.MetadataLocation):
            Location within the metadata for inspected
            content.

            This field is a member of `oneof`_ ``location``.
        container_timestamp (google.protobuf.timestamp_pb2.Timestamp):
            Finding container modification timestamp, if applicable. For
            Cloud Storage, this field contains the last file
            modification timestamp. For a BigQuery table, this field
            contains the last_modified_time property. For Datastore,
            this field isn't populated.
        container_version (str):
            Finding container version, if available
            ("generation" for Cloud Storage).
    """

    container_name = proto.Field(
        proto.STRING,
        number=1,
    )
    record_location = proto.Field(
        proto.MESSAGE,
        number=2,
        oneof="location",
        message="RecordLocation",
    )
    image_location = proto.Field(
        proto.MESSAGE,
        number=3,
        oneof="location",
        message="ImageLocation",
    )
    document_location = proto.Field(
        proto.MESSAGE,
        number=5,
        oneof="location",
        message="DocumentLocation",
    )
    metadata_location = proto.Field(
        proto.MESSAGE,
        number=8,
        oneof="location",
        message="MetadataLocation",
    )
    container_timestamp = proto.Field(
        proto.MESSAGE,
        number=6,
        message=timestamp_pb2.Timestamp,
    )
    container_version = proto.Field(
        proto.STRING,
        number=7,
    )


class MetadataLocation(proto.Message):
    r"""Metadata Location

    .. _oneof: https://proto-plus-python.readthedocs.io/en/stable/fields.html#oneofs-mutually-exclusive-fields

    Attributes:
        type_ (google.cloud.dlp_v2.types.MetadataType):
            Type of metadata containing the finding.
        storage_label (google.cloud.dlp_v2.types.StorageMetadataLabel):
            Storage metadata.

            This field is a member of `oneof`_ ``label``.
    """

    type_ = proto.Field(
        proto.ENUM,
        number=1,
        enum="MetadataType",
    )
    storage_label = proto.Field(
        proto.MESSAGE,
        number=3,
        oneof="label",
        message="StorageMetadataLabel",
    )


class StorageMetadataLabel(proto.Message):
    r"""Storage metadata label to indicate which metadata entry
    contains findings.

    Attributes:
        key (str):

    """

    key = proto.Field(
        proto.STRING,
        number=1,
    )


class DocumentLocation(proto.Message):
    r"""Location of a finding within a document.

    Attributes:
        file_offset (int):
            Offset of the line, from the beginning of the
            file, where the finding is located.
    """

    file_offset = proto.Field(
        proto.INT64,
        number=1,
    )


class RecordLocation(proto.Message):
    r"""Location of a finding within a row or record.

    Attributes:
        record_key (google.cloud.dlp_v2.types.RecordKey):
            Key of the finding.
        field_id (google.cloud.dlp_v2.types.FieldId):
            Field id of the field containing the finding.
        table_location (google.cloud.dlp_v2.types.TableLocation):
            Location within a ``ContentItem.Table``.
    """

    record_key = proto.Field(
        proto.MESSAGE,
        number=1,
        message=storage.RecordKey,
    )
    field_id = proto.Field(
        proto.MESSAGE,
        number=2,
        message=storage.FieldId,
    )
    table_location = proto.Field(
        proto.MESSAGE,
        number=3,
        message="TableLocation",
    )


class TableLocation(proto.Message):
    r"""Location of a finding within a table.

    Attributes:
        row_index (int):
            The zero-based index of the row where the finding is
            located. Only populated for resources that have a natural
            ordering, not BigQuery. In BigQuery, to identify the row a
            finding came from, populate
            BigQueryOptions.identifying_fields with your primary key
            column names and when you store the findings the value of
            those columns will be stored inside of Finding.
    """

    row_index = proto.Field(
        proto.INT64,
        number=1,
    )


class Container(proto.Message):
    r"""Represents a container that may contain DLP findings.
    Examples of a container include a file, table, or database
    record.

    Attributes:
        type_ (str):
            Container type, for example BigQuery or Cloud
            Storage.
        project_id (str):
            Project where the finding was found.
            Can be different from the project that owns the
            finding.
        full_path (str):
            A string representation of the full container
            name. Examples:
            - BigQuery: 'Project:DataSetId.TableId'
            - Cloud Storage:
            'gs://Bucket/folders/filename.txt'
        root_path (str):
            The root of the container. Examples:

            -  For BigQuery table ``project_id:dataset_id.table_id``,
               the root is ``dataset_id``
            -  For Cloud Storage file
               ``gs://bucket/folder/filename.txt``, the root is
               ``gs://bucket``
        relative_path (str):
            The rest of the path after the root. Examples:

            -  For BigQuery table ``project_id:dataset_id.table_id``,
               the relative path is ``table_id``
            -  For Cloud Storage file
               ``gs://bucket/folder/filename.txt``, the relative path is
               ``folder/filename.txt``
        update_time (google.protobuf.timestamp_pb2.Timestamp):
            Findings container modification timestamp, if applicable.
            For Cloud Storage, this field contains the last file
            modification timestamp. For a BigQuery table, this field
            contains the last_modified_time property. For Datastore,
            this field isn't populated.
        version (str):
            Findings container version, if available
            ("generation" for Cloud Storage).
    """

    type_ = proto.Field(
        proto.STRING,
        number=1,
    )
    project_id = proto.Field(
        proto.STRING,
        number=2,
    )
    full_path = proto.Field(
        proto.STRING,
        number=3,
    )
    root_path = proto.Field(
        proto.STRING,
        number=4,
    )
    relative_path = proto.Field(
        proto.STRING,
        number=5,
    )
    update_time = proto.Field(
        proto.MESSAGE,
        number=6,
        message=timestamp_pb2.Timestamp,
    )
    version = proto.Field(
        proto.STRING,
        number=7,
    )


class Range(proto.Message):
    r"""Generic half-open interval [start, end)

    Attributes:
        start (int):
            Index of the first character of the range
            (inclusive).
        end (int):
            Index of the last character of the range
            (exclusive).
    """

    start = proto.Field(
        proto.INT64,
        number=1,
    )
    end = proto.Field(
        proto.INT64,
        number=2,
    )


class ImageLocation(proto.Message):
    r"""Location of the finding within an image.

    Attributes:
        bounding_boxes (Sequence[google.cloud.dlp_v2.types.BoundingBox]):
            Bounding boxes locating the pixels within the
            image containing the finding.
    """

    bounding_boxes = proto.RepeatedField(
        proto.MESSAGE,
        number=1,
        message="BoundingBox",
    )


class BoundingBox(proto.Message):
    r"""Bounding box encompassing detected text within an image.

    Attributes:
        top (int):
            Top coordinate of the bounding box. (0,0) is
            upper left.
        left (int):
            Left coordinate of the bounding box. (0,0) is
            upper left.
        width (int):
            Width of the bounding box in pixels.
        height (int):
            Height of the bounding box in pixels.
    """

    top = proto.Field(
        proto.INT32,
        number=1,
    )
    left = proto.Field(
        proto.INT32,
        number=2,
    )
    width = proto.Field(
        proto.INT32,
        number=3,
    )
    height = proto.Field(
        proto.INT32,
        number=4,
    )


class RedactImageRequest(proto.Message):
    r"""Request to search for potentially sensitive info in an image
    and redact it by covering it with a colored rectangle.

    Attributes:
        parent (str):
            Parent resource name.

            The format of this value varies depending on whether you
            have `specified a processing
            location <https://cloud.google.com/dlp/docs/specifying-location>`__:

            -  Projects scope, location specified:
               ``projects/``\ PROJECT_ID\ ``/locations/``\ LOCATION_ID
            -  Projects scope, no location specified (defaults to
               global): ``projects/``\ PROJECT_ID

            The following example ``parent`` string specifies a parent
            project with the identifier ``example-project``, and
            specifies the ``europe-west3`` location for processing data:

            ::

                parent=projects/example-project/locations/europe-west3
        location_id (str):
            Deprecated. This field has no effect.
        inspect_config (google.cloud.dlp_v2.types.InspectConfig):
            Configuration for the inspector.
        image_redaction_configs (Sequence[google.cloud.dlp_v2.types.RedactImageRequest.ImageRedactionConfig]):
            The configuration for specifying what content
            to redact from images.
        include_findings (bool):
            Whether the response should include findings
            along with the redacted image.
        byte_item (google.cloud.dlp_v2.types.ByteContentItem):
            The content must be PNG, JPEG, SVG or BMP.
    """

    class ImageRedactionConfig(proto.Message):
        r"""Configuration for determining how redaction of images should
        occur.

        This message has `oneof`_ fields (mutually exclusive fields).
        For each oneof, at most one member field can be set at the same time.
        Setting any member of the oneof automatically clears all other
        members.

        .. _oneof: https://proto-plus-python.readthedocs.io/en/stable/fields.html#oneofs-mutually-exclusive-fields

        Attributes:
            info_type (google.cloud.dlp_v2.types.InfoType):
                Only one per info_type should be provided per request. If
                not specified, and redact_all_text is false, the DLP API
                will redact all text that it matches against all info_types
                that are found, but not specified in another
                ImageRedactionConfig.

                This field is a member of `oneof`_ ``target``.
            redact_all_text (bool):
                If true, all text found in the image, regardless whether it
                matches an info_type, is redacted. Only one should be
                provided.

                This field is a member of `oneof`_ ``target``.
            redaction_color (google.cloud.dlp_v2.types.Color):
                The color to use when redacting content from
                an image. If not specified, the default is
                black.
        """

        info_type = proto.Field(
            proto.MESSAGE,
            number=1,
            oneof="target",
            message=storage.InfoType,
        )
        redact_all_text = proto.Field(
            proto.BOOL,
            number=2,
            oneof="target",
        )
        redaction_color = proto.Field(
            proto.MESSAGE,
            number=3,
            message="Color",
        )

    parent = proto.Field(
        proto.STRING,
        number=1,
    )
    location_id = proto.Field(
        proto.STRING,
        number=8,
    )
    inspect_config = proto.Field(
        proto.MESSAGE,
        number=2,
        message="InspectConfig",
    )
    image_redaction_configs = proto.RepeatedField(
        proto.MESSAGE,
        number=5,
        message=ImageRedactionConfig,
    )
    include_findings = proto.Field(
        proto.BOOL,
        number=6,
    )
    byte_item = proto.Field(
        proto.MESSAGE,
        number=7,
        message="ByteContentItem",
    )


class Color(proto.Message):
    r"""Represents a color in the RGB color space.

    Attributes:
        red (float):
            The amount of red in the color as a value in the interval
            [0, 1].
        green (float):
            The amount of green in the color as a value in the interval
            [0, 1].
        blue (float):
            The amount of blue in the color as a value in the interval
            [0, 1].
    """

    red = proto.Field(
        proto.FLOAT,
        number=1,
    )
    green = proto.Field(
        proto.FLOAT,
        number=2,
    )
    blue = proto.Field(
        proto.FLOAT,
        number=3,
    )


class RedactImageResponse(proto.Message):
    r"""Results of redacting an image.

    Attributes:
        redacted_image (bytes):
            The redacted image. The type will be the same
            as the original image.
        extracted_text (str):
            If an image was being inspected and the InspectConfig's
            include_quote was set to true, then this field will include
            all text, if any, that was found in the image.
        inspect_result (google.cloud.dlp_v2.types.InspectResult):
            The findings. Populated when include_findings in the request
            is true.
    """

    redacted_image = proto.Field(
        proto.BYTES,
        number=1,
    )
    extracted_text = proto.Field(
        proto.STRING,
        number=2,
    )
    inspect_result = proto.Field(
        proto.MESSAGE,
        number=3,
        message="InspectResult",
    )


class DeidentifyContentRequest(proto.Message):
    r"""Request to de-identify a ContentItem.

    Attributes:
        parent (str):
            Parent resource name.

            The format of this value varies depending on whether you
            have `specified a processing
            location <https://cloud.google.com/dlp/docs/specifying-location>`__:

            -  Projects scope, location specified:
               ``projects/``\ PROJECT_ID\ ``/locations/``\ LOCATION_ID
            -  Projects scope, no location specified (defaults to
               global): ``projects/``\ PROJECT_ID

            The following example ``parent`` string specifies a parent
            project with the identifier ``example-project``, and
            specifies the ``europe-west3`` location for processing data:

            ::

                parent=projects/example-project/locations/europe-west3
        deidentify_config (google.cloud.dlp_v2.types.DeidentifyConfig):
            Configuration for the de-identification of the content item.
            Items specified here will override the template referenced
            by the deidentify_template_name argument.
        inspect_config (google.cloud.dlp_v2.types.InspectConfig):
            Configuration for the inspector. Items specified here will
            override the template referenced by the
            inspect_template_name argument.
        item (google.cloud.dlp_v2.types.ContentItem):
            The item to de-identify. Will be treated as
            text.
        inspect_template_name (str):
            Template to use. Any configuration directly specified in
            inspect_config will override those set in the template.
            Singular fields that are set in this request will replace
            their corresponding fields in the template. Repeated fields
            are appended. Singular sub-messages and groups are
            recursively merged.
        deidentify_template_name (str):
            Template to use. Any configuration directly specified in
            deidentify_config will override those set in the template.
            Singular fields that are set in this request will replace
            their corresponding fields in the template. Repeated fields
            are appended. Singular sub-messages and groups are
            recursively merged.
        location_id (str):
            Deprecated. This field has no effect.
    """

    parent = proto.Field(
        proto.STRING,
        number=1,
    )
    deidentify_config = proto.Field(
        proto.MESSAGE,
        number=2,
        message="DeidentifyConfig",
    )
    inspect_config = proto.Field(
        proto.MESSAGE,
        number=3,
        message="InspectConfig",
    )
    item = proto.Field(
        proto.MESSAGE,
        number=4,
        message="ContentItem",
    )
    inspect_template_name = proto.Field(
        proto.STRING,
        number=5,
    )
    deidentify_template_name = proto.Field(
        proto.STRING,
        number=6,
    )
    location_id = proto.Field(
        proto.STRING,
        number=7,
    )


class DeidentifyContentResponse(proto.Message):
    r"""Results of de-identifying a ContentItem.

    Attributes:
        item (google.cloud.dlp_v2.types.ContentItem):
            The de-identified item.
        overview (google.cloud.dlp_v2.types.TransformationOverview):
            An overview of the changes that were made on the ``item``.
    """

    item = proto.Field(
        proto.MESSAGE,
        number=1,
        message="ContentItem",
    )
    overview = proto.Field(
        proto.MESSAGE,
        number=2,
        message="TransformationOverview",
    )


class ReidentifyContentRequest(proto.Message):
    r"""Request to re-identify an item.

    Attributes:
        parent (str):
            Required. Parent resource name.

            The format of this value varies depending on whether you
            have `specified a processing
            location <https://cloud.google.com/dlp/docs/specifying-location>`__:

            -  Projects scope, location specified:
               ``projects/``\ PROJECT_ID\ ``/locations/``\ LOCATION_ID
            -  Projects scope, no location specified (defaults to
               global): ``projects/``\ PROJECT_ID

            The following example ``parent`` string specifies a parent
            project with the identifier ``example-project``, and
            specifies the ``europe-west3`` location for processing data:

            ::

                parent=projects/example-project/locations/europe-west3
        reidentify_config (google.cloud.dlp_v2.types.DeidentifyConfig):
            Configuration for the re-identification of the content item.
            This field shares the same proto message type that is used
            for de-identification, however its usage here is for the
            reversal of the previous de-identification.
            Re-identification is performed by examining the
            transformations used to de-identify the items and executing
            the reverse. This requires that only reversible
            transformations be provided here. The reversible
            transformations are:

            -  ``CryptoDeterministicConfig``
            -  ``CryptoReplaceFfxFpeConfig``
        inspect_config (google.cloud.dlp_v2.types.InspectConfig):
            Configuration for the inspector.
        item (google.cloud.dlp_v2.types.ContentItem):
            The item to re-identify. Will be treated as
            text.
        inspect_template_name (str):
            Template to use. Any configuration directly specified in
            ``inspect_config`` will override those set in the template.
            Singular fields that are set in this request will replace
            their corresponding fields in the template. Repeated fields
            are appended. Singular sub-messages and groups are
            recursively merged.
        reidentify_template_name (str):
            Template to use. References an instance of
            ``DeidentifyTemplate``. Any configuration directly specified
            in ``reidentify_config`` or ``inspect_config`` will override
            those set in the template. The ``DeidentifyTemplate`` used
            must include only reversible transformations. Singular
            fields that are set in this request will replace their
            corresponding fields in the template. Repeated fields are
            appended. Singular sub-messages and groups are recursively
            merged.
        location_id (str):
            Deprecated. This field has no effect.
    """

    parent = proto.Field(
        proto.STRING,
        number=1,
    )
    reidentify_config = proto.Field(
        proto.MESSAGE,
        number=2,
        message="DeidentifyConfig",
    )
    inspect_config = proto.Field(
        proto.MESSAGE,
        number=3,
        message="InspectConfig",
    )
    item = proto.Field(
        proto.MESSAGE,
        number=4,
        message="ContentItem",
    )
    inspect_template_name = proto.Field(
        proto.STRING,
        number=5,
    )
    reidentify_template_name = proto.Field(
        proto.STRING,
        number=6,
    )
    location_id = proto.Field(
        proto.STRING,
        number=7,
    )


class ReidentifyContentResponse(proto.Message):
    r"""Results of re-identifying an item.

    Attributes:
        item (google.cloud.dlp_v2.types.ContentItem):
            The re-identified item.
        overview (google.cloud.dlp_v2.types.TransformationOverview):
            An overview of the changes that were made to the ``item``.
    """

    item = proto.Field(
        proto.MESSAGE,
        number=1,
        message="ContentItem",
    )
    overview = proto.Field(
        proto.MESSAGE,
        number=2,
        message="TransformationOverview",
    )


class InspectContentRequest(proto.Message):
    r"""Request to search for potentially sensitive info in a
    ContentItem.

    Attributes:
        parent (str):
            Parent resource name.

            The format of this value varies depending on whether you
            have `specified a processing
            location <https://cloud.google.com/dlp/docs/specifying-location>`__:

            -  Projects scope, location specified:
               ``projects/``\ PROJECT_ID\ ``/locations/``\ LOCATION_ID
            -  Projects scope, no location specified (defaults to
               global): ``projects/``\ PROJECT_ID

            The following example ``parent`` string specifies a parent
            project with the identifier ``example-project``, and
            specifies the ``europe-west3`` location for processing data:

            ::

                parent=projects/example-project/locations/europe-west3
        inspect_config (google.cloud.dlp_v2.types.InspectConfig):
            Configuration for the inspector. What specified here will
            override the template referenced by the
            inspect_template_name argument.
        item (google.cloud.dlp_v2.types.ContentItem):
            The item to inspect.
        inspect_template_name (str):
            Template to use. Any configuration directly specified in
            inspect_config will override those set in the template.
            Singular fields that are set in this request will replace
            their corresponding fields in the template. Repeated fields
            are appended. Singular sub-messages and groups are
            recursively merged.
        location_id (str):
            Deprecated. This field has no effect.
    """

    parent = proto.Field(
        proto.STRING,
        number=1,
    )
    inspect_config = proto.Field(
        proto.MESSAGE,
        number=2,
        message="InspectConfig",
    )
    item = proto.Field(
        proto.MESSAGE,
        number=3,
        message="ContentItem",
    )
    inspect_template_name = proto.Field(
        proto.STRING,
        number=4,
    )
    location_id = proto.Field(
        proto.STRING,
        number=5,
    )


class InspectContentResponse(proto.Message):
    r"""Results of inspecting an item.

    Attributes:
        result (google.cloud.dlp_v2.types.InspectResult):
            The findings.
    """

    result = proto.Field(
        proto.MESSAGE,
        number=1,
        message="InspectResult",
    )


class OutputStorageConfig(proto.Message):
    r"""Cloud repository for storing output.

    .. _oneof: https://proto-plus-python.readthedocs.io/en/stable/fields.html#oneofs-mutually-exclusive-fields

    Attributes:
        table (google.cloud.dlp_v2.types.BigQueryTable):
            Store findings in an existing table or a new table in an
            existing dataset. If table_id is not set a new one will be
            generated for you with the following format:
            dlp_googleapis_yyyy_mm_dd_[dlp_job_id]. Pacific time zone
            will be used for generating the date details.

            For Inspect, each column in an existing output table must
            have the same name, type, and mode of a field in the
            ``Finding`` object.

            For Risk, an existing output table should be the output of a
            previous Risk analysis job run on the same source table,
            with the same privacy metric and quasi-identifiers. Risk
            jobs that analyze the same table but compute a different
            privacy metric, or use different sets of quasi-identifiers,
            cannot store their results in the same table.

            This field is a member of `oneof`_ ``type``.
        output_schema (google.cloud.dlp_v2.types.OutputStorageConfig.OutputSchema):
            Schema used for writing the findings for Inspect jobs. This
            field is only used for Inspect and must be unspecified for
            Risk jobs. Columns are derived from the ``Finding`` object.
            If appending to an existing table, any columns from the
            predefined schema that are missing will be added. No columns
            in the existing table will be deleted.

            If unspecified, then all available columns will be used for
            a new table or an (existing) table with no schema, and no
            changes will be made to an existing table that has a schema.
            Only for use with external storage.
    """

    class OutputSchema(proto.Enum):
        r"""Predefined schemas for storing findings.
        Only for use with external storage.
        """
        OUTPUT_SCHEMA_UNSPECIFIED = 0
        BASIC_COLUMNS = 1
        GCS_COLUMNS = 2
        DATASTORE_COLUMNS = 3
        BIG_QUERY_COLUMNS = 4
        ALL_COLUMNS = 5

    table = proto.Field(
        proto.MESSAGE,
        number=1,
        oneof="type",
        message=storage.BigQueryTable,
    )
    output_schema = proto.Field(
        proto.ENUM,
        number=3,
        enum=OutputSchema,
    )


class InfoTypeStats(proto.Message):
    r"""Statistics regarding a specific InfoType.

    Attributes:
        info_type (google.cloud.dlp_v2.types.InfoType):
            The type of finding this stat is for.
        count (int):
            Number of findings for this infoType.
    """

    info_type = proto.Field(
        proto.MESSAGE,
        number=1,
        message=storage.InfoType,
    )
    count = proto.Field(
        proto.INT64,
        number=2,
    )


class InspectDataSourceDetails(proto.Message):
    r"""The results of an inspect DataSource job.

    Attributes:
        requested_options (google.cloud.dlp_v2.types.InspectDataSourceDetails.RequestedOptions):
            The configuration used for this job.
        result (google.cloud.dlp_v2.types.InspectDataSourceDetails.Result):
            A summary of the outcome of this inspection
            job.
    """

    class RequestedOptions(proto.Message):
        r"""Snapshot of the inspection configuration.

        Attributes:
            snapshot_inspect_template (google.cloud.dlp_v2.types.InspectTemplate):
                If run with an InspectTemplate, a snapshot of
                its state at the time of this run.
            job_config (google.cloud.dlp_v2.types.InspectJobConfig):
                Inspect config.
        """

        snapshot_inspect_template = proto.Field(
            proto.MESSAGE,
            number=1,
            message="InspectTemplate",
        )
        job_config = proto.Field(
            proto.MESSAGE,
            number=3,
            message="InspectJobConfig",
        )

    class Result(proto.Message):
        r"""All result fields mentioned below are updated while the job
        is processing.

        Attributes:
            processed_bytes (int):
                Total size in bytes that were processed.
            total_estimated_bytes (int):
                Estimate of the number of bytes to process.
            info_type_stats (Sequence[google.cloud.dlp_v2.types.InfoTypeStats]):
                Statistics of how many instances of each info
                type were found during inspect job.
            hybrid_stats (google.cloud.dlp_v2.types.HybridInspectStatistics):
                Statistics related to the processing of
                hybrid inspect.
        """

        processed_bytes = proto.Field(
            proto.INT64,
            number=1,
        )
        total_estimated_bytes = proto.Field(
            proto.INT64,
            number=2,
        )
        info_type_stats = proto.RepeatedField(
            proto.MESSAGE,
            number=3,
            message="InfoTypeStats",
        )
        hybrid_stats = proto.Field(
            proto.MESSAGE,
            number=7,
            message="HybridInspectStatistics",
        )

    requested_options = proto.Field(
        proto.MESSAGE,
        number=2,
        message=RequestedOptions,
    )
    result = proto.Field(
        proto.MESSAGE,
        number=3,
        message=Result,
    )


class HybridInspectStatistics(proto.Message):
    r"""Statistics related to processing hybrid inspect requests.

    Attributes:
        processed_count (int):
            The number of hybrid inspection requests
            processed within this job.
        aborted_count (int):
            The number of hybrid inspection requests
            aborted because the job ran out of quota or was
            ended before they could be processed.
        pending_count (int):
            The number of hybrid requests currently being processed.
            Only populated when called via method ``getDlpJob``. A burst
            of traffic may cause hybrid inspect requests to be enqueued.
            Processing will take place as quickly as possible, but
            resource limitations may impact how long a request is
            enqueued for.
    """

    processed_count = proto.Field(
        proto.INT64,
        number=1,
    )
    aborted_count = proto.Field(
        proto.INT64,
        number=2,
    )
    pending_count = proto.Field(
        proto.INT64,
        number=3,
    )


class InfoTypeDescription(proto.Message):
    r"""InfoType description.

    Attributes:
        name (str):
            Internal name of the infoType.
        display_name (str):
            Human readable form of the infoType name.
        supported_by (Sequence[google.cloud.dlp_v2.types.InfoTypeSupportedBy]):
            Which parts of the API supports this
            InfoType.
        description (str):
            Description of the infotype. Translated when
            language is provided in the request.
        versions (Sequence[google.cloud.dlp_v2.types.VersionDescription]):
            A list of available versions for the
            infotype.
        categories (Sequence[google.cloud.dlp_v2.types.InfoTypeCategory]):
            The category of the infoType.
    """

    name = proto.Field(
        proto.STRING,
        number=1,
    )
    display_name = proto.Field(
        proto.STRING,
        number=2,
    )
    supported_by = proto.RepeatedField(
        proto.ENUM,
        number=3,
        enum="InfoTypeSupportedBy",
    )
    description = proto.Field(
        proto.STRING,
        number=4,
    )
    versions = proto.RepeatedField(
        proto.MESSAGE,
        number=9,
        message="VersionDescription",
    )
    categories = proto.RepeatedField(
        proto.MESSAGE,
        number=10,
        message="InfoTypeCategory",
    )


class InfoTypeCategory(proto.Message):
    r"""Classification of infoTypes to organize them according to
    geographic location, industry, and data type.

    This message has `oneof`_ fields (mutually exclusive fields).
    For each oneof, at most one member field can be set at the same time.
    Setting any member of the oneof automatically clears all other
    members.

    .. _oneof: https://proto-plus-python.readthedocs.io/en/stable/fields.html#oneofs-mutually-exclusive-fields

    Attributes:
        location_category (google.cloud.dlp_v2.types.InfoTypeCategory.LocationCategory):
            The region or country that issued the ID or
            document represented by the infoType.

            This field is a member of `oneof`_ ``category``.
        industry_category (google.cloud.dlp_v2.types.InfoTypeCategory.IndustryCategory):
            The group of relevant businesses where this
            infoType is commonly used

            This field is a member of `oneof`_ ``category``.
        type_category (google.cloud.dlp_v2.types.InfoTypeCategory.TypeCategory):
            The class of identifiers where this infoType
            belongs

            This field is a member of `oneof`_ ``category``.
    """

    class LocationCategory(proto.Enum):
        r"""Enum of the current locations.
        We might add more locations in the future.
        """
        LOCATION_UNSPECIFIED = 0
        GLOBAL = 1
        ARGENTINA = 2
        AUSTRALIA = 3
        BELGIUM = 4
        BRAZIL = 5
        CANADA = 6
        CHILE = 7
        CHINA = 8
        COLOMBIA = 9
        DENMARK = 10
        FRANCE = 11
        FINLAND = 12
        GERMANY = 13
        HONG_KONG = 14
        INDIA = 15
        INDONESIA = 16
        IRELAND = 17
        ISRAEL = 18
        ITALY = 19
        JAPAN = 20
        KOREA = 21
        MEXICO = 22
        THE_NETHERLANDS = 23
        NORWAY = 24
        PARAGUAY = 25
        PERU = 26
        POLAND = 27
        PORTUGAL = 28
        SINGAPORE = 29
        SOUTH_AFRICA = 30
        SPAIN = 31
        SWEDEN = 32
        TAIWAN = 33
        THAILAND = 34
        TURKEY = 35
        UNITED_KINGDOM = 36
        UNITED_STATES = 37
        URUGUAY = 38
        VENEZUELA = 39
        INTERNAL = 40

    class IndustryCategory(proto.Enum):
        r"""Enum of the current industries in the category.
        We might add more industries in the future.
        """
        INDUSTRY_UNSPECIFIED = 0
        FINANCE = 1
        HEALTH = 2
        TELECOMMUNICATIONS = 3

    class TypeCategory(proto.Enum):
        r"""Enum of the current types in the category.
        We might add more types in the future.
        """
        TYPE_UNSPECIFIED = 0
        PII = 1
        SPII = 2
        DEMOGRAPHIC = 3
        CREDENTIAL = 4
        GOVERNMENT_ID = 5
        DOCUMENT = 6
        CONTEXTUAL_INFORMATION = 7

    location_category = proto.Field(
        proto.ENUM,
        number=1,
        oneof="category",
        enum=LocationCategory,
    )
    industry_category = proto.Field(
        proto.ENUM,
        number=2,
        oneof="category",
        enum=IndustryCategory,
    )
    type_category = proto.Field(
        proto.ENUM,
        number=3,
        oneof="category",
        enum=TypeCategory,
    )


class VersionDescription(proto.Message):
    r"""Details about each available version for an infotype.

    Attributes:
        version (str):
            Name of the version
        description (str):
            Description of the version.
    """

    version = proto.Field(
        proto.STRING,
        number=1,
    )
    description = proto.Field(
        proto.STRING,
        number=2,
    )


class ListInfoTypesRequest(proto.Message):
    r"""Request for the list of infoTypes.

    Attributes:
        parent (str):
            The parent resource name.

            The format of this value is as follows:

            ::

                locations/<var>LOCATION_ID</var>
        language_code (str):
            BCP-47 language code for localized infoType
            friendly names. If omitted, or if localized
            strings are not available, en-US strings will be
            returned.
        filter (str):
            filter to only return infoTypes supported by certain parts
            of the API. Defaults to supported_by=INSPECT.
        location_id (str):
            Deprecated. This field has no effect.
    """

    parent = proto.Field(
        proto.STRING,
        number=4,
    )
    language_code = proto.Field(
        proto.STRING,
        number=1,
    )
    filter = proto.Field(
        proto.STRING,
        number=2,
    )
    location_id = proto.Field(
        proto.STRING,
        number=3,
    )


class ListInfoTypesResponse(proto.Message):
    r"""Response to the ListInfoTypes request.

    Attributes:
        info_types (Sequence[google.cloud.dlp_v2.types.InfoTypeDescription]):
            Set of sensitive infoTypes.
    """

    info_types = proto.RepeatedField(
        proto.MESSAGE,
        number=1,
        message="InfoTypeDescription",
    )


class RiskAnalysisJobConfig(proto.Message):
    r"""Configuration for a risk analysis job. See
    https://cloud.google.com/dlp/docs/concepts-risk-analysis to
    learn more.

    Attributes:
        privacy_metric (google.cloud.dlp_v2.types.PrivacyMetric):
            Privacy metric to compute.
        source_table (google.cloud.dlp_v2.types.BigQueryTable):
            Input dataset to compute metrics over.
        actions (Sequence[google.cloud.dlp_v2.types.Action]):
            Actions to execute at the completion of the
            job. Are executed in the order provided.
    """

    privacy_metric = proto.Field(
        proto.MESSAGE,
        number=1,
        message="PrivacyMetric",
    )
    source_table = proto.Field(
        proto.MESSAGE,
        number=2,
        message=storage.BigQueryTable,
    )
    actions = proto.RepeatedField(
        proto.MESSAGE,
        number=3,
        message="Action",
    )


class QuasiId(proto.Message):
    r"""A column with a semantic tag attached.

    This message has `oneof`_ fields (mutually exclusive fields).
    For each oneof, at most one member field can be set at the same time.
    Setting any member of the oneof automatically clears all other
    members.

    .. _oneof: https://proto-plus-python.readthedocs.io/en/stable/fields.html#oneofs-mutually-exclusive-fields

    Attributes:
        field (google.cloud.dlp_v2.types.FieldId):
            Required. Identifies the column.
        info_type (google.cloud.dlp_v2.types.InfoType):
            A column can be tagged with a InfoType to use the relevant
            public dataset as a statistical model of population, if
            available. We currently support US ZIP codes, region codes,
            ages and genders. To programmatically obtain the list of
            supported InfoTypes, use ListInfoTypes with the
            supported_by=RISK_ANALYSIS filter.

            This field is a member of `oneof`_ ``tag``.
        custom_tag (str):
            A column can be tagged with a custom tag. In
            this case, the user must indicate an auxiliary
            table that contains statistical information on
            the possible values of this column (below).

            This field is a member of `oneof`_ ``tag``.
        inferred (google.protobuf.empty_pb2.Empty):
            If no semantic tag is indicated, we infer the
            statistical model from the distribution of
            values in the input data

            This field is a member of `oneof`_ ``tag``.
    """

    field = proto.Field(
        proto.MESSAGE,
        number=1,
        message=storage.FieldId,
    )
    info_type = proto.Field(
        proto.MESSAGE,
        number=2,
        oneof="tag",
        message=storage.InfoType,
    )
    custom_tag = proto.Field(
        proto.STRING,
        number=3,
        oneof="tag",
    )
    inferred = proto.Field(
        proto.MESSAGE,
        number=4,
        oneof="tag",
        message=empty_pb2.Empty,
    )


class StatisticalTable(proto.Message):
    r"""An auxiliary table containing statistical information on the
    relative frequency of different quasi-identifiers values. It has
    one or several quasi-identifiers columns, and one column that
    indicates the relative frequency of each quasi-identifier tuple.
    If a tuple is present in the data but not in the auxiliary
    table, the corresponding relative frequency is assumed to be
    zero (and thus, the tuple is highly reidentifiable).

    Attributes:
        table (google.cloud.dlp_v2.types.BigQueryTable):
            Required. Auxiliary table location.
        quasi_ids (Sequence[google.cloud.dlp_v2.types.StatisticalTable.QuasiIdentifierField]):
            Required. Quasi-identifier columns.
        relative_frequency (google.cloud.dlp_v2.types.FieldId):
            Required. The relative frequency column must
            contain a floating-point number between 0 and 1
            (inclusive). Null values are assumed to be zero.
    """

    class QuasiIdentifierField(proto.Message):
        r"""A quasi-identifier column has a custom_tag, used to know which
        column in the data corresponds to which column in the statistical
        model.

        Attributes:
            field (google.cloud.dlp_v2.types.FieldId):
                Identifies the column.
            custom_tag (str):
                A column can be tagged with a custom tag. In
                this case, the user must indicate an auxiliary
                table that contains statistical information on
                the possible values of this column (below).
        """

        field = proto.Field(
            proto.MESSAGE,
            number=1,
            message=storage.FieldId,
        )
        custom_tag = proto.Field(
            proto.STRING,
            number=2,
        )

    table = proto.Field(
        proto.MESSAGE,
        number=3,
        message=storage.BigQueryTable,
    )
    quasi_ids = proto.RepeatedField(
        proto.MESSAGE,
        number=1,
        message=QuasiIdentifierField,
    )
    relative_frequency = proto.Field(
        proto.MESSAGE,
        number=2,
        message=storage.FieldId,
    )


class PrivacyMetric(proto.Message):
    r"""Privacy metric to compute for reidentification risk analysis.

    This message has `oneof`_ fields (mutually exclusive fields).
    For each oneof, at most one member field can be set at the same time.
    Setting any member of the oneof automatically clears all other
    members.

    .. _oneof: https://proto-plus-python.readthedocs.io/en/stable/fields.html#oneofs-mutually-exclusive-fields

    Attributes:
        numerical_stats_config (google.cloud.dlp_v2.types.PrivacyMetric.NumericalStatsConfig):
            Numerical stats

            This field is a member of `oneof`_ ``type``.
        categorical_stats_config (google.cloud.dlp_v2.types.PrivacyMetric.CategoricalStatsConfig):
            Categorical stats

            This field is a member of `oneof`_ ``type``.
        k_anonymity_config (google.cloud.dlp_v2.types.PrivacyMetric.KAnonymityConfig):
            K-anonymity

            This field is a member of `oneof`_ ``type``.
        l_diversity_config (google.cloud.dlp_v2.types.PrivacyMetric.LDiversityConfig):
            l-diversity

            This field is a member of `oneof`_ ``type``.
        k_map_estimation_config (google.cloud.dlp_v2.types.PrivacyMetric.KMapEstimationConfig):
            k-map

            This field is a member of `oneof`_ ``type``.
        delta_presence_estimation_config (google.cloud.dlp_v2.types.PrivacyMetric.DeltaPresenceEstimationConfig):
            delta-presence

            This field is a member of `oneof`_ ``type``.
    """

    class NumericalStatsConfig(proto.Message):
        r"""Compute numerical stats over an individual column, including
        min, max, and quantiles.

        Attributes:
            field (google.cloud.dlp_v2.types.FieldId):
                Field to compute numerical stats on.
                Supported types are integer, float, date,
                datetime, timestamp, time.
        """

        field = proto.Field(
            proto.MESSAGE,
            number=1,
            message=storage.FieldId,
        )

    class CategoricalStatsConfig(proto.Message):
        r"""Compute numerical stats over an individual column, including
        number of distinct values and value count distribution.

        Attributes:
            field (google.cloud.dlp_v2.types.FieldId):
                Field to compute categorical stats on. All
                column types are supported except for arrays and
                structs. However, it may be more informative to
                use NumericalStats when the field type is
                supported, depending on the data.
        """

        field = proto.Field(
            proto.MESSAGE,
            number=1,
            message=storage.FieldId,
        )

    class KAnonymityConfig(proto.Message):
        r"""k-anonymity metric, used for analysis of reidentification
        risk.

        Attributes:
            quasi_ids (Sequence[google.cloud.dlp_v2.types.FieldId]):
                Set of fields to compute k-anonymity over.
                When multiple fields are specified, they are
                considered a single composite key. Structs and
                repeated data types are not supported; however,
                nested fields are supported so long as they are
                not structs themselves or nested within a
                repeated field.
            entity_id (google.cloud.dlp_v2.types.EntityId):
                Message indicating that multiple rows might be associated to
                a single individual. If the same entity_id is associated to
                multiple quasi-identifier tuples over distinct rows, we
                consider the entire collection of tuples as the composite
                quasi-identifier. This collection is a multiset: the order
                in which the different tuples appear in the dataset is
                ignored, but their frequency is taken into account.

                Important note: a maximum of 1000 rows can be associated to
                a single entity ID. If more rows are associated with the
                same entity ID, some might be ignored.
        """

        quasi_ids = proto.RepeatedField(
            proto.MESSAGE,
            number=1,
            message=storage.FieldId,
        )
        entity_id = proto.Field(
            proto.MESSAGE,
            number=2,
            message=storage.EntityId,
        )

    class LDiversityConfig(proto.Message):
        r"""l-diversity metric, used for analysis of reidentification
        risk.

        Attributes:
            quasi_ids (Sequence[google.cloud.dlp_v2.types.FieldId]):
                Set of quasi-identifiers indicating how
                equivalence classes are defined for the
                l-diversity computation. When multiple fields
                are specified, they are considered a single
                composite key.
            sensitive_attribute (google.cloud.dlp_v2.types.FieldId):
                Sensitive field for computing the l-value.
        """

        quasi_ids = proto.RepeatedField(
            proto.MESSAGE,
            number=1,
            message=storage.FieldId,
        )
        sensitive_attribute = proto.Field(
            proto.MESSAGE,
            number=2,
            message=storage.FieldId,
        )

    class KMapEstimationConfig(proto.Message):
        r"""Reidentifiability metric. This corresponds to a risk model
        similar to what is called "journalist risk" in the literature,
        except the attack dataset is statistically modeled instead of
        being perfectly known. This can be done using publicly available
        data (like the US Census), or using a custom statistical model
        (indicated as one or several BigQuery tables), or by
        extrapolating from the distribution of values in the input
        dataset.

        Attributes:
            quasi_ids (Sequence[google.cloud.dlp_v2.types.PrivacyMetric.KMapEstimationConfig.TaggedField]):
                Required. Fields considered to be
                quasi-identifiers. No two columns can have the
                same tag.
            region_code (str):
                ISO 3166-1 alpha-2 region code to use in the statistical
                modeling. Set if no column is tagged with a region-specific
                InfoType (like US_ZIP_5) or a region code.
            auxiliary_tables (Sequence[google.cloud.dlp_v2.types.PrivacyMetric.KMapEstimationConfig.AuxiliaryTable]):
                Several auxiliary tables can be used in the analysis. Each
                custom_tag used to tag a quasi-identifiers column must
                appear in exactly one column of one auxiliary table.
        """

        class TaggedField(proto.Message):
            r"""A column with a semantic tag attached.

            This message has `oneof`_ fields (mutually exclusive fields).
            For each oneof, at most one member field can be set at the same time.
            Setting any member of the oneof automatically clears all other
            members.

            .. _oneof: https://proto-plus-python.readthedocs.io/en/stable/fields.html#oneofs-mutually-exclusive-fields

            Attributes:
                field (google.cloud.dlp_v2.types.FieldId):
                    Required. Identifies the column.
                info_type (google.cloud.dlp_v2.types.InfoType):
                    A column can be tagged with a InfoType to use the relevant
                    public dataset as a statistical model of population, if
                    available. We currently support US ZIP codes, region codes,
                    ages and genders. To programmatically obtain the list of
                    supported InfoTypes, use ListInfoTypes with the
                    supported_by=RISK_ANALYSIS filter.

                    This field is a member of `oneof`_ ``tag``.
                custom_tag (str):
                    A column can be tagged with a custom tag. In
                    this case, the user must indicate an auxiliary
                    table that contains statistical information on
                    the possible values of this column (below).

                    This field is a member of `oneof`_ ``tag``.
                inferred (google.protobuf.empty_pb2.Empty):
                    If no semantic tag is indicated, we infer the
                    statistical model from the distribution of
                    values in the input data

                    This field is a member of `oneof`_ ``tag``.
            """

            field = proto.Field(
                proto.MESSAGE,
                number=1,
                message=storage.FieldId,
            )
            info_type = proto.Field(
                proto.MESSAGE,
                number=2,
                oneof="tag",
                message=storage.InfoType,
            )
            custom_tag = proto.Field(
                proto.STRING,
                number=3,
                oneof="tag",
            )
            inferred = proto.Field(
                proto.MESSAGE,
                number=4,
                oneof="tag",
                message=empty_pb2.Empty,
            )

        class AuxiliaryTable(proto.Message):
            r"""An auxiliary table contains statistical information on the
            relative frequency of different quasi-identifiers values. It has
            one or several quasi-identifiers columns, and one column that
            indicates the relative frequency of each quasi-identifier tuple.
            If a tuple is present in the data but not in the auxiliary
            table, the corresponding relative frequency is assumed to be
            zero (and thus, the tuple is highly reidentifiable).

            Attributes:
                table (google.cloud.dlp_v2.types.BigQueryTable):
                    Required. Auxiliary table location.
                quasi_ids (Sequence[google.cloud.dlp_v2.types.PrivacyMetric.KMapEstimationConfig.AuxiliaryTable.QuasiIdField]):
                    Required. Quasi-identifier columns.
                relative_frequency (google.cloud.dlp_v2.types.FieldId):
                    Required. The relative frequency column must
                    contain a floating-point number between 0 and 1
                    (inclusive). Null values are assumed to be zero.
            """

            class QuasiIdField(proto.Message):
                r"""A quasi-identifier column has a custom_tag, used to know which
                column in the data corresponds to which column in the statistical
                model.

                Attributes:
                    field (google.cloud.dlp_v2.types.FieldId):
                        Identifies the column.
                    custom_tag (str):
                        A auxiliary field.
                """

                field = proto.Field(
                    proto.MESSAGE,
                    number=1,
                    message=storage.FieldId,
                )
                custom_tag = proto.Field(
                    proto.STRING,
                    number=2,
                )

            table = proto.Field(
                proto.MESSAGE,
                number=3,
                message=storage.BigQueryTable,
            )
            quasi_ids = proto.RepeatedField(
                proto.MESSAGE,
                number=1,
                message="PrivacyMetric.KMapEstimationConfig.AuxiliaryTable.QuasiIdField",
            )
            relative_frequency = proto.Field(
                proto.MESSAGE,
                number=2,
                message=storage.FieldId,
            )

        quasi_ids = proto.RepeatedField(
            proto.MESSAGE,
            number=1,
            message="PrivacyMetric.KMapEstimationConfig.TaggedField",
        )
        region_code = proto.Field(
            proto.STRING,
            number=2,
        )
        auxiliary_tables = proto.RepeatedField(
            proto.MESSAGE,
            number=3,
            message="PrivacyMetric.KMapEstimationConfig.AuxiliaryTable",
        )

    class DeltaPresenceEstimationConfig(proto.Message):
        r"""δ-presence metric, used to estimate how likely it is for an
        attacker to figure out that one given individual appears in a
        de-identified dataset. Similarly to the k-map metric, we cannot
        compute δ-presence exactly without knowing the attack dataset,
        so we use a statistical model instead.

        Attributes:
            quasi_ids (Sequence[google.cloud.dlp_v2.types.QuasiId]):
                Required. Fields considered to be
                quasi-identifiers. No two fields can have the
                same tag.
            region_code (str):
                ISO 3166-1 alpha-2 region code to use in the statistical
                modeling. Set if no column is tagged with a region-specific
                InfoType (like US_ZIP_5) or a region code.
            auxiliary_tables (Sequence[google.cloud.dlp_v2.types.StatisticalTable]):
                Several auxiliary tables can be used in the analysis. Each
                custom_tag used to tag a quasi-identifiers field must appear
                in exactly one field of one auxiliary table.
        """

        quasi_ids = proto.RepeatedField(
            proto.MESSAGE,
            number=1,
            message="QuasiId",
        )
        region_code = proto.Field(
            proto.STRING,
            number=2,
        )
        auxiliary_tables = proto.RepeatedField(
            proto.MESSAGE,
            number=3,
            message="StatisticalTable",
        )

    numerical_stats_config = proto.Field(
        proto.MESSAGE,
        number=1,
        oneof="type",
        message=NumericalStatsConfig,
    )
    categorical_stats_config = proto.Field(
        proto.MESSAGE,
        number=2,
        oneof="type",
        message=CategoricalStatsConfig,
    )
    k_anonymity_config = proto.Field(
        proto.MESSAGE,
        number=3,
        oneof="type",
        message=KAnonymityConfig,
    )
    l_diversity_config = proto.Field(
        proto.MESSAGE,
        number=4,
        oneof="type",
        message=LDiversityConfig,
    )
    k_map_estimation_config = proto.Field(
        proto.MESSAGE,
        number=5,
        oneof="type",
        message=KMapEstimationConfig,
    )
    delta_presence_estimation_config = proto.Field(
        proto.MESSAGE,
        number=6,
        oneof="type",
        message=DeltaPresenceEstimationConfig,
    )


class AnalyzeDataSourceRiskDetails(proto.Message):
    r"""Result of a risk analysis operation request.

    This message has `oneof`_ fields (mutually exclusive fields).
    For each oneof, at most one member field can be set at the same time.
    Setting any member of the oneof automatically clears all other
    members.

    .. _oneof: https://proto-plus-python.readthedocs.io/en/stable/fields.html#oneofs-mutually-exclusive-fields

    Attributes:
        requested_privacy_metric (google.cloud.dlp_v2.types.PrivacyMetric):
            Privacy metric to compute.
        requested_source_table (google.cloud.dlp_v2.types.BigQueryTable):
            Input dataset to compute metrics over.
        numerical_stats_result (google.cloud.dlp_v2.types.AnalyzeDataSourceRiskDetails.NumericalStatsResult):
            Numerical stats result

            This field is a member of `oneof`_ ``result``.
        categorical_stats_result (google.cloud.dlp_v2.types.AnalyzeDataSourceRiskDetails.CategoricalStatsResult):
            Categorical stats result

            This field is a member of `oneof`_ ``result``.
        k_anonymity_result (google.cloud.dlp_v2.types.AnalyzeDataSourceRiskDetails.KAnonymityResult):
            K-anonymity result

            This field is a member of `oneof`_ ``result``.
        l_diversity_result (google.cloud.dlp_v2.types.AnalyzeDataSourceRiskDetails.LDiversityResult):
            L-divesity result

            This field is a member of `oneof`_ ``result``.
        k_map_estimation_result (google.cloud.dlp_v2.types.AnalyzeDataSourceRiskDetails.KMapEstimationResult):
            K-map result

            This field is a member of `oneof`_ ``result``.
        delta_presence_estimation_result (google.cloud.dlp_v2.types.AnalyzeDataSourceRiskDetails.DeltaPresenceEstimationResult):
            Delta-presence result

            This field is a member of `oneof`_ ``result``.
        requested_options (google.cloud.dlp_v2.types.AnalyzeDataSourceRiskDetails.RequestedRiskAnalysisOptions):
            The configuration used for this job.
    """

    class NumericalStatsResult(proto.Message):
        r"""Result of the numerical stats computation.

        Attributes:
            min_value (google.cloud.dlp_v2.types.Value):
                Minimum value appearing in the column.
            max_value (google.cloud.dlp_v2.types.Value):
                Maximum value appearing in the column.
            quantile_values (Sequence[google.cloud.dlp_v2.types.Value]):
                List of 99 values that partition the set of
                field values into 100 equal sized buckets.
        """

        min_value = proto.Field(
            proto.MESSAGE,
            number=1,
            message="Value",
        )
        max_value = proto.Field(
            proto.MESSAGE,
            number=2,
            message="Value",
        )
        quantile_values = proto.RepeatedField(
            proto.MESSAGE,
            number=4,
            message="Value",
        )

    class CategoricalStatsResult(proto.Message):
        r"""Result of the categorical stats computation.

        Attributes:
            value_frequency_histogram_buckets (Sequence[google.cloud.dlp_v2.types.AnalyzeDataSourceRiskDetails.CategoricalStatsResult.CategoricalStatsHistogramBucket]):
                Histogram of value frequencies in the column.
        """

        class CategoricalStatsHistogramBucket(proto.Message):
            r"""Histogram of value frequencies in the column.

            Attributes:
                value_frequency_lower_bound (int):
                    Lower bound on the value frequency of the
                    values in this bucket.
                value_frequency_upper_bound (int):
                    Upper bound on the value frequency of the
                    values in this bucket.
                bucket_size (int):
                    Total number of values in this bucket.
                bucket_values (Sequence[google.cloud.dlp_v2.types.ValueFrequency]):
                    Sample of value frequencies in this bucket.
                    The total number of values returned per bucket
                    is capped at 20.
                bucket_value_count (int):
                    Total number of distinct values in this
                    bucket.
            """

            value_frequency_lower_bound = proto.Field(
                proto.INT64,
                number=1,
            )
            value_frequency_upper_bound = proto.Field(
                proto.INT64,
                number=2,
            )
            bucket_size = proto.Field(
                proto.INT64,
                number=3,
            )
            bucket_values = proto.RepeatedField(
                proto.MESSAGE,
                number=4,
                message="ValueFrequency",
            )
            bucket_value_count = proto.Field(
                proto.INT64,
                number=5,
            )

        value_frequency_histogram_buckets = proto.RepeatedField(
            proto.MESSAGE,
            number=5,
            message="AnalyzeDataSourceRiskDetails.CategoricalStatsResult.CategoricalStatsHistogramBucket",
        )

    class KAnonymityResult(proto.Message):
        r"""Result of the k-anonymity computation.

        Attributes:
            equivalence_class_histogram_buckets (Sequence[google.cloud.dlp_v2.types.AnalyzeDataSourceRiskDetails.KAnonymityResult.KAnonymityHistogramBucket]):
                Histogram of k-anonymity equivalence classes.
        """

        class KAnonymityEquivalenceClass(proto.Message):
            r"""The set of columns' values that share the same ldiversity
            value

            Attributes:
                quasi_ids_values (Sequence[google.cloud.dlp_v2.types.Value]):
                    Set of values defining the equivalence class.
                    One value per quasi-identifier column in the
                    original KAnonymity metric message. The order is
                    always the same as the original request.
                equivalence_class_size (int):
                    Size of the equivalence class, for example
                    number of rows with the above set of values.
            """

            quasi_ids_values = proto.RepeatedField(
                proto.MESSAGE,
                number=1,
                message="Value",
            )
            equivalence_class_size = proto.Field(
                proto.INT64,
                number=2,
            )

        class KAnonymityHistogramBucket(proto.Message):
            r"""Histogram of k-anonymity equivalence classes.

            Attributes:
                equivalence_class_size_lower_bound (int):
                    Lower bound on the size of the equivalence
                    classes in this bucket.
                equivalence_class_size_upper_bound (int):
                    Upper bound on the size of the equivalence
                    classes in this bucket.
                bucket_size (int):
                    Total number of equivalence classes in this
                    bucket.
                bucket_values (Sequence[google.cloud.dlp_v2.types.AnalyzeDataSourceRiskDetails.KAnonymityResult.KAnonymityEquivalenceClass]):
                    Sample of equivalence classes in this bucket.
                    The total number of classes returned per bucket
                    is capped at 20.
                bucket_value_count (int):
                    Total number of distinct equivalence classes
                    in this bucket.
            """

            equivalence_class_size_lower_bound = proto.Field(
                proto.INT64,
                number=1,
            )
            equivalence_class_size_upper_bound = proto.Field(
                proto.INT64,
                number=2,
            )
            bucket_size = proto.Field(
                proto.INT64,
                number=3,
            )
            bucket_values = proto.RepeatedField(
                proto.MESSAGE,
                number=4,
                message="AnalyzeDataSourceRiskDetails.KAnonymityResult.KAnonymityEquivalenceClass",
            )
            bucket_value_count = proto.Field(
                proto.INT64,
                number=5,
            )

        equivalence_class_histogram_buckets = proto.RepeatedField(
            proto.MESSAGE,
            number=5,
            message="AnalyzeDataSourceRiskDetails.KAnonymityResult.KAnonymityHistogramBucket",
        )

    class LDiversityResult(proto.Message):
        r"""Result of the l-diversity computation.

        Attributes:
            sensitive_value_frequency_histogram_buckets (Sequence[google.cloud.dlp_v2.types.AnalyzeDataSourceRiskDetails.LDiversityResult.LDiversityHistogramBucket]):
                Histogram of l-diversity equivalence class
                sensitive value frequencies.
        """

        class LDiversityEquivalenceClass(proto.Message):
            r"""The set of columns' values that share the same ldiversity
            value.

            Attributes:
                quasi_ids_values (Sequence[google.cloud.dlp_v2.types.Value]):
                    Quasi-identifier values defining the
                    k-anonymity equivalence class. The order is
                    always the same as the original request.
                equivalence_class_size (int):
                    Size of the k-anonymity equivalence class.
                num_distinct_sensitive_values (int):
                    Number of distinct sensitive values in this
                    equivalence class.
                top_sensitive_values (Sequence[google.cloud.dlp_v2.types.ValueFrequency]):
                    Estimated frequencies of top sensitive
                    values.
            """

            quasi_ids_values = proto.RepeatedField(
                proto.MESSAGE,
                number=1,
                message="Value",
            )
            equivalence_class_size = proto.Field(
                proto.INT64,
                number=2,
            )
            num_distinct_sensitive_values = proto.Field(
                proto.INT64,
                number=3,
            )
            top_sensitive_values = proto.RepeatedField(
                proto.MESSAGE,
                number=4,
                message="ValueFrequency",
            )

        class LDiversityHistogramBucket(proto.Message):
            r"""Histogram of l-diversity equivalence class sensitive value
            frequencies.

            Attributes:
                sensitive_value_frequency_lower_bound (int):
                    Lower bound on the sensitive value
                    frequencies of the equivalence classes in this
                    bucket.
                sensitive_value_frequency_upper_bound (int):
                    Upper bound on the sensitive value
                    frequencies of the equivalence classes in this
                    bucket.
                bucket_size (int):
                    Total number of equivalence classes in this
                    bucket.
                bucket_values (Sequence[google.cloud.dlp_v2.types.AnalyzeDataSourceRiskDetails.LDiversityResult.LDiversityEquivalenceClass]):
                    Sample of equivalence classes in this bucket.
                    The total number of classes returned per bucket
                    is capped at 20.
                bucket_value_count (int):
                    Total number of distinct equivalence classes
                    in this bucket.
            """

            sensitive_value_frequency_lower_bound = proto.Field(
                proto.INT64,
                number=1,
            )
            sensitive_value_frequency_upper_bound = proto.Field(
                proto.INT64,
                number=2,
            )
            bucket_size = proto.Field(
                proto.INT64,
                number=3,
            )
            bucket_values = proto.RepeatedField(
                proto.MESSAGE,
                number=4,
                message="AnalyzeDataSourceRiskDetails.LDiversityResult.LDiversityEquivalenceClass",
            )
            bucket_value_count = proto.Field(
                proto.INT64,
                number=5,
            )

        sensitive_value_frequency_histogram_buckets = proto.RepeatedField(
            proto.MESSAGE,
            number=5,
            message="AnalyzeDataSourceRiskDetails.LDiversityResult.LDiversityHistogramBucket",
        )

    class KMapEstimationResult(proto.Message):
        r"""Result of the reidentifiability analysis. Note that these
        results are an estimation, not exact values.

        Attributes:
            k_map_estimation_histogram (Sequence[google.cloud.dlp_v2.types.AnalyzeDataSourceRiskDetails.KMapEstimationResult.KMapEstimationHistogramBucket]):
                The intervals [min_anonymity, max_anonymity] do not overlap.
                If a value doesn't correspond to any such interval, the
                associated frequency is zero. For example, the following
                records: {min_anonymity: 1, max_anonymity: 1, frequency: 17}
                {min_anonymity: 2, max_anonymity: 3, frequency: 42}
                {min_anonymity: 5, max_anonymity: 10, frequency: 99} mean
                that there are no record with an estimated anonymity of 4,
                5, or larger than 10.
        """

        class KMapEstimationQuasiIdValues(proto.Message):
            r"""A tuple of values for the quasi-identifier columns.

            Attributes:
                quasi_ids_values (Sequence[google.cloud.dlp_v2.types.Value]):
                    The quasi-identifier values.
                estimated_anonymity (int):
                    The estimated anonymity for these
                    quasi-identifier values.
            """

            quasi_ids_values = proto.RepeatedField(
                proto.MESSAGE,
                number=1,
                message="Value",
            )
            estimated_anonymity = proto.Field(
                proto.INT64,
                number=2,
            )

        class KMapEstimationHistogramBucket(proto.Message):
            r"""A KMapEstimationHistogramBucket message with the following values:
            min_anonymity: 3 max_anonymity: 5 frequency: 42 means that there are
            42 records whose quasi-identifier values correspond to 3, 4 or 5
            people in the overlying population. An important particular case is
            when min_anonymity = max_anonymity = 1: the frequency field then
            corresponds to the number of uniquely identifiable records.

            Attributes:
                min_anonymity (int):
                    Always positive.
                max_anonymity (int):
                    Always greater than or equal to min_anonymity.
                bucket_size (int):
                    Number of records within these anonymity
                    bounds.
                bucket_values (Sequence[google.cloud.dlp_v2.types.AnalyzeDataSourceRiskDetails.KMapEstimationResult.KMapEstimationQuasiIdValues]):
                    Sample of quasi-identifier tuple values in
                    this bucket. The total number of classes
                    returned per bucket is capped at 20.
                bucket_value_count (int):
                    Total number of distinct quasi-identifier
                    tuple values in this bucket.
            """

            min_anonymity = proto.Field(
                proto.INT64,
                number=1,
            )
            max_anonymity = proto.Field(
                proto.INT64,
                number=2,
            )
            bucket_size = proto.Field(
                proto.INT64,
                number=5,
            )
            bucket_values = proto.RepeatedField(
                proto.MESSAGE,
                number=6,
                message="AnalyzeDataSourceRiskDetails.KMapEstimationResult.KMapEstimationQuasiIdValues",
            )
            bucket_value_count = proto.Field(
                proto.INT64,
                number=7,
            )

        k_map_estimation_histogram = proto.RepeatedField(
            proto.MESSAGE,
            number=1,
            message="AnalyzeDataSourceRiskDetails.KMapEstimationResult.KMapEstimationHistogramBucket",
        )

    class DeltaPresenceEstimationResult(proto.Message):
        r"""Result of the δ-presence computation. Note that these results
        are an estimation, not exact values.

        Attributes:
            delta_presence_estimation_histogram (Sequence[google.cloud.dlp_v2.types.AnalyzeDataSourceRiskDetails.DeltaPresenceEstimationResult.DeltaPresenceEstimationHistogramBucket]):
                The intervals [min_probability, max_probability) do not
                overlap. If a value doesn't correspond to any such interval,
                the associated frequency is zero. For example, the following
                records: {min_probability: 0, max_probability: 0.1,
                frequency: 17} {min_probability: 0.2, max_probability: 0.3,
                frequency: 42} {min_probability: 0.3, max_probability: 0.4,
                frequency: 99} mean that there are no record with an
                estimated probability in [0.1, 0.2) nor larger or equal to
                0.4.
        """

        class DeltaPresenceEstimationQuasiIdValues(proto.Message):
            r"""A tuple of values for the quasi-identifier columns.

            Attributes:
                quasi_ids_values (Sequence[google.cloud.dlp_v2.types.Value]):
                    The quasi-identifier values.
                estimated_probability (float):
                    The estimated probability that a given individual sharing
                    these quasi-identifier values is in the dataset. This value,
                    typically called δ, is the ratio between the number of
                    records in the dataset with these quasi-identifier values,
                    and the total number of individuals (inside *and* outside
                    the dataset) with these quasi-identifier values. For
                    example, if there are 15 individuals in the dataset who
                    share the same quasi-identifier values, and an estimated 100
                    people in the entire population with these values, then δ is
                    0.15.
            """

            quasi_ids_values = proto.RepeatedField(
                proto.MESSAGE,
                number=1,
                message="Value",
            )
            estimated_probability = proto.Field(
                proto.DOUBLE,
                number=2,
            )

        class DeltaPresenceEstimationHistogramBucket(proto.Message):
            r"""A DeltaPresenceEstimationHistogramBucket message with the following
            values: min_probability: 0.1 max_probability: 0.2 frequency: 42
            means that there are 42 records for which δ is in [0.1, 0.2). An
            important particular case is when min_probability = max_probability
            = 1: then, every individual who shares this quasi-identifier
            combination is in the dataset.

            Attributes:
                min_probability (float):
                    Between 0 and 1.
                max_probability (float):
                    Always greater than or equal to min_probability.
                bucket_size (int):
                    Number of records within these probability
                    bounds.
                bucket_values (Sequence[google.cloud.dlp_v2.types.AnalyzeDataSourceRiskDetails.DeltaPresenceEstimationResult.DeltaPresenceEstimationQuasiIdValues]):
                    Sample of quasi-identifier tuple values in
                    this bucket. The total number of classes
                    returned per bucket is capped at 20.
                bucket_value_count (int):
                    Total number of distinct quasi-identifier
                    tuple values in this bucket.
            """

            min_probability = proto.Field(
                proto.DOUBLE,
                number=1,
            )
            max_probability = proto.Field(
                proto.DOUBLE,
                number=2,
            )
            bucket_size = proto.Field(
                proto.INT64,
                number=5,
            )
            bucket_values = proto.RepeatedField(
                proto.MESSAGE,
                number=6,
                message="AnalyzeDataSourceRiskDetails.DeltaPresenceEstimationResult.DeltaPresenceEstimationQuasiIdValues",
            )
            bucket_value_count = proto.Field(
                proto.INT64,
                number=7,
            )

        delta_presence_estimation_histogram = proto.RepeatedField(
            proto.MESSAGE,
            number=1,
            message="AnalyzeDataSourceRiskDetails.DeltaPresenceEstimationResult.DeltaPresenceEstimationHistogramBucket",
        )

    class RequestedRiskAnalysisOptions(proto.Message):
        r"""Risk analysis options.

        Attributes:
            job_config (google.cloud.dlp_v2.types.RiskAnalysisJobConfig):
                The job config for the risk job.
        """

        job_config = proto.Field(
            proto.MESSAGE,
            number=1,
            message="RiskAnalysisJobConfig",
        )

    requested_privacy_metric = proto.Field(
        proto.MESSAGE,
        number=1,
        message="PrivacyMetric",
    )
    requested_source_table = proto.Field(
        proto.MESSAGE,
        number=2,
        message=storage.BigQueryTable,
    )
    numerical_stats_result = proto.Field(
        proto.MESSAGE,
        number=3,
        oneof="result",
        message=NumericalStatsResult,
    )
    categorical_stats_result = proto.Field(
        proto.MESSAGE,
        number=4,
        oneof="result",
        message=CategoricalStatsResult,
    )
    k_anonymity_result = proto.Field(
        proto.MESSAGE,
        number=5,
        oneof="result",
        message=KAnonymityResult,
    )
    l_diversity_result = proto.Field(
        proto.MESSAGE,
        number=6,
        oneof="result",
        message=LDiversityResult,
    )
    k_map_estimation_result = proto.Field(
        proto.MESSAGE,
        number=7,
        oneof="result",
        message=KMapEstimationResult,
    )
    delta_presence_estimation_result = proto.Field(
        proto.MESSAGE,
        number=9,
        oneof="result",
        message=DeltaPresenceEstimationResult,
    )
    requested_options = proto.Field(
        proto.MESSAGE,
        number=10,
        message=RequestedRiskAnalysisOptions,
    )


class ValueFrequency(proto.Message):
    r"""A value of a field, including its frequency.

    Attributes:
        value (google.cloud.dlp_v2.types.Value):
            A value contained in the field in question.
        count (int):
            How many times the value is contained in the
            field.
    """

    value = proto.Field(
        proto.MESSAGE,
        number=1,
        message="Value",
    )
    count = proto.Field(
        proto.INT64,
        number=2,
    )


class Value(proto.Message):
    r"""Set of primitive values supported by the system. Note that for the
    purposes of inspection or transformation, the number of bytes
    considered to comprise a 'Value' is based on its representation as a
    UTF-8 encoded string. For example, if 'integer_value' is set to
    123456789, the number of bytes would be counted as 9, even though an
    int64 only holds up to 8 bytes of data.

    This message has `oneof`_ fields (mutually exclusive fields).
    For each oneof, at most one member field can be set at the same time.
    Setting any member of the oneof automatically clears all other
    members.

    .. _oneof: https://proto-plus-python.readthedocs.io/en/stable/fields.html#oneofs-mutually-exclusive-fields

    Attributes:
        integer_value (int):
            integer

            This field is a member of `oneof`_ ``type``.
        float_value (float):
            float

            This field is a member of `oneof`_ ``type``.
        string_value (str):
            string

            This field is a member of `oneof`_ ``type``.
        boolean_value (bool):
            boolean

            This field is a member of `oneof`_ ``type``.
        timestamp_value (google.protobuf.timestamp_pb2.Timestamp):
            timestamp

            This field is a member of `oneof`_ ``type``.
        time_value (google.type.timeofday_pb2.TimeOfDay):
            time of day

            This field is a member of `oneof`_ ``type``.
        date_value (google.type.date_pb2.Date):
            date

            This field is a member of `oneof`_ ``type``.
        day_of_week_value (google.type.dayofweek_pb2.DayOfWeek):
            day of week

            This field is a member of `oneof`_ ``type``.
    """

    integer_value = proto.Field(
        proto.INT64,
        number=1,
        oneof="type",
    )
    float_value = proto.Field(
        proto.DOUBLE,
        number=2,
        oneof="type",
    )
    string_value = proto.Field(
        proto.STRING,
        number=3,
        oneof="type",
    )
    boolean_value = proto.Field(
        proto.BOOL,
        number=4,
        oneof="type",
    )
    timestamp_value = proto.Field(
        proto.MESSAGE,
        number=5,
        oneof="type",
        message=timestamp_pb2.Timestamp,
    )
    time_value = proto.Field(
        proto.MESSAGE,
        number=6,
        oneof="type",
        message=timeofday_pb2.TimeOfDay,
    )
    date_value = proto.Field(
        proto.MESSAGE,
        number=7,
        oneof="type",
        message=date_pb2.Date,
    )
    day_of_week_value = proto.Field(
        proto.ENUM,
        number=8,
        oneof="type",
        enum=dayofweek_pb2.DayOfWeek,
    )


class QuoteInfo(proto.Message):
    r"""Message for infoType-dependent details parsed from quote.

    .. _oneof: https://proto-plus-python.readthedocs.io/en/stable/fields.html#oneofs-mutually-exclusive-fields

    Attributes:
        date_time (google.cloud.dlp_v2.types.DateTime):
            The date time indicated by the quote.

            This field is a member of `oneof`_ ``parsed_quote``.
    """

    date_time = proto.Field(
        proto.MESSAGE,
        number=2,
        oneof="parsed_quote",
        message="DateTime",
    )


class DateTime(proto.Message):
    r"""Message for a date time object.
    e.g. 2018-01-01, 5th August.

    Attributes:
        date (google.type.date_pb2.Date):
            One or more of the following must be set.
            Must be a valid date or time value.
        day_of_week (google.type.dayofweek_pb2.DayOfWeek):
            Day of week
        time (google.type.timeofday_pb2.TimeOfDay):
            Time of day
        time_zone (google.cloud.dlp_v2.types.DateTime.TimeZone):
            Time zone
    """

    class TimeZone(proto.Message):
        r"""Time zone of the date time object.

        Attributes:
            offset_minutes (int):
                Set only if the offset can be determined.
                Positive for time ahead of UTC. E.g. For
                "UTC-9", this value is -540.
        """

        offset_minutes = proto.Field(
            proto.INT32,
            number=1,
        )

    date = proto.Field(
        proto.MESSAGE,
        number=1,
        message=date_pb2.Date,
    )
    day_of_week = proto.Field(
        proto.ENUM,
        number=2,
        enum=dayofweek_pb2.DayOfWeek,
    )
    time = proto.Field(
        proto.MESSAGE,
        number=3,
        message=timeofday_pb2.TimeOfDay,
    )
    time_zone = proto.Field(
        proto.MESSAGE,
        number=4,
        message=TimeZone,
    )


class DeidentifyConfig(proto.Message):
    r"""The configuration that controls how the data will change.

    This message has `oneof`_ fields (mutually exclusive fields).
    For each oneof, at most one member field can be set at the same time.
    Setting any member of the oneof automatically clears all other
    members.

    .. _oneof: https://proto-plus-python.readthedocs.io/en/stable/fields.html#oneofs-mutually-exclusive-fields

    Attributes:
        info_type_transformations (google.cloud.dlp_v2.types.InfoTypeTransformations):
            Treat the dataset as free-form text and apply
            the same free text transformation everywhere.

            This field is a member of `oneof`_ ``transformation``.
        record_transformations (google.cloud.dlp_v2.types.RecordTransformations):
            Treat the dataset as structured.
            Transformations can be applied to specific
            locations within structured datasets, such as
            transforming a column within a table.

            This field is a member of `oneof`_ ``transformation``.
        image_transformations (google.cloud.dlp_v2.types.ImageTransformations):
            Treat the dataset as an image and redact.

            This field is a member of `oneof`_ ``transformation``.
        transformation_error_handling (google.cloud.dlp_v2.types.TransformationErrorHandling):
            Mode for handling transformation errors. If left
            unspecified, the default mode is
            ``TransformationErrorHandling.ThrowError``.
    """

    info_type_transformations = proto.Field(
        proto.MESSAGE,
        number=1,
        oneof="transformation",
        message="InfoTypeTransformations",
    )
    record_transformations = proto.Field(
        proto.MESSAGE,
        number=2,
        oneof="transformation",
        message="RecordTransformations",
    )
    image_transformations = proto.Field(
        proto.MESSAGE,
        number=4,
        oneof="transformation",
        message="ImageTransformations",
    )
    transformation_error_handling = proto.Field(
        proto.MESSAGE,
        number=3,
        message="TransformationErrorHandling",
    )


class ImageTransformations(proto.Message):
    r"""A type of transformation that is applied over images.

    Attributes:
        transforms (Sequence[google.cloud.dlp_v2.types.ImageTransformations.ImageTransformation]):

    """

    class ImageTransformation(proto.Message):
        r"""Configuration for determining how redaction of images should
        occur.

        This message has `oneof`_ fields (mutually exclusive fields).
        For each oneof, at most one member field can be set at the same time.
        Setting any member of the oneof automatically clears all other
        members.

        .. _oneof: https://proto-plus-python.readthedocs.io/en/stable/fields.html#oneofs-mutually-exclusive-fields

        Attributes:
            selected_info_types (google.cloud.dlp_v2.types.ImageTransformations.ImageTransformation.SelectedInfoTypes):
                Apply transformation to the selected info_types.

                This field is a member of `oneof`_ ``target``.
            all_info_types (google.cloud.dlp_v2.types.ImageTransformations.ImageTransformation.AllInfoTypes):
                Apply transformation to all findings not specified in other
                ImageTransformation's selected_info_types. Only one instance
                is allowed within the ImageTransformations message.

                This field is a member of `oneof`_ ``target``.
            all_text (google.cloud.dlp_v2.types.ImageTransformations.ImageTransformation.AllText):
                Apply transformation to all text that doesn't
                match an infoType. Only one instance is allowed
                within the ImageTransformations message.

                This field is a member of `oneof`_ ``target``.
            redaction_color (google.cloud.dlp_v2.types.Color):
                The color to use when redacting content from
                an image. If not specified, the default is
                black.
        """

        class SelectedInfoTypes(proto.Message):
            r"""Apply transformation to the selected info_types.

            Attributes:
                info_types (Sequence[google.cloud.dlp_v2.types.InfoType]):
                    Required. InfoTypes to apply the
                    transformation to. Required. Provided InfoType
                    must be unique within the ImageTransformations
                    message.
            """

            info_types = proto.RepeatedField(
                proto.MESSAGE,
                number=5,
                message=storage.InfoType,
            )

        class AllInfoTypes(proto.Message):
            r"""Apply transformation to all findings."""

        class AllText(proto.Message):
            r"""Apply to all text."""

        selected_info_types = proto.Field(
            proto.MESSAGE,
            number=4,
            oneof="target",
            message="ImageTransformations.ImageTransformation.SelectedInfoTypes",
        )
        all_info_types = proto.Field(
            proto.MESSAGE,
            number=5,
            oneof="target",
            message="ImageTransformations.ImageTransformation.AllInfoTypes",
        )
        all_text = proto.Field(
            proto.MESSAGE,
            number=6,
            oneof="target",
            message="ImageTransformations.ImageTransformation.AllText",
        )
        redaction_color = proto.Field(
            proto.MESSAGE,
            number=3,
            message="Color",
        )

    transforms = proto.RepeatedField(
        proto.MESSAGE,
        number=2,
        message=ImageTransformation,
    )


class TransformationErrorHandling(proto.Message):
    r"""How to handle transformation errors during de-identification. A
    transformation error occurs when the requested transformation is
    incompatible with the data. For example, trying to de-identify an IP
    address using a ``DateShift`` transformation would result in a
    transformation error, since date info cannot be extracted from an IP
    address. Information about any incompatible transformations, and how
    they were handled, is returned in the response as part of the
    ``TransformationOverviews``.

    This message has `oneof`_ fields (mutually exclusive fields).
    For each oneof, at most one member field can be set at the same time.
    Setting any member of the oneof automatically clears all other
    members.

    .. _oneof: https://proto-plus-python.readthedocs.io/en/stable/fields.html#oneofs-mutually-exclusive-fields

    Attributes:
        throw_error (google.cloud.dlp_v2.types.TransformationErrorHandling.ThrowError):
            Throw an error

            This field is a member of `oneof`_ ``mode``.
        leave_untransformed (google.cloud.dlp_v2.types.TransformationErrorHandling.LeaveUntransformed):
            Ignore errors

            This field is a member of `oneof`_ ``mode``.
    """

    class ThrowError(proto.Message):
        r"""Throw an error and fail the request when a transformation
        error occurs.

        """

    class LeaveUntransformed(proto.Message):
        r"""Skips the data without modifying it if the requested transformation
        would cause an error. For example, if a ``DateShift`` transformation
        were applied an an IP address, this mode would leave the IP address
        unchanged in the response.

        """

    throw_error = proto.Field(
        proto.MESSAGE,
        number=1,
        oneof="mode",
        message=ThrowError,
    )
    leave_untransformed = proto.Field(
        proto.MESSAGE,
        number=2,
        oneof="mode",
        message=LeaveUntransformed,
    )


class PrimitiveTransformation(proto.Message):
    r"""A rule for transforming a value.

    This message has `oneof`_ fields (mutually exclusive fields).
    For each oneof, at most one member field can be set at the same time.
    Setting any member of the oneof automatically clears all other
    members.

    .. _oneof: https://proto-plus-python.readthedocs.io/en/stable/fields.html#oneofs-mutually-exclusive-fields

    Attributes:
        replace_config (google.cloud.dlp_v2.types.ReplaceValueConfig):
            Replace with a specified value.

            This field is a member of `oneof`_ ``transformation``.
        redact_config (google.cloud.dlp_v2.types.RedactConfig):
            Redact

            This field is a member of `oneof`_ ``transformation``.
        character_mask_config (google.cloud.dlp_v2.types.CharacterMaskConfig):
            Mask

            This field is a member of `oneof`_ ``transformation``.
        crypto_replace_ffx_fpe_config (google.cloud.dlp_v2.types.CryptoReplaceFfxFpeConfig):
            Ffx-Fpe

            This field is a member of `oneof`_ ``transformation``.
        fixed_size_bucketing_config (google.cloud.dlp_v2.types.FixedSizeBucketingConfig):
            Fixed size bucketing

            This field is a member of `oneof`_ ``transformation``.
        bucketing_config (google.cloud.dlp_v2.types.BucketingConfig):
            Bucketing

            This field is a member of `oneof`_ ``transformation``.
        replace_with_info_type_config (google.cloud.dlp_v2.types.ReplaceWithInfoTypeConfig):
            Replace with infotype

            This field is a member of `oneof`_ ``transformation``.
        time_part_config (google.cloud.dlp_v2.types.TimePartConfig):
            Time extraction

            This field is a member of `oneof`_ ``transformation``.
        crypto_hash_config (google.cloud.dlp_v2.types.CryptoHashConfig):
            Crypto

            This field is a member of `oneof`_ ``transformation``.
        date_shift_config (google.cloud.dlp_v2.types.DateShiftConfig):
            Date Shift

            This field is a member of `oneof`_ ``transformation``.
        crypto_deterministic_config (google.cloud.dlp_v2.types.CryptoDeterministicConfig):
            Deterministic Crypto

            This field is a member of `oneof`_ ``transformation``.
        replace_dictionary_config (google.cloud.dlp_v2.types.ReplaceDictionaryConfig):
            Replace with a value randomly drawn (with
            replacement) from a dictionary.

            This field is a member of `oneof`_ ``transformation``.
    """

    replace_config = proto.Field(
        proto.MESSAGE,
        number=1,
        oneof="transformation",
        message="ReplaceValueConfig",
    )
    redact_config = proto.Field(
        proto.MESSAGE,
        number=2,
        oneof="transformation",
        message="RedactConfig",
    )
    character_mask_config = proto.Field(
        proto.MESSAGE,
        number=3,
        oneof="transformation",
        message="CharacterMaskConfig",
    )
    crypto_replace_ffx_fpe_config = proto.Field(
        proto.MESSAGE,
        number=4,
        oneof="transformation",
        message="CryptoReplaceFfxFpeConfig",
    )
    fixed_size_bucketing_config = proto.Field(
        proto.MESSAGE,
        number=5,
        oneof="transformation",
        message="FixedSizeBucketingConfig",
    )
    bucketing_config = proto.Field(
        proto.MESSAGE,
        number=6,
        oneof="transformation",
        message="BucketingConfig",
    )
    replace_with_info_type_config = proto.Field(
        proto.MESSAGE,
        number=7,
        oneof="transformation",
        message="ReplaceWithInfoTypeConfig",
    )
    time_part_config = proto.Field(
        proto.MESSAGE,
        number=8,
        oneof="transformation",
        message="TimePartConfig",
    )
    crypto_hash_config = proto.Field(
        proto.MESSAGE,
        number=9,
        oneof="transformation",
        message="CryptoHashConfig",
    )
    date_shift_config = proto.Field(
        proto.MESSAGE,
        number=11,
        oneof="transformation",
        message="DateShiftConfig",
    )
    crypto_deterministic_config = proto.Field(
        proto.MESSAGE,
        number=12,
        oneof="transformation",
        message="CryptoDeterministicConfig",
    )
    replace_dictionary_config = proto.Field(
        proto.MESSAGE,
        number=13,
        oneof="transformation",
        message="ReplaceDictionaryConfig",
    )


class TimePartConfig(proto.Message):
    r"""For use with ``Date``, ``Timestamp``, and ``TimeOfDay``, extract or
    preserve a portion of the value.

    Attributes:
        part_to_extract (google.cloud.dlp_v2.types.TimePartConfig.TimePart):
            The part of the time to keep.
    """

    class TimePart(proto.Enum):
        r"""Components that make up time."""
        TIME_PART_UNSPECIFIED = 0
        YEAR = 1
        MONTH = 2
        DAY_OF_MONTH = 3
        DAY_OF_WEEK = 4
        WEEK_OF_YEAR = 5
        HOUR_OF_DAY = 6

    part_to_extract = proto.Field(
        proto.ENUM,
        number=1,
        enum=TimePart,
    )


class CryptoHashConfig(proto.Message):
    r"""Pseudonymization method that generates surrogates via
    cryptographic hashing. Uses SHA-256.
    The key size must be either 32 or 64 bytes.
    Outputs a base64 encoded representation of the hashed output
    (for example, L7k0BHmF1ha5U3NfGykjro4xWi1MPVQPjhMAZbSV9mM=).
    Currently, only string and integer values can be hashed. See
    https://cloud.google.com/dlp/docs/pseudonymization to learn
    more.

    Attributes:
        crypto_key (google.cloud.dlp_v2.types.CryptoKey):
            The key used by the hash function.
    """

    crypto_key = proto.Field(
        proto.MESSAGE,
        number=1,
        message="CryptoKey",
    )


class CryptoDeterministicConfig(proto.Message):
    r"""Pseudonymization method that generates deterministic
    encryption for the given input. Outputs a base64 encoded
    representation of the encrypted output. Uses AES-SIV based on
    the RFC https://tools.ietf.org/html/rfc5297.

    Attributes:
        crypto_key (google.cloud.dlp_v2.types.CryptoKey):
            The key used by the encryption function. For
            deterministic encryption using AES-SIV, the
            provided key is internally expanded to 64 bytes
            prior to use.
        surrogate_info_type (google.cloud.dlp_v2.types.InfoType):
            The custom info type to annotate the surrogate with. This
            annotation will be applied to the surrogate by prefixing it
            with the name of the custom info type followed by the number
            of characters comprising the surrogate. The following scheme
            defines the format: {info type name}({surrogate character
            count}):{surrogate}

            For example, if the name of custom info type is
            'MY_TOKEN_INFO_TYPE' and the surrogate is 'abc', the full
            replacement value will be: 'MY_TOKEN_INFO_TYPE(3):abc'

            This annotation identifies the surrogate when inspecting
            content using the custom info type 'Surrogate'. This
            facilitates reversal of the surrogate when it occurs in free
            text.

            Note: For record transformations where the entire cell in a
            table is being transformed, surrogates are not mandatory.
            Surrogates are used to denote the location of the token and
            are necessary for re-identification in free form text.

            In order for inspection to work properly, the name of this
            info type must not occur naturally anywhere in your data;
            otherwise, inspection may either

            -  reverse a surrogate that does not correspond to an actual
               identifier
            -  be unable to parse the surrogate and result in an error

            Therefore, choose your custom info type name carefully after
            considering what your data looks like. One way to select a
            name that has a high chance of yielding reliable detection
            is to include one or more unicode characters that are highly
            improbable to exist in your data. For example, assuming your
            data is entered from a regular ASCII keyboard, the symbol
            with the hex code point 29DD might be used like so:
            ⧝MY_TOKEN_TYPE.
        context (google.cloud.dlp_v2.types.FieldId):
            A context may be used for higher security and maintaining
            referential integrity such that the same identifier in two
            different contexts will be given a distinct surrogate. The
            context is appended to plaintext value being encrypted. On
            decryption the provided context is validated against the
            value used during encryption. If a context was provided
            during encryption, same context must be provided during
            decryption as well.

            If the context is not set, plaintext would be used as is for
            encryption. If the context is set but:

            1. there is no record present when transforming a given
               value or
            2. the field is not present when transforming a given value,

            plaintext would be used as is for encryption.

            Note that case (1) is expected when an
            ``InfoTypeTransformation`` is applied to both structured and
            unstructured ``ContentItem``\ s.
    """

    crypto_key = proto.Field(
        proto.MESSAGE,
        number=1,
        message="CryptoKey",
    )
    surrogate_info_type = proto.Field(
        proto.MESSAGE,
        number=2,
        message=storage.InfoType,
    )
    context = proto.Field(
        proto.MESSAGE,
        number=3,
        message=storage.FieldId,
    )


class ReplaceValueConfig(proto.Message):
    r"""Replace each input value with a given ``Value``.

    Attributes:
        new_value (google.cloud.dlp_v2.types.Value):
            Value to replace it with.
    """

    new_value = proto.Field(
        proto.MESSAGE,
        number=1,
        message="Value",
    )


class ReplaceDictionaryConfig(proto.Message):
    r"""Replace each input value with a value randomly selected from
    the dictionary.


    .. _oneof: https://proto-plus-python.readthedocs.io/en/stable/fields.html#oneofs-mutually-exclusive-fields

    Attributes:
        word_list (google.cloud.dlp_v2.types.CustomInfoType.Dictionary.WordList):
            A list of words to select from for random replacement. The
            `limits <https://cloud.google.com/dlp/limits>`__ page
            contains details about the size limits of dictionaries.

            This field is a member of `oneof`_ ``type``.
    """

    word_list = proto.Field(
        proto.MESSAGE,
        number=1,
        oneof="type",
        message=storage.CustomInfoType.Dictionary.WordList,
    )


class ReplaceWithInfoTypeConfig(proto.Message):
    r"""Replace each matching finding with the name of the info_type."""


class RedactConfig(proto.Message):
    r"""Redact a given value. For example, if used with an
    ``InfoTypeTransformation`` transforming PHONE_NUMBER, and input 'My
    phone number is 206-555-0123', the output would be 'My phone number
    is '.

    """


class CharsToIgnore(proto.Message):
    r"""Characters to skip when doing deidentification of a value.
    These will be left alone and skipped.

    This message has `oneof`_ fields (mutually exclusive fields).
    For each oneof, at most one member field can be set at the same time.
    Setting any member of the oneof automatically clears all other
    members.

    .. _oneof: https://proto-plus-python.readthedocs.io/en/stable/fields.html#oneofs-mutually-exclusive-fields

    Attributes:
        characters_to_skip (str):
            Characters to not transform when masking.

            This field is a member of `oneof`_ ``characters``.
        common_characters_to_ignore (google.cloud.dlp_v2.types.CharsToIgnore.CommonCharsToIgnore):
            Common characters to not transform when
            masking. Useful to avoid removing punctuation.

            This field is a member of `oneof`_ ``characters``.
    """

    class CommonCharsToIgnore(proto.Enum):
        r"""Convenience enum for indicating common characters to not
        transform.
        """
        COMMON_CHARS_TO_IGNORE_UNSPECIFIED = 0
        NUMERIC = 1
        ALPHA_UPPER_CASE = 2
        ALPHA_LOWER_CASE = 3
        PUNCTUATION = 4
        WHITESPACE = 5

    characters_to_skip = proto.Field(
        proto.STRING,
        number=1,
        oneof="characters",
    )
    common_characters_to_ignore = proto.Field(
        proto.ENUM,
        number=2,
        oneof="characters",
        enum=CommonCharsToIgnore,
    )


class CharacterMaskConfig(proto.Message):
    r"""Partially mask a string by replacing a given number of characters
    with a fixed character. Masking can start from the beginning or end
    of the string. This can be used on data of any type (numbers, longs,
    and so on) and when de-identifying structured data we'll attempt to
    preserve the original data's type. (This allows you to take a long
    like 123 and modify it to a string like \**3.

    Attributes:
        masking_character (str):
            Character to use to mask the sensitive values—for example,
            ``*`` for an alphabetic string such as a name, or ``0`` for
            a numeric string such as ZIP code or credit card number.
            This string must have a length of 1. If not supplied, this
            value defaults to ``*`` for strings, and ``0`` for digits.
        number_to_mask (int):
            Number of characters to mask. If not set, all matching chars
            will be masked. Skipped characters do not count towards this
            tally.

            If ``number_to_mask`` is negative, this denotes inverse
            masking. Cloud DLP masks all but a number of characters. For
            example, suppose you have the following values:

            -  ``masking_character`` is ``*``
            -  ``number_to_mask`` is ``-4``
            -  ``reverse_order`` is ``false``
            -  ``CharsToIgnore`` includes ``-``
            -  Input string is ``1234-5678-9012-3456``

            The resulting de-identified string is
            ``****-****-****-3456``. Cloud DLP masks all but the last
            four characters. If ``reverse_order`` is ``true``, all but
            the first four characters are masked as
            ``1234-****-****-****``.
        reverse_order (bool):
            Mask characters in reverse order. For example, if
            ``masking_character`` is ``0``, ``number_to_mask`` is
            ``14``, and ``reverse_order`` is ``false``, then the input
            string ``1234-5678-9012-3456`` is masked as
            ``00000000000000-3456``. If ``masking_character`` is ``*``,
            ``number_to_mask`` is ``3``, and ``reverse_order`` is
            ``true``, then the string ``12345`` is masked as ``12***``.
        characters_to_ignore (Sequence[google.cloud.dlp_v2.types.CharsToIgnore]):
            When masking a string, items in this list will be skipped
            when replacing characters. For example, if the input string
            is ``555-555-5555`` and you instruct Cloud DLP to skip ``-``
            and mask 5 characters with ``*``, Cloud DLP returns
            ``***-**5-5555``.
    """

    masking_character = proto.Field(
        proto.STRING,
        number=1,
    )
    number_to_mask = proto.Field(
        proto.INT32,
        number=2,
    )
    reverse_order = proto.Field(
        proto.BOOL,
        number=3,
    )
    characters_to_ignore = proto.RepeatedField(
        proto.MESSAGE,
        number=4,
        message="CharsToIgnore",
    )


class FixedSizeBucketingConfig(proto.Message):
    r"""Buckets values based on fixed size ranges. The Bucketing
    transformation can provide all of this functionality, but requires
    more configuration. This message is provided as a convenience to the
    user for simple bucketing strategies.

    The transformed value will be a hyphenated string of
    {lower_bound}-{upper_bound}. For example, if lower_bound = 10 and
    upper_bound = 20, all values that are within this bucket will be
    replaced with "10-20".

    This can be used on data of type: double, long.

    If the bound Value type differs from the type of data being
    transformed, we will first attempt converting the type of the data
    to be transformed to match the type of the bound before comparing.

    See https://cloud.google.com/dlp/docs/concepts-bucketing to learn
    more.

    Attributes:
        lower_bound (google.cloud.dlp_v2.types.Value):
            Required. Lower bound value of buckets. All values less than
            ``lower_bound`` are grouped together into a single bucket;
            for example if ``lower_bound`` = 10, then all values less
            than 10 are replaced with the value "-10".
        upper_bound (google.cloud.dlp_v2.types.Value):
            Required. Upper bound value of buckets. All values greater
            than upper_bound are grouped together into a single bucket;
            for example if ``upper_bound`` = 89, then all values greater
            than 89 are replaced with the value "89+".
        bucket_size (float):
            Required. Size of each bucket (except for minimum and
            maximum buckets). So if ``lower_bound`` = 10,
            ``upper_bound`` = 89, and ``bucket_size`` = 10, then the
            following buckets would be used: -10, 10-20, 20-30, 30-40,
            40-50, 50-60, 60-70, 70-80, 80-89, 89+. Precision up to 2
            decimals works.
    """

    lower_bound = proto.Field(
        proto.MESSAGE,
        number=1,
        message="Value",
    )
    upper_bound = proto.Field(
        proto.MESSAGE,
        number=2,
        message="Value",
    )
    bucket_size = proto.Field(
        proto.DOUBLE,
        number=3,
    )


class BucketingConfig(proto.Message):
    r"""Generalization function that buckets values based on ranges. The
    ranges and replacement values are dynamically provided by the user
    for custom behavior, such as 1-30 -> LOW 31-65 -> MEDIUM 66-100 ->
    HIGH This can be used on data of type: number, long, string,
    timestamp. If the bound ``Value`` type differs from the type of data
    being transformed, we will first attempt converting the type of the
    data to be transformed to match the type of the bound before
    comparing. See https://cloud.google.com/dlp/docs/concepts-bucketing
    to learn more.

    Attributes:
        buckets (Sequence[google.cloud.dlp_v2.types.BucketingConfig.Bucket]):
            Set of buckets. Ranges must be
            non-overlapping.
    """

    class Bucket(proto.Message):
        r"""Bucket is represented as a range, along with replacement
        values.

        Attributes:
            min_ (google.cloud.dlp_v2.types.Value):
                Lower bound of the range, inclusive. Type
                should be the same as max if used.
            max_ (google.cloud.dlp_v2.types.Value):
                Upper bound of the range, exclusive; type
                must match min.
            replacement_value (google.cloud.dlp_v2.types.Value):
                Required. Replacement value for this bucket.
        """

        min_ = proto.Field(
            proto.MESSAGE,
            number=1,
            message="Value",
        )
        max_ = proto.Field(
            proto.MESSAGE,
            number=2,
            message="Value",
        )
        replacement_value = proto.Field(
            proto.MESSAGE,
            number=3,
            message="Value",
        )

    buckets = proto.RepeatedField(
        proto.MESSAGE,
        number=1,
        message=Bucket,
    )


class CryptoReplaceFfxFpeConfig(proto.Message):
    r"""Replaces an identifier with a surrogate using Format Preserving
    Encryption (FPE) with the FFX mode of operation; however when used
    in the ``ReidentifyContent`` API method, it serves the opposite
    function by reversing the surrogate back into the original
    identifier. The identifier must be encoded as ASCII. For a given
    crypto key and context, the same identifier will be replaced with
    the same surrogate. Identifiers must be at least two characters
    long. In the case that the identifier is the empty string, it will
    be skipped. See https://cloud.google.com/dlp/docs/pseudonymization
    to learn more.

    Note: We recommend using CryptoDeterministicConfig for all use cases
    which do not require preserving the input alphabet space and size,
    plus warrant referential integrity.

    This message has `oneof`_ fields (mutually exclusive fields).
    For each oneof, at most one member field can be set at the same time.
    Setting any member of the oneof automatically clears all other
    members.

    .. _oneof: https://proto-plus-python.readthedocs.io/en/stable/fields.html#oneofs-mutually-exclusive-fields

    Attributes:
        crypto_key (google.cloud.dlp_v2.types.CryptoKey):
            Required. The key used by the encryption
            algorithm.
        context (google.cloud.dlp_v2.types.FieldId):
            The 'tweak', a context may be used for higher security since
            the same identifier in two different contexts won't be given
            the same surrogate. If the context is not set, a default
            tweak will be used.

            If the context is set but:

            1. there is no record present when transforming a given
               value or
            2. the field is not present when transforming a given value,

            a default tweak will be used.

            Note that case (1) is expected when an
            ``InfoTypeTransformation`` is applied to both structured and
            unstructured ``ContentItem``\ s. Currently, the referenced
            field may be of value type integer or string.

            The tweak is constructed as a sequence of bytes in big
            endian byte order such that:

            -  a 64 bit integer is encoded followed by a single byte of
               value 1
            -  a string is encoded in UTF-8 format followed by a single
               byte of value 2
        common_alphabet (google.cloud.dlp_v2.types.CryptoReplaceFfxFpeConfig.FfxCommonNativeAlphabet):
            Common alphabets.

            This field is a member of `oneof`_ ``alphabet``.
        custom_alphabet (str):
            This is supported by mapping these to the alphanumeric
            characters that the FFX mode natively supports. This happens
            before/after encryption/decryption. Each character listed
            must appear only once. Number of characters must be in the
            range [2, 95]. This must be encoded as ASCII. The order of
            characters does not matter. The full list of allowed
            characters is:
            0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz
            ~`!@#$%^&*()_-+={[}]|:;"'<,>.?/

            This field is a member of `oneof`_ ``alphabet``.
        radix (int):
            The native way to select the alphabet. Must be in the range
            [2, 95].

            This field is a member of `oneof`_ ``alphabet``.
        surrogate_info_type (google.cloud.dlp_v2.types.InfoType):
            The custom infoType to annotate the surrogate with. This
            annotation will be applied to the surrogate by prefixing it
            with the name of the custom infoType followed by the number
            of characters comprising the surrogate. The following scheme
            defines the format:
            info_type_name(surrogate_character_count):surrogate

            For example, if the name of custom infoType is
            'MY_TOKEN_INFO_TYPE' and the surrogate is 'abc', the full
            replacement value will be: 'MY_TOKEN_INFO_TYPE(3):abc'

            This annotation identifies the surrogate when inspecting
            content using the custom infoType
            ```SurrogateType`` <https://cloud.google.com/dlp/docs/reference/rest/v2/InspectConfig#surrogatetype>`__.
            This facilitates reversal of the surrogate when it occurs in
            free text.

            In order for inspection to work properly, the name of this
            infoType must not occur naturally anywhere in your data;
            otherwise, inspection may find a surrogate that does not
            correspond to an actual identifier. Therefore, choose your
            custom infoType name carefully after considering what your
            data looks like. One way to select a name that has a high
            chance of yielding reliable detection is to include one or
            more unicode characters that are highly improbable to exist
            in your data. For example, assuming your data is entered
            from a regular ASCII keyboard, the symbol with the hex code
            point 29DD might be used like so: ⧝MY_TOKEN_TYPE
    """

    class FfxCommonNativeAlphabet(proto.Enum):
        r"""These are commonly used subsets of the alphabet that the FFX
        mode natively supports. In the algorithm, the alphabet is
        selected using the "radix". Therefore each corresponds to a
        particular radix.
        """
        FFX_COMMON_NATIVE_ALPHABET_UNSPECIFIED = 0
        NUMERIC = 1
        HEXADECIMAL = 2
        UPPER_CASE_ALPHA_NUMERIC = 3
        ALPHA_NUMERIC = 4

    crypto_key = proto.Field(
        proto.MESSAGE,
        number=1,
        message="CryptoKey",
    )
    context = proto.Field(
        proto.MESSAGE,
        number=2,
        message=storage.FieldId,
    )
    common_alphabet = proto.Field(
        proto.ENUM,
        number=4,
        oneof="alphabet",
        enum=FfxCommonNativeAlphabet,
    )
    custom_alphabet = proto.Field(
        proto.STRING,
        number=5,
        oneof="alphabet",
    )
    radix = proto.Field(
        proto.INT32,
        number=6,
        oneof="alphabet",
    )
    surrogate_info_type = proto.Field(
        proto.MESSAGE,
        number=8,
        message=storage.InfoType,
    )


class CryptoKey(proto.Message):
    r"""This is a data encryption key (DEK) (as opposed to
    a key encryption key (KEK) stored by Cloud Key Management
    Service (Cloud KMS).
    When using Cloud KMS to wrap or unwrap a DEK, be sure to set an
    appropriate IAM policy on the KEK to ensure an attacker cannot
    unwrap the DEK.

    This message has `oneof`_ fields (mutually exclusive fields).
    For each oneof, at most one member field can be set at the same time.
    Setting any member of the oneof automatically clears all other
    members.

    .. _oneof: https://proto-plus-python.readthedocs.io/en/stable/fields.html#oneofs-mutually-exclusive-fields

    Attributes:
        transient (google.cloud.dlp_v2.types.TransientCryptoKey):
            Transient crypto key

            This field is a member of `oneof`_ ``source``.
        unwrapped (google.cloud.dlp_v2.types.UnwrappedCryptoKey):
            Unwrapped crypto key

            This field is a member of `oneof`_ ``source``.
        kms_wrapped (google.cloud.dlp_v2.types.KmsWrappedCryptoKey):
            Key wrapped using Cloud KMS

            This field is a member of `oneof`_ ``source``.
    """

    transient = proto.Field(
        proto.MESSAGE,
        number=1,
        oneof="source",
        message="TransientCryptoKey",
    )
    unwrapped = proto.Field(
        proto.MESSAGE,
        number=2,
        oneof="source",
        message="UnwrappedCryptoKey",
    )
    kms_wrapped = proto.Field(
        proto.MESSAGE,
        number=3,
        oneof="source",
        message="KmsWrappedCryptoKey",
    )


class TransientCryptoKey(proto.Message):
    r"""Use this to have a random data crypto key generated.
    It will be discarded after the request finishes.

    Attributes:
        name (str):
            Required. Name of the key. This is an arbitrary string used
            to differentiate different keys. A unique key is generated
            per name: two separate ``TransientCryptoKey`` protos share
            the same generated key if their names are the same. When the
            data crypto key is generated, this name is not used in any
            way (repeating the api call will result in a different key
            being generated).
    """

    name = proto.Field(
        proto.STRING,
        number=1,
    )


class UnwrappedCryptoKey(proto.Message):
    r"""Using raw keys is prone to security risks due to accidentally
    leaking the key. Choose another type of key if possible.

    Attributes:
        key (bytes):
            Required. A 128/192/256 bit key.
    """

    key = proto.Field(
        proto.BYTES,
        number=1,
    )


class KmsWrappedCryptoKey(proto.Message):
    r"""Include to use an existing data crypto key wrapped by KMS. The
    wrapped key must be a 128-, 192-, or 256-bit key. Authorization
    requires the following IAM permissions when sending a request to
    perform a crypto transformation using a KMS-wrapped crypto key:
    dlp.kms.encrypt

    For more information, see [Creating a wrapped key]
    (https://cloud.google.com/dlp/docs/create-wrapped-key).

    Note: When you use Cloud KMS for cryptographic operations, `charges
    apply <https://cloud.google.com/kms/pricing>`__.

    Attributes:
        wrapped_key (bytes):
            Required. The wrapped data crypto key.
        crypto_key_name (str):
            Required. The resource name of the KMS
            CryptoKey to use for unwrapping.
    """

    wrapped_key = proto.Field(
        proto.BYTES,
        number=1,
    )
    crypto_key_name = proto.Field(
        proto.STRING,
        number=2,
    )


class DateShiftConfig(proto.Message):
    r"""Shifts dates by random number of days, with option to be
    consistent for the same context. See
    https://cloud.google.com/dlp/docs/concepts-date-shifting to
    learn more.


    .. _oneof: https://proto-plus-python.readthedocs.io/en/stable/fields.html#oneofs-mutually-exclusive-fields

    Attributes:
        upper_bound_days (int):
            Required. Range of shift in days. Actual
            shift will be selected at random within this
            range (inclusive ends). Negative means shift to
            earlier in time. Must not be more than 365250
            days (1000 years) each direction.
            For example, 3 means shift date to at most 3
            days into the future.
        lower_bound_days (int):
            Required. For example, -5 means shift date to
            at most 5 days back in the past.
        context (google.cloud.dlp_v2.types.FieldId):
            Points to the field that contains the
            context, for example, an entity id. If set, must
            also set cryptoKey. If set, shift will be
            consistent for the given context.
        crypto_key (google.cloud.dlp_v2.types.CryptoKey):
            Causes the shift to be computed based on this key and the
            context. This results in the same shift for the same context
            and crypto_key. If set, must also set context. Can only be
            applied to table items.

            This field is a member of `oneof`_ ``method``.
    """

    upper_bound_days = proto.Field(
        proto.INT32,
        number=1,
    )
    lower_bound_days = proto.Field(
        proto.INT32,
        number=2,
    )
    context = proto.Field(
        proto.MESSAGE,
        number=3,
        message=storage.FieldId,
    )
    crypto_key = proto.Field(
        proto.MESSAGE,
        number=4,
        oneof="method",
        message="CryptoKey",
    )


class InfoTypeTransformations(proto.Message):
    r"""A type of transformation that will scan unstructured text and apply
    various ``PrimitiveTransformation``\ s to each finding, where the
    transformation is applied to only values that were identified as a
    specific info_type.

    Attributes:
        transformations (Sequence[google.cloud.dlp_v2.types.InfoTypeTransformations.InfoTypeTransformation]):
            Required. Transformation for each infoType.
            Cannot specify more than one for a given
            infoType.
    """

    class InfoTypeTransformation(proto.Message):
        r"""A transformation to apply to text that is identified as a specific
        info_type.

        Attributes:
            info_types (Sequence[google.cloud.dlp_v2.types.InfoType]):
                InfoTypes to apply the transformation to. An empty list will
                cause this transformation to apply to all findings that
                correspond to infoTypes that were requested in
                ``InspectConfig``.
            primitive_transformation (google.cloud.dlp_v2.types.PrimitiveTransformation):
                Required. Primitive transformation to apply
                to the infoType.
        """

        info_types = proto.RepeatedField(
            proto.MESSAGE,
            number=1,
            message=storage.InfoType,
        )
        primitive_transformation = proto.Field(
            proto.MESSAGE,
            number=2,
            message="PrimitiveTransformation",
        )

    transformations = proto.RepeatedField(
        proto.MESSAGE,
        number=1,
        message=InfoTypeTransformation,
    )


class FieldTransformation(proto.Message):
    r"""The transformation to apply to the field.

    This message has `oneof`_ fields (mutually exclusive fields).
    For each oneof, at most one member field can be set at the same time.
    Setting any member of the oneof automatically clears all other
    members.

    .. _oneof: https://proto-plus-python.readthedocs.io/en/stable/fields.html#oneofs-mutually-exclusive-fields

    Attributes:
        fields (Sequence[google.cloud.dlp_v2.types.FieldId]):
            Required. Input field(s) to apply the transformation to.
            When you have columns that reference their position within a
            list, omit the index from the FieldId. FieldId name matching
            ignores the index. For example, instead of
            "contact.nums[0].type", use "contact.nums.type".
        condition (google.cloud.dlp_v2.types.RecordCondition):
            Only apply the transformation if the condition evaluates to
            true for the given ``RecordCondition``. The conditions are
            allowed to reference fields that are not used in the actual
            transformation.

            Example Use Cases:

            -  Apply a different bucket transformation to an age column
               if the zip code column for the same record is within a
               specific range.
            -  Redact a field if the date of birth field is greater than
               85.
        primitive_transformation (google.cloud.dlp_v2.types.PrimitiveTransformation):
            Apply the transformation to the entire field.

            This field is a member of `oneof`_ ``transformation``.
        info_type_transformations (google.cloud.dlp_v2.types.InfoTypeTransformations):
            Treat the contents of the field as free text, and
            selectively transform content that matches an ``InfoType``.

            This field is a member of `oneof`_ ``transformation``.
    """

    fields = proto.RepeatedField(
        proto.MESSAGE,
        number=1,
        message=storage.FieldId,
    )
    condition = proto.Field(
        proto.MESSAGE,
        number=3,
        message="RecordCondition",
    )
    primitive_transformation = proto.Field(
        proto.MESSAGE,
        number=4,
        oneof="transformation",
        message="PrimitiveTransformation",
    )
    info_type_transformations = proto.Field(
        proto.MESSAGE,
        number=5,
        oneof="transformation",
        message="InfoTypeTransformations",
    )


class RecordTransformations(proto.Message):
    r"""A type of transformation that is applied over structured data
    such as a table.

    Attributes:
        field_transformations (Sequence[google.cloud.dlp_v2.types.FieldTransformation]):
            Transform the record by applying various
            field transformations.
        record_suppressions (Sequence[google.cloud.dlp_v2.types.RecordSuppression]):
            Configuration defining which records get
            suppressed entirely. Records that match any
            suppression rule are omitted from the output.
    """

    field_transformations = proto.RepeatedField(
        proto.MESSAGE,
        number=1,
        message="FieldTransformation",
    )
    record_suppressions = proto.RepeatedField(
        proto.MESSAGE,
        number=2,
        message="RecordSuppression",
    )


class RecordSuppression(proto.Message):
    r"""Configuration to suppress records whose suppression
    conditions evaluate to true.

    Attributes:
        condition (google.cloud.dlp_v2.types.RecordCondition):
            A condition that when it evaluates to true
            will result in the record being evaluated to be
            suppressed from the transformed content.
    """

    condition = proto.Field(
        proto.MESSAGE,
        number=1,
        message="RecordCondition",
    )


class RecordCondition(proto.Message):
    r"""A condition for determining whether a transformation should
    be applied to a field.

    Attributes:
        expressions (google.cloud.dlp_v2.types.RecordCondition.Expressions):
            An expression.
    """

    class Condition(proto.Message):
        r"""The field type of ``value`` and ``field`` do not need to match to be
        considered equal, but not all comparisons are possible. EQUAL_TO and
        NOT_EQUAL_TO attempt to compare even with incompatible types, but
        all other comparisons are invalid with incompatible types. A
        ``value`` of type:

        -  ``string`` can be compared against all other types
        -  ``boolean`` can only be compared against other booleans
        -  ``integer`` can be compared against doubles or a string if the
           string value can be parsed as an integer.
        -  ``double`` can be compared against integers or a string if the
           string can be parsed as a double.
        -  ``Timestamp`` can be compared against strings in RFC 3339 date
           string format.
        -  ``TimeOfDay`` can be compared against timestamps and strings in
           the format of 'HH:mm:ss'.

        If we fail to compare do to type mismatch, a warning will be given
        and the condition will evaluate to false.

        Attributes:
            field (google.cloud.dlp_v2.types.FieldId):
                Required. Field within the record this
                condition is evaluated against.
            operator (google.cloud.dlp_v2.types.RelationalOperator):
                Required. Operator used to compare the field
                or infoType to the value.
            value (google.cloud.dlp_v2.types.Value):
                Value to compare against. [Mandatory, except for ``EXISTS``
                tests.]
        """

        field = proto.Field(
            proto.MESSAGE,
            number=1,
            message=storage.FieldId,
        )
        operator = proto.Field(
            proto.ENUM,
            number=3,
            enum="RelationalOperator",
        )
        value = proto.Field(
            proto.MESSAGE,
            number=4,
            message="Value",
        )

    class Conditions(proto.Message):
        r"""A collection of conditions.

        Attributes:
            conditions (Sequence[google.cloud.dlp_v2.types.RecordCondition.Condition]):
                A collection of conditions.
        """

        conditions = proto.RepeatedField(
            proto.MESSAGE,
            number=1,
            message="RecordCondition.Condition",
        )

    class Expressions(proto.Message):
        r"""An expression, consisting of an operator and conditions.

        .. _oneof: https://proto-plus-python.readthedocs.io/en/stable/fields.html#oneofs-mutually-exclusive-fields

        Attributes:
            logical_operator (google.cloud.dlp_v2.types.RecordCondition.Expressions.LogicalOperator):
                The operator to apply to the result of conditions. Default
                and currently only supported value is ``AND``.
            conditions (google.cloud.dlp_v2.types.RecordCondition.Conditions):
                Conditions to apply to the expression.

                This field is a member of `oneof`_ ``type``.
        """

        class LogicalOperator(proto.Enum):
            r"""Logical operators for conditional checks."""
            LOGICAL_OPERATOR_UNSPECIFIED = 0
            AND = 1

        logical_operator = proto.Field(
            proto.ENUM,
            number=1,
            enum="RecordCondition.Expressions.LogicalOperator",
        )
        conditions = proto.Field(
            proto.MESSAGE,
            number=3,
            oneof="type",
            message="RecordCondition.Conditions",
        )

    expressions = proto.Field(
        proto.MESSAGE,
        number=3,
        message=Expressions,
    )


class TransformationOverview(proto.Message):
    r"""Overview of the modifications that occurred.

    Attributes:
        transformed_bytes (int):
            Total size in bytes that were transformed in
            some way.
        transformation_summaries (Sequence[google.cloud.dlp_v2.types.TransformationSummary]):
            Transformations applied to the dataset.
    """

    transformed_bytes = proto.Field(
        proto.INT64,
        number=2,
    )
    transformation_summaries = proto.RepeatedField(
        proto.MESSAGE,
        number=3,
        message="TransformationSummary",
    )


class TransformationSummary(proto.Message):
    r"""Summary of a single transformation. Only one of 'transformation',
    'field_transformation', or 'record_suppress' will be set.

    Attributes:
        info_type (google.cloud.dlp_v2.types.InfoType):
            Set if the transformation was limited to a
            specific InfoType.
        field (google.cloud.dlp_v2.types.FieldId):
            Set if the transformation was limited to a
            specific FieldId.
        transformation (google.cloud.dlp_v2.types.PrimitiveTransformation):
            The specific transformation these stats apply
            to.
        field_transformations (Sequence[google.cloud.dlp_v2.types.FieldTransformation]):
            The field transformation that was applied.
            If multiple field transformations are requested
            for a single field, this list will contain all
            of them; otherwise, only one is supplied.
        record_suppress (google.cloud.dlp_v2.types.RecordSuppression):
            The specific suppression option these stats
            apply to.
        results (Sequence[google.cloud.dlp_v2.types.TransformationSummary.SummaryResult]):
            Collection of all transformations that took
            place or had an error.
        transformed_bytes (int):
            Total size in bytes that were transformed in
            some way.
    """

    class TransformationResultCode(proto.Enum):
        r"""Possible outcomes of transformations."""
        TRANSFORMATION_RESULT_CODE_UNSPECIFIED = 0
        SUCCESS = 1
        ERROR = 2

    class SummaryResult(proto.Message):
        r"""A collection that informs the user the number of times a particular
        ``TransformationResultCode`` and error details occurred.

        Attributes:
            count (int):
                Number of transformations counted by this
                result.
            code (google.cloud.dlp_v2.types.TransformationSummary.TransformationResultCode):
                Outcome of the transformation.
            details (str):
                A place for warnings or errors to show up if
                a transformation didn't work as expected.
        """

        count = proto.Field(
            proto.INT64,
            number=1,
        )
        code = proto.Field(
            proto.ENUM,
            number=2,
            enum="TransformationSummary.TransformationResultCode",
        )
        details = proto.Field(
            proto.STRING,
            number=3,
        )

    info_type = proto.Field(
        proto.MESSAGE,
        number=1,
        message=storage.InfoType,
    )
    field = proto.Field(
        proto.MESSAGE,
        number=2,
        message=storage.FieldId,
    )
    transformation = proto.Field(
        proto.MESSAGE,
        number=3,
        message="PrimitiveTransformation",
    )
    field_transformations = proto.RepeatedField(
        proto.MESSAGE,
        number=5,
        message="FieldTransformation",
    )
    record_suppress = proto.Field(
        proto.MESSAGE,
        number=6,
        message="RecordSuppression",
    )
    results = proto.RepeatedField(
        proto.MESSAGE,
        number=4,
        message=SummaryResult,
    )
    transformed_bytes = proto.Field(
        proto.INT64,
        number=7,
    )


class TransformationDescription(proto.Message):
    r"""A flattened description of a ``PrimitiveTransformation`` or
    ``RecordSuppression``.

    Attributes:
        type_ (google.cloud.dlp_v2.types.TransformationType):
            The transformation type.
        description (str):
            A description of the transformation. This is empty for a
            RECORD_SUPPRESSION, or is the output of calling toString()
            on the ``PrimitiveTransformation`` protocol buffer message
            for any other type of transformation.
        condition (str):
            A human-readable string representation of the
            ``RecordCondition`` corresponding to this transformation.
            Set if a ``RecordCondition`` was used to determine whether
            or not to apply this transformation.

            Examples: \* (age_field > 85) \* (age_field <= 18) \*
            (zip_field exists) \* (zip_field == 01234) && (city_field !=
            "Springville") \* (zip_field == 01234) && (age_field <= 18)
            && (city_field exists)
        info_type (google.cloud.dlp_v2.types.InfoType):
            Set if the transformation was limited to a specific
            ``InfoType``.
    """

    type_ = proto.Field(
        proto.ENUM,
        number=1,
        enum="TransformationType",
    )
    description = proto.Field(
        proto.STRING,
        number=2,
    )
    condition = proto.Field(
        proto.STRING,
        number=3,
    )
    info_type = proto.Field(
        proto.MESSAGE,
        number=4,
        message=storage.InfoType,
    )


class TransformationDetails(proto.Message):
    r"""Details about a single transformation. This object contains a
    description of the transformation, information about whether the
    transformation was successfully applied, and the precise
    location where the transformation occurred. These details are
    stored in a user-specified BigQuery table.

    Attributes:
        resource_name (str):
            The name of the job that completed the
            transformation.
        container_name (str):
            The top level name of the container where the
            transformation is located (this will be the
            source file name or table name).
        transformation (Sequence[google.cloud.dlp_v2.types.TransformationDescription]):
            Description of transformation. This would only contain more
            than one element if there were multiple matching
            transformations and which one to apply was ambiguous. Not
            set for states that contain no transformation, currently
            only state that contains no transformation is
            TransformationResultStateType.METADATA_UNRETRIEVABLE.
        status_details (google.cloud.dlp_v2.types.TransformationResultStatus):
            Status of the transformation, if
            transformation was not successful, this will
            specify what caused it to fail, otherwise it
            will show that the transformation was
            successful.
        transformed_bytes (int):
            The number of bytes that were transformed. If
            transformation was unsuccessful or did not take
            place because there was no content to transform,
            this will be zero.
        transformation_location (google.cloud.dlp_v2.types.TransformationLocation):
            The precise location of the transformed
            content in the original container.
    """

    resource_name = proto.Field(
        proto.STRING,
        number=1,
    )
    container_name = proto.Field(
        proto.STRING,
        number=2,
    )
    transformation = proto.RepeatedField(
        proto.MESSAGE,
        number=3,
        message="TransformationDescription",
    )
    status_details = proto.Field(
        proto.MESSAGE,
        number=4,
        message="TransformationResultStatus",
    )
    transformed_bytes = proto.Field(
        proto.INT64,
        number=5,
    )
    transformation_location = proto.Field(
        proto.MESSAGE,
        number=6,
        message="TransformationLocation",
    )


class TransformationLocation(proto.Message):
    r"""Specifies the location of a transformation.

    This message has `oneof`_ fields (mutually exclusive fields).
    For each oneof, at most one member field can be set at the same time.
    Setting any member of the oneof automatically clears all other
    members.

    .. _oneof: https://proto-plus-python.readthedocs.io/en/stable/fields.html#oneofs-mutually-exclusive-fields

    Attributes:
        finding_id (str):
            For infotype transformations, link to the
            corresponding findings ID so that location
            information does not need to be duplicated. Each
            findings ID correlates to an entry in the
            findings output table, this table only gets
            created when users specify to save findings (add
            the save findings action to the request).

            This field is a member of `oneof`_ ``location_type``.
        record_transformation (google.cloud.dlp_v2.types.RecordTransformation):
            For record transformations, provide a field
            and container information.

            This field is a member of `oneof`_ ``location_type``.
        container_type (google.cloud.dlp_v2.types.TransformationContainerType):
            Information about the functionality of the
            container where this finding occurred, if
            available.
    """

    finding_id = proto.Field(
        proto.STRING,
        number=1,
        oneof="location_type",
    )
    record_transformation = proto.Field(
        proto.MESSAGE,
        number=2,
        oneof="location_type",
        message="RecordTransformation",
    )
    container_type = proto.Field(
        proto.ENUM,
        number=3,
        enum="TransformationContainerType",
    )


class RecordTransformation(proto.Message):
    r"""

    Attributes:
        field_id (google.cloud.dlp_v2.types.FieldId):
            For record transformations, provide a field.
        container_timestamp (google.protobuf.timestamp_pb2.Timestamp):
            Findings container modification timestamp, if
            applicable.
        container_version (str):
            Container version, if available ("generation"
            for Cloud Storage).
    """

    field_id = proto.Field(
        proto.MESSAGE,
        number=1,
        message=storage.FieldId,
    )
    container_timestamp = proto.Field(
        proto.MESSAGE,
        number=2,
        message=timestamp_pb2.Timestamp,
    )
    container_version = proto.Field(
        proto.STRING,
        number=3,
    )


class TransformationResultStatus(proto.Message):
    r"""

    Attributes:
        result_status_type (google.cloud.dlp_v2.types.TransformationResultStatusType):
            Transformation result status type, this will
            be either SUCCESS, or it will be the reason for
            why the transformation was not completely
            successful.
        details (google.rpc.status_pb2.Status):
            Detailed error codes and messages
    """

    result_status_type = proto.Field(
        proto.ENUM,
        number=1,
        enum="TransformationResultStatusType",
    )
    details = proto.Field(
        proto.MESSAGE,
        number=2,
        message=status_pb2.Status,
    )


class TransformationDetailsStorageConfig(proto.Message):
    r"""Config for storing transformation details.

    .. _oneof: https://proto-plus-python.readthedocs.io/en/stable/fields.html#oneofs-mutually-exclusive-fields

    Attributes:
        table (google.cloud.dlp_v2.types.BigQueryTable):
            The BigQuery table in which to store the output. This may be
            an existing table or in a new table in an existing dataset.
            If table_id is not set a new one will be generated for you
            with the following format:
            dlp_googleapis_transformation_details_yyyy_mm_dd_[dlp_job_id].
            Pacific time zone will be used for generating the date
            details.

            This field is a member of `oneof`_ ``type``.
    """

    table = proto.Field(
        proto.MESSAGE,
        number=1,
        oneof="type",
        message=storage.BigQueryTable,
    )


class Schedule(proto.Message):
    r"""Schedule for inspect job triggers.

    .. _oneof: https://proto-plus-python.readthedocs.io/en/stable/fields.html#oneofs-mutually-exclusive-fields

    Attributes:
        recurrence_period_duration (google.protobuf.duration_pb2.Duration):
            With this option a job is started on a
            regular periodic basis. For example: every day
            (86400 seconds).
            A scheduled start time will be skipped if the
            previous execution has not ended when its
            scheduled time occurs.
            This value must be set to a time duration
            greater than or equal to 1 day and can be no
            longer than 60 days.

            This field is a member of `oneof`_ ``option``.
    """

    recurrence_period_duration = proto.Field(
        proto.MESSAGE,
        number=1,
        oneof="option",
        message=duration_pb2.Duration,
    )


class Manual(proto.Message):
    r"""Job trigger option for hybrid jobs. Jobs must be manually
    created and finished.

    """


class InspectTemplate(proto.Message):
    r"""The inspectTemplate contains a configuration (set of types of
    sensitive data to be detected) to be used anywhere you otherwise
    would normally specify InspectConfig. See
    https://cloud.google.com/dlp/docs/concepts-templates to learn
    more.

    Attributes:
        name (str):
            Output only. The template name.

            The template will have one of the following formats:
            ``projects/PROJECT_ID/inspectTemplates/TEMPLATE_ID`` OR
            ``organizations/ORGANIZATION_ID/inspectTemplates/TEMPLATE_ID``;
        display_name (str):
            Display name (max 256 chars).
        description (str):
            Short description (max 256 chars).
        create_time (google.protobuf.timestamp_pb2.Timestamp):
            Output only. The creation timestamp of an
            inspectTemplate.
        update_time (google.protobuf.timestamp_pb2.Timestamp):
            Output only. The last update timestamp of an
            inspectTemplate.
        inspect_config (google.cloud.dlp_v2.types.InspectConfig):
            The core content of the template.
            Configuration of the scanning process.
    """

    name = proto.Field(
        proto.STRING,
        number=1,
    )
    display_name = proto.Field(
        proto.STRING,
        number=2,
    )
    description = proto.Field(
        proto.STRING,
        number=3,
    )
    create_time = proto.Field(
        proto.MESSAGE,
        number=4,
        message=timestamp_pb2.Timestamp,
    )
    update_time = proto.Field(
        proto.MESSAGE,
        number=5,
        message=timestamp_pb2.Timestamp,
    )
    inspect_config = proto.Field(
        proto.MESSAGE,
        number=6,
        message="InspectConfig",
    )


class DeidentifyTemplate(proto.Message):
    r"""DeidentifyTemplates contains instructions on how to
    de-identify content. See
    https://cloud.google.com/dlp/docs/concepts-templates to learn
    more.

    Attributes:
        name (str):
            Output only. The template name.

            The template will have one of the following formats:
            ``projects/PROJECT_ID/deidentifyTemplates/TEMPLATE_ID`` OR
            ``organizations/ORGANIZATION_ID/deidentifyTemplates/TEMPLATE_ID``
        display_name (str):
            Display name (max 256 chars).
        description (str):
            Short description (max 256 chars).
        create_time (google.protobuf.timestamp_pb2.Timestamp):
            Output only. The creation timestamp of an
            inspectTemplate.
        update_time (google.protobuf.timestamp_pb2.Timestamp):
            Output only. The last update timestamp of an
            inspectTemplate.
        deidentify_config (google.cloud.dlp_v2.types.DeidentifyConfig):
            The core content of the template.
    """

    name = proto.Field(
        proto.STRING,
        number=1,
    )
    display_name = proto.Field(
        proto.STRING,
        number=2,
    )
    description = proto.Field(
        proto.STRING,
        number=3,
    )
    create_time = proto.Field(
        proto.MESSAGE,
        number=4,
        message=timestamp_pb2.Timestamp,
    )
    update_time = proto.Field(
        proto.MESSAGE,
        number=5,
        message=timestamp_pb2.Timestamp,
    )
    deidentify_config = proto.Field(
        proto.MESSAGE,
        number=6,
        message="DeidentifyConfig",
    )


class Error(proto.Message):
    r"""Details information about an error encountered during job
    execution or the results of an unsuccessful activation of the
    JobTrigger.

    Attributes:
        details (google.rpc.status_pb2.Status):
            Detailed error codes and messages.
        timestamps (Sequence[google.protobuf.timestamp_pb2.Timestamp]):
            The times the error occurred.
    """

    details = proto.Field(
        proto.MESSAGE,
        number=1,
        message=status_pb2.Status,
    )
    timestamps = proto.RepeatedField(
        proto.MESSAGE,
        number=2,
        message=timestamp_pb2.Timestamp,
    )


class JobTrigger(proto.Message):
    r"""Contains a configuration to make dlp api calls on a repeating
    basis. See
    https://cloud.google.com/dlp/docs/concepts-job-triggers to learn
    more.


    .. _oneof: https://proto-plus-python.readthedocs.io/en/stable/fields.html#oneofs-mutually-exclusive-fields

    Attributes:
        name (str):
            Unique resource name for the triggeredJob, assigned by the
            service when the triggeredJob is created, for example
            ``projects/dlp-test-project/jobTriggers/53234423``.
        display_name (str):
            Display name (max 100 chars)
        description (str):
            User provided description (max 256 chars)
        inspect_job (google.cloud.dlp_v2.types.InspectJobConfig):
            For inspect jobs, a snapshot of the
            configuration.

            This field is a member of `oneof`_ ``job``.
        triggers (Sequence[google.cloud.dlp_v2.types.JobTrigger.Trigger]):
            A list of triggers which will be OR'ed
            together. Only one in the list needs to trigger
            for a job to be started. The list may contain
            only a single Schedule trigger and must have at
            least one object.
        errors (Sequence[google.cloud.dlp_v2.types.Error]):
            Output only. A stream of errors encountered
            when the trigger was activated. Repeated errors
            may result in the JobTrigger automatically being
            paused. Will return the last 100 errors.
            Whenever the JobTrigger is modified this list
            will be cleared.
        create_time (google.protobuf.timestamp_pb2.Timestamp):
            Output only. The creation timestamp of a
            triggeredJob.
        update_time (google.protobuf.timestamp_pb2.Timestamp):
            Output only. The last update timestamp of a
            triggeredJob.
        last_run_time (google.protobuf.timestamp_pb2.Timestamp):
            Output only. The timestamp of the last time
            this trigger executed.
        status (google.cloud.dlp_v2.types.JobTrigger.Status):
            Required. A status for this trigger.
    """

    class Status(proto.Enum):
        r"""Whether the trigger is currently active. If PAUSED or
        CANCELLED, no jobs will be created with this configuration. The
        service may automatically pause triggers experiencing frequent
        errors. To restart a job, set the status to HEALTHY after
        correcting user errors.
        """
        STATUS_UNSPECIFIED = 0
        HEALTHY = 1
        PAUSED = 2
        CANCELLED = 3

    class Trigger(proto.Message):
        r"""What event needs to occur for a new job to be started.

        This message has `oneof`_ fields (mutually exclusive fields).
        For each oneof, at most one member field can be set at the same time.
        Setting any member of the oneof automatically clears all other
        members.

        .. _oneof: https://proto-plus-python.readthedocs.io/en/stable/fields.html#oneofs-mutually-exclusive-fields

        Attributes:
            schedule (google.cloud.dlp_v2.types.Schedule):
                Create a job on a repeating basis based on
                the elapse of time.

                This field is a member of `oneof`_ ``trigger``.
            manual (google.cloud.dlp_v2.types.Manual):
                For use with hybrid jobs. Jobs must be
                manually created and finished.

                This field is a member of `oneof`_ ``trigger``.
        """

        schedule = proto.Field(
            proto.MESSAGE,
            number=1,
            oneof="trigger",
            message="Schedule",
        )
        manual = proto.Field(
            proto.MESSAGE,
            number=2,
            oneof="trigger",
            message="Manual",
        )

    name = proto.Field(
        proto.STRING,
        number=1,
    )
    display_name = proto.Field(
        proto.STRING,
        number=2,
    )
    description = proto.Field(
        proto.STRING,
        number=3,
    )
    inspect_job = proto.Field(
        proto.MESSAGE,
        number=4,
        oneof="job",
        message="InspectJobConfig",
    )
    triggers = proto.RepeatedField(
        proto.MESSAGE,
        number=5,
        message=Trigger,
    )
    errors = proto.RepeatedField(
        proto.MESSAGE,
        number=6,
        message="Error",
    )
    create_time = proto.Field(
        proto.MESSAGE,
        number=7,
        message=timestamp_pb2.Timestamp,
    )
    update_time = proto.Field(
        proto.MESSAGE,
        number=8,
        message=timestamp_pb2.Timestamp,
    )
    last_run_time = proto.Field(
        proto.MESSAGE,
        number=9,
        message=timestamp_pb2.Timestamp,
    )
    status = proto.Field(
        proto.ENUM,
        number=10,
        enum=Status,
    )


class Action(proto.Message):
    r"""A task to execute on the completion of a job.
    See https://cloud.google.com/dlp/docs/concepts-actions to learn
    more.

    This message has `oneof`_ fields (mutually exclusive fields).
    For each oneof, at most one member field can be set at the same time.
    Setting any member of the oneof automatically clears all other
    members.

    .. _oneof: https://proto-plus-python.readthedocs.io/en/stable/fields.html#oneofs-mutually-exclusive-fields

    Attributes:
        save_findings (google.cloud.dlp_v2.types.Action.SaveFindings):
            Save resulting findings in a provided
            location.

            This field is a member of `oneof`_ ``action``.
        pub_sub (google.cloud.dlp_v2.types.Action.PublishToPubSub):
            Publish a notification to a Pub/Sub topic.

            This field is a member of `oneof`_ ``action``.
        publish_summary_to_cscc (google.cloud.dlp_v2.types.Action.PublishSummaryToCscc):
            Publish summary to Cloud Security Command
            Center (Alpha).

            This field is a member of `oneof`_ ``action``.
        publish_findings_to_cloud_data_catalog (google.cloud.dlp_v2.types.Action.PublishFindingsToCloudDataCatalog):
            Publish findings to Cloud Datahub.

            This field is a member of `oneof`_ ``action``.
        deidentify (google.cloud.dlp_v2.types.Action.Deidentify):
            Create a de-identified copy of the input
            data.

            This field is a member of `oneof`_ ``action``.
        job_notification_emails (google.cloud.dlp_v2.types.Action.JobNotificationEmails):
            Enable email notification for project owners
            and editors on job's completion/failure.

            This field is a member of `oneof`_ ``action``.
        publish_to_stackdriver (google.cloud.dlp_v2.types.Action.PublishToStackdriver):
            Enable Stackdriver metric dlp.googleapis.com/finding_count.

            This field is a member of `oneof`_ ``action``.
    """

    class SaveFindings(proto.Message):
        r"""If set, the detailed findings will be persisted to the
        specified OutputStorageConfig. Only a single instance of this
        action can be specified.
        Compatible with: Inspect, Risk

        Attributes:
            output_config (google.cloud.dlp_v2.types.OutputStorageConfig):
                Location to store findings outside of DLP.
        """

        output_config = proto.Field(
            proto.MESSAGE,
            number=1,
            message="OutputStorageConfig",
        )

    class PublishToPubSub(proto.Message):
        r"""Publish a message into a given Pub/Sub topic when DlpJob has
        completed. The message contains a single field, ``DlpJobName``,
        which is equal to the finished job's
        ```DlpJob.name`` <https://cloud.google.com/dlp/docs/reference/rest/v2/projects.dlpJobs#DlpJob>`__.
        Compatible with: Inspect, Risk

        Attributes:
            topic (str):
                Cloud Pub/Sub topic to send notifications to.
                The topic must have given publishing access
                rights to the DLP API service account executing
                the long running DlpJob sending the
                notifications. Format is
                projects/{project}/topics/{topic}.
        """

        topic = proto.Field(
            proto.STRING,
            number=1,
        )

    class PublishSummaryToCscc(proto.Message):
        r"""Publish the result summary of a DlpJob to the Cloud Security
        Command Center (CSCC Alpha).
        This action is only available for projects which are parts of an
        organization and whitelisted for the alpha Cloud Security
        Command Center.
        The action will publish the count of finding instances and their
        info types. The summary of findings will be persisted in CSCC
        and are governed by CSCC service-specific policy, see
        https://cloud.google.com/terms/service-terms Only a single
        instance of this action can be specified. Compatible with:
        Inspect

        """

    class PublishFindingsToCloudDataCatalog(proto.Message):
        r"""Publish findings of a DlpJob to Data Catalog. In Data Catalog, tag
        templates are applied to the resource that Cloud DLP scanned. Data
        Catalog tag templates are stored in the same project and region
        where the BigQuery table exists. For Cloud DLP to create and apply
        the tag template, the Cloud DLP service agent must have the
        ``roles/datacatalog.tagTemplateOwner`` permission on the project.
        The tag template contains fields summarizing the results of the
        DlpJob. Any field values previously written by another DlpJob are
        deleted. [InfoType naming patterns][google.privacy.dlp.v2.InfoType]
        are strictly enforced when using this feature.

        Findings are persisted in Data Catalog storage and are governed by
        service-specific policies for Data Catalog. For more information,
        see `Service Specific
        Terms <https://cloud.google.com/terms/service-terms>`__.

        Only a single instance of this action can be specified. This action
        is allowed only if all resources being scanned are BigQuery tables.
        Compatible with: Inspect

        """

    class Deidentify(proto.Message):
        r"""Create a de-identified copy of the requested table or files.

        A TransformationDetail will be created for each transformation.

        If any rows in BigQuery are skipped during de-identification
        (transformation errors or row size exceeds BigQuery insert API
        limits) they are placed in the failure output table. If the original
        row exceeds the BigQuery insert API limit it will be truncated when
        written to the failure output table. The failure output table can be
        set in the
        action.deidentify.output.big_query_output.deidentified_failure_output_table
        field, if no table is set, a table will be automatically created in
        the same project and dataset as the original table.

        Compatible with: Inspect


        .. _oneof: https://proto-plus-python.readthedocs.io/en/stable/fields.html#oneofs-mutually-exclusive-fields

        Attributes:
            transformation_config (google.cloud.dlp_v2.types.TransformationConfig):
                User specified deidentify templates and
                configs for structured, unstructured, and image
                files.
            transformation_details_storage_config (google.cloud.dlp_v2.types.TransformationDetailsStorageConfig):
                Config for storing transformation details. This is separate
                from the de-identified content, and contains metadata about
                the successful transformations and/or failures that occurred
                while de-identifying. This needs to be set in order for
                users to access information about the status of each
                transformation (see
                [TransformationDetails][google.privacy.dlp.v2.TransformationDetails]
                message for more information about what is noted).
            cloud_storage_output (str):
                Required. User settable Cloud Storage bucket
                and folders to store de-identified files. This
                field must be set for cloud storage
                deidentification. The output Cloud Storage
                bucket must be different from the input bucket.
                De-identified files will overwrite files in the
                output path.
                Form of: gs://bucket/folder/ or gs://bucket

                This field is a member of `oneof`_ ``output``.
            file_types_to_transform (Sequence[google.cloud.dlp_v2.types.FileType]):
                List of user-specified file type groups to transform. If
                specified, only the files with these filetypes will be
                transformed. If empty, all supported files will be
                transformed. Supported types may be automatically added over
                time. If a file type is set in this field that isn't
                supported by the Deidentify action then the job will fail
                and will not be successfully created/started. Currently the
                only filetypes supported are: IMAGES, TEXT_FILES, CSV, TSV.
        """

        transformation_config = proto.Field(
            proto.MESSAGE,
            number=7,
            message="TransformationConfig",
        )
        transformation_details_storage_config = proto.Field(
            proto.MESSAGE,
            number=3,
            message="TransformationDetailsStorageConfig",
        )
        cloud_storage_output = proto.Field(
            proto.STRING,
            number=9,
            oneof="output",
        )
        file_types_to_transform = proto.RepeatedField(
            proto.ENUM,
            number=8,
            enum=storage.FileType,
        )

    class JobNotificationEmails(proto.Message):
        r"""Sends an email when the job completes. The email goes to IAM project
        owners and technical `Essential
        Contacts <https://cloud.google.com/resource-manager/docs/managing-notification-contacts>`__.

        """

    class PublishToStackdriver(proto.Message):
        r"""Enable Stackdriver metric dlp.googleapis.com/finding_count. This
        will publish a metric to stack driver on each infotype requested and
        how many findings were found for it. CustomDetectors will be
        bucketed as 'Custom' under the Stackdriver label 'info_type'.

        """

    save_findings = proto.Field(
        proto.MESSAGE,
        number=1,
        oneof="action",
        message=SaveFindings,
    )
    pub_sub = proto.Field(
        proto.MESSAGE,
        number=2,
        oneof="action",
        message=PublishToPubSub,
    )
    publish_summary_to_cscc = proto.Field(
        proto.MESSAGE,
        number=3,
        oneof="action",
        message=PublishSummaryToCscc,
    )
    publish_findings_to_cloud_data_catalog = proto.Field(
        proto.MESSAGE,
        number=5,
        oneof="action",
        message=PublishFindingsToCloudDataCatalog,
    )
    deidentify = proto.Field(
        proto.MESSAGE,
        number=7,
        oneof="action",
        message=Deidentify,
    )
    job_notification_emails = proto.Field(
        proto.MESSAGE,
        number=8,
        oneof="action",
        message=JobNotificationEmails,
    )
    publish_to_stackdriver = proto.Field(
        proto.MESSAGE,
        number=9,
        oneof="action",
        message=PublishToStackdriver,
    )


class TransformationConfig(proto.Message):
    r"""User specified templates and configs for how to deidentify
    structured, unstructures, and image files. User must provide
    either a unstructured deidentify template or at least one redact
    image config.

    Attributes:
        deidentify_template (str):
            De-identify template. If this template is specified, it will
            serve as the default de-identify template. This template
            cannot contain ``record_transformations`` since it can be
            used for unstructured content such as free-form text files.
            If this template is not set, a default
            ``ReplaceWithInfoTypeConfig`` will be used to de-identify
            unstructured content.
        structured_deidentify_template (str):
            Structured de-identify template. If this template is
            specified, it will serve as the de-identify template for
            structured content such as delimited files and tables. If
            this template is not set but the ``deidentify_template`` is
            set, then ``deidentify_template`` will also apply to the
            structured content. If neither template is set, a default
            ``ReplaceWithInfoTypeConfig`` will be used to de-identify
            structured content.
        image_redact_template (str):
            Image redact template.
            If this template is specified, it will serve as
            the de-identify template for images. If this
            template is not set, all findings in the image
            will be redacted with a black box.
    """

    deidentify_template = proto.Field(
        proto.STRING,
        number=1,
    )
    structured_deidentify_template = proto.Field(
        proto.STRING,
        number=2,
    )
    image_redact_template = proto.Field(
        proto.STRING,
        number=4,
    )


class CreateInspectTemplateRequest(proto.Message):
    r"""Request message for CreateInspectTemplate.

    Attributes:
        parent (str):
            Required. Parent resource name.

            The format of this value varies depending on the scope of
            the request (project or organization) and whether you have
            `specified a processing
            location <https://cloud.google.com/dlp/docs/specifying-location>`__:

            -  Projects scope, location specified:
               ``projects/``\ PROJECT_ID\ ``/locations/``\ LOCATION_ID
            -  Projects scope, no location specified (defaults to
               global): ``projects/``\ PROJECT_ID
            -  Organizations scope, location specified:
               ``organizations/``\ ORG_ID\ ``/locations/``\ LOCATION_ID
            -  Organizations scope, no location specified (defaults to
               global): ``organizations/``\ ORG_ID

            The following example ``parent`` string specifies a parent
            project with the identifier ``example-project``, and
            specifies the ``europe-west3`` location for processing data:

            ::

                parent=projects/example-project/locations/europe-west3
        inspect_template (google.cloud.dlp_v2.types.InspectTemplate):
            Required. The InspectTemplate to create.
        template_id (str):
            The template id can contain uppercase and lowercase letters,
            numbers, and hyphens; that is, it must match the regular
            expression: ``[a-zA-Z\d-_]+``. The maximum length is 100
            characters. Can be empty to allow the system to generate
            one.
        location_id (str):
            Deprecated. This field has no effect.
    """

    parent = proto.Field(
        proto.STRING,
        number=1,
    )
    inspect_template = proto.Field(
        proto.MESSAGE,
        number=2,
        message="InspectTemplate",
    )
    template_id = proto.Field(
        proto.STRING,
        number=3,
    )
    location_id = proto.Field(
        proto.STRING,
        number=4,
    )


class UpdateInspectTemplateRequest(proto.Message):
    r"""Request message for UpdateInspectTemplate.

    Attributes:
        name (str):
            Required. Resource name of organization and inspectTemplate
            to be updated, for example
            ``organizations/433245324/inspectTemplates/432452342`` or
            projects/project-id/inspectTemplates/432452342.
        inspect_template (google.cloud.dlp_v2.types.InspectTemplate):
            New InspectTemplate value.
        update_mask (google.protobuf.field_mask_pb2.FieldMask):
            Mask to control which fields get updated.
    """

    name = proto.Field(
        proto.STRING,
        number=1,
    )
    inspect_template = proto.Field(
        proto.MESSAGE,
        number=2,
        message="InspectTemplate",
    )
    update_mask = proto.Field(
        proto.MESSAGE,
        number=3,
        message=field_mask_pb2.FieldMask,
    )


class GetInspectTemplateRequest(proto.Message):
    r"""Request message for GetInspectTemplate.

    Attributes:
        name (str):
            Required. Resource name of the organization and
            inspectTemplate to be read, for example
            ``organizations/433245324/inspectTemplates/432452342`` or
            projects/project-id/inspectTemplates/432452342.
    """

    name = proto.Field(
        proto.STRING,
        number=1,
    )


class ListInspectTemplatesRequest(proto.Message):
    r"""Request message for ListInspectTemplates.

    Attributes:
        parent (str):
            Required. Parent resource name.

            The format of this value varies depending on the scope of
            the request (project or organization) and whether you have
            `specified a processing
            location <https://cloud.google.com/dlp/docs/specifying-location>`__:

            -  Projects scope, location specified:
               ``projects/``\ PROJECT_ID\ ``/locations/``\ LOCATION_ID
            -  Projects scope, no location specified (defaults to
               global): ``projects/``\ PROJECT_ID
            -  Organizations scope, location specified:
               ``organizations/``\ ORG_ID\ ``/locations/``\ LOCATION_ID
            -  Organizations scope, no location specified (defaults to
               global): ``organizations/``\ ORG_ID

            The following example ``parent`` string specifies a parent
            project with the identifier ``example-project``, and
            specifies the ``europe-west3`` location for processing data:

            ::

                parent=projects/example-project/locations/europe-west3
        page_token (str):
            Page token to continue retrieval. Comes from previous call
            to ``ListInspectTemplates``.
        page_size (int):
            Size of the page, can be limited by the
            server. If zero server returns a page of max
            size 100.
        order_by (str):
            Comma separated list of fields to order by, followed by
            ``asc`` or ``desc`` postfix. This list is case-insensitive,
            default sorting order is ascending, redundant space
            characters are insignificant.

            Example: ``name asc,update_time, create_time desc``

            Supported fields are:

            -  ``create_time``: corresponds to the time the template was
               created.
            -  ``update_time``: corresponds to the time the template was
               last updated.
            -  ``name``: corresponds to the template's name.
            -  ``display_name``: corresponds to the template's display
               name.
        location_id (str):
            Deprecated. This field has no effect.
    """

    parent = proto.Field(
        proto.STRING,
        number=1,
    )
    page_token = proto.Field(
        proto.STRING,
        number=2,
    )
    page_size = proto.Field(
        proto.INT32,
        number=3,
    )
    order_by = proto.Field(
        proto.STRING,
        number=4,
    )
    location_id = proto.Field(
        proto.STRING,
        number=5,
    )


class ListInspectTemplatesResponse(proto.Message):
    r"""Response message for ListInspectTemplates.

    Attributes:
        inspect_templates (Sequence[google.cloud.dlp_v2.types.InspectTemplate]):
            List of inspectTemplates, up to page_size in
            ListInspectTemplatesRequest.
        next_page_token (str):
            If the next page is available then the next
            page token to be used in following
            ListInspectTemplates request.
    """

    @property
    def raw_page(self):
        return self

    inspect_templates = proto.RepeatedField(
        proto.MESSAGE,
        number=1,
        message="InspectTemplate",
    )
    next_page_token = proto.Field(
        proto.STRING,
        number=2,
    )


class DeleteInspectTemplateRequest(proto.Message):
    r"""Request message for DeleteInspectTemplate.

    Attributes:
        name (str):
            Required. Resource name of the organization and
            inspectTemplate to be deleted, for example
            ``organizations/433245324/inspectTemplates/432452342`` or
            projects/project-id/inspectTemplates/432452342.
    """

    name = proto.Field(
        proto.STRING,
        number=1,
    )


class CreateJobTriggerRequest(proto.Message):
    r"""Request message for CreateJobTrigger.

    Attributes:
        parent (str):
            Required. Parent resource name.

            The format of this value varies depending on whether you
            have `specified a processing
            location <https://cloud.google.com/dlp/docs/specifying-location>`__:

            -  Projects scope, location specified:
               ``projects/``\ PROJECT_ID\ ``/locations/``\ LOCATION_ID
            -  Projects scope, no location specified (defaults to
               global): ``projects/``\ PROJECT_ID

            The following example ``parent`` string specifies a parent
            project with the identifier ``example-project``, and
            specifies the ``europe-west3`` location for processing data:

            ::

                parent=projects/example-project/locations/europe-west3
        job_trigger (google.cloud.dlp_v2.types.JobTrigger):
            Required. The JobTrigger to create.
        trigger_id (str):
            The trigger id can contain uppercase and lowercase letters,
            numbers, and hyphens; that is, it must match the regular
            expression: ``[a-zA-Z\d-_]+``. The maximum length is 100
            characters. Can be empty to allow the system to generate
            one.
        location_id (str):
            Deprecated. This field has no effect.
    """

    parent = proto.Field(
        proto.STRING,
        number=1,
    )
    job_trigger = proto.Field(
        proto.MESSAGE,
        number=2,
        message="JobTrigger",
    )
    trigger_id = proto.Field(
        proto.STRING,
        number=3,
    )
    location_id = proto.Field(
        proto.STRING,
        number=4,
    )


class ActivateJobTriggerRequest(proto.Message):
    r"""Request message for ActivateJobTrigger.

    Attributes:
        name (str):
            Required. Resource name of the trigger to activate, for
            example ``projects/dlp-test-project/jobTriggers/53234423``.
    """

    name = proto.Field(
        proto.STRING,
        number=1,
    )


class UpdateJobTriggerRequest(proto.Message):
    r"""Request message for UpdateJobTrigger.

    Attributes:
        name (str):
            Required. Resource name of the project and the triggeredJob,
            for example
            ``projects/dlp-test-project/jobTriggers/53234423``.
        job_trigger (google.cloud.dlp_v2.types.JobTrigger):
            New JobTrigger value.
        update_mask (google.protobuf.field_mask_pb2.FieldMask):
            Mask to control which fields get updated.
    """

    name = proto.Field(
        proto.STRING,
        number=1,
    )
    job_trigger = proto.Field(
        proto.MESSAGE,
        number=2,
        message="JobTrigger",
    )
    update_mask = proto.Field(
        proto.MESSAGE,
        number=3,
        message=field_mask_pb2.FieldMask,
    )


class GetJobTriggerRequest(proto.Message):
    r"""Request message for GetJobTrigger.

    Attributes:
        name (str):
            Required. Resource name of the project and the triggeredJob,
            for example
            ``projects/dlp-test-project/jobTriggers/53234423``.
    """

    name = proto.Field(
        proto.STRING,
        number=1,
    )


class CreateDlpJobRequest(proto.Message):
    r"""Request message for CreateDlpJobRequest. Used to initiate
    long running jobs such as calculating risk metrics or inspecting
    Google Cloud Storage.

    This message has `oneof`_ fields (mutually exclusive fields).
    For each oneof, at most one member field can be set at the same time.
    Setting any member of the oneof automatically clears all other
    members.

    .. _oneof: https://proto-plus-python.readthedocs.io/en/stable/fields.html#oneofs-mutually-exclusive-fields

    Attributes:
        parent (str):
            Required. Parent resource name.

            The format of this value varies depending on whether you
            have `specified a processing
            location <https://cloud.google.com/dlp/docs/specifying-location>`__:

            -  Projects scope, location specified:
               ``projects/``\ PROJECT_ID\ ``/locations/``\ LOCATION_ID
            -  Projects scope, no location specified (defaults to
               global): ``projects/``\ PROJECT_ID

            The following example ``parent`` string specifies a parent
            project with the identifier ``example-project``, and
            specifies the ``europe-west3`` location for processing data:

            ::

                parent=projects/example-project/locations/europe-west3
        inspect_job (google.cloud.dlp_v2.types.InspectJobConfig):
            An inspection job scans a storage repository
            for InfoTypes.

            This field is a member of `oneof`_ ``job``.
        risk_job (google.cloud.dlp_v2.types.RiskAnalysisJobConfig):
            A risk analysis job calculates
            re-identification risk metrics for a BigQuery
            table.

            This field is a member of `oneof`_ ``job``.
        job_id (str):
            The job id can contain uppercase and lowercase letters,
            numbers, and hyphens; that is, it must match the regular
            expression: ``[a-zA-Z\d-_]+``. The maximum length is 100
            characters. Can be empty to allow the system to generate
            one.
        location_id (str):
            Deprecated. This field has no effect.
    """

    parent = proto.Field(
        proto.STRING,
        number=1,
    )
    inspect_job = proto.Field(
        proto.MESSAGE,
        number=2,
        oneof="job",
        message="InspectJobConfig",
    )
    risk_job = proto.Field(
        proto.MESSAGE,
        number=3,
        oneof="job",
        message="RiskAnalysisJobConfig",
    )
    job_id = proto.Field(
        proto.STRING,
        number=4,
    )
    location_id = proto.Field(
        proto.STRING,
        number=5,
    )


class ListJobTriggersRequest(proto.Message):
    r"""Request message for ListJobTriggers.

    Attributes:
        parent (str):
            Required. Parent resource name.

            The format of this value varies depending on whether you
            have `specified a processing
            location <https://cloud.google.com/dlp/docs/specifying-location>`__:

            -  Projects scope, location specified:
               ``projects/``\ PROJECT_ID\ ``/locations/``\ LOCATION_ID
            -  Projects scope, no location specified (defaults to
               global): ``projects/``\ PROJECT_ID

            The following example ``parent`` string specifies a parent
            project with the identifier ``example-project``, and
            specifies the ``europe-west3`` location for processing data:

            ::

                parent=projects/example-project/locations/europe-west3
        page_token (str):
            Page token to continue retrieval. Comes from previous call
            to ListJobTriggers. ``order_by`` field must not change for
            subsequent calls.
        page_size (int):
            Size of the page, can be limited by a server.
        order_by (str):
            Comma separated list of triggeredJob fields to order by,
            followed by ``asc`` or ``desc`` postfix. This list is
            case-insensitive, default sorting order is ascending,
            redundant space characters are insignificant.

            Example: ``name asc,update_time, create_time desc``

            Supported fields are:

            -  ``create_time``: corresponds to the time the JobTrigger
               was created.
            -  ``update_time``: corresponds to the time the JobTrigger
               was last updated.
            -  ``last_run_time``: corresponds to the last time the
               JobTrigger ran.
            -  ``name``: corresponds to the JobTrigger's name.
            -  ``display_name``: corresponds to the JobTrigger's display
               name.
            -  ``status``: corresponds to JobTrigger's status.
        filter (str):
            Allows filtering.

            Supported syntax:

            -  Filter expressions are made up of one or more
               restrictions.
            -  Restrictions can be combined by ``AND`` or ``OR`` logical
               operators. A sequence of restrictions implicitly uses
               ``AND``.
            -  A restriction has the form of
               ``{field} {operator} {value}``.
            -  Supported fields/values for inspect triggers:

               -  ``status`` - HEALTHY|PAUSED|CANCELLED
               -  ``inspected_storage`` -
                  DATASTORE|CLOUD_STORAGE|BIGQUERY
               -  'last_run_time\` - RFC 3339 formatted timestamp,
                  surrounded by quotation marks. Nanoseconds are
                  ignored.
               -  'error_count' - Number of errors that have occurred
                  while running.

            -  The operator must be ``=`` or ``!=`` for status and
               inspected_storage.

            Examples:

            -  inspected_storage = cloud_storage AND status = HEALTHY
            -  inspected_storage = cloud_storage OR inspected_storage =
               bigquery
            -  inspected_storage = cloud_storage AND (state = PAUSED OR
               state = HEALTHY)
            -  last_run_time > "2017-12-12T00:00:00+00:00"

            The length of this field should be no more than 500
            characters.
        type_ (google.cloud.dlp_v2.types.DlpJobType):
            The type of jobs. Will use ``DlpJobType.INSPECT`` if not
            set.
        location_id (str):
            Deprecated. This field has no effect.
    """

    parent = proto.Field(
        proto.STRING,
        number=1,
    )
    page_token = proto.Field(
        proto.STRING,
        number=2,
    )
    page_size = proto.Field(
        proto.INT32,
        number=3,
    )
    order_by = proto.Field(
        proto.STRING,
        number=4,
    )
    filter = proto.Field(
        proto.STRING,
        number=5,
    )
    type_ = proto.Field(
        proto.ENUM,
        number=6,
        enum="DlpJobType",
    )
    location_id = proto.Field(
        proto.STRING,
        number=7,
    )


class ListJobTriggersResponse(proto.Message):
    r"""Response message for ListJobTriggers.

    Attributes:
        job_triggers (Sequence[google.cloud.dlp_v2.types.JobTrigger]):
            List of triggeredJobs, up to page_size in
            ListJobTriggersRequest.
        next_page_token (str):
            If the next page is available then the next
            page token to be used in following
            ListJobTriggers request.
    """

    @property
    def raw_page(self):
        return self

    job_triggers = proto.RepeatedField(
        proto.MESSAGE,
        number=1,
        message="JobTrigger",
    )
    next_page_token = proto.Field(
        proto.STRING,
        number=2,
    )


class DeleteJobTriggerRequest(proto.Message):
    r"""Request message for DeleteJobTrigger.

    Attributes:
        name (str):
            Required. Resource name of the project and the triggeredJob,
            for example
            ``projects/dlp-test-project/jobTriggers/53234423``.
    """

    name = proto.Field(
        proto.STRING,
        number=1,
    )


class InspectJobConfig(proto.Message):
    r"""Controls what and how to inspect for findings.

    Attributes:
        storage_config (google.cloud.dlp_v2.types.StorageConfig):
            The data to scan.
        inspect_config (google.cloud.dlp_v2.types.InspectConfig):
            How and what to scan for.
        inspect_template_name (str):
            If provided, will be used as the default for all values in
            InspectConfig. ``inspect_config`` will be merged into the
            values persisted as part of the template.
        actions (Sequence[google.cloud.dlp_v2.types.Action]):
            Actions to execute at the completion of the
            job.
    """

    storage_config = proto.Field(
        proto.MESSAGE,
        number=1,
        message=storage.StorageConfig,
    )
    inspect_config = proto.Field(
        proto.MESSAGE,
        number=2,
        message="InspectConfig",
    )
    inspect_template_name = proto.Field(
        proto.STRING,
        number=3,
    )
    actions = proto.RepeatedField(
        proto.MESSAGE,
        number=4,
        message="Action",
    )


class DataProfileAction(proto.Message):
    r"""A task to execute when a data profile has been generated.

    This message has `oneof`_ fields (mutually exclusive fields).
    For each oneof, at most one member field can be set at the same time.
    Setting any member of the oneof automatically clears all other
    members.

    .. _oneof: https://proto-plus-python.readthedocs.io/en/stable/fields.html#oneofs-mutually-exclusive-fields

    Attributes:
        export_data (google.cloud.dlp_v2.types.DataProfileAction.Export):
            Export data profiles into a provided
            location.

            This field is a member of `oneof`_ ``action``.
        pub_sub_notification (google.cloud.dlp_v2.types.DataProfileAction.PubSubNotification):
            Publish a message into the Pub/Sub topic.

            This field is a member of `oneof`_ ``action``.
    """

    class EventType(proto.Enum):
        r"""Types of event that can trigger an action."""
        EVENT_TYPE_UNSPECIFIED = 0
        NEW_PROFILE = 1
        CHANGED_PROFILE = 2
        SCORE_INCREASED = 3
        ERROR_CHANGED = 4

    class Export(proto.Message):
        r"""If set, the detailed data profiles will be persisted to the
        location of your choice whenever updated.

        Attributes:
            profile_table (google.cloud.dlp_v2.types.BigQueryTable):
                Store all table and column profiles in an
                existing table or a new table in an existing
                dataset. Each re-generation will result in a new
                row in BigQuery.
        """

        profile_table = proto.Field(
            proto.MESSAGE,
            number=1,
            message=storage.BigQueryTable,
        )

    class PubSubNotification(proto.Message):
        r"""Send a Pub/Sub message into the given Pub/Sub topic to connect other
        systems to data profile generation. The message payload data will be
        the byte serialization of ``DataProfilePubSubMessage``.

        Attributes:
            topic (str):
                Cloud Pub/Sub topic to send notifications to.
                Format is projects/{project}/topics/{topic}.
            event (google.cloud.dlp_v2.types.DataProfileAction.EventType):
                The type of event that triggers a Pub/Sub. At most one
                ``PubSubNotification`` per EventType is permitted.
            pubsub_condition (google.cloud.dlp_v2.types.DataProfilePubSubCondition):
                Conditions (e.g., data risk or sensitivity
                level) for triggering a Pub/Sub.
            detail_of_message (google.cloud.dlp_v2.types.DataProfileAction.PubSubNotification.DetailLevel):
                How much data to include in the Pub/Sub message. If the user
                wishes to limit the size of the message, they can use
                resource_name and fetch the profile fields they wish to. Per
                table profile (not per column).
        """

        class DetailLevel(proto.Enum):
            r"""The levels of detail that can be included in the Pub/Sub
            message.
            """
            DETAIL_LEVEL_UNSPECIFIED = 0
            TABLE_PROFILE = 1
            RESOURCE_NAME = 2

        topic = proto.Field(
            proto.STRING,
            number=1,
        )
        event = proto.Field(
            proto.ENUM,
            number=2,
            enum="DataProfileAction.EventType",
        )
        pubsub_condition = proto.Field(
            proto.MESSAGE,
            number=3,
            message="DataProfilePubSubCondition",
        )
        detail_of_message = proto.Field(
            proto.ENUM,
            number=4,
            enum="DataProfileAction.PubSubNotification.DetailLevel",
        )

    export_data = proto.Field(
        proto.MESSAGE,
        number=1,
        oneof="action",
        message=Export,
    )
    pub_sub_notification = proto.Field(
        proto.MESSAGE,
        number=2,
        oneof="action",
        message=PubSubNotification,
    )


class DataProfileJobConfig(proto.Message):
    r"""Configuration for setting up a job to scan resources for profile
    generation. Only one data profile configuration may exist per
    organization, folder, or project.

    The generated data profiles are retained according to the [data
    retention policy]
    (https://cloud.google.com/dlp/docs/data-profiles#retention).

    Attributes:
        location (google.cloud.dlp_v2.types.DataProfileLocation):
            The data to scan.
        project_id (str):
            The project that will run the scan. The DLP
            service account that exists within this project
            must have access to all resources that are
            profiled, and the Cloud DLP API must be enabled.
        inspect_templates (Sequence[str]):
            Detection logic for profile generation.

            Not all template features are used by profiles.
            FindingLimits, include_quote and exclude_info_types have no
            impact on data profiling.

            Multiple templates may be provided if there is data in
            multiple regions. At most one template must be specified
            per-region (including "global"). Each region is scanned
            using the applicable template. If no region-specific
            template is specified, but a "global" template is specified,
            it will be copied to that region and used instead. If no
            global or region-specific template is provided for a region
            with data, that region's data will not be scanned.

            For more information, see
            https://cloud.google.com/dlp/docs/data-profiles#data_residency.
        data_profile_actions (Sequence[google.cloud.dlp_v2.types.DataProfileAction]):
            Actions to execute at the completion of the
            job.
    """

    location = proto.Field(
        proto.MESSAGE,
        number=1,
        message="DataProfileLocation",
    )
    project_id = proto.Field(
        proto.STRING,
        number=5,
    )
    inspect_templates = proto.RepeatedField(
        proto.STRING,
        number=7,
    )
    data_profile_actions = proto.RepeatedField(
        proto.MESSAGE,
        number=6,
        message="DataProfileAction",
    )


class DataProfileLocation(proto.Message):
    r"""The data that will be profiled.

    This message has `oneof`_ fields (mutually exclusive fields).
    For each oneof, at most one member field can be set at the same time.
    Setting any member of the oneof automatically clears all other
    members.

    .. _oneof: https://proto-plus-python.readthedocs.io/en/stable/fields.html#oneofs-mutually-exclusive-fields

    Attributes:
        organization_id (int):
            The ID of an organization to scan.

            This field is a member of `oneof`_ ``location``.
        folder_id (int):
            The ID of the Folder within an organization
            to scan.

            This field is a member of `oneof`_ ``location``.
    """

    organization_id = proto.Field(
        proto.INT64,
        number=1,
        oneof="location",
    )
    folder_id = proto.Field(
        proto.INT64,
        number=2,
        oneof="location",
    )


class DlpJob(proto.Message):
    r"""Combines all of the information about a DLP job.

    This message has `oneof`_ fields (mutually exclusive fields).
    For each oneof, at most one member field can be set at the same time.
    Setting any member of the oneof automatically clears all other
    members.

    .. _oneof: https://proto-plus-python.readthedocs.io/en/stable/fields.html#oneofs-mutually-exclusive-fields

    Attributes:
        name (str):
            The server-assigned name.
        type_ (google.cloud.dlp_v2.types.DlpJobType):
            The type of job.
        state (google.cloud.dlp_v2.types.DlpJob.JobState):
            State of a job.
        risk_details (google.cloud.dlp_v2.types.AnalyzeDataSourceRiskDetails):
            Results from analyzing risk of a data source.

            This field is a member of `oneof`_ ``details``.
        inspect_details (google.cloud.dlp_v2.types.InspectDataSourceDetails):
            Results from inspecting a data source.

            This field is a member of `oneof`_ ``details``.
        create_time (google.protobuf.timestamp_pb2.Timestamp):
            Time when the job was created.
        start_time (google.protobuf.timestamp_pb2.Timestamp):
            Time when the job started.
        end_time (google.protobuf.timestamp_pb2.Timestamp):
            Time when the job finished.
        job_trigger_name (str):
            If created by a job trigger, the resource
            name of the trigger that instantiated the job.
        errors (Sequence[google.cloud.dlp_v2.types.Error]):
            A stream of errors encountered running the
            job.
    """

    class JobState(proto.Enum):
        r"""Possible states of a job. New items may be added."""
        JOB_STATE_UNSPECIFIED = 0
        PENDING = 1
        RUNNING = 2
        DONE = 3
        CANCELED = 4
        FAILED = 5
        ACTIVE = 6

    name = proto.Field(
        proto.STRING,
        number=1,
    )
    type_ = proto.Field(
        proto.ENUM,
        number=2,
        enum="DlpJobType",
    )
    state = proto.Field(
        proto.ENUM,
        number=3,
        enum=JobState,
    )
    risk_details = proto.Field(
        proto.MESSAGE,
        number=4,
        oneof="details",
        message="AnalyzeDataSourceRiskDetails",
    )
    inspect_details = proto.Field(
        proto.MESSAGE,
        number=5,
        oneof="details",
        message="InspectDataSourceDetails",
    )
    create_time = proto.Field(
        proto.MESSAGE,
        number=6,
        message=timestamp_pb2.Timestamp,
    )
    start_time = proto.Field(
        proto.MESSAGE,
        number=7,
        message=timestamp_pb2.Timestamp,
    )
    end_time = proto.Field(
        proto.MESSAGE,
        number=8,
        message=timestamp_pb2.Timestamp,
    )
    job_trigger_name = proto.Field(
        proto.STRING,
        number=10,
    )
    errors = proto.RepeatedField(
        proto.MESSAGE,
        number=11,
        message="Error",
    )


class GetDlpJobRequest(proto.Message):
    r"""The request message for [DlpJobs.GetDlpJob][].

    Attributes:
        name (str):
            Required. The name of the DlpJob resource.
    """

    name = proto.Field(
        proto.STRING,
        number=1,
    )


class ListDlpJobsRequest(proto.Message):
    r"""The request message for listing DLP jobs.

    Attributes:
        parent (str):
            Required. Parent resource name.

            The format of this value varies depending on whether you
            have `specified a processing
            location <https://cloud.google.com/dlp/docs/specifying-location>`__:

            -  Projects scope, location specified:
               ``projects/``\ PROJECT_ID\ ``/locations/``\ LOCATION_ID
            -  Projects scope, no location specified (defaults to
               global): ``projects/``\ PROJECT_ID

            The following example ``parent`` string specifies a parent
            project with the identifier ``example-project``, and
            specifies the ``europe-west3`` location for processing data:

            ::

                parent=projects/example-project/locations/europe-west3
        filter (str):
            Allows filtering.

            Supported syntax:

            -  Filter expressions are made up of one or more
               restrictions.
            -  Restrictions can be combined by ``AND`` or ``OR`` logical
               operators. A sequence of restrictions implicitly uses
               ``AND``.
            -  A restriction has the form of
               ``{field} {operator} {value}``.
            -  Supported fields/values for inspect jobs:

               -  ``state`` - PENDING|RUNNING|CANCELED|FINISHED|FAILED
               -  ``inspected_storage`` -
                  DATASTORE|CLOUD_STORAGE|BIGQUERY
               -  ``trigger_name`` - The name of the trigger that
                  created the job.
               -  'end_time\` - Corresponds to the time the job
                  finished.
               -  'start_time\` - Corresponds to the time the job
                  finished.

            -  Supported fields for risk analysis jobs:

               -  ``state`` - RUNNING|CANCELED|FINISHED|FAILED
               -  'end_time\` - Corresponds to the time the job
                  finished.
               -  'start_time\` - Corresponds to the time the job
                  finished.

            -  The operator must be ``=`` or ``!=``.

            Examples:

            -  inspected_storage = cloud_storage AND state = done
            -  inspected_storage = cloud_storage OR inspected_storage =
               bigquery
            -  inspected_storage = cloud_storage AND (state = done OR
               state = canceled)
            -  end_time > "2017-12-12T00:00:00+00:00"

            The length of this field should be no more than 500
            characters.
        page_size (int):
            The standard list page size.
        page_token (str):
            The standard list page token.
        type_ (google.cloud.dlp_v2.types.DlpJobType):
            The type of job. Defaults to ``DlpJobType.INSPECT``
        order_by (str):
            Comma separated list of fields to order by, followed by
            ``asc`` or ``desc`` postfix. This list is case-insensitive,
            default sorting order is ascending, redundant space
            characters are insignificant.

            Example: ``name asc, end_time asc, create_time desc``

            Supported fields are:

            -  ``create_time``: corresponds to the time the job was
               created.
            -  ``end_time``: corresponds to the time the job ended.
            -  ``name``: corresponds to the job's name.
            -  ``state``: corresponds to ``state``
        location_id (str):
            Deprecated. This field has no effect.
    """

    parent = proto.Field(
        proto.STRING,
        number=4,
    )
    filter = proto.Field(
        proto.STRING,
        number=1,
    )
    page_size = proto.Field(
        proto.INT32,
        number=2,
    )
    page_token = proto.Field(
        proto.STRING,
        number=3,
    )
    type_ = proto.Field(
        proto.ENUM,
        number=5,
        enum="DlpJobType",
    )
    order_by = proto.Field(
        proto.STRING,
        number=6,
    )
    location_id = proto.Field(
        proto.STRING,
        number=7,
    )


class ListDlpJobsResponse(proto.Message):
    r"""The response message for listing DLP jobs.

    Attributes:
        jobs (Sequence[google.cloud.dlp_v2.types.DlpJob]):
            A list of DlpJobs that matches the specified
            filter in the request.
        next_page_token (str):
            The standard List next-page token.
    """

    @property
    def raw_page(self):
        return self

    jobs = proto.RepeatedField(
        proto.MESSAGE,
        number=1,
        message="DlpJob",
    )
    next_page_token = proto.Field(
        proto.STRING,
        number=2,
    )


class CancelDlpJobRequest(proto.Message):
    r"""The request message for canceling a DLP job.

    Attributes:
        name (str):
            Required. The name of the DlpJob resource to
            be cancelled.
    """

    name = proto.Field(
        proto.STRING,
        number=1,
    )


class FinishDlpJobRequest(proto.Message):
    r"""The request message for finishing a DLP hybrid job.

    Attributes:
        name (str):
            Required. The name of the DlpJob resource to
            be cancelled.
    """

    name = proto.Field(
        proto.STRING,
        number=1,
    )


class DeleteDlpJobRequest(proto.Message):
    r"""The request message for deleting a DLP job.

    Attributes:
        name (str):
            Required. The name of the DlpJob resource to
            be deleted.
    """

    name = proto.Field(
        proto.STRING,
        number=1,
    )


class CreateDeidentifyTemplateRequest(proto.Message):
    r"""Request message for CreateDeidentifyTemplate.

    Attributes:
        parent (str):
            Required. Parent resource name.

            The format of this value varies depending on the scope of
            the request (project or organization) and whether you have
            `specified a processing
            location <https://cloud.google.com/dlp/docs/specifying-location>`__:

            -  Projects scope, location specified:
               ``projects/``\ PROJECT_ID\ ``/locations/``\ LOCATION_ID
            -  Projects scope, no location specified (defaults to
               global): ``projects/``\ PROJECT_ID
            -  Organizations scope, location specified:
               ``organizations/``\ ORG_ID\ ``/locations/``\ LOCATION_ID
            -  Organizations scope, no location specified (defaults to
               global): ``organizations/``\ ORG_ID

            The following example ``parent`` string specifies a parent
            project with the identifier ``example-project``, and
            specifies the ``europe-west3`` location for processing data:

            ::

                parent=projects/example-project/locations/europe-west3
        deidentify_template (google.cloud.dlp_v2.types.DeidentifyTemplate):
            Required. The DeidentifyTemplate to create.
        template_id (str):
            The template id can contain uppercase and lowercase letters,
            numbers, and hyphens; that is, it must match the regular
            expression: ``[a-zA-Z\d-_]+``. The maximum length is 100
            characters. Can be empty to allow the system to generate
            one.
        location_id (str):
            Deprecated. This field has no effect.
    """

    parent = proto.Field(
        proto.STRING,
        number=1,
    )
    deidentify_template = proto.Field(
        proto.MESSAGE,
        number=2,
        message="DeidentifyTemplate",
    )
    template_id = proto.Field(
        proto.STRING,
        number=3,
    )
    location_id = proto.Field(
        proto.STRING,
        number=4,
    )


class UpdateDeidentifyTemplateRequest(proto.Message):
    r"""Request message for UpdateDeidentifyTemplate.

    Attributes:
        name (str):
            Required. Resource name of organization and deidentify
            template to be updated, for example
            ``organizations/433245324/deidentifyTemplates/432452342`` or
            projects/project-id/deidentifyTemplates/432452342.
        deidentify_template (google.cloud.dlp_v2.types.DeidentifyTemplate):
            New DeidentifyTemplate value.
        update_mask (google.protobuf.field_mask_pb2.FieldMask):
            Mask to control which fields get updated.
    """

    name = proto.Field(
        proto.STRING,
        number=1,
    )
    deidentify_template = proto.Field(
        proto.MESSAGE,
        number=2,
        message="DeidentifyTemplate",
    )
    update_mask = proto.Field(
        proto.MESSAGE,
        number=3,
        message=field_mask_pb2.FieldMask,
    )


class GetDeidentifyTemplateRequest(proto.Message):
    r"""Request message for GetDeidentifyTemplate.

    Attributes:
        name (str):
            Required. Resource name of the organization and deidentify
            template to be read, for example
            ``organizations/433245324/deidentifyTemplates/432452342`` or
            projects/project-id/deidentifyTemplates/432452342.
    """

    name = proto.Field(
        proto.STRING,
        number=1,
    )


class ListDeidentifyTemplatesRequest(proto.Message):
    r"""Request message for ListDeidentifyTemplates.

    Attributes:
        parent (str):
            Required. Parent resource name.

            The format of this value varies depending on the scope of
            the request (project or organization) and whether you have
            `specified a processing
            location <https://cloud.google.com/dlp/docs/specifying-location>`__:

            -  Projects scope, location specified:
               ``projects/``\ PROJECT_ID\ ``/locations/``\ LOCATION_ID
            -  Projects scope, no location specified (defaults to
               global): ``projects/``\ PROJECT_ID
            -  Organizations scope, location specified:
               ``organizations/``\ ORG_ID\ ``/locations/``\ LOCATION_ID
            -  Organizations scope, no location specified (defaults to
               global): ``organizations/``\ ORG_ID

            The following example ``parent`` string specifies a parent
            project with the identifier ``example-project``, and
            specifies the ``europe-west3`` location for processing data:

            ::

                parent=projects/example-project/locations/europe-west3
        page_token (str):
            Page token to continue retrieval. Comes from previous call
            to ``ListDeidentifyTemplates``.
        page_size (int):
            Size of the page, can be limited by the
            server. If zero server returns a page of max
            size 100.
        order_by (str):
            Comma separated list of fields to order by, followed by
            ``asc`` or ``desc`` postfix. This list is case-insensitive,
            default sorting order is ascending, redundant space
            characters are insignificant.

            Example: ``name asc,update_time, create_time desc``

            Supported fields are:

            -  ``create_time``: corresponds to the time the template was
               created.
            -  ``update_time``: corresponds to the time the template was
               last updated.
            -  ``name``: corresponds to the template's name.
            -  ``display_name``: corresponds to the template's display
               name.
        location_id (str):
            Deprecated. This field has no effect.
    """

    parent = proto.Field(
        proto.STRING,
        number=1,
    )
    page_token = proto.Field(
        proto.STRING,
        number=2,
    )
    page_size = proto.Field(
        proto.INT32,
        number=3,
    )
    order_by = proto.Field(
        proto.STRING,
        number=4,
    )
    location_id = proto.Field(
        proto.STRING,
        number=5,
    )


class ListDeidentifyTemplatesResponse(proto.Message):
    r"""Response message for ListDeidentifyTemplates.

    Attributes:
        deidentify_templates (Sequence[google.cloud.dlp_v2.types.DeidentifyTemplate]):
            List of deidentify templates, up to page_size in
            ListDeidentifyTemplatesRequest.
        next_page_token (str):
            If the next page is available then the next
            page token to be used in following
            ListDeidentifyTemplates request.
    """

    @property
    def raw_page(self):
        return self

    deidentify_templates = proto.RepeatedField(
        proto.MESSAGE,
        number=1,
        message="DeidentifyTemplate",
    )
    next_page_token = proto.Field(
        proto.STRING,
        number=2,
    )


class DeleteDeidentifyTemplateRequest(proto.Message):
    r"""Request message for DeleteDeidentifyTemplate.

    Attributes:
        name (str):
            Required. Resource name of the organization and deidentify
            template to be deleted, for example
            ``organizations/433245324/deidentifyTemplates/432452342`` or
            projects/project-id/deidentifyTemplates/432452342.
    """

    name = proto.Field(
        proto.STRING,
        number=1,
    )


class LargeCustomDictionaryConfig(proto.Message):
    r"""Configuration for a custom dictionary created from a data source of
    any size up to the maximum size defined in the
    `limits <https://cloud.google.com/dlp/limits>`__ page. The artifacts
    of dictionary creation are stored in the specified Cloud Storage
    location. Consider using ``CustomInfoType.Dictionary`` for smaller
    dictionaries that satisfy the size requirements.

    This message has `oneof`_ fields (mutually exclusive fields).
    For each oneof, at most one member field can be set at the same time.
    Setting any member of the oneof automatically clears all other
    members.

    .. _oneof: https://proto-plus-python.readthedocs.io/en/stable/fields.html#oneofs-mutually-exclusive-fields

    Attributes:
        output_path (google.cloud.dlp_v2.types.CloudStoragePath):
            Location to store dictionary artifacts in
            Cloud Storage. These files will only be
            accessible by project owners and the DLP API. If
            any of these artifacts are modified, the
            dictionary is considered invalid and can no
            longer be used.
        cloud_storage_file_set (google.cloud.dlp_v2.types.CloudStorageFileSet):
            Set of files containing newline-delimited
            lists of dictionary phrases.

            This field is a member of `oneof`_ ``source``.
        big_query_field (google.cloud.dlp_v2.types.BigQueryField):
            Field in a BigQuery table where each cell
            represents a dictionary phrase.

            This field is a member of `oneof`_ ``source``.
    """

    output_path = proto.Field(
        proto.MESSAGE,
        number=1,
        message=storage.CloudStoragePath,
    )
    cloud_storage_file_set = proto.Field(
        proto.MESSAGE,
        number=2,
        oneof="source",
        message=storage.CloudStorageFileSet,
    )
    big_query_field = proto.Field(
        proto.MESSAGE,
        number=3,
        oneof="source",
        message=storage.BigQueryField,
    )


class LargeCustomDictionaryStats(proto.Message):
    r"""Summary statistics of a custom dictionary.

    Attributes:
        approx_num_phrases (int):
            Approximate number of distinct phrases in the
            dictionary.
    """

    approx_num_phrases = proto.Field(
        proto.INT64,
        number=1,
    )


class StoredInfoTypeConfig(proto.Message):
    r"""Configuration for stored infoTypes. All fields and subfield
    are provided by the user. For more information, see
    https://cloud.google.com/dlp/docs/creating-custom-infotypes.

    This message has `oneof`_ fields (mutually exclusive fields).
    For each oneof, at most one member field can be set at the same time.
    Setting any member of the oneof automatically clears all other
    members.

    .. _oneof: https://proto-plus-python.readthedocs.io/en/stable/fields.html#oneofs-mutually-exclusive-fields

    Attributes:
        display_name (str):
            Display name of the StoredInfoType (max 256
            characters).
        description (str):
            Description of the StoredInfoType (max 256
            characters).
        large_custom_dictionary (google.cloud.dlp_v2.types.LargeCustomDictionaryConfig):
            StoredInfoType where findings are defined by
            a dictionary of phrases.

            This field is a member of `oneof`_ ``type``.
        dictionary (google.cloud.dlp_v2.types.CustomInfoType.Dictionary):
            Store dictionary-based CustomInfoType.

            This field is a member of `oneof`_ ``type``.
        regex (google.cloud.dlp_v2.types.CustomInfoType.Regex):
            Store regular expression-based
            StoredInfoType.

            This field is a member of `oneof`_ ``type``.
    """

    display_name = proto.Field(
        proto.STRING,
        number=1,
    )
    description = proto.Field(
        proto.STRING,
        number=2,
    )
    large_custom_dictionary = proto.Field(
        proto.MESSAGE,
        number=3,
        oneof="type",
        message="LargeCustomDictionaryConfig",
    )
    dictionary = proto.Field(
        proto.MESSAGE,
        number=4,
        oneof="type",
        message=storage.CustomInfoType.Dictionary,
    )
    regex = proto.Field(
        proto.MESSAGE,
        number=5,
        oneof="type",
        message=storage.CustomInfoType.Regex,
    )


class StoredInfoTypeStats(proto.Message):
    r"""Statistics for a StoredInfoType.

    .. _oneof: https://proto-plus-python.readthedocs.io/en/stable/fields.html#oneofs-mutually-exclusive-fields

    Attributes:
        large_custom_dictionary (google.cloud.dlp_v2.types.LargeCustomDictionaryStats):
            StoredInfoType where findings are defined by
            a dictionary of phrases.

            This field is a member of `oneof`_ ``type``.
    """

    large_custom_dictionary = proto.Field(
        proto.MESSAGE,
        number=1,
        oneof="type",
        message="LargeCustomDictionaryStats",
    )


class StoredInfoTypeVersion(proto.Message):
    r"""Version of a StoredInfoType, including the configuration used
    to build it, create timestamp, and current state.

    Attributes:
        config (google.cloud.dlp_v2.types.StoredInfoTypeConfig):
            StoredInfoType configuration.
        create_time (google.protobuf.timestamp_pb2.Timestamp):
            Create timestamp of the version. Read-only,
            determined by the system when the version is
            created.
        state (google.cloud.dlp_v2.types.StoredInfoTypeState):
            Stored info type version state. Read-only,
            updated by the system during dictionary
            creation.
        errors (Sequence[google.cloud.dlp_v2.types.Error]):
            Errors that occurred when creating this storedInfoType
            version, or anomalies detected in the storedInfoType data
            that render it unusable. Only the five most recent errors
            will be displayed, with the most recent error appearing
            first.

            For example, some of the data for stored custom dictionaries
            is put in the user's Cloud Storage bucket, and if this data
            is modified or deleted by the user or another system, the
            dictionary becomes invalid.

            If any errors occur, fix the problem indicated by the error
            message and use the UpdateStoredInfoType API method to
            create another version of the storedInfoType to continue
            using it, reusing the same ``config`` if it was not the
            source of the error.
        stats (google.cloud.dlp_v2.types.StoredInfoTypeStats):
            Statistics about this storedInfoType version.
    """

    config = proto.Field(
        proto.MESSAGE,
        number=1,
        message="StoredInfoTypeConfig",
    )
    create_time = proto.Field(
        proto.MESSAGE,
        number=2,
        message=timestamp_pb2.Timestamp,
    )
    state = proto.Field(
        proto.ENUM,
        number=3,
        enum="StoredInfoTypeState",
    )
    errors = proto.RepeatedField(
        proto.MESSAGE,
        number=4,
        message="Error",
    )
    stats = proto.Field(
        proto.MESSAGE,
        number=5,
        message="StoredInfoTypeStats",
    )


class StoredInfoType(proto.Message):
    r"""StoredInfoType resource message that contains information
    about the current version and any pending updates.

    Attributes:
        name (str):
            Resource name.
        current_version (google.cloud.dlp_v2.types.StoredInfoTypeVersion):
            Current version of the stored info type.
        pending_versions (Sequence[google.cloud.dlp_v2.types.StoredInfoTypeVersion]):
            Pending versions of the stored info type.
            Empty if no versions are pending.
    """

    name = proto.Field(
        proto.STRING,
        number=1,
    )
    current_version = proto.Field(
        proto.MESSAGE,
        number=2,
        message="StoredInfoTypeVersion",
    )
    pending_versions = proto.RepeatedField(
        proto.MESSAGE,
        number=3,
        message="StoredInfoTypeVersion",
    )


class CreateStoredInfoTypeRequest(proto.Message):
    r"""Request message for CreateStoredInfoType.

    Attributes:
        parent (str):
            Required. Parent resource name.

            The format of this value varies depending on the scope of
            the request (project or organization) and whether you have
            `specified a processing
            location <https://cloud.google.com/dlp/docs/specifying-location>`__:

            -  Projects scope, location specified:
               ``projects/``\ PROJECT_ID\ ``/locations/``\ LOCATION_ID
            -  Projects scope, no location specified (defaults to
               global): ``projects/``\ PROJECT_ID
            -  Organizations scope, location specified:
               ``organizations/``\ ORG_ID\ ``/locations/``\ LOCATION_ID
            -  Organizations scope, no location specified (defaults to
               global): ``organizations/``\ ORG_ID

            The following example ``parent`` string specifies a parent
            project with the identifier ``example-project``, and
            specifies the ``europe-west3`` location for processing data:

            ::

                parent=projects/example-project/locations/europe-west3
        config (google.cloud.dlp_v2.types.StoredInfoTypeConfig):
            Required. Configuration of the storedInfoType
            to create.
        stored_info_type_id (str):
            The storedInfoType ID can contain uppercase and lowercase
            letters, numbers, and hyphens; that is, it must match the
            regular expression: ``[a-zA-Z\d-_]+``. The maximum length is
            100 characters. Can be empty to allow the system to generate
            one.
        location_id (str):
            Deprecated. This field has no effect.
    """

    parent = proto.Field(
        proto.STRING,
        number=1,
    )
    config = proto.Field(
        proto.MESSAGE,
        number=2,
        message="StoredInfoTypeConfig",
    )
    stored_info_type_id = proto.Field(
        proto.STRING,
        number=3,
    )
    location_id = proto.Field(
        proto.STRING,
        number=4,
    )


class UpdateStoredInfoTypeRequest(proto.Message):
    r"""Request message for UpdateStoredInfoType.

    Attributes:
        name (str):
            Required. Resource name of organization and storedInfoType
            to be updated, for example
            ``organizations/433245324/storedInfoTypes/432452342`` or
            projects/project-id/storedInfoTypes/432452342.
        config (google.cloud.dlp_v2.types.StoredInfoTypeConfig):
            Updated configuration for the storedInfoType.
            If not provided, a new version of the
            storedInfoType will be created with the existing
            configuration.
        update_mask (google.protobuf.field_mask_pb2.FieldMask):
            Mask to control which fields get updated.
    """

    name = proto.Field(
        proto.STRING,
        number=1,
    )
    config = proto.Field(
        proto.MESSAGE,
        number=2,
        message="StoredInfoTypeConfig",
    )
    update_mask = proto.Field(
        proto.MESSAGE,
        number=3,
        message=field_mask_pb2.FieldMask,
    )


class GetStoredInfoTypeRequest(proto.Message):
    r"""Request message for GetStoredInfoType.

    Attributes:
        name (str):
            Required. Resource name of the organization and
            storedInfoType to be read, for example
            ``organizations/433245324/storedInfoTypes/432452342`` or
            projects/project-id/storedInfoTypes/432452342.
    """

    name = proto.Field(
        proto.STRING,
        number=1,
    )


class ListStoredInfoTypesRequest(proto.Message):
    r"""Request message for ListStoredInfoTypes.

    Attributes:
        parent (str):
            Required. Parent resource name.

            The format of this value varies depending on the scope of
            the request (project or organization) and whether you have
            `specified a processing
            location <https://cloud.google.com/dlp/docs/specifying-location>`__:

            -  Projects scope, location specified:
               ``projects/``\ PROJECT_ID\ ``/locations/``\ LOCATION_ID
            -  Projects scope, no location specified (defaults to
               global): ``projects/``\ PROJECT_ID

            The following example ``parent`` string specifies a parent
            project with the identifier ``example-project``, and
            specifies the ``europe-west3`` location for processing data:

            ::

                parent=projects/example-project/locations/europe-west3
        page_token (str):
            Page token to continue retrieval. Comes from previous call
            to ``ListStoredInfoTypes``.
        page_size (int):
            Size of the page, can be limited by the
            server. If zero server returns a page of max
            size 100.
        order_by (str):
            Comma separated list of fields to order by, followed by
            ``asc`` or ``desc`` postfix. This list is case-insensitive,
            default sorting order is ascending, redundant space
            characters are insignificant.

            Example: ``name asc, display_name, create_time desc``

            Supported fields are:

            -  ``create_time``: corresponds to the time the most recent
               version of the resource was created.
            -  ``state``: corresponds to the state of the resource.
            -  ``name``: corresponds to resource name.
            -  ``display_name``: corresponds to info type's display
               name.
        location_id (str):
            Deprecated. This field has no effect.
    """

    parent = proto.Field(
        proto.STRING,
        number=1,
    )
    page_token = proto.Field(
        proto.STRING,
        number=2,
    )
    page_size = proto.Field(
        proto.INT32,
        number=3,
    )
    order_by = proto.Field(
        proto.STRING,
        number=4,
    )
    location_id = proto.Field(
        proto.STRING,
        number=5,
    )


class ListStoredInfoTypesResponse(proto.Message):
    r"""Response message for ListStoredInfoTypes.

    Attributes:
        stored_info_types (Sequence[google.cloud.dlp_v2.types.StoredInfoType]):
            List of storedInfoTypes, up to page_size in
            ListStoredInfoTypesRequest.
        next_page_token (str):
            If the next page is available then the next
            page token to be used in following
            ListStoredInfoTypes request.
    """

    @property
    def raw_page(self):
        return self

    stored_info_types = proto.RepeatedField(
        proto.MESSAGE,
        number=1,
        message="StoredInfoType",
    )
    next_page_token = proto.Field(
        proto.STRING,
        number=2,
    )


class DeleteStoredInfoTypeRequest(proto.Message):
    r"""Request message for DeleteStoredInfoType.

    Attributes:
        name (str):
            Required. Resource name of the organization and
            storedInfoType to be deleted, for example
            ``organizations/433245324/storedInfoTypes/432452342`` or
            projects/project-id/storedInfoTypes/432452342.
    """

    name = proto.Field(
        proto.STRING,
        number=1,
    )


class HybridInspectJobTriggerRequest(proto.Message):
    r"""Request to search for potentially sensitive info in a custom
    location.

    Attributes:
        name (str):
            Required. Resource name of the trigger to execute a hybrid
            inspect on, for example
            ``projects/dlp-test-project/jobTriggers/53234423``.
        hybrid_item (google.cloud.dlp_v2.types.HybridContentItem):
            The item to inspect.
    """

    name = proto.Field(
        proto.STRING,
        number=1,
    )
    hybrid_item = proto.Field(
        proto.MESSAGE,
        number=3,
        message="HybridContentItem",
    )


class HybridInspectDlpJobRequest(proto.Message):
    r"""Request to search for potentially sensitive info in a custom
    location.

    Attributes:
        name (str):
            Required. Resource name of the job to execute a hybrid
            inspect on, for example
            ``projects/dlp-test-project/dlpJob/53234423``.
        hybrid_item (google.cloud.dlp_v2.types.HybridContentItem):
            The item to inspect.
    """

    name = proto.Field(
        proto.STRING,
        number=1,
    )
    hybrid_item = proto.Field(
        proto.MESSAGE,
        number=3,
        message="HybridContentItem",
    )


class HybridContentItem(proto.Message):
    r"""An individual hybrid item to inspect. Will be stored
    temporarily during processing.

    Attributes:
        item (google.cloud.dlp_v2.types.ContentItem):
            The item to inspect.
        finding_details (google.cloud.dlp_v2.types.HybridFindingDetails):
            Supplementary information that will be added
            to each finding.
    """

    item = proto.Field(
        proto.MESSAGE,
        number=1,
        message="ContentItem",
    )
    finding_details = proto.Field(
        proto.MESSAGE,
        number=2,
        message="HybridFindingDetails",
    )


class HybridFindingDetails(proto.Message):
    r"""Populate to associate additional data with each finding.

    Attributes:
        container_details (google.cloud.dlp_v2.types.Container):
            Details about the container where the content
            being inspected is from.
        file_offset (int):
            Offset in bytes of the line, from the
            beginning of the file, where the finding  is
            located. Populate if the item being scanned is
            only part of a bigger item, such as a shard of a
            file and you want to track the absolute position
            of the finding.
        row_offset (int):
            Offset of the row for tables. Populate if the
            row(s) being scanned are part of a bigger
            dataset and you want to keep track of their
            absolute position.
        table_options (google.cloud.dlp_v2.types.TableOptions):
            If the container is a table, additional information to make
            findings meaningful such as the columns that are primary
            keys. If not known ahead of time, can also be set within
            each inspect hybrid call and the two will be merged. Note
            that identifying_fields will only be stored to BigQuery, and
            only if the BigQuery action has been included.
        labels (Mapping[str, str]):
            Labels to represent user provided metadata about the data
            being inspected. If configured by the job, some key values
            may be required. The labels associated with ``Finding``'s
            produced by hybrid inspection.

            Label keys must be between 1 and 63 characters long and must
            conform to the following regular expression:
            ``[a-z]([-a-z0-9]*[a-z0-9])?``.

            Label values must be between 0 and 63 characters long and
            must conform to the regular expression
            ``([a-z]([-a-z0-9]*[a-z0-9])?)?``.

            No more than 10 labels can be associated with a given
            finding.

            Examples:

            -  ``"environment" : "production"``
            -  ``"pipeline" : "etl"``
    """

    container_details = proto.Field(
        proto.MESSAGE,
        number=1,
        message="Container",
    )
    file_offset = proto.Field(
        proto.INT64,
        number=2,
    )
    row_offset = proto.Field(
        proto.INT64,
        number=3,
    )
    table_options = proto.Field(
        proto.MESSAGE,
        number=4,
        message=storage.TableOptions,
    )
    labels = proto.MapField(
        proto.STRING,
        proto.STRING,
        number=5,
    )


class HybridInspectResponse(proto.Message):
    r"""Quota exceeded errors will be thrown once quota has been met."""


class DataRiskLevel(proto.Message):
    r"""Score is a summary of all elements in the data profile.
    A higher number means more risk.

    Attributes:
        score (google.cloud.dlp_v2.types.DataRiskLevel.DataRiskLevelScore):
            The score applied to the resource.
    """

    class DataRiskLevelScore(proto.Enum):
        r"""Various score levels for resources."""
        RISK_SCORE_UNSPECIFIED = 0
        RISK_LOW = 10
        RISK_MODERATE = 20
        RISK_HIGH = 30

    score = proto.Field(
        proto.ENUM,
        number=1,
        enum=DataRiskLevelScore,
    )


class DataProfileConfigSnapshot(proto.Message):
    r"""Snapshot of the configurations used to generate the profile.

    Attributes:
        inspect_config (google.cloud.dlp_v2.types.InspectConfig):
            A copy of the inspection config used to generate this
            profile. This is a copy of the inspect_template specified in
            ``DataProfileJobConfig``.
        data_profile_job (google.cloud.dlp_v2.types.DataProfileJobConfig):
            A copy of the configuration used to generate
            this profile.
    """

    inspect_config = proto.Field(
        proto.MESSAGE,
        number=2,
        message="InspectConfig",
    )
    data_profile_job = proto.Field(
        proto.MESSAGE,
        number=3,
        message="DataProfileJobConfig",
    )


class TableDataProfile(proto.Message):
    r"""The profile for a scanned table.

    Attributes:
        name (str):
            The name of the profile.
        project_data_profile (str):
            The resource name to the project data profile
            for this table.
        dataset_project_id (str):
            The GCP project ID that owns the BigQuery
            dataset.
        dataset_location (str):
            The BigQuery location where the dataset's
            data is stored. See
            https://cloud.google.com/bigquery/docs/locations
            for supported locations.
        dataset_id (str):
            The BigQuery dataset ID.
        table_id (str):
            The BigQuery table ID.
        full_resource (str):
            The resource name of the table.
            https://cloud.google.com/apis/design/resource_names#full_resource_name
        profile_status (google.cloud.dlp_v2.types.ProfileStatus):
            Success or error status from the most recent
            profile generation attempt. May be empty if the
            profile is still being generated.
        state (google.cloud.dlp_v2.types.TableDataProfile.State):
            State of a profile.
        sensitivity_score (google.cloud.dlp_v2.types.SensitivityScore):
            The sensitivity score of this table.
        data_risk_level (google.cloud.dlp_v2.types.DataRiskLevel):
            The data risk level of this table.
        predicted_info_types (Sequence[google.cloud.dlp_v2.types.InfoTypeSummary]):
            The infoTypes predicted from this table's
            data.
        other_info_types (Sequence[google.cloud.dlp_v2.types.OtherInfoTypeSummary]):
            Other infoTypes found in this table's data.
        config_snapshot (google.cloud.dlp_v2.types.DataProfileConfigSnapshot):
            The snapshot of the configurations used to
            generate the profile.
        last_modified_time (google.protobuf.timestamp_pb2.Timestamp):
            The time when this table was last modified
        expiration_time (google.protobuf.timestamp_pb2.Timestamp):
            Optional. The time when this table expires.
        scanned_column_count (int):
            The number of columns profiled in the table.
        failed_column_count (int):
            The number of columns skipped in the table
            because of an error.
        table_size_bytes (int):
            The size of the table when the profile was
            generated.
        row_count (int):
            Number of rows in the table when the profile
            was generated.
        encryption_status (google.cloud.dlp_v2.types.EncryptionStatus):
            How the table is encrypted.
        resource_visibility (google.cloud.dlp_v2.types.ResourceVisibility):
            How broadly a resource has been shared.
        profile_last_generated (google.protobuf.timestamp_pb2.Timestamp):
            The last time the profile was generated.
        resource_labels (Mapping[str, str]):
            The labels applied to the resource at the
            time the profile was generated.
        create_time (google.protobuf.timestamp_pb2.Timestamp):
            The time at which the table was created.
    """

    class State(proto.Enum):
        r"""Possible states of a profile. New items may be added."""
        STATE_UNSPECIFIED = 0
        RUNNING = 1
        DONE = 2

    name = proto.Field(
        proto.STRING,
        number=1,
    )
    project_data_profile = proto.Field(
        proto.STRING,
        number=2,
    )
    dataset_project_id = proto.Field(
        proto.STRING,
        number=24,
    )
    dataset_location = proto.Field(
        proto.STRING,
        number=29,
    )
    dataset_id = proto.Field(
        proto.STRING,
        number=25,
    )
    table_id = proto.Field(
        proto.STRING,
        number=26,
    )
    full_resource = proto.Field(
        proto.STRING,
        number=3,
    )
    profile_status = proto.Field(
        proto.MESSAGE,
        number=21,
        message="ProfileStatus",
    )
    state = proto.Field(
        proto.ENUM,
        number=22,
        enum=State,
    )
    sensitivity_score = proto.Field(
        proto.MESSAGE,
        number=5,
        message=storage.SensitivityScore,
    )
    data_risk_level = proto.Field(
        proto.MESSAGE,
        number=6,
        message="DataRiskLevel",
    )
    predicted_info_types = proto.RepeatedField(
        proto.MESSAGE,
        number=27,
        message="InfoTypeSummary",
    )
    other_info_types = proto.RepeatedField(
        proto.MESSAGE,
        number=28,
        message="OtherInfoTypeSummary",
    )
    config_snapshot = proto.Field(
        proto.MESSAGE,
        number=7,
        message="DataProfileConfigSnapshot",
    )
    last_modified_time = proto.Field(
        proto.MESSAGE,
        number=8,
        message=timestamp_pb2.Timestamp,
    )
    expiration_time = proto.Field(
        proto.MESSAGE,
        number=9,
        message=timestamp_pb2.Timestamp,
    )
    scanned_column_count = proto.Field(
        proto.INT64,
        number=10,
    )
    failed_column_count = proto.Field(
        proto.INT64,
        number=11,
    )
    table_size_bytes = proto.Field(
        proto.INT64,
        number=12,
    )
    row_count = proto.Field(
        proto.INT64,
        number=13,
    )
    encryption_status = proto.Field(
        proto.ENUM,
        number=14,
        enum="EncryptionStatus",
    )
    resource_visibility = proto.Field(
        proto.ENUM,
        number=15,
        enum="ResourceVisibility",
    )
    profile_last_generated = proto.Field(
        proto.MESSAGE,
        number=16,
        message=timestamp_pb2.Timestamp,
    )
    resource_labels = proto.MapField(
        proto.STRING,
        proto.STRING,
        number=17,
    )
    create_time = proto.Field(
        proto.MESSAGE,
        number=23,
        message=timestamp_pb2.Timestamp,
    )


class ProfileStatus(proto.Message):
    r"""

    Attributes:
        status (google.rpc.status_pb2.Status):
            Profiling status code and optional message
        timestamp (google.protobuf.timestamp_pb2.Timestamp):
            Time when the profile generation status was
            updated
    """

    status = proto.Field(
        proto.MESSAGE,
        number=1,
        message=status_pb2.Status,
    )
    timestamp = proto.Field(
        proto.MESSAGE,
        number=3,
        message=timestamp_pb2.Timestamp,
    )


class InfoTypeSummary(proto.Message):
    r"""The infoType details for this column.

    Attributes:
        info_type (google.cloud.dlp_v2.types.InfoType):
            The infoType.
        estimated_prevalence (int):
            Not populated for predicted infotypes.
    """

    info_type = proto.Field(
        proto.MESSAGE,
        number=1,
        message=storage.InfoType,
    )
    estimated_prevalence = proto.Field(
        proto.INT32,
        number=2,
    )


class OtherInfoTypeSummary(proto.Message):
    r"""Infotype details for other infoTypes found within a column.

    Attributes:
        info_type (google.cloud.dlp_v2.types.InfoType):
            The other infoType.
        estimated_prevalence (int):
            Approximate percentage of non-null rows that
            contained data detected by this infotype.
    """

    info_type = proto.Field(
        proto.MESSAGE,
        number=1,
        message=storage.InfoType,
    )
    estimated_prevalence = proto.Field(
        proto.INT32,
        number=2,
    )


class DataProfilePubSubCondition(proto.Message):
    r"""A condition for determining whether a Pub/Sub should be
    triggered.

    Attributes:
        expressions (google.cloud.dlp_v2.types.DataProfilePubSubCondition.PubSubExpressions):
            An expression.
    """

    class ProfileScoreBucket(proto.Enum):
        r"""Various score levels for resources."""
        PROFILE_SCORE_BUCKET_UNSPECIFIED = 0
        HIGH = 1
        MEDIUM_OR_HIGH = 2

    class PubSubCondition(proto.Message):
        r"""A condition consisting of a value.

        This message has `oneof`_ fields (mutually exclusive fields).
        For each oneof, at most one member field can be set at the same time.
        Setting any member of the oneof automatically clears all other
        members.

        .. _oneof: https://proto-plus-python.readthedocs.io/en/stable/fields.html#oneofs-mutually-exclusive-fields

        Attributes:
            minimum_risk_score (google.cloud.dlp_v2.types.DataProfilePubSubCondition.ProfileScoreBucket):
                The minimum data risk score that triggers the
                condition.

                This field is a member of `oneof`_ ``value``.
            minimum_sensitivity_score (google.cloud.dlp_v2.types.DataProfilePubSubCondition.ProfileScoreBucket):
                The minimum sensitivity level that triggers
                the condition.

                This field is a member of `oneof`_ ``value``.
        """

        minimum_risk_score = proto.Field(
            proto.ENUM,
            number=1,
            oneof="value",
            enum="DataProfilePubSubCondition.ProfileScoreBucket",
        )
        minimum_sensitivity_score = proto.Field(
            proto.ENUM,
            number=2,
            oneof="value",
            enum="DataProfilePubSubCondition.ProfileScoreBucket",
        )

    class PubSubExpressions(proto.Message):
        r"""An expression, consisting of an operator and conditions.

        Attributes:
            logical_operator (google.cloud.dlp_v2.types.DataProfilePubSubCondition.PubSubExpressions.PubSubLogicalOperator):
                The operator to apply to the collection of
                conditions.
            conditions (Sequence[google.cloud.dlp_v2.types.DataProfilePubSubCondition.PubSubCondition]):
                Conditions to apply to the expression.
        """

        class PubSubLogicalOperator(proto.Enum):
            r"""Logical operators for conditional checks."""
            LOGICAL_OPERATOR_UNSPECIFIED = 0
            OR = 1
            AND = 2

        logical_operator = proto.Field(
            proto.ENUM,
            number=1,
            enum="DataProfilePubSubCondition.PubSubExpressions.PubSubLogicalOperator",
        )
        conditions = proto.RepeatedField(
            proto.MESSAGE,
            number=2,
            message="DataProfilePubSubCondition.PubSubCondition",
        )

    expressions = proto.Field(
        proto.MESSAGE,
        number=1,
        message=PubSubExpressions,
    )


class DataProfilePubSubMessage(proto.Message):
    r"""Pub/Sub topic message for a
    DataProfileAction.PubSubNotification event. To receive a message
    of protocol buffer schema type, convert the message data to an
    object of this proto class.

    Attributes:
        profile (google.cloud.dlp_v2.types.TableDataProfile):
            If ``DetailLevel`` is ``TABLE_PROFILE`` this will be fully
            populated. Otherwise, if ``DetailLevel`` is
            ``RESOURCE_NAME``, then only ``name`` and ``full_resource``
            will be populated.
        event (google.cloud.dlp_v2.types.DataProfileAction.EventType):
            The event that caused the Pub/Sub message to
            be sent.
    """

    profile = proto.Field(
        proto.MESSAGE,
        number=1,
        message="TableDataProfile",
    )
    event = proto.Field(
        proto.ENUM,
        number=2,
        enum="DataProfileAction.EventType",
    )


__all__ = tuple(sorted(__protobuf__.manifest))
