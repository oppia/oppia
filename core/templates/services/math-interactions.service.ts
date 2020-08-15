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
  // TODO(#7434): Use dot notation after we find a way to get
  // rid of the TS2339 error on AppConstants.
  // eslint-disable-next-line dot-notation
  private mathFunctionNames = AppConstants['MATH_FUNCTION_NAMES'];

  private cleanErrorMessage(
      errorMessage: string, expressionString: string): string {
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
    if (errorMessage === 'Division by zero not allowed.') {
      errorMessage = 'Your answer includes a division by zero, which is ' +
        'not valid.';
    }
    if (errorMessage.indexOf('is not a valid postfix operator.') !== -1) {
      errorMessage = (
        'Your answer seems to be missing a variable/number after the "' +
        errorMessage[0] + '".');
    }
    if (errorMessage === 'A prefix operator was expected.') {
      let symbol1, symbol2;
      for (let s1 of '/*^') {
        for (let s2 of '+-/*^') {
          if (expressionString.indexOf(s1 + s2) !== -1) {
            symbol1 = s1;
            symbol2 = s2;
          }
        }
      }
      errorMessage = (
        'Your answer has two symbols next to each other: "' + symbol1 +
        '" and "' + symbol2 + '".');
    }
    return errorMessage;
  }

  _validateExpression(
      expressionString: string, validVariablesList: string[]): boolean {
    expressionString = expressionString.replace(/\s/g, '');
    if (expressionString.length === 0) {
      this.warningText = 'Please enter an answer before submitting.';
      return false;
    } else if (expressionString.indexOf('=') !== -1 || expressionString.indexOf(
      '<') !== -1 || expressionString.indexOf('>') !== -1) {
      this.warningText = 'It looks like you have entered an ' +
        'equation/inequality. Please enter an expression instead.';
      return false;
    } else if (expressionString.indexOf('_') !== -1) {
      this.warningText = 'Your answer contains an invalid character: "_".';
      return false;
    }
    let invalidIntegers = expressionString.match(
      /(\d*\.\d*\.\d*)|(\d+\.\D)|(\D\.\d+)|(\d+\.$)/g);
    if (invalidIntegers !== null) {
      this.warningText = (
        'Your answer contains an invalid term: ' + invalidIntegers[0]);
      return false;
    }
    try {
      expressionString = this.insertMultiplicationSigns(expressionString);
      nerdamer(expressionString);
    } catch (err) {
      this.warningText = this.cleanErrorMessage(err.message, expressionString);
      return false;
    }
    this.warningText = '';
    return true;
  }

  validateAlgebraicExpression(
      expressionString: string, validVariablesList: string[]) {
    if (!this._validateExpression(expressionString, validVariablesList)) {
      return false;
    }

    let variablesList = nerdamer(this.insertMultiplicationSigns(
      expressionString)).variables();
    if (variablesList.length === 0) {
      this.warningText = 'It looks like you have entered only ' +
      'numbers. Make sure to include the necessary variables' +
      ' mentioned in the question.';
      return false;
    } else if (validVariablesList.length !== 0) {
      for (let variable of variablesList) {
        if (validVariablesList.indexOf(variable) === -1) {
          this.warningText = (
            'You have entered an invalid character: ' + variable +
            '. Please use only the characters ' + validVariablesList.join() +
            ' in your answer.');
          return false;
        }
      }
    }
    return true;
  }

  validateNumericExpression(expressionString: string) {
    if (!this._validateExpression(expressionString, [])) {
      return false;
    }
    for (let functionName of this.mathFunctionNames) {
      expressionString = expressionString.replace(
        new RegExp(functionName, 'g'), '');
    }
    if (/[a-zA-Z]/.test(expressionString)) {
      this.warningText = 'It looks like you have entered some variables. ' +
        'Please enter numbers only.';
      return false;
    }
    return true;
  }

  validateEquation(
      equationString: string, validVariablesList: string[]): boolean {
    equationString = equationString.replace(/\s/g, '');
    if (equationString.length === 0) {
      this.warningText = 'Please enter an answer before submitting.';
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
    if (splitString.length !== 2) {
      this.warningText = 'Your equation contains multiple = signs.';
      return false;
    }
    let lhsString = splitString[0], rhsString = splitString[1];
    let lhsIsAlgebraicallyValid = this.validateAlgebraicExpression(
      lhsString, validVariablesList);
    let rhsIsAlgebraicallyValid = this.validateAlgebraicExpression(
      rhsString, validVariablesList);
    let lhsIsNumericallyValid = this.validateNumericExpression(lhsString);
    let rhsIsNumericallyValid = this.validateNumericExpression(rhsString);

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
    this.validateAlgebraicExpression(lhsString, validVariablesList);
    if (this.getWarningText().length === 0) {
      this.validateAlgebraicExpression(rhsString, validVariablesList);
    }
    return false;
  }

  getWarningText(): string {
    return this.warningText;
  }

  insertMultiplicationSigns(expressionString: string): string {
    // TODO(#7434): Use dot notation after we find a way to get
    // rid of the TS2339 error on AppConstants.
    /* eslint-disable dot-notation */
    let greekLetters = Object.keys(
      AppConstants['GREEK_LETTER_NAMES_TO_SYMBOLS']);
    let greekSymbols = Object.values(
      AppConstants['GREEK_LETTER_NAMES_TO_SYMBOLS']);
    /* eslint-enable dot-notation */
    let greekLettersAndSymbols = [];
    for (let i = 0; i < greekLetters.length; i++) {
      greekLettersAndSymbols.push([greekLetters[i], greekSymbols[i]]);
    }
    // Sorting by length in descending order so that longer letters get replaced
    // before shorted ones. For eg. 'alphabeta' should have variables list as
    // ['alpha', 'beta'] and not ['alpha', 'b', 'eta'].
    greekLettersAndSymbols.sort((a, b) => b[0].length - a[0].length);

    let greekLetterToSymbol = {};
    let greekSymbolToLetter = {};
    for (let letterAndSymbol of greekLettersAndSymbols) {
      greekLetterToSymbol[letterAndSymbol[0]] = letterAndSymbol[1];
      greekSymbolToLetter[letterAndSymbol[1]] = letterAndSymbol[0];
    }

    // Temporarily replacing letters with symbols.
    for (let letter in greekLetterToSymbol) {
      expressionString = expressionString.replace(
        new RegExp(letter, 'g'), greekLetterToSymbol[letter]);
    }

    expressionString = expressionString.replace(/\s/g, '');
    // Assumes that given expressionString is valid.
    // Nerdamer allows multi-character variables so, 'ax+b' will be considered
    // to have variables: [ax, b], but we want a and x to be considered as
    // separate variables which is why we would assume that any such instance of
    // consecutive characters means they are single characters multiplied with
    // each other. So, 'ax+b' would be transformed to 'a*x+b' via this function.
    let variables = nerdamer(expressionString).variables();
    for (let variable of variables) {
      let separatedVariables = variable.split('').join('*');
      expressionString = expressionString.replace(
        new RegExp(variable, 'g'), separatedVariables);
    }
    // Reverting the temporary replacement of letters.
    for (let symbol in greekSymbolToLetter) {
      expressionString = expressionString.replace(
        new RegExp(symbol, 'g'), greekSymbolToLetter[symbol]);
    }

    // Inserting multiplication signs before functions. For eg. 5sqrt(x) should
    // be treated as 5*sqrt(x).
    for (let functionName of this.mathFunctionNames) {
      expressionString = expressionString.replace(new RegExp(
        '([a-zA-Z0-9\)])' + functionName, 'g'), '$1*' + functionName);
    }
    // Inserting multiplication signs after closing parens.
    expressionString = expressionString.replace(/\)([^\*\+\/\-\^\)])/g, ')*$1');
    // Inserting multiplication signs before opening parens.
    // Note: We don't wanna insert signs before opening parens that are part of
    // functions, for eg., we want to convert a(b) to a*(b) but not sqrt(4) to
    // sqrt*(4).
    let removeExtraMultiSymbol = expressionString[0] === '(';
    expressionString = expressionString.replace(new RegExp(
      '(?<!\\*|\\+|\\/|\\-|\\^|\\(|' + this.mathFunctionNames.join(
        '|') + ')\\(', 'g'), '*(');
    if (removeExtraMultiSymbol) {
      expressionString = expressionString.slice(1);
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

  getTerms(expressionString: string, splitByAddition = true): string[] {
    let listOfTerms: string[] = [];
    let currentTerm: string = '';
    let bracketBalance: number = 0;
    let shouldModifyNextTerm: boolean = false;
    let modifyTerm = function(termString: string): string {
      // If the shouldModifyNextTerm flag is set to true, we add the '-' sign,
      // or raise the term to a power of -1. This ensures that when the final
      // list is joined by the '+'/'*' sign, it matches with the original
      // expression. For eg.
      // '3/10' would be split as [3, 10^(-1)] and
      // '3-10' would be split as [3, -(10)].
      if (splitByAddition) {
        return '-(' + termString + ')';
      } else {
        return '(' + termString + ')^(-1)';
      }
    };
    const primaryDelimiter = splitByAddition ? '+' : '*';
    const secondaryDelimiter = splitByAddition ? '-' : '/';

    expressionString = expressionString.replace(/\s/g, '');

    // Temporarily replacing all unary negation signs with '~' so as to avoid
    // splitting terms by them. We only need to split terms by binary
    // subtraction signs and not unary negation signs. A '-' sign is considered
    // to be binary subtraction iff it is preceded by an alphanumeric or a
    // closing bracket, otherwise it is considered as unary negation operation.
    // NOTE: The replace function is called twice to deal with cases where there
    // might be overlapping matches.
    // For eg. 4----5 would be converted to 4-~-~5 after the first call. So we
    // need a second call to convert it to the desired result, which is 4-~~~5.
    expressionString = expressionString.replace(/([^a-zA-Z0-9\)])-/g, '$1~');
    expressionString = expressionString.replace(/([^a-zA-Z0-9\)])-/g, '$1~');

    for (let i = 0; i < expressionString.length; i++) {
      let currentVal = expressionString[i];
      if (currentVal === '(' || currentVal === ')') {
        bracketBalance += (currentVal === '(') ? 1 : -1;
      }

      // Split term only if we are not inside a set of parens and the current
      // value is a delimiter.
      if (bracketBalance === 0 && (
        currentVal === primaryDelimiter || currentVal === secondaryDelimiter)) {
        if (currentTerm.length !== 0) {
          if (shouldModifyNextTerm) {
            currentTerm = modifyTerm(currentTerm);
            shouldModifyNextTerm = false;
          }
          listOfTerms.push(currentTerm);
          currentTerm = '';
        }
        if (currentVal === secondaryDelimiter) {
          shouldModifyNextTerm = true;
        }
      } else {
        currentTerm += currentVal;
      }
    }
    if (shouldModifyNextTerm) {
      currentTerm = modifyTerm(currentTerm);
      shouldModifyNextTerm = false;
    }
    listOfTerms.push(currentTerm);

    // Reverting the temporary '~' replace in the final list of terms.
    for (let i = 0; i < listOfTerms.length; i++) {
      listOfTerms[i] = listOfTerms[i].replace(/~/g, '-');
    }
    return listOfTerms;
  }

  // The input terms to this function should be the terms split by '+'/'-'
  // from an expression.
  termsMatch(term1: string, term2: string): boolean {
    // We split both terms by multiplication and division into separate parts
    // and try to match these parts from both inputs by checking equivalency.
    let partsList1 = this.getTerms(term1, false);
    let partsList2 = this.getTerms(term2, false);

    // NOTE: We only need to iterate from the top in the partsList1 list since
    // in the partsList2 list, we will break the loop each time an element is
    // removed from it, thus, indexing errors would only arise in the outer
    // loop.
    for (let i = partsList1.length - 1; i >= 0; i--) {
      for (let j = 0; j < partsList2.length; j++) {
        if (nerdamer(partsList1[i]).eq(nerdamer(partsList2[j]).toString())) {
          partsList1.splice(i, 1);
          partsList2.splice(j, 1);
          break;
        }
      }
    }

    return partsList1.length === 0 && partsList2.length === 0;
  }
}

angular.module('oppia').factory(
  'MathInteractionsService',
  downgradeInjectable(MathInteractionsService));
