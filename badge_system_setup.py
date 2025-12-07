#!/usr/bin/env python
# Copyright 2024 The Oppia Authors. All Rights Reserved.

"""
Initial setup script for the Badge System.
This script initializes the database with sample badges and sets up indexes.
"""

import datetime
from core.domain import badge_domain, badge_services

def create_sample_badges():
    """Create sample badges for testing."""
    
    sample_badges = [
        # Beginner Badges
        {
            "badge_id": "beginner_luck",
            "name": "Beginner's Luck",
            "description": "Complete your first lesson",
            "icon_svg": "<svg><!-- SVG content --></svg>",
            "rarity": "Common",
            "badge_type": "LESSON_COMPLETION",
            "tier": "Bronze",
            "category": "LEARNING",
            "criteria_dict": {
                "condition_type": "lessons_completed",
                "threshold": 1
            },
            "xp_reward": 10
        },
        
        # Streak Badges
        {
            "badge_id": "week_warrior",
            "name": "Week Warrior",
            "description": "Maintain a 7-day learning streak",
            "icon_svg": "<svg><!-- SVG content --></svg>",
            "rarity": "Rare",
            "badge_type": "STREAK",
            "tier": "Silver",
            "category": "MOTIVATION",
            "criteria_dict": {
                "condition_type": "streak_days",
                "threshold": 7
            },
            "xp_reward": 100
        },
        
        {
            "badge_id": "month_master",
            "name": "Month Master",
            "description": "Maintain a 30-day learning streak",
            "icon_svg": "<svg><!-- SVG content --></svg>",
            "rarity": "Epic",
            "badge_type": "STREAK",
            "tier": "Gold",
            "category": "MOTIVATION",
            "criteria_dict": {
                "condition_type": "streak_days",
                "threshold": 30,
                "prerequisites": ["week_warrior"]
            },
            "xp_reward": 300
        },
        
        # Quiz Performance Badges
        {
            "badge_id": "perfect_score",
            "name": "Perfect Score",
            "description": "Score 100% on 5 quizzes",
            "icon_svg": "<svg><!-- SVG content --></svg>",
            "rarity": "Epic",
            "badge_type": "QUIZ_PERFORMANCE",
            "tier": "Gold",
            "category": "LEARNING",
            "criteria_dict": {
                "condition_type": "perfect_quizzes",
                "threshold": 5
            },
            "xp_reward": 500
        },
        
        # Course Completion Badges
        {
            "badge_id": "course_graduate",
            "name": "Course Graduate",
            "description": "Complete 5 full courses",
            "icon_svg": "<svg><!-- SVG content --></svg>",
            "rarity": "Rare",
            "badge_type": "COURSE_COMPLETION",
            "tier": "Silver",
            "category": "LEARNING",
            "criteria_dict": {
                "condition_type": "courses_completed",
                "threshold": 5
            },
            "xp_reward": 200
        },
        
        # Mastery Badges
        {
            "badge_id": "math_master",
            "name": "Math Master",
            "description": "Achieve mastery in Mathematics",
            "icon_svg": "<svg><!-- SVG content --></svg>",
            "rarity": "Legendary",
            "badge_type": "MASTERY",
            "tier": "Platinum",
            "category": "MATHEMATICS",
            "criteria_dict": {
                "condition_type": "subject_mastery",
                "threshold": 95
            },
            "xp_reward": 1000
        },
        
        # Programming Badges
        {
            "badge_id": "python_padawan",
            "name": "Python Padawan",
            "description": "Complete 3 Python lessons",
            "icon_svg": "<svg><!-- SVG content --></svg>",
            "rarity": "Rare",
            "badge_type": "LESSON_COMPLETION",
            "tier": "Silver",
            "category": "PROGRAMMING",
            "criteria_dict": {
                "condition_type": "lessons_completed",
                "threshold": 3,
                "prerequisites": ["beginner_luck"]
            },
            "xp_reward": 150
        },
        
        # Social Badges
        {
            "badge_id": "community_hero",
            "name": "Community Hero",
            "description": "Help 10 users with questions",
            "icon_svg": "<svg><!-- SVG content --></svg>",
            "rarity": "Rare",
            "badge_type": "SOCIAL",
            "tier": "Silver",
            "category": "COMMUNITY",
            "criteria_dict": {
                "condition_type": "users_helped",
                "threshold": 10
            },
            "xp_reward": 200
        },
        
        # Creator Badges
        {
            "badge_id": "content_creator",
            "name": "Content Creator",
            "description": "Create 3 learning resources",
            "icon_svg": "<svg><!-- SVG content --></svg>",
            "rarity": "Epic",
            "badge_type": "CREATOR",
            "tier": "Gold",
            "category": "CREATIVITY",
            "criteria_dict": {
                "condition_type": "resources_created",
                "threshold": 3
            },
            "xp_reward": 500
        },
        
        # Mythic Badge
        {
            "badge_id": "legend_status",
            "name": "Legend Status",
            "description": "Achieve 100,000 total XP",
            "icon_svg": "<svg><!-- SVG content --></svg>",
            "rarity": "Mythic",
            "badge_type": "MILESTONE",
            "tier": "Diamond",
            "category": "LEARNING",
            "criteria_dict": {
                "condition_type": "total_xp",
                "threshold": 100000
            },
            "xp_reward": 5000
        }
    ]
    
    print("Creating sample badges...")
    created_count = 0
    
    for badge_data in sample_badges:
        try:
            badge = badge_services.BadgeService.create_badge(
                badge_id=badge_data["badge_id"],
                name=badge_data["name"],
                description=badge_data["description"],
                icon_svg=badge_data["icon_svg"],
                rarity=badge_data["rarity"],
                badge_type=badge_data["badge_type"],
                tier=badge_data["tier"],
                category=badge_data["category"],
                criteria_dict=badge_data["criteria_dict"],
                xp_reward=badge_data.get("xp_reward", 10)
            )
            created_count += 1
            print(f"✓ Created badge: {badge.name}")
        except Exception as e:
            print(f"✗ Failed to create {badge_data['badge_id']}: {str(e)}")
    
    print(f"\nSuccessfully created {created_count}/{len(sample_badges)} badges")
    return created_count

def create_sample_user_badges():
    """Create sample user badges for demonstration."""
    
    sample_user_badges = [
        {
            "user_id": "demo_user_1",
            "badge_id": "beginner_luck",
        },
        {
            "user_id": "demo_user_1",
            "badge_id": "week_warrior",
        },
        {
            "user_id": "demo_user_1",
            "badge_id": "python_padawan",
        },
    ]
    
    print("\nCreating sample user badges...")
    awarded_count = 0
    
    for ub_data in sample_user_badges:
        try:
            user_badge = badge_services.UserBadgeService.award_badge_to_user(
                user_id=ub_data["user_id"],
                badge_id=ub_data["badge_id"]
            )
            if user_badge:
                awarded_count += 1
                badge = badge_services.BadgeService.get_badge(ub_data["badge_id"])
                print(f"✓ Awarded {badge.name} to {ub_data['user_id']}")
        except Exception as e:
            print(f"✗ Failed to award badge: {str(e)}")
    
    print(f"\nSuccessfully awarded {awarded_count}/{len(sample_user_badges)} badges")
    return awarded_count

def verify_setup():
    """Verify that the badge system is properly set up."""
    
    print("\nVerifying badge system setup...")
    
    try:
        # Check if badges exist
        all_badges, total = badge_services.BadgeService.get_all_badges(limit=1000)
        print(f"✓ Found {total} badges in database")
        
        # Check for each rarity level
        rarities = ["Common", "Rare", "Epic", "Legendary", "Mythic"]
        for rarity in rarities:
            badges = badge_services.BadgeService.get_badges_by_rarity(rarity)
            print(f"  - {rarity}: {len(badges)} badges")
        
        # Check for each category
        categories = [
            "LEARNING", "PROGRAMMING", "MATHEMATICS", "SCIENCE",
            "LANGUAGES", "ARTS", "MOTIVATION", "COMMUNITY", "CREATIVITY"
        ]
        print("\nBadges by category:")
        for category in categories:
            badges = badge_services.BadgeService.get_badges_by_category(category)
            if badges:
                print(f"  - {category}: {len(badges)} badges")
        
        print("\n✅ Badge system setup complete!")
        return True
        
    except Exception as e:
        print(f"\n❌ Setup verification failed: {str(e)}")
        return False

def main():
    """Main setup function."""
    
    print("=" * 60)
    print("Gamification Badge System - Initial Setup")
    print("=" * 60)
    
    # Create sample badges
    badge_count = create_sample_badges()
    
    # Create sample user badges
    user_badge_count = create_sample_user_badges()
    
    # Verify setup
    success = verify_setup()
    
    if success and badge_count > 0:
        print("\n" + "=" * 60)
        print("Setup completed successfully! 🎉")
        print("=" * 60)
        print("\nYou can now:")
        print("1. Access badges at: GET /badgehandler/list")
        print("2. Get user badges at: GET /badgehandler/userbadges")
        print("3. View the badge gallery in the UI")
        print("\nFor more information, see README_BADGE_SYSTEM.md")
        return 0
    else:
        print("\n" + "=" * 60)
        print("Setup encountered errors. Please check the output above.")
        print("=" * 60)
        return 1

if __name__ == "__main__":
    exit(main())
