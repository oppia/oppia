# coding: utf-8
#
# Copyright 2026 The Oppia Authors. All Rights Reserved.
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

"""Tests for learner lesson feedback and platform report domain objects."""

from __future__ import annotations

from core.domain import general_feedback_domain
from core.tests import test_utils

from typing import List

LESSON_METADATA: general_feedback_domain.LessonMetadataDict = {
    'exploration_id': 'exp_001',
    'exploration_version': 3,
    'state_name': 'Introduction',
    'state_index': 0,
    'learner_current_answer': 'Paris',
}

LESSON_METADATA_NO_ANSWER: general_feedback_domain.LessonMetadataDict = {
    'exploration_id': 'exp_002',
    'exploration_version': 1,
    'state_name': 'Question 1',
    'state_index': 2,
    'learner_current_answer': None,
}

RESPONSE_LIST: List[general_feedback_domain.LessonFeedbackResponseDict] = [
    {
        'response_text': 'Thanks for the feedback, fixing now.',
        'responded_on': 1700000001000.0,
    },
    {
        'response_text': 'Pushed a fix in v4.',
        'responded_on': 1700000002000.0,
    },
]


class LessonFeedbackDomainTests(test_utils.GenericTestBase):
    """Tests for LessonFeedback domain object."""

    def test_to_dict(self) -> None:
        expected_dict: general_feedback_domain.LessonFeedbackDict = {
            'id': 'feedback_id',
            'feedback_text': 'Feedback text',
            'status': 'open',
            'lesson_metadata': LESSON_METADATA,
            'parent_feedback_id': 'parent_feedback_id',
            'response_list': RESPONSE_LIST,
            'unread_response_count': 0,
            'created_on_msecs': 1700000000000.0,
        }

        feedback = general_feedback_domain.LessonFeedback(
            feedback_id='feedback_id',
            author_id='author_id',
            feedback_text='Feedback text',
            status='open',
            lesson_metadata=LESSON_METADATA,
            parent_feedback_id='parent_feedback_id',
            response_list=RESPONSE_LIST,
            unread_response_count=0,
            created_on_msecs=1700000000000.0,
        )

        self.assertEqual(feedback.to_dict(), expected_dict)

    def test_to_summary_dict(self) -> None:
        expected_dict: general_feedback_domain.LessonFeedbackSummaryDict = {
            'id': 'feedback_id',
            'feedback_text_preview': f'{"N" * 97}...',
            'status': 'open',
            'source': 'lesson',
            'unread_response_count': 0,
        }

        feedback = general_feedback_domain.LessonFeedback(
            feedback_id='feedback_id',
            author_id='author_id',
            feedback_text='N' * 110,
            status='open',
            lesson_metadata=LESSON_METADATA,
            parent_feedback_id='parent_feedback_id',
            response_list=RESPONSE_LIST,
            unread_response_count=0,
            created_on_msecs=1700000000000.0,
        )

        self.assertEqual(feedback.to_summary_dict(), expected_dict)

    def test_to_learner_dict(self) -> None:
        expected_dict: general_feedback_domain.LessonFeedbackDict = {
            'id': 'feedback_id',
            'feedback_text': 'Feedback text',
            'status': 'open',
            'lesson_metadata': LESSON_METADATA,
            'parent_feedback_id': 'parent_feedback_id',
            'response_list': RESPONSE_LIST,
            'unread_response_count': 0,
            'created_on_msecs': 1700000000000.0,
        }

        feedback = general_feedback_domain.LessonFeedback(
            feedback_id='feedback_id',
            author_id='author_id',
            feedback_text='Feedback text',
            status='open',
            lesson_metadata=LESSON_METADATA,
            parent_feedback_id='parent_feedback_id',
            response_list=RESPONSE_LIST,
            unread_response_count=0,
            created_on_msecs=1700000000000.0,
        )

        self.assertEqual(feedback.to_learner_dict(), expected_dict)


class PlatformFeedbackDomainTests(test_utils.GenericTestBase):
    """Tests for PlatformFeedback domain object."""

    def test_to_dict(self) -> None:
        expected_dict: general_feedback_domain.PlatformFeedbackDict = {
            'id': 'feedback_id',
            'report_message': 'Report text',
            'source': 'lesson',
            'platform': 'platform',
            'destination_dashboard': 'curriculum',
            'status': 'open',
            'page_url': 'page_url',
            'category': 'category',
            'lesson_metadata': LESSON_METADATA,
            'include_technical_logs': True,
            'session_info': None,
            'screenshot_filename': 'screenshot_filename',
            'screenshot_entity_id': 'screenshot_entity_id',
            'created_on_msecs': 1700000000000.0,
        }

        feedback = general_feedback_domain.PlatformFeedback(
            report_id='feedback_id',
            report_message='Report text',
            source='lesson',
            platform='platform',
            destination_dashboard='curriculum',
            status='open',
            page_url='page_url',
            category='category',
            lesson_metadata=LESSON_METADATA,
            include_technical_logs=True,
            screenshot_filename='screenshot_filename',
            screenshot_entity_id='screenshot_entity_id',
            created_on_msecs=1700000000000.0,
        )

        self.assertEqual(feedback.to_dict(), expected_dict)

    def test_to_summary_dict(self) -> None:
        expected_dict: general_feedback_domain.PlatformFeedbackSummaryDict = {
            'id': 'feedback_id',
            'report_message_preview': f'{"N" * 97}...',
            'status': 'open',
            'source': 'lesson',
            'category': 'category',
        }

        feedback = general_feedback_domain.PlatformFeedback(
            report_id='feedback_id',
            report_message='N' * 110,
            source='lesson',
            platform='platform',
            destination_dashboard='curriculum',
            status='open',
            page_url='page_url',
            category='category',
            lesson_metadata=LESSON_METADATA,
            include_technical_logs=True,
            screenshot_filename='screenshot_filename',
            screenshot_entity_id='screenshot_entity_id',
            created_on_msecs=1700000000000.0,
        )

        self.assertEqual(feedback.to_summary_dict(), expected_dict)
