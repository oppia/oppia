# coding: utf-8
#
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

"""Tests for domain objects related to translations."""

from __future__ import annotations

from core import feconf
from core import utils
from core.domain import translation_domain
from core.tests import test_utils


class DummyTranslatableObjectWithTwoParams(
        translation_domain.BaseTranslatableObject):
    """A dummy translatable object with a translatable field and a
    TranslatableObject as its properties.
    """

    def __init__(
        self,
        param1: str,
        param2: DummyTranslatableObjectWithSingleParam
    ) -> None:
        self.param1 = param1
        self.param2 = param2

    def get_translatable_contents_collection(
        self
    ) -> translation_domain.TranslatableContentsCollection:
        translatable_contents_collection = (
            translation_domain.TranslatableContentsCollection())

        translatable_contents_collection.add_translatable_field(
            translation_domain.TranslatableContentFormat.UNICODE_STRING,
            'content_id_1',
            self.param1)
        translatable_contents_collection.add_fields_from_translatable_object(
            self.param2)
        return translatable_contents_collection


class DummyTranslatableObjectWithSingleParam(
        translation_domain.BaseTranslatableObject):
    """A dummy translatable object with a translatable field as its
    properties.
    """

    def __init__(
        self,
        param3: str
    ) -> None:
        self.param3 = param3

    def get_translatable_contents_collection(
        self
    ) -> translation_domain.TranslatableContentsCollection:
        translatable_contents_collection = (
            translation_domain.TranslatableContentsCollection())

        translatable_contents_collection.add_translatable_field(
            translation_domain.TranslatableContentFormat.UNICODE_STRING,
            'content_id_2',
            self.param3)
        return translatable_contents_collection


class DummyTranslatableObjectWithDuplicateContentIdForParams(
        translation_domain.BaseTranslatableObject):
    """A dummy translatable object with two translatable fields and on
    registering with same content_id an error is raised.
    """

    def __init__(
        self,
        param1: str,
        param2: str
    ) -> None:
        self.param1 = param1
        self.param2 = param2

    def get_translatable_contents_collection(
        self
    ) -> translation_domain.TranslatableContentsCollection:
        translatable_contents_collection = (
            translation_domain.TranslatableContentsCollection())

        translatable_contents_collection.add_translatable_field(
            translation_domain.TranslatableContentFormat.UNICODE_STRING,
            'content_id_2',
            self.param1)
        translatable_contents_collection.add_translatable_field(
            translation_domain.TranslatableContentFormat.UNICODE_STRING,
            'content_id_2',
            self.param2)
        return translatable_contents_collection


class DummyTranslatableObjectWithoutRegisterMethod(
        translation_domain.BaseTranslatableObject):
    """A dummy translatable object without
    get_translatable_contents_collection() method should raise an exception.
    """

    def __init__(
        self,
        param1: str,
        param2: str
    ) -> None:
        self.param1 = param1
        self.param2 = param2


class DummyTranslatableObjectWithFourParams(
        translation_domain.BaseTranslatableObject):
    """A dummy translatable object with four translatable fields as its
    properties.
    """

    def __init__(
        self,
        param1: str,
        param2: str,
        param3: str,
        param4: str
    ) -> None:
        self.param1 = param1
        self.param2 = param2
        self.param3 = param3
        self.param4 = param4

    def get_translatable_contents_collection(
        self
    ) -> translation_domain.TranslatableContentsCollection:
        translatable_contents_collection = (
            translation_domain.TranslatableContentsCollection())

        translatable_contents_collection.add_translatable_field(
            translation_domain.TranslatableContentFormat.UNICODE_STRING,
            'content_id_1',
            self.param1)
        translatable_contents_collection.add_translatable_field(
            translation_domain.TranslatableContentFormat.UNICODE_STRING,
            'content_id_2',
            self.param2)
        translatable_contents_collection.add_translatable_field(
            translation_domain.TranslatableContentFormat.UNICODE_STRING,
            'content_id_3',
            self.param3)
        translatable_contents_collection.add_translatable_field(
            translation_domain.TranslatableContentFormat.UNICODE_STRING,
            'content_id_4',
            self.param4)
        return translatable_contents_collection


class BaseTranslatableObjectUnitTest(test_utils.GenericTestBase):
    """Test class for BaseTranslatableObject."""

    def setUp(self) -> None:
        super(BaseTranslatableObjectUnitTest, self).setUp()
        self.translatable_object1 = DummyTranslatableObjectWithTwoParams(
            'My name is jhon.', DummyTranslatableObjectWithSingleParam(
                'My name is jack.'))

    def test_get_all_translatable_content_returns_correct_items(self) -> None:
        expected_contents = [
            'My name is jhon.',
            'My name is jack.'
        ]
        translatable_contents = (
            self.translatable_object1.get_translatable_contents_collection()
            .content_id_to_translatable_content.values())

        self.assertItemsEqual(expected_contents, [ # type: ignore[no-untyped-call]
            translatable_content.content_value
            for translatable_content in translatable_contents
        ])

    def test_unregistered_translatable_object_raises_exception(self) -> None:
        translatable_object = DummyTranslatableObjectWithoutRegisterMethod(
            'My name is jack.', 'My name is jhon.')

        with self.assertRaisesRegex( # type: ignore[no-untyped-call]
            Exception, 'Must be implemented in subclasses.'):
            translatable_object.get_translatable_contents_collection()

    def test_registering_duplicate_content_id_raises_exception(self) -> None:
        translatable_object = (
            DummyTranslatableObjectWithDuplicateContentIdForParams(
                'My name is jack.', 'My name is jhon.')
        )

        with self.assertRaisesRegex( # type: ignore[no-untyped-call]
            Exception,
            'Content_id content_id_2 already exists in the '
            'TranslatableContentsCollection.'):
            translatable_object.get_translatable_contents_collection()

    def test_get_all_contents_which_need_translations_method(self) -> None:
        translation_dict = {
            'content_id_3': translation_domain.TranslatedContent(
                'My name is Nikhil.', True)
        }
        entity_translations = translation_domain.EntityTranslation(
            'exp_id', feconf.TranslatableEntityType.EXPLORATION, 1, 'en',
            translation_dict)

        translatable_object = DummyTranslatableObjectWithFourParams(
            'My name is jack.', 'My name is jhon.', 'My name is Nikhil.', '')
        contents_which_need_translation = (
            translatable_object.get_all_contents_which_need_translations(
                entity_translations))

        expected_list_of_contents_which_need_translataion = [
            'My name is jack.',
            'My name is jhon.',
            'My name is Nikhil.'
        ]
        list_of_contents_which_need_translataion = [
            translatable_content.content_value
            for translatable_content in contents_which_need_translation
        ]
        self.assertItemsEqual( # type: ignore[no-untyped-call]
            expected_list_of_contents_which_need_translataion,
            list_of_contents_which_need_translataion)


class EntityTranslationsUnitTests(test_utils.GenericTestBase):
    """Test class for EntityTranslation."""

    def test_creation_of_object(self) -> None:
        translation_dict = {
            'content_id_1': translation_domain.TranslatedContent(
                'My name is Nikhil.', False)
        }
        entity_translations = translation_domain.EntityTranslation(
            'exp_id', feconf.TranslatableEntityType.EXPLORATION, 1, 'en',
            translation_dict)

        self.assertEqual(entity_translations.entity_id, 'exp_id')
        self.assertEqual(entity_translations.entity_type, 'exploration')
        self.assertEqual(entity_translations.entity_version, 1)
        self.assertEqual(entity_translations.language_code, 'en')
        self.assertEqual(
            entity_translations.translations['content_id_1'].content_value,
            'My name is Nikhil.')
        self.assertEqual(
            entity_translations.translations['content_id_1'].needs_update,
            False)


class TranslatableContentUnitTests(test_utils.GenericTestBase):
    """Test class for TranslatableContent."""

    def test_creation_of_object(self) -> None:
        translatable_content = translation_domain.TranslatableContent(
            'content_id_1',
            'My name is Jhon.',
            translation_domain.TranslatableContentFormat.HTML
        )

        self.assertEqual(translatable_content.content_id, 'content_id_1')
        self.assertEqual(translatable_content.content_value, 'My name is Jhon.')
        self.assertEqual(
            translatable_content.content_type,
            translation_domain.TranslatableContentFormat.HTML)

    def test_from_dict_method_of_translatable_content_class(self) -> None:
        translatable_content = (
                translation_domain.TranslatableContent.from_dict({
                'content_id': 'content_id_1',
                'content_value': 'My name is Jhon.',
                'content_type': translation_domain
                .TranslatableContentFormat.HTML
            })
        )

        self.assertEqual(translatable_content.content_id, 'content_id_1')
        self.assertEqual(translatable_content.content_value, 'My name is Jhon.')
        self.assertEqual(
            translatable_content.content_type,
            translation_domain.TranslatableContentFormat.HTML)

    def test_to_dict_method_of_translatable_content_class(self) -> None:
        translatable_content_dict = {
            'content_id': 'content_id_1',
            'content_value': 'My name is Jhon.',
            'content_type': translation_domain.TranslatableContentFormat.HTML
        }
        translatable_content = translation_domain.TranslatableContent(
            'content_id_1',
            'My name is Jhon.',
            translation_domain.TranslatableContentFormat.HTML
        )

        self.assertEqual(
            translatable_content.to_dict(),
            translatable_content_dict
        )


class TranslatedContentUnitTests(test_utils.GenericTestBase):
    """Test class for TranslatedContent."""

    def test_creation_of_object(self) -> None:
        translated_content = translation_domain.TranslatedContent(
            'My name is Nikhil.', False)

        self.assertEqual(translated_content.content_value, 'My name is Nikhil.')
        self.assertEqual(translated_content.needs_update, False)

    def test_from_dict_method_of_translated_content_class(self) -> None:
        translated_content = translation_domain.TranslatedContent.from_dict({
            'content_value': 'My name is Nikhil.',
            'needs_update': False
        })

        self.assertEqual(translated_content.content_value, 'My name is Nikhil.')
        self.assertEqual(translated_content.needs_update, False)

    def test_to_dict_method_of_translated_content_class(self) -> None:
        translated_content = translation_domain.TranslatedContent(
            'My name is Nikhil.', False)
        translated_content_dict = {
            'content_value': 'My name is Nikhil.',
            'needs_update': False
        }

        self.assertEqual(translated_content.to_dict(), translated_content_dict)


class MachineTranslationTests(test_utils.GenericTestBase):
    """Tests for the MachineTranslation domain object."""

    translation: translation_domain.MachineTranslation

    def setUp(self) -> None:
        """Setup for MachineTranslation domain object tests."""
        super(MachineTranslationTests, self).setUp()
        self._init_translation()

    def _init_translation(self) -> None:
        """Initialize self.translation with valid default values."""
        self.translation = translation_domain.MachineTranslation(
            'en', 'es', 'hello world', 'hola mundo')
        self.translation.validate()

    def test_validate_with_invalid_source_language_code_raises(self) -> None:
        self.translation.source_language_code = 'ABC'
        expected_error_message = (
            'Invalid source language code: ABC')
        with self.assertRaisesRegex( # type: ignore[no-untyped-call]
            utils.ValidationError, expected_error_message):
            self.translation.validate()

    def test_validate_with_invalid_target_language_code_raises(self) -> None:
        self.translation.target_language_code = 'ABC'
        expected_error_message = (
            'Invalid target language code: ABC')
        with self.assertRaisesRegex( # type: ignore[no-untyped-call]
            utils.ValidationError, expected_error_message):
            self.translation.validate()

    def test_validate_with_same_source_target_language_codes_raises(
        self
    ) -> None:
        self.translation.target_language_code = 'en'
        self.translation.source_language_code = 'en'
        expected_error_message = (
            'Expected source_language_code to be different from '
            'target_language_code: "en" = "en"')
        with self.assertRaisesRegex( # type: ignore[no-untyped-call]
            utils.ValidationError, expected_error_message):
            self.translation.validate()

    def test_to_dict(self) -> None:
        self.assertEqual(
            self.translation.to_dict(),
            {
                'source_language_code': 'en',
                'target_language_code': 'es',
                'source_text': 'hello world',
                'translated_text': 'hola mundo'
            }
        )


# def test_get_languages_with_complete_translation(self):
#         exploration = exp_domain.Exploration.create_default_exploration('0')
#         self.assertEqual(
#             exploration.get_languages_with_complete_translation(), [])
#         written_translations = state_domain.WrittenTranslations.from_dict({
#             'translations_mapping': {
#                 'content': {
#                     'hi': {
#                         'data_format': 'html',
#                         'translation': '<p>Translation in Hindi.</p>',
#                         'needs_update': False
#                     }
#                 }
#             }
#         })
#         exploration.states[
#             feconf.DEFAULT_INIT_STATE_NAME].update_written_translations(
#                 written_translations)

#         self.assertEqual(
#             exploration.get_languages_with_complete_translation(), ['hi'])

#     def test_get_translation_counts_with_no_needs_update(self):
#         exploration = exp_domain.Exploration.create_default_exploration('0')
#         self.assertEqual(
#             exploration.get_translation_counts(), {})

#         init_state = exploration.states[exploration.init_state_name]
#         init_state.update_content(
#             state_domain.SubtitledHtml.from_dict({
#                 'content_id': 'content',
#                 'html': '<p>This is content</p>'
#             }))
#         init_state.update_interaction_id('TextInput')
#         default_outcome = state_domain.Outcome(
#             'Introduction', state_domain.SubtitledHtml(
#                 'default_outcome', '<p>The default outcome.</p>'),
#             False, [], None, None
#         )

#         init_state.update_interaction_default_outcome(default_outcome)

#         written_translations = state_domain.WrittenTranslations.from_dict({
#             'translations_mapping': {
#                 'content': {
#                     'hi': {
#                         'data_format': 'html',
#                         'translation': '<p>Translation in Hindi.</p>',
#                         'needs_update': False
#                     }
#                 },
#                 'default_outcome': {
#                     'hi': {
#                         'data_format': 'html',
#                         'translation': '<p>Translation in Hindi.</p>',
#                         'needs_update': False
#                     }
#                 }
#             }
#         })
#         init_state.update_written_translations(written_translations)

#         exploration.add_states(['New state'])
#         new_state = exploration.states['New state']
#         new_state.update_content(
#             state_domain.SubtitledHtml.from_dict({
#                 'content_id': 'content',
#                 'html': '<p>This is content</p>'
#             }))
#         new_state.update_interaction_id('TextInput')
#         default_outcome = state_domain.Outcome(
#             'Introduction', state_domain.SubtitledHtml(
#                 'default_outcome', '<p>The default outcome.</p>'),
#             False, [], None, None)
#         new_state.update_interaction_default_outcome(default_outcome)

#         written_translations = state_domain.WrittenTranslations.from_dict({
#             'translations_mapping': {
#                 'content': {
#                     'hi': {
#                         'data_format': 'html',
#                         'translation': '<p>New state translation in Hindi.</p>',
#                         'needs_update': False
#                     }
#                 },
#                 'default_outcome': {
#                     'hi': {
#                         'data_format': 'html',
#                         'translation': '<p>New State translation in Hindi.</p>',
#                         'needs_update': False
#                     }
#                 }
#             }
#         })
#         new_state.update_written_translations(written_translations)

#         self.assertEqual(
#             exploration.get_translation_counts(), {'hi': 4})

#     def test_get_translation_counts_with_needs_update(self):
#         exploration = exp_domain.Exploration.create_default_exploration('0')
#         self.assertEqual(
#             exploration.get_translation_counts(), {})

#         init_state = exploration.states[feconf.DEFAULT_INIT_STATE_NAME]
#         init_state.update_content(
#             state_domain.SubtitledHtml.from_dict({
#                 'content_id': 'content',
#                 'html': '<p>This is content</p>'
#             }))
#         init_state.update_interaction_id('TextInput')
#         default_outcome = state_domain.Outcome(
#             'Introduction', state_domain.SubtitledHtml(
#                 'default_outcome', '<p>The default outcome.</p>'),
#             False, [], None, None
#         )
#         init_state.update_interaction_default_outcome(default_outcome)

#         written_translations = state_domain.WrittenTranslations.from_dict({
#             'translations_mapping': {
#                 'content': {
#                     'hi': {
#                         'data_format': 'html',
#                         'translation': '<p>Translation in Hindi.</p>',
#                         'needs_update': True
#                     }
#                 },
#                 'default_outcome': {
#                     'hi': {
#                         'data_format': 'html',
#                         'translation': '<p>Translation in Hindi.</p>',
#                         'needs_update': False
#                     }
#                 }
#             }
#         })
#         init_state.update_written_translations(written_translations)

#         self.assertEqual(
#             exploration.get_translation_counts(), {'hi': 1})

#     def test_get_translation_counts_with_translation_in_multiple_lang(self):
#         exploration = exp_domain.Exploration.create_default_exploration('0')
#         self.assertEqual(
#             exploration.get_translation_counts(), {})
#         init_state = exploration.states[feconf.DEFAULT_INIT_STATE_NAME]
#         init_state.update_content(
#             state_domain.SubtitledHtml.from_dict({
#                 'content_id': 'content',
#                 'html': '<p>This is content</p>'
#             }))
#         init_state.update_interaction_id('TextInput')
#         default_outcome = state_domain.Outcome(
#             'Introduction', state_domain.SubtitledHtml(
#                 'default_outcome', '<p>The default outcome.</p>'),
#             False, [], None, None
#         )

#         init_state.update_interaction_default_outcome(default_outcome)

#         written_translations = state_domain.WrittenTranslations.from_dict({
#             'translations_mapping': {
#                 'content': {
#                     'hi-en': {
#                         'data_format': 'html',
#                         'translation': '<p>Translation in Hindi.</p>',
#                         'needs_update': False
#                     },
#                     'hi': {
#                         'data_format': 'html',
#                         'translation': '<p>Translation in Hindi.</p>',
#                         'needs_update': False
#                     }
#                 },
#                 'default_outcome': {
#                     'hi': {
#                         'data_format': 'html',
#                         'translation': '<p>Translation in Hindi.</p>',
#                         'needs_update': False
#                     }
#                 }
#             }
#         })
#         init_state.update_written_translations(written_translations)

#         self.assertEqual(
#             exploration.get_translation_counts(), {
#                 'hi': 2,
#                 'hi-en': 1
#             })

#     def test_get_content_count(self):
#         # Adds 1 to content count to exploration (content, default_outcome).
#         exploration = exp_domain.Exploration.create_default_exploration('0')
#         self.assertEqual(exploration.get_content_count(), 1)

#         # Adds 2 to content count to exploration (content default_outcome).
#         exploration.add_states(['New state'])
#         init_state = exploration.states[exploration.init_state_name]

#         # Adds 1 to content count to exploration (ca_placeholder_0)
#         self.set_interaction_for_state(init_state, 'TextInput')

#         state_answer_group = state_domain.AnswerGroup(
#             state_domain.Outcome(
#                 exploration.init_state_name, state_domain.SubtitledHtml(
#                     'feedback_1', 'Feedback'),
#                 False, [], None, None),
#             [
#                 state_domain.RuleSpec(
#                     'Contains',
#                     {
#                         'x':
#                         {
#                             'contentId': 'rule_input_5',
#                             'normalizedStrSet': ['Test']
#                         }
#                     })
#             ],
#             [],
#             None
#         )
#         # Adds 1 to content count to exploration (feedback_1).
#         init_state.update_interaction_answer_groups([state_answer_group])

#         hints_list = [
#             state_domain.Hint(
#                 state_domain.SubtitledHtml('hint_1', '<p>hint one</p>')
#             )
#         ]
#         # Adds 1 to content count to exploration (hint_1).
#         init_state.update_interaction_hints(hints_list)

#         solution_dict = {
#             'answer_is_exclusive': False,
#             'correct_answer': 'helloworld!',
#             'explanation': {
#                 'content_id': 'solution',
#                 'html': '<p>hello_world is a string</p>'
#             },
#         }
#         solution = state_domain.Solution.from_dict(
#             init_state.interaction.id, solution_dict)
#         # Adds 1 to content count to exploration (solution).
#         init_state.update_interaction_solution(solution)

#         self.assertEqual(exploration.get_content_count(), 6)
