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

"""Beam DoFns and PTransforms to provide validation of feedback models."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.domain import feedback_services
from core.platform import models
from jobs import job_utils
from jobs.decorators import validation_decorators
from jobs.types import feedback_validation_errors


import apache_beam as beam

(feedback_models,) = models.Registry.import_models([models.NAMES.feedback])


@validation_decorators.AuditsExisting(
    feedback_models.GeneralFeedbackThreadModel)
class ValidateEntityType(beam.DoFn):
    """DoFn to validate the entity type."""

    def process(self, input_model):
        """Function that checks if the entity type is valid

        Args:
            input_model: feedback_models.GeneralFeedbackThreadModel.
                Entity to validate.

        Yields:
            InvalidEntityTypeError. Error for models with invalid entity type.
        """
        model = job_utils.clone_model(input_model)
        if (model.entity_type not in
                feedback_services.TARGET_TYPE_TO_TARGET_MODEL):
            yield feedback_validation_errors.InvalidEntityTypeError(model)
