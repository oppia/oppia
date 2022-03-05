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

from typing import Dict, List
from typing_extensions import TypedDict


class TranslatableContentFormat(enum.Enum):
    """Represents all possible data types for any translatable content."""

    HTML = 'html'
    UNICODE_STRING = 'unicode'
    SET_OF_NORMALIZED_STRING = 'set_of_normalized_string'
    SET_OF_UNICODE_STRING = 'set_of_unicode_string'


class TranslatableContentDict(TypedDict):
    """Dictionary representing TranslatableContent object."""

    content_id: str
    content: feconf.ContentInTranslatableContent
    content_type: TranslatableContentFormat


class TranslatableContentsCollection:
    """A class to collect all TranslatableContents from a translatable object
    and maps with their corresponding content-ids.
    """

    def __init__(self) -> None:
        """Constructs a TranslatableContentsCollection object."""
        self.translatable_contents: Dict[str, TranslatableContent] = {}

    def add_translatable_field(
        self,
        field_type: TranslatableContentFormat,
        content_id: str,
        value: feconf.ContentInTranslatableContent
    ) -> None:
        """Adds translatable field parameter to translatable_contents dict.

        Args:
            field_type: TranslatableContentFormat. The type of the
                corresponding translatable content.
            content_id: str. The id of the corresponding translatable content.
            value: ContentInTranslatableContent. Value of the content which is
                translatable.
        """
        self.translatable_contents[content_id] = TranslatableContent(
            content_id, value, field_type)

    def add_translatable_object(
        self,
        value: BaseTranslatableObject
    ) -> None:
        """Adds translatable fields of a translatable object parameter to
        translatable_contents dict.

        Args:
            value: BaseTranslatableObject. An object representing
                BaseTranslatableObject.
        """
        self.translatable_contents.update(
            value.get_translatable_contents_collection().translatable_contents)


class BaseTranslatableObject:
    """Base class for all translatable objects which contain translatable
    fields/objects. For example, a State is a translatable object in
    Exploration, a Hint is a translatable object in State, and a hint_content
    is a translatable field in Hint. So Exploration, State, and Hint all should
    be the child class of BaseTranslatableObject.
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
        contents_which_need_translation = []
        content_ids_for_translated_contents = (
            entity_translation.translations.keys())
        translatable_content_list = (
            self.get_translatable_contents_collection()
            .translatable_contents.values())

        for translatable_content in translatable_content_list:
            if translatable_content.content == '':
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
    """The EntityTranslation represents an EntityTranslationsModel for a given
    version of an entity in a given language.

    Args:
        entity_id: str. The id of the corresponding entity.
        entity_type: TranslatableEntityType. The type
            of the corresponding entity.
        entity_version: str. The version of the corresponding entity.
        language_code: str. The language code for the corresponding entity.
        translations: dict(str, TranslatedContent). The translated content.
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

    @classmethod
    def create_empty_translation_object(cls):
        return cls(
            empty_entity_id='',
            empty_entity_type='',
            initial_entity_version=0,
            empty_language_code='',
            translations={
                '': TranslatedContent.from_dict(
                    'content':'',
                    'needs_update': False
                )
            }
        )


class TranslatableContent:
    """TranslatableContent represents a content of a translatable object which
    can be translated into multiple languages.

    Args:
        content_id: str. The id of the corresponding content.
        content: ContentInTranslatableContent. The content which can be
            translated.
        content_type: TranslatableContentFormat. The type of the
            corresponding content.
    """

    def __init__(
        self,
        content_id: str,
        content: feconf.ContentInTranslatableContent,
        content_type: TranslatableContentFormat
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
        content: ContentInTranslatableContent. Represents already-translated
            content of TranslatableContent object.
        needs_update: bool. A boolean value represents whether any translation
            needs an update or not.
    """

    def __init__(
        self,
        content: feconf.ContentInTranslatableContent,
        needs_update: bool
    ) -> None:
        self.content = content
        self.needs_update = needs_update

    @classmethod
    def from_dict(
        cls,
        translated_contents_dict: feconf.TranslatedContentDict
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

    def to_dict(self) -> feconf.TranslatedContentDict:
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
