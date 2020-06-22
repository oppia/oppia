// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the NeedsGuidingResponsesTask domain object.
 */

import { TestBed } from '@angular/core/testing';

import { NeedsGuidingResponsesTaskObjectFactory } from
  'domain/improvements/NeedsGuidingResponsesTaskObjectFactory';
import { AnswerStats } from 'domain/exploration/AnswerStatsObjectFactory';

describe('Needs guiding responses task', function() {
  let needsGuidingResponsesTaskObjectFactory:
    NeedsGuidingResponsesTaskObjectFactory;

  beforeEach(() => {
    needsGuidingResponsesTaskObjectFactory = (
      TestBed.get(NeedsGuidingResponsesTaskObjectFactory));
  });

  beforeEach(() => {
    this.newTop10AnswerStats = (numUnaddressedAnswers: number) => {
      const answerStats = [];
      for (let i = 0; i < 10; ++i) {
        const newAnswerStats = new AnswerStats(
          `Answer #${i}`, `Answer #${i}`, (10 - i) * 100,
          i >= numUnaddressedAnswers);
        answerStats.push(newAnswerStats);
      }
      return answerStats;
    };
  });

  it('should return new task if state answer needs a guiding response', () => {
    const task = needsGuidingResponsesTaskObjectFactory.createFromAnswerStats(
      'eid', 1, 'Introduction', this.newTop10AnswerStats(3));

    expect(task.entityType).toEqual('exploration');
    expect(task.entityId).toEqual('eid');
    expect(task.entityVersion).toEqual(1);
    expect(task.taskType).toEqual('needs_guiding_responses');
    expect(task.targetType).toEqual('state');
    expect(task.targetId).toEqual('Introduction');
    expect(task.getIssueDescription()).toEqual(
      '3 of the top 10 answers for this card did not have explicit feedback ' +
      'from Oppia.');
    expect(task.isOpen()).toBeTrue();
  });

  it('should return obsolete task if all answers are addressed', () => {
    const task = needsGuidingResponsesTaskObjectFactory.createFromAnswerStats(
      'eid', 1, 'Introduction', this.newTop10AnswerStats(0));

    expect(task.entityType).toEqual('exploration');
    expect(task.entityId).toEqual('eid');
    expect(task.entityVersion).toEqual(1);
    expect(task.taskType).toEqual('needs_guiding_responses');
    expect(task.targetType).toEqual('state');
    expect(task.targetId).toEqual('Introduction');
    expect(task.getIssueDescription()).toBeNull();
    expect(task.isObsolete()).toBeTrue();
  });

  it('should create from an NGR task backend dict', () => {
    const task = needsGuidingResponsesTaskObjectFactory.createFromBackendDict({
      entity_type: 'exploration',
      entity_id: 'eid',
      entity_version: 1,
      task_type: 'needs_guiding_responses',
      target_type: 'state',
      target_id: 'Introduction',
      issue_description: (
        '3 of the top 10 answers for this card did not have explicit ' +
        'feedback from Oppia.'),
      status: 'open',
      resolver_username: null,
      resolver_profile_picture_data_url: null,
      resolved_on_msecs: null,
    });

    expect(task.entityType).toEqual('exploration');
    expect(task.entityId).toEqual('eid');
    expect(task.entityVersion).toEqual(1);
    expect(task.taskType).toEqual('needs_guiding_responses');
    expect(task.targetType).toEqual('state');
    expect(task.targetId).toEqual('Introduction');
    expect(task.getIssueDescription()).toEqual(
      '3 of the top 10 answers for this card did not have explicit feedback ' +
      'from Oppia.');
    expect(task.isOpen()).toBeTrue();
  });

  it('should throw when backend dict entity type is not exploration', () => {
    expect(
      () => needsGuidingResponsesTaskObjectFactory.createFromBackendDict({
        entity_type: '???',
        entity_id: 'eid',
        entity_version: 1,
        task_type: 'needs_guiding_responses',
        target_type: 'state',
        target_id: 'Introduction',
        issue_description: (
          '3 of the top 10 answers for this card did not have explicit ' +
          'feedback from Oppia.'),
        status: 'open',
        resolver_username: null,
        resolver_profile_picture_data_url: null,
        resolved_on_msecs: null,
      })
    ).toThrowError(
      'backend dict has entity_type "???" but expected "exploration"');
  });

  it('should throw when backend dict task type is not NGR', () => {
    expect(
      () => needsGuidingResponsesTaskObjectFactory.createFromBackendDict({
        entity_type: 'exploration',
        entity_id: 'eid',
        entity_version: 1,
        task_type: '???',
        target_type: 'state',
        target_id: 'Introduction',
        issue_description: (
          '3 of the top 10 answers for this card did not have explicit ' +
          'feedback from Oppia.'),
        status: 'open',
        resolver_username: null,
        resolver_profile_picture_data_url: null,
        resolved_on_msecs: null,
      })
    ).toThrowError(
      'backend dict has task_type "???" but expected "needs_guiding_responses"'
    );
  });

  it('should throw when backend dict target type is not state', () => {
    expect(
      () => needsGuidingResponsesTaskObjectFactory.createFromBackendDict({
        entity_type: 'exploration',
        entity_id: 'eid',
        entity_version: 1,
        task_type: 'needs_guiding_responses',
        target_type: '???',
        target_id: 'Introduction',
        issue_description: (
          '3 of the top 10 answers for this card did not have explicit ' +
          'feedback from Oppia.'),
        status: 'open',
        resolver_username: null,
        resolver_profile_picture_data_url: null,
        resolved_on_msecs: null,
      })
    ).toThrowError('backend dict has target_type "???" but expected "state"');
  });

  it('should update status based on changes to exploration stats', () => {
    const task = needsGuidingResponsesTaskObjectFactory.createFromAnswerStats(
      'eid', 1, 'Introduction', this.newTop10AnswerStats(3));
    expect(task.isOpen()).toBeTrue();
    expect(task.isResolved()).toBeFalse();

    task.refreshStatus(this.newTop10AnswerStats(0));
    expect(task.isOpen()).toBeFalse();
    expect(task.isResolved()).toBeTrue();

    task.refreshStatus(this.newTop10AnswerStats(7));
    expect(task.isOpen()).toBeTrue();
    expect(task.isResolved()).toBeFalse();
  });

  it('should not change issue description after it is generated', () => {
    const task = needsGuidingResponsesTaskObjectFactory.createFromAnswerStats(
      'eid', 1, 'Introduction', this.newTop10AnswerStats(0));
    expect(task.getIssueDescription()).toBeNull();

    task.refreshStatus(this.newTop10AnswerStats(7));
    expect(task.getIssueDescription()).toEqual(
      '7 of the top 10 answers for this card did not have explicit feedback ' +
      'from Oppia.');

    task.refreshStatus(this.newTop10AnswerStats(0));
    expect(task.getIssueDescription()).toEqual(
      '7 of the top 10 answers for this card did not have explicit feedback ' +
      'from Oppia.');

    task.refreshStatus(this.newTop10AnswerStats(3));
    expect(task.getIssueDescription()).toEqual(
      '7 of the top 10 answers for this card did not have explicit feedback ' +
      'from Oppia.');
  });
});
