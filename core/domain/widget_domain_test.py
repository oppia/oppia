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

__author__ = 'Jeremy Emerson'

from core.domain import widget_domain
from core.domain import widget_registry
from extensions.objects.models import objects
import feconf
import test_utils


class AnswerHandlerUnitTests(test_utils.GenericTestBase):
    """Test the AnswerHandler domain object."""

    def test_rules_property(self):
        """Test that answer_handler.rules behaves as expected."""
        answer_handler = widget_domain.AnswerHandler()
        self.assertEqual(answer_handler.name, 'submit')
        self.assertEqual(answer_handler.rules, [])

        answer_handler = widget_domain.AnswerHandler(
            input_type=objects.NonnegativeInt)
        self.assertEqual(len(answer_handler.rules), 1)


class WidgetUnitTests(test_utils.GenericTestBase):
    """Test the widget domain object and registry."""

    def test_parameterized_widget(self):
        """Test that parameterized widgets are correctly handled."""

        TEXT_INPUT_ID = 'TextInput'

        widget = widget_registry.Registry.get_widget_by_id(
            feconf.INTERACTIVE_PREFIX, TEXT_INPUT_ID)
        self.assertEqual(widget.id, TEXT_INPUT_ID)
        self.assertEqual(widget.name, 'Text input')

        code = widget.get_raw_code({}, {})
        self.assertIn('GLOBALS.placeholder = JSON.parse(\'\\"', code)

        code = widget.get_raw_code({'placeholder': {'value': 'F4'}}, {})
        self.assertIn('GLOBALS.placeholder = JSON.parse(\'\\"F4\\"\');', code)

        code = widget.get_raw_code(
            {'placeholder': {'value': '{{ntg}}', 'parse_with_jinja': True}},
            {'ntg': 'F4'})
        self.assertIn('GLOBALS.placeholder = JSON.parse(\'\\"F4\\"\');', code)

        parameterized_widget_dict = widget.get_widget_instance_dict(
            {'placeholder': {'value': 'F4'}}, {}
        )
        self.assertItemsEqual(parameterized_widget_dict.keys(), [
            'widget_id', 'name', 'category', 'description', 'params',
            'handlers', 'raw', 'customization_args'])
        self.assertEqual(
            parameterized_widget_dict['widget_id'], TEXT_INPUT_ID)
        self.assertIn('GLOBALS.placeholder = JSON.parse(\'\\"F4\\"\');',
                      parameterized_widget_dict['raw'])

        self.assertDictContainsSubset({
            'placeholder': {
                'value': 'F4',
                'description': 'The placeholder for the text input field.',
                'obj_type': 'UnicodeString',
                'generator_id': 'Copier',
                'init_args': {},
                'customization_args': {
                    'value': 'F4',
                }
            }
        }, parameterized_widget_dict['params'])

        self.assertDictContainsSubset({
            'placeholder': {
                'value': 'F4',
            }
        }, parameterized_widget_dict['customization_args'])
