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
 * @fileoverview Unit tests for the Classifier model.
 */

import { Classifier } from 'domain/classifier/classifier.model';
import { TextClassifierFrozenModel } from 'classifiers/proto/text_classifier';

describe('Classifier model', () => {
  let classifierFrozenModel = new TextClassifierFrozenModel();
  // The model_json attribute in TextClassifierFrozenModel class can't be
  // changed to camelcase since the class definition is automatically compiled
  // with the help of protoc.
  classifierFrozenModel.model_json = JSON.stringify({
    KNN: {
      occurrence: 0,
      K: 0,
      T: 0,
      top: 0,
      fingerprint_data: {
        0: {
          'class': 0,
          fingerprint: [[0]]
        }
      },
      token_to_id: {
        a: 0
      }
    },
    SVM: {
      classes: [0],
      kernel_params: {
        kernel: 'string',
        coef0: 0,
        degree: 0,
        gamma: 0
      },
      intercept: [0],
      n_support: [0],
      probA: [0],
      support_vectors: [[0]],
      probB: [0],
      dual_coef: [[0]]
    },
    cv_vocabulary: {
      a: 0
    }
  });
  let classifierBuffer: Uint8Array =
    classifierFrozenModel.serialize() as Uint8Array;

  it('should create a new classifier', () => {
    var classifierObject = (
      new Classifier(
        'TestClassifier',
        classifierBuffer.buffer.slice(
          classifierBuffer.byteOffset,
          classifierBuffer.byteOffset + classifierBuffer.byteLength),
        1));

    expect(classifierObject.algorithmId).toEqual('TestClassifier');
    expect(classifierObject.classifierData).toEqual(
      classifierBuffer.buffer.slice(
        classifierBuffer.byteOffset,
        classifierBuffer.byteOffset + classifierBuffer.byteLength));
    expect(classifierObject.algorithmVersion).toEqual(1);
  });
});
