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
from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

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
        except Exception as e:
            raise self.PageNotFoundException(e)

        (
            question_summaries, merged_question_skill_links,
            next_start_cursor) = (
                question_services.get_displayable_question_skill_link_details(
                    constants.NUM_QUESTIONS_PER_PAGE, skill_ids, start_cursor)
            )
        return_dicts = []
        for index, summary in enumerate(question_summaries):
            if summary is not None:
                if len(skill_ids) == 1:
                    return_dicts.append({
                        'summary': summary.to_dict(),
                        'skill_id': merged_question_skill_links[
                            index].skill_ids[0],
                        'skill_description': (
                            merged_question_skill_links[
                                index].skill_descriptions[0]),
                        'skill_difficulty': (
                            merged_question_skill_links[
                                index].skill_difficulties[0])
                    })
                else:
                    return_dicts.append({
                        'summary': summary.to_dict(),
                        'skill_ids': merged_question_skill_links[
                            index].skill_ids,
                        'skill_descriptions': (
                            merged_question_skill_links[
                                index].skill_descriptions),
                        'skill_difficulties': (
                            merged_question_skill_links[
                                index].skill_difficulties)
                    })

        self.values.update({
            'question_summary_dicts': return_dicts,
            'next_start_cursor': next_start_cursor
        })
        self.render_json(self.values)
