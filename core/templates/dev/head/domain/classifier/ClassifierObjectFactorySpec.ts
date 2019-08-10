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
 * @fileoverview Unit tests for the ClassifierObjectFactory.
 */

import { ClassifierObjectFactory } from
  'domain/classifier/ClassifierObjectFactory.ts';

describe('Classifier Object Factory', () => {
  let classifierObjectFactory: ClassifierObjectFactory;

  beforeEach(() => {
    classifierObjectFactory = new ClassifierObjectFactory();
  });

  it('should create a new classifier', () => {
    var classifierObject = (
      classifierObjectFactory.create('TestClassifier', {}, 1));

    expect(classifierObject.algorithmId).toEqual('TestClassifier');
    expect(classifierObject.classifierData).toEqual({});
    expect(classifierObject.dataSchemaVersion).toEqual(1);
  });
});
