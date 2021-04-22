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

"""Validators for machine translation models."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.domain import base_model_validators
from core.domain import translation_fetchers
from core.platform import models
from core.platform.cloud_translate import cloud_translate_services

(base_models,) = models.Registry.import_models([
    models.NAMES.base_model
])


class MachineTranslationModelValidator(
        base_model_validators.BaseModelValidator):
    """Validates MachineTranslationModel."""

    @classmethod
    def _get_model_id_regex(cls, unused_item):
        language_codes_regex = '(%s)' % '|'.join(
            cloud_translate_services.LANGUAGE_CODE_ALLOWLIST)
        # Valid id: [source_language_code]:[target_language_code]:[hashed_text].
        regex_string = '^%s\\.%s\\..+$' % (
            language_codes_regex, language_codes_regex)
        return regex_string

    @classmethod
    def _get_model_domain_object_instance(cls, item):
        return translation_fetchers.get_translation_from_model(item)

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {}
