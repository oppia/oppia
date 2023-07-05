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
 * @fileoverview Tests for StoryContentsObjectFactory.
 */


import { StoryContents, StoryContentsBackendDict } from
  'domain/story/story-contents-object.model';
import { StoryNode } from './story-node.model';

describe('Story contents object factory', () => {
  let _sampleStoryContents: StoryContents;
  let sampleStoryContentsBackendDict: StoryContentsBackendDict;

  beforeEach(() => {
    sampleStoryContentsBackendDict = {
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
          planned_publication_date_msecs: 10,
          last_modified_msecs: 10,
          first_publication_date_msecs: 20,
          unpublishing_reason: null
        }, {
          id: 'node_2',
          title: 'Title 2',
          description: 'Description 2',
          prerequisite_skill_ids: ['skill_2'],
          acquired_skill_ids: ['skill_3', 'skill_4'],
          destination_node_ids: [],
          outline: 'Outline 2',
          exploration_id: 'exp_1',
          outline_is_finalized: true,
          thumbnail_bg_color: '#a33f40',
          thumbnail_filename: 'filename',
          status: 'Draft',
          planned_publication_date_msecs: 20,
          last_modified_msecs: 15,
          first_publication_date_msecs: 20,
          unpublishing_reason: 'Bad Content'
        }],
      next_node_id: 'node_3'
    };
    _sampleStoryContents = StoryContents.createFromBackendDict(
      sampleStoryContentsBackendDict);
  });

  it('should correctly return index of node (or -1, if not present) ' +
     'based on id', () => {
    expect(_sampleStoryContents.getNodeIndex('node_1')).toEqual(0);
    expect(_sampleStoryContents.getNodeIndex('node_10')).toEqual(-1);
  });

  it('should return Nodes List in Linear format when called', () => {
    let nodes = [
      StoryNode.createFromBackendDict(sampleStoryContentsBackendDict.nodes[0]),
      StoryNode.createFromBackendDict(sampleStoryContentsBackendDict.nodes[1])
    ];

    expect(_sampleStoryContents.getLinearNodesList())
      .toEqual(nodes);
  });

  it('should get list of node Ids when called', () => {
    expect(_sampleStoryContents.getNodeIds()).toEqual(['node_1', 'node_2']);
  });

  it('should return the next node Id when called', () => {
    expect(_sampleStoryContents.getNextNodeId()).toBe('node_3');
  });

  it('should rearrange nodes in story when user drags and drops the nodes',
    () => {
      expect(_sampleStoryContents.getNodes()[0].getTitle()).toEqual('Title 1');
      expect(_sampleStoryContents.getNodes()[1].getTitle()).toEqual('Title 2');

      _sampleStoryContents.rearrangeNodeInStory(0, 1);

      expect(_sampleStoryContents.getNodes()[1].getTitle()).toEqual('Title 1');
      expect(_sampleStoryContents.getNodes()[0].getTitle()).toEqual('Title 2');
    });

  it('should warn user when a story node has issues', () => {
    sampleStoryContentsBackendDict.nodes[0].prerequisite_skill_ids =
      ['skill_2'];
    let _invalidSampleStoryContents =
      StoryContents.createFromBackendDict(
        sampleStoryContentsBackendDict);

    expect(_invalidSampleStoryContents.validate())
      .toEqual(
        ['The skill with id skill_2 is common to both the ' +
        'acquired and prerequisite skill id list in node with id node_1']);
  });

  it('should throw error when there is a duplicate node present in the story',
    () => {
      sampleStoryContentsBackendDict.nodes[1].id = 'node_1';
      let _invalidSampleStoryContents =
      StoryContents.createFromBackendDict(
        sampleStoryContentsBackendDict);

      expect(() => {
        _invalidSampleStoryContents.validate();
      }).toThrowError('The node with id node_1 is duplicated in the story');
    });

  it('should throw error when a node is out of bounds',
    () => {
      sampleStoryContentsBackendDict.next_node_id = 'node_1';
      let _invalidSampleStoryContents =
      StoryContents.createFromBackendDict(
        sampleStoryContentsBackendDict);

      expect(() => {
        _invalidSampleStoryContents.validate();
      }).toThrowError('Node id out of bounds for node with id node_2');
    });

  it('should throw error when the node does not exist', () => {
    sampleStoryContentsBackendDict.nodes[1].destination_node_ids = ['node_4'];
    let _invalidSampleStoryContents =
    StoryContents.createFromBackendDict(
      sampleStoryContentsBackendDict);

    expect(_invalidSampleStoryContents.validate())
      .toEqual(['The node with id node_4 doesn\'t exist']);
  });

  it('should throw error when initial node of the story is not present', () => {
    let _invalidSampleStoryContents =
    StoryContents.createFromBackendDict(
      sampleStoryContentsBackendDict);
    _invalidSampleStoryContents._initialNodeId = null;

    expect(() => {
      _invalidSampleStoryContents.validate();
    }).toThrowError('Initial node - null - is not present in the story');
  });

  it('should set initial node Id when user drags the nodes', () => {
    sampleStoryContentsBackendDict.initial_node_id = '';
    let _sampleStoryContents =
    StoryContents.createFromBackendDict(
      sampleStoryContentsBackendDict);

    _sampleStoryContents.setInitialNodeId('node_1');

    expect(_sampleStoryContents._initialNodeId).toBe('node_1');
  });

  it('should delete node when user deletes a node', () => {
    _sampleStoryContents.addNode('Title 3');
    expect(_sampleStoryContents.getNodeIds()).toEqual(
      ['node_1', 'node_2', 'node_3']);

    _sampleStoryContents.deleteNode('node_2');

    expect(_sampleStoryContents.getNodeIds()).toEqual(['node_1', 'node_3']);
  });

  it('should throw error when a non existent node is deleted', () => {
    expect(() => {
      _sampleStoryContents.deleteNode('node_4');
    }).toThrowError('The node does not exist');
  });

  it('should delete initial node when it is the only node left', () => {
    _sampleStoryContents.deleteNode('node_2');

    expect(_sampleStoryContents.getNodeIds()).toEqual(['node_1']);

    _sampleStoryContents.deleteNode('node_1');

    expect(_sampleStoryContents.getNodeIds()).toEqual([]);
    expect(_sampleStoryContents._initialNodeId).toBeNull();
  });

  it('should throw error when initial node is deleted before other nodes',
    () => {
      expect(() => {
        _sampleStoryContents.deleteNode('node_1');
      }).toThrowError('Cannot delete initial story node');
    });

  it('should set node outline when the user enter the outline', () => {
    expect(_sampleStoryContents._nodes[0].getOutline()).toBe('Outline');

    _sampleStoryContents.setNodeOutline('node_1', 'New outline');

    expect(_sampleStoryContents._nodes[0].getOutline()).toBe('New outline');
  });

  it('should set node title when the user enter the title', () => {
    expect(_sampleStoryContents._nodes[0].getTitle()).toBe('Title 1');

    _sampleStoryContents.setNodeTitle('node_1', 'New Title');

    expect(_sampleStoryContents._nodes[0].getTitle()).toBe('New Title');
  });

  it('should set node description when the user enter the description', () => {
    expect(_sampleStoryContents._nodes[0].getDescription())
      .toBe('Description 1');

    _sampleStoryContents.setNodeDescription('node_1', 'New description');

    expect(_sampleStoryContents._nodes[0].getDescription())
      .toBe('New description');
  });

  it('should set node status when the user changes the status', () => {
    expect(_sampleStoryContents._nodes[0].getStatus())
      .toBe('Published');

    _sampleStoryContents.setNodeStatus('node_1', 'Draft');

    expect(_sampleStoryContents._nodes[0].getStatus())
      .toBe('Draft');
  });

  it('should set node planned publicaton date when the user enters the' +
    ' planned publication date', () => {
    expect(_sampleStoryContents._nodes[0].getPlannedPublicationDateMsecs())
      .toBe(10);

    _sampleStoryContents.setNodePlannedPublicationDateMsecs('node_1', 5);

    expect(_sampleStoryContents._nodes[0].getPlannedPublicationDateMsecs())
      .toBe(5);
  });

  it('should update node last modified when there is a change in node' +
    ' properties', () => {
    expect(_sampleStoryContents._nodes[0].getLastModifiedMsecs())
      .toBe(10);

    _sampleStoryContents.setNodeLastModifiedMsecs('node_1', 5);

    expect(_sampleStoryContents._nodes[0].getLastModifiedMsecs())
      .toBe(5);
  });

  it('should set node first publication date when the user' +
    ' publishes the node', () => {
    expect(_sampleStoryContents._nodes[0].getFirstPublicationDateMsecs())
      .toBe(20);

    _sampleStoryContents.setNodeFirstPublicationDateMsecs('node_1', 30);

    expect(_sampleStoryContents._nodes[0].getFirstPublicationDateMsecs())
      .toBe(30);
  });

  it('should set node unpublishing reason when the user unpublishes' +
    ' a node', () => {
    expect(_sampleStoryContents._nodes[0].getUnpublishingReason())
      .toBe(null);

    _sampleStoryContents.setNodeUnpublishingReason('node_1', 'Bad Content');

    expect(_sampleStoryContents._nodes[0].getUnpublishingReason())
      .toBe('Bad Content');
  });

  it('should set a new Exploration Id for the node when called', () => {
    expect(_sampleStoryContents._nodes[0]._explorationId).toBeNull();

    _sampleStoryContents.setNodeExplorationId('node_1', 'exp_2');

    expect(_sampleStoryContents._nodes[0]._explorationId).toBe('exp_2');
  });

  it('should throw error when exploration is already present in the story',
    () => {
      expect(() => {
        _sampleStoryContents.setNodeExplorationId('node_1', 'exp_1');
      }).toThrowError('The given exploration already exists in the story.');
    });

  it('should set Outline as finalized when called', () => {
    expect(_sampleStoryContents._nodes[0]._outlineIsFinalized).toBe(false);

    _sampleStoryContents.markNodeOutlineAsFinalized('node_1');

    expect(_sampleStoryContents._nodes[0]._outlineIsFinalized).toBe(true);
  });

  it('should set Outline as not finalized when called', () => {
    expect(_sampleStoryContents._nodes[1]._outlineIsFinalized).toBe(true);

    _sampleStoryContents.markNodeOutlineAsNotFinalized('node_2');

    expect(_sampleStoryContents._nodes[1]._outlineIsFinalized).toBe(false);
  });

  it('should add pre requisite SkillId when called', () => {
    expect(_sampleStoryContents._nodes[0]._prerequisiteSkillIds)
      .toEqual(['skill_1']);

    _sampleStoryContents.addPrerequisiteSkillIdToNode('node_1', 'skill_3');

    expect(_sampleStoryContents._nodes[0]._prerequisiteSkillIds)
      .toEqual(['skill_1', 'skill_3']);
  });

  it('should remove pre requisite SkillId when called', () => {
    expect(_sampleStoryContents._nodes[0]._prerequisiteSkillIds)
      .toEqual(['skill_1']);

    _sampleStoryContents.removePrerequisiteSkillIdFromNode('node_1', 'skill_1');

    expect(_sampleStoryContents._nodes[0]._prerequisiteSkillIds)
      .toEqual([]);
  });

  it('should add acquired SkillId when called', () => {
    expect(_sampleStoryContents._nodes[0]._acquiredSkillIds)
      .toEqual(['skill_2']);

    _sampleStoryContents.addAcquiredSkillIdToNode('node_1', 'skill_5');

    expect(_sampleStoryContents._nodes[0]._acquiredSkillIds)
      .toEqual(['skill_2', 'skill_5']);
  });

  it('should remove acquired SkillId when called', () => {
    expect(_sampleStoryContents._nodes[1]._acquiredSkillIds)
      .toEqual(['skill_3', 'skill_4']);

    _sampleStoryContents.removeAcquiredSkillIdFromNode('node_2', 'skill_3');

    expect(_sampleStoryContents._nodes[1]._acquiredSkillIds)
      .toEqual(['skill_4']);
  });

  it('should add destination Id when called', () => {
    _sampleStoryContents._nodes[0]._destinationNodeIds = [];

    _sampleStoryContents.addDestinationNodeIdToNode('node_1', 'node_2');

    expect(_sampleStoryContents._nodes[0]._destinationNodeIds)
      .toEqual(['node_2']);
  });

  it('should remove destination Id when called', () => {
    expect(_sampleStoryContents._nodes[0]._destinationNodeIds)
      .toEqual(['node_2']);

    _sampleStoryContents.removeDestinationNodeIdFromNode('node_1', 'node_2');

    expect(_sampleStoryContents._nodes[0]._destinationNodeIds)
      .toEqual([]);
  });

  it('should warn user if destination node does not exist', () => {
    expect(() => {
      _sampleStoryContents.addDestinationNodeIdToNode('node_2', 'node_4');
    }).toThrowError('The destination node with given id doesn\'t exist');
  });

  it('should correctly correctly return the id to title map for story ' +
    'nodes', () => {
    expect(
      _sampleStoryContents.getNodeIdsToTitleMap(['node_1', 'node_2'])
    ).toEqual({
      node_1: 'Title 1',
      node_2: 'Title 2'
    });

    expect(() => {
      _sampleStoryContents.getNodeIdsToTitleMap(['node_1', 'node_2', 'node_3']);
    }).toThrowError('The node with id node_3 is invalid');
  });

  it('should correctly correctly validate valid story contents', () => {
    expect(_sampleStoryContents.validate()).toEqual([]);
  });

  it('should correctly set initial node id when first node is ' +
    'created', () => {
    var sampleStoryContentsBackendDict: StoryContentsBackendDict = {
      initial_node_id: '',
      next_node_id: 'node_1',
      nodes: []
    };
    var storyContents = StoryContents.createFromBackendDict(
      sampleStoryContentsBackendDict);
    storyContents._initialNodeId = null;

    storyContents.addNode('Title 1');

    expect(storyContents.getInitialNodeId()).toEqual('node_1');
    expect(storyContents.getNodes()[0].getTitle()).toEqual('Title 1');
  });

  it('should correctly throw error when node id is invalid for any function',
    () => {
      expect(() => {
        _sampleStoryContents.setInitialNodeId('node_5');
      }).toThrowError('The node with given id doesn\'t exist');
      expect(() => {
        _sampleStoryContents.deleteNode('node_5');
      }).toThrowError('The node does not exist');
      expect(() => {
        _sampleStoryContents.setNodeExplorationId('node_5', 'id');
      }).toThrowError('The node with given id doesn\'t exist');
      expect(() => {
        _sampleStoryContents.setNodeOutline('node_5', 'Outline');
      }).toThrowError('The node with given id doesn\'t exist');
      expect(() => {
        _sampleStoryContents.setNodeDescription('node_5', 'Description');
      }).toThrowError();
      expect(() => {
        _sampleStoryContents.markNodeOutlineAsFinalized('node_5');
      }).toThrowError('The node with given id doesn\'t exist');
      expect(() => {
        _sampleStoryContents.markNodeOutlineAsNotFinalized('node_5');
      }).toThrowError('The node with given id doesn\'t exist');
      expect(() => {
        _sampleStoryContents.setNodeTitle('node_5', 'Title 3');
      }).toThrowError('The node with given id doesn\'t exist');
      expect(() => {
        _sampleStoryContents.addPrerequisiteSkillIdToNode('node_5', 'skill_1');
      }).toThrowError('The node with given id doesn\'t exist');
      expect(() => {
        _sampleStoryContents.removePrerequisiteSkillIdFromNode(
          'node_5', 'skill_1');
      }).toThrowError('The node with given id doesn\'t exist');
      expect(() => {
        _sampleStoryContents.addAcquiredSkillIdToNode('node_5', 'skill_1');
      }).toThrowError('The node with given id doesn\'t exist');
      expect(() => {
        _sampleStoryContents.removeAcquiredSkillIdFromNode('node_5', 'skill_1');
      }).toThrowError('The node with given id doesn\'t exist');
      expect(() => {
        _sampleStoryContents.addDestinationNodeIdToNode('node_5', 'node_1');
      }).toThrowError('The node with given id doesn\'t exist');
      expect(() => {
        _sampleStoryContents.removeDestinationNodeIdFromNode(
          'node_5', 'node_1');
      }).toThrowError('The node with given id doesn\'t exist');
      expect(() => {
        _sampleStoryContents.setNodeStatus('node_5', 'Draft');
      }).toThrowError('The node with given id doesn\'t exist');
      expect(() => {
        _sampleStoryContents.setNodePlannedPublicationDateMsecs(
          'node_5', 100);
      }).toThrowError('The node with given id doesn\'t exist');
      expect(() => {
        _sampleStoryContents.setNodeLastModifiedMsecs(
          'node_5', 100);
      }).toThrowError('The node with given id doesn\'t exist');
      expect(() => {
        _sampleStoryContents.setNodeFirstPublicationDateMsecs(
          'node_5', 100);
      }).toThrowError('The node with given id doesn\'t exist');
      expect(() => {
        _sampleStoryContents.setNodeUnpublishingReason(
          'node_5', 'Bad Content');
      }).toThrowError('The node with given id doesn\'t exist');
    });
});
