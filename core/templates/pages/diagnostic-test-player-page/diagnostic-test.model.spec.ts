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
import { DiagnosticTestModelData } from './diagnostic-test.model';


describe('Diagnostic test model', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [],
      providers: []
    });
  });

  it('should be able to get topic ID to ancestor topic IDs', () => {
    // A linear graph with 3 nodes.
    const topicIdToPrerequisiteTopicIds = {
      topicID1: [],
      topicID2: ['topicID1'],
      topicID3: ['topicID2']
    };
    const expectedTopicIdToAncestorTopicIds = {
      topicID1: [],
      topicID2: ['topicID1'],
      topicID3: ['topicID1', 'topicID2']
    };

    const diagnosticTestModelData = new DiagnosticTestModelData(
      topicIdToPrerequisiteTopicIds);

    expect(diagnosticTestModelData.getTopicIdToAncestorTopicIds()).toEqual(
      expectedTopicIdToAncestorTopicIds);
    expect(diagnosticTestModelData.getAncestorTopicIds('topicID1')).toEqual(
      []);
    expect(diagnosticTestModelData.getAncestorTopicIds('topicID2')).toEqual(
      ['topicID1']);
    expect(diagnosticTestModelData.getAncestorTopicIds('topicID3')).toEqual(
      ['topicID1', 'topicID2']);
  });

  it('should be able to able to get topic ID to successor topic IDs', () => {
    // A non-linear graph with 3 nodes.
    const topicIdToPrerequisiteTopicIds = {
      topicID1: [],
      topicID2: ['topicID1'],
      topicID3: ['topicID1']
    };
    const diagnosticTestModelData = new DiagnosticTestModelData(
      topicIdToPrerequisiteTopicIds);

    const expectedTopicIdToSuccessorTopicIds = {
      topicID1: ['topicID2', 'topicID3'],
      topicID2: [],
      topicID3: []
    };

    expect(diagnosticTestModelData.getTopicIdToSuccessorTopicIds()).toEqual(
      expectedTopicIdToSuccessorTopicIds);
    expect(diagnosticTestModelData.getSuccessorTopicIds('topicID1')).toEqual(
      ['topicID2', 'topicID3']);
    expect(diagnosticTestModelData.getSuccessorTopicIds('topicID2')).toEqual(
      []);
    expect(diagnosticTestModelData.getSuccessorTopicIds('topicID3')).toEqual(
      []);
  });

  it('should be able to get initial eligible topic IDs', () => {
    const topicIdToPrerequisiteTopicIds = {
      topicID1: [],
      topicID2: ['topicID1'],
      topicID3: ['topicID1']
    };
    // Initially, all the topics are eligible for testing, then eventually
    // topics were filtered from the eligible list based on the performance
    // in any selected topic.
    const expectedEligibleTopicIDs = ['topicID1', 'topicID2', 'topicID3'];

    const diagnosticTestModelData = new DiagnosticTestModelData(
      topicIdToPrerequisiteTopicIds);

    expect(diagnosticTestModelData.getEligibleTopicIds()).toEqual(
      expectedEligibleTopicIDs);
  });

  it(
    'should be able to get eligible topic IDs after the initially selected' +
    ' topic is marked as failed', () => {
      // A non-linear topics dependency graph with 5 nodes.
      const topicIdToPrerequisiteTopicIds = {
        topicID1: [],
        topicID2: ['topicID1'],
        topicID3: ['topicID1'],
        topicID4: ['topicID2', 'topicID3'],
        topicID5: ['topicID3']
      };

      const diagnosticTestModelData = new DiagnosticTestModelData(
        topicIdToPrerequisiteTopicIds);

      const expectedTopicIdToAncestorTopicIds = {
        topicID1: [],
        topicID2: ['topicID1'],
        topicID3: ['topicID1'],
        topicID4: ['topicID1', 'topicID2', 'topicID3'],
        topicID5: ['topicID1', 'topicID3']
      };

      const expectedTopicIdToSuccessorTopicIds = {
        topicID1: ['topicID2', 'topicID3', 'topicID4', 'topicID5'],
        topicID2: ['topicID4'],
        topicID3: ['topicID4', 'topicID5'],
        topicID4: [],
        topicID5: []
      };

      expect(diagnosticTestModelData.getTopicIdToAncestorTopicIds()).toEqual(
        expectedTopicIdToAncestorTopicIds);
      expect(diagnosticTestModelData.getTopicIdToSuccessorTopicIds()).toEqual(
        expectedTopicIdToSuccessorTopicIds);

      // Initially, all the topics are eligible for testing, then eventually
      // topics were filtered from the eligible list based on the performance
      // in any selected topic.
      expect(diagnosticTestModelData.getEligibleTopicIds()).toEqual(
        ['topicID1', 'topicID2', 'topicID3', 'topicID4', 'topicID5']);

      // Assuming L = min(length of ancestors, length of successors). Among all
      // the eligible topic IDs, topic 2 has the maximum value for L. Thus
      // topic 2 should be selected as the next eligible topic ID.
      expect(diagnosticTestModelData.selectNextTopicIdToTest()).toEqual(
        'topicID2');

      // Marking the current topic (topic 3) as failed, will remove the current
      // topic and all of its successors (topic 4, topic 5) from the
      // eligible topic IDs list.
      diagnosticTestModelData.recordTopicFailed();

      expect(diagnosticTestModelData.getFailedTopicIds()).toEqual(['topicID2']);

      // New eligible topic IDs list after removing the successors.
      expect(diagnosticTestModelData.getEligibleTopicIds()).toEqual(
        ['topicID1', 'topicID3', 'topicID5']);

      // Assuming L = min(length of ancestors, length of successors). Among all
      // the eligible topic IDs, topic 3 has the maximum value for L. Thus
      // topic 3 should be selected as the next eligible topic ID.
      expect(diagnosticTestModelData.selectNextTopicIdToTest()).toEqual(
        'topicID3');
    });

  it(
    'should be able to get eligible topic IDs after the initially selected' +
    ' topic is marked as passed', () => {
      const topicIdToPrerequisiteTopicIds = {
        topicID1: [],
        topicID2: ['topicID1'],
        topicID3: ['topicID1'],
        topicID4: ['topicID2', 'topicID3'],
        topicID5: ['topicID3']
      };

      const diagnosticTestModelData = new DiagnosticTestModelData(
        topicIdToPrerequisiteTopicIds);

      const expectedTopicIdToAncestorTopicIds = {
        topicID1: [],
        topicID2: ['topicID1'],
        topicID3: ['topicID1'],
        topicID4: ['topicID1', 'topicID2', 'topicID3'],
        topicID5: ['topicID1', 'topicID3']
      };

      const expectedTopicIdToSuccessorTopicIds = {
        topicID1: ['topicID2', 'topicID3', 'topicID4', 'topicID5'],
        topicID2: ['topicID4'],
        topicID3: ['topicID4', 'topicID5'],
        topicID4: [],
        topicID5: []
      };

      expect(diagnosticTestModelData.getTopicIdToAncestorTopicIds()).toEqual(
        expectedTopicIdToAncestorTopicIds);
      expect(diagnosticTestModelData.getTopicIdToSuccessorTopicIds()).toEqual(
        expectedTopicIdToSuccessorTopicIds);

      // Initially, all the topics are eligible for testing, then eventually
      // topics were filtered from the eligible list based on the performance
      // in any selected topic.
      expect(diagnosticTestModelData.getEligibleTopicIds()).toEqual(
        ['topicID1', 'topicID2', 'topicID3', 'topicID4', 'topicID5']);

      // Assuming L = min(length of ancestors, length of successors). Among all
      // the eligible topic IDs, topic 2 has the maximum value for L. Thus
      // topic 2 should be selected as the next eligible topic ID.
      expect(diagnosticTestModelData.selectNextTopicIdToTest()).toEqual(
        'topicID2');

      // Marking the current topic (topic 3) as passed, will remove the current
      // topic and all of its ancestors (topic 1) from the eligible
      // topic IDs list.
      diagnosticTestModelData.recordTopicPassed();

      // New eligible topic IDs list after removing the ancestors.
      expect(diagnosticTestModelData.getEligibleTopicIds()).toEqual(
        ['topicID3', 'topicID4', 'topicID5']);

      // Assuming L = min(length of ancestors, length of successors). Among all
      // the eligible topic IDs, topic 3 has the maximum value for L. Thus
      // topic 3 should be selected as the next eligible topic ID.
      expect(diagnosticTestModelData.selectNextTopicIdToTest()).toEqual(
        'topicID3');
    });


  it('should be able to increment number of attempted questions', () => {
    const topicIdToPrerequisiteTopicIds = {
      topicID1: [],
      topicID2: ['topicID1'],
      topicID3: ['topicID1'],
      topicID4: ['topicID2', 'topicID3'],
      topicID5: ['topicID3']
    };
    const diagnosticTestModelData = new DiagnosticTestModelData(
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
      let topicIdToPrerequisiteTopicIds = {};
      let diagnosticTestModelData = new DiagnosticTestModelData(
        topicIdToPrerequisiteTopicIds);
      diagnosticTestModelData._eligibleTopicIds = [];

      expect(diagnosticTestModelData.isTestFinished()).toBeTrue();
    });

  it(
    'should be able to terminate the test when eligible topic IDs list ' +
    'is non empty and the number of attempted question is greater than or ' +
    'equal to 15', () => {
      let topicIdToPrerequisiteTopicIds = {};
      let diagnosticTestModelData = new DiagnosticTestModelData(
        topicIdToPrerequisiteTopicIds);

      // The eligible topic IDs list is set explicitly because of the testing
      // purpose, this value is not related to the sample graph data above.
      diagnosticTestModelData._eligibleTopicIds = ['topicID'];

      // The number of questions assigned here is arbitrary, this assigned value
      // is not related to the sample graph above and it only for the
      // testing purpose.
      diagnosticTestModelData._totalNumberOfAttemptedQuestions = 15;

      expect(diagnosticTestModelData.isTestFinished()).toBeTrue();
    });

  it(
    'should not be able to terminate the test when any eligible topic ID ' +
    'is left for testing and number of attempted question is less than 15',
    () => {
      let topicIdToPrerequisiteTopicIds = {};
      let diagnosticTestModelData = new DiagnosticTestModelData(
        topicIdToPrerequisiteTopicIds);

      // The eligible topic IDs list is set explicitly because of the testing
      // purpose, this value is not related to the sample graph data above.
      diagnosticTestModelData._eligibleTopicIds = ['topicID'];

      // The number of questions assigned here is arbitrary, this assigned value
      // is not related to the sample graph above and it only for the
      // testing purpose.
      diagnosticTestModelData._totalNumberOfAttemptedQuestions = 13;

      expect(diagnosticTestModelData.isTestFinished()).toBeFalse();
    });

  it(
    'should be able to generate ancestors and successors of each topic for ' +
    'a dependency graph containing loops', () => {
      const topicIdToPrerequisiteTopicIds = {
        topicID1: [],
        topicID2: ['topicID1'],
        topicID3: ['topicID1'],
        topicID4: ['topicID3', 'topicID5'],
        topicID5: ['topicID2']
      };
      const expectedTopicIdToAncestorTopicIds = {
        topicID1: [],
        topicID2: ['topicID1'],
        topicID3: ['topicID1'],
        topicID4: ['topicID1', 'topicID2', 'topicID3', 'topicID5'],
        topicID5: ['topicID1', 'topicID2']
      };
      const expectedTopicIdToSuccessorTopicIds = {
        topicID1: ['topicID2', 'topicID3', 'topicID4', 'topicID5'],
        topicID2: ['topicID4', 'topicID5'],
        topicID3: ['topicID4'],
        topicID4: [],
        topicID5: ['topicID4']
      };

      const diagnosticTestModelData = new DiagnosticTestModelData(
        topicIdToPrerequisiteTopicIds);

      expect(diagnosticTestModelData.getTopicIdToAncestorTopicIds()).toEqual(
        expectedTopicIdToAncestorTopicIds);
      expect(diagnosticTestModelData.getTopicIdToSuccessorTopicIds()).toEqual(
        expectedTopicIdToSuccessorTopicIds);
    });
});
