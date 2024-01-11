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

"""Models for storing language accent codes for Oppia-supported voiceovers."""

from __future__ import annotations

from core import feconf
from core import utils
from core.platform import models

from typing import Dict, Optional, Sequence

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import base_models
    from mypy_imports import datastore_services

(base_models,) = models.Registry.import_models([
    models.Names.BASE_MODEL
])

datastore_services = models.Registry.import_datastore_services()


class VoiceoverPolicyModel(base_models.BaseModel):
    """
    Model for storing language accent codes for Oppia-supported voiceovers.
    """
    # A dict with language_code as the key and a nested dict as the value.
    # The nested dict contains language_accent_code as the key and a boolean
    # value indicating whether it's possible to generate automatic voiceovers
    # for this language-accent code.
    language_code_mapping = datastore_services.JsonProperty(required=True)

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
            'language_code_mapping': base_models.EXPORT_POLICY.NOT_APPLICABLE
        })

    @classmethod
    def get_model(cls) -> Optional[VoiceoverPolicyModel]:
        """Gets a VoiceoverPolicyModel instance. Since there will be only one
        model for storing language accent code, this method returns only
        one instance.

        Returns:
            VoiceoverPolicyModel|None. An instance of VoiceoverPolicyModel class.
        """
        voiceover_policy_model_list: Sequence[VoiceoverPolicyModel] = (
            cls.get_all().fetch())
        return (
            voiceover_policy_model_list[0]
            if len(voiceover_policy_model_list) > 0 else None)
