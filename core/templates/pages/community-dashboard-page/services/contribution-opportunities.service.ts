// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview A service for handling contribution opportunities in different
 * fields.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

import { ContributionOpportunitiesBackendApiService,
  IFetchOpportunitySuccessCallbackParams }
// eslint-disable-next-line max-len
  from 'pages/community-dashboard-page/services/contribution-opportunities-backend-api.service';
import { SkillOpportunity } from
  'domain/opportunity/SkillOpportunityObjectFactory';

@Injectable({
  providedIn: 'root'
})
export class ContributionOpportunitiesService {
  skillOpportunitiesCursor = null;
  translationOpportunitiesCursor = null;
  voiceoverOpportunitiesCursor = null;
  moreSkillOpportunitiesAvailable = true;
  moreTranslationOpportunitiesAvailable = true;
  moreVoiceoverOpportunitiesAvailable = true;

  constructor(
    private contributionOpportunitiesBackendApiService:
      ContributionOpportunitiesBackendApiService) { }

  private _getSkillOpportunities(cursor: string,
      successCallback: (opportunities: SkillOpportunity[],
      more: boolean) => void): void {
    this.contributionOpportunitiesBackendApiService.fetchSkillOpportunities(
      cursor).then((value: IFetchOpportunitySuccessCallbackParams) => {
      this.skillOpportunitiesCursor = value.nextCursor;
      this.moreSkillOpportunitiesAvailable = value.more;
      successCallback(value.opportunities, value.more);
    });
  }

  private _getTranslationOpportunities(languageCode: string, cursor: string,
      successCallback: (opportunities: SkillOpportunity[],
      more: boolean) => void): void {
    this.contributionOpportunitiesBackendApiService
      .fetchTranslationOpportunities(languageCode, cursor)
      .then((value: IFetchOpportunitySuccessCallbackParams) => {
        this.translationOpportunitiesCursor = value.nextCursor;
        this.moreTranslationOpportunitiesAvailable = value.more;
        successCallback(value.opportunities, value.more);
      });
  }

  private _getVoiceoverOpportunities(languageCode: string, cursor: string,
      successCallback: (opportunities: SkillOpportunity[],
      more: boolean) => void) {
    this.contributionOpportunitiesBackendApiService.fetchVoiceoverOpportunities(
      languageCode, cursor).then((value: IFetchOpportunitySuccessCallbackParams) => {
      this.voiceoverOpportunitiesCursor = value.nextCursor;
      this.moreVoiceoverOpportunitiesAvailable = value.more;
      successCallback(value.opportunities, value.more);
    });
  }

  public getSkillOpportunities(successCallback:
    (opportunities: SkillOpportunity[], more: boolean) => void): void {
    this._getSkillOpportunities('', successCallback);
  }

  public getTranslationOpportunities(languageCode: string,
      successCallback: (opportunities: SkillOpportunity[],
      more: boolean) => void): void {
    this._getTranslationOpportunities(languageCode, '', successCallback);
  }

  public getVoiceoverOpportunities(languageCode: string,
      successCallback: (opportunities: SkillOpportunity[],
      more: boolean) => void): void {
    this._getVoiceoverOpportunities(languageCode, '', successCallback);
  }

  public getMoreSkillOpportunities(successCallback:
    (opportunities: SkillOpportunity[], more: boolean) => void): void {
    if (this.moreSkillOpportunitiesAvailable) {
      this._getSkillOpportunities(this.skillOpportunitiesCursor,
        successCallback);
    }
  }

  public getMoreTranslationOpportunities(languageCode: string,
      successCallback: (opportunities: SkillOpportunity[],
      more: boolean) => void): void {
    if (this.moreTranslationOpportunitiesAvailable) {
      this._getTranslationOpportunities(languageCode,
        this.translationOpportunitiesCursor, successCallback);
    }
  }

  public getMoreVoiceoverOpportunities(languageCode: string, successCallback:
    (opportunities: SkillOpportunity[], more: boolean) => void): void {
    if (this.moreVoiceoverOpportunitiesAvailable) {
      this._getVoiceoverOpportunities(languageCode,
        this.voiceoverOpportunitiesCursor, successCallback);
    }
  }
}

// angular.module('oppia').factory('ContributionOpportunitiesService', [
//   'ContributionOpportunitiesBackendApiService',
//   function(ContributionOpportunitiesBackendApiService) {
//     var skillOpportunitiesCursor = null;
//     var translationOpportunitiesCursor = null;
//     var voiceoverOpportunitiesCursor = null;
//     var moreSkillOpportunitiesAvailable = true;
//     var moreTranslationOpportunitiesAvailable = true;
//     var moreVoiceoverOpportunitiesAvailable = true;

//     var _getSkillOpportunities = function(cursor, successCallback) {
//       ContributionOpportunitiesBackendApiService.fetchSkillOpportunities(
//         cursor).then((opportunities, nextCursor, more) => {
//         skillOpportunitiesCursor = nextCursor;
//         moreSkillOpportunitiesAvailable = more;
//         successCallback(opportunities, more);
//       });
//     };
//     var _getTranslationOpportunities = function(
//         languageCode, cursor, successCallback) {
//       ContributionOpportunitiesBackendApiService.fetchTranslationOpportunities(
//         languageCode, cursor).then((opportunities, nextCursor, more) => {
//         translationOpportunitiesCursor = nextCursor;
//         moreTranslationOpportunitiesAvailable = more;
//         successCallback(opportunities, more);
//       });
//     };
//     var _getVoiceoverOpportunities = function(
//         languageCode, cursor, successCallback) {
//       ContributionOpportunitiesBackendApiService.fetchVoiceoverOpportunities(
//         languageCode, cursor).then(function(opportunities, nextCursor, more) {
//         voiceoverOpportunitiesCursor = nextCursor;
//         moreVoiceoverOpportunitiesAvailable = more;
//         successCallback(opportunities, more);
//       });
//     };

//     return {
//       getSkillOpportunities: function(successCallback) {
//         _getSkillOpportunities('', successCallback);
//       },
//       getTranslationOpportunities: function(languageCode, successCallback) {
//         _getTranslationOpportunities(languageCode, '', successCallback);
//       },
//       getVoiceoverOpportunities: function(languageCode, successCallback) {
//         _getVoiceoverOpportunities(languageCode, '', successCallback);
//       },
//       getMoreSkillOpportunities: function(successCallback) {
//         if (moreSkillOpportunitiesAvailable) {
//           _getSkillOpportunities(skillOpportunitiesCursor, successCallback);
//         }
//       },
//       getMoreTranslationOpportunities: function(languageCode, successCallback) {
//         if (moreTranslationOpportunitiesAvailable) {
//           _getTranslationOpportunities(
//             languageCode, translationOpportunitiesCursor, successCallback);
//         }
//       },
//       getMoreVoiceoverOpportunities: function(languageCode, successCallback) {
//         if (moreVoiceoverOpportunitiesAvailable) {
//           _getVoiceoverOpportunities(
//             languageCode, voiceoverOpportunitiesCursor, successCallback);
//         }
//       }
//     };
//   }]);

angular.module('oppia').factory('ContributionOpportunitiesService',
  downgradeInjectable(ContributionOpportunitiesService));
