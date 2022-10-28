# coding: utf-8
#
# Copyright 2017 The Oppia Authors. All Rights Reserved.
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

"""Various load tests which ensure that the time for a particular process
is within a given limit.
"""

from __future__ import annotations

import time

from core import feconf
from core.domain import feedback_services
from core.tests import test_utils

from typing import Final, TypedDict


class ExpectedThreadDict(TypedDict):
    """Type for the EXPECTED_THREAD_DICT dictionary."""

    status: str
    summary: None
    original_author_username: None
    subject: str


class FeedbackThreadSummariesLoadTests(test_utils.GenericTestBase):

    EXP_ID_1: Final = 'eid1'

    EXPECTED_THREAD_DICT: ExpectedThreadDict = {
        'status': u'open',
        'summary': None,
        'original_author_username': None,
        'subject': u'a subject'
    }

    USER_EMAIL: Final = 'user@example.com'
    USER_USERNAME: Final = 'user'

    def setUp(self) -> None:
        super().setUp()

        self.signup(self.USER_EMAIL, self.USER_USERNAME)
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.user_id = self.get_user_id_from_email(self.USER_EMAIL)

        self.save_new_valid_exploration(
            self.EXP_ID_1, self.owner_id, title='Bridges in England',
            category='Architecture', language_code='en')

    def test_get_thread_summaries_load_test(self) -> None:
        # The speed of fetching the summaries of 100 threads having 5 messages
        # should be less than 1.7 second. In reality, the time taken to fetch
        # all the summaries is less than 0.2s. However since it seems to take
        # longer on Travis, the constant has been set to 1.7s.
        # Create 100 threads.
        for _ in range(100):
            feedback_services.create_thread(
                feconf.ENTITY_TYPE_EXPLORATION, self.EXP_ID_1,
                self.user_id, self.EXPECTED_THREAD_DICT['subject'],
                'not used here')
        threadlist = feedback_services.get_all_threads(
            feconf.ENTITY_TYPE_EXPLORATION, self.EXP_ID_1, False)

        thread_ids = []
        for thread in threadlist:
            thread_ids.append(thread.id)
            # Create 5 messages in each thread.
            for _ in range(5):
                feedback_services.create_message(
                    thread.id, self.user_id, None, None, 'editor message')

        start = time.time()
        # Fetch the summaries of all the threads.
        feedback_services.get_exp_thread_summaries(self.user_id, thread_ids)
        elapsed_time = time.time() - start
        self.assertLessEqual(elapsed_time, 1.7)
