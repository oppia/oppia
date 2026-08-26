// Copyright 2021 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Service for handling user contributed translations.
 */

import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {
  TranslatableTexts,
  TranslatableTextsBackendDict,
  TranslatableTextsBackendDictV2,
} from 'domain/opportunity/translatable-texts.model';
import {
  ImageLocalStorageService,
  ImagesData,
} from 'services/image-local-storage.service';
import {PlatformFeatureService} from 'services/platform-feature.service';
import {AppConstants} from 'app.constants';

/**
 * The backend response shape returned by /generate-translation.
 * translation_provider is the internal ID of the provider that
 * generated the translation (e.g. 'gcp', 'azure').
 */
export interface MachineTranslationResponse {
  translated_text: string;
  translation_provider: string;
}

interface ChangeCmdBase {
  cmd: string;
  content_id: string;
  state_name: string;
  language_code: string;
  content_html: string | string[];
  translation_html: string | string[];
  data_format: string;
}

/**
 * Auto-generation metadata appended to change_cmd when the translation
 * was populated via the AI auto-translate feature. All three fields are
 * optional to remain backward-compatible with manual translations.
 */
interface AutoGenerationMetadata {
  was_auto_generated: boolean;
  // The internal provider ID that generated the translation (e.g. 'gcp').
  auto_generation_provider: string;
  // True when the contributor edited the AI suggestion before submitting.
  was_edited: boolean;
}

type ChangeCmd = ChangeCmdBase & Partial<AutoGenerationMetadata>;

interface Data {
  suggestion_type: string;
  target_type: string;
  description: string;
  target_id: string;
  target_version_at_submission: string;
  change_cmd: ChangeCmd;
  files?: Record<string, string>;
}

@Injectable({
  providedIn: 'root',
})
export class TranslateTextBackendApiService {
  constructor(
    private http: HttpClient,
    private imageLocalStorageService: ImageLocalStorageService,
    private platformFeatureService: PlatformFeatureService
  ) {}

  async getTranslatableTextsAsync(
    entityId: string,
    languageCode: string,
    entityType: string = AppConstants.ENTITY_TYPE.EXPLORATION
  ): Promise<TranslatableTexts> {
    if (
      this.platformFeatureService.status.EnableTranslationOppsWithNewOppModels
        .isEnabled
    ) {
      return this.http
        .get<TranslatableTextsBackendDictV2>(
          '/gettranslatablecontentshandlerv2',
          {
            params: {
              entity_id: entityId,
              entity_type: entityType,
              language_code: languageCode,
            },
          }
        )
        .toPromise()
        .then((backendDict: TranslatableTextsBackendDictV2) => {
          return TranslatableTexts.createFromBackendDictV2(backendDict);
        });
    }

    return this.http
      .get<TranslatableTextsBackendDict>('/gettranslatabletexthandler', {
        params: {
          exp_id: entityId,
          language_code: languageCode,
        },
      })
      .toPromise()
      .then((backendDict: TranslatableTextsBackendDict) => {
        return TranslatableTexts.createFromBackendDict(backendDict);
      });
  }

  /**
   * Requests an AI-generated translation from the backend.
   *
   * Sends a POST to /generate-translation with the source text and language
   * codes. The backend checks the feature flag, the admin master toggle, and
   * the active provider mapping before delegating to the configured
   * translation provider (e.g. GCP or Azure).
   *
   * @param sourceText - The plain or HTML text to be translated.
   * @param sourceLanguageCode - BCP-47 code for the source language (e.g.
   *   'en').
   * @param targetLanguageCode - BCP-47 code for the target language (e.g.
   *   'hi').
   * @returns A promise that resolves to the translated text and the provider
   *   ID that generated it.
   */
  async getMachineTranslationAsync(
    sourceText: string,
    sourceLanguageCode: string,
    targetLanguageCode: string
  ): Promise<MachineTranslationResponse> {
    return this.http
      .post<MachineTranslationResponse>('/generate-translation', {
        source_text: sourceText,
        source_language_code: sourceLanguageCode,
        target_language_code: targetLanguageCode,
      })
      .toPromise()
      .then(
        response => response as MachineTranslationResponse,
        err => Promise.reject(err.error?.error ?? err.message)
      );
  }

  /**
   * Fetches the global automatic translation status.
   */
  async getMachineTranslationFeatureStatusAsync(): Promise<boolean> {
    return this.http
      .get<{is_enabled: boolean}>('/machine-translation-feature-status')
      .toPromise()
      .then(response => response.is_enabled);
  }
  /**
   * Submits a translation suggestion to the backend.
   *
   * When wasAutoGenerated is true, the three auto-generation metadata fields
   * are included in change_cmd so that reviewers can see whether the
   * translation originated from the AI feature and whether the contributor
   * edited it before submission. Manual translations (wasAutoGenerated
   * omitted or false) omit these fields entirely, preserving backward
   * compatibility.
   *
   * @param expId - The exploration ID.
   * @param expVersion - The exploration version string.
   * @param contentId - The content ID within the state.
   * @param stateName - The name of the state containing this content.
   * @param languageCode - BCP-47 target language code.
   * @param contentHtml - The original source HTML.
   * @param translationHtml - The translated HTML.
   * @param imagesData - Image blobs that accompany this suggestion.
   * @param dataFormat - 'html' or 'unicode'.
   * @param wasAutoGenerated - True when the text was pre-populated by the AI
   *   auto-translate feature. Defaults to false.
   * @param autoGenerationProvider - Internal ID of the provider used (e.g.
   *   'gcp'). Required when wasAutoGenerated is true.
   * @param wasEdited - True when the contributor modified the AI suggestion
   *   before submission. Defaults to false.
   */
  async suggestTranslatedTextAsync(
    expId: string,
    expVersion: string,
    contentId: string,
    stateName: string,
    languageCode: string,
    contentHtml: string | string[],
    translationHtml: string | string[],
    imagesData: ImagesData[],
    dataFormat: string,
    wasAutoGenerated: boolean = false,
    autoGenerationProvider: string = '',
    wasEdited: boolean = false,
    entityType: string = AppConstants.ENTITY_TYPE.EXPLORATION
  ): Promise<void> {
    const changeCmd: ChangeCmd = {
      cmd: 'add_written_translation',
      content_id: contentId,
      state_name: stateName,
      language_code: languageCode,
      content_html: contentHtml,
      translation_html: translationHtml,
      data_format: dataFormat,
    };

    // Attach auto-generation metadata only when the translation was
    // AI-generated. This keeps the payload lean for manual submissions and
    // avoids sending empty/misleading fields to the backend.
    if (wasAutoGenerated) {
      changeCmd.was_auto_generated = true;
      changeCmd.auto_generation_provider = autoGenerationProvider;
      changeCmd.was_edited = wasEdited;
    }

    const postData: Data = {
      suggestion_type: 'translate_content',
      target_type: entityType,
      description: 'Adds translation',
      target_id: expId,
      target_version_at_submission: expVersion,
      change_cmd: changeCmd,
      files:
        await this.imageLocalStorageService.getFilenameToBase64MappingAsync(
          imagesData
        ),
    };
    const body = new FormData();
    body.append('payload', JSON.stringify(postData));
    return this.http.post<void>('/suggestionhandler/', body).toPromise();
  }
}
