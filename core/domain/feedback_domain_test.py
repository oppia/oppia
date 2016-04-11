# coding: utf-8
#
# Copyright 2014 The Oppia Authors. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, softwar
# distributed under the License is distributed on an "AS-IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Tests for feedback domain objects."""

import datetime

from core.domain import feedback_domain
from core.domain import user_services
from core.tests import test_utils
import utils

class FeedbackDomainUnitTests(test_utils.GenericTestBase):
    EXP_ID = 'exp0'
    THREAD_ID = 'thread0'
    FULL_THREAD_ID = EXP_ID + '.' + THREAD_ID

    def setUp(self):
        super(FeedbackDomainUnitTests, self).setUp()

        self.viewer_id = self.get_user_id_from_email(self.VIEWER_EMAIL)
        user_services.get_or_create_user(self.viewer_id, self.VIEWER_EMAIL)
        self.signup(self.VIEWER_EMAIL, self.VIEWER_USERNAME)

    def test_to_dict(self):
        fake_date = datetime.datetime(2016, 4, 10, 0, 0, 0, 0)
        expected_thread = {
            'thread_id': self.THREAD_ID,
            'status': u'open',
            'state_name': u'a_state_name',
            'summary': None,
            'original_author_username': self.VIEWER_USERNAME,
            'subject': u'a subject',
            'last_updated': utils.get_time_in_millisecs(fake_date)
        }
        thread = feedback_domain.FeedbackThread(
            self.FULL_THREAD_ID, self.EXP_ID, expected_thread['state_name'],
            self.viewer_id, expected_thread['status'],
            expected_thread['subject'], expected_thread['summary'],
            False, fake_date, fake_date)
        self.assertDictContainsSubset(expected_thread, thread.to_dict())

    def test_get_exp_id_from_full_thread_id(self):
        feedback_thread_cl = feedback_domain.FeedbackThread
        self.assertEqual(feedback_thread_cl.get_exp_id_from_full_thread_id(
            self.FULL_THREAD_ID), self.EXP_ID)

    def test_get_thread_id_from_full_thread_id(self):
        feedback_thread_cl = feedback_domain.FeedbackThread
        self.assertEqual(feedback_thread_cl.get_thread_id_from_full_thread_id(
            self.FULL_THREAD_ID), self.THREAD_ID)
