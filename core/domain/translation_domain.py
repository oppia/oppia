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

import enum

from core import feconf
from core import utils

from typing import Dict, List, TypedDict


class TranslatableContentFormat(enum.Enum):
    """Represents all possible data types for any translatable content."""

    HTML = 'html'
    UNICODE_STRING = 'unicode'
    SET_OF_NORMALIZED_STRING = 'set_of_normalized_string'
    SET_OF_UNICODE_STRING = 'set_of_unicode_string'


class TranslatableContentDict(TypedDict):
    """Dictionary representing TranslatableContent object."""

    content_id: str
    content_value: feconf.ContentValueType
    content_type: TranslatableContentFormat


class TranslatableContent:
    """TranslatableContent represents a content of a translatable object which
    can be translated into multiple languages.

    Args:
        content_id: str. The id of the corresponding translatable content value.
        content_value: ContentValueType. The content value which can be
            translated.
        content_type: TranslatableContentFormat. The type of the
            corresponding content value.
    """

    def __init__(
        self,
        content_id: str,
        content_value: feconf.ContentValueType,
        content_type: TranslatableContentFormat
    ) -> None:
        self.content_id = content_id
        self.content_value = content_value
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
            TranslatableContent. An instance of TranslatableContent class.
        """
        return cls(
            translatable_content_dict['content_id'],
            translatable_content_dict['content_value'],
            translatable_content_dict['content_type'])

    def to_dict(self) -> TranslatableContentDict:
        """Returns the dict representation of TranslatableContent object.

        Returns:
            TranslatableContentDict. A dict, mapping content_id, content_value
            and content_type of a TranslatableContent instance to
            corresponding keys 'content_id', 'content_value' and
            'content_type'.
        """
        return {
            'content_id': self.content_id,
            'content_value': self.content_value,
            'content_type': self.content_type
        }


class TranslatedContent:
    """Class representing a translation of translatable content. For example,
    if translatable content 'A' is translated into 'B' in a language other than
    English, then 'B' is a TranslatedContent instance that represents this
    class.
    A (TranslatableContent) -----(translation)-----> B (TranslatedContent).

    Args:
        content_value: ContentValueType. Represents translation of translatable
            content.
        needs_update: bool. Whether the translation needs an update or not.
    """

    def __init__(
        self,
        content_value: feconf.ContentValueType,
        needs_update: bool
    ) -> None:
        self.content_value = content_value
        self.needs_update = needs_update

    @classmethod
    def from_dict(
        cls,
        translated_content_dict: feconf.TranslatedContentDict
    ) -> TranslatedContent:
        """Returns a TranslatedContent object from its dict representation.

        Args:
            translated_content_dict: TranslatedContentDict. Dict representation
                of TranslatedContent object.

        Returns:
            TranslatedContent. An instance of TranslatedContent class.
        """
        return cls(
            translated_content_dict['content_value'],
            translated_content_dict['needs_update'])

    def to_dict(self) -> feconf.TranslatedContentDict:
        """Returns the dict representation of TranslatedContent object.

        Returns:
            TranslatedContentDict. A dict, mapping content_value and
            needs_update of a TranslatableContent instance to
            corresponding keys 'content_value' and 'needs_update'.
        """
        return {
            'content_value': self.content_value,
            'needs_update': self.needs_update
        }


class TranslatableContentsCollection:
    """A class to collect all TranslatableContents from a translatable object
    and map them with their corresponding content-ids.
    """

    content_id_to_translatable_content: Dict[str, TranslatableContent]

    def __init__(self) -> None:
        """Constructs a TranslatableContentsCollection object."""
        self.content_id_to_translatable_content = {}

    def add_translatable_field(
        self,
        field_type: TranslatableContentFormat,
        content_id: str,
        content_value: feconf.ContentValueType
    ) -> None:
        """Adds translatable field parameter to
        'content_id_to_translatable_content' dict.

        Args:
            field_type: TranslatableContentFormat. The type of the
                corresponding translatable content.
            content_id: str. The id of the corresponding translatable content.
            content_value: ContentValueType. Value of the content which
                is translatable.

        Raises:
            Exception. The content_id_to_translatable_content dict already
                contains the content_id.
        """
        if content_id in self.content_id_to_translatable_content:
            raise Exception(
                'Content_id %s already exists in the '
                'TranslatableContentsCollection.' % content_id)

        self.content_id_to_translatable_content[content_id] = (
            TranslatableContent(content_id, content_value, field_type))

    def add_fields_from_translatable_object(
        self,
        translatable_object: BaseTranslatableObject
    ) -> None:
        """Adds translatable fields from a translatable object parameter to
        'content_id_to_translatable_content' dict.

        NOTE: The functions take the entire translatable object as a param, as
        the process to fetch translatable collections from different objects
        are the same, and keeping this logic in one place will help avoid
        duplicate patterns in the callsite. It will also help the callsite
        look cleaner.

        Args:
            translatable_object: BaseTranslatableObject. An instance of
                BaseTranslatableObject class.
        """
        self.content_id_to_translatable_content.update(
            translatable_object.get_translatable_contents_collection()
            .content_id_to_translatable_content)


class BaseTranslatableObject:
    """Base class for all translatable objects which contain translatable
    fields/objects. For example, a State is a translatable object in
    Exploration, a Hint is a translatable object in State, and a hint_content
    is a translatable field in Hint. So Exploration, State, and Hint all should
    be child classes of BaseTranslatableObject.
    """

    def get_translatable_contents_collection(
        self
    ) -> TranslatableContentsCollection:
        """Get all translatable fields in a translatable object.

        Raises:
            NotImplementedError. The derived child class must implement the
                necessary logic to get all translatable fields in a
                translatable object.
        """
        raise NotImplementedError('Must be implemented in subclasses.')

    def get_all_contents_which_need_translations(
        self,
        entity_translation: EntityTranslation
    ) -> List[TranslatableContent]:
        """Returns a list of TranslatableContent instances which need new or
        updated translations.

        Args:
            entity_translation: EntityTranslation. An object storing the
                existing translations of an entity.

        Returns:
            list(TranslatableContent). Returns a list of TranslatableContent.
        """
        translatable_content_list = (
            self.get_translatable_contents_collection()
            .content_id_to_translatable_content.values())
        content_ids_for_translated_contents = (
            entity_translation.translations.keys())
        contents_which_need_translation = []

        for translatable_content in translatable_content_list:
            if translatable_content.content_value == '':
                continue

            if (
                translatable_content.content_id not in
                content_ids_for_translated_contents
            ):
                contents_which_need_translation.append(translatable_content)
            elif (
                entity_translation.translations[
                translatable_content.content_id].needs_update
            ):
                contents_which_need_translation.append(translatable_content)

        return contents_which_need_translation


class EntityTranslation:
    """A domain object to store all translations for a given versioned-entity
    in a given language.

    NOTE: This domain object corresponds to EntityTranslationsModel in the
    storage layer.

    Args:
        entity_id: str. The id of the corresponding entity.
        entity_type: TranslatableEntityType. The type
            of the corresponding entity.
        entity_version: str. The version of the corresponding entity.
        language_code: str. The language code for the corresponding entity.
        translations: dict(str, TranslatedContent). A dict representing
            content-id as keys and TranslatedContent instance as values.
    """

    def __init__(
        self,
        entity_id: str,
        entity_type: feconf.TranslatableEntityType,
        entity_version: int,
        language_code: str,
        translations: Dict[str, TranslatedContent]
    ):
        self.entity_id = entity_id
        self.entity_type = entity_type.value
        self.entity_version = entity_version
        self.language_code = language_code
        self.translations = translations


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
