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
 * @fileoverview Unit tests for TextInteractionInputChecker.
 */
 describe('Text interaction input checker service', function() {
   beforeEach(module('oppia'));

   beforeEach(inject(function($injector) {
     AnswerGroupObjectFactory = $injector.get('AnswerGroupObjectFactory');
     tics = $injector.get('TextInputCheckerService');
   }));
   
   var AnswerGroupObjectFactory;
   var tics;

   it('should return true for rule type EqualsS ', function() {
     var answerGroupsTrue = [{
       rules: [{
         type: 'Equals',
         inputs: {
           x: 'j'
         }
       }],
       outcome: {
         param_changes: [],
         feedback: [],
         dest: 'Question 1'
       }
     }];
     expect(tics.isValid('', answerGroupsTrue)).toBe(true);
   });

   it('should return false for rule type other than Equals', function() {
     var answerGroupsFalse = [{
       rules: [{
         type: 'FuzzyEquals',
         inputs: {
           x: 'j'
         }
       }],
       outcome: {
         param_changes: [],
         feedback: [],
         dest: 'Question 1'
       }
     }];
     expect(tics.isValid('', answerGroupsFalse)).toBe(false);
   });

   it('should return false for more than one rule', function() {
     var answerGroupsFalse = [{
       rules: [{
         type: 'FuzzyEquals',
         inputs: {
           x: 'j'
         }
       },
       {
         type: 'Equals',
         inputs: {
           x: 'j'
         }
       }],
       outcome: {
         param_changes: [],
         feedback: [],
         dest: 'Question 1'
       }
     }];
     expect(tics.isValid('', answerGroupsFalse)).toBe(false);
   });
 });
