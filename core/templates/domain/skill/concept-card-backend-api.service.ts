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
import { HttpClient } from '@angular/common/http';

import cloneDeep from 'lodash/cloneDeep';

import { ConceptCard, IConceptCardBackendDict, ConceptCardObjectFactory} from
  'domain/skill/ConceptCardObjectFactory';
import { SkillDomainConstants } from
  'domain/skill/skill-domain.constants';
import { UrlInterpolationService } from
  'domain/utilities/url-interpolation.service';

interface IConceptCardBackendDicts {
  'concept_card_dicts': IConceptCardBackendDict[];
}

@Injectable({
  providedIn: 'root'
})
export class ConceptCardBackendApiService {
  constructor(
    private conceptCardObjectFactory: ConceptCardObjectFactory,
    private http: HttpClient,
    private urlInterpolation: UrlInterpolationService) {}

  // Maps previously loaded concept cards to their IDs.
  private _conceptCardCache = [];

  private _fetchConceptCards(
      skillIds: string[],
      successCallback: (value?: Object | PromiseLike<Object>) => void,
      errorCallback: (reason?: string) => void): void {
    var conceptCardDataUrl = this.urlInterpolation.interpolateUrl(
      SkillDomainConstants.CONCEPT_CARD_DATA_URL_TEMPLATE, {
        comma_separated_skill_ids: skillIds.join(',')
      });

    var conceptCardObjects = [];

    this.http.get<IConceptCardBackendDicts>(conceptCardDataUrl).toPromise()
      .then(response => {
        if (successCallback) {
          var conceptCardDicts = response.concept_card_dicts;
          conceptCardDicts.forEach(conceptCardDict => {
            conceptCardObjects.push(
              this.conceptCardObjectFactory.createFromBackendDict(
                conceptCardDict));
          });
          successCallback(conceptCardObjects);
        }
      }, errorResponse => {
        if (errorCallback) {
          errorCallback(errorResponse.error);
        }
      });
  }

  private _isCached(skillId: string): boolean {
    return this._conceptCardCache.hasOwnProperty(skillId);
  }

  private _getUncachedSkillIds(skillIds: string[]): string[] {
    var uncachedSkillIds = [];
    skillIds.forEach(skillId => {
      if (!this._isCached(skillId)) {
        uncachedSkillIds.push(skillId);
      }
    });
    return uncachedSkillIds;
  }

  loadConceptCards(skillIds: string[]): Promise<ConceptCard[]> {
    return new Promise((resolve, reject) => {
      var uncachedSkillIds = this._getUncachedSkillIds(skillIds);
      var conceptCards = [];

      if (uncachedSkillIds.length !== 0) {
        // Case where only part (or none) of the concept cards are cached
        // locally.
        this._fetchConceptCards(
          uncachedSkillIds, (uncachedConceptCards) => {
            skillIds.forEach(skillId => {
              if (uncachedSkillIds.includes(skillId)) {
                conceptCards.push(
                  uncachedConceptCards[uncachedSkillIds.indexOf(skillId)]);
                // Save the fetched conceptCards to avoid future fetches.
                this._conceptCardCache[skillId] = cloneDeep(
                  uncachedConceptCards[uncachedSkillIds.indexOf(skillId)]);
              } else {
                conceptCards.push(cloneDeep(this._conceptCardCache[skillId]));
              }
            });
            if (resolve) {
              resolve(cloneDeep(conceptCards));
            }
          }, reject);
      } else {
        // Case where all of the concept cards are cached locally.
        skillIds.forEach(skillId => {
          conceptCards.push(cloneDeep(this._conceptCardCache[skillId]));
        });
        if (resolve) {
          resolve(cloneDeep(conceptCards));
        }
      }
    });
  }
}

angular.module('oppia').factory(
  'ConceptCardBackendApiService',
  downgradeInjectable(ConceptCardBackendApiService));
