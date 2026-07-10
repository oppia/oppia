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

import {Injectable} from '@angular/core';

import {AnswerGroup} from 'domain/exploration/answer-group.model';
import {
  Warning,
  BaseInteractionValidationService,
} from 'interactions/base-interaction-validation.service';
import {
  MusicNotesInputCustomizationArgs,
  ReadableMusicNote,
} from 'extensions/interactions/customization-args-defs';
import {InteractionsExtensionsConstants} from 'interactions/interactions-extension.constants';
import {Outcome} from 'domain/exploration/outcome.model';
import {AppConstants} from 'app.constants';

@Injectable({
  providedIn: 'root',
})
export class MusicNotesInputValidationService {
  // The music staff can display at most this many notes, so longer
  // sequences can neither be rendered nor entered by the learner. This
  // must be kept in sync with MAXIMUM_NOTES_POSSIBLE in
  // oppia-interactive-music-notes-input.component.ts and with
  // MusicPhrase._MAX_NOTES_IN_PHRASE in extensions/objects/models/objects.py.
  static readonly MAX_NOTES_IN_PHRASE = 8;

  constructor(
    private baseInteractionValidationServiceInstance: BaseInteractionValidationService
  ) {}

  getCustomizationArgsWarnings(
    customizationArgs: MusicNotesInputCustomizationArgs
  ): Warning[] {
    var warningsList: Warning[] = [];

    this.baseInteractionValidationServiceInstance.requireCustomizationArguments(
      customizationArgs,
      ['sequenceToGuess', 'initialSequence']
    );

    const validNoteNames: string[] = Object.keys(
      InteractionsExtensionsConstants.NOTE_NAMES_TO_MIDI_VALUES
    );
    const sequences: [string, ReadableMusicNote[]][] = [
      ['sequence of notes to guess', customizationArgs.sequenceToGuess.value],
      ['initial sequence of notes', customizationArgs.initialSequence.value],
    ];

    for (const [sequenceLabel, notes] of sequences) {
      if (notes.length > MusicNotesInputValidationService.MAX_NOTES_IN_PHRASE) {
        warningsList.push({
          type: AppConstants.WARNING_TYPES.CRITICAL,
          message:
            `Please make sure that the ${sequenceLabel} has at most ` +
            `${MusicNotesInputValidationService.MAX_NOTES_IN_PHRASE} notes.`,
        });
      }
      if (notes.some(note => !validNoteNames.includes(note.readableNoteName))) {
        warningsList.push({
          type: AppConstants.WARNING_TYPES.CRITICAL,
          message:
            `Please make sure that all notes in the ${sequenceLabel} are ` +
            'notes that can be placed on the staff (C4 through A5).',
        });
      }
      if (
        notes.some(
          note => note.noteDuration.num < 1 || note.noteDuration.den < 1
        )
      ) {
        warningsList.push({
          type: AppConstants.WARNING_TYPES.CRITICAL,
          message:
            'Please make sure that all note durations in the ' +
            `${sequenceLabel} are positive.`,
        });
      }
    }

    return warningsList;
  }

  getAllWarnings(
    stateName: string,
    customizationArgs: MusicNotesInputCustomizationArgs,
    answerGroups: AnswerGroup[],
    defaultOutcome: Outcome
  ): Warning[] {
    var partialWarningsList: Warning[] = [];

    for (
      var ansGroupIdx = 0;
      ansGroupIdx < answerGroups.length;
      ansGroupIdx++
    ) {
      const answerGroup = answerGroups[ansGroupIdx];
      const groupId = String(ansGroupIdx + 1);
      // Specific edge case for when HasLengthInclusivelyBetween is used.
      for (var ruleIdx = 0; ruleIdx < answerGroup.rules.length; ruleIdx++) {
        var rule = answerGroup.rules[ruleIdx];
        if (rule.type === 'HasLengthInclusivelyBetween') {
          if (rule.inputs.a > rule.inputs.b) {
            partialWarningsList.push({
              type: AppConstants.WARNING_TYPES.ERROR,
              message:
                `The rule in response group ${groupId} is invalid -- ` +
                `${rule.inputs.a} is more than ${rule.inputs.b}`,
            });
          }
        }
      }
    }

    return partialWarningsList.concat(
      this.getCustomizationArgsWarnings(customizationArgs).concat(
        this.baseInteractionValidationServiceInstance.getAllOutcomeWarnings(
          answerGroups,
          defaultOutcome,
          stateName
        )
      )
    );
  }
}
