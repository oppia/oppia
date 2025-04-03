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
}

interface EntityVoiceoversBulkBackendDict {
  entity_voiceovers_list: EntityVoiceoversBackendDict[];
}

interface ExplorationIdToFilenamesBackendDict {
  exploration_id_to_filenames: {
    [explorationId: string]: string[];
  };
}

export interface ExplorationIdToFilenames {
  [explorationId: string]: string[];
}

export interface LanguageAccentToDescription {
  [languageAccentCode: string]: string;
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
}

export interface VoiceArtistIdToLanguageMapping {
  [voiceArtistId: string]: {
    [languageCode: string]: string;
  };
}

export interface VoiceArtistIdToVoiceArtistName {
  [voiceArtistId: string]: string;
}

interface VoiceArtistMetaDataBackendDict {
  voice_artist_id_to_language_mapping: {
    [voiceArtistId: string]: {
      [languageCode: string]: string;
    };
  };
  voice_artist_id_to_voice_artist_name: {
    [voiceArtistId: string]: string;
  };
}

export interface VoiceArtistMetadataResponse {
  voiceArtistIdToLanguageMapping: VoiceArtistIdToLanguageMapping;
  voiceArtistIdToVoiceArtistName: VoiceArtistIdToVoiceArtistName;
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

  async fetchVoiceArtistMetadataAsync(): Promise<VoiceArtistMetadataResponse> {
    return new Promise((resolve, reject) => {
      this.http
        .get<VoiceArtistMetaDataBackendDict>(
          VoiceoverDomainConstants.VOICE_ARTIST_METADATA_HANDLER_URL
        )
        .toPromise()
        .then(
          response => {
            resolve({
              voiceArtistIdToLanguageMapping:
                response.voice_artist_id_to_language_mapping,
              voiceArtistIdToVoiceArtistName:
                response.voice_artist_id_to_voice_artist_name,
            });
          },
          errorResponse => {
            reject(errorResponse?.error);
          }
        );
    });
  }

  async updateVoiceArtistToLanguageAccentAsync(
    voiceArtistId: string,
    languageCode: string,
    languageAccentCode: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      this.http
        .put<void>(VoiceoverDomainConstants.VOICE_ARTIST_METADATA_HANDLER_URL, {
          voice_artist_id: voiceArtistId,
          language_code: languageCode,
          language_accent_code: languageAccentCode,
        })
        .toPromise()
        .then(
          response => {
            resolve(response);
          },
          errorResponse => {
            reject(errorResponse?.error);
          }
        );
    });
  }

  async fetchFilenamesForVoiceArtistAsync(
    voiceArtistId: string,
    languageCode: string
  ): Promise<ExplorationIdToFilenames> {
    return new Promise((resolve, reject) => {
      this.http
        .get<ExplorationIdToFilenamesBackendDict>(
          this.urlInterpolationService.interpolateUrl(
            VoiceoverDomainConstants.GET_VOICEOVERS_FOR_VOICE_ARTIST_URL_TEMPLATE,
            {
              voice_artist_id: voiceArtistId,
              language_code: languageCode,
            }
          )
        )
        .toPromise()
        .then(
          response => {
            resolve(response.exploration_id_to_filenames);
          },
          errorResponse => {
            reject(errorResponse?.error);
          }
        );
    });
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
}
