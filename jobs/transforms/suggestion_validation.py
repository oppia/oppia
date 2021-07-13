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

"""Beam DoFns and PTransforms to provide validation of suggestion models."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.platform import models
from jobs.decorators import validation_decorators

(suggestion_models, feedback_models) = models.Registry.import_models(
    [models.NAMES.suggestion, models.NAMES.feedback])


@validation_decorators.RelationshipsOf(
    suggestion_models.GeneralSuggestionModel)
def general_suggestion_model_relationships(model):
    """Yields how the properties of the model relates to the ID of others."""
    yield model.id, [feedback_models.GeneralFeedbackThreadModel]
