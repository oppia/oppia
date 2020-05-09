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
 * @fileoverview Service to retrieve read only information
 * about the concept card of a skill from the backend.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse, HttpErrorResponse } from '@angular/common/http';

import cloneDeep from 'lodash/cloneDeep';

import { UrlInterpolationService } from
  'domain/utilities/url-interpolation.service';
import { SkillDomainConstants } from
  'domain/skill/skill-domain.constants';

@Injectable({
  providedIn: 'root'
})
export class ConceptCardBackendApiService {
  // Maps previously loaded concept cards to their IDs.
  private _conceptCardCache: Object = {};

  constructor(
    private urlInterpolationService: UrlInterpolationService,
    private http: HttpClient
  ) { }

  private _fetchConceptCards(skillIds: Array<string>,
      successCallback: (value?: Object | PromiseLike<Object>) => void,
      errorCallback: (reason?: HttpErrorResponse) => void): void {
    let conceptCardDataUrl = this.urlInterpolationService.interpolateUrl(
      SkillDomainConstants.CONCEPT_CARD_DATA_URL_TEMPLATE, {
        comma_separated_skill_ids: skillIds.join(',')
      });

    this.http.get(conceptCardDataUrl, { observe: 'response' }).toPromise()
      .then((response: HttpResponse<any>) => {
        let conceptCards = cloneDeep(response.body.concept_card_dicts);

        if (successCallback) {
          successCallback(conceptCards);
        }
      }, (error) => {
        if (errorCallback) {
          errorCallback(error.error);
        }
      });
  }

  private _isCached(skillId: string): boolean {
    return this._conceptCardCache.hasOwnProperty(skillId);
  }

  private _getUncachedSkillIds(skillIds: Array<string>): Array<string> {
    let uncachedSkillIds = [];
    skillIds.forEach((skillId) => {
      if (!this._isCached(skillId)) {
        uncachedSkillIds.push(skillId);
      }
    });
    return uncachedSkillIds;
  }

  /**
   * This function will fetch concept cards from the backend, as well as
   * attempt to see whether the given concept cards have already been
   * loaded. If they have not yet been loaded, it will fetch the concept
   * cards from the backend. If it successfully retrieves the concept cards
   * from the backend, it will store them in the cache to avoid requests
   * from the backend in further function calls.
   */
  loadConceptCards(skillIds: Array<string>): Promise<Object> {
    return new Promise((resolve, reject) => {
      let uncachedSkillIds = this._getUncachedSkillIds(skillIds);
      let conceptCards = [];
      if (uncachedSkillIds.length !== 0) {
        // Case where only part (or none) of the concept cards are cached
        // locally.
        this._fetchConceptCards(
          uncachedSkillIds, (uncachedConceptCards) => {
            skillIds.forEach((skillId) => {
              if (uncachedSkillIds.includes(skillId)) {
                conceptCards.push(
                  uncachedConceptCards[uncachedSkillIds.indexOf(skillId)]);
                // Save the fetched conceptCards to avoid future fetches.
                this._conceptCardCache[skillId] = cloneDeep(
                  uncachedConceptCards[uncachedSkillIds.indexOf(skillId)]);
              } else {
                conceptCards.push(
                  cloneDeep(this._conceptCardCache[skillId]));
              }
            });
            if (resolve) {
              resolve(cloneDeep(conceptCards));
            }
          }, reject);
      } else {
        // Case where all of the concept cards are cached locally.
        skillIds.forEach((skillId) => {
          conceptCards.push(cloneDeep(this._conceptCardCache[skillId]));
        });
        if (resolve) {
          resolve(conceptCards);
        }
      }
    });
  }
}

angular.module('oppia').factory(
  'ConceptCardBackendApiService',
  downgradeInjectable(ConceptCardBackendApiService));
