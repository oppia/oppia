// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Backend api service for fetching and resolving suggestions.
 */

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FetchSuggestionsResponse } from './contribution-and-review.service';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';

interface ResolveToExplorationData {
  action: string;
  'review_message': string;
  'commit_message': string;
}

interface ResolveToSkillData {
  action: string;
  'review_message': string;
  'skill_difficulty': string;
}

interface UpdateTranslationData {
  'translation_html': string;
}

@Injectable({
  providedIn: 'root',
})
export class ContributionAndReviewBackendApiService {
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

  private _SUBMITTED_QUESTION_SUGGESTIONS = (
    'SUBMITTED_QUESTION_SUGGESTIONS');
  private _REVIEWABLE_QUESTION_SUGGESTIONS = (
    'REVIEWABLE_QUESTION_SUGGESTIONS');
  private _SUBMITTED_TRANSLATION_SUGGESTIONS = (
    'SUBMITTED_TRANSLATION_SUGGESTIONS');
  private _REVIEWABLE_TRANSLATION_SUGGESTIONS = (
    'REVIEWABLE_TRANSLATION_SUGGESTIONS');

  constructor(
    private http: HttpClient,
    private urlInterpolationService: UrlInterpolationService
  ) {}

  async fetchSuggestionsAsync(
      fetchType: string
  ): Promise<FetchSuggestionsResponse> {
    if (fetchType === this._SUBMITTED_QUESTION_SUGGESTIONS) {
      return this.fetchSubmittedSuggestionsAsync('skill', 'add_question');
    }
    if (fetchType === this._SUBMITTED_TRANSLATION_SUGGESTIONS) {
      return this.fetchSubmittedSuggestionsAsync(
        'exploration', 'translate_content');
    }
    if (fetchType === this._REVIEWABLE_QUESTION_SUGGESTIONS) {
      return this.fetchReviewableSuggestionsAsync('skill', 'add_question');
    }
    if (fetchType === this._REVIEWABLE_TRANSLATION_SUGGESTIONS) {
      return this.fetchReviewableSuggestionsAsync(
        'exploration', 'translate_content');
    }
  }

  async fetchSubmittedSuggestionsAsync(
      targetType: string,
      suggestionType: string
  ): Promise<FetchSuggestionsResponse> {
    let url = this.urlInterpolationService.interpolateUrl(
      this._SUBMITTED_SUGGESTION_LIST_HANDLER_URL, {
        target_type: targetType,
        suggestion_type: suggestionType
      }
    );
    return this.http.get<FetchSuggestionsResponse>(url).toPromise();
  }

  async fetchReviewableSuggestionsAsync(
      targetType: string,
      suggestionType: string
  ): Promise<FetchSuggestionsResponse> {
    let url = this.urlInterpolationService.interpolateUrl(
      this._REVIEWABLE_SUGGESTIONS_HANDLER_URL, {
        target_type: targetType,
        suggestion_type: suggestionType
      }
    );
    return this.http.get<FetchSuggestionsResponse>(url).toPromise();
  }

  async reviewExplorationSuggestionAsync(
      expId: string,
      suggestionId: string,
      requestBody: ResolveToExplorationData
  ): Promise<void> {
    let url = this.urlInterpolationService.interpolateUrl(
      this._SUGGESTION_TO_EXPLORATION_ACTION_HANDLER_URL, {
        exp_id: expId,
        suggestion_id: suggestionId
      }
    );
    return this.http.put<void>(url, requestBody).toPromise();
  }

  async reviewSkillSuggestionAsync(
      skillId: string,
      suggestionId: string,
      requestBody: ResolveToSkillData
  ): Promise<void> {
    let url = this.urlInterpolationService.interpolateUrl(
      this._SUGGESTION_TO_SKILL_ACTION_HANDLER_URL, {
        skill_id: skillId,
        suggestion_id: suggestionId
      }
    );
    return this.http.put<void>(url, requestBody).toPromise();
  }

  async updateTranslationSuggestionAsync(
      suggestionId: string, requestBody: UpdateTranslationData
  ): Promise<void> {
    let url = this.urlInterpolationService.interpolateUrl(
      this._UPDATE_TRANSLATION_HANDLER_URL, {
        suggestion_id: suggestionId
      }
    );
    return this.http.put<void>(url, requestBody).toPromise();
  }

  async updateQuestionSuggestionAsync(
      suggestionId: string, requestBody: FormData
  ): Promise<void> {
    let url = this.urlInterpolationService.interpolateUrl(
      this._UPDATE_QUESTION_HANDLER_URL, {
        suggestion_id: suggestionId
      }
    );
    return this.http.post<void>(url, requestBody).toPromise();
  }
}
