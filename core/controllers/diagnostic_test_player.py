# Copyright 2022 The Oppia Authors. All Rights Reserved.
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

"""Controllers for the diagnostic test player page."""

from __future__ import annotations

import collections

from core import feature_flag_list
from core import feconf
from core.constants import constants
from core.controllers import acl_decorators
from core.controllers import base
from core.domain import feature_flag_services
from core.domain import question_domain
from core.domain import question_services
from core.domain import topic_fetchers

from typing import Dict, List, TypedDict, cast


class DiagnosticTestPlayerPage(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
    """Renders the diagnostic test player page."""

    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

    @acl_decorators.open_access
    def get(self) -> None:
        """Handles GET requests."""
        if feature_flag_services.is_feature_flag_enabled(
            self.user_id,
            feature_flag_list.FeatureNames.DIAGNOSTIC_TEST.value
        ):
            self.render_template('diagnostic-test-player-page.mainpage.html')
        else:
            raise self.PageNotFoundException


def normalize_comma_separated_ids(comma_separated_ids: str) -> List[str]:
    """Normalizes a string of comma-separated question IDs into a list of
    question IDs.

    Args:
        comma_separated_ids: str. Comma separated question IDs.

    Returns:
        list(str). A list of question IDs.
    """
    if not comma_separated_ids:
        return list([])
    return list(comma_separated_ids.split(','))


class DiagnosticTestQuestionsHandlerNormalizedRequestDict(TypedDict):
    """Dict representation of DiagnosticTestQuestionsHandler's
    normalized_request dictionary.
    """

    excluded_question_ids: List[str]


class DiagnosticTestQuestionsHandler(
    base.BaseHandler[
        Dict[str, str],
        DiagnosticTestQuestionsHandlerNormalizedRequestDict
    ]
):
    """Handler class to fetch the questions from the diagnostic test skills of
    the given topic ID.
    """

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    URL_PATH_ARGS_SCHEMAS = {
        'topic_id': {
            'schema': {
                'type': 'basestring',
                'validators': [{
                    'id': 'is_regex_matched',
                    'regex_pattern': constants.ENTITY_ID_REGEX
                }]
            }
        }
    }
    HANDLER_ARGS_SCHEMAS = {
        'GET': {
            'excluded_question_ids': {
                'schema': {
                    'type': 'object_dict',
                    'validation_method': normalize_comma_separated_ids
                }
            }
        }
    }

    @acl_decorators.open_access
    def get(self, topic_id: str) -> None:
        """Retrieves diagnostic test questions for a specific topic.

        Args:
            topic_id: str. The ID of the topic.
        """
        # Here we use cast because we are narrowing down the type of
        # 'normalized_request' from Union of request TypedDicts to a
        # particular TypedDict that was defined according to the schemas.
        # So that the type of fetched values is not considered as Any type.
        request_data = cast(
            DiagnosticTestQuestionsHandlerNormalizedRequestDict,
            self.normalized_request
        )

        # The list of question IDs that were already presented in the
        # diagnostic test. The questions corresponding to these IDs should not
        # be repeated.
        excluded_question_ids: List[str] = request_data['excluded_question_ids']

        topic = topic_fetchers.get_topic_by_id(topic_id, strict=False)
        if topic is None:
            raise self.PageNotFoundException(
                'No corresponding topic exists for the given topic ID.')

        diagnostic_test_skill_ids = topic.skill_ids_for_diagnostic_test

        # A dict with skill ID as key and a list with two questions as value.
        # Among the two questions, one question should be considered as the
        # main and the other should be considered as the backup.
        skill_id_to_questions_map: Dict[
            str, List[question_domain.Question]] = (
                collections.defaultdict(list))

        for skill_id in diagnostic_test_skill_ids:
            questions = question_services.get_questions_by_skill_ids(
                feconf.MAX_QUESTIONS_FETCHABLE_AT_ONE_TIME,
                [skill_id],
                require_medium_difficulty=True
            )

            for question in questions:
                if question.id in excluded_question_ids:
                    continue

                if len(skill_id_to_questions_map[skill_id]) < 2:
                    skill_id_to_questions_map[skill_id].append(question)
                    excluded_question_ids.append(question.id)
                else:
                    break

        # A dict with skill ID as key and a nested dict as value. The nested
        # dict contains main_question and backup_question as keys and the
        # question dict as values. The main question and backup question are
        # the two questions associated with a single skill. In the diagnostic
        # test, initially, the main question will be presented to the learner
        # and if they attempted incorrectly then the backup question will be
        # asked otherwise not. The main question and the backup question are of
        # the same difficulty.
        skill_id_to_questions_dict: Dict[
            str, Dict[str, question_domain.QuestionDict]] = (
                collections.defaultdict(dict))

        for skill_id, linked_questions in skill_id_to_questions_map.items():
            if len(linked_questions) < 2:
                continue

            # Each diagnostic test skill contains two questions. The first
            # question is considered the main question and the second one is
            # considered the backup question.
            skill_id_to_questions_dict[skill_id][
                feconf.DIAGNOSTIC_TEST_QUESTION_TYPE_MAIN] = (
                    linked_questions[0].to_dict())
            skill_id_to_questions_dict[skill_id][
                feconf.DIAGNOSTIC_TEST_QUESTION_TYPE_BACKUP] = (
                    linked_questions[1].to_dict())

        self.render_json(
            {'skill_id_to_questions_dict': skill_id_to_questions_dict}
        )
