# coding: utf-8
#
# Copyright 2013 Google Inc. All Rights Reserved.
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

"""Tests for the Classifier model."""

__author__ = 'Sean Lip'

import oppia.apps.classifier.models as cl_models
import test_utils


class ClassifierModelUnitTests(test_utils.AppEngineTestBase):
    """Test the Classifier model."""

    def test_loading_and_deletion_of_classifiers(self):
        """Test loading and deletion of the default classifiers."""
        self.assertEqual(cl_models.Classifier.query().count(), 0)

        cl_models.Classifier.load_default_classifiers()
        classifiers = cl_models.Classifier.query()
        classifier_ids = [classifier.id for classifier in classifiers]
        self.assertIn('Coord2DClassifier', classifier_ids)
        self.assertEqual(classifiers.count(), 7)

        cl_models.Classifier.delete_all_classifiers()
        self.assertEqual(cl_models.Classifier.query().count(), 0)
