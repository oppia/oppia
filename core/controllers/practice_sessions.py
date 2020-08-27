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

"""Controllers for the practice sessions page."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.controllers import acl_decorators
from core.controllers import base
from core.domain import skill_fetchers
from core.domain import topic_fetchers
import feconf
import python_utils


class PracticeSessionsPage(base.BaseHandler):
    """Renders the practice sessions page."""

    @acl_decorators.can_access_topic_viewer_page
    def get(self, _):
        """Handles GET requests."""

        self.render_template('practice-session-page.mainpage.html')


class PracticeSessionsPageDataHandler(base.BaseHandler):
    """Fetches relevant data for the practice sessions page."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    @acl_decorators.can_access_topic_viewer_page
    def get(self, topic_name):

        # Topic cannot be None as an exception will be thrown from its decorator
        # if so.
        topic = topic_fetchers.get_topic_by_name(topic_name)
        comma_separated_subtopic_ids = self.request.get('selected_subtopic_ids')
        selected_subtopic_ids = comma_separated_subtopic_ids.split(',')

        selected_skill_ids = []
        for subtopic in topic.subtopics:
            # An error is not thrown here, since it's fine to just ignore the
            # passed in subtopic IDs, if they don't exist, which would be the
            # case if the creator deletes subtopics after the learner has
            # loaded the topic viewer page.
            if python_utils.UNICODE(subtopic.id) in selected_subtopic_ids:
                selected_skill_ids.extend(subtopic.skill_ids)
        try:
            skills = skill_fetchers.get_multi_skills(selected_skill_ids)
        except Exception as e:
            raise self.PageNotFoundException(e)
        skill_ids_to_descriptions_map = {}
        for skill in skills:
            skill_ids_to_descriptions_map[skill.id] = skill.description

        self.values.update({
            'topic_name': topic.name,
            'skill_ids_to_descriptions_map': skill_ids_to_descriptions_map
        })
        self.render_json(self.values)
