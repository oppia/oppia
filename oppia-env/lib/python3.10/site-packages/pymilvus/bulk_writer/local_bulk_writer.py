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
import threading
import time
import uuid
from pathlib import Path
from threading import Lock, Thread
from typing import Callable, Optional

from pymilvus.orm.schema import CollectionSchema

from .bulk_writer import BulkWriter
from .constants import (
    MB,
    BulkFileType,
)

logger = logging.getLogger(__name__)


class LocalBulkWriter(BulkWriter):
    def __init__(
        self,
        schema: CollectionSchema,
        local_path: str,
        chunk_size: int = 128 * MB,
        file_type: BulkFileType = BulkFileType.PARQUET,
        config: Optional[dict] = None,
        **kwargs,
    ):
        super().__init__(schema, chunk_size, file_type, config, **kwargs)
        self._local_path = local_path
        self._uuid = str(uuid.uuid4())
        self._flush_count = 0
        self._working_thread = {}
        self._working_thread_lock = Lock()
        self._local_files = []

        self._make_dir()

    @property
    def uuid(self):
        return self._uuid

    def __enter__(self):
        return self

    def __exit__(self, exc_type: object, exc_val: object, exc_tb: object):
        self._exit()

    def __del__(self):
        self._exit()

    def _exit(self):
        # wait flush thread
        if len(self._working_thread) > 0:
            for k, th in self._working_thread.items():
                logger.info(f"Wait flush thread '{k}' to finish")
                th.join()

        self._rm_dir()

    def _make_dir(self):
        Path(self._local_path).mkdir(exist_ok=True)
        logger.info(f"Data path created: {self._local_path}")

        uidir = Path(self._local_path).joinpath(self._uuid)
        self._local_path = uidir
        Path(uidir).mkdir(exist_ok=True)
        logger.info(f"Data path created: {uidir}")

    def _rm_dir(self):
        # remove the uuid folder if it is empty
        if Path(self._local_path).exists() and not any(Path(self._local_path).iterdir()):
            Path(self._local_path).rmdir()
            logger.info(f"Delete local directory '{self._local_path}'")

    def append_row(self, row: dict, **kwargs):
        super().append_row(row, **kwargs)

        # only one thread can enter this section to persist data,
        # in the _flush() method, the buffer will be swapped to a new one.
        # in anync mode, the flush thread is asynchronously, other threads can
        # continue to append if the new buffer size is less than target size
        with self._working_thread_lock:
            if super().buffer_size > super().chunk_size:
                self.commit(_async=True)

    def commit(self, **kwargs):
        # _async=True, the flush thread is asynchronously
        while len(self._working_thread) > 0:
            logger.info(
                f"Previous flush action is not finished, {threading.current_thread().name} is waiting..."
            )
            time.sleep(1.0)

        logger.info(
            f"Prepare to flush buffer, row_count: {super().buffer_row_count}, size: {super().buffer_size}"
        )
        _async = kwargs.get("_async", False)
        call_back = kwargs.get("call_back")

        x = Thread(target=self._flush, args=(call_back,))
        logger.info(f"Flush thread begin, name: {x.name}")
        self._working_thread[x.name] = x
        x.start()
        if not _async:
            logger.info("Wait flush to finish")
            x.join()

        super().commit()  # reset the buffer size
        logger.info(f"Commit done with async={_async}")

    def _flush(self, call_back: Optional[Callable] = None):
        try:
            self._flush_count = self._flush_count + 1
            target_path = Path.joinpath(self._local_path, str(self._flush_count))

            old_buffer = super()._new_buffer()
            if old_buffer.row_count > 0:
                file_list = old_buffer.persist(
                    local_path=str(target_path),
                    buffer_size=self.buffer_size,
                    buffer_row_count=self.buffer_row_count,
                )
                self._local_files.append(file_list)
                if call_back:
                    call_back(file_list)
        except Exception as e:
            logger.error(f"Failed to fulsh, error: {e}")
            raise e from e
        finally:
            del self._working_thread[threading.current_thread().name]
            logger.info(f"Flush thread finished, name: {threading.current_thread().name}")

    @property
    def data_path(self):
        return self._local_path

    @property
    def batch_files(self):
        return self._local_files
