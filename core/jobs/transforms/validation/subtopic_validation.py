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

"""Beam DoFns and PTransforms to provide validation of subtopic models."""

from __future__ import annotations

from core.domain import subtopic_page_domain
from core.jobs import job_utils
from core.jobs.decorators import validation_decorators
from core.jobs.transforms.validation import base_validation
from core.platform import models

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import subtopic_models

(subtopic_models,) = models.Registry.import_models([models.NAMES.subtopic])


@validation_decorators.AuditsExisting(
    subtopic_models.SubtopicPageSnapshotMetadataModel)
class ValidateSubtopicPageSnapshotMetadataModel(
        base_validation.BaseValidateCommitCmdsSchema):
    """Overrides _get_change_domain_class for SubtopicPageSnapshotMetadataModel.
    """

    def _get_change_domain_class(self, unused_input_model): # pylint: disable=unused-argument
        """Returns a change domain class.

        Args:
            unused_input_model: datastore_services.Model. Entity to validate.

        Returns:
            subtopic_page_domain.SubtopicPageChange. A domain object class for
            the changes made by commit commands of the model.
        """
        return subtopic_page_domain.SubtopicPageChange


@validation_decorators.AuditsExisting(
    subtopic_models.SubtopicPageCommitLogEntryModel)
class ValidateSubtopicPageCommitLogEntryModel(
        base_validation.BaseValidateCommitCmdsSchema):
    """Overrides _get_change_domain_class for SubtopicPageCommitLogEntryModel.
    """

    def _get_change_domain_class(self, input_model):
        """Returns a change domain class.

        Args:
            input_model: datastore_services.Model. Entity to validate.

        Returns:
            subtopic_page_domain.SubtopicPageChange. A domain object class for
            the changes made by commit commands of the model.
        """
        model = job_utils.clone_model(input_model)
        if model.id.startswith('subtopicpage'):
            return subtopic_page_domain.SubtopicPageChange
        else:
            return None
