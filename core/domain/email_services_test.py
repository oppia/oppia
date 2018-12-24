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

""" Tests for services relating to emails."""

from core.domain import email_services
from core.platform import models
from core.tests import test_utils

(email_models,) = models.Registry.import_models([models.NAMES.email])


class EmailServicesTest(test_utils.GenericTestBase):
    """Tests for email_services functions."""
    def test_reply_info_email_objects_are_created_and_queried_correctly(self):
        model = email_models.GeneralFeedbackEmailReplyToIdModel.create(
            'user1', 'exploration.exp1.1')
        model.put()
        reply_to_id = model.reply_to_id
        queried_object = (
            email_services.get_feedback_thread_reply_info_by_reply_to_id(
                reply_to_id))

        self.assertEqual(queried_object.reply_to_id, reply_to_id)
        self.assertEqual(queried_object.id, 'user1.exploration.exp1.1')

        queried_object = (
            email_services.get_feedback_thread_reply_info_by_reply_to_id(
                'unknown.reply.to.id'))
        self.assertEqual(queried_object, None)

        queried_object = (
            email_services
            .get_feedback_thread_reply_info_by_user_and_thread_ids(
                'user1', 'exploration.exp1.1'))

        self.assertEqual(queried_object.reply_to_id, reply_to_id)
        self.assertEqual(queried_object.id, 'user1.exploration.exp1.1')

        queried_object = (
            email_services
            .get_feedback_thread_reply_info_by_user_and_thread_ids(
                'user_unknown', 'invalid_thread_id'))

        self.assertEqual(queried_object, None)
