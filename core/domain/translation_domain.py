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

"""Domain objects related to translations."""

from __future__ import annotations

import copy
import enum

from core import utils

from typing import Dict, List, Union
from typing_extensions import TypedDict


class TranslatableContentPossibleDataTypes(enum.Enum):
    """Represents all possible data types for any translatable content."""

    TRANSLATABLE_CONTENT_FORMAT_HTML = 'html'
    TRANSLATABLE_CONTENT_FORMAT_UNICODE_STRING = 'unicode'
    TRANSLATABLE_CONTENT_FORMAT_SET_OF_NORMALIZED_STRING = (
        'set_of_normalized_string')
    TRANSLATABLE_CONTENT_FORMAT_SET_OF_UNICODE_STRING = 'set_of_unicode_string'


# The data type for the content in the TranslatableContent/TranslatedContent
# object.
ContentInTranslatableContent = Union[str, List[str]]

# Globally remove these variables/methods from codebase..
# next_content_id_index
# get_translation_counts()
# _get_all_translatable_content
# get_translatable_content_count()
# add_translation()
# get_all_html_content_strings()
# add_written_translation()
# mark_written_translation_as_needing_update()
# mark_written_translations_as_needing_update()
# update_written_translations()
# _get_all_translatable_content()
# get_content_id_mapping_needing_translations()
# CMD_ADD_WRITTEN_TRANSLATION
# CMD_MARK_WRITTEN_TRANSLATION_AS_NEEDING_UPDATE
# CMD_MARK_WRITTEN_TRANSLATIONS_AS_NEEDING_UPDATE
# STATE_PROPERTY_NEXT_CONTENT_ID_INDEX
# STATE_PROPERTY_WRITTEN_TRANSLATIONS

class TranslatableContentDict(TypedDict):
    """Dictionary representing TranslatableContent object."""

    content_id: str
    content: ContentInTranslatableContent
    content_type: TranslatableContentPossibleDataTypes


class TranslatedContentDict(TypedDict):
    """Dictionary representing TranslatedContent object."""

    content: ContentInTranslatableContent
    needs_update: bool


class BaseTranslatableObject:
    """Base class for all translatable objects which contain translatable
    fields/objects. For example, a State is a translatable object in
    Exploration, a Hint is a translatable object in State, and a hint_content
    is a translatable field in Hint. So Exploration, State, and Hint all should
    be the child class of BaseTranslatableObject.
    """

    # Private field to track translatable contents in a BaseTranslatableObject.
    _translatable_contents: Dict[str, TranslatableContent] = {}

    def _register_all_translatable_fields(self) -> None:
        """Method to register all translatable fields in a translatable object.

        Raises:
            NotImplementedError. The derived child class must implement the
                necessary logic to register all translatable fields in a
                translatable object.
        """
        raise NotImplementedError('Must be implemented in subclasses.')

    def _register_translatable_field(
        self,
        field_type: TranslatableContentPossibleDataTypes,
        content_id: str,
        value: ContentInTranslatableContent
    ) -> None:
        """Method to register a translatable field in a translatable object.

        Args:
            field_type: str. The type of the corresponding translatable content.
            content_id: str. The id of the corresponding translatable content.
            value: ContentInTranslatableContent. Value of the content which is
                translatable.
        """
        if content_id in self._translatable_contents:
            raise Exception(
                'A translatable field is already registered with the '
                'same content id: %s' % content_id)
        if value == '':
            return
        self._translatable_contents[content_id] = TranslatableContent(
            content_id, value, field_type)

    def _register_translatable_object(
        self,
        value: BaseTranslatableObject
    ) -> None:
        """Method to register a translatable field in a translatable object.

        Args:
            value: BaseTranslatableObject. An object representing
                BaseTranslatableObject.
        """
        self._translatable_contents.update(value.get_translatable_fields())

    def get_translatable_fields(self) -> Dict[str, TranslatableContent]:
        """Method to get all the translatable fields in a translatable object.

        Returns:
            Dict(str, TranslatableContent). Returns the dict containg content_id
            as key and TranslatableContent as value.
        """
        self._translatable_contents = {}
        self._register_all_translatable_fields()
        return copy.deepcopy(self._translatable_contents)

    def get_all_contents_which_needs_translations(
        self,
        entity_translation: EntityTranslation
    ) -> List[TranslatableContent]:
        """Returns a list of TranslatableContent instances which need
        translation or which need updates in existing translation.

        Args:
            entity_translation: EntityTranslation. An object storing the
                existing translations of an entity.

        Returns:
            list(TranslatableContent). Returns a list of TranslatableContents.
        """
        contents_which_need_translation = []
        content_ids_for_translated_contents = (
            entity_translation.translations.keys())

        for translatable_item in self.get_translatable_fields().values():
            # translatable_item is of type TranslatableContent.
            if translatable_item.content == '':
                continue

            if (
                translatable_item.content_id not in
                content_ids_for_translated_contents
            ):
                contents_which_need_translation.append(translatable_item)
            elif (
                entity_translation.translations[
                translatable_item.content_id].needs_update
            ):
                contents_which_need_translation.append(translatable_item)

        return contents_which_need_translation


class EntityTranslation:
    """The EntityTranslation represents an EntityTranslationsModel for a given
    version of an entity in a given language.

    Args:
        entity_id: str. The id of the corresponding entity.
        entity_type: str. The type of the corresponding entity.
        entity_version: str. The version of the corresponding entity.
        language_code: str. The language code for the corresponding entity.
        translations: dict(str, TranslatedContent). The translated content.
    """

    def __init__(
        self,
        entity_id: str,
        entity_type: str,
        entity_version: int,
        language_code: str,
        translations: Dict[str, TranslatedContent]
    ):
        self.entity_id = entity_id
        self.entity_type = entity_type
        self.entity_version = entity_version
        self.language_code = language_code
        self.translations = translations


class TranslatableContent:
    """TranslatablesContent represents a content of a translatable object which
    can be translated into multiple languages.

    Args:
        content_id: str. The id of the corresponding content.
        content: ContentInTranslatableContent. The content which can be
            translated.
        content_type: str. The type of the corresponding content.
    """

    def __init__(
        self,
        content_id: str,
        content: ContentInTranslatableContent,
        content_type: TranslatableContentPossibleDataTypes
    ) -> None:
        self.content_id = content_id
        self.content = content
        self.content_type = content_type

    @classmethod
    def from_dict(
        cls,
        translatable_content_dict: TranslatableContentDict
    ) -> TranslatableContent:
        """Returns a TranslatableContent object from its dict representation.

        Args:
            translatable_content_dict: dict. Dict representation of
                TranslatableContent object.

        Returns:
            TranslatableContent. The TranslatableContent object.
        """
        return cls(
            translatable_content_dict['content_id'],
            translatable_content_dict['content'],
            translatable_content_dict['content_type'])

    def to_dict(self) -> TranslatableContentDict:
        """Returns the dict representation of TranslatableContent object.

        Returns:
            dict. The dict representation of TranslatableContent object.
        """
        return {
            'content_id': self.content_id,
            'content': self.content,
            'content_type': self.content_type
        }


class TranslatedContent:
    """Represents the translated content of the TranslatableContent object.

    Args:
        content: ContentInTranslatableContent. Represents already translated
            content in a translated object.
        needs_update: bool. A boolean value represents whether any translation
            needs an update or not.
    """

    def __init__(
        self,
        content: ContentInTranslatableContent,
        needs_update: bool
    ) -> None:
        self.content = content
        self.needs_update = needs_update

    @classmethod
    def from_dict(
        cls,
        translated_contents_dict: TranslatedContentDict
    ) -> TranslatedContent:
        """Returns a TranslatedContent object from its dict representation.

        Args:
            translated_contents_dict: TranslatedContentDict. Dict representation
                of TranslatedContent object.

        Returns:
            TranslatedContent. The TranslatedContent object.
        """
        return cls(
            translated_contents_dict['content'],
            translated_contents_dict['needs_update'])

    def to_dict(self) -> TranslatedContentDict:
        """Returns the dict representation of TranslatedContent object.

        Returns:
            TranslatedContentDict. The dict representation of
            TranslatedContent object.
        """
        return {
            'content': self.content,
            'needs_update': self.needs_update
        }


class MachineTranslation:
    """Domain object for machine translation of exploration content."""

    def __init__(
        self,
        source_language_code: str,
        target_language_code: str,
        source_text: str,
        translated_text: str
    ) -> None:
        """Initializes a MachineTranslation domain object.

        Args:
            source_language_code: str. The language code for the source text
                language. Must be different from target_language_code.
            target_language_code: str. The language code for the target
                translation language. Must be different from
                source_language_code.
            source_text: str. The untranslated source text.
            translated_text: str. The machine generated translation of the
                source text into the target language.
        """
        self.source_language_code = source_language_code
        self.target_language_code = target_language_code
        self.source_text = source_text
        self.translated_text = translated_text

    def validate(self) -> None:
        """Validates properties of the MachineTranslation.

        Raises:
            ValidationError. One or more attributes of the MachineTranslation
                are invalid.
        """
        # TODO(#12341): Tidy up this logic once we have a canonical list of
        # language codes.
        if not utils.is_supported_audio_language_code(
                self.source_language_code
            ) and not utils.is_valid_language_code(
                self.source_language_code
            ):
            raise utils.ValidationError(
                'Invalid source language code: %s' % self.source_language_code)

        # TODO(#12341): Tidy up this logic once we have a canonical list of
        # language codes.
        if not utils.is_supported_audio_language_code(
                self.target_language_code
            ) and not utils.is_valid_language_code(
                self.target_language_code
            ):
            raise utils.ValidationError(
                'Invalid target language code: %s' % self.target_language_code)

        if self.source_language_code == self.target_language_code:
            raise utils.ValidationError(
                (
                    'Expected source_language_code to be different from '
                    'target_language_code: "%s" = "%s"') % (
                        self.source_language_code, self.target_language_code))

    def to_dict(self) -> Dict[str, str]:
        """Converts the MachineTranslation domain instance into a dictionary
        form with its keys as the attributes of this class.

        Returns:
            dict. A dictionary containing the MachineTranslation class
            information in a dictionary form.
        """
        return {
            'source_language_code': self.source_language_code,
            'target_language_code': self.target_language_code,
            'source_text': self.source_text,
            'translated_text': self.translated_text
        }


class WrittenTranslation:
    """Value object representing a written translation for a content.

    Here, "content" could mean a string or a list of strings. The latter arises,
    for example, in the case where we are checking for equality of a learner's
    answer against a given set of strings. In such cases, the number of strings
    in the translation of the original object may not be the same as the number
    of strings in the original object.
    """

    DATA_FORMAT_HTML = 'html'
    DATA_FORMAT_UNICODE_STRING = 'unicode'
    DATA_FORMAT_SET_OF_NORMALIZED_STRING = 'set_of_normalized_string'
    DATA_FORMAT_SET_OF_UNICODE_STRING = 'set_of_unicode_string'

    DATA_FORMAT_TO_TRANSLATABLE_OBJ_TYPE = {
        DATA_FORMAT_HTML: 'TranslatableHtml',
        DATA_FORMAT_UNICODE_STRING: 'TranslatableUnicodeString',
        DATA_FORMAT_SET_OF_NORMALIZED_STRING: (
            'TranslatableSetOfNormalizedString'),
        DATA_FORMAT_SET_OF_UNICODE_STRING: 'TranslatableSetOfUnicodeString',
    }

    @classmethod
    def is_data_format_list(cls, data_format):
        """Checks whether the content of translation with given format is of
        a list type.

        Args:
            data_format: str. The format of the translation.

        Returns:
            bool. Whether the content of translation is a list.
        """
        return data_format in (
            cls.DATA_FORMAT_SET_OF_NORMALIZED_STRING,
            cls.DATA_FORMAT_SET_OF_UNICODE_STRING
        )

    def __init__(self, data_format, translation, needs_update):
        """Initializes a WrittenTranslation domain object.

        Args:
            data_format: str. One of the keys in
                DATA_FORMAT_TO_TRANSLATABLE_OBJ_TYPE. Indicates the
                type of the field (html, unicode, etc.).
            translation: str|list(str). A user-submitted string or list of
                strings that matches the given data format.
            needs_update: bool. Whether the translation is marked as needing
                review.
        """
        self.data_format = data_format
        self.translation = translation
        self.needs_update = needs_update

    def to_dict(self):
        """Returns a dict representing this WrittenTranslation domain object.

        Returns:
            dict. A dict, mapping all fields of WrittenTranslation instance.
        """
        return {
            'data_format': self.data_format,
            'translation': self.translation,
            'needs_update': self.needs_update,
        }

    @classmethod
    def from_dict(cls, written_translation_dict):
        """Return a WrittenTranslation domain object from a dict.

        Args:
            written_translation_dict: dict. The dict representation of
                WrittenTranslation object.

        Returns:
            WrittenTranslation. The corresponding WrittenTranslation domain
            object.
        """
        return cls(
            written_translation_dict['data_format'],
            written_translation_dict['translation'],
            written_translation_dict['needs_update'])

    def validate(self):
        """Validates properties of the WrittenTranslation, normalizing the
        translation if needed.

        Raises:
            ValidationError. One or more attributes of the WrittenTranslation
                are invalid.
        """
        if self.data_format not in (
                self.DATA_FORMAT_TO_TRANSLATABLE_OBJ_TYPE):
            raise utils.ValidationError(
                'Invalid data_format: %s' % self.data_format)

        translatable_class_name = (
            self.DATA_FORMAT_TO_TRANSLATABLE_OBJ_TYPE[self.data_format])
        translatable_obj_class = (
            translatable_object_registry.Registry.get_object_class(
                translatable_class_name))
        self.translation = translatable_obj_class.normalize_value(
            self.translation)

        if not isinstance(self.needs_update, bool):
            raise utils.ValidationError(
                'Expected needs_update to be a bool, received %s' %
                self.needs_update)



class WrittenTranslations:
    """Value object representing a content translations which stores
    translated contents of all state contents (like hints, feedback etc.) in
    different languages linked through their content_id.
    """

    def __init__(self, translations_mapping):
        """Initializes a WrittenTranslations domain object.

        Args:
            translations_mapping: dict. A dict mapping the content Ids
                to the dicts which is the map of abbreviated code of the
                languages to WrittenTranslation objects.
        """
        self.translations_mapping = translations_mapping

    def to_dict(self):
        """Returns a dict representing this WrittenTranslations domain object.

        Returns:
            dict. A dict, mapping all fields of WrittenTranslations instance.
        """
        translations_mapping = {}
        for (content_id, language_code_to_written_translation) in (
                self.translations_mapping.items()):
            translations_mapping[content_id] = {}
            for (language_code, written_translation) in (
                    language_code_to_written_translation.items()):
                translations_mapping[content_id][language_code] = (
                    written_translation.to_dict())
        written_translations_dict = {
            'translations_mapping': translations_mapping
        }

        return written_translations_dict

    @classmethod
    def from_dict(cls, written_translations_dict):
        """Return a WrittenTranslations domain object from a dict.

        Args:
            written_translations_dict: dict. The dict representation of
                WrittenTranslations object.

        Returns:
            WrittenTranslations. The corresponding WrittenTranslations domain
            object.
        """
        translations_mapping = {}
        for (content_id, language_code_to_written_translation) in (
                written_translations_dict['translations_mapping'].items()):
            translations_mapping[content_id] = {}
            for (language_code, written_translation) in (
                    language_code_to_written_translation.items()):
                translations_mapping[content_id][language_code] = (
                    WrittenTranslation.from_dict(written_translation))

        return cls(translations_mapping)

    def get_content_ids_that_are_correctly_translated(self, language_code):
        """Returns a list of content ids in which a correct translation is
        available in the given language.

        Args:
            language_code: str. The abbreviated code of the language.

        Returns:
            list(str). A list of content ids in which the translations are
            available in the given language.
        """
        correctly_translated_content_ids = []
        for content_id, translations in self.translations_mapping.items():
            if (
                language_code in translations and
                not translations[language_code].needs_update
            ):
                correctly_translated_content_ids.append(content_id)

        return correctly_translated_content_ids

    def add_translation(self, content_id, language_code, html):
        """Adds a translation for the given content id in a given language.

        Args:
            content_id: str. The id of the content.
            language_code: str. The language code of the translated html.
            html: str. The translated html.
        """
        written_translation = WrittenTranslation(
            WrittenTranslation.DATA_FORMAT_HTML, html, False)
        self.translations_mapping[content_id][language_code] = (
            written_translation)

    def mark_written_translation_as_needing_update(
            self, content_id, language_code):
        """Marks translation as needing update for the given content id and
        language code.

        Args:
            content_id: str. The id of the content.
            language_code: str. The language code.
        """
        self.translations_mapping[content_id][language_code].needs_update = (
            True
        )

    def mark_written_translations_as_needing_update(self, content_id):
        """Marks translation as needing update for the given content id in all
        languages.

        Args:
            content_id: str. The id of the content.
        """
        for (language_code, written_translation) in (
                self.translations_mapping[content_id].items()):
            written_translation.needs_update = True
            self.translations_mapping[content_id][language_code] = (
                written_translation)

    def validate(self, expected_content_id_list):
        """Validates properties of the WrittenTranslations.

        Args:
            expected_content_id_list: list(str). A list of content id which are
                expected to be inside they WrittenTranslations.

        Raises:
            ValidationError. One or more attributes of the WrittenTranslations
                are invalid.
        """
        if expected_content_id_list is not None:
            if not set(self.translations_mapping.keys()) == (
                    set(expected_content_id_list)):
                raise utils.ValidationError(
                    'Expected state written_translations to match the listed '
                    'content ids %s, found %s' % (
                        expected_content_id_list,
                        list(self.translations_mapping.keys()))
                    )

        for (content_id, language_code_to_written_translation) in (
                self.translations_mapping.items()):
            if not isinstance(content_id, str):
                raise utils.ValidationError(
                    'Expected content_id to be a string, received %s'
                    % content_id)
            if not isinstance(language_code_to_written_translation, dict):
                raise utils.ValidationError(
                    'Expected content_id value to be a dict, received %s'
                    % language_code_to_written_translation)
            for (language_code, written_translation) in (
                    language_code_to_written_translation.items()):
                if not isinstance(language_code, str):
                    raise utils.ValidationError(
                        'Expected language_code to be a string, received %s'
                        % language_code)
                # Currently, we assume written translations are used by the
                # voice-artist to voiceover the translated text so written
                # translations can be in supported audio/voiceover languages.
                allowed_language_codes = [language['id'] for language in (
                    constants.SUPPORTED_AUDIO_LANGUAGES)]
                if language_code not in allowed_language_codes:
                    raise utils.ValidationError(
                        'Invalid language_code: %s' % language_code)

                written_translation.validate()

    def get_content_ids_for_text_translation(self):
        """Returns a list of content_id available for text translation.

        Returns:
            list(str). A list of content id available for text translation.
        """
        return list(sorted(self.translations_mapping.keys()))

    def get_translated_content(self, content_id, language_code):
        """Returns the translated content for the given content_id in the given
        language.

        Args:
            content_id: str. The ID of the content.
            language_code: str. The language code for the translated content.

        Returns:
            str. The translated content for a given content id in a language.

        Raises:
            Exception. Translation doesn't exist in the given language.
            Exception. The given content id doesn't exist.
        """
        if content_id in self.translations_mapping:
            if language_code in self.translations_mapping[content_id]:
                return self.translations_mapping[
                    content_id][language_code].translation
            else:
                raise Exception(
                    'Translation for the given content_id %s does not exist in '
                    '%s language code' % (content_id, language_code))
        else:
            raise Exception('Invalid content_id: %s' % content_id)

    def add_content_id_for_translation(self, content_id):
        """Adds a content id as a key for the translation into the
        content_translation dict.

        Args:
            content_id: str. The id representing a subtitled html.

        Raises:
            Exception. The content id isn't a string.
        """
        if not isinstance(content_id, str):
            raise Exception(
                'Expected content_id to be a string, received %s' % content_id)
        if content_id in self.translations_mapping:
            raise Exception(
                'The content_id %s already exist.' % content_id)
        else:
            self.translations_mapping[content_id] = {}

    def delete_content_id_for_translation(self, content_id):
        """Deletes a content id from the content_translation dict.

        Args:
            content_id: str. The id representing a subtitled html.

        Raises:
            Exception. The content id isn't a string.
        """
        if not isinstance(content_id, str):
            raise Exception(
                'Expected content_id to be a string, received %s' % content_id)
        if content_id not in self.translations_mapping:
            raise Exception(
                'The content_id %s does not exist.' % content_id)
        else:
            self.translations_mapping.pop(content_id, None)

    def get_all_html_content_strings(self):
        """Gets all html content strings used in the WrittenTranslations.

        Returns:
            list(str). The list of html content strings.
        """
        html_string_list = []
        for translations in self.translations_mapping.values():
            for written_translation in translations.values():
                if (written_translation.data_format ==
                        WrittenTranslation.DATA_FORMAT_HTML):
                    html_string_list.append(written_translation.translation)
        return html_string_list

    @staticmethod
    def convert_html_in_written_translations(
            written_translations_dict, conversion_fn):
        """Checks for HTML fields in the written translations and converts it
        according to the conversion function.

        Args:
            written_translations_dict: dict. The written translations dict.
            conversion_fn: function. The function to be used for converting the
                HTML.

        Returns:
            dict. The converted written translations dict.
        """
        for content_id, language_code_to_written_translation in (
                written_translations_dict['translations_mapping'].items()):
            for language_code in (
                    language_code_to_written_translation.keys()):
                translation_dict = written_translations_dict[
                    'translations_mapping'][content_id][language_code]
                if 'data_format' in translation_dict:
                    if (translation_dict['data_format'] ==
                            WrittenTranslation.DATA_FORMAT_HTML):
                        written_translations_dict['translations_mapping'][
                            content_id][language_code]['translation'] = (
                                conversion_fn(written_translations_dict[
                                    'translations_mapping'][content_id][
                                        language_code]['translation'])
                            )
                elif 'html' in translation_dict:
                    # TODO(#11950): Delete this once old schema migration
                    # functions are deleted.
                    # This "elif" branch is needed because, in states schema
                    # v33, this function is called but the dict is still in the
                    # old format (that doesn't have a "data_format" key).
                    written_translations_dict['translations_mapping'][
                        content_id][language_code]['html'] = (
                            conversion_fn(translation_dict['html']))

        return written_translations_dict
