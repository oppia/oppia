import logging
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional

from pymilvus.bulk_writer.stage_file_manager import StageFileManager
from pymilvus.orm.schema import CollectionSchema

from .constants import MB, BulkFileType
from .local_bulk_writer import LocalBulkWriter

logger = logging.getLogger(__name__)


class StageBulkWriter(LocalBulkWriter):
    """StageBulkWriter handles writing local bulk files to a remote stage."""

    def __init__(
        self,
        schema: CollectionSchema,
        remote_path: str,
        cloud_endpoint: str,
        api_key: str,
        stage_name: str,
        chunk_size: int = 1024 * MB,
        file_type: BulkFileType = BulkFileType.PARQUET,
        config: Optional[dict] = None,
        **kwargs,
    ):
        local_path = Path(sys.argv[0]).resolve().parent / "bulk_writer"
        super().__init__(schema, str(local_path), chunk_size, file_type, config, **kwargs)

        remote_dir_path = Path(remote_path) / super().uuid
        self._remote_path = str(remote_dir_path) + "/"
        self._remote_files: List[List[str]] = []
        self._stage_name = stage_name
        self._stage_file_manager = StageFileManager(
            cloud_endpoint=cloud_endpoint, api_key=api_key, stage_name=stage_name
        )

        logger.info(f"Remote buffer writer initialized, target path: {self._remote_path}")

    def __enter__(self):
        return self

    def append_row(self, row: Dict[str, Any], **kwargs):
        super().append_row(row, **kwargs)

    def commit(self, **kwargs):
        """Commit local bulk files and upload to remote stage."""
        super().commit(call_back=self._upload)

    @property
    def data_path(self) -> str:
        return str(self._remote_path)

    @property
    def batch_files(self) -> List[List[str]]:
        return self._remote_files

    def get_stage_upload_result(self) -> Dict[str, str]:
        return {"stage_name": self._stage_name, "path": str(self._remote_path)}

    def __exit__(self, exc_type: object, exc_val: object, exc_tb: object):
        super().__exit__(exc_type, exc_val, exc_tb)
        parent_dir = Path(self._local_path).parent
        if parent_dir.exists() and not any(parent_dir.iterdir()):
            parent_dir.rmdir()
            logger.info(f"Deleted empty directory '{parent_dir}'")

    def _local_rm(self, file_path: str):
        """Delete local file and possibly its empty parent directory."""
        try:
            path = Path(file_path)
            path.unlink()
            parent_dir = path.parent
            if parent_dir != Path(self._local_path) and not any(parent_dir.iterdir()):
                parent_dir.rmdir()
                logger.info(f"Deleted empty directory '{parent_dir}'")
        except Exception:
            logger.warning(f"Failed to delete local file: {file_path}")

    def _upload(self, file_list: List[str]) -> List[str]:
        """Upload files to remote stage and remove local copies."""
        uploaded_files: List[str] = []

        for file_path in file_list:
            path = Path(file_path)
            relative_file_path = path.relative_to(super().data_path)
            remote_file_path = self._remote_path / relative_file_path

            try:
                self._upload_object(file_path=str(path), object_name=str(remote_file_path))
                uploaded_files.append(str(remote_file_path))
                self._local_rm(str(path))
            except Exception as e:
                self._throw(f"Failed to upload file '{file_path}', error: {e}")

        logger.info(f"Successfully uploaded files: {uploaded_files}")
        self._remote_files.append(uploaded_files)
        return uploaded_files

    def _upload_object(self, file_path: str, object_name: str):
        logger.info(f"Prepare to upload '{file_path}' to '{object_name}'")
        self._stage_file_manager.upload_file_to_stage(file_path, self._remote_path)
        logger.info(f"Uploaded file '{file_path}' to '{object_name}'")
