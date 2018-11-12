# coding: utf-8
#
# Copyright 2017 The Oppia Authors. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS-IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Methods for returning the correct file system class to the client."""

from constants import constants
from core.domain import fs_domain


def get_exploration_file_system_class():
    """Returns ExplorationFileSystem class to the client if DEV_MODE is True.
    Otherwise, returns GcsFileSystem.

    Returns:
        class. The correct file system class (either ExplorationFileSystem or
            GcsFileSystem).
    """
    if constants.DEV_MODE:
        return fs_domain.ExplorationFileSystem
    else:
        return fs_domain.GcsFileSystem
