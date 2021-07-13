"""Beam DoFns and PTransforms to provide validation of subtopic models."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from jobs.decorators import validation_decorators
from core.platform import models

(subtopic_models,) = models.Registry.import_models([models.NAMES.subtopic])


@validation_decorators.RelationshipsOf(
    subtopic_models.SubtopicPageCommitLogEntryModel)
def subtopic_page_commit_log_entry_model_relationships(model):
    """Yields how the properties of the model relates to the ID of others."""
    yield model.subtopic_page_id, [subtopic_models.SubtopicPageModel]
