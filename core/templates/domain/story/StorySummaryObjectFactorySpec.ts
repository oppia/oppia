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
 * @fileoverview Tests for StorySummaryObjectFactory.
 */

import { TestBed } from '@angular/core/testing';

import {
  StorySummaryObjectFactory,
  StorySummary
} from 'domain/story/StorySummaryObjectFactory';

describe('Story summary object factory', () => {
  let factory: StorySummaryObjectFactory;
  let _sampleStorySummary: StorySummary;

  beforeEach(() => {
    factory = TestBed.get(StorySummaryObjectFactory);

    const sampleStorySummaryBackendDict = {
      id: 'sample_story_id',
      title: 'Story title',
      node_count: 5,
      story_is_published: true
    };
    _sampleStorySummary = factory.createFromBackendDict(
      sampleStorySummaryBackendDict
    );
  });

  it('should be able to get all the values', () => {
    expect(_sampleStorySummary.getId()).toEqual('sample_story_id');
    expect(_sampleStorySummary.getTitle()).toEqual('Story title');
    expect(_sampleStorySummary.getNodeCount()).toEqual(5);
    expect(_sampleStorySummary.isStoryPublished()).toBe(true);
  });
});
