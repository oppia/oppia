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

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';

import nerdamer from 'nerdamer';

import { AppConstants } from 'app.constants';

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
    // show the location.
    if (errorMessage.indexOf('bracket') !== -1) {
      // The error is about invalid bracket pairings.
      return 'It looks like your answer has an invalid bracket pairing.';
    }
    let colonIndex = errorMessage.indexOf(':');
    if (colonIndex !== -1) {
      errorMessage = errorMessage.slice(0, colonIndex);
    }
    let atColonIndex = errorMessage.indexOf(' at ');
    if (atColonIndex !== -1) {
      errorMessage = errorMessage.slice(0, atColonIndex);
    }
    if (errorMessage[errorMessage.length - 1] === '!') {
      errorMessage = errorMessage.slice(0, errorMessage.length - 1);
    }
    if (errorMessage[errorMessage.length - 1] !== '.') {
      errorMessage += '.';
    }
    return errorMessage;
  }

  validateExpression(expressionString: string, algebraic = true): boolean {
    expressionString = expressionString.split(' ').join('');
    let expressionObject;
    if (expressionString.length === 0) {
      this.warningText = 'Please enter a non-empty answer.';
      return false;
    } else if (expressionString.indexOf('=') !== -1 || expressionString.indexOf(
      '<') !== -1 || expressionString.indexOf('>') !== -1) {
      this.warningText = 'It looks like you have entered an ' +
        'equation/inequality. Please enter an expression instead.';
      return false;
    } else if (expressionString.indexOf('_') !== -1) {
      this.warningText = 'Invalid character \'_\' present in the expression.';
      return false;
    }
    try {
      expressionObject = nerdamer(expressionString);
    } catch (err) {
      this.warningText = this.cleanErrorMessage(err.message);
      return false;
    }
    if (algebraic && expressionObject.variables().length === 0) {
      this.warningText = 'It looks like you have entered only ' +
        'numbers. Make sure to include the necessary variables' +
        ' mentioned in the question.';
      return false;
    }
    if (!algebraic && expressionObject.variables().length !== 0) {
      this.warningText = 'It looks like you have entered some non-numeric' +
        ' values. Please enter numbers only.';
      return false;
    }
    return true;
  }

  validateEquation(equationString: string): boolean {
    equationString = equationString.split(' ').join('');
    if (equationString.length === 0) {
      this.warningText = 'Please enter a non-empty answer.';
      return false;
    } else if (equationString.indexOf(
      '<') !== -1 || equationString.indexOf('>') !== -1) {
      this.warningText = 'It looks like you have entered an ' +
        'inequality. Please enter an equation instead.';
      return false;
    } else if (equationString.indexOf('=') === -1) {
      this.warningText = 'It looks like you have entered an ' +
        'expression. Please enter an equation instead.';
      return false;
    } else if (equationString.indexOf('=') === 0) {
      this.warningText = 'The LHS of your equation is empty.';
      return false;
    } else if (equationString.indexOf('=') === equationString.length - 1) {
      this.warningText = 'The RHS of your equation is empty.';
      return false;
    }
    let splitString = equationString.split('=');
    let lhsString = splitString[0], rhsString = splitString[1];
    let lhsIsAlgebraicallyValid = this.validateExpression(lhsString);
    let rhsIsAlgebraicallyValid = this.validateExpression(rhsString);
    let lhsIsNumericallyValid = this.validateExpression(lhsString, false);
    let rhsIsNumericallyValid = this.validateExpression(rhsString, false);

    // At least one side must be algebraic. Purely numeric equations are
    // considered as invalid.
    if (lhsIsNumericallyValid && rhsIsNumericallyValid) {
      this.warningText = 'The equation must contain at least one variable.';
      return false;
    }
    if (lhsIsAlgebraicallyValid && rhsIsAlgebraicallyValid ||
      lhsIsAlgebraicallyValid && rhsIsNumericallyValid ||
      lhsIsNumericallyValid && rhsIsAlgebraicallyValid) {
      this.warningText = '';
      return true;
    }
    // Neither side is algebraically valid. Calling validation functions again
    // to appropriately update the warningText.
    this.validateExpression(lhsString);
    return false;
  }

  getWarningText(): string {
    return this.warningText;
  }

  insertMultiplicationSigns(expressionString: string): string {
    // Assumes that given expressionString is valid.
    // Nerdamer allows multi-character variables so, 'ax+b' will be considered
    // to have variables: [ax, b], but we want a and x to be considered as
    // separate variables which is why we would assume that any such instance of
    // consecutive characters means they are single characters multiplied with
    // each other. So, 'ax+b' would be transformed to 'a*x+b' via this function.
    let variables = nerdamer(expressionString).variables();
    for (let variable of variables) {
      // We wouldn't want to interpolate '*' signs between valid greek letters.
      // @ts-ignore: TODO(#7434): Remove this ignore after we find a way to get
      // rid of the TS2339 error on AppConstants.
      if (AppConstants.GREEK_LETTERS.indexOf(variable) === -1) {
        let separatedVariables = variable.split('').join('*');
        expressionString = expressionString.replace(
          variable, separatedVariables);
      }
    }
    return expressionString;
  }

  replaceAbsSymbolWithText(expressionString: string): string {
    // The guppy editor outputs abs as a symbol '|x|' but that is incompatible
    // with nerdamer and the backend validations. Both of them need 'abs(x)',
    // hence the replacement.
    let opening = true;
    let modifiedExpressionList = [];
    for (let i = 0; i < expressionString.length; i++) {
      if (expressionString[i] === '|') {
        if (opening) {
          modifiedExpressionList.push('abs(');
          opening = false;
        } else {
          modifiedExpressionList.push(')');
          opening = true;
        }
      } else {
        modifiedExpressionList.push(expressionString[i]);
      }
    }
    return modifiedExpressionList.join('');
  }
}

angular.module('oppia').factory(
  'MathInteractionsService',
  downgradeInjectable(MathInteractionsService));
