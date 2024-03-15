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

from __future__ import annotations

from core.domain import platform_parameter_domain as parameter_domain
from core.jobs.decorators import validation_decorators
from core.jobs.transforms.validation import base_validation
from core.platform import models

from typing import Type

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import config_models

(config_models,) = models.Registry.import_models([models.Names.CONFIG])


@validation_decorators.AuditsExisting(
    config_models.PlatformParameterSnapshotMetadataModel)
class ValidatePlatformParameterSnapshotMetadataModel(
    base_validation.BaseValidateCommitCmdsSchema[
        config_models.PlatformParameterSnapshotMetadataModel
    ]
):
    """Overrides _get_change_domain_class for
    PlatformParameterSnapshotMetadataModel.
    """

    def _get_change_domain_class(
        self, input_model: config_models.PlatformParameterSnapshotMetadataModel  # pylint: disable=unused-argument
    ) -> Type[parameter_domain.PlatformParameterChange]:
        """Returns a change domain class.

        Args:
            input_model: datastore_services.Model. Entity to validate.

        Returns:
            parameter_domain.PlatformParameterChange. A domain object class
            for the changes made by commit commands of the model.
        """
        return parameter_domain.PlatformParameterChange
