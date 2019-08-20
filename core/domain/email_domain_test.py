# Copyright 2018 The Oppia Authors. All Rights Reserved.
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

"""Tests for domain objects for models relating to emails."""

from core.domain import email_domain
from core.tests import test_utils


class EmailDomainTest(test_utils.GenericTestBase):
    """Tests for email_domain classes."""
    def test_that_general_feedback_thread_reply_info_objects_are_created(self):
        obj = email_domain.FeedbackThreadReplyInfo(
            'user1.exploration.exp1.1', 'reply_to_id1')
        self.assertEqual(obj.id, 'user1.exploration.exp1.1')
        self.assertEqual(obj.reply_to_id, 'reply_to_id1')
        self.assertEqual(obj.user_id, 'user1')
        self.assertEqual(obj.entity_type, 'exploration')
        self.assertEqual(obj.entity_id, 'exp1')
        self.assertEqual(obj.thread_id, 'exploration.exp1.1')
