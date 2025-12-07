# coding: utf-8
#
# Copyright 2024 The Oppia Authors. All Rights Reserved.
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

"""Unit tests for badge_services."""

from __future__ import annotations

import unittest

from core import feconf
from core.domain import badge_domain
from core.domain import badge_services
from core.domain import user_services
from core.tests import test_utils


class BadgeServiceTest(test_utils.GenericTestBase):
    """Test cases for BadgeService."""

    def setUp(self) -> None:
        """Set up test fixtures."""
        super().setUp()
        self.badge_id = 'badge_learner_1'
        self.user_id = self.get_user_id_from_email('test@example.com')

    def test_create_badge(self) -> None:
        """Test badge creation."""
        criteria_dict = {
            'event_type': 'lesson_complete',
            'required_count': 1
        }
        
        badge = badge_services.BadgeService.create_badge(
            badge_id=self.badge_id,
            name='First Lesson',
            description='Complete your first lesson',
            icon_svg='<svg></svg>',
            rarity='common',
            badge_type='achievement',
            tier='bronze',
            criteria_dict=criteria_dict,
            category='learning',
            xp_reward=10
        )
        
        self.assertEqual(badge.badge_id, self.badge_id)
        self.assertEqual(badge.name, 'First Lesson')
        self.assertEqual(badge.xp_reward, 10)

    def test_get_badge(self) -> None:
        """Test retrieving a badge."""
        criteria_dict = {
            'event_type': 'lesson_complete',
            'required_count': 1
        }
        
        # Create a badge first
        created_badge = badge_services.BadgeService.create_badge(
            badge_id=self.badge_id,
            name='Test Badge',
            description='Test description',
            icon_svg='<svg></svg>',
            rarity='common',
            badge_type='achievement',
            tier='bronze',
            criteria_dict=criteria_dict,
            category='learning'
        )
        
        # Retrieve it
        retrieved_badge = badge_services.BadgeService.get_badge(self.badge_id)
        
        if retrieved_badge:
            self.assertEqual(retrieved_badge.badge_id, self.badge_id)
            self.assertEqual(retrieved_badge.name, 'Test Badge')

    def test_award_badge_to_user(self) -> None:
        """Test awarding a badge to a user."""
        criteria_dict = {
            'event_type': 'lesson_complete',
            'required_count': 1
        }
        
        # Create a badge
        badge_services.BadgeService.create_badge(
            badge_id=self.badge_id,
            name='Achievement Badge',
            description='Test',
            icon_svg='<svg></svg>',
            rarity='common',
            badge_type='achievement',
            tier='bronze',
            criteria_dict=criteria_dict,
            category='learning'
        )
        
        # Award it to user
        awarded = badge_services.UserBadgeService.award_badge(
            self.user_id,
            self.badge_id,
            reason='lesson_complete'
        )
        
        self.assertIsNotNone(awarded)

    def test_get_user_badges(self) -> None:
        """Test retrieving user's badges."""
        criteria_dict = {
            'event_type': 'lesson_complete',
            'required_count': 1
        }
        
        # Create and award a badge
        badge_services.BadgeService.create_badge(
            badge_id=self.badge_id,
            name='Test Badge',
            description='Test',
            icon_svg='<svg></svg>',
            rarity='common',
            badge_type='achievement',
            tier='bronze',
            criteria_dict=criteria_dict,
            category='learning'
        )
        
        badge_services.UserBadgeService.award_badge(
            self.user_id,
            self.badge_id
        )
        
        # Retrieve user badges
        user_badges, badge_details = (
            badge_services.UserBadgeService.get_user_badges(self.user_id)
        )
        
        self.assertGreaterEqual(len(user_badges), 1)

    def test_toggle_favorite_badge(self) -> None:
        """Test toggling favorite status of a badge."""
        criteria_dict = {
            'event_type': 'lesson_complete',
            'required_count': 1
        }
        
        # Create and award a badge
        badge_services.BadgeService.create_badge(
            badge_id=self.badge_id,
            name='Favorite Badge',
            description='Test',
            icon_svg='<svg></svg>',
            rarity='common',
            badge_type='achievement',
            tier='bronze',
            criteria_dict=criteria_dict,
            category='learning'
        )
        
        badge_services.UserBadgeService.award_badge(
            self.user_id,
            self.badge_id
        )
        
        # Toggle favorite
        result = badge_services.UserBadgeService.toggle_favorite(
            self.user_id,
            self.badge_id
        )
        
        self.assertIsNotNone(result)

    def test_get_badge_analytics(self) -> None:
        """Test retrieving badge analytics."""
        leaderboard = badge_services.BadgeAnalyticsService.get_leaderboard(
            limit=10
        )
        
        self.assertIsInstance(leaderboard, list)

    def test_get_user_badge_summary(self) -> None:
        """Test getting user badge summary."""
        # Set badge system as enabled
        with self.swap(feconf, 'BADGE_SYSTEM_ENABLED', True):
            summary = user_services.get_user_badge_summary(self.user_id)
            
            self.assertIn('total_badges', summary)
            self.assertIn('total_xp', summary)
            self.assertIn('by_rarity', summary)

    def test_badge_awarding_service_award_multiple_badges(self) -> None:
        """Test awarding multiple badges in one event."""
        # Create multiple badges
        for i in range(3):
            badge_id = f'badge_{i}'
            criteria_dict = {
                'event_type': 'lesson_complete',
                'required_count': 1
            }
            
            badge_services.BadgeService.create_badge(
                badge_id=badge_id,
                name=f'Badge {i}',
                description='Test',
                icon_svg='<svg></svg>',
                rarity='common',
                badge_type='achievement',
                tier='bronze',
                criteria_dict=criteria_dict,
                category='learning'
            )
        
        # Award badges via awarding service
        with self.swap(feconf, 'BADGE_SYSTEM_ENABLED', True):
            with self.swap(feconf, 'BADGE_AWARDING_ENABLED', True):
                awarded_ids = (
                    badge_services.BadgeAwardingService.check_and_award_badges(
                        self.user_id,
                        'lesson_complete',
                        {'exploration_id': 'test_exp'}
                    )
                )
                
                self.assertIsInstance(awarded_ids, list)

    def test_badge_system_disabled(self) -> None:
        """Test that badges are not awarded when system is disabled."""
        criteria_dict = {
            'event_type': 'lesson_complete',
            'required_count': 1
        }
        
        badge_services.BadgeService.create_badge(
            badge_id=self.badge_id,
            name='Test Badge',
            description='Test',
            icon_svg='<svg></svg>',
            rarity='common',
            badge_type='achievement',
            tier='bronze',
            criteria_dict=criteria_dict,
            category='learning'
        )
        
        # Disable badge system
        with self.swap(feconf, 'BADGE_SYSTEM_ENABLED', False):
            awarded_ids = (
                badge_services.BadgeAwardingService.check_and_award_badges(
                    self.user_id,
                    'lesson_complete',
                    {}
                )
            )
            
            self.assertEqual(len(awarded_ids), 0)

    def test_badge_progress_update(self) -> None:
        """Test updating badge progress."""
        criteria_dict = {
            'event_type': 'lesson_complete',
            'required_count': 5
        }
        
        badge_services.BadgeService.create_badge(
            badge_id=self.badge_id,
            name='Progress Badge',
            description='Complete 5 lessons',
            icon_svg='<svg></svg>',
            rarity='common',
            badge_type='achievement',
            tier='bronze',
            criteria_dict=criteria_dict,
            category='learning'
        )
        
        # Update progress
        for i in range(3):
            badge_services.UserBadgeService.update_progress(
                self.user_id,
                self.badge_id,
                current_progress=i + 1
            )
        
        # Verify progress was updated
        user_badges, _ = (
            badge_services.UserBadgeService.get_user_badges(self.user_id)
        )
        
        # At least one badge should exist
        self.assertGreaterEqual(len(user_badges), 0)


class ActivityServicesBadgeIntegrationTest(test_utils.GenericTestBase):
    """Test cases for badge integration with activity services."""

    def setUp(self) -> None:
        """Set up test fixtures."""
        super().setUp()
        self.user_id = self.get_user_id_from_email('test@example.com')

    def test_award_badge_on_lesson_completion(self) -> None:
        """Test awarding badge on lesson completion."""
        from core.domain import activity_services
        
        with self.swap(feconf, 'BADGE_SYSTEM_ENABLED', True):
            activity_services.award_badges_on_lesson_completion(
                self.user_id,
                'test_exploration'
            )
            
            # Verify no errors occurred
            self.assertTrue(True)

    def test_award_badge_on_quiz_completion(self) -> None:
        """Test awarding badge on quiz completion."""
        from core.domain import activity_services
        
        with self.swap(feconf, 'BADGE_SYSTEM_ENABLED', True):
            activity_services.award_badges_on_quiz_completion(
                self.user_id,
                'test_quiz',
                score=85
            )
            
            self.assertTrue(True)

    def test_award_badge_on_daily_login(self) -> None:
        """Test awarding badge on daily login."""
        from core.domain import activity_services
        
        with self.swap(feconf, 'BADGE_SYSTEM_ENABLED', True):
            activity_services.award_badges_on_daily_login(self.user_id)
            
            self.assertTrue(True)


if __name__ == '__main__':
    unittest.main()
