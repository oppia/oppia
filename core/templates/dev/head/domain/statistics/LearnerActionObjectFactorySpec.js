// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
  beforeEach(module('oppia'));

  beforeEach(inject(function($injector) {
    this.laof = $injector.get('LearnerActionObjectFactory');
  }));

  it('should create a new learner action', function() {
    var learnerActionObject = this.laof.createNew('AnswerSubmit', {}, 1);

    expect(learnerActionObject.actionType).toEqual('AnswerSubmit');
    expect(learnerActionObject.actionCustomizationArgs).toEqual({});
    expect(learnerActionObject.schemaVersion).toEqual(1);
  });

  it('should create a new learner action from a backend dict', function() {
    var learnerActionObject = this.laof.createFromBackendDict({
      action_type: 'AnswerSubmit',
      action_customization_args: {},
      schema_version: 1
    });

    expect(learnerActionObject.actionType).toEqual('AnswerSubmit');
    expect(learnerActionObject.actionCustomizationArgs).toEqual({});
    expect(learnerActionObject.schemaVersion).toEqual(1);
  });

  it('should convert a learner action to a backend dict', function() {
    var learnerActionObject = this.laof.createNew('AnswerSubmit', {}, 1);

    var learnerActionDict = learnerActionObject.toBackendDict();
    expect(learnerActionDict).toEqual({
      action_type: 'AnswerSubmit',
      action_customization_args: {},
      schema_version: 1
    });
  });
});
