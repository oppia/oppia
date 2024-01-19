// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service for fetching and resolving suggestions.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';
import { AppConstants } from 'app.constants';
import { ContributionAndReviewBackendApiService, ContributorCertificateResponse }
  from './contribution-and-review-backend-api.service';
import { SuggestionBackendDict } from 'domain/suggestion/suggestion.model';
import { StateBackendDict } from 'domain/state/StateObjectFactory';
import { ImagesData } from 'services/image-local-storage.service';
import { ReadOnlyExplorationBackendApiService }
  from 'domain/exploration/read-only-exploration-backend-api.service';
import { ComputeGraphService } from 'services/compute-graph.service';
import { States } from 'domain/exploration/StatesObjectFactory';
import { ExplorationObjectFactory, Exploration}
  from 'domain/exploration/ExplorationObjectFactory';

export interface OpportunityDict {
  'skill_id': string;
  'skill_description': string;
}

// Encapsulates the state necessary to fetch a particular suggestion from the
// backend.
class SuggestionFetcher {
  // Type of suggestion to fetch.
  type: string;
  // The current offset, i.e. the number of items to skip (from the beginning of
  // all matching results) in the next fetch.
  offset: number;
  sortKey: string;
  // Cache of suggestions.
  suggestionIdToDetails: SuggestionDetailsDict;

  constructor(type: string) {
    this.type = type;
    this.offset = 0;
    this.sortKey = '';
    this.suggestionIdToDetails = {};
  }
}

interface SuggestionDetailsDict {
  [targetId: string]: {
    suggestion: SuggestionBackendDict;
    details: OpportunityDict;
  };
}

// Represents a client-facing response to a fetch suggestion query.
export interface FetchSuggestionsResponse {
  // A dict mapping suggestion ID to suggestion metadata.
  suggestionIdToDetails: SuggestionDetailsDict;
  // Whether there are more results to return after the last query.
  more: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ContributionAndReviewService {
  // This property is initialized using async methods
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  private activeTabType!: string;
  private activeSuggestionType!: string;

  constructor(
    private contributionAndReviewBackendApiService:
      ContributionAndReviewBackendApiService,
      private readOnlyExplorationBackendApiService:
      ReadOnlyExplorationBackendApiService,
    private computeGraphService:
      ComputeGraphService,
    private explorationObjectFactory:
      ExplorationObjectFactory
  ) {}

  getActiveTabType(): string {
    return this.activeTabType;
  }

  setActiveTabType(activeTabType: string): void {
    this.activeTabType = activeTabType;
  }

  getActiveSuggestionType(): string {
    return this.activeSuggestionType;
  }

  setActiveSuggestionType(activeSuggestionType: string): void {
    this.activeSuggestionType = activeSuggestionType;
  }

  private userCreatedQuestionFetcher: SuggestionFetcher = (
    new SuggestionFetcher('SUBMITTED_QUESTION_SUGGESTIONS'));

  private reviewableQuestionFetcher: SuggestionFetcher = (
    new SuggestionFetcher('REVIEWABLE_QUESTION_SUGGESTIONS'));

  private userCreatedTranslationFetcher: SuggestionFetcher = (
    new SuggestionFetcher('SUBMITTED_TRANSLATION_SUGGESTIONS'));

  private reviewableTranslationFetcher: SuggestionFetcher = (
    new SuggestionFetcher('REVIEWABLE_TRANSLATION_SUGGESTIONS'));

  /**
   * Fetches suggestions from the backend.
   *
   * @param {SuggestionFetcher} fetcher - The fetcher for a particular
   *   suggestion type.
   * @param {boolean} shouldResetOffset - Whether to reset the input fetcher's
   *   offset to 0 and clear the fetcher's cache. Set this to true to fetch
   *   results starting from the beginning of all results matching the query.
   * @returns {Promise<FetchSuggestionsResponse>}
   */
  private async fetchSuggestionsAsync(
      fetcher: SuggestionFetcher,
      shouldResetOffset: boolean,
      explorationId: string | null,
      topicName: string | null,
  ): Promise<FetchSuggestionsResponse> {
    if (shouldResetOffset) {
      // Handle the case where we need to fetch starting from the beginning.
      fetcher.offset = 0;
      fetcher.suggestionIdToDetails = {};
    }
    const currentCacheSize: number = Object.keys(
      fetcher.suggestionIdToDetails).length;
    return (
      this.contributionAndReviewBackendApiService.fetchSuggestionsAsync(
        fetcher.type,
        // Fetch up to two pages at a time to compute if we have more results.
        // The first page of results is returned to the caller and the second
        // page is cached.
        (AppConstants.OPPORTUNITIES_PAGE_SIZE * 2) - currentCacheSize,
        fetcher.offset,
        fetcher.sortKey,
        explorationId,
        topicName,
      ).then((responseBody) => {
        const responseSuggestionIdToDetails = fetcher.suggestionIdToDetails;
        fetcher.suggestionIdToDetails = {};
        const targetIdToDetails = responseBody.target_id_to_opportunity_dict;
        responseBody.suggestions.forEach((suggestion) => {
          const suggestionDetails = {
            suggestion: suggestion,
            details: targetIdToDetails[suggestion.target_id]
          };
          const responseSize: number = Object.keys(
            responseSuggestionIdToDetails).length;
          if (responseSize < AppConstants.OPPORTUNITIES_PAGE_SIZE) {
            // Populate the response with up to a page's worth of results.
            responseSuggestionIdToDetails[
              suggestion.suggestion_id] = suggestionDetails;
          } else {
            // Cache the 2nd page.
            fetcher.suggestionIdToDetails[
              suggestion.suggestion_id] = suggestionDetails;
          }
        });
        fetcher.offset = responseBody.next_offset;
        return {
          suggestionIdToDetails: responseSuggestionIdToDetails,
          more: Object.keys(fetcher.suggestionIdToDetails).length > 0
        };
      })
    );
  }

  async fetchTranslationSuggestionsAsync(
      explorationId: string
  ): Promise<FetchSuggestionsResponse> {
    const explorationBackendResponse = await this.
      readOnlyExplorationBackendApiService.fetchExplorationAsync(
        explorationId, null);
    return (
      this.contributionAndReviewBackendApiService.
        fetchSuggestionsAsync(
          'REVIEWABLE_TRANSLATION_SUGGESTIONS',
          null,
          0,
          AppConstants.SUGGESTIONS_SORT_KEY_DATE,
          explorationId,
          null,
        ).then((fetchSuggestionsResponse) => {
          const exploration: Exploration = this.explorationObjectFactory.
            createFromExplorationBackendResponse(
              explorationBackendResponse);
          const sortedTranslationSuggestions = (
            this.sortTranslationSuggestionsByState(
              fetchSuggestionsResponse.suggestions,
              exploration.getStates(),
              exploration.initStateName));
          const responseSuggestionIdToDetails: SuggestionDetailsDict = {};
          sortedTranslationSuggestions.forEach((suggestion) => {
            const suggestionDetails = {
              suggestion: suggestion,
              details: (
                fetchSuggestionsResponse.target_id_to_opportunity_dict[
                  suggestion.target_id])
            };
            responseSuggestionIdToDetails[
              suggestion.suggestion_id] = suggestionDetails;
          });
          return {
            suggestionIdToDetails: responseSuggestionIdToDetails,
            more: false
          };
        })
    );
  }

  sortTranslationSuggestionsByState(
      translationSuggestions: SuggestionBackendDict[],
      states: States,
      initStateName: string | null
  ): SuggestionBackendDict[] {
    if (!initStateName) {
      return translationSuggestions;
    }

    const stateNamesInOrder = this.computeGraphService.
      computeBfsTraversalOfStates(
        initStateName,
        states,
        initStateName
      );
    const translationSuggestionsByState = (
      ContributionAndReviewService
        .groupTranslationSuggestionsByState(translationSuggestions));
    const sortedTranslationCards: SuggestionBackendDict[] = [];

    for (const stateName of stateNamesInOrder) {
      const cardsForState = (
        translationSuggestionsByState.get(stateName) || []);
      cardsForState.sort(
        ContributionAndReviewService.compareTranslationSuggestions);
      sortedTranslationCards.push(...cardsForState);
    }
    return sortedTranslationCards;
  }

  private static groupTranslationSuggestionsByState(
      translationSuggestions: SuggestionBackendDict[]):
      Map<string, SuggestionBackendDict[]> {
    const translationSuggestionsByState = new Map<
    string, SuggestionBackendDict[]>();

    for (const translationSuggestion of translationSuggestions) {
      const stateName = translationSuggestion.change_cmd.state_name;
      const suggestionsForState = translationSuggestionsByState.get(
        stateName) || [];
      suggestionsForState.push(translationSuggestion);
      translationSuggestionsByState.set(stateName, suggestionsForState);
    }
    return translationSuggestionsByState;
  }

  // Compares translation suggestions based on type and index.
  private static compareTranslationSuggestions(
      cardA: SuggestionBackendDict,
      cardB: SuggestionBackendDict
  ): number {
    const cardATypeOrder = ContributionAndReviewService.
      getTranslationContentTypeOrder(cardA.change_cmd.content_id);
    const cardBTypeOrder = ContributionAndReviewService
      .getTranslationContentTypeOrder(cardB.change_cmd.content_id);

    if (cardATypeOrder !== cardBTypeOrder) {
      return cardATypeOrder - cardBTypeOrder;
    } else {
      const cardAIndex = ContributionAndReviewService
        .getTranslationContentIndex(cardA.change_cmd.content_id);
      const cardBIndex = ContributionAndReviewService
        .getTranslationContentIndex(cardB.change_cmd.content_id);
      return cardAIndex - cardBIndex;
    }
  }

  // Returns the type order for a given content ID.
  private static getTranslationContentTypeOrder(contentId: string): number {
    const contentOrders: Map<string, number> = new Map([
      ['content', 0],
      ['interaction', 1],
      ['feedback', 2],
      ['default', 3],
      ['hints', 4],
      ['solution', 5]
    ]);
    const type = contentId.split('_')[0];
    return contentOrders.get(type) ?? Number.MAX_SAFE_INTEGER;
  }

  // Returns index for a given content ID.
  private static getTranslationContentIndex(contentId: string): number {
    const index = parseInt(contentId.split('_')[1]);
    return isNaN(index) ? Number.MAX_SAFE_INTEGER : index;
  }

  async getUserCreatedQuestionSuggestionsAsync(
      shouldResetOffset: boolean = true,
      sortKey: string
  ): Promise<FetchSuggestionsResponse> {
    this.userCreatedQuestionFetcher.sortKey = sortKey;
    return this.fetchSuggestionsAsync(
      this.userCreatedQuestionFetcher,
      shouldResetOffset, null, null);
  }

  async getReviewableQuestionSuggestionsAsync(
      shouldResetOffset: boolean = true,
      sortKey: string,
      topicName: string | null,
  ): Promise<FetchSuggestionsResponse> {
    this.reviewableQuestionFetcher.sortKey = sortKey;
    return this.fetchSuggestionsAsync(
      this.reviewableQuestionFetcher,
      shouldResetOffset, null,
      topicName);
  }

  async getUserCreatedTranslationSuggestionsAsync(
      shouldResetOffset: boolean = true,
      sortKey: string
  ): Promise<FetchSuggestionsResponse> {
    this.userCreatedTranslationFetcher.sortKey = sortKey;
    return this.fetchSuggestionsAsync(
      this.userCreatedTranslationFetcher,
      shouldResetOffset, null, null);
  }

  async getReviewableTranslationSuggestionsAsync(
      shouldResetOffset: boolean = true,
      sortKey: string,
      explorationId?: string
  ): Promise<FetchSuggestionsResponse> {
    this.reviewableTranslationFetcher.sortKey = sortKey;
    if (explorationId) {
      return this.fetchTranslationSuggestionsAsync(
        explorationId);
    }
    return this.fetchSuggestionsAsync(
      this.reviewableTranslationFetcher,
      shouldResetOffset, null, null);
  }

  reviewExplorationSuggestion(
      targetId: string, suggestionId: string, action: string,
      reviewMessage: string, commitMessage: string | null,
      onSuccess: (suggestionId: string) => void,
      onFailure: (errorMessage: string) => void
  ): Promise<void> {
    const requestBody = {
      action: action,
      review_message: reviewMessage,
      commit_message: commitMessage
    };

    return this.contributionAndReviewBackendApiService
      .reviewExplorationSuggestionAsync(
        targetId, suggestionId, requestBody
      ).then(() => {
        onSuccess(suggestionId);
      }, (errorResponse) => {
        onFailure && onFailure(errorResponse.error.error);
      });
  }

  reviewSkillSuggestion(
      targetId: string, suggestionId: string, action: string,
      reviewMessage: string, skillDifficulty: string,
      onSuccess: (suggestionId: string) => void,
      onFailure: () => void
  ): Promise<void> {
    const requestBody = {
      action: action,
      review_message: reviewMessage,
      skill_difficulty: skillDifficulty
    };

    return this.contributionAndReviewBackendApiService
      .reviewSkillSuggestionAsync(
        targetId, suggestionId, requestBody
      ).then(() => {
        onSuccess(suggestionId);
      }, () => {
        onFailure && onFailure();
      });
  }

  async updateTranslationSuggestionAsync(
      suggestionId: string, translationHtml: string,
      onSuccess: () => void,
      onFailure: (error: Error) => void
  ): Promise<void> {
    const requestBody = {
      translation_html: translationHtml
    };

    return this.contributionAndReviewBackendApiService
      .updateTranslationSuggestionAsync(
        suggestionId, requestBody
      ).then(() => {
        onSuccess();
      }, (error) => onFailure && onFailure(error));
  }

  async updateQuestionSuggestionAsync(
      suggestionId: string, skillDifficulty: number,
      questionStateData: StateBackendDict, nextContentIdIndex: number,
      imagesData: ImagesData[],
      onSuccess: (suggestionId: string) => void,
      onFailure: (suggestionId: string) => void
  ): Promise<void> {
    const payload = {
      skill_difficulty: skillDifficulty,
      question_state_data: questionStateData,
      next_content_id_index: nextContentIdIndex
    };
    const requestBody = new FormData();
    requestBody.append('payload', JSON.stringify(payload));
    imagesData.forEach(obj => {
      if (obj.imageBlob !== null) {
        requestBody.append(obj.filename, obj.imageBlob);
      }
    });

    return this.contributionAndReviewBackendApiService
      .updateQuestionSuggestionAsync(
        suggestionId, requestBody
      ).then(() => {
        onSuccess(suggestionId);
      }, () => onFailure && onFailure(suggestionId));
  }

  async downloadContributorCertificateAsync(
      username: string,
      suggestionType: string,
      languageCode: string | null,
      fromDate: string,
      toDate: string
  ): Promise<ContributorCertificateResponse> {
    return this.contributionAndReviewBackendApiService
      .downloadContributorCertificateAsync(
        username, suggestionType, languageCode, fromDate, toDate);
  }
}

angular.module('oppia').factory('ContributionAndReviewService',
  downgradeInjectable(ContributionAndReviewService));
