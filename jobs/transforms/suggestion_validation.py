"""Beam DoFns and PTransforms to provide validation of suggestion models."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from jobs.decorators import validation_decorators
from core.platform import models

(suggestion_models, feedback_models) = models.Registry.import_models(
    [models.NAMES.suggestion, models.NAMES.feedback])


@validation_decorators.RelationshipsOf(
    suggestion_models.GeneralSuggestionModel)
def general_suggestion_model_relationships(model):
    """Yields how the properties of the model relates to the ID of others."""
    yield model.id, [feedback_models.GeneralFeedbackThreadModel]
