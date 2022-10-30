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

from core import feconf
from core.constants import constants
from core.controllers import acl_decorators
from core.controllers import base
from core.domain import question_domain
from core.domain import question_services
from core.domain import topic_services

from typing import Any, Dict


class DiagnosticTestPlayerPage(base.BaseHandler):
    """Renders the diagnostic test player page."""

    # Type[str, Any] is used to match the type defined for this attribute in
    # its parent class `base.BaseHandler`.
    URL_PATH_ARGS_SCHEMAS: Dict[str, Any] = {}
    # Type[str, Any] is used to match the type defined for this attribute in
    # its parent class `base.BaseHandler`.
    HANDLER_ARGS_SCHEMAS: Dict[str, Any] = {'GET': {}}

    @acl_decorators.open_access # type: ignore[misc]
    def get(self) -> None:
        """Handles GET requests."""
        self.render_template('diagnostic-test-player-page.mainpage.html') # type: ignore[no-untyped-call]


class DiagnosticTestQuestionsHandler(base.BaseHandler):
    """Handler class to fetch the questions from the diagnostic test skills of
    the given topic ID.
    """

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    # Type[str, Any] is used to match the type defined for this attribute in
    # its parent class `base.BaseHandler`.
    URL_PATH_ARGS_SCHEMAS: Dict[str, Any] = {
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
    # Type[str, Any] is used to match the type defined for this attribute in
    # its parent class `base.BaseHandler`.
    HANDLER_ARGS_SCHEMAS: Dict[str, Any] = {'GET': {}}

    @acl_decorators.open_access # type: ignore[misc]
    def get(self, topic_id: str) -> None:
        try:
            diagnostic_test_skill_ids = (
                topic_services.get_topic_id_to_diagnostic_test_skill_ids(
                    [topic_id]))[topic_id]
        except Exception as e:
            raise self.PageNotFoundException(e)

        # From each skill, two questions were fetched. The first question
        # (main question) will be presented to the learner initially and if the
        # learner attempted incorrectly, then another question from the same
        # skill (backup question) will be presented otherwise not. Hence the
        # number of questions is twice the length of skill IDs.
        question_count = len(diagnostic_test_skill_ids) * 2

        # A dict with skill ID as key and a nested dict as value. The nested
        # dict contains main_question and backup_question as keys and the
        # question dict as values. The main question and backup question are
        # the two questions associated with a single skill. In the diagnostic
        # test, initially, the main question will be presented to the learner
        # and if they attempted incorrectly then the backup question will be
        # asked otherwise not. The main question and the backup question are of
        # the same difficulty.
        skill_id_to_questions_dict: Dict[
            str, Dict[str, question_domain.QuestionDict]] = {}

        for skill_id in diagnostic_test_skill_ids:
            skill_id_to_questions_dict[skill_id] = {}

        questions = question_services.get_questions_by_skill_ids(
            question_count,
            diagnostic_test_skill_ids,
            require_medium_difficulty=True
        )

        for question in questions:
            linked_skill_ids = question.linked_skill_ids
            diagnostic_test_linked_skill_ids = list(
                set(linked_skill_ids).intersection(
                    set(diagnostic_test_skill_ids))
            )

            for skill_id in diagnostic_test_linked_skill_ids:
                if 'main_question' not in skill_id_to_questions_dict[skill_id]:
                    skill_id_to_questions_dict[skill_id]['main_question'] = (
                        question.to_dict())
                else:
                    skill_id_to_questions_dict[skill_id]['backup_question'] = (
                        question.to_dict())

        self.render_json(
            {'skill_id_to_questions_dict': skill_id_to_questions_dict}
        )
