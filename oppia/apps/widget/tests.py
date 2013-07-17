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

import oppia.apps.classifier.models as cl_models
import oppia.apps.widget.models as widget_models
import test_utils

from google.appengine.ext import db


class AnswerHandlerUnitTests(test_utils.AppEngineTestBase):
    """Test AnswerHandler models."""

    def setUp(self):
        """Loads the default classifiers."""
        super(AnswerHandlerUnitTests, self).setUp()
        cl_models.Classifier.load_default_classifiers()

    def test_rules_property(self):
        """Test that answer_handler.rules behaves as expected."""
        answer_handler = widget_models.AnswerHandler()
        answer_handler.put()
        self.assertEqual(answer_handler.name, 'submit')
        self.assertEqual(answer_handler.rules, [])

        answer_handler.classifier = 'MultipleChoiceClassifier'
        answer_handler.put()
        self.assertEqual(len(answer_handler.rules), 1)

    def test_fake_classifier_is_not_accepted(self):
        """Test validation of answer_handler.classifier."""
        answer_handler = widget_models.AnswerHandler()
        with self.assertRaises(db.BadValueError):
            answer_handler.classifier = 'FakeClassifier'

        answer_handler = widget_models.AnswerHandler(
            classifier='MultipleChoiceClassifier')
        answer_handler.put()


class WidgetUnitTests(test_utils.AppEngineTestBase):
    """Test widget models."""

    def test_loading_and_deletion_of_widgets(self):
        """Test loading and deletion of the default widgets."""
        self.assertEqual(widget_models.Widget.query().count(), 0)

        widget_models.InteractiveWidget.load_default_widgets()
        self.assertEqual(widget_models.Widget.query().count(), 8)
        self.assertEqual(widget_models.InteractiveWidget.query().count(), 8)
        self.assertEqual(widget_models.NonInteractiveWidget.query().count(), 0)

        widget_models.Widget.delete_all_widgets()
        self.assertEqual(widget_models.Widget.query().count(), 0)

    def test_put_method(self):
        """Test that put() only works when called on a Widget subclass."""
        widget = widget_models.Widget(
            name='Widget Name', category='Category')
        with self.assertRaises(NotImplementedError):
            widget.put()

        widget = widget_models.InteractiveWidget(
            id='interactive-widget', name='Widget Name', category='Category',
            handlers=[widget_models.AnswerHandler()])
        widget.put()

    def test_pre_put_validation(self):
        """Test pre-put checks for widget handlers."""
        widget = widget_models.InteractiveWidget(
            id='interactive-widget', name='Widget Name', category='Category')
        widget.handlers = []
        with self.assertRaises(db.BadValueError):
            widget.put()

        widget.handlers = [
            widget_models.AnswerHandler(), widget_models.AnswerHandler()]
        with self.assertRaises(db.BadValueError):
            widget.put()

        widget.handlers = [
            widget_models.AnswerHandler(name='click'),
            widget_models.AnswerHandler(name='click')]
        with self.assertRaises(db.BadValueError):
            widget.put()

        widget.handlers = [
            widget_models.AnswerHandler(name='submit'),
            widget_models.AnswerHandler(name='click')]
        widget.put()

    def test_required_properties(self):
        """Test validation of required widget properties."""
        widget = widget_models.InteractiveWidget(
            id='interactive-widget', name='Widget Name')
        with self.assertRaises(db.BadValueError):
            widget.put()

        widget.category = 'Category'
        with self.assertRaises(db.BadValueError):
            widget.put()

        widget.handlers = [widget_models.AnswerHandler()]
        widget.put()

    def test_parameterized_widget(self):
        """Test that parameterized widgets are correctly handled."""
        self.assertEqual(widget_models.Widget.query().count(), 0)

        cl_models.Classifier.load_default_classifiers()
        widget_models.InteractiveWidget.load_default_widgets()

        MUSIC_STAFF_ID = 'interactive-MusicStaff'

        widget = widget_models.InteractiveWidget.get(MUSIC_STAFF_ID)
        self.assertEqual(widget.id, MUSIC_STAFF_ID)
        self.assertEqual(widget.name, 'Music staff')

        code = widget_models.Widget.get_raw_code(MUSIC_STAFF_ID)
        self.assertIn('GLOBALS.noteToGuess = JSON.parse(\'\\"', code)

        code = widget_models.Widget.get_raw_code(
            MUSIC_STAFF_ID, {'noteToGuess': 'abc'})
        self.assertIn('GLOBALS.noteToGuess = JSON.parse(\'abc\');', code)

        # The get_with_params() method cannot be called directly on Widget.
        # It must be called on a subclass.
        with self.assertRaises(AttributeError):
            parameterized_widget_dict = widget_models.Widget.get_with_params(
                MUSIC_STAFF_ID, {'noteToGuess': 'abc'})
        with self.assertRaises(NotImplementedError):
            parameterized_widget_dict = widget_models.Widget._get_with_params(
                MUSIC_STAFF_ID, {'noteToGuess': 'abc'})

        parameterized_widget_dict = (
            widget_models.InteractiveWidget.get_with_params(
                MUSIC_STAFF_ID, {'noteToGuess': 'abc'})
        )
        self.assertItemsEqual(parameterized_widget_dict.keys(), [
            'id', 'name', 'category', 'description',
            'params', 'handlers', 'raw'])
        self.assertEqual(parameterized_widget_dict['id'], MUSIC_STAFF_ID)
        self.assertIn('GLOBALS.noteToGuess = JSON.parse(\'abc\');',
                      parameterized_widget_dict['raw'])
        self.assertEqual(parameterized_widget_dict['params'],
                         {'noteToGuess': 'abc'})
