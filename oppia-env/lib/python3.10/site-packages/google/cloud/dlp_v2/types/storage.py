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
from google.protobuf import timestamp_pb2  # type: ignore
import proto  # type: ignore

__protobuf__ = proto.module(
    package="google.privacy.dlp.v2",
    manifest={
        "Likelihood",
        "FileType",
        "InfoType",
        "SensitivityScore",
        "StoredType",
        "CustomInfoType",
        "FieldId",
        "PartitionId",
        "KindExpression",
        "DatastoreOptions",
        "CloudStorageRegexFileSet",
        "CloudStorageOptions",
        "CloudStorageFileSet",
        "CloudStoragePath",
        "BigQueryOptions",
        "StorageConfig",
        "HybridOptions",
        "BigQueryKey",
        "DatastoreKey",
        "Key",
        "RecordKey",
        "BigQueryTable",
        "BigQueryField",
        "EntityId",
        "TableOptions",
    },
)


class Likelihood(proto.Enum):
    r"""Categorization of results based on how likely they are to
    represent a match, based on the number of elements they contain
    which imply a match.
    """
    LIKELIHOOD_UNSPECIFIED = 0
    VERY_UNLIKELY = 1
    UNLIKELY = 2
    POSSIBLE = 3
    LIKELY = 4
    VERY_LIKELY = 5


class FileType(proto.Enum):
    r"""Definitions of file type groups to scan. New types will be
    added to this list.
    """
    FILE_TYPE_UNSPECIFIED = 0
    BINARY_FILE = 1
    TEXT_FILE = 2
    IMAGE = 3
    WORD = 5
    PDF = 6
    AVRO = 7
    CSV = 8
    TSV = 9
    POWERPOINT = 11
    EXCEL = 12


class InfoType(proto.Message):
    r"""Type of information detected by the API.

    Attributes:
        name (str):
            Name of the information type. Either a name of your choosing
            when creating a CustomInfoType, or one of the names listed
            at https://cloud.google.com/dlp/docs/infotypes-reference
            when specifying a built-in type. When sending Cloud DLP
            results to Data Catalog, infoType names should conform to
            the pattern ``[A-Za-z0-9$-_]{1,64}``.
        version (str):
            Optional version name for this InfoType.
    """

    name = proto.Field(
        proto.STRING,
        number=1,
    )
    version = proto.Field(
        proto.STRING,
        number=2,
    )


class SensitivityScore(proto.Message):
    r"""Score is a summary of all elements in the data profile.
    A higher number means more sensitive.

    Attributes:
        score (google.cloud.dlp_v2.types.SensitivityScore.SensitivityScoreLevel):
            The score applied to the resource.
    """

    class SensitivityScoreLevel(proto.Enum):
        r"""Various score levels for resources."""
        SENSITIVITY_SCORE_UNSPECIFIED = 0
        SENSITIVITY_LOW = 10
        SENSITIVITY_MODERATE = 20
        SENSITIVITY_HIGH = 30

    score = proto.Field(
        proto.ENUM,
        number=1,
        enum=SensitivityScoreLevel,
    )


class StoredType(proto.Message):
    r"""A reference to a StoredInfoType to use with scanning.

    Attributes:
        name (str):
            Resource name of the requested ``StoredInfoType``, for
            example
            ``organizations/433245324/storedInfoTypes/432452342`` or
            ``projects/project-id/storedInfoTypes/432452342``.
        create_time (google.protobuf.timestamp_pb2.Timestamp):
            Timestamp indicating when the version of the
            ``StoredInfoType`` used for inspection was created.
            Output-only field, populated by the system.
    """

    name = proto.Field(
        proto.STRING,
        number=1,
    )
    create_time = proto.Field(
        proto.MESSAGE,
        number=2,
        message=timestamp_pb2.Timestamp,
    )


class CustomInfoType(proto.Message):
    r"""Custom information type provided by the user. Used to find
    domain-specific sensitive information configurable to the data
    in question.

    This message has `oneof`_ fields (mutually exclusive fields).
    For each oneof, at most one member field can be set at the same time.
    Setting any member of the oneof automatically clears all other
    members.

    .. _oneof: https://proto-plus-python.readthedocs.io/en/stable/fields.html#oneofs-mutually-exclusive-fields

    Attributes:
        info_type (google.cloud.dlp_v2.types.InfoType):
            CustomInfoType can either be a new infoType, or an extension
            of built-in infoType, when the name matches one of existing
            infoTypes and that infoType is specified in
            ``InspectContent.info_types`` field. Specifying the latter
            adds findings to the one detected by the system. If built-in
            info type is not specified in ``InspectContent.info_types``
            list then the name is treated as a custom info type.
        likelihood (google.cloud.dlp_v2.types.Likelihood):
            Likelihood to return for this CustomInfoType. This base
            value can be altered by a detection rule if the finding
            meets the criteria specified by the rule. Defaults to
            ``VERY_LIKELY`` if not specified.
        dictionary (google.cloud.dlp_v2.types.CustomInfoType.Dictionary):
            A list of phrases to detect as a
            CustomInfoType.

            This field is a member of `oneof`_ ``type``.
        regex (google.cloud.dlp_v2.types.CustomInfoType.Regex):
            Regular expression based CustomInfoType.

            This field is a member of `oneof`_ ``type``.
        surrogate_type (google.cloud.dlp_v2.types.CustomInfoType.SurrogateType):
            Message for detecting output from
            deidentification transformations that support
            reversing.

            This field is a member of `oneof`_ ``type``.
        stored_type (google.cloud.dlp_v2.types.StoredType):
            Load an existing ``StoredInfoType`` resource for use in
            ``InspectDataSource``. Not currently supported in
            ``InspectContent``.

            This field is a member of `oneof`_ ``type``.
        detection_rules (Sequence[google.cloud.dlp_v2.types.CustomInfoType.DetectionRule]):
            Set of detection rules to apply to all findings of this
            CustomInfoType. Rules are applied in order that they are
            specified. Not supported for the ``surrogate_type``
            CustomInfoType.
        exclusion_type (google.cloud.dlp_v2.types.CustomInfoType.ExclusionType):
            If set to EXCLUSION_TYPE_EXCLUDE this infoType will not
            cause a finding to be returned. It still can be used for
            rules matching.
    """

    class ExclusionType(proto.Enum):
        r""""""
        EXCLUSION_TYPE_UNSPECIFIED = 0
        EXCLUSION_TYPE_EXCLUDE = 1

    class Dictionary(proto.Message):
        r"""Custom information type based on a dictionary of words or phrases.
        This can be used to match sensitive information specific to the
        data, such as a list of employee IDs or job titles.

        Dictionary words are case-insensitive and all characters other than
        letters and digits in the unicode `Basic Multilingual
        Plane <https://en.wikipedia.org/wiki/Plane_%28Unicode%29#Basic_Multilingual_Plane>`__
        will be replaced with whitespace when scanning for matches, so the
        dictionary phrase "Sam Johnson" will match all three phrases "sam
        johnson", "Sam, Johnson", and "Sam (Johnson)". Additionally, the
        characters surrounding any match must be of a different type than
        the adjacent characters within the word, so letters must be next to
        non-letters and digits next to non-digits. For example, the
        dictionary word "jen" will match the first three letters of the text
        "jen123" but will return no matches for "jennifer".

        Dictionary words containing a large number of characters that are
        not letters or digits may result in unexpected findings because such
        characters are treated as whitespace. The
        `limits <https://cloud.google.com/dlp/limits>`__ page contains
        details about the size limits of dictionaries. For dictionaries that
        do not fit within these constraints, consider using
        ``LargeCustomDictionaryConfig`` in the ``StoredInfoType`` API.

        This message has `oneof`_ fields (mutually exclusive fields).
        For each oneof, at most one member field can be set at the same time.
        Setting any member of the oneof automatically clears all other
        members.

        .. _oneof: https://proto-plus-python.readthedocs.io/en/stable/fields.html#oneofs-mutually-exclusive-fields

        Attributes:
            word_list (google.cloud.dlp_v2.types.CustomInfoType.Dictionary.WordList):
                List of words or phrases to search for.

                This field is a member of `oneof`_ ``source``.
            cloud_storage_path (google.cloud.dlp_v2.types.CloudStoragePath):
                Newline-delimited file of words in Cloud
                Storage. Only a single file is accepted.

                This field is a member of `oneof`_ ``source``.
        """

        class WordList(proto.Message):
            r"""Message defining a list of words or phrases to search for in
            the data.

            Attributes:
                words (Sequence[str]):
                    Words or phrases defining the dictionary. The dictionary
                    must contain at least one phrase and every phrase must
                    contain at least 2 characters that are letters or digits.
                    [required]
            """

            words = proto.RepeatedField(
                proto.STRING,
                number=1,
            )

        word_list = proto.Field(
            proto.MESSAGE,
            number=1,
            oneof="source",
            message="CustomInfoType.Dictionary.WordList",
        )
        cloud_storage_path = proto.Field(
            proto.MESSAGE,
            number=3,
            oneof="source",
            message="CloudStoragePath",
        )

    class Regex(proto.Message):
        r"""Message defining a custom regular expression.

        Attributes:
            pattern (str):
                Pattern defining the regular expression. Its
                syntax
                (https://github.com/google/re2/wiki/Syntax) can
                be found under the google/re2 repository on
                GitHub.
            group_indexes (Sequence[int]):
                The index of the submatch to extract as
                findings. When not specified, the entire match
                is returned. No more than 3 may be included.
        """

        pattern = proto.Field(
            proto.STRING,
            number=1,
        )
        group_indexes = proto.RepeatedField(
            proto.INT32,
            number=2,
        )

    class SurrogateType(proto.Message):
        r"""Message for detecting output from deidentification transformations
        such as
        ```CryptoReplaceFfxFpeConfig`` <https://cloud.google.com/dlp/docs/reference/rest/v2/organizations.deidentifyTemplates#cryptoreplaceffxfpeconfig>`__.
        These types of transformations are those that perform
        pseudonymization, thereby producing a "surrogate" as output. This
        should be used in conjunction with a field on the transformation
        such as ``surrogate_info_type``. This CustomInfoType does not
        support the use of ``detection_rules``.

        """

    class DetectionRule(proto.Message):
        r"""Deprecated; use ``InspectionRuleSet`` instead. Rule for modifying a
        ``CustomInfoType`` to alter behavior under certain circumstances,
        depending on the specific details of the rule. Not supported for the
        ``surrogate_type`` custom infoType.


        .. _oneof: https://proto-plus-python.readthedocs.io/en/stable/fields.html#oneofs-mutually-exclusive-fields

        Attributes:
            hotword_rule (google.cloud.dlp_v2.types.CustomInfoType.DetectionRule.HotwordRule):
                Hotword-based detection rule.

                This field is a member of `oneof`_ ``type``.
        """

        class Proximity(proto.Message):
            r"""Message for specifying a window around a finding to apply a
            detection rule.

            Attributes:
                window_before (int):
                    Number of characters before the finding to consider. For
                    tabular data, if you want to modify the likelihood of an
                    entire column of findngs, set this to 1. For more
                    information, see [Hotword example: Set the match likelihood
                    of a table column]
                    (https://cloud.google.com/dlp/docs/creating-custom-infotypes-likelihood#match-column-values).
                window_after (int):
                    Number of characters after the finding to
                    consider.
            """

            window_before = proto.Field(
                proto.INT32,
                number=1,
            )
            window_after = proto.Field(
                proto.INT32,
                number=2,
            )

        class LikelihoodAdjustment(proto.Message):
            r"""Message for specifying an adjustment to the likelihood of a
            finding as part of a detection rule.

            This message has `oneof`_ fields (mutually exclusive fields).
            For each oneof, at most one member field can be set at the same time.
            Setting any member of the oneof automatically clears all other
            members.

            .. _oneof: https://proto-plus-python.readthedocs.io/en/stable/fields.html#oneofs-mutually-exclusive-fields

            Attributes:
                fixed_likelihood (google.cloud.dlp_v2.types.Likelihood):
                    Set the likelihood of a finding to a fixed
                    value.

                    This field is a member of `oneof`_ ``adjustment``.
                relative_likelihood (int):
                    Increase or decrease the likelihood by the specified number
                    of levels. For example, if a finding would be ``POSSIBLE``
                    without the detection rule and ``relative_likelihood`` is 1,
                    then it is upgraded to ``LIKELY``, while a value of -1 would
                    downgrade it to ``UNLIKELY``. Likelihood may never drop
                    below ``VERY_UNLIKELY`` or exceed ``VERY_LIKELY``, so
                    applying an adjustment of 1 followed by an adjustment of -1
                    when base likelihood is ``VERY_LIKELY`` will result in a
                    final likelihood of ``LIKELY``.

                    This field is a member of `oneof`_ ``adjustment``.
            """

            fixed_likelihood = proto.Field(
                proto.ENUM,
                number=1,
                oneof="adjustment",
                enum="Likelihood",
            )
            relative_likelihood = proto.Field(
                proto.INT32,
                number=2,
                oneof="adjustment",
            )

        class HotwordRule(proto.Message):
            r"""The rule that adjusts the likelihood of findings within a
            certain proximity of hotwords.

            Attributes:
                hotword_regex (google.cloud.dlp_v2.types.CustomInfoType.Regex):
                    Regular expression pattern defining what
                    qualifies as a hotword.
                proximity (google.cloud.dlp_v2.types.CustomInfoType.DetectionRule.Proximity):
                    Range of characters within which the entire hotword must
                    reside. The total length of the window cannot exceed 1000
                    characters. The finding itself will be included in the
                    window, so that hotwords can be used to match substrings of
                    the finding itself. Suppose you want Cloud DLP to promote
                    the likelihood of the phone number regex "(\d{3})
                    \\d{3}-\d{4}" if the area code is known to be the area code
                    of a company's office. In this case, use the hotword regex
                    "(xxx)", where "xxx" is the area code in question.

                    For tabular data, if you want to modify the likelihood of an
                    entire column of findngs, see [Hotword example: Set the
                    match likelihood of a table column]
                    (https://cloud.google.com/dlp/docs/creating-custom-infotypes-likelihood#match-column-values).
                likelihood_adjustment (google.cloud.dlp_v2.types.CustomInfoType.DetectionRule.LikelihoodAdjustment):
                    Likelihood adjustment to apply to all
                    matching findings.
            """

            hotword_regex = proto.Field(
                proto.MESSAGE,
                number=1,
                message="CustomInfoType.Regex",
            )
            proximity = proto.Field(
                proto.MESSAGE,
                number=2,
                message="CustomInfoType.DetectionRule.Proximity",
            )
            likelihood_adjustment = proto.Field(
                proto.MESSAGE,
                number=3,
                message="CustomInfoType.DetectionRule.LikelihoodAdjustment",
            )

        hotword_rule = proto.Field(
            proto.MESSAGE,
            number=1,
            oneof="type",
            message="CustomInfoType.DetectionRule.HotwordRule",
        )

    info_type = proto.Field(
        proto.MESSAGE,
        number=1,
        message="InfoType",
    )
    likelihood = proto.Field(
        proto.ENUM,
        number=6,
        enum="Likelihood",
    )
    dictionary = proto.Field(
        proto.MESSAGE,
        number=2,
        oneof="type",
        message=Dictionary,
    )
    regex = proto.Field(
        proto.MESSAGE,
        number=3,
        oneof="type",
        message=Regex,
    )
    surrogate_type = proto.Field(
        proto.MESSAGE,
        number=4,
        oneof="type",
        message=SurrogateType,
    )
    stored_type = proto.Field(
        proto.MESSAGE,
        number=5,
        oneof="type",
        message="StoredType",
    )
    detection_rules = proto.RepeatedField(
        proto.MESSAGE,
        number=7,
        message=DetectionRule,
    )
    exclusion_type = proto.Field(
        proto.ENUM,
        number=8,
        enum=ExclusionType,
    )


class FieldId(proto.Message):
    r"""General identifier of a data field in a storage service.

    Attributes:
        name (str):
            Name describing the field.
    """

    name = proto.Field(
        proto.STRING,
        number=1,
    )


class PartitionId(proto.Message):
    r"""Datastore partition ID.
    A partition ID identifies a grouping of entities. The grouping
    is always by project and namespace, however the namespace ID may
    be empty.
    A partition ID contains several dimensions:
    project ID and namespace ID.

    Attributes:
        project_id (str):
            The ID of the project to which the entities
            belong.
        namespace_id (str):
            If not empty, the ID of the namespace to
            which the entities belong.
    """

    project_id = proto.Field(
        proto.STRING,
        number=2,
    )
    namespace_id = proto.Field(
        proto.STRING,
        number=4,
    )


class KindExpression(proto.Message):
    r"""A representation of a Datastore kind.

    Attributes:
        name (str):
            The name of the kind.
    """

    name = proto.Field(
        proto.STRING,
        number=1,
    )


class DatastoreOptions(proto.Message):
    r"""Options defining a data set within Google Cloud Datastore.

    Attributes:
        partition_id (google.cloud.dlp_v2.types.PartitionId):
            A partition ID identifies a grouping of
            entities. The grouping is always by project and
            namespace, however the namespace ID may be
            empty.
        kind (google.cloud.dlp_v2.types.KindExpression):
            The kind to process.
    """

    partition_id = proto.Field(
        proto.MESSAGE,
        number=1,
        message="PartitionId",
    )
    kind = proto.Field(
        proto.MESSAGE,
        number=2,
        message="KindExpression",
    )


class CloudStorageRegexFileSet(proto.Message):
    r"""Message representing a set of files in a Cloud Storage bucket.
    Regular expressions are used to allow fine-grained control over
    which files in the bucket to include.

    Included files are those that match at least one item in
    ``include_regex`` and do not match any items in ``exclude_regex``.
    Note that a file that matches items from both lists will *not* be
    included. For a match to occur, the entire file path (i.e.,
    everything in the url after the bucket name) must match the regular
    expression.

    For example, given the input
    ``{bucket_name: "mybucket", include_regex: ["directory1/.*"], exclude_regex: ["directory1/excluded.*"]}``:

    -  ``gs://mybucket/directory1/myfile`` will be included
    -  ``gs://mybucket/directory1/directory2/myfile`` will be included
       (``.*`` matches across ``/``)
    -  ``gs://mybucket/directory0/directory1/myfile`` will *not* be
       included (the full path doesn't match any items in
       ``include_regex``)
    -  ``gs://mybucket/directory1/excludedfile`` will *not* be included
       (the path matches an item in ``exclude_regex``)

    If ``include_regex`` is left empty, it will match all files by
    default (this is equivalent to setting ``include_regex: [".*"]``).

    Some other common use cases:

    -  ``{bucket_name: "mybucket", exclude_regex: [".*\.pdf"]}`` will
       include all files in ``mybucket`` except for .pdf files
    -  ``{bucket_name: "mybucket", include_regex: ["directory/[^/]+"]}``
       will include all files directly under
       ``gs://mybucket/directory/``, without matching across ``/``

    Attributes:
        bucket_name (str):
            The name of a Cloud Storage bucket. Required.
        include_regex (Sequence[str]):
            A list of regular expressions matching file paths to
            include. All files in the bucket that match at least one of
            these regular expressions will be included in the set of
            files, except for those that also match an item in
            ``exclude_regex``. Leaving this field empty will match all
            files by default (this is equivalent to including ``.*`` in
            the list).

            Regular expressions use RE2
            `syntax <https://github.com/google/re2/wiki/Syntax>`__; a
            guide can be found under the google/re2 repository on
            GitHub.
        exclude_regex (Sequence[str]):
            A list of regular expressions matching file paths to
            exclude. All files in the bucket that match at least one of
            these regular expressions will be excluded from the scan.

            Regular expressions use RE2
            `syntax <https://github.com/google/re2/wiki/Syntax>`__; a
            guide can be found under the google/re2 repository on
            GitHub.
    """

    bucket_name = proto.Field(
        proto.STRING,
        number=1,
    )
    include_regex = proto.RepeatedField(
        proto.STRING,
        number=2,
    )
    exclude_regex = proto.RepeatedField(
        proto.STRING,
        number=3,
    )


class CloudStorageOptions(proto.Message):
    r"""Options defining a file or a set of files within a Cloud
    Storage bucket.

    Attributes:
        file_set (google.cloud.dlp_v2.types.CloudStorageOptions.FileSet):
            The set of one or more files to scan.
        bytes_limit_per_file (int):
            Max number of bytes to scan from a file. If a scanned file's
            size is bigger than this value then the rest of the bytes
            are omitted. Only one of bytes_limit_per_file and
            bytes_limit_per_file_percent can be specified. Cannot be set
            if de-identification is requested.
        bytes_limit_per_file_percent (int):
            Max percentage of bytes to scan from a file. The rest are
            omitted. The number of bytes scanned is rounded down. Must
            be between 0 and 100, inclusively. Both 0 and 100 means no
            limit. Defaults to 0. Only one of bytes_limit_per_file and
            bytes_limit_per_file_percent can be specified. Cannot be set
            if de-identification is requested.
        file_types (Sequence[google.cloud.dlp_v2.types.FileType]):
            List of file type groups to include in the scan. If empty,
            all files are scanned and available data format processors
            are applied. In addition, the binary content of the selected
            files is always scanned as well. Images are scanned only as
            binary if the specified region does not support image
            inspection and no file_types were specified. Image
            inspection is restricted to 'global', 'us', 'asia', and
            'europe'.
        sample_method (google.cloud.dlp_v2.types.CloudStorageOptions.SampleMethod):

        files_limit_percent (int):
            Limits the number of files to scan to this
            percentage of the input FileSet. Number of files
            scanned is rounded down. Must be between 0 and
            100, inclusively. Both 0 and 100 means no limit.
            Defaults to 0.
    """

    class SampleMethod(proto.Enum):
        r"""How to sample bytes if not all bytes are scanned. Meaningful only
        when used in conjunction with bytes_limit_per_file. If not
        specified, scanning would start from the top.
        """
        SAMPLE_METHOD_UNSPECIFIED = 0
        TOP = 1
        RANDOM_START = 2

    class FileSet(proto.Message):
        r"""Set of files to scan.

        Attributes:
            url (str):
                The Cloud Storage url of the file(s) to scan, in the format
                ``gs://<bucket>/<path>``. Trailing wildcard in the path is
                allowed.

                If the url ends in a trailing slash, the bucket or directory
                represented by the url will be scanned non-recursively
                (content in sub-directories will not be scanned). This means
                that ``gs://mybucket/`` is equivalent to
                ``gs://mybucket/*``, and ``gs://mybucket/directory/`` is
                equivalent to ``gs://mybucket/directory/*``.

                Exactly one of ``url`` or ``regex_file_set`` must be set.
            regex_file_set (google.cloud.dlp_v2.types.CloudStorageRegexFileSet):
                The regex-filtered set of files to scan. Exactly one of
                ``url`` or ``regex_file_set`` must be set.
        """

        url = proto.Field(
            proto.STRING,
            number=1,
        )
        regex_file_set = proto.Field(
            proto.MESSAGE,
            number=2,
            message="CloudStorageRegexFileSet",
        )

    file_set = proto.Field(
        proto.MESSAGE,
        number=1,
        message=FileSet,
    )
    bytes_limit_per_file = proto.Field(
        proto.INT64,
        number=4,
    )
    bytes_limit_per_file_percent = proto.Field(
        proto.INT32,
        number=8,
    )
    file_types = proto.RepeatedField(
        proto.ENUM,
        number=5,
        enum="FileType",
    )
    sample_method = proto.Field(
        proto.ENUM,
        number=6,
        enum=SampleMethod,
    )
    files_limit_percent = proto.Field(
        proto.INT32,
        number=7,
    )


class CloudStorageFileSet(proto.Message):
    r"""Message representing a set of files in Cloud Storage.

    Attributes:
        url (str):
            The url, in the format ``gs://<bucket>/<path>``. Trailing
            wildcard in the path is allowed.
    """

    url = proto.Field(
        proto.STRING,
        number=1,
    )


class CloudStoragePath(proto.Message):
    r"""Message representing a single file or path in Cloud Storage.

    Attributes:
        path (str):
            A url representing a file or path (no wildcards) in Cloud
            Storage. Example: gs://[BUCKET_NAME]/dictionary.txt
    """

    path = proto.Field(
        proto.STRING,
        number=1,
    )


class BigQueryOptions(proto.Message):
    r"""Options defining BigQuery table and row identifiers.

    Attributes:
        table_reference (google.cloud.dlp_v2.types.BigQueryTable):
            Complete BigQuery table reference.
        identifying_fields (Sequence[google.cloud.dlp_v2.types.FieldId]):
            Table fields that may uniquely identify a row within the
            table. When ``actions.saveFindings.outputConfig.table`` is
            specified, the values of columns specified here are
            available in the output table under
            ``location.content_locations.record_location.record_key.id_values``.
            Nested fields such as ``person.birthdate.year`` are allowed.
        rows_limit (int):
            Max number of rows to scan. If the table has more rows than
            this value, the rest of the rows are omitted. If not set, or
            if set to 0, all rows will be scanned. Only one of
            rows_limit and rows_limit_percent can be specified. Cannot
            be used in conjunction with TimespanConfig.
        rows_limit_percent (int):
            Max percentage of rows to scan. The rest are omitted. The
            number of rows scanned is rounded down. Must be between 0
            and 100, inclusively. Both 0 and 100 means no limit.
            Defaults to 0. Only one of rows_limit and rows_limit_percent
            can be specified. Cannot be used in conjunction with
            TimespanConfig.
        sample_method (google.cloud.dlp_v2.types.BigQueryOptions.SampleMethod):

        excluded_fields (Sequence[google.cloud.dlp_v2.types.FieldId]):
            References to fields excluded from scanning.
            This allows you to skip inspection of entire
            columns which you know have no findings.
        included_fields (Sequence[google.cloud.dlp_v2.types.FieldId]):
            Limit scanning only to these fields.
    """

    class SampleMethod(proto.Enum):
        r"""How to sample rows if not all rows are scanned. Meaningful only when
        used in conjunction with either rows_limit or rows_limit_percent. If
        not specified, rows are scanned in the order BigQuery reads them.
        """
        SAMPLE_METHOD_UNSPECIFIED = 0
        TOP = 1
        RANDOM_START = 2

    table_reference = proto.Field(
        proto.MESSAGE,
        number=1,
        message="BigQueryTable",
    )
    identifying_fields = proto.RepeatedField(
        proto.MESSAGE,
        number=2,
        message="FieldId",
    )
    rows_limit = proto.Field(
        proto.INT64,
        number=3,
    )
    rows_limit_percent = proto.Field(
        proto.INT32,
        number=6,
    )
    sample_method = proto.Field(
        proto.ENUM,
        number=4,
        enum=SampleMethod,
    )
    excluded_fields = proto.RepeatedField(
        proto.MESSAGE,
        number=5,
        message="FieldId",
    )
    included_fields = proto.RepeatedField(
        proto.MESSAGE,
        number=7,
        message="FieldId",
    )


class StorageConfig(proto.Message):
    r"""Shared message indicating Cloud storage type.

    This message has `oneof`_ fields (mutually exclusive fields).
    For each oneof, at most one member field can be set at the same time.
    Setting any member of the oneof automatically clears all other
    members.

    .. _oneof: https://proto-plus-python.readthedocs.io/en/stable/fields.html#oneofs-mutually-exclusive-fields

    Attributes:
        datastore_options (google.cloud.dlp_v2.types.DatastoreOptions):
            Google Cloud Datastore options.

            This field is a member of `oneof`_ ``type``.
        cloud_storage_options (google.cloud.dlp_v2.types.CloudStorageOptions):
            Cloud Storage options.

            This field is a member of `oneof`_ ``type``.
        big_query_options (google.cloud.dlp_v2.types.BigQueryOptions):
            BigQuery options.

            This field is a member of `oneof`_ ``type``.
        hybrid_options (google.cloud.dlp_v2.types.HybridOptions):
            Hybrid inspection options.

            This field is a member of `oneof`_ ``type``.
        timespan_config (google.cloud.dlp_v2.types.StorageConfig.TimespanConfig):

    """

    class TimespanConfig(proto.Message):
        r"""Configuration of the timespan of the items to include in
        scanning. Currently only supported when inspecting Cloud Storage
        and BigQuery.

        Attributes:
            start_time (google.protobuf.timestamp_pb2.Timestamp):
                Exclude files, tables, or rows older than
                this value. If not set, no lower time limit is
                applied.
            end_time (google.protobuf.timestamp_pb2.Timestamp):
                Exclude files, tables, or rows newer than
                this value. If not set, no upper time limit is
                applied.
            timestamp_field (google.cloud.dlp_v2.types.FieldId):
                Specification of the field containing the timestamp of
                scanned items. Used for data sources like Datastore and
                BigQuery.

                For BigQuery

                If this value is not specified and the table was modified
                between the given start and end times, the entire table will
                be scanned. If this value is specified, then rows are
                filtered based on the given start and end times. Rows with a
                ``NULL`` value in the provided BigQuery column are skipped.
                Valid data types of the provided BigQuery column are:
                ``INTEGER``, ``DATE``, ``TIMESTAMP``, and ``DATETIME``.

                If your BigQuery table is `partitioned at ingestion
                time <https://cloud.google.com/bigquery/docs/partitioned-tables#ingestion_time>`__,
                you can use any of the following pseudo-columns as your
                timestamp field. When used with Cloud DLP, these
                pseudo-column names are case sensitive.

                .. raw:: html

                    <ul>
                    <li><code>_PARTITIONTIME</code></li>
                    <li><code>_PARTITIONDATE</code></li>
                    <li><code>_PARTITION_LOAD_TIME</code></li>
                    </ul>

                For Datastore

                If this value is specified, then entities are filtered based
                on the given start and end times. If an entity does not
                contain the provided timestamp property or contains empty or
                invalid values, then it is included. Valid data types of the
                provided timestamp property are: ``TIMESTAMP``.

                See the `known
                issue <https://cloud.google.com/dlp/docs/known-issues#bq-timespan>`__
                related to this operation.
            enable_auto_population_of_timespan_config (bool):
                When the job is started by a JobTrigger we will
                automatically figure out a valid start_time to avoid
                scanning files that have not been modified since the last
                time the JobTrigger executed. This will be based on the time
                of the execution of the last run of the JobTrigger or the
                timespan end_time used in the last run of the JobTrigger.
        """

        start_time = proto.Field(
            proto.MESSAGE,
            number=1,
            message=timestamp_pb2.Timestamp,
        )
        end_time = proto.Field(
            proto.MESSAGE,
            number=2,
            message=timestamp_pb2.Timestamp,
        )
        timestamp_field = proto.Field(
            proto.MESSAGE,
            number=3,
            message="FieldId",
        )
        enable_auto_population_of_timespan_config = proto.Field(
            proto.BOOL,
            number=4,
        )

    datastore_options = proto.Field(
        proto.MESSAGE,
        number=2,
        oneof="type",
        message="DatastoreOptions",
    )
    cloud_storage_options = proto.Field(
        proto.MESSAGE,
        number=3,
        oneof="type",
        message="CloudStorageOptions",
    )
    big_query_options = proto.Field(
        proto.MESSAGE,
        number=4,
        oneof="type",
        message="BigQueryOptions",
    )
    hybrid_options = proto.Field(
        proto.MESSAGE,
        number=9,
        oneof="type",
        message="HybridOptions",
    )
    timespan_config = proto.Field(
        proto.MESSAGE,
        number=6,
        message=TimespanConfig,
    )


class HybridOptions(proto.Message):
    r"""Configuration to control jobs where the content being
    inspected is outside of Google Cloud Platform.

    Attributes:
        description (str):
            A short description of where the data is
            coming from. Will be stored once in the job. 256
            max length.
        required_finding_label_keys (Sequence[str]):
            These are labels that each inspection request must include
            within their 'finding_labels' map. Request may contain
            others, but any missing one of these will be rejected.

            Label keys must be between 1 and 63 characters long and must
            conform to the following regular expression:
            ``[a-z]([-a-z0-9]*[a-z0-9])?``.

            No more than 10 keys can be required.
        labels (Mapping[str, str]):
            To organize findings, these labels will be added to each
            finding.

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
        table_options (google.cloud.dlp_v2.types.TableOptions):
            If the container is a table, additional
            information to make findings meaningful such as
            the columns that are primary keys.
    """

    description = proto.Field(
        proto.STRING,
        number=1,
    )
    required_finding_label_keys = proto.RepeatedField(
        proto.STRING,
        number=2,
    )
    labels = proto.MapField(
        proto.STRING,
        proto.STRING,
        number=3,
    )
    table_options = proto.Field(
        proto.MESSAGE,
        number=4,
        message="TableOptions",
    )


class BigQueryKey(proto.Message):
    r"""Row key for identifying a record in BigQuery table.

    Attributes:
        table_reference (google.cloud.dlp_v2.types.BigQueryTable):
            Complete BigQuery table reference.
        row_number (int):
            Row number inferred at the time the table was scanned. This
            value is nondeterministic, cannot be queried, and may be
            null for inspection jobs. To locate findings within a table,
            specify
            ``inspect_job.storage_config.big_query_options.identifying_fields``
            in ``CreateDlpJobRequest``.
    """

    table_reference = proto.Field(
        proto.MESSAGE,
        number=1,
        message="BigQueryTable",
    )
    row_number = proto.Field(
        proto.INT64,
        number=2,
    )


class DatastoreKey(proto.Message):
    r"""Record key for a finding in Cloud Datastore.

    Attributes:
        entity_key (google.cloud.dlp_v2.types.Key):
            Datastore entity key.
    """

    entity_key = proto.Field(
        proto.MESSAGE,
        number=1,
        message="Key",
    )


class Key(proto.Message):
    r"""A unique identifier for a Datastore entity.
    If a key's partition ID or any of its path kinds or names are
    reserved/read-only, the key is reserved/read-only.
    A reserved/read-only key is forbidden in certain documented
    contexts.

    Attributes:
        partition_id (google.cloud.dlp_v2.types.PartitionId):
            Entities are partitioned into subsets,
            currently identified by a project ID and
            namespace ID. Queries are scoped to a single
            partition.
        path (Sequence[google.cloud.dlp_v2.types.Key.PathElement]):
            The entity path. An entity path consists of one or more
            elements composed of a kind and a string or numerical
            identifier, which identify entities. The first element
            identifies a *root entity*, the second element identifies a
            *child* of the root entity, the third element identifies a
            child of the second entity, and so forth. The entities
            identified by all prefixes of the path are called the
            element's *ancestors*.

            A path can never be empty, and a path can have at most 100
            elements.
    """

    class PathElement(proto.Message):
        r"""A (kind, ID/name) pair used to construct a key path.
        If either name or ID is set, the element is complete. If neither
        is set, the element is incomplete.

        This message has `oneof`_ fields (mutually exclusive fields).
        For each oneof, at most one member field can be set at the same time.
        Setting any member of the oneof automatically clears all other
        members.

        .. _oneof: https://proto-plus-python.readthedocs.io/en/stable/fields.html#oneofs-mutually-exclusive-fields

        Attributes:
            kind (str):
                The kind of the entity. A kind matching regex ``__.*__`` is
                reserved/read-only. A kind must not contain more than 1500
                bytes when UTF-8 encoded. Cannot be ``""``.
            id (int):
                The auto-allocated ID of the entity.
                Never equal to zero. Values less than zero are
                discouraged and may not be supported in the
                future.

                This field is a member of `oneof`_ ``id_type``.
            name (str):
                The name of the entity. A name matching regex ``__.*__`` is
                reserved/read-only. A name must not be more than 1500 bytes
                when UTF-8 encoded. Cannot be ``""``.

                This field is a member of `oneof`_ ``id_type``.
        """

        kind = proto.Field(
            proto.STRING,
            number=1,
        )
        id = proto.Field(
            proto.INT64,
            number=2,
            oneof="id_type",
        )
        name = proto.Field(
            proto.STRING,
            number=3,
            oneof="id_type",
        )

    partition_id = proto.Field(
        proto.MESSAGE,
        number=1,
        message="PartitionId",
    )
    path = proto.RepeatedField(
        proto.MESSAGE,
        number=2,
        message=PathElement,
    )


class RecordKey(proto.Message):
    r"""Message for a unique key indicating a record that contains a
    finding.

    This message has `oneof`_ fields (mutually exclusive fields).
    For each oneof, at most one member field can be set at the same time.
    Setting any member of the oneof automatically clears all other
    members.

    .. _oneof: https://proto-plus-python.readthedocs.io/en/stable/fields.html#oneofs-mutually-exclusive-fields

    Attributes:
        datastore_key (google.cloud.dlp_v2.types.DatastoreKey):

            This field is a member of `oneof`_ ``type``.
        big_query_key (google.cloud.dlp_v2.types.BigQueryKey):

            This field is a member of `oneof`_ ``type``.
        id_values (Sequence[str]):
            Values of identifying columns in the given row. Order of
            values matches the order of ``identifying_fields`` specified
            in the scanning request.
    """

    datastore_key = proto.Field(
        proto.MESSAGE,
        number=2,
        oneof="type",
        message="DatastoreKey",
    )
    big_query_key = proto.Field(
        proto.MESSAGE,
        number=3,
        oneof="type",
        message="BigQueryKey",
    )
    id_values = proto.RepeatedField(
        proto.STRING,
        number=5,
    )


class BigQueryTable(proto.Message):
    r"""Message defining the location of a BigQuery table. A table is
    uniquely identified by its project_id, dataset_id, and table_name.
    Within a query a table is often referenced with a string in the
    format of: ``<project_id>:<dataset_id>.<table_id>`` or
    ``<project_id>.<dataset_id>.<table_id>``.

    Attributes:
        project_id (str):
            The Google Cloud Platform project ID of the
            project containing the table. If omitted,
            project ID is inferred from the API call.
        dataset_id (str):
            Dataset ID of the table.
        table_id (str):
            Name of the table.
    """

    project_id = proto.Field(
        proto.STRING,
        number=1,
    )
    dataset_id = proto.Field(
        proto.STRING,
        number=2,
    )
    table_id = proto.Field(
        proto.STRING,
        number=3,
    )


class BigQueryField(proto.Message):
    r"""Message defining a field of a BigQuery table.

    Attributes:
        table (google.cloud.dlp_v2.types.BigQueryTable):
            Source table of the field.
        field (google.cloud.dlp_v2.types.FieldId):
            Designated field in the BigQuery table.
    """

    table = proto.Field(
        proto.MESSAGE,
        number=1,
        message="BigQueryTable",
    )
    field = proto.Field(
        proto.MESSAGE,
        number=2,
        message="FieldId",
    )


class EntityId(proto.Message):
    r"""An entity in a dataset is a field or set of fields that correspond
    to a single person. For example, in medical records the ``EntityId``
    might be a patient identifier, or for financial records it might be
    an account identifier. This message is used when generalizations or
    analysis must take into account that multiple rows correspond to the
    same entity.

    Attributes:
        field (google.cloud.dlp_v2.types.FieldId):
            Composite key indicating which field contains
            the entity identifier.
    """

    field = proto.Field(
        proto.MESSAGE,
        number=1,
        message="FieldId",
    )


class TableOptions(proto.Message):
    r"""Instructions regarding the table content being inspected.

    Attributes:
        identifying_fields (Sequence[google.cloud.dlp_v2.types.FieldId]):
            The columns that are the primary keys for
            table objects included in ContentItem. A copy of
            this cell's value will stored alongside
            alongside each finding so that the finding can
            be traced to the specific row it came from. No
            more than 3 may be provided.
    """

    identifying_fields = proto.RepeatedField(
        proto.MESSAGE,
        number=1,
        message="FieldId",
    )


__all__ = tuple(sorted(__protobuf__.manifest))
