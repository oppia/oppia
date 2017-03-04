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

"""Tests for classifier services"""

import os

from core.domain import classifier_registry
from core.domain import classifier_services
from core.domain import exp_services
from core.platform import models
from core.tests import test_utils
import feconf
import utils

(classifier_models,) = models.Registry.import_models([models.NAMES.classifier])

class ClassifierServicesTests(test_utils.GenericTestBase):
    """Test classify using the sample explorations.

    Since the end to end tests cover correct classification, and frontend tests
    test hard rules, ReaderClassifyTests is only checking that the string
    classifier is actually called.
    """
    def setUp(self):
        super(ClassifierServicesTests, self).setUp()
        self._init_classify_inputs('16')

    def _init_classify_inputs(self, exploration_id):
        test_exp_filepath = os.path.join(
            feconf.TESTS_DATA_DIR, 'string_classifier_test.yaml')
        yaml_content = utils.get_file_contents(test_exp_filepath)
        assets_list = []
        exp_services.save_new_exploration_from_yaml_and_assets(
            feconf.SYSTEM_COMMITTER_ID, yaml_content, exploration_id,
            assets_list)

        self.exp_id = exploration_id
        self.exp_state = (
            exp_services.get_exploration_by_id(exploration_id).states['Home'])

    def _is_string_classifier_called(self, answer):
        sc = classifier_registry.ClassifierRegistry.get_classifier_by_id(
            feconf.INTERACTION_CLASSIFIER_MAPPING['TextInput'])
        string_classifier_predict = (
            sc.__class__.predict)
        predict_counter = test_utils.CallCounter(
            string_classifier_predict)

        with self.swap(sc.__class__, 'predict', predict_counter):
            response = classifier_services.classify(self.exp_state, answer)

        answer_group_index = response['answer_group_index']
        rule_spec_index = response['rule_spec_index']
        answer_groups = self.exp_state.interaction.answer_groups
        if answer_group_index == len(answer_groups):
            return 'default'

        answer_group = answer_groups[answer_group_index]
        return (answer_group.get_classifier_rule_index() == rule_spec_index and
                predict_counter.times_called == 1)

    def test_string_classifier_classification(self):
        """All these responses trigger the string classifier."""

        with self.swap(feconf, 'ENABLE_STRING_CLASSIFIER', True):
            self.assertTrue(
                self._is_string_classifier_called(
                    'it\'s a permutation of 3 elements'))
            self.assertTrue(
                self._is_string_classifier_called(
                    'There are 3 options for the first ball, and 2 for the '
                    'remaining two. So 3*2=6.'))
            self.assertTrue(
                self._is_string_classifier_called('abc acb bac bca cbb cba'))
            self.assertTrue(
                self._is_string_classifier_called('dunno, just guessed'))

    def test_retrieval_of_classifiers(self):
        """Test the get_classifier_by_id method."""

        with self.assertRaisesRegexp(Exception, (
            "Entity for class ClassifierModel with id fake_id not found")):
            classifier_services.get_classifier_by_id('fake_id')

        exp_id = u'1'
        state = 'Home'
        classifier_id = classifier_models.ClassifierModel.create(
            exp_id, 1, state,
            feconf.INTERACTION_CLASSIFIER_MAPPING['TextInput'], [], 1)
        classifier = classifier_services.get_classifier_by_id(
            classifier_id)
        self.assertEqual(classifier.exp_id, exp_id)
        self.assertEqual(classifier.state_name, state)

    def test_update_of_classifiers(self):
        """Test the update_classifier method."""

        exp_id = u'1'
        state = 'Home'
        test_state = 'State'
        classifier_id = classifier_models.ClassifierModel.create(
            exp_id, 1, state,
            feconf.INTERACTION_CLASSIFIER_MAPPING['TextInput'], [], 1)
        classifier = classifier_services.get_classifier_by_id(
            classifier_id)
        classifier.state_name = test_state
        classifier_services.save_classifier(classifier)
        classifier = classifier_services.get_classifier_by_id(
            classifier_id)
        self.assertEqual(classifier.exp_id, exp_id)
        self.assertEqual(classifier.state_name, test_state)

    def test_deletion_of_classifiers(self):
        """Test the delete_classifier method."""

        exp_id = u'1'
        state = 'Home'
        classifier_id = classifier_models.ClassifierModel.create(
            exp_id, 1, state,
            feconf.INTERACTION_CLASSIFIER_MAPPING['TextInput'], [], 1)
        classifier_services.delete_classifier(classifier_id)
        with self.assertRaisesRegexp(Exception, (
            "Entity for class ClassifierModel with id %s not found" %(
                classifier_id))):
            classifier_services.get_classifier_by_id(classifier_id)
