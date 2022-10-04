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
  private mathFunctionNames = AppConstants.MATH_FUNCTION_NAMES;
  private supportedFunctionNames = AppConstants.SUPPORTED_FUNCTION_NAMES;

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
    if (
      errorMessage === 'Cannot read property \'column\' of undefined.' ||
      errorMessage === 'Cannot read properties of undefined ' +
        '(reading \'column\').'
    ) {
      let emptyFunctionNames = [];
      for (let functionName of this.mathFunctionNames) {
        if (expressionString.includes(functionName + '()')) {
          emptyFunctionNames.push(functionName);
        }
      }
      errorMessage = (
        'The ' + emptyFunctionNames.join(', ') +
        ' function(s) cannot be empty. Please enter a variable/number in it.');
    }
    return errorMessage;
  }

  isParenRedundant(
      expressionString: string,
      openingInd: number,
      closingInd: number
  ): boolean {
    /*
    Assumes that expressionString is syntactically valid.

    Multiple consecutive parens are considered redundant. eg: for ((a - b))
    the outer pair of parens are considered as redundant.
    */
    if ((closingInd + 2 < expressionString.length &&
        expressionString[closingInd + 2] === '^') ||
        (openingInd - 2 >= 0 &&
        expressionString[openingInd - 2] === '^')) {
      // Guppy adds redundant parens while using exponents, so we need to ignore
      // them.
      return false;
    }
    let leftParenIsRedundant = (
      openingInd - 1 >= 0 && expressionString[openingInd - 1] === '(');
    let rightParenIsRedundant = (
      closingInd + 1 < expressionString.length &&
      expressionString[closingInd + 1] === ')');
    return leftParenIsRedundant && rightParenIsRedundant;
  }

  /**
  * This function checks if an expression contains redundant params. It assumes
  * that the expression will be syntactically valid.
  * @param expressionString The math expression to be validated.
  *
  * @returns [boolean, string]. The boolean represents if the given expression
  * contains any redundant params, and the string is the substring of the
  * expression that contains redundant params.
  */
  containsRedundantParens(expressionString: string): [boolean, string] {
    let stack: number[] = [];

    for (let i = 0; i < expressionString.length; i++) {
      let char = expressionString[i];
      if (char === '(') {
        // Hack to identify if this is the opening paren of a function call
        // like sqrt(...). If so, we ignore that paren.
        if (i > 0 && expressionString[i - 1].match(/[a-zA-Z]|\^/)) {
          stack.push(-1);
        } else {
          stack.push(i);
        }
      } else if (char === ')') {
        let openingInd = stack.pop() || 0;
        if (openingInd !== -1 && this.isParenRedundant(
          expressionString, openingInd, i)) {
          return [true, expressionString.slice(openingInd - 1, i + 2)];
        }
      }
    }
    return [false, ''];
  }

  _validateExpression(expressionString: string): boolean {
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
    if (expressionString.match(/(\+$)|(\+\))/g)) {
      this.warningText = (
        'Your answer seems to be missing a variable/number after the "+".');
      return false;
    }
    let invalidIntegers = expressionString.match(
      /(\d*\.\d*\.\d*)|(\d+\.\D)|(\D\.\d+)|(\d+\.$)/g);
    if (invalidIntegers !== null) {
      this.warningText = (
        'Your answer contains an invalid term: ' + invalidIntegers[0]);
      return false;
    }
    let invalidMultiTerms = expressionString.match(/([a-zA-Z]+\d+)/g);
    if (invalidMultiTerms !== null) {
      let firstNumberIndex = invalidMultiTerms[0].search(/\d/);
      let correctString = (
        invalidMultiTerms[0].slice(firstNumberIndex) +
        invalidMultiTerms[0].slice(0, firstNumberIndex));
      this.warningText = (
        'When multiplying, the variable should come after the number: ' +
        correctString + '. Please update your answer and try again.'
      );
      return false;
    }

    try {
      expressionString = this.insertMultiplicationSigns(expressionString);
      nerdamer(expressionString);
    } catch (err: unknown) {
      if (err instanceof Error) {
        this.warningText = (
          this.cleanErrorMessage(err.message, expressionString));
      }
      return false;
    }

    if (expressionString.match(/\w\^((\w+\^)|(\(.*\^.*\)))/g)) {
      this.warningText = (
        'Your expression contains an exponent in an exponent ' +
        'which is not supported.');
      return false;
    }

    let exponents = expressionString.match(/\^((\([^\(\)]*\))|(\w+))/g);
    if (exponents !== null) {
      for (let exponent of exponents) {
        exponent = exponent.replace(/^\^/g, '');
        if (nerdamer(exponent).gt('5')) {
          this.warningText = (
            'Your expression contains an exponent with value greater than 5 ' +
            'which is not supported.');
          return false;
        }
      }
    }

    let [expressionContainsRedundantParens, errorString] = (
      this.containsRedundantParens(expressionString));
    if (expressionContainsRedundantParens) {
      this.warningText = (
        `Your expression contains redundant parentheses: ${errorString}.`);
      return false;
    }

    this.warningText = '';
    return true;
  }

  validateAlgebraicExpression(
      expressionString: string, validVariablesList: string[]): boolean {
    if (!this._validateExpression(expressionString)) {
      return false;
    }

    expressionString = this.insertMultiplicationSigns(expressionString);
    let variablesList = nerdamer(expressionString).variables();
    // Explicitly checking for presence of constants (pi and e).
    if (expressionString.match(/(^|[^a-zA-Z])e($|[^a-zA-Z])/g)) {
      variablesList.push('e');
    }
    if (expressionString.match(/(^|[^a-zA-Z])pi($|[^a-zA-Z])/g)) {
      variablesList.push('pi');
    }
    const greekNameToSymbolMap: { [greekName: string]: string } = (
      AppConstants.GREEK_LETTER_NAMES_TO_SYMBOLS);

    // Replacing greek names with symbols.
    for (let i = 0; i < variablesList.length; i++) {
      if (variablesList[i].length > 1) {
        variablesList[i] = greekNameToSymbolMap[variablesList[i]];
      }
    }

    if (validVariablesList.length !== 0) {
      for (let variable of variablesList) {
        if (validVariablesList.indexOf(variable) === -1) {
          this.warningText = (
            'You have entered an invalid variable: ' + variable +
            '. Please use only the variables ' + validVariablesList.join() +
            ' in your answer.');
          return false;
        }
      }
    }
    return true;
  }

  validateNumericExpression(expressionString: string): boolean {
    if (!this._validateExpression(expressionString)) {
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
    let greekLetters = Object.keys(
      AppConstants.GREEK_LETTER_NAMES_TO_SYMBOLS);
    let greekSymbols = Object.values(
      AppConstants.GREEK_LETTER_NAMES_TO_SYMBOLS);
    let greekLettersAndSymbols = [];
    for (let i = 0; i < greekLetters.length; i++) {
      greekLettersAndSymbols.push([greekLetters[i], greekSymbols[i]]);
    }
    // Sorting by length in descending order so that longer letters get replaced
    // before shorted ones. For eg. 'alphabeta' should have variables list as
    // ['alpha', 'beta'] and not ['alpha', 'b', 'eta'].
    greekLettersAndSymbols.sort((a, b) => b[0].length - a[0].length);

    let greekLetterToSymbol: { [letter: string]: string } = {};
    let greekSymbolToLetter: { [symbol: string]: string } = {};
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

    // Inserting multiplication signs between digit and variable.
    // For eg. 5w - z => 5*w - z.
    expressionString = expressionString.replace(new RegExp(
      '([0-9])([a-zA-Z])', 'g'), '$1*$2');

    // Inserting multiplication signs after closing parens.
    expressionString = expressionString.replace(/\)([^\*\+\/\-\^\)])/g, ')*$1');
    // Inserting multiplication signs before opening parens.
    // Note: We don't wanna insert signs before opening parens that are part of
    // functions, for eg., we want to convert a(b) to a*(b) but not sqrt(4) to
    // sqrt*(4).
    expressionString = expressionString.replace(
      /([^\*|\+|\/|\-|\^|\(])\(/g, '$1*(');
    // Removing the '*' added before math function parens.
    expressionString = expressionString.replace(new RegExp(
      '(' + this.mathFunctionNames.join('|') + ')\\*\\(', 'g'), '$1(');

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

  replaceConstantsWithVariables(
      expressionString: string, replaceZero = true): string {
    // Multiple instances of the same constant will be replaced by the same
    // variable.

    if (replaceZero) {
      // Replacing decimals with variables.
      // Eg: 3.4 + x => const3point4 + x
      // We need to do this differently since const3.4 would be
      // an invalid variable.
      expressionString = expressionString.replace(
        /([0-9]+)\.([0-9]+)/g, 'const$1point$2');

      // Replacing integers with variables.
      // Eg: 2 + x * 4 + 2 => const2 + x * const4 + const2
      // const2, const4 are considered as variables by nerdamer, just like x.
      expressionString = expressionString.replace(/([0-9]+)/g, 'const$1');
    } else {
      expressionString = expressionString.replace(
        /([1-9]+)\.([1-9]+)/g, 'const$1point$2');
      expressionString = expressionString.replace(/([1-9]+)/g, 'const$1');
    }
    return expressionString;
  }

  doPartsMatch(part1: string, part2: string): boolean {
    // Splitting a term by '*' or '/' would give a list of parts.
    // Nerdamer simplifies constant terms automatically so to avoid that,
    // we'll replace all constants with a variable.
    part1 = this.replaceConstantsWithVariables(part1);
    part2 = this.replaceConstantsWithVariables(part2);
    return nerdamer(part1).eq(nerdamer(part2).toString());
  }

  // The input terms to this function should be the terms split by '+'/'-'
  // from an expression.
  doTermsMatch(term1: string, term2: string): boolean {
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
        if (this.doPartsMatch(partsList1[i], partsList2[j])) {
          partsList1.splice(i, 1);
          partsList2.splice(j, 1);
          break;
        }
      }
    }

    return partsList1.length === 0 && partsList2.length === 0;
  }

  expressionMatchWithPlaceholders(
      expressionWithPlaceholders: string, inputExpression: string,
      placeholders: string[]): boolean {
    // Check if inputExpression contains any placeholders.
    for (let variable of nerdamer(inputExpression).variables()) {
      if (placeholders.includes(variable)) {
        return false;
      }
    }

    // The expressions are first split into terms by addition and subtraction.
    let termsWithPlaceholders = this.getTerms(expressionWithPlaceholders);
    let inputTerms = this.getTerms(inputExpression);

    // Each term in the expression containing placeholders is compared with
    // terms in the input expression. Two terms are said to be matched iff
    // upon subtracting or dividing them, the resultant contains only
    // placeholders. This would imply that the input term matches with the
    // general form(the term with placeholders).
    for (let i = termsWithPlaceholders.length - 1; i >= 0; i--) {
      for (let j = 0; j < inputTerms.length; j++) {
        let termWithPlaceholders = termsWithPlaceholders[i];
        let termWithoutPlaceholders = inputTerms[j];

        let divisionCondition;
        // Try catch block is meant to catch division by zero errors.
        try {
          let variablesAfterDivision = nerdamer(termWithPlaceholders).divide(
            termWithoutPlaceholders).variables();
          divisionCondition = variablesAfterDivision.every(
            variable => placeholders.includes(variable));
        } catch (e) {
          divisionCondition = true;
        }

        let variablesAfterSubtraction = nerdamer(termWithPlaceholders).subtract(
          termWithoutPlaceholders).variables();
        let subtractionCondition = variablesAfterSubtraction.every(
          variable => placeholders.includes(variable));

        // If only placeholders are left in the term after dividing/subtracting
        // them, then the terms are said to match.
        if (divisionCondition || subtractionCondition) {
          termsWithPlaceholders.splice(i, 1);
          inputTerms.splice(j, 1);
          break;
        }
      }
    }

    // Checks if all terms have matched.
    return termsWithPlaceholders.length + inputTerms.length === 0;
  }

  containsAtLeastOneVariable(expressionString: string): boolean {
    let variablesList = nerdamer(expressionString).variables();
    return variablesList.length > 0;
  }

  checkUnsupportedFunctions(expressionString: string): string[] {
    let matches = expressionString.match(/[a-zA-Z]+\(/g) || [];
    let unsupportedFunctions = [];
    for (let match of matches) {
      match = match.slice(0, -1); // Removing the "(".
      let matchIsSupported = false;
      for (let functionName of this.supportedFunctionNames) {
        if (functionName === match) {
          matchIsSupported = true;
          break;
        }
      }
      if (!matchIsSupported) {
        unsupportedFunctions.push(match);
      }
    }
    return unsupportedFunctions;
  }
}

angular.module('oppia').factory(
  'MathInteractionsService',
  downgradeInjectable(MathInteractionsService));
