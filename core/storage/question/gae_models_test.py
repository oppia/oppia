# Copyright 2017 The Oppia Authors. All Rights Reserved.
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

from core.domain import exp_domain
from core.platform import models
from core.tests import test_utils

(question_models,) = models.Registry.import_models([models.NAMES.question])


class QuestionModelUnitTests(test_utils.GenericTestBase):
    """Tests the QuestionModel class."""

    def test_create_question(self):
        state = exp_domain.State.create_default_state('ABC')
        question_data = state.to_dict()
        question_data_schema_version = 1
        language_code = 'en'
        question_model = question_models.QuestionModel.create(
            question_data, question_data_schema_version,
            language_code)

        self.assertEqual(question_model.question_data, question_data)
        self.assertEqual(
            question_model.question_data_schema_version,
            question_data_schema_version)
        self.assertEqual(question_model.language_code, language_code)
