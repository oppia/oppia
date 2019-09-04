// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the GroupedStartingIndicesObjectFactory.
 */

import { TestBed } from '@angular/core/testing';

import { GroupedStartingIndicesObjectFactory } from
  'domain/statistics/GroupedStartingIndicesObjectFactory';

describe('Grouped Starting Indices Object Factory', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [GroupedStartingIndicesObjectFactory]
    });

    this.gsiof = TestBed.get(GroupedStartingIndicesObjectFactory);
  });

  it('should create a grouped starting indices instance', () => {
    var groupedStartingIndices = this.gsiof.createNew(
      3, 'stateName1');

    expect(groupedStartingIndices.startingIndices).toEqual([]);
    expect(groupedStartingIndices.latestStateName).toEqual('stateName1');
    expect(groupedStartingIndices.lastIndex).toEqual(3);
    expect(groupedStartingIndices.localIndex).toEqual(3);
  });
});
