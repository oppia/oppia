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

import { downgradeInjectable } from '@angular/upgrade/static';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { VoiceoverDomainConstants } from './voiceover-domain.constants';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';

interface VoiceoverAdminDataBackendDict {
  'language_accent_master_list': {
    [languageCode: string]: {
      [languageAccentCode: string]: string;
    };
  };
  'language_codes_mapping': {
    [languageCode: string]: {
      [languageAccentCode: string]: boolean;
    };
  };
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

@Injectable({
  providedIn: 'root'
})
export class VoiceoverBackendApiService {
  constructor(
    private urlInterpolationService: UrlInterpolationService,
    private http: HttpClient
  ) {}

  async fetchVoiceoverAdminDataAsync(): Promise<VoiceoverAdminDataResponse> {
    return new Promise((resolve, reject) => {
      this.http.get<VoiceoverAdminDataBackendDict>(
        VoiceoverDomainConstants.VOICEOVER_ADMIN_DATA_HANDLER_URL
      ).toPromise().then(response => {
        resolve({
          languageAccentMasterList: (
            response.language_accent_master_list),
          languageCodesMapping: response.language_codes_mapping
        });
      }, errorResponse => {
        reject(errorResponse?.error);
      });
    });
  }

  async updateVoiceoverLanguageCodesMappingAsync(
      languageCodesMapping: LanguageCodesMapping): Promise<void> {
    return new Promise((resolve, reject) => {
      this.http.put<void>(
        VoiceoverDomainConstants.VOICEOVER_LANGUAGE_CODES_MAPPING_URL,
        {language_codes_mapping: languageCodesMapping}
      ).toPromise().then(
        response => {
          resolve(response);
        }, errorResopnse => {
          reject(errorResopnse?.error);
        }
      );
    });
  }
}

angular.module('oppia').factory(
  'VoiceoverBackendApiService',
  downgradeInjectable(VoiceoverBackendApiService));
