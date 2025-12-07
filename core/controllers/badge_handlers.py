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

"""API handlers for the Gamification Badge System."""

from __future__ import annotations

import logging
from typing import Any, Dict, Optional

from core.controllers import acl_decorators
from core.controllers import base
from core.domain import badge_services


class BadgeListHandler(base.BaseHandler):
    """Handler for listing badges with filtering and pagination."""

    HANDLER_ARGS_SCHEMAS = {
        'GET': {
            'arg_schemas': {
                'category': {'schema': {'type': 'basestring'}, 'default_value': ''},
                'rarity': {'schema': {'type': 'basestring'}, 'default_value': ''},
                'badge_type': {'schema': {'type': 'basestring'}, 'default_value': ''},
                'search': {'schema': {'type': 'basestring'}, 'default_value': ''},
                'page': {'schema': {'type': 'int'}, 'default_value': 1},
                'page_size': {'schema': {'type': 'int'}, 'default_value': 20}
            }
        }
    }

    def get(self) -> None:
        try:
            category = self.request.get('category', '')
            rarity = self.request.get('rarity', '')
            badge_type = self.request.get('badge_type', '')
            search = self.request.get('search', '')
            page = int(self.request.get('page', 1))
            page_size = int(self.request.get('page_size', 20))

            if page < 1:
                page = 1
            if page_size < 1 or page_size > 100:
                page_size = 20

            offset = (page - 1) * page_size

            if search:
                badges = badge_services.BadgeService.search_badges(search)
            elif category:
                badges = badge_services.BadgeService.get_badges_by_category(category)
            elif rarity:
                badges = badge_services.BadgeService.get_badges_by_rarity(rarity)
            else:
                badges, total_count = badge_services.BadgeService.get_all_badges()

            if rarity and not search and not category:
                badges = [b for b in badges if b.rarity.value == rarity]
            if badge_type:
                badges = [b for b in badges if b.badge_type.value == badge_type]

            total_count = len(badges)
            badges = badges[offset:offset + page_size]

            badges_dicts = [badge.to_dict() for badge in badges]

            self.render_json({
                'badges': badges_dicts,
                'pagination': {
                    'page': page,
                    'page_size': page_size,
                    'total': total_count,
                    'total_pages': (total_count + page_size - 1) // page_size
                }
            })
        except Exception as e:
            logging.error(f'Error listing badges: {str(e)}')
            self.render_json({'error': 'Failed to list badges'}, status_code=500)


class BadgeDetailHandler(base.BaseHandler):
    """Handler for getting badge details."""

    def get(self, badge_id: str) -> None:
        try:
            badge = badge_services.BadgeService.get_badge(badge_id)
            if not badge:
                self.render_json({'error': 'Badge not found'}, status_code=404)
                return

            badge_dict = badge.to_dict()
            badge_dict['analytics'] = {'total_awards': badge.total_awards}

            self.render_json({'badge': badge_dict})
        except Exception as e:
            logging.error(f'Error getting badge details: {str(e)}')
            self.render_json({'error': 'Failed to get badge details'}, status_code=500)


class UserBadgesHandler(base.BaseHandler):
    """Handler for getting user's earned badges."""

    @acl_decorators.can_access_learner_dashboard
    def get(self) -> None:
        try:
            user_id = self.user_id
            if not user_id:
                self.render_json({'error': 'User not authenticated'}, status_code=401)
                return

            only_favorites = self.request.get('only_favorites', 'false').lower() == 'true'
            category = self.request.get('category', '')
            page = int(self.request.get('page', 1))
            page_size = int(self.request.get('page_size', 20))

            if only_favorites:
                user_badges = badge_services.UserBadgeService.get_user_favorites(user_id)
            else:
                user_badges, _ = badge_services.UserBadgeService.get_user_badges(user_id)

            if category:
                filtered = []
                for ub in user_badges:
                    badge = badge_services.BadgeService.get_badge(ub.badge_id)
                    if badge and badge.category.value == category:
                        filtered.append(ub)
                user_badges = filtered

            total_count = len(user_badges)
            offset = (page - 1) * page_size
            user_badges = user_badges[offset:offset + page_size]

            badges_dicts = [ub.to_dict() for ub in user_badges]

            badge_details = []
            for ub_dict in badges_dicts:
                badge = badge_services.BadgeService.get_badge(ub_dict['badge_id'])
                if badge:
                    badge_details.append(badge.to_dict())

            self.render_json({
                'user_badges': badges_dicts,
                'badge_details': badge_details,
                'pagination': {
                    'page': page,
                    'page_size': page_size,
                    'total': total_count,
                    'total_pages': (total_count + page_size - 1) // page_size
                }
            })
        except Exception as e:
            logging.error(f'Error getting user badges: {str(e)}')
            self.render_json({'error': 'Failed to get user badges'}, status_code=500)


class UserBadgeProgressHandler(base.BaseHandler):
    """Handler for getting user's badge progress."""

    @acl_decorators.can_access_learner_dashboard
    def get(self) -> None:
        try:
            user_id = self.user_id
            if not user_id:
                self.render_json({'error': 'User not authenticated'}, status_code=401)
                return

            badge_id = self.request.get('badge_id', '')

            stats = badge_services.BadgeAnalyticsService.get_user_statistics(user_id)

            progress_data = {'statistics': stats}

            if badge_id:
                badge = badge_services.BadgeService.get_badge(badge_id)
                if badge:
                    progress_model = (
                        badge_services.badge_models.UserBadgeProgressModel.get_user_progress(
                            user_id, badge_id
                        )
                    )
                    if progress_model:
                        progress_data['badge_progress'] = {
                            'badge_id': badge_id,
                            'current_progress': progress_model.current_progress,
                            'threshold': badge.criteria.threshold,
                            'progress_percentage': min(
                                100,
                                int(
                                    (progress_model.current_progress / badge.criteria.threshold) * 100
                                ),
                            ),
                            'progress_data': progress_model.progress_data
                        }

            self.render_json(progress_data)
        except Exception as e:
            logging.error(f'Error getting badge progress: {str(e)}')
            self.render_json({'error': 'Failed to get badge progress'}, status_code=500)


class ToggleFavoriteBadgeHandler(base.BaseHandler):
    """Toggle favorite status."""

    @acl_decorators.can_access_learner_dashboard
    def post(self, badge_id: str) -> None:
        try:
            user_id = self.user_id
            if not user_id:
                self.render_json({'error': 'User not authenticated'}, status_code=401)
                return

            payload = self.request.json_body
            is_favorite = payload.get('is_favorite', True)

            updated = badge_services.UserBadgeService.toggle_favorite(
                user_id, badge_id, is_favorite
            )

            if not updated:
                self.render_json({'error': 'Badge not found'}, status_code=404)
                return

            self.render_json({'status': 'success', 'user_badge': updated.to_dict()})
        except Exception as e:
            logging.error(f'Error toggling favorite: {str(e)}')
            self.render_json({'error': 'Failed to toggle favorite'}, status_code=500)


class ShareBadgeHandler(base.BaseHandler):
    """Share a badge."""

    @acl_decorators.can_access_learner_dashboard
    def post(self, badge_id: str) -> None:
        try:
            user_id = self.user_id
            if not user_id:
                self.render_json({'error': 'User not authenticated'}, status_code=401)
                return

            updated = badge_services.UserBadgeService.increment_share_count(user_id, badge_id)

            if not updated:
                self.render_json({'error': 'Badge not found'}, status_code=404)
                return

            self.render_json({'status': 'success', 'share_count': updated.share_count})
        except Exception as e:
            logging.error(f'Error sharing badge: {str(e)}')
            self.render_json({'error': 'Failed to share badge'}, status_code=500)


class BadgeLeaderboardHandler(base.BaseHandler):
    """Leaderboard."""

    def get(self) -> None:
        try:
            limit = int(self.request.get('limit', 20))
            if limit < 1 or limit > 100:
                limit = 20

            leaderboard = badge_services.BadgeAnalyticsService.get_leaderboard(limit=limit)

            self.render_json({'leaderboard': leaderboard})
        except Exception as e:
            logging.error(f'Error getting leaderboard: {str(e)}')
            self.render_json({'error': 'Failed to get leaderboard'}, status_code=500)


# ============================================================
# FIXED ADMIN HANDLERS — NOW USING VALID OPPIA DECORATOR
# ============================================================

class AdminBadgeHandler(base.BaseHandler):
    """Admin create/update/delete badges."""

    @acl_decorators.can_access_admin_page
    def post(self) -> None:
        try:
            payload = self.request.json_body

            badge = badge_services.BadgeService.create_badge(
                badge_id=payload.get('badge_id'),
                name=payload.get('name'),
                description=payload.get('description'),
                icon_svg=payload.get('icon_svg'),
                rarity=payload.get('rarity'),
                badge_type=payload.get('badge_type'),
                tier=payload.get('tier'),
                criteria_dict=payload.get('criteria', {}),
                category=payload.get('category'),
                xp_reward=payload.get('xp_reward', 10),
                points=payload.get('points', 0),
                evolution_chain=payload.get('evolution_chain'),
                collection_id=payload.get('collection_id')
            )

            self.render_json({'status': 'success', 'badge': badge.to_dict()})
        except ValueError as e:
            logging.error(f'Validation error creating badge: {str(e)}')
            self.render_json({'error': str(e)}, status_code=400)
        except Exception as e:
            logging.error(f'Error creating badge: {str(e)}')
            self.render_json({'error': 'Failed to create badge'}, status_code=500)

    @acl_decorators.can_access_admin_page
    def put(self, badge_id: str) -> None:
        try:
            payload = self.request.json_body

            updated = badge_services.BadgeService.update_badge(badge_id, payload)
            if not updated:
                self.render_json({'error': 'Badge not found'}, status_code=404)
                return

            self.render_json({'status': 'success', 'badge': updated.to_dict()})
        except Exception as e:
            logging.error(f'Error updating badge: {str(e)}')
            self.render_json({'error': 'Failed to update badge'}, status_code=500)

    @acl_decorators.can_access_admin_page
    def delete(self, badge_id: str) -> None:
        try:
            deleted = badge_services.BadgeService.delete_badge(badge_id)
            if not deleted:
                self.render_json({'error': 'Badge not found'}, status_code=404)
                return

            self.render_json({'status': 'success'})
        except Exception as e:
            logging.error(f'Error deleting badge: {str(e)}')
            self.render_json({'error': 'Failed to delete badge'}, status_code=500)


class AdminBadgeAwardHandler(base.BaseHandler):
    """Admin awarding badges."""

    @acl_decorators.can_access_admin_page
    def post(self) -> None:
        try:
            payload = self.request.json_body
            user_id = payload.get('user_id')
            badge_id = payload.get('badge_id')

            if not user_id or not badge_id:
                self.render_json(
                    {'error': 'user_id and badge_id are required'},
                    status_code=400
                )
                return

            awarded = badge_services.UserBadgeService.award_badge_to_user(user_id, badge_id)
            if not awarded:
                self.render_json({'error': 'Failed to award badge'}, status_code=400)
                return

            self.render_json({'status': 'success', 'user_badge': awarded.to_dict()})
        except Exception as e:
            logging.error(f'Error awarding badge: {str(e)}')
            self.render_json({'error': 'Failed to award badge'}, status_code=500)


class BadgeProgressUpdateHandler(base.BaseHandler):
    """Update badge progress."""

    @acl_decorators.can_access_learner_dashboard
    def post(self) -> None:
        try:
            user_id = self.user_id
            if not user_id:
                self.render_json({'error': 'User not authenticated'}, status_code=401)
                return

            payload = self.request.json_body
            badge_id = payload.get('badge_id')
            current_progress = payload.get('current_progress', 0)
            progress_data = payload.get('progress_data', {})
            event_type = payload.get('event_type', '')

            if not badge_id:
                self.render_json({'error': 'badge_id is required'}, status_code=400)
                return

            badge_services.BadgeAwardingService.update_badge_progress(
                user_id, badge_id, current_progress, progress_data
            )

            awarded = badge_services.BadgeAwardingService.check_and_award_badges(
                user_id, event_type, {'progress': current_progress, **progress_data}
            )

            self.render_json({'status': 'success', 'awarded_badges': awarded})
        except Exception as e:
            logging.error(f'Error updating progress: {str(e)}')
            self.render_json({'error': 'Failed to update progress'}, status_code=500)
