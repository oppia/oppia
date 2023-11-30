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
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { OpportunityDict } from './contribution-and-review.service';
import { SuggestionBackendDict } from 'domain/suggestion/suggestion.model';

interface FetchSuggestionsResponse {
  'target_id_to_opportunity_dict': {
    [targetId: string]: OpportunityDict;
  };
  suggestions: SuggestionBackendDict[];
  next_offset: number;
}

export interface ContributorCertificateResponse {
  'from_date': string;
  'to_date': string;
  'contribution_hours': number;
  'team_lead': string;
  'language': string | null;
}

interface ReviewExplorationSuggestionRequestBody {
  action: string;
  'review_message': string;
  'commit_message': string | null;
}

interface ReviewSkillSuggestionRequestBody {
  action: string;
  'review_message': string;
  'skill_difficulty': string;
}

interface UpdateTranslationRequestBody {
  'translation_html': string;
}

@Injectable({
  providedIn: 'root',
})
export class ContributionAndReviewBackendApiService {
  private SUBMITTED_SUGGESTION_LIST_HANDLER_URL = (
    '/getsubmittedsuggestions/<target_type>/<suggestion_type>');

  private REVIEWABLE_SUGGESTIONS_HANDLER_URL = (
    '/getreviewablesuggestions/<target_type>/<suggestion_type>');

  private SUGGESTION_TO_EXPLORATION_ACTION_HANDLER_URL = (
    '/suggestionactionhandler/exploration/<exp_id>/<suggestion_id>');

  private SUGGESTION_TO_SKILL_ACTION_HANDLER_URL = (
    '/suggestionactionhandler/skill/<skill_id>/<suggestion_id>');

  private UPDATE_TRANSLATION_HANDLER_URL = (
    '/updatetranslationsuggestionhandler/<suggestion_id>');

  private UPDATE_QUESTION_HANDLER_URL = (
    '/updatequestionsuggestionhandler/<suggestion_id>');

  private CONTRIBUTOR_CERTIFICATE_HANDLER_URL = (
    '/contributorcertificate/<username>/<suggestion_type>');

  private SUBMITTED_QUESTION_SUGGESTIONS = (
    'SUBMITTED_QUESTION_SUGGESTIONS');

  private REVIEWABLE_QUESTION_SUGGESTIONS = (
    'REVIEWABLE_QUESTION_SUGGESTIONS');

  private SUBMITTED_TRANSLATION_SUGGESTIONS = (
    'SUBMITTED_TRANSLATION_SUGGESTIONS');

  private REVIEWABLE_TRANSLATION_SUGGESTIONS = (
    'REVIEWABLE_TRANSLATION_SUGGESTIONS');

  constructor(
    private http: HttpClient,
    private urlInterpolationService: UrlInterpolationService
  ) {}

  async fetchSuggestionsAsync(
      fetchType: string,
      limit: number | null,
      offset: number,
      sortKey: string,
      explorationId: string | null,
      topicName: string | null,
  ): Promise<FetchSuggestionsResponse> {
    if (fetchType === this.SUBMITTED_QUESTION_SUGGESTIONS) {
      return this.fetchSubmittedSuggestionsAsync(
        'skill', 'add_question', limit || 0, offset, sortKey);
    }
    if (fetchType === this.SUBMITTED_TRANSLATION_SUGGESTIONS) {
      return this.fetchSubmittedSuggestionsAsync(
        'exploration', 'translate_content', limit || 0, offset, sortKey);
    }
    if (fetchType === this.REVIEWABLE_QUESTION_SUGGESTIONS) {
      return this.fetchReviewableSuggestionsAsync(
        'skill', 'add_question', limit || 0, offset, sortKey, null, topicName);
    }
    if (fetchType === this.REVIEWABLE_TRANSLATION_SUGGESTIONS) {
      return this.fetchReviewableSuggestionsAsync(
        'exploration',
        'translate_content',
        limit,
        offset,
        sortKey,
        explorationId,
        null);
    }
    throw new Error('Invalid fetch type');
  }

  async fetchSubmittedSuggestionsAsync(
      targetType: string,
      suggestionType: string,
      limit: number,
      offset: number,
      sortKey: string
  ): Promise<FetchSuggestionsResponse> {
    const url = this.urlInterpolationService.interpolateUrl(
      this.SUBMITTED_SUGGESTION_LIST_HANDLER_URL, {
        target_type: targetType,
        suggestion_type: suggestionType
      }
    );
    const params = {
      limit: limit.toString(),
      offset: offset.toString(),
      sort_key: sortKey
    };
    return this.http.get<FetchSuggestionsResponse>(url, { params }).toPromise();
  }

  async fetchReviewableSuggestionsAsync(
      targetType: string,
      suggestionType: string,
      limit: number | null,
      offset: number,
      sortKey: string,
      explorationId: string | null,
      topicName: string | null,
  ): Promise<FetchSuggestionsResponse> {
    const url = this.urlInterpolationService.interpolateUrl(
      this.REVIEWABLE_SUGGESTIONS_HANDLER_URL, {
        target_type: targetType,
        suggestion_type: suggestionType
      }
    );
    const params: {
      limit?: string;
      offset: string;
      sort_key: string;
      exploration_id?: string;
      topic_name?: string;
    } = {
      offset: offset.toString(),
      sort_key: sortKey
    };
    if (limit) {
      params.limit = limit.toString();
    }
    if (explorationId) {
      params.exploration_id = explorationId;
    }
    if (topicName) {
      params.topic_name = topicName;
    }
    return this.http.get<FetchSuggestionsResponse>(
      url,
      { params } as Object
    ).toPromise();
  }

  async reviewExplorationSuggestionAsync(
      expId: string,
      suggestionId: string,
      requestBody: ReviewExplorationSuggestionRequestBody
  ): Promise<void> {
    const url = this.urlInterpolationService.interpolateUrl(
      this.SUGGESTION_TO_EXPLORATION_ACTION_HANDLER_URL, {
        exp_id: expId,
        suggestion_id: suggestionId
      }
    );
    return this.http.put<void>(url, requestBody).toPromise();
  }

  async reviewSkillSuggestionAsync(
      skillId: string,
      suggestionId: string,
      requestBody: ReviewSkillSuggestionRequestBody
  ): Promise<void> {
    const url = this.urlInterpolationService.interpolateUrl(
      this.SUGGESTION_TO_SKILL_ACTION_HANDLER_URL, {
        skill_id: skillId,
        suggestion_id: suggestionId
      }
    );
    return this.http.put<void>(url, requestBody).toPromise();
  }

  async updateTranslationSuggestionAsync(
      suggestionId: string, requestBody: UpdateTranslationRequestBody
  ): Promise<void> {
    const url = this.urlInterpolationService.interpolateUrl(
      this.UPDATE_TRANSLATION_HANDLER_URL, {
        suggestion_id: suggestionId
      }
    );
    return this.http.put<void>(url, requestBody).toPromise();
  }

  async updateQuestionSuggestionAsync(
      suggestionId: string, requestBody: FormData
  ): Promise<void> {
    const url = this.urlInterpolationService.interpolateUrl(
      this.UPDATE_QUESTION_HANDLER_URL, {
        suggestion_id: suggestionId
      }
    );
    return this.http.post<void>(url, requestBody).toPromise();
  }

  async downloadContributorCertificateAsync(
      username: string,
      suggestionType: string,
      language: string | null,
      fromDate: string,
      toDate: string
  ): Promise<ContributorCertificateResponse> {
    const url = this.urlInterpolationService.interpolateUrl(
      this.CONTRIBUTOR_CERTIFICATE_HANDLER_URL, {
        username: username,
        suggestion_type: suggestionType
      }
    );
    let params: {
      from_date: string;
      to_date: string;
      language?: string;
    } = {
      from_date: fromDate,
      to_date: toDate
    };
    if (language) {
      params.language = language;
    }
    return this.http.get<ContributorCertificateResponse>(
      url, { params } as Object
    ).toPromise();
  }
}
