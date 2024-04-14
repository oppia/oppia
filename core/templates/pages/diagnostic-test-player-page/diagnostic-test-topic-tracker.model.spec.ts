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
 * @fileoverview Test for the diagnostic test topic tracker model.
 */

import {TestBed} from '@angular/core/testing';
import {DiagnosticTestTopicTrackerModel} from './diagnostic-test-topic-tracker.model';

describe('Diagnostic test topic tracker model', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [],
      providers: [],
    });
  });

  it('should be able to get topic ID to ancestor topic IDs', () => {
    // A linear graph with 3 nodes.
    const topicIdToPrerequisiteTopicIds = {
      topicID1: [],
      topicID2: ['topicID1'],
      topicID3: ['topicID2'],
    };
    const expectedTopicIdToAncestorTopicIds = {
      topicID1: [],
      topicID2: ['topicID1'],
      topicID3: ['topicID1', 'topicID2'],
    };

    const diagnosticTestTopicTrackerModel = new DiagnosticTestTopicTrackerModel(
      topicIdToPrerequisiteTopicIds
    );

    expect(
      diagnosticTestTopicTrackerModel.getTopicIdToPrerequisiteTopicIds()
    ).toEqual(topicIdToPrerequisiteTopicIds);

    expect(
      diagnosticTestTopicTrackerModel.getTopicIdToAncestorTopicIds()
    ).toEqual(expectedTopicIdToAncestorTopicIds);

    expect(
      diagnosticTestTopicTrackerModel.getAncestorTopicIds('topicID1')
    ).toEqual([]);

    expect(
      diagnosticTestTopicTrackerModel.getAncestorTopicIds('topicID2')
    ).toEqual(['topicID1']);

    expect(
      diagnosticTestTopicTrackerModel.getAncestorTopicIds('topicID3')
    ).toEqual(['topicID1', 'topicID2']);
  });

  it('should be able to able to get topic ID to successor topic IDs', () => {
    // A non-linear graph with 3 nodes.
    const topicIdToPrerequisiteTopicIds = {
      topicID1: [],
      topicID2: ['topicID1'],
      topicID3: ['topicID1'],
    };
    const diagnosticTestTopicTrackerModel = new DiagnosticTestTopicTrackerModel(
      topicIdToPrerequisiteTopicIds
    );

    const expectedTopicIdToSuccessorTopicIds = {
      topicID1: ['topicID2', 'topicID3'],
      topicID2: [],
      topicID3: [],
    };

    expect(
      diagnosticTestTopicTrackerModel.getTopicIdToSuccessorTopicIds()
    ).toEqual(expectedTopicIdToSuccessorTopicIds);

    expect(
      diagnosticTestTopicTrackerModel.getSuccessorTopicIds('topicID1')
    ).toEqual(['topicID2', 'topicID3']);

    expect(
      diagnosticTestTopicTrackerModel.getSuccessorTopicIds('topicID2')
    ).toEqual([]);

    expect(
      diagnosticTestTopicTrackerModel.getSuccessorTopicIds('topicID3')
    ).toEqual([]);
  });

  it('should be able to get initial eligible topic IDs', () => {
    const topicIdToPrerequisiteTopicIds = {
      topicID1: [],
      topicID2: ['topicID1'],
      topicID3: ['topicID1'],
    };
    // Initially, all the topics are eligible for testing, then eventually
    // topics were filtered from the eligible list based on the performance
    // in any selected topic.
    const expectedEligibleTopicIDs = ['topicID1', 'topicID2', 'topicID3'];

    const diagnosticTestTopicTrackerModel = new DiagnosticTestTopicTrackerModel(
      topicIdToPrerequisiteTopicIds
    );

    expect(diagnosticTestTopicTrackerModel.getPendingTopicIdsToTest()).toEqual(
      expectedEligibleTopicIDs
    );
  });

  it(
    'should be able to get eligible topic IDs after the initially selected' +
      ' topic is marked as failed',
    () => {
      // A non-linear topics dependency graph with 5 nodes.
      const topicIdToPrerequisiteTopicIds = {
        topicID1: [],
        topicID2: ['topicID1'],
        topicID3: ['topicID1'],
        topicID4: ['topicID2', 'topicID3'],
        topicID5: ['topicID3'],
      };

      const diagnosticTestTopicTrackerModel =
        new DiagnosticTestTopicTrackerModel(topicIdToPrerequisiteTopicIds);

      let expectedTopicIdToAncestorTopicIds = {
        topicID1: [],
        topicID2: ['topicID1'],
        topicID3: ['topicID1'],
        topicID4: ['topicID1', 'topicID2', 'topicID3'],
        topicID5: ['topicID1', 'topicID3'],
      };

      let expectedTopicIdToSuccessorTopicIds = {
        topicID1: ['topicID2', 'topicID3', 'topicID4', 'topicID5'],
        topicID2: ['topicID4'],
        topicID3: ['topicID4', 'topicID5'],
        topicID4: [],
        topicID5: [],
      };

      expect(
        diagnosticTestTopicTrackerModel.getTopicIdToAncestorTopicIds()
      ).toEqual(expectedTopicIdToAncestorTopicIds);

      expect(
        diagnosticTestTopicTrackerModel.getTopicIdToSuccessorTopicIds()
      ).toEqual(expectedTopicIdToSuccessorTopicIds);

      // Initially, all the topics are eligible for testing, then eventually
      // topics were filtered from the eligible list based on the performance
      // in any selected topic.
      expect(
        diagnosticTestTopicTrackerModel.getPendingTopicIdsToTest()
      ).toEqual(['topicID1', 'topicID2', 'topicID3', 'topicID4', 'topicID5']);

      // Assuming L = min(length of ancestors, length of successors). Among all
      // the eligible topic IDs, topic2 and topic3 have the maximum value for L.
      // Since topic2 appears before topic3, thus topic2 should be selected as
      // the next eligible topic ID.
      expect(diagnosticTestTopicTrackerModel.selectNextTopicIdToTest()).toEqual(
        'topicID2'
      );

      // None of the topics are currently failed.
      expect(diagnosticTestTopicTrackerModel.getFailedTopicIds()).toEqual([]);

      // Marking the current topic (topic2) as failed, will remove the current
      // topic and all of its successors (topic4) from the eligible topic IDs,
      // topic ID to ancestor topic IDs dict, topic ID to successor
      // topic IDs dict.
      diagnosticTestTopicTrackerModel.recordTopicFailed('topicID2');

      // Updated eligible topic IDs list.
      expect(
        diagnosticTestTopicTrackerModel.getPendingTopicIdsToTest()
      ).toEqual(['topicID1', 'topicID3', 'topicID5']);

      // Updated topic ID to ancestor topic IDs dict.
      expect(
        diagnosticTestTopicTrackerModel.getTopicIdToAncestorTopicIds()
      ).toEqual({
        topicID1: [],
        topicID3: ['topicID1'],
        topicID5: ['topicID1', 'topicID3'],
      });

      // Updated topic ID to successor topic IDs dict.
      expect(
        diagnosticTestTopicTrackerModel.getTopicIdToSuccessorTopicIds()
      ).toEqual({
        topicID1: ['topicID3', 'topicID5'],
        topicID3: ['topicID5'],
        topicID5: [],
      });

      expect(diagnosticTestTopicTrackerModel.getFailedTopicIds()).toEqual([
        'topicID2',
      ]);

      // Assuming L = min(length of ancestors, length of successors). Among all
      // the eligible topic IDs, topic 3 has the maximum value for L. Thus
      // topic 3 should be selected as the next eligible topic ID.
      expect(diagnosticTestTopicTrackerModel.selectNextTopicIdToTest()).toEqual(
        'topicID3'
      );
    }
  );

  it(
    'should be able to get eligible topic IDs after the initially selected' +
      ' topic is marked as passed',
    () => {
      const topicIdToPrerequisiteTopicIds = {
        topicID1: [],
        topicID2: ['topicID1'],
        topicID3: ['topicID1'],
        topicID4: ['topicID2', 'topicID3'],
        topicID5: ['topicID3'],
      };

      const diagnosticTestTopicTrackerModel =
        new DiagnosticTestTopicTrackerModel(topicIdToPrerequisiteTopicIds);

      const expectedTopicIdToAncestorTopicIds = {
        topicID1: [],
        topicID2: ['topicID1'],
        topicID3: ['topicID1'],
        topicID4: ['topicID1', 'topicID2', 'topicID3'],
        topicID5: ['topicID1', 'topicID3'],
      };

      const expectedTopicIdToSuccessorTopicIds = {
        topicID1: ['topicID2', 'topicID3', 'topicID4', 'topicID5'],
        topicID2: ['topicID4'],
        topicID3: ['topicID4', 'topicID5'],
        topicID4: [],
        topicID5: [],
      };

      expect(
        diagnosticTestTopicTrackerModel.getTopicIdToAncestorTopicIds()
      ).toEqual(expectedTopicIdToAncestorTopicIds);

      expect(
        diagnosticTestTopicTrackerModel.getTopicIdToSuccessorTopicIds()
      ).toEqual(expectedTopicIdToSuccessorTopicIds);

      // Initially, all the topics are eligible for testing, then eventually
      // topics were filtered from the eligible list based on the performance
      // in any selected topic.
      expect(
        diagnosticTestTopicTrackerModel.getPendingTopicIdsToTest()
      ).toEqual(['topicID1', 'topicID2', 'topicID3', 'topicID4', 'topicID5']);

      // Assuming L = min(length of ancestors, length of successors). Among all
      // the eligible topic IDs, topic 2 has the maximum value for L. Thus
      // topic 2 should be selected as the next eligible topic ID.
      expect(diagnosticTestTopicTrackerModel.selectNextTopicIdToTest()).toEqual(
        'topicID2'
      );

      // Marking the current topic (topic2) as passed, will remove the current
      // topic and all of its ancestors (topic1) from the eligible topic IDs,
      // topic ID to ancestor topic IDs dict, topic ID to successor
      // topic IDs dict.
      diagnosticTestTopicTrackerModel.recordTopicPassed('topicID2');

      // Updated eligible topic IDs list after removing the ancestors.
      expect(
        diagnosticTestTopicTrackerModel.getPendingTopicIdsToTest()
      ).toEqual(['topicID3', 'topicID4', 'topicID5']);

      // Updated topic ID to ancestor topic IDs dict.
      expect(
        diagnosticTestTopicTrackerModel.getTopicIdToAncestorTopicIds()
      ).toEqual({
        topicID3: [],
        topicID4: ['topicID3'],
        topicID5: ['topicID3'],
      });

      // Updated topic ID to successor topic IDs dict.
      expect(
        diagnosticTestTopicTrackerModel.getTopicIdToSuccessorTopicIds()
      ).toEqual({
        topicID3: ['topicID4', 'topicID5'],
        topicID4: [],
        topicID5: [],
      });
      // Assuming L = min(length of ancestors, length of successors). Among all
      // the eligible topic IDs, topic 3 has the maximum value for L. Thus
      // topic 3 should be selected as the next eligible topic ID.
      expect(diagnosticTestTopicTrackerModel.selectNextTopicIdToTest()).toEqual(
        'topicID3'
      );
    }
  );

  it(
    'should be able to generate ancestors and successors of each topic for ' +
      'a dependency graph containing loops',
    () => {
      const topicIdToPrerequisiteTopicIds = {
        topicID1: [],
        topicID2: ['topicID1'],
        topicID3: ['topicID1'],
        topicID4: ['topicID3', 'topicID5'],
        topicID5: ['topicID2'],
      };
      const expectedTopicIdToAncestorTopicIds = {
        topicID1: [],
        topicID2: ['topicID1'],
        topicID3: ['topicID1'],
        topicID4: ['topicID1', 'topicID2', 'topicID3', 'topicID5'],
        topicID5: ['topicID1', 'topicID2'],
      };
      const expectedTopicIdToSuccessorTopicIds = {
        topicID1: ['topicID2', 'topicID3', 'topicID4', 'topicID5'],
        topicID2: ['topicID4', 'topicID5'],
        topicID3: ['topicID4'],
        topicID4: [],
        topicID5: ['topicID4'],
      };

      const diagnosticTestTopicTrackerModel =
        new DiagnosticTestTopicTrackerModel(topicIdToPrerequisiteTopicIds);

      expect(
        diagnosticTestTopicTrackerModel.getTopicIdToAncestorTopicIds()
      ).toEqual(expectedTopicIdToAncestorTopicIds);

      expect(
        diagnosticTestTopicTrackerModel.getTopicIdToSuccessorTopicIds()
      ).toEqual(expectedTopicIdToSuccessorTopicIds);
    }
  );
});
