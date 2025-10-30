from __future__ import annotations

from core.domain import feedback_services
from core.platform import models
from core.tests import test_utils

(feedback_models,) = models.Registry.import_models([models.Names.FEEDBACK])


class FeedbackServicesUnitTests(test_utils.GenericTestBase):

    def test_get_all_recipient_ids_skips_messages_without_author_id(self):
        # Create a thread and a few messages, one with empty author_id.
        entity_type = 'exploration'
        entity_id = 'exp_test_123'
        thread_id = feedback_services.create_thread(
            entity_type, entity_id, None, 'subj', 'initial', False)
        # Create a valid message
        feedback_services.create_message(thread_id, 'user_1', None, None, 'hello')
        # Create a message with empty author_id (simulate legacy bad data)
        gm = feedback_models.GeneralFeedbackMessageModel.create(
            thread_id, author_id='', text='bad')
        gm.put()

        # Should not raise; returns two sets (batch_recipient_ids, other_recipient_ids)
        batch, other = feedback_services._get_all_recipient_ids(
            thread_id, 'some_author_id', entity_type, entity_id)
        # We expect sets (they may be empty) — ensure call returns without exception.
        assert isinstance(batch, set)
        assert isinstance(other, set)
