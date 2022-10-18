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
  let diagnosticTestModelData: DiagnosticTestModelData;
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [],
      providers: []
    });

    const topicIdToPrerequisiteTopicIds = {
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
    diagnosticTestModelData = new DiagnosticTestModelData(
      topicIdToPrerequisiteTopicIds);
  });

  it('should be able to get topic ID to ancestor topic IDs', () => {
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
    const expectedSuccessorTopicIds = {
      topicID1: [
        'topicID2', 'topicID3', 'topicID4', 'topicID5', 'topicID7',
        'topicID8', 'topicID9'],
      topicID2: [
        'topicID3', 'topicID4', 'topicID5', 'topicID7', 'topicID8',
        'topicID9'],
      topicID3: ['topicID4', 'topicID5', 'topicID7', 'topicID8', 'I'],
      topicID4: ['topicID5', 'topicID9'],
      topicID5: ['topicID9'],
      topicID6: ['topicID7', 'topicID8', 'topicID9'],
      topicID7: ['topicID8', 'topicID9'],
      topicID8: ['topicID9'],
      topicID9: []
    };

    expect(diagnosticTestModelData.getTopicIdToSuccessorTopicIds()).toEqual(
      expectedSuccessorTopicIds);
  });

  it('should be able to get eligible topic IDs', () => {
    const expectedEligibleTopicIDs = [
      'topicID1', 'topicID2', 'topicID3', 'topicID4', 'topicID5', 'topicID6',
      'topicID7', 'topicID8', 'topicID9'];

    expect(diagnosticTestModelData.getEligibleTopicIds()).toEqual(
      expectedEligibleTopicIDs);
  });
});
