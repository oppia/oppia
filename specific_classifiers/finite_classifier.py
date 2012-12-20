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

"""Classifies inputs with finitely many possibilities."""

__author__ = 'sll@google.com (Sean Lip)'

import logging

import base


class FiniteClassifier(object):
  """Classifies 'finite' inputs."""

  def Classify(self, response, categories, params=None):
    """Classifies responses into one of finitely many categories.

    Args:
      response: a number representing the student's response category.
      categories: a list where each element represents a category.
      params: not used.

    Raises:
      InvalidInputException, if response is not a number between 0 and the length
          of categories, inclusive.

    Returns:
      response, if it is a number between 0 and len(categories) - 1,
         inclusive.
    """
    # Validate 'response'.
    response = int(response)
    logging.info(response)
    logging.info(isinstance(response, int))
    if not isinstance(response, int):
      raise base.InvalidInputException(
          'Input ' + str(response) + ' is not a valid category.')

    logging.info(categories)

    if response >= 0 and response < len(categories):
      return response
    else:
      raise base.InvalidInputException(
          'Input %s is not a valid category for a finite classifier given by %s'
          % (response, categories))
