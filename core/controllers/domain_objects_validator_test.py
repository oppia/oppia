# Copyright 2021 The Oppia Authors. All Rights Reserved.
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

"""Tests for the domain_objects_validator."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.controllers import domain_objects_validator
from core.tests import test_utils

import utils


class ValidateExplorationChangeTests(test_utils.GenericTestBase):
    """Tests to validate domain objects coming from API."""

    def test_incorrect_object_raises_exception(self):
        # type: () -> None
        exploration_change = {
            'old_value': '',
            'property_name': 'title',
            'new_value': 'newValue'
        }
        with self.assertRaisesRegexp( # type: ignore[no-untyped-call]
            Exception, 'Missing cmd key in change dict'):
            domain_objects_validator.validate_exploration_change(
                exploration_change)

    def test_correct_object_do_not_raises_exception(self):
        # type: () -> None
        exploration_change = {
            'cmd': 'edit_exploration_property',
            'new_value': 'arbitary_new_value',
            'old_value': '',
            'property_name': 'title'
        }
        domain_objects_validator.validate_exploration_change(exploration_change)


class ValidateNewConfigPropertyValuesTests(test_utils.GenericTestBase):
    """Tests to validate config properties dict coming from API."""

    def test_invalid_object_raises_exception(self):
        config_properties = {'some_config_property': 20, }
        with self.assertRaisesRegexp(
            Exception, 'some_config_property do not have any schema.'):
            domain_objects_validator.validate_new_config_property_values(
                config_properties)

        config_properties = {1234: 20, }
        with self.assertRaisesRegexp(
            Exception, 'config property name should be a string, received'
            ': %s' % 1234):
            domain_objects_validator.validate_new_config_property_values(
                config_properties)

    def test_valid_object_raises_no_exception(self):
        config_properties = {
            'max_number_of_tags_assigned_to_blog_post': 20,
        }
        domain_objects_validator.validate_new_config_property_values(
            config_properties)


class ValidateChangeDictForBlogPost(test_utils.GenericTestBase):
    """Tests to validate change_dict containing updated values for blog
    post object coming from API."""

    def test_invalid_title_raises_exception(self):
        blog_post_change = {
            'title': 123,
            'tags': ['News'],
        }
        with self.assertRaisesRegexp(
            utils.ValidationError, 'Title should be a string'):
            domain_objects_validator.validate_change_dict_for_blog_post(
                blog_post_change)

    def test_invalid_tags_raises_exception(self):
        blog_post_change = {
            'title': 'Hello Bloggers',
            'tags': ['News', 'Some Tag'],
        }
        with self.assertRaisesRegexp(
            Exception, 'Invalid tags provided. Tags not in default'
            ' tags list.'):
            domain_objects_validator.validate_change_dict_for_blog_post(
                blog_post_change)

        blog_post_change = {
            'title': 'Hello',
            'tags': ['News', 123],
        }
        with self.assertRaisesRegexp(
            Exception, 'Expected each tag in \'tags\' to be a string,'
            ' received: \'123\''):
            domain_objects_validator.validate_change_dict_for_blog_post(
                blog_post_change)

    def test_valid_dict_raises_no_exception(self):
        blog_post_change = {
            'title': 'Hello Bloggers',
            'tags': ['News', 'Learners'],
        }
        domain_objects_validator.validate_change_dict_for_blog_post(
            blog_post_change)

        blog_post_change = {
            'title': 'Hello Bloggers',
            'tags': ['News', 'Learners'],
            'thumbnail_filename': 'name.svg',
        }
        domain_objects_validator.validate_change_dict_for_blog_post(
            blog_post_change)
