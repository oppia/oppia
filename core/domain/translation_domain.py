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


class ContentType(enum.Enum):
    """Represents all possible content types in the State."""

    CONTENT = 'content'
    INTERACTION = 'interaction'
    DEFAULT_OUTCOME = 'default_outcome'
    CUSTOMIZATION_ARG = 'customization_arg'
    RULE = 'rule'
    FEEDBACK = 'feedback'
    HINT = 'hint'
    SOLUTION = 'solution'


class TranslatableContentFormat(enum.Enum):
    """Represents all possible data types for any translatable content."""

    HTML = 'html'
    UNICODE_STRING = 'unicode'
    SET_OF_NORMALIZED_STRING = 'set_of_normalized_string'
    SET_OF_UNICODE_STRING = 'set_of_unicode_string'

    @classmethod
    def is_data_format_list(cls, data_format: str) -> bool:
        """Checks whether the content of translation with given format is of
        a list type.
        Args:
            data_format: str. The format of the translation.
        Returns:
            bool. Whether the content of translation is a list.
        """
        return data_format in (
            cls.SET_OF_NORMALIZED_STRING.value,
            cls.SET_OF_UNICODE_STRING.value
        )


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
        content_type: ContentType,
        content_format: TranslatableContentFormat,
        content_value: feconf.ContentValueType,
        interaction_id: str = None,
        rule_type: str = None
    ) -> None:
        self.content_id = content_id
        self.content_type = content_type
        self.content_format = content_format
        self.content_value = content_value
        self.interaction_id = interaction_id
        self.rule_type = rule_type

    @classmethod
    def from_dict(
        cls,
        translatable_content_dict: TranslatableContentDict
    ) -> TranslatableContent:
        """Returns a TranslatableContent object from its dict representation.

        Args:
            translatable_content_dict: dict. The dict representation of
                TranslatableContent object.

        Returns:
            TranslatableContent. An instance of TranslatableContent class.
        """
        return cls(
            translatable_content_dict['content_id'],
            translatable_content_dict['content_type'],
            translatable_content_dict['content_format'],
            translatable_content_dict['content_value'],
            translatable_content_dict['interaction_id'],
            translatable_content_dict['rule_type'])

    def to_dict(self) -> TranslatableContentDict:
        """Returns the dict representation of TranslatableContent object.

        Returns:
            TranslatableContentDict. The dict representation of
            TranslatableContent.
        """
        return {
            'content_id': self.content_id,
            'content_type': self.content_type.value,
            'content_format': self.content_format.value,
            'content_value': self.content_value,
            'interaction_id': self.interaction_id,
            'rule_type': self.rule_type
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
        content_format: TranslatableContentFormat,
        needs_update: bool
    ) -> None:
        self.content_value = content_value
        self.content_format = content_format
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
            translated_content_dict['content_format'],
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
            'content_format': self.content_format,
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
        content_id: str,
        content_type: ContentType,
        content_format: TranslatableContentFormat,
        content_value: feconf.ContentValueType,
        interaction_id: str = None,
        rule_type: str = None
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
            TranslatableContent(
                content_id,
                content_type,
                content_format,
                content_value,
                interaction_id,
                rule_type)
        )

    def add_fields_from_translatable_object(
        self,
        translatable_object: BaseTranslatableObject,
        **kwargs
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
            translatable_object.get_translatable_contents_collection(**kwargs)
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

        content_id_to_translatable_content = {}

        for translatable_content in translatable_content_list:
            if translatable_content.content_value == '':
                continue

            if (
                translatable_content.content_id not in
                content_ids_for_translated_contents
            ):
                content_id_to_translatable_content[
                    translatable_content.content_id] = translatable_content
            elif (
                entity_translation.translations[
                translatable_content.content_id].needs_update
            ):
                content_id_to_translatable_content[
                    translatable_content.content_id] = translatable_content

        return content_id_to_translatable_content

    def are_translations_displayable(
        self,
        entity_translation: EntityTranslation
    ) -> bool:
        """Whether the given EntityTranslation in the given lanaguage is
        displayable.

        A language's translations are ready to be displayed if there are less
        than five missing or update-needed translations. In addition, all
        rule-related translations must be present.

        Args:
            entity_translation: EntityTranslation. An object storing the
                existing translations of an entity.

        Returns:
            list(TranslatableContent). Returns a list of TranslatableContent.
        """
        translations_needing_update = 0
        translations_missing = 0

        min_non_displayable_translation_count = (
            feconf.MIN_ALLOWED_MISSING_OR_UPDATE_NEEDED_WRITTEN_TRANSLATIONS)

        content_id_to_translatable_content = (
            self.get_translatable_contents_collection()
            .content_id_to_translatable_content)

        content_id_to_translated_content = entity_translation.translations

        translatable_content_count = len(
            content_id_to_translatable_content.keys())
        translated_content_count = len(
            content_id_to_translated_content.keys())
        translations_missing_count = (
            translatable_content_count - translated_content_count)
        if  translations_missing_count > (
                feconf.MIN_ALLOWED_MISSING_OR_UPDATE_NEEDED_WRITTEN_TRANSLATIONS
            ):
            return False

        translation_requires_updates_count = 0
        for translated_content in content_id_to_translated_content.values():
            if translated_content.needs_update:
                translation_requires_updates_count += 1

        if  translations_missing_count + translation_requires_updates_count > (
                feconf.MIN_ALLOWED_MISSING_OR_UPDATE_NEEDED_WRITTEN_TRANSLATIONS
            ):
            return False

        return True


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

    def to_dict(entity_translation):
        translations_dict = {}
        for content_id, translated_content in entity_translation.translations.items():
            translations_dict[content_id] = translated_content.to_dict()

        return {
            'entity_id': entity_translation.entity_id,
            'entity_type': entity_translation.entity_type,
            'entity_version': entity_translation.entity_version,
            'language_code': entity_translation.language_code,
            'translations': translations_dict
        }

    @classmethod
    def from_dict(cls, entity_translation_dict):
        translations_dict = entity_translation_dict["translations"]
        content_id_to_translated_content = {}
        for content_id, translated_content in translations_dict.items():
            content_id_to_translated_content[content_id] = (
                TranslatedContent.from_dict(translated_content))

        return cls(
            entity_translation_dict['entity_id'],
            feconf.TranslatableEntityType(
                entity_translation_dict['entity_type']),
            entity_translation_dict['entity_version'],
            entity_translation_dict['language_code'],
            content_id_to_translated_content
        )

    def validate(self):
        """TODO
        """
        if not isinstance(self.entity_type, str):
            raise utils.ValidationError(
                'entity_type must be a string, but got %r' % self.entity_type)
        if not isinstance(self.entity_id, str):
            raise utils.ValidationError(
                'entity_id must be a string, but got %r' % self.entity_id)
        if not isinstance(self.entity_version, int):
            raise utils.ValidationError(
                'entity_version must be a string, but got %r' %
                self.entity_version)
        if not isinstance(self.language_code, str):
            raise utils.ValidationError(
                'language_code must be a string, but got %r' %
                self.language_code)

        for content_id, translated_content in self.translations.items():
            if not isinstance(content_id, str):
                raise utils.ValidationError(
                    'content_id must be a string, but got %r' % content_id)
            if not isinstance(translated_content.needs_update, bool):
                raise utils.ValidationError(
                    'needs_update must be a bool, but got %r' %
                    translated_content.needs_update)
            if isinstance(translated_content.content_value, list):
                for content_value in translated_content.content_value:
                    if not isinstance(translated_content.content_value, str):
                        raise utils.ValidationError(
                            'content_value must be a string, but got %r' %
                            content_value)
            else:
                if not isinstance(translated_content.content_value, str):
                    raise utils.ValidationError(
                        'content_value must be a string, but got %r' %
                        content_value)

    def add_translation(
        content_id: str,
        content_value: feconf.ContentValueType,
        content_format: TranslatableContentFormat,
        needs_update: boolean):
        """Adds new TranslatedContent in the object."""
        self.translations[content_id] = TranslatedContent(
            content_value, content_format, needs_update)


    @classmethod
    def create_empty(
            cls, entity_type, entity_id, language_code, entity_version=0):
        return cls(
            entity_id=entity_id,
            entity_type=entity_type,
            entity_version=0,
            language_code=language_code,
            translations={}
        )


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


# WrittenTrasnlation and WrittenTranslations class is still used in topic and
# subtopic entity and will be removed from here as well once Topic and subtopic
# will also support translation feature.


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


class ContentIdGenerator:
    """Class to generate the content-id for a translatable content based on the
    next_content_id_index variable.
    """
    def __init__(self, start_index: int = 0) -> None:
        """Constructs an ContentIdGenerator object."""
        self.next_content_id_index = start_index

    def generate(self, content_type: ContentType, extra_prefix='') -> str:
        """Generates the new content-id from the next content id."""
        content_id = content_type.value + '_'
        if extra_prefix:
            content_id += extra_prefix + '_'
        content_id += str(self.next_content_id_index)

        self.next_content_id_index += 1
        return content_id
