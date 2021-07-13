"""Beam DoFns and PTransforms to provide validation of story models."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from jobs.decorators import validation_decorators
from core.platform import models

(story_models,) = models.Registry.import_models([models.NAMES.story])


@validation_decorators.RelationshipsOf(story_models.StoryCommitLogEntryModel)
def story_commit_log_entry_model_relationships(model):
    """Yields how the properties of the model relates to the ID of others."""
    yield model.story_id, [story_models.StoryModel]


@validation_decorators.RelationshipsOf(story_models.StorySummaryModel)
def story_summary_model_relationships(model):
    """Yields how the properties of the model relates to the ID of others."""
    yield model.id, [story_models.StoryModel]

