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
 * @fileoverview SVM predict function for SVC classifier of sklearn.
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

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

import { PredictionResult, PredictionResultObjectFactory } from
  'domain/classifier/PredictionResultObjectFactory';

export class IKernelParams {
  kernel: string;
  coef0: number;
  degree: number;
  gamma: number;
}

@Injectable({
  providedIn: 'root'
})
export class SVMPredictionService {
  constructor(
      private predictionResultObjectFactory: PredictionResultObjectFactory) {}
  kernel(
      kernelParams: IKernelParams, supportVectors: Array<number[]>,
      input: number[]): number[] {
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
  }
  // Find multiclass probabilities.
  // NOTE: This function is implemented as it is given in LibSVM.
  // For more information on exact approach used, read following paper:
  // https://www.csie.ntu.edu.tw/~cjlin/papers/svmprob/svmprob.pdf
  // Also take a look at implementation by LibSVM:
  // https://github.com/arnaudsj/libsvm/blob/master/svm.cpp#L1829
  calculateMulticlassProbabilities(
      nClasses: number, pairwiseProb: number[][]): number[] {
    var Q = [];
    for (var i = 0; i < nClasses; i++) {
      Q.push([]);
      for (var j = 0; j < nClasses; j++) {
        Q[i].push(0);
      }
    }

    var Qp = [];
    for (var i = 0; i < nClasses; i++) {
      Qp.push(0);
    }

    var P = [];
    for (var i = 0; i < nClasses; i++) {
      P.push(0);
    }

    var maxIter = Math.max(100, nClasses);
    var eps = 0.005 / nClasses;

    for (var t = 0; t < nClasses; t++) {
      P[t] = 1.0 / nClasses;
      Q[t][t] = 0.0;
      for (var j = 0; j < t; j++) {
        Q[t][t] += pairwiseProb[j][t] * pairwiseProb[j][t];
        Q[t][j] = Q[j][t];
      }

      for (var j = t + 1; j < nClasses; j++) {
        Q[t][t] += pairwiseProb[j][t] * pairwiseProb[j][t];
        Q[t][j] = -pairwiseProb[j][t] * pairwiseProb[t][j];
      }
    }

    var iter = 0;
    for (iter = 0; iter < maxIter; iter++) {
      var pQp = 0.0;

      for (var t = 0; t < nClasses; t++) {
        Qp[t] = 0;
        for (var j = 0; j < nClasses; j++) {
          Qp[t] += Q[t][j] * P[j];
        }
        pQp += P[t] * Qp[t];
      }

      var maxError = 0;
      for (var t = 0; t < nClasses; t++) {
        var error = Math.abs(Qp[t] - pQp);
        if (error > maxError) {
          maxError = error;
        }
      }

      if (maxError < eps) {
        break;
      }

      for (var t = 0; t < nClasses; t++) {
        var diff = (-Qp[t] + pQp) / Q[t][t];
        P[t] += diff;
        pQp = (
          (pQp + diff * (diff * Q[t][t] + 2 * Qp[t])) /
          (1 + diff) / (1 + diff));
        for (var j = 0; j < nClasses; j++) {
          Qp[j] = (Qp[j] + diff * Q[t][j]) / (1 + diff);
          P[j] /= (1 + diff);
        }
      }
    }

    if (iter >= maxIter) {
      console.info('Exceeds maxIter in calculateMulticlassProbabilities');
    }

    return P;
  }

  // TODO(#7176): Replace 'any' with the exact type. This has been kept as
  // 'any' because 'classifierData' is a dict with underscore_cased keys which
  // give tslint errors against underscore_casing in favor of camelCasing. Same
  // goes for 'input'.
  predict(classifierData: any, input: any): PredictionResult {
    var nSupport = classifierData.n_support;
    var supportVectors = classifierData.support_vectors;
    var dualCoef = classifierData.dual_coef;
    var intercept = classifierData.intercept;
    var classes = classifierData.classes;
    var kernelParams = classifierData.kernel_params;
    var probA = classifierData.probA;
    var probB = classifierData.probB;

    var startIndices = [];
    startIndices[0] = 0;
    for (var i = 1; i < nSupport.length; i++) {
      startIndices[i] = startIndices[i - 1] + nSupport[i - 1];
    }

    if (supportVectors[0].length !== input.length) {
      // Support vector and input dimensions do not match.
      console.error(
        'Dimension of support vectors and given input is different.');
    }

    // Find kernel values for supportVectors and given input. Assumes that
    // input has same dimension and data type as any of the supportVectors.
    var kvalues = this.kernel(kernelParams, supportVectors, input);

    var votes = [];
    for (var i = 0; i < classes.length; i++) {
      votes.push(0);
    }

    var pairwiseProb = [];
    for (var i = 0; i < classes.length; i++) {
      pairwiseProb.push([]);
      for (var j = 0; j < classes.length; j++) {
        pairwiseProb[i].push(0);
      }
    }

    var p = 0;
    for (var i = 0; i < classes.length; i++) {
      for (var j = i + 1; j < classes.length; j++) {
        var si = startIndices[i];
        var sj = startIndices[j];
        var ci = nSupport[i];
        var cj = nSupport[j];
        var minProb = 1e-7;

        var coef1 = dualCoef[j - 1];
        var coef2 = dualCoef[i];

        var sum = 0;
        for (var k = 0; k < ci; k++) {
          sum += kvalues[si + k] * coef1[si + k];
        }

        for (var k = 0; k < cj; k++) {
          sum += kvalues[sj + k] * coef2[sj + k];
        }

        // NOTE: libsvm substracts the intercept from sum in its prediction
        // function. Here intercept is added because sci-kit negates the
        // intercept before passing it on to libsvm for prediction.
        // For more info see github following issue:
        // https://github.com/oppia/oppia/issues/4166
        sum += intercept[p];

        // The following approach to calculate pairwise probabilities was
        // proposed by platt. For more info on LibSVM's implementation
        // of platt scaling, read following paper:
        // https://www.csie.ntu.edu.tw/~cjlin/papers/plattprob.pdf
        // Also take a look at following implementation by LibSVM:
        // https://github.com/arnaudsj/libsvm/blob/master/svm.cpp#L2552
        var f = probA[p] * sum + probB[p];
        var prob = 0;
        if (f >= 0) {
          prob = Math.exp(-f) / (1 + Math.exp(-f));
        } else {
          prob = 1 / (1 + Math.exp(f));
        }
        prob = Math.min(Math.max(prob, minProb), 1 - minProb);
        pairwiseProb[i][j] = prob;
        pairwiseProb[j][i] = 1 - prob;
        p++;
      }
    }

    var probabilities = this.calculateMulticlassProbabilities(
      classes.length, pairwiseProb);

    var maxProbIdx = 0;
    for (var i = 1; i < classes.length; i++) {
      if (probabilities[i] > probabilities[maxProbIdx]) {
        maxProbIdx = i;
      }
    }

    var predictedLabel = classes[maxProbIdx];
    var prediction = this.predictionResultObjectFactory.createNew(
      predictedLabel, probabilities[maxProbIdx]);
    return prediction;
  }
}

angular.module('oppia').factory(
  'SVMPredictionService', downgradeInjectable(SVMPredictionService));
