// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service for providing helper functions for math interactions.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

var nerdamer = require('nerdamer');

@Injectable({
  providedIn: 'root'
})
export class MathInteractionsService {
  private warningText = '';

  private cleanErrorMessage(errorMessage: string): string {
    // The error thrown by nerdamer includes the index of the violation which
    // starts with a colon. That part needs to be removed before displaying
    // the error to the end user. Same rationale applies for stripping the
    // error message from 'at', since some errors from nerdamer use 'at' to
    // to show the location.
    var colonIndex = errorMessage.indexOf(':');
    if (colonIndex !== -1) {
      errorMessage = errorMessage.slice(0, colonIndex);
    }
    var atColonIndex = errorMessage.indexOf(' at ');
    if (atColonIndex !== -1) {
      errorMessage = errorMessage.slice(0, atColonIndex);
    }
    if (errorMessage[errorMessage.length - 1] !== '.') {
      errorMessage += '.';
    }
    return errorMessage;
  }

  validateAnswer(answer: string): boolean {
    var expression;
    try {
      expression = nerdamer(answer);
    } catch (err) {
      this.warningText = this.cleanErrorMessage(err.message);
      return false;
    }
    if (answer.length === 0) {
      this.warningText = 'Please enter a non-empty answer.';
      return false;
    } else if (answer.indexOf('=') !== -1 || answer.indexOf(
      '<') !== -1 || answer.indexOf('>') !== -1) {
      this.warningText = 'It looks like you have entered an ' +
        'equation/inequality. Please enter an algebraic ' +
        'expression instead.';
      return false;
    } else if (expression.variables().length === 0) {
      this.warningText = 'It looks like you have entered only ' +
        'numbers. Make sure to include the necessary variables' +
        ' mentioned in the question.';
      return false;
    }
    return true;
  }

  getWarningText(): string {
    return this.warningText;
  }
}

angular.module('oppia').factory(
  'MathInteractionsService',
  downgradeInjectable(MathInteractionsService));
