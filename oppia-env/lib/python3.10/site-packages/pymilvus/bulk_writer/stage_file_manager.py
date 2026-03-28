import logging
import threading
import time
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from pathlib import Path

import urllib3
from minio import Minio
from minio.error import S3Error

from pymilvus.bulk_writer.file_utils import FileUtils
from pymilvus.bulk_writer.stage_restful import apply_stage

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class StageFileManager:
    def __init__(self, cloud_endpoint: str, api_key: str, stage_name: str):
        """
        private preview feature. Please submit a request and contact us if you need it.

        Args:
            cloud_endpoint (str): The fixed cloud endpoint URL.
                - For international regions: https://api.cloud.zilliz.com
                - For regions in China: https://api.cloud.zilliz.com.cn
            api_key (str): The API key associated with your organization
            stage_name (str): The name of the Stage.
        """
        self.cloud_endpoint = cloud_endpoint
        self.api_key = api_key
        self.stage_name = stage_name
        self.local_file_paths = []
        self.total_bytes = 0
        self.stage_info = {}
        self._client = None

    def _convert_dir_path(self, input_path: str):
        if not input_path or input_path == "/":
            return ""
        if input_path.endswith("/"):
            return input_path
        return input_path + "/"

    def _refresh_stage_and_client(self, path: str):
        logger.info("refreshing stage info...")
        response = apply_stage(self.cloud_endpoint, self.api_key, self.stage_name, path)
        self.stage_info = response.json()["data"]
        logger.info("stage info refreshed.")

        creds = self.stage_info["credentials"]
        http_client = urllib3.PoolManager(maxsize=100)
        self._client = Minio(
            endpoint=self.stage_info["endpoint"],
            access_key=creds["tmpAK"],
            secret_key=creds["tmpSK"],
            session_token=creds["sessionToken"],
            region=self.stage_info["region"],
            secure=True,
            http_client=http_client,
        )
        logger.info("storage client refreshed")

    def _validate_size(self):
        file_size_total = self.total_bytes
        file_size_limit = self.stage_info["condition"]["maxContentLength"]
        if file_size_total > file_size_limit:
            error_message = (
                f"localFileTotalSize {file_size_total} exceeds "
                f"the maximum contentLength limit {file_size_limit} defined in the condition."
                f"If you want to upload larger files, please contact us to lift the restriction."
            )
            raise ValueError(error_message)

    def upload_file_to_stage(self, source_file_path: str, target_stage_path: str):
        """
        uploads a local file or directory to the specified path within the Stage.

        Args:
            source_file_path: the source local file or directory path
            target_stage_path: the target directory path in the Stage
        Raises:
            Exception: If an error occurs during the upload process.
        """

        self.local_file_paths, self.total_bytes = FileUtils.process_local_path(source_file_path)
        stage_path = self._convert_dir_path(target_stage_path)
        self._refresh_stage_and_client(stage_path)
        self._validate_size()

        file_count = len(self.local_file_paths)
        logger.info(
            f"begin to upload file to stage, localDirOrFilePath:{source_file_path}, fileCount:{file_count} to stageName:{self.stage_name}, stagePath:{stage_path}"
        )
        start_time = time.time()

        uploaded_bytes = 0
        uploaded_count = 0
        root_path = Path(source_file_path).resolve()
        uploaded_bytes_lock = threading.Lock()

        def _upload_task(file_path: str, root_path: Path, stage_path: str):
            nonlocal uploaded_bytes
            nonlocal uploaded_count
            path_obj = Path(file_path).resolve()
            if root_path.is_file():
                relative_path = path_obj.name
            else:
                relative_path = path_obj.relative_to(root_path).as_posix()

            stage_prefix = f"{self.stage_info['stagePrefix']}"
            file_start_time = time.time()
            try:
                size = Path(file_path).stat().st_size
                logger.info(f"uploading file, fileName:{file_path}, size:{size} bytes")
                remote_file_path = stage_prefix + stage_path + relative_path
                self._put_object(file_path, remote_file_path, stage_path)
                with uploaded_bytes_lock:
                    uploaded_bytes += size
                    uploaded_count += 1
                percent = uploaded_bytes / self.total_bytes * 100
                elapsed = time.time() - file_start_time
                logger.info(
                    f"Uploaded file, {uploaded_count}/{file_count}: {file_path}, elapsed:{elapsed} s, {uploaded_bytes}/{self.total_bytes} bytes, progress: {percent:.2f}%"
                )
            except S3Error as e:
                logger.error(f"Failed to upload {file_path}: {e!s}")
                raise

        with ThreadPoolExecutor(max_workers=20) as executor:
            futures = []
            for _, file_path in enumerate(self.local_file_paths):
                futures.append(executor.submit(_upload_task, file_path, root_path, stage_path))
            for f in futures:
                f.result()  # wait for all

        total_elapsed = time.time() - start_time
        logger.info(
            f"All files in {source_file_path} uploaded to stage, "
            f"stageName:{self.stage_info['stageName']}, stagePath: {stage_path}, "
            f"totalFileCount:{file_count}, totalFileSize:{self.total_bytes}, cost time:{total_elapsed}s"
        )
        return {"stageName": self.stage_info["stageName"], "path": stage_path}

    def _put_object(self, file_path: str, remote_file_path: str, stage_path: str):
        expire_time_str = self.stage_info["credentials"]["expireTime"]
        expire_time = datetime.fromisoformat(expire_time_str.replace("Z", "+00:00"))

        now = datetime.now(timezone.utc)
        if now > expire_time:
            self._refresh_stage_and_client(stage_path)

        self._upload_with_retry(file_path, remote_file_path, stage_path)

    def _upload_with_retry(
        self, file_path: str, object_name: str, stage_path: str, max_retries: int = 5
    ):
        attempt = 0
        while attempt < max_retries:
            try:
                self._client.fput_object(
                    bucket_name=self.stage_info["bucketName"],
                    object_name=object_name,
                    file_path=file_path,
                )
                break
            except Exception as e:
                attempt += 1
                logger.warning(f"Attempt {attempt} failed to upload {file_path}: {e}")
                self._refresh_stage_and_client(stage_path)

                if attempt == max_retries:
                    error_message = f"Upload failed after {max_retries} attempts"
                    raise RuntimeError(error_message) from e

                time.sleep(5)
