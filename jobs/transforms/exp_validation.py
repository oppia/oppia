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

"""Beam DoFns and PTransforms to provide validation of exploration models."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.domain import exp_domain
from core.platform import models
from jobs.decorators import validation_decorators
from jobs.transforms import base_validation

(exp_models,) = models.Registry.import_models([models.NAMES.exploration])


@validation_decorators.AuditsExisting(
    exp_models.ExplorationSnapshotMetadataModel,
    exp_models.ExplorationCommitLogEntryModel)
class ValidateExplorationCommitCmdsSchema(
        base_validation.BaseValidateCommitCmdsSchema):
    """Overrides _get_change_domain_class for exploration models """

    def _get_change_domain_class(self, input_model): # pylint: disable=unused-argument
        """Returns a Change domain class.

        Args:
            input_model: datastore_services.Model. Entity to validate.

        Returns:
            change_domain.BaseChange. A domain object class for the
            changes made by commit commands of the model.
        """
        return exp_domain.ExplorationChange
