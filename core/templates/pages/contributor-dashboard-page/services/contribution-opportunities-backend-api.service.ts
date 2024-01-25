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
import { UserService } from 'services/user.service';

import { AppConstants } from 'app.constants';

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

interface ReviewableTranslationOpportunitiesBackendDict {
  'opportunities': ExplorationOpportunitySummaryBackendDict[];
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

interface FetchedReviewableTranslationOpportunitiesResponse {
  opportunities: ExplorationOpportunitySummary[];
}

interface FeaturedTranslationLanguagesBackendDict {
  'featured_translation_languages': FeaturedTranslationLanguageBackendDict[];
}

interface TopicNamesBackendDict {
  'topic_names': string[];
}

interface PreferredTranslationLanguageBackendDict {
  'preferred_translation_language_code': string|null;
}

@Injectable({
  providedIn: 'root'
})
export class ContributionOpportunitiesBackendApiService {
  urlTemplate = '/opportunitiessummaryhandler/<opportunityType>';
  constructor(
    private urlInterpolationService: UrlInterpolationService,
    private http: HttpClient,
    private userService: UserService,
  ) {}

  private UPDATE_PINNED_OPPORTUNITY_HANDLER_URL = (
    '/pinned-opportunities'
  );

  private _getExplorationOpportunityFromDict(
      opportunityDict: ExplorationOpportunitySummaryBackendDict):
      ExplorationOpportunitySummary {
    return new ExplorationOpportunitySummary(
      opportunityDict.id, opportunityDict.topic_name,
      opportunityDict.story_title, opportunityDict.chapter_title,
      opportunityDict.content_count, opportunityDict.translation_counts,
      opportunityDict.translation_in_review_counts,
      opportunityDict.language_code, opportunityDict.is_pinned);
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
          opportunityType: AppConstants.OPPORTUNITY_TYPE_SKILL
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

  async pinTranslationOpportunity(
      languageCode: string,
      topicName: string,
      explorationId: string
  ): Promise<void> {
    return this.http
      .put<void>(this.UPDATE_PINNED_OPPORTUNITY_HANDLER_URL, {
        language_code: languageCode,
        topic_id: topicName,
        opportunity_id: explorationId
      })
      .toPromise();
  }

  async unpinTranslationOpportunity(
      languageCode: string,
      topicName: string,
  ): Promise<void> {
    return this.http
      .put<void>(this.UPDATE_PINNED_OPPORTUNITY_HANDLER_URL, {
        language_code: languageCode,
        topic_id: topicName,
      })
      .toPromise();
  }

  async fetchTranslationOpportunitiesAsync(
      languageCode: string, topicName: string, cursor: string):
    Promise<TranslationContributionOpportunities> {
    topicName = (
      topicName === AppConstants.TOPIC_SENTINEL_NAME_ALL ? '' : topicName);

    const params = {
      language_code: languageCode,
      topic_name: topicName,
      cursor: cursor
    };

    return this.http.get<TranslationContributionOpportunitiesBackendDict>(
      this.urlInterpolationService.interpolateUrl(
        this.urlTemplate, {
          opportunityType: AppConstants.OPPORTUNITY_TYPE_TRANSLATION
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

  async fetchReviewableTranslationOpportunitiesAsync(
      topicName: string,
      languageCode?: string
  ): Promise<FetchedReviewableTranslationOpportunitiesResponse> {
    const params: {
      topic_name?: string;
      language_code?: string;
    } = {};
    if (
      topicName !== '' &&
      topicName !== AppConstants.TOPIC_SENTINEL_NAME_ALL
    ) {
      params.topic_name = topicName;
    }
    if (languageCode && languageCode !== '') {
      params.language_code = languageCode;
    }
    return this.http.get<ReviewableTranslationOpportunitiesBackendDict>(
      '/getreviewableopportunitieshandler', {
        params
      } as Object).toPromise().then(data => {
      const opportunities = data.opportunities.map(
        dict => this._getExplorationOpportunityFromDict(dict));
      return {
        opportunities: opportunities
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
          '/retrievefeaturedtranslationlanguages').toPromise();

      return response.featured_translation_languages.map(
        backendDict => FeaturedTranslationLanguage
          .createFromBackendDict(backendDict));
    } catch {
      return [];
    }
  }

  async fetchTranslatableTopicNamesAsync():
  Promise<string[]> {
    try {
      const response = await this.http
        .get<TopicNamesBackendDict>('/gettranslatabletopicnames').toPromise();
      // TODO(#15648): Re-enable "All Topics" after fetching latency is fixed.
      // response.topic_names.unshift('All');

      return response.topic_names;
    } catch {
      return [];
    }
  }

  async savePreferredTranslationLanguageAsync(
      languageCode: string
  ): Promise<void> {
    return this.userService.getUserInfoAsync().then(
      (userInfo) => {
        if (userInfo.isLoggedIn()) {
          return this.http.post<void>(
            '/preferredtranslationlanguage',
            {language_code: languageCode}
          ).toPromise().catch((errorResponse) => {
            throw new Error(errorResponse.error.error);
          });
        }
      }
    );
  }

  async getPreferredTranslationLanguageAsync(
  ): Promise<string|null> {
    const emptyResponse = {
      preferred_translation_language_code: null
    };
    return this.userService.getUserInfoAsync().then(
      async(userInfo) => {
        if (userInfo.isLoggedIn()) {
          const res = (
            await this.http.get<PreferredTranslationLanguageBackendDict>(
              '/preferredtranslationlanguage'
            ).toPromise().catch(() => emptyResponse)
          );
          return res.preferred_translation_language_code;
        } else {
          return null;
        }
      }
    );
  }
}

angular.module('oppia').factory(
  'ContributionOpportunitiesBackendApiService',
  downgradeInjectable(ContributionOpportunitiesBackendApiService));
