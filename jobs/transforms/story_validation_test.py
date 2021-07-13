from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from jobs.transforms import story_validation

from core.tests import test_utils
from jobs.decorators import validation_decorators


class RelationshipsOfTests(test_utils.TestBase):
    def test_story_commit_log_entry_model_relationships(self):
        self.assertItemsEqual(
            validation_decorators.RelationshipsOf.get_model_kind_references(
                'StoryCommitLogEntryModel', 'story_id'),
            ['StoryModel'])

    def test_story_summary_model_relationships(self):
        self.assertItemsEqual(
            validation_decorators.RelationshipsOf.get_model_kind_references(
                'StorySummaryModel', 'id'),
            ['StoryModel'])
