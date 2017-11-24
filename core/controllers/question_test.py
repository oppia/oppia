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

"""Tests for the controllers that communicate with VM for training
classifiers."""

from core.domain import collection_domain
from core.domain import collection_services
from core.domain import exp_domain
from core.domain import question_domain
from core.domain import question_services
from core.platform import models
from core.tests import test_utils
import feconf

(question_models,) = models.Registry.import_models([models.NAMES.question])

class QuestionsBatchHandlerTest(test_utils.GenericTestBase):
    """Test the handler for rendering questions batch."""

    def setUp(self):
        super(QuestionsBatchHandlerTest, self).setUp()

        self.coll_id = '0'
        self.exp_id = '1'
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

        # Create a new collection and exploration.
        self.save_new_valid_collection(
            self.coll_id, self.owner_id, exploration_id=self.exp_id)

        # Add a skill.
        collection_services.update_collection(
            self.owner_id, self.coll_id, [{
                'cmd': collection_domain.CMD_ADD_COLLECTION_SKILL,
                'name': 'test'
            }], 'Add a new skill')
        collection = collection_services.get_collection_by_id(
            self.coll_id)
        skill_id = collection.get_skill_id_from_skill_name('test')
        collection_node = collection.get_node(self.exp_id)
        collection_node.update_acquired_skill_ids([skill_id])

        # Update a skill.
        collection_services.update_collection(
            self.owner_id, self.coll_id, [{
                'cmd': collection_domain.CMD_EDIT_COLLECTION_NODE_PROPERTY,
                'property_name': (
                    collection_domain.COLLECTION_NODE_PROPERTY_ACQUIRED_SKILL_IDS), # pylint: disable=line-too-long
                'exploration_id': self.exp_id,
                'new_value': [skill_id]
            }], 'Update skill')

        state = exp_domain.State.create_default_state('ABC')
        question_data = state.to_dict()
        question_id = 'dummy'
        title = 'A Question'
        question_data_schema_version = 1
        collection_id = self.coll_id
        language_code = 'en'
        question = question_domain.Question(
            question_id, title, question_data, question_data_schema_version,
            collection_id, language_code)
        question.validate()

        question_model = question_services.add_question(self.owner_id, question)
        question = question_services.get_question_by_id(question_model.id)
        question.add_skill('test', self.owner_id)
        collection_services.record_played_exploration_in_collection_context(
            self.owner_id, self.coll_id, self.exp_id)

        self.payload = {}
        self.payload['user_id'] = self.owner_id
        self.payload['skill_ids'] = [skill_id]

    def test_get(self):
        """Test to verify the get method."""
        json_response = self.get_json(
            feconf.QUESTION_DATA_URL + '/batch/%s'% self.coll_id,
            self.payload, expect_errors=False)
        print json_response
