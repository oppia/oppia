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

"""Beam DoFns and PTransforms to provide validation of improvements models."""

from __future__ import annotations

from core.jobs import job_utils
from core.jobs.decorators import validation_decorators
from core.jobs.types import improvements_validation_errors
from core.platform import models

import apache_beam as beam

from typing import Iterator

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import improvements_models

(improvements_models,) = models.Registry.import_models(
    [models.Names.IMPROVEMENTS])


# TODO(#15613): Here we use MyPy ignore because the incomplete typing of
# apache_beam library and absences of stubs in Typeshed, forces MyPy to
# assume that DoFn class is of type Any. Thus to avoid MyPy's error (Class
# cannot subclass 'DoFn' (has type 'Any')), we added an ignore here.
@validation_decorators.AuditsExisting(
    improvements_models.ExplorationStatsTaskEntryModel
)
class ValidateCompositeEntityId(beam.DoFn):  # type: ignore[misc]
    """DoFn to validate the composite entity id."""

    def process(
        self, input_model: improvements_models.ExplorationStatsTaskEntryModel
    ) -> Iterator[improvements_validation_errors.InvalidCompositeEntityError]:
        """Function that checks if the composite entity id is valid

        Args:
            input_model: improvements_models.ExplorationStatsTaskEntryModel.
                Entity to validate.

        Yields:
            InvalidCompositeEntityError. Error for models with
            invalid composite entity.
        """
        model = job_utils.clone_model(input_model)
        expected_composite_entity_id = (
            improvements_models.ExplorationStatsTaskEntryModel
            .generate_composite_entity_id(
                model.entity_type, model.entity_id, model.entity_version))

        if model.composite_entity_id != expected_composite_entity_id:
            yield improvements_validation_errors.InvalidCompositeEntityError(
                model)
