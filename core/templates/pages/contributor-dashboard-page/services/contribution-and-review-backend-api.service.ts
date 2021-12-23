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
  private urls = {
    SUBMITTED_SUGGESTION_LIST_HANDLER_URL: (
      '/getsubmittedsuggestions/<target_type>/<suggestion_type>'),
    REVIEWABLE_SUGGESTIONS_HANDLER_URL: (
      '/getreviewablesuggestions/<target_type>/<suggestion_type>'),
    SUGGESTION_TO_EXPLORATION_ACTION_HANDLER_URL: (
      '/suggestionactionhandler/exploration/<exp_id>/<suggestion_id>'),
    SUGGESTION_TO_SKILL_ACTION_HANDLER_URL: (
      '/suggestionactionhandler/skill/<skill_id>/<suggestion_id>'),
    UPDATE_TRANSLATION_HANDLER_URL: (
      '/updatetranslationsuggestionhandler/<suggestion_id>'),
    UPDATE_QUESTION_HANDLER_URL: (
      '/updatequestionsuggestionhandler/<suggestion_id>')
  };

  constructor(
    private http: HttpClient,
    private urlInterpolationService: UrlInterpolationService
  ) {}

  async fetchSuggestionsAsync(
      urlName: string, targetType: string, suggestionType: string
  ): Promise<FetchSuggestionsResponse> {
    let url = this.urlInterpolationService.interpolateUrl(
      this.urls[urlName], {
        target_type: targetType,
        suggestion_type: suggestionType
      }
    );
    return this.http.get<FetchSuggestionsResponse>(url).toPromise();
  }

  async resolveToExplorationAsync(
      expId: string, suggestionId: string, data: ResolveToExplorationData
  ): Promise<void> {
    let url = this.urlInterpolationService.interpolateUrl(
      this.urls.SUGGESTION_TO_EXPLORATION_ACTION_HANDLER_URL, {
        exp_id: expId,
        suggestion_id: suggestionId
      }
    );
    return this.http.put<void>(url, data).toPromise();
  }

  async resolveToSkillAsync(
      skillId: string, suggestionId: string, data: ResolveToSkillData
  ): Promise<void> {
    let url = this.urlInterpolationService.interpolateUrl(
      this.urls.SUGGESTION_TO_SKILL_ACTION_HANDLER_URL, {
        skill_id: skillId,
        suggestion_id: suggestionId
      }
    );
    return this.http.put<void>(url, data).toPromise();
  }

  async updateTranslationSuggestionAsync(
      suggestionId: string, data: UpdateTranslationData
  ): Promise<void> {
    let url = this.urlInterpolationService.interpolateUrl(
      this.urls.UPDATE_TRANSLATION_HANDLER_URL, {
        suggestion_id: suggestionId
      }
    );
    return this.http.put<void>(url, data).toPromise();
  }

  async updateQuestionSuggestionAsync(
      suggestionId: string, body: FormData
  ): Promise<void> {
    let url = this.urlInterpolationService.interpolateUrl(
      this.urls.UPDATE_QUESTION_HANDLER_URL, {
        suggestion_id: suggestionId
      }
    );
    return this.http.post<void>(url, body, {
      headers: { 'Content-Type': undefined }
    }).toPromise();
  }
}
