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
 * @fileoverview Unit tests for the shared components of the LogicProof
 * interaction.
 */

var errorWrapper = function(dubiousFunction, input, parameter = null) {
  return function() {
    try {
      if (parameter === null) {
        dubiousFunction(input);
      } else {
        dubiousFunction(input, parameter);
      }
    } catch (err) {
      throw logicProofShared.renderError(
        err, logicProofData.BASE_GENERAL_MESSAGES,
        logicProofData.BASE_STUDENT_LANGUAGE);
    }
  };
};

describe('Parse then display expressions', function() {
  var parseThenDisplay = function(expressionString) {
    return logicProofShared.displayExpression(
      logicProofParser.parse(expressionString, 'expression'),
      logicProofData.BASE_STUDENT_LANGUAGE.operators);
  };
  var parseThenDisplayControl = function(expressionString) {
    return logicProofShared.displayExpression(
      logicProofParser.parse(expressionString, 'expression'),
      logicProofData.BASE_CONTROL_LANGUAGE.operators);
  };

  it('should parse examples correctly', function() {
    expect(parseThenDisplay('p\u2227q')).toEqual('p\u2227q');
    expect(parseThenDisplay('(p+q)=r')).toEqual('(p+q)=r');
    expect(parseThenDisplay('p<(\u2200x.(2+2))')).toEqual('p<(\u2200x.(2+2))');
    expect(
      parseThenDisplay('((x=2)\u2227(\u2203y.(y=6)))=>valid')
    ).toEqual('((x=2)\u2227(\u2203y.(y=6)))=>valid');
    expect(
      parseThenDisplayControl('p\u2228(\u2200m\u2208S.A(m,S))')
    ).toEqual('p\u2228(\u2200m\u2208S.A(m,S))');
    expect(
      parseThenDisplayControl('min{a<b|p\u2228(q\u2227r)}')
    ).toEqual('min{a<b | p\u2228(q\u2227r)}');
  });
});

describe('Pre-parse lines', function() {
  var preParse = function(lineString, isTemplate) {
    return logicProofShared.preParseLineString(
      lineString, logicProofData.BASE_STUDENT_LANGUAGE.operators, isTemplate);
  };

  it('should pre-parse examples correctly', function() {
    expect(
      preParse('from p and q we have p\u2227q', false)
    ).toEqual(['from', 'p', 'and', 'q', 'we', 'have', 'p\u2227q']);
    expect(
      preParse('    from p \u2228 (q\u2227 r ) s we see \u2200 x. r', false)
    ).toEqual(['from', 'p\u2228(q\u2227r)', 's', 'we', 'see', '\u2200x.r']);
    expect(
      preParse('from p [ x -> a ] at {{ a | variable }} have q', true)
    ).toEqual(['from', 'p[x->a]', 'at', '{{a|variable}}', 'have', 'q']);
    expect(
      preParse('from  ~R =>~S and  ~S =>~R we have ~R <=> ~S', true)
    ).toEqual(['from', '~R=>~S', 'and', '~S=>~R', 'we', 'have', '~R<=>~S']);
  });

  it('should reject lines that are entirely whitespace', function() {
    expect(
      errorWrapper(preParse, '   ', false)
    ).toThrowError('This line is blank.');
  });

  it('should reject unknown symbols', function() {
    expect(
      errorWrapper(preParse, 'from p and p{q we see q', false)
    ).toThrowError('The symbol { was not recognised.');
  });
});

describe('Parse lines', function() {
  var parse = function(lineString, isTemplate) {
    return logicProofShared.parseLineString(
      lineString, logicProofData.BASE_STUDENT_LANGUAGE.operators,
      logicProofData.BASE_VOCABULARY, isTemplate);
  };

  it('should parse examples correctly', function() {
    expect(parse('from p and q we have p\u2227q', false)).toEqual([[{
      format: 'phrase',
      content: 'from'
    }, {
      format: 'expression',
      content: {
        top_kind_name: 'variable',
        top_operator_name: 'p',
        arguments: [],
        dummies: []
      }
    }, {
      format: 'phrase',
      content: 'and'
    }, {
      format: 'expression',
      content: {
        top_kind_name: 'variable',
        top_operator_name: 'q',
        arguments: [],
        dummies: []
      }
    }, {
      format: 'phrase',
      content: 'have'
    }, {
      format: 'expression',
      content: {
        top_kind_name: 'binary_connective',
        top_operator_name: 'and',
        arguments: [{
          top_kind_name: 'variable',
          top_operator_name: 'p',
          arguments: [],
          dummies: []
        }, {
          top_kind_name: 'variable',
          top_operator_name: 'q',
          arguments: [],
          dummies: []
        }],
        dummies: []
      }
    }]]);

    expect(
      parse(
        'from p[x->a] we know hence a contradiction {{ a | element }}', true)
    ).toEqual([[{
      format: 'phrase',
      content: 'from'
    }, {
      format: 'expression',
      content: {
        expression: {
          top_kind_name: 'variable',
          top_operator_name: 'p',
          arguments: [],
          dummies: []
        },
        substitutions: [{
          x: {
            top_kind_name: 'variable',
            top_operator_name: 'a',
            arguments: [],
            dummies: []
          }
        }],
        type: 'boolean'
      }
    }, {
      format: 'phrase',
      content: 'have'
    }, {
      format: 'phrase',
      content: 'hence'
    }, {
      format: 'expression',
      content: {
        expression: {
          top_kind_name: 'variable',
          top_operator_name: 'a',
          arguments: [],
          dummies: []
        },
        substitutions: [],
        type: 'boolean'
      }
    }, {
      format: 'phrase',
      content: 'contradiction'
    }, {
      format: 'expression',
      content: {
        expression: {
          top_kind_name: 'variable',
          top_operator_name: 'a',
          arguments: [],
          dummies: []
        },
        substitutions: [],
        type: 'element'
      }
    }]]);
  });

  it('should reject unknown phrases', function() {
    expect(
      errorWrapper(parse, 'from p we havw p\u2227q')
    ).toThrowError(
      'The phrase starting \'we\' could not be identified; ' +
      'please make sure you are only using phrases from the given list of ' +
      'vocabulary.'
    );
  });

  it('should reject consecutive expressions', function() {
    expect(
      errorWrapper(parse, 'from A=>B B have B')
    ).toThrowError(
      'We could not identify \'B\'; please make sure you are using ' +
      'vocabulary from the given list, and don\'t have two consecutive ' +
      'expressions.');
  });
});

describe('Instantiate types', function() {
  it('should instantiate examples correctly', function() {
    expect(logicProofShared.instantiateTypingElementArray([{
      type: 'boolean',
      arbitrarily_many: false
    }, {
      type: 'element',
      arbitrarily_many: true
    }], 3)).toEqual(['boolean', 'element', 'element']);
    expect(logicProofShared.instantiateTypingElementArray([], 0)).toEqual([]);
  });
});

describe('Assign types to expressions', function() {
  var assignTypes = function(expressionString, newKindsPermitted) {
    return logicProofShared.assignTypesToExpression(
      logicProofParser.parse(expressionString, 'expression'), ['boolean'],
      logicProofData.BASE_STUDENT_LANGUAGE, newKindsPermitted
    )[0].typedExpression;
  };

  var assignTypesControl = function(expressionString, newKindsPermitted) {
    return logicProofShared.assignTypesToExpression(
      logicProofParser.parse(expressionString, 'expression'), ['boolean'],
      logicProofData.BASE_CONTROL_LANGUAGE, newKindsPermitted
    )[0].typedExpression;
  };

  it('should assign types to examples correctly', function() {
    expect(assignTypes('p', ['variable'])).toEqual({
      top_operator_name: 'p',
      top_kind_name: 'variable',
      arguments: [],
      dummies: [],
      type: 'boolean'
    });

    expect(assignTypes('p\u2227x=y', ['variable'])).toEqual({
      top_operator_name: 'and',
      top_kind_name: 'binary_connective',
      arguments: [{
        top_operator_name: 'p',
        top_kind_name: 'variable',
        arguments: [],
        dummies: [],
        type: 'boolean'
      }, {
        top_operator_name: 'equals',
        top_kind_name: 'binary_relation',
        arguments: [{
          top_operator_name: 'x',
          top_kind_name: 'variable',
          arguments: [],
          dummies: [],
          type: 'element'
        }, {
          top_operator_name: 'y',
          top_kind_name: 'variable',
          arguments: [],
          dummies: [],
          type: 'element'
        }],
        dummies: [],
        type: 'boolean'
      }],
      dummies: [],
      type: 'boolean'
    });

    expect(assignTypes('\u2203x.x=x', [])).toEqual({
      top_operator_name: 'exists',
      top_kind_name: 'quantifier',
      arguments: [{
        top_operator_name: 'equals',
        top_kind_name: 'binary_relation',
        arguments: [{
          top_operator_name: 'x',
          top_kind_name: 'variable',
          arguments: [],
          dummies: [],
          type: 'element'
        }, {
          top_operator_name: 'x',
          top_kind_name: 'variable',
          arguments: [],
          dummies: [],
          type: 'element'
        }],
        dummies: [],
        type: 'boolean'
      }],
      dummies: [{
        top_operator_name: 'x',
        top_kind_name: 'variable',
        arguments: [],
        dummies: [],
        type: 'element'
      }],
      type: 'boolean'
    });
  });

  it('should reject type mismatches', function() {
    expect(
      errorWrapper(assignTypes, 'p<=>2+x', ['variable'])
    ).toThrowError(
      'addition yields a element but you are trying to use it to give a ' +
      'boolean.');

    expect(
      errorWrapper(
        assignTypes, 'x\u2227f(x)',
        ['variable', 'prefix_function', 'constant'])
    ).toThrowError(
      'x yields a boolean but you are trying to use it to give a element.');

    expect(
      errorWrapper(
        assignTypesControl, '\'a\'=2', ['prefix_function', 'constant'])
    ).toThrowError(
      '2 yields a integer but you are trying to use it to give a string.');
  });

  it('should forbid quantification over pre-existing variables', function() {
    expect(
      errorWrapper(
        assignTypes, 'a\u2227\u2203a.f(2)',
        ['variable', 'prefix_function', 'constant'])
    ).toThrowError(
      'The name \'a\' is already in use and so cannot be quantified over in ' +
      '\u2203a.f(2).');
  });

  it('should reject kind mismatches', function() {
    expect(
      errorWrapper(
        assignTypes, 'f(f)', ['variable', 'prefix_function', 'constant'])
    ).toThrowError('f is supposed to be a prefix_function.');
  });

  it('should reject unknown operators of an un-addable kind', function() {
    expect(
      errorWrapper(
        assignTypes, '\u2200m<n.A(n)',
        ['variable', 'prefix_function', 'constant'])
    ).toThrowError('The operator bounded_for_all could not be identified.');
    expect(
      errorWrapper(
        assignTypes, '\u2203x.A(x)<=>x=2', ['prefix_function', 'constant'])
    ).toThrowError('The operator x could not be identified.');
  });
});

describe('Check equality between expression constructs', function() {
  it('should recognise when expressions are equal', function() {
    expect(
      logicProofShared.checkExpressionsAreEqual(
        logicProofParser.parse('p\u2227r\u2228\u2200x.s', 'expression'),
        logicProofParser.parse('(p\u2227r)\u2228(\u2200x.s)', 'expression'))
    ).toBe(true);
  });

  it('should recognise when expressions are not equal', function() {
    expect(
      logicProofShared.checkExpressionsAreEqual(
        logicProofParser.parse('p\u2227r\u2228\u2200x.s', 'expression'),
        logicProofParser.parse('(p\u2227r)\u2228(\u2200y.s)', 'expression'))
    ).toBe(false);
  });

  it('should recognise when an expression is not in a set', function() {
    expect(
      logicProofShared.checkExpressionIsInSet(
        logicProofParser.parse('p\u2227q', 'expression'),
        [
          logicProofParser.parse('A(x)', 'expression'),
          logicProofParser.parse('q\u2227p', 'expression')
        ])
    ).toBe(false);
  });

  it('should recognise when sets of expressions are equal', function() {
    expect(
      logicProofShared.checkSetsOfExpressionsAreEqual([
        logicProofParser.parse('A(x)\u2228x=2', 'expression'),
        logicProofParser.parse('p', 'expression')
      ], [
        logicProofParser.parse('p', 'expression'),
        logicProofParser.parse('A(x)\u2228(x=2)', 'expression'),
        logicProofParser.parse('p', 'expression')
      ])
    ).toBe(true);
  });
});

describe('Get operators from expression', function() {
  it('should identify all operators', function() {
    expect(
      logicProofShared.getOperatorsFromExpression(
        logicProofParser.parse('f(x+2)=y+x\u2227p', 'expression'))
    ).toEqual(['x', 2, 'addition', 'f', 'y', 'equals', 'p', 'and']);
  });

  it('should identify all operators of a given kind', function() {
    expect(
      logicProofShared.getOperatorsFromExpression(
        logicProofParser.parse('x+2=y+x', 'expression'),
        ['variable'])).toEqual(['x', 'y']);
  });
});

describe('Check ordering in lex', function() {
  it('should identify when one array exceeds another', function() {
    expect(logicProofShared.greaterThanInLex(
      [1, 2, 4, 4], [1, 2, 3, 5])).toBe(true);
  });

  it('should identify when one array does not exceed another', function() {
    expect(logicProofShared.greaterThanInLex(
      [1, 2], [1, 2])).toBe(false);
  });
});
