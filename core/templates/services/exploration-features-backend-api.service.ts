// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service for fetching the features the exploration editor is
 * configured to support.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { ServicesConstants } from 'services/services.constants';
import { UrlInterpolationService } from
  'domain/utilities/url-interpolation.service';

interface ExplorationFeaturesBackendDict {
  'exploration_is_curated': boolean;
  'always_ask_learners_for_answer_details': boolean;
}

export interface ExplorationFeatures {
  explorationIsCurated: boolean;
  alwaysAskLearnersForAnswerDetails: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ExplorationFeaturesBackendApiService {
  constructor(
      private http: HttpClient,
      private urlInterpolationService: UrlInterpolationService) {}

  async fetchExplorationFeaturesAsync(
      explorationId: string): Promise<ExplorationFeatures> {
    return this.http.get<ExplorationFeaturesBackendDict>(
      this.urlInterpolationService.interpolateUrl(
        ServicesConstants.EXPLORATION_FEATURES_URL,
        {exploration_id: explorationId}
      ) as string
    ).toPromise().then(response => ({
      explorationIsCurated: response.exploration_is_curated,
      alwaysAskLearnersForAnswerDetails: (
        response.always_ask_learners_for_answer_details),
    }), errorResponse => {
      throw new Error(errorResponse.error.error);
    });
  }
}

angular.module('oppia').factory(
  'ExplorationFeaturesBackendApiService',
  downgradeInjectable(ExplorationFeaturesBackendApiService));
