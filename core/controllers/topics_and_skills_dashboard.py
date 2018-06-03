# Copyright 2018 The Oppia Authors. All Rights Reserved.
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

"""Controllers for the topics and skills dashboard, from where topics and skills
are created.
"""
from core.controllers import base
from core.domain import acl_decorators
from core.domain import skill_domain
from core.domain import skill_services
from core.domain import topic_domain
from core.domain import topic_services
import feconf


class TopicsAndSkillsDashboardPage(base.BaseHandler):
    """Page showing the topics and skills dashboard."""

    @acl_decorators.can_access_admin_page
    def get(self):

        if not feconf.ENABLE_NEW_STRUCTURES:
            raise self.PageNotFoundException()

        self.values.update({
            'nav_mode': feconf.NAV_MODE_TOPICS_AND_SKILLS_DASHBOARD
        })
        self.render_template(
            'pages/topics_and_skills_dashboard/'
            'topics_and_skills_dashboard.html', redirect_url_on_logout='/')


class NewTopicHandler(base.BaseHandler):
    """Creates a new topic."""

    @acl_decorators.can_access_admin_page
    def post(self):
        """Handles POST requests."""
        if not feconf.ENABLE_NEW_STRUCTURES:
            raise self.PageNotFoundException()
        name = self.payload.get('name')

        if not isinstance(name, basestring):
            raise self.InvalidInputException(
                Exception('Name should be a string.'))

        if name == '':
            raise self.InvalidInputException(
                Exception('Name field should not be empty'))

        new_topic_id = topic_services.get_new_topic_id()
        topic = topic_domain.Topic.create_default_topic(new_topic_id, name)
        topic_services.save_new_topic(self.user_id, topic)

        self.render_json({
            'topicId': new_topic_id
        })


class NewSkillHandler(base.BaseHandler):
    """Creates a new skill."""

    @acl_decorators.can_access_admin_page
    def post(self):
        if not feconf.ENABLE_NEW_STRUCTURES:
            raise self.PageNotFoundException()
        description = self.payload.get('description')

        if not isinstance(description, basestring):
            raise self.InvalidInputException(
                Exception('Description should be a string.'))

        if description == '':
            raise self.InvalidInputException(
                Exception('Description field should not be empty'))

        new_skill_id = skill_services.get_new_skill_id()
        skill = skill_domain.Skill.create_default_skill(
            new_skill_id, description)
        skill_services.save_new_skill(self.user_id, skill)

        self.render_json({
            'skillId': new_skill_id
        })
