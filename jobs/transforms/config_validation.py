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

"""Beam DoFns and PTransforms to provide validation of config models."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.domain import config_domain
from core.domain import platform_parameter_domain as parameter_domain
from core.platform import models
from jobs.decorators import validation_decorators
from jobs.transforms import base_validation

(config_models,) = models.Registry.import_models([models.NAMES.config])


@validation_decorators.AuditsExisting(
    config_models.ConfigPropertySnapshotMetadataModel)
class ValidateConfigCommitCmdsSchema(
        base_validation.BaseValidateCommitCmdsSchema):
    """Overrides _get_change_domain_class for config models."""

    def _get_change_domain_class(self, input_model): # pylint: disable=unused-argument
        """Returns a Change domain class.

        Args:
            input_model: datastore_services.Model. Entity to validate.

        Returns:
            change_domain.BaseChange. A domain object class for the
            changes made by commit commands of the model.
        """
        return config_domain.ConfigPropertyChange


@validation_decorators.AuditsExisting(
    config_models.PlatformParameterSnapshotMetadataModel)
class ValidatePlatformParameterCommitCmdsSchema(
        base_validation.BaseValidateCommitCmdsSchema):
    """Overrides _get_change_domain_class for platform parameter models."""

    def _get_change_domain_class(self, input_model): # pylint: disable=unused-argument
        """Returns a Change domain class.

        Args:
            input_model: datastore_services.Model. Entity to validate.

        Returns:
            change_domain.BaseChange. A domain object class for the
            changes made by commit commands of the model.
        """
        return parameter_domain.PlatformParameterChange
