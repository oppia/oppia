# -*- coding: utf-8 -*-
# Copyright 2025 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#
from google.cloud.translate_v3beta1 import gapic_version as package_version

__version__ = package_version.__version__


from .services.translation_service import (
    TranslationServiceAsyncClient,
    TranslationServiceClient,
)
from .types.translation_service import (
    BatchDocumentInputConfig,
    BatchDocumentOutputConfig,
    BatchTranslateDocumentMetadata,
    BatchTranslateDocumentRequest,
    BatchTranslateDocumentResponse,
    BatchTranslateMetadata,
    BatchTranslateResponse,
    BatchTranslateTextRequest,
    CreateGlossaryMetadata,
    CreateGlossaryRequest,
    DeleteGlossaryMetadata,
    DeleteGlossaryRequest,
    DeleteGlossaryResponse,
    DetectedLanguage,
    DetectLanguageRequest,
    DetectLanguageResponse,
    DocumentInputConfig,
    DocumentOutputConfig,
    DocumentTranslation,
    GcsDestination,
    GcsSource,
    GetGlossaryRequest,
    GetSupportedLanguagesRequest,
    Glossary,
    GlossaryInputConfig,
    InputConfig,
    ListGlossariesRequest,
    ListGlossariesResponse,
    OutputConfig,
    SupportedLanguage,
    SupportedLanguages,
    TranslateDocumentRequest,
    TranslateDocumentResponse,
    TranslateTextGlossaryConfig,
    TranslateTextRequest,
    TranslateTextResponse,
    Translation,
)

__all__ = (
    "TranslationServiceAsyncClient",
    "BatchDocumentInputConfig",
    "BatchDocumentOutputConfig",
    "BatchTranslateDocumentMetadata",
    "BatchTranslateDocumentRequest",
    "BatchTranslateDocumentResponse",
    "BatchTranslateMetadata",
    "BatchTranslateResponse",
    "BatchTranslateTextRequest",
    "CreateGlossaryMetadata",
    "CreateGlossaryRequest",
    "DeleteGlossaryMetadata",
    "DeleteGlossaryRequest",
    "DeleteGlossaryResponse",
    "DetectLanguageRequest",
    "DetectLanguageResponse",
    "DetectedLanguage",
    "DocumentInputConfig",
    "DocumentOutputConfig",
    "DocumentTranslation",
    "GcsDestination",
    "GcsSource",
    "GetGlossaryRequest",
    "GetSupportedLanguagesRequest",
    "Glossary",
    "GlossaryInputConfig",
    "InputConfig",
    "ListGlossariesRequest",
    "ListGlossariesResponse",
    "OutputConfig",
    "SupportedLanguage",
    "SupportedLanguages",
    "TranslateDocumentRequest",
    "TranslateDocumentResponse",
    "TranslateTextGlossaryConfig",
    "TranslateTextRequest",
    "TranslateTextResponse",
    "Translation",
    "TranslationServiceClient",
)
