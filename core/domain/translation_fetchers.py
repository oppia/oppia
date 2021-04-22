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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.domain import translation_domain
from core.platform import models

(translation_models,) = models.Registry.import_models([
    models.NAMES.translation])


def get_translation_from_model(translation_model):
    """Returns a MachineTranslatedText object given a
    MachineTranslatedTextModel loaded from the datastore.

    Args:
        translation_model: MachineTranslatedTextModel. The
            MachineTranslatedTextModel loaded from the datastore.

    Returns:
        MachineTranslatedText. A MachineTranslatedText object corresponding to
        the given MachineTranslatedTextModel.
    """
    return translation_domain.MachineTranslatedText(
        translation_model.source_language_code,
        translation_model.target_language_code,
        translation_model.source_text,
        translation_model.translated_text)
