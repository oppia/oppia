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
 * SVM predict function for SVC classifier of sklearn.
 *
 * IMPORTANT NOTE: The predict function uses svm data that was extracted
 * after training of classifier on Oppia-ml. If there are any changes in
 * format of extracted data then corresponding changes must be propagated here.
 * Oppia-ml uses scikit's SVC class during training classifier which uses
 * libsvm's implementation. If there are any changes in following part of
 * code in libsvm then corresponding changes must be propagated here.
 *
 * libsvm's code for prediction:
 * https://github.com/arnaudsj/libsvm/blob/master/svm.cpp#L2481
 */

oppia.factory('SVMPredictionService', ['$log', function($log) {
  return {
    kernel: function(kernelParams, supportVectors, input) {
      var kernel = kernelParams.kernel;
      var kvalues = [];

      if (kernel === 'rbf') {
        var gamma = kernelParams.gamma;
        var vectorLength = input.length;
        for (var i = 0; i < supportVectors.length; i++) {
          var sum = 0;
          for (var j = 0; j < input.length; j++) {
            sum += Math.pow((supportVectors[i][j] - input[j]), 2);
          }
          kvalues.push(Math.exp(-gamma * sum));
        }
      } else if (kernel === 'linear') {
        var vectorLength = input.length;
        for (var i = 0; i < supportVectors.length; i++) {
          var sum = 0;
          for (var j = 0; j < input.length; j++) {
            sum += supportVectors[i][j] * input[j];
          }
          kvalues.push(sum);
        }
      }
      return kvalues;
    },

    predict: function(classifierData, input) {
      var nSupport = classifierData.n_support;
      var supportVectors = classifierData.support_vectors;
      var dualCoef = classifierData.dual_coef;
      var intercept = classifierData.intercept;
      var classes = classifierData.classes;
      var kernelParams = classifierData.kernel_params;

      var startIndices = [];
      startIndices[0] = 0;
      for (var i = 1; i < nSupport.length; i++) {
        startIndices[i] = startIndices[i - 1] + nSupport[i - 1];
      }

      if (supportVectors[0].length !== input.length) {
        // Support vector and input dimensions do not match.
        $log.error(
          'Dimension of support vectors and given input is different.');
      }

      // Find kernel values for supportVectors and given input. Assumes that
      // input has same dimension and data type as any of the supportVectors.
      var kvalues = this.kernel(kernelParams, supportVectors, input);

      var votes = [];
      for (var i = 0; i < classes.length; i++) {
        votes.push(0);
      }

      var p = 0;
      for (var i = 0; i < classes.length; i++) {
        for (var j = i + 1; j < classes.length; j++) {
          var si = startIndices[i];
          var sj = startIndices[j];
          var ci = nSupport[i];
          var cj = nSupport[j];

          var coef1 = dualCoef[j - 1];
          var coef2 = dualCoef[i];

          var sum = 0;
          for (var k = 0; k < ci; k++) {
            sum += kvalues[si + k] * coef1[si + k];
          }

          for (var k = 0; k < cj; k++) {
            sum += kvalues[sj + k] * coef2[sj + k];
          }
          // TODO(prasanna08): Verify why libsvm uses subtraction
          // instead of addition.
          sum += intercept[p];
          if (sum > 0) {
            votes[i]++;
          } else {
            votes[j]++;
          }
          p++;
        }
      }

      // Find out class which has got maximum votes.
      var maxVoteIdx = 0;
      for (var i = 0; i < votes.length; i++) {
        if (votes[i] > votes[maxVoteIdx]) {
          maxVoteIdx = i;
        }
      }

      var predictedLabel = classes[maxVoteIdx];
      return predictedLabel;
    }
  };
}]);
