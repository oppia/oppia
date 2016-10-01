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
 * @fileoverview Components used by the LogicProof interaction editor.
 */

var logicProofTeacher = (function() {
  // QUESTION

  /**
   * A question is composed of the formulas the student may assume and the
   * formula she must prove; it will be different for each state in which the
   * interaction is used.
   * @param {string} assumptionsString - typed by the teacher to describe the
   *        assumptions the student is allowed to make.
   * @param {string} targetString - typed by the teacher to describe what the
   *        student is supposed to prove.
   * @param {object} vocabulary - A vocabulary object, the words from which the
   *        teacher is not allowed to use as function names.
   * @returns {
   *           operators: the operators occurring in the question including both
   *             ordinary ones (like ∧) and specific ones (like f).
   *           assumptions: an array of Expressions, which will form the
   *             'assumptions' key in the interaction.
   *           results: an array of length one built from the targetString which
   *             will form the 'results' key in the interaction.
   *         }
   * @throws If the given strings cannot be parsed, or are mal-typed or use
   *         words that are reserved for the vocabulary.
   */
  var buildQuestion = function(assumptionsString, targetString, vocabulary) {
    if (assumptionsString.replace(/ /g, '') === '') {
      var assumptions = [];
    } else {
      try {
        var assumptions = logicProofParser.parse(
          assumptionsString.replace(/ /g, ''), 'listOfExpressions');
      } catch (err) {
        var error = new logicProofShared.UserError('unparseable', {
          field: 'assumptions'
        });
        throw {
          message: logicProofShared.renderError(
            error, TEACHER_ERROR_MESSAGES, logicProofData.BASE_STUDENT_LANGUAGE)
        };
      }
    }
    try {
      var target = logicProofParser.parse(
        targetString.replace(/ /g, ''), 'expression');
    } catch (err) {
      var error = new logicProofShared.UserError('unparseable', {
        field: 'target'
      });
      throw {
        message: logicProofShared.renderError(
          error, TEACHER_ERROR_MESSAGES, logicProofData.BASE_STUDENT_LANGUAGE)
      };
    }

    // All assumptions and the target must be booleans.
    var expressions = [];
    var topTypes = [];
    for (var i = 0; i < assumptions.length; i++) {
      expressions.push(assumptions[i]);
      topTypes.push('boolean');
    }
    expressions.push(target);
    topTypes.push('boolean');

    try {
      var typing = logicProofShared.assignTypesToExpressionArray(
        expressions, topTypes, logicProofData.BASE_STUDENT_LANGUAGE,
        ['variable', 'constant', 'prefix_function']
      );
      if (typing.length > 1) {
        throw new logicProofShared.UserError('ambiguous_typing', {});
      }
      requireNoVocabularyWordsUsed(
        expressions, logicProofData.BASE_STUDENT_LANGUAGE.operators, vocabulary
      );
    } catch (err) {
      throw {
        message: logicProofShared.renderError(
          err, TEACHER_ERROR_MESSAGES, logicProofData.BASE_STUDENT_LANGUAGE)
      };
    }
    return {
      operators: typing[0].operators,
      assumptions: assumptions,
      results: [target]
    };
  };

  // Throws an error if the given expression array uses an operator that is not
  // in knownOperators and whose name has length greater than one and occurs as
  // a word in the vocabulary.
  var requireNoVocabularyWordsUsed = function(
      expressionArray, knownOperators, vocabulary) {
    var _isMember = function(entry, array) {
      return (array.indexOf(entry) !== -1);
    };

    var vocabularyWords = [];
    for (var key in vocabulary) {
      for (var i = 0; i < vocabulary[key].length; i++) {
        var wordArray = vocabulary[key][i].split(' ');
        for (var j = 0; j < wordArray.length; j++) {
          if (!_isMember(wordArray[j], vocabularyWords)) {
            vocabularyWords.push(wordArray[j]);
          }
        }
      }
    }

    var operatorNamesToCheck = logicProofShared.getOperatorsFromExpressionArray(
      expressionArray);
    for (var i = 0; i < operatorNamesToCheck.length; i++) {
      if (_isMember(operatorNamesToCheck[i], vocabularyWords) &&
          operatorNamesToCheck[i].length > 1 &&
          !knownOperators.hasOwnProperty(operatorNamesToCheck[i])) {
        throw new logicProofShared.UserError('forbidden_word', {
          word: operatorNamesToCheck[i]
        });
      }
    }
  };

  // DATA

  var TEACHER_ERROR_MESSAGES = {
    unparseable: {
      templates: [[{
        isFixed: true,
        content: 'The '
      }, {
        isFixed: false,
        content: 'field'
      }, {
        isFixed: true,
        content: ' could not be parsed.'
      }]],
      parameters: {
        field: {
          format: 'string'
        }
      }
    },
    ambiguous_typing: {
      templates: [[{
        isFixed: true,
        content: (
          'Unfortunately this cannot be accepted as it has multiple possible ' +
          'typings.')
      }]],
      parameters: {}
    },
    hidden_operator: {
      templates: [[{
        isFixed: true,
        content: 'It will not be possible to uniquely identify '
      }, {
        isFixed: false,
        content: 'operator'
      }, {
        isFixed: true,
        content: ' from a line of this form.'
      }]],
      parameters: {
        operator: {
          format: 'string'
        }
      }
    },
    duplicate_function_name: {
      templates: [[{
        isFixed: true,
        content: 'The function '
      }, {
        isFixed: false,
        content: 'function'
      }, {
        isFixed: true,
        content: ' has already been defined.'
      }]],
      parameters: {
        // jscs:disable disallowQuotedKeysInObjects
        'function': {
          // jscs:enable disallowQuotedKeysInObjects
          format: 'string'
        }
      }
    },
    function_name_is_n: {
      templates: [[{
        isFixed: true,
        content: (
          'You cannot use n as a function name; it is reserved to refer to ' +
          'line numbers')
      }]]
    },
    argument_is_function_name: {
      templates: [[{
        isFixed: true,
        content: '\''
      }, {
        isFixed: false,
        content: 'argument'
      }, {
        isFixed: true,
        content: (
          '\' is the name of a function and so cannot be used as an argument.')
      }]],
      parameters: {
        argument: {
          format: 'string'
        }
      }
    },
    duplicate_argument: {
      templates: [[{
        isFixed: true,
        content: 'The variables used as arguments must all be distinct'
      }]],
      parameters: {
        argument: {
          format: 'string'
        }
      }
    },
    unused_argument: {
      templates: [[{
        isFixed: true,
        content: 'The argument \''
      }, {
        isFixed: false,
        content: 'argument'
      }, {
        isFixed: true,
        content: '\' does not occur in the definition.'
      }]],
      parameters: {
        argument: {
          format: 'string'
        }
      }
    },
    unknown_typing_error: {
      templates: [[{
        isFixed: true,
        content: 'A typing error has occurred with '
      }, {
        isFixed: false,
        content: 'expression'
      }, {
        isFixed: true,
        content: '.'
      }]],
      parameters: {
        expression: {
          format: 'expression'
        }
      }
    },
    'unmatched_{{': {
      templates: [[{
        isFixed: true,
        content: 'This has an unmatched {{.'
      }]],
      parameters: {}
    },
    unparseable_fragment: {
      templates: [[{
        isFixed: true,
        content: 'It was not possible to parse '
      }, {
        isFixed: false,
        content: 'fragment'
      }, {
        isFixed: true,
        content: '.'
      }]],
      parameters: {
        fragment: {
          format: 'string'
        }
      }
    },
    ambiguous_parsing: {
      templates: [[{
        isFixed: true,
        content: 'The '
      }, {
        isFixed: false,
        content: 'field'
      }, {
        isFixed: true,
        content: (
          ' can be understood in more than one way. Try using fewer ' +
          'single-character words and variables so that it is easier to ' +
          'distinguish between the two.')
      }]],
      parameters: {
        field: {
          format: 'string'
        }
      }
    },
    illegal_symbol: {
      templates: [[{
        isFixed: true,
        content: 'The symbol '
      }, {
        isFixed: false,
        content: 'symbol'
      }, {
        isFixed: true,
        content: ' was not recognised.'
      }]],
      parameters: {
        symbol: {
          format: 'string'
        }
      }
    },
    blank_line: {
      templates: [[{
        isFixed: true,
        content: 'This line is blank.'
      }]],
      parameters: {}
    },
    unidentified_word: {
      templates: [[{
        isFixed: true,
        content: 'We could not identify \''
      }, {
        isFixed: false,
        content: 'word'
      }, {
        isFixed: true,
        content: (
          '\'; please make sure you are using vocabulary from the given ' +
          'list, and don\'t have two consecutive expressions.')
      }]],
      parameters: {
        word: {
          format: 'string'
        }
      }
    },
    unidentified_words: {
      templates: [[{
        isFixed: true,
        content: 'We could not identify either of \''
      }, {
        isFixed: false,
        content: 'word1'
      }, {
        isFixed: true,
        content: '\' or \''
      }, {
        isFixed: false,
        content: 'word2'
      }, {
        isFixed: true,
        content: (
          '\' as words; please make sure you are using vocabulary from ' +
          'the given list, and don\'t have two consecutive expressions.')
      }]],
      parameters: {
        word1: {
          format: 'string'
        },
        word2: {
          format: 'string'
        }
      }
    },
    consecutive_expressions: {
      templates: [[{
        isFixed: true,
        content: 'This line has two expressions in a row ('
      }, {
        isFixed: false,
        content: 'word1'
      }, {
        isFixed: true,
        content: ' and '
      }, {
        isFixed: false,
        content: 'word2'
      }, {
        isFixed: true,
        content: ') which is not allowed.'
      }]],
      parameters: {
        word1: {
          format: 'string'
        },
        word2: {
          format: 'string'
        }
      }
    },
    unidentified_phrase_starting_at: {
      templates: [[{
        isFixed: true,
        content: 'The phrase starting \''
      }, {
        isFixed: false,
        content: 'word'
      }, {
        isFixed: true,
        content: (
          '\' could not be identified; please make sure you are only ' +
          'using phrases from the given list of vocabulary.')
      }]],
      parameters: {
        word: {
          format: 'string'
        }
      }
    },
    forbidden_word: {
      templates: [[{
        isFixed: true,
        content: 'The name \''
      }, {
        isFixed: false,
        content: 'word'
      }, {
        isFixed: true,
        content: '\' is reserved for vocabulary and so cannot be used here.'
      }]],
      parameters: {
        word: {
          format: 'string'
        }
      }
    },
    not_enough_inputs: {
      templates: [[{
        isFixed: false,
        content: 'operator'
      }, {
        isFixed: true,
        content: ' must have at least '
      }, {
        isFixed: false,
        content: 'num_needed'
      }, {
        isFixed: true,
        content: ' '
      }, {
        isFixed: false,
        content: 'input_category'
      }, {
        isFixed: true,
        content: '.'
      }]],
      parameters: {
        num_needed: {
          format: 'string'
        },
        input_category: {
          format: 'string'
        },
        operator: {
          format: 'string'
        }
      }
    },
    wrong_num_inputs: {
      templates: [[{
        isFixed: false,
        content: 'operator'
      }, {
        isFixed: true,
        content: ' must have '
      }, {
        isFixed: false,
        content: 'num_needed'
      }, {
        isFixed: true,
        content: ' '
      }, {
        isFixed: false,
        content: 'input_category'
      }, {
        isFixed: true,
        content: '.'
      }]],
      parameters: {
        num_needed: {
          format: 'string'
        },
        input_category: {
          format: 'string'
        },
        operator: {
          format: 'string'
        }
      }
    },
    wrong_kind: {
      templates: [[{
        isFixed: false,
        content: 'operator'
      }, {
        isFixed: true,
        content: ' is supposed to be a '
      }, {
        isFixed: false,
        content: 'expected_kind'
      }, {
        isFixed: true,
        content: '.'
      }]],
      parameters: {
        operator: {
          format: 'string'
        },
        expected_kind: {
          format: 'string'
        },
        actual_kind: {
          format: 'string'
        }
      }
    },
    wrong_type: {
      templates: [[{
        isFixed: false,
        content: 'operator'
      }, {
        isFixed: true,
        content: ' yields a '
      }, {
        isFixed: false,
        content: 'actual_type'
      }, {
        isFixed: true,
        content: ' but you are trying to use it to give a '
      }, {
        isFixed: false,
        content: 'expected_type'
      }, {
        isFixed: true,
        content: '.'
      }]],
      parameters: {
        operator: {
          format: 'string'
        },
        expected_type: {
          format: 'string'
        },
        actual_type: {
          format: 'string'
        }
      }
    },
    duplicate_dummy_name: {
      templates: [[{
        isFixed: true,
        content: 'The name \''
      }, {
        isFixed: false,
        content: 'dummy'
      }, {
        isFixed: true,
        content: '\' is already in use and so cannot be quantified over in '
      }, {
        isFixed: false,
        content: 'expression'
      }, {
        isFixed: true,
        content: '.'
      }]],
      parameters: {
        dummy: {
          format: 'expression'
        },
        expression: {
          format: 'expression'
        }
      }
    },
    dummy_not_variable: {
      templates: [[{
        isFixed: true,
        content: 'You can only quantify over variables, not  '
      }, {
        isFixed: false,
        content: 'dummy'
      }, {
        isFixed: true,
        content: '.'
      }]],
      parameters: {
        dummy: {
          format: 'expression'
        },
        expression: {
          format: 'expression'
        }
      }
    },
    unknown_operator: {
      templates: [[{
        isFixed: true,
        content: 'The operator '
      }, {
        isFixed: false,
        content: 'operator'
      }, {
        isFixed: true,
        content: ' could not be identified.'
      }]],
      parameters: {
        operator: {
          format: 'string'
        }
      }
    },
    too_many_parsings: {
      templates: [[{
        isFixed: true,
        content: (
          'This can be parsed in too many different ways - try using ' +
          'fewer words, especially single-character words.')
      }]],
      parameters: {}
    },
    too_many_typings: {
      templates: [[{
        isFixed: true,
        content: (
          'This has too many possible typings - try using fewer variables.')
      }]],
      parameters: {}
    }
  };

  return {
    buildQuestion: buildQuestion,
    TEACHER_ERROR_MESSAGES: TEACHER_ERROR_MESSAGES
  };
})();
