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
 * @fileoverview Components used by both the editor and reader of the
 *  LogicProof interaction.
 */

var logicProofShared = (function() {
  // Used by parseLineString() to limit the number of possible parsings of a
  // line (or line template) considered.
  var MAX_NUM_PARSINGS_PERMITTED = 1000;
  // Used by assignTypesToExpressionArray() to limit the number of possible
  // typings of an expression considered.
  var MAX_NUM_TYPINGS_PERMITTED = 1000;

  // ERROR-HANDLING

  // UserErrors have codes that refer to entries in the errorDictionary (which
  // is either logicProofData.BASE_GENERAL_MESSAGES or
  // logicProofTeacher.TEACHER_ERROR_MESSAGES), from which a human-readable
  // message can be constructed.
  var UserError = function(code, parameters) {
    this.name = 'UserError';
    this.code = code;
    this.parameters = parameters || {};
  };

  // These errors already have messages which are user-readable.
  var PreRenderedUserError = function(messages, code) {
    this.name = 'PreRenderedUserError';
    this.messages = messages;
    this.code = code;
  };
  // TODO (Jacob) Make these errors prototype from Error()

  /** Converts a message template into a string to show to the user.
   * @param messageTemplate: a GeneralMessageTemplate object that determines how
   * to build the string describing an error.
   * @param parameterFormats: a dictionary of GeneralMessageParameters, which
   *        specify the format of the parameter in question (e.g. 'string').
   * @param parameters: a dictionary giving the values of the parameters for
   *        this particular instance of the message.
   * @param language: the relevant Language.
   * @result a user-readable string.
   */
  var renderGeneralMessage = function(
      messageTemplate, parameterFormats, parameters, language) {
    var message = '';
    for (var i = 0; i < messageTemplate.length; i++) {
      if (messageTemplate[i].isFixed) {
        message += messageTemplate[i].content;
      } else {
        var parameterFormat = parameterFormats[
          messageTemplate[i].content].format;
        var parameter = parameters[messageTemplate[i].content];
        switch (parameterFormat) {
          case 'string':
            message += parameter;
            break;
          case 'expression':
            message += displayExpression(parameter, language.operators);
            break;
          default:
            throw Error(
              'Unknown format ' + parameterFormat +
              ' sent to renderGeneralMessage().');
        }
      }
    }
    return message;
  };

  /**
   * @param {UserError} error - a UserError object
   * @param {object} errorDictionary - a dictionary keyed by error codes for
   *        each of which it provides a description of possible ways to display
   *        the error to the user, one of which will be chosen at random.
   * @param {Language} language - the relevant Language
   * @return {string} A string to show to the user describing what went wrong.
   */
  var renderError = function(error, errorDictionary, language) {
    if (error.name === 'UserError') {
      if (!errorDictionary.hasOwnProperty(error.code)) {
        throw new Error(
          'Unknown error code ' + error.code + ' sent to renderError().');
      }
      var messageTemplates = errorDictionary[error.code].templates;
      var messageTemplate = messageTemplates[
        Math.floor((Math.random() * messageTemplates.length))];
      return renderGeneralMessage(
        messageTemplate, errorDictionary[error.code].parameters,
        error.parameters, language);
    } else if (error.name === 'PreRenderedUserError') {
      return error.messages[
        Math.floor((Math.random() * error.messages.length))];
    } else {
      throw error;
    }
  };

  // DISPLAY

  /**
   * @param {Expression} expression - an Expression, which is to be displayed
   * @param {object} operators - provides the symbols keys of the operators so
   *        that we we know e.g. 'for_all' should be displayed using '@'.
   * @return {string} A string representing the expression that can be shown to
   *        the user.
   */
  var displayExpression = function(expression, operators) {
    return displayExpressionHelper(expression, operators, 0);
  };

  /**
   * Recursive helper for displayExpression().
   *
   * @param {Expression} expression - an Expression, which is to be displayed
   * @param {object} operators - provides the symbols keys of the operators so
   *        that we we know e.g. 'for_all' should be displayed using '@'.
   * @param {int} desirabilityOfBrackets - used internally to determine whether
   *        to surround the formula with brackets.
   * @return {string} A string representing the expression.
   */
  var displayExpressionHelper = function(
      expression, operators, desirabilityOfBrackets) {
    var desirabilityOfBracketsBelow = (
      expression.top_kind_name === 'binary_connective' ||
      expression.top_kind_name === 'binary_relation' ||
      expression.top_kind_name === 'binary_function'
    ) ? 2 : (
        expression.top_kind_name === 'unary_connective' ||
        expression.top_kind_name === 'quantifier'
      ) ? 1 : 0;
    var processedArguments = [];
    var processedDummies = [];
    for (var i = 0; i < expression.arguments.length; i++) {
      processedArguments.push(
        displayExpressionHelper(
          expression.arguments[i], operators, desirabilityOfBracketsBelow));
    }
    for (var i = 0; i < expression.dummies.length; i++) {
      processedDummies.push(
        displayExpressionHelper(
          expression.dummies[i], operators, desirabilityOfBracketsBelow));
    }

    var symbol = (!operators.hasOwnProperty(expression.top_operator_name)) ?
      expression.top_operator_name :
      (!operators[expression.top_operator_name].hasOwnProperty('symbols')) ?
        expression.top_operator_name :
        operators[expression.top_operator_name].symbols[0];

    if (expression.top_kind_name === 'binary_connective' ||
        expression.top_kind_name === 'binary_relation' ||
        expression.top_kind_name === 'binary_function') {
      return (
        desirabilityOfBrackets > 0 ?
          '(' + processedArguments.join(symbol) + ')' :
          processedArguments.join(symbol));
    } else if (expression.top_kind_name === 'unary_connective') {
      var output = symbol + processedArguments[0];
      return (desirabilityOfBrackets === 2) ? '(' + output + ')' : output;
    } else if (expression.top_kind_name === 'quantifier') {
      var output = symbol + processedDummies[0] + '.' + processedArguments[0];
      return (desirabilityOfBrackets === 2) ? '(' + output + ')' : output;
    } else if (expression.top_kind_name === 'bounded_quantifier') {
      var output = symbol + processedArguments[0] + '.' + processedArguments[1];
      return (desirabilityOfBrackets === 2) ? '(' + output + ')' : output;
    } else if (expression.top_kind_name === 'prefix_relation' ||
        expression.top_kind_name === 'prefix_function') {
      return symbol + '(' + processedArguments.join(',') + ')';
    } else if (expression.top_kind_name === 'ranged_function') {
      return (
        symbol + '{' + processedArguments[0] + ' | ' + processedArguments[1] +
        '}');
    } else if (expression.top_kind_name === 'atom' ||
      expression.top_kind_name === 'constant' ||
      expression.top_kind_name === 'variable') {
      return symbol;
    } else {
      throw Error(
        'Unknown kind ' + expression.top_kind_name +
        ' sent to displayExpression()');
    }
  };

  var displayExpressionArray = function(expressionArray, operators) {
    var processedArray = [];
    for (var i = 0; i < expressionArray.length; i++) {
      processedArray.push(
        displayExpressionHelper(expressionArray[i], operators));
    }
    return processedArray.join(', ');
  };

  // PARSING

  /**
   * This function checks whether the string contains any symbol that occurs
   * in a member of the symbols key for some operator (these will be
   * symbols such as ∀, =, <).
   * @param {string} string - contains the characters we check
   * @param {object} operators - a dictionary of Operator objects
   * @param {boolean} isTemplate - denotes that the string represents a line
   *        template (which may have substitutions) and not just a line.
   * @return {boolean} true or false
   */
  var containsLogicalCharacter = function(string, operators, isTemplate) {
    var GENERAL_LOGICAL_CHARACTERS = '(),';
    var TEMPLATE_LOGICAL_CHARACTERS = '[->]{|}';

    if (containsCharacterFromArray(string, GENERAL_LOGICAL_CHARACTERS)) {
      return true;
    }
    if (isTemplate &&
        containsCharacterFromArray(string, TEMPLATE_LOGICAL_CHARACTERS)) {
      return true;
    }

    for (var key in operators) {
      if (operators[key].hasOwnProperty('symbols')) {
        for (var i = 0; i < operators[key].symbols.length; i++) {
          // We check each character of a multi-character symbol in turn.
          for (var j = 0; j < operators[key].symbols[i].length; j++) {
            if (string.indexOf(operators[key].symbols[i][j]) !== -1) {
              return true;
            }
          }
        }
      }
    }
    return false;
  };

  /**
   * This function strips whitespace from within expressions, whilst using the
   * whitespace between expressions to split a line into an array of word /
   * expression strings.
   *  e.g. 'from p and q we have p ∧ q' will be converted to ['from', 'p',
   *   'and', 'q', 'we', 'have', 'p∧q'].
   * @param {string} inputString - the string from which whitespace is to be
   *        stripped.
   * @param {object} operators - a dictionary of the Operator objects usable in
   *        the line
   * @param {boolean} isTemplate - denotes that the string represents a line
   *        template (which may have substitutions) and not just a line.
   * @return {Array} A non-empty array of words and expressions (as strings).
   * @throws if the line is blank or contains an unknown character.
   */
  var preParseLineString = function(inputString, operators, isTemplate) {
    // The logical characters that may occur at the start and end of a formula
    // respectively. The unicode characters are 'for all' and 'exists'.
    var POSSIBLE_START_CHARS = '({\u2200\u2203~';
    var POSSIBLE_END_CHARS = ')}]';

    var POSSIBLE_NAME_CHARS = (
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 _');

    var _absorbsSpacesToTheLeft = function(character) {
      return containsLogicalCharacter(character, operators, isTemplate) &&
        !containsCharacter(POSSIBLE_START_CHARS, character);
    };
    var _absorbsSpacesToTheRight = function(character) {
      return (containsLogicalCharacter(character, operators, isTemplate) &&
        !containsCharacter(POSSIBLE_END_CHARS, character)) ||
        character === ' ';
    };
    var _isLegalCharacter = function(character) {
      return containsCharacter(POSSIBLE_NAME_CHARS, character) ||
        containsLogicalCharacter(character, operators, isTemplate);
    };

    var strippedString = '';
    for (var i = 0; i < inputString.length; i++) {
      if (!_isLegalCharacter(inputString[i])) {
        throw new UserError('illegal_symbol', {
          symbol: inputString[i]
        });
      }
      // We keep all non-spaces, and all spaces that are absorbed neither by
      // characters to their left nor their right.
      if (inputString[i] !== ' ' ||
          (i === 0 || !_absorbsSpacesToTheRight(
            strippedString[strippedString.length - 1])) &&
          (i === inputString.length - 1 || !_absorbsSpacesToTheLeft(
            inputString[i + 1]))) {
        strippedString += inputString[i];
      }
    }

    if (strippedString.replace(/ /g, '') === '') {
      throw new UserError('blank_line', {});
    }
    return strippedString.trim().split(' ');
  };

  /**
   * @param {string} inputString - written by the user - we will parse it.
   * @param {object} operators - the relevant operators, which are just needed
   *        for their symbols so we can identify whether the symbols the user
   *        is using are legitimate.
   * @param {object} vocabulary - a dictionary whose keys are phrases such as
   *        'have' whose entries are arrays of possible ways to write each
   *        phrase, for example ['have', 'we have']. We will attempt to match
   *        sections of the inputString to the ways of writing each phrase.
   * @param {boolean} isTemplate - if true, we parse the input as a
   *        LineTemplate; otherwise we parse it as a Line.
   * @return {*} A LineTemplate.reader_view if isTemplate === true, and a
   *         ProtoLine if isTemplate === false.
   * @throws If a section of the string cannot be identified as either a phrase
   *         or an expression then we throw an error that tries to best identify
   *         what the user intended and did wrong.
   */
  var parseLineString = function(
      inputString, operators, vocabulary, isTemplate) {
    var unparsedArray = preParseLineString(inputString, operators, isTemplate);

    // We compile all words occurring in the vocabulary, to help us identify
    // them in lines.
    var vocabularyWords = [];
    for (var key in vocabulary) {
      for (var i = 0; i < vocabulary[key].length; i++) {
        for (var j = 0; j < vocabulary[key][i].split(' ').length; j++) {
          if (vocabularyWords.indexOf(
            vocabulary[key][i].split(' ')[j]) === -1) {
            vocabularyWords.push(vocabulary[key][i].split(' ')[j]);
          }
        }
      }
    }

    // The lth entry in this array will contain all parsings of the first
    // l-many elements of the unparsedArray.
    var partiallyParsedArrays = [[[]]];
    for (var i = 1; i <= unparsedArray.length; i++) {
      partiallyParsedArrays.push([]);
    }

    for (var i = 0; i < unparsedArray.length; i++) {
      // We have parsed the first i-many entries in the given unparsedArray,
      // and will now attempt to parse the next one.

      // This will only occur in pathological cases
      if (partiallyParsedArrays[i].length > MAX_NUM_PARSINGS_PERMITTED) {
        throw new UserError('too_many_parsings', {});
      }

      for (var j = i + 1; j <= unparsedArray.length; j++) {
        for (var key in vocabulary) {
          for (var k = 0; k < vocabulary[key].length; k++) {
            if (unparsedArray.slice(i, j).join(' ').toLowerCase() ===
                vocabulary[key][k]) {
              // We have identified the next (j-i)-many words together form a
              // phrase in the vocabulary dictionary.
              for (var l = 0; l < partiallyParsedArrays[i].length; l++) {
                partiallyParsedArrays[j].push(
                  partiallyParsedArrays[i][l].concat([{
                    format: 'phrase',
                    content: key
                  }])
                );
              }
            }
          }
        }
      }

      // If something is a known word then we do not attempt to parse it as an
      // expression. This is because any word can be regarded as an expression
      // (as a single atom) so otherwise we would end up with a large number of
      // spurious parsings. The exception is single-character words, because
      // e.g. 'a' could reasonably be either a word or the name of an atom.
      if (unparsedArray[i].length === 1 ||
          vocabularyWords.indexOf(unparsedArray[i].toLowerCase()) === -1) {
        // We attempt to parse this entry as an expression / expression template
        try {
          var expression = logicProofParser.parse(
            unparsedArray[i], isTemplate ? 'expressionTemplate' : 'expression');
          for (var j = 0; j < partiallyParsedArrays[i].length; j++) {
            // We do not allow a line to have two expressions in a row. This is
            // to allow the identification of typos: For example if the user
            // types 'fron p∧q ...' then otherwise we would think that both
            // 'fron' and 'p∧q' are expressions. We also do not attempt to
            // parse a word as an expression if it is a vocabulary word, to
            // avoid masses of silly attempts to parse the line.
            if (i === 0 ||
                partiallyParsedArrays[i][j][
                  partiallyParsedArrays[i][j].length - 1
                ].format === 'phrase') {
              partiallyParsedArrays[i + 1].push(
                partiallyParsedArrays[i][j].concat([{
                  format: 'expression',
                  content: expression
                }])
              );
            }
          }
        } catch (err) {}
      }
    }

    if (partiallyParsedArrays[unparsedArray.length].length > 0) {
      // We have succeeded in fully parsing
      return partiallyParsedArrays[unparsedArray.length];
    } else {
      // We identify the best attempts
      for (var i = unparsedArray.length; i >= 0; i--) {
        if (partiallyParsedArrays[i].length > 0) {
          var numEntriesMatched = i;
          break;
        }
      }
      // We return a description of the problem, based on one of the best
      // attempts.
      // NOTE: This is not guaranteed to correctly identify the mistake the
      // user made. It could do with improvement based on user feedback.
      // containsLogicalCharacter is used to guess if something is an
      // expression, but it is not always correct because expressions may
      // consist only of letters.
      var bestAttempt = partiallyParsedArrays[numEntriesMatched][0];
      if (numEntriesMatched === 0 ||
          bestAttempt[bestAttempt.length - 1].format === 'phrase') {
        var word = unparsedArray[numEntriesMatched];
        throw (vocabularyWords.indexOf(word) !== -1) ?
          new UserError('unidentified_phrase_starting_at', {
            word: word
          }) :
          new UserError('unidentified_word', {
            word: word
          });
      } else {
        var word1 = unparsedArray[numEntriesMatched - 1];
        var word2 = unparsedArray[numEntriesMatched];
        if (vocabularyWords.indexOf(word1) !== -1) {
          throw new UserError('unidentified_phrase_starting_at', {
            word: word1
          });
        } else if (containsLogicalCharacter(word1, operators, isTemplate)) {
          throw (vocabularyWords.indexOf(word2) !== -1) ?
            new UserError('unidentified_phrase_starting_at', {
              word: word2
            }) :
            containsLogicalCharacter(word2, operators, isTemplate) ?
              new UserError('consecutive_expressions', {
                word1: word1,
                word2: word2
              }) :
              new UserError('unidentified_word', {
                word: word2
              });
        } else {
          throw (vocabularyWords.indexOf(word2) !== -1) ?
            new UserError('unidentified_phrase_starting_at', {
              word: word2
            }) :
            containsLogicalCharacter(word2, operators, isTemplate) ?
              new UserError('unidentified_word', {
                word: word1
              }) :
              new UserError('unidentified_words', {
                word1: word1,
                word2: word2
              });
        }
      }
    }
  };

  // TYPING ASSIGNMENT

  /**
   * This takes an array of TypingElements and converts it into an array of
   * types.
   * @param {Array.<Object>} types - an array of dictionaries of the form {
   *               type: the name of an available type ('boolean' or 'element')
   *               arbitrarily_many: boolean
   *            }
   *          where at most one member can have 'arbitrarily_many' set to
   *          true, signifying that any number of arguments of this type
   *          can occur here.
   * @param {int} desiredLength - the number of entries we would like to have.
   * @returns {array} an array of types with the right number of entries,
   *          derived from 'types'.
   * @throws if this is not possible.
   */
  var instantiateTypingElementArray = function(types, desiredLength) {
    var listOfTypes = [];
    for (var i = 0; i < types.length; i++) {
      listOfTypes.push(types[i].type);
      if (types[i].arbitrarily_many) {
        var indexWithArbitrarilyMany = i;
      }
    }
    if (indexWithArbitrarilyMany === undefined) {
      if (types.length === desiredLength) {
        return listOfTypes;
      } else {
        throw new UserError('wrong_num_inputs', {
          num_needed: desiredLength
        });
      }
    } else {
      var output = [];
      if (types.length <= desiredLength + 1) {
        for (var i = 0; i < types.length; i++) {
          if (i === indexWithArbitrarilyMany) {
            for (var j = 0; j < desiredLength - types.length + 1; j++) {
              output.push(listOfTypes[indexWithArbitrarilyMany]);
            }
          } else {
            output.push(listOfTypes[i]);
          }
        }
        return output;
      } else {
        throw new UserError('not_enough_inputs', {
          num_needed: desiredLength
        });
      }
    }
  };

  /**
   * This takes an (untyped) Expression, usually provided by the parser, and
   * returns a TypedExpression in which types have been added at each level.
   * @param {Expression} untypedExpression - the expression to be typed
   * @param {Array} possibleTopTypes - an array of types that the expression as
   *        a whole could have - each will be tried in turn.
   * @param {Language} language - the relevant language
   * @param {Array} newKindsPermitted - an array of kinds (e.g. 'variable',
   *        'constant') of which the user is allowed to create new operators.
   *        Any operator with a kind not in this list and that does not already
   *        occur in the language will cause an error.
   * @param {boolean} permitDuplicateDummyNames - if true the user can write
   *        e.g. ∀x.p even if x is already in use; if false they cannot.
   * @return {array} An array of dictionaries of the form: {
   *           typedExpression: A TypedExpression
   *           operators: the given language.operatorss together with any new
   *             operators that occurred in the expression.
   * @throws If a valid typing cannot be found this function will throw a
   *         UserError. The parameters of this error will contain an additional
   *         key 'amountTyped' that determines where the error occurred. e.g.
   *         [1,2,0] would indicate that there was a problem at the 0th input
   *         (dummy or argument) of the 2nd input of the 1st input of this
   *         expression. We return the typing attempt for which this  value is
   *         largest (in lexicographic ordering) as this is likely to be closest
   *         to what the user intended.
   */
  var assignTypesToExpression = function(untypedExpression, possibleTopTypes,
      language, newKindsPermitted, permitDuplicateDummyNames) {
    var operators = language.operators;
    newKindsPermitted = newKindsPermitted || ['constant', 'variable'];
    permitDuplicateDummyNames = permitDuplicateDummyNames || false;

    var _attemptTyping = function(topType, typingRule) {
      if (!operatorIsNew &&
          untypedExpression.top_kind_name !==
            operators[untypedExpression.top_operator_name].kind) {
        throw new UserError('wrong_kind', {
          operator: untypedExpression.top_operator_name,
          expected_kind: operators[untypedExpression.top_operator_name].kind,
          actual_kind: untypedExpression.top_kind_name,
          amount_typed: []
        });
      }
      if (topType !== typingRule.output) {
        throw new UserError('wrong_type', {
          operator: untypedExpression.top_operator_name,
          expected_type: topType,
          actual_type: typingRule.output,
          amount_typed: []
        });
      }

      var _isNumber = function(n) {
        return !isNaN(parseFloat(n)) && isFinite(n);
      };

      var _isString = function(s) {
        return s[0] === '\'' && s[s.length - 1] === '\'';
      };

      if (language.types.hasOwnProperty('integer') &&
          _isNumber(untypedExpression.top_operator_name) &&
          untypedExpression.top_kind_name === 'constant' &&
          topType !== 'integer') {
        throw new UserError('wrong_type', {
          operator: untypedExpression.top_operator_name,
          expected_type: topType,
          actual_type: 'integer',
          amount_typed: []
        });
      }
      if (language.types.hasOwnProperty('string') &&
          _isString(untypedExpression.top_operator_name) &&
          untypedExpression.top_kind_name === 'constant' &&
          topType !== 'string') {
        throw new UserError('wrong_type', {
          operator: untypedExpression.top_operator_name,
          expected_type: topType,
          actual_type: 'string',
          amount_typed: []
        });
      }

      try {
        var argumentTypes = instantiateTypingElementArray(
          typingRule.arguments, untypedExpression.arguments.length);
      } catch (err) {
        err.parameters.operator = untypedExpression.top_operator_name;
        err.parameters.input_category = 'arguments';
        err.parameters.amount_typed = [];
        throw err;
      }

      try {
        var dummyTypes = instantiateTypingElementArray(
          typingRule.dummies, untypedExpression.dummies.length);
      } catch (err) {
        err.parameters.operator = untypedExpression.top_operator_name;
        err.parameters.input_category = 'dummies';
        err.parameters.amount_typed = [];
        throw err;
      }
      var updatedOperators = {};
      for (key in operators) {
        updatedOperators[key] = operators[key];
      }
      if (operatorIsNew) {
        var _decorateTypes = function(types) {
          decoratedTypes = [];
          for (var k = 0; k < types.length; k++) {
            decoratedTypes.push({
              type: types[k],
              arbitrarily_many: false
            });
          }
          return decoratedTypes;
        };

        updatedOperators[untypedExpression.top_operator_name] = {
          kind: untypedExpression.top_kind_name,
          typing: [{
            arguments: _decorateTypes(argumentTypes),
            dummies: _decorateTypes(dummyTypes),
            output: topType
          }]
        };
      }

      for (var n = 0; n < untypedExpression.dummies.length; n++) {
        if (!permitDuplicateDummyNames &&
            updatedOperators.hasOwnProperty(
              untypedExpression.dummies[n].top_operator_name)) {
          throw new UserError('duplicate_dummy_name', {
            dummy: untypedExpression.dummies[n],
            expression: untypedExpression,
            amount_typed: []
          });
        } else if (untypedExpression.dummies[n].top_kind_name !== 'variable') {
          // The parser does not currently permit this to happen
          throw new UserError('dummy_not_variable', {
            dummy: untypedExpression.dummies[n],
            expression: untypedExpression,
            amount_typed: []
          });
        }
      }

      return assignTypesToExpressionArray(
        untypedExpression.dummies.concat(untypedExpression.arguments),
        dummyTypes.concat(argumentTypes), {
          operators: updatedOperators,
          kinds: language.kinds,
          types: language.types
        }, newKindsPermitted, permitDuplicateDummyNames,
        untypedExpression.dummies.length);
    };

    var operatorIsNew = false;
    if (!operators.hasOwnProperty(untypedExpression.top_operator_name)) {
      if (newKindsPermitted.indexOf(untypedExpression.top_kind_name) === -1) {
        throw new UserError('unknown_operator', {
          operator: untypedExpression.top_operator_name,
          amount_typed: []
        });
      } else {
        operatorIsNew = true;
      }
    }
    var typingRules = (operatorIsNew) ?
      language.kinds[untypedExpression.top_kind_name].typing :
      operators[untypedExpression.top_operator_name].typing;

    var results = [];
    for (var i = 0; i < possibleTopTypes.length; i++) {
      for (var j = 0; j < typingRules.length; j++) {
        try {
          var newAttempts = _attemptTyping(possibleTopTypes[i], typingRules[j]);
          for (var k = 0; k < newAttempts.length; k++) {
            var typedDummies = [];
            for (var l = 0; l < untypedExpression.dummies.length; l++) {
              typedDummies.push(newAttempts[k].typedArray[l]);
              // These dummy variables should not be available outside this
              // part of the untypedExpression.
              if (!operators.hasOwnProperty(
                untypedExpression.dummies[l].top_operator_name)) {
                delete newAttempts[k].operators[
                  untypedExpression.dummies[l].top_operator_name];
              }
            }
            var typedArguments = [];
            for (var l = untypedExpression.dummies.length;
              l < untypedExpression.dummies.length +
                     untypedExpression.arguments.length;
              l++) {
              typedArguments.push(newAttempts[k].typedArray[l]);
            }

            results.push({
              typedExpression: {
                top_operator_name: untypedExpression.top_operator_name,
                top_kind_name: untypedExpression.top_kind_name,
                arguments: typedArguments,
                dummies: typedDummies,
                type: possibleTopTypes[i]
              },
              operators: newAttempts[k].operators
            });
          }
        } catch (err) {
          if (bestAttemptSoFar !== undefined &&
              !bestAttemptSoFar.hasOwnProperty('parameters')) {
            throw bestAttemptSoFar;
          }
          if (bestAttemptSoFar === undefined ||
              greaterThanInLex(
                err.parameters.amount_typed,
                bestAttemptSoFar.parameters.amount_typed)) {
            var bestAttemptSoFar = err;
          }
        }
      }
    }
    if (results.length > 0) {
      return results;
    } else {
      throw bestAttemptSoFar;
    }
  };

  /** Companion function to assignTypesToExpression, with the following
   * modifications:
   * @param untypedArray: an array of expressions to type
   *  @param topTypes: an array of types that the expressions in the array must
   *        have (only one option for each).
   * @numDummies: the number of elements in the array (from the start) that are
   *              dummies rather than arguments.
   * @result: {
   *            typedArray: an array of TypedExpressions
   *            operators: the updated list of operators
   *          }
   * @raises: as before
   */
  var assignTypesToExpressionArray = function(untypedArray, topTypes, language,
      newKindsPermitted, isTemplate, numDummies) {
    newKindsPermitted = newKindsPermitted || ['constant', 'variable'];
    isTemplate = isTemplate || false;
    numDummies = numDummies || 0;

    var partiallyTypedArrays = [[[]]];
    var partiallyUpdatedOperators = [[{}]];
    for (var key in language.operators) {
      partiallyUpdatedOperators[0][0][key] = language.operators[key];
    }
    for (var i = 1; i <= untypedArray.length; i++) {
      partiallyTypedArrays.push([]);
      partiallyUpdatedOperators.push([]);
    }

    for (var i = 0; i < untypedArray.length; i++) {
      // This will only happen in pathological cases.
      if (partiallyTypedArrays[i].length > MAX_NUM_TYPINGS_PERMITTED) {
        throw new UserError('too_many_typings', {});
      }

      for (var j = 0; j < partiallyTypedArrays[i].length; j++) {
        // Dummies are always allowed to have previously unseen names
        var newKindsPermittedHere = (i < numDummies) ?
          newKindsPermitted.concat(['variable']) :
          newKindsPermitted;
        try {
          var newResults = assignTypesToExpression(
            untypedArray[i], [topTypes[i]], {
              operators: partiallyUpdatedOperators[i][j],
              kinds: language.kinds,
              types: language.types
            }, newKindsPermittedHere, isTemplate);
          for (var k = 0; k < newResults.length; k++) {
            partiallyTypedArrays[i + 1].push(
              partiallyTypedArrays[i][j].concat([
                newResults[k].typedExpression]));
            partiallyUpdatedOperators[i + 1].push(newResults[k].operators);
          }
        } catch (err) {
          if (!err.hasOwnProperty('parameters')) {
            throw err;
          }
          var amountTyped = [i].concat(err.parameters.amount_typed);
          if (bestAttemptSoFar === undefined ||
              greaterThanInLex(
                amountTyped, bestAttemptSoFar.parameters.amount_typed)) {
            err.parameters.amount_typed = amountTyped;
            var bestAttemptSoFar = err;
          }
        }
      }
    }
    var fullyTypedArrays = partiallyTypedArrays[untypedArray.length];
    var fullyUpdatedOperatorss = partiallyUpdatedOperators[
      untypedArray.length];
    if (fullyTypedArrays.length > 0) {
      var result = [];
      for (var i = 0; i < fullyTypedArrays.length; i++) {
        result.push({
          typedArray: fullyTypedArrays[i],
          operators: fullyUpdatedOperatorss[i]
        });
      }
      return result;
    } else {
      throw bestAttemptSoFar;
    }
  };

  // UTILITIES

  // Expressions with different dummy variables are considered different
  var checkExpressionsAreEqual = function(expression1, expression2) {
    if (expression1.top_kind_name !== expression2.top_kind_name ||
        expression1.top_operator_name !== expression2.top_operator_name ||
        expression1.arguments.length !== expression2.arguments.length ||
        expression1.dummies.length !== expression2.dummies.length) {
      return false;
    }
    if (expression1.hasOwnProperty('type')) {
      if (expression1.type !== expression2.type) {
        return false;
      }
    }
    for (var i = 0;
      i < expression1.arguments.length + expression1.dummies.length; i++) {
      if (!checkExpressionsAreEqual(
        (expression1.arguments.concat(expression1.dummies))[i],
        (expression2.arguments.concat(expression2.dummies))[i])) {
        return false;
      }
    }
    return true;
  };

  var checkExpressionIsInSet = function(expression, set) {
    for (var i = 0; i < set.length; i++) {
      if (checkExpressionsAreEqual(expression, set[i])) {
        return true;
      }
    }
    return false;
  };

  var checkSetsOfExpressionsAreEqual = function(set1, set2) {
    for (var i = 0; i < set1.length; i++) {
      if (!checkExpressionIsInSet(set1[i], set2)) {
        return false;
      }
    }
    for (var i = 0; i < set2.length; i++) {
      if (!checkExpressionIsInSet(set2[i], set1)) {
        return false;
      }
    }
    return true;
  };

  // Returns a list of all the names of operators in an expression. kinds is an
  // array specifying which kinds of operators to return; if it is not supplied
  // then all are returned
  var getOperatorsFromExpression = function(expression, kinds) {
    kinds = kinds || false;
    var output = getOperatorsFromExpressionArray(
      expression.arguments.concat(expression.dummies), kinds);
    return (output.indexOf(expression.top_operator_name) === -1 &&
        (kinds === false || kinds.indexOf(expression.top_kind_name) !== -1)) ?
      output.concat([expression.top_operator_name]) :
      output;
  };

  var getOperatorsFromExpressionArray = function(array, kinds) {
    kinds = kinds || false;
    var output = [];
    for (var i = 0; i < array.length; i++) {
      var newOutput = getOperatorsFromExpression(array[i], kinds);
      for (var j = 0; j < newOutput.length; j++) {
        if (output.indexOf(newOutput[j]) === -1) {
          output = output.concat([newOutput[j]]);
        }
      }
    }
    return output;
  };

  // The expression should be typed; returns the type of operator (or throws an
  // error if not found). Does not check for inconsistent typing.
  // NOTE: treats dummy variables like free ones.
  var seekTypeInExpression = function(expression, operator) {
    return operator === expression.top_operator_name ? expression.type :
      seekTypeInExpressionArray(
        expression.arguments.concat(expression.dummies), operator);
  };

  var seekTypeInExpressionArray = function(array, operator) {
    for (var i = 0; i < array.length; i++) {
      try {
        return seekTypeInExpression(array[i], operator);
      } catch (err) {}
    }
    throw UserError('unknown_typing_error', {
      expression: expression
    });
  };

  // Returns whether LHS is larger than RHS in lexicographic ordering
  var greaterThanInLex = function(LHS, RHS) {
    for (var i = 0; i < LHS.length; i++) {
      if (i >= RHS.length) {
        return true;
      } else if (LHS[i] > RHS[i]) {
        return true;
      } else if (LHS[i] < RHS[i]) {
        return false;
      }
    }
    return false;
  };

  // Checks if the string contains the character
  var containsCharacter = function(string, character) {
    return (string.indexOf(character) !== -1);
  };

  // Checks if the string contains some character from the array
  var containsCharacterFromArray = function(string, array) {
    for (var i = 0; i < array.length; i++) {
      if (string.indexOf(array[i]) !== -1) {
        return true;
      }
    }
    return false;
  };

  return {
    UserError: UserError,
    PreRenderedUserError: PreRenderedUserError,
    renderError: renderError,
    displayExpression: displayExpression,
    displayExpressionArray: displayExpressionArray,
    preParseLineString: preParseLineString,
    parseLineString: parseLineString,
    instantiateTypingElementArray: instantiateTypingElementArray,
    assignTypesToExpression: assignTypesToExpression,
    assignTypesToExpressionArray: assignTypesToExpressionArray,
    checkExpressionsAreEqual: checkExpressionsAreEqual,
    checkExpressionIsInSet: checkExpressionIsInSet,
    checkSetsOfExpressionsAreEqual: checkSetsOfExpressionsAreEqual,
    getOperatorsFromExpression: getOperatorsFromExpression,
    getOperatorsFromExpressionArray: getOperatorsFromExpressionArray,
    seekTypeInExpression: seekTypeInExpression,
    greaterThanInLex: greaterThanInLex
  };
})();
