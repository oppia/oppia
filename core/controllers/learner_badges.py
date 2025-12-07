from core.domain import badge_services
from core.controllers import base

class LearnerBadgeHandler(base.BaseHandler):
    def get(self):
        badges = badge_services.get_all_badges()
        self.render_json({'badges': [badge.to_dict() for badge in badges]})

class UserBadgeHandler(base.BaseHandler):
    def get(self, user_id):
        user_badges = badge_services.get_user_badges(user_id)
        self.render_json(user_badges)

class BadgeDetailHandler(base.BaseHandler):
    def get(self, badge_id):
        badge = badge_services.get_badge_by_id(badge_id)
        if badge:
            self.render_json(badge.to_dict())
        else:
            self.render_json({'error': 'Badge not found'}, status_code=404)

class BadgeProgressHandler(base.BaseHandler):
    def post(self):
        user_id = self.payload.get('user_id')
        event = self.payload.get('event')
        badge_services.update_user_progress(user_id, event)
        awarded_badges = badge_services.check_and_award_badges(user_id)
        self.render_json({'awarded_badges': awarded_badges})

class BadgeSearchHandler(base.BaseHandler):
    def get(self):
        keyword = self.request.get('keyword')
        badges = badge_services.search_badges(keyword)
        self.render_json({'badges': [badge.to_dict() for badge in badges]})

class BadgeCategoryHandler(base.BaseHandler):
    def get(self):
        category = self.request.get('category')
        badges = badge_services.get_badges_by_category(category)
        self.render_json({'badges': [badge.to_dict() for badge in badges]})