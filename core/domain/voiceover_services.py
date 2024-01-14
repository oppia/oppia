# coding: utf-8
#
# Copyright 2024 The Oppia Authors. All Rights Reserved.
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

"""Functions for retrieving voiceovers."""

from __future__ import annotations

from core import feconf
from core.domain import state_domain
from core.domain import voiceover_domain
from core.platform import models

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import voiceover_models

(voiceover_models,) = models.Registry.import_models([
    models.Names.VOICEOVER])


def _get_entity_voiceover_from_model(
    entity_voiceover_model: voiceover_models.EntityVoiceoverModel
) -> voiceover_domain.EntityVoiceover:
    """Returns the EntityVoiceover domain object from its model representation
    (EntityVoiceoverModel).

    Args:
        entity_voiceover_model: EntityVoiceoverModel. An instance of
            EntityVoiceoverModel.

    Returns:
        EntityVoiceover. An instance of EntityVoiceover object, created from
        its model.
    """
    content_id_to_voiceovers_dict = {}
    for content_id, voiceover_type_to_voiceover in (
            entity_voiceover_model.voiceovers.items()):
        content_id_to_voiceovers_dict[content_id] = {
            feconf.VoiceoverType.MANUAL: state_domain.Voiceover.from_dict(
                voiceover_type_to_voiceover[feconf.VoiceoverType.MANUAL.value]),
            feconf.VoiceoverType.AUTO: state_domain.Voiceover.from_dict(
                voiceover_type_to_voiceover[feconf.VoiceoverType.AUTO.value])
        }

    entity_voiceover = voiceover_domain.EntityVoiceover(
        entity_id=entity_voiceover_model.entity_id,
        entity_type=entity_voiceover_model.entity_type,
        entity_version=entity_voiceover_model.entity_version,
        language_accent_code=entity_voiceover_model.language_accent_code,
        voiceovers=content_id_to_voiceovers_dict
    )
    return entity_voiceover


def get_voiceovers_for_given_language_accent_code(
    entity_type: str,
    entity_id: str,
    entity_version: int,
    language_accent_code: str
) -> voiceover_domain.EntityVoiceover:
    """Returns a unique entity voiceover domain object.

    Args:
        entity_type: str. The type of the entity.
        entity_id: str. The ID of the entity.
        entity_version: int. The version of the entity.
        language_accent_code: str. The language accent code of the voiceover.

    Returns:
        EntityVoiceover. An instance of entity voiceover.
    """
    entity_voiceover_model = (
        voiceover_models.EntityVoiceoverModel.get_model(
            entity_type, entity_id, entity_version, language_accent_code))

    if entity_voiceover_model:
        domain_object = _get_entity_voiceover_from_model(entity_voiceover_model)
        return domain_object
    return voiceover_domain.EntityVoiceover.create_empty(
        entity_type=entity_type,
        entity_id=entity_id,
        entity_version=entity_version,
        language_accent_code=language_accent_code)
