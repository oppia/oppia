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
 * @fileoverview Unit tests for LogicProof interaction student components.
 */

var errorWrapper = function(
    dubiousFunction, input1 = null, input2 = null, input3 = null,
    input4 = null, input5 = null, input6 = null) {
  return function() {
    try {
      if (input1 === null) {
        dubiousFunction();
      } else if (input2 === null) {
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
        err, logicProofData.BASE_GENERAL_MESSAGES,
        logicProofData.BASE_STUDENT_LANGUAGE));
    }
  };
};

var sharedErrorWrapper = function(message, line, code, category) {
  return {
    message: message,
    line: line,
    code: code,
    category: category
  };
};

var displayLine = function(line, operators) {
  var matchings = {};
  for (var key in line.matchings) {
    matchings[key] = logicProofShared.displayExpression(
      line.matchings[key], operators);
  }
  var antecedents = [];
  for (var i = 0; i < line.antecedents.length; i++) {
    antecedents.push(
      logicProofShared.displayExpression(
        line.antecedents[i].content, operators));
  }
  return {
    template_name: line.template_name,
    matchings: matchings,
    antecedents: antecedents.join(', '),
    results: logicProofShared.displayExpressionArray(
      line.results, operators),
    variables: logicProofShared.displayExpressionArray(
      line.variables, operators),
    indentation: line.indentation,
    text: line.text
  };
};

var displayProof = function(proof, operators) {
  var output = [];
  for (var i = 0; i < proof.lines.length; i++) {
    output.push(displayLine(proof.lines[i], operators));
  }
  return output;
};

var displayExpressionDictionary = function(expressionDictionary, operators) {
  var processedArray = [];
  for (var key in expressionDictionary) {
    processedArray.push(key + ':' + logicProofShared.displayExpression(
      expressionDictionary[key], operators));
  }
  return processedArray.join(', ');
};

var expressionR = {
  top_kind_name: 'variable',
  top_operator_name: 'R',
  arguments: [],
  dummies: []
};
var expressionS = {
  top_kind_name: 'variable',
  top_operator_name: 'S',
  arguments: [],
  dummies: []
};
var expressionRandS = {
  top_kind_name: 'binary_connective',
  top_operator_name: 'and',
  arguments: [expressionR, expressionS],
  dummies: []
};
var expressiona = {
  top_kind_name: 'variable',
  top_operator_name: 'a',
  arguments: [],
  dummies: []
};
var expressionAllxp = {
  top_kind_name: 'quantifier',
  top_operator_name: 'for_all',
  arguments: [{
    top_kind_name: 'variable',
    top_operator_name: 'p',
    arguments: [],
    dummies: []
  }],
  dummies: [{
    top_kind_name: 'variable',
    top_operator_name: 'x',
    arguments: [],
    dummies: []
  }]
};
var expressionT = {
  top_kind_name: 'variable',
  top_operator_name: 'T',
  arguments: [],
  dummies: []
};
var expressionU = {
  top_kind_name: 'variable',
  top_operator_name: 'U',
  arguments: [],
  dummies: []
};

var sampleControlLanguage = logicProofData.BASE_CONTROL_LANGUAGE;
var sampleControlModel = logicProofStudent.BASE_CONTROL_MODEL;
sampleControlLanguage.operators.scoper = {
  kind: 'prefix_function',
  typing: [{
    arguments: [{
      type: 'integer',
      arbitrarily_many: false
    }],
    dummies: [],
    output: 'integer'
  }]
};
sampleControlModel.evaluation_rules.scoper = {
  format: 'definition',
  evaluateExpression: function(expression, inputs, model, parameters, cache) {
    return logicProofStudent.evaluate({
      top_kind_name: 'ranged_function',
      top_operator_name: 'max',
      arguments: [{
        top_kind_name: 'binary_relation',
        top_operator_name: 'less_than',
        arguments: [{
          top_kind_name: 'variable',
          top_operator_name: 'k',
          arguments: [],
          dummies: [],
          type: 'integer'
        }, {
          top_kind_name: 'variable',
          top_operator_name: 'n',
          arguments: [],
          dummies: [],
          type: 'integer'
        }],
        dummies: [],
        type: 'boolean'
      }, {
        top_kind_name: 'binary_relation',
        top_operator_name: 'less_than',
        arguments: [{
          top_kind_name: 'prefix_function',
          top_operator_name: 'indentation',
          arguments: [{
            top_kind_name: 'variable',
            top_operator_name: 'k',
            arguments: [],
            dummies: [],
            type: 'integer'
          }],
          dummies: [],
          type: 'integer'
        }, {
          top_kind_name: 'prefix_function',
          top_operator_name: 'indentation',
          arguments: [{
            top_kind_name: 'variable',
            top_operator_name: 'n',
            arguments: [],
            dummies: [],
            type: 'integer'
          }],
          dummies: [],
          type: 'integer'
        }],
        dummies: [],
        integer: 'boolean'
      }],
      dummies: [{
        top_kind_name: 'variable',
        top_operator_name: 'k',
        arguments: [],
        dummies: [],
        type: 'integer'
      }]
    }, {
      n: logicProofStudent.evaluate(
        expression.arguments[0], inputs, model, parameters, cache)
    }, model, parameters, cache);
  },
  description: 'The most recent line (not including n) in whose scope line n is'
};

var sampleInteraction = {
  assumptions: [],
  results: [{
    top_kind_name: 'variable',
    top_operator_name: 'p',
    arguments: [],
    dummies: []
  }],
  language: logicProofData.BASE_STUDENT_LANGUAGE,
  general_messages: logicProofData.BASE_GENERAL_MESSAGES,
  line_templates: [{
    name: 'and_introduce',
    reader_view: [{
      format: 'phrase',
      content: 'from'
    }, {
      format: 'expression',
      content: {
        expression: expressionR,
        substitutions: [],
        type: 'boolean'
      }
    }, {
      format: 'phrase',
      content: 'and'
    }, {
      format: 'expression',
      content: {
        expression: expressionS,
        substitutions: [],
        type: 'boolean'
      }
    }, {
      format: 'phrase',
      content: 'have'
    }, {
      format: 'expression',
      content: {
        expression: expressionRandS,
        substitutions: [],
        type: 'boolean'
      }
    }],
    antecedents: [{
      expression: expressionR,
      substitutions: [],
      type: 'boolean'
    }, {
      expression: expressionS,
      substitutions: [],
      type: 'boolean'
    }],
    results: [{
      expression: expressionRandS,
      substitutions: [],
      type: 'boolean'
    }],
    variables: [],
    error: []
  }, {
    name: 'for_all_introduce',
    reader_view: [{
      format: 'expression',
      content: {
        expression: expressiona,
        substitutions: [],
        type: 'element',
        kind: 'variable'
      }
    }, {
      format: 'phrase',
      content: 'arbitrary'
    }, {
      format: 'phrase',
      content: 'hence'
    }, {
      format: 'expression',
      content: {
        expression: expressionAllxp,
        substitutions: [],
        type: 'boolean'
      }
    }],
    antecedents: [{
      expression: {
        top_kind_name: 'variable',
        top_operator_name: 'p',
        arguments: [],
        dummies: []
      },
      substitutions: [{
        x: expressiona
      }],
      type: 'boolean'
    }],
    results: [{
      expression: expressionAllxp,
      substitutions: [],
      type: 'boolean'
    }],
    variables: [expressiona],
    error: []
  }, {
    name: 'and_introduce_e4',
    reader_view: [{
      format: 'phrase',
      content: 'from'
    }, {
      format: 'expression',
      content: {
        expression: expressionT,
        substitutions: [],
        type: 'boolean'
      }
    }, {
      format: 'phrase',
      content: 'and'
    }, {
      format: 'expression',
      content: {
        expression: expressionU,
        substitutions: [],
        type: 'boolean'
      }
    }, {
      format: 'phrase',
      content: 'have'
    }, {
      format: 'expression',
      content: {
        expression: expressionRandS,
        substitutions: [],
        type: 'boolean'
      }
    }],
    antecedents: [],
    results: [],
    variables: [],
    error: [[{
      format: 'string',
      content: 'The conclusion you are allowed to make here is \'From '
    }, {
      format: 'expression',
      content: {
        expression: expressionT,
        substitutions: [],
        type: 'boolean'
      }
    }, {
      format: 'string',
      content: ' and '
    }, {
      format: 'expression',
      content: {
        expression: expressionU,
        substitutions: [],
        type: 'boolean'
      }
    }, {
      format: 'string',
      content: ' we have '
    }, {
      format: 'expression',
      content: {
        expression: {
          top_kind_name: 'binary_connective',
          top_operator_name: 'and',
          arguments: [expressionT, expressionU],
          dummies: []
        },
        substitutions: [],
        type: 'boolean'
      }
    }, {
      format: 'string',
      content: '\'.'
    }]]
  }],
  vocabulary: logicProofData.BASE_VOCABULARY,
  mistake_table: [{
    name: 'variables',
    entries: [{
      name: 'incorrect_variable_forall',
      occurs: logicProofShared.assignTypesToExpression(
        logicProofParser.parse(
          'template(n)=\'for_all_introduce\'\u2227entry(1,variables(n))' +
          '!=entry(1,variables(scoper(n-1)))',
          'expression'),
        ['boolean'], sampleControlLanguage,
        ['constant', 'variable']
      )[0].typedExpression,
      message: [[{
        format: 'string',
        content: 'We originally took '
      }, {
        format: 'expression',
        content: logicProofShared.assignTypesToExpression(
          logicProofParser.parse(
            'entry(1,variables(scoper(n-1)))', 'expression'),
          ['formula'], sampleControlLanguage,
          ['constant', 'variable']
        )[0].typedExpression
      }, {
        format: 'string',
        content: ' as our arbitrary variable so this, rather than '
      }, {
        format: 'expression',
        content: {
          top_operator_name: 'variables',
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
        }
      }, {
        format: 'string',
        content: ', needs to be the one that we quantify out over.'
      }]]
    }]
  }, {
    name: 'target',
    entries: [{
      name: 'last_line_indented_assumption',
      occurs: logicProofShared.assignTypesToExpression(
        logicProofParser.parse(
          'n=num_lines()\u2227indentation(n)>0\u2227template(scoper(n))!=' +
            '\'given\'',
          'expression'),
        ['boolean'], sampleControlLanguage, ['constant', 'variable']
      )[0].typedExpression,
      message: [[{
        format: 'string',
        content: 'The last line of a proof should not be indented; you need ' +
          'to prove that the given formulas holds just from the original ' +
          'assumptions, not the additional assumption of '
      }, {
        format: 'expression',
        content: logicProofShared.assignTypesToExpression(
          logicProofParser.parse(
            'entry(1,results(scoper(n)))', 'expression'), ['formula'],
          sampleControlLanguage, ['constant', 'variable']
        )[0].typedExpression
      }, {
        format: 'string',
        content: '.'
      }]]
    }]
  }],
  control_language: sampleControlLanguage,
  control_model: sampleControlModel
};

describe('Match expression to expression template', function() {
  var matchThenDisplay = function(
      expressionString, templateString, oldMatchings) {
    return displayExpressionDictionary(
      logicProofStudent.matchExpression(
        logicProofParser.parse(expressionString, 'expression'),
        logicProofParser.parse(templateString, 'expression'), oldMatchings),
      logicProofData.BASE_STUDENT_LANGUAGE.operators
    );
  };

  it('should match then display examples correctly', function() {
    expect(matchThenDisplay('A(x)\u2227t', 'p\u2227q', {})).toEqual(
      'p:A(x), q:t');
    expect(matchThenDisplay('\u2203y.R(y)', '\u2203x.p', {})).toEqual(
      'p:R(y), x:y');
  });

  it('should reject expressions that do not match', function() {
    expect(errorWrapper(matchThenDisplay, 'A(x)\u2227t', 'p\u2227q', {
      q: logicProofParser.parse('s', 'expression')
    })).toThrowError(
      'This line could not be identified as valid - please check the list ' +
      'of possible lines.');
  });
});

describe('Substitute into expression', function() {
  it('should substitute examples correctly', function() {
    expect(
      logicProofShared.displayExpression(
        logicProofStudent.substituteIntoExpression(
          logicProofParser.parse('p\u2227A(x,x)', 'expression'), {
            p: logicProofParser.parse('B(x)<=>q', 'expression'),
            x: logicProofParser.parse('y+2', 'expression')
          }), logicProofData.BASE_STUDENT_LANGUAGE.operators)
    ).toEqual('(B(x)<=>q)\u2227A(y+2,y+2)');

    expect(
      logicProofShared.displayExpression(
        logicProofStudent.substituteIntoExpression(
          logicProofParser.parse('\u2200y.y=z', 'expression'), {
            y: logicProofParser.parse('x', 'expression'),
            z: logicProofParser.parse('22', 'expression')
          }), logicProofData.BASE_STUDENT_LANGUAGE.operators)
    ).toEqual('\u2200y.(y=22)');
  });
});

describe('Instantiate expression', function() {
  it('should instantiate examples correctly', function() {
    expect(
      logicProofShared.displayExpression(
        logicProofStudent.instantiateExpression(
          logicProofParser.parse('\u2200y.y=z\u2228p', 'expression'), {
            y: logicProofParser.parse('x', 'expression'),
            z: logicProofParser.parse('22', 'expression'),
            p: logicProofParser.parse('p=>p', 'expression')
          }
        ),
        logicProofData.BASE_STUDENT_LANGUAGE.operators
      )
    ).toEqual('\u2200x.((x=22)\u2228(p=>p))');
  });
});

describe('Compute expression from template', function() {
  it('should compute examples correctly', function() {
    expect(
      logicProofShared.displayExpression(
        logicProofStudent.computeExpressionFromTemplate(
          logicProofParser.parse('p[x->a]', 'booleanTemplate'), {
            p: logicProofParser.parse('B(y)', 'expression'),
            x: logicProofParser.parse('y', 'expression'),
            a: logicProofParser.parse('2-2', 'expression')
          }), logicProofData.BASE_STUDENT_LANGUAGE.operators)
    ).toEqual('B(2-2)');
  });
});

describe('Throw lines messages', function() {
  it('should throw the error messages for sample lines correctly', function() {
    expect(errorWrapper(function() {
      logicProofStudent.throwLineMessages(
        sampleInteraction.line_templates[2].error, 'name', {
          T: logicProofParser.parse('x=y', 'expression'),
          U: logicProofParser.parse('A2(x,y)', 'expression')
        }, logicProofData.BASE_STUDENT_LANGUAGE.operators);
    })).toThrowError(
      'The conclusion you are allowed to make here is \'From x=y ' +
      'and A2(x,y) we have (x=y)\u2227A2(x,y)\'.');
  });
});

describe('Match line to template', function() {
  var matchLineToTemplate = function(lineString, template) {
    return logicProofStudent.matchLineToTemplate(
      logicProofShared.parseLineString(
        lineString, logicProofData.BASE_STUDENT_LANGUAGE.operators,
        logicProofData.BASE_VOCABULARY
      )[0], template.reader_view);
  };

  it('should match examples correctly', function() {
    expect(
      matchLineToTemplate(
        'from A(x,y) and A(y,z) we have A(x,y)\u2227A(y,z)',
        sampleInteraction.line_templates[0])
    ).toEqual({
      R: logicProofParser.parse('A(x,y)', 'expression'),
      S: logicProofParser.parse('A(y,z)', 'expression')
    });

    expect(
      matchLineToTemplate(
        'z was arbitrary so \u2200x.x=2', sampleInteraction.line_templates[1])
    ).toEqual({
      a: logicProofParser.parse('z', 'expression'),
      p: logicProofParser.parse('x=2', 'expression'),
      x: logicProofParser.parse('x', 'expression')
    });
  });

  it('should reject examples that do not match', function() {
    expect(
      errorWrapper(
        matchLineToTemplate, 'from p and q we have q\u2227p',
        sampleInteraction.line_templates[0])
    ).toThrowError(
      'This line could not be identified as valid - please check the' +
      ' list of possible lines.');

    expect(
      errorWrapper(
        matchLineToTemplate, 'z was arbitrary from \u2200x.x=2',
        sampleInteraction.line_templates[1])
    ).toThrowError(
      'This line could not be identified as valid - please check the' +
      ' list of possible lines.');
  });
});

describe('Line to have known layout as student types', function() {
  var requireIdentifiable = function(lineString) {
    return logicProofStudent.requireIdentifiableLine(
      lineString, sampleInteraction.line_templates,
      logicProofData.BASE_STUDENT_LANGUAGE, logicProofData.BASE_VOCABULARY,
      logicProofData.BASE_GENERAL_MESSAGES
    );
  };

  it('should accept known layouts', function() {
    expect(requireIdentifiable('from p and q we have p\u2227q')).toEqual(
      undefined);
  });

  it('should reject unknown layouts', function() {
    expect(
      errorWrapper(requireIdentifiable, 'from p we have p\u2228q')).toThrow(
      {
        message: (
          'This line could not be identified as valid - please ' +
          'check the list of possible lines.')
      });
  });
});

describe('Require all lines to have known layouts as student types',
  function() {
    it('should accept known layouts', function() {
      expect(
        logicProofStudent.validateProof(
          'from A and B we have A\u2227B\n', sampleInteraction)
      ).toEqual(undefined);
    });

    it('should reject unknown layouts', function() {
      expect(function() {
        logicProofStudent.validateProof(
          'from A and B we have A\u2227\n', sampleInteraction);
      }).toThrow(
        {
          message: (
            'We could not identify \'A\u2227\'; please make sure you ' +
            'are using vocabulary from the given list, and don\'t have ' +
            'two consecutive expressions.'),
          line: 0
        }
      );
    });
  }
);

describe('Build, validate and display line', function() {
  var buildThenDisplay = function(lineString) {
    return displayLine(
      logicProofStudent.buildLine(
        lineString, sampleInteraction.line_templates,
        logicProofData.BASE_STUDENT_LANGUAGE, logicProofData.BASE_VOCABULARY
      ), logicProofData.BASE_STUDENT_LANGUAGE.operators
    );
  };

  it('should accept and build examples correctly', function() {
    expect(
      buildThenDisplay(
        '    from a\u2228b and c<=>d have (a\u2228b) \u2227 (c<=>d)')
    ).toEqual({
      template_name: 'and_introduce',
      matchings: {
        R: 'a\u2228b',
        S: 'c<=>d'
      },
      antecedents: 'a\u2228b, c<=>d',
      results: '(a\u2228b)\u2227(c<=>d)',
      variables: '',
      indentation: 2,
      text: '    from a\u2228b and c<=>d have (a\u2228b) \u2227 (c<=>d)'
    });
  });

  it('should reject lines for which type assignment fails', function() {
    expect(
      errorWrapper(buildThenDisplay, 'x+2 was arbitrary so \u2200y.p')
    ).toThrowError('In a line of this form, your x+2 should be a variable.');

    expect(
      errorWrapper(
        buildThenDisplay, 'from A(x) and A(y) we have A(x)\u2227A(z)')
    ).toThrowError('The operator A could not be identified.');
  });

  it('should reject lines that cannot be parsed', function() {
    expect(
      errorWrapper(buildThenDisplay, 'fromj p we have q')).toThrowError(
      'We could not identify either of \'fromj\' or \'p\' as words;' +
      ' please make sure you are using vocabulary from the given list, and' +
      ' don\'t have two consecutive expressions.');
  });

  it('should reject lines that do not match a template', function() {
    expect(errorWrapper(buildThenDisplay, 'Hence A=>x=3')).toThrowError(
      'This line could not be identified as valid - please check the list ' +
      'of possible lines.');
  });

  it('should reject lines that match an incorrect template', function() {
    expect(
      errorWrapper(buildThenDisplay, 'from a<b and b<c we have a<b \u2227 b<d')
    ).toThrowError(
      'The conclusion you are allowed to make here is \'From a<b and' +
      ' b<c we have (a<b)\u2227(b<c)\'.');
  });

  it('should reject lines starting with an odd number of spaces', function() {
    expect(
      errorWrapper(buildThenDisplay, '   from R and A=>B have R\u2227(A=>B)')
    ).toThrowError(
      'An indentation is indicated by a double space at the start of' +
      ' the line, but this line starts with an odd number of spaces.'
    );
  });
});

describe('Build, validate and display proof', function() {
  var buildThenDisplay = function(proofString) {
    return displayProof(
      logicProofStudent.buildProof(proofString, sampleInteraction),
      logicProofData.BASE_STUDENT_LANGUAGE.operators);
  };

  it('should accept and build examples correctly', function() {
    expect(
      buildThenDisplay(
        'a was arbitrary thus \u2200y.R\n  from p and \u2200y.R have ' +
        'p\u2227\u2200y.R')
    ).toEqual([{
      template_name: 'for_all_introduce',
      matchings: {
        a: 'a',
        p: 'R',
        x: 'y'
      },
      antecedents: 'R',
      results: '\u2200y.R',
      variables: 'a',
      indentation: 0,
      text: 'a was arbitrary thus \u2200y.R'
    }, {
      template_name: 'and_introduce',
      matchings: {
        R: 'p',
        S: '\u2200y.R'
      },
      antecedents: 'p, \u2200y.R',
      results: 'p\u2227(\u2200y.R)',
      variables: '',
      indentation: 1,
      text: '  from p and \u2200y.R have p\u2227\u2200y.R'
    }]);
  });

  it('should reject proofs with invalid lines', function() {
    expect(function() {
      buildThenDisplay(
        'from a and b we have a\u2227b\nfrom a and b we have b\u2227a');
    }).toThrow(
      sharedErrorWrapper(
        'The conclusion you are allowed to make here is \'From' +
        ' a and b we have a\u2227b\'.', 1, 'and_introduce_e4', 'line'));
  });
});

describe('Evaluate a logical expression', function() {
  var testEvaluate = function(expressionString, type, inputs, parameters) {
    return logicProofStudent.evaluate(
      logicProofShared.assignTypesToExpression(
        logicProofParser.parse(expressionString, 'expression'), [type],
        logicProofData.BASE_CONTROL_LANGUAGE
      )[0].typedExpression, inputs, logicProofStudent.BASE_CONTROL_MODEL,
      parameters, {});
  };

  it('should evaluate examples correctly', function() {
    expect(testEvaluate('2+2', 'integer', {}, {})).toEqual(4);

    expect(testEvaluate('y\u2208z', 'boolean', {
      x: 'a',
      y: logicProofParser.parse('p\u2227q', 'expression'),
      z: [
        logicProofParser.parse('\u2203x.p', 'expression'),
        logicProofParser.parse('p\u2227q', 'expression')
      ]
    }, {})).toEqual(true);

    expect(testEvaluate('x=\'a\'', 'boolean', {
      x: '\'a\'',
      y: logicProofParser.parse('p\u2227q', 'expression'),
      z: [
        logicProofParser.parse('\u2203x.p', 'expression'),
        logicProofParser.parse('p\u2227q', 'expression')
      ]
    }, {})).toEqual(true);

    expect(
      testEvaluate(
        'max{n<10|~\u2203x<10.\u2203y<10.(x>1\u2227y>1\u2227x*y=n)}',
        'integer', {}, {})
    ).toEqual(7);

    expect(
      testEvaluate('min{n<20|n>1\u2227~\u2200x<5.~x*x*x=n}', 'integer', {}, {})
    ).toEqual(8);

    expect(
      logicProofShared.displayExpressionArray(
        testEvaluate('antecedents(2)', 'set_of_formulas', {}, {
          proof: logicProofStudent.buildProof([
            'from r and s we have r\u2227s',
            'from r\u2227s and s we have (r\u2227s)\u2227s'
          ].join('\n'), sampleInteraction)
        }), logicProofData.BASE_CONTROL_LANGUAGE.operators)
    ).toEqual('r\u2227s, s');

    expect(testEvaluate('scoper(num_lines())', 'integer', {}, {
      proof: logicProofStudent.buildProof(
        'from r and s we have r\u2227s\n  from r\u2227s and s we have ' +
        '(r\u2227s)\u2227s',
        sampleInteraction)
    })).toEqual(1);

    expect(
      logicProofStudent.evaluate(
        sampleInteraction.mistake_table[0].entries[0].occurs, {
          n: 3
        },
        sampleInteraction.control_model, {
          proof: logicProofStudent.buildProof(
            'a was arbitrary hence \u2200x.p\n  from p and q we have' +
            ' p\u2227q\n  a was arbitrary hence \u2200x.q', sampleInteraction)
        },
        {}
      )
    ).toEqual(false);
  });
});

describe('Render mistake messages', function() {
  var render = function(mistakeEntry, lineInProof, proofString) {
    return logicProofStudent.renderMistakeMessages(
      mistakeEntry, lineInProof, sampleInteraction.control_model, {
        proof: logicProofStudent.buildProof(proofString, sampleInteraction)
      }, logicProofData.BASE_STUDENT_LANGUAGE.operators);
  };

  it('should render example messages with respect to given proofs', function() {
    expect(
      render(
        sampleInteraction.mistake_table[0].entries[0], 2, [
          'a was arbitrary hence \u2200x.p',
          '  from p and q we have p\u2227q',
          '  b was arbitrary hence \u2200x.q'].join('\n'))[0]
    ).toEqual('We originally took a as our arbitrary variable so this, ' +
      'rather than b, needs to be the one that we quantify out over.');

    expect(
      render(
        sampleInteraction.mistake_table[1].entries[0], 1,
        'a was arbitrary hence \u2200x.p\n  from p and q we have p\u2227q')[0]
    ).toEqual('The last line of a proof should not be indented; you need to ' +
      'prove that the given formulas holds just from the original ' +
      'assumptions, not the additional assumption of \u2200x.p.');

    expect(
      render(
        sampleInteraction.mistake_table[1].entries[0], 0, [
          'a was arbitrary hence \u2200x.p',
          '  from p and q we have p\u2227q'].join('\n'))
    ).toEqual([]);
  });
});

describe('Check proof makes no mistakes from the mistake table', function() {
  var testCheck = function(proofString) {
    return logicProofStudent.checkProof(
      logicProofStudent.buildProof(proofString, sampleInteraction),
      sampleInteraction);
  };

  it('should allow proofs that make no mistake', function() {
    expect(
      testCheck([
        'from p and q we have p\u2227q',
        'from p and p\u2227q we have p\u2227(p\u2227q)'].join('\n'))
    ).toBeUndefined();
  });

  it('should reject proofs that make mistakes', function() {
    expect(function() {
      testCheck([
        'from p and q we have p\u2227q',
        '  from p and p\u2227q we have p\u2227(p\u2227q)'].join('\n'));
    }).toThrow(
      sharedErrorWrapper(
        'The last line of a proof should not be indented; you need ' +
        'to prove that the given formulas holds just from the original ' +
        'assumptions, not the additional assumption of p\u2227q.',
        1, 'last_line_indented_assumption', 'target'));

    expect(function() {
      testCheck([
        'a was arbitrary hence \u2200x.p',
        '  from p and q we have p\u2227q',
        '  b was arbitrary hence \u2200x.q'].join('\n'));
    }).toThrow(
      sharedErrorWrapper(
        'We originally took a as our arbitrary variable so this, ' +
        'rather than b, needs to be the one that we quantify out over.', 2,
        'incorrect_variable_forall', 'variables'));
  });
});
