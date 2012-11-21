# coding: utf-8
#
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

"""Classifies numeric inputs."""

__author__ = 'sll@google.com (Sean Lip)'

import logging

import utils


class NumericClassifier(object):
  """Classifies numeric inputs."""

  def Classify(self, response, categories, params=None):
    """Classifies numeric responses.

    Args:
      response: a number representing the student's response.
      categories: a list of strings of the form 'OP NUMBER (± NUMBER)' where
          OP is ≤|≥|=|<|> and NUMBER is a decimal number. The second NUMBER, if
          it exists, must be non-negative.
      params: not used.

    Raises:
      InvalidInputError, if response is not a number.
      InvalidCategoryError, if some element of categories is invalid.

    Returns:
      - the 0-based index of the first element in categories which is satisfied
        by response, if one exists. Otherwise, returns the number of elements
        in categories.
    """
    # Validate 'response'.
    logging.info(response)
    try:
      response = float(response)
    except ValueError:
      raise utils.InvalidInputError(
          '%s is not a valid numeric input.', str(response))

    logging.info(categories)
    for index, category in enumerate(categories):
      logging.info(category)
      # TODO(sll): Provide more helpful error messages in the validation.
      category_error = ('%s at index %s is not a valid numeric category.' %
                        (category.encode('utf-8'), index))
      category_array = category.split()
      if len(category_array) != 2 and len(category_array) != 4:
        raise utils.InvalidCategoryError('%s', category_error)

      try:
        op = category_array[0].encode('utf-8')
        category_array[1] = float(category_array[1])
        if (op != '=' and op != '<' and op != '>' and
            op != '≤' and op != '≥'):
          raise utils.InvalidCategoryError(category_error)
        if len(category_array) == 4:
          if category_array[2].encode('utf-8') != '±':
            raise utils.InvalidCategoryError(category_error)
          category_array[3] = float(category_array[3])
          if category_array[3] < 0:
            raise utils.InvalidCategoryError(category_error)
      except (utils.InvalidCategoryError, ValueError):
        raise utils.InvalidCategoryError(category_error)

      # Check whether this category matches the response.
      if op == '=':
        if response == category_array[1]:
          return index
        elif (len(category_array) == 4 and
              category_array[1] - category_array[3] <= response and
              category_array[1] + category_array[3] >= response):
          return index
      else:
        if ((op == '≥' and response >= category_array[1]) or
            (op == '≤' and response <= category_array[1]) or
            (op == '>' and response > category_array[1]) or
            (op == '<' and response < category_array[1])):
          return index

    # None of the categories match, so return the default category.
    return len(categories)
