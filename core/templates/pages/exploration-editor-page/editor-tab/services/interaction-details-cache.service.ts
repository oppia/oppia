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

import cloneDeep from 'lodash/cloneDeep';

import {Injectable} from '@angular/core';

import {InteractionCustomizationArgs} from 'interactions/customization-args-defs';

interface InteractionDetailsCache {
  [interactionId: string]: InteractionCustomizationArgs;
}

@Injectable({
  providedIn: 'root',
})
export class InteractionDetailsCacheService {
  static _cache: InteractionDetailsCache = {};

  reset(): void {
    InteractionDetailsCacheService._cache = {};
  }

  contains(interactionId: string): boolean {
    return InteractionDetailsCacheService._cache.hasOwnProperty(interactionId);
  }

  removeDetails(interactionId: string): void {
    delete InteractionDetailsCacheService._cache[interactionId];
  }

  set(
    interactionId: string,
    interactionCustomizationArgs: InteractionCustomizationArgs
  ): void {
    InteractionDetailsCacheService._cache[interactionId] = {
      customization: cloneDeep(interactionCustomizationArgs),
    };
  }

  get(interactionId: string): InteractionCustomizationArgs | null {
    if (!InteractionDetailsCacheService._cache.hasOwnProperty(interactionId)) {
      return null;
    }
    return cloneDeep(InteractionDetailsCacheService._cache[interactionId]);
  }
}
