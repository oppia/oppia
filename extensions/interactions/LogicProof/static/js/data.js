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

var logicProofData = (function() {
  var BASE_VOCABULARY = {
    from: ['from'],
    and: ['and'],
    have: ['we have', 'we know', 'have'],
    hence: ['hence', 'so', 'thus', 'thence', 'whence'],
    whichever: [
      'and whichever is true', 'and either way', 'and in either case'
    ],
    arbitrary: ['was arbitrary', 'is arbitrary'],
    take: ['take'],
    satisfying: ['satisfying', 'such that'],
    // jscs:disable disallowQuotedKeysInObjects
    'if': ['if'],
    given: ['given'],
    contradiction: ['contradiction'],
    at: ['at']
  };

  var SINGLE_BOOLEAN = {
    type: 'boolean',
    arbitrarily_many: false
  };
  var SINGLE_ELEMENT = {
    type: 'element',
    arbitrarily_many: false
  };

  // NOTE: By default, 'and' & 'or' must be binary.
  // NOTE: We are not yet using the display keys from the kinds (we are using
  // symbol keys from the list of operators).
  var BASE_STUDENT_LANGUAGE = {
    types: {
      'boolean': {
        // jscs:enable disallowQuotedKeysInObjects
        quantifiable: false
      },
      element: {
        quantifiable: true
      }
    },
    kinds: {
      binary_connective: {
        display: [{
          format: 'argument_index',
          content: 0
        }, {
          format: 'name'
        }, {
          format: 'argument_index',
          content: 1
        }]
      },
      unary_connective: {
        matchable: false,
        display: [{
          format: 'name'
        }, {
          format: 'argument_index',
          content: 0
        }]
      },
      quantifier: {
        matchable: false,
        display: [{
          format: 'name'
        }, {
          format: 'dummy_index',
          content: 0
        }, {
          format: 'string',
          content: '.'
        }, {
          format: 'argument_index',
          conent: 0
        }]
      },
      binary_function: {
        matchable: false,
        display: [{
          format: 'argument_index',
          content: 0
        }, {
          format: 'name'
        }, {
          format: 'argument_index',
          content: 1
        }],
        typing: [{
          arguments: [SINGLE_ELEMENT, SINGLE_ELEMENT],
          dummies: [],
          output: 'element'
        }]
      },
      prefix_function: {
        matchable: false,
        typing: [{
          arguments: [{
            type: 'element',
            arbitrarily_many: true
          }],
          dummies: [],
          output: 'element'
        }, {
          arguments: [{
            type: 'element',
            arbitrarily_many: true
          }],
          dummies: [],
          output: 'boolean'
        }]
      },
      constant: {
        matchable: false,
        display: [{
          format: 'name'
        }],
        typing: [{
          arguments: [],
          dummies: [],
          output: 'element'
        }]
      },
      variable: {
        matchable: true,
        display: [{
          format: 'name'
        }],
        typing: [{
          arguments: [],
          dummies: [],
          output: 'element'
        }, {
          arguments: [],
          dummies: [],
          output: 'boolean'
        }]
      }
    },
    operators: {
      and: {
        kind: 'binary_connective',
        typing: [{
          arguments: [SINGLE_BOOLEAN, SINGLE_BOOLEAN],
          dummies: [],
          output: 'boolean'
        }],
        symbols: ['\u2227']
      },
      or: {
        kind: 'binary_connective',
        typing: [{
          arguments: [SINGLE_BOOLEAN, SINGLE_BOOLEAN],
          dummies: [],
          output: 'boolean'
        }],
        symbols: ['\u2228']
      },
      implies: {
        kind: 'binary_connective',
        typing: [{
          arguments: [SINGLE_BOOLEAN, SINGLE_BOOLEAN],
          dummies: [],
          output: 'boolean'
        }],
        symbols: ['=>']
      },
      iff: {
        kind: 'binary_connective',
        typing: [{
          arguments: [SINGLE_BOOLEAN, SINGLE_BOOLEAN],
          dummies: [],
          output: 'boolean'
        }],
        symbols: ['<=>']
      },
      not: {
        kind: 'unary_connective',
        typing: [{
          arguments: [SINGLE_BOOLEAN],
          dummies: [],
          output: 'boolean'
        }],
        symbols: ['~']
      },
      for_all: {
        kind: 'quantifier',
        typing: [{
          arguments: [SINGLE_BOOLEAN],
          dummies: [SINGLE_ELEMENT],
          output: 'boolean'
        }],
        symbols: ['\u2200', '.']
      },
      exists: {
        kind: 'quantifier',
        typing: [{
          arguments: [SINGLE_BOOLEAN],
          dummies: [SINGLE_ELEMENT],
          output: 'boolean'
        }],
        symbols: ['\u2203', '.']
      },
      equals: {
        kind: 'binary_relation',
        typing: [{
          arguments: [SINGLE_ELEMENT, SINGLE_ELEMENT],
          dummies: [],
          output: 'boolean'
        }],
        symbols: ['=']
      },
      not_equals: {
        kind: 'binary_relation',
        typing: [{
          arguments: [SINGLE_ELEMENT, SINGLE_ELEMENT],
          dummies: [],
          output: 'boolean'
        }],
        symbols: ['!=']
      },
      less_than: {
        kind: 'binary_relation',
        typing: [{
          arguments: [SINGLE_ELEMENT, SINGLE_ELEMENT],
          dummies: [],
          output: 'boolean'
        }],
        symbols: ['<']
      },
      greater_than: {
        kind: 'binary_relation',
        typing: [{
          arguments: [SINGLE_ELEMENT, SINGLE_ELEMENT],
          dummies: [],
          output: 'boolean'
        }],
        symbols: ['>']
      },
      less_than_or_equals: {
        kind: 'binary_relation',
        typing: [{
          arguments: [SINGLE_ELEMENT, SINGLE_ELEMENT],
          dummies: [],
          output: 'boolean'
        }],
        symbols: ['<=']
      },
      greater_than_or_equals: {
        kind: 'binary_relation',
        typing: [{
          arguments: [SINGLE_ELEMENT, SINGLE_ELEMENT],
          dummies: [],
          output: 'boolean'
        }],
        symbols: ['>=']
      },
      addition: {
        kind: 'binary_function',
        typing: [{
          arguments: [SINGLE_ELEMENT, SINGLE_ELEMENT],
          dummies: [],
          output: 'element'
        }],
        symbols: ['+']
      },
      subtraction: {
        kind: 'binary_function',
        typing: [{
          arguments: [SINGLE_ELEMENT, SINGLE_ELEMENT],
          dummies: [],
          output: 'element'
        }],
        symbols: ['-']
      },
      multiplication: {
        kind: 'binary_function',
        typing: [{
          arguments: [SINGLE_ELEMENT, SINGLE_ELEMENT],
          dummies: [],
          output: 'element'
        }],
        symbols: ['*']
      },
      division: {
        kind: 'binary_function',
        typing: [{
          arguments: [SINGLE_ELEMENT, SINGLE_ELEMENT],
          dummies: [],
          output: 'element'
        }],
        symbols: ['/']
      },
      exponentiation: {
        kind: 'binary_function',
        typing: [{
          arguments: [SINGLE_ELEMENT, SINGLE_ELEMENT],
          dummies: [],
          output: 'element'
        }],
        symbols: ['^']
      }
    }
  };

  var SINGLE_INTEGER = {
    type: 'integer',
    arbitrarily_many: false
  };
  var SINGLE_STRING = {
    type: 'string',
    arbitrarily_many: false
  };
  var SINGLE_FORMULA = {
    type: 'formula',
    arbitrarily_many: false
  };
  var SINGLE_SET_OF_FORMULAS = {
    type: 'set_of_formulas',
    arbitrarily_many: false
  };

  var BASE_CONTROL_LANGUAGE = {
    types: {
      // jscs:disable disallowQuotedKeysInObjects
      'boolean': {
        // jscs:enable disallowQuotedKeysInObjects
        quantifiable: false
      },
      // Used for line numbers & indentation.
      integer: {
        quantifiable: true
      },
      // Used for line.template.
      string: {
        quantifiable: false
      },
      // Used for matchings, target.
      formula: {
        quantifiable: true
      },
      // Used for antecedents, results & assumptions.
      set_of_formulas: {
        quantifiable: false
      }
    },

    kinds: {
      binary_connective: {},
      unary_connective: {},
      quantifier: {},
      bounded_quantifier: {},
      binary_relation: {},
      binary_function: {},
      // NOTE: new prefix_functions will be explicitely added by making
      // definitions, and from these definitions their types will be known.
      // Thus it is not necessary for their kinds to have typing rules (and
      // such typing rules would in any case have to be inconveniently long).
      prefix_function: {},
      ranged_function: {},
      constant: {
        matchable: false,
        typing: [{
          arguments: [],
          dummies: [],
          output: 'integer'
        }, {
          arguments: [],
          dummies: [],
          output: 'string'
        }]
      },
      variable: {
        matchable: true,
        typing: [{
          arguments: [],
          dummies: [],
          output: 'integer'
        }, {
          arguments: [],
          dummies: [],
          output: 'string'
        }, {
          arguments: [],
          dummies: [],
          output: 'formula'
        }, {
          arguments: [],
          dummies: [],
          output: 'set_of_formulas'
        }, {
          arguments: [],
          dummies: [],
          output: 'boolean'
        }]
      }
    },
    operators: {
      and: {
        kind: 'binary_connective',
        typing: [{
          arguments: [{
            type: 'boolean',
            arbitrarily_many: true
          }],
          dummies: [],
          output: 'boolean'
        }],
        symbols: ['\u2227']
      },
      or: {
        kind: 'binary_connective',
        typing: [{
          arguments: [{
            type: 'boolean',
            arbitrarily_many: true
          }],
          dummies: [],
          output: 'boolean'
        }],
        symbols: ['\u2228']
      },
      implies: {
        kind: 'binary_connective',
        typing: [{
          arguments: [SINGLE_BOOLEAN, SINGLE_BOOLEAN],
          dummies: [],
          output: 'boolean'
        }],
        symbols: ['=>']
      },
      iff: {
        kind: 'binary_connective',
        typing: [{
          arguments: [SINGLE_BOOLEAN, SINGLE_BOOLEAN],
          dummies: [],
          output: 'boolean'
        }],
        symbols: ['<=>']
      },
      not: {
        kind: 'unary_connective',
        typing: [{
          arguments: [SINGLE_BOOLEAN],
          dummies: [],
          output: 'boolean'
        }],
        symbols: ['~']
      },
      equals: {
        kind: 'binary_relation',
        typing: [{
          arguments: [SINGLE_INTEGER, SINGLE_INTEGER],
          dummies: [],
          output: 'boolean'
        }, {
          arguments: [SINGLE_STRING, SINGLE_STRING],
          dummies: [],
          output: 'boolean'
        }, {
          arguments: [SINGLE_FORMULA, SINGLE_FORMULA],
          dummies: [],
          output: 'boolean'
        }, {
          arguments: [SINGLE_SET_OF_FORMULAS, SINGLE_SET_OF_FORMULAS],
          dummies: [],
          output: 'boolean'
        }],
        symbols: ['=']
      },
      not_equals: {
        kind: 'binary_relation',
        typing: [{
          arguments: [SINGLE_INTEGER, SINGLE_INTEGER],
          dummies: [],
          output: 'boolean'
        }, {
          arguments: [SINGLE_STRING, SINGLE_STRING],
          dummies: [],
          output: 'boolean'
        }, {
          arguments: [SINGLE_FORMULA, SINGLE_FORMULA],
          dummies: [],
          output: 'boolean'
        }, {
          arguments: [SINGLE_SET_OF_FORMULAS, SINGLE_SET_OF_FORMULAS],
          dummies: [],
          output: 'boolean'
        }],
        symbols: ['!=']
      },
      less_than: {
        kind: 'binary_relation',
        typing: [{
          arguments: [SINGLE_INTEGER, SINGLE_INTEGER],
          dummies: [],
          output: 'boolean'
        }],
        symbols: ['<']
      },
      greater_than: {
        kind: 'binary_relation',
        typing: [{
          arguments: [SINGLE_INTEGER, SINGLE_INTEGER],
          dummies: [],
          output: 'boolean'
        }],
        symbols: ['>']
      },
      less_than_or_equals: {
        kind: 'binary_relation',
        typing: [{
          arguments: [SINGLE_INTEGER, SINGLE_INTEGER],
          dummies: [],
          output: 'boolean'
        }],
        symbols: ['<=']
      },
      greater_than_or_equals: {
        kind: 'binary_relation',
        typing: [{
          arguments: [SINGLE_INTEGER, SINGLE_INTEGER],
          dummies: [],
          output: 'boolean'
        }],
        symbols: ['>=']
      },
      is_in: {
        kind: 'binary_relation',
        typing: [{
          arguments: [SINGLE_FORMULA, SINGLE_SET_OF_FORMULAS],
          dummies: [],
          output: 'boolean'
        }],
        symbols: ['\u2208']
      },
      addition: {
        kind: 'binary_function',
        typing: [{
          arguments: [SINGLE_INTEGER, SINGLE_INTEGER],
          dummies: [],
          output: 'integer'
        }],
        symbols: ['+']
      },
      subtraction: {
        kind: 'binary_function',
        typing: [{
          arguments: [SINGLE_INTEGER, SINGLE_INTEGER],
          dummies: [],
          output: 'integer'
        }],
        symbols: ['-']
      },
      multiplication: {
        kind: 'binary_function',
        typing: [{
          arguments: [SINGLE_INTEGER, SINGLE_INTEGER],
          dummies: [],
          output: 'integer'
        }],
        symbols: ['*']
      },
      bounded_for_all: {
        kind: 'bounded_quantifier',
        typing: [{
          // The first argument is the bounding.
          arguments: [SINGLE_BOOLEAN, SINGLE_BOOLEAN],
          dummies: [SINGLE_INTEGER],
          output: 'boolean'
        }, {
          arguments: [SINGLE_BOOLEAN, SINGLE_BOOLEAN],
          dummies: [SINGLE_INTEGER],
          output: 'boolean'
        }],
        symbols: ['\u2200', '.']
      },
      bounded_exists: {
        kind: 'bounded_quantifier',
        typing: [{
          arguments: [SINGLE_BOOLEAN, SINGLE_BOOLEAN],
          dummies: [SINGLE_INTEGER],
          output: 'boolean'
        }, {
          // The first argument is the bounding.
          arguments: [SINGLE_BOOLEAN, SINGLE_BOOLEAN],
          dummies: [SINGLE_FORMULA],
          output: 'boolean'
        }],
        symbols: ['\u2203', '.']
      },
      // This has form min{n<m|A(n)}, A(n) is the argument and n the dummy, or
      // alteratively min{p∈antecedents(n)|B(p)} which will return the first
      // element of set_of_formulas antecedents(n) satisfying B.
      min: {
        kind: 'ranged_function',
        typing: [{
          arguments: [SINGLE_BOOLEAN, SINGLE_BOOLEAN],
          dummies: [SINGLE_INTEGER],
          output: 'integer'
        }, {
          arguments: [SINGLE_BOOLEAN, SINGLE_BOOLEAN],
          dummies: [SINGLE_FORMULA],
          output: 'formula'
        }],
        symbols: ['min', '{', '|', '}']
      },
      max: {
        kind: 'ranged_function',
        typing: [{
          arguments: [SINGLE_BOOLEAN, SINGLE_BOOLEAN],
          dummies: [SINGLE_INTEGER],
          output: 'integer'
        }, {
          arguments: [SINGLE_BOOLEAN, SINGLE_BOOLEAN],
          dummies: [SINGLE_FORMULA],
          output: 'formula'
        }],
        symbols: ['max', '{', '|', '}']
      },
      indentation: {
        kind: 'prefix_function',
        typing: [{
          arguments: [SINGLE_INTEGER],
          dummies: [],
          output: 'integer'
        }]
      },
      template: {
        kind: 'prefix_function',
        typing: [{
          arguments: [SINGLE_INTEGER],
          dummies: [],
          output: 'string'
        }]
      },
      antecedents: {
        kind: 'prefix_function',
        typing: [{
          arguments: [SINGLE_INTEGER],
          dummies: [],
          output: 'set_of_formulas'
        }]
      },
      results: {
        kind: 'prefix_function',
        typing: [{
          arguments: [SINGLE_INTEGER],
          dummies: [],
          output: 'set_of_formulas'
        }]
      },
      variables: {
        kind: 'prefix_function',
        typing: [{
          arguments: [SINGLE_INTEGER],
          dummies: [],
          output: 'set_of_formulas'
        }]
      },
      text: {
        kind: 'prefix_function',
        typing: [{
          arguments: [SINGLE_INTEGER],
          dummies: [],
          output: 'string'
        }]
      },
      element: {
        kind: 'prefix_function',
        typing: [{
          arguments: [SINGLE_STRING, SINGLE_INTEGER],
          dummies: [],
          output: 'formula'
        }]
      },
      num_lines: {
        kind: 'prefix_function',
        typing: [{
          arguments: [],
          dummies: [],
          output: 'integer'
        }]
      },
      assumptions: {
        kind: 'prefix_function',
        typing: [{
          arguments: [],
          dummies: [],
          output: 'set_of_formulas'
        }]
      },
      target: {
        kind: 'prefix_function',
        typing: [{
          arguments: [],
          dummies: [],
          output: 'formula'
        }]
      },
      question_variables: {
        kind: 'prefix_function',
        typing: [{
          arguments: [],
          dummies: [],
          output: 'set_of_formulas'
        }]
      },
      // jscs:disable disallowQuotedKeysInObjects
      'if': {
        // jscs:enable disallowQuotedKeysInObjects
        // NOTE: this prefix function is unusual in having a boolean input
        kind: 'prefix_function',
        typing: [{
          arguments: [SINGLE_BOOLEAN, SINGLE_INTEGER, SINGLE_INTEGER],
          dummies: [],
          output: 'integer'
        }, {
          arguments: [SINGLE_BOOLEAN, SINGLE_STRING, SINGLE_STRING],
          dummies: [],
          output: 'string'
        }, {
          arguments: [SINGLE_BOOLEAN, SINGLE_FORMULA, SINGLE_FORMULA],
          dummies: [],
          output: 'formula'
        }, {
          arguments: [
            SINGLE_BOOLEAN, SINGLE_SET_OF_FORMULAS, SINGLE_SET_OF_FORMULAS],
          dummies: [],
          output: 'set_of_formulas'
        }]
      },
      entry: {
        kind: 'prefix_function',
        typing: [{
          arguments: [SINGLE_INTEGER, SINGLE_SET_OF_FORMULAS],
          dummies: [],
          output: 'formula'
        }]
      },
      substitute: {
        kind: 'prefix_function',
        typing: [{
          arguments: [SINGLE_FORMULA, SINGLE_FORMULA, SINGLE_FORMULA],
          dummies: [],
          output: 'formula'
        }]
      }
    }
  };

  var BASE_GENERAL_MESSAGES = {
    odd_number_spaces: {
      templates: [[{
        isFixed: true,
        content: (
          'An indentation is indicated by a double space at the start of ' +
          'the line, but this line starts with an odd number of spaces.')
      }]],
      parameters: {},
      category: 'parsing'
    },
    unmatched_line: {
      templates: [[{
        isFixed: true,
        content: (
          'This line could not be identified as valid - please check the ' +
          'list of possible lines.')
      }]],
      parameters: {},
      category: 'parsing'
    },
    wrong_kind_in_line: {
      templates: [[{
        isFixed: true,
        content: 'In a line of this form, your '
      }, {
        isFixed: false,
        content: 'expression'
      }, {
        isFixed: true,
        content: ' should be a '
      }, {
        isFixed: false,
        content: 'expected_kind'
      }, {
        isFixed: true,
        content: '.'
      }]],
      parameters: {
        expression: {
          format: 'expression'
        },
        expected_kind: {
          format: 'string'
        }
      },
      category: 'typing'
    },
    unspecified_mistake: {
      templates: [[{
        isFixed: true,
        content: 'This line contains a mistake in its '
      }, {
        isFixed: false,
        content: 'section'
      }, {
        isFixed: true,
        content: ' (with code '
      }, {
        isFixed: false,
        content: 'entry'
      }, {
        isFixed: true,
        content: ').'
      }]],
      parameters: {
        section: {
          format: 'string'
        },
        entry: {
          format: 'string'
        }
      },
      category: 'mistake'
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
      },
      category: 'parsing'
    },
    blank_line: {
      templates: [[{
        isFixed: true,
        content: 'This line is blank.'
      }]],
      parameters: {},
      category: 'parsing'
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
          '\'; please make sure you are using vocabulary from the ' +
          'given list, and don\'t have two consecutive expressions.')
      }]],
      parameters: {
        word: {
          format: 'string'
        }
      },
      category: 'parsing'
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
          '\' as words; please make sure you are using vocabulary from the ' +
          'given list, and don\'t have two consecutive expressions.')
      }]],
      parameters: {
        word1: {
          format: 'string'
        },
        word2: {
          format: 'string'
        }
      },
      category: 'parsing'
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
      },
      category: 'parsing'
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
      },
      category: 'formattting'
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
      },
      category: 'parsing'
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
      },
      category: 'typing'
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
      },
      category: 'typing'
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
      },
      category: 'typing'
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
      },
      category: 'typing'
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
      },
      category: 'typing'
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
      },
      category: 'typing'
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
      },
      category: 'typing'
    },
    too_many_parsings: {
      templates: [[{
        isFixed: true,
        content: (
          'This can be parsed in too many different ways - try using fewer ' +
          'words, especially single-character words.')
      }]],
      parameters: {},
      category: 'parsing'
    },
    too_many_typings: {
      templates: [[{
        isFixed: true,
        content: (
          'This has too many possible typings - try using fewer variables.')
      }]],
      parameters: {}
    },
    category: 'typing'
  };

  return {
    BASE_VOCABULARY: BASE_VOCABULARY,
    BASE_STUDENT_LANGUAGE: BASE_STUDENT_LANGUAGE,
    BASE_CONTROL_LANGUAGE: BASE_CONTROL_LANGUAGE,
    BASE_GENERAL_MESSAGES: BASE_GENERAL_MESSAGES
  };
})();
