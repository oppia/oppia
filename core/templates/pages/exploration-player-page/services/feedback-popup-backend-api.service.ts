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
 * @fileoverview Backend Api Service for Feedback Popup.
 */

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ExplorationEngineService } from './exploration-engine.service';

@Injectable({
  providedIn: 'root'
})
export class FeedbackPopupBackendApiService {
  feedbackUrl: string;

  constructor(
    private httpClient: HttpClient,
    private explorationEngineService: ExplorationEngineService
  ) {
    this.feedbackUrl = '/explorehandler/give_feedback/' +
      this.explorationEngineService.getExplorationId();
  }

  async submitFeedbackAsync(
      subject: string,
      feedback: string,
      includeAuthor: boolean,
      stateName: string
  ): Promise<Object> {
    return this.httpClient.post(this.feedbackUrl, {
      subject,
      feedback,
      include_author: includeAuthor,
      state_name: stateName
    }).toPromise();
  }
}
