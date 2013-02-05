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

"""Classifies set inputs."""

__author__ = 'sll@google.com (Sean Lip)'

import json, logging

from controllers import base
import utils


class SetClassifier(object):
    """Classifies set inputs."""

    def Classify(self, response, categories, params=None):
        """Classifies set responses.

        Args:
            response: a JSON-encoded list representing the student's response.
            categories: a list of strings, each formatted as one of:
                - S has elements not in LIST
                - S omits some elements of LIST
                - S = LIST
                - S contains LIST (i.e., it contains ALL elements in LIST)
                - S excludes LIST (i.e., it does not contain ANY element in LIST)
                where LIST is a JSON-encoded list.

        Raises:
            InvalidInputException, if response is not a valid JSON-encoded list.
            InvalidCategoryError, if some element of categories is invalid.

        Returns:
            - the 0-based index of the first element in categories which is
                satisfied by response, if one exists. Otherwise, returns the
                number of elements in categories.
        """
        # Validate 'response'.
        logging.info(response)
        try:
            response = json.loads(response)
            assert type(response) is list
            response_set = set(response)
        except (ValueError, AssertionError):
            raise base.InvalidInputException(
                '%s is not a valid set input.', response)

        for index, category in enumerate(categories):
            if index == len(categories) - 1:
                # This is the default category. None of the other categories
                # match, so return its index.
                return index

            # TODO(sll): Provide more helpful error messages in the validation.
            if category.startswith('S has elements not in '):
                category_set = self.ParseSetCategory(
                    'S has elements not in ', category)
                if response_set.difference(category_set):
                    # TODO(sll): For this and the next case, find a way to
                    # return a random element from this set difference.
                    return index
            elif category.startswith('S omits some elements of '):
                category_set = self.ParseSetCategory(
                        'S omits some elements of ', category)
                if category_set.difference(response_set):
                    return index
            elif category.startswith('S = '):
                category_set = self.ParseSetCategory('S = ', category)
                if response_set == category_set:
                    return index
            elif category.startswith('S contains '):
                category_set = self.ParseSetCategory('S contains ', category)
                if response_set.issuperset(category_set):
                    return index
            elif category.startswith('S excludes '):
                category_set = self.ParseSetCategory('S excludes ', category)
                if not category_set & response_set:
                    return index
            else:
                raise utils.InvalidCategoryError(
                        '%s is not a valid contained list.' % category)

    def ParseSetCategory(self, prefix, category):
        """Strips the prefix from the category and turns the rest into a set.

        Args:
            prefix: the string preceding the set description
            category: the input string describing the category

        Raises:
            InvalidCategoryError, if a category is formatted incorrectly.

        Returns:
            the decoded set.
        """
        try:
            category_list = json.loads(category[len(prefix):])
            assert type(category_list) is list
            return set(category_list)
        except (ValueError, AssertionError):
            raise utils.InvalidCategoryError(
                '%s is not a valid list for %s.' % (category_list, prefix))
