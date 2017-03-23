# coding: utf-8
#
# Copyright 2016 The Oppia Authors. All Rights Reserved.
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

from core.domain import classifier_registry
from core.tests import test_utils
import feconf
import utils

# pylint: disable=protected-access


class LDAStringClassifierUnitTests(test_utils.GenericTestBase):

    _EXAMPLES_TRAIN = [
        ['i eat fish and vegetables', ['food']],
        ['fish are pets', ['pets']]
    ]

    _NEW_EXAMPLES_TRAIN = [
        ['my kitten eats fish', ['food', 'pets']]
    ]

    _EXAMPLES_TEST = [
        'i only eat fish and vegetables',
        'pets are friends',
        'a b c d e f g h i j k l m n o p q r s t u v w x y z'
    ]

    def setUp(self):
        super(LDAStringClassifierUnitTests, self).setUp()
        self.classifier = (
            classifier_registry.Registry.get_classifier_by_id(
                feconf.INTERACTION_CLASSIFIER_MAPPING['TextInput']))
        self.classifier.train(self._EXAMPLES_TRAIN)

    def _validate_instance(self):
        self.assertIn('_alpha', dir(self.classifier))
        self.assertIn('_beta', dir(self.classifier))
        self.assertIn('_prediction_threshold', dir(self.classifier))
        self.assertIn('_training_iterations', dir(self.classifier))
        self.assertIn('_prediction_iterations', dir(self.classifier))

        for d in xrange(self.classifier._num_docs):
            self.assertEquals(
                len(self.classifier._l_dp[d]),
                len(self.classifier._w_dp[d]))

        self.assertEquals(
            len(self.classifier._label_to_id),
            self.classifier._num_labels)
        self.assertEquals(
            len(self.classifier._word_to_id),
            self.classifier._num_words)
        self.assertEquals(
            len(self.classifier._w_dp),
            self.classifier._num_docs)
        self.assertEquals(
            len(self.classifier._b_dl),
            self.classifier._num_docs)
        if self.classifier._num_docs > 0:
            self.assertEquals(
                len(self.classifier._b_dl[0]),
                self.classifier._num_labels)
        self.assertEquals(
            len(self.classifier._l_dp),
            self.classifier._num_docs)
        self.assertEquals(
            len(self.classifier._c_dl),
            self.classifier._num_docs)
        if self.classifier._num_docs > 0:
            self.assertEquals(
                len(self.classifier._c_dl[0]),
                self.classifier._num_labels)
        self.assertEquals(
            len(self.classifier._c_lw),
            self.classifier._num_labels)
        if self.classifier._num_labels > 0:
            self.assertEquals(
                len(self.classifier._c_lw[0]),
                self.classifier._num_words)
        self.assertEquals(
            len(self.classifier._c_l),
            self.classifier._num_labels)

    def test_valid_state(self):
        self.assertEquals(self.classifier._num_labels, 3)
        self.assertEquals(self.classifier._num_docs, 2)
        self.assertEquals(self.classifier._num_words, 7)
        self._validate_instance()

    def test_add_train_examples(self):
        self.classifier.add_examples_for_training(
            self._NEW_EXAMPLES_TRAIN)
        self.assertEquals(self.classifier._num_labels, 3)
        self.assertEquals(self.classifier._num_docs, 3)
        self.assertEquals(self.classifier._num_words, 10)
        self._validate_instance()

    def test_add_test_examples(self):
        self.classifier.predict(self._EXAMPLES_TEST)
        self.assertEquals(self.classifier._num_labels, 3)
        self.assertEquals(self.classifier._num_docs, 5)
        self.assertEquals(self.classifier._num_words, 34)
        self._validate_instance()

    def test_empty_load(self):
        self.classifier.train([])
        # Still got the default label
        self.assertEquals(self.classifier._num_labels, 1)
        self.assertEquals(self.classifier._num_docs, 0)
        self.assertEquals(self.classifier._num_words, 0)
        self._validate_instance()

    def test_empty_add(self):
        self.classifier.add_examples_for_training([])
        self.assertEquals(self.classifier._num_labels, 3)
        self.assertEquals(self.classifier._num_docs, 2)
        self.assertEquals(self.classifier._num_words, 7)
        self._validate_instance()

    def test_model_to_and_from_dict(self):
        self.assertEquals(
            self.classifier._num_docs,
            len(self._EXAMPLES_TRAIN))

        # When the model is converted into a dictionary, check that updating
        # the dictionary does not alter the model.
        model = self.classifier.to_dict()
        model['_num_docs'] = 9
        self.assertEquals(model['_num_docs'], 9)
        self.assertEquals(
            self.classifier._num_docs,
            len(self._EXAMPLES_TRAIN))

        # When the model is updated, check that the dictionary remains
        # unchanged.
        self.classifier.predict(self._EXAMPLES_TEST)
        self.assertEquals(
            self.classifier._num_docs,
            len(self._EXAMPLES_TRAIN) + len(self._EXAMPLES_TEST))
        self.assertEquals(model['_num_docs'], 9)

        # When a dictionary is loaded into a model, check that the altered
        # values are now consistent.
        self.classifier.from_dict(model)
        self.assertEquals(self.classifier._num_docs, 9)
        self.assertEquals(model['_num_docs'], 9)

    def test_get_word_id(self):
        word_count = self.classifier._num_words
        self.classifier._get_word_id('_non_existent_word_1')
        self.assertEquals(self.classifier._num_words, word_count + 1)
        self.classifier._get_word_id('i')
        self.assertEquals(self.classifier._num_words, word_count + 1)
        self.classifier._get_word_id('_non_existent_word_2')
        self.assertEquals(self.classifier._num_words, word_count + 2)

    def test_get_label_id(self):
        label_count = self.classifier._num_labels
        self.classifier._get_label_id('_non_existent_label_1')
        self.assertEquals(self.classifier._num_labels, label_count + 1)
        self.classifier._get_label_id('food')
        self.assertEquals(self.classifier._num_labels, label_count + 1)
        self.classifier._get_label_id('_non_existent_label_2')
        self.assertEquals(self.classifier._num_labels, label_count + 2)

    def test_get_label_name(self):
        label_id = self.classifier._get_label_id('food')
        label_name = self.classifier._get_label_name(label_id)
        self.assertEquals(label_name, 'food')
        with self.assertRaises(Exception):
            label_id = self.classifier._get_label_name(-1)

    def test_reload_valid_state(self):
        self.classifier.train(self._NEW_EXAMPLES_TRAIN)
        self.assertEquals(self.classifier._num_labels, 3)
        self.assertEquals(
            self.classifier._num_docs,
            len(self._NEW_EXAMPLES_TRAIN))
        self.assertEquals(self.classifier._num_words, 4)
        self._validate_instance()

    def test_prediction_report(self):
        def _mock_get_label_probabilities(d):
            self.assertEquals(d, -1)
            return [0.5, 0.3, 0.2]

        def _mock_get_label_id(unused_label):
            return 0

        def _mock_get_label_name(unused_label):
            return 'fake_label'

        self.classifier._prediction_threshold = 0
        self.classifier._get_label_probabilities = (
            _mock_get_label_probabilities)
        self.classifier._get_label_id = _mock_get_label_id
        prediction_report = (
            self.classifier._get_prediction_report_for_doc(-1))
        self.assertEquals(prediction_report['prediction_label_id'], 1)

    def test_predict_label_for_doc(self):
        """This test ensures that the predictor is predicting the labels that
        are provided (in this case, 'food', 'pets', and the generic label
        '_default'). This test does not cover prediction accuracy, so
        _DEFAULT_MIN_DOCS_TO_PREDICT and _DEFAULT_MIN_LABELS_TO_PREDICT have
        been set to zero. This allows the predictor to predict on smaller data
        sets, which is useful for testing purposes. Setting the above constants
        to zero is not recommended in a serving system.
        """
        self.classifier._DEFAULT_MIN_DOCS_TO_PREDICT = 0
        self.classifier._DEFAULT_MIN_LABELS_TO_PREDICT = 0

        labels = self.classifier.predict(self._EXAMPLES_TEST)
        self.assertEquals(labels[0], 'food')
        self.assertEquals(labels[1], 'pets')
        # Testing a doc predicted with the default label
        self.classifier._prediction_threshold = 0.7
        labels = self.classifier.predict(self._EXAMPLES_TEST)
        self.assertEquals(labels[2], '_default')
        self._validate_instance()

    def test_validate(self):
        """Test to verify validate method of LDAStringClassifier."""

        # Verify no errors are raised for correct data.
        classifier_data = {
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
        self.classifier.validate(classifier_data)

        # Verify validation error is raised when key is not present.
        classifier_data.pop('_alpha', None)
        with self.assertRaisesRegexp(utils.ValidationError, (
                'Expected _alpha to be a key in classifier_data')):
            self.classifier.validate(classifier_data)

        # Verify validation error is raised when string is provided instead of
        # int.
        classifier_data['_alpha'] = 'abc'
        with self.assertRaisesRegexp(utils.ValidationError, (
                'Expected _alpha to be a float')):
            self.classifier.validate(classifier_data)

        # Verify validation error is raised when float is provided instead of
        # int.
        classifier_data['_alpha'] = 0.1
        classifier_data['_training_iterations'] = 1.2
        with self.assertRaisesRegexp(utils.ValidationError, (
                'Expected _training_iterations to be a int')):
            self.classifier.validate(classifier_data)

        # Verify validation error is raised when list is provided instead of
        # dict.
        classifier_data['_training_iterations'] = 25
        classifier_data['_label_to_id'] = []
        with self.assertRaisesRegexp(utils.ValidationError, (
                'Expected _label_to_id to be a dict')):
            self.classifier.validate(classifier_data)

        # Verify validation error is raised when key of dict is int instead of
        # string.
        classifier_data['_label_to_id'] = {1: 1}
        with self.assertRaisesRegexp(utils.ValidationError, (
                'Expected key of _label_to_id to be a string')):
            self.classifier.validate(classifier_data)

        # Verify validation error is raised when value of dict is string
        # instead of int.
        classifier_data['_label_to_id'] = {'text': '1'}
        with self.assertRaisesRegexp(utils.ValidationError, (
                'Expected value of _label_to_id to be a int')):
            self.classifier.validate(classifier_data)

        # Verify validation error is raised when dict is provided instead of
        # list.
        classifier_data['_label_to_id'] = {'text': 1}
        classifier_data['_w_dp'] = {}
        with self.assertRaisesRegexp(utils.ValidationError, (
                'Expected _w_dp to be a list')):
            self.classifier.validate(classifier_data)

        # Verify validation error is raised when the list values are string
        # instead of int.
        classifier_data['_w_dp'] = ['abc']
        with self.assertRaisesRegexp(utils.ValidationError, (
                'Expected values of _w_dp to be a int')):
            self.classifier.validate(classifier_data)
