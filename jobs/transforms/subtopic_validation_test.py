from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from jobs.transforms import subtopic_validation

from core.tests import test_utils
from jobs.decorators import validation_decorators


class RelationshipsOfTests(test_utils.TestBase):
    def test_subtopic_page_commit_log_entry_model_relationships(self):
        self.assertItemsEqual(
            validation_decorators.RelationshipsOf.get_model_kind_references(
                'SubtopicPageCommitLogEntryModel', 'subtopic_page_id'),
            ['SubtopicPageModel'])
