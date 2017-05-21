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

from core.platform import models
from core.tests import test_utils

(classifier_models,) = models.Registry.import_models([models.NAMES.classifier])


class ClassifierModelUnitTests(test_utils.GenericTestBase):
    """Test the ClassifierModel class."""

    def setUp(self):
        super(ClassifierModelUnitTests, self).setUp()
        classifier_models.ClassifierModel.create('exp_id1', 1, 'state_name1',
                                                 'LDAStringClassifier',
                                                 {'alpha': 1.0}, 1)
        classifier_models.ClassifierModel.create('exp_id1', 1, 'state_name2',
                                                 'LDAStringClassifier',
                                                 {'alpha': 1.0}, 1)
        classifier_models.ClassifierModel.create('exp_id2', 1, 'state_name3',
                                                 'LDAStringClassifier',
                                                 {'alpha': 1.0}, 1)

    def test_create_new_classifier_runs_successfully(self):
        classifier_id = classifier_models.ClassifierModel.create(
            'exp_id3', 1, 'state_name1', 'LDAStringClassifier', {'alpha': 1.0},
            1)

        classifier = (
            classifier_models.ClassifierModel.get(classifier_id))

        self.assertEqual(classifier.exp_id, 'exp_id3')
        self.assertEqual(classifier.exp_version_when_created, 1)
        self.assertEqual(classifier.state_name, 'state_name1')
        self.assertEqual(classifier.algorithm_id, 'LDAStringClassifier')
        self.assertEqual(classifier.cached_classifier_data, {'alpha': 1.0})
        self.assertEqual(classifier.data_schema_version, 1)
