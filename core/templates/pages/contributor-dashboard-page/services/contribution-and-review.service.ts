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
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
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
  private _SUBMITTED_SUGGESTION_LIST_HANDLER_URL = (
    '/getsubmittedsuggestions/<target_type>/<suggestion_type>');
  private _REVIEWABLE_SUGGESTIONS_HANDLER_URL = (
    '/getreviewablesuggestions/<target_type>/<suggestion_type>');
  private _SUGGESTION_TO_EXPLORATION_ACTION_HANDLER_URL = (
    '/suggestionactionhandler/exploration/<exp_id>/<suggestion_id>');
  private _SUGGESTION_TO_SKILL_ACTION_HANDLER_URL = (
    '/suggestionactionhandler/skill/<skill_id>/<suggestion_id>');
  private _UPDATE_TRANSLATION_HANDLER_URL = (
    '/updatetranslationsuggestionhandler/<suggestion_id>');
  private _UPDATE_QUESTION_HANDLER_URL = (
    '/updatequestionsuggestionhandler/<suggestion_id>');

  constructor(
    private carbas: ContributionAndReviewBackendApiService,
    private urlInterpolationService: UrlInterpolationService
  ) {}

  private async _fetchSuggestionsAsync(
      url: string): Promise<FetchSuggestionsReturn> {
    return (
      this.carbas.fetchSuggestions(url).then((data) => {
        var suggestionIdToSuggestions: FetchSuggestionsReturn = {};
        var targetIdToDetails = data.target_id_to_opportunity_dict;
        data.suggestions.forEach(function(suggestion) {
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
    let url = this.urlInterpolationService.interpolateUrl(
      this._SUBMITTED_SUGGESTION_LIST_HANDLER_URL, {
        target_type: 'skill',
        suggestion_type: 'add_question'
      });
    return this._fetchSuggestionsAsync(url);
  }

  async getReviewableQuestionSuggestionsAsync():
  Promise<FetchSuggestionsReturn> {
    var url = this.urlInterpolationService.interpolateUrl(
      this._REVIEWABLE_SUGGESTIONS_HANDLER_URL, {
        target_type: 'skill',
        suggestion_type: 'add_question'
      });
    return this._fetchSuggestionsAsync(url);
  }

  async getUserCreatedTranslationSuggestionsAsync():
  Promise<FetchSuggestionsReturn> {
    var url = this.urlInterpolationService.interpolateUrl(
      this._SUBMITTED_SUGGESTION_LIST_HANDLER_URL, {
        target_type: 'exploration',
        suggestion_type: 'translate_content'
      });
    return this._fetchSuggestionsAsync(url);
  }

  async getReviewableTranslationSuggestionsAsync():
    Promise<FetchSuggestionsReturn> {
    var url = this.urlInterpolationService.interpolateUrl(
      this._REVIEWABLE_SUGGESTIONS_HANDLER_URL, {
        target_type: 'exploration',
        suggestion_type: 'translate_content'
      });
    return this._fetchSuggestionsAsync(url);
  }

  resolveSuggestionToExploration(
      targetId: string, suggestionId: string, action: string,
      reviewMessage: string, commitMessage: string,
      onSuccess: (suggestionId: string) => void,
      onFailure: (error) => void
  ): Promise<void> {
    let url = this.urlInterpolationService.interpolateUrl(
      this._SUGGESTION_TO_EXPLORATION_ACTION_HANDLER_URL, {
        exp_id: targetId,
        suggestion_id: suggestionId
      });
    let data = {
      action: action,
      review_message: reviewMessage,
      commit_message: (
        action === AppConstants.ACTION_ACCEPT_SUGGESTION ?
        commitMessage : null
      )
    };

    return this.carbas.resolveToExploration(url, data).then(() => {
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
    let url = this.urlInterpolationService.interpolateUrl(
      this._SUGGESTION_TO_SKILL_ACTION_HANDLER_URL, {
        skill_id: targetId,
        suggestion_id: suggestionId
      });
    let data = {
      action: action,
      review_message: reviewMessage,
      skill_difficulty: skillDifficulty
    };

    return this.carbas.resolveToSkill(url, data).then(() => {
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
    let url = this.urlInterpolationService.interpolateUrl(
      this._UPDATE_TRANSLATION_HANDLER_URL, {
        suggestion_id: suggestionId
      });
    let data = {
      translation_html: translationHtml
    };

    return this.carbas.updateTranslationSuggestion(url, data).then(() => {
      onSuccess();
    }, (error) => onFailure && onFailure(error));
  }

  async updateQuestionSuggestionAsync(
      suggestionId: string, skillDifficulty: string,
      questionStateData: StateBackendDict, imagesData: ImagesData[],
      onSuccess: (suggestionId: string) => void,
      onFailure: (suggestionId: string) => void
  ): Promise<void> {
    let url = this.urlInterpolationService.interpolateUrl(
      this._UPDATE_QUESTION_HANDLER_URL, {
        suggestion_id: suggestionId
      });
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

    return this.carbas.updateQuestionSuggestion(url, body).then(() => {
      onSuccess(suggestionId);
    }, () => onFailure && onFailure(suggestionId));
  }
}

angular.module('oppia').factory(
  'ContributionAndReviewService',
  downgradeInjectable(ContributionAndReviewService)
);
