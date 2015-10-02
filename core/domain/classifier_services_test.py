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

import numpy
import test_utils
import utils


class StringClassifierUnitTests(test_utils.GenericTestBase):

    _DOCS = [
        'i eat fish and vegetables'.split(),
        'fish are pets'.split(),
        'my kitten eats fish'.split()
    ]

    _DOC_LABELS = [
        ['food'],
        ['pets'],
        ['food', 'pets']
    ]

    _NEW_DOC = 'i only eat fish and vegetables'.split()

    _NEW_LABEL = []

    def setUp(self):
        super(StringClassifierUnitTests, self).setUp()
        self.string_classifier = classifier_services.StringClassifier()
        self.string_classifier.init_classifier(self._DOCS, self._DOC_LABELS)

    def _validate_instance(self, string_classifier):
        self.assertEquals('_alpha' in dir(self.string_classifier), True)
        self.assertEquals('_beta' in dir(self.string_classifier), True)
        self.assertEquals(
            len(self.string_classifier._i_l),
            self.string_classifier._cl)
        self.assertEquals(
            len(self.string_classifier._i_w),
            self.string_classifier._cw)
        self.assertEquals(
            len(self.string_classifier._w_dc),
            self.string_classifier._cd)
        self.assertEquals(len(self.string_classifier._w_dc[0]), 5)
        self.assertEquals(
            len(self.string_classifier._b_dl),
            self.string_classifier._cd)
        self.assertEquals(
            len(self.string_classifier._b_dl[0]),
            self.string_classifier._cl)
        self.assertEquals(
            len(self.string_classifier._l_dc),
            self.string_classifier._cd)
        self.assertEquals(len(self.string_classifier._l_dc[0]), 5)
        self.assertEquals(
            len(self.string_classifier._c_dl),
            self.string_classifier._cd)
        self.assertEquals(
            len(self.string_classifier._c_dl[0]),
            self.string_classifier._cl)
        self.assertEquals(
            len(self.string_classifier._c_lw),
            self.string_classifier._cl)
        self.assertEquals(
            len(self.string_classifier._c_lw[0]),
            self.string_classifier._cw)
        self.assertEquals(
            len(self.string_classifier._c_l),
            self.string_classifier._cl)

    def test_valid_state(self):
        self.assertEquals(self.string_classifier._cl, 3)
        self.assertEquals(self.string_classifier._cd, 3)
        self.assertEquals(self.string_classifier._cw, 10)
        self._validate_instance(self.string_classifier)

    def test_add_doc(self):
        self.string_classifier.add_doc(self._NEW_DOC, self._NEW_LABEL)
        self.assertEquals(self.string_classifier._cl, 3)
        self.assertEquals(self.string_classifier._cd, 4)
        self.assertEquals(self.string_classifier._cw, 11)
        self._validate_instance(self.string_classifier)

    def test_model_save_load(self):
        self.assertEquals(self.string_classifier._cd, 3)
        model = self.string_classifier.to_dict()
        model['_cd'] = 5
        self.assertEquals(model['_cd'], 5)
        self.assertEquals(self.string_classifier._cd, 3)
        self.string_classifier.add_doc(self._NEW_DOC, self._NEW_LABEL)
        self.assertEquals(self.string_classifier._cd, 4)
        self.assertEquals(model['_cd'], 5)
        self.string_classifier.from_dict(model)
        self.assertEquals(self.string_classifier._cd, 5)
        self.assertEquals(model['_cd'], 5)

    def test_get_word_id(self):
        word_count = self.string_classifier._cw
        self.string_classifier._get_word_id('_non_existent_word_1')
        self.assertEquals(self.string_classifier._cw, word_count + 1)
        self.string_classifier._get_word_id('i')
        self.assertEquals(self.string_classifier._cw, word_count + 1)
        self.string_classifier._get_word_id('_non_existent_word_2')
        self.assertEquals(self.string_classifier._cw, word_count + 2)

    def test_get_label_id(self):
        label_count = self.string_classifier._cl
        self.string_classifier._get_label_id('_non_existent_label_1')
        self.assertEquals(self.string_classifier._cl, label_count + 1)
        self.string_classifier._get_label_id('food')
        self.assertEquals(self.string_classifier._cl, label_count + 1)
        self.string_classifier._get_label_id('_non_existent_label_2')
        self.assertEquals(self.string_classifier._cl, label_count + 2)

    def test_training(self):
        self.string_classifier.train_all_docs()
        doc_id = self.string_classifier.add_doc(self._NEW_DOC, self._NEW_LABEL)
        self.string_classifier.train_single_doc(doc_id)
        predicted_label = self.string_classifier.predict_label(doc_id)
        self.assertEquals(predicted_label, 'food')
        self._validate_instance(self.string_classifier)
