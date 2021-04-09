# coding: utf-8
#
# Copyright 2021 The Oppia Authors. All Rights Reserved.
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

"""Tests for app feedback reporting domain objects."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import datetime

from core.domain import exp_services
from core.domain import story_domain
from core.domain import topic_domain
from core.tests import test_utils
from core.platform import models

import feconf
import python_utils
import utils


class AppFeedbackReportTest(test_utils.GenericTestBase):
    """Tests for the AppFeedbackReport object."""

    def test_to_dict(self):
        expected_object_dict = {
            'cmd': 'update_question_property',
            'property_name': 'question_state_data',
            'new_value': 'new_value',
            'old_value': 'old_value',
        }

        change_dict = {
            'cmd': 'update_question_property',
            'property_name': 'question_state_data',
            'new_value': 'new_value',
            'old_value': 'old_value',
        }
        observed_object = question_domain.QuestionChange(
            change_dict=change_dict,
        )

        self.assertEqual(expected_object_dict, observed_object.to_dict())



class AppFeedbackReportTicketTest(test_utils.GenericTestBase):


