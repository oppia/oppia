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
 * @fileoverview Tests for Story update service.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// story-update.service.ts is upgraded to Angular 8.
import { StoryContentsObjectFactory } from
  'domain/story/StoryContentsObjectFactory';
import { StoryObjectFactory } from 'domain/story/StoryObjectFactory';
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.

require('domain/editor/undo_redo/undo-redo.service.ts');
require('domain/story/story-update.service.ts');

describe('Story update service', function() {
  var StoryUpdateService = null;
  var storyObjectFactory = null;
  var UndoRedoService = null;
  var _sampleStory = null;

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value(
      'StoryContentsObjectFactory', new StoryContentsObjectFactory());
    $provide.value(
      'StoryObjectFactory', new StoryObjectFactory(
        new StoryContentsObjectFactory()));
  }));
  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));

  beforeEach(angular.mock.inject(function($injector) {
    StoryUpdateService = $injector.get('StoryUpdateService');
    storyObjectFactory = $injector.get('StoryObjectFactory');
    UndoRedoService = $injector.get('UndoRedoService');

    var sampleStoryBackendObject = {
      id: 'sample_story_id',
      title: 'Story title',
      description: 'Story description',
      notes: 'Story notes',
      version: 1,
      corresponding_topic_id: 'topic_id',
      story_contents: {
        initial_node_id: 'node_2',
        nodes: [
          {
            id: 'node_1',
            title: 'Title 1',
            description: 'Description 1',
            prerequisite_skill_ids: ['skill_1'],
            acquired_skill_ids: ['skill_2'],
            destination_node_ids: [],
            outline: 'Outline',
            exploration_id: null,
            outline_is_finalized: false
          }, {
            id: 'node_2',
            title: 'Title 2',
            description: 'Description 2',
            prerequisite_skill_ids: ['skill_3'],
            acquired_skill_ids: ['skill_4'],
            destination_node_ids: ['node_1'],
            outline: 'Outline 2',
            exploration_id: 'exp_1',
            outline_is_finalized: true
          }],
        next_node_id: 'node_3'
      },
      language_code: 'en'
    };
    _sampleStory = storyObjectFactory.createFromBackendDict(
      sampleStoryBackendObject);
  }));

  it('should add/remove a prerequisite skill id to/from a node in the story',
    function() {
      expect(
        _sampleStory.getStoryContents().getNodes()[0].getPrerequisiteSkillIds()
      ).toEqual(['skill_1']);
      StoryUpdateService.addPrerequisiteSkillIdToNode(
        _sampleStory, 'node_1', 'skill_3');
      expect(
        _sampleStory.getStoryContents().getNodes()[0].getPrerequisiteSkillIds()
      ).toEqual(['skill_1', 'skill_3']);

      UndoRedoService.undoChange(_sampleStory);
      expect(
        _sampleStory.getStoryContents().getNodes()[0].getPrerequisiteSkillIds()
      ).toEqual(['skill_1']);
    }
  );

  it('should create a proper backend change dict for adding a prerequisite ' +
    'skill id to a node',
  function() {
    StoryUpdateService.addPrerequisiteSkillIdToNode(
      _sampleStory, 'node_1', 'skill_3');
    expect(UndoRedoService.getCommittableChangeList()).toEqual([{
      cmd: 'update_story_node_property',
      property_name: 'prerequisite_skill_ids',
      new_value: ['skill_1', 'skill_3'],
      old_value: ['skill_1'],
      node_id: 'node_1'
    }]);
  });

  it('should add/remove an acquired skill id to/from a node in the story',
    function() {
      expect(
        _sampleStory.getStoryContents().getNodes()[0].getAcquiredSkillIds()
      ).toEqual(['skill_2']);
      StoryUpdateService.addAcquiredSkillIdToNode(
        _sampleStory, 'node_1', 'skill_4');
      expect(
        _sampleStory.getStoryContents().getNodes()[0].getAcquiredSkillIds()
      ).toEqual(['skill_2', 'skill_4']);

      UndoRedoService.undoChange(_sampleStory);
      expect(
        _sampleStory.getStoryContents().getNodes()[0].getAcquiredSkillIds()
      ).toEqual(['skill_2']);
    }
  );

  it('should create a proper backend change dict for adding an acquired ' +
    'skill id to a node',
  function() {
    StoryUpdateService.addAcquiredSkillIdToNode(
      _sampleStory, 'node_1', 'skill_4');
    expect(UndoRedoService.getCommittableChangeList()).toEqual([{
      cmd: 'update_story_node_property',
      property_name: 'acquired_skill_ids',
      new_value: ['skill_2', 'skill_4'],
      old_value: ['skill_2'],
      node_id: 'node_1'
    }]);
  });

  it('should add/remove a destination node id to/from a node in the story',
    function() {
      expect(
        _sampleStory.getStoryContents().getNodes()[0].getDestinationNodeIds()
      ).toEqual([]);
      StoryUpdateService.addDestinationNodeIdToNode(
        _sampleStory, 'node_1', 'node_2');

      // Adding an invalid destination node id should throw an error.
      expect(function() {
        StoryUpdateService.addDestinationNodeIdToNode(
          _sampleStory, 'node_1', 'node_5');
      }).toThrowError('The destination node with given id doesn\'t exist');

      expect(
        _sampleStory.getStoryContents().getNodes()[0].getDestinationNodeIds()
      ).toEqual(['node_2']);

      UndoRedoService.undoChange(_sampleStory);
      expect(
        _sampleStory.getStoryContents().getNodes()[0].getDestinationNodeIds()
      ).toEqual([]);
    }
  );

  it('should create a proper backend change dict for adding a destination ' +
    'node id to a node',
  function() {
    StoryUpdateService.addDestinationNodeIdToNode(
      _sampleStory, 'node_1', 'node_2');
    expect(UndoRedoService.getCommittableChangeList()).toEqual([{
      cmd: 'update_story_node_property',
      property_name: 'destination_node_ids',
      new_value: ['node_2'],
      old_value: [],
      node_id: 'node_1'
    }]);
  });

  it('should remove/add a prerequisite skill id from/to a node in the story',
    function() {
      expect(
        _sampleStory.getStoryContents().getNodes()[0].getPrerequisiteSkillIds()
      ).toEqual(['skill_1']);
      StoryUpdateService.removePrerequisiteSkillIdFromNode(
        _sampleStory, 'node_1', 'skill_1');
      expect(
        _sampleStory.getStoryContents().getNodes()[0].getPrerequisiteSkillIds()
      ).toEqual([]);

      UndoRedoService.undoChange(_sampleStory);
      expect(
        _sampleStory.getStoryContents().getNodes()[0].getPrerequisiteSkillIds()
      ).toEqual(['skill_1']);
    }
  );

  it('should create a proper backend change dict for removing a prerequisite ' +
    'skill id from a node',
  function() {
    StoryUpdateService.removePrerequisiteSkillIdFromNode(
      _sampleStory, 'node_1', 'skill_1');
    expect(UndoRedoService.getCommittableChangeList()).toEqual([{
      cmd: 'update_story_node_property',
      property_name: 'prerequisite_skill_ids',
      new_value: [],
      old_value: ['skill_1'],
      node_id: 'node_1'
    }]);
  });

  it('should remove/add an acquired skill id from/to a node in the story',
    function() {
      expect(
        _sampleStory.getStoryContents().getNodes()[0].getAcquiredSkillIds()
      ).toEqual(['skill_2']);
      StoryUpdateService.removeAcquiredSkillIdFromNode(
        _sampleStory, 'node_1', 'skill_2');
      expect(
        _sampleStory.getStoryContents().getNodes()[0].getAcquiredSkillIds()
      ).toEqual([]);

      UndoRedoService.undoChange(_sampleStory);
      expect(
        _sampleStory.getStoryContents().getNodes()[0].getAcquiredSkillIds()
      ).toEqual(['skill_2']);
    }
  );

  it('should create a proper backend change dict for removing an acquired ' +
    'skill id from a node',
  function() {
    StoryUpdateService.removeAcquiredSkillIdFromNode(
      _sampleStory, 'node_1', 'skill_2');
    expect(UndoRedoService.getCommittableChangeList()).toEqual([{
      cmd: 'update_story_node_property',
      property_name: 'acquired_skill_ids',
      new_value: [],
      old_value: ['skill_2'],
      node_id: 'node_1'
    }]);
  });

  it('should remove/add a destination node id from/to a node in the story',
    function() {
      expect(
        _sampleStory.getStoryContents().getNodes()[1].getDestinationNodeIds()
      ).toEqual(['node_1']);
      StoryUpdateService.removeDestinationNodeIdFromNode(
        _sampleStory, 'node_2', 'node_1');

      expect(
        _sampleStory.getStoryContents().getNodes()[1].getDestinationNodeIds()
      ).toEqual([]);

      UndoRedoService.undoChange(_sampleStory);
      expect(
        _sampleStory.getStoryContents().getNodes()[1].getDestinationNodeIds()
      ).toEqual(['node_1']);
    }
  );

  it('should create a proper backend change dict for removing a destination ' +
    'node id from a node',
  function() {
    StoryUpdateService.removeDestinationNodeIdFromNode(
      _sampleStory, 'node_2', 'node_1');
    expect(UndoRedoService.getCommittableChangeList()).toEqual([{
      cmd: 'update_story_node_property',
      property_name: 'destination_node_ids',
      new_value: [],
      old_value: ['node_1'],
      node_id: 'node_2'
    }]);
  });

  it('should add/remove a story node', function() {
    expect(_sampleStory.getStoryContents().getNodes().length).toEqual(2);
    StoryUpdateService.addStoryNode(_sampleStory, 'Title 2');
    expect(_sampleStory.getStoryContents().getNodes().length).toEqual(3);
    expect(_sampleStory.getStoryContents().getNextNodeId()).toEqual('node_4');
    expect(
      _sampleStory.getStoryContents().getNodes()[2].getId()).toEqual('node_3');
    expect(
      _sampleStory.getStoryContents().getNodes()[2].getTitle()).toEqual(
      'Title 2');

    UndoRedoService.undoChange(_sampleStory);
    expect(_sampleStory.getStoryContents().getNodes().length).toEqual(2);
  });

  it('should create a proper backend change dict for adding a story node',
    function() {
      StoryUpdateService.addStoryNode(_sampleStory, 'Title 2');
      expect(UndoRedoService.getCommittableChangeList()).toEqual([{
        cmd: 'add_story_node',
        node_id: 'node_3',
        title: 'Title 2'
      }]);
    }
  );

  it('should remove/add a story node', function() {
    expect(function() {
      StoryUpdateService.deleteStoryNode(_sampleStory, 'node_2');
    }).toThrowError('Cannot delete initial story node');
    expect(_sampleStory.getStoryContents().getNodes().length).toEqual(2);
    expect(
      _sampleStory.getStoryContents().getNodes()[1].getDestinationNodeIds()
    ).toEqual(['node_1']);
    StoryUpdateService.deleteStoryNode(_sampleStory, 'node_1');
    // Initial node should not be deleted.
    StoryUpdateService.deleteStoryNode(_sampleStory, 'node_2');
    expect(_sampleStory.getStoryContents().getInitialNodeId()).toEqual(null);
    expect(_sampleStory.getStoryContents().getNodes().length).toEqual(0);

    expect(function() {
      UndoRedoService.undoChange(_sampleStory);
    }).toThrowError('A deleted story node cannot be restored.');
  });

  it('should create a proper backend change dict for removing a story node',
    function() {
      StoryUpdateService.deleteStoryNode(_sampleStory, 'node_1');
      expect(UndoRedoService.getCommittableChangeList()).toEqual([{
        cmd: 'delete_story_node',
        node_id: 'node_1'
      }]);
    }
  );

  it('should finalize a story node outline', function() {
    expect(
      _sampleStory.getStoryContents().getNodes()[0].getOutlineStatus()
    ).toBe(false);
    StoryUpdateService.finalizeStoryNodeOutline(_sampleStory, 'node_1');
    expect(
      _sampleStory.getStoryContents().getNodes()[0].getOutlineStatus()
    ).toBe(true);

    UndoRedoService.undoChange(_sampleStory);
    expect(
      _sampleStory.getStoryContents().getNodes()[0].getOutlineStatus()
    ).toBe(false);
  });

  it('should create a proper backend change dict for finalizing a node outline',
    function() {
      StoryUpdateService.finalizeStoryNodeOutline(_sampleStory, 'node_1');
      expect(UndoRedoService.getCommittableChangeList()).toEqual([{
        cmd: 'update_story_node_outline_status',
        new_value: true,
        old_value: false,
        node_id: 'node_1'
      }]);
    }
  );

  it('should unfinalize a story node outline', function() {
    expect(
      _sampleStory.getStoryContents().getNodes()[1].getOutlineStatus()
    ).toBe(true);
    StoryUpdateService.unfinalizeStoryNodeOutline(_sampleStory, 'node_2');
    expect(
      _sampleStory.getStoryContents().getNodes()[1].getOutlineStatus()
    ).toBe(false);

    UndoRedoService.undoChange(_sampleStory);
    expect(
      _sampleStory.getStoryContents().getNodes()[1].getOutlineStatus()
    ).toBe(true);
  });

  it('should create a proper backend change dict for unfinalizing a node ' +
    'outline', function() {
    StoryUpdateService.unfinalizeStoryNodeOutline(_sampleStory, 'node_2');
    expect(UndoRedoService.getCommittableChangeList()).toEqual([{
      cmd: 'update_story_node_outline_status',
      new_value: false,
      old_value: true,
      node_id: 'node_2'
    }]);
  });

  it('should set a story node outline', function() {
    expect(
      _sampleStory.getStoryContents().getNodes()[0].getOutline()
    ).toBe('Outline');
    StoryUpdateService.setStoryNodeOutline(
      _sampleStory, 'node_1', 'new outline');
    expect(
      _sampleStory.getStoryContents().getNodes()[0].getOutline()
    ).toBe('new outline');

    UndoRedoService.undoChange(_sampleStory);
    expect(
      _sampleStory.getStoryContents().getNodes()[0].getOutline()
    ).toBe('Outline');
  });

  it('should create a proper backend change dict for setting a node outline',
    function() {
      StoryUpdateService.setStoryNodeOutline(
        _sampleStory, 'node_1', 'new outline');
      expect(UndoRedoService.getCommittableChangeList()).toEqual([{
        cmd: 'update_story_node_property',
        property_name: 'outline',
        new_value: 'new outline',
        old_value: 'Outline',
        node_id: 'node_1'
      }]);
    }
  );

  it('should set a story node title', function() {
    expect(
      _sampleStory.getStoryContents().getNodes()[0].getTitle()
    ).toBe('Title 1');
    StoryUpdateService.setStoryNodeTitle(
      _sampleStory, 'node_1', 'new title');
    expect(
      _sampleStory.getStoryContents().getNodes()[0].getTitle()
    ).toBe('new title');

    UndoRedoService.undoChange(_sampleStory);
    expect(
      _sampleStory.getStoryContents().getNodes()[0].getTitle()
    ).toBe('Title 1');
  });

  it('should create a proper backend change dict for setting a node title',
    function() {
      StoryUpdateService.setStoryNodeTitle(
        _sampleStory, 'node_1', 'new title');
      expect(UndoRedoService.getCommittableChangeList()).toEqual([{
        cmd: 'update_story_node_property',
        property_name: 'title',
        new_value: 'new title',
        old_value: 'Title 1',
        node_id: 'node_1'
      }]);
    }
  );

  it('should set a story node description', function() {
    expect(
      _sampleStory.getStoryContents().getNodes()[0].getDescription()
    ).toBe('Description 1');
    StoryUpdateService.setStoryNodeDescription(
      _sampleStory, 'node_1', 'new description');
    expect(
      _sampleStory.getStoryContents().getNodes()[0].getDescription()
    ).toBe('new description');

    UndoRedoService.undoChange(_sampleStory);
    expect(
      _sampleStory.getStoryContents().getNodes()[0].getDescription()
    ).toBe('Description 1');
  });

  it('should create a backend change dict for setting a node description',
    function() {
      StoryUpdateService.setStoryNodeDescription(
        _sampleStory, 'node_1', 'new description');
      expect(UndoRedoService.getCommittableChangeList()).toEqual([{
        cmd: 'update_story_node_property',
        property_name: 'description',
        new_value: 'new description',
        old_value: 'Description 1',
        node_id: 'node_1'
      }]);
    }
  );

  it('should set the exploration id of a story node', function() {
    expect(
      _sampleStory.getStoryContents().getNodes()[0].getExplorationId()
    ).toBe(null);
    StoryUpdateService.setStoryNodeExplorationId(
      _sampleStory, 'node_1', 'exp_2');
    expect(
      _sampleStory.getStoryContents().getNodes()[0].getExplorationId()
    ).toBe('exp_2');

    // Adding an already existing exploration in the story should throw an
    // error.
    expect(function() {
      StoryUpdateService.setStoryNodeExplorationId(
        _sampleStory, 'node_1', 'exp_1');
    }).toThrowError('The given exploration already exists in the story.');

    UndoRedoService.undoChange(_sampleStory);
    expect(
      _sampleStory.getStoryContents().getNodes()[0].getExplorationId()
    ).toBe(null);
  });

  it('should create a proper backend change dict for setting the exploration ' +
    'id of a node', function() {
    StoryUpdateService.setStoryNodeExplorationId(
      _sampleStory, 'node_1', 'exp_2');
    expect(UndoRedoService.getCommittableChangeList()).toEqual([{
      cmd: 'update_story_node_property',
      property_name: 'exploration_id',
      new_value: 'exp_2',
      old_value: null,
      node_id: 'node_1'
    }]);
  });

  it('should set/unset the initial node of the story', function() {
    expect(
      _sampleStory.getStoryContents().getInitialNodeId()).toEqual('node_2');
    StoryUpdateService.setInitialNodeId(_sampleStory, 'node_1');
    expect(
      _sampleStory.getStoryContents().getInitialNodeId()).toEqual('node_1');

    UndoRedoService.undoChange(_sampleStory);
    expect(
      _sampleStory.getStoryContents().getInitialNodeId()).toEqual('node_2');
  });

  it('should create a proper backend change dict for setting initial node',
    function() {
      StoryUpdateService.setInitialNodeId(_sampleStory, 'node_1');
      expect(UndoRedoService.getCommittableChangeList()).toEqual([{
        cmd: 'update_story_contents_property',
        property_name: 'initial_node_id',
        new_value: 'node_1',
        old_value: 'node_2'
      }]);
    }
  );

  it('should set/unset changes to a story\'s title', function() {
    expect(_sampleStory.getTitle()).toEqual('Story title');
    StoryUpdateService.setStoryTitle(_sampleStory, 'new title');
    expect(_sampleStory.getTitle()).toEqual('new title');

    UndoRedoService.undoChange(_sampleStory);
    expect(_sampleStory.getTitle()).toEqual('Story title');
  });

  it('should create a proper backend change dict for changing title',
    function() {
      StoryUpdateService.setStoryTitle(_sampleStory, 'new title');
      expect(UndoRedoService.getCommittableChangeList()).toEqual([{
        cmd: 'update_story_property',
        property_name: 'title',
        new_value: 'new title',
        old_value: 'Story title'
      }]);
    }
  );

  it('should set/unset changes to a story\'s description', function() {
    expect(_sampleStory.getDescription()).toEqual('Story description');
    StoryUpdateService.setStoryDescription(_sampleStory, 'new description');
    expect(_sampleStory.getDescription()).toEqual('new description');

    UndoRedoService.undoChange(_sampleStory);
    expect(_sampleStory.getDescription()).toEqual('Story description');
  });

  it('should create a proper backend change dict for changing descriptions',
    function() {
      StoryUpdateService.setStoryDescription(_sampleStory, 'new description');
      expect(UndoRedoService.getCommittableChangeList()).toEqual([{
        cmd: 'update_story_property',
        property_name: 'description',
        new_value: 'new description',
        old_value: 'Story description'
      }]);
    }
  );

  it('should set/unset changes to a story\'s notes', function() {
    expect(_sampleStory.getNotes()).toEqual('Story notes');
    StoryUpdateService.setStoryNotes(_sampleStory, 'new notes');
    expect(_sampleStory.getNotes()).toEqual('new notes');

    UndoRedoService.undoChange(_sampleStory);
    expect(_sampleStory.getNotes()).toEqual('Story notes');
  });

  it('should create a proper backend change dict for changing notes',
    function() {
      StoryUpdateService.setStoryNotes(_sampleStory, 'new notes');
      expect(UndoRedoService.getCommittableChangeList()).toEqual([{
        cmd: 'update_story_property',
        property_name: 'notes',
        new_value: 'new notes',
        old_value: 'Story notes'
      }]);
    }
  );

  it('should set/unset changes to a story\'s language code', function() {
    expect(_sampleStory.getLanguageCode()).toEqual('en');
    StoryUpdateService.setStoryLanguageCode(_sampleStory, 'fi');
    expect(_sampleStory.getLanguageCode()).toEqual('fi');

    UndoRedoService.undoChange(_sampleStory);
    expect(_sampleStory.getLanguageCode()).toEqual('en');
  });

  it('should create a proper backend change dict for changing language codes',
    function() {
      StoryUpdateService.setStoryLanguageCode(_sampleStory, 'fi');
      expect(UndoRedoService.getCommittableChangeList()).toEqual([{
        cmd: 'update_story_property',
        property_name: 'language_code',
        new_value: 'fi',
        old_value: 'en'
      }]);
    }
  );
});
