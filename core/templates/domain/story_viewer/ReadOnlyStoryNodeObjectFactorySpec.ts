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
 * @fileoverview Tests for ReadOnlyStoryNodeObjectFactory.
 */

import { TestBed } from '@angular/core/testing';

import { ReadOnlyStoryNodeObjectFactory } from
  'domain/story_viewer/ReadOnlyStoryNodeObjectFactory';

describe('Read only story node object factory', () => {
  let readOnlyStoryNodeObjectFactory: ReadOnlyStoryNodeObjectFactory = null;
  var _sampleStoryNode = null;

  beforeEach(() => {
    readOnlyStoryNodeObjectFactory = TestBed.get(
      ReadOnlyStoryNodeObjectFactory);

    var sampleReadOnlyStoryNodeBackendDict = {
      id: 'node_1',
      title: 'Title 1',
      description: 'Description',
      prerequisite_skill_ids: ['skill_1'],
      acquired_skill_ids: ['skill_2'],
      destination_node_ids: ['node_2'],
      outline: 'Outline',
      exploration_id: 'exp_id',
      outline_is_finalized: false,
      exp_summary_dict: {
        title: 'Title',
        status: 'private'
      },
      completed: true
    };
    _sampleStoryNode = readOnlyStoryNodeObjectFactory.createFromBackendDict(
      sampleReadOnlyStoryNodeBackendDict);
  });

  it('should correctly return all the values', function() {
    expect(_sampleStoryNode.getId()).toEqual('node_1');
    expect(_sampleStoryNode.getTitle()).toEqual('Title 1');
    expect(_sampleStoryNode.getDescription()).toEqual('Description');
    expect(_sampleStoryNode.getExplorationId()).toEqual('exp_id');
    expect(_sampleStoryNode.isCompleted()).toEqual(true);
    expect(_sampleStoryNode.getExplorationSummaryObject()).toEqual({
      title: 'Title',
      status: 'private'
    });
    expect(_sampleStoryNode.getOutline()).toEqual('Outline');
    expect(_sampleStoryNode.getOutlineStatus()).toEqual(false);
    expect(_sampleStoryNode.getOutlineStatus()).toEqual(false);
  });
});
