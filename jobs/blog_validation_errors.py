# coding: utf-8
#
# Copyright 2021 The Oppia Authors. All Rights Reserved.
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

"""Error classes for blog model audits."""

from __future__ import absolute_import
from __future__ import unicode_literals

from jobs.types import base_validation_errors
import utils

from typing import Any # pylint: disable=unused-import


class DuplicateBlogTitleError(base_validation_errors.BaseAuditError):
    """Error class for blog posts with duplicate titles."""

    def __init__(self, model):
        # type: (Any) -> None # type: ignore[no-any-return]
        message = 'title=%s is not unique' % utils.quoted(model.title)
        super( # type: ignore[no-untyped-call]
            DuplicateBlogTitleError, self).__init__(message, model)


class DuplicateBlogUrlError(base_validation_errors.BaseAuditError):
    """Error class for blog posts with duplicate urls."""

    def __init__(self, model):
        # type: (Any) -> None # type: ignore[no-any-return]
        message = 'url=%s is not unique' % utils.quoted(model.url_fragment)
        super( # type: ignore[no-untyped-call]
            DuplicateBlogUrlError, self).__init__(message, model)


class InconsistentPublishTimestampsError(base_validation_errors.BaseAuditError):
    """Error class for models with inconsistent timestamps."""

    def __init__(self, model):
        # type: (Any) -> None # type: ignore[no-any-return]
        message = 'created_on=%r is later than published_on=%r' % (
            model.created_on, model.published_on)
        super( # type: ignore[no-untyped-call]
            InconsistentPublishTimestampsError, self).__init__(message, model)


class InconsistentPublishLastUpdatedTimestampsError(
        base_validation_errors.BaseAuditError):
    """Error class for models with inconsistent timestamps."""

    def __init__(self, model):
        # type: (Any) -> None # type: ignore[no-any-return]
        message = 'published_on=%r is later than last_updated=%r' % (
            model.published_on, model.last_updated)
        super( # type: ignore[no-untyped-call]
            InconsistentPublishLastUpdatedTimestampsError, self
            ).__init__(message, model)


class ModelMutatedDuringJobError(base_validation_errors.BaseAuditError):
    """Error class for models mutated during a job."""

    def __init__(self, model):
        # type: (Any) -> None # type: ignore[no-any-return]
        message = (
            'published_on=%r is later than the audit job\'s start time' % (
                model.published_on))
        super( # type: ignore[no-untyped-call]
            ModelMutatedDuringJobError, self).__init__(message, model)
