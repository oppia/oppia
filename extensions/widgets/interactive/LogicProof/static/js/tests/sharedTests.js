function TestCtrl($scope) {

  $scope.tests = {
    'parser_1': {
      expected: 'p\u2227q',
      actual: logicProofShared.displayExpression(
        logicProofParser.parse('p\u2227q', 'expression'), 
        logicProofData.BASE_STUDENT_LANGUAGE.operators)
    },
    'parser_2': {
      expected: '(p+q)=r',
      actual: logicProofShared.displayExpression(
        logicProofParser.parse('p+q=r', 'expression'), 
        logicProofData.BASE_STUDENT_LANGUAGE.operators)
    },
    'parser_3': {
      expected: 'p<(\u2200x.(2+2))',
      actual: logicProofShared.displayExpression(
        logicProofParser.parse('p<\u2200x.2+2', 'expression'), 
        logicProofData.BASE_STUDENT_LANGUAGE.operators)
    },
    'parser_4': {
      expected: '((x=2)\u2227(\u2203y.(y=6)))=>valid',
      actual: logicProofShared.displayExpression(
        logicProofParser.parse('(x=2)\u2227\u2203y.y=6=>valid', 'expression'),
        logicProofData.BASE_STUDENT_LANGUAGE.operators)
    },
    'parser_5': {
      expected: 'p\u2228(\u2200m\u2208S.A(m,S))',
      actual: logicProofShared.displayExpression(
        logicProofParser.parse('p\u2228\u2200m\u2208S.A(m,S)', 'expression'),
        logicProofData.BASE_CONTROL_LANGUAGE.operators)
    },
    'parser_6': {
      expected: 'min{a<b | p\u2228(q\u2227r)}',
      actual: logicProofShared.displayExpression(
        logicProofParser.parse('min{a<b|(p\u2228q\u2227r)}', 'expression'),
        logicProofData.BASE_CONTROL_LANGUAGE.operators)
    },
    'pre_parse_line_1': {
      expected: JSON.stringify(['from', 'p', 'and', 'q', 'we', 'have', 'p\u2227q']),
      actual: JSON.stringify(
        logicProofShared.preParseLineString(
          'from p and q we have p\u2227q', 
          logicProofData.BASE_STUDENT_LANGUAGE.operators, false))
    },
    'pre_parse_line_2': {
      expected: JSON.stringify(
        ['from', 'p\u2228(q\u2227r)', 's', 'we', 'see', '\u2200x.r']),
      actual: JSON.stringify(
        logicProofShared.preParseLineString(
          '    from p \u2228 (q\u2227 r ) s we see \u2200 x. r', 
          logicProofData.BASE_STUDENT_LANGUAGE.operators, false))
    },
    'pre_parse_line_3': {
      error: 'This line is blank.',
      actual: function() {
        logicProofShared.preParseLineString(
          '      ', logicProofData.BASE_STUDENT_LANGUAGE.operators, false);
      }
    },
    'pre_parse_line_4': {
      error: 'The symbol { was not recognised.',
      actual: function() {
        logicProofShared.preParseLineString(
          'from p and p{q we see q', 
          logicProofData.BASE_STUDENT_LANGUAGE.operators, false);
      }
    },
    'pre_parse_line_5': {
      expected: JSON.stringify(
        ['from', 'p[x->a]', 'at', '{{a|variable}}', 'have', 'q']),
      actual: JSON.stringify(
        logicProofShared.preParseLineString(
          'from p [ x -> a ] at {{ a | variable }} have q', 
          logicProofData.BASE_STUDENT_LANGUAGE.operators, true))
    },
    'pre_parse_line_6': {
      expected: JSON.stringify(
        ['from', '~R=>~S', 'and', '~S=>~R', 'we', 'have', '~R<=>~S']),
      actual: JSON.stringify(
        logicProofShared.preParseLineString(
          'from  ~R =>~S and  ~S =>~R we have ~R <=> ~S',
          logicProofData.BASE_STUDENT_LANGUAGE.operators, false))
    },
    'parse_line_1': {
      expected: JSON.stringify([[{
          format: 'phrase',
          content: 'from'
        },{
          format: 'expression',
          content: {
            top_kind_name: 'variable', 
            top_operator_name: 'p',
            arguments:[],
            dummies:[]
          }
        },{
          format: 'phrase',
          content: 'and'
        },{
          format: 'expression',
          content: {
            top_kind_name:'variable',
            top_operator_name: 'q',
            arguments: [],
            dummies:[]
          }
        },{
          format: 'phrase',
          content: 'have'
        },{
          format: 'expression',
          content: {
            top_kind_name: 'binary_connective',
            top_operator_name: 'and',
            arguments: [{
              top_kind_name: 'variable',
              top_operator_name: 'p',
              arguments: [],
              dummies: []
            },{
              top_kind_name: 'variable',
              top_operator_name: 'q',
              arguments: [],
              dummies: []
            }],
            dummies:[]
          }
        }]]),
      actual: JSON.stringify(
        logicProofShared.parseLineString(
          'from p and q we have p\u2227q', 
          logicProofData.BASE_STUDENT_LANGUAGE.operators, 
          logicProofData.BASE_VOCABULARY, false))
    },
    'parse_line_2': {
      error: 'The phrase starting \'we\' could not be identified; please make\
 sure you are only using phrases from the given list of vocabulary.',
      actual: function() {
        logicProofShared.parseLineString(
          'from p we havw p\u2227q', 
          logicProofData.BASE_STUDENT_LANGUAGE.operators, 
          logicProofData.BASE_VOCABULARY, false);
      }
    },
    'parse_line_3': {
      expected: 1,
      actual: logicProofShared.parseLineString(
        'from p[x->a] we know hence a contradiction {{ a | element }}', 
        logicProofData.BASE_STUDENT_LANGUAGE.operators, 
        logicProofData.BASE_VOCABULARY, true).length
    },
    'parse_line_4': {
      error: 'We could not identify \'B\'; please make sure you are using\
 vocabulary from the given list, and don\'t have two consecutive expressions.',
      actual: function () {
        logicProofShared.parseLineString(
          'from A=>B B have B', logicProofData.BASE_STUDENT_LANGUAGE.operators, 
          logicProofData.BASE_VOCABULARY, false);
      }
    },
    'instantiate_typing_1': {
      expected: JSON.stringify(['boolean', 'element', 'element']),
      actual: JSON.stringify(logicProofShared.instantiateTypingElementArray([{
        type: 'boolean',
        arbitrarily_many: false
      }, {
        type: 'element',
        arbitrarily_many: true,
      }], 3))
    },
    'instantiate_typing_2': {
      expected: JSON.stringify([]),
      actual: JSON.stringify(logicProofShared.instantiateTypingElementArray([], 0))
    },
    'assign_types_1': {
      expected: JSON.stringify({
        top_operator_name:"p",
        top_kind_name:"variable",
        arguments:[],
        dummies:[],
        type:"boolean"}),
      actual: JSON.stringify(
        logicProofShared.assignTypesToExpression(
          logicProofParser.parse('p', 'expression'), ['boolean'], 
          logicProofData.BASE_STUDENT_LANGUAGE, ['variable']
        )[0].typedExpression
      )
    },
    'assign_types_2': {
      expected: JSON.stringify({
        top_operator_name:"and",
        top_kind_name:"binary_connective",
        arguments:[{
          top_operator_name:"p",
          top_kind_name:"variable",
          arguments:[],
          dummies:[],
          type:"boolean"
        },{
          top_operator_name:"equals",
          top_kind_name:"binary_relation",
          arguments:[{
            top_operator_name:"x",
            top_kind_name:"variable",
            arguments:[],
            dummies:[],
            type:"element"
          },{
            top_operator_name:"y",
            top_kind_name:"variable",
            arguments:[],
            dummies:[],
            type:"element"
          }],
          dummies:[],
          type:"boolean"
        }],
        dummies:[],
        type:"boolean"
      }),
      actual: JSON.stringify(
        logicProofShared.assignTypesToExpression(
          logicProofParser.parse('p\u2227x=y', 'expression'), ['boolean'],
          logicProofData.BASE_STUDENT_LANGUAGE, ['variable']
        )[0].typedExpression
      )
    },
    'assign_types_3': {
      error: 'addition yields a element but you are trying to use it to give a\
 boolean.',
      actual: function() {logicProofShared.assignTypesToExpression(
        logicProofParser.parse('p<=>2+x', 'expression'), ['boolean'], 
        logicProofData.BASE_STUDENT_LANGUAGE, 
        ['variable']
      )}
    },
    'assign_types_4': {
      error: 'The name \'a\' is already in use and so cannot be quantified\
 over in \u2203a.f(2).',
      actual: function() {
        logicProofShared.assignTypesToExpression(
          logicProofParser.parse('a\u2227\u2203a.f(2)', 'expression'), 
          ['boolean'], logicProofData.BASE_STUDENT_LANGUAGE, 
          ['variable', 'prefix_function', 'constant']
        )
      }
    },
    'assign_types_5': {
      error: 'f is supposed to be a prefix_function.',
      actual: function() {
        logicProofShared.assignTypesToExpression(
          logicProofParser.parse('f(f)', 'expression'), ['boolean'], 
          logicProofData.BASE_STUDENT_LANGUAGE, 
          ['variable', 'prefix_function', 'constant']
        )
      }
    },
    'assign_types_6': {
      error: 'The operator bounded_for_all could not be identified.',
      actual: function() {
        logicProofShared.assignTypesToExpression(
          logicProofParser.parse('\u2200m<n.A(n)', 'expression'), ['boolean'],
          logicProofData.BASE_STUDENT_LANGUAGE, 
          ['variable', 'prefix_function', 'constant']
        )
      }
    },
    'assign_types_7': {
      error: 'x yields a boolean but you are trying to use it to give a element.',
      actual: function() {
        logicProofShared.assignTypesToExpression(
          logicProofParser.parse('x\u2227f(x)', 'expression'), ['boolean'], 
          logicProofData.BASE_STUDENT_LANGUAGE, 
          ['variable', 'prefix_function', 'constant']
        )
      }
    },
    'assign_types_8': {
      expected: '\u2203x.(x=x)',
      actual: logicProofShared.displayExpression(
        logicProofShared.assignTypesToExpression(
          logicProofParser.parse('\u2203x.x=x', 'expression'), ['boolean'], 
          logicProofData.BASE_STUDENT_LANGUAGE, []
        )[0].typedExpression, logicProofData.BASE_STUDENT_LANGUAGE.operators
      )
    },
    'assign_types_9': {
      error: 'The operator x could not be identified.',
      actual: function() {
        logicProofShared.assignTypesToExpression(
          logicProofParser.parse('\u2203x.A(x)<=>x=2', 'expression'), 
          ['boolean'],logicProofData.BASE_STUDENT_LANGUAGE, 
          ['prefix_function', 'constant']
        )
      }
    },
    'assign_types_10': {
      error: '2 yields a integer but you are trying to use it to give a string.',
      actual: function() {
        logicProofShared.assignTypesToExpression(
          logicProofParser.parse('\'a\'=2', 'expression'), ['boolean'], 
          logicProofData.BASE_CONTROL_LANGUAGE, ['prefix_function', 'constant']
        )
      }
    },
    'check_expressions_equal_1': {
      expected: true,
      actual: logicProofShared.checkExpressionsAreEqual(
        logicProofParser.parse('p\u2227r\u2228\u2200x.s', 'expression'), 
        logicProofParser.parse('(p\u2227r)\u2228(\u2200x.s)', 'expression'))
    },
    'check_expressions_equal_2': {
      expected: false,
      actual: logicProofShared.checkExpressionsAreEqual(
        logicProofParser.parse('p\u2227r\u2228\u2200x.s', 'expression'), 
        logicProofParser.parse('(p\u2227r)\u2228(\u2200y.s)', 'expression'))
    },
    'check_expression_in_set': {
      expected: false,
      actual: logicProofShared.checkExpressionIsInSet(
        logicProofParser.parse('p\u2227q', 'expression'), 
        [
          logicProofParser.parse('A(x)', 'expression'), 
          logicProofParser.parse('q\u2227p', 'expression')
        ])
    },
    'check_expression_sets_equal': {
      expected: true,
      actual: logicProofShared.checkSetsOfExpressionsAreEqual([
          logicProofParser.parse('A(x)\u2228x=2', 'expression'),
          logicProofParser.parse('p', 'expression')
        ], [
          logicProofParser.parse('p', 'expression'),
          logicProofParser.parse('A(x)\u2228(x=2)', 'expression'),
          logicProofParser.parse('p', 'expression')
        ])
    },
    'get_operators_1': {
      expected: 'x 2 addition f y equals p and',
      actual: logicProofShared.getOperatorsFromExpression(
        logicProofParser.parse('f(x+2)=y+x\u2227p', 'expression')).join(' ')
    },
    'get_operators_2': {
      expected: 'x y',
      actual: logicProofShared.getOperatorsFromExpression(
        logicProofParser.parse('x+2=y+x', 'expression'), 
        ['variable']).join(' ')
    },
    'greater_than_lex_1': {
      expected: true,
      actual: logicProofShared.greaterThanInLex([1,2,4,4], [1,2,3,5])
    },
    'greater_than_lex_2': {
      expected: false,
      actual: logicProofShared.greaterThanInLex([1,2], [1,2])
    }
  };

  $scope.testResults = [];
  for (var key in $scope.tests) {
    $scope.testResults.push({name: key, expected: 'passed'});
    if ($scope.tests[key].hasOwnProperty('error')) {
      try {
        $scope.tests[key].actual();
        $scope.testResults[$scope.testResults.length-1].expected = 
          'An error should have occurred and did not.'
      }
        catch(err) {
          var actual = logicProofShared.renderError(
            err, logicProofData.BASE_GENERAL_MESSAGES, 
            logicProofData.BASE_STUDENT_LANGUAGE);
          if (actual !== $scope.tests[key].error) {
            $scope.testResults[$scope.testResults.length-1].expected = 
              $scope.tests[key].error;
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
