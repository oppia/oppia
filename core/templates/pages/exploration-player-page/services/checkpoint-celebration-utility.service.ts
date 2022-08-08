// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Provides a collection of utility functions for the
 * checkpoint celebration feature.
 */

import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import { ComputeGraphService } from 'services/compute-graph.service';
import { StateObjectsBackendDict } from 'domain/exploration/StatesObjectFactory';
import { StatesObjectFactory } from 'domain/exploration/StatesObjectFactory';

@Injectable({
  providedIn: 'root'
})
export class CheckpointCelebrationUtilityService {
  constructor(
    private computeGraphService: ComputeGraphService,
    private statesObjectFactory: StatesObjectFactory,
    private translateService: TranslateService
  ) {}

  getStateListForCheckpointMessages(
      statesbackendDict: StateObjectsBackendDict, initStateName: string
  ): string[] {
    const states = this.statesObjectFactory.createFromBackendDict(
      statesbackendDict);
    const bfsStateList = this.computeGraphService.computeBfsTraversalOfStates(
      initStateName, states, initStateName);
    let stateListForCheckpointMessages: string[] = [];
    bfsStateList.forEach((state) => {
      if (statesbackendDict[state].card_is_checkpoint) {
        stateListForCheckpointMessages.push(state);
      }
    });
    return stateListForCheckpointMessages;
  }

  getRandomI18nKey(
      i18nKeyPrefix: string, availableKeyCount: number, messageKind?: string,
  ): string {
    // 'randomValue' is being set to lie between 1 and availableKeyCount, the
    // total number of i18n keys available to choose from.
    const randomValue = Math.floor(Math.random() * availableKeyCount) + 1;
    if (messageKind) {
      return i18nKeyPrefix + '_' + messageKind + '_' + randomValue.toString();
    }
    return i18nKeyPrefix + '_' + randomValue.toString();
  }

  getCheckpointMessageI18nKey(
      completedCheckpointCount: number, totalCheckpointCount: number
  ): string {
    const messageI18nKeyPrefix = 'I18N_CONGRATULATORY_CHECKPOINT_MESSAGE';
    if (completedCheckpointCount === 1) {
      return this.getRandomI18nKey(messageI18nKeyPrefix, 3, 'FIRST');
    } else if (completedCheckpointCount === 2) {
      return this.getRandomI18nKey(messageI18nKeyPrefix, 3, 'SECOND');
    } else if (
      completedCheckpointCount / totalCheckpointCount >= 0.5 &&
      (completedCheckpointCount - 1) / totalCheckpointCount < 0.5
    ) {
      return this.getRandomI18nKey(messageI18nKeyPrefix, 3, 'MIDWAY');
    } else if (totalCheckpointCount - completedCheckpointCount === 2) {
      return this.getRandomI18nKey(messageI18nKeyPrefix, 3, 'TWO_REMAINING');
    } else if (totalCheckpointCount - completedCheckpointCount === 1) {
      return this.getRandomI18nKey(messageI18nKeyPrefix, 3, 'ONE_REMAINING');
    } else {
      return this.getRandomI18nKey(messageI18nKeyPrefix, 3, 'GENERIC');
    }
  }

  getCheckpointMessage(
      completedCheckpointCount: number, totalCheckpointCount: number
  ): string {
    const messageI18nKey = this.getCheckpointMessageI18nKey(
      completedCheckpointCount, totalCheckpointCount);
    return this.translateService.instant(messageI18nKey);
  }

  getCheckpointTitleI18nKey(): string {
    const titleI18nKeyPrefix = 'I18N_CONGRATULATORY_CHECKPOINT_TITLE';
    return this.getRandomI18nKey(titleI18nKeyPrefix, 6);
  }

  getCheckpointTitle(): string {
    const titleI18nKey = this.getCheckpointTitleI18nKey();
    return this.translateService.instant(titleI18nKey);
  }
}
