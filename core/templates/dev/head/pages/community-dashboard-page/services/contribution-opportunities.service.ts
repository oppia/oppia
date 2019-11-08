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

import {ContributionOpportunitiesBackendApiService} from './contribution-opportunities-backend-api.service';

/**
 * @fileoverview A service for handling contribution opportunities in different
 * fields.
 */

require(
  'pages/community-dashboard-page/services/' +
  'contribution-opportunities-backend-api.service.ts');


export class ContributionOpportunitiesService {
  constructor(private contributionOpportunitiesBackendApiService:
                  ContributionOpportunitiesBackendApiService) {}

    translationOpportunitiesCursor = null;
    voiceoverOpportunitiesCursor = null;
    moreTranslationOpportunitiesAvailable = true;
    moreVoiceoverOpportunitiesAvailable = true;

    _getTranslationOpportunities(
        languageCode, cursor, successCallback) {
      this.contributionOpportunitiesBackendApiService.fetchTranslationOpportunities(
        languageCode, cursor, (data) => {
          this.moreTranslationOpportunitiesAvailable = data.more;
          this.translationOpportunitiesCursor = data.next_cursor;
          successCallback(data.opportunities, data.more);
        });
    }
    _getVoiceoverOpportunities(
        languageCode, cursor, successCallback) {
      this.contributionOpportunitiesBackendApiService.fetchVoiceoverOpportunities(
        languageCode, cursor, (data) => {
          this.moreVoiceoverOpportunitiesAvailable = data.more;
          this.voiceoverOpportunitiesCursor = data.next_cursor;
          successCallback(data.opportunities, data.more);
        });
    }

    getTranslationOpportunities(languageCode, successCallback) {
      this._getTranslationOpportunities(languageCode, '', successCallback);
    }
    getVoiceoverOpportunities(languageCode, successCallback) {
      this._getVoiceoverOpportunities(languageCode, '', successCallback);
    }
    getMoreTranslationOpportunities(languageCode, successCallback) {
      if (this.moreTranslationOpportunitiesAvailable) {
        this._getTranslationOpportunities(
          languageCode, this.translationOpportunitiesCursor, successCallback);
      }
    }
    getMoreVoiceoverOpportunities(languageCode, successCallback) {
      if (this.moreVoiceoverOpportunitiesAvailable) {
        this._getVoiceoverOpportunities(
          languageCode, this.voiceoverOpportunitiesCursor, successCallback);
      }
    }
}
