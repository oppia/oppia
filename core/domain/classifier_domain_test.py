# Copyright 2016 The Oppia Authors. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, softwar
# distributed under the License is distributed on an "AS-IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Tests for classifier domain objects."""


from core.domain import classifier_domain
from core.tests import test_utils
import utils


class ClassifierDomainTests(test_utils.GenericTestBase):
    """Test the classifier domain."""

    def test_to_dict(self):
        expected_classifier_dict = {
            'classifier_id': 'exp_id1.SOME_RANDOM_STRING',
            'exp_id': 'exp_id1',
            'exp_version_when_created': 1,
            'state_name': 'a state name',
            'algorithm_id': "LDAStringClassifier",
            'cached_classifier_data': {'alpha': 1.0},
            'data_schema_version': 1
        }
        observed_classifier = classifier_domain.Classifier(
            expected_classifier_dict['classifier_id'],
            expected_classifier_dict['exp_id'],
            expected_classifier_dict['exp_version_when_created'],
            expected_classifier_dict['state_name'],
            expected_classifier_dict['algorithm_id'],
            expected_classifier_dict['cached_classifier_data'],
            expected_classifier_dict['data_schema_version'])
        self.assertDictEqual(expected_classifier_dict,
                             observed_classifier.to_dict())

    def test_validation(self):
        """Tests to verify validate method of classifier domain."""

        # Verify no errors are raised for correct data.
        cached_classifier_data = {
            '_alpha': 0.1,
            '_beta': 0.001,
            '_prediction_threshold': 0.5,
            '_training_iterations': 25,
            '_prediction_iterations': 5,
            '_num_labels': 10,
            '_num_docs': 12,
            '_num_words': 20,
            '_label_to_id': {'text': 1},
            '_word_to_id': {'hello': 2},
            '_w_dp': [],
            '_b_dl': [],
            '_l_dp': [],
            '_c_dl': [],
            '_c_lw': [],
            '_c_l': []
        }
        classifier_dict = {
            'classifier_id': 'exp_id1.SOME_RANDOM_STRING',
            'exp_id': 'exp_id1',
            'exp_version_when_created': 1,
            'state_name': 'a state name',
            'algorithm_id': "LDAStringClassifier",
            'cached_classifier_data': cached_classifier_data,
            'data_schema_version': 1
        }
        classifier = classifier_domain.Classifier(
            classifier_dict['classifier_id'],
            classifier_dict['exp_id'],
            classifier_dict['exp_version_when_created'],
            classifier_dict['state_name'],
            classifier_dict['algorithm_id'],
            classifier_dict['cached_classifier_data'],
            classifier_dict['data_schema_version'])
        classifier.validate()

        # Verify validation error is raised when int is provided instead of
        # string.
        classifier_dict['classifier_id'] = 1
        classifier = classifier_domain.Classifier(
            classifier_dict['classifier_id'],
            classifier_dict['exp_id'],
            classifier_dict['exp_version_when_created'],
            classifier_dict['state_name'],
            classifier_dict['algorithm_id'],
            classifier_dict['cached_classifier_data'],
            classifier_dict['data_schema_version'])
        with self.assertRaisesRegexp(utils.ValidationError, (
            'Expected id to be a string')):
            classifier.validate()

        # Verify validation error is raised when string is provided instead of
        # int.
        classifier_dict['classifier_id'] = 'exp_id1.SOME_RANDOM_STRING'
        classifier_dict['exp_version_when_created'] = 'abc'
        classifier = classifier_domain.Classifier(
            classifier_dict['classifier_id'],
            classifier_dict['exp_id'],
            classifier_dict['exp_version_when_created'],
            classifier_dict['state_name'],
            classifier_dict['algorithm_id'],
            classifier_dict['cached_classifier_data'],
            classifier_dict['data_schema_version'])
        with self.assertRaisesRegexp(utils.ValidationError, (
            'Expected exp_version_when_created to be a int')):
            classifier.validate()

        # Verify valdation error is raised when invalid state_name is provided.
        classifier_dict['exp_version_when_created'] = 1
        classifier_dict['state_name'] = 'A string #'
        classifier = classifier_domain.Classifier(
            classifier_dict['classifier_id'],
            classifier_dict['exp_id'],
            classifier_dict['exp_version_when_created'],
            classifier_dict['state_name'],
            classifier_dict['algorithm_id'],
            classifier_dict['cached_classifier_data'],
            classifier_dict['data_schema_version'])
        with self.assertRaisesRegexp(utils.ValidationError, (
            'Invalid character # in the state name')):
            classifier.validate()

        # Verify validation error is raised when invalid algorithm_id is
        # provided.
        classifier_dict['state_name'] = 'a state name'
        classifier_dict['algorithm_id'] = 'abc'
        classifier = classifier_domain.Classifier(
            classifier_dict['classifier_id'],
            classifier_dict['exp_id'],
            classifier_dict['exp_version_when_created'],
            classifier_dict['state_name'],
            classifier_dict['algorithm_id'],
            classifier_dict['cached_classifier_data'],
            classifier_dict['data_schema_version'])
        with self.assertRaisesRegexp(utils.ValidationError, (
            'Invalid algorithm id')):
            classifier.validate()

        # Verify validation error is raised when list is provided for dict.
        classifier_dict['algorithm_id'] = "LDAStringClassifier"
        classifier_dict['cached_classifier_data'] = []
        classifier = classifier_domain.Classifier(
            classifier_dict['classifier_id'],
            classifier_dict['exp_id'],
            classifier_dict['exp_version_when_created'],
            classifier_dict['state_name'],
            classifier_dict['algorithm_id'],
            classifier_dict['cached_classifier_data'],
            classifier_dict['data_schema_version'])
        with self.assertRaisesRegexp(utils.ValidationError, (
            'Expected cached_classifier_data to be a dict')):
            classifier.validate()
