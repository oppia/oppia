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
from core.domain import change_domain
from core.jobs import job_utils
from core.jobs.types import job_run_result
from core.jobs.types import model_property
from core.platform import models

from typing import Mapping, Union

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import base_models

(base_models,) = models.Registry.import_models([models.Names.BASE_MODEL])


class BaseValidationError(job_run_result.JobRunResult):
    """Base class for model validation errors."""

    # TODO(#22338): Re-structure to remove passing model as a param.
    def __init__(self, message: str, model: base_models.BaseModel) -> None:
        """Initializes a new audit error.

        Args:
            message: str. The message describing the error.
            model: base_model.BaseModel. The model for which error is found.

        Raises:
            TypeError. When the input message is not a string.
            ValueError. When the input message is empty.
        """
        if not isinstance(message, str):
            raise TypeError('message must be a string')

        if not message:
            raise ValueError('message must be a non-empty string')

        model_id = job_utils.get_model_id(model)
        assert model_id is not None, 'Model ID should not be none'

        error_message = '%s in %s(id=%s): %s' % (
            self.__class__.__name__,
            job_utils.get_model_kind(model),
            utils.quoted(model_id),
            message
        )
        super().__init__(stderr=error_message)


class InconsistentTimestampsError(BaseValidationError):
    """Error class for models with inconsistent timestamps."""

    def __init__(self, model: base_models.BaseModel) -> None:
        message = 'created_on=%s is later than last_updated=%s' % (
            model.created_on.strftime('%Y-%m-%d %H:%M:%S'),
            model.last_updated.strftime('%Y-%m-%d %H:%M:%S'))
        super().__init__(message, model)


class InvalidCommitStatusError(BaseValidationError):
    """Error class for commit models with inconsistent status values."""

    def __init__(self, model: base_models.BaseCommitLogEntryModel) -> None:
        message = 'post_commit_status is %s' % model.post_commit_status
        super().__init__(message, model)


class InvalidPublicCommitStatusError(BaseValidationError):
    """Error class for commit models with inconsistent public status values."""

    def __init__(self, model: base_models.BaseCommitLogEntryModel) -> None:
        message = (
            'post_commit_status=%s but post_commit_community_owned=%s' % (
                model.post_commit_status, model.post_commit_community_owned))
        super().__init__(message, model)


class InvalidPrivateCommitStatusError(BaseValidationError):
    """Error class for commit models with inconsistent private status values."""

    def __init__(self, model: base_models.BaseCommitLogEntryModel) -> None:
        message = (
            'post_commit_status=%s but post_commit_is_private=%r' % (
                model.post_commit_status, model.post_commit_is_private))
        super().__init__(message, model)


class ModelMutatedDuringJobError(BaseValidationError):
    """Error class for models mutated during a job."""

    def __init__(self, model: base_models.BaseModel) -> None:
        message = (
            'last_updated=%s is later than the audit job\'s start time' % (
                model.last_updated.strftime('%Y-%m-%d %H:%M:%S')))
        super().__init__(message, model)


class ModelIdRegexError(BaseValidationError):
    """Error class for models with ids that fail to match a regex pattern."""

    def __init__(
        self, model: base_models.BaseModel, regex_string: str
    ) -> None:
        message = 'id does not match the expected regex=%s' % (
            utils.quoted(regex_string))
        super().__init__(message, model)


class ModelDomainObjectValidateError(BaseValidationError):
    """Error class for domain object validation errors."""

    def __init__(
        self, model: base_models.BaseModel, error_message: str
    ) -> None:
        message = 'Entity fails domain validation with the error: %s' % (
            error_message)
        super().__init__(message, model)


class ModelExpiredError(BaseValidationError):
    """Error class for expired models."""

    def __init__(self, model: base_models.BaseModel) -> None:
        message = 'deleted=True when older than %s days' % (
            feconf.PERIOD_TO_HARD_DELETE_MODELS_MARKED_AS_DELETED.days)
        super().__init__(message, model)


class InvalidCommitTypeError(BaseValidationError):
    """Error class for commit_type validation errors."""

    def __init__(
        self,
        model: Union[
            base_models.BaseCommitLogEntryModel,
            base_models.BaseSnapshotMetadataModel
        ]
    ) -> None:
        message = 'Commit type %s is not allowed' % model.commit_type
        super().__init__(message, model)


class ModelRelationshipError(BaseValidationError):
    """Error class for models with invalid relationships."""

    def __init__(
        self,
        id_property: model_property.ModelProperty,
        model: base_models.BaseModel,
        target_kind: str,
        target_id: str
    ) -> None:
        """Initializes a new ModelRelationshipError.

        Args:
            id_property: ModelProperty. The property referring to the ID of the
                target model.
            model: base_model.BaseModel. The the model with problematic ID
                property.
            target_kind: str. The kind of model the property refers to.
            target_id: str. The ID of the specific model that the property
                refers to. NOTE: This is the value of the ID property.
        """
        # NOTE: IDs are converted to bytes because that's how they're read from
        # and written to the datastore.
        message = (
            '%s=%s should correspond to the ID of an existing %s, but no such '
            'model exists' % (
                id_property, utils.quoted(target_id), target_kind))
        super().__init__(message, model)


class CommitCmdsNoneError(BaseValidationError):
    """Error class for None Commit Cmds."""

    def __init__(
        self,
        model: Union[
            base_models.BaseCommitLogEntryModel,
            base_models.BaseSnapshotMetadataModel
        ]
    ) -> None:
        message = (
            'No commit command domain object defined for entity with commands: '
            '%s' % model.commit_cmds)
        super().__init__(message, model)


class CommitCmdsValidateError(BaseValidationError):
    """Error class for wrong commit cmmds."""

    def __init__(
        self,
        model: Union[
            base_models.BaseCommitLogEntryModel,
            base_models.BaseSnapshotMetadataModel
        ],
        commit_cmd_dict: Mapping[str, change_domain.AcceptableChangeDictTypes],
        e: str
    ) -> None:
        message = (
            'Commit command domain validation for command: %s failed with '
            'error: %s' % (commit_cmd_dict, e))
        super().__init__(message, model)
