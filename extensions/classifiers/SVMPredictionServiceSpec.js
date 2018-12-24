// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the SVM prediction functions.
 */

describe('SVM prediction functions', function() {
  beforeEach(module('oppia'));

  describe('Test SVM prediction functions', function() {
    var service;
    beforeEach(inject(function($injector) {
      service = $injector.get('SVMPredictionService');
    }));

    it('should calculate correct kernel values', function() {
      var kernelParams = {
        kernel: 'rbf',
        coef0: 0.0,
        degree: 3,
        gamma: 0.5
      };

      var supportVectors = [[0, 0], [1, 1]];
      var input = [1, 0];
      var kvalues = service.kernel(kernelParams, supportVectors, input);
      var expectedKvalues = [0.6065306597126334, 0.6065306597126334];
      expect(kvalues.length).toEqual(2);
      expect(kvalues).toEqual(expectedKvalues);
    });

    it('should predict correct label', function() {
      var svmData = {
        classes: [0, 1],
        n_support: [2, 2],
        support_vectors: [[1.0, 1.0], [0.0, 0.0], [1.0, 0.0], [0.0, 1.0]],
        dual_coef: [[1.0, 1.0, -1.0, -1.0]],
        intercept: [0.0],
        probA: [],
        probB: [],
        kernel_params: {
          kernel: 'rbf', coef0: 0.0, degree: 3, gamma: 0.5},
      };

      var input = [1, 1];
      var expectedLabel = 0;
      var prediction = service.predict(svmData, input);
      expect(prediction).toEqual(expectedLabel);

      var input = [0, 1];
      var expectedLabel = 1;
      var prediction = service.predict(svmData, input);
      expect(prediction).toEqual(expectedLabel);

      var input = [1, 0];
      var expectedLabel = 1;
      var prediction = service.predict(svmData, input);
      expect(prediction).toEqual(expectedLabel);

      var input = [0, 0];
      var expectedLabel = 0;
      var prediction = service.predict(svmData, input);
      expect(prediction).toEqual(expectedLabel);
    });
  });
});
