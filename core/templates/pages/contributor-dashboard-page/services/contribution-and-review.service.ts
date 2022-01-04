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

export interface FetchSuggestionsResponse {
  'target_id_to_opportunity_dict': {
    [propName: string]: OpportunityDict;
  };
  suggestions: SuggestionBackendDict[];
}

interface FetchSuggestionsReturn {
  [propName: string]: {
    suggestion: SuggestionBackendDict;
    details: OpportunityDict;
  };
}

@Injectable({
  providedIn: 'root',
})
export class ContributionAndReviewService {
  constructor(
    private contributionAndReviewBackendApiService:
      ContributionAndReviewBackendApiService
  ) {}

  private async _fetchSuggestionsAsync(
      url: string, targetType: string, suggestionType: string
  ): Promise<FetchSuggestionsReturn> {
    return (
      this.contributionAndReviewBackendApiService.fetchSuggestionsAsync(
        url, targetType, suggestionType
      ).then((data) => {
        let suggestionIdToSuggestions: FetchSuggestionsReturn = {};
        let targetIdToDetails = data.target_id_to_opportunity_dict;
        data.suggestions.forEach((suggestion) => {
          suggestionIdToSuggestions[suggestion.suggestion_id] = {
            suggestion: suggestion,
            details: targetIdToDetails[suggestion.target_id]
          };
        });
        return suggestionIdToSuggestions;
      })
    );
  }

  async getUserCreatedQuestionSuggestionsAsync():
  Promise<FetchSuggestionsReturn> {
    return this._fetchSuggestionsAsync(
      '_SUBMITTED_SUGGESTION_LIST_HANDLER_URL', 'skill', 'add_question'
    );
  }

  async getReviewableQuestionSuggestionsAsync():
  Promise<FetchSuggestionsReturn> {
    return this._fetchSuggestionsAsync(
      '_REVIEWABLE_SUGGESTIONS_HANDLER_URL', 'skill', 'add_question'
    );
  }

  async getUserCreatedTranslationSuggestionsAsync():
  Promise<FetchSuggestionsReturn> {
    return this._fetchSuggestionsAsync(
      '_SUBMITTED_SUGGESTION_LIST_HANDLER_URL',
      'exploration', 'translate_content'
    );
  }

  async getReviewableTranslationSuggestionsAsync():
    Promise<FetchSuggestionsReturn> {
    return this._fetchSuggestionsAsync(
      '_REVIEWABLE_SUGGESTIONS_HANDLER_URL', 'exploration', 'translate_content'
    );
  }

  resolveSuggestionToExploration(
      targetId: string, suggestionId: string, action: string,
      reviewMessage: string, commitMessage: string,
      onSuccess: (suggestionId: string) => void,
      onFailure: (error) => void
  ): Promise<void> {
    let data = {
      action: action,
      review_message: reviewMessage,
      commit_message: (
        action === AppConstants.ACTION_ACCEPT_SUGGESTION ?
        commitMessage : null
      )
    };

    return this.contributionAndReviewBackendApiService
      .resolveToExplorationAsync(
        targetId, suggestionId, data
      ).then(() => {
        onSuccess(suggestionId);
      }, (error) => {
        onFailure && onFailure(error);
      });
  }

  resolveSuggestiontoSkill(
      targetId: string, suggestionId: string, action: string,
      reviewMessage: string, skillDifficulty: string,
      onSuccess: (suggestionId: string) => void,
      onFailure: () => void
  ): Promise<void> {
    let data = {
      action: action,
      review_message: reviewMessage,
      skill_difficulty: skillDifficulty
    };

    return this.contributionAndReviewBackendApiService.resolveToSkillAsync(
      targetId, suggestionId, data
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
    let data = {
      translation_html: translationHtml
    };

    return this.contributionAndReviewBackendApiService
      .updateTranslationSuggestionAsync(
        suggestionId, data
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
    const body = new FormData();
    body.append('payload', JSON.stringify(payload));
    imagesData.forEach(obj => {
      if (obj.imageBlob !== null) {
        body.append(obj.filename, obj.imageBlob);
      }
    });

    return this.contributionAndReviewBackendApiService
      .updateQuestionSuggestionAsync(
        suggestionId, body
      ).then(() => {
        onSuccess(suggestionId);
      }, () => onFailure && onFailure(suggestionId));
  }
}

angular.module('oppia').factory('ContributionAndReviewService',
  downgradeInjectable(ContributionAndReviewService));
