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

import test_utils
import utils

import numpy


class StringClassifierUnitTests(test_utils.GenericTestBase):

    _EXAMPLES = [
        ['i eat fish and vegetables', ['food']],
        ['fish are pets', ['pets']],
        ['my kitten eats fish', ['food', 'pets']]
    ]

    _NEW_EXAMPLES = [
        ['i only eat fish and vegetables', []],
        ['pets are friends', []],
        ['a b c d e f g h i j k l m n o p q r s t u v w x y z', []]
    ]

    def setUp(self):
        super(StringClassifierUnitTests, self).setUp()
        self.string_classifier = classifier_services.StringClassifier()
        self.string_classifier.load_examples(self._EXAMPLES)

    def _validate_instance(self, string_classifier):
        self.assertEquals('_alpha' in dir(self.string_classifier), True)
        self.assertEquals('_beta' in dir(self.string_classifier), True)

        for d in xrange(self.string_classifier._doc_count):
            self.assertEquals(
                len(self.string_classifier._l_dc[d]),
                len(self.string_classifier._w_dc[d]))

        self.assertEquals(
            len(self.string_classifier._label_to_id),
            self.string_classifier._label_count)
        self.assertEquals(
            len(self.string_classifier._word_to_id),
            self.string_classifier._word_count)
        self.assertEquals(
            len(self.string_classifier._w_dc),
            self.string_classifier._doc_count)
        self.assertEquals(
            len(self.string_classifier._b_dl),
            self.string_classifier._doc_count)
        self.assertEquals(
            len(self.string_classifier._b_dl[0]),
            self.string_classifier._label_count)
        self.assertEquals(
            len(self.string_classifier._l_dc),
            self.string_classifier._doc_count)
        self.assertEquals(
            len(self.string_classifier._c_dl),
            self.string_classifier._doc_count)
        self.assertEquals(
            len(self.string_classifier._c_dl[0]),
            self.string_classifier._label_count)
        self.assertEquals(
            len(self.string_classifier._c_lw),
            self.string_classifier._label_count)
        self.assertEquals(
            len(self.string_classifier._c_lw[0]),
            self.string_classifier._word_count)
        self.assertEquals(
            len(self.string_classifier._c_l),
            self.string_classifier._label_count)

    def test_valid_state(self):
        self.assertEquals(self.string_classifier._label_count, 3)
        self.assertEquals(self.string_classifier._doc_count, 3)
        self.assertEquals(self.string_classifier._word_count, 10)
        self._validate_instance(self.string_classifier)

    def test_add_doc(self):
        self.string_classifier.add_examples(self._NEW_EXAMPLES)
        self.assertEquals(self.string_classifier._label_count, 3)
        self.assertEquals(self.string_classifier._doc_count, 6)
        self.assertEquals(self.string_classifier._word_count, 37)
        self._validate_instance(self.string_classifier)

    def test_model_save_load(self):
        self.assertEquals(
            self.string_classifier._doc_count,
            len(self._EXAMPLES))
        model = self.string_classifier.to_dict()
        model['_doc_count'] = 9
        self.assertEquals(model['_doc_count'], 9)
        self.assertEquals(
            self.string_classifier._doc_count,
            len(self._EXAMPLES))
        self.string_classifier.add_examples(self._NEW_EXAMPLES)
        self.assertEquals(
            self.string_classifier._doc_count,
            len(self._EXAMPLES) + len(self._NEW_EXAMPLES))
        self.assertEquals(model['_doc_count'], 9)
        self.string_classifier.from_dict(model)
        self.assertEquals(self.string_classifier._doc_count, 9)
        self.assertEquals(model['_doc_count'], 9)

    def test_get_word_id(self):
        word_count = self.string_classifier._word_count
        self.string_classifier._get_word_id('_non_existent_word_1')
        self.assertEquals(self.string_classifier._word_count, word_count + 1)
        self.string_classifier._get_word_id('i')
        self.assertEquals(self.string_classifier._word_count, word_count + 1)
        self.string_classifier._get_word_id('_non_existent_word_2')
        self.assertEquals(self.string_classifier._word_count, word_count + 2)

    def test_get_label_id(self):
        label_count = self.string_classifier._label_count
        self.string_classifier._get_label_id('_non_existent_label_1')
        self.assertEquals(self.string_classifier._label_count, label_count + 1)
        self.string_classifier._get_label_id('food')
        self.assertEquals(self.string_classifier._label_count, label_count + 1)
        self.string_classifier._get_label_id('_non_existent_label_2')
        self.assertEquals(self.string_classifier._label_count, label_count + 2)

    def test_reload_valid_state(self):
        self.string_classifier.load_examples(self._NEW_EXAMPLES)
        self.assertEquals(self.string_classifier._label_count, 1)
        self.assertEquals(
            self.string_classifier._doc_count,
            len(self._NEW_EXAMPLES))
        self.assertEquals(self.string_classifier._word_count, 34)
        self._validate_instance(self.string_classifier)

    def test_training(self):
        doc_ids = self.string_classifier.add_examples(self._NEW_EXAMPLES)
        predicted_label = self.string_classifier.predict_label(doc_ids[0])
        self.assertEquals(predicted_label, 'food')
        predicted_label = self.string_classifier.predict_label(doc_ids[1])
        self.assertEquals(predicted_label, 'pets')
        predicted_label = self.string_classifier.predict_label(doc_ids[2], 0.7)
        self.assertEquals(predicted_label, '_default')
        self._validate_instance(self.string_classifier)
