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

import { PredictionResult } from 'domain/classifier/prediction-result.model';

@Injectable({
  providedIn: 'root'
})
export class SVMPredictionService {
  constructor() {}
  kernel(
      kernelParams: KernelParams, supportVectors: number[][],
      input: number[]): number[] {
    let kernel = kernelParams.kernel;
    let kvalues = [];

    if (kernel === 'rbf') {
      let gamma = kernelParams.gamma;
      for (let i = 0; i < supportVectors.length; i++) {
        let sum = 0;
        for (let j = 0; j < input.length; j++) {
          sum += Math.pow((supportVectors[i][j] - input[j]), 2);
        }
        kvalues.push(Math.exp(-gamma * sum));
      }
    } else if (kernel === 'linear') {
      for (let i = 0; i < supportVectors.length; i++) {
        let sum = 0;
        for (let j = 0; j < input.length; j++) {
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
    let Q: number[][] = [];
    for (let i = 0; i < nClasses; i++) {
      Q.push([]);
      for (let j = 0; j < nClasses; j++) {
        Q[i].push(0);
      }
    }

    let Qp: number[] = [];
    for (let i = 0; i < nClasses; i++) {
      Qp.push(0);
    }

    let P: number[] = [];
    for (let i = 0; i < nClasses; i++) {
      P.push(0);
    }

    let maxIter = Math.max(100, nClasses);
    let eps = 0.005 / nClasses;

    for (let t = 0; t < nClasses; t++) {
      P[t] = 1.0 / nClasses;
      Q[t][t] = 0.0;
      for (let j = 0; j < t; j++) {
        Q[t][t] += pairwiseProb[j][t] * pairwiseProb[j][t];
        Q[t][j] = Q[j][t];
      }

      for (let j = t + 1; j < nClasses; j++) {
        Q[t][t] += pairwiseProb[j][t] * pairwiseProb[j][t];
        Q[t][j] = -pairwiseProb[j][t] * pairwiseProb[t][j];
      }
    }

    let iter = 0;
    for (iter = 0; iter < maxIter; iter++) {
      let pQp = 0.0;

      for (let t = 0; t < nClasses; t++) {
        Qp[t] = 0;
        for (let j = 0; j < nClasses; j++) {
          Qp[t] += Q[t][j] * P[j];
        }
        pQp += P[t] * Qp[t];
      }

      let maxError = 0;
      for (let t = 0; t < nClasses; t++) {
        let error = Math.abs(Qp[t] - pQp);
        if (error > maxError) {
          maxError = error;
        }
      }

      if (maxError < eps) {
        break;
      }

      for (let t = 0; t < nClasses; t++) {
        let diff = (-Qp[t] + pQp) / Q[t][t];
        P[t] += diff;
        pQp = (
          (pQp + diff * (diff * Q[t][t] + 2 * Qp[t])) /
          (1 + diff) / (1 + diff));
        for (let j = 0; j < nClasses; j++) {
          Qp[j] = (Qp[j] + diff * Q[t][j]) / (1 + diff);
          P[j] /= (1 + diff);
        }
      }
    }

    return P;
  }

  predict(
      classifierData: SVM, input: number[]): PredictionResult {
    let nSupport = classifierData.n_support;
    let supportVectors = classifierData.support_vectors;
    let dualCoef = classifierData.dual_coef;
    let intercept = classifierData.intercept;
    let classes = classifierData.classes;
    let kernelParams = classifierData.kernel_params;
    let probA = classifierData.probA;
    let probB = classifierData.probB;

    let startIndices = [];
    startIndices[0] = 0;
    for (let i = 1; i < nSupport.length; i++) {
      startIndices[i] = startIndices[i - 1] + nSupport[i - 1];
    }

    if (supportVectors[0].length !== input.length) {
      // Support vector and input dimensions do not match.
      console.error(
        'Dimension of support vectors and given input is different.');
    }

    // Find kernel values for supportVectors and given input. Assumes that
    // input has same dimension and data type as any of the supportVectors.
    let kvalues = this.kernel(kernelParams, supportVectors, input);

    let votes = [];
    for (let i = 0; i < classes.length; i++) {
      votes.push(0);
    }

    let pairwiseProb: number[][] = [];
    for (let i = 0; i < classes.length; i++) {
      pairwiseProb.push([]);
      for (let j = 0; j < classes.length; j++) {
        pairwiseProb[i].push(0);
      }
    }

    let p = 0;
    for (let i = 0; i < classes.length; i++) {
      for (let j = i + 1; j < classes.length; j++) {
        let si = startIndices[i];
        let sj = startIndices[j];
        let ci = nSupport[i];
        let cj = nSupport[j];
        let minProb = 1e-7;

        let coef1 = dualCoef[j - 1];
        let coef2 = dualCoef[i];

        let sum = 0;
        for (let k = 0; k < ci; k++) {
          sum += kvalues[si + k] * coef1[si + k];
        }

        for (let k = 0; k < cj; k++) {
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
        let f = probA[p] * sum + probB[p];
        let prob = 0;
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

    let probabilities = this.calculateMulticlassProbabilities(
      classes.length, pairwiseProb);

    let maxProbIdx = 0;
    for (let i = 1; i < classes.length; i++) {
      if (probabilities[i] > probabilities[maxProbIdx]) {
        maxProbIdx = i;
      }
    }

    let predictedLabel = classes[maxProbIdx];
    let prediction = new PredictionResult(
      predictedLabel, probabilities[maxProbIdx]);
    return prediction;
  }
}

angular.module('oppia').factory(
  'SVMPredictionService', downgradeInjectable(SVMPredictionService));
