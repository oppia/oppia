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

from __future__ import annotations

from core import feconf
from core import utils
from core.constants import constants
from core.controllers import acl_decorators
from core.controllers import base
from core.domain import question_services
from core.domain import skill_domain
from core.domain import skill_fetchers


def _require_valid_skill_ids(skill_ids):
    """Checks whether the given skill ids are valid.

    Args:
        skill_ids: list(str). The skill ids to validate.
    """
    for skill_id in skill_ids:
        skill_domain.Skill.require_valid_skill_id(skill_id)


class QuestionsListHandler(base.BaseHandler):
    """Manages receiving of all question summaries for display in topic editor
    and skill editor page.
    """

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {
        'comma_separated_skill_ids': {
            'schema': {
                'type': 'basestring'
            }
        }
    }
    HANDLER_ARGS_SCHEMAS = {
        'GET': {
            'offset': {
                'schema': {
                    'type': 'int'
                },
                'default_none': None
            }
        }
    }

    @acl_decorators.open_access
    def get(self, comma_separated_skill_ids):
        """Handles GET requests."""
<<<<<<< HEAD

        offset = self.normalized_request.get('offset')

=======
        try:
            offset = self.normalized_request.get('offset')
            
>>>>>>> 429790af99c7a5976060f682ba13457e94a02f2e
        skill_ids = comma_separated_skill_ids.split(',')
        skill_ids = list(set(skill_ids))

        try:
            _require_valid_skill_ids(skill_ids)
        except utils.ValidationError as e:
            raise self.InvalidInputException(
                'Invalid skill id') from e

        try:
            skill_fetchers.get_multi_skills(skill_ids)
        except Exception as e:
            raise self.PageNotFoundException(e)

        question_summaries, merged_question_skill_links = (
            question_services.get_displayable_question_skill_link_details(
                constants.NUM_QUESTIONS_PER_PAGE + 1, skill_ids, offset)
        )

        if len(question_summaries) <= constants.NUM_QUESTIONS_PER_PAGE:
            more = False
        else:
            more = True
            question_summaries.pop()
            merged_question_skill_links.pop()

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
            'more': more
        })
        self.render_json(self.values)


class QuestionCountDataHandler(base.BaseHandler):
    """Provides data regarding the number of questions assigned to the given
    skill ids.
    """

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    @acl_decorators.open_access
    def get(self, comma_separated_skill_ids):
        """Handles GET requests."""
        skill_ids = comma_separated_skill_ids.split(',')
        skill_ids = list(set(skill_ids))

        try:
            _require_valid_skill_ids(skill_ids)
        except utils.ValidationError as e:
            raise self.InvalidInputException(
                'Invalid skill id') from e

        total_question_count = (
            question_services.get_total_question_count_for_skill_ids(skill_ids))

        self.values.update({
            'total_question_count': total_question_count
        })

        self.render_json(self.values)
