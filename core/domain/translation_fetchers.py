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

"""Functions for converting translation models into domain objects."""

from __future__ import annotations

from core import feconf
from core.domain import translation_domain
from core.platform import models

from typing import List, Optional

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import translation_models


(translation_models,) = models.Registry.import_models([
    models.Names.TRANSLATION])


def get_translation_from_model(
    translation_model: translation_models.MachineTranslationModel
) -> translation_domain.MachineTranslation:
    """Returns a MachineTranslation object given a
    MachineTranslationModel loaded from the datastore.

    Args:
        translation_model: MachineTranslationModel. The
            MachineTranslationModel loaded from the datastore.

    Returns:
        MachineTranslation. A MachineTranslation object corresponding to
        the given MachineTranslationModel.
    """
    return translation_domain.MachineTranslation(
        translation_model.source_language_code,
        translation_model.target_language_code,
        translation_model.source_text,
        translation_model.translated_text)


def get_machine_translation(
    source_language_code: str,
    target_language_code: str,
    source_text: str
) -> Optional[translation_domain.MachineTranslation]:
    """Gets MachineTranslation by language codes and source text.
    Returns None if no translation exists for the given parameters.

    Args:
        source_language_code: str. The language code for the source text
            language. Must be different from target_language_code.
        target_language_code: str. The language code for the target translation
            language. Must be different from source_language_code.
        source_text: str. The untranslated source text.

    Returns:
        MachineTranslation|None. The MachineTranslation
        if a translation exists or None if no translation is found.
    """
    translation_model = (
        translation_models.MachineTranslationModel.get_machine_translation(
            source_language_code, target_language_code, source_text
        )
    )
    if translation_model is None:
        return None
    return get_translation_from_model(translation_model)


def _get_entity_translation_from_model(
    entity_translation_model: translation_models.EntityTranslationsModel
) -> translation_domain.EntityTranslation:
    """Returns the EntityTranslation domain object from its model representation
    (EntityTranslationsModel).

    Args:
        entity_translation_model: EntityTranslatioModel. An instance of
            EntityTranslationsModel.

    Returns:
        EntityTranslation. An instance of EntityTranslation object, created from
        its model.
    """
    entity_translation = translation_domain.EntityTranslation.from_dict({
        'entity_id': entity_translation_model.entity_id,
        'entity_type': entity_translation_model.entity_type,
        'entity_version': entity_translation_model.entity_version,
        'language_code': entity_translation_model.language_code,
        'translations': entity_translation_model.translations
    })
    return entity_translation


def get_all_entity_translations_for_entity(
    entity_type: feconf.TranslatableEntityType,
    entity_id: str,
    entity_version: int
) -> List[translation_domain.EntityTranslation]:
    """Returns a list of entity translation domain objects.

    Args:
        entity_type: TranslatableEntityType. The type of the entity whose
            translations are to be fetched.
        entity_id: str. The ID of the entity whose translations are to be
            fetched.
        entity_version: int. The version of the entity whose translations
            are to be fetched.

    Returns:
        list(EnitityTranslation). A list of EntityTranslation domain objects.
    """
    entity_translation_models = (
        translation_models.EntityTranslationsModel.get_all_for_entity(
            entity_type, entity_id, entity_version)
    )
    entity_translation_objects = []
    for model in entity_translation_models:
        domain_object = _get_entity_translation_from_model(model)
        entity_translation_objects.append(domain_object)

    return entity_translation_objects


def get_entity_translation(
    entity_type: feconf.TranslatableEntityType,
    entity_id: str,
    entity_version: int,
    language_code: str
) -> translation_domain.EntityTranslation:
    """Returns a unique entity translation domain object.

    Args:
        entity_type: TranslatableEntityType. The type of the entity.
        entity_id: str. The ID of the entity.
        entity_version: int. The version of the entity.
        language_code: str. The language code for the entity.

    Returns:
        EntityTranslation. An instance of entity translations.
    """
    entity_translation_model = (
        translation_models.EntityTranslationsModel.get_model(
            entity_type, entity_id, entity_version, language_code)
    )

    if entity_translation_model:
        domain_object = _get_entity_translation_from_model(
            entity_translation_model)
        return domain_object
    return translation_domain.EntityTranslation.create_empty(
        entity_type, entity_id, language_code, entity_version=entity_version
    )
