// Copyright 2015 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the sample prediction algorithm service.
 */

 describe('Prediction algorithm sample service', function() {
   beforeEach(module('oppia'));

   describe('Test prediction algorithm functions', function() {
     var predictionService;
     beforeEach(inject(function($injector) {
       predictionService = $injector.get('PredictionAlgorithmSampleService');
     }));

     it('should return correct structure of predicted values.', function() {
       var classifierData = {};
       var userText = "";
       var expectedResult = {
         answerGroupIndex: 0
       };
       var generatedResult = predictionService.predict(
         classifierData, userText);

        expect(generatedResult).toEqual(expectedResult);
     });
   });
 });
