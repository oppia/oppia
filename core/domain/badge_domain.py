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

"""Domain objects for the Gamification Badge System."""

from __future__ import annotations

from enum import Enum
from typing import Any, Dict, List, Optional
import datetime


class BadgeRarity(Enum):
    """Enum for badge rarity levels.
    
    Attributes:
        COMMON: Common rarity level.
        RARE: Rare rarity level.
        EPIC: Epic rarity level.
        LEGENDARY: Legendary rarity level.
        MYTHIC: Mythic rarity level.
    """
    COMMON = 'Common'
    RARE = 'Rare'
    EPIC = 'Epic'
    LEGENDARY = 'Legendary'
    MYTHIC = 'Mythic'


class BadgeTier(Enum):
    """Enum for badge tier levels.
    
    Attributes:
        BRONZE: Bronze tier level.
        SILVER: Silver tier level.
        GOLD: Gold tier level.
        PLATINUM: Platinum tier level.
        DIAMOND: Diamond tier level.
    """
    BRONZE = 'Bronze'
    SILVER = 'Silver'
    GOLD = 'Gold'
    PLATINUM = 'Platinum'
    DIAMOND = 'Diamond'


class BadgeType(Enum):
    """Enum for badge types.
    
    Attributes:
        STREAK: Badge for maintaining learning streaks.
        COURSE_COMPLETION: Badge for completing courses.
        LESSON_COMPLETION: Badge for completing lessons.
        QUIZ_PERFORMANCE: Badge for quiz performance.
        MASTERY: Badge for subject mastery.
        SOCIAL: Badge for community participation.
        CREATOR: Badge for content creation.
        CHALLENGE: Badge for special challenges.
        MILESTONE: Badge for platform milestones.
    """
    STREAK = 'STREAK'
    COURSE_COMPLETION = 'COURSE_COMPLETION'
    LESSON_COMPLETION = 'LESSON_COMPLETION'
    QUIZ_PERFORMANCE = 'QUIZ_PERFORMANCE'
    MASTERY = 'MASTERY'
    SOCIAL = 'SOCIAL'
    CREATOR = 'CREATOR'
    CHALLENGE = 'CHALLENGE'
    MILESTONE = 'MILESTONE'


class BadgeCategory(Enum):
    """Enum for badge categories.
    
    Attributes:
        LEARNING: Learning-related badges.
        PROGRAMMING: Programming-related badges.
        MATHEMATICS: Mathematics-related badges.
        SCIENCE: Science-related badges.
        LANGUAGES: Language-related badges.
        ARTS: Arts-related badges.
        MOTIVATION: Motivation and streak badges.
        COMMUNITY: Community participation badges.
        CREATIVITY: Creativity-related badges.
    """
    LEARNING = 'LEARNING'
    PROGRAMMING = 'PROGRAMMING'
    MATHEMATICS = 'MATHEMATICS'
    SCIENCE = 'SCIENCE'
    LANGUAGES = 'LANGUAGES'
    ARTS = 'ARTS'
    MOTIVATION = 'MOTIVATION'
    COMMUNITY = 'COMMUNITY'
    CREATIVITY = 'CREATIVITY'


class BadgeCriteria:
    """Domain object for badge earning criteria.
    
    Attributes:
        condition_type: str. Type of condition (e.g., 'lessons_completed', 'streak_days').
        threshold: int. Threshold value to unlock the badge.
        current_progress: int. Current progress toward the badge.
        prerequisites: list(str). List of badge IDs that must be earned first.
        cooldown_seconds: int. Cooldown period before badge can be re-earned.
    """

    def __init__(
        self,
        condition_type: str,
        threshold: int,
        current_progress: int = 0,
        prerequisites: Optional[List[str]] = None,
        cooldown_seconds: int = 0
    ) -> None:
        """Constructs a BadgeCriteria domain object.
        
        Args:
            condition_type: str. Type of condition to unlock badge.
            threshold: int. Threshold value for unlocking.
            current_progress: int. Current progress (default 0).
            prerequisites: list(str). List of prerequisite badge IDs.
            cooldown_seconds: int. Cooldown in seconds (default 0).
        """
        self.condition_type = condition_type
        self.threshold = threshold
        self.current_progress = current_progress
        self.prerequisites = prerequisites or []
        self.cooldown_seconds = cooldown_seconds

    def to_dict(self) -> Dict[str, Any]:
        """Returns a dict representing this BadgeCriteria domain object.
        
        Returns:
            dict. Dictionary representation of BadgeCriteria.
        """
        return {
            'condition_type': self.condition_type,
            'threshold': self.threshold,
            'current_progress': self.current_progress,
            'prerequisites': self.prerequisites,
            'cooldown_seconds': self.cooldown_seconds
        }

    @classmethod
    def from_dict(cls, criteria_dict: Dict[str, Any]) -> BadgeCriteria:
        """Creates BadgeCriteria from a dict.
        
        Args:
            criteria_dict: dict. Dictionary representation of BadgeCriteria.
            
        Returns:
            BadgeCriteria. The corresponding BadgeCriteria object.
        """
        return cls(
            condition_type=criteria_dict.get('condition_type', ''),
            threshold=criteria_dict.get('threshold', 0),
            current_progress=criteria_dict.get('current_progress', 0),
            prerequisites=criteria_dict.get('prerequisites', []),
            cooldown_seconds=criteria_dict.get('cooldown_seconds', 0)
        )

    def is_criteria_met(self, current_progress: int) -> bool:
        """Checks if the criteria is met.
        
        Args:
            current_progress: int. Current progress value.
            
        Returns:
            bool. True if current_progress >= threshold, False otherwise.
        """
        return current_progress >= self.threshold


class Badge:
    """Domain object for a badge.
    
    Attributes:
        badge_id: str. Unique identifier for the badge.
        name: str. Name of the badge.
        description: str. Description of the badge.
        icon_svg: str. SVG content for the badge icon.
        rarity: BadgeRarity. Rarity level of the badge.
        badge_type: BadgeType. Type of badge.
        tier: BadgeTier. Tier level of the badge.
        criteria: BadgeCriteria. Criteria to unlock the badge.
        category: BadgeCategory. Category of the badge.
        xp_reward: int. XP reward for earning the badge.
        points: int. Points reward for earning the badge.
        evolution_chain: list(str). List of badge IDs this badge can evolve into.
        collection_id: str. ID of the collection this badge belongs to.
        total_awards: int. Total number of times badge has been awarded.
        created_on: datetime. Creation timestamp.
        last_updated: datetime. Last update timestamp.
    """

    def __init__(
        self,
        badge_id: str,
        name: str,
        description: str,
        icon_svg: str,
        rarity: BadgeRarity,
        badge_type: BadgeType,
        tier: BadgeTier,
        criteria: BadgeCriteria,
        category: BadgeCategory,
        xp_reward: int = 10,
        points: int = 0,
        evolution_chain: Optional[List[str]] = None,
        collection_id: Optional[str] = None,
        total_awards: int = 0,
        created_on: Optional[datetime.datetime] = None,
        last_updated: Optional[datetime.datetime] = None
    ) -> None:
        """Constructs a Badge domain object.
        
        Args:
            badge_id: str. Unique identifier for the badge.
            name: str. Name of the badge.
            description: str. Description of the badge.
            icon_svg: str. SVG content for the badge icon.
            rarity: BadgeRarity. Rarity level.
            badge_type: BadgeType. Type of badge.
            tier: BadgeTier. Tier level.
            criteria: BadgeCriteria. Criteria to unlock.
            category: BadgeCategory. Badge category.
            xp_reward: int. XP reward (default 10).
            points: int. Points reward (default 0).
            evolution_chain: list(str). Evolution chain (default None).
            collection_id: str. Collection ID (default None).
            total_awards: int. Total awards (default 0).
            created_on: datetime. Creation timestamp.
            last_updated: datetime. Last update timestamp.
        """
        self.badge_id = badge_id
        self.name = name
        self.description = description
        self.icon_svg = icon_svg
        self.rarity = rarity
        self.badge_type = badge_type
        self.tier = tier
        self.criteria = criteria
        self.category = category
        self.xp_reward = xp_reward
        self.points = points
        self.evolution_chain = evolution_chain or []
        self.collection_id = collection_id
        self.total_awards = total_awards
        self.created_on = created_on or datetime.datetime.utcnow()
        self.last_updated = last_updated or datetime.datetime.utcnow()

    def to_dict(self) -> Dict[str, Any]:
        """Returns a dict representing this Badge domain object.
        
        Returns:
            dict. Dictionary representation of Badge.
        """
        return {
            'badge_id': self.badge_id,
            'name': self.name,
            'description': self.description,
            'icon_svg': self.icon_svg,
            'rarity': self.rarity.value,
            'badge_type': self.badge_type.value,
            'tier': self.tier.value,
            'criteria': self.criteria.to_dict(),
            'category': self.category.value,
            'xp_reward': self.xp_reward,
            'points': self.points,
            'evolution_chain': self.evolution_chain,
            'collection_id': self.collection_id,
            'total_awards': self.total_awards,
            'created_on': self.created_on.isoformat() if self.created_on else None,
            'last_updated': self.last_updated.isoformat() if self.last_updated else None
        }

    @classmethod
    def from_dict(cls, badge_dict: Dict[str, Any]) -> Badge:
        """Creates Badge from a dict.
        
        Args:
            badge_dict: dict. Dictionary representation of Badge.
            
        Returns:
            Badge. The corresponding Badge object.
        """
        criteria = BadgeCriteria.from_dict(badge_dict.get('criteria', {}))
        return cls(
            badge_id=badge_dict.get('badge_id', ''),
            name=badge_dict.get('name', ''),
            description=badge_dict.get('description', ''),
            icon_svg=badge_dict.get('icon_svg', ''),
            rarity=BadgeRarity(badge_dict.get('rarity', 'Common')),
            badge_type=BadgeType(badge_dict.get('badge_type', 'STREAK')),
            tier=BadgeTier(badge_dict.get('tier', 'Bronze')),
            criteria=criteria,
            category=BadgeCategory(badge_dict.get('category', 'LEARNING')),
            xp_reward=badge_dict.get('xp_reward', 10),
            points=badge_dict.get('points', 0),
            evolution_chain=badge_dict.get('evolution_chain', []),
            collection_id=badge_dict.get('collection_id'),
            total_awards=badge_dict.get('total_awards', 0),
            created_on=badge_dict.get('created_on'),
            last_updated=badge_dict.get('last_updated')
        )

    def can_evolve(self) -> bool:
        """Checks if this badge has an evolution chain.
        
        Returns:
            bool. True if badge can evolve, False otherwise.
        """
        return len(self.evolution_chain) > 0

    def validate(self) -> None:
        """Validates this Badge domain object.
        
        Raises:
            ValueError. If any required field is invalid.
        """
        if not self.badge_id:
            raise ValueError('Badge ID is required')
        if not self.name:
            raise ValueError('Badge name is required')
        if not self.description:
            raise ValueError('Badge description is required')
        if not isinstance(self.xp_reward, int) or self.xp_reward < 0:
            raise ValueError('XP reward must be a non-negative integer')
        if not isinstance(self.points, int) or self.points < 0:
            raise ValueError('Points must be a non-negative integer')


class UserBadge:
    """Domain object for a user's earned badge.
    
    Attributes:
        user_badge_id: str. Unique identifier for user badge record.
        user_id: str. ID of the user who earned the badge.
        badge_id: str. ID of the earned badge.
        awarded_date: datetime. Date when badge was earned.
        times_earned: int. Number of times this badge was earned.
        progress_data: dict. Progress data for this badge.
        share_count: int. Number of times this badge was shared.
        is_favorite: bool. Whether this badge is marked as favorite.
    """

    def __init__(
        self,
        user_badge_id: str,
        user_id: str,
        badge_id: str,
        awarded_date: Optional[datetime.datetime] = None,
        times_earned: int = 1,
        progress_data: Optional[Dict[str, Any]] = None,
        share_count: int = 0,
        is_favorite: bool = False
    ) -> None:
        """Constructs a UserBadge domain object.
        
        Args:
            user_badge_id: str. Unique identifier for user badge.
            user_id: str. User ID.
            badge_id: str. Badge ID.
            awarded_date: datetime. Award timestamp.
            times_earned: int. Times earned (default 1).
            progress_data: dict. Progress data (default None).
            share_count: int. Share count (default 0).
            is_favorite: bool. Is favorite (default False).
        """
        self.user_badge_id = user_badge_id
        self.user_id = user_id
        self.badge_id = badge_id
        self.awarded_date = awarded_date or datetime.datetime.utcnow()
        self.times_earned = times_earned
        self.progress_data = progress_data or {}
        self.share_count = share_count
        self.is_favorite = is_favorite

    def to_dict(self) -> Dict[str, Any]:
        """Returns a dict representing this UserBadge domain object.
        
        Returns:
            dict. Dictionary representation of UserBadge.
        """
        return {
            'user_badge_id': self.user_badge_id,
            'user_id': self.user_id,
            'badge_id': self.badge_id,
            'awarded_date': self.awarded_date.isoformat() if self.awarded_date else None,
            'times_earned': self.times_earned,
            'progress_data': self.progress_data,
            'share_count': self.share_count,
            'is_favorite': self.is_favorite
        }

    @classmethod
    def from_dict(cls, user_badge_dict: Dict[str, Any]) -> UserBadge:
        """Creates UserBadge from a dict.
        
        Args:
            user_badge_dict: dict. Dictionary representation of UserBadge.
            
        Returns:
            UserBadge. The corresponding UserBadge object.
        """
        return cls(
            user_badge_id=user_badge_dict.get('user_badge_id', ''),
            user_id=user_badge_dict.get('user_id', ''),
            badge_id=user_badge_dict.get('badge_id', ''),
            awarded_date=user_badge_dict.get('awarded_date'),
            times_earned=user_badge_dict.get('times_earned', 1),
            progress_data=user_badge_dict.get('progress_data', {}),
            share_count=user_badge_dict.get('share_count', 0),
            is_favorite=user_badge_dict.get('is_favorite', False)
        )

    def validate(self) -> None:
        """Validates this UserBadge domain object.
        
        Raises:
            ValueError. If any required field is invalid.
        """
        if not self.user_id:
            raise ValueError('User ID is required')
        if not self.badge_id:
            raise ValueError('Badge ID is required')
        if self.times_earned < 1:
            raise ValueError('Times earned must be at least 1')
        if self.share_count < 0:
            raise ValueError('Share count cannot be negative')


class BadgeCollection:
    """Domain object for a badge collection.
    
    Attributes:
        collection_id: str. Unique identifier for the collection.
        name: str. Name of the collection.
        description: str. Description of the collection.
        badge_ids: list(str). List of badge IDs in the collection.
        completion_reward_xp: int. XP reward for completing the collection.
        created_on: datetime. Creation timestamp.
        updated_on: datetime. Last update timestamp.
    """

    def __init__(
        self,
        collection_id: str,
        name: str,
        description: str,
        badge_ids: Optional[List[str]] = None,
        completion_reward_xp: int = 0,
        created_on: Optional[datetime.datetime] = None,
        updated_on: Optional[datetime.datetime] = None
    ) -> None:
        """Constructs a BadgeCollection domain object.
        
        Args:
            collection_id: str. Unique identifier.
            name: str. Collection name.
            description: str. Collection description.
            badge_ids: list(str). Badge IDs in collection.
            completion_reward_xp: int. Completion XP reward.
            created_on: datetime. Creation timestamp.
            updated_on: datetime. Update timestamp.
        """
        self.collection_id = collection_id
        self.name = name
        self.description = description
        self.badge_ids = badge_ids or []
        self.completion_reward_xp = completion_reward_xp
        self.created_on = created_on or datetime.datetime.utcnow()
        self.updated_on = updated_on or datetime.datetime.utcnow()

    def to_dict(self) -> Dict[str, Any]:
        """Returns a dict representing this BadgeCollection domain object.
        
        Returns:
            dict. Dictionary representation of BadgeCollection.
        """
        return {
            'collection_id': self.collection_id,
            'name': self.name,
            'description': self.description,
            'badge_ids': self.badge_ids,
            'completion_reward_xp': self.completion_reward_xp,
            'created_on': self.created_on.isoformat() if self.created_on else None,
            'updated_on': self.updated_on.isoformat() if self.updated_on else None
        }

    @classmethod
    def from_dict(cls, collection_dict: Dict[str, Any]) -> BadgeCollection:
        """Creates BadgeCollection from a dict.
        
        Args:
            collection_dict: dict. Dictionary representation of BadgeCollection.
            
        Returns:
            BadgeCollection. The corresponding BadgeCollection object.
        """
        return cls(
            collection_id=collection_dict.get('collection_id', ''),
            name=collection_dict.get('name', ''),
            description=collection_dict.get('description', ''),
            badge_ids=collection_dict.get('badge_ids', []),
            completion_reward_xp=collection_dict.get('completion_reward_xp', 0),
            created_on=collection_dict.get('created_on'),
            updated_on=collection_dict.get('updated_on')
        )


class BadgeAnalytics:
    """Domain object for badge analytics and engagement metrics.
    
    Attributes:
        badge_id: str. ID of the badge.
        total_awards: int. Total number of times badge has been awarded.
        total_shares: int. Total number of times badge has been shared.
        total_favorites: int. Total number of times badge has been marked favorite.
        average_time_to_earn: int. Average time (in days) to earn the badge.
        leaderboard_rank: int. Badge's rank on the leaderboard.
        engagement_score: float. Engagement score (0-100).
    """

    def __init__(
        self,
        badge_id: str,
        total_awards: int = 0,
        total_shares: int = 0,
        total_favorites: int = 0,
        average_time_to_earn: int = 0,
        leaderboard_rank: int = 0,
        engagement_score: float = 0.0
    ) -> None:
        """Constructs a BadgeAnalytics domain object.
        
        Args:
            badge_id: str. Badge ID.
            total_awards: int. Total awards count.
            total_shares: int. Total shares count.
            total_favorites: int. Total favorites count.
            average_time_to_earn: int. Average time in days.
            leaderboard_rank: int. Leaderboard rank.
            engagement_score: float. Engagement score.
        """
        self.badge_id = badge_id
        self.total_awards = total_awards
        self.total_shares = total_shares
        self.total_favorites = total_favorites
        self.average_time_to_earn = average_time_to_earn
        self.leaderboard_rank = leaderboard_rank
        self.engagement_score = engagement_score

    def to_dict(self) -> Dict[str, Any]:
        """Returns a dict representing this BadgeAnalytics domain object.
        
        Returns:
            dict. Dictionary representation of BadgeAnalytics.
        """
        return {
            'badge_id': self.badge_id,
            'total_awards': self.total_awards,
            'total_shares': self.total_shares,
            'total_favorites': self.total_favorites,
            'average_time_to_earn': self.average_time_to_earn,
            'leaderboard_rank': self.leaderboard_rank,
            'engagement_score': self.engagement_score
        }

    @classmethod
    def from_dict(cls, analytics_dict: Dict[str, Any]) -> BadgeAnalytics:
        """Creates BadgeAnalytics from a dict.
        
        Args:
            analytics_dict: dict. Dictionary representation of BadgeAnalytics.
            
        Returns:
            BadgeAnalytics. The corresponding BadgeAnalytics object.
        """
        return cls(
            badge_id=analytics_dict.get('badge_id', ''),
            total_awards=analytics_dict.get('total_awards', 0),
            total_shares=analytics_dict.get('total_shares', 0),
            total_favorites=analytics_dict.get('total_favorites', 0),
            average_time_to_earn=analytics_dict.get('average_time_to_earn', 0),
            leaderboard_rank=analytics_dict.get('leaderboard_rank', 0),
            engagement_score=analytics_dict.get('engagement_score', 0.0)
        )