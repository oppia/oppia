// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Tests for the sorted-dependencies.js file.
 */

'use strict';

var rule = require('./sorted-dependencies');
var RuleTester = require('eslint').RuleTester;

var ruleTester = new RuleTester();
ruleTester.run('sorted-dependencies', rule, {
  valid: [
    `angular.module('oppia').directive('SuggestionModalForCreator' +
    'ViewController', ['$uibModalInstance', 'SuggestionModalService',
    'canReviewActiveThread', 'description', 'scope', 'newContent', 'oldContent',
    'stateName', 'suggestionIsHandled', 'suggestionStatus',
    'suggestionType', 'IMPORT_STATEMENT', function(){
    }])`,
    `angular.module('oppia').directive('SuggestionModalForCreator' +
    'ViewController', 'testing', ['$uibModalInstance', 'SuggestionModalService',
    'canReviewActiveThread', 'description', 'scope', 'newContent', 'oldContent',
    'stateName', 'suggestionIsHandled', 'suggestionStatus',
    'suggestionType', 'IMPORT_STATEMENT', function(){
    }])`,
  ],

  invalid: [
    {
      code: `angular.module('oppia').directive('SuggestionModalForCreatorViewCont', [
      '$uibModalInstance', 'SuggestionModalService',
      'canReviewActiveThread', 'description', '$scope', 'newContent', 'oldCont',
      'stateName', 'suggestionIsHandled', 'suggestionStatus',
      'suggestionType', 'IMPORT_STATEMENT', function(){
      }])`,
      errors: [
        {
          message:
            'Please ensure that the injected dependencies should be in the' +
            ' following manner: dollar imports, local imports and' +
            ' constant imports, all in sorted-order.',
          type: 'ArrayExpression',
        },
      ],
    },
  ],
});
