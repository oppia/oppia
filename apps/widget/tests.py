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

from apps.classifier.models import Classifier
from apps.widget.models import AnswerHandler
from apps.widget.models import InteractiveWidget
from apps.widget.models import NonInteractiveWidget
from apps.widget.models import Widget
import test_utils

from google.appengine.ext.db import BadValueError


class AnswerHandlerUnitTests(test_utils.AppEngineTestBase):
    """Test AnswerHandler models."""

    def setUp(self):
        """Loads the default classifiers."""
        super(AnswerHandlerUnitTests, self).setUp()
        Classifier.load_default_classifiers()

    def test_rules_property(self):
        """Test that answer_handler.rules behaves as expected."""
        answer_handler = AnswerHandler()
        answer_handler.put()
        self.assertEqual(answer_handler.name, 'submit')
        self.assertEqual(answer_handler.rules, [])

        answer_handler.classifier = 'MultipleChoiceClassifier'
        answer_handler.put()
        self.assertEqual(len(answer_handler.rules), 1)

    def test_fake_classifier_is_not_accepted(self):
        """Test validation of answer_handler.classifier."""
        answer_handler = AnswerHandler()
        with self.assertRaises(BadValueError):
            answer_handler.classifier = 'FakeClassifier'

        answer_handler = AnswerHandler(classifier='MultipleChoiceClassifier')
        answer_handler.put()


class WidgetUnitTests(test_utils.AppEngineTestBase):
    """Test widget models."""

    def test_loading_and_deletion_of_widgets(self):
        """Test loading and deletion of the default widgets."""
        self.assertEqual(Widget.query().count(), 0)

        InteractiveWidget.load_default_widgets()
        self.assertEqual(Widget.query().count(), 7)
        self.assertEqual(InteractiveWidget.query().count(), 7)
        self.assertEqual(NonInteractiveWidget.query().count(), 0)

        Widget.delete_all_widgets()
        self.assertEqual(Widget.query().count(), 0)

    def test_put_method(self):
        """Test that put() only works when called on a Widget subclass."""
        widget = Widget(
            name='Widget Name', category='Category', template='Template')
        with self.assertRaises(NotImplementedError):
            widget.put()

        widget = InteractiveWidget(
            name='Widget Name', category='Category', template='Template',
            handlers=[AnswerHandler()])
        widget.put()

    def test_pre_put_validation(self):
        """Test pre-put checks for widget handlers."""
        widget = InteractiveWidget(
            name='Widget Name', category='Category', template='Template')
        widget.handlers = []
        with self.assertRaises(BadValueError):
            widget.put()

        widget.handlers = [AnswerHandler(), AnswerHandler()]
        with self.assertRaises(BadValueError):
            widget.put()

        widget.handlers = [
            AnswerHandler(name='click'), AnswerHandler(name='click')]
        with self.assertRaises(BadValueError):
            widget.put()

        widget.handlers = [
            AnswerHandler(name='submit'), AnswerHandler(name='click')]
        widget.put()

    def test_required_properties(self):
        """Test validation of required widget properties."""
        widget = InteractiveWidget(name='Widget Name')
        with self.assertRaises(BadValueError):
            widget.put()

        widget.category = 'Category'
        with self.assertRaises(BadValueError):
            widget.put()

        widget.template = 'Template'
        with self.assertRaises(BadValueError):
            widget.put()

        widget.handlers = [AnswerHandler()]
        widget.put()

    def test_parameterized_widget(self):
        """Test that parameterized widgets are correctly handled."""
        self.assertEqual(Widget.query().count(), 0)

        Classifier.load_default_classifiers()
        InteractiveWidget.load_default_widgets()

        widget = InteractiveWidget.get('MusicStaff')
        self.assertEqual(widget.id, 'MusicStaff')
        self.assertEqual(widget.name, 'Music staff')

        code = Widget.get_raw_code('MusicStaff')
        self.assertIn('GLOBALS.noteToGuess = JSON.parse(\'\\"', code)

        code = Widget.get_raw_code('MusicStaff', {'noteToGuess': 'abc'})
        self.assertIn('GLOBALS.noteToGuess = JSON.parse(\'abc\');', code)

        # The get_with_params() method cannot be called directly on Widget.
        # It must be called on a subclass.
        with self.assertRaises(AttributeError):
            parameterized_widget_dict = Widget.get_with_params(
                'MusicStaff', {'noteToGuess': 'abc'})
        with self.assertRaises(NotImplementedError):
            parameterized_widget_dict = Widget._get_with_params(
                'MusicStaff', {'noteToGuess': 'abc'})

        parameterized_widget_dict = InteractiveWidget.get_with_params(
            'MusicStaff', {'noteToGuess': 'abc'})
        self.assertItemsEqual(parameterized_widget_dict.keys(), [
            'id', 'name', 'category', 'description', 'template', 'params',
            'handlers', 'raw'])
        self.assertEqual(parameterized_widget_dict['id'], 'MusicStaff')
        self.assertIn('GLOBALS.noteToGuess = JSON.parse(\'abc\');',
                      parameterized_widget_dict['raw'])
        self.assertEqual(parameterized_widget_dict['params'],
                         {'noteToGuess': 'abc'})
