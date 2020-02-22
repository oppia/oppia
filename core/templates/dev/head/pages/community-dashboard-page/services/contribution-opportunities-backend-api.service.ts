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
 * @fileoverview Service for fetching the opportunities available for
 * contributors to contribute.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  UrlInterpolationService
} from 'domain/utilities/url-interpolation.service';
import {
  ExplorationOpportunitySummary
} from 'domain/opportunity/ExplorationOpportunitySummaryObjectFactory';
import {
  SkillOpportunity
} from 'domain/opportunity/SkillOpportunityObjectFactory';

@Injectable({
  providedIn: 'root'
})
export class ContributionOpportunitiesBackendApiService {
  urlTemplate = '/opportunitiessummaryhandler/<opportunityType>';
  constructor(
    private urlInterpolationService: UrlInterpolationService,
    private http: HttpClient
  ) {}
  /**  TODO(srijanreddy98): for some reason not able to import types (
  * OPPORTUNITY_TYPE_SKILL,
  * OPPORTUNITY_TYPE_TRANSLATION,
  * OPPORTUNITY_TYPE_VOICEOVER
  * )from constants.ts in assets */
  _getOpportunityFromDict(opportunityType, opportunityDict) {
    if (
      opportunityType === 'voiceover' ||
      opportunityType === 'translation') {
      return new ExplorationOpportunitySummary(opportunityDict.id,
        opportunityDict.topic_name, opportunityDict.story_title,
        opportunityDict.chapter_title, opportunityDict.content_count,
        opportunityDict.translation_counts);
    } else if (opportunityType === 'skill') {
      return new SkillOpportunity(
        opportunityDict.id, opportunityDict.skill_description,
        opportunityDict.topic_name, opportunityDict.question_count);
    }
  }

  _fetchOpportunities(opportunityType, params, successCallback) {
    this.http.get(this.urlInterpolationService.interpolateUrl(
      this.urlTemplate, { opportunityType }
    ), {
      params
    }).toPromise().then((data: any) => {
      let opportunities = [];
      for (let index in data.opportunities) {
        opportunities.push(this._getOpportunityFromDict(
          opportunityType, data.opportunities[index]));
      }
      if (successCallback) {
        successCallback(opportunities, data.next_cursor, data.more);
      }
    }, (err) => {
      // console.log(err);
    });
  }
  fetchSkillOpportunities(cursor, successCallback) {
    let params = {
      cursor: cursor
    };
    return this._fetchOpportunities(
      'skill', params, successCallback);
  }
  fetchTranslationOpportunities( languageCode, cursor, successCallback ) {
    let params = {
      language_code: languageCode,
      cursor: cursor
    };
    return this._fetchOpportunities(
      'translation', params, successCallback);
  }
  fetchVoiceoverOpportunities(languageCode, cursor, successCallback) {
    const params = {
      language_code: languageCode,
      cursor: cursor
    };
    return this._fetchOpportunities(
      'voiceover', params, successCallback);
  }
}

