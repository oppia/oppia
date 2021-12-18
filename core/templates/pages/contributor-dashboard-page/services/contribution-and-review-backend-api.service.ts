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
  constructor(
    private http: HttpClient
  ) {}

  async fetchSuggestions(url: string): Promise<FetchSuggestionsResponse> {
    return this.http.get<FetchSuggestionsResponse>(url).toPromise();
  }

  async resolveToExploration(
      url: string, data: ResolveToExplorationData
  ): Promise<void> {
    return this.http.put<void>(url, data).toPromise();
  }

  async resolveToSkill(
      url: string, data: ResolveToSkillData
  ): Promise<void> {
    return this.http.put<void>(url, data).toPromise();
  }

  async updateTranslationSuggestion(
      url: string, data: UpdateTranslationData
  ): Promise<void> {
    return this.http.put<void>(url, data).toPromise();
  }

  async updateQuestionSuggestion(
      url: string, body: FormData
  ): Promise<void> {
    return this.http.post<void>(url, body, {
      headers: { 'Content-Type': undefined }
    }).toPromise();
  }
}
