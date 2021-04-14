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


class MachineTranslatedTextModel(base_models.BaseModel):
    """Model for storing machine translations. Model instances have a key
    generated from the source and target language codes, followed by a sha-1
    hash of the origin text formated as follows:
        '[source_language_code]:[target_language_code]:[hashed_text]'
    See MachineTranslatedTextModel._generate_id() below for details."""

    # The untranslated text.
    origin_text = datastore_services.TextProperty(required=True, indexed=False)
    # The language code of the untranslated text.
    source_language_code = datastore_services.StringProperty(
        required=True, indexed=True)
    # The language code of the translation.
    target_language_code = datastore_services.StringProperty(
        required=True, indexed=True)
    # The translation.
    translated_text = datastore_services.TextProperty(
        required=True, indexed=False)

    @classmethod
    def create(
            cls, source_language_code, target_language_code, origin_text,
            translated_text):
        """Creates a new MachineTranslatedTextModel instance and returns its
        ID.

        Args:
            source_language_code: str. The language code of the untranslated
                text.
            target_language_code: str. The language code of the translation.
            origin_text: str. The untranslated text.
            translated_text: str. The translation.

        Returns:
            MachineTranslatedTextModel. The newly created
            MachineTranslatedTextModel instance.
        """

        entity_id = cls._generate_id(
            source_language_code, target_language_code, origin_text)
        translation_entity = cls(
            id=entity_id,
            source_language_code=source_language_code,
            target_language_code=target_language_code,
            origin_text=origin_text,
            translated_text=translated_text)
        translation_entity.put()
        return entity_id

    @classmethod
    def _generate_id(
            cls, source_language_code, target_language_code, origin_text):
        """Generates a key for the instance of MachineTranslatedTextModel
        class in the required format with the arguments provided.

        Args:
            source_language_code: str. The language code of the untranslated
                text.
            target_language_code: str. The language code of the translation.
            origin_text: str. The untranslated text.

        Returns:
            str. The generated ID for this entity of the form
            '[source_language_code]:[target_language_code]:[hashed_text]'.
        """
        # max_length is 450, less than maximum key length (500) to allow room
        # for language_codes.
        hashed_text = utils.convert_to_hash(origin_text, 50)
        return (
            '%s:%s:%s' % (
                source_language_code, target_language_code, hashed_text)
        )

    @classmethod
    def get_translation_for_text(
            cls, source_language_code, target_language_code, origin_text):
        """Gets MachineTranslatedTextModel by language codes and origin text.
        Returns None if no translation exists for the given parameters.

        Args:
            source_language_code: str. The language of the origin_text.
            target_language_code: str. The language being translated to.
            origin_text: str. The text to be translated.

        Returns:
            MachineTranslatedTextModel|None. The MachineTranslatedTextModel
            if a translation exists or None if no translation is found.
        """
        instance_id = cls._generate_id(
            source_language_code, target_language_code, origin_text)
        return cls.get(instance_id)

    @staticmethod
    def get_deletion_policy():
        """Model doesn't contain any data directly corresponding to a user."""
        return base_models.DELETION_POLICY.NOT_APPLICABLE

    @staticmethod
    def get_model_association_to_user():
        """Model does not contain user data."""
        return base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER

    @classmethod
    def get_export_policy(cls):
        """Model doesn't contain any data directly corresponding to a user."""
        return dict(super(cls, cls).get_export_policy(), **{
            'hashed_text': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'source_language_code': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'target_language_code': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'translated_text': base_models.EXPORT_POLICY.NOT_APPLICABLE
        })
