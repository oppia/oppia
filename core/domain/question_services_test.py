# coding: utf-8
#
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

from core.domain import question_services
from core.domain import user_services
from core.platform import models
from core.tests import test_utils

(question_models,) = models.Registry.import_models([models.NAMES.question])
memcache_services = models.Registry.import_memcache_services()

class QuestionServicesUnitTest(test_utils.GenericTestBase):
    """Test the question services module."""

    def setUp(self):
        """Before each individual test, create dummy user."""
        super(QuestionServicesUnitTest, self).setUp()

        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

        user_services.create_new_user(self.owner_id, self.OWNER_EMAIL)

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)

    def test_save_new_question(self):
        question_data = {}
        title = 'A Question'
        data_schema_version = 1
        collection_id = 1
        language_code = 'en'
        question = lambda: None
        setattr(question, 'title', title)
        setattr(question, 'question_data', question_data)
        setattr(question, 'data_schema_version', data_schema_version)
        setattr(question, 'collection_id', collection_id)
        setattr(question, 'language_code', language_code)

        question_model = question_services.add_question(self.owner_id, question)
        model = question_models.QuestionModel.get(question_model.id)

        self.assertEqual(model.title, title)
        self.assertEqual(model.question_data, question_data)
        self.assertEqual(model.data_schema_version,data_schema_version)
        self.assertEqual(model.collection_id, collection_id)
        self.assertEqual(model.language_code, language_code)

    def test_delete_question(self):
        question_data = {}
        title = 'A Question'
        data_schema_version = 1
        collection_id = 1
        language_code = 'en'
        question = lambda: None
        setattr(question, 'title', title)
        setattr(question, 'question_data', question_data)
        setattr(question, 'data_schema_version', data_schema_version)
        setattr(question, 'collection_id', collection_id)
        setattr(question, 'language_code', language_code)

        question_model = question_services.add_question(self.owner_id, question)
        question_services.delete_question(self.owner_id, question_model.id)

        with self.assertRaisesRegexp(Exception, (
            'Entity for class QuestionModel with id %s not found' %(
                question_model.id))):
            question_models.QuestionModel.get(question_model.id)
