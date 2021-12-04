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

from __future__ import annotations

from core import utils
from core.controllers import domain_objects_validator
from core.tests import test_utils


class ValidateExplorationChangeTests(test_utils.GenericTestBase):
    """Tests to validate domain objects coming from API."""

    def test_incorrect_object_raises_exception(self) -> None:
        incorrect_change_dict = {
            'old_value': '',
            'property_name': 'title',
            'new_value': 'newValue'
        }
        with self.assertRaisesRegexp( # type: ignore[no-untyped-call]
            Exception, 'Missing cmd key in change dict'):
            domain_objects_validator.validate_exploration_change(
                incorrect_change_dict)

    def test_correct_object_do_not_raises_exception(self) -> None:
        correct_change_dict = {
            'cmd': 'edit_exploration_property',
            'new_value': 'arbitary_new_value',
            'old_value': '',
            'property_name': 'title'
        }
        domain_objects_validator.validate_exploration_change(
            correct_change_dict)


class ValidateCollectionChangeTests(test_utils.GenericTestBase):
    """Tests to validate domain objects coming from API."""

    def test_incorrect_object_raises_exception(self) -> None:
        incorrect_change_dict = {
            'old_value': '',
            'property_name': 'title',
            'new_value': 'newValue'
        }
        with self.assertRaisesRegexp( # type: ignore[no-untyped-call]
            Exception, 'Missing cmd key in change dict'):
            domain_objects_validator.validate_collection_change(
                incorrect_change_dict)

    def test_correct_object_do_not_raises_exception(self) -> None:
        correct_change_dict = {
            'cmd': 'edit_collection_property',
            'new_value': 'arbitary_new_value',
            'old_value': '',
            'property_name': 'title'
        }
        domain_objects_validator.validate_collection_change(
            correct_change_dict)


class ValidateNewConfigPropertyValuesTests(test_utils.GenericTestBase):
    """Tests to validate config properties dict coming from API."""

    def test_invalid_object_raises_exception(self) -> None:
        config_properties = {'some_config_property': 20, }
        with self.assertRaisesRegexp( # type: ignore[no-untyped-call]
            Exception, 'some_config_property do not have any schema.'):
            domain_objects_validator.validate_new_config_property_values(
                config_properties)

        config_properties = {1234: 20, } # type: ignore[dict-item]
        with self.assertRaisesRegexp( # type: ignore[no-untyped-call]
            Exception, 'config property name should be a string, received'
            ': %s' % 1234):
            domain_objects_validator.validate_new_config_property_values(
                config_properties)

    def test_valid_object_raises_no_exception(self) -> None:
        config_properties = {
            'max_number_of_tags_assigned_to_blog_post': 20,
        }
        domain_objects_validator.validate_new_config_property_values(
            config_properties)


class ValidateChangeDictForBlogPost(test_utils.GenericTestBase):
    """Tests to validate change_dict containing updated values for blog
    post object coming from API."""

    def test_invalid_title_raises_exception(self) -> None:
        blog_post_change = {
            'title': 123,
            'tags': ['News'],
        }
        with self.assertRaisesRegexp( # type: ignore[no-untyped-call]
            utils.ValidationError, 'Title should be a string'):
            domain_objects_validator.validate_change_dict_for_blog_post(
                blog_post_change)

    def test_invalid_tags_raises_exception(self) -> None:
        blog_post_change = {
            'title': 'Hello Bloggers',
            'tags': ['News', 'Some Tag'],
        }
        with self.assertRaisesRegexp( # type: ignore[no-untyped-call]
            Exception, 'Invalid tags provided. Tags not in default'
            ' tags list.'):
            domain_objects_validator.validate_change_dict_for_blog_post(
                blog_post_change)

        blog_post_change = {
            'title': 'Hello',
            'tags': ['News', 123], # type: ignore[list-item]
        }
        with self.assertRaisesRegexp( # type: ignore[no-untyped-call]
            Exception, 'Expected each tag in \'tags\' to be a string,'
            ' received: \'123\''):
            domain_objects_validator.validate_change_dict_for_blog_post(
                blog_post_change)

    def test_valid_dict_raises_no_exception(self) -> None:
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


class ValidateStateDictInStateYamlHandler(test_utils.GenericTestBase):
    """Tests to validate state_dict of StateYamlHandler."""

    def test_valid_object_raises_no_exception(self) -> None:
        state_dict = {
            'content': {'content_id': 'content', 'html': ''},
            'param_changes': [],
            'interaction': {
                'solution': None,
                'answer_groups': [],
                'default_outcome': {
                    'param_changes': [],
                    'feedback': {
                        'content_id': 'default_outcome',
                        'html': ''
                    },
                    'dest': 'State A',
                    'refresher_exploration_id': None,
                    'missing_prerequisite_skill_id': None,
                    'labelled_as_correct': False
                },
                'customization_args': {
                    'rows': {
                        'value': 1
                    },
                    'placeholder': {
                        'value': {
                            'unicode_str': '',
                            'content_id': 'ca_placeholder_0'
                        }
                    }
                },
                'confirmed_unclassified_answers': [],
                'id': 'TextInput',
                'hints': []
            },
            'linked_skill_id': None,
            'recorded_voiceovers': {
                'voiceovers_mapping': {
                    'content': {},
                    'default_outcome': {},
                    'ca_placeholder_0': {}
                }
            },
            'classifier_model_id': None,
            'written_translations': {
                'translations_mapping': {
                    'content': {},
                    'default_outcome': {},
                    'ca_placeholder_0': {}
                }
            },
            'next_content_id_index': 1,
            'card_is_checkpoint': False,
            'solicit_answer_details': False
        }
        domain_objects_validator.validate_state_dict(state_dict)

    def test_invalid_object_raises_exception(self) -> None:
        invalid_state_dict = {
            'classifier_model_id': None,
            'written_translations': {
                'translations_mapping': {
                    'content': {},
                    'default_outcome': {},
                    'ca_placeholder_0': {}
                }
            },
            'next_content_id_index': 1,
            'card_is_checkpoint': False,
            'solicit_answer_details': False
        }
        # The error is representing the keyerror.
        with self.assertRaisesRegexp(Exception, 'content'): # type: ignore[no-untyped-call]
            domain_objects_validator.validate_state_dict(invalid_state_dict)


class ValidateParamsDict(test_utils.GenericTestBase):
    """Tests to validate the data type of params"""

    def test_invalid_type_raises_exception(self):
        incorrect_type = 13
        with self.assertRaisesRegexp(
            Exception, 'Excepted dict, received %s' % incorrect_type):
            domain_objects_validator.validate_params_dict(incorrect_type)

        incorrect_type = 'param1'
        with self.assertRaisesRegexp(
            Exception, 'Excepted dict, received %s' % incorrect_type):
            domain_objects_validator.validate_params_dict(incorrect_type)

    def test_valid_type_raises_no_exception(self):
        correct_type = {}
        domain_objects_validator.validate_params_dict(correct_type)
