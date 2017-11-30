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

"""Tests for the Question controller."""

import json

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

        self.collection_id = 'coll_0'
        self.exp_id = 'exp_1'
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.viewer_id = self.get_user_id_from_email(self.VIEWER_EMAIL)

        # Create a new collection and exploration.
        self.save_new_valid_collection(
            self.collection_id, self.owner_id, exploration_id=self.exp_id)

        # Add a skill.
        collection_services.update_collection(
            self.owner_id, self.collection_id, [{
                'cmd': collection_domain.CMD_ADD_COLLECTION_SKILL,
                'name': 'test'
            }], 'Add a new skill')
        collection = collection_services.get_collection_by_id(
            self.collection_id)
        skill_id = collection.get_skill_id_from_skill_name('test')
        collection_node = collection.get_node(self.exp_id)
        collection_node.update_acquired_skill_ids([skill_id])

        # Update the acquired skill IDs for the exploration.
        collection_services.update_collection(
            self.owner_id, self.collection_id, [{
                'cmd': collection_domain.CMD_EDIT_COLLECTION_NODE_PROPERTY,
                'property_name': (
                    collection_domain.COLLECTION_NODE_PROPERTY_ACQUIRED_SKILL_IDS), # pylint: disable=line-too-long
                'exploration_id': self.exp_id,
                'new_value': [skill_id]
            }], 'Update skill')

        question = question_domain.Question(
            'dummy', 'A Question',
            exp_domain.State.create_default_state('ABC').to_dict(), 1,
            self.collection_id, 'en')

        question_model = question_services.add_question(self.owner_id, question)
        self.question = question_services.get_question_by_id(question_model.id)
        question_services.add_question_id_to_skill(self.question.question_id, self.question.collection_id,
            skill_id, self.owner_id)
        collection_services.record_played_exploration_in_collection_context(
            self.owner_id, self.collection_id, self.exp_id)

        self.payload = {}
        self.payload['collection_id'] = self.collection_id
        self.payload['user_id'] = self.owner_id
        self.payload['skill_ids'] = json.dumps([skill_id, 'test'])

    def test_get(self):
        """Test to verify the get method."""
        response_json = self.get_json('%s/batch'%
            feconf.QUESTION_DATA_URL, self.payload,
            expect_errors=False)
        self.assertEqual(response_json[0], self.question.to_dict())

        self.payload['user_id'] = self.viewer_id
        response_json = self.get_json('%s/batch'%
            feconf.QUESTION_DATA_URL, self.payload,
            expect_errors=False)
        self.assertEqual(len(response_json), 0)
