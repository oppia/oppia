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

        MUSIC_STAFF_ID = 'MusicStaff'

        widget = widget_domain.Registry.get_widget_by_id(
            feconf.INTERACTIVE_PREFIX, MUSIC_STAFF_ID)
        self.assertEqual(widget.id, MUSIC_STAFF_ID)
        self.assertEqual(widget.name, 'Music staff')

        code = widget.get_raw_code({}, {})
        self.assertIn('GLOBALS.noteToGuess = JSON.parse(\'\\"', code)

        code = widget.get_raw_code({'noteToGuess': {'value': 'F4'}}, {})
        self.assertIn('GLOBALS.noteToGuess = JSON.parse(\'\\"F4\\"\');', code)

        code = widget.get_raw_code(
            {'noteToGuess': {'value': '{{ntg}}', 'parse_with_jinja': True}},
            {'ntg': 'F4'})
        self.assertIn('GLOBALS.noteToGuess = JSON.parse(\'\\"F4\\"\');', code)

        parameterized_widget_dict = widget.get_widget_instance_dict(
            {'noteToGuess': {'value': 'F4'}}, {}
        )
        self.assertItemsEqual(parameterized_widget_dict.keys(), [
            'id', 'name', 'category', 'description', 'params',
            'handlers', 'raw'])
        self.assertEqual(parameterized_widget_dict['id'], MUSIC_STAFF_ID)
        self.assertIn('GLOBALS.noteToGuess = JSON.parse(\'\\"F4\\"\');',
                      parameterized_widget_dict['raw'])

        self.assertEqual(parameterized_widget_dict['params'], {
            'noteToGuess': {
                'value': 'F4',
                'obj_type': 'UnicodeString',
                'generator_id': 'RestrictedCopier',
                'init_args': {
                    'choices': [
                        'C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5',
                        'E5', 'F5'
                    ]
                },
                'customization_args': {
                    'value': 'F4',
                }
            }
        })
