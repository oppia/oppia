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

"""Error classes for model audits."""

from __future__ import annotations

from core import feconf
from core import utils
from core.jobs import job_utils
from core.jobs.types import job_run_result


class BaseAuditError(job_run_result.JobRunResult):
    """Base class for model audit errors."""

    def __init__(self, message, model_or_kind, model_id=None):
        """Initializes a new audit error.

        Args:
            message: str. The message describing the error.
            model_or_kind: Model|bytes. If model_id is not provided, then this
                is a model (type: BaseModel).
                Otherwise, this is a model's kind (type: bytes).
            model_id: bytes|None. The model's ID, or None when model_or_kind is
                a model.

        Raises:
            TypeError. When the input message is not a string.
            ValueError. When the input message is empty.
        """
        if not isinstance(message, str):
            raise TypeError('message must be a string')

        if not message:
            raise ValueError('message must be a non-empty string')

        if model_id is None:
            model_id = job_utils.get_model_id(model_or_kind)
            model_kind = job_utils.get_model_kind(model_or_kind)
        else:
            model_kind = model_or_kind

        error_message = '%s in %s(id=%s): %s' % (
            self.__class__.__name__,
            model_kind, utils.quoted(model_id), message)

        super().__init__(stderr=error_message)


class InconsistentTimestampsError(BaseAuditError):
    """Error class for models with inconsistent timestamps."""

    def __init__(self, model):
        message = 'created_on=%r is later than last_updated=%r' % (
            model.created_on, model.last_updated)
        super().__init__(message, model)


class InvalidCommitStatusError(BaseAuditError):
    """Error class for commit models with inconsistent status values."""

    def __init__(self, model):
        message = 'post_commit_status is %s' % model.post_commit_status
        super().__init__(message, model)


class InvalidPublicCommitStatusError(BaseAuditError):
    """Error class for commit models with inconsistent public status values."""

    def __init__(self, model):
        message = (
            'post_commit_status=%s but post_commit_community_owned=%s' % (
                model.post_commit_status, model.post_commit_community_owned))
        super().__init__(message, model)


class InvalidPrivateCommitStatusError(BaseAuditError):
    """Error class for commit models with inconsistent private status values."""

    def __init__(self, model):
        message = (
            'post_commit_status=%s but post_commit_is_private=%r' % (
                model.post_commit_status, model.post_commit_is_private))
        super().__init__(message, model)


class ModelMutatedDuringJobError(BaseAuditError):
    """Error class for models mutated during a job."""

    def __init__(self, model):
        message = (
            'last_updated=%r is later than the audit job\'s start time' % (
                model.last_updated))
        super().__init__(message, model)


class ModelIdRegexError(BaseAuditError):
    """Error class for models with ids that fail to match a regex pattern."""

    def __init__(self, model, regex_string):
        message = 'id does not match the expected regex=%s' % (
            utils.quoted(regex_string))
        super().__init__(message, model)


class ModelDomainObjectValidateError(BaseAuditError):
    """Error class for domain object validation errors."""

    def __init__(self, model, error_message):
        message = 'Entity fails domain validation with the error: %s' % (
            error_message)
        super().__init__(message, model)


class ModelExpiredError(BaseAuditError):
    """Error class for expired models."""

    def __init__(self, model):
        message = 'deleted=True when older than %s days' % (
            feconf.PERIOD_TO_HARD_DELETE_MODELS_MARKED_AS_DELETED.days)
        super().__init__(message, model)


class InvalidCommitTypeError(BaseAuditError):
    """Error class for commit_type validation errors."""

    def __init__(self, model):
        message = 'Commit type %s is not allowed' % model.commit_type
        super().__init__(message, model)


class ModelRelationshipError(BaseAuditError):
    """Error class for models with invalid relationships."""

    def __init__(self, id_property, model_id, target_kind, target_id):
        """Initializes a new ModelRelationshipError.

        Args:
            id_property: ModelProperty. The property referring to the ID of the
                target model.
            model_id: bytes. The ID of the model with problematic ID property.
            target_kind: str. The kind of model the property refers to.
            target_id: bytes. The ID of the specific model that the property
                refers to. NOTE: This is the value of the ID property.
        """
        # NOTE: IDs are converted to bytes because that's how they're read from
        # and written to the datastore.
        message = (
            '%s=%s should correspond to the ID of an existing %s, but no such '
            'model exists' % (
                id_property, utils.quoted(target_id), target_kind))
        super().__init__(
            message, id_property.model_kind, model_id=model_id)


class CommitCmdsNoneError(BaseAuditError):
    """Error class for None Commit Cmds."""

    def __init__(self, model):
        message = (
            'No commit command domain object defined for entity with commands: '
            '%s' % model.commit_cmds)
        super().__init__(message, model)


class CommitCmdsValidateError(BaseAuditError):
    """Error class for wrong commit cmmds."""

    def __init__(self, model, commit_cmd_dict, e):
        message = (
            'Commit command domain validation for command: %s failed with '
            'error: %s' % (commit_cmd_dict, e))
        super().__init__(message, model)
