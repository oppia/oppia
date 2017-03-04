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
 * @fileoverview Unit test for MultipleChoiceInputCheckerService.
 */

 describe('Multiple Choice Input Checker Service', function() {
   var multipleChoiceInputCheckerService;
   var stubs ;
   var validInput ;
   var invalidInput;

   beforeEach(function() {
     validInput = {
       answerGroups = [
         {
           ruleSpecs : [
             {
               inputs : {
                 x : 1;
               },
               rule_type : "Equals";
             }
           ],
           outcome : {
             dest : "Question 1";
           }
         }
       ],
       customizationArgs = {
         choices : {
           value : [
             "<p>Option 1</p>"
           ]
         }
       }
     };

     invalidInput  = {
       answerGroups = [
         {
           ruleSpecs : [
             {
               inputs : {
                 x : 1;
               }
             }
           ],
           outcome : {
             dest : "Question 1";
           }
         }
       ],
       customizationArgs = {
         choices : {
           valueOpt : [
             "<p>Option 1</p>"
           ]
         }
       }
     };

     stubs = {
       valid : validInput,
       invalid : invalidInput
     };

     module('oppia'));
   });

   beforeEach(inject(function($injector) {
     multipleChoiceInputCheckerService =
     $injector.get('MultipleChoiceInputCheckerService');
   }));

   it('should return true if interaction data is compatible', function() {
     expect(multipleChoiceInputCheckerService
       .isValid(stubs.valid.customizationArgs, stubs.valid.answerGroups))
       .toEqual(true);
   });

   it('should return false if interaction data is not compatible', function() {
     expect(multipleChoiceInputCheckerService
       .isValid(stubs.invalid.customizationArgs, stubs.invalid.answerGroups))
       .toEqual(false);
   });
 });
