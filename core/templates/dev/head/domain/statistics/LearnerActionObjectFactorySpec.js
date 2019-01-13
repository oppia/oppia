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
    this.LearnerActionObjectFactory =
        $injector.get('LearnerActionObjectFactory');
    this.LEARNER_ACTION_SCHEMA_LATEST_VERSION =
      $injector.get('LEARNER_ACTION_SCHEMA_LATEST_VERSION');
  }));

  it('should create a new learner action', function() {
    var learnerActionObject =
        this.LearnerActionObjectFactory.createNew('AnswerSubmit', {});

    expect(learnerActionObject.actionType).toEqual('AnswerSubmit');
    expect(learnerActionObject.actionCustomizationArgs).toEqual({});
    expect(learnerActionObject.schemaVersion)
      .toEqual(this.LEARNER_ACTION_SCHEMA_LATEST_VERSION);
  });

  it('should throw if the schema version is not a positive int', function() {
    var LearnerActionObjectFactoryLocalReference =
        this.LearnerActionObjectFactory;

    expect(function() {
      return LearnerActionObjectFactoryLocalReference.createNew(
        'AnswerSubmit', {}, -1);
    }).toThrow(new Error('given invalid schema version'));
  });

  it('should use a specific schema version if provided', function() {
    var learnerActionObject =
        this.LearnerActionObjectFactory.createNew('AnswerSubmit', {}, 99);

    expect(learnerActionObject.schemaVersion).toEqual(99);
  });

  it('should create a new learner action from a backend dict', function() {
    var learnerActionObject =
        this.LearnerActionObjectFactory.createFromBackendDict({
          action_type: 'AnswerSubmit',
          action_customization_args: {},
          schema_version: 1
        });

    expect(learnerActionObject.actionType).toEqual('AnswerSubmit');
    expect(learnerActionObject.actionCustomizationArgs).toEqual({});
    expect(learnerActionObject.schemaVersion).toEqual(1);
  });

  it('should convert a learner action to a backend dict', function() {
    var learnerActionObject =
        this.LearnerActionObjectFactory.createNew('AnswerSubmit', {}, 1);

    var learnerActionDict = learnerActionObject.toBackendDict();
    expect(learnerActionDict).toEqual({
      action_type: 'AnswerSubmit',
      action_customization_args: {},
      schema_version: 1
    });
  });
});
