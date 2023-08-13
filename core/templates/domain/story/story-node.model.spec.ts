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
 * @fileoverview Tests for StoryNode model.
 */

import { StoryNode, StoryNodeBackendDict } from 'domain/story/story-node.model';

describe('Story node model', () => {
  let _sampleStoryNode: StoryNode;

  beforeEach(() => {
    const sampleStoryNodeBackendDict: StoryNodeBackendDict = {
      id: 'node_1',
      thumbnail_filename: 'image.png',
      title: 'Title 1',
      description: 'Description 1',
      prerequisite_skill_ids: ['skill_1'],
      acquired_skill_ids: ['skill_2'],
      destination_node_ids: ['node_2'],
      outline: 'Outline',
      exploration_id: null,
      outline_is_finalized: false,
      thumbnail_bg_color: '#a33f40',
      status: 'Draft',
      planned_publication_date_msecs: 10,
      last_modified_msecs: 10,
      first_publication_date_msecs: 20,
      unpublishing_reason: null
    };
    _sampleStoryNode = StoryNode.createFromBackendDict(
      sampleStoryNodeBackendDict);
  });

  it('should correctly create a node from node id alone', () => {
    const storyNode = StoryNode.createFromIdAndTitle(
      'node_1', 'Title 1');
    expect(storyNode.getId()).toEqual('node_1');
    expect(storyNode.getThumbnailFilename()).toEqual(null);
    expect(storyNode.getTitle()).toEqual('Title 1');
    expect(storyNode.getDescription()).toEqual('');
    expect(storyNode.getDestinationNodeIds()).toEqual([]);
    expect(storyNode.getPrerequisiteSkillIds()).toEqual([]);
    expect(storyNode.getAcquiredSkillIds()).toEqual([]);
    expect(storyNode.getOutline()).toEqual('');
    expect(storyNode.getOutlineStatus()).toEqual(false);
    expect(storyNode.getExplorationId()).toEqual(null);
  });

  it('should correctly validate a valid story node', () => {
    expect(_sampleStoryNode.validate()).toEqual([]);
  });

  it('should throw error when validating node with invalid id', () => {
    const invalidStoryNode = StoryNode.createFromIdAndTitle(
      '1', 'Title 1');

    expect(() => invalidStoryNode.validate()).toThrowError(
      'The node id 1 is invalid.');

    // This throws "TS2345". We need to suppress this error because
    // we are testing that _checkValidNodeId return false when
    // typeof nodeId is not a string. We cannot use a string as
    // nodeId because it will throw an error in the constructor.
    // @ts-ignore
    const invalidStoryNode2 = StoryNode.createFromIdAndTitle({}, '');

    expect(() => invalidStoryNode2.validate()).toThrowError(
      'The node id [object Object] is invalid.');
  });

  it('should raise issue when validating node with duplicated ' +
      'prerequisite skill id', () => {
    const testBackendDict = {
      id: 'node_1',
      thumbnail_filename: 'image.png',
      title: 'Title 1',
      description: 'Description 1',
      prerequisite_skill_ids: ['skill_1', 'skill_1'],
      acquired_skill_ids: ['skill_2'],
      destination_node_ids: ['node_2'],
      outline: 'Outline',
      exploration_id: null,
      outline_is_finalized: false,
      thumbnail_bg_color: '#a33f40',
      status: 'Published',
      planned_publication_date_msecs: 100,
      last_modified_msecs: 100,
      first_publication_date_msecs: 200,
      unpublishing_reason: null
    };
    const testStoryNode = StoryNode.createFromBackendDict(testBackendDict);
    const expectedErrorMessage = (
      'The prerequisite skill with id skill_1 is duplicated in' +
          ' node with id node_1');

    expect(testStoryNode.validate()).toContain(expectedErrorMessage);
  });

  it('should raise issue when validating node with duplicated ' +
      'acquired skill id', () => {
    const testBackendDict = {
      id: 'node_1',
      thumbnail_filename: 'image.png',
      title: 'Title 1',
      description: 'Description 1',
      prerequisite_skill_ids: ['skill_1'],
      acquired_skill_ids: ['skill_2', 'skill_2'],
      destination_node_ids: ['node_2'],
      outline: 'Outline',
      exploration_id: null,
      outline_is_finalized: false,
      thumbnail_bg_color: '#a33f40',
      status: 'Published',
      planned_publication_date_msecs: 100,
      last_modified_msecs: 100,
      first_publication_date_msecs: 200,
      unpublishing_reason: null
    };
    const testStoryNode = StoryNode.createFromBackendDict(testBackendDict);
    const expectedErrorMessage = (
      'The acquired skill with id skill_2 is duplicated in' +
          ' node with id node_1');

    expect(testStoryNode.validate()).toContain(expectedErrorMessage);
  });

  it('should raise issue when validating node having common ' +
      'skill id in both acquired and prerequisite skill id lists',
  () => {
    const testBackendDict = {
      id: 'node_1',
      thumbnail_filename: 'image.png',
      title: 'Title 1',
      description: 'Description 1',
      prerequisite_skill_ids: ['skill_1'],
      acquired_skill_ids: ['skill_1'],
      destination_node_ids: ['node_2'],
      outline: 'Outline',
      exploration_id: null,
      outline_is_finalized: false,
      thumbnail_bg_color: '#a33f40',
      status: 'Published',
      planned_publication_date_msecs: 100,
      last_modified_msecs: 100,
      first_publication_date_msecs: 200,
      unpublishing_reason: null
    };
    const testStoryNode = StoryNode.createFromBackendDict(testBackendDict);
    const expectedErrorMessage = (
      'The skill with id skill_1 is common ' +
        'to both the acquired and prerequisite skill id list in node with' +
          ' id node_1');

    expect(testStoryNode.validate()).toContain(expectedErrorMessage);
  });

  it('should throw error when validating node with ' +
      'with invalid id in destination node id list', () => {
    const testBackendDict = {
      id: 'node_1',
      thumbnail_filename: 'image.png',
      title: 'Title 1',
      description: 'Description 1',
      prerequisite_skill_ids: ['skill_1'],
      acquired_skill_ids: ['skill_1'],
      destination_node_ids: ['1'],
      outline: 'Outline',
      exploration_id: null,
      outline_is_finalized: false,
      thumbnail_bg_color: '#a33f40',
      status: 'Published',
      planned_publication_date_msecs: 100,
      last_modified_msecs: 100,
      first_publication_date_msecs: 200,
      unpublishing_reason: null
    };
    const testStoryNode = StoryNode.createFromBackendDict(testBackendDict);

    expect(() => testStoryNode.validate()).toThrowError(
      'The destination node id 1 is invalid in node with id node_1');
  });

  it('should raise issue when validating node with duplicated ' +
      'destination node id', () => {
    const testBackendDict = {
      id: 'node_1',
      thumbnail_filename: 'image.png',
      title: 'Title 1',
      description: 'Description 1',
      prerequisite_skill_ids: ['skill_1'],
      acquired_skill_ids: ['skill_2'],
      destination_node_ids: ['node_2', 'node_2'],
      outline: 'Outline',
      exploration_id: null,
      outline_is_finalized: false,
      thumbnail_bg_color: '#a33f40',
      status: 'Published',
      planned_publication_date_msecs: 100,
      last_modified_msecs: 100,
      first_publication_date_msecs: 200,
      unpublishing_reason: null
    };
    const testStoryNode = StoryNode.createFromBackendDict(testBackendDict);
    const expectedErrorMessage = (
      'The destination node with id node_2 is duplicated in' +
          ' node with id node_1');

    expect(testStoryNode.validate()).toContain(expectedErrorMessage);
  });

  it('should correctly perform prepublish validation for a story node', () => {
    expect(_sampleStoryNode.prepublishValidate()).toEqual([]);
    _sampleStoryNode.setThumbnailFilename('');
    expect(_sampleStoryNode.prepublishValidate()).toEqual([
      'Chapter Title 1 should have a thumbnail.']);
  });

  it('should correctly validate story nodes', () => {
    _sampleStoryNode.addAcquiredSkillId('skill_1');
    _sampleStoryNode.addDestinationNodeId('node_1');
    _sampleStoryNode.setExplorationId('');

    expect(_sampleStoryNode.validate()).toEqual([
      'The skill with id skill_1 is common to both the acquired and' +
      ' prerequisite skill id list in node with id node_1',
      'The destination node id of node with id node_1 points to itself.'
    ]);
  });

  it('should correctly throw error when duplicate values are added to arrays',
    () => {
      expect(() => {
        _sampleStoryNode.addDestinationNodeId('node_2');
      }).toThrowError('The given node is already a destination node.');
      expect(() => {
        _sampleStoryNode.addPrerequisiteSkillId('skill_1');
      }).toThrowError('The given skill id is already a prerequisite skill.');
      expect(() => {
        _sampleStoryNode.addAcquiredSkillId('skill_2');
      }).toThrowError('The given skill is already an acquired skill.');
    });

  it('should correctly throw error when invalid values are deleted from arrays',
    () => {
      expect(() => {
        _sampleStoryNode.removeDestinationNodeId('node_5');
      }).toThrowError('The given node is not a destination node.');
      expect(() => {
        _sampleStoryNode.removePrerequisiteSkillId('skill_4');
      }).toThrowError('The given skill id is not a prerequisite skill.');
      expect(() => {
        _sampleStoryNode.removeAcquiredSkillId('skill_4');
      }).toThrowError('The given skill is not an acquired skill.');
    });

  it('should be able to delete a particular destination node id properly',
    () => {
      expect(
        _sampleStoryNode.getDestinationNodeIds().indexOf('node_2')
      ).toEqual(0);

      _sampleStoryNode.removeDestinationNodeId('node_2');

      expect(
        _sampleStoryNode.getDestinationNodeIds().indexOf('node_2')
      ).toEqual(-1);
    });

  it('should be able to add acquired skill id', () => {
    expect(
      _sampleStoryNode.getAcquiredSkillIds().indexOf('skill_3')
    ).toEqual(-1);

    _sampleStoryNode.addAcquiredSkillId('skill_3');

    expect(
      _sampleStoryNode.getAcquiredSkillIds().indexOf('skill_3')
    ).toEqual(1);
  });

  it('should be able to remove an acquired skill id', () => {
    expect(
      _sampleStoryNode.getAcquiredSkillIds().indexOf('skill_2')
    ).toEqual(0);

    _sampleStoryNode.removeAcquiredSkillId('skill_2');

    expect(
      _sampleStoryNode.getAcquiredSkillIds().indexOf('skill_3')
    ).toEqual(-1);
  });

  it('should be able to remove a prerequisite skill id', () => {
    expect(
      _sampleStoryNode.getPrerequisiteSkillIds().indexOf('skill_1')
    ).toEqual(0);

    _sampleStoryNode.removePrerequisiteSkillId('skill_1');

    expect(
      _sampleStoryNode.getPrerequisiteSkillIds().indexOf('skill_1')
    ).toEqual(-1);
  });

  it('should be able to set story node outline', () => {
    expect(_sampleStoryNode.getOutline()).toEqual('Outline');

    _sampleStoryNode.setOutline('New outline');

    expect(_sampleStoryNode.getOutline()).toEqual('New outline');
  });

  it('should be able to set story node title', () => {
    expect(_sampleStoryNode.getTitle()).toEqual('Title 1');

    _sampleStoryNode.setTitle('Title 2');

    expect(_sampleStoryNode.getTitle()).toEqual('Title 2');
  });

  it('should be able to set story node description', () => {
    expect(_sampleStoryNode.getDescription()).toEqual('Description 1');

    _sampleStoryNode.setDescription('Description 2');

    expect(_sampleStoryNode.getDescription()).toEqual('Description 2');
  });

  it('should be able to set story node status', () => {
    expect(_sampleStoryNode.getStatus()).toEqual('Draft');

    _sampleStoryNode.setStatus('Published');

    expect(_sampleStoryNode.getStatus()).toEqual('Published');
  });

  it('should be able to set story node planned publication date', () => {
    expect(_sampleStoryNode.getPlannedPublicationDateMsecs()).toEqual(10);

    _sampleStoryNode.setPlannedPublicationDateMsecs(20);

    expect(_sampleStoryNode.getPlannedPublicationDateMsecs()).toEqual(20);
  });

  it('should be able to set story node last modified date time', () => {
    expect(_sampleStoryNode.getLastModifiedMsecs()).toEqual(10);

    _sampleStoryNode.setLastModifiedMsecs(11);

    expect(_sampleStoryNode.getLastModifiedMsecs()).toEqual(11);
  });

  it('should be able to set story node first publication date', () => {
    expect(_sampleStoryNode.getFirstPublicationDateMsecs()).toEqual(20);

    _sampleStoryNode.setFirstPublicationDateMsecs(30);

    expect(_sampleStoryNode.getFirstPublicationDateMsecs()).toEqual(30);
  });

  it('should be able to set story node unpublishing reason', () => {
    expect(_sampleStoryNode.getUnpublishingReason()).toEqual(null);

    _sampleStoryNode.setUnpublishingReason('Bad Content');

    expect(_sampleStoryNode.getUnpublishingReason()).toEqual('Bad Content');
  });

  it('should be able to get and set story node outline status', () => {
    expect(_sampleStoryNode.getOutlineStatus()).toBeFalse();

    _sampleStoryNode.markOutlineAsFinalized();

    expect(_sampleStoryNode.getOutlineStatus()).toBeTrue();

    _sampleStoryNode.markOutlineAsNotFinalized();

    expect(_sampleStoryNode.getOutlineStatus()).toBeFalse();
  });

  it('should be able to get and set thumbnail background color', () => {
    expect(_sampleStoryNode.getThumbnailBgColor()).toEqual('#a33f40');

    _sampleStoryNode.setThumbnailBgColor('#fff');

    expect(_sampleStoryNode.getThumbnailBgColor()).toEqual('#fff');
  });
});
