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

"""Services for the Gamification Badge System."""

from __future__ import annotations

import datetime
import logging
from typing import Any, Dict, List, Optional

from core.domain import badge_domain
from core.storage.badge import badge_models

# Cache configuration
BADGE_CACHE_TTL = 300  # 5 minutes
LEADERBOARD_CACHE_TTL = 600  # 10 minutes


class BadgeService:
    """Service for badge CRUD operations."""

    @classmethod
    def create_badge(
        cls,
        badge_id: str,
        name: str,
        description: str,
        icon_svg: str,
        rarity: str,
        badge_type: str,
        tier: str,
        criteria_dict: Dict[str, Any],
        category: str,
        xp_reward: int = 10,
        points: int = 0,
        evolution_chain: Optional[List[str]] = None,
        collection_id: Optional[str] = None
    ) -> badge_domain.Badge:
        """Create a new badge.
        
        Args:
            badge_id: str. Unique badge identifier.
            name: str. Badge name.
            description: str. Badge description.
            icon_svg: str. SVG content for the badge icon.
            rarity: str. Badge rarity level.
            badge_type: str. Badge type.
            tier: str. Badge tier level.
            criteria_dict: dict. Badge criteria as dictionary.
            category: str. Badge category.
            xp_reward: int. XP reward (default 10).
            points: int. Points reward (default 0).
            evolution_chain: list(str). Evolution chain (default None).
            collection_id: str. Collection ID (default None).
            
        Returns:
            Badge. The created badge domain object.
            
        Raises:
            ValueError. If validation fails.
        """
        try:
            rarity_enum = badge_domain.BadgeRarity(rarity)
            badge_type_enum = badge_domain.BadgeType(badge_type)
            tier_enum = badge_domain.BadgeTier(tier)
            category_enum = badge_domain.BadgeCategory(category)
        except ValueError as e:
            raise ValueError(f'Invalid badge enum value: {str(e)}')

        criteria = badge_domain.BadgeCriteria.from_dict(criteria_dict)
        
        badge = badge_domain.Badge(
            badge_id=badge_id,
            name=name,
            description=description,
            icon_svg=icon_svg,
            rarity=rarity_enum,
            badge_type=badge_type_enum,
            tier=tier_enum,
            criteria=criteria,
            category=category_enum,
            xp_reward=xp_reward,
            points=points,
            evolution_chain=evolution_chain or [],
            collection_id=collection_id
        )
        
        badge.validate()
        
        # Create and save the model
        badge_model = badge_models.BadgeModel(
            id=badge_id,
            name=name,
            description=description,
            icon_svg=icon_svg,
            rarity=rarity,
            tier=tier,
            badge_type=badge_type,
            criteria=criteria.to_dict(),
            category=category,
            xp_reward=xp_reward,
            points=points,
            evolution_chain=evolution_chain or [],
            collection_id=collection_id,
            keywords=[name.lower(), category.lower()]
        )
        badge_model.put()
        
        logging.info(f'Created badge: {badge_id}')
        return badge

    @classmethod
    def get_badge(cls, badge_id: str) -> Optional[badge_domain.Badge]:
        """Retrieve a badge by ID.
        
        Args:
            badge_id: str. Badge ID.
            
        Returns:
            Badge or None. The badge domain object if found.
        """
        badge_model = badge_models.BadgeModel.get_by_id(badge_id)
        if badge_model:
            return cls._model_to_domain(badge_model)
        return None

    @classmethod
    def get_all_badges(
        cls,
        limit: int = 100,
        offset: int = 0
    ) -> tuple[List[badge_domain.Badge], int]:
        """Get all badges with pagination.
        
        Args:
            limit: int. Number of badges to return.
            offset: int. Number of badges to skip.
            
        Returns:
            tuple. (List of badges, total count).
        """
        query = badge_models.BadgeModel.query()
        total_count = query.count()
        
        badge_models_list = query.fetch(limit=limit, offset=offset)
        badges = [cls._model_to_domain(model) for model in badge_models_list]
        
        return badges, total_count

    @classmethod
    def get_badges_by_category(
        cls,
        category: str
    ) -> List[badge_domain.Badge]:
        """Get all badges in a category.
        
        Args:
            category: str. Badge category.
            
        Returns:
            list(Badge). Badges in the category.
        """
        badge_models_list = badge_models.BadgeModel.get_by_category(category)
        return [cls._model_to_domain(model) for model in badge_models_list]

    @classmethod
    def get_badges_by_rarity(
        cls,
        rarity: str
    ) -> List[badge_domain.Badge]:
        """Get all badges of a rarity.
        
        Args:
            rarity: str. Badge rarity level.
            
        Returns:
            list(Badge). Badges with the rarity.
        """
        badge_models_list = badge_models.BadgeModel.get_by_rarity(rarity)
        return [cls._model_to_domain(model) for model in badge_models_list]

    @classmethod
    def search_badges(cls, keyword: str) -> List[badge_domain.Badge]:
        """Search badges by keyword.
        
        Args:
            keyword: str. Search keyword.
            
        Returns:
            list(Badge). Matching badges.
        """
        badge_models_list = badge_models.BadgeModel.search_by_name(
            keyword.lower()
        )
        return [cls._model_to_domain(model) for model in badge_models_list]

    @classmethod
    def update_badge(
        cls,
        badge_id: str,
        update_dict: Dict[str, Any]
    ) -> Optional[badge_domain.Badge]:
        """Update a badge.
        
        Args:
            badge_id: str. Badge ID.
            update_dict: dict. Fields to update.
            
        Returns:
            Badge or None. Updated badge if found.
        """
        badge_model = badge_models.BadgeModel.get_by_id(badge_id)
        if not badge_model:
            return None

        for key, value in update_dict.items():
            if key == 'criteria' and isinstance(value, dict):
                badge_model.criteria = value
            elif hasattr(badge_model, key):
                setattr(badge_model, key, value)

        badge_model.last_updated = datetime.datetime.utcnow()
        badge_model.put()
        
        logging.info(f'Updated badge: {badge_id}')
        return cls._model_to_domain(badge_model)

    @classmethod
    def delete_badge(cls, badge_id: str) -> bool:
        """Delete a badge.
        
        Args:
            badge_id: str. Badge ID.
            
        Returns:
            bool. True if deleted, False if not found.
        """
        badge_model = badge_models.BadgeModel.get_by_id(badge_id)
        if badge_model:
            badge_model.key.delete()
            logging.info(f'Deleted badge: {badge_id}')
            return True
        return False

    @classmethod
    def _model_to_domain(cls, badge_model: badge_models.BadgeModel) -> badge_domain.Badge:
        """Convert a BadgeModel to Badge domain object.
        
        Args:
            badge_model: BadgeModel. The storage model.
            
        Returns:
            Badge. The domain object.
        """
        criteria = badge_domain.BadgeCriteria.from_dict(badge_model.criteria)
        return badge_domain.Badge(
            badge_id=badge_model.key.id(),
            name=badge_model.name,
            description=badge_model.description,
            icon_svg=badge_model.icon_svg,
            rarity=badge_domain.BadgeRarity(badge_model.rarity),
            badge_type=badge_domain.BadgeType(badge_model.badge_type),
            tier=badge_domain.BadgeTier(badge_model.tier),
            criteria=criteria,
            category=badge_domain.BadgeCategory(badge_model.category),
            xp_reward=badge_model.xp_reward,
            points=badge_model.points,
            evolution_chain=badge_model.evolution_chain,
            collection_id=badge_model.collection_id,
            total_awards=badge_model.total_awards,
            created_on=badge_model.created_on,
            last_updated=badge_model.last_updated
        )


class UserBadgeService:
    """Service for user badge operations."""

    @classmethod
    def award_badge_to_user(
        cls,
        user_id: str,
        badge_id: str,
        progress_data: Optional[Dict[str, Any]] = None
    ) -> Optional[badge_domain.UserBadge]:
        """Award a badge to a user.
        
        Args:
            user_id: str. User ID.
            badge_id: str. Badge ID.
            progress_data: dict. Progress data (default None).
            
        Returns:
            UserBadge or None. The user badge if successfully awarded.
        """
        # Check if badge exists
        badge = BadgeService.get_badge(badge_id)
        if not badge:
            logging.error(f'Badge not found: {badge_id}')
            return None

        # Check if user already has this badge
        existing = badge_models.UserBadgeModel.get_user_badge(user_id, badge_id)
        if existing:
            # Badge already earned, increment times_earned
            existing.times_earned += 1
            existing.last_updated = datetime.datetime.utcnow()
            existing.put()
            return cls._model_to_domain(existing)

        # Create new user badge record
        user_badge_model = badge_models.UserBadgeModel(
            user_id=user_id,
            badge_id=badge_id,
            awarded_date=datetime.datetime.utcnow(),
            times_earned=1,
            progress_data=progress_data or {}
        )
        user_badge_model.put()
        
        # Update badge total awards count
        badge_model = badge_models.BadgeModel.get_by_id(badge_id)
        if badge_model:
            badge_model.total_awards += 1
            badge_model.last_awarded = datetime.datetime.utcnow()
            badge_model.put()
        
        logging.info(f'Awarded badge {badge_id} to user {user_id}')
        return cls._model_to_domain(user_badge_model)

    @classmethod
    def get_user_badges(
        cls,
        user_id: str
    ) -> tuple[List[badge_domain.UserBadge], List[badge_domain.Badge]]:
        """Get all badges earned by a user.
        
        Args:
            user_id: str. User ID.
            
        Returns:
            tuple. (List of user badges, list of badge details).
        """
        user_badge_models = badge_models.UserBadgeModel.get_user_badges(user_id)
        user_badges = [cls._model_to_domain(model) for model in user_badge_models]
        
        # Get badge details
        badge_details = []
        for user_badge in user_badges:
            badge = BadgeService.get_badge(user_badge.badge_id)
            if badge:
                badge_details.append(badge)
        
        return user_badges, badge_details

    @classmethod
    def get_user_badge_count(cls, user_id: str) -> int:
        """Get count of badges earned by user.
        
        Args:
            user_id: str. User ID.
            
        Returns:
            int. Number of badges earned.
        """
        return badge_models.UserBadgeModel.get_user_badge_count(user_id)

    @classmethod
    def toggle_favorite(
        cls,
        user_id: str,
        badge_id: str,
        is_favorite: bool
    ) -> Optional[badge_domain.UserBadge]:
        """Toggle favorite status of a badge.
        
        Args:
            user_id: str. User ID.
            badge_id: str. Badge ID.
            is_favorite: bool. New favorite status.
            
        Returns:
            UserBadge or None. Updated user badge if found.
        """
        user_badge_model = badge_models.UserBadgeModel.get_user_badge(
            user_id, badge_id
        )
        if not user_badge_model:
            return None

        user_badge_model.is_favorite = is_favorite
        user_badge_model.last_updated = datetime.datetime.utcnow()
        user_badge_model.put()
        
        return cls._model_to_domain(user_badge_model)

    @classmethod
    def increment_share_count(
        cls,
        user_id: str,
        badge_id: str
    ) -> Optional[badge_domain.UserBadge]:
        """Increment share count for a badge.
        
        Args:
            user_id: str. User ID.
            badge_id: str. Badge ID.
            
        Returns:
            UserBadge or None. Updated user badge if found.
        """
        user_badge_model = badge_models.UserBadgeModel.get_user_badge(
            user_id, badge_id
        )
        if not user_badge_model:
            return None

        user_badge_model.share_count += 1
        user_badge_model.last_updated = datetime.datetime.utcnow()
        user_badge_model.put()
        
        # Update badge analytics
        analytics = badge_models.BadgeAnalyticsModel.get_by_id(badge_id)
        if analytics:
            analytics.total_shares += 1
            analytics.put()
        
        return cls._model_to_domain(user_badge_model)

    @classmethod
    def get_user_favorites(
        cls,
        user_id: str
    ) -> List[badge_domain.UserBadge]:
        """Get user's favorite badges.
        
        Args:
            user_id: str. User ID.
            
        Returns:
            list(UserBadge). User's favorite badges.
        """
        user_badge_models = badge_models.UserBadgeModel.get_user_favorites(user_id)
        return [cls._model_to_domain(model) for model in user_badge_models]

    @classmethod
    def _model_to_domain(
        cls,
        user_badge_model: badge_models.UserBadgeModel
    ) -> badge_domain.UserBadge:
        """Convert UserBadgeModel to UserBadge domain object.
        
        Args:
            user_badge_model: UserBadgeModel. The storage model.
            
        Returns:
            UserBadge. The domain object.
        """
        return badge_domain.UserBadge(
            user_badge_id=user_badge_model.key.id(),
            user_id=user_badge_model.user_id,
            badge_id=user_badge_model.badge_id,
            awarded_date=user_badge_model.awarded_date,
            times_earned=user_badge_model.times_earned,
            progress_data=user_badge_model.progress_data,
            share_count=user_badge_model.share_count,
            is_favorite=user_badge_model.is_favorite
        )


class BadgeAwardingService:
    """Service for automatic badge awarding based on user activities."""

    @classmethod
    def check_and_award_badges(
        cls,
        user_id: str,
        event_type: str,
        event_data: Optional[Dict[str, Any]] = None
    ) -> List[str]:
        """Check if any badges should be awarded based on an event.
        
        Args:
            user_id: str. User ID.
            event_type: str. Type of event that occurred.
            event_data: dict. Additional event data.
            
        Returns:
            list(str). IDs of badges that were awarded.
        """
        awarded_badge_ids = []
        event_data = event_data or {}
        
        # Get all badges and check criteria
        all_badges, _ = BadgeService.get_all_badges(limit=1000)
        
        for badge in all_badges:
            # Check if criteria matches the event
            if cls._should_award_badge(user_id, badge, event_type, event_data):
                awarded = UserBadgeService.award_badge_to_user(
                    user_id,
                    badge.badge_id,
                    event_data
                )
                if awarded:
                    awarded_badge_ids.append(badge.badge_id)
        
        return awarded_badge_ids

    @classmethod
    def _should_award_badge(
        cls,
        user_id: str,
        badge: badge_domain.Badge,
        event_type: str,
        event_data: Dict[str, Any]
    ) -> bool:
        """Determine if a badge should be awarded.
        
        Args:
            user_id: str. User ID.
            badge: Badge. The badge to check.
            event_type: str. Type of event.
            event_data: dict. Event data.
            
        Returns:
            bool. True if badge should be awarded.
        """
        # Check if event type matches badge criteria
        if badge.criteria.condition_type != event_type:
            return False

        # Check prerequisites
        if badge.criteria.prerequisites:
            for prereq_id in badge.criteria.prerequisites:
                existing = badge_models.UserBadgeModel.get_user_badge(
                    user_id, prereq_id
                )
                if not existing:
                    return False

        # Check if criteria threshold is met
        current_progress = event_data.get('progress', 0)
        if not badge.criteria.is_criteria_met(current_progress):
            return False

        return True

    @classmethod
    def update_badge_progress(
        cls,
        user_id: str,
        badge_id: str,
        current_progress: int,
        progress_data: Optional[Dict[str, Any]] = None
    ) -> Optional[badge_domain.UserBadge]:
        """Update progress for a badge.
        
        Args:
            user_id: str. User ID.
            badge_id: str. Badge ID.
            current_progress: int. Current progress value.
            progress_data: dict. Detailed progress data.
            
        Returns:
            UserBadge or None. Updated user badge if found.
        """
        # Get or create progress model
        progress_model = badge_models.UserBadgeProgressModel.get_user_progress(
            user_id, badge_id
        )
        
        if not progress_model:
            progress_model = badge_models.UserBadgeProgressModel(
                user_id=user_id,
                badge_id=badge_id,
                current_progress=current_progress,
                progress_data=progress_data or {}
            )
        else:
            progress_model.current_progress = current_progress
            if progress_data:
                progress_model.progress_data = progress_data

        progress_model.last_progress_date = datetime.datetime.utcnow()
        progress_model.put()
        
        return None


class BadgeAnalyticsService:
    """Service for badge analytics and statistics."""

    @classmethod
    def get_leaderboard(
        cls,
        limit: int = 20
    ) -> List[Dict[str, Any]]:
        """Get badge leaderboard.
        
        Args:
            limit: int. Number of badges to return.
            
        Returns:
            list(dict). Top badges with analytics.
        """
        analytics_models = badge_models.BadgeAnalyticsModel.get_leaderboard(
            limit=limit
        )
        
        leaderboard = []
        for i, analytics in enumerate(analytics_models, 1):
            badge = BadgeService.get_badge(analytics.badge_id)
            if badge:
                leaderboard.append({
                    'rank': i,
                    'badge_id': analytics.badge_id,
                    'name': badge.name,
                    'total_awards': analytics.total_awards,
                    'total_shares': analytics.total_shares,
                    'total_favorites': analytics.total_favorites,
                    'engagement_score': analytics.engagement_score
                })
        
        return leaderboard

    @classmethod
    def get_user_statistics(cls, user_id: str) -> Dict[str, Any]:
        """Get badge statistics for a user.
        
        Args:
            user_id: str. User ID.
            
        Returns:
            dict. User badge statistics.
        """
        user_badges, badge_details = UserBadgeService.get_user_badges(user_id)
        
        # Calculate statistics
        total_badges = len(user_badges)
        total_xp = sum(badge.xp_reward for badge in badge_details)
        total_points = sum(badge.points for badge in badge_details)
        
        # Count by rarity
        rarity_counts = {}
        for badge in badge_details:
            rarity = badge.rarity.value
            rarity_counts[rarity] = rarity_counts.get(rarity, 0) + 1
        
        # Count by tier
        tier_counts = {}
        for badge in badge_details:
            tier = badge.tier.value
            tier_counts[tier] = tier_counts.get(tier, 0) + 1
        
        return {
            'total_badges': total_badges,
            'total_xp': total_xp,
            'total_points': total_points,
            'by_rarity': rarity_counts,
            'by_tier': tier_counts,
            'favorite_count': len(UserBadgeService.get_user_favorites(user_id))
        }

    @classmethod
    def update_badge_analytics(cls, badge_id: str) -> None:
        """Update analytics for a badge.
        
        Args:
            badge_id: str. Badge ID.
        """
        # Get or create analytics model
        analytics = badge_models.BadgeAnalyticsModel.get_by_id(badge_id)
        if not analytics:
            analytics = badge_models.BadgeAnalyticsModel(
                id=badge_id,
                badge_id=badge_id
            )

        # Get badge model for current award count
        badge_model = badge_models.BadgeModel.get_by_id(badge_id)
        if badge_model:
            analytics.total_awards = badge_model.total_awards

        # Calculate engagement score
        score = (
            analytics.total_awards * 1.0 +
            analytics.total_shares * 2.0 +
            analytics.total_favorites * 1.5
        )
        analytics.engagement_score = min(100.0, score)
        analytics.updated_on = datetime.datetime.utcnow()
        analytics.put()


class BadgeAwardingService:
    """Service for automatically awarding badges based on user activities."""

    @classmethod
    def check_and_award_badges(
        cls,
        user_id: str,
        event_type: str,
        event_data: Dict[str, Any]
    ) -> List[str]:
        """Check and award badges for a user based on an activity event.
        
        Args:
            user_id: str. User ID.
            event_type: str. Type of event (lesson_complete, course_complete, etc).
            event_data: dict. Event data containing activity information.
            
        Returns:
            list(str). List of badge IDs that were awarded.
        """
        from core import feconf
        
        if not feconf.BADGE_SYSTEM_ENABLED or not feconf.BADGE_AWARDING_ENABLED:
            return []
        
        awarded_badge_ids = []
        
        try:
            # Get all badges that match the event type
            badges = BadgeService.get_all_badges()
            
            for badge in badges:
                # Check if badge criteria are met
                if cls._check_criteria_met(badge, event_type, event_data):
                    # Check if user doesn't already have this badge
                    existing_badge = UserBadgeService.get_user_badge(
                        user_id, badge.badge_id
                    )
                    
                    if not existing_badge:
                        # Award the badge
                        UserBadgeService.award_badge(
                            user_id,
                            badge.badge_id,
                            reason=event_type
                        )
                        awarded_badge_ids.append(badge.badge_id)
                        
                        # Update badge analytics
                        BadgeAnalyticsService.update_badge_analytics(
                            badge.badge_id
                        )
        except Exception as e:
            logging.error(
                f'Error awarding badges for user {user_id}: {str(e)}'
            )
        
        return awarded_badge_ids

    @classmethod
    def _check_criteria_met(
        cls,
        badge: badge_domain.Badge,
        event_type: str,
        event_data: Dict[str, Any]
    ) -> bool:
        """Check if badge criteria are met for an event.
        
        Args:
            badge: Badge. Badge domain object.
            event_type: str. Type of event.
            event_data: dict. Event data.
            
        Returns:
            bool. Whether criteria are met.
        """
        if not badge.criteria:
            return False
        
        criteria = badge.criteria
        
        # Check event type match
        if event_type == 'lesson_complete':
            return criteria.event_type == 'lesson_complete'
        elif event_type == 'course_complete':
            return criteria.event_type == 'course_complete'
        elif event_type == 'quiz_submit':
            return criteria.event_type == 'quiz_submit'
        elif event_type == 'daily_login':
            return criteria.event_type == 'daily_login'
        
        return False


class BadgeCacheService:
    """Service for caching badge-related data."""

    BADGE_CACHE_PREFIX = 'badge:'
    USER_BADGE_CACHE_PREFIX = 'user_badges:'

    @classmethod
    def get_cached_badge(cls, badge_id: str) -> Optional[badge_domain.Badge]:
        """Get badge from cache.
        
        Args:
            badge_id: str. Badge ID.
            
        Returns:
            Badge or None. Cached badge if exists.
        """
        try:
            from core.platform import cache_services
            cache_key = f'{cls.BADGE_CACHE_PREFIX}{badge_id}'
            cached_data = cache_services.get_multi([cache_key])
            
            if cache_key in cached_data:
                return cached_data[cache_key]
        except Exception:
            pass
        
        return None

    @classmethod
    def cache_badge(
        cls,
        badge: badge_domain.Badge,
        ttl_secs: int = 300
    ) -> None:
        """Cache a badge.
        
        Args:
            badge: Badge. Badge domain object.
            ttl_secs: int. Time to live in seconds.
        """
        try:
            from core.platform import cache_services
            cache_key = f'{cls.BADGE_CACHE_PREFIX}{badge.badge_id}'
            cache_services.set_multi({cache_key: badge}, ttl_secs=ttl_secs)
        except Exception:
            pass

    @classmethod
    def invalidate_badge_cache(cls, badge_id: str) -> None:
        """Invalidate cached badge.
        
        Args:
            badge_id: str. Badge ID.
        """
        try:
            from core.platform import cache_services
            cache_key = f'{cls.BADGE_CACHE_PREFIX}{badge_id}'
            cache_services.delete_multi([cache_key])
        except Exception:
            pass

    @classmethod
    def get_cached_user_badges(
        cls,
        user_id: str
    ) -> Optional[List[badge_domain.UserBadge]]:
        """Get user badges from cache.
        
        Args:
            user_id: str. User ID.
            
        Returns:
            list(UserBadge) or None. Cached user badges if exist.
        """
        try:
            from core.platform import cache_services
            cache_key = f'{cls.USER_BADGE_CACHE_PREFIX}{user_id}'
            cached_data = cache_services.get_multi([cache_key])
            
            if cache_key in cached_data:
                return cached_data[cache_key]
        except Exception:
            pass
        
        return None

    @classmethod
    def cache_user_badges(
        cls,
        user_id: str,
        user_badges: List[badge_domain.UserBadge],
        ttl_secs: int = 300
    ) -> None:
        """Cache user badges.
        
        Args:
            user_id: str. User ID.
            user_badges: list(UserBadge). User badges to cache.
            ttl_secs: int. Time to live in seconds.
        """
        try:
            from core.platform import cache_services
            cache_key = f'{cls.USER_BADGE_CACHE_PREFIX}{user_id}'
            cache_services.set_multi(
                {cache_key: user_badges},
                ttl_secs=ttl_secs
            )
        except Exception:
            pass

    @classmethod
    def invalidate_user_badge_cache(cls, user_id: str) -> None:
        """Invalidate cached user badges.
        
        Args:
            user_id: str. User ID.
        """
        try:
            from core.platform import cache_services
            cache_key = f'{cls.USER_BADGE_CACHE_PREFIX}{user_id}'
            cache_services.delete_multi([cache_key])
        except Exception:
            pass