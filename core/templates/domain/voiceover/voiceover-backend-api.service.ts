// Copyright 2024 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service to get voiceover admin data.
 */

import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';

import {VoiceoverDomainConstants} from './voiceover-domain.constants';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {
  EntityVoiceovers,
  EntityVoiceoversBackendDict,
} from './entity-voiceovers.model';
import {
  CloudTaskRun,
  CloudTaskRunBackendDict,
} from 'domain/cloud-task/cloud-task-run.model';

interface VoiceoverAdminDataBackendDict {
  language_accent_master_list: {
    [languageCode: string]: {
      [languageAccentCode: string]: string;
    };
  };
  language_codes_mapping: {
    [languageCode: string]: {
      [languageAccentCode: string]: boolean;
    };
  };
  autogeneratable_language_accent_codes: string[];
}

interface EntityVoiceoversBulkBackendDict {
  entity_voiceovers_list: EntityVoiceoversBackendDict[];
}

interface CloudTaskRunBackendResponseDict {
  automatic_voiceover_regeneration_records: CloudTaskRunBackendDict[];
}

export interface LanguageAccentToDescription {
  [languageAccentCode: string]: string;
}

export interface LanguageAccentCodesToSupportsAutogeneration {
  [languageAccentCode: string]: boolean;
}

export interface LanguageAccentMasterList {
  [languageCode: string]: LanguageAccentToDescription;
}

export interface LanguageCodesMapping {
  [languageCode: string]: {
    [languageAccentCode: string]: boolean;
  };
}

export interface VoiceoverAdminDataResponse {
  languageAccentMasterList: LanguageAccentMasterList;
  languageCodesMapping: LanguageCodesMapping;
  autoGeneratableLanguageAccentCodes: string[];
}

interface TokensWithDurationBackendType {
  token: string;
  audio_offset_msecs: number;
}

export interface TokensWithDurationType {
  token: string;
  audioOffsetMsecs: number;
}

interface RegenerateVoiceoverBackendResponse {
  filename: string;
  duration_secs: number;
  file_size_bytes: number;
  needs_update: boolean;
  sentence_tokens_with_durations: TokensWithDurationBackendType[];
}

export interface RegenerateVoiceoverResponse {
  filename: string;
  fileSizeBytes: number;
  durationSecs: number;
  needsUpdate: boolean;
  sentenceTokenWithDurations: TokensWithDurationType[];
}

interface ExplorationDataForVoiceoverRegenerationBackendType {
  exploration_title: string;
  autogeneratable_language_accent_codes: string[];
}

interface ExplorationDataForVoiceoverRegenerationType {
  explorationTitle: string;
  autogeneratableLanguageAccentCodes: string[];
}

interface ExplorationDataForVoiceoverRegenerationBackendDict {
  exploration_data: ExplorationDataForVoiceoverRegenerationBackendType | null;
  response_message: string | null;
}

export interface ExplorationDataForVoiceoverRegenerationResponse {
  explorationData: ExplorationDataForVoiceoverRegenerationType | null;
  responseMessage: string | null;
}

export interface ExplorationVoiceoverRegenerationStatusBackendResponse {
  language_accent_to_content_status_map: LanguageAccentToContentStatusMap;
}

export interface LanguageAccentToContentStatusMap {
  [languageAccentCode: string]: {
    [contentId: string]: string;
  };
}

@Injectable({
  providedIn: 'root',
})
export class VoiceoverBackendApiService {
  constructor(
    private urlInterpolationService: UrlInterpolationService,
    private http: HttpClient
  ) {}

  async fetchVoiceoverAdminDataAsync(): Promise<VoiceoverAdminDataResponse> {
    return new Promise((resolve, reject) => {
      this.http
        .get<VoiceoverAdminDataBackendDict>(
          VoiceoverDomainConstants.VOICEOVER_ADMIN_DATA_HANDLER_URL
        )
        .toPromise()
        .then(
          response => {
            resolve({
              languageAccentMasterList: response.language_accent_master_list,
              languageCodesMapping: response.language_codes_mapping,
              autoGeneratableLanguageAccentCodes:
                response.autogeneratable_language_accent_codes,
            });
          },
          errorResponse => {
            reject(errorResponse?.error);
          }
        );
    });
  }

  async updateVoiceoverLanguageCodesMappingAsync(
    languageCodesMapping: LanguageCodesMapping
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      this.http
        .put<void>(
          VoiceoverDomainConstants.VOICEOVER_LANGUAGE_CODES_MAPPING_URL,
          {language_codes_mapping: languageCodesMapping}
        )
        .toPromise()
        .then(
          response => {
            resolve(response);
          },
          errorResopnse => {
            reject(errorResopnse?.error);
          }
        );
    });
  }

  async generateAutomaticVoiceoverAsync(
    explorationID: string,
    explorationVersion: number,
    stateName: string,
    contentId: string,
    languageAccentCode: string
  ): Promise<RegenerateVoiceoverResponse> {
    return new Promise((resolve, reject) => {
      this.http
        .put<RegenerateVoiceoverBackendResponse>(
          this.urlInterpolationService.interpolateUrl(
            VoiceoverDomainConstants.REGENERATE_AUTOMATIC_VOICEOVER_HANDLER_URL,
            {exploration_id: explorationID}
          ),
          {
            exploration_version: explorationVersion,
            state_name: stateName,
            content_id: contentId,
            language_accent_code: languageAccentCode,
          }
        )
        .toPromise()
        .then(
          response => {
            resolve({
              filename: response.filename,
              durationSecs: response.duration_secs,
              fileSizeBytes: response.file_size_bytes,
              needsUpdate: response.needs_update,
              sentenceTokenWithDurations:
                response.sentence_tokens_with_durations.map(
                  tokenWithDuration => {
                    return {
                      token: tokenWithDuration.token,
                      audioOffsetMsecs: tokenWithDuration.audio_offset_msecs,
                    };
                  }
                ),
            });
          },
          errorResponse => {
            reject(errorResponse?.error);
          }
        );
    });
  }

  async regenerateVoiceoverOnExplorationUpdateAsync(
    explorationID: string,
    explorationVersion: number,
    explorationTitle: string
  ): Promise<void> {
    this.http
      .post<void>(
        this.urlInterpolationService.interpolateUrl(
          VoiceoverDomainConstants.REGENERATE_VOICEOVER_ON_EXP_UPDATE_URL,
          {
            exploration_id: explorationID,
            exploration_version: String(explorationVersion),
          }
        ),
        {}
      )
      .toPromise();
  }

  async fetchEntityVoiceoversByLanguageCodeAsync(
    entityType: string,
    entitytId: string,
    entityVersion: number,
    languageCode: string
  ): Promise<EntityVoiceovers[]> {
    let entityVoiceoversBulkHandlerUrl =
      this.urlInterpolationService.interpolateUrl(
        VoiceoverDomainConstants.GET_ENTITY_VOICEOVERS_BULK,
        {
          entity_type: entityType,
          entity_id: entitytId,
          entity_version: String(entityVersion),
          language_code: languageCode,
        }
      );

    return new Promise((resolve, reject) => {
      this.http
        .get<EntityVoiceoversBulkBackendDict>(entityVoiceoversBulkHandlerUrl)
        .toPromise()
        .then(
          response => {
            let entityVoiceoversList = [];
            for (let entityVoiceoverBackendDict of response.entity_voiceovers_list) {
              entityVoiceoversList.push(
                EntityVoiceovers.createFromBackendDict(
                  entityVoiceoverBackendDict
                )
              );
            }
            resolve(entityVoiceoversList);
          },
          errorResponse => {
            reject(errorResponse?.error);
          }
        );
    });
  }

  async fetchVoiceoverRegenerationRecordAsync(
    stateDate: string,
    endDate: string
  ): Promise<CloudTaskRun[]> {
    return new Promise((resolve, reject) => {
      this.http
        .get<CloudTaskRunBackendResponseDict>(
          VoiceoverDomainConstants.AUTOMATIC_VOICEOVER_REGENERATION_RECORD_URL,
          {
            params: {
              start_date: stateDate,
              end_date: endDate,
            },
          }
        )
        .toPromise()
        .then(
          response => {
            let cloudTaskRunList = [];

            for (let cloudTaskRunBackendDict of response.automatic_voiceover_regeneration_records) {
              cloudTaskRunList.push(
                CloudTaskRun.createFromBackendDict(cloudTaskRunBackendDict)
              );
            }
            resolve(cloudTaskRunList);
          },
          errorResponse => {
            reject(errorResponse?.error);
          }
        );
    });
  }
  async fetchLatestVoiceoverRegenerationStatusAsync(
    explorationID: string
  ): Promise<LanguageAccentToContentStatusMap> {
    const voiceoverRegenerationStatusUrl =
      this.urlInterpolationService.interpolateUrl(
        VoiceoverDomainConstants.EXPLORATION_VOICEOVER_REGENERATION_STATUS_URL,
        {
          exploration_id: explorationID,
        }
      );

    return new Promise((resolve, reject) => {
      this.http
        .get<ExplorationVoiceoverRegenerationStatusBackendResponse>(
          voiceoverRegenerationStatusUrl
        )
        .toPromise()
        .then(
          response => {
            let languageAccentToContentStatusMap =
              response.language_accent_to_content_status_map;
            resolve(languageAccentToContentStatusMap);
          },
          errorResponse => {
            reject(errorResponse?.error);
          }
        );
    });
  }

  async fetchExplorationDataForVoiceoverAsync(
    explorationID: string
  ): Promise<ExplorationDataForVoiceoverRegenerationResponse> {
    let explorationDataUrl = this.urlInterpolationService.interpolateUrl(
      VoiceoverDomainConstants.GET_EXPLORATION_VOICEOVERS_DATA_URL,
      {
        exploration_id: explorationID,
      }
    );

    return new Promise((resolve, reject) => {
      this.http
        .get<ExplorationDataForVoiceoverRegenerationBackendDict>(
          explorationDataUrl
        )
        .toPromise()
        .then(
          response => {
            let explorationData: ExplorationDataForVoiceoverRegenerationType | null =
              null;
            if (response?.exploration_data) {
              explorationData = {
                explorationTitle: response.exploration_data.exploration_title,
                autogeneratableLanguageAccentCodes:
                  response.exploration_data
                    .autogeneratable_language_accent_codes,
              };
            }

            let responseData = {
              explorationData: explorationData,
              responseMessage: response.response_message,
            };
            resolve(responseData);
          },
          errorResponse => {
            reject(errorResponse?.error);
          }
        );
    });
  }

  async regenerateVoiceoversForExplorationAsync(
    explorationID: string,
    languageAccentCode: string
  ): Promise<void> {
    let regenerateVoiceoversForExplorationUrl =
      this.urlInterpolationService.interpolateUrl(
        VoiceoverDomainConstants.REGENERATE_VOICEOVERS_FOR_EXPLORATION_URL,
        {
          exploration_id: explorationID,
          language_accent_code: languageAccentCode,
        }
      );

    return this.http
      .post<void>(regenerateVoiceoversForExplorationUrl, {})
      .toPromise();
  }
}
