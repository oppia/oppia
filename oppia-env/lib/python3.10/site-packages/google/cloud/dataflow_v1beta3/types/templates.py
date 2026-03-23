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

from google.rpc import status_pb2  # type: ignore
import proto  # type: ignore

from google.cloud.dataflow_v1beta3.types import environment as gd_environment
from google.cloud.dataflow_v1beta3.types import jobs

__protobuf__ = proto.module(
    package="google.dataflow.v1beta3",
    manifest={
        "ParameterType",
        "LaunchFlexTemplateResponse",
        "ContainerSpec",
        "LaunchFlexTemplateParameter",
        "FlexTemplateRuntimeEnvironment",
        "LaunchFlexTemplateRequest",
        "RuntimeEnvironment",
        "ParameterMetadataEnumOption",
        "ParameterMetadata",
        "TemplateMetadata",
        "SDKInfo",
        "RuntimeMetadata",
        "CreateJobFromTemplateRequest",
        "GetTemplateRequest",
        "GetTemplateResponse",
        "LaunchTemplateParameters",
        "LaunchTemplateRequest",
        "LaunchTemplateResponse",
        "InvalidTemplateParameters",
        "DynamicTemplateLaunchParams",
    },
)


class ParameterType(proto.Enum):
    r"""ParameterType specifies what kind of input we need for this
    parameter.

    Values:
        DEFAULT (0):
            Default input type.
        TEXT (1):
            The parameter specifies generic text input.
        GCS_READ_BUCKET (2):
            The parameter specifies a Cloud Storage
            Bucket to read from.
        GCS_WRITE_BUCKET (3):
            The parameter specifies a Cloud Storage
            Bucket to write to.
        GCS_READ_FILE (4):
            The parameter specifies a Cloud Storage file
            path to read from.
        GCS_WRITE_FILE (5):
            The parameter specifies a Cloud Storage file
            path to write to.
        GCS_READ_FOLDER (6):
            The parameter specifies a Cloud Storage
            folder path to read from.
        GCS_WRITE_FOLDER (7):
            The parameter specifies a Cloud Storage
            folder to write to.
        PUBSUB_TOPIC (8):
            The parameter specifies a Pub/Sub Topic.
        PUBSUB_SUBSCRIPTION (9):
            The parameter specifies a Pub/Sub
            Subscription.
        BIGQUERY_TABLE (10):
            The parameter specifies a BigQuery table.
        JAVASCRIPT_UDF_FILE (11):
            The parameter specifies a JavaScript UDF in
            Cloud Storage.
        SERVICE_ACCOUNT (12):
            The parameter specifies a Service Account
            email.
        MACHINE_TYPE (13):
            The parameter specifies a Machine Type.
        KMS_KEY_NAME (14):
            The parameter specifies a KMS Key name.
        WORKER_REGION (15):
            The parameter specifies a Worker Region.
        WORKER_ZONE (16):
            The parameter specifies a Worker Zone.
        BOOLEAN (17):
            The parameter specifies a boolean input.
        ENUM (18):
            The parameter specifies an enum input.
        NUMBER (19):
            The parameter specifies a number input.
        KAFKA_TOPIC (20):
            Deprecated. Please use KAFKA_READ_TOPIC instead.
        KAFKA_READ_TOPIC (21):
            The parameter specifies the fully-qualified
            name of an Apache Kafka topic. This can be
            either a Google Managed Kafka topic or a
            non-managed Kafka topic.
        KAFKA_WRITE_TOPIC (22):
            The parameter specifies the fully-qualified
            name of an Apache Kafka topic. This can be an
            existing Google Managed Kafka topic, the name
            for a new Google Managed Kafka topic, or an
            existing non-managed Kafka topic.
    """
    DEFAULT = 0
    TEXT = 1
    GCS_READ_BUCKET = 2
    GCS_WRITE_BUCKET = 3
    GCS_READ_FILE = 4
    GCS_WRITE_FILE = 5
    GCS_READ_FOLDER = 6
    GCS_WRITE_FOLDER = 7
    PUBSUB_TOPIC = 8
    PUBSUB_SUBSCRIPTION = 9
    BIGQUERY_TABLE = 10
    JAVASCRIPT_UDF_FILE = 11
    SERVICE_ACCOUNT = 12
    MACHINE_TYPE = 13
    KMS_KEY_NAME = 14
    WORKER_REGION = 15
    WORKER_ZONE = 16
    BOOLEAN = 17
    ENUM = 18
    NUMBER = 19
    KAFKA_TOPIC = 20
    KAFKA_READ_TOPIC = 21
    KAFKA_WRITE_TOPIC = 22


class LaunchFlexTemplateResponse(proto.Message):
    r"""Response to the request to launch a job from Flex Template.

    Attributes:
        job (google.cloud.dataflow_v1beta3.types.Job):
            The job that was launched, if the request was
            not a dry run and the job was successfully
            launched.
    """

    job: jobs.Job = proto.Field(
        proto.MESSAGE,
        number=1,
        message=jobs.Job,
    )


class ContainerSpec(proto.Message):
    r"""Container Spec.

    Attributes:
        image (str):
            Name of the docker container image. E.g.,
            gcr.io/project/some-image
        metadata (google.cloud.dataflow_v1beta3.types.TemplateMetadata):
            Metadata describing a template including
            description and validation rules.
        sdk_info (google.cloud.dataflow_v1beta3.types.SDKInfo):
            Required. SDK info of the Flex Template.
        default_environment (google.cloud.dataflow_v1beta3.types.FlexTemplateRuntimeEnvironment):
            Default runtime environment for the job.
        image_repository_username_secret_id (str):
            Secret Manager secret id for username to
            authenticate to private registry.
        image_repository_password_secret_id (str):
            Secret Manager secret id for password to
            authenticate to private registry.
        image_repository_cert_path (str):
            Cloud Storage path to self-signed certificate
            of private registry.
    """

    image: str = proto.Field(
        proto.STRING,
        number=1,
    )
    metadata: "TemplateMetadata" = proto.Field(
        proto.MESSAGE,
        number=2,
        message="TemplateMetadata",
    )
    sdk_info: "SDKInfo" = proto.Field(
        proto.MESSAGE,
        number=3,
        message="SDKInfo",
    )
    default_environment: "FlexTemplateRuntimeEnvironment" = proto.Field(
        proto.MESSAGE,
        number=4,
        message="FlexTemplateRuntimeEnvironment",
    )
    image_repository_username_secret_id: str = proto.Field(
        proto.STRING,
        number=5,
    )
    image_repository_password_secret_id: str = proto.Field(
        proto.STRING,
        number=6,
    )
    image_repository_cert_path: str = proto.Field(
        proto.STRING,
        number=7,
    )


class LaunchFlexTemplateParameter(proto.Message):
    r"""Launch FlexTemplate Parameter.

    This message has `oneof`_ fields (mutually exclusive fields).
    For each oneof, at most one member field can be set at the same time.
    Setting any member of the oneof automatically clears all other
    members.

    .. _oneof: https://proto-plus-python.readthedocs.io/en/stable/fields.html#oneofs-mutually-exclusive-fields

    Attributes:
        job_name (str):
            Required. The job name to use for the created
            job. For update job request, job name should be
            same as the existing running job.
        container_spec (google.cloud.dataflow_v1beta3.types.ContainerSpec):
            Spec about the container image to launch.

            This field is a member of `oneof`_ ``template``.
        container_spec_gcs_path (str):
            Cloud Storage path to a file with json
            serialized ContainerSpec as content.

            This field is a member of `oneof`_ ``template``.
        parameters (MutableMapping[str, str]):
            The parameters for FlexTemplate. Ex. {"num_workers":"5"}
        launch_options (MutableMapping[str, str]):
            Launch options for this flex template job.
            This is a common set of options across languages
            and templates. This should not be used to pass
            job parameters.
        environment (google.cloud.dataflow_v1beta3.types.FlexTemplateRuntimeEnvironment):
            The runtime environment for the FlexTemplate
            job
        update (bool):
            Set this to true if you are sending a request
            to update a running streaming job. When set, the
            job name should be the same as the running job.
        transform_name_mappings (MutableMapping[str, str]):
            Use this to pass transform_name_mappings for streaming
            update jobs. Ex:{"oldTransformName":"newTransformName",...}'
    """

    job_name: str = proto.Field(
        proto.STRING,
        number=1,
    )
    container_spec: "ContainerSpec" = proto.Field(
        proto.MESSAGE,
        number=4,
        oneof="template",
        message="ContainerSpec",
    )
    container_spec_gcs_path: str = proto.Field(
        proto.STRING,
        number=5,
        oneof="template",
    )
    parameters: MutableMapping[str, str] = proto.MapField(
        proto.STRING,
        proto.STRING,
        number=2,
    )
    launch_options: MutableMapping[str, str] = proto.MapField(
        proto.STRING,
        proto.STRING,
        number=6,
    )
    environment: "FlexTemplateRuntimeEnvironment" = proto.Field(
        proto.MESSAGE,
        number=7,
        message="FlexTemplateRuntimeEnvironment",
    )
    update: bool = proto.Field(
        proto.BOOL,
        number=8,
    )
    transform_name_mappings: MutableMapping[str, str] = proto.MapField(
        proto.STRING,
        proto.STRING,
        number=9,
    )


class FlexTemplateRuntimeEnvironment(proto.Message):
    r"""The environment values to be set at runtime for flex
    template.


    .. _oneof: https://proto-plus-python.readthedocs.io/en/stable/fields.html#oneofs-mutually-exclusive-fields

    Attributes:
        num_workers (int):
            The initial number of Google Compute Engine
            instances for the job.
        max_workers (int):
            The maximum number of Google Compute Engine
            instances to be made available to your pipeline
            during execution, from 1 to 1000.
        zone (str):
            The Compute Engine `availability
            zone <https://cloud.google.com/compute/docs/regions-zones/regions-zones>`__
            for launching worker instances to run your pipeline. In the
            future, worker_zone will take precedence.
        service_account_email (str):
            The email address of the service account to
            run the job as.
        temp_location (str):
            The Cloud Storage path to use for temporary files. Must be a
            valid Cloud Storage URL, beginning with ``gs://``.
        machine_type (str):
            The machine type to use for the job. Defaults
            to the value from the template if not specified.
        additional_experiments (MutableSequence[str]):
            Additional experiment flags for the job.
        network (str):
            Network to which VMs will be assigned.  If
            empty or unspecified, the service will use the
            network "default".
        subnetwork (str):
            Subnetwork to which VMs will be assigned, if desired. You
            can specify a subnetwork using either a complete URL or an
            abbreviated path. Expected to be of the form
            "https://www.googleapis.com/compute/v1/projects/HOST_PROJECT_ID/regions/REGION/subnetworks/SUBNETWORK"
            or "regions/REGION/subnetworks/SUBNETWORK". If the
            subnetwork is located in a Shared VPC network, you must use
            the complete URL.
        additional_user_labels (MutableMapping[str, str]):
            Additional user labels to be specified for the job. Keys and
            values must follow the restrictions specified in the
            `labeling
            restrictions <https://cloud.google.com/compute/docs/labeling-resources#restrictions>`__
            page. An object containing a list of "key": value pairs.
            Example: { "name": "wrench", "mass": "1kg", "count": "3" }.
        kms_key_name (str):
            Name for the Cloud KMS key for the job.
            Key format is:

            projects/<project>/locations/<location>/keyRings/<keyring>/cryptoKeys/<key>
        ip_configuration (google.cloud.dataflow_v1beta3.types.WorkerIPAddressConfiguration):
            Configuration for VM IPs.
        worker_region (str):
            The Compute Engine region
            (https://cloud.google.com/compute/docs/regions-zones/regions-zones)
            in which worker processing should occur, e.g. "us-west1".
            Mutually exclusive with worker_zone. If neither
            worker_region nor worker_zone is specified, default to the
            control plane's region.
        worker_zone (str):
            The Compute Engine zone
            (https://cloud.google.com/compute/docs/regions-zones/regions-zones)
            in which worker processing should occur, e.g. "us-west1-a".
            Mutually exclusive with worker_region. If neither
            worker_region nor worker_zone is specified, a zone in the
            control plane's region is chosen based on available
            capacity. If both ``worker_zone`` and ``zone`` are set,
            ``worker_zone`` takes precedence.
        enable_streaming_engine (bool):
            Whether to enable Streaming Engine for the
            job.
        flexrs_goal (google.cloud.dataflow_v1beta3.types.FlexResourceSchedulingGoal):
            Set FlexRS goal for the job.
            https://cloud.google.com/dataflow/docs/guides/flexrs
        staging_location (str):
            The Cloud Storage path for staging local files. Must be a
            valid Cloud Storage URL, beginning with ``gs://``.
        sdk_container_image (str):
            Docker registry location of container image
            to use for the 'worker harness. Default is the
            container for the version of the SDK. Note this
            field is only valid for portable pipelines.
        disk_size_gb (int):
            Worker disk size, in gigabytes.
        autoscaling_algorithm (google.cloud.dataflow_v1beta3.types.AutoscalingAlgorithm):
            The algorithm to use for autoscaling
        dump_heap_on_oom (bool):
            If true, when processing time is spent almost
            entirely on garbage collection (GC), saves a
            heap dump before ending the thread or process.
            If false, ends the thread or process without
            saving a heap dump. Does not save a heap dump
            when the Java Virtual Machine (JVM) has an out
            of memory error during processing. The location
            of the heap file is either echoed back to the
            user, or the user is given the opportunity to
            download the heap file.
        save_heap_dumps_to_gcs_path (str):
            Cloud Storage bucket (directory) to upload heap dumps to.
            Enabling this field implies that ``dump_heap_on_oom`` is set
            to true.
        launcher_machine_type (str):
            The machine type to use for launching the
            job. The default is n1-standard-1.
        enable_launcher_vm_serial_port_logging (bool):
            If true serial port logging will be enabled
            for the launcher VM.
        streaming_mode (google.cloud.dataflow_v1beta3.types.StreamingMode):
            Optional. Specifies the Streaming Engine message processing
            guarantees. Reduces cost and latency but might result in
            duplicate messages committed to storage. Designed to run
            simple mapping streaming ETL jobs at the lowest cost. For
            example, Change Data Capture (CDC) to BigQuery is a
            canonical use case. For more information, see `Set the
            pipeline streaming
            mode <https://cloud.google.com/dataflow/docs/guides/streaming-modes>`__.

            This field is a member of `oneof`_ ``_streaming_mode``.
    """

    num_workers: int = proto.Field(
        proto.INT32,
        number=1,
    )
    max_workers: int = proto.Field(
        proto.INT32,
        number=2,
    )
    zone: str = proto.Field(
        proto.STRING,
        number=3,
    )
    service_account_email: str = proto.Field(
        proto.STRING,
        number=4,
    )
    temp_location: str = proto.Field(
        proto.STRING,
        number=5,
    )
    machine_type: str = proto.Field(
        proto.STRING,
        number=6,
    )
    additional_experiments: MutableSequence[str] = proto.RepeatedField(
        proto.STRING,
        number=7,
    )
    network: str = proto.Field(
        proto.STRING,
        number=8,
    )
    subnetwork: str = proto.Field(
        proto.STRING,
        number=9,
    )
    additional_user_labels: MutableMapping[str, str] = proto.MapField(
        proto.STRING,
        proto.STRING,
        number=10,
    )
    kms_key_name: str = proto.Field(
        proto.STRING,
        number=11,
    )
    ip_configuration: gd_environment.WorkerIPAddressConfiguration = proto.Field(
        proto.ENUM,
        number=12,
        enum=gd_environment.WorkerIPAddressConfiguration,
    )
    worker_region: str = proto.Field(
        proto.STRING,
        number=13,
    )
    worker_zone: str = proto.Field(
        proto.STRING,
        number=14,
    )
    enable_streaming_engine: bool = proto.Field(
        proto.BOOL,
        number=15,
    )
    flexrs_goal: gd_environment.FlexResourceSchedulingGoal = proto.Field(
        proto.ENUM,
        number=16,
        enum=gd_environment.FlexResourceSchedulingGoal,
    )
    staging_location: str = proto.Field(
        proto.STRING,
        number=17,
    )
    sdk_container_image: str = proto.Field(
        proto.STRING,
        number=18,
    )
    disk_size_gb: int = proto.Field(
        proto.INT32,
        number=20,
    )
    autoscaling_algorithm: gd_environment.AutoscalingAlgorithm = proto.Field(
        proto.ENUM,
        number=21,
        enum=gd_environment.AutoscalingAlgorithm,
    )
    dump_heap_on_oom: bool = proto.Field(
        proto.BOOL,
        number=22,
    )
    save_heap_dumps_to_gcs_path: str = proto.Field(
        proto.STRING,
        number=23,
    )
    launcher_machine_type: str = proto.Field(
        proto.STRING,
        number=24,
    )
    enable_launcher_vm_serial_port_logging: bool = proto.Field(
        proto.BOOL,
        number=25,
    )
    streaming_mode: gd_environment.StreamingMode = proto.Field(
        proto.ENUM,
        number=26,
        optional=True,
        enum=gd_environment.StreamingMode,
    )


class LaunchFlexTemplateRequest(proto.Message):
    r"""A request to launch a Cloud Dataflow job from a FlexTemplate.

    Attributes:
        project_id (str):
            Required. The ID of the Cloud Platform
            project that the job belongs to.
        launch_parameter (google.cloud.dataflow_v1beta3.types.LaunchFlexTemplateParameter):
            Required. Parameter to launch a job form Flex
            Template.
        location (str):
            Required. The [regional endpoint]
            (https://cloud.google.com/dataflow/docs/concepts/regional-endpoints)
            to which to direct the request. E.g., us-central1, us-west1.
        validate_only (bool):
            If true, the request is validated but not
            actually executed. Defaults to false.
    """

    project_id: str = proto.Field(
        proto.STRING,
        number=1,
    )
    launch_parameter: "LaunchFlexTemplateParameter" = proto.Field(
        proto.MESSAGE,
        number=2,
        message="LaunchFlexTemplateParameter",
    )
    location: str = proto.Field(
        proto.STRING,
        number=3,
    )
    validate_only: bool = proto.Field(
        proto.BOOL,
        number=4,
    )


class RuntimeEnvironment(proto.Message):
    r"""The environment values to set at runtime.

    .. _oneof: https://proto-plus-python.readthedocs.io/en/stable/fields.html#oneofs-mutually-exclusive-fields

    Attributes:
        num_workers (int):
            Optional. The initial number of Google
            Compute Engine instances for the job. The
            default value is 11.
        max_workers (int):
            Optional. The maximum number of Google
            Compute Engine instances to be made available to
            your pipeline during execution, from 1 to 1000.
            The default value is 1.
        zone (str):
            Optional. The Compute Engine `availability
            zone <https://cloud.google.com/compute/docs/regions-zones/regions-zones>`__
            for launching worker instances to run your pipeline. In the
            future, worker_zone will take precedence.
        service_account_email (str):
            Optional. The email address of the service
            account to run the job as.
        temp_location (str):
            Required. The Cloud Storage path to use for temporary files.
            Must be a valid Cloud Storage URL, beginning with ``gs://``.
        bypass_temp_dir_validation (bool):
            Optional. Whether to bypass the safety checks
            for the job's temporary directory. Use with
            caution.
        machine_type (str):
            Optional. The machine type to use for the
            job. Defaults to the value from the template if
            not specified.
        additional_experiments (MutableSequence[str]):
            Optional. Additional experiment flags for the job, specified
            with the ``--experiments`` option.
        network (str):
            Optional. Network to which VMs will be
            assigned.  If empty or unspecified, the service
            will use the network "default".
        subnetwork (str):
            Optional. Subnetwork to which VMs will be assigned, if
            desired. You can specify a subnetwork using either a
            complete URL or an abbreviated path. Expected to be of the
            form
            "https://www.googleapis.com/compute/v1/projects/HOST_PROJECT_ID/regions/REGION/subnetworks/SUBNETWORK"
            or "regions/REGION/subnetworks/SUBNETWORK". If the
            subnetwork is located in a Shared VPC network, you must use
            the complete URL.
        additional_user_labels (MutableMapping[str, str]):
            Optional. Additional user labels to be specified for the
            job. Keys and values should follow the restrictions
            specified in the `labeling
            restrictions <https://cloud.google.com/compute/docs/labeling-resources#restrictions>`__
            page. An object containing a list of "key": value pairs.
            Example: { "name": "wrench", "mass": "1kg", "count": "3" }.
        kms_key_name (str):
            Optional. Name for the Cloud KMS key for the
            job. Key format is:

            projects/<project>/locations/<location>/keyRings/<keyring>/cryptoKeys/<key>
        ip_configuration (google.cloud.dataflow_v1beta3.types.WorkerIPAddressConfiguration):
            Optional. Configuration for VM IPs.
        worker_region (str):
            Required. The Compute Engine region
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
            capacity. If both ``worker_zone`` and ``zone`` are set,
            ``worker_zone`` takes precedence.
        enable_streaming_engine (bool):
            Optional. Whether to enable Streaming Engine
            for the job.
        disk_size_gb (int):
            Optional. The disk size, in gigabytes, to use
            on each remote Compute Engine worker instance.
        streaming_mode (google.cloud.dataflow_v1beta3.types.StreamingMode):
            Optional. Specifies the Streaming Engine message processing
            guarantees. Reduces cost and latency but might result in
            duplicate messages committed to storage. Designed to run
            simple mapping streaming ETL jobs at the lowest cost. For
            example, Change Data Capture (CDC) to BigQuery is a
            canonical use case. For more information, see `Set the
            pipeline streaming
            mode <https://cloud.google.com/dataflow/docs/guides/streaming-modes>`__.

            This field is a member of `oneof`_ ``_streaming_mode``.
    """

    num_workers: int = proto.Field(
        proto.INT32,
        number=11,
    )
    max_workers: int = proto.Field(
        proto.INT32,
        number=1,
    )
    zone: str = proto.Field(
        proto.STRING,
        number=2,
    )
    service_account_email: str = proto.Field(
        proto.STRING,
        number=3,
    )
    temp_location: str = proto.Field(
        proto.STRING,
        number=4,
    )
    bypass_temp_dir_validation: bool = proto.Field(
        proto.BOOL,
        number=5,
    )
    machine_type: str = proto.Field(
        proto.STRING,
        number=6,
    )
    additional_experiments: MutableSequence[str] = proto.RepeatedField(
        proto.STRING,
        number=7,
    )
    network: str = proto.Field(
        proto.STRING,
        number=8,
    )
    subnetwork: str = proto.Field(
        proto.STRING,
        number=9,
    )
    additional_user_labels: MutableMapping[str, str] = proto.MapField(
        proto.STRING,
        proto.STRING,
        number=10,
    )
    kms_key_name: str = proto.Field(
        proto.STRING,
        number=12,
    )
    ip_configuration: gd_environment.WorkerIPAddressConfiguration = proto.Field(
        proto.ENUM,
        number=14,
        enum=gd_environment.WorkerIPAddressConfiguration,
    )
    worker_region: str = proto.Field(
        proto.STRING,
        number=15,
    )
    worker_zone: str = proto.Field(
        proto.STRING,
        number=16,
    )
    enable_streaming_engine: bool = proto.Field(
        proto.BOOL,
        number=17,
    )
    disk_size_gb: int = proto.Field(
        proto.INT32,
        number=18,
    )
    streaming_mode: gd_environment.StreamingMode = proto.Field(
        proto.ENUM,
        number=19,
        optional=True,
        enum=gd_environment.StreamingMode,
    )


class ParameterMetadataEnumOption(proto.Message):
    r"""ParameterMetadataEnumOption specifies the option shown in the
    enum form.

    Attributes:
        value (str):
            Required. The value of the enum option.
        label (str):
            Optional. The label to display for the enum
            option.
        description (str):
            Optional. The description to display for the
            enum option.
    """

    value: str = proto.Field(
        proto.STRING,
        number=1,
    )
    label: str = proto.Field(
        proto.STRING,
        number=2,
    )
    description: str = proto.Field(
        proto.STRING,
        number=3,
    )


class ParameterMetadata(proto.Message):
    r"""Metadata for a specific parameter.

    Attributes:
        name (str):
            Required. The name of the parameter.
        label (str):
            Required. The label to display for the
            parameter.
        help_text (str):
            Required. The help text to display for the
            parameter.
        is_optional (bool):
            Optional. Whether the parameter is optional.
            Defaults to false.
        regexes (MutableSequence[str]):
            Optional. Regexes that the parameter must
            match.
        param_type (google.cloud.dataflow_v1beta3.types.ParameterType):
            Optional. The type of the parameter.
            Used for selecting input picker.
        custom_metadata (MutableMapping[str, str]):
            Optional. Additional metadata for describing
            this parameter.
        group_name (str):
            Optional. Specifies a group name for this parameter to be
            rendered under. Group header text will be rendered exactly
            as specified in this field. Only considered when parent_name
            is NOT provided.
        parent_name (str):
            Optional. Specifies the name of the parent parameter. Used
            in conjunction with 'parent_trigger_values' to make this
            parameter conditional (will only be rendered conditionally).
            Should be mappable to a ParameterMetadata.name field.
        parent_trigger_values (MutableSequence[str]):
            Optional. The value(s) of the 'parent_name' parameter which
            will trigger this parameter to be shown. If left empty, ANY
            non-empty value in parent_name will trigger this parameter
            to be shown. Only considered when this parameter is
            conditional (when 'parent_name' has been provided).
        enum_options (MutableSequence[google.cloud.dataflow_v1beta3.types.ParameterMetadataEnumOption]):
            Optional. The options shown when ENUM
            ParameterType is specified.
        default_value (str):
            Optional. The default values will pre-populate the parameter
            with the given value from the proto. If default_value is
            left empty, the parameter will be populated with a default
            of the relevant type, e.g. false for a boolean.
        hidden_ui (bool):
            Optional. Whether the parameter should be
            hidden in the UI.
    """

    name: str = proto.Field(
        proto.STRING,
        number=1,
    )
    label: str = proto.Field(
        proto.STRING,
        number=2,
    )
    help_text: str = proto.Field(
        proto.STRING,
        number=3,
    )
    is_optional: bool = proto.Field(
        proto.BOOL,
        number=4,
    )
    regexes: MutableSequence[str] = proto.RepeatedField(
        proto.STRING,
        number=5,
    )
    param_type: "ParameterType" = proto.Field(
        proto.ENUM,
        number=6,
        enum="ParameterType",
    )
    custom_metadata: MutableMapping[str, str] = proto.MapField(
        proto.STRING,
        proto.STRING,
        number=7,
    )
    group_name: str = proto.Field(
        proto.STRING,
        number=8,
    )
    parent_name: str = proto.Field(
        proto.STRING,
        number=9,
    )
    parent_trigger_values: MutableSequence[str] = proto.RepeatedField(
        proto.STRING,
        number=10,
    )
    enum_options: MutableSequence["ParameterMetadataEnumOption"] = proto.RepeatedField(
        proto.MESSAGE,
        number=11,
        message="ParameterMetadataEnumOption",
    )
    default_value: str = proto.Field(
        proto.STRING,
        number=12,
    )
    hidden_ui: bool = proto.Field(
        proto.BOOL,
        number=13,
    )


class TemplateMetadata(proto.Message):
    r"""Metadata describing a template.

    Attributes:
        name (str):
            Required. The name of the template.
        description (str):
            Optional. A description of the template.
        parameters (MutableSequence[google.cloud.dataflow_v1beta3.types.ParameterMetadata]):
            The parameters for the template.
        streaming (bool):
            Optional. Indicates if the template is
            streaming or not.
        supports_at_least_once (bool):
            Optional. Indicates if the streaming template
            supports at least once mode.
        supports_exactly_once (bool):
            Optional. Indicates if the streaming template
            supports exactly once mode.
        default_streaming_mode (str):
            Optional. Indicates the default streaming mode for a
            streaming template. Only valid if both
            supports_at_least_once and supports_exactly_once are true.
            Possible values: UNSPECIFIED, EXACTLY_ONCE and AT_LEAST_ONCE
    """

    name: str = proto.Field(
        proto.STRING,
        number=1,
    )
    description: str = proto.Field(
        proto.STRING,
        number=2,
    )
    parameters: MutableSequence["ParameterMetadata"] = proto.RepeatedField(
        proto.MESSAGE,
        number=3,
        message="ParameterMetadata",
    )
    streaming: bool = proto.Field(
        proto.BOOL,
        number=5,
    )
    supports_at_least_once: bool = proto.Field(
        proto.BOOL,
        number=6,
    )
    supports_exactly_once: bool = proto.Field(
        proto.BOOL,
        number=7,
    )
    default_streaming_mode: str = proto.Field(
        proto.STRING,
        number=8,
    )


class SDKInfo(proto.Message):
    r"""SDK Information.

    Attributes:
        language (google.cloud.dataflow_v1beta3.types.SDKInfo.Language):
            Required. The SDK Language.
        version (str):
            Optional. The SDK version.
    """

    class Language(proto.Enum):
        r"""SDK Language.

        Values:
            UNKNOWN (0):
                UNKNOWN Language.
            JAVA (1):
                Java.
            PYTHON (2):
                Python.
            GO (3):
                Go.
        """
        UNKNOWN = 0
        JAVA = 1
        PYTHON = 2
        GO = 3

    language: Language = proto.Field(
        proto.ENUM,
        number=1,
        enum=Language,
    )
    version: str = proto.Field(
        proto.STRING,
        number=2,
    )


class RuntimeMetadata(proto.Message):
    r"""RuntimeMetadata describing a runtime environment.

    Attributes:
        sdk_info (google.cloud.dataflow_v1beta3.types.SDKInfo):
            SDK Info for the template.
        parameters (MutableSequence[google.cloud.dataflow_v1beta3.types.ParameterMetadata]):
            The parameters for the template.
    """

    sdk_info: "SDKInfo" = proto.Field(
        proto.MESSAGE,
        number=1,
        message="SDKInfo",
    )
    parameters: MutableSequence["ParameterMetadata"] = proto.RepeatedField(
        proto.MESSAGE,
        number=2,
        message="ParameterMetadata",
    )


class CreateJobFromTemplateRequest(proto.Message):
    r"""A request to create a Cloud Dataflow job from a template.

    .. _oneof: https://proto-plus-python.readthedocs.io/en/stable/fields.html#oneofs-mutually-exclusive-fields

    Attributes:
        project_id (str):
            Required. The ID of the Cloud Platform
            project that the job belongs to.
        job_name (str):
            Required. The job name to use for the created
            job.
        gcs_path (str):
            Required. A Cloud Storage path to the template from which to
            create the job. Must be a valid Cloud Storage URL, beginning
            with ``gs://``.

            This field is a member of `oneof`_ ``template``.
        parameters (MutableMapping[str, str]):
            The runtime parameters to pass to the job.
        environment (google.cloud.dataflow_v1beta3.types.RuntimeEnvironment):
            The runtime environment for the job.
        location (str):
            The [regional endpoint]
            (https://cloud.google.com/dataflow/docs/concepts/regional-endpoints)
            to which to direct the request.
    """

    project_id: str = proto.Field(
        proto.STRING,
        number=1,
    )
    job_name: str = proto.Field(
        proto.STRING,
        number=4,
    )
    gcs_path: str = proto.Field(
        proto.STRING,
        number=2,
        oneof="template",
    )
    parameters: MutableMapping[str, str] = proto.MapField(
        proto.STRING,
        proto.STRING,
        number=3,
    )
    environment: "RuntimeEnvironment" = proto.Field(
        proto.MESSAGE,
        number=5,
        message="RuntimeEnvironment",
    )
    location: str = proto.Field(
        proto.STRING,
        number=6,
    )


class GetTemplateRequest(proto.Message):
    r"""A request to retrieve a Cloud Dataflow job template.

    .. _oneof: https://proto-plus-python.readthedocs.io/en/stable/fields.html#oneofs-mutually-exclusive-fields

    Attributes:
        project_id (str):
            Required. The ID of the Cloud Platform
            project that the job belongs to.
        gcs_path (str):
            Required. A Cloud Storage path to the
            template from which to create the job.
            Must be valid Cloud Storage URL, beginning with
            'gs://'.

            This field is a member of `oneof`_ ``template``.
        view (google.cloud.dataflow_v1beta3.types.GetTemplateRequest.TemplateView):
            The view to retrieve. Defaults to METADATA_ONLY.
        location (str):
            The [regional endpoint]
            (https://cloud.google.com/dataflow/docs/concepts/regional-endpoints)
            to which to direct the request.
    """

    class TemplateView(proto.Enum):
        r"""The various views of a template that may be retrieved.

        Values:
            METADATA_ONLY (0):
                Template view that retrieves only the
                metadata associated with the template.
        """
        METADATA_ONLY = 0

    project_id: str = proto.Field(
        proto.STRING,
        number=1,
    )
    gcs_path: str = proto.Field(
        proto.STRING,
        number=2,
        oneof="template",
    )
    view: TemplateView = proto.Field(
        proto.ENUM,
        number=3,
        enum=TemplateView,
    )
    location: str = proto.Field(
        proto.STRING,
        number=4,
    )


class GetTemplateResponse(proto.Message):
    r"""The response to a GetTemplate request.

    Attributes:
        status (google.rpc.status_pb2.Status):
            The status of the get template request. Any problems with
            the request will be indicated in the error_details.
        metadata (google.cloud.dataflow_v1beta3.types.TemplateMetadata):
            The template metadata describing the template
            name, available parameters, etc.
        template_type (google.cloud.dataflow_v1beta3.types.GetTemplateResponse.TemplateType):
            Template Type.
        runtime_metadata (google.cloud.dataflow_v1beta3.types.RuntimeMetadata):
            Describes the runtime metadata with SDKInfo
            and available parameters.
    """

    class TemplateType(proto.Enum):
        r"""Template Type.

        Values:
            UNKNOWN (0):
                Unknown Template Type.
            LEGACY (1):
                Legacy Template.
            FLEX (2):
                Flex Template.
        """
        UNKNOWN = 0
        LEGACY = 1
        FLEX = 2

    status: status_pb2.Status = proto.Field(
        proto.MESSAGE,
        number=1,
        message=status_pb2.Status,
    )
    metadata: "TemplateMetadata" = proto.Field(
        proto.MESSAGE,
        number=2,
        message="TemplateMetadata",
    )
    template_type: TemplateType = proto.Field(
        proto.ENUM,
        number=3,
        enum=TemplateType,
    )
    runtime_metadata: "RuntimeMetadata" = proto.Field(
        proto.MESSAGE,
        number=4,
        message="RuntimeMetadata",
    )


class LaunchTemplateParameters(proto.Message):
    r"""Parameters to provide to the template being launched. Note that the
    [metadata in the pipeline code]
    (https://cloud.google.com/dataflow/docs/guides/templates/creating-templates#metadata)
    determines which runtime parameters are valid.

    Attributes:
        job_name (str):
            Required. The job name to use for the created job.

            The name must match the regular expression
            ``[a-z]([-a-z0-9]{0,1022}[a-z0-9])?``
        parameters (MutableMapping[str, str]):
            The runtime parameters to pass to the job.
        environment (google.cloud.dataflow_v1beta3.types.RuntimeEnvironment):
            The runtime environment for the job.
        update (bool):
            If set, replace the existing pipeline with
            the name specified by jobName with this
            pipeline, preserving state.
        transform_name_mapping (MutableMapping[str, str]):
            Only applicable when updating a pipeline. Map
            of transform name prefixes of the job to be
            replaced to the corresponding name prefixes of
            the new job.
    """

    job_name: str = proto.Field(
        proto.STRING,
        number=1,
    )
    parameters: MutableMapping[str, str] = proto.MapField(
        proto.STRING,
        proto.STRING,
        number=2,
    )
    environment: "RuntimeEnvironment" = proto.Field(
        proto.MESSAGE,
        number=3,
        message="RuntimeEnvironment",
    )
    update: bool = proto.Field(
        proto.BOOL,
        number=4,
    )
    transform_name_mapping: MutableMapping[str, str] = proto.MapField(
        proto.STRING,
        proto.STRING,
        number=5,
    )


class LaunchTemplateRequest(proto.Message):
    r"""A request to launch a template.

    This message has `oneof`_ fields (mutually exclusive fields).
    For each oneof, at most one member field can be set at the same time.
    Setting any member of the oneof automatically clears all other
    members.

    .. _oneof: https://proto-plus-python.readthedocs.io/en/stable/fields.html#oneofs-mutually-exclusive-fields

    Attributes:
        project_id (str):
            Required. The ID of the Cloud Platform
            project that the job belongs to.
        validate_only (bool):
            If true, the request is validated but not
            actually executed. Defaults to false.
        gcs_path (str):
            A Cloud Storage path to the template to use to create the
            job. Must be valid Cloud Storage URL, beginning with
            ``gs://``.

            This field is a member of `oneof`_ ``template``.
        dynamic_template (google.cloud.dataflow_v1beta3.types.DynamicTemplateLaunchParams):
            Parameters for launching a dynamic template.

            This field is a member of `oneof`_ ``template``.
        launch_parameters (google.cloud.dataflow_v1beta3.types.LaunchTemplateParameters):
            The parameters of the template to launch.
            Part of the body of the POST request.
        location (str):
            The [regional endpoint]
            (https://cloud.google.com/dataflow/docs/concepts/regional-endpoints)
            to which to direct the request.
    """

    project_id: str = proto.Field(
        proto.STRING,
        number=1,
    )
    validate_only: bool = proto.Field(
        proto.BOOL,
        number=2,
    )
    gcs_path: str = proto.Field(
        proto.STRING,
        number=3,
        oneof="template",
    )
    dynamic_template: "DynamicTemplateLaunchParams" = proto.Field(
        proto.MESSAGE,
        number=6,
        oneof="template",
        message="DynamicTemplateLaunchParams",
    )
    launch_parameters: "LaunchTemplateParameters" = proto.Field(
        proto.MESSAGE,
        number=4,
        message="LaunchTemplateParameters",
    )
    location: str = proto.Field(
        proto.STRING,
        number=5,
    )


class LaunchTemplateResponse(proto.Message):
    r"""Response to the request to launch a template.

    Attributes:
        job (google.cloud.dataflow_v1beta3.types.Job):
            The job that was launched, if the request was
            not a dry run and the job was successfully
            launched.
    """

    job: jobs.Job = proto.Field(
        proto.MESSAGE,
        number=1,
        message=jobs.Job,
    )


class InvalidTemplateParameters(proto.Message):
    r"""Used in the error_details field of a google.rpc.Status message, this
    indicates problems with the template parameter.

    Attributes:
        parameter_violations (MutableSequence[google.cloud.dataflow_v1beta3.types.InvalidTemplateParameters.ParameterViolation]):
            Describes all parameter violations in a
            template request.
    """

    class ParameterViolation(proto.Message):
        r"""A specific template-parameter violation.

        Attributes:
            parameter (str):
                The parameter that failed to validate.
            description (str):
                A description of why the parameter failed to
                validate.
        """

        parameter: str = proto.Field(
            proto.STRING,
            number=1,
        )
        description: str = proto.Field(
            proto.STRING,
            number=2,
        )

    parameter_violations: MutableSequence[ParameterViolation] = proto.RepeatedField(
        proto.MESSAGE,
        number=1,
        message=ParameterViolation,
    )


class DynamicTemplateLaunchParams(proto.Message):
    r"""Parameters to pass when launching a dynamic template.

    Attributes:
        gcs_path (str):
            Path to the dynamic template specification file on Cloud
            Storage. The file must be a JSON serialized
            ``DynamicTemplateFileSpec`` object.
        staging_location (str):
            Cloud Storage path for staging dependencies. Must be a valid
            Cloud Storage URL, beginning with ``gs://``.
    """

    gcs_path: str = proto.Field(
        proto.STRING,
        number=1,
    )
    staging_location: str = proto.Field(
        proto.STRING,
        number=2,
    )


__all__ = tuple(sorted(__protobuf__.manifest))
