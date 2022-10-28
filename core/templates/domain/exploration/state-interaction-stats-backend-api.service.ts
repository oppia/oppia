// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Backend api service for state interaction stats.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import {
  VisualizationInfoBackendDict,
  VisualizationInfo,
} from 'domain/exploration/visualization-info.model';
import { UrlInterpolationService } from
  'domain/utilities/url-interpolation.service';

interface StateInteractionStatsBackendDict {
  'visualizations_info': VisualizationInfoBackendDict[];
}

@Injectable({
  providedIn: 'root'
})
export class StateInteractionStatsBackendApiService {
  STATE_INTERACTION_STATS_URL_TEMPLATE: string = (
    '/createhandler/state_interaction_stats/<exploration_id>/<state_name>');

  constructor(
    private http: HttpClient,
    private urlInterpolationService: UrlInterpolationService) {}

  async getStatsAsync(
      explorationId: string,
      name: string
  ): Promise<VisualizationInfo[]> {
    return new Promise((resolve, reject) => {
      this.http.get<StateInteractionStatsBackendDict>(
        this.urlInterpolationService.interpolateUrl(
          this.STATE_INTERACTION_STATS_URL_TEMPLATE, {
            exploration_id: explorationId,
            state_name: name
          })).toPromise().then(backendDict => {
        let visualizationInfoObjects = backendDict.visualizations_info.map((
            visInfoDict) => {
          return VisualizationInfo.createFromBackendDict(
            visInfoDict);
        });
        resolve(visualizationInfoObjects);
      }, errorResponse => {
        reject(errorResponse.error.error);
      });
    });
  }
}

angular.module('oppia').factory(
  'StateInteractionStatsBackendApiService',
  downgradeInjectable(StateInteractionStatsBackendApiService));
