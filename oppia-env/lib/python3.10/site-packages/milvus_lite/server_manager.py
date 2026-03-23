# Copyright (C) 2019-2024 Zilliz. All rights reserved.
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

from typing import Optional
import threading
import logging
import pathlib

from milvus_lite.server import Server


logger = logging.getLogger()


class ServerManager:
    def __init__(self):
        self._lock = threading.Lock()
        self._servers = {}

    def start_and_get_uri(self, path: str, args=None) -> Optional[str]:
        path = pathlib.Path(path).absolute().resolve()
        with self._lock:
            if str(path) not in self._servers:
                s = Server(str(path), args)
                if not s.init():
                    return None
                if not s.start():
                    return None
                self._servers[str(path)] = s
            return self._servers[str(path)].uds_path

    def release_server(self, path: str):
        path = pathlib.Path(path).absolute().resolve()
        with self._lock:
            if str(path) not in self._servers:
                logger.warning("No local milvus in path %s", str(path))
                return
            self._servers[str(path)].stop()
            del self._servers[str(path)]

    def release_all(self):
        for s in self._servers.values():
            s.stop()
        self._servers = {}

    def __del__(self):
        with self._lock:
            self.release_all()


server_manager_instance = ServerManager()
