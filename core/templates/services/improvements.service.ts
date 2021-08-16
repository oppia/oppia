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
 * @fileoverview Service to help identify and manage improvements in exploration
 * states based on statistics.
 */

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';

import { State } from 'domain/state/StateObjectFactory';

@Injectable({
  providedIn: 'root'
})
export class ImprovementsService {
  INTERACTION_IDS_REQUIRED_TO_BE_RESOLVED = ['TextInput'];

  isStateForcedToResolveOutstandingUnaddressedAnswers(state: State): boolean {
    if (!state || (state.interaction.id === null)) {
      return false;
    }
    return this.INTERACTION_IDS_REQUIRED_TO_BE_RESOLVED.indexOf(
      state.interaction.id) !== -1;
  }
}

angular.module('oppia').factory(
  'ImprovementsService', downgradeInjectable(ImprovementsService));
