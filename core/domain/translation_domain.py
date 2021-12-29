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

from core import utils

from typing import Any, Dict, List, Union


TRANSLATABLE_CONTENT_FORMAT_HTML = 'html'
TRANSLATABLE_CONTENT_FORMAT_UNICODE_STRING = 'unicode'
TRANSLATABLE_CONTENT_FORMAT_SET_OF_NORMALIZED_STRING = (
    'set_of_normalized_string')
TRANSLATABLE_CONTENT_FORMAT_SET_OF_UNICODE_STRING = 'set_of_unicode_string'
TRANSLATABLE_CONTENT_FORMAT_OBJECT = 'object'


class BaseTranslatableObject:
    """Base class for all translatable objects."""

    # Private field to track translatable contents in a BaseTranslatableObject.
    _translatable_contents: Dict[str, TranslatableContent] = {}

    def _register_all_translatable_fields(
        self
    ) -> None:
        """Base class method to register all translatable fields.

        Raises:
            NotImplementedError. The derived child class must implement the
                necessary logic to register all translatable fields in an
                entity.

        """
        raise NotImplementedError

    def _register_translatable_field(
        self,
        field_type: str,
        content_id: str,
        value: str|List[str]
    ) -> None:
        """Base method to register a translatable field in an entity.

        Args:
            field_type: str. Translatable content type.
            content_id: str. Content id of translatable content.
            value: str|list(str). Value of the content which is translatable.
        """
        if content_id in self._translatable_contents:
            # NOTE: Is this expected.
            raise Exception('Already registered as a translatable content.')

        self._translatable_contents[content_id] = TranslatableContent(
            content_id, value, field_type)

    def _register_translatable_object(
        self,
        value: BaseTranslatableObject
    ) -> None:
        """Base method to register translatable field in a
        BaseTranslatableObject.

        Args:
            value: BaseTranslatableObject. A object representing
                BaseTranslatableObject.
        """
        self._translatable_contents.update(value.get_translatable_fields())

    def get_translatable_fields(
        self
    ) -> Dict[str, TranslatableContent]:
        """Base method to get all the translatable fields for an entity.

        Returns:
            Dict(str, TranslatableContent). Returns the dict containg content_id
            as key and TranslatableContent as value.
        """
        self._translatable_contents = {}
        self._register_all_translatable_fields()
        return self._translatable_contents

    def get_all_contents_which_needs_translations(
        self,
        entityTranslations: EntityTranslations
    ) -> List[TranslatableContent]:
        """Returns a list of TranslatableContents objects which needs
        translation or which needs updates to an existing translations.

        Args:
            entityTranslations: EntityTranslations. The entityTranslations
                object contains existing translations for an object.

        Returns:
            list(TranslatableContent). Returns the list of TranslatableContent.
        """

        contents_which_need_translation = []
        for translatable_item in self.get_translatable_fields().values():
            # translatable_item is of type TranslatableContent.
            if translatable_item.content == '':
                continue
            if (
                not translatable_item.content_id in
                entityTranslations.translations.keys()
            ):
                contents_which_need_translation.append(translatable_item)
            if (
                entityTranslations.translations[
                translatable_item.content_id].needs_update
            ):
                contents_which_need_translation.append(translatable_item)

        return contents_which_need_translation


class EntityTranslations:
    """The EntityTranslations presents an EntityTransaltionsModel for a given
    version of an entity in a given language.

    Args:
        entity_id: str. Entity id represents the unique id.
        entity_type: str. Entity type represents the type of the translated
            content.
        entity_version: str. This represents the version of the entity.
        language_code: str. This represents the language code for a given
            entity.
        translations: TranslatedContent. The translated content.
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
    """The TranslatablesConetnts represents the contents of an object which
    can be translated in multiple languages.

    Args:
        content_id: str. The content id which identifies uniquely a content.
        content: str|list(str). The content which can be translated.
        content_type: str. The type of the content.
    """

    def __init__(
        self,
        content_id: str,
        content: str|List[str],
        content_type: str
    ) -> None:
        self.content_id = content_id
        self.content = content
        self.type = content_type

    @classmethod
    def from_dict(
        cls,
        translatable_content_dict: Dict[str, Any]
    ) -> TranslatableContent:
        """Returns a TranslatableContent object from its dict representation.

        Args:
            translatable_content_dict: dict. Dict representation of
                TranslatableContent object.

        Returns:
            TranslatableContent. The TranslatableContent object.
        """
        try:
            return cls(
                translatable_content_dict['content_id'],
                translatable_content_dict['content'],
                translatable_content_dict['content_type'])
        except KeyError:
            raise utils.ValidationError(
                'Invalid translatable content key(s) present.')

    def to_dict(
        self
    ) -> Dict[str, Any]:
        """Returns the dict representation of TranslatableContent object.

        Returns:
            dict. The dict representation of TranslatableContent object.
        """
        return {
            'content_id': self.content_id,
            'content': self.content,
            'type': self.type
        }


class TranslatedContent:
    """This class represents the translated contents of TranslatableContent
    object.

    Args:
        content: str|list(str). The content which is translated.
        needs_update: bool. A boolean value which represents that whether any
            translation needs update or not.
    """

    def __init__(
        self,
        content: str|List[str],
        needs_update: bool
    ) -> None:
        self.content = content
        self.needs_update = needs_update

    @classmethod
    def from_dict(
        cls,
        translated_contents_dict: Dict[str, Any]
    ) -> TranslatedContent:
        """Returns a TranslatedContent object from its dict representation.

        Args:
            translated_contents_dict: dict. Dict representation of
                TranslatedContent object.

        Returns:
            TranslatedContent. The TranslatedContent object.
        """
        try:
            return cls(
                translated_contents_dict['content'],
                translated_contents_dict['needs_update'])
        except KeyError:
            raise utils.ValidationError(
                'Invalid translated content key(s) present.')

    def to_dict(
        self
    ) -> Dict[str, Any]:
        """Returns the dict representation of TranslatedContent object.

        Returns:
            dict. The dict representation of TranslatedContent object.
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
