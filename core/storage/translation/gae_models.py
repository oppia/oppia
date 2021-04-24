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

"""Models for machine translation."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.platform import models
import utils

(base_models,) = models.Registry.import_models(
    [models.NAMES.base_model])

datastore_services = models.Registry.import_datastore_services()


class MachineTranslationModel(base_models.BaseModel):
    """Model for storing machine generated translations for the purpose of
    preventing duplicate generation. Machine translations are used for reference
    purpose only and therefore are context agnostic. Model instances are mapped
    by a deterministic key generated from the source and target language codes,
    followed by a SHA-1 hash of the untranslated source text formated as
    follows:

        [source_language_code].[target_language_code].[hashed_source_text]

    See MachineTranslationModel._generate_id() below for details.
    The same origin text, source_language_code, and target_language_code always
    maps to the same key and therefore always returns the same translated_text.
    """

    # The untranslated source text.
    source_text = datastore_services.TextProperty(required=True, indexed=False)
    # A SHA-1 hash of the source text. This can be used to index the datastore
    # by source text.
    hashed_source_text = datastore_services.StringProperty(
        required=True, indexed=True)
    # The language code for the source text language. Must be different from
    # target_language_code.
    source_language_code = datastore_services.StringProperty(
        required=True, indexed=True)
    # The language code for the target translation language. Must be different
    # from source_language_code.
    target_language_code = datastore_services.StringProperty(
        required=True, indexed=True)
    # The machine generated translation of the source text into the target
    # language.
    translated_text = datastore_services.TextProperty(
        required=True, indexed=False)

    @classmethod
    def create(
            cls, source_language_code, target_language_code, source_text,
            translated_text):
        """Creates a new MachineTranslationModel instance and returns its ID.

        Args:
            source_language_code: str. The language code for the source text
                language. Must be different from target_language_code.
            target_language_code: str. The language code for the target
                translation language. Must be different from
                source_language_code.
            source_text: str. The untranslated source text.
            translated_text: str. The machine generated translation of the
                source text into the target language.

        Returns:
            str|None. The id of the newly created
            MachineTranslationModel instance, or None if the inputs are
            invalid.
        """
        if source_language_code is target_language_code:
            return None
        # SHA-1 always produces a 40 digit hash. 50 is chosen here to prevent
        # convert_to_hash from truncating the hash.
        hashed_source_text = utils.convert_to_hash(source_text, 50)
        entity_id = cls._generate_id(
            source_language_code, target_language_code, hashed_source_text)
        translation_entity = cls(
            id=entity_id,
            hashed_source_text=hashed_source_text,
            source_language_code=source_language_code,
            target_language_code=target_language_code,
            source_text=source_text,
            translated_text=translated_text)
        translation_entity.put()
        return entity_id

    @staticmethod
    def _generate_id(
            source_language_code, target_language_code, hashed_source_text):
        """Generates a valid, deterministic key for a MachineTranslationModel
        instance.

        Args:
            source_language_code: str. The language code for the source text
                language. Must be different from target_language_code.
            target_language_code: str. The language code for the target
                translation language. Must be different from
                source_language_code.
            hashed_source_text: str. An SHA-1 hash of the untranslated source
                text.

        Returns:
            str. The deterministically generated identifier for this entity of
            the form:

            [source_language_code].[target_language_code].[hashed_source_text]
        """
        return (
            '%s.%s.%s' % (
                source_language_code, target_language_code, hashed_source_text)
        )

    @classmethod
    def get_machine_translation(
            cls, source_language_code, target_language_code, source_text):
        """Gets MachineTranslationModel by language codes and source text.

        Args:
            source_language_code: str. The language code for the source text
                language. Must be different from target_language_code.
            target_language_code: str. The language code for the target
                translation language. Must be different from
                source_language_code.
            source_text: str. The untranslated source text.

        Returns:
            MachineTranslationModel|None. The MachineTranslationModel
            instance corresponding to the given inputs, if such a translation
            exists, or None if no translation is found.
        """
        hashed_source_text = utils.convert_to_hash(source_text, 50)
        instance_id = cls._generate_id(
            source_language_code, target_language_code, hashed_source_text)
        return cls.get(instance_id, strict=False)

    @staticmethod
    def get_deletion_policy():
        """Model is not associated with users."""
        return base_models.DELETION_POLICY.NOT_APPLICABLE

    @staticmethod
    def get_model_association_to_user():
        """Model is not associated with users."""
        return base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER

    @classmethod
    def get_export_policy(cls):
        """Model is not associated with users."""
        return dict(super(cls, cls).get_export_policy(), **{
            'source_text': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'hashed_source_text': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'source_language_code': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'target_language_code': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'translated_text': base_models.EXPORT_POLICY.NOT_APPLICABLE
        })
