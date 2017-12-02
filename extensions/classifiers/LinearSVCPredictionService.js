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
 * SVC(kernel=linear) prediction service for skleanr's svm.SVC() classifier.
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

oppia.factory('LinearSVCPredictionService', ['$log', function($log) {
  return {

    predict: function(classifierData, input) {
        var i, j, k, d, l;
        
        var n_svs = classifierData.n_support;
        var svs = classifierData.support_vectors;
        var coeffs = classifierData.dual_coef;
        var inters = classifierData.intercept;
        var classes = classifierData.classes;
       
        // <x,x'>
        var kernels = new Array(svs.length),
            kernel;
        for (i = 0; i < svs.length; i++) {
            kernel = 0.;
            for (j = 0; j < input.length; j++) {
                kernel += svs[i][j] * input[j];
            }
            kernels[i] = kernel;
        }
        
        var starts = new Array(classes.length);
        for (i = 0; i < classes.length; i++) {
            if (i != 0) {
                var start = 0;
                for (j = 0; j < i; j++) {
                    start += n_svs[j];
                }
                starts[i] = start;
            } else {
                starts[0] = 0;
            }
        }
        var ends = new Array(classes.length);
        for (i = 0; i < classes.length; i++) {
            ends[i] = n_svs[i] + starts[i];
        }
        var decisions = new Array(inters.length);
        for (i = 0, d = 0, l = classes.length; i < l; i++) {
            for (j = i + 1; j < l; j++) {
                var tmp = 0.;
                for (k = starts[j]; k < ends[j]; k++) {
                    tmp += kernels[k] * coeffs[i][k];
                }
                for (k = starts[i]; k < ends[i]; k++) {
                    tmp += kernels[k] * coeffs[j - 1][k];
                }
                decisions[d] = tmp + inters[d];
                d++;
            }
        }
        var votes = new Array(inters.length);
        for (i = 0, d = 0, l = classes.length; i < l; i++) {
            for (j = i + 1; j < l; j++) {
                votes[d] = decisions[d] > 0 ? i : j;
                d++;
            }
        }
        
        var amounts = new Array(classes.length).fill(0);
        for (i = 0, l = votes.length; i < l; i++) {
            amounts[votes[i]] += 1;
        }
        
        var class_val = -1, class_idx = -1;
        for (i = 0, l = classes.length; i < l; i++) {
            if (amounts[i] > class_val) {
                class_val = amounts[i];
                class_idx = i;
            }
        }
        return classes[class_idx];
    }
  };
}]);
