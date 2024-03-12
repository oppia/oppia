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

import {Injectable, EventEmitter} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';

import {ComputeGraphService} from 'services/compute-graph.service';
import {StateObjectsBackendDict} from 'domain/exploration/StatesObjectFactory';
import {StatesObjectFactory} from 'domain/exploration/StatesObjectFactory';

enum CheckpointMessageTypes {
  FIRST = 'FIRST',
  SECOND = 'SECOND',
  MIDWAY = 'MIDWAY',
  TWO_REMAINING = 'TWO_REMAINING',
  ONE_REMAINING = 'ONE_REMAINING',
  GENERIC = 'GENERIC',
}

@Injectable({
  providedIn: 'root',
})
export class CheckpointCelebrationUtilityService {
  private isOnCheckpointedState: boolean = false;
  private _openLessonInformationModalEmitter = new EventEmitter<void>();
  constructor(
    private computeGraphService: ComputeGraphService,
    private statesObjectFactory: StatesObjectFactory,
    private translateService: TranslateService
  ) {}

  getStateListForCheckpointMessages(
    statesbackendDict: StateObjectsBackendDict,
    initStateName: string
  ): string[] {
    const states =
      this.statesObjectFactory.createFromBackendDict(statesbackendDict);
    const bfsStateList = this.computeGraphService.computeBfsTraversalOfStates(
      initStateName,
      states,
      initStateName
    );
    let stateListForCheckpointMessages: string[] = [];
    bfsStateList.forEach(state => {
      if (statesbackendDict[state].card_is_checkpoint) {
        stateListForCheckpointMessages.push(state);
      }
    });
    return stateListForCheckpointMessages;
  }

  getRandomI18nKey(
    i18nKeyPrefix: string,
    availableKeyCount: number,
    messageKind: string | null
  ): string {
    // 'randomValue' is being set to lie between 1 and availableKeyCount, the
    // total number of i18n keys available to choose from.
    const randomValue = Math.floor(Math.random() * availableKeyCount) + 1;
    if (messageKind) {
      return i18nKeyPrefix + '_' + messageKind + '_' + randomValue.toString();
    }
    return i18nKeyPrefix + '_' + randomValue.toString();
  }

  // This function fetches the i18n key for the checkpoint message.
  // There are 6 different kinds of i18n keys available (enumerated in the
  // 'CheckpointMessageTypes' enum above) for the checkpoint message, 3 of
  // each kind for a total of 18.
  // The kind of key is determined using the number of completed checkpoints and
  // the total number of checkpoints.
  // The function returns a random key from the 3 available ones for the
  // correct type, using the 'getRandomI18nKey' method.
  getCheckpointMessageI18nKey(
    completedCheckpointCount: number,
    totalCheckpointCount: number
  ): string {
    const messageI18nKeyPrefix = 'I18N_CONGRATULATORY_CHECKPOINT_MESSAGE';
    if (completedCheckpointCount === 1) {
      return this.getRandomI18nKey(
        messageI18nKeyPrefix,
        3,
        CheckpointMessageTypes.FIRST
      );
    } else if (completedCheckpointCount === 2) {
      return this.getRandomI18nKey(
        messageI18nKeyPrefix,
        3,
        CheckpointMessageTypes.SECOND
      );
      // The condition below evaluates to true when the learner has just
      // completed the middle checkpoint and returns the midway message's
      // i18n key.
    } else if (
      Math.ceil(totalCheckpointCount / 2) === completedCheckpointCount
    ) {
      return this.getRandomI18nKey(
        messageI18nKeyPrefix,
        3,
        CheckpointMessageTypes.MIDWAY
      );
    } else if (totalCheckpointCount - completedCheckpointCount === 2) {
      return this.getRandomI18nKey(
        messageI18nKeyPrefix,
        3,
        CheckpointMessageTypes.TWO_REMAINING
      );
    } else if (totalCheckpointCount - completedCheckpointCount === 1) {
      return this.getRandomI18nKey(
        messageI18nKeyPrefix,
        3,
        CheckpointMessageTypes.ONE_REMAINING
      );
    } else {
      return this.getRandomI18nKey(
        messageI18nKeyPrefix,
        3,
        CheckpointMessageTypes.GENERIC
      );
    }
  }

  getCheckpointMessage(
    completedCheckpointCount: number,
    totalCheckpointCount: number
  ): string {
    const messageI18nKey = this.getCheckpointMessageI18nKey(
      completedCheckpointCount,
      totalCheckpointCount
    );
    return this.translateService.instant(messageI18nKey);
  }

  getCheckpointTitleI18nKey(): string {
    const titleI18nKeyPrefix = 'I18N_CONGRATULATORY_CHECKPOINT_TITLE';
    // A null messageKind is passed to the function below because there
    // is only one kind of title i18n keys.
    return this.getRandomI18nKey(titleI18nKeyPrefix, 6, null);
  }

  getCheckpointTitle(): string {
    const titleI18nKey = this.getCheckpointTitleI18nKey();
    return this.translateService.instant(titleI18nKey);
  }

  setIsOnCheckpointedState(isOnCheckpointedState: boolean): void {
    this.isOnCheckpointedState = isOnCheckpointedState;
  }

  getIsOnCheckpointedState(): boolean {
    return this.isOnCheckpointedState;
  }

  getOpenLessonInformationModalEmitter(): EventEmitter<void> {
    return this._openLessonInformationModalEmitter;
  }

  openLessonInformationModal(): void {
    this._openLessonInformationModalEmitter.emit();
  }
}
