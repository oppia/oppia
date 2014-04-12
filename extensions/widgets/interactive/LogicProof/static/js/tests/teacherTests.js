function TestCtrl($scope) {
  $scope.tests = {
    'question_1': {
      expected: 'p\u2227q',
      actual: logicProofShared.displayExpression(
        logicProofTeacher.buildQuestion(
          ' ', 'p\u2227q', logicProofData.BASE_VOCABULARY).results[0],
        logicProofData.BASE_STUDENT_LANGUAGE.operators)
    },
    'question_2': {
      expected: 'f(2)=3, \u2200x.(x>1)',
      actual: logicProofShared.displayExpressionArray(
        logicProofTeacher.buildQuestion(
          'f(2)=3,\u2200x.x>1', 'p\u2227q', logicProofData.BASE_VOCABULARY
        ).assumptions, logicProofData.BASE_STUDENT_LANGUAGE.operators)
    },
    'question_3': {
      errorMessage: 'f must have 1 arguments.',
      actual: function() {
        logicProofTeacher.buildQuestion(
          'f(x,y)=z', 'f(x)=z', logicProofData.BASE_VOCABULARY);
      }
    },
    'question_4': {
      errorMessage: 'The name \'we\' is reserved for vocabulary and so cannot be used here.',
      actual: function() {
        logicProofTeacher.buildQuestion(
          'we\u2227you', 'p=q', logicProofData.BASE_VOCABULARY)
      }
    },
    'question_5': {
      expected: 1,
      actual: logicProofTeacher.buildQuestion(
        'R(albert)\u2227R(betty)', 'p', logicProofData.BASE_VOCABULARY
      ).results.length
    },
    'line_template_1': {
      expected: JSON.stringify({
        name: "and_introduce",
        reader_view: "from p and q we have p\u2227q",
        antecedents: "p, q",
        results: "p\u2227q",
        variables: "",
        error: []
      }),
      actual: JSON.stringify(logicProofTeacher2.displayLineTemplate(
        logicProofTeacher2.buildLineTemplate(
          'and_introduce', 'from p and q we have p\u2227q', 'p, q', 'p\u2227q',
          '', [], logicProofData.BASE_STUDENT_LANGUAGE, logicProofData.BASE_VOCABULARY
        ),
        logicProofData.BASE_STUDENT_LANGUAGE.operators, logicProofData.BASE_VOCABULARY)
      )
    },
    'line_template_2': {
      expected: JSON.stringify({
        name: 'and_introduce',
        reader_view: 'from p we have p\u2227q', 
        antecedents: 'p',
        results: 'p\u2227q', 
        variables: '',
        error: [
          'Should this be "from {{p}} and {{q}} we have {{p\u2227q}}"?', 
          'To prove {{p\u2227q}} you need to have shown {{q}} as well'
        ]
      }),
      actual: JSON.stringify(logicProofTeacher2.displayLineTemplate(
        logicProofTeacher2.buildLineTemplate(
          'and_introduce', 'from p we have p\u2227q', 'p', 'p\u2227q', '',
          [
            'Should this be "from {{p}} and {{q}} we have {{p\u2227q}}"?', 
            'To prove {{p\u2227q}} you need to have shown {{q}} as well'
          ], 
          logicProofData.BASE_STUDENT_LANGUAGE, logicProofData.BASE_VOCABULARY), 
        logicProofData.BASE_STUDENT_LANGUAGE.operators, logicProofData.BASE_VOCABULARY))
    },
    'line_template_3': {
      expected: JSON.stringify({
        name: 'for_all_introduce',
        reader_view: '{{a|element}} was arbitrary hence \u2200x.p',
        antecedents: 'p[x->a]',
        results: '\u2200x.p',
        variables: 'a',
        error: []
      }),
      actual: JSON.stringify(
        logicProofTeacher2.displayLineTemplate(
          logicProofTeacher2.buildLineTemplate(
            'for_all_introduce', '{{a|element}} was arbitrary hence \u2200x.p',
            'p[x->a]', '\u2200x.p', 'a', [], logicProofData.BASE_STUDENT_LANGUAGE,
            logicProofData.BASE_VOCABULARY), 
          logicProofData.BASE_STUDENT_LANGUAGE.operators, 
          logicProofData.BASE_VOCABULARY))
    },
    'line_template_4': {
      error: 'It will not be possible to uniquely identify p from a line of this form.',
      actual: function() {
        logicProofTeacher2.buildLineTemplate(
          'name', 'from q we have r', 'q', 'p', '', [], 
          logicProofData.BASE_STUDENT_LANGUAGE, logicProofData.BASE_VOCABULARY)
      }
    },
    'line_template_5': {
      // FUTURE: render this test passable
      error: 'It will not be possible to uniquely identify a from a line of this form.',
      actual: function() {
        logicProofTeacher2.buildLineTemplate(
          'exists_introduce', 'from p[x->a] we have \u2203x.p', 'p[x->a]',
          '\u2203x.p', 'a', [], logicProofData.BASE_STUDENT_LANGUAGE, 
          logicProofData.BASE_VOCABULARY)
      }
    },
    'line_template_6': {
      error: 'p yields a boolean but you are trying to use it to give a element.',
      actual: function() {
        logicProofTeacher2.buildLineTemplate(
          'name', 'take p satisfying q[x->p]', '', '', '', [], 
          logicProofData.BASE_STUDENT_LANGUAGE, logicProofData.BASE_VOCABULARY)
      }
    },
    'line_template_table_1': {
      expected: JSON.stringify([
        {
          name: "a",
          reader_view: "p hence q",
          antecedents: "p",
          results: "q",
          variables: "",
          error: [],
        },
        {
          name: "b",
          reader_view: "\u2203x.(p\u2227q) if contradiction we have from r",
          antecedents: "r, p, q",
          results: "",
          variables: "x",
          error: ["How unwise {{x|variable}}."]
        }
      ]),
      actual: JSON.stringify(
        logicProofTeacher2.displayLineTemplateTable(
          logicProofTeacher2.buildLineTemplateTable([{
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
          }], logicProofData.BASE_VOCABULARY), logicProofData.BASE_VOCABULARY))
    },
    'line_template_table_2': {
      errorList: JSON.stringify(
        ['', 'The name \'if\' is reserved for vocabulary and so cannot be used here.']),
      actual: function() {
          logicProofTeacher2.buildLineTemplateTable([{
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
        }], logicProofData.BASE_VOCABULARY)
      }
    },
    'mistake_entry_1': {
      expected: JSON.stringify({
        name: 'name',
        occurs: '(n=1)\u2227(indentation(n)>0)', 
        message: [
          'The first line of a proof should not be indented',
          'Don\'t indent the first line of your proof'
        ]
      }),
      actual: JSON.stringify(
        logicProofTeacher2.displayMistakeEntry(
          logicProofTeacher2.buildMistakeEntry(
            'name', 'n=1 \u2227 indentation(n)>0', [
              'The first line of a proof should not be indented',
              'Don\'t indent the first line of your proof'
            ], logicProofData.BASE_CONTROL_LANGUAGE
          ), logicProofData.BASE_CONTROL_LANGUAGE.operators
        )
      )
    },
    'mistake_entry_2': {
      error: 'antecedents yields a set_of_formulas but you are trying to use it\
 to give a integer.',
      actual: function() {
        logicProofTeacher2.buildMistakeEntry(
          'name', 'template(n) = \'given\'', 
          ['examine {{antecedents(n-1)+1}}'], logicProofData.BASE_CONTROL_LANGUAGE)
      }
    },
    'mistake_entry_3': {
      expected: JSON.stringify({
        name:'name',
        occurs:{
          top_operator_name:'not',
          top_kind_name:'unary_connective',
          arguments:[{
            top_operator_name:'is_in',
            top_kind_name:'binary_relation',
            arguments:[{
              top_operator_name:'target',
              top_kind_name:'prefix_function',
              arguments:[],
              dummies:[],
              type:'formula'
            },{
              top_operator_name:'results',
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
            }],
            dummies:[],
            type:'boolean'
          }],
          dummies:[],
          type:'boolean'
        },
        message:[[{
          format:'expression',
          content:{
            top_operator_name:'subtraction',
            top_kind_name:'binary_function',
            arguments:[{
              top_operator_name:'num_lines',
              top_kind_name:'prefix_function',
              arguments:[],
              dummies:[],
              type:'integer'
            },{
              top_operator_name:1,
              top_kind_name:'constant',
              arguments:[],
              dummies:[],
              type:'integer'
            }],
            dummies:[],
            type:'integer'
          }
        }]]
      }),
      actual: JSON.stringify(
        logicProofTeacher2.buildMistakeEntry(
          'name', '~target()\u2208results(n)', ['{{num_lines()-1}}'],
          logicProofData.BASE_CONTROL_LANGUAGE))
    },
    'mistake_section_1': {
      expected: JSON.stringify({
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
      }),
      actual: JSON.stringify(
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
          ), logicProofData.BASE_CONTROL_LANGUAGE.operators
        )
      )
    },
    'mistake_section_2': {
      errorList: JSON.stringify(
        ['The operator operator could not be identified.']),
      actual: function() {
        logicProofTeacher2.buildMistakeSection(
        'variables',
        [{
          name: 'a mistake',
          occurs: 'operator(n)=\'and\'',
          message: ['Dear dear']
        }], []
        )
      }
    },
    'control_function_1': {
      expected: JSON.stringify({
        LHS: 'f(n)',
        RHS: 'n+2',
        description: 'a'
      }),
      actual: JSON.stringify(
        logicProofTeacher2.displayControlFunction(
          logicProofTeacher2.buildControlFunction(
            'f(n)', 'n+2', 'a', logicProofData.BASE_CONTROL_LANGUAGE),
          logicProofData.BASE_CONTROL_LANGUAGE.operators
        )
      )
    },
    'control_function_2': {
      expected: JSON.stringify({
        LHS: 'is_scope_creator(n)',
        RHS: '(template(n)=\'given\')\u2228(template(n)=\'assumption\')',
        description: ''
      }),
      actual: JSON.stringify(
        logicProofTeacher2.displayControlFunction(
          logicProofTeacher2.buildControlFunction(
            'is_scope_creator(n)', 
            'template(n)=\'given\' \u2228 template(n)=\'assumption\'', '', 
            logicProofData.BASE_CONTROL_LANGUAGE),
          logicProofData.BASE_CONTROL_LANGUAGE.operators
        )
      )
    },
    'control_function_3': {
      error: 'The operator missing_function could not be identified.',
      actual: function() {
        logicProofTeacher2.buildControlFunction(
          'bad_function(x,y)', 'missing_function(x-y, x+y)', '', 
          logicProofData.BASE_CONTROL_LANGUAGE)
      }
    },
    'control_function_4': {
      error: 'template yields a string but you are trying to use it to give a integer.',
      actual: function() {
        logicProofTeacher2.buildControlFunction(
          'f(n)', 'template(n) + 3', '', logicProofData.BASE_CONTROL_LANGUAGE)
      }
    },
    'control_function_5': {
      error: 'Unfortunately this cannot be accepted as it has multiple possible typings.',
      actual: function() {
        logicProofTeacher2.buildControlFunction(
          'f(n)', 'n', '', logicProofData.BASE_CONTROL_LANGUAGE)
      }
    },
    'control_function_6': {
      error: 'You cannot use n as a function name; it is reserved to refer to line numbers',
      actual: function() {
        logicProofTeacher2.buildControlFunction(
          'n(x,y)', 'x-y', '', logicProofData.BASE_CONTROL_LANGUAGE)
      }
    },
    'control_function_7': {
      expected: JSON.stringify({
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
        definition:{
          top_operator_name:'addition',
          top_kind_name:'binary_function',
          arguments:[{
            top_operator_name:'x',
            top_kind_name:'variable',
            arguments:[],
            dummies:[],
            type:'integer'
          },{
            top_operator_name:2,
            top_kind_name:'constant',
            arguments:[],
            dummies:[],
            type:'integer'
          }],
          dummies:[],
          type:'integer'
        },
        description:'a description'
      }),
      actual: JSON.stringify(
        logicProofTeacher2.buildControlFunction(
          'f(x)', 'x+2', 'a description', logicProofData.BASE_CONTROL_LANGUAGE))
    },
    'control_function_table_1': {
      expected: JSON.stringify([{
        LHS: 'is_scope_creator(n)',
        RHS: '(template(n)=\'given\')\u2228(template(n)=\'assumption\')',
        description: 'a'
      }, {
        LHS: 'is_in_scope(m,n)',
        RHS: '((~is_scope_creator(m))\u2227((indentation(n)>=indentation(m))\
\u2227(~\u2203k<=n.(k>=m)\u2227(indentation(k)<indentation(m)))))\u2228\
((indentation(n)>indentation(m))\u2227(~\u2203k<=n.(k>=m)\u2227\
(indentation(k)<=indentation(m))))',
        description: 'b'
      }]),
      actual: JSON.stringify(
        logicProofTeacher2.displayControlFunctionTable(
          logicProofTeacher2.buildControlFunctionTable(
            [
              {
                LHS: 'is_scope_creator(n)', 
                RHS: 'template(n)=\'given\' \u2228 template(n)=\'assumption\'',
                description: 'a',
              }, {
                LHS: 'is_in_scope(m,n)', 
                RHS: '(~is_scope_creator(m)\u2227indentation(n)>=indentation(m)\
\u2227~\u2203k<=n.(k>=m\u2227indentation(k)<indentation(m)))\u2228\
(indentation(n)>indentation(m)\u2227~\u2203\
k<=n.(k>=m\u2227indentation(k)<=indentation(m)))',
                description: 'b'
              }
            ]
          ), logicProofData.BASE_CONTROL_LANGUAGE.operators
        )
      )
    },
    'control_function_table_2': {
      errorMessage: 'The function f has already been defined.',
      actual: function() {
        logicProofTeacher2.buildControlFunctionTable(
          [
            {LHS: 'f(n)', RHS: 'indentation(n) - 2', description: ''},
            {LHS: 'f(n)', RHS: 'indentation(n) - 2', description: ''}
          ]
        )
      }
    },
    'parse_message_1': {
      expected: 'stuff {{p\u2227q}} thingies',
      actual: logicProofTeacher2.displayControlMessage(
        logicProofTeacher2.parseMessage(
          'stuff {{p\u2227q}} thingies', 'control'), 
        logicProofData.BASE_CONTROL_LANGUAGE.operators)
    },
    'parse_message_2': {
      expected: JSON.stringify([{
        isFixed: true,
        content: 'Your use of '
      }, {
        isFixed: false,
        content: 'item'
      }, {
        isFixed: true,
        content: ' is wrong.'
      }]),
      actual: JSON.stringify(
        logicProofTeacher2.parseMessage(
          'Your use of {{item}} is wrong.', 'general'))
    },
    'parse_message_3': {
      error: 'It was not possible to parse {{p[[x->a]}}.',
      actual: function() {
        logicProofTeacher2.parseMessage(
          'By lack of arbitraryness this fails for {{p[[x->a]}}.', 'line');
      }
    },
    'parse_message_4': {
      error: 'This has an unmatched {{.',
      actual: function() {
        logicProofTeacher2.parseMessage(
          'of {{result(scoper(n))}}.{{d)', 'control')
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
              err, logicProofTeacher.TEACHER_ERROR_MESSAGES, 
              logicProofData.BASE_STUDENT_LANGUAGE):
            (typeOfError === 'errorList') ?
              JSON.stringify(err):
              err.message;
          var expected = $scope.tests[key][typeOfError];
          if (actual !== expected) {
            $scope.testResults[$scope.testResults.length-1].expected = expected;
            $scope.testResults[$scope.testResults.length-1].actual = actual;    
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

