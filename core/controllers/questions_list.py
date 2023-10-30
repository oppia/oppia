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
from core.constants import constants
from core.controllers import acl_decorators
from core.controllers import base
from core.controllers import domain_objects_validator
from core.domain import question_services
from core.domain import skill_fetchers

from typing import Dict, TypedDict


class QuestionsListHandlerNormalizedRequestDict(TypedDict):
    """Dict representation of QuestionsListHandler's
    normalized_payload dictionary.
    """

    offset: int


class QuestionsListHandler(
    base.BaseHandler[
        Dict[str, str],
        QuestionsListHandlerNormalizedRequestDict
    ]
):
    """Manages receiving of all question summaries for display in topic editor
    and skill editor page.
    """

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    # TODO(#16538): Change the type of `comma_separated_skill_ids` url_path
    # argument to `JsonEncodedInString`.
    URL_PATH_ARGS_SCHEMAS = {
        'comma_separated_skill_ids': {
            'schema': {
                'type': 'object_dict',
                'validation_method': domain_objects_validator.validate_skill_ids
            }
        }
    }
    HANDLER_ARGS_SCHEMAS = {
        'GET': {
            'offset': {
                'schema': {
                    'type': 'int'
                }
            }
        }
    }

    @acl_decorators.open_access
    def get(self, comma_separated_skill_ids: str) -> None:
        """Handles GET requests.

    Args:
        comma_separated_skill_ids: A string containing comma-separated skill IDs.

    Returns:
        A JSON response containing the following fields:
            * `question_summary_dicts`: A list of dictionaries, each containing the following fields:
                * `summary`: A dictionary containing the question summary data.
                * `skill_id`: The ID of the skill that the question is assigned to.
                * `skill_description`: The description of the skill that the question is assigned to.
                * `skill_difficulty`: The difficulty of the skill that the question is assigned to.
            * `more`: A boolean value indicating whether there are more questions available to be loaded.

    Raises:
        PageNotFoundException: If the specified skill IDs do not exist.
    """

    assert self.normalized_request is not None
    offset = self.normalized_request['offset']

    skill_ids = list(set(comma_separated_skill_ids.split(',')))

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
                    'skill_id': merged_question_skill_links[index].skill_ids[0],
                    'skill_description': (
                        merged_question_skill_links[index].skill_descriptions[0]),
                    'skill_difficulty': (
                        merged_question_skill_links[index].skill_difficulties[0])
                })
            else:
                return_dicts.append({
                    'summary': summary.to_dict(),
                    'skill_ids': merged_question_skill_links[index].skill_ids,
                    'skill_descriptions': (
                        merged_question_skill_links[index].skill_descriptions),
                    'skill_difficulties': (
                        merged_question_skill_links[index].skill_difficulties)
                })

    self.values.update({
        'question_summary_dicts': return_dicts,
        'more': more
    })

    self.render_json(self.values)

