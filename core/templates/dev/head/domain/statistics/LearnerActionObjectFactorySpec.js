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
 * @fileoverview Unit tests for the LearnerActionObjectFactory.
 */

describe('Learner Action Object Factory', function() {
  var LearnerActionObjectFactory;

  beforeEach(module('oppia'));

  beforeEach(inject(function($injector) {
    LearnerActionObjectFactory = $injector.get(
      'LearnerActionObjectFactory');
  }));

  it('should create a new learner action', function() {
    var learnerActionObject = (
      LearnerActionObjectFactory.create('AnswerSubmit', {}, 1));

    expect(learnerActionObject.actionType).toEqual('AnswerSubmit');
    expect(learnerActionObject.actionCustomizationArgs).toEqual({});
    expect(learnerActionObject.schemaVersion).toEqual(1);
  });

  it('should create a new learner action from a backend dict', function() {
    var learnerActionBackendDict = {
      actionType: 'AnswerSubmit',
      actionCustomizationArgs: {},
      schemaVersion: 1
    };
    var learnerActionObject = LearnerActionObjectFactory.createFromBackendDict(
        learnerActionBackendDict);

    expect(learnerActionObject.actionType).toEqual('AnswerSubmit');
    expect(learnerActionObject.actionCustomizationArgs).toEqual({});
    expect(learnerActionObject.schemaVersion).toEqual(1);
  });
});
