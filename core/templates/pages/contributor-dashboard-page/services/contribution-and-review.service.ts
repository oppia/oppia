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
import { ContributionAndReviewBackendApiService }
  from './contribution-and-review-backend-api.service';
import { SuggestionBackendDict } from 'domain/suggestion/suggestion.model';
import { StateBackendDict } from 'domain/state/StateObjectFactory';
import { ImagesData } from 'services/image-local-storage.service';

export interface OpportunityDict {
  'skill_id': string;
  'skill_description': string;
}

// Encapsulates the state necessary to fetch a particular suggestion from the
// backend.
class SuggestionFetcher {
  // Type of suggestion to fetch.
  type: string;
  // The current offset, i.e. the number of items to skip in the next fetch.
  offset: number;
  // Cache of suggestions.
  suggestionIdToDetails: SuggestionDetailsDict;

  constructor(type: string) {
    this.type = type;
    this.offset = 0;
    this.suggestionIdToDetails = {};
  }
}

interface SuggestionDetailsDict {
  [targetId: string]: {
    suggestion: SuggestionBackendDict;
    details: OpportunityDict;
  };
}

interface FetchSuggestionsResponse {
  suggestionIdToDetails: SuggestionDetailsDict;
  more: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ContributionAndReviewService {
  constructor(
    private contributionAndReviewBackendApiService:
      ContributionAndReviewBackendApiService
  ) {}

  private _userCreatedQuestionFetcher: SuggestionFetcher = (
    new SuggestionFetcher('SUBMITTED_QUESTION_SUGGESTIONS'));

  private _reviewableQuestionFetcher: SuggestionFetcher = (
    new SuggestionFetcher('REVIEWABLE_QUESTION_SUGGESTIONS'));

  private _userCreatedTranslationFetcher: SuggestionFetcher = (
    new SuggestionFetcher('SUBMITTED_TRANSLATION_SUGGESTIONS'));

  private _reviewableTranslationFetcher: SuggestionFetcher = (
    new SuggestionFetcher('REVIEWABLE_TRANSLATION_SUGGESTIONS'));

  private async fetchSuggestionsAsync(
      fetcher: SuggestionFetcher, shouldResetOffset = false
  ): Promise<FetchSuggestionsResponse> {
    if (shouldResetOffset) {
      // Handle the case where we need to fetch starting from the beginning.
      fetcher.offset = 0;
      fetcher.suggestionIdToDetails = {};
    }
    // If fetcher does not have items, fetch 2 pages and return the 1st page.
    if (Object.keys(fetcher.suggestionIdToDetails).length === 0) {
      return (
        this.contributionAndReviewBackendApiService.fetchSuggestionsAsync(
          fetcher.type,
          // Fetch two pages at a time to compute if we have more results.
          AppConstants.OPPORTUNITIES_PAGE_SIZE * 2,
          fetcher.offset
        ).then((responseBody) => {
          const responseSuggestionIdToDetails: SuggestionDetailsDict = {};
          const targetIdToDetails = responseBody.target_id_to_opportunity_dict;
          responseBody.suggestions.forEach((suggestion, i) => {
            const suggestionDetails = {
              suggestion: suggestion,
              details: targetIdToDetails[suggestion.target_id]
            };
            if (i < AppConstants.OPPORTUNITIES_PAGE_SIZE) {
              // Populate the response with the first page.
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
    } else {
      // If fetcher has items, return fetcher items and fetch 1 extra page to
      // refill fetcher cache.
      return (
        this.contributionAndReviewBackendApiService.fetchSuggestionsAsync(
          fetcher.type,
          AppConstants.OPPORTUNITIES_PAGE_SIZE,
          fetcher.offset
        ).then((responseBody) => {
          const responseSuggestionIdToDetails = fetcher.suggestionIdToDetails;
          fetcher.suggestionIdToDetails = {};
          const targetIdToDetails = responseBody.target_id_to_opportunity_dict;
          responseBody.suggestions.forEach((suggestion) => {
            const suggestionDetails = {
              suggestion: suggestion,
              details: targetIdToDetails[suggestion.target_id]
            };
            fetcher.suggestionIdToDetails[
              suggestion.suggestion_id] = suggestionDetails;
          });
          fetcher.offset = responseBody.next_offset;
          return {
            suggestionIdToDetails: responseSuggestionIdToDetails,
            more: Object.keys(fetcher.suggestionIdToDetails).length > 0
          };
        })
      );
    }
  }

  async getUserCreatedQuestionSuggestionsAsync(shouldResetOffset = true):
  Promise<FetchSuggestionsResponse> {
    return this.fetchSuggestionsAsync(
      this._userCreatedQuestionFetcher, shouldResetOffset);
  }

  async getReviewableQuestionSuggestionsAsync(shouldResetOffset = true):
  Promise<FetchSuggestionsResponse> {
    return this.fetchSuggestionsAsync(
      this._reviewableQuestionFetcher, shouldResetOffset);
  }

  async getUserCreatedTranslationSuggestionsAsync(shouldResetOffset = true):
  Promise<FetchSuggestionsResponse> {
    return this.fetchSuggestionsAsync(
      this._userCreatedTranslationFetcher, shouldResetOffset);
  }

  async getReviewableTranslationSuggestionsAsync(shouldResetOffset = true):
  Promise<FetchSuggestionsResponse> {
    return this.fetchSuggestionsAsync(
      this._reviewableTranslationFetcher, shouldResetOffset);
  }

  reviewExplorationSuggestion(
      targetId: string, suggestionId: string, action: string,
      reviewMessage: string, commitMessage: string,
      onSuccess: (suggestionId: string) => void,
      onFailure: (error) => void
  ): Promise<void> {
    const requestBody = {
      action: action,
      review_message: reviewMessage,
      commit_message: (
        action === AppConstants.ACTION_ACCEPT_SUGGESTION ?
        commitMessage : null
      )
    };

    return this.contributionAndReviewBackendApiService
      .reviewExplorationSuggestionAsync(
        targetId, suggestionId, requestBody
      ).then(() => {
        onSuccess(suggestionId);
      }, (error) => {
        onFailure && onFailure(error);
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
      onFailure: (error) => void
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
      suggestionId: string, skillDifficulty: string,
      questionStateData: StateBackendDict, imagesData: ImagesData[],
      onSuccess: (suggestionId: string) => void,
      onFailure: (suggestionId: string) => void
  ): Promise<void> {
    const payload = {
      skill_difficulty: skillDifficulty,
      question_state_data: questionStateData
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
}

angular.module('oppia').factory('ContributionAndReviewService',
  downgradeInjectable(ContributionAndReviewService));
