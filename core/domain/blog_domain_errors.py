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
"""Error classes for blog domain objects."""

from __future__ import annotations

from core import utils


class InvalidBlogPostIdError(utils.ValidationError):
    """Raised when a blog post ID does not have the expected length."""

    pass


class InvalidEditorIdError(utils.ValidationError):
    """Raised when a blog post editor ID is not a valid user ID."""

    pass


class DuplicateEditorIdError(utils.ValidationError):
    """Raised when a user appears more than once in a blog post's editors."""

    pass


class InvalidPublishedStatusError(utils.ValidationError):
    """Raised when a blog post's published status is not a boolean."""

    pass
