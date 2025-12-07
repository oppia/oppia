#!/usr/bin/env python
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

"""Migration script for Badge System initialization.

This script creates initial badge data for the Oppia Badge System.
It creates sample badges covering various achievement categories.
"""

import sys
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def create_initial_badges():
    """Create initial badge data.
    
    Returns:
        bool. True if successful, False otherwise.
    """
    from core.domain import badge_domain
    from core.domain import badge_services
    
    # Define initial badges
    initial_badges = [
        {
            'badge_id': 'first_lesson',
            'name': 'First Steps',
            'description': 'Complete your first lesson',
            'icon_svg': '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="#FFD700"/></svg>',
            'rarity': 'common',
            'badge_type': 'achievement',
            'tier': 'bronze',
            'criteria': {
                'event_type': 'lesson_complete',
                'required_count': 1
            },
            'category': 'learning',
            'xp_reward': 10
        },
        {
            'badge_id': 'lesson_master',
            'name': 'Lesson Master',
            'description': 'Complete 10 lessons',
            'icon_svg': '<svg viewBox="0 0 100 100"><path d="M50 10 L90 30 L80 80 L20 80 L10 30 Z" fill="#C0C0C0"/></svg>',
            'rarity': 'rare',
            'badge_type': 'achievement',
            'tier': 'silver',
            'criteria': {
                'event_type': 'lesson_complete',
                'required_count': 10
            },
            'category': 'learning',
            'xp_reward': 50
        },
        {
            'badge_id': 'quiz_warrior',
            'name': 'Quiz Warrior',
            'description': 'Pass 5 quizzes with 90%+ score',
            'icon_svg': '<svg viewBox="0 0 100 100"><rect x="20" y="20" width="60" height="60" fill="#FFD700" stroke="#FF6B6B" stroke-width="2"/></svg>',
            'rarity': 'epic',
            'badge_type': 'achievement',
            'tier': 'gold',
            'criteria': {
                'event_type': 'quiz_submit',
                'required_score': 90,
                'required_count': 5
            },
            'category': 'learning',
            'xp_reward': 75
        },
        {
            'badge_id': 'daily_devotee',
            'name': 'Daily Devotee',
            'description': 'Log in for 7 consecutive days',
            'icon_svg': '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="#2196F3"/></svg>',
            'rarity': 'rare',
            'badge_type': 'milestone',
            'tier': 'silver',
            'criteria': {
                'event_type': 'daily_login',
                'required_count': 7,
                'consecutive': True
            },
            'category': 'engagement',
            'xp_reward': 30
        },
        {
            'badge_id': 'perfectionist',
            'name': 'Perfectionist',
            'description': 'Complete 20 lessons without mistakes',
            'icon_svg': '<svg viewBox="0 0 100 100"><polygon points="50,15 90,35 75,80 25,80 10,35" fill="#E91E63"/></svg>',
            'rarity': 'legendary',
            'badge_type': 'achievement',
            'tier': 'platinum',
            'criteria': {
                'event_type': 'lesson_complete',
                'required_count': 20,
                'no_mistakes': True
            },
            'category': 'learning',
            'xp_reward': 200
        },
        {
            'badge_id': 'explorer',
            'name': 'Explorer',
            'description': 'Visit 10 different courses',
            'icon_svg': '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="35" fill="#FF9800"/><circle cx="50" cy="50" r="15" fill="white"/></svg>',
            'rarity': 'common',
            'badge_type': 'exploration',
            'tier': 'bronze',
            'criteria': {
                'event_type': 'course_visit',
                'required_count': 10
            },
            'category': 'exploration',
            'xp_reward': 20
        },
        {
            'badge_id': 'speed_demon',
            'name': 'Speed Demon',
            'description': 'Complete a lesson in under 5 minutes',
            'icon_svg': '<svg viewBox="0 0 100 100"><rect x="30" y="30" width="40" height="40" fill="#9C27B0" transform="rotate(45 50 50)"/></svg>',
            'rarity': 'rare',
            'badge_type': 'achievement',
            'tier': 'silver',
            'criteria': {
                'event_type': 'lesson_complete',
                'time_limit': 300,
                'required_count': 1
            },
            'category': 'learning',
            'xp_reward': 40
        },
        {
            'badge_id': 'community_helper',
            'name': 'Community Helper',
            'description': 'Help 5 other learners',
            'icon_svg': '<svg viewBox="0 0 100 100"><circle cx="35" cy="40" r="20" fill="#4CAF50"/><circle cx="65" cy="40" r="20" fill="#4CAF50"/><circle cx="50" cy="80" r="20" fill="#4CAF50"/></svg>',
            'rarity': 'rare',
            'badge_type': 'social',
            'tier': 'silver',
            'criteria': {
                'event_type': 'community_help',
                'required_count': 5
            },
            'category': 'social',
            'xp_reward': 50
        },
        {
            'badge_id': 'master_learner',
            'name': 'Master Learner',
            'description': 'Complete 50 lessons',
            'icon_svg': '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="#B9F2FF"/><circle cx="50" cy="50" r="35" fill="white"/><circle cx="50" cy="50" r="30" fill="#B9F2FF"/></svg>',
            'rarity': 'mythic',
            'badge_type': 'achievement',
            'tier': 'diamond',
            'criteria': {
                'event_type': 'lesson_complete',
                'required_count': 50
            },
            'category': 'learning',
            'xp_reward': 300
        },
        {
            'badge_id': 'feedback_champion',
            'name': 'Feedback Champion',
            'description': 'Provide constructive feedback on 10 lessons',
            'icon_svg': '<svg viewBox="0 0 100 100"><path d="M20 80 Q50 20 80 80 Z" fill="none" stroke="#FF5722" stroke-width="4"/><circle cx="35" cy="60" r="3" fill="#FF5722"/><circle cx="65" cy="60" r="3" fill="#FF5722"/></svg>',
            'rarity': 'epic',
            'badge_type': 'social',
            'tier': 'gold',
            'criteria': {
                'event_type': 'feedback_given',
                'required_count': 10
            },
            'category': 'social',
            'xp_reward': 100
        }
    ]
    
    created_count = 0
    failed_count = 0
    
    for badge_data in initial_badges:
        try:
            badge_services.BadgeService.create_badge(
                badge_id=badge_data['badge_id'],
                name=badge_data['name'],
                description=badge_data['description'],
                icon_svg=badge_data['icon_svg'],
                rarity=badge_data['rarity'],
                badge_type=badge_data['badge_type'],
                tier=badge_data['tier'],
                criteria_dict=badge_data['criteria'],
                category=badge_data['category'],
                xp_reward=badge_data['xp_reward']
            )
            created_count += 1
            logger.info(f"✓ Created badge: {badge_data['name']} ({badge_data['badge_id']})")
        except Exception as e:
            failed_count += 1
            logger.error(f"✗ Failed to create badge '{badge_data['badge_id']}': {str(e)}")
    
    return {
        'created': created_count,
        'failed': failed_count,
        'total': len(initial_badges),
        'success': failed_count == 0
    }


def print_summary(results):
    """Print migration summary.
    
    Args:
        results: dict. Migration results.
    """
    print("\n" + "=" * 60)
    print("BADGE SYSTEM MIGRATION SUMMARY")
    print("=" * 60)
    print(f"Total Badges to Create: {results['total']}")
    print(f"Successfully Created:  {results['created']} ✓")
    print(f"Failed:                {results['failed']} ✗")
    print("=" * 60)
    
    if results['success']:
        print("✓ MIGRATION COMPLETED SUCCESSFULLY")
        print("\nBadges created:")
        print("  - First Steps (badge_first_lesson)")
        print("  - Lesson Master (badge_lesson_master)")
        print("  - Quiz Warrior (badge_quiz_warrior)")
        print("  - Daily Devotee (badge_daily_devotee)")
        print("  - Perfectionist (badge_perfectionist)")
        print("  - Explorer (badge_explorer)")
        print("  - Speed Demon (badge_speed_demon)")
        print("  - Community Helper (badge_community_helper)")
        print("  - Master Learner (badge_master_learner)")
        print("  - Feedback Champion (badge_feedback_champion)")
        print("\nBadges are now ready for use in the system.")
    else:
        print("✗ MIGRATION COMPLETED WITH ERRORS")
        print(f"Please review the {results['failed']} failed badge(s) above.")
    
    print("=" * 60 + "\n")
    
    return results['success']


if __name__ == '__main__':
    try:
        logger.info("Starting Badge System Migration...")
        results = create_initial_badges()
        success = print_summary(results)
        sys.exit(0 if success else 1)
    except Exception as e:
        logger.error(f"Critical migration error: {str(e)}")
        print("\n✗ MIGRATION FAILED - Critical Error")
        print(f"Error: {str(e)}")
        sys.exit(1)
