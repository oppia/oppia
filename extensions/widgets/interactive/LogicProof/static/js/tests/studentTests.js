function TestCtrl($scope) {

  $scope.displayLine = function(line, operators) {
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
    }
  };

  $scope.displayProof = function(proof, operators) {
    var output = [];
    for (var i = 0; i < proof.lines.length; i++) {
      output.push($scope.displayLine(proof.lines[i], operators));
    }
    return output;
  }

  $scope.displayExpressionDictionary = function(expressionDictionary, operators) {
    var processedArray = [];
    for (var key in expressionDictionary) {
      processedArray.push(key + ':' + logicProofShared.displayExpression(
        expressionDictionary[key], operators));
    }
    return processedArray.join(', ');
  }

  $scope.expressionR = {
    top_kind_name: 'variable',
    top_operator_name: 'R',
    arguments: [],
    dummies: []
  }
  $scope.expressionS = {
    top_kind_name: 'variable',
    top_operator_name: 'S',
    arguments: [],
    dummies: []
  }
  $scope.expressionRandS = {
    top_kind_name: 'binary_connective',
    top_operator_name: 'and',
    arguments: [$scope.expressionR, $scope.expressionS],
    dummies: []
  }
  $scope.expressiona = {
    top_kind_name:'variable',
    top_operator_name:'a',
    arguments:[],
    dummies:[]
  }
  $scope.expressionAllxp = {
    top_kind_name:'quantifier',
    top_operator_name:'for_all',
    arguments:[{
      top_kind_name:'variable',
      top_operator_name:'p',
      arguments:[],
      dummies:[]
    }],
    dummies:[{
      top_kind_name:'variable',
      top_operator_name:'x',
      arguments:[],
      dummies:[]
    }]
  }
  $scope.expressionT = {
    top_kind_name: 'variable',
    top_operator_name: 'T',
    arguments: [],
    dummies: []
  }
  $scope.expressionU = {
    top_kind_name: 'variable',
    top_operator_name: 'U',
    arguments: [],
    dummies: []
  }

  $scope.sampleControlLanguage = logicProofData.BASE_CONTROL_LANGUAGE;
  $scope.sampleControlModel = logicProofStudent.BASE_CONTROL_MODEL;
  $scope.sampleControlLanguage.operators['scoper'] = {
    kind:'prefix_function',
    typing:[{
      arguments:[{
        type: 'integer',
        arbitrarily_many: false
      }],
      dummies:[],
      output:'integer'
    }]
  } 
  $scope.sampleControlModel.evaluation_rules['scoper'] = {
    format:'definition',
    evaluateExpression: function(expression, inputs, model, parameters, cache) {
      return logicProofStudent.evaluate({
        top_kind_name:'ranged_function',
        top_operator_name:'max',
        arguments:[{
          top_kind_name:'binary_relation',
          top_operator_name:'less_than',
          arguments:[{
            top_kind_name:'variable',
            top_operator_name:'k',
            arguments:[],
            dummies:[],
            type: 'integer'
          },{
            top_kind_name:'variable',
            top_operator_name:'n',
            arguments:[],
            dummies:[],
            type: 'integer'
          }],
          dummies:[],
          type: 'boolean'
        },{
          top_kind_name:'binary_relation',
          top_operator_name:'less_than',
          arguments:[{
            top_kind_name:'prefix_function',
            top_operator_name:'indentation',
            arguments:[{
              top_kind_name:'variable',
              top_operator_name:'k',
              arguments:[],
              dummies:[],
              type: 'integer'
            }],
            dummies:[],
            type: 'integer'
          },{
            top_kind_name:'prefix_function',
            top_operator_name:'indentation',
            arguments:[{
              top_kind_name:'variable',
              top_operator_name:'n',
              arguments:[],
              dummies:[],
              type: 'integer'
            }],
            dummies:[],
            type: 'integer'
          }],
          dummies:[],
          integer: 'boolean'
        }],
        dummies:[{
          top_kind_name:'variable',
          top_operator_name:'k',
          arguments:[],
          dummies:[],
          type: 'integer'
        }]
      }, {
        'n': logicProofStudent.evaluate(
          expression.arguments[0], inputs, model, parameters, cache)
      }, model, parameters, cache);
    },
    description:'The most recent line (not including n) in whose scope line n is'
  }

  $scope.sampleWidget = {
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
      name:'and_introduce',
      reader_view:[{
        format:'phrase',
        content:'from'
      },{
        format:'expression',
        content: {
          expression: $scope.expressionR,
          substitutions:[],
          type:'boolean'
        }
      },{
        format:'phrase',
        content:'and'
      },{
        format:'expression',
        content:{
          expression: $scope.expressionS,
          substitutions:[],
          type:'boolean'
        }
      },{
        format:'phrase',
        content:'have'
      },{
        format:'expression',
        content:{
          expression: $scope.expressionRandS,
          substitutions:[],
          type:'boolean'
        }
      }],
      antecedents:[{
        expression: $scope.expressionR,
        substitutions:[],
        type:'boolean'
      },{
        expression: $scope.expressionS,
        substitutions:[],
        type:'boolean'
      }],
      results:[{
        expression: $scope.expressionRandS,
        substitutions:[],
        type:'boolean'
      }],
      variables:[],
      error:[]
    }, {
      name:'for_all_introduce',
      reader_view:[{
        format:'expression',
        content:{
          expression: $scope.expressiona,
          substitutions:[],
          type:'element',
          kind: 'variable'
        }
      },{
        format:'phrase',
        content:'arbitrary'
      },{
        format:'phrase',
        content:'hence'
      },{
        format:'expression',
        content:{
          expression: $scope.expressionAllxp,
          substitutions:[],
          type:'boolean'
        }
      }],
      antecedents:[{
        expression:{
          top_kind_name:'variable',
          top_operator_name:'p',
          arguments:[],
          dummies:[]
        },
        substitutions:[{
          'x': $scope.expressiona
        }],
        type:'boolean'
      }],
      results:[{
        expression: $scope.expressionAllxp,
        substitutions:[],
        type:'boolean'
      }],
      variables: [$scope.expressiona],
      error:[]
    }, {
      name:'and_introduce_e4',
      reader_view:[{
        format:'phrase',
        content:'from'
      },{
        format:'expression',
        content:{
          expression: $scope.expressionT,
          substitutions:[],
          type:'boolean'
        }
      },{
        format:'phrase',
        content:'and'
      },{
        format:'expression',
        content:{
          expression: $scope.expressionU,
          substitutions:[],
          type:'boolean'
        }
      },{
        format:'phrase',
        content:'have'
      },{
        format:'expression',
        content:{
          expression: $scope.expressionRandS,
          substitutions:[],
          type:'boolean'
        }
      }],
      antecedents: [],
      results: [],
      variables: [],
      error:[[{
        format:'string',
        content:'The conclusion you are allowed to make here is \'From '
      },{
        format:'expression',
        content:{
          expression: $scope.expressionT,
          substitutions:[],
          type:'boolean'
        }
      },{
        format:'string',
        content:' and '
      },{
        format:'expression',
        content:{
          expression: $scope.expressionU,
          substitutions:[],
          type:'boolean'
        }
      },{
        format:'string',
        content:' we have '
      },{
        format:'expression',
        content:{
          expression:{
            top_kind_name:'binary_connective',
            top_operator_name:'and',
            arguments:[$scope.expressionT, $scope.expressionU],
            dummies:[]
          },
          substitutions:[],
          type:'boolean'
        }
      },{
        format:'string',
        content:'\'.'
      }]]
    }],
    vocabulary: logicProofData.BASE_VOCABULARY,
    mistake_table: [{
      name: 'variables',
      entries: [{
        name:'incorrect_variable_forall',
        occurs: logicProofShared.assignTypesToExpression(
          logicProofParser.parse(
            'template(n)=\'for_all_introduce\'\u2227entry(1,variables(n))\
!=entry(1,variables(scoper(n-1)))',
            'expression'),
          ['boolean'], $scope.sampleControlLanguage, 
          ['constant', 'variable']
        )[0].typedExpression,
        message:[[{
          format:'string',
          content:'We originally took '
        },{
          format:'expression',
          content: logicProofShared.assignTypesToExpression(
            logicProofParser.parse(
              'entry(1,variables(scoper(n-1)))', 'expression'),
              ['formula'], $scope.sampleControlLanguage,
              ['constant', 'variable']
            )[0].typedExpression
        }, {
          format:'string',
          content:' as our arbitrary variable so this, rather than '
        },{
          format:'expression',
          content:{
            top_operator_name:'variables',
            top_kind_name:'prefix_function',
            arguments:[{
              top_operator_name:'n',
              top_kind_name:'variable',
              arguments:[],
              dummies:[],
              type:'integer'
            }],
            dummies:[],
            type:'set_of_formulas'
          }
        },{
          format:'string',
          content:', needs to be the one that we quantify out over.'
        }]]
      }]
    }, {
      name: 'target',
      entries: [{
        name:'last_line_indented_assumption',
        occurs: logicProofShared.assignTypesToExpression(
          logicProofParser.parse(
            'n=num_lines()\u2227indentation(n)>0\u2227template(scoper(n))!=\'given\'',
            'expression'),
          ['boolean'], $scope.sampleControlLanguage, ['constant', 'variable']
          )[0].typedExpression,
        message:[[{
          format:'string',
          content:'The last line of a proof should not be indented; you need to\
 prove that the given formulas holds just from the original assumptions, not\
 the additional assumption of '
        },{
          format:'expression',
          content: logicProofShared.assignTypesToExpression(
            logicProofParser.parse(
              'entry(1,results(scoper(n)))', 'expression'), ['formula'], 
            $scope.sampleControlLanguage, ['constant', 'variable']
          )[0].typedExpression
        }, {
          format:'string',
          content:'.'
        }]]
      }]
    }],
    control_language: $scope.sampleControlLanguage,
    control_model: $scope.sampleControlModel
  }


  $scope.tests = {
    'match_expression_1': {
      expected: 'p:A(x), q:t',
      actual: $scope.displayExpressionDictionary(
        logicProofStudent.matchExpression(
          logicProofParser.parse('A(x)\u2227t', 'expression'), 
          logicProofParser.parse('p\u2227q', 'expression'), {}),
        logicProofData.BASE_STUDENT_LANGUAGE.operators
      )
    },
    'match_expression_2': {
      error: 'This line could not be identified as valid - please check the\
 list of acceptable lines.',
      actual: function() {
        logicProofStudent.matchExpression(
          logicProofParser.parse('A(x)\u2227t', 'expression'), 
          logicProofParser.parse('p\u2227q', 'expression'), 
          {
            q: logicProofParser.parse('s', 'expression')
          })
      }
    },
    'match_expression_3': {
      expected: 'p:R(y), x:y',
      actual: $scope.displayExpressionDictionary(
        logicProofStudent.matchExpression(
          logicProofParser.parse('\u2203y.R(y)', 'expression'), 
          logicProofParser.parse( '\u2203x.p', 'expression'), {}), 
        logicProofData.BASE_STUDENT_LANGUAGE.operators
      )
    },
    'substitute_into_expression_1': {
      expected: logicProofShared.displayExpression(
        logicProofParser.parse('(B(x)<=>q)\u2227A(y+2,y+2)', 'expression'), 
        logicProofData.BASE_STUDENT_LANGUAGE.operators),
      actual: logicProofShared.displayExpression(
        logicProofStudent.substituteIntoExpression(
          logicProofParser.parse('p\u2227A(x,x)', 'expression'), {
          p: logicProofParser.parse('B(x)<=>q', 'expression'),
          x: logicProofParser.parse('y+2', 'expression')
        }), logicProofData.BASE_STUDENT_LANGUAGE.operators)
    },
    'substitute_into_expression_2': {
      expected: logicProofShared.displayExpression(
        logicProofParser.parse('\u2200y.y=22', 'expression'), 
        logicProofData.BASE_STUDENT_LANGUAGE.operators),
      actual: logicProofShared.displayExpression(
        logicProofStudent.substituteIntoExpression(
          logicProofParser.parse('\u2200y.y=z', 'expression'), {
          y: logicProofParser.parse('x', 'expression'),
          z: logicProofParser.parse('22', 'expression')
        }), logicProofData.BASE_STUDENT_LANGUAGE.operators)
    },
    'instantiate_expression': {
      expected: logicProofShared.displayExpression(
        logicProofParser.parse('\u2200x.x=22\u2228(p=>p)', 'expression'),
        logicProofData.BASE_STUDENT_LANGUAGE.operators),
      actual: logicProofShared.displayExpression(
        logicProofStudent.instantiateExpression(
          logicProofParser.parse('\u2200y.y=z\u2228p', 'expression'), {
            y: logicProofParser.parse('x', 'expression'),
            z: logicProofParser.parse('22', 'expression'),
            p: logicProofParser.parse('p=>p', 'expression')
        }), logicProofData.BASE_STUDENT_LANGUAGE.operators)
    },
    'compute_expression_from_template': {
      expected: logicProofShared.displayExpression(
        logicProofParser.parse('B(2-2)', 'expression'),
        logicProofData.BASE_STUDENT_LANGUAGE.operators),
      actual: logicProofShared.displayExpression(
        logicProofStudent.computeExpressionFromTemplate(
          logicProofParser.parse('p[x->a]', 'booleanTemplate'), {
          p: logicProofParser.parse('B(y)', 'expression'),
          x: logicProofParser.parse('y', 'expression'),
          a: logicProofParser.parse('2-2', 'expression')
        }), logicProofData.BASE_STUDENT_LANGUAGE.operators)
    },
    'throw_line_message': {
      error: 'The conclusion you are allowed to make here is \'From x=y and\
 A2(x,y) we have (x=y)\u2227A2(x,y)\'.',
      actual: function() {
          logicProofStudent.throwLineMessages(
            $scope.sampleWidget.line_templates[2].error, 'name', {
          T: logicProofParser.parse('x=y', 'expression'),
          U: logicProofParser.parse('A2(x,y)', 'expression')
        }, logicProofData.BASE_STUDENT_LANGUAGE.operators)
      }
    },
    'match_line_to_template_1': {
      expected: JSON.stringify({
        R: logicProofParser.parse('A(x,y)', 'expression'),
        S: logicProofParser.parse('A(y,z)', 'expression')
      }),
      actual: JSON.stringify(
        logicProofStudent.matchLineToTemplate(
          logicProofShared.parseLineString(
            'from A(x,y) and A(y,z) we have A(x,y)\u2227A(y,z)', 
            logicProofData.BASE_STUDENT_LANGUAGE.operators, 
            logicProofData.BASE_VOCABULARY
          )[0],
          $scope.sampleWidget.line_templates[0].reader_view, 
          logicProofData.BASE_VOCABULARY))
    },
    'match_line_to_template_2': {
      expected: JSON.stringify({
        a: logicProofParser.parse('z', 'expression'),
        p: logicProofParser.parse('x=2', 'expression'),
        x: logicProofParser.parse('x', 'expression')
      }),
      actual: JSON.stringify(
        logicProofStudent.matchLineToTemplate(
          logicProofShared.parseLineString(
            'z was arbitrary so \u2200x.x=2', 
            logicProofData.BASE_STUDENT_LANGUAGE.operators, 
            logicProofData.BASE_VOCABULARY)[0],
          $scope.sampleWidget.line_templates[1].reader_view, 
          logicProofData.BASE_VOCABULARY))
    },
    'match_line_to_template_3': {
      error: 'This line could not be identified as valid - please check the\
 list of acceptable lines.',
      actual: function() {
        logicProofStudent.matchLineToTemplate(
          logicProofShared.parseLineString(
            'from p and q we have q\u2227p', 
            logicProofData.BASE_STUDENT_LANGUAGE.operators, 
            logicProofData.BASE_VOCABULARY)[0],
          $scope.sampleWidget.line_templates[0].reader_view, 
          logicProofData.BASE_VOCABULARY)
      } 
    },
    'match_line_to_template_4': {
      error: 'This line could not be identified as valid - please check the\
 list of acceptable lines.',
      actual: function() {
        logicProofStudent.matchLineToTemplate(
          logicProofShared.parseLineString(
            'z was arbitrary from \u2200x.x=2', 
            logicProofData.BASE_STUDENT_LANGUAGE.operators, 
            logicProofData.BASE_VOCABULARY
          )[0], $scope.sampleWidget.line_templates[1].reader_view, 
          logicProofData.BASE_VOCABULARY)
      }
    },
    'require_identifiable_line_1': {
      expected: undefined,
      actual: logicProofStudent.requireIdentifiableLine(
        'from p and q we have p\u2227q', $scope.sampleWidget.line_templates,
        logicProofData.BASE_STUDENT_LANGUAGE, logicProofData.BASE_VOCABULARY, 
        logicProofData.BASE_GENERAL_MESSAGES
      )
    },
    'require_identifiable_line_2': {
      errorMessage: 'This line could not be identified as valid - please check\
 the list of acceptable lines.',
      actual: function() {
        logicProofStudent.requireIdentifiableLine(
          'from p we have p\u2228q', $scope.sampleWidget.line_templates, 
          logicProofData.BASE_STUDENT_LANGUAGE, logicProofData.BASE_VOCABULARY, 
          logicProofData.BASE_GENERAL_MESSAGES
        )
      }
    },
    'validate_proof_1': {
      expected: undefined,
      actual: logicProofStudent.validateProof(
        'from A and B we have A\u2227B\n', $scope.sampleWidget)
    },
    'validate_proof_2': {
      errorMessage: 'We could not identify \'A\u2227\'; please make sure you\
 are using vocabulary from the given list, and don\'t have two consecutive\
 expressions.',
      actual: function() {
        logicProofStudent.validateProof(
          'from A and B we have A\u2227\n', $scope.sampleWidget);
      }
    },
    'build_line_1': {
      expected: JSON.stringify({
        template_name: 'and_introduce',
        matchings: {R: 'a\u2228b', S: 'c<=>d'},
        antecedents: 'a\u2228b, c<=>d',
        results: '(a\u2228b)\u2227(c<=>d)',
        variables: '',
        indentation: 2,
        text: '    from a\u2228b and c<=>d have (a\u2228b) \u2227 (c<=>d)'
      }),
      actual: JSON.stringify(
        $scope.displayLine(
          logicProofStudent.buildLine(
            '    from a\u2228b and c<=>d have (a\u2228b) \u2227 (c<=>d)', 
            $scope.sampleWidget.line_templates, 
            logicProofData.BASE_STUDENT_LANGUAGE, logicProofData.BASE_VOCABULARY
          ), logicProofData.BASE_STUDENT_LANGUAGE.operators
        )
      )
    },
    'build_line_2': {
      error: 'In a line of this form, your x+2 should be a variable.',
      actual: function() {
        logicProofStudent.buildLine(
          'x+2 was arbitrary so \u2200y.p', $scope.sampleWidget.line_templates,
          logicProofData.BASE_STUDENT_LANGUAGE, logicProofData.BASE_VOCABULARY)
      }
    },
    'build_line_3': {
      error: 'We could not identify either of \'fromj\' or \'p\' as words;\
 please make sure you are using vocabulary from the given list, and\
 don\'t have two consecutive expressions.',
      actual: function() {
        logicProofStudent.buildLine(
          'fromj p we have q', $scope.sampleWidget.line_templates, 
          logicProofData.BASE_STUDENT_LANGUAGE, logicProofData.BASE_VOCABULARY)
      }
    },
    'build_line_4': {
      error: 'The operator A could not be identified.',
      actual: function() {
        logicProofStudent.buildLine(
          'from A(x) and A(y) we have A(x)\u2227A(z)', 
          $scope.sampleWidget.line_templates, logicProofData.BASE_STUDENT_LANGUAGE,
          logicProofData.BASE_VOCABULARY)
      }
    },
    'build_line_5': {
      error: 'This line could not be identified as valid - please check the\
 list of acceptable lines.',
      actual: function() {
        logicProofStudent.buildLine(
          'Hence A=>x=3', $scope.sampleWidget.line_templates, 
          logicProofData.BASE_STUDENT_LANGUAGE, logicProofData.BASE_VOCABULARY)
      }
    },
    'build_line_6': {
      error: 'The conclusion you are allowed to make here is \'From a<b and\
 b<c we have (a<b)\u2227(b<c)\'.',
      actual: function() {
        logicProofStudent.buildLine(
          'from a<b and b<c we have a<b \u2227 b<d', 
          $scope.sampleWidget.line_templates, logicProofData.BASE_STUDENT_LANGUAGE,
          logicProofData.BASE_VOCABULARY)
      }
    },
    'build_line_7': {
      error: 'An indentation is indicated by a double space at the start of the\
 line, but this line starts with an odd number of spaces.',
      actual: function() {
        logicProofStudent.buildLine(
          '   from R and A=>B have R\u2227(A=>B)', 
          $scope.sampleWidget.line_templates, logicProofData.BASE_STUDENT_LANGUAGE,
           logicProofData.BASE_VOCABULARY);
      }
    },
    'build_proof_1': {
      expected: JSON.stringify([{
        template_name: 'for_all_introduce',
        matchings: {a: 'a', p: 'R', 'x': 'y'},
        antecedents: 'R',
        results: '\u2200y.R',
        variables: 'a',
        indentation: 0,
        text: 'a was arbitrary thus \u2200y.R'
      }, {
        template_name: 'and_introduce',
        matchings: {R: 'p', S: '\u2200y.R'},
        antecedents: 'p, \u2200y.R',
        results: 'p\u2227(\u2200y.R)',
        variables: '',
        indentation: 1,
        text: '  from p and \u2200y.R have p\u2227\u2200y.R'
      }]),
      actual: JSON.stringify(
        $scope.displayProof(
          logicProofStudent.buildProof(
            'a was arbitrary thus \u2200y.R\n  from p and \u2200y.R have p\u2227\u2200y.R', 
            $scope.sampleWidget),
          logicProofData.BASE_STUDENT_LANGUAGE.operators
        )
      )
    },
    'build_proof_2': {
      errorMessage: 'The conclusion you are allowed to make here is \'From\
 a and b we have a\u2227b\'.',
      actual: function() {
        logicProofStudent.buildProof(
          'from a and b we have a\u2227b\nfrom a and b we have b\u2227a', 
          $scope.sampleWidget);
      }
    },
    'evaluate_1': {
      expected: 4,
      actual: logicProofStudent.evaluate(
        logicProofShared.assignTypesToExpression(
          logicProofParser.parse('2+2', 'expression'), ['integer'], 
          logicProofData.BASE_CONTROL_LANGUAGE
        )[0].typedExpression, {}, logicProofStudent.BASE_CONTROL_MODEL, {}, {})
    },
    'evaluate_2': {
      expected: true,
      actual: logicProofStudent.evaluate(
        logicProofShared.assignTypesToExpression(
          logicProofParser.parse('y\u2208z', 'expression'), ['boolean'],
           logicProofData.BASE_CONTROL_LANGUAGE
        )[0].typedExpression, 
        {
          x: "a", 
          y: logicProofParser.parse('p\u2227q', 'expression'), 
          z: [
               logicProofParser.parse('\u2203x.p', 'expression'), 
               logicProofParser.parse('p\u2227q', 'expression')
             ]
        }, logicProofStudent.BASE_CONTROL_MODEL, {}, {})
    },
    'evaluate_3': {
      expected: true,
      actual: logicProofStudent.evaluate(
        logicProofShared.assignTypesToExpression(
          logicProofParser.parse('x=\'a\'', 'expression'), ['boolean'], 
          logicProofData.BASE_CONTROL_LANGUAGE
        )[0].typedExpression, 
        {
          x: '\'a\'', 
          y: logicProofParser.parse('p\u2227q', 'expression'), 
          z: [
               logicProofParser.parse('\u2203x.p', 'expression'), 
               logicProofParser.parse('p\u2227q', 'expression')
             ]
        }, logicProofStudent.BASE_CONTROL_MODEL, {}, {})
    },
    'evaluate_4': {
      expected: 7,
      actual: logicProofStudent.evaluate(logicProofShared.assignTypesToExpression(
          logicProofParser.parse(
            'max{n<10|~\u2203x<10.\u2203y<10.(x>1\u2227y>1\u2227x*y=n)}', 
            'expression'
          ), ['integer'], logicProofData.BASE_CONTROL_LANGUAGE
        )[0].typedExpression, {}, logicProofStudent.BASE_CONTROL_MODEL, {}, {})
    },
    'evaluate_5': {
      expected: 8,
      actual: logicProofStudent.evaluate(
        logicProofShared.assignTypesToExpression(
          logicProofParser.parse(
            'min{n<20|n>1\u2227~\u2200x<5.~x*x*x=n}', 'expression'),
          ['integer'], logicProofData.BASE_CONTROL_LANGUAGE
        )[0].typedExpression, {}, logicProofStudent.BASE_CONTROL_MODEL, {}, {})
    },
    'evaluate_6': {
      expected: 'r\u2227s, s',
      actual: logicProofShared.displayExpressionArray(
        logicProofStudent.evaluate(
          logicProofShared.assignTypesToExpression(
            logicProofParser.parse('antecedents(2)', 'expression'), 
            ['set_of_formulas'], logicProofData.BASE_CONTROL_LANGUAGE
          )[0].typedExpression, {}, logicProofStudent.BASE_CONTROL_MODEL, {
            proof: logicProofStudent.buildProof(
              'from r and s we have r\u2227s\nfrom r\u2227s and s we have (r\u2227s)\u2227s',
              $scope.sampleWidget)
          }, {}
        ), logicProofData.BASE_CONTROL_LANGUAGE.operators
      )
    },
    'evaluate_7': {
      expected: 1,
      actual: logicProofStudent.evaluate(
        logicProofShared.assignTypesToExpression(
          logicProofParser.parse('scoper(num_lines())', 'expression'),
          ['integer'], $scope.sampleWidget.control_language
        )[0].typedExpression, {}, $scope.sampleWidget.control_model, {
          proof: logicProofStudent.buildProof(
            'from r and s we have r\u2227s\n  from r\u2227s and s we have (r\u2227s)\u2227s',
            $scope.sampleWidget)
        }, {}
      )
    },
    'evaluate_8': {
      expected: false,
      actual: logicProofStudent.evaluate(
        $scope.sampleWidget.mistake_table[0].entries[0].occurs, {n: 3},
        $scope.sampleWidget.control_model, {
          proof: logicProofStudent.buildProof(
            'a was arbitrary hence \u2200x.p\n  from p and q we have\
 p\u2227q\n  a was arbitrary hence \u2200x.q',
            $scope.sampleWidget)
      }, {})
    },
    'render_mistake_messages_1': {
      expected: 'We originally took a as our arbitrary variable so this, \
rather than b, needs to be the one that we quantify out over.',
      actual: logicProofStudent.renderMistakeMessages(
        $scope.sampleWidget.mistake_table[0].entries[0], 2, 
        $scope.sampleWidget.control_model, {
          proof: logicProofStudent.buildProof(
            'a was arbitrary hence \u2200x.p\n  from p and q we have \
p\u2227q\n  b was arbitrary hence \u2200x.q',
            $scope.sampleWidget)
        }, logicProofData.BASE_STUDENT_LANGUAGE.operators)[0]
    },
    'render_mistake_messages_2': {
      expected: 'The last line of a proof should not be indented; you need to \
prove that the given formulas holds just from the original assumptions, not the\
 additional assumption of \u2200x.p.',
      actual: logicProofStudent.renderMistakeMessages(
        $scope.sampleWidget.mistake_table[1].entries[0], 1, 
        $scope.sampleWidget.control_model, {
          proof: logicProofStudent.buildProof(
            'a was arbitrary hence \u2200x.p\n  from p and q we have p\u2227q',
            $scope.sampleWidget)
        }, logicProofData.BASE_STUDENT_LANGUAGE.operators)[0]
    },
    'render_mistake_messages_3': {
      expected: 0,
      actual: logicProofStudent.renderMistakeMessages(
        $scope.sampleWidget.mistake_table[1].entries[0], 0, 
        $scope.sampleWidget.control_model, {
          proof: logicProofStudent.buildProof(
            'a was arbitrary hence \u2200x.p\n  from p and q we have p\u2227q',
            $scope.sampleWidget)
        }, logicProofData.BASE_STUDENT_LANGUAGE.operators).length
    },
    'check_proof_1': {
      expected: undefined,
      actual: logicProofStudent.checkProof(
        logicProofStudent.buildProof(
          'from p and q we have p\u2227q\nfrom p and p\u2227q we have p\u2227(p\u2227q)',
          $scope.sampleWidget
        ), $scope.sampleWidget)
    },
    'check_proof_2': {
      errorMessage: 'The last line of a proof should not be indented; you need \
to prove that the given formulas holds just from the original assumptions, not \
the additional assumption of p\u2227q.',
      actual: function() {
        logicProofStudent.checkProof(
          logicProofStudent.buildProof(
            'from p and q we have p\u2227q\n  from p and p\u2227q we have p\u2227(p\u2227q)',
            $scope.sampleWidget
          ), $scope.sampleWidget
        );
      }
    },
    'check_proof_3': {
      errorMessage: 'We originally took a as our arbitrary variable so this, \
rather than b, needs to be the one that we quantify out over.',
      actual: function() {
        logicProofStudent.checkProof(
          logicProofStudent.buildProof(
            'a was arbitrary hence \u2200x.p\n  from p and q we have \
p\u2227q\n  b was arbitrary hence \u2200x.q',
            $scope.sampleWidget
          ), $scope.sampleWidget
        );
      }
    }
  };

  $scope.testResults = [];
  for (var key in $scope.tests) {
    $scope.testResults.push({name: key, expected: 'passed'});
    var typeOfError = ($scope.tests[key].hasOwnProperty('error')) ?
      'error': 
      ($scope.tests[key].hasOwnProperty('errorList')) ?
        'errorList':
        ($scope.tests[key].hasOwnProperty('errorMessage')) ?
          'errorMessage':
          null;
    if (typeOfError !== null) {
      try {
        $scope.tests[key].actual();
        $scope.testResults[$scope.testResults.length-1].expected = 
          'An error should have occurred and did not.'
      }
        catch(err) {
          var actual = (typeOfError === 'error') ?
            logicProofShared.renderError(
              err, logicProofData.BASE_GENERAL_MESSAGES, 
              logicProofData.BASE_STUDENT_LANGUAGE):
            (typeOfError === 'errorList') ?
              JSON.stringify(err):
              err.message;
          var expected = $scope.tests[key][typeOfError];
          if (actual !== expected) {
            $scope.testResults[$scope.testResults.length-1].expected =  expected;
            $scope.testResults[$scope.testResults.length-1].actual =  actual;    
          }
        }
    } else {
      if ($scope.tests[key].expected !== $scope.tests[key].actual) {
        $scope.testResults[$scope.testResults.length-1].expected = 
          $scope.tests[key].expected;
        $scope.testResults[$scope.testResults.length-1].actual = 
          $scope.tests[key].actual;      
      }
    }
  }
}
