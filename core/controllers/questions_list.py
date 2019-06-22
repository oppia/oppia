# Copyright 2019 The Oppia Authors. All Rights Reserved.
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

"""Controllers for the questions list in topic editors and skill editors."""

from constants import constants
from core.controllers import acl_decorators
from core.controllers import base
from core.domain import question_services
from core.domain import skill_domain
from core.domain import skill_services
import feconf


class QuestionsListHandler(base.BaseHandler):
    """Manages receiving of all question summaries for display in topic editor
    and skill editor page.
    """
    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    @acl_decorators.open_access
    def get(self, comma_separated_skill_ids):
        """Handles GET requests."""
        start_cursor = self.request.get('cursor')
        skill_ids = comma_separated_skill_ids.split(',')

        for skill_id in skill_ids:
            try:
                skill_domain.Skill.require_valid_skill_id(skill_id)
            except Exception:
                raise self.PageNotFoundException(Exception('Invalid skill id'))

        try:
            skill_services.get_multi_skills(skill_ids)
        except Exception, e:
            raise self.PageNotFoundException(e)

        question_summaries, skill_descriptions_list, next_start_cursor = (
            question_services.get_question_summaries_and_skill_descriptions(
                constants.NUM_QUESTIONS_PER_PAGE, skill_ids, start_cursor)
        )
        return_dicts = []
        for index, summary in enumerate(question_summaries):
            return_dicts.append({
                'summary': summary.to_dict(),
                'skill_descriptions': skill_descriptions_list[index]
            })

        self.values.update({
            'question_summary_dicts': return_dicts,
            'next_start_cursor': next_start_cursor
        })
        self.render_json(self.values)
