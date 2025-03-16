# coding: utf-8
#
# Copyright 2025 The Oppia Authors. All Rights Reserved.
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

"""Models for translation count debug information."""

from __future__ import annotations

from core.platform import models

from typing import Dict, Optional, Sequence

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import base_models
    from mypy_imports import datastore_services

(base_models,) = models.Registry.import_models([models.Names.BASE_MODEL])

datastore_services = models.Registry.import_datastore_services()


class TranslationCountDebugTrackerModel(base_models.BaseModel):
    """Storage model for recording changes to translation counts.

    The ID of each instance is <exploration_id>.<language_code>.
    """

    exp_id = datastore_services.StringProperty(required=True, indexed=True)
    language_code = datastore_services.StringProperty(
        required=True, indexed=True)
    events = datastore_services.JsonProperty(default={}, indexed=False)

    @staticmethod
    def get_deletion_policy() -> base_models.DELETION_POLICY:
        """Model doesn't contain any data directly corresponding to a user."""
        return base_models.DELETION_POLICY.NOT_APPLICABLE

    @staticmethod
    def get_model_association_to_user(
    ) -> base_models.MODEL_ASSOCIATION_TO_USER:
        """Model does not contain user data."""
        return base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER

    @classmethod
    def get_export_policy(cls) -> Dict[str, base_models.EXPORT_POLICY]:
        """Model doesn't contain any data directly corresponding to a user."""
        return dict(super(cls, cls).get_export_policy(), **{
            'exp_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'language_code': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'events': base_models.EXPORT_POLICY.NOT_APPLICABLE
        })

    @classmethod
    def get_by_exp_id_and_langauge_code(
        cls, exp_id: str, language_code: str
    ) -> Optional[TranslationCountDebugTrackerModel]:
        """Gets the model instance for the given exploration and language code.

        Args:
            exp_id: str. The exploration ID.
            language_code: str. The language code.

        Returns:
            TranslationCountDebugTrackerModel|None. The model instance, if it
            exists, else None.
        """
        return cls.get_by_id(f'{exp_id}.{language_code}')

    @classmethod
    def get_multi_by_exp_id(
        cls, exp_id: str
    ) -> Sequence[TranslationCountDebugTrackerModel]:
        """Gets all the model instances for the given exploration ID.

        Args:
            exp_id: str. The exploration ID.

        Returns:
            list(TranslationCountDebugTrackerModel). The model instances.
        """
        debug_models: Sequence[
            TranslationCountDebugTrackerModel] = cls.get_all().filter(
                cls.exp_id == exp_id).fetch()
        return debug_models

    @classmethod
    def get_multi_by_language_code(
        cls, language_code: str
    ) -> Sequence[TranslationCountDebugTrackerModel]:
        """Gets all the model instances for the given language code.

        Args:
            language_code: str. The language code.

        Returns:
            list(TranslationCountDebugTrackerModel). The model instances.
        """
        debug_models: Sequence[
            TranslationCountDebugTrackerModel] = cls.get_all().filter(
                cls.language_code == language_code).fetch()
        return debug_models
