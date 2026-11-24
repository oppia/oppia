# coding: utf-8
#
# Copyright 2026 The Oppia Authors. All Rights Reserved.
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

"""Error classes for user domain objects."""

from __future__ import annotations

from core import utils


class UserDomainError(utils.ValidationError):
    """Base error class for user domain errors."""

    pass


class InvalidUserIdError(UserDomainError):
    """Error class for invalid user IDs."""

    pass


class InvalidStoryIdError(UserDomainError):
    """Error class for invalid story IDs."""

    pass


class InvalidCompletedNodeIdsError(UserDomainError):
    """Error class for invalid completed node IDs."""

    pass


class DuplicateCompletedNodeIdsError(UserDomainError):
    """Error class for duplicate completed node IDs."""

    pass
