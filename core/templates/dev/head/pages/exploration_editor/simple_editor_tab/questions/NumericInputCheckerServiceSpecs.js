// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for NumericInteractionInputChecker.
 */
 describe('Numeric interaction input checker service', function() {
   beforeEach(module('oppia'));

   var AnswerGroupObjectFactory;
   var mcics;

   it('should return true for rule type Contains ', function() {
     var answerGroupsTrue = [{
       rules: [{
         type: 'Equals',
         inputs: {
           x: 4
         }
       }],
       outcome: {
         param_changes: [],
         feedback: [],
         dest: 'Question 1'
       }
     }];
     expect(mcics.isValid('', answerGroupsTrue)).toBe(true);
   });

   it('should return false for rule type other than Contains', function() {
     var answerGroupsFalse = [{
       rules: [{
         type: 'IsGreaterThan',
         inputs: {
           x: 4
         }
       }],
       outcome: {
         param_changes: [],
         feedback: [],
         dest: 'Question 1'
       }
     }];
     expect(mcics.isValid('', answerGroupsFalse)).toBe(false);
   });

   it('should return false for more than one rule', function() {
     var answerGroupsFalse = [{
       rules: [{
         type: 'Equals',
         inputs: {
           x: 10
         }
       },
       {
         type: 'Equals',
         inputs: {
           x: 21
         }
       }],
       outcome: {
         param_changes: [],
         feedback: [],
         dest: 'Question 1'
       }
     }];
     expect(mcics.isValid('', answerGroupsFalse)).toBe(false);
   });

   beforeEach(inject(function($injector) {
     AnswerGroupObjectFactory = $injector.get('AnswerGroupObjectFactory');
     mcics = $injector.get('NumericInputCheckerService');
   }));
 });
