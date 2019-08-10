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
 * @fileoverview A service to provide state-specific cache for interaction
 * details. It stores customization args corresponding to an interaction id so
 * that they can be restored if the interaction is changed back while the user
 * is still in this state. This cache should be reset each time the state
 * editor is initialized.
 */

import * as cloneDeep from 'lodash/cloneDeep';

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';

@Injectable({
  providedIn: 'root'
})
export class InteractionDetailsCacheService {
  static _cache: {} = {};

  reset(): void {
    InteractionDetailsCacheService._cache = {};
  }

  contains(interactionId: string): boolean {
    return InteractionDetailsCacheService._cache.hasOwnProperty(interactionId);
  }

  removeDetails(interactionId: string): void {
    delete InteractionDetailsCacheService._cache[interactionId];
  }

  // TODO(#7165): Replace 'any' with the exact type. This has been kept as
  // 'any' because 'interactionCustomizationArgs' is a dict with many keys
  // some of which are underscore_cased which gives tslint errors against
  // underscore_casing in favor of camelCasing. A thorough research needs to be
  // done to ensure all the keys and the correct type.
  set(interactionId: string, interactionCustomizationArgs: any): void {
    InteractionDetailsCacheService._cache[interactionId] = {
      customization: cloneDeep(interactionCustomizationArgs)
    };
  }

  get(interactionId: string): {} {
    if (!InteractionDetailsCacheService._cache.hasOwnProperty(interactionId)) {
      return null;
    }
    return cloneDeep(InteractionDetailsCacheService._cache[interactionId]);
  }
}

angular.module('oppia').factory(
  'InteractionDetailsCacheService',
  downgradeInjectable(InteractionDetailsCacheService));
