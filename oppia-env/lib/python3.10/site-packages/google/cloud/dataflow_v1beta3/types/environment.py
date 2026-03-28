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

from google.protobuf import any_pb2  # type: ignore
from google.protobuf import struct_pb2  # type: ignore
import proto  # type: ignore

__protobuf__ = proto.module(
    package="google.dataflow.v1beta3",
    manifest={
        "JobType",
        "FlexResourceSchedulingGoal",
        "TeardownPolicy",
        "DefaultPackageSet",
        "AutoscalingAlgorithm",
        "WorkerIPAddressConfiguration",
        "ShuffleMode",
        "StreamingMode",
        "Environment",
        "Package",
        "Disk",
        "WorkerSettings",
        "TaskRunnerSettings",
        "AutoscalingSettings",
        "SdkHarnessContainerImage",
        "WorkerPool",
        "DataSamplingConfig",
        "DebugOptions",
    },
)


class JobType(proto.Enum):
    r"""Specifies the processing model used by a
    [google.dataflow.v1beta3.Job], which determines the way the Job is
    managed by the Cloud Dataflow service (how workers are scheduled,
    how inputs are sharded, etc).

    Values:
        JOB_TYPE_UNKNOWN (0):
            The type of the job is unspecified, or
            unknown.
        JOB_TYPE_BATCH (1):
            A batch job with a well-defined end point:
            data is read, data is processed, data is
            written, and the job is done.
        JOB_TYPE_STREAMING (2):
            A continuously streaming job with no end:
            data is read, processed, and written
            continuously.
    """
    JOB_TYPE_UNKNOWN = 0
    JOB_TYPE_BATCH = 1
    JOB_TYPE_STREAMING = 2


class FlexResourceSchedulingGoal(proto.Enum):
    r"""Specifies the resource to optimize for in Flexible Resource
    Scheduling.

    Values:
        FLEXRS_UNSPECIFIED (0):
            Run in the default mode.
        FLEXRS_SPEED_OPTIMIZED (1):
            Optimize for lower execution time.
        FLEXRS_COST_OPTIMIZED (2):
            Optimize for lower cost.
    """
    FLEXRS_UNSPECIFIED = 0
    FLEXRS_SPEED_OPTIMIZED = 1
    FLEXRS_COST_OPTIMIZED = 2


class TeardownPolicy(proto.Enum):
    r"""Specifies what happens to a resource when a Cloud Dataflow
    [google.dataflow.v1beta3.Job][google.dataflow.v1beta3.Job] has
    completed.

    Values:
        TEARDOWN_POLICY_UNKNOWN (0):
            The teardown policy isn't specified, or is
            unknown.
        TEARDOWN_ALWAYS (1):
            Always teardown the resource.
        TEARDOWN_ON_SUCCESS (2):
            Teardown the resource on success. This is
            useful for debugging failures.
        TEARDOWN_NEVER (3):
            Never teardown the resource. This is useful
            for debugging and development.
    """
    TEARDOWN_POLICY_UNKNOWN = 0
    TEARDOWN_ALWAYS = 1
    TEARDOWN_ON_SUCCESS = 2
    TEARDOWN_NEVER = 3


class DefaultPackageSet(proto.Enum):
    r"""The default set of packages to be staged on a pool of
    workers.

    Values:
        DEFAULT_PACKAGE_SET_UNKNOWN (0):
            The default set of packages to stage is
            unknown, or unspecified.
        DEFAULT_PACKAGE_SET_NONE (1):
            Indicates that no packages should be staged
            at the worker unless explicitly specified by the
            job.
        DEFAULT_PACKAGE_SET_JAVA (2):
            Stage packages typically useful to workers
            written in Java.
        DEFAULT_PACKAGE_SET_PYTHON (3):
            Stage packages typically useful to workers
            written in Python.
    """
    DEFAULT_PACKAGE_SET_UNKNOWN = 0
    DEFAULT_PACKAGE_SET_NONE = 1
    DEFAULT_PACKAGE_SET_JAVA = 2
    DEFAULT_PACKAGE_SET_PYTHON = 3


class AutoscalingAlgorithm(proto.Enum):
    r"""Specifies the algorithm used to determine the number of
    worker processes to run at any given point in time, based on the
    amount of data left to process, the number of workers, and how
    quickly existing workers are processing data.

    Values:
        AUTOSCALING_ALGORITHM_UNKNOWN (0):
            The algorithm is unknown, or unspecified.
        AUTOSCALING_ALGORITHM_NONE (1):
            Disable autoscaling.
        AUTOSCALING_ALGORITHM_BASIC (2):
            Increase worker count over time to reduce job
            execution time.
    """
    AUTOSCALING_ALGORITHM_UNKNOWN = 0
    AUTOSCALING_ALGORITHM_NONE = 1
    AUTOSCALING_ALGORITHM_BASIC = 2


class WorkerIPAddressConfiguration(proto.Enum):
    r"""Specifies how to allocate IP addresses to worker machines. You can
    also use `pipeline
    options <https://cloud.google.com/dataflow/docs/reference/pipeline-options#security_and_networking>`__
    to specify whether Dataflow workers use external IP addresses.

    Values:
        WORKER_IP_UNSPECIFIED (0):
            The configuration is unknown, or unspecified.
        WORKER_IP_PUBLIC (1):
            Workers should have public IP addresses.
        WORKER_IP_PRIVATE (2):
            Workers should have private IP addresses.
    """
    WORKER_IP_UNSPECIFIED = 0
    WORKER_IP_PUBLIC = 1
    WORKER_IP_PRIVATE = 2


class ShuffleMode(proto.Enum):
    r"""Specifies the shuffle mode used by a [google.dataflow.v1beta3.Job],
    which determines the approach data is shuffled during processing.
    More details in:
    https://cloud.google.com/dataflow/docs/guides/deploying-a-pipeline#dataflow-shuffle

    Values:
        SHUFFLE_MODE_UNSPECIFIED (0):
            Shuffle mode information is not available.
        VM_BASED (1):
            Shuffle is done on the worker VMs.
        SERVICE_BASED (2):
            Shuffle is done on the service side.
    """
    SHUFFLE_MODE_UNSPECIFIED = 0
    VM_BASED = 1
    SERVICE_BASED = 2


class StreamingMode(proto.Enum):
    r"""Specifies the Streaming Engine message processing guarantees.
    Reduces cost and latency but might result in duplicate messages
    written to storage. Designed to run simple mapping streaming ETL
    jobs at the lowest cost. For example, Change Data Capture (CDC) to
    BigQuery is a canonical use case. For more information, see `Set the
    pipeline streaming
    mode <https://cloud.google.com/dataflow/docs/guides/streaming-modes>`__.

    Values:
        STREAMING_MODE_UNSPECIFIED (0):
            Run in the default mode.
        STREAMING_MODE_EXACTLY_ONCE (1):
            In this mode, message deduplication is
            performed against persistent state to make sure
            each message is processed and committed to
            storage exactly once.
        STREAMING_MODE_AT_LEAST_ONCE (2):
            Message deduplication is not performed.
            Messages might be processed multiple times, and
            the results are applied multiple times. Note:
            Setting this value also enables Streaming Engine
            and Streaming Engine resource-based billing.
    """
    STREAMING_MODE_UNSPECIFIED = 0
    STREAMING_MODE_EXACTLY_ONCE = 1
    STREAMING_MODE_AT_LEAST_ONCE = 2


class Environment(proto.Message):
    r"""Describes the environment in which a Dataflow Job runs.

    Attributes:
        temp_storage_prefix (str):
            The prefix of the resources the system should use for
            temporary storage. The system will append the suffix
            "/temp-{JOBNAME} to this resource prefix, where {JOBNAME} is
            the value of the job_name field. The resulting bucket and
            object prefix is used as the prefix of the resources used to
            store temporary data needed during the job execution. NOTE:
            This will override the value in taskrunner_settings. The
            supported resource type is:

            Google Cloud Storage:

            storage.googleapis.com/{bucket}/{object}
            bucket.storage.googleapis.com/{object}
        cluster_manager_api_service (str):
            The type of cluster manager API to use.  If
            unknown or unspecified, the service will attempt
            to choose a reasonable default.  This should be
            in the form of the API service name, e.g.
            "compute.googleapis.com".
        experiments (MutableSequence[str]):
            The list of experiments to enable. This field should be used
            for SDK related experiments and not for service related
            experiments. The proper field for service related
            experiments is service_options.
        service_options (MutableSequence[str]):
            Optional. The list of service options to
            enable. This field should be used for service
            related experiments only. These experiments,
            when graduating to GA, should be replaced by
            dedicated fields or become default (i.e. always
            on).
        service_kms_key_name (str):
            Optional. If set, contains the Cloud KMS key identifier used
            to encrypt data at rest, AKA a Customer Managed Encryption
            Key (CMEK).

            Format:
            projects/PROJECT_ID/locations/LOCATION/keyRings/KEY_RING/cryptoKeys/KEY
        worker_pools (MutableSequence[google.cloud.dataflow_v1beta3.types.WorkerPool]):
            The worker pools. At least one "harness"
            worker pool must be specified in order for the
            job to have workers.
        user_agent (google.protobuf.struct_pb2.Struct):
            A description of the process that generated
            the request.
        version (google.protobuf.struct_pb2.Struct):
            A structure describing which components and
            their versions of the service are required in
            order to run the job.
        dataset (str):
            Optional. The dataset for the current project
            where various workflow related tables are
            stored.

            The supported resource type is:

            Google BigQuery:

              bigquery.googleapis.com/{dataset}
        sdk_pipeline_options (google.protobuf.struct_pb2.Struct):
            The Cloud Dataflow SDK pipeline options
            specified by the user. These options are passed
            through the service and are used to recreate the
            SDK pipeline options on the worker in a language
            agnostic and platform independent way.
        internal_experiments (google.protobuf.any_pb2.Any):
            Experimental settings.
        service_account_email (str):
            Optional. Identity to run virtual machines
            as. Defaults to the default account.
        flex_resource_scheduling_goal (google.cloud.dataflow_v1beta3.types.FlexResourceSchedulingGoal):
            Optional. Which Flexible Resource Scheduling
            mode to run in.
        worker_region (str):
            Optional. The Compute Engine region
            (https://cloud.google.com/compute/docs/regions-zones/regions-zones)
            in which worker processing should occur, e.g. "us-west1".
            Mutually exclusive with worker_zone. If neither
            worker_region nor worker_zone is specified, default to the
            control plane's region.
        worker_zone (str):
            Optional. The Compute Engine zone
            (https://cloud.google.com/compute/docs/regions-zones/regions-zones)
            in which worker processing should occur, e.g. "us-west1-a".
            Mutually exclusive with worker_region. If neither
            worker_region nor worker_zone is specified, a zone in the
            control plane's region is chosen based on available
            capacity.
        shuffle_mode (google.cloud.dataflow_v1beta3.types.ShuffleMode):
            Output only. The shuffle mode used for the
            job.
        debug_options (google.cloud.dataflow_v1beta3.types.DebugOptions):
            Optional. Any debugging options to be
            supplied to the job.
        use_streaming_engine_resource_based_billing (bool):
            Output only. Whether the job uses the
            Streaming Engine resource-based billing model.
        streaming_mode (google.cloud.dataflow_v1beta3.types.StreamingMode):
            Optional. Specifies the Streaming Engine message processing
            guarantees. Reduces cost and latency but might result in
            duplicate messages committed to storage. Designed to run
            simple mapping streaming ETL jobs at the lowest cost. For
            example, Change Data Capture (CDC) to BigQuery is a
            canonical use case. For more information, see `Set the
            pipeline streaming
            mode <https://cloud.google.com/dataflow/docs/guides/streaming-modes>`__.
    """

    temp_storage_prefix: str = proto.Field(
        proto.STRING,
        number=1,
    )
    cluster_manager_api_service: str = proto.Field(
        proto.STRING,
        number=2,
    )
    experiments: MutableSequence[str] = proto.RepeatedField(
        proto.STRING,
        number=3,
    )
    service_options: MutableSequence[str] = proto.RepeatedField(
        proto.STRING,
        number=16,
    )
    service_kms_key_name: str = proto.Field(
        proto.STRING,
        number=12,
    )
    worker_pools: MutableSequence["WorkerPool"] = proto.RepeatedField(
        proto.MESSAGE,
        number=4,
        message="WorkerPool",
    )
    user_agent: struct_pb2.Struct = proto.Field(
        proto.MESSAGE,
        number=5,
        message=struct_pb2.Struct,
    )
    version: struct_pb2.Struct = proto.Field(
        proto.MESSAGE,
        number=6,
        message=struct_pb2.Struct,
    )
    dataset: str = proto.Field(
        proto.STRING,
        number=7,
    )
    sdk_pipeline_options: struct_pb2.Struct = proto.Field(
        proto.MESSAGE,
        number=8,
        message=struct_pb2.Struct,
    )
    internal_experiments: any_pb2.Any = proto.Field(
        proto.MESSAGE,
        number=9,
        message=any_pb2.Any,
    )
    service_account_email: str = proto.Field(
        proto.STRING,
        number=10,
    )
    flex_resource_scheduling_goal: "FlexResourceSchedulingGoal" = proto.Field(
        proto.ENUM,
        number=11,
        enum="FlexResourceSchedulingGoal",
    )
    worker_region: str = proto.Field(
        proto.STRING,
        number=13,
    )
    worker_zone: str = proto.Field(
        proto.STRING,
        number=14,
    )
    shuffle_mode: "ShuffleMode" = proto.Field(
        proto.ENUM,
        number=15,
        enum="ShuffleMode",
    )
    debug_options: "DebugOptions" = proto.Field(
        proto.MESSAGE,
        number=17,
        message="DebugOptions",
    )
    use_streaming_engine_resource_based_billing: bool = proto.Field(
        proto.BOOL,
        number=18,
    )
    streaming_mode: "StreamingMode" = proto.Field(
        proto.ENUM,
        number=19,
        enum="StreamingMode",
    )


class Package(proto.Message):
    r"""The packages that must be installed in order for a worker to
    run the steps of the Cloud Dataflow job that will be assigned to
    its worker pool.

    This is the mechanism by which the Cloud Dataflow SDK causes
    code to be loaded onto the workers. For example, the Cloud
    Dataflow Java SDK might use this to install jars containing the
    user's code and all of the various dependencies (libraries, data
    files, etc.) required in order for that code to run.

    Attributes:
        name (str):
            The name of the package.
        location (str):
            The resource to read the package from. The
            supported resource type is:
            Google Cloud Storage:

              storage.googleapis.com/{bucket}
              bucket.storage.googleapis.com/
    """

    name: str = proto.Field(
        proto.STRING,
        number=1,
    )
    location: str = proto.Field(
        proto.STRING,
        number=2,
    )


class Disk(proto.Message):
    r"""Describes the data disk used by a workflow job.

    Attributes:
        size_gb (int):
            Size of disk in GB.  If zero or unspecified,
            the service will attempt to choose a reasonable
            default.
        disk_type (str):
            Disk storage type, as defined by Google
            Compute Engine.  This must be a disk type
            appropriate to the project and zone in which the
            workers will run.  If unknown or unspecified,
            the service will attempt to choose a reasonable
            default.

            For example, the standard persistent disk type
            is a resource name typically ending in
            "pd-standard".  If SSD persistent disks are
            available, the resource name typically ends with
            "pd-ssd".  The actual valid values are defined
            the Google Compute Engine API, not by the Cloud
            Dataflow API; consult the Google Compute Engine
            documentation for more information about
            determining the set of available disk types for
            a particular project and zone.

            Google Compute Engine Disk types are local to a
            particular project in a particular zone, and so
            the resource name will typically look something
            like this:

            compute.googleapis.com/projects/project-id/zones/zone/diskTypes/pd-standard
        mount_point (str):
            Directory in a VM where disk is mounted.
    """

    size_gb: int = proto.Field(
        proto.INT32,
        number=1,
    )
    disk_type: str = proto.Field(
        proto.STRING,
        number=2,
    )
    mount_point: str = proto.Field(
        proto.STRING,
        number=3,
    )


class WorkerSettings(proto.Message):
    r"""Provides data to pass through to the worker harness.

    Attributes:
        base_url (str):
            The base URL for accessing Google Cloud APIs.

            When workers access Google Cloud APIs, they
            logically do so via relative URLs.  If this
            field is specified, it supplies the base URL to
            use for resolving these relative URLs.  The
            normative algorithm used is defined by RFC 1808,
            "Relative Uniform Resource Locators".

            If not specified, the default value is
            "http://www.googleapis.com/".
        reporting_enabled (bool):
            Whether to send work progress updates to the
            service.
        service_path (str):
            The Cloud Dataflow service path relative to
            the root URL, for example,
            "dataflow/v1b3/projects".
        shuffle_service_path (str):
            The Shuffle service path relative to the root
            URL, for example, "shuffle/v1beta1".
        worker_id (str):
            The ID of the worker running this pipeline.
        temp_storage_prefix (str):
            The prefix of the resources the system should
            use for temporary storage.

            The supported resource type is:

            Google Cloud Storage:

              storage.googleapis.com/{bucket}/{object}
              bucket.storage.googleapis.com/{object}
    """

    base_url: str = proto.Field(
        proto.STRING,
        number=1,
    )
    reporting_enabled: bool = proto.Field(
        proto.BOOL,
        number=2,
    )
    service_path: str = proto.Field(
        proto.STRING,
        number=3,
    )
    shuffle_service_path: str = proto.Field(
        proto.STRING,
        number=4,
    )
    worker_id: str = proto.Field(
        proto.STRING,
        number=5,
    )
    temp_storage_prefix: str = proto.Field(
        proto.STRING,
        number=6,
    )


class TaskRunnerSettings(proto.Message):
    r"""Taskrunner configuration settings.

    Attributes:
        task_user (str):
            The UNIX user ID on the worker VM to use for
            tasks launched by taskrunner; e.g. "root".
        task_group (str):
            The UNIX group ID on the worker VM to use for
            tasks launched by taskrunner; e.g. "wheel".
        oauth_scopes (MutableSequence[str]):
            The OAuth2 scopes to be requested by the
            taskrunner in order to access the Cloud Dataflow
            API.
        base_url (str):
            The base URL for the taskrunner to use when
            accessing Google Cloud APIs.
            When workers access Google Cloud APIs, they
            logically do so via relative URLs.  If this
            field is specified, it supplies the base URL to
            use for resolving these relative URLs.  The
            normative algorithm used is defined by RFC 1808,
            "Relative Uniform Resource Locators".

            If not specified, the default value is
            "http://www.googleapis.com/".
        dataflow_api_version (str):
            The API version of endpoint, e.g. "v1b3".
        parallel_worker_settings (google.cloud.dataflow_v1beta3.types.WorkerSettings):
            The settings to pass to the parallel worker
            harness.
        base_task_dir (str):
            The location on the worker for task-specific
            subdirectories.
        continue_on_exception (bool):
            Whether to continue taskrunner if an
            exception is hit.
        log_to_serialconsole (bool):
            Whether to send taskrunner log info to Google
            Compute Engine VM serial console.
        alsologtostderr (bool):
            Whether to also send taskrunner log info to
            stderr.
        log_upload_location (str):
            Indicates where to put logs.  If this is not
            specified, the logs will not be uploaded.

            The supported resource type is:

            Google Cloud Storage:

              storage.googleapis.com/{bucket}/{object}
              bucket.storage.googleapis.com/{object}
        log_dir (str):
            The directory on the VM to store logs.
        temp_storage_prefix (str):
            The prefix of the resources the taskrunner
            should use for temporary storage.

            The supported resource type is:

            Google Cloud Storage:

              storage.googleapis.com/{bucket}/{object}
              bucket.storage.googleapis.com/{object}
        harness_command (str):
            The command to launch the worker harness.
        workflow_file_name (str):
            The file to store the workflow in.
        commandlines_file_name (str):
            The file to store preprocessing commands in.
        vm_id (str):
            The ID string of the VM.
        language_hint (str):
            The suggested backend language.
        streaming_worker_main_class (str):
            The streaming worker main class name.
    """

    task_user: str = proto.Field(
        proto.STRING,
        number=1,
    )
    task_group: str = proto.Field(
        proto.STRING,
        number=2,
    )
    oauth_scopes: MutableSequence[str] = proto.RepeatedField(
        proto.STRING,
        number=3,
    )
    base_url: str = proto.Field(
        proto.STRING,
        number=4,
    )
    dataflow_api_version: str = proto.Field(
        proto.STRING,
        number=5,
    )
    parallel_worker_settings: "WorkerSettings" = proto.Field(
        proto.MESSAGE,
        number=6,
        message="WorkerSettings",
    )
    base_task_dir: str = proto.Field(
        proto.STRING,
        number=7,
    )
    continue_on_exception: bool = proto.Field(
        proto.BOOL,
        number=8,
    )
    log_to_serialconsole: bool = proto.Field(
        proto.BOOL,
        number=9,
    )
    alsologtostderr: bool = proto.Field(
        proto.BOOL,
        number=10,
    )
    log_upload_location: str = proto.Field(
        proto.STRING,
        number=11,
    )
    log_dir: str = proto.Field(
        proto.STRING,
        number=12,
    )
    temp_storage_prefix: str = proto.Field(
        proto.STRING,
        number=13,
    )
    harness_command: str = proto.Field(
        proto.STRING,
        number=14,
    )
    workflow_file_name: str = proto.Field(
        proto.STRING,
        number=15,
    )
    commandlines_file_name: str = proto.Field(
        proto.STRING,
        number=16,
    )
    vm_id: str = proto.Field(
        proto.STRING,
        number=17,
    )
    language_hint: str = proto.Field(
        proto.STRING,
        number=18,
    )
    streaming_worker_main_class: str = proto.Field(
        proto.STRING,
        number=19,
    )


class AutoscalingSettings(proto.Message):
    r"""Settings for WorkerPool autoscaling.

    Attributes:
        algorithm (google.cloud.dataflow_v1beta3.types.AutoscalingAlgorithm):
            The algorithm to use for autoscaling.
        max_num_workers (int):
            The maximum number of workers to cap scaling
            at.
    """

    algorithm: "AutoscalingAlgorithm" = proto.Field(
        proto.ENUM,
        number=1,
        enum="AutoscalingAlgorithm",
    )
    max_num_workers: int = proto.Field(
        proto.INT32,
        number=2,
    )


class SdkHarnessContainerImage(proto.Message):
    r"""Defines an SDK harness container for executing Dataflow
    pipelines.

    Attributes:
        container_image (str):
            A docker container image that resides in
            Google Container Registry.
        use_single_core_per_container (bool):
            If true, recommends the Dataflow service to
            use only one core per SDK container instance
            with this image. If false (or unset) recommends
            using more than one core per SDK container
            instance with this image for efficiency. Note
            that Dataflow service may choose to override
            this property if needed.
        environment_id (str):
            Environment ID for the Beam runner API proto
            Environment that corresponds to the current SDK
            Harness.
        capabilities (MutableSequence[str]):
            The set of capabilities enumerated in the above Environment
            proto. See also
            `beam_runner_api.proto <https://github.com/apache/beam/blob/master/model/pipeline/src/main/proto/org/apache/beam/model/pipeline/v1/beam_runner_api.proto>`__
    """

    container_image: str = proto.Field(
        proto.STRING,
        number=1,
    )
    use_single_core_per_container: bool = proto.Field(
        proto.BOOL,
        number=2,
    )
    environment_id: str = proto.Field(
        proto.STRING,
        number=3,
    )
    capabilities: MutableSequence[str] = proto.RepeatedField(
        proto.STRING,
        number=4,
    )


class WorkerPool(proto.Message):
    r"""Describes one particular pool of Cloud Dataflow workers to be
    instantiated by the Cloud Dataflow service in order to perform
    the computations required by a job.  Note that a workflow job
    may use multiple pools, in order to match the various
    computational requirements of the various stages of the job.

    Attributes:
        kind (str):
            The kind of the worker pool; currently only ``harness`` and
            ``shuffle`` are supported.
        num_workers (int):
            Number of Google Compute Engine workers in
            this pool needed to execute the job.  If zero or
            unspecified, the service will attempt to choose
            a reasonable default.
        packages (MutableSequence[google.cloud.dataflow_v1beta3.types.Package]):
            Packages to be installed on workers.
        default_package_set (google.cloud.dataflow_v1beta3.types.DefaultPackageSet):
            The default package set to install.  This
            allows the service to select a default set of
            packages which are useful to worker harnesses
            written in a particular language.
        machine_type (str):
            Machine type (e.g. "n1-standard-1").  If
            empty or unspecified, the service will attempt
            to choose a reasonable default.
        teardown_policy (google.cloud.dataflow_v1beta3.types.TeardownPolicy):
            Sets the policy for determining when to turndown worker
            pool. Allowed values are: ``TEARDOWN_ALWAYS``,
            ``TEARDOWN_ON_SUCCESS``, and ``TEARDOWN_NEVER``.
            ``TEARDOWN_ALWAYS`` means workers are always torn down
            regardless of whether the job succeeds.
            ``TEARDOWN_ON_SUCCESS`` means workers are torn down if the
            job succeeds. ``TEARDOWN_NEVER`` means the workers are never
            torn down.

            If the workers are not torn down by the service, they will
            continue to run and use Google Compute Engine VM resources
            in the user's project until they are explicitly terminated
            by the user. Because of this, Google recommends using the
            ``TEARDOWN_ALWAYS`` policy except for small, manually
            supervised test jobs.

            If unknown or unspecified, the service will attempt to
            choose a reasonable default.
        disk_size_gb (int):
            Size of root disk for VMs, in GB.  If zero or
            unspecified, the service will attempt to choose
            a reasonable default.
        disk_type (str):
            Type of root disk for VMs.  If empty or
            unspecified, the service will attempt to choose
            a reasonable default.
        disk_source_image (str):
            Fully qualified source image for disks.
        zone (str):
            Zone to run the worker pools in.  If empty or
            unspecified, the service will attempt to choose
            a reasonable default.
        taskrunner_settings (google.cloud.dataflow_v1beta3.types.TaskRunnerSettings):
            Settings passed through to Google Compute
            Engine workers when using the standard Dataflow
            task runner.  Users should ignore this field.
        on_host_maintenance (str):
            The action to take on host maintenance, as
            defined by the Google Compute Engine API.
        data_disks (MutableSequence[google.cloud.dataflow_v1beta3.types.Disk]):
            Data disks that are used by a VM in this
            workflow.
        metadata (MutableMapping[str, str]):
            Metadata to set on the Google Compute Engine
            VMs.
        autoscaling_settings (google.cloud.dataflow_v1beta3.types.AutoscalingSettings):
            Settings for autoscaling of this WorkerPool.
        pool_args (google.protobuf.any_pb2.Any):
            Extra arguments for this worker pool.
        network (str):
            Network to which VMs will be assigned.  If
            empty or unspecified, the service will use the
            network "default".
        subnetwork (str):
            Subnetwork to which VMs will be assigned, if
            desired.  Expected to be of the form
            "regions/REGION/subnetworks/SUBNETWORK".
        worker_harness_container_image (str):
            Required. Docker container image that executes the Cloud
            Dataflow worker harness, residing in Google Container
            Registry.

            Deprecated for the Fn API path. Use
            sdk_harness_container_images instead.
        num_threads_per_worker (int):
            The number of threads per worker harness. If
            empty or unspecified, the service will choose a
            number of threads (according to the number of
            cores on the selected machine type for batch, or
            1 by convention for streaming).
        ip_configuration (google.cloud.dataflow_v1beta3.types.WorkerIPAddressConfiguration):
            Configuration for VM IPs.
        sdk_harness_container_images (MutableSequence[google.cloud.dataflow_v1beta3.types.SdkHarnessContainerImage]):
            Set of SDK harness containers needed to
            execute this pipeline. This will only be set in
            the Fn API path. For non-cross-language
            pipelines this should have only one entry.
            Cross-language pipelines will have two or more
            entries.
    """

    kind: str = proto.Field(
        proto.STRING,
        number=1,
    )
    num_workers: int = proto.Field(
        proto.INT32,
        number=2,
    )
    packages: MutableSequence["Package"] = proto.RepeatedField(
        proto.MESSAGE,
        number=3,
        message="Package",
    )
    default_package_set: "DefaultPackageSet" = proto.Field(
        proto.ENUM,
        number=4,
        enum="DefaultPackageSet",
    )
    machine_type: str = proto.Field(
        proto.STRING,
        number=5,
    )
    teardown_policy: "TeardownPolicy" = proto.Field(
        proto.ENUM,
        number=6,
        enum="TeardownPolicy",
    )
    disk_size_gb: int = proto.Field(
        proto.INT32,
        number=7,
    )
    disk_type: str = proto.Field(
        proto.STRING,
        number=16,
    )
    disk_source_image: str = proto.Field(
        proto.STRING,
        number=8,
    )
    zone: str = proto.Field(
        proto.STRING,
        number=9,
    )
    taskrunner_settings: "TaskRunnerSettings" = proto.Field(
        proto.MESSAGE,
        number=10,
        message="TaskRunnerSettings",
    )
    on_host_maintenance: str = proto.Field(
        proto.STRING,
        number=11,
    )
    data_disks: MutableSequence["Disk"] = proto.RepeatedField(
        proto.MESSAGE,
        number=12,
        message="Disk",
    )
    metadata: MutableMapping[str, str] = proto.MapField(
        proto.STRING,
        proto.STRING,
        number=13,
    )
    autoscaling_settings: "AutoscalingSettings" = proto.Field(
        proto.MESSAGE,
        number=14,
        message="AutoscalingSettings",
    )
    pool_args: any_pb2.Any = proto.Field(
        proto.MESSAGE,
        number=15,
        message=any_pb2.Any,
    )
    network: str = proto.Field(
        proto.STRING,
        number=17,
    )
    subnetwork: str = proto.Field(
        proto.STRING,
        number=19,
    )
    worker_harness_container_image: str = proto.Field(
        proto.STRING,
        number=18,
    )
    num_threads_per_worker: int = proto.Field(
        proto.INT32,
        number=20,
    )
    ip_configuration: "WorkerIPAddressConfiguration" = proto.Field(
        proto.ENUM,
        number=21,
        enum="WorkerIPAddressConfiguration",
    )
    sdk_harness_container_images: MutableSequence[
        "SdkHarnessContainerImage"
    ] = proto.RepeatedField(
        proto.MESSAGE,
        number=22,
        message="SdkHarnessContainerImage",
    )


class DataSamplingConfig(proto.Message):
    r"""Configuration options for sampling elements.

    Attributes:
        behaviors (MutableSequence[google.cloud.dataflow_v1beta3.types.DataSamplingConfig.DataSamplingBehavior]):
            List of given sampling behaviors to enable. For example,
            specifying behaviors = [ALWAYS_ON] samples in-flight
            elements but does not sample exceptions. Can be used to
            specify multiple behaviors like, behaviors = [ALWAYS_ON,
            EXCEPTIONS] for specifying periodic sampling and exception
            sampling.

            If DISABLED is in the list, then sampling will be disabled
            and ignore the other given behaviors.

            Ordering does not matter.
    """

    class DataSamplingBehavior(proto.Enum):
        r"""The following enum defines what to sample for a running job.

        Values:
            DATA_SAMPLING_BEHAVIOR_UNSPECIFIED (0):
                If given, has no effect on sampling behavior.
                Used as an unknown or unset sentinel value.
            DISABLED (1):
                When given, disables element sampling. Has
                same behavior as not setting the behavior.
            ALWAYS_ON (2):
                When given, enables sampling in-flight from
                all PCollections.
            EXCEPTIONS (3):
                When given, enables sampling input elements
                when a user-defined DoFn causes an exception.
        """
        DATA_SAMPLING_BEHAVIOR_UNSPECIFIED = 0
        DISABLED = 1
        ALWAYS_ON = 2
        EXCEPTIONS = 3

    behaviors: MutableSequence[DataSamplingBehavior] = proto.RepeatedField(
        proto.ENUM,
        number=1,
        enum=DataSamplingBehavior,
    )


class DebugOptions(proto.Message):
    r"""Describes any options that have an effect on the debugging of
    pipelines.

    Attributes:
        enable_hot_key_logging (bool):
            Optional. When true, enables the logging of
            the literal hot key to the user's Cloud Logging.
        data_sampling (google.cloud.dataflow_v1beta3.types.DataSamplingConfig):
            Configuration options for sampling elements
            from a running pipeline.
    """

    enable_hot_key_logging: bool = proto.Field(
        proto.BOOL,
        number=1,
    )
    data_sampling: "DataSamplingConfig" = proto.Field(
        proto.MESSAGE,
        number=2,
        message="DataSamplingConfig",
    )


__all__ = tuple(sorted(__protobuf__.manifest))
