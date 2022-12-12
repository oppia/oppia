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
 * @fileoverview Validator service for the interaction.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

import { AnswerGroup } from
  'domain/exploration/AnswerGroupObjectFactory';
import { Warning, baseInteractionValidationService } from
  'interactions/base-interaction-validation.service';
import { MusicNotesInputCustomizationArgs } from
  'extensions/interactions/customization-args-defs';
import { Outcome } from
  'domain/exploration/OutcomeObjectFactory';

@Injectable({
  providedIn: 'root'
})
export class MusicNotesInputValidationService {
  constructor(
    private baseInteractionValidationServiceInstance:
      baseInteractionValidationService) { }

  // validate input is array of ReadbleMusicNotes
  // check invariants for ReadbleMusicNote custom type
  getCustomizationArgsWarnings(
    customizationArgs: MusicNotesInputCustomizationArgs): Warning[] {
    // TODO(juansaba): Implement customization args validations.

    // customization args: sequenceToGuess, initialSequence
    let warningsList = []
    this.baseInteractionValidationService.requireCustomizationArugments(
      customizationArgs,
      ['sequenceToGuess', 'initialSequence']);

    let stg = customizationArgs.sequenceToGuess.value; 
    let initSeq = customizationArgs.initialSequence.value;

    // check that input is nonempty or does not exist
    if (stg === undefined || stg.length === 0){
      warningsList.push({
        type: AppConstants.WARNING_TYPES.ERROR,
        type: 'sequence to guess is not defined'
      });

    }

    if (initSeq === undefined || initSeq.length === 0){
      warningsList.push({
        type: AppConstants.WARNING_TYPES.ERROR,
        type: 'sequence to guess is not defined'
      });

    }

    let readableNoteName = stg[0].readableNoteName;
    let noteDuration = stg[0].readableNoteName;

     // check whether readableNoteName is a string
     if (!(typeof readableNoteName === 'string')) {
      warningsList.push({
        type: AppConstants.WARNING_TYPES.ERROR,
        type: 'readableNoteName must be a string'
      });
     }

     // check whether noteDuration is correct type
     if (!(typeof noteDuration.num === 'number') || !(typeof noteDuration.den === 'number')) {
      warningsList.push({
        type: AppConstants.WARNING_TYPES.ERROR,
        type: 'noteDuration member components must be numbers'
      });
    }
    
  }
    return warningsList;
}

getAllWarnings(
  stateName: string, customizationArgs: MusicNotesInputCustomizationArgs,
  answerGroups: AnswerGroup[], defaultOutcome: Outcome): Warning[] {
  return this.getCustomizationArgsWarnings(customizationArgs).concat(
    this.baseInteractionValidationServiceInstance.getAllOutcomeWarnings(
      answerGroups, defaultOutcome, stateName));
}
}

angular.module('oppia').factory(
  'MusicNotesInputValidationService',
  downgradeInjectable(MusicNotesInputValidationService));
