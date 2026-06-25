# coding: utf-8
#
# Copyright 2026 The Oppia Authors. All Rights Reserved.
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

"""Abstract base class defining the translation platform interface."""

from __future__ import annotations

import abc


class BaseTranslationService(metaclass=abc.ABCMeta):
    """Abstract base class defining the strict contract for all machine
    translation providers.
    """

    @abc.abstractmethod
    def generate_translation(
        self,
        source_language_code: str,
        target_language_code: str,
        source_text: str,
    ) -> str:
        """Generates a machine translation suggestion for the given text.

        Args:
            source_language_code: str. ISO 639-1 language code of source text.
            target_language_code: str. ISO 639-1 language code for translation.
            source_text: str. The HTML fragment or string to translate.

        Raises:
            Exception. If the translation provider fails to process the request.
            NotImplementedError. The method is not implemented in the base class.
        """
        raise NotImplementedError()  # pragma: no cover
