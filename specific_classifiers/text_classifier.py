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

"""Classifies text inputs."""

__author__ = 'yanamal@google.com (Yana Malysheva)'

import logging

import base, utils


class TextClassifier(object):
  """Classifies text inputs."""

  def Classify(self, response, categories, params=None):
    """Classifies text responses.

    Args:
      response: a string representing the student's response.
      categories: a list of strings of the form 'TYPE STRING' where
        TYPE is one of:
          'Answer contains'
          'Answer does not contain'
        and STRING is the string to look for in the student's response
      params: not used.

    Raises:
      InvalidInputException, if response is not a string.
      InvalidCategoryError, if some element of categories is invalid.

    Returns:
      - the 0-based index of the first element in categories which is satisfied
        by response, if one exists. Otherwise, returns the number of elements
        in categories.
    """
    logging.info(response)
    response = unicode(response)
    response = self.NormalizeText(response)  #normalize student response:

    #try to find a matching category
    logging.info(categories)
    for index, category in enumerate(categories):
      if index == len(categories) - 1:
        # This is the default category. None of the other categories match,
        # so return its index.
        return index

      if category.startswith('Answer contains'):
        if response.find(self.GetCategoryText(category)) != -1:
          return index
      elif category.startswith('Answer does not contain'):
        if response.find(self.GetCategoryText(category)) == -1:
          return index
      elif category.startswith('Answer starts with'):
        if response.startswith(self.GetCategoryText(category)):
          return index
      elif category.startswith('Answer does not start with'):
        if not response.startswith(self.GetCategoryText(category)):
          return index
      elif category.startswith('Answer is exactly'):
        if response == self.GetCategoryText(category):
          return index
      elif category.startswith('Answer is not exactly'):
        if response != self.GetCategoryText(category):
          return index
      else:
        raise utils.InvalidCategoryError(
            ('%s is not a valid category type: could not '
             'determine how to compare response to string' % category))

  def GetCategoryText(self, category):
    itxt = category.find('"')
    if itxt == -1 or category[-1] != '"':  #start quote or end quote not found
      raise utils.InvalidCategoryError(
          ('%s is not a valid category type: could not '
           'find string to compare to student response' % category))
    text = category[itxt+1:-1]
    return self.NormalizeText(text)

  def NormalizeText(self, text):
    #convert to lower-case:
    text = text.lower()
    #reduce extraneous whitespace(including trailing/leading):
    text = ' '.join(text.split())
    return text
