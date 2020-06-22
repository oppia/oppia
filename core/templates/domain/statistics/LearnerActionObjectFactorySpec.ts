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

import { TestBed } from '@angular/core/testing';

import { LearnerActionObjectFactory } from
  'domain/statistics/LearnerActionObjectFactory';
import { StatisticsDomainConstants } from
  'domain/statistics/statistics-domain.constants';

describe('Learner Action Object Factory', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [LearnerActionObjectFactory]
    });

    this.LearnerActionObjectFactory =
      TestBed.get(LearnerActionObjectFactory);
    this.LEARNER_ACTION_SCHEMA_LATEST_VERSION =
      StatisticsDomainConstants.LEARNER_ACTION_SCHEMA_LATEST_VERSION;
  });

  it('should create a new learner action', () => {
    var answerSubmitlearnerActionObject =
      this.LearnerActionObjectFactory.createNewAnswerSubmitAction(
        'AnswerSubmit', {});
    var explorationStartlearnerActionObject =
      this.LearnerActionObjectFactory.createNewExplorationStartAction(
        'ExplorationStart', {});
    var explorationQuitlearnerActionObject =
      this.LearnerActionObjectFactory.createNewExplorationQuitAction(
        'ExplorationQuit', {});

    expect(answerSubmitlearnerActionObject.actionType).toEqual('AnswerSubmit');
    expect(answerSubmitlearnerActionObject.actionCustomizationArgs).toEqual({});
    expect(answerSubmitlearnerActionObject.schemaVersion)
      .toEqual(this.LEARNER_ACTION_SCHEMA_LATEST_VERSION);
    expect(explorationStartlearnerActionObject.actionType).toEqual(
      'ExplorationStart');
    expect(
      explorationStartlearnerActionObject.actionCustomizationArgs).toEqual({});
    expect(explorationStartlearnerActionObject.schemaVersion)
      .toEqual(this.LEARNER_ACTION_SCHEMA_LATEST_VERSION);
    expect(explorationQuitlearnerActionObject.actionType).toEqual(
      'ExplorationQuit');
    expect(
      explorationQuitlearnerActionObject.actionCustomizationArgs).toEqual({});
    expect(explorationQuitlearnerActionObject.schemaVersion)
      .toEqual(this.LEARNER_ACTION_SCHEMA_LATEST_VERSION);
  });

  it('should throw if the schema version is not a positive int', () => {
    var LearnerActionObjectFactoryLocalReference =
        this.LearnerActionObjectFactory;

    expect(() => {
      return LearnerActionObjectFactoryLocalReference.
        createNewAnswerSubmitAction('AnswerSubmit', {}, -1);
    }).toThrowError('given invalid schema version');
  });

  it('should use a specific schema version if provided', () => {
    var learnerActionObject =
        this.LearnerActionObjectFactory.createNewAnswerSubmitAction(
          'AnswerSubmit', {}, 99);

    expect(learnerActionObject.schemaVersion).toEqual(99);
  });

  it('should create a new learner action from a backend dict', () => {
    var learnerActionObject =
        this.LearnerActionObjectFactory.createFromBackendDict({
          action_type: 'ExplorationQuit',
          action_customization_args: {},
          schema_version: 1
        });

    expect(learnerActionObject.actionType).toEqual('ExplorationQuit');
    expect(learnerActionObject.actionCustomizationArgs).toEqual({});
    expect(learnerActionObject.schemaVersion).toEqual(1);
  });

  it('should convert a learner action to a backend dict', () => {
    var learnerActionObject =
        this.LearnerActionObjectFactory.createNewAnswerSubmitAction(
          'AnswerSubmit', {}, 1);

    var learnerActionDict = learnerActionObject.toBackendDict();
    expect(learnerActionDict).toEqual({
      action_type: 'AnswerSubmit',
      action_customization_args: {},
      schema_version: 1
    });
  });

  it('should throw error on invalid backend dict', () => {
    const playthroughDict = {
      action_type: 'InvalidAction',
      action_customization_args: {},
      schema_version: 1
    };

    expect(() => {
      this.LearnerActionObjectFactory.createFromBackendDict(playthroughDict);
    }).toThrowError(
      'Backend dict does not match any known action type: ' +
      JSON.stringify(playthroughDict));
  });
});
