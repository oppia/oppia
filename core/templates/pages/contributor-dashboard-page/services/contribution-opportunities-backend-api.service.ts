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

import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';

import {
  ExplorationOpportunitySummary,
  ExplorationOpportunitySummaryBackendDict,
  TranslationOpportunityCardInfoBackendDict,
} from 'domain/opportunity/exploration-opportunity-summary.model';
import {
  SkillOpportunity,
  SkillOpportunityBackendDict,
} from 'domain/opportunity/skill-opportunity.model';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {
  FeaturedTranslationLanguage,
  FeaturedTranslationLanguageBackendDict,
} from 'domain/opportunity/featured-translation-language.model';
import {UserService} from 'services/user.service';
import {PlatformFeatureService} from 'services/platform-feature.service';

import {AppConstants} from 'app.constants';
import {ContributorDashboardConstants} from 'pages/contributor-dashboard-page/contributor-dashboard-page.constants';

interface SkillContributionOpportunitiesBackendDict {
  opportunities: SkillOpportunityBackendDict[];
  next_cursor: string;
  more: boolean;
}

interface TranslationContributionOpportunitiesBackendDict {
  opportunities: ExplorationOpportunitySummaryBackendDict[];
  next_cursor: string;
  more: boolean;
}

interface TranslationContributionOpportunitiesBackendDictV2 {
  opportunities: TranslationOpportunityCardInfoBackendDict[];
  next_cursor: string;
  more: boolean;
}

interface ReviewableTranslationOpportunitiesBackendDict {
  opportunities: ExplorationOpportunitySummaryBackendDict[];
}

interface ReviewableTranslationOpportunitiesBackendDictV2 {
  opportunities: TranslationOpportunityCardInfoBackendDict[];
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
  featured_translation_languages: FeaturedTranslationLanguageBackendDict[];
}

// A topic that can be selected in the contributor dashboard's topic filter.
// The ID is what gets tracked and sent to the backend, since topic names can
// change, and the name is only used for display purposes.
export interface TranslatableTopic {
  id: string;
  name: string;
}

export interface TranslatableTopicsPerClassroom {
  classroom: string;
  topics: TranslatableTopic[];
}

interface TranslatableTopicsBackendDict {
  topics: TranslatableTopic[];
}

interface TranslatableTopicsPerClassroomBackendDict {
  topics_per_classroom: TranslatableTopicsPerClassroom[];
}

// The option that represents "all topics" in the topic filter.
export const ALL_TOPICS_OPTION: TranslatableTopic = {
  id: ContributorDashboardConstants.TOPIC_SENTINEL_ID_ALL,
  name: AppConstants.TOPIC_SENTINEL_NAME_ALL,
};

interface PreferredTranslationLanguageBackendDict {
  preferred_translation_language_code: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class ContributionOpportunitiesBackendApiService {
  urlTemplate = '/opportunitiessummaryhandler/<opportunityType>';
  constructor(
    private urlInterpolationService: UrlInterpolationService,
    private http: HttpClient,
    private userService: UserService,
    private platformFeatureService: PlatformFeatureService
  ) {}

  private UPDATE_PINNED_OPPORTUNITY_HANDLER_URL = '/pinned-opportunities';

  async fetchSkillOpportunitiesAsync(
    cursor: string,
    searchQuery: string = ''
  ): Promise<SkillContributionOpportunities> {
    const params: Record<string, string> = {cursor};
    if (searchQuery) {
      params.search_query = searchQuery;
    }

    return this.http
      .get<SkillContributionOpportunitiesBackendDict>(
        this.urlInterpolationService.interpolateUrl(this.urlTemplate, {
          opportunityType: AppConstants.OPPORTUNITY_TYPE_SKILL,
        }),
        {params}
      )
      .toPromise()
      .then(
        data => {
          const opportunities = data.opportunities.map(dict =>
            SkillOpportunity.createFromBackendDict(dict)
          );

          return {
            opportunities: opportunities,
            nextCursor: data.next_cursor,
            more: data.more,
          };
        },
        errorResponse => {
          throw new Error(errorResponse.error.error);
        }
      );
  }

  async pinTranslationOpportunity(
    languageCode: string,
    topicId: string,
    explorationId: string
  ): Promise<void> {
    return this.http
      .put<void>(this.UPDATE_PINNED_OPPORTUNITY_HANDLER_URL, {
        language_code: languageCode,
        topic_id: topicId,
        opportunity_id: explorationId,
      })
      .toPromise();
  }

  async unpinTranslationOpportunity(
    languageCode: string,
    topicId: string
  ): Promise<void> {
    return this.http
      .put<void>(this.UPDATE_PINNED_OPPORTUNITY_HANDLER_URL, {
        language_code: languageCode,
        topic_id: topicId,
      })
      .toPromise();
  }

  async fetchTranslationOpportunitiesAsync(
    languageCode: string,
    topicId: string,
    cursor: string,
    entityType?: string
  ): Promise<TranslationContributionOpportunities> {
    const params: Record<string, string> = {
      language_code: languageCode,
      cursor: cursor,
    };
    if (this.shouldFilterByTopic(topicId)) {
      params.topic_id = topicId;
    }

    if (
      this.platformFeatureService.status.EnableTranslationOppsWithNewOppModels
        .isEnabled
    ) {
      if (this.shouldFilterByEntityType(entityType)) {
        params.entity_type = entityType as string;
      }

      return this.http
        .get<TranslationContributionOpportunitiesBackendDictV2>(
          '/opportunitieshandlerv2',
          {params}
        )
        .toPromise()
        .then(
          data => {
            const opportunities = data.opportunities.map(dict => {
              const summary =
                ExplorationOpportunitySummary.createFromBackendDictV2(dict);
              summary.languageCode = languageCode;
              return summary;
            });

            return {
              opportunities: opportunities,
              nextCursor: data.next_cursor,
              more: data.more,
            };
          },
          errorResponse => {
            throw new Error(errorResponse.error.error);
          }
        );
    }

    return this.http
      .get<TranslationContributionOpportunitiesBackendDict>(
        this.urlInterpolationService.interpolateUrl(this.urlTemplate, {
          opportunityType: AppConstants.OPPORTUNITY_TYPE_TRANSLATION,
        }),
        {params}
      )
      .toPromise()
      .then(
        data => {
          const opportunities = data.opportunities.map(dict =>
            ExplorationOpportunitySummary.createFromBackendDict(dict)
          );

          return {
            opportunities: opportunities,
            nextCursor: data.next_cursor,
            more: data.more,
          };
        },
        errorResponse => {
          throw new Error(errorResponse.error.error);
        }
      );
  }

  /**
   * Returns whether the opportunity request should carry an entity_type
   * parameter. An absent entity type, or the "all" sentinel, both mean that
   * opportunities of every entity type are wanted, which the handlers express
   * by the parameter being omitted.
   */
  private shouldFilterByEntityType(entityType?: string): boolean {
    return (
      entityType !== undefined &&
      entityType !== '' &&
      entityType !== ContributorDashboardConstants.ENTITY_TYPE_SENTINEL_ALL
    );
  }

  /**
   * Returns whether the opportunity request should carry a topic_id
   * parameter. An empty topic ID, or the "all" sentinel, both mean that
   * opportunities from every topic are wanted, which the handlers express by
   * the parameter being omitted.
   */
  private shouldFilterByTopic(topicId: string): boolean {
    return (
      topicId !== '' &&
      topicId !== ContributorDashboardConstants.TOPIC_SENTINEL_ID_ALL
    );
  }

  async fetchReviewableTranslationOpportunitiesAsync(
    topicId: string,
    languageCode?: string,
    entityType?: string
  ): Promise<FetchedReviewableTranslationOpportunitiesResponse> {
    const params: Record<string, string> = {};

    if (this.shouldFilterByTopic(topicId)) {
      params.topic_id = topicId;
    }

    if (languageCode && languageCode !== '') {
      params.language_code = languageCode;
    }

    if (
      this.platformFeatureService.status.EnableTranslationOppsWithNewOppModels
        .isEnabled
    ) {
      if (this.shouldFilterByEntityType(entityType)) {
        params.entity_type = entityType as string;
      }
      return this.http
        .get<ReviewableTranslationOpportunitiesBackendDictV2>(
          '/getreviewableopportunitieshandlerv2',
          {
            params,
          } as Object
        )
        .toPromise()
        .then(
          data => {
            const opportunities = data.opportunities.map(dict => {
              const summary =
                ExplorationOpportunitySummary.createFromBackendDictV2(dict);
              if (languageCode) {
                summary.languageCode = languageCode;
              }
              return summary;
            });
            return {
              opportunities,
            };
          },
          errorResponse => {
            throw new Error(errorResponse.error.error);
          }
        );
    }

    return this.http
      .get<ReviewableTranslationOpportunitiesBackendDict>(
        '/getreviewableopportunitieshandler',
        {
          params,
        } as Object
      )
      .toPromise()
      .then(
        data => {
          const opportunities = data.opportunities.map(dict =>
            ExplorationOpportunitySummary.createFromBackendDict(dict)
          );
          return {
            opportunities,
          };
        },
        errorResponse => {
          throw new Error(errorResponse.error.error);
        }
      );
  }

  async fetchFeaturedTranslationLanguagesAsync(): Promise<
    FeaturedTranslationLanguage[]
  > {
    try {
      const response = await this.http
        .get<FeaturedTranslationLanguagesBackendDict>(
          '/retrievefeaturedtranslationlanguages'
        )
        .toPromise();

      return response.featured_translation_languages.map(backendDict =>
        FeaturedTranslationLanguage.createFromBackendDict(backendDict)
      );
    } catch {
      return [];
    }
  }

  async fetchTranslatableTopicsAsync(): Promise<TranslatableTopic[]> {
    try {
      const response = await this.http
        .get<TranslatableTopicsBackendDict>('/gettranslatabletopicnames')
        .toPromise();

      return [ALL_TOPICS_OPTION, ...response.topics];
    } catch {
      return [];
    }
  }

  async fetchTranslatableTopicsPerClassroomAsync(): Promise<
    TranslatableTopicsPerClassroom[]
  > {
    try {
      const response = await this.http
        .get<TranslatableTopicsPerClassroomBackendDict>(
          '/gettranslatabletopicnamesperclassroom'
        )
        .toPromise();

      const topicsPerClassroom = response.topics_per_classroom.map(
        ({classroom, topics}) => ({
          classroom,
          topics: classroom === '' ? [ALL_TOPICS_OPTION, ...topics] : topics,
        })
      );

      return topicsPerClassroom;
    } catch {
      return [];
    }
  }

  async savePreferredTranslationLanguageAsync(
    languageCode: string
  ): Promise<void> {
    return this.userService.getUserInfoAsync().then(userInfo => {
      if (userInfo.isLoggedIn()) {
        return this.http
          .post<void>('/preferredtranslationlanguage', {
            language_code: languageCode,
          })
          .toPromise()
          .catch(errorResponse => {
            throw new Error(errorResponse.error.error);
          });
      }
    });
  }

  async getPreferredTranslationLanguageAsync(): Promise<string | null> {
    const emptyResponse = {
      preferred_translation_language_code: null,
    };
    return this.userService.getUserInfoAsync().then(async userInfo => {
      if (userInfo.isLoggedIn()) {
        const res = await this.http
          .get<PreferredTranslationLanguageBackendDict>(
            '/preferredtranslationlanguage'
          )
          .toPromise()
          .catch(() => emptyResponse);
        return res.preferred_translation_language_code;
      } else {
        return null;
      }
    });
  }
}
