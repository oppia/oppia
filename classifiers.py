# Copyright 2012 Google Inc. All Rights Reserved.
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

"""Contains all the classifiers used to parse reader input in Oppia."""

__author__ = 'Sean Lip'

import logging

from specific_classifiers import finite_classifier
from specific_classifiers import none_classifier
from specific_classifiers import numeric_classifier
from specific_classifiers import set_classifier
from specific_classifiers import text_classifier

import utils

classifiers = utils.Enum('none', 'finite', 'numeric', 'set', 'text')

INPUT_CLASSIFIER = {classifiers.none: none_classifier.NoneClassifier,
                    classifiers.finite: finite_classifier.FiniteClassifier,
                    classifiers.numeric: numeric_classifier.NumericClassifier,
                    classifiers.set: set_classifier.SetClassifier,
                    classifiers.text: text_classifier.TextClassifier}


def Classify(classifier_type, response, categories, params=None):
  """A general classifier which classifies inputs using given parameters.

  Args:
    classifier_type: a string denoting the type of the classifier (e.g. numeric)
    response: the input received from the reader
    categories: the list of categories defined by the content creator that the
        classifier can pick from
    params: the list of additional parameters to be passed to the classifier.

  Returns:
    the number of the category into which the response is classified.
  """
  classifier = INPUT_CLASSIFIER[str(classifier_type)]()
  if classifier:
    return classifier.Classify(response, categories, params)
  else:
    logging.error('Unrecognized classifier type %s', str(classifier_type))


def GetCategoryList(classifier_type, categories):
  """Gets the list of categories, excluding the one for invalid input.

  Args:
    classifier_type: a string denoting the type of the classifier (e.g. numeric)
    categories: the list of categories defined by the content creator that the
        classifier can pick from

  Returns:
    the list of categories.
  """
  if classifier_type == classifiers.none:
    return [utils.DEFAULT_CATEGORY]
  elif classifier_type == classifiers.finite:
    return categories
  elif (classifier_type == classifiers.numeric or
        classifier_type == classifiers.set or
        classifier_type == classifiers.text):
    return categories + [utils.DEFAULT_CATEGORY]
  else:
    logging.error('Unrecognized classifier type %s', str(classifier_type))
