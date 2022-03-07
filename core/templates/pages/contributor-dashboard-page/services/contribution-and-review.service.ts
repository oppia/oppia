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
import { EventEmitter, Injectable } from '@angular/core';
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

interface FetchSuggestionsResponse {
  [targetId: string]: {
    suggestion: SuggestionBackendDict;
    details: OpportunityDict;
  };
}

@Injectable({
  providedIn: 'root',
})
export class ContributionAndReviewService {
  private activeTabType: string = null;
  private activeSuggestionType: string = null;

  constructor(
    private contributionAndReviewBackendApiService:
      ContributionAndReviewBackendApiService
  ) {}

  getActiveTabType(): string {
    return this.activeTabType;
  }

  setActiveTabType(activeTabType): void {
    this.activeTabType = activeTabType;
  }

  getActiveSuggestionType(): string {
    return this.activeSuggestionType;
  }

  setActiveSuggestionType(activeSuggestionType): void {
    this.activeSuggestionType = activeSuggestionType;
  }

  private async fetchSuggestionsAsync(
      fetchType: string, topicName: string
  ): Promise<FetchSuggestionsResponse> {
    return (
      this.contributionAndReviewBackendApiService.fetchSuggestionsAsync(
        fetchType, topicName
      ).then((responseBody) => {
        const suggestionIdToSuggestions: FetchSuggestionsResponse = {};
        const targetIdToDetails = responseBody.target_id_to_opportunity_dict;
        responseBody.suggestions.forEach((suggestion) => {
          suggestionIdToSuggestions[suggestion.suggestion_id] = {
            suggestion: suggestion,
            details: targetIdToDetails[suggestion.target_id]
          };
        });
        return suggestionIdToSuggestions;
      })
    );
  }

  async getUserCreatedQuestionSuggestionsAsync(topicName: string):
  Promise<FetchSuggestionsResponse> {
    return this.fetchSuggestionsAsync(
      'SUBMITTED_QUESTION_SUGGESTIONS', topicName);
  }

  async getReviewableQuestionSuggestionsAsync(topicName: string):
  Promise<FetchSuggestionsResponse> {
    return this.fetchSuggestionsAsync(
      'REVIEWABLE_QUESTION_SUGGESTIONS', topicName);
  }

  async getUserCreatedTranslationSuggestionsAsync(topicName: string):
  Promise<FetchSuggestionsResponse> {
    return this.fetchSuggestionsAsync(
      'SUBMITTED_TRANSLATION_SUGGESTIONS', topicName);
  }

  async getReviewableTranslationSuggestionsAsync(topicName: string):
  Promise<FetchSuggestionsResponse> {
    return this.fetchSuggestionsAsync(
      'REVIEWABLE_TRANSLATION_SUGGESTIONS', topicName);
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
