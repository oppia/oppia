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
from google.rpc import status_pb2  # type: ignore
import proto  # type: ignore

from google.cloud.translate_v3.types import common

__protobuf__ = proto.module(
    package="google.cloud.translation.v3",
    manifest={
        "ImportDataRequest",
        "DatasetInputConfig",
        "ImportDataMetadata",
        "ExportDataRequest",
        "DatasetOutputConfig",
        "ExportDataMetadata",
        "DeleteDatasetRequest",
        "DeleteDatasetMetadata",
        "GetDatasetRequest",
        "ListDatasetsRequest",
        "ListDatasetsResponse",
        "CreateDatasetRequest",
        "CreateDatasetMetadata",
        "ListExamplesRequest",
        "ListExamplesResponse",
        "Example",
        "BatchTransferResourcesResponse",
        "Dataset",
        "CreateModelRequest",
        "CreateModelMetadata",
        "ListModelsRequest",
        "ListModelsResponse",
        "GetModelRequest",
        "DeleteModelRequest",
        "DeleteModelMetadata",
        "Model",
    },
)


class ImportDataRequest(proto.Message):
    r"""Request message for ImportData.

    Attributes:
        dataset (str):
            Required. Name of the dataset. In form of
            ``projects/{project-number-or-id}/locations/{location-id}/datasets/{dataset-id}``
        input_config (google.cloud.translate_v3.types.DatasetInputConfig):
            Required. The config for the input content.
    """

    dataset: str = proto.Field(
        proto.STRING,
        number=1,
    )
    input_config: "DatasetInputConfig" = proto.Field(
        proto.MESSAGE,
        number=2,
        message="DatasetInputConfig",
    )


class DatasetInputConfig(proto.Message):
    r"""Input configuration for datasets.

    Attributes:
        input_files (MutableSequence[google.cloud.translate_v3.types.DatasetInputConfig.InputFile]):
            Files containing the sentence pairs to be
            imported to the dataset.
    """

    class InputFile(proto.Message):
        r"""An input file.

        .. _oneof: https://proto-plus-python.readthedocs.io/en/stable/fields.html#oneofs-mutually-exclusive-fields

        Attributes:
            usage (str):
                Optional. Usage of the file contents. Options are
                TRAIN|VALIDATION|TEST, or UNASSIGNED (by default) for auto
                split.
            gcs_source (google.cloud.translate_v3.types.GcsInputSource):
                Google Cloud Storage file source.

                This field is a member of `oneof`_ ``source``.
        """

        usage: str = proto.Field(
            proto.STRING,
            number=2,
        )
        gcs_source: common.GcsInputSource = proto.Field(
            proto.MESSAGE,
            number=3,
            oneof="source",
            message=common.GcsInputSource,
        )

    input_files: MutableSequence[InputFile] = proto.RepeatedField(
        proto.MESSAGE,
        number=1,
        message=InputFile,
    )


class ImportDataMetadata(proto.Message):
    r"""Metadata of import data operation.

    Attributes:
        state (google.cloud.translate_v3.types.OperationState):
            The current state of the operation.
        create_time (google.protobuf.timestamp_pb2.Timestamp):
            The creation time of the operation.
        update_time (google.protobuf.timestamp_pb2.Timestamp):
            The last update time of the operation.
        error (google.rpc.status_pb2.Status):
            Only populated when operation doesn't
            succeed.
    """

    state: common.OperationState = proto.Field(
        proto.ENUM,
        number=1,
        enum=common.OperationState,
    )
    create_time: timestamp_pb2.Timestamp = proto.Field(
        proto.MESSAGE,
        number=2,
        message=timestamp_pb2.Timestamp,
    )
    update_time: timestamp_pb2.Timestamp = proto.Field(
        proto.MESSAGE,
        number=3,
        message=timestamp_pb2.Timestamp,
    )
    error: status_pb2.Status = proto.Field(
        proto.MESSAGE,
        number=4,
        message=status_pb2.Status,
    )


class ExportDataRequest(proto.Message):
    r"""Request message for ExportData.

    Attributes:
        dataset (str):
            Required. Name of the dataset. In form of
            ``projects/{project-number-or-id}/locations/{location-id}/datasets/{dataset-id}``
        output_config (google.cloud.translate_v3.types.DatasetOutputConfig):
            Required. The config for the output content.
    """

    dataset: str = proto.Field(
        proto.STRING,
        number=1,
    )
    output_config: "DatasetOutputConfig" = proto.Field(
        proto.MESSAGE,
        number=2,
        message="DatasetOutputConfig",
    )


class DatasetOutputConfig(proto.Message):
    r"""Output configuration for datasets.

    .. _oneof: https://proto-plus-python.readthedocs.io/en/stable/fields.html#oneofs-mutually-exclusive-fields

    Attributes:
        gcs_destination (google.cloud.translate_v3.types.GcsOutputDestination):
            Google Cloud Storage destination to write the
            output.

            This field is a member of `oneof`_ ``destination``.
    """

    gcs_destination: common.GcsOutputDestination = proto.Field(
        proto.MESSAGE,
        number=1,
        oneof="destination",
        message=common.GcsOutputDestination,
    )


class ExportDataMetadata(proto.Message):
    r"""Metadata of export data operation.

    Attributes:
        state (google.cloud.translate_v3.types.OperationState):
            The current state of the operation.
        create_time (google.protobuf.timestamp_pb2.Timestamp):
            The creation time of the operation.
        update_time (google.protobuf.timestamp_pb2.Timestamp):
            The last update time of the operation.
        error (google.rpc.status_pb2.Status):
            Only populated when operation doesn't
            succeed.
    """

    state: common.OperationState = proto.Field(
        proto.ENUM,
        number=1,
        enum=common.OperationState,
    )
    create_time: timestamp_pb2.Timestamp = proto.Field(
        proto.MESSAGE,
        number=2,
        message=timestamp_pb2.Timestamp,
    )
    update_time: timestamp_pb2.Timestamp = proto.Field(
        proto.MESSAGE,
        number=3,
        message=timestamp_pb2.Timestamp,
    )
    error: status_pb2.Status = proto.Field(
        proto.MESSAGE,
        number=4,
        message=status_pb2.Status,
    )


class DeleteDatasetRequest(proto.Message):
    r"""Request message for DeleteDataset.

    Attributes:
        name (str):
            Required. The name of the dataset to delete.
    """

    name: str = proto.Field(
        proto.STRING,
        number=1,
    )


class DeleteDatasetMetadata(proto.Message):
    r"""Metadata of delete dataset operation.

    Attributes:
        state (google.cloud.translate_v3.types.OperationState):
            The current state of the operation.
        create_time (google.protobuf.timestamp_pb2.Timestamp):
            The creation time of the operation.
        update_time (google.protobuf.timestamp_pb2.Timestamp):
            The last update time of the operation.
        error (google.rpc.status_pb2.Status):
            Only populated when operation doesn't
            succeed.
    """

    state: common.OperationState = proto.Field(
        proto.ENUM,
        number=1,
        enum=common.OperationState,
    )
    create_time: timestamp_pb2.Timestamp = proto.Field(
        proto.MESSAGE,
        number=2,
        message=timestamp_pb2.Timestamp,
    )
    update_time: timestamp_pb2.Timestamp = proto.Field(
        proto.MESSAGE,
        number=3,
        message=timestamp_pb2.Timestamp,
    )
    error: status_pb2.Status = proto.Field(
        proto.MESSAGE,
        number=4,
        message=status_pb2.Status,
    )


class GetDatasetRequest(proto.Message):
    r"""Request message for GetDataset.

    Attributes:
        name (str):
            Required. The resource name of the dataset to
            retrieve.
    """

    name: str = proto.Field(
        proto.STRING,
        number=1,
    )


class ListDatasetsRequest(proto.Message):
    r"""Request message for ListDatasets.

    Attributes:
        parent (str):
            Required. Name of the parent project. In form of
            ``projects/{project-number-or-id}/locations/{location-id}``
        page_size (int):
            Optional. Requested page size. The server can
            return fewer results than requested.
        page_token (str):
            Optional. A token identifying a page of results for the
            server to return. Typically obtained from next_page_token
            field in the response of a ListDatasets call.
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


class ListDatasetsResponse(proto.Message):
    r"""Response message for ListDatasets.

    Attributes:
        datasets (MutableSequence[google.cloud.translate_v3.types.Dataset]):
            The datasets read.
        next_page_token (str):
            A token to retrieve next page of results. Pass this token to
            the page_token field in the ListDatasetsRequest to obtain
            the corresponding page.
    """

    @property
    def raw_page(self):
        return self

    datasets: MutableSequence["Dataset"] = proto.RepeatedField(
        proto.MESSAGE,
        number=1,
        message="Dataset",
    )
    next_page_token: str = proto.Field(
        proto.STRING,
        number=2,
    )


class CreateDatasetRequest(proto.Message):
    r"""Request message for CreateDataset.

    Attributes:
        parent (str):
            Required. The project name.
        dataset (google.cloud.translate_v3.types.Dataset):
            Required. The Dataset to create.
    """

    parent: str = proto.Field(
        proto.STRING,
        number=1,
    )
    dataset: "Dataset" = proto.Field(
        proto.MESSAGE,
        number=2,
        message="Dataset",
    )


class CreateDatasetMetadata(proto.Message):
    r"""Metadata of create dataset operation.

    Attributes:
        state (google.cloud.translate_v3.types.OperationState):
            The current state of the operation.
        create_time (google.protobuf.timestamp_pb2.Timestamp):
            The creation time of the operation.
        update_time (google.protobuf.timestamp_pb2.Timestamp):
            The last update time of the operation.
        error (google.rpc.status_pb2.Status):
            Only populated when operation doesn't
            succeed.
    """

    state: common.OperationState = proto.Field(
        proto.ENUM,
        number=1,
        enum=common.OperationState,
    )
    create_time: timestamp_pb2.Timestamp = proto.Field(
        proto.MESSAGE,
        number=2,
        message=timestamp_pb2.Timestamp,
    )
    update_time: timestamp_pb2.Timestamp = proto.Field(
        proto.MESSAGE,
        number=3,
        message=timestamp_pb2.Timestamp,
    )
    error: status_pb2.Status = proto.Field(
        proto.MESSAGE,
        number=4,
        message=status_pb2.Status,
    )


class ListExamplesRequest(proto.Message):
    r"""Request message for ListExamples.

    Attributes:
        parent (str):
            Required. Name of the parent dataset. In form of
            ``projects/{project-number-or-id}/locations/{location-id}/datasets/{dataset-id}``
        filter (str):
            Optional. An expression for filtering the examples that will
            be returned. Example filter:

            -  ``usage=TRAIN``
        page_size (int):
            Optional. Requested page size. The server can
            return fewer results than requested.
        page_token (str):
            Optional. A token identifying a page of results for the
            server to return. Typically obtained from next_page_token
            field in the response of a ListExamples call.
    """

    parent: str = proto.Field(
        proto.STRING,
        number=1,
    )
    filter: str = proto.Field(
        proto.STRING,
        number=2,
    )
    page_size: int = proto.Field(
        proto.INT32,
        number=3,
    )
    page_token: str = proto.Field(
        proto.STRING,
        number=4,
    )


class ListExamplesResponse(proto.Message):
    r"""Response message for ListExamples.

    Attributes:
        examples (MutableSequence[google.cloud.translate_v3.types.Example]):
            The sentence pairs.
        next_page_token (str):
            A token to retrieve next page of results. Pass this token to
            the page_token field in the ListExamplesRequest to obtain
            the corresponding page.
    """

    @property
    def raw_page(self):
        return self

    examples: MutableSequence["Example"] = proto.RepeatedField(
        proto.MESSAGE,
        number=1,
        message="Example",
    )
    next_page_token: str = proto.Field(
        proto.STRING,
        number=2,
    )


class Example(proto.Message):
    r"""A sentence pair.

    Attributes:
        name (str):
            Output only. The resource name of the example, in form of
            ``projects/{project-number-or-id}/locations/{location_id}/datasets/{dataset_id}/examples/{example_id}``
        source_text (str):
            Sentence in source language.
        target_text (str):
            Sentence in target language.
        usage (str):
            Output only. Usage of the sentence pair. Options are
            TRAIN|VALIDATION|TEST.
    """

    name: str = proto.Field(
        proto.STRING,
        number=1,
    )
    source_text: str = proto.Field(
        proto.STRING,
        number=2,
    )
    target_text: str = proto.Field(
        proto.STRING,
        number=3,
    )
    usage: str = proto.Field(
        proto.STRING,
        number=4,
    )


class BatchTransferResourcesResponse(proto.Message):
    r"""Response message for BatchTransferResources.

    Attributes:
        responses (MutableSequence[google.cloud.translate_v3.types.BatchTransferResourcesResponse.TransferResourceResponse]):
            Responses of the transfer for individual
            resources.
    """

    class TransferResourceResponse(proto.Message):
        r"""Transfer response for a single resource.

        Attributes:
            source (str):
                Full name of the resource to transfer as
                specified in the request.
            target (str):
                Full name of the new resource successfully
                transferred from the source hosted by
                Translation API. Target will be empty if the
                transfer failed.
            error (google.rpc.status_pb2.Status):
                The error result in case of failure.
        """

        source: str = proto.Field(
            proto.STRING,
            number=1,
        )
        target: str = proto.Field(
            proto.STRING,
            number=2,
        )
        error: status_pb2.Status = proto.Field(
            proto.MESSAGE,
            number=3,
            message=status_pb2.Status,
        )

    responses: MutableSequence[TransferResourceResponse] = proto.RepeatedField(
        proto.MESSAGE,
        number=1,
        message=TransferResourceResponse,
    )


class Dataset(proto.Message):
    r"""A dataset that hosts the examples (sentence pairs) used for
    translation models.

    Attributes:
        name (str):
            The resource name of the dataset, in form of
            ``projects/{project-number-or-id}/locations/{location_id}/datasets/{dataset_id}``
        display_name (str):
            The name of the dataset to show in the interface. The name
            can be up to 32 characters long and can consist only of
            ASCII Latin letters A-Z and a-z, underscores (_), and ASCII
            digits 0-9.
        source_language_code (str):
            The BCP-47 language code of the source
            language.
        target_language_code (str):
            The BCP-47 language code of the target
            language.
        example_count (int):
            Output only. The number of examples in the
            dataset.
        train_example_count (int):
            Output only. Number of training examples
            (sentence pairs).
        validate_example_count (int):
            Output only. Number of validation examples
            (sentence pairs).
        test_example_count (int):
            Output only. Number of test examples
            (sentence pairs).
        create_time (google.protobuf.timestamp_pb2.Timestamp):
            Output only. Timestamp when this dataset was
            created.
        update_time (google.protobuf.timestamp_pb2.Timestamp):
            Output only. Timestamp when this dataset was
            last updated.
    """

    name: str = proto.Field(
        proto.STRING,
        number=1,
    )
    display_name: str = proto.Field(
        proto.STRING,
        number=2,
    )
    source_language_code: str = proto.Field(
        proto.STRING,
        number=3,
    )
    target_language_code: str = proto.Field(
        proto.STRING,
        number=4,
    )
    example_count: int = proto.Field(
        proto.INT32,
        number=5,
    )
    train_example_count: int = proto.Field(
        proto.INT32,
        number=6,
    )
    validate_example_count: int = proto.Field(
        proto.INT32,
        number=7,
    )
    test_example_count: int = proto.Field(
        proto.INT32,
        number=8,
    )
    create_time: timestamp_pb2.Timestamp = proto.Field(
        proto.MESSAGE,
        number=9,
        message=timestamp_pb2.Timestamp,
    )
    update_time: timestamp_pb2.Timestamp = proto.Field(
        proto.MESSAGE,
        number=10,
        message=timestamp_pb2.Timestamp,
    )


class CreateModelRequest(proto.Message):
    r"""Request message for CreateModel.

    Attributes:
        parent (str):
            Required. The project name, in form of
            ``projects/{project}/locations/{location}``
        model (google.cloud.translate_v3.types.Model):
            Required. The Model to create.
    """

    parent: str = proto.Field(
        proto.STRING,
        number=1,
    )
    model: "Model" = proto.Field(
        proto.MESSAGE,
        number=2,
        message="Model",
    )


class CreateModelMetadata(proto.Message):
    r"""Metadata of create model operation.

    Attributes:
        state (google.cloud.translate_v3.types.OperationState):
            The current state of the operation.
        create_time (google.protobuf.timestamp_pb2.Timestamp):
            The creation time of the operation.
        update_time (google.protobuf.timestamp_pb2.Timestamp):
            The last update time of the operation.
        error (google.rpc.status_pb2.Status):
            Only populated when operation doesn't
            succeed.
    """

    state: common.OperationState = proto.Field(
        proto.ENUM,
        number=1,
        enum=common.OperationState,
    )
    create_time: timestamp_pb2.Timestamp = proto.Field(
        proto.MESSAGE,
        number=2,
        message=timestamp_pb2.Timestamp,
    )
    update_time: timestamp_pb2.Timestamp = proto.Field(
        proto.MESSAGE,
        number=3,
        message=timestamp_pb2.Timestamp,
    )
    error: status_pb2.Status = proto.Field(
        proto.MESSAGE,
        number=4,
        message=status_pb2.Status,
    )


class ListModelsRequest(proto.Message):
    r"""Request message for ListModels.

    Attributes:
        parent (str):
            Required. Name of the parent project. In form of
            ``projects/{project-number-or-id}/locations/{location-id}``
        filter (str):
            Optional. An expression for filtering the models that will
            be returned. Supported filter: ``dataset_id=${dataset_id}``
        page_size (int):
            Optional. Requested page size. The server can
            return fewer results than requested.
        page_token (str):
            Optional. A token identifying a page of results for the
            server to return. Typically obtained from next_page_token
            field in the response of a ListModels call.
    """

    parent: str = proto.Field(
        proto.STRING,
        number=1,
    )
    filter: str = proto.Field(
        proto.STRING,
        number=4,
    )
    page_size: int = proto.Field(
        proto.INT32,
        number=2,
    )
    page_token: str = proto.Field(
        proto.STRING,
        number=3,
    )


class ListModelsResponse(proto.Message):
    r"""Response message for ListModels.

    Attributes:
        models (MutableSequence[google.cloud.translate_v3.types.Model]):
            The models read.
        next_page_token (str):
            A token to retrieve next page of results. Pass this token to
            the page_token field in the ListModelsRequest to obtain the
            corresponding page.
    """

    @property
    def raw_page(self):
        return self

    models: MutableSequence["Model"] = proto.RepeatedField(
        proto.MESSAGE,
        number=1,
        message="Model",
    )
    next_page_token: str = proto.Field(
        proto.STRING,
        number=2,
    )


class GetModelRequest(proto.Message):
    r"""Request message for GetModel.

    Attributes:
        name (str):
            Required. The resource name of the model to
            retrieve.
    """

    name: str = proto.Field(
        proto.STRING,
        number=1,
    )


class DeleteModelRequest(proto.Message):
    r"""Request message for DeleteModel.

    Attributes:
        name (str):
            Required. The name of the model to delete.
    """

    name: str = proto.Field(
        proto.STRING,
        number=1,
    )


class DeleteModelMetadata(proto.Message):
    r"""Metadata of delete model operation.

    Attributes:
        state (google.cloud.translate_v3.types.OperationState):
            The current state of the operation.
        create_time (google.protobuf.timestamp_pb2.Timestamp):
            The creation time of the operation.
        update_time (google.protobuf.timestamp_pb2.Timestamp):
            The last update time of the operation.
        error (google.rpc.status_pb2.Status):
            Only populated when operation doesn't
            succeed.
    """

    state: common.OperationState = proto.Field(
        proto.ENUM,
        number=1,
        enum=common.OperationState,
    )
    create_time: timestamp_pb2.Timestamp = proto.Field(
        proto.MESSAGE,
        number=2,
        message=timestamp_pb2.Timestamp,
    )
    update_time: timestamp_pb2.Timestamp = proto.Field(
        proto.MESSAGE,
        number=3,
        message=timestamp_pb2.Timestamp,
    )
    error: status_pb2.Status = proto.Field(
        proto.MESSAGE,
        number=4,
        message=status_pb2.Status,
    )


class Model(proto.Message):
    r"""A trained translation model.

    Attributes:
        name (str):
            The resource name of the model, in form of
            ``projects/{project-number-or-id}/locations/{location_id}/models/{model_id}``
        display_name (str):
            The name of the model to show in the interface. The name can
            be up to 32 characters long and can consist only of ASCII
            Latin letters A-Z and a-z, underscores (_), and ASCII digits
            0-9.
        dataset (str):
            The dataset from which the model is trained, in form of
            ``projects/{project-number-or-id}/locations/{location_id}/datasets/{dataset_id}``
        source_language_code (str):
            Output only. The BCP-47 language code of the
            source language.
        target_language_code (str):
            Output only. The BCP-47 language code of the
            target language.
        train_example_count (int):
            Output only. Number of examples (sentence
            pairs) used to train the model.
        validate_example_count (int):
            Output only. Number of examples (sentence
            pairs) used to validate the model.
        test_example_count (int):
            Output only. Number of examples (sentence
            pairs) used to test the model.
        create_time (google.protobuf.timestamp_pb2.Timestamp):
            Output only. Timestamp when the model
            resource was created, which is also when the
            training started.
        update_time (google.protobuf.timestamp_pb2.Timestamp):
            Output only. Timestamp when this model was
            last updated.
    """

    name: str = proto.Field(
        proto.STRING,
        number=1,
    )
    display_name: str = proto.Field(
        proto.STRING,
        number=2,
    )
    dataset: str = proto.Field(
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
    train_example_count: int = proto.Field(
        proto.INT32,
        number=6,
    )
    validate_example_count: int = proto.Field(
        proto.INT32,
        number=7,
    )
    test_example_count: int = proto.Field(
        proto.INT32,
        number=12,
    )
    create_time: timestamp_pb2.Timestamp = proto.Field(
        proto.MESSAGE,
        number=8,
        message=timestamp_pb2.Timestamp,
    )
    update_time: timestamp_pb2.Timestamp = proto.Field(
        proto.MESSAGE,
        number=10,
        message=timestamp_pb2.Timestamp,
    )


__all__ = tuple(sorted(__protobuf__.manifest))
