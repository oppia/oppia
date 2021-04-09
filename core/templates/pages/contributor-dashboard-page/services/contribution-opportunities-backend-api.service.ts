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
  ExplorationOpportunitySummary,
  ExplorationOpportunitySummaryBackendDict
} from 'domain/opportunity/exploration-opportunity-summary.model';
import { SkillOpportunity, SkillOpportunityBackendDict } from
  'domain/opportunity/skill-opportunity.model';
import { UrlInterpolationService } from
  'domain/utilities/url-interpolation.service';
import {
  FeaturedTranslationLanguage,
  FeaturedTranslationLanguageBackendDict,
} from 'domain/opportunity/featured-translation-language.model';

import constants from 'assets/constants';

interface SkillContributionOpportunitiesBackendDict {
  'opportunities': SkillOpportunityBackendDict[];
  'next_cursor': string;
  'more': boolean;
}

interface TranslationContributionOpportunitiesBackendDict {
  'opportunities': ExplorationOpportunitySummaryBackendDict[];
  'next_cursor': string;
  'more': boolean;
}

interface VoiceoverContributionOpportunitiesBackendDict {
  'opportunities': ExplorationOpportunitySummaryBackendDict[];
  'next_cursor': string;
  'more': boolean;
}

interface SkillContributionOpportunities {
  opportunities: SkillOpportunity[];
  nextCursor: string;
  more: boolean;
}

interface TranslationContributionOpportunities {
  opportunities: ExplorationOpportunitySummary[];
  nextCursor: string;
  more: boolean;
}

interface VoiceoverContributionOpportunities {
  opportunities: ExplorationOpportunitySummary[];
  nextCursor: string;
  more: boolean;
}

interface FeaturedTranslationLanguagesBackendDict {
  'featured_translation_languages': FeaturedTranslationLanguageBackendDict[];
}

@Injectable({
  providedIn: 'root'
})
export class ContributionOpportunitiesBackendApiService {
  urlTemplate = '/opportunitiessummaryhandler/<opportunityType>';
  constructor(
    private urlInterpolationService: UrlInterpolationService,
    private http: HttpClient,
  ) {}

  private _getExplorationOpportunityFromDict(
      opportunityDict: ExplorationOpportunitySummaryBackendDict):
      ExplorationOpportunitySummary {
    return new ExplorationOpportunitySummary(
      opportunityDict.id, opportunityDict.topic_name,
      opportunityDict.story_title, opportunityDict.chapter_title,
      opportunityDict.content_count, opportunityDict.translation_counts);
  }

  private _getSkillOpportunityFromDict(
      opportunityDict: SkillOpportunityBackendDict): SkillOpportunity {
    return new SkillOpportunity(
      opportunityDict.id, opportunityDict.skill_description,
      opportunityDict.topic_name, opportunityDict.question_count);
  }

  async fetchSkillOpportunitiesAsync(cursor: string):
  Promise<SkillContributionOpportunities> {
    const params = {
      cursor: cursor
    };

    return this.http.get<SkillContributionOpportunitiesBackendDict>(
      this.urlInterpolationService.interpolateUrl(
        this.urlTemplate, {
          opportunityType: constants.OPPORTUNITY_TYPE_SKILL
        }
      ), { params }).toPromise().then(data => {
      const opportunities = data.opportunities.map(
        dict => this._getSkillOpportunityFromDict(dict));

      return {
        opportunities: opportunities,
        nextCursor: data.next_cursor,
        more: data.more
      };
    }, errorResponse => {
      throw new Error(errorResponse.error.error);
    });
  }

  async fetchTranslationOpportunitiesAsync(
      languageCode: string, cursor: string):
    Promise<TranslationContributionOpportunities> {
    const params = {
      language_code: languageCode,
      cursor: cursor
    };

    return this.http.get<TranslationContributionOpportunitiesBackendDict>(
      this.urlInterpolationService.interpolateUrl(
        this.urlTemplate, {
          opportunityType: constants.OPPORTUNITY_TYPE_TRANSLATION
        }
      ), { params }).toPromise().then(data => {
      const opportunities = data.opportunities.map(
        dict => this._getExplorationOpportunityFromDict(dict));

      return {
        opportunities: opportunities,
        nextCursor: data.next_cursor,
        more: data.more
      };
    }, errorResponse => {
      throw new Error(errorResponse.error.error);
    });
  }

  async fetchVoiceoverOpportunitiesAsync(languageCode: string, cursor: string):
  Promise<VoiceoverContributionOpportunities> {
    const params = {
      language_code: languageCode,
      cursor: cursor
    };

    return this.http.get<VoiceoverContributionOpportunitiesBackendDict>(
      this.urlInterpolationService.interpolateUrl(
        this.urlTemplate, {
          opportunityType: constants.OPPORTUNITY_TYPE_VOICEOVER
        }
      ), { params }).toPromise().then(data => {
      const opportunities = data.opportunities.map(
        dict => this._getExplorationOpportunityFromDict(dict));

      return {
        opportunities: opportunities,
        nextCursor: data.next_cursor,
        more: data.more
      };
    }, errorResponse => {
      throw new Error(errorResponse.error.error);
    });
  }

  async fetchFeaturedTranslationLanguagesAsync():
  Promise<FeaturedTranslationLanguage[]> {
    try {
      const response = await this.http
        .get<FeaturedTranslationLanguagesBackendDict>(
          '/retrivefeaturedtranslationlanguages').toPromise();

      return response.featured_translation_languages.map(
        backendDict => FeaturedTranslationLanguage
          .createFromBackendDict(backendDict));
    } catch {
      return [];
    }
  }
}

angular.module('oppia').factory(
  'ContributionOpportunitiesBackendApiService',
  downgradeInjectable(ContributionOpportunitiesBackendApiService));
