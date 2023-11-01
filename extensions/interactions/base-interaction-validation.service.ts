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
 * @fileoverview Base validation service for interactions.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

import { AnswerGroup } from
  'domain/exploration/AnswerGroupObjectFactory';
import { Outcome } from
  'domain/exploration/OutcomeObjectFactory';

import { AppConstants } from 'app.constants';

export interface Warning {
  type: string;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class baseInteractionValidationService {
  // 'argNames' is an array of top-level customization argument names (such
  // as 'chocies') used to verify the basic structure of the input
  // customization arguments object.
  requireCustomizationArguments(
      customizationArguments: {}, argNames: string[]): void {
    var missingArgs = [];

    for (var i = 0; i < argNames.length; i++) {
      if (!customizationArguments.hasOwnProperty(argNames[i])) {
        missingArgs.push(argNames[i]);
      }
    }
    if (missingArgs.length > 0) {
      if (missingArgs.length === 1) {
        throw new Error(
          'Expected customization arguments to have property: ' +
          missingArgs[0]);
      } else {
        throw new Error(
          'Expected customization arguments to have properties: ' +
          missingArgs.join(', '));
      }
    }
  }

  getAnswerGroupWarnings(
      answerGroups: AnswerGroup[], stateName: string): Warning[] {
    var partialWarningsList = [];

    // This does not check the default outcome.
    for (var i = 0; i < answerGroups.length; i++) {
      const answerGroup = answerGroups[i];
      const groupId = String(i + 1);
      if (answerGroup.outcome.isConfusing(stateName)) {
        partialWarningsList.push({
          type: AppConstants.WARNING_TYPES.ERROR,
          message: (
            'Please specify what Oppia should do in Oppia response ' +
            `${groupId}.`)
        });
      }
      if (answerGroup.outcome.dest === stateName &&
          answerGroup.outcome.labelledAsCorrect) {
        partialWarningsList.push({
          type: AppConstants.WARNING_TYPES.ERROR,
          message: (
            `In answer group ${groupId}, self-loops should ` +
            'not be labelled as correct.')
        });
      }
      if (answerGroup.outcome.labelledAsCorrect &&
        answerGroup.outcome.destIfReallyStuck !== null) {
        partialWarningsList.push({
          type: AppConstants.WARNING_TYPES.ERROR,
          message: (
            `The answer group ${groupId} is labelled as 'correct', ` +
            'but includes a \'destination for really stuck learners\'. ' +
            'The latter is unnecessary and should be removed.')
        });
      }
    }
    return partialWarningsList;
  }

  getDefaultOutcomeWarnings(
      defaultOutcome: Outcome | null, stateName: string): Warning[] {
    var partialWarningsList = [];
    if (defaultOutcome && defaultOutcome.isConfusing(stateName)) {
      partialWarningsList.push({
        type: AppConstants.WARNING_TYPES.ERROR,
        message: (
          'Please add feedback for the user in the [All other answers] ' +
          'rule.')
      });
    }
    if (defaultOutcome && defaultOutcome.dest === stateName &&
        defaultOutcome.labelledAsCorrect) {
      partialWarningsList.push({
        type: AppConstants.WARNING_TYPES.ERROR,
        message: (
          'In the [All other answers] group, self-loops should not be ' +
          'labelled as correct.')
      });
    }
    return partialWarningsList;
  }

  getAllOutcomeWarnings(
      answerGroups: AnswerGroup[], defaultOutcome: Outcome | null,
      stateName: string): Warning[] {
    return (
      this.getAnswerGroupWarnings(answerGroups, stateName).concat(
        this.getDefaultOutcomeWarnings(defaultOutcome, stateName)));
  }

  isHTMLEmpty(html: string): boolean {
    // Fast return.
    if (html.trim().length === 0) {
      return true;
    }

    // Keep track of how many open and close tags there are. For example,
    // `<strong>` is an open tag and `</strong>` is a close tag. If they
    // do not have the same frequency, then the HTML content is not empty.
    // If they have the same frequency, then remove the occurrences from
    // the string and check if the remaining stripped string is empty.

    const tagsToRemove = [
      'strong', 'em', 'p', 'ul', 'ol', 'li',
      'i', 'b', 'br', 'span',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6'
    ];

    for (const tag of tagsToRemove) {
      const openRegex = new RegExp(`<${tag}>`, 'g');
      const closeRegex = new RegExp(`</${tag}>`, 'g');
      const numOpenTags = (html.match(openRegex) || []).length;
      const numCloseTags = (html.match(closeRegex) || []).length;
      if (numOpenTags !== numCloseTags) {
        return false;
      }
      html = html.replace(openRegex, '');
      html = html.replace(closeRegex, '');
    }

    // Remove special empty characters as well.
    html = html.replace(/&nbsp;/g, '');

    return html.trim().length === 0;
  }
}

angular.module('oppia').factory(
  'baseInteractionValidationService',
  downgradeInjectable(baseInteractionValidationService));
