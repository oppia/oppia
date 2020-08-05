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

import {
  ContributionOpportunitiesBackendApiService,
  SkillContributionOpportunities,
  TranslationContributionOpportunities,
  VoiceoverContributionOpportunities
} from
  // eslint-disable-next-line max-len
  'pages/community-dashboard-page/services/contribution-opportunities-backend-api.service';

@Injectable({
  providedIn: 'root'
})
export class ContributionOpportunitiesService {
  private skillOpportunitiesCursor: string;
  private translationOpportunitiesCursor: string;
  private voiceoverOpportunitiesCursor: string;
  private moreSkillOpportunitiesAvailable: boolean;
  private moreTranslationOpportunitiesAvailable: boolean;
  private moreVoiceoverOpportunitiesAvailable: boolean;

  constructor(
    private contributionOpportunitiesBackendApiService:
      ContributionOpportunitiesBackendApiService
  ) {
    this.skillOpportunitiesCursor = null;
    this.translationOpportunitiesCursor = null;
    this.voiceoverOpportunitiesCursor = null;
    this.moreSkillOpportunitiesAvailable = true;
    this.moreTranslationOpportunitiesAvailable = true;
    this.moreVoiceoverOpportunitiesAvailable = true;
  }

  private _getSkillOpportunities(
      cursor: string,
      successCallback: (opportunities: Object, more: boolean) => void
  ): void {
    this.contributionOpportunitiesBackendApiService.fetchSkillOpportunities(
      cursor).then((data: SkillContributionOpportunities) => {
      this.skillOpportunitiesCursor = data.nextCursor;
      this.moreSkillOpportunitiesAvailable = data.more;
      successCallback(data.opportunities, data.more);
    });
  }

  private _getTranslationOpportunities(
      languageCode: string,
      cursor: string,
      successCallback: (opportunities: Object, more: boolean) => void
  ): void {
    this.contributionOpportunitiesBackendApiService
      .fetchTranslationOpportunities(languageCode, cursor)
      .then((data: TranslationContributionOpportunities) => {
        this.translationOpportunitiesCursor = data.nextCursor;
        this.moreTranslationOpportunitiesAvailable = data.more;
        successCallback(data.opportunities, data.more);
      });
  }

  private _getVoiceoverOpportunities(
      languageCode: string,
      cursor: string,
      successCallback: (opportunities: Object, more: boolean) => void
  ): void {
    this.contributionOpportunitiesBackendApiService.fetchVoiceoverOpportunities(
      languageCode, cursor).then((data: VoiceoverContributionOpportunities) => {
      this.voiceoverOpportunitiesCursor = data.nextCursor;
      this.moreVoiceoverOpportunitiesAvailable = data.more;
      successCallback(data.opportunities, data.more);
    });
  }

  getSkillOpportunities(
      successCallback: (opportunities: Object, more: boolean) => void
  ): void {
    this._getSkillOpportunities('', successCallback);
  }

  getTranslationOpportunities(
      languageCode: string,
      successCallback: (opportunities: Object, more: boolean) => void
  ): void {
    this._getTranslationOpportunities(languageCode, '', successCallback);
  }

  getVoiceoverOpportunities(
      languageCode: string,
      successCallback: (opportunities: Object, more: boolean) => void
  ): void {
    this._getVoiceoverOpportunities(languageCode, '', successCallback);
  }

  getMoreSkillOpportunities(
      successCallback: (opportunities: Object, more: boolean) => void
  ): void {
    if (this.moreSkillOpportunitiesAvailable) {
      this._getSkillOpportunities(
        this.skillOpportunitiesCursor, successCallback
      );
    }
  }

  getMoreTranslationOpportunities(
      languageCode: string,
      successCallback: (opportunities: Object, more: boolean) => void
  ): void {
    if (this.moreTranslationOpportunitiesAvailable) {
      this._getTranslationOpportunities(
        languageCode, this.translationOpportunitiesCursor, successCallback);
    }
  }

  getMoreVoiceoverOpportunities(
      languageCode: string,
      successCallback: (opportunities: Object, more: boolean) => void
  ): void {
    if (this.moreVoiceoverOpportunitiesAvailable) {
      this._getVoiceoverOpportunities(
        languageCode, this.voiceoverOpportunitiesCursor, successCallback);
    }
  }
}

angular.module('oppia').factory(
  'ContributionOpportunitiesService',
  downgradeInjectable(ContributionOpportunitiesService));
