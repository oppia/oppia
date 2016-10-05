# coding: utf-8
#
# Copyright 2015 The Oppia Authors. All Rights Reserved.
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

from core.domain import classifier_services
from core.tests import test_utils

# pylint: disable=protected-access


class StringClassifierUnitTests(test_utils.GenericTestBase):

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
        super(StringClassifierUnitTests, self).setUp()
        self.string_classifier = classifier_services.StringClassifier()
        self.string_classifier.load_examples(self._EXAMPLES_TRAIN)

    def _validate_instance(self):
        self.assertIn('_alpha', dir(self.string_classifier))
        self.assertIn('_beta', dir(self.string_classifier))
        self.assertIn('_prediction_threshold', dir(self.string_classifier))
        self.assertIn('_training_iterations', dir(self.string_classifier))
        self.assertIn('_prediction_iterations', dir(self.string_classifier))

        for d in xrange(self.string_classifier._num_docs):
            self.assertEquals(
                len(self.string_classifier._l_dp[d]),
                len(self.string_classifier._w_dp[d]))

        self.assertEquals(
            len(self.string_classifier._label_to_id),
            self.string_classifier._num_labels)
        self.assertEquals(
            len(self.string_classifier._word_to_id),
            self.string_classifier._num_words)
        self.assertEquals(
            len(self.string_classifier._w_dp),
            self.string_classifier._num_docs)
        self.assertEquals(
            len(self.string_classifier._b_dl),
            self.string_classifier._num_docs)
        if self.string_classifier._num_docs > 0:
            self.assertEquals(
                len(self.string_classifier._b_dl[0]),
                self.string_classifier._num_labels)
        self.assertEquals(
            len(self.string_classifier._l_dp),
            self.string_classifier._num_docs)
        self.assertEquals(
            len(self.string_classifier._c_dl),
            self.string_classifier._num_docs)
        if self.string_classifier._num_docs > 0:
            self.assertEquals(
                len(self.string_classifier._c_dl[0]),
                self.string_classifier._num_labels)
        self.assertEquals(
            len(self.string_classifier._c_lw),
            self.string_classifier._num_labels)
        if self.string_classifier._num_labels > 0:
            self.assertEquals(
                len(self.string_classifier._c_lw[0]),
                self.string_classifier._num_words)
        self.assertEquals(
            len(self.string_classifier._c_l),
            self.string_classifier._num_labels)

    def test_valid_state(self):
        self.assertEquals(self.string_classifier._num_labels, 3)
        self.assertEquals(self.string_classifier._num_docs, 2)
        self.assertEquals(self.string_classifier._num_words, 7)
        self._validate_instance()

    def test_add_train_examples(self):
        self.string_classifier.add_examples_for_training(
            self._NEW_EXAMPLES_TRAIN)
        self.assertEquals(self.string_classifier._num_labels, 3)
        self.assertEquals(self.string_classifier._num_docs, 3)
        self.assertEquals(self.string_classifier._num_words, 10)
        self._validate_instance()

    def test_add_test_examples(self):
        self.string_classifier.add_docs_for_predicting(self._EXAMPLES_TEST)
        self.assertEquals(self.string_classifier._num_labels, 3)
        self.assertEquals(self.string_classifier._num_docs, 5)
        self.assertEquals(self.string_classifier._num_words, 34)
        self._validate_instance()

    def test_empty_load(self):
        self.string_classifier.load_examples([])
        # Still got the default label
        self.assertEquals(self.string_classifier._num_labels, 1)
        self.assertEquals(self.string_classifier._num_docs, 0)
        self.assertEquals(self.string_classifier._num_words, 0)
        self._validate_instance()

    def test_empty_add(self):
        self.string_classifier.add_examples_for_training([])
        self.assertEquals(self.string_classifier._num_labels, 3)
        self.assertEquals(self.string_classifier._num_docs, 2)
        self.assertEquals(self.string_classifier._num_words, 7)
        self._validate_instance()

    def test_model_to_and_from_dict(self):
        self.assertEquals(
            self.string_classifier._num_docs,
            len(self._EXAMPLES_TRAIN))

        # When the model is converted into a dictionary, check that updating
        # the dictionary does not alter the model.
        model = self.string_classifier.to_dict()
        model['_num_docs'] = 9
        self.assertEquals(model['_num_docs'], 9)
        self.assertEquals(
            self.string_classifier._num_docs,
            len(self._EXAMPLES_TRAIN))

        # When the model is updated, check that the dictionary remains
        # unchanged.
        self.string_classifier.add_docs_for_predicting(self._EXAMPLES_TEST)
        self.assertEquals(
            self.string_classifier._num_docs,
            len(self._EXAMPLES_TRAIN) + len(self._EXAMPLES_TEST))
        self.assertEquals(model['_num_docs'], 9)

        # When a dictionary is loaded into a model, check that the altered
        # values are now consistent.
        self.string_classifier.from_dict(model)
        self.assertEquals(self.string_classifier._num_docs, 9)
        self.assertEquals(model['_num_docs'], 9)

    def test_get_word_id(self):
        word_count = self.string_classifier._num_words
        self.string_classifier._get_word_id('_non_existent_word_1')
        self.assertEquals(self.string_classifier._num_words, word_count + 1)
        self.string_classifier._get_word_id('i')
        self.assertEquals(self.string_classifier._num_words, word_count + 1)
        self.string_classifier._get_word_id('_non_existent_word_2')
        self.assertEquals(self.string_classifier._num_words, word_count + 2)

    def test_get_label_id(self):
        label_count = self.string_classifier._num_labels
        self.string_classifier._get_label_id('_non_existent_label_1')
        self.assertEquals(self.string_classifier._num_labels, label_count + 1)
        self.string_classifier._get_label_id('food')
        self.assertEquals(self.string_classifier._num_labels, label_count + 1)
        self.string_classifier._get_label_id('_non_existent_label_2')
        self.assertEquals(self.string_classifier._num_labels, label_count + 2)

    def test_get_label_name(self):
        label_id = self.string_classifier._get_label_id('food')
        label_name = self.string_classifier._get_label_name(label_id)
        self.assertEquals(label_name, 'food')
        with self.assertRaises(Exception):
            label_id = self.string_classifier._get_label_name(-1)

    def test_reload_valid_state(self):
        self.string_classifier.load_examples(self._NEW_EXAMPLES_TRAIN)
        self.assertEquals(self.string_classifier._num_labels, 3)
        self.assertEquals(
            self.string_classifier._num_docs,
            len(self._NEW_EXAMPLES_TRAIN))
        self.assertEquals(self.string_classifier._num_words, 4)
        self._validate_instance()

    def test_prediction_report(self):
        def _mock_get_label_probabilities(d):
            self.assertEquals(d, -1)
            return [0.5, 0.3, 0.2]

        def _mock_get_label_id(unused_label):
            return 0

        def _mock_get_label_name(unused_label):
            return 'fake_label'

        self.string_classifier._prediction_threshold = 0
        self.string_classifier._get_label_probabilities = (
            _mock_get_label_probabilities)
        self.string_classifier._get_label_id = _mock_get_label_id
        prediction_report = (
            self.string_classifier._get_prediction_report_for_doc(-1))
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
        self.string_classifier._DEFAULT_MIN_DOCS_TO_PREDICT = 0
        self.string_classifier._DEFAULT_MIN_LABELS_TO_PREDICT = 0

        doc_ids = self.string_classifier.add_docs_for_predicting(
            self._EXAMPLES_TEST)
        predicted_label = self.string_classifier.predict_label_for_doc(
            doc_ids[0])
        self.assertEquals(predicted_label, 'food')
        predicted_label = self.string_classifier.predict_label_for_doc(
            doc_ids[1])
        self.assertEquals(predicted_label, 'pets')
        # Testing a doc predicted with the default label
        self.string_classifier._prediction_threshold = 0.7
        predicted_label = self.string_classifier.predict_label_for_doc(
            doc_ids[2])
        self.assertEquals(predicted_label, '_default')
        self._validate_instance()
