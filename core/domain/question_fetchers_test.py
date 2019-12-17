# coding: utf-8
#
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

"""Tests for methods defined in question fetchers.."""
from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.domain import question_domain
from core.domain import question_fetchers
from core.domain import question_services
from core.domain import user_services
from core.platform import models
from core.tests import test_utils
import feconf

(question_models,) = models.Registry.import_models([models.NAMES.question])


class QuestionFetchersUnitTests(test_utils.GenericTestBase):
    """Tests for question fetchers."""

    def setUp(self):
        super(QuestionFetchersUnitTests, self).setUp()
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)

        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)
        self.editor_id = self.get_user_id_from_email(
            self.EDITOR_EMAIL)

        self.set_admins([self.ADMIN_USERNAME])

        self.admin = user_services.UserActionsInfo(self.admin_id)
        self.editor = user_services.UserActionsInfo(self.editor_id)

        self.save_new_skill(
            'skill_1', self.admin_id, 'Skill Description 1')
        self.save_new_skill(
            'skill_2', self.admin_id, 'Skill Description 2')

        self.question_id = question_services.get_new_question_id()
        self.question = self.save_new_question(
            self.question_id, self.editor_id,
            self._create_valid_question_data('ABC'), ['skill_1'])

    def test_get_questions_and_skill_descriptions_by_skill_ids(self):
        question_services.create_new_question_skill_link(
            self.editor_id, self.question_id, 'skill_1', 0.3)

        questions, _, _ = (
            question_fetchers.get_questions_and_skill_descriptions_by_skill_ids(
                2, ['skill_1'], ''))

        self.assertEqual(len(questions), 1)
        self.assertEqual(
            questions[0].to_dict(), self.question.to_dict())

    def test_get_questions_with_multi_skill_ids(self):
        question_id_1 = question_services.get_new_question_id()
        question_1 = self.save_new_question(
            question_id_1, self.editor_id,
            self._create_valid_question_data('ABC'), ['skill_1', 'skill_2'])
        question_services.create_new_question_skill_link(
            self.editor_id, question_id_1, 'skill_1', 0.3)
        question_services.create_new_question_skill_link(
            self.editor_id, question_id_1, 'skill_2', 0.5)

        questions, _, _ = (
            question_fetchers.get_questions_and_skill_descriptions_by_skill_ids(
                2, ['skill_1', 'skill_2'], ''))

        self.assertEqual(len(questions), 1)
        self.assertEqual(
            questions[0].to_dict(), question_1.to_dict())

    def test_get_questions_by_ids(self):
        question_id_2 = question_services.get_new_question_id()
        self.save_new_question(
            question_id_2, self.editor_id,
            self._create_valid_question_data('DEF'), ['skill_1'])
        questions = question_fetchers.get_questions_by_ids(
            [self.question_id, 'invalid_question_id', question_id_2])
        self.assertEqual(len(questions), 3)
        self.assertEqual(questions[0].id, self.question_id)
        self.assertIsNone(questions[1])
        self.assertEqual(questions[2].id, question_id_2)

    def test_cannot_get_question_from_model_with_invalid_schema_version(self):
        # Delete all question models.
        all_question_models = question_models.QuestionModel.get_all()
        question_models.QuestionModel.delete_multi(all_question_models)

        all_question_models = question_models.QuestionModel.get_all()
        self.assertEqual(all_question_models.count(), 0)

        question_id = question_services.get_new_question_id()

        question_model = question_models.QuestionModel(
            id=question_id,
            question_state_data=(
                self._create_valid_question_data('ABC').to_dict()),
            language_code='en',
            version=0,
            question_state_data_schema_version=0)

        question_model.commit(
            self.editor_id, 'question model created',
            [{'cmd': question_domain.CMD_CREATE_NEW}])

        all_question_models = question_models.QuestionModel.get_all()
        self.assertEqual(all_question_models.count(), 1)
        question_model = all_question_models.get()

        with self.assertRaisesRegexp(
            Exception,
            'Sorry, we can only process v25-v%d state schemas at present.' %
            feconf.CURRENT_STATE_SCHEMA_VERSION):
            question_fetchers.get_question_from_model(question_model)
