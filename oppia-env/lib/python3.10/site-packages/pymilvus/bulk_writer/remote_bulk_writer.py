# Copyright (C) 2019-2023 Zilliz. All rights reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except
# in compliance with the License. You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software distributed under the License
# is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
# or implied. See the License for the specific language governing permissions and limitations under
# the License.

import logging
import sys
from pathlib import Path
from typing import Any, Dict, Optional, Union

from azure.core.exceptions import AzureError
from azure.storage.blob import BlobServiceClient
from minio import Minio
from minio.error import S3Error

from pymilvus.exceptions import MilvusException
from pymilvus.orm.schema import CollectionSchema

from .constants import (
    DEFAULT_BUCKET_NAME,
    MB,
    BulkFileType,
)
from .local_bulk_writer import LocalBulkWriter

logger = logging.getLogger(__name__)


class RemoteBulkWriter(LocalBulkWriter):
    class S3ConnectParam:
        def __init__(
            self,
            bucket_name: str = DEFAULT_BUCKET_NAME,
            endpoint: Optional[str] = None,
            access_key: Optional[str] = None,
            secret_key: Optional[str] = None,
            secure: bool = False,
            session_token: Optional[str] = None,
            region: Optional[str] = None,
            http_client: Any = None,
            credentials: Any = None,
        ):
            self._bucket_name = bucket_name
            self._endpoint = endpoint
            self._access_key = access_key
            self._secret_key = secret_key
            self._secure = (secure,)
            self._session_token = (session_token,)
            self._region = (region,)
            self._http_client = (http_client,)  # urllib3.poolmanager.PoolManager
            self._credentials = (credentials,)  # minio.credentials.Provider

    ConnectParam = S3ConnectParam  # keep the ConnectParam for compatible with user's legacy code

    class AzureConnectParam:
        def __init__(
            self,
            container_name: str,
            conn_str: str,
            account_url: Optional[str] = None,
            credential: Optional[Union[str, Dict[str, str]]] = None,
            upload_chunk_size: int = 8 * 1024 * 1024,
            upload_concurrency: int = 4,
        ):
            """Connection parameters for Azure blob storage
            Args:
                container_name(str): The target container name

                conn_str(str): A connection string to an Azure Storage account,
                    which can be parsed to an account_url and a credential.
                    To generate a connection string, read this link:
                    https://learn.microsoft.com/en-us/azure/storage/common/storage-configure-connection-string

                account_url(str): A string in format like https://<storage-account>.blob.core.windows.net
                    Read this link for more info:
                    https://learn.microsoft.com/en-us/azure/storage/common/storage-account-overview

                credential: Account access key for the account, read this link for more info:
                    https://learn.microsoft.com/en-us/azure/storage/common/storage-account-keys-manage?tabs=azure-portal#view-account-access-keys

                upload_chunk_size: If the blob size is larger than this value or unknown,
                    the blob is uploaded in chunks by parallel connections. This parameter is
                    passed to max_single_put_size of Azure. Read this link for more info:
                    https://learn.microsoft.com/en-us/azure/storage/blobs/storage-blob-upload-python#specify-data-transfer-options-for-upload

                upload_concurrency: The maximum number of parallel connections to use when uploading
                    in chunks. This parameter is passed to max_concurrency of Azure.
                    Read this link for more info:
                    https://learn.microsoft.com/en-us/azure/storage/blobs/storage-blob-upload-python#specify-data-transfer-options-for-upload
            """
            self._container_name = container_name
            self._conn_str = conn_str
            self._account_url = account_url
            self._credential = credential
            self._upload_chunk_size = upload_chunk_size
            self._upload_concurrency = upload_concurrency

    def __init__(
        self,
        schema: CollectionSchema,
        remote_path: str,
        connect_param: Optional[Union[S3ConnectParam, AzureConnectParam]],
        chunk_size: int = 1024 * MB,
        file_type: BulkFileType = BulkFileType.PARQUET,
        config: Optional[dict] = None,
        **kwargs,
    ):
        local_path = Path(sys.argv[0]).resolve().parent.joinpath("bulk_writer")
        super().__init__(schema, str(local_path), chunk_size, file_type, config, **kwargs)
        self._remote_path = Path("/").joinpath(remote_path).joinpath(super().uuid)
        self._connect_param = connect_param
        self._client = None
        self._get_client()
        self._remote_files = []
        logger.info(f"Remote buffer writer initialized, target path: {self._remote_path}")

    def __enter__(self):
        return self

    def __exit__(self, exc_type: object, exc_val: object, exc_tb: object):
        super().__exit__(exc_type, exc_val, exc_tb)
        # remove the temp folder "bulk_writer"
        if Path(self._local_path).parent.exists() and not any(
            Path(self._local_path).parent.iterdir()
        ):
            Path(self._local_path).parent.rmdir()
            logger.info(f"Delete empty directory '{Path(self._local_path).parent}'")

    def _get_client(self):
        if self._client is not None:
            return self._client

        if isinstance(self._connect_param, RemoteBulkWriter.S3ConnectParam):
            try:

                def arg_parse(arg: Any):
                    return arg[0] if isinstance(arg, tuple) else arg

                self._client = Minio(
                    endpoint=arg_parse(self._connect_param._endpoint),
                    access_key=arg_parse(self._connect_param._access_key),
                    secret_key=arg_parse(self._connect_param._secret_key),
                    secure=arg_parse(self._connect_param._secure),
                    session_token=arg_parse(self._connect_param._session_token),
                    region=arg_parse(self._connect_param._region),
                    http_client=arg_parse(self._connect_param._http_client),
                    credentials=arg_parse(self._connect_param._credentials),
                )
                logger.info("Minio/S3 blob storage client successfully initialized")
            except Exception as err:
                logger.error(f"Failed to connect MinIO/S3, error: {err}")
                raise
        elif isinstance(self._connect_param, RemoteBulkWriter.AzureConnectParam):
            try:
                if (
                    self._connect_param._conn_str is not None
                    and len(self._connect_param._conn_str) > 0
                ):
                    self._client = BlobServiceClient.from_connection_string(
                        conn_str=self._connect_param._conn_str,
                        credential=self._connect_param._credential,
                        max_block_size=self._connect_param._upload_chunk_size,
                        max_single_put_size=self._connect_param._upload_chunk_size,
                    )
                elif (
                    self._connect_param._account_url is not None
                    and len(self._connect_param._account_url) > 0
                ):
                    self._client = BlobServiceClient(
                        account_url=self._connect_param._account_url,
                        credential=self._connect_param._credential,
                        max_block_size=self._connect_param._upload_chunk_size,
                        max_single_put_size=self._connect_param._upload_chunk_size,
                    )
                else:
                    raise MilvusException(message="Illegal connection parameters")

                logger.info("Azure blob storage client successfully initialized")
            except Exception as err:
                logger.error(f"Failed to connect Azure, error: {err}")
                raise

        return self._client

    def _stat_object(self, object_name: str):
        if isinstance(self._client, Minio):
            return self._client.stat_object(
                bucket_name=self._connect_param._bucket_name, object_name=object_name
            )
        if isinstance(self._client, BlobServiceClient):
            blob = self._client.get_blob_client(
                container=self._connect_param._container_name, blob=object_name
            )
            return blob.get_blob_properties()

        raise MilvusException(message="Blob storage client is not initialized")

    def _object_exists(self, object_name: str) -> bool:
        try:
            self._stat_object(object_name=object_name)
        except S3Error as s3err:
            if s3err.code == "NoSuchKey":
                return False
            self._throw(f"Failed to stat MinIO/S3 object '{object_name}', error: {s3err}")
        except AzureError as azure_err:
            if azure_err.error_code == "BlobNotFound":
                return False
            self._throw(f"Failed to stat Azure object '{object_name}', error: {azure_err}")

        return True

    def _bucket_exists(self) -> bool:
        if isinstance(self._client, Minio):
            return self._client.bucket_exists(self._connect_param._bucket_name)
        if isinstance(self._client, BlobServiceClient):
            containers = self._client.list_containers()
            for container in containers:
                if self._connect_param._container_name == container["name"]:
                    return True
            return False

        raise MilvusException(message="Blob storage client is not initialized")

    def _upload_object(self, file_path: str, object_name: str):
        logger.info(f"Prepare to upload '{file_path}' to '{object_name}'")
        if isinstance(self._client, Minio):
            logger.info(f"Target bucket: '{self._connect_param._bucket_name}'")
            self._client.fput_object(
                bucket_name=self._connect_param._bucket_name,
                object_name=object_name,
                file_path=file_path,
            )
        elif isinstance(self._client, BlobServiceClient):
            logger.info(f"Target bucket: '{self._connect_param._container_name}'")
            container_client = self._client.get_container_client(
                self._connect_param._container_name
            )
            with Path(file_path).open("rb") as data:
                container_client.upload_blob(
                    name=object_name,
                    data=data,
                    overwrite=True,
                    max_concurrency=self._connect_param._upload_concurrency,
                    connection_timeout=600,
                )
        else:
            raise MilvusException(message="Blob storage client is not initialized")

        logger.info(f"Upload file '{file_path}' to '{object_name}'")

    def append_row(self, row: dict, **kwargs):
        super().append_row(row, **kwargs)

    def commit(self, **kwargs):
        super().commit(call_back=self._upload)

    def _local_rm(self, file: str):
        try:
            Path(file).unlink()
            parent_dir = Path(file).parent
            if parent_dir != self._local_path and (not any(Path(parent_dir).iterdir())):
                Path(parent_dir).rmdir()
                logger.info(f"Delete empty directory '{parent_dir}'")
        except Exception:
            logger.warning(f"Failed to delete local file: {file}")

    def _upload(self, file_list: list):
        remote_files = []
        try:
            if not self._bucket_exists():
                self._throw("Blob storage bucket/container doesn't exist")

            for file_path in file_list:
                ext = Path(file_path).suffix
                if ext not in [".json", ".npy", ".parquet", ".csv"]:
                    continue

                relative_file_path = str(file_path).replace(str(super().data_path), "")
                minio_file_path = str(
                    Path.joinpath(self._remote_path, relative_file_path.lstrip("/"))
                ).lstrip("/")

                if self._object_exists(minio_file_path):
                    logger.info(
                        f"Remote file '{minio_file_path}' already exists, will overwrite it"
                    )

                self._upload_object(object_name=minio_file_path, file_path=file_path)

                remote_files.append(str(minio_file_path))
                self._local_rm(file_path)
        except Exception as e:
            self._throw(f"Failed to upload files, error: {e}")

        logger.info(f"Successfully upload files: {file_list}")
        self._remote_files.append(remote_files)
        return remote_files

    @property
    def data_path(self):
        return self._remote_path

    @property
    def batch_files(self):
        return self._remote_files
