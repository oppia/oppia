// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Test for the diagnostic test model.
 */

import { TestBed } from '@angular/core/testing';
import { DiagnosticTestModelData, TopicIdToRelatedTopicIds } from './diagnostic-test.model';


describe('Diagnostic test model', () => {
  let diagnosticTestModelData: DiagnosticTestModelData;
  let topicIdToPrerequisiteTopicIds: TopicIdToRelatedTopicIds;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [],
      providers: []
    });

    topicIdToPrerequisiteTopicIds = {
      topicID1: [],
      topicID2: ['topicID1'],
      topicID3: ['topicID2'],
      topicID4: ['topicID3'],
      topicID5: ['topicID4'],
      topicID6: [],
      topicID7: ['topicID2', 'topicID3', 'topicID6'],
      topicID8: ['topicID7'],
      topicID9: ['topicID5', 'topicID8'],
    };
  });

  it('should be able to get topic ID to ancestor topic IDs', () => {
    diagnosticTestModelData = new DiagnosticTestModelData(
      topicIdToPrerequisiteTopicIds);
    const expectedAncestorTopicIds = {
      topicID1: [],
      topicID2: ['topicID1'],
      topicID3: ['topicID2', 'topicID1'],
      topicID4: ['topicID3', 'topicID2', 'topicID1'],
      topicID5: ['topicID4', 'topicID3', 'topicID2', 'topicID1'],
      topicID6: [],
      topicID7: ['topicID6', 'topicID3', 'topicID2', 'topicID1'],
      topicID8: [
        'topicID7', 'topicID6', 'topicID3', 'topicID2', 'topicID1'],
      topicID9: [
        'topicID8', 'topicID7', 'topicID6', 'topicID3', 'topicID2',
        'topicID1', 'topicID5', 'topicID4']
    };

    expect(diagnosticTestModelData.getTopicIdToAncestorTopicIds()).toEqual(
      expectedAncestorTopicIds);
    expect(diagnosticTestModelData.getAncestorsTopicIds('topicID4')).toEqual(
      ['topicID3', 'topicID2', 'topicID1']);
    expect(diagnosticTestModelData.getAncestorsTopicIds('topicID5')).toEqual(
      ['topicID4', 'topicID3', 'topicID2', 'topicID1']);
  });

  it('should be able to able to get topic ID to successor topic IDs', () => {
    diagnosticTestModelData = new DiagnosticTestModelData(
      topicIdToPrerequisiteTopicIds);

    const expectedSuccessorTopicIds = {
      topicID1: [
        'topicID2', 'topicID7', 'topicID8', 'topicID9', 'topicID3',
        'topicID4', 'topicID5'],
      topicID2: [
        'topicID7', 'topicID8', 'topicID9', 'topicID3', 'topicID4', 'topicID5'],
      topicID3: ['topicID7', 'topicID8', 'topicID9', 'topicID4', 'topicID5'],
      topicID4: ['topicID5', 'topicID9'],
      topicID5: ['topicID9'],
      topicID6: ['topicID7', 'topicID8', 'topicID9'],
      topicID7: ['topicID8', 'topicID9'],
      topicID8: ['topicID9'],
      topicID9: [],
    };

    expect(diagnosticTestModelData.getTopicIdToSuccessorTopicIds()).toEqual(
      expectedSuccessorTopicIds);

    expect(diagnosticTestModelData.getSuccessorTopicIds('topicID3')).toEqual(
      ['topicID7', 'topicID8', 'topicID9', 'topicID4', 'topicID5']);

    expect(diagnosticTestModelData.getSuccessorTopicIds('topicID6')).toEqual(
      ['topicID7', 'topicID8', 'topicID9']);
  });

  it('should be able to get eligible topic IDs', () => {
    diagnosticTestModelData = new DiagnosticTestModelData(
      topicIdToPrerequisiteTopicIds);

    const expectedEligibleTopicIDs = [
      'topicID1', 'topicID2', 'topicID3', 'topicID4', 'topicID5', 'topicID6',
      'topicID7', 'topicID8', 'topicID9'];

    expect(diagnosticTestModelData.getEligibleTopicIds()).toEqual(
      expectedEligibleTopicIDs);
  });

  it('should be able to get current topic ID', () => {
    diagnosticTestModelData = new DiagnosticTestModelData(
      topicIdToPrerequisiteTopicIds);

    const expectedTopicId = 'topicID3';

    diagnosticTestModelData.setCurrentTopicId();

    expect(diagnosticTestModelData.getCurrentTopicId()).toEqual(
      expectedTopicId);
  });

  it('should be able to record topic as failed', () => {
    diagnosticTestModelData = new DiagnosticTestModelData(
      topicIdToPrerequisiteTopicIds);

    diagnosticTestModelData.setCurrentTopicId();
    diagnosticTestModelData.recordTopicFailed();

    const expectedEligibleTopicIDs = ['topicID1', 'topicID2', 'topicID6'];
    const expectedSkippedTopicIDs = [
      'topicID7', 'topicID8', 'topicID9', 'topicID4', 'topicID5'];

    expect(diagnosticTestModelData.getFailedTopicIds()).toEqual(['topicID3']);

    expect(diagnosticTestModelData.getEligibleTopicIds()).toEqual(
      expectedEligibleTopicIDs);

    expect(diagnosticTestModelData.getSkippedTopicIds()).toEqual(
      expectedSkippedTopicIDs);
  });

  it('should be able to record topic as passed', () => {
    diagnosticTestModelData = new DiagnosticTestModelData(
      topicIdToPrerequisiteTopicIds);

    diagnosticTestModelData.setCurrentTopicId();
    diagnosticTestModelData.recordTopicPassed();

    const expectedEligibleTopicIDs = [
      'topicID4', 'topicID5', 'topicID6', 'topicID7', 'topicID8', 'topicID9'];
    const expectedSkippedTopicIDs = ['topicID2', 'topicID1'];

    expect(diagnosticTestModelData.getPassedTopicIds()).toEqual(['topicID3']);

    expect(diagnosticTestModelData.getEligibleTopicIds()).toEqual(
      expectedEligibleTopicIDs);

    expect(diagnosticTestModelData.getSkippedTopicIds()).toEqual(
      expectedSkippedTopicIDs);
  });

  it('should be able to increment number of attempted questions', () => {
    diagnosticTestModelData = new DiagnosticTestModelData(
      topicIdToPrerequisiteTopicIds);

    const initialAttemptedQuestions = 0;

    expect(diagnosticTestModelData.getNumberOfAttemptedQuestions()).toEqual(
      initialAttemptedQuestions);

    diagnosticTestModelData.incrementNumberOfAttemptedQuestions(5);

    expect(diagnosticTestModelData.getNumberOfAttemptedQuestions()).toEqual(
      initialAttemptedQuestions + 5);
  });

  it(
    'should be able to terminate the test when eligible topic IDs list is ' +
    'empty', () => {
      diagnosticTestModelData = new DiagnosticTestModelData(
        topicIdToPrerequisiteTopicIds);
      diagnosticTestModelData._eligibleTopicIds = [];

      expect(diagnosticTestModelData.isTestFinished()).toBeTrue();
    });

  it(
    'should be able to terminate the test when eligible topic IDs list ' +
    'is non empty and the number of attempted question is greater than 15',
    () => {
      diagnosticTestModelData = new DiagnosticTestModelData(
        topicIdToPrerequisiteTopicIds);
      diagnosticTestModelData._eligibleTopicIds = ['topicID'];
      diagnosticTestModelData._totalNumberOfAttemptedQuestions = 15;

      expect(diagnosticTestModelData.isTestFinished()).toBeTrue();
    });

  it(
    'should not be able to terminate the test when any eligible topic ID ' +
    'is left for testing and number of attempted question is less than 15',
    () => {
      diagnosticTestModelData = new DiagnosticTestModelData(
        topicIdToPrerequisiteTopicIds);
      diagnosticTestModelData._eligibleTopicIds = ['topicID'];
      diagnosticTestModelData._totalNumberOfAttemptedQuestions = 13;

      expect(diagnosticTestModelData.isTestFinished()).toBeFalse();
    });

  it(
    'should be able to update the current topic after recording the existing' +
    ' topic as passed', () => {
      diagnosticTestModelData = new DiagnosticTestModelData(
        topicIdToPrerequisiteTopicIds);

      let expectedTopicId = 'topicID3';

      diagnosticTestModelData.setCurrentTopicId();

      expect(diagnosticTestModelData.getCurrentTopicId()).toEqual(
        expectedTopicId);

      diagnosticTestModelData.recordTopicPassed();

      expectedTopicId = 'topicID5';

      diagnosticTestModelData.setCurrentTopicId();

      expect(diagnosticTestModelData.getCurrentTopicId()).toEqual(
        expectedTopicId);
    });

  it(
    'should be able to update the current topic after recording the existing' +
    ' topic as failed', () => {
      diagnosticTestModelData = new DiagnosticTestModelData(
        topicIdToPrerequisiteTopicIds);

      let expectedTopicId = 'topicID3';

      diagnosticTestModelData.setCurrentTopicId();

      expect(diagnosticTestModelData.getCurrentTopicId()).toEqual(
        expectedTopicId);

      diagnosticTestModelData.recordTopicFailed();

      expectedTopicId = 'topicID1';

      diagnosticTestModelData.setCurrentTopicId();

      expect(diagnosticTestModelData.getCurrentTopicId()).toEqual(
        expectedTopicId);
    });
});
