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
from core.domain import topic_domain
from core.domain import topic_services
from core.domain import skill_domain
from core.domain import skill_services
import feconf


class NewTopic(base.BaseHandler):
    """Creates a new topic."""

    @acl_decorators.can_access_admin_page
    def post(self):
        """Handles POST requests."""
        name = self.payload.get('name', feconf.DEFAULT_TOPIC_NAME)

        new_topic_id = topic_services.get_new_topic_id()
        topic = topic_domain.Topic.create_default_topic(
            new_topic_id, name=name)
        topic_services.save_new_topic(self.user_id, topic)

        self.render_json({
            TOPIC_ID_KEY: new_topic_id
        })

class NewSkill(base.BaseHandler):
    """Creates a new skill."""

    @acl_decorators.can_access_admin_page
    def post(self):
        new_skill_id = skill_services.get_new_skill_id()
        skill = skill_domain.Skill.create_default_skill(new_skill_id)
        skill_services.save_new_skill(self.user_id, skill)

        self.render_json({
            SKILL_ID_KEY: new_skill_id
        })
