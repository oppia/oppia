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
 * @fileoverview Unit tests for LogicProof interaction teacher2 components.
 */

var errorWrapper2 = function(
    dubiousFunction, input1 = null, input2 = null, input3 = null,
    input4 = null, input5 = null, input6 = null) {
  return function() {
    try {
      if (input2 === null) {
        dubiousFunction(input1);
      } else if (input3 === null) {
        dubiousFunction(input1, input2);
      } else if (input4 === null) {
        dubiousFunction(input1, input2, input3);
      } else if (input5 === null) {
        dubiousFunction(input1, input2, input3, input4);
      } else if (input6 === null) {
        dubiousFunction(input1, input2, input3, input4, input5);
      } else {
        dubiousFunction(input1, input2, input3, input4, input5, input6);
      }
    } catch (err) {
      throw new Error(logicProofShared.renderError(
        err, logicProofTeacher.TEACHER_ERROR_MESSAGES,
        logicProofData.BASE_STUDENT_LANGUAGE));
    }
  };
};

describe('Build line templates', function() {
  var buildThenDisplay = function(nameString, readerViewString,
      antecedentsString, resultsString, variablesString, errorStrings) {
    return logicProofTeacher2.displayLineTemplate(
      logicProofTeacher2.buildLineTemplate(
        nameString, readerViewString, antecedentsString, resultsString,
        variablesString, errorStrings, logicProofData.BASE_STUDENT_LANGUAGE,
        logicProofData.BASE_VOCABULARY
      ), logicProofData.BASE_STUDENT_LANGUAGE.operators,
      logicProofData.BASE_VOCABULARY
    );
  };

  it('should build then display examples correctly', function() {
    expect(
      buildThenDisplay(
        'and_introduce', 'from p and q we have p\u2227q', 'p, q', 'p\u2227q',
        '', [])).toEqual({
      name: 'and_introduce',
      reader_view: 'from p and q we have p\u2227q',
      antecedents: 'p, q',
      results: 'p\u2227q',
      variables: '',
      error: []
    });

    expect(
      buildThenDisplay(
        'and_introduce', 'from p we have p\u2227q', 'p', 'p\u2227q', '', [
          'Should this be "from {{p}} and {{q}} we have {{p\u2227q}}"?',
          'To prove {{p\u2227q}} you need to have shown {{q}} as well'
        ])).toEqual({
      name: 'and_introduce',
      reader_view: 'from p we have p\u2227q',
      antecedents: 'p',
      results: 'p\u2227q',
      variables: '',
      error: [
        'Should this be "from {{p}} and {{q}} we have {{p\u2227q}}"?',
        'To prove {{p\u2227q}} you need to have shown {{q}} as well'
      ]
    });

    expect(
      buildThenDisplay(
        'for_all_introduce', '{{a|element}} was arbitrary hence \u2200x.p',
        'p[x->a]', '\u2200x.p', 'a', []
      )).toEqual({
      name: 'for_all_introduce',
      reader_view: '{{a|element}} was arbitrary hence \u2200x.p',
      antecedents: 'p[x->a]',
      results: '\u2200x.p',
      variables: 'a',
      error: []
    });
  });

  it('should reject templates with hidden operators', function() {
    expect(
      errorWrapper2(
        buildThenDisplay, 'name', 'from q we have r', 'q', 'p', '', [])
    ).toThrowError(
      'It will not be possible to uniquely identify p from a line of this ' +
      'form.');

    // FUTURE: render this test passable
    expect(
      errorWrapper2(
        buildThenDisplay, 'exists_introduce',
        'from p[x->a] we have \u2203x.p', 'p[x->a]', '\u2203x.p', 'a', [])
    ).toThrowError(
      'It will not be possible to uniquely identify a from a line of this ' +
      'form.');
  });

  it('should reject mis-typed expressions', function() {
    expect(
      errorWrapper2(
        buildThenDisplay, 'name', 'take p satisfying q[x->p]', '', '', '', [])
    ).toThrowError(
      'p yields a boolean but you are trying to use it to give a element.');
  });
});

describe('Build line template table', function() {
  var buildThenDisplay = function(inputStrings) {
    return logicProofTeacher2.displayLineTemplateTable(
      logicProofTeacher2.buildLineTemplateTable(
        inputStrings, logicProofData.BASE_VOCABULARY),
      logicProofData.BASE_VOCABULARY);
  };

  it('should build and display examples correctly', function() {
    expect(buildThenDisplay([{
      name: 'a',
      reader_view: 'p hence q',
      antecedents: 'p',
      results: 'q',
      variables: '',
      error: []
    }, {
      name: 'b',
      reader_view: '\u2203x.p\u2227q if contradiction we have from r',
      antecedents: 'r, p, q',
      results: '',
      variables: 'x',
      error: ['How unwise {{x|variable}}.']
    }])).toEqual([{
      name: 'a',
      reader_view: 'p hence q',
      antecedents: 'p',
      results: 'q',
      variables: '',
      error: []
    }, {
      name: 'b',
      reader_view: '\u2203x.(p\u2227q) if contradiction we have from r',
      antecedents: 'r, p, q',
      results: '',
      variables: 'x',
      error: ['How unwise {{x|variable}}.']
    }]);
  });

  it('should reject tables with erroneous lines', function() {
    expect((function() {
      try {
        buildThenDisplay([{
          name: 'a',
          reader_view: 'p hence q',
          antecedents: 'p',
          results: 'q',
          variables: '',
          error: []
        }, {
          name: 'a',
          reader_view: '\u2203x.p\u2227 if contradiction we have from r',
          antecedents: 'r, p, q',
          results: '',
          variables: 'x',
          error: ['How unwise {{x|variable}}.']
        }]);
      } catch (err) {
        return err;
      }
    })()[1]).toEqual(
      'The name \'if\' is reserved for vocabulary and so cannot be used here.');
  });
});

describe('Build mistake entry', function() {
  var buildThenDisplay = function(nameString, occursString, messageStrings) {
    return logicProofTeacher2.displayMistakeEntry(
      logicProofTeacher2.buildMistakeEntry(
        nameString, occursString, messageStrings,
        logicProofData.BASE_CONTROL_LANGUAGE
      ), logicProofData.BASE_CONTROL_LANGUAGE.operators
    );
  };

  it('should build entries correctly', function() {
    expect(
      logicProofTeacher2.buildMistakeEntry(
        'name', '~target()\u2208results(n)', ['{{num_lines()-1}}'],
        logicProofData.BASE_CONTROL_LANGUAGE)).toEqual({
      name: 'name',
      occurs: {
        top_operator_name: 'not',
        top_kind_name: 'unary_connective',
        arguments: [{
          top_operator_name: 'is_in',
          top_kind_name: 'binary_relation',
          arguments: [{
            top_operator_name: 'target',
            top_kind_name: 'prefix_function',
            arguments: [],
            dummies: [],
            type: 'formula'
          }, {
            top_operator_name: 'results',
            top_kind_name: 'prefix_function',
            arguments: [{
              top_operator_name: 'n',
              top_kind_name: 'variable',
              arguments: [],
              dummies: [],
              type: 'integer'
            }],
            dummies: [],
            type: 'set_of_formulas'
          }],
          dummies: [],
          type: 'boolean'
        }],
        dummies: [],
        type: 'boolean'
      },
      message: [[{
        format: 'expression',
        content: {
          top_operator_name: 'subtraction',
          top_kind_name: 'binary_function',
          arguments: [{
            top_operator_name: 'num_lines',
            top_kind_name: 'prefix_function',
            arguments: [],
            dummies: [],
            type: 'integer'
          }, {
            top_operator_name: 1,
            top_kind_name: 'constant',
            arguments: [],
            dummies: [],
            type: 'integer'
          }],
          dummies: [],
          type: 'integer'
        }
      }]]
    });
  });

  it('should build then display entries correctly', function() {
    expect(
      buildThenDisplay(
        'name', 'n=1 \u2227 indentation(n)>0', [
          'The first line of a proof should not be indented',
          'Don\'t indent the first line of your proof'
        ])
    ).toEqual({
      name: 'name',
      occurs: '(n=1)\u2227(indentation(n)>0)',
      message: [
        'The first line of a proof should not be indented',
        'Don\'t indent the first line of your proof'
      ]
    });
  });

  it('should reject mis-typed combinations of expressions', function() {
    expect(
      errorWrapper2(
        buildThenDisplay, 'name', 'template(n) = \'given\'',
        ['examine {{antecedents(n-1)+1}}'])
    ).toThrowError(
      'antecedents yields a set_of_formulas but you are trying to use it to ' +
      'give a integer.'
    );
  });
});

describe('Build mistake section', function() {
  it('should build then display sections correctly', function() {
    expect(
      logicProofTeacher2.displayMistakeSection(
        logicProofTeacher2.buildMistakeSection(
          'layout',
          [{
            name: 'mistake_1',
            occurs: 'entry(1,antecedents(n))\u2208assumptions()',
            message: ['wrong']
          }, {
            name: 'mistake_2',
            occurs: 'num_lines()>3',
            message: ['Try to assess {{indentation(22)}}']
          }], []
        ), logicProofData.BASE_CONTROL_LANGUAGE.operators)
    ).toEqual({
      name: 'layout',
      entries: [{
        name: 'mistake_1',
        occurs: 'entry(1,antecedents(n))\u2208assumptions()',
        message: ['wrong']
      }, {
        name: 'mistake_2',
        occurs: 'num_lines()>3',
        message: ['Try to assess {{indentation(22)}}']
      }]
    });
  });

  it('should reject invalid entries', function() {
    expect((function() {
      try {
        logicProofTeacher2.buildMistakeSection('variables', [{
          name: 'a mistake',
          occurs: 'operator(n)=\'and\'',
          message: ['Dear dear']
        }], []);
      } catch (err) {
        return err;
      }
    })()[0]).toEqual('The operator operator could not be identified.');
  });
});

describe('Build control function', function() {
  var buildThenDisplay = function(LHSstring, RHSstring, descriptionString) {
    return logicProofTeacher2.displayControlFunction(
      logicProofTeacher2.buildControlFunction(
        LHSstring, RHSstring, descriptionString,
        logicProofData.BASE_CONTROL_LANGUAGE),
      logicProofData.BASE_CONTROL_LANGUAGE.operators);
  };

  it('should build examples correctly', function() {
    expect(
      logicProofTeacher2.buildControlFunction(
        'f(x)', 'x+2', 'a description', logicProofData.BASE_CONTROL_LANGUAGE)
    ).toEqual({
      name: 'f',
      variables: [{
        top_kind_name: 'variable',
        top_operator_name: 'x',
        arguments: [],
        dummies: []
      }],
      typing: [{
        arguments: [{
          type: 'integer',
          arbitrarily_many: false
        }],
        dummies: [],
        output: 'integer'
      }],
      definition: {
        top_operator_name: 'addition',
        top_kind_name: 'binary_function',
        arguments: [{
          top_operator_name: 'x',
          top_kind_name: 'variable',
          arguments: [],
          dummies: [],
          type: 'integer'
        }, {
          top_operator_name: 2,
          top_kind_name: 'constant',
          arguments: [],
          dummies: [],
          type: 'integer'
        }],
        dummies: [],
        type: 'integer'
      },
      description: 'a description'
    });
  });

  it('should build then display examples correctly', function() {
    expect(buildThenDisplay('f(n)', 'n+2', 'a')).toEqual({
      LHS: 'f(n)',
      RHS: 'n+2',
      description: 'a'
    });

    expect(
      buildThenDisplay('is_scope_creator(n)',
        'template(n)=\'given\' \u2228 template(n)=\'assumption\'', '')
    ).toEqual({
      LHS: 'is_scope_creator(n)',
      RHS: '(template(n)=\'given\')\u2228(template(n)=\'assumption\')',
      description: ''
    });
  });

  it('should reject undefined functions', function() {
    expect(
      errorWrapper2(
        buildThenDisplay, 'bad_function(x,y)', 'missing_function(x-y, x+y)',
        '')
    ).toThrowError('The operator missing_function could not be identified.');
  });

  it('should forbid type mismatches', function() {
    expect(
      errorWrapper2(
        buildThenDisplay, 'f(n)', 'template(n) + 3', '')
    ).toThrowError(
      'template yields a string but you are trying to use it to give a ' +
      'integer.');
  });

  it('should forbid ambiguous typings', function() {
    expect(
      errorWrapper2(
        buildThenDisplay, 'f(n)', 'n', '')
    ).toThrowError(
      'Unfortunately this cannot be accepted as it has multiple possible ' +
      'typings.');
  });

  it('should not allow n as a function name', function() {
    expect(
      errorWrapper2(
        buildThenDisplay, 'n(x,y)', 'x-y', '')
    ).toThrowError(
      'You cannot use n as a function name; it is reserved to refer to line ' +
      'numbers');
  });
});

describe('Build control function table', function() {
  it('should build then display examples correctly', function() {
    expect(
      logicProofTeacher2.displayControlFunctionTable(
        logicProofTeacher2.buildControlFunctionTable(
          [
            {
              LHS: 'is_scope_creator(n)',
              RHS: 'template(n)=\'given\' \u2228 template(n)=\'assumption\'',
              description: 'a'
            }, {
              LHS: 'is_in_scope(m,n)',
              RHS: '(~is_scope_creator(m)\u2227indentation(n)>=indentation(m)' +
                '\u2227~\u2203k<=n.(k>=m\u2227indentation(k)<indentation(m)))' +
                '\u2228(indentation(n)>indentation(m)\u2227~\u2203' +
                'k<=n.(k>=m\u2227indentation(k)<=indentation(m)))',
              description: 'b'
            }
          ]
        ))
    ).toEqual([{
      LHS: 'is_scope_creator(n)',
      RHS: '(template(n)=\'given\')\u2228(template(n)=\'assumption\')',
      description: 'a'
    }, {
      LHS: 'is_in_scope(m,n)',
      RHS: '((~is_scope_creator(m))\u2227((indentation(n)>=indentation(m))' +
        '\u2227(~\u2203k<=n.(k>=m)\u2227(indentation(k)<indentation(m)))))' +
        '\u2228((indentation(n)>indentation(m))\u2227(~\u2203k<=n.(k>=m)' +
        '\u2227(indentation(k)<=indentation(m))))',
      description: 'b'
    }]);
  });

  it('should reject tables with invalid lines', function() {
    expect((function() {
      try {
        logicProofTeacher2.buildControlFunctionTable([{
          LHS: 'f(n)',
          RHS: 'indentation(n) - 2',
          description: ''
        }, {
          LHS: 'f(n)',
          RHS: 'indentation(n) - 2',
          description: ''
        }]);
      } catch (err) {
        return err.message;
      }
    })()).toEqual('The function f has already been defined.');
  });
});

describe('Parse messages describing student mistakes', function() {
  it('should parse then display control-language messages correctly',
    function() {
      expect(logicProofTeacher2.displayControlMessage(
        logicProofTeacher2.parseMessage(
          'stuff {{p\u2227q}} thingies', 'control'),
        logicProofData.BASE_CONTROL_LANGUAGE.operators)
      ).toEqual('stuff {{p\u2227q}} thingies');
    });

  it('should parse general messages correctly', function() {
    expect(
      logicProofTeacher2.parseMessage(
        'Your use of {{item}} is wrong.', 'general')
    ).toEqual([{
      isFixed: true,
      content: 'Your use of '
    }, {
      isFixed: false,
      content: 'item'
    }, {
      isFixed: true,
      content: ' is wrong.'
    }]);
  });

  it('should forbid unparseable expression templates', function() {
    expect(
      errorWrapper2(
        logicProofTeacher2.parseMessage,
        'By lack of arbitraryness this fails for {{p[[x->a]}}.', 'line')
    ).toThrowError('It was not possible to parse {{p[[x->a]}}.');
  });

  it('should forbid unmatched {{', function() {
    expect(
      errorWrapper2(
        logicProofTeacher2.parseMessage,
        'of {{result(scoper(n))}}.{{d)', 'control')
    ).toThrowError('This has an unmatched {{.');
  });
});
