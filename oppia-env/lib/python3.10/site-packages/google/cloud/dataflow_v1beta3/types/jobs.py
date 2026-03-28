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

from google.protobuf import duration_pb2  # type: ignore
from google.protobuf import field_mask_pb2  # type: ignore
from google.protobuf import struct_pb2  # type: ignore
from google.protobuf import timestamp_pb2  # type: ignore
import proto  # type: ignore

from google.cloud.dataflow_v1beta3.types import environment as gd_environment

__protobuf__ = proto.module(
    package="google.dataflow.v1beta3",
    manifest={
        "KindType",
        "JobState",
        "JobView",
        "Job",
        "ServiceResources",
        "RuntimeUpdatableParams",
        "DatastoreIODetails",
        "PubSubIODetails",
        "FileIODetails",
        "BigTableIODetails",
        "BigQueryIODetails",
        "SpannerIODetails",
        "SdkVersion",
        "SdkBug",
        "JobMetadata",
        "ExecutionStageState",
        "PipelineDescription",
        "TransformSummary",
        "ExecutionStageSummary",
        "DisplayData",
        "Step",
        "JobExecutionInfo",
        "JobExecutionStageInfo",
        "CreateJobRequest",
        "GetJobRequest",
        "UpdateJobRequest",
        "ListJobsRequest",
        "FailedLocation",
        "ListJobsResponse",
        "SnapshotJobRequest",
        "CheckActiveJobsRequest",
        "CheckActiveJobsResponse",
    },
)


class KindType(proto.Enum):
    r"""Type of transform or stage operation.

    Values:
        UNKNOWN_KIND (0):
            Unrecognized transform type.
        PAR_DO_KIND (1):
            ParDo transform.
        GROUP_BY_KEY_KIND (2):
            Group By Key transform.
        FLATTEN_KIND (3):
            Flatten transform.
        READ_KIND (4):
            Read transform.
        WRITE_KIND (5):
            Write transform.
        CONSTANT_KIND (6):
            Constructs from a constant value, such as
            with Create.of.
        SINGLETON_KIND (7):
            Creates a Singleton view of a collection.
        SHUFFLE_KIND (8):
            Opening or closing a shuffle session, often
            as part of a GroupByKey.
    """
    UNKNOWN_KIND = 0
    PAR_DO_KIND = 1
    GROUP_BY_KEY_KIND = 2
    FLATTEN_KIND = 3
    READ_KIND = 4
    WRITE_KIND = 5
    CONSTANT_KIND = 6
    SINGLETON_KIND = 7
    SHUFFLE_KIND = 8


class JobState(proto.Enum):
    r"""Describes the overall state of a
    [google.dataflow.v1beta3.Job][google.dataflow.v1beta3.Job].

    Values:
        JOB_STATE_UNKNOWN (0):
            The job's run state isn't specified.
        JOB_STATE_STOPPED (1):
            ``JOB_STATE_STOPPED`` indicates that the job has not yet
            started to run.
        JOB_STATE_RUNNING (2):
            ``JOB_STATE_RUNNING`` indicates that the job is currently
            running.
        JOB_STATE_DONE (3):
            ``JOB_STATE_DONE`` indicates that the job has successfully
            completed. This is a terminal job state. This state may be
            set by the Cloud Dataflow service, as a transition from
            ``JOB_STATE_RUNNING``. It may also be set via a Cloud
            Dataflow ``UpdateJob`` call, if the job has not yet reached
            a terminal state.
        JOB_STATE_FAILED (4):
            ``JOB_STATE_FAILED`` indicates that the job has failed. This
            is a terminal job state. This state may only be set by the
            Cloud Dataflow service, and only as a transition from
            ``JOB_STATE_RUNNING``.
        JOB_STATE_CANCELLED (5):
            ``JOB_STATE_CANCELLED`` indicates that the job has been
            explicitly cancelled. This is a terminal job state. This
            state may only be set via a Cloud Dataflow ``UpdateJob``
            call, and only if the job has not yet reached another
            terminal state.
        JOB_STATE_UPDATED (6):
            ``JOB_STATE_UPDATED`` indicates that the job was
            successfully updated, meaning that this job was stopped and
            another job was started, inheriting state from this one.
            This is a terminal job state. This state may only be set by
            the Cloud Dataflow service, and only as a transition from
            ``JOB_STATE_RUNNING``.
        JOB_STATE_DRAINING (7):
            ``JOB_STATE_DRAINING`` indicates that the job is in the
            process of draining. A draining job has stopped pulling from
            its input sources and is processing any data that remains
            in-flight. This state may be set via a Cloud Dataflow
            ``UpdateJob`` call, but only as a transition from
            ``JOB_STATE_RUNNING``. Jobs that are draining may only
            transition to ``JOB_STATE_DRAINED``,
            ``JOB_STATE_CANCELLED``, or ``JOB_STATE_FAILED``.
        JOB_STATE_DRAINED (8):
            ``JOB_STATE_DRAINED`` indicates that the job has been
            drained. A drained job terminated by stopping pulling from
            its input sources and processing any data that remained
            in-flight when draining was requested. This state is a
            terminal state, may only be set by the Cloud Dataflow
            service, and only as a transition from
            ``JOB_STATE_DRAINING``.
        JOB_STATE_PENDING (9):
            ``JOB_STATE_PENDING`` indicates that the job has been
            created but is not yet running. Jobs that are pending may
            only transition to ``JOB_STATE_RUNNING``, or
            ``JOB_STATE_FAILED``.
        JOB_STATE_CANCELLING (10):
            ``JOB_STATE_CANCELLING`` indicates that the job has been
            explicitly cancelled and is in the process of stopping. Jobs
            that are cancelling may only transition to
            ``JOB_STATE_CANCELLED`` or ``JOB_STATE_FAILED``.
        JOB_STATE_QUEUED (11):
            ``JOB_STATE_QUEUED`` indicates that the job has been created
            but is being delayed until launch. Jobs that are queued may
            only transition to ``JOB_STATE_PENDING`` or
            ``JOB_STATE_CANCELLED``.
        JOB_STATE_RESOURCE_CLEANING_UP (12):
            ``JOB_STATE_RESOURCE_CLEANING_UP`` indicates that the batch
            job's associated resources are currently being cleaned up
            after a successful run. Currently, this is an opt-in
            feature, please reach out to Cloud support team if you are
            interested.
    """
    JOB_STATE_UNKNOWN = 0
    JOB_STATE_STOPPED = 1
    JOB_STATE_RUNNING = 2
    JOB_STATE_DONE = 3
    JOB_STATE_FAILED = 4
    JOB_STATE_CANCELLED = 5
    JOB_STATE_UPDATED = 6
    JOB_STATE_DRAINING = 7
    JOB_STATE_DRAINED = 8
    JOB_STATE_PENDING = 9
    JOB_STATE_CANCELLING = 10
    JOB_STATE_QUEUED = 11
    JOB_STATE_RESOURCE_CLEANING_UP = 12


class JobView(proto.Enum):
    r"""Selector for how much information is returned in Job
    responses.

    Values:
        JOB_VIEW_UNKNOWN (0):
            The job view to return isn't specified, or is unknown.
            Responses will contain at least the ``JOB_VIEW_SUMMARY``
            information, and may contain additional information.
        JOB_VIEW_SUMMARY (1):
            Request summary information only:

            Project ID, Job ID, job name, job type, job
            status, start/end time, and Cloud SDK version
            details.
        JOB_VIEW_ALL (2):
            Request all information available for this job. When the job
            is in ``JOB_STATE_PENDING``, the job has been created but is
            not yet running, and not all job information is available.
            For complete job information, wait until the job in is
            ``JOB_STATE_RUNNING``. For more information, see
            `JobState <https://cloud.google.com/dataflow/docs/reference/rest/v1b3/projects.jobs#jobstate>`__.
        JOB_VIEW_DESCRIPTION (3):
            Request summary info and limited job
            description data for steps, labels and
            environment.
    """
    JOB_VIEW_UNKNOWN = 0
    JOB_VIEW_SUMMARY = 1
    JOB_VIEW_ALL = 2
    JOB_VIEW_DESCRIPTION = 3


class Job(proto.Message):
    r"""Defines a job to be run by the Cloud Dataflow service. Do not
    enter confidential information when you supply string values
    using the API.


    .. _oneof: https://proto-plus-python.readthedocs.io/en/stable/fields.html#oneofs-mutually-exclusive-fields

    Attributes:
        id (str):
            The unique ID of this job.

            This field is set by the Dataflow service when
            the job is created, and is immutable for the
            life of the job.
        project_id (str):
            The ID of the Google Cloud project that the
            job belongs to.
        name (str):
            Optional. The user-specified Dataflow job name.

            Only one active job with a given name can exist in a project
            within one region at any given time. Jobs in different
            regions can have the same name. If a caller attempts to
            create a job with the same name as an active job that
            already exists, the attempt returns the existing job.

            The name must match the regular expression
            ``[a-z]([-a-z0-9]{0,1022}[a-z0-9])?``
        type_ (google.cloud.dataflow_v1beta3.types.JobType):
            Optional. The type of Dataflow job.
        environment (google.cloud.dataflow_v1beta3.types.Environment):
            Optional. The environment for the job.
        steps (MutableSequence[google.cloud.dataflow_v1beta3.types.Step]):
            Exactly one of step or steps_location should be specified.

            The top-level steps that constitute the entire job. Only
            retrieved with JOB_VIEW_ALL.
        steps_location (str):
            The Cloud Storage location where the steps
            are stored.
        current_state (google.cloud.dataflow_v1beta3.types.JobState):
            The current state of the job.

            Jobs are created in the ``JOB_STATE_STOPPED`` state unless
            otherwise specified.

            A job in the ``JOB_STATE_RUNNING`` state may asynchronously
            enter a terminal state. After a job has reached a terminal
            state, no further state updates may be made.

            This field might be mutated by the Dataflow service; callers
            cannot mutate it.
        current_state_time (google.protobuf.timestamp_pb2.Timestamp):
            The timestamp associated with the current
            state.
        requested_state (google.cloud.dataflow_v1beta3.types.JobState):
            The job's requested state. Applies to ``UpdateJob``
            requests.

            Set ``requested_state`` with ``UpdateJob`` requests to
            switch between the states ``JOB_STATE_STOPPED`` and
            ``JOB_STATE_RUNNING``. You can also use ``UpdateJob``
            requests to change a job's state from ``JOB_STATE_RUNNING``
            to ``JOB_STATE_CANCELLED``, ``JOB_STATE_DONE``, or
            ``JOB_STATE_DRAINED``. These states irrevocably terminate
            the job if it hasn't already reached a terminal state.

            This field has no effect on ``CreateJob`` requests.
        execution_info (google.cloud.dataflow_v1beta3.types.JobExecutionInfo):
            Deprecated.
        create_time (google.protobuf.timestamp_pb2.Timestamp):
            The timestamp when the job was initially
            created. Immutable and set by the Cloud Dataflow
            service.
        replace_job_id (str):
            If this job is an update of an existing job, this field is
            the job ID of the job it replaced.

            When sending a ``CreateJobRequest``, you can update a job by
            specifying it here. The job named here is stopped, and its
            intermediate state is transferred to this job.
        transform_name_mapping (MutableMapping[str, str]):
            Optional. The map of transform name prefixes
            of the job to be replaced to the corresponding
            name prefixes of the new job.
        client_request_id (str):
            The client's unique identifier of the job,
            re-used across retried attempts. If this field
            is set, the service will ensure its uniqueness.
            The request to create a job will fail if the
            service has knowledge of a previously submitted
            job with the same client's ID and job name. The
            caller may use this field to ensure idempotence
            of job creation across retried attempts to
            create a job. By default, the field is empty
            and, in that case, the service ignores it.
        replaced_by_job_id (str):
            If another job is an update of this job (and thus, this job
            is in ``JOB_STATE_UPDATED``), this field contains the ID of
            that job.
        temp_files (MutableSequence[str]):
            A set of files the system should be aware of
            that are used for temporary storage. These
            temporary files will be removed on job
            completion.
            No duplicates are allowed.
            No file patterns are supported.

            The supported files are:

            Google Cloud Storage:

               storage.googleapis.com/{bucket}/{object}
               bucket.storage.googleapis.com/{object}
        labels (MutableMapping[str, str]):
            User-defined labels for this job.

            The labels map can contain no more than 64 entries. Entries
            of the labels map are UTF8 strings that comply with the
            following restrictions:

            -  Keys must conform to regexp:
               [\p{Ll}\p{Lo}][\p{Ll}\p{Lo}\p{N}_-]{0,62}
            -  Values must conform to regexp:
               [\p{Ll}\p{Lo}\p{N}_-]{0,63}
            -  Both keys and values are additionally constrained to be
               <= 128 bytes in size.
        location (str):
            Optional. The [regional endpoint]
            (https://cloud.google.com/dataflow/docs/concepts/regional-endpoints)
            that contains this job.
        pipeline_description (google.cloud.dataflow_v1beta3.types.PipelineDescription):
            Preliminary field: The format of this data may change at any
            time. A description of the user pipeline and stages through
            which it is executed. Created by Cloud Dataflow service.
            Only retrieved with JOB_VIEW_DESCRIPTION or JOB_VIEW_ALL.
        stage_states (MutableSequence[google.cloud.dataflow_v1beta3.types.ExecutionStageState]):
            This field may be mutated by the Cloud
            Dataflow service; callers cannot mutate it.
        job_metadata (google.cloud.dataflow_v1beta3.types.JobMetadata):
            This field is populated by the Dataflow
            service to support filtering jobs by the
            metadata values provided here. Populated for
            ListJobs and all GetJob views SUMMARY and
            higher.
        start_time (google.protobuf.timestamp_pb2.Timestamp):
            The timestamp when the job was started (transitioned to
            JOB_STATE_PENDING). Flexible resource scheduling jobs are
            started with some delay after job creation, so start_time is
            unset before start and is updated when the job is started by
            the Cloud Dataflow service. For other jobs, start_time
            always equals to create_time and is immutable and set by the
            Cloud Dataflow service.
        created_from_snapshot_id (str):
            If this is specified, the job's initial state
            is populated from the given snapshot.
        satisfies_pzs (bool):
            Reserved for future use. This field is set
            only in responses from the server; it is ignored
            if it is set in any requests.
        runtime_updatable_params (google.cloud.dataflow_v1beta3.types.RuntimeUpdatableParams):
            This field may ONLY be modified at runtime
            using the projects.jobs.update method to adjust
            job behavior. This field has no effect when
            specified at job creation.

            This field is a member of `oneof`_ ``_runtime_updatable_params``.
        satisfies_pzi (bool):
            Output only. Reserved for future use. This
            field is set only in responses from the server;
            it is ignored if it is set in any requests.

            This field is a member of `oneof`_ ``_satisfies_pzi``.
        service_resources (google.cloud.dataflow_v1beta3.types.ServiceResources):
            Output only. Resources used by the Dataflow
            Service to run the job.

            This field is a member of `oneof`_ ``_service_resources``.
    """

    id: str = proto.Field(
        proto.STRING,
        number=1,
    )
    project_id: str = proto.Field(
        proto.STRING,
        number=2,
    )
    name: str = proto.Field(
        proto.STRING,
        number=3,
    )
    type_: gd_environment.JobType = proto.Field(
        proto.ENUM,
        number=4,
        enum=gd_environment.JobType,
    )
    environment: gd_environment.Environment = proto.Field(
        proto.MESSAGE,
        number=5,
        message=gd_environment.Environment,
    )
    steps: MutableSequence["Step"] = proto.RepeatedField(
        proto.MESSAGE,
        number=6,
        message="Step",
    )
    steps_location: str = proto.Field(
        proto.STRING,
        number=24,
    )
    current_state: "JobState" = proto.Field(
        proto.ENUM,
        number=7,
        enum="JobState",
    )
    current_state_time: timestamp_pb2.Timestamp = proto.Field(
        proto.MESSAGE,
        number=8,
        message=timestamp_pb2.Timestamp,
    )
    requested_state: "JobState" = proto.Field(
        proto.ENUM,
        number=9,
        enum="JobState",
    )
    execution_info: "JobExecutionInfo" = proto.Field(
        proto.MESSAGE,
        number=10,
        message="JobExecutionInfo",
    )
    create_time: timestamp_pb2.Timestamp = proto.Field(
        proto.MESSAGE,
        number=11,
        message=timestamp_pb2.Timestamp,
    )
    replace_job_id: str = proto.Field(
        proto.STRING,
        number=12,
    )
    transform_name_mapping: MutableMapping[str, str] = proto.MapField(
        proto.STRING,
        proto.STRING,
        number=13,
    )
    client_request_id: str = proto.Field(
        proto.STRING,
        number=14,
    )
    replaced_by_job_id: str = proto.Field(
        proto.STRING,
        number=15,
    )
    temp_files: MutableSequence[str] = proto.RepeatedField(
        proto.STRING,
        number=16,
    )
    labels: MutableMapping[str, str] = proto.MapField(
        proto.STRING,
        proto.STRING,
        number=17,
    )
    location: str = proto.Field(
        proto.STRING,
        number=18,
    )
    pipeline_description: "PipelineDescription" = proto.Field(
        proto.MESSAGE,
        number=19,
        message="PipelineDescription",
    )
    stage_states: MutableSequence["ExecutionStageState"] = proto.RepeatedField(
        proto.MESSAGE,
        number=20,
        message="ExecutionStageState",
    )
    job_metadata: "JobMetadata" = proto.Field(
        proto.MESSAGE,
        number=21,
        message="JobMetadata",
    )
    start_time: timestamp_pb2.Timestamp = proto.Field(
        proto.MESSAGE,
        number=22,
        message=timestamp_pb2.Timestamp,
    )
    created_from_snapshot_id: str = proto.Field(
        proto.STRING,
        number=23,
    )
    satisfies_pzs: bool = proto.Field(
        proto.BOOL,
        number=25,
    )
    runtime_updatable_params: "RuntimeUpdatableParams" = proto.Field(
        proto.MESSAGE,
        number=26,
        optional=True,
        message="RuntimeUpdatableParams",
    )
    satisfies_pzi: bool = proto.Field(
        proto.BOOL,
        number=27,
        optional=True,
    )
    service_resources: "ServiceResources" = proto.Field(
        proto.MESSAGE,
        number=28,
        optional=True,
        message="ServiceResources",
    )


class ServiceResources(proto.Message):
    r"""Resources used by the Dataflow Service to run the job.

    Attributes:
        zones (MutableSequence[str]):
            Output only. List of Cloud Zones being used
            by the Dataflow Service for this job. Example:
            us-central1-c
    """

    zones: MutableSequence[str] = proto.RepeatedField(
        proto.STRING,
        number=1,
    )


class RuntimeUpdatableParams(proto.Message):
    r"""Additional job parameters that can only be updated during
    runtime using the projects.jobs.update method. These fields have
    no effect when specified during job creation.


    .. _oneof: https://proto-plus-python.readthedocs.io/en/stable/fields.html#oneofs-mutually-exclusive-fields

    Attributes:
        max_num_workers (int):
            The maximum number of workers to cap
            autoscaling at. This field is currently only
            supported for Streaming Engine jobs.

            This field is a member of `oneof`_ ``_max_num_workers``.
        min_num_workers (int):
            The minimum number of workers to scale down
            to. This field is currently only supported for
            Streaming Engine jobs.

            This field is a member of `oneof`_ ``_min_num_workers``.
        worker_utilization_hint (float):
            Target worker utilization, compared against the aggregate
            utilization of the worker pool by autoscaler, to determine
            upscaling and downscaling when absent other constraints such
            as backlog. For more information, see `Update an existing
            pipeline <https://cloud.google.com/dataflow/docs/guides/updating-a-pipeline>`__.

            This field is a member of `oneof`_ ``_worker_utilization_hint``.
    """

    max_num_workers: int = proto.Field(
        proto.INT32,
        number=1,
        optional=True,
    )
    min_num_workers: int = proto.Field(
        proto.INT32,
        number=2,
        optional=True,
    )
    worker_utilization_hint: float = proto.Field(
        proto.DOUBLE,
        number=3,
        optional=True,
    )


class DatastoreIODetails(proto.Message):
    r"""Metadata for a Datastore connector used by the job.

    Attributes:
        namespace (str):
            Namespace used in the connection.
        project_id (str):
            ProjectId accessed in the connection.
    """

    namespace: str = proto.Field(
        proto.STRING,
        number=1,
    )
    project_id: str = proto.Field(
        proto.STRING,
        number=2,
    )


class PubSubIODetails(proto.Message):
    r"""Metadata for a Pub/Sub connector used by the job.

    Attributes:
        topic (str):
            Topic accessed in the connection.
        subscription (str):
            Subscription used in the connection.
    """

    topic: str = proto.Field(
        proto.STRING,
        number=1,
    )
    subscription: str = proto.Field(
        proto.STRING,
        number=2,
    )


class FileIODetails(proto.Message):
    r"""Metadata for a File connector used by the job.

    Attributes:
        file_pattern (str):
            File Pattern used to access files by the
            connector.
    """

    file_pattern: str = proto.Field(
        proto.STRING,
        number=1,
    )


class BigTableIODetails(proto.Message):
    r"""Metadata for a Cloud Bigtable connector used by the job.

    Attributes:
        project_id (str):
            ProjectId accessed in the connection.
        instance_id (str):
            InstanceId accessed in the connection.
        table_id (str):
            TableId accessed in the connection.
    """

    project_id: str = proto.Field(
        proto.STRING,
        number=1,
    )
    instance_id: str = proto.Field(
        proto.STRING,
        number=2,
    )
    table_id: str = proto.Field(
        proto.STRING,
        number=3,
    )


class BigQueryIODetails(proto.Message):
    r"""Metadata for a BigQuery connector used by the job.

    Attributes:
        table (str):
            Table accessed in the connection.
        dataset (str):
            Dataset accessed in the connection.
        project_id (str):
            Project accessed in the connection.
        query (str):
            Query used to access data in the connection.
    """

    table: str = proto.Field(
        proto.STRING,
        number=1,
    )
    dataset: str = proto.Field(
        proto.STRING,
        number=2,
    )
    project_id: str = proto.Field(
        proto.STRING,
        number=3,
    )
    query: str = proto.Field(
        proto.STRING,
        number=4,
    )


class SpannerIODetails(proto.Message):
    r"""Metadata for a Spanner connector used by the job.

    Attributes:
        project_id (str):
            ProjectId accessed in the connection.
        instance_id (str):
            InstanceId accessed in the connection.
        database_id (str):
            DatabaseId accessed in the connection.
    """

    project_id: str = proto.Field(
        proto.STRING,
        number=1,
    )
    instance_id: str = proto.Field(
        proto.STRING,
        number=2,
    )
    database_id: str = proto.Field(
        proto.STRING,
        number=3,
    )


class SdkVersion(proto.Message):
    r"""The version of the SDK used to run the job.

    Attributes:
        version (str):
            The version of the SDK used to run the job.
        version_display_name (str):
            A readable string describing the version of
            the SDK.
        sdk_support_status (google.cloud.dataflow_v1beta3.types.SdkVersion.SdkSupportStatus):
            The support status for this SDK version.
        bugs (MutableSequence[google.cloud.dataflow_v1beta3.types.SdkBug]):
            Output only. Known bugs found in this SDK
            version.
    """

    class SdkSupportStatus(proto.Enum):
        r"""The support status of the SDK used to run the job.

        Values:
            UNKNOWN (0):
                Cloud Dataflow is unaware of this version.
            SUPPORTED (1):
                This is a known version of an SDK, and is
                supported.
            STALE (2):
                A newer version of the SDK family exists, and
                an update is recommended.
            DEPRECATED (3):
                This version of the SDK is deprecated and
                will eventually be unsupported.
            UNSUPPORTED (4):
                Support for this SDK version has ended and it
                should no longer be used.
        """
        UNKNOWN = 0
        SUPPORTED = 1
        STALE = 2
        DEPRECATED = 3
        UNSUPPORTED = 4

    version: str = proto.Field(
        proto.STRING,
        number=1,
    )
    version_display_name: str = proto.Field(
        proto.STRING,
        number=2,
    )
    sdk_support_status: SdkSupportStatus = proto.Field(
        proto.ENUM,
        number=3,
        enum=SdkSupportStatus,
    )
    bugs: MutableSequence["SdkBug"] = proto.RepeatedField(
        proto.MESSAGE,
        number=4,
        message="SdkBug",
    )


class SdkBug(proto.Message):
    r"""A bug found in the Dataflow SDK.

    Attributes:
        type_ (google.cloud.dataflow_v1beta3.types.SdkBug.Type):
            Output only. Describes the impact of this SDK
            bug.
        severity (google.cloud.dataflow_v1beta3.types.SdkBug.Severity):
            Output only. How severe the SDK bug is.
        uri (str):
            Output only. Link to more information on the
            bug.
    """

    class Type(proto.Enum):
        r"""Nature of the issue, ordered from least severe to most. Other
        bug types may be added to this list in the future.

        Values:
            TYPE_UNSPECIFIED (0):
                Unknown issue with this SDK.
            GENERAL (1):
                Catch-all for SDK bugs that don't fit in the
                below categories.
            PERFORMANCE (2):
                Using this version of the SDK may result in
                degraded performance.
            DATALOSS (3):
                Using this version of the SDK may cause data
                loss.
        """
        TYPE_UNSPECIFIED = 0
        GENERAL = 1
        PERFORMANCE = 2
        DATALOSS = 3

    class Severity(proto.Enum):
        r"""Indicates the severity of the bug. Other severities may be
        added to this list in the future.

        Values:
            SEVERITY_UNSPECIFIED (0):
                A bug of unknown severity.
            NOTICE (1):
                A minor bug that that may reduce reliability
                or performance for some jobs. Impact will be
                minimal or non-existent for most jobs.
            WARNING (2):
                A bug that has some likelihood of causing
                performance degradation, data loss, or job
                failures.
            SEVERE (3):
                A bug with extremely significant impact. Jobs
                may fail erroneously, performance may be
                severely degraded, and data loss may be very
                likely.
        """
        SEVERITY_UNSPECIFIED = 0
        NOTICE = 1
        WARNING = 2
        SEVERE = 3

    type_: Type = proto.Field(
        proto.ENUM,
        number=1,
        enum=Type,
    )
    severity: Severity = proto.Field(
        proto.ENUM,
        number=2,
        enum=Severity,
    )
    uri: str = proto.Field(
        proto.STRING,
        number=3,
    )


class JobMetadata(proto.Message):
    r"""Metadata available primarily for filtering jobs. Will be
    included in the ListJob response and Job SUMMARY view.

    Attributes:
        sdk_version (google.cloud.dataflow_v1beta3.types.SdkVersion):
            The SDK version used to run the job.
        spanner_details (MutableSequence[google.cloud.dataflow_v1beta3.types.SpannerIODetails]):
            Identification of a Spanner source used in
            the Dataflow job.
        bigquery_details (MutableSequence[google.cloud.dataflow_v1beta3.types.BigQueryIODetails]):
            Identification of a BigQuery source used in
            the Dataflow job.
        big_table_details (MutableSequence[google.cloud.dataflow_v1beta3.types.BigTableIODetails]):
            Identification of a Cloud Bigtable source
            used in the Dataflow job.
        pubsub_details (MutableSequence[google.cloud.dataflow_v1beta3.types.PubSubIODetails]):
            Identification of a Pub/Sub source used in
            the Dataflow job.
        file_details (MutableSequence[google.cloud.dataflow_v1beta3.types.FileIODetails]):
            Identification of a File source used in the
            Dataflow job.
        datastore_details (MutableSequence[google.cloud.dataflow_v1beta3.types.DatastoreIODetails]):
            Identification of a Datastore source used in
            the Dataflow job.
        user_display_properties (MutableMapping[str, str]):
            List of display properties to help UI filter
            jobs.
    """

    sdk_version: "SdkVersion" = proto.Field(
        proto.MESSAGE,
        number=1,
        message="SdkVersion",
    )
    spanner_details: MutableSequence["SpannerIODetails"] = proto.RepeatedField(
        proto.MESSAGE,
        number=2,
        message="SpannerIODetails",
    )
    bigquery_details: MutableSequence["BigQueryIODetails"] = proto.RepeatedField(
        proto.MESSAGE,
        number=3,
        message="BigQueryIODetails",
    )
    big_table_details: MutableSequence["BigTableIODetails"] = proto.RepeatedField(
        proto.MESSAGE,
        number=4,
        message="BigTableIODetails",
    )
    pubsub_details: MutableSequence["PubSubIODetails"] = proto.RepeatedField(
        proto.MESSAGE,
        number=5,
        message="PubSubIODetails",
    )
    file_details: MutableSequence["FileIODetails"] = proto.RepeatedField(
        proto.MESSAGE,
        number=6,
        message="FileIODetails",
    )
    datastore_details: MutableSequence["DatastoreIODetails"] = proto.RepeatedField(
        proto.MESSAGE,
        number=7,
        message="DatastoreIODetails",
    )
    user_display_properties: MutableMapping[str, str] = proto.MapField(
        proto.STRING,
        proto.STRING,
        number=8,
    )


class ExecutionStageState(proto.Message):
    r"""A message describing the state of a particular execution
    stage.

    Attributes:
        execution_stage_name (str):
            The name of the execution stage.
        execution_stage_state (google.cloud.dataflow_v1beta3.types.JobState):
            Executions stage states allow the same set of
            values as JobState.
        current_state_time (google.protobuf.timestamp_pb2.Timestamp):
            The time at which the stage transitioned to
            this state.
    """

    execution_stage_name: str = proto.Field(
        proto.STRING,
        number=1,
    )
    execution_stage_state: "JobState" = proto.Field(
        proto.ENUM,
        number=2,
        enum="JobState",
    )
    current_state_time: timestamp_pb2.Timestamp = proto.Field(
        proto.MESSAGE,
        number=3,
        message=timestamp_pb2.Timestamp,
    )


class PipelineDescription(proto.Message):
    r"""A descriptive representation of submitted pipeline as well as
    the executed form.  This data is provided by the Dataflow
    service for ease of visualizing the pipeline and interpreting
    Dataflow provided metrics.

    Attributes:
        original_pipeline_transform (MutableSequence[google.cloud.dataflow_v1beta3.types.TransformSummary]):
            Description of each transform in the pipeline
            and collections between them.
        execution_pipeline_stage (MutableSequence[google.cloud.dataflow_v1beta3.types.ExecutionStageSummary]):
            Description of each stage of execution of the
            pipeline.
        display_data (MutableSequence[google.cloud.dataflow_v1beta3.types.DisplayData]):
            Pipeline level display data.
        step_names_hash (str):
            A hash value of the submitted pipeline
            portable graph step names if exists.
    """

    original_pipeline_transform: MutableSequence[
        "TransformSummary"
    ] = proto.RepeatedField(
        proto.MESSAGE,
        number=1,
        message="TransformSummary",
    )
    execution_pipeline_stage: MutableSequence[
        "ExecutionStageSummary"
    ] = proto.RepeatedField(
        proto.MESSAGE,
        number=2,
        message="ExecutionStageSummary",
    )
    display_data: MutableSequence["DisplayData"] = proto.RepeatedField(
        proto.MESSAGE,
        number=3,
        message="DisplayData",
    )
    step_names_hash: str = proto.Field(
        proto.STRING,
        number=4,
    )


class TransformSummary(proto.Message):
    r"""Description of the type, names/ids, and input/outputs for a
    transform.

    Attributes:
        kind (google.cloud.dataflow_v1beta3.types.KindType):
            Type of transform.
        id (str):
            SDK generated id of this transform instance.
        name (str):
            User provided name for this transform
            instance.
        display_data (MutableSequence[google.cloud.dataflow_v1beta3.types.DisplayData]):
            Transform-specific display data.
        output_collection_name (MutableSequence[str]):
            User  names for all collection outputs to
            this transform.
        input_collection_name (MutableSequence[str]):
            User names for all collection inputs to this
            transform.
    """

    kind: "KindType" = proto.Field(
        proto.ENUM,
        number=1,
        enum="KindType",
    )
    id: str = proto.Field(
        proto.STRING,
        number=2,
    )
    name: str = proto.Field(
        proto.STRING,
        number=3,
    )
    display_data: MutableSequence["DisplayData"] = proto.RepeatedField(
        proto.MESSAGE,
        number=4,
        message="DisplayData",
    )
    output_collection_name: MutableSequence[str] = proto.RepeatedField(
        proto.STRING,
        number=5,
    )
    input_collection_name: MutableSequence[str] = proto.RepeatedField(
        proto.STRING,
        number=6,
    )


class ExecutionStageSummary(proto.Message):
    r"""Description of the composing transforms, names/ids, and
    input/outputs of a stage of execution.  Some composing
    transforms and sources may have been generated by the Dataflow
    service during execution planning.

    Attributes:
        name (str):
            Dataflow service generated name for this
            stage.
        id (str):
            Dataflow service generated id for this stage.
        kind (google.cloud.dataflow_v1beta3.types.KindType):
            Type of transform this stage is executing.
        input_source (MutableSequence[google.cloud.dataflow_v1beta3.types.ExecutionStageSummary.StageSource]):
            Input sources for this stage.
        output_source (MutableSequence[google.cloud.dataflow_v1beta3.types.ExecutionStageSummary.StageSource]):
            Output sources for this stage.
        prerequisite_stage (MutableSequence[str]):
            Other stages that must complete before this
            stage can run.
        component_transform (MutableSequence[google.cloud.dataflow_v1beta3.types.ExecutionStageSummary.ComponentTransform]):
            Transforms that comprise this execution
            stage.
        component_source (MutableSequence[google.cloud.dataflow_v1beta3.types.ExecutionStageSummary.ComponentSource]):
            Collections produced and consumed by
            component transforms of this stage.
    """

    class StageSource(proto.Message):
        r"""Description of an input or output of an execution stage.

        Attributes:
            user_name (str):
                Human-readable name for this source; may be
                user or system generated.
            name (str):
                Dataflow service generated name for this
                source.
            original_transform_or_collection (str):
                User name for the original user transform or
                collection with which this source is most
                closely associated.
            size_bytes (int):
                Size of the source, if measurable.
        """

        user_name: str = proto.Field(
            proto.STRING,
            number=1,
        )
        name: str = proto.Field(
            proto.STRING,
            number=2,
        )
        original_transform_or_collection: str = proto.Field(
            proto.STRING,
            number=3,
        )
        size_bytes: int = proto.Field(
            proto.INT64,
            number=4,
        )

    class ComponentTransform(proto.Message):
        r"""Description of a transform executed as part of an execution
        stage.

        Attributes:
            user_name (str):
                Human-readable name for this transform; may
                be user or system generated.
            name (str):
                Dataflow service generated name for this
                source.
            original_transform (str):
                User name for the original user transform
                with which this transform is most closely
                associated.
        """

        user_name: str = proto.Field(
            proto.STRING,
            number=1,
        )
        name: str = proto.Field(
            proto.STRING,
            number=2,
        )
        original_transform: str = proto.Field(
            proto.STRING,
            number=3,
        )

    class ComponentSource(proto.Message):
        r"""Description of an interstitial value between transforms in an
        execution stage.

        Attributes:
            user_name (str):
                Human-readable name for this transform; may
                be user or system generated.
            name (str):
                Dataflow service generated name for this
                source.
            original_transform_or_collection (str):
                User name for the original user transform or
                collection with which this source is most
                closely associated.
        """

        user_name: str = proto.Field(
            proto.STRING,
            number=1,
        )
        name: str = proto.Field(
            proto.STRING,
            number=2,
        )
        original_transform_or_collection: str = proto.Field(
            proto.STRING,
            number=3,
        )

    name: str = proto.Field(
        proto.STRING,
        number=1,
    )
    id: str = proto.Field(
        proto.STRING,
        number=2,
    )
    kind: "KindType" = proto.Field(
        proto.ENUM,
        number=3,
        enum="KindType",
    )
    input_source: MutableSequence[StageSource] = proto.RepeatedField(
        proto.MESSAGE,
        number=4,
        message=StageSource,
    )
    output_source: MutableSequence[StageSource] = proto.RepeatedField(
        proto.MESSAGE,
        number=5,
        message=StageSource,
    )
    prerequisite_stage: MutableSequence[str] = proto.RepeatedField(
        proto.STRING,
        number=8,
    )
    component_transform: MutableSequence[ComponentTransform] = proto.RepeatedField(
        proto.MESSAGE,
        number=6,
        message=ComponentTransform,
    )
    component_source: MutableSequence[ComponentSource] = proto.RepeatedField(
        proto.MESSAGE,
        number=7,
        message=ComponentSource,
    )


class DisplayData(proto.Message):
    r"""Data provided with a pipeline or transform to provide
    descriptive info.

    This message has `oneof`_ fields (mutually exclusive fields).
    For each oneof, at most one member field can be set at the same time.
    Setting any member of the oneof automatically clears all other
    members.

    .. _oneof: https://proto-plus-python.readthedocs.io/en/stable/fields.html#oneofs-mutually-exclusive-fields

    Attributes:
        key (str):
            The key identifying the display data.
            This is intended to be used as a label for the
            display data when viewed in a dax monitoring
            system.
        namespace (str):
            The namespace for the key. This is usually a
            class name or programming language namespace
            (i.e. python module) which defines the display
            data. This allows a dax monitoring system to
            specially handle the data and perform custom
            rendering.
        str_value (str):
            Contains value if the data is of string type.

            This field is a member of `oneof`_ ``Value``.
        int64_value (int):
            Contains value if the data is of int64 type.

            This field is a member of `oneof`_ ``Value``.
        float_value (float):
            Contains value if the data is of float type.

            This field is a member of `oneof`_ ``Value``.
        java_class_value (str):
            Contains value if the data is of java class
            type.

            This field is a member of `oneof`_ ``Value``.
        timestamp_value (google.protobuf.timestamp_pb2.Timestamp):
            Contains value if the data is of timestamp
            type.

            This field is a member of `oneof`_ ``Value``.
        duration_value (google.protobuf.duration_pb2.Duration):
            Contains value if the data is of duration
            type.

            This field is a member of `oneof`_ ``Value``.
        bool_value (bool):
            Contains value if the data is of a boolean
            type.

            This field is a member of `oneof`_ ``Value``.
        short_str_value (str):
            A possible additional shorter value to display. For example
            a java_class_name_value of com.mypackage.MyDoFn will be
            stored with MyDoFn as the short_str_value and
            com.mypackage.MyDoFn as the java_class_name value.
            short_str_value can be displayed and java_class_name_value
            will be displayed as a tooltip.
        url (str):
            An optional full URL.
        label (str):
            An optional label to display in a dax UI for
            the element.
    """

    key: str = proto.Field(
        proto.STRING,
        number=1,
    )
    namespace: str = proto.Field(
        proto.STRING,
        number=2,
    )
    str_value: str = proto.Field(
        proto.STRING,
        number=4,
        oneof="Value",
    )
    int64_value: int = proto.Field(
        proto.INT64,
        number=5,
        oneof="Value",
    )
    float_value: float = proto.Field(
        proto.FLOAT,
        number=6,
        oneof="Value",
    )
    java_class_value: str = proto.Field(
        proto.STRING,
        number=7,
        oneof="Value",
    )
    timestamp_value: timestamp_pb2.Timestamp = proto.Field(
        proto.MESSAGE,
        number=8,
        oneof="Value",
        message=timestamp_pb2.Timestamp,
    )
    duration_value: duration_pb2.Duration = proto.Field(
        proto.MESSAGE,
        number=9,
        oneof="Value",
        message=duration_pb2.Duration,
    )
    bool_value: bool = proto.Field(
        proto.BOOL,
        number=10,
        oneof="Value",
    )
    short_str_value: str = proto.Field(
        proto.STRING,
        number=11,
    )
    url: str = proto.Field(
        proto.STRING,
        number=12,
    )
    label: str = proto.Field(
        proto.STRING,
        number=13,
    )


class Step(proto.Message):
    r"""Defines a particular step within a Cloud Dataflow job.

    A job consists of multiple steps, each of which performs some
    specific operation as part of the overall job. Data is typically
    passed from one step to another as part of the job.

    **Note:** The properties of this object are not stable and might
    change.

    Here's an example of a sequence of steps which together implement a
    Map-Reduce job:

    -  Read a collection of data from some source, parsing the
       collection's elements.

    -  Validate the elements.

    -  Apply a user-defined function to map each element to some value
       and extract an element-specific key value.

    -  Group elements with the same key into a single element with that
       key, transforming a multiply-keyed collection into a
       uniquely-keyed collection.

    -  Write the elements out to some data sink.

    Note that the Cloud Dataflow service may be used to run many
    different types of jobs, not just Map-Reduce.

    Attributes:
        kind (str):
            The kind of step in the Cloud Dataflow job.
        name (str):
            The name that identifies the step. This must
            be unique for each step with respect to all
            other steps in the Cloud Dataflow job.
        properties (google.protobuf.struct_pb2.Struct):
            Named properties associated with the step. Each kind of
            predefined step has its own required set of properties. Must
            be provided on Create. Only retrieved with JOB_VIEW_ALL.
    """

    kind: str = proto.Field(
        proto.STRING,
        number=1,
    )
    name: str = proto.Field(
        proto.STRING,
        number=2,
    )
    properties: struct_pb2.Struct = proto.Field(
        proto.MESSAGE,
        number=3,
        message=struct_pb2.Struct,
    )


class JobExecutionInfo(proto.Message):
    r"""Additional information about how a Cloud Dataflow job will be
    executed that isn't contained in the submitted job.

    Attributes:
        stages (MutableMapping[str, google.cloud.dataflow_v1beta3.types.JobExecutionStageInfo]):
            A mapping from each stage to the information
            about that stage.
    """

    stages: MutableMapping[str, "JobExecutionStageInfo"] = proto.MapField(
        proto.STRING,
        proto.MESSAGE,
        number=1,
        message="JobExecutionStageInfo",
    )


class JobExecutionStageInfo(proto.Message):
    r"""Contains information about how a particular
    [google.dataflow.v1beta3.Step][google.dataflow.v1beta3.Step] will be
    executed.

    Attributes:
        step_name (MutableSequence[str]):
            The steps associated with the execution
            stage. Note that stages may have several steps,
            and that a given step might be run by more than
            one stage.
    """

    step_name: MutableSequence[str] = proto.RepeatedField(
        proto.STRING,
        number=1,
    )


class CreateJobRequest(proto.Message):
    r"""Request to create a Cloud Dataflow job.

    Attributes:
        project_id (str):
            The ID of the Cloud Platform project that the
            job belongs to.
        job (google.cloud.dataflow_v1beta3.types.Job):
            The job to create.
        view (google.cloud.dataflow_v1beta3.types.JobView):
            The level of information requested in
            response.
        replace_job_id (str):
            Deprecated. This field is now in the Job
            message.
        location (str):
            The [regional endpoint]
            (https://cloud.google.com/dataflow/docs/concepts/regional-endpoints)
            that contains this job.
    """

    project_id: str = proto.Field(
        proto.STRING,
        number=1,
    )
    job: "Job" = proto.Field(
        proto.MESSAGE,
        number=2,
        message="Job",
    )
    view: "JobView" = proto.Field(
        proto.ENUM,
        number=3,
        enum="JobView",
    )
    replace_job_id: str = proto.Field(
        proto.STRING,
        number=4,
    )
    location: str = proto.Field(
        proto.STRING,
        number=5,
    )


class GetJobRequest(proto.Message):
    r"""Request to get the state of a Cloud Dataflow job.

    Attributes:
        project_id (str):
            The ID of the Cloud Platform project that the
            job belongs to.
        job_id (str):
            The job ID.
        view (google.cloud.dataflow_v1beta3.types.JobView):
            The level of information requested in
            response.
        location (str):
            The [regional endpoint]
            (https://cloud.google.com/dataflow/docs/concepts/regional-endpoints)
            that contains this job.
    """

    project_id: str = proto.Field(
        proto.STRING,
        number=1,
    )
    job_id: str = proto.Field(
        proto.STRING,
        number=2,
    )
    view: "JobView" = proto.Field(
        proto.ENUM,
        number=3,
        enum="JobView",
    )
    location: str = proto.Field(
        proto.STRING,
        number=4,
    )


class UpdateJobRequest(proto.Message):
    r"""Request to update a Cloud Dataflow job.

    .. _oneof: https://proto-plus-python.readthedocs.io/en/stable/fields.html#oneofs-mutually-exclusive-fields

    Attributes:
        project_id (str):
            The ID of the Cloud Platform project that the
            job belongs to.
        job_id (str):
            The job ID.
        job (google.cloud.dataflow_v1beta3.types.Job):
            The updated job.
            Only the job state is updatable; other fields
            will be ignored.
        location (str):
            The [regional endpoint]
            (https://cloud.google.com/dataflow/docs/concepts/regional-endpoints)
            that contains this job.
        update_mask (google.protobuf.field_mask_pb2.FieldMask):
            The list of fields to update relative to Job. If empty, only
            RequestedJobState will be considered for update. If the
            FieldMask is not empty and RequestedJobState is none/empty,
            The fields specified in the update mask will be the only
            ones considered for update. If both RequestedJobState and
            update_mask are specified, an error will be returned as we
            cannot update both state and mask.

            This field is a member of `oneof`_ ``_update_mask``.
    """

    project_id: str = proto.Field(
        proto.STRING,
        number=1,
    )
    job_id: str = proto.Field(
        proto.STRING,
        number=2,
    )
    job: "Job" = proto.Field(
        proto.MESSAGE,
        number=3,
        message="Job",
    )
    location: str = proto.Field(
        proto.STRING,
        number=4,
    )
    update_mask: field_mask_pb2.FieldMask = proto.Field(
        proto.MESSAGE,
        number=5,
        optional=True,
        message=field_mask_pb2.FieldMask,
    )


class ListJobsRequest(proto.Message):
    r"""Request to list Cloud Dataflow jobs.

    .. _oneof: https://proto-plus-python.readthedocs.io/en/stable/fields.html#oneofs-mutually-exclusive-fields

    Attributes:
        filter (google.cloud.dataflow_v1beta3.types.ListJobsRequest.Filter):
            The kind of filter to use.
        project_id (str):
            The project which owns the jobs.
        view (google.cloud.dataflow_v1beta3.types.JobView):
            Deprecated. ListJobs always returns summaries
            now. Use GetJob for other JobViews.
        page_size (int):
            If there are many jobs, limit response to at most this many.
            The actual number of jobs returned will be the lesser of
            max_responses and an unspecified server-defined limit.
        page_token (str):
            Set this to the 'next_page_token' field of a previous
            response to request additional results in a long list.
        location (str):
            The [regional endpoint]
            (https://cloud.google.com/dataflow/docs/concepts/regional-endpoints)
            that contains this job.
        name (str):
            Optional. The job name.

            This field is a member of `oneof`_ ``_name``.
    """

    class Filter(proto.Enum):
        r"""This field filters out and returns jobs in the specified job
        state. The order of data returned is determined by the filter
        used, and is subject to change.

        Values:
            UNKNOWN (0):
                The filter isn't specified, or is unknown. This returns all
                jobs ordered on descending ``JobUuid``.
            ALL (1):
                Returns all running jobs first ordered on
                creation timestamp, then returns all terminated
                jobs ordered on the termination timestamp.
            TERMINATED (2):
                Filters the jobs that have a terminated state, ordered on
                the termination timestamp. Example terminated states:
                ``JOB_STATE_STOPPED``, ``JOB_STATE_UPDATED``,
                ``JOB_STATE_DRAINED``, etc.
            ACTIVE (3):
                Filters the jobs that are running ordered on
                the creation timestamp.
        """
        UNKNOWN = 0
        ALL = 1
        TERMINATED = 2
        ACTIVE = 3

    filter: Filter = proto.Field(
        proto.ENUM,
        number=5,
        enum=Filter,
    )
    project_id: str = proto.Field(
        proto.STRING,
        number=1,
    )
    view: "JobView" = proto.Field(
        proto.ENUM,
        number=2,
        enum="JobView",
    )
    page_size: int = proto.Field(
        proto.INT32,
        number=3,
    )
    page_token: str = proto.Field(
        proto.STRING,
        number=4,
    )
    location: str = proto.Field(
        proto.STRING,
        number=17,
    )
    name: str = proto.Field(
        proto.STRING,
        number=11,
        optional=True,
    )


class FailedLocation(proto.Message):
    r"""Indicates which [regional endpoint]
    (https://cloud.google.com/dataflow/docs/concepts/regional-endpoints)
    failed to respond to a request for data.

    Attributes:
        name (str):
            The name of the [regional endpoint]
            (https://cloud.google.com/dataflow/docs/concepts/regional-endpoints)
            that failed to respond.
    """

    name: str = proto.Field(
        proto.STRING,
        number=1,
    )


class ListJobsResponse(proto.Message):
    r"""Response to a request to list Cloud Dataflow jobs in a
    project. This might be a partial response, depending on the page
    size in the ListJobsRequest. However, if the project does not
    have any jobs, an instance of ListJobsResponse is not returned
    and the requests's response body is empty {}.

    Attributes:
        jobs (MutableSequence[google.cloud.dataflow_v1beta3.types.Job]):
            A subset of the requested job information.
        next_page_token (str):
            Set if there may be more results than fit in
            this response.
        failed_location (MutableSequence[google.cloud.dataflow_v1beta3.types.FailedLocation]):
            Zero or more messages describing the [regional endpoints]
            (https://cloud.google.com/dataflow/docs/concepts/regional-endpoints)
            that failed to respond.
    """

    @property
    def raw_page(self):
        return self

    jobs: MutableSequence["Job"] = proto.RepeatedField(
        proto.MESSAGE,
        number=1,
        message="Job",
    )
    next_page_token: str = proto.Field(
        proto.STRING,
        number=2,
    )
    failed_location: MutableSequence["FailedLocation"] = proto.RepeatedField(
        proto.MESSAGE,
        number=3,
        message="FailedLocation",
    )


class SnapshotJobRequest(proto.Message):
    r"""Request to create a snapshot of a job.

    Attributes:
        project_id (str):
            The project which owns the job to be
            snapshotted.
        job_id (str):
            The job to be snapshotted.
        ttl (google.protobuf.duration_pb2.Duration):
            TTL for the snapshot.
        location (str):
            The location that contains this job.
        snapshot_sources (bool):
            If true, perform snapshots for sources which
            support this.
        description (str):
            User specified description of the snapshot.
            Maybe empty.
    """

    project_id: str = proto.Field(
        proto.STRING,
        number=1,
    )
    job_id: str = proto.Field(
        proto.STRING,
        number=2,
    )
    ttl: duration_pb2.Duration = proto.Field(
        proto.MESSAGE,
        number=3,
        message=duration_pb2.Duration,
    )
    location: str = proto.Field(
        proto.STRING,
        number=4,
    )
    snapshot_sources: bool = proto.Field(
        proto.BOOL,
        number=5,
    )
    description: str = proto.Field(
        proto.STRING,
        number=6,
    )


class CheckActiveJobsRequest(proto.Message):
    r"""Request to check is active jobs exists for a project

    Attributes:
        project_id (str):
            The project which owns the jobs.
    """

    project_id: str = proto.Field(
        proto.STRING,
        number=1,
    )


class CheckActiveJobsResponse(proto.Message):
    r"""Response for CheckActiveJobsRequest.

    Attributes:
        active_jobs_exist (bool):
            If True, active jobs exists for project.
            False otherwise.
    """

    active_jobs_exist: bool = proto.Field(
        proto.BOOL,
        number=1,
    )


__all__ = tuple(sorted(__protobuf__.manifest))
