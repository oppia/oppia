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
import python_utils

(base_models, user_models) = models.Registry.import_models([
    models.NAMES.base_model, models.NAMES.user])

datastore_services = models.Registry.import_datastore_services()

class MachineTranslatedTextModel(base_models.BaseModel):
  """Model for storing machine translations"""
  # The sha1 hash of the untranslated text.
  hashed_text = datastore_services.StringProperty(required=True, indexed=True)
  # The language of the untranslated text.
  source_language_code = datastore_services.StringProperty(required=True,
    indexed=True)
  # The language of the translation.
  target_language_code = datastore_services.StringProperty(required=True,
    indexed=True)
  # The translated text.
  translated_text = datastore_services.StringProperty(required=True,
    indexed=False)

  @property
  def id(self):
    """A unique id for this model instance."""
    return f'{self.source_language_code}|{self.target_language_code}|{self.hashed_text}'

  @staticmethod
  def get_translation_for_text(cls, source_language_code, target_language_code,
    origin_text):
    """Gets MachineTranslatedTextModel by language codes and origin text.
    Returns None if no translation exists for the given parameters.

    Args:
        source_language_code: str. The language of the origin_text.
        target_language_code: str. The language being translated to.
        origin_text: str. The text to be translated

    Returns:
        MachineTranslatedTextModel|None. The MachineTranslatedTextModel if a
        translation exists or None if no translation is found.
    """
    hashed_text = utils.convert_to_hash(origin_text)
    id_ = f'{source_language_code}|{target_language_code}|{hashed_text}'
    return MachineTranslatedTextModel.get(id_)



