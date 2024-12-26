// Copyright 2015 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for UrlInterpolationService.
 */
import {TestBed} from '@angular/core/testing';

import {StoryValidationService} from 'domain/story/story-validation.service';
import {StoryContents} from 'domain/story/story-contents-object.model';

describe('Story Validation Service', () => {
  let svs: StoryValidationService;
  beforeEach(() => {
    svs = TestBed.inject(StoryValidationService);
  });

  it(
    'should report a validation error when skill is not aquired in previous' +
      ' chapter',
    () => {
      let sampleStoryContentsBackendDict = {
        initial_node_id: 'node_1',
        nodes: [
          {
            id: 'node_1',
            title: 'Title 1',
            description: 'Description 1',
            prerequisite_skill_ids: ['skill_1'],
            acquired_skill_ids: ['skill_2'],
            destination_node_ids: ['node_2'],
            outline: 'Outline',
            exploration_id: null,
            outline_is_finalized: false,
            thumbnail_bg_color: '#a33f40',
            thumbnail_filename: 'filename',
            status: 'Published',
            planned_publication_date_msecs: 100.0,
            last_modified_msecs: 100.0,
            first_publication_date_msecs: 200.0,
            unpublishing_reason: null,
          },
          {
            id: 'node_2',
            title: 'Title 2',
            description: 'Description 2',
            prerequisite_skill_ids: ['skill_3'],
            acquired_skill_ids: [],
            destination_node_ids: [],
            outline: 'Outline 2',
            exploration_id: 'exp_1',
            outline_is_finalized: true,
            thumbnail_bg_color: '#a33f40',
            thumbnail_filename: 'filename',
            status: 'Published',
            planned_publication_date_msecs: 100.0,
            last_modified_msecs: 100.0,
            first_publication_date_msecs: 200.0,
            unpublishing_reason: null,
          },
        ],
        next_node_id: 'node_3',
      };
      let sampleStoryContents = StoryContents.createFromBackendDict(
        sampleStoryContentsBackendDict
      );
      let issues = svs.validatePrerequisiteSkillsInStoryContents(
        ['skill_3'],
        sampleStoryContents
      );
      let expectedErrorString =
        'The skill with id skill_3 was specified as a prerequisite for ' +
        'Chapter Title 2 but was not taught in any chapter before it.';
      expect(issues).toEqual([expectedErrorString]);
    }
  );

  it(
    'should report a validation error when skill is not acquired in intial' +
      ' chapter',
    () => {
      let sampleStoryContentsBackendDict = {
        initial_node_id: 'node_1',
        nodes: [
          {
            id: 'node_1',
            title: 'Title 1',
            description: 'Description 1',
            prerequisite_skill_ids: ['skill_3'],
            acquired_skill_ids: ['skill_2'],
            destination_node_ids: ['node_2'],
            outline: 'Outline',
            exploration_id: null,
            outline_is_finalized: false,
            thumbnail_bg_color: '#a33f40',
            thumbnail_filename: 'filename',
            status: 'Published',
            planned_publication_date_msecs: 100.0,
            last_modified_msecs: 100.0,
            first_publication_date_msecs: 200.0,
            unpublishing_reason: null,
          },
          {
            id: 'node_2',
            title: 'Title 2',
            description: 'Description 2',
            prerequisite_skill_ids: ['skill_4'],
            acquired_skill_ids: [],
            destination_node_ids: [],
            outline: 'Outline 2',
            exploration_id: 'exp_1',
            outline_is_finalized: true,
            thumbnail_bg_color: '#a33f40',
            thumbnail_filename: 'filename',
            status: 'Published',
            planned_publication_date_msecs: 100.0,
            last_modified_msecs: 100.0,
            first_publication_date_msecs: 200.0,
            unpublishing_reason: null,
          },
        ],
        next_node_id: 'node_3',
      };
      let sampleStoryContents = StoryContents.createFromBackendDict(
        sampleStoryContentsBackendDict
      );
      let issues = svs.validatePrerequisiteSkillsInStoryContents(
        ['skill_3'],
        sampleStoryContents
      );
      let expectedErrorString =
        'The skill with id skill_3 was specified as a prerequisite for ' +
        'Chapter Title 1 but was not taught in any chapter before it.';
      expect(issues).toEqual([expectedErrorString]);
    }
  );

  it('should report a validation error when the story graph has loops', () => {
    let sampleStoryContentsBackendDict = {
      initial_node_id: 'node_1',
      nodes: [
        {
          id: 'node_1',
          title: 'Title 1',
          description: 'Description 1',
          prerequisite_skill_ids: ['skill_1'],
          acquired_skill_ids: ['skill_2'],
          destination_node_ids: ['node_2'],
          outline: 'Outline',
          exploration_id: null,
          outline_is_finalized: false,
          thumbnail_bg_color: '#a33f40',
          thumbnail_filename: 'filename',
          status: 'Published',
          planned_publication_date_msecs: 100.0,
          last_modified_msecs: 100.0,
          first_publication_date_msecs: 200.0,
          unpublishing_reason: null,
        },
        {
          id: 'node_2',
          title: 'Title 2',
          description: 'Description 2',
          prerequisite_skill_ids: ['skill_3'],
          acquired_skill_ids: [],
          destination_node_ids: ['node_3'],
          outline: 'Outline 2',
          exploration_id: 'exp_1',
          outline_is_finalized: true,
          thumbnail_bg_color: '#a33f40',
          thumbnail_filename: 'filename',
          status: 'Published',
          planned_publication_date_msecs: 100.0,
          last_modified_msecs: 100.0,
          first_publication_date_msecs: 200.0,
          unpublishing_reason: null,
        },
        {
          id: 'node_3',
          title: 'Title 3',
          description: 'Description 3',
          prerequisite_skill_ids: ['skill_4'],
          acquired_skill_ids: [],
          destination_node_ids: ['node_1'],
          outline: 'Outline 2',
          exploration_id: 'exp_1',
          outline_is_finalized: true,
          thumbnail_bg_color: '#a33f40',
          thumbnail_filename: 'filename',
          status: 'Published',
          planned_publication_date_msecs: 100.0,
          last_modified_msecs: 100.0,
          first_publication_date_msecs: 200.0,
          unpublishing_reason: null,
        },
      ],
      next_node_id: 'node_4',
    };
    let sampleStoryContents = StoryContents.createFromBackendDict(
      sampleStoryContentsBackendDict
    );
    let issues = svs.validatePrerequisiteSkillsInStoryContents(
      [],
      sampleStoryContents
    );
    let expectedErrorString = 'Loops are not allowed in the node graph';
    expect(issues).toEqual([expectedErrorString]);
  });

  it('should throw error when initial node id does not exist', () => {
    let sampleStoryContentsBackendDict = {
      initial_node_id: 'node_1',
      nodes: [
        {
          id: 'node_1',
          title: 'Title 1',
          description: 'Description 1',
          prerequisite_skill_ids: ['skill_1'],
          acquired_skill_ids: ['skill_2'],
          destination_node_ids: ['node_2'],
          outline: 'Outline',
          exploration_id: null,
          outline_is_finalized: false,
          thumbnail_bg_color: '#a33f40',
          thumbnail_filename: 'filename',
          status: 'Published',
          planned_publication_date_msecs: 100.0,
          last_modified_msecs: 100.0,
          first_publication_date_msecs: 200.0,
          unpublishing_reason: null,
        },
      ],
      next_node_id: 'node_2',
    };
    let sampleStoryContents = StoryContents.createFromBackendDict(
      sampleStoryContentsBackendDict
    );
    sampleStoryContents.deleteNode('node_1');
    expect(() =>
      svs.validatePrerequisiteSkillsInStoryContents([], sampleStoryContents)
    ).toThrowError('Starting Node does not exist');
  });
});
