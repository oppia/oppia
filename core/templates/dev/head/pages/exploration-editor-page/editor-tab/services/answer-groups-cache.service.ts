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
 * @fileoverview A state-specific cache for interaction handlers. It stores
 * handlers corresponding to an interaction id so that they can be restored if
 * the interaction is changed back while the user is still in this state.
 * This cache should be reset each time the state editor is initialized.
 */

import * as cloneDeep from 'lodash/cloneDeep';

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';

@Injectable({
  providedIn: 'root'
})
export class AnswerGroupsCacheService {
  static _cache: {} = {};

  reset(): void {
    AnswerGroupsCacheService._cache = {};
  }

  contains(interactionId: string): boolean {
    return AnswerGroupsCacheService._cache.hasOwnProperty(interactionId);
  }

  // TODO(#7176): Replace 'any' with the exact type. This has been kept as
  // 'any' because 'answerGroups' is a dict with underscore_cased keys which
  // give tslint errors against underscore_casing in favor of camelCasing.
  set(interactionId: string, answerGroups: any): void {
    AnswerGroupsCacheService._cache[interactionId] = cloneDeep(answerGroups);
  }

  get(interactionId: string): {} {
    if (!AnswerGroupsCacheService._cache.hasOwnProperty(interactionId)) {
      return null;
    }
    return cloneDeep(AnswerGroupsCacheService._cache[interactionId]);
  }
}

angular.module('oppia').factory(
  'AnswerGroupsCacheService', downgradeInjectable(AnswerGroupsCacheService));
