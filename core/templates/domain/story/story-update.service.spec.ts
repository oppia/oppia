// Copyright 2021 The Oppia Authors. All Rights Reserved.
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

import { HttpClientTestingModule } from
  '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { Story } from 'domain/story/story.model';
import { StoryUpdateService } from 'domain/story/story-update.service';
import { UndoRedoService } from 'domain/editor/undo_redo/undo-redo.service';
import { EntityEditorBrowserTabsInfo } from 'domain/entity_editor_browser_tabs_info/entity-editor-browser-tabs-info.model';
import { LocalStorageService } from 'services/local-storage.service';
import { PlatformFeatureService } from '../../services/platform-feature.service';

class MockPlatformFeatureService {
  status = {
    SerialChapterLaunchCurriculumAdminView: {
      isEnabled: false
    }
  };
}

describe('Story update service', () => {
  let storyUpdateService: StoryUpdateService;
  let undoRedoService: UndoRedoService;
  let localStorageService: LocalStorageService;
  let _sampleStory: Story;
  let mockPlatformFeatureService = new MockPlatformFeatureService();

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        {
          provide: PlatformFeatureService,
          useValue: mockPlatformFeatureService
        },
      ]
    });

    storyUpdateService = TestBed.inject(StoryUpdateService);
    undoRedoService = TestBed.inject(UndoRedoService);
    localStorageService = TestBed.inject(LocalStorageService);

    let sampleStoryBackendObject = {
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
            exploration_id: 'exp_id',
            outline_is_finalized: false,
            thumbnail_filename: 'fileName',
            thumbnail_bg_color: 'blue',
            status: 'Published',
            planned_publication_date_msecs: 30,
            last_modified_msecs: 40,
            first_publication_date_msecs: 20,
            unpublishing_reason: null
          }, {
            id: 'node_2',
            title: 'Title 2',
            description: 'Description 2',
            prerequisite_skill_ids: ['skill_3'],
            acquired_skill_ids: ['skill_4'],
            destination_node_ids: ['node_1'],
            outline: 'Outline 2',
            exploration_id: 'exp_1',
            outline_is_finalized: true,
            thumbnail_filename: 'fileName',
            thumbnail_bg_color: 'blue',
            status: 'Draft',
            planned_publication_date_msecs: 10,
            last_modified_msecs: 50,
            first_publication_date_msecs: 10,
            unpublishing_reason: 'Bad Content'
          }],
        next_node_id: 'node_3'
      },
      language_code: 'en',
      thumbnail_filename: 'fileName',
      thumbnail_bg_color: 'blue',
      url_fragment: 'url',
      meta_tag_content: 'meta'
    };

    spyOn(storyUpdateService.onStoryChapterUpdateEventEmitter, 'emit')
      .and.stub();

    _sampleStory = Story.createFromBackendDict(
      sampleStoryBackendObject);
  });

  it('should add/remove a prerequisite skill id to/from a node in the story',
    () => {
      let storyNodeLastModifiedSpy = spyOn(
        storyUpdateService, 'setStoryNodeLastModifiedMsecs');
      expect(
        _sampleStory.getStoryContents().getNodes()[0].getPrerequisiteSkillIds()
      ).toEqual(['skill_1']);
      storyUpdateService.addPrerequisiteSkillIdToNode(
        _sampleStory, 'node_1', 'skill_3');
      expect(
        _sampleStory.getStoryContents().getNodes()[0].getPrerequisiteSkillIds()
      ).toEqual(['skill_1', 'skill_3']);
      expect(storyUpdateService.onStoryChapterUpdateEventEmitter.emit)
        .toHaveBeenCalled();
      expect(storyNodeLastModifiedSpy)
        .toHaveBeenCalled();

      undoRedoService.undoChange(_sampleStory);
      expect(
        _sampleStory.getStoryContents().getNodes()[0].getPrerequisiteSkillIds()
      ).toEqual(['skill_1']);
    }
  );

  it('should create a proper backend change dict for adding a prerequisite ' +
    'skill id to a node',
  () => {
    let storyNodeLastModifiedSpy = spyOn(
      storyUpdateService, 'setStoryNodeLastModifiedMsecs');
    storyUpdateService.addPrerequisiteSkillIdToNode(
      _sampleStory, 'node_1', 'skill_3');
    expect(undoRedoService.getCommittableChangeList()).toEqual([{
      cmd: 'update_story_node_property',
      property_name: 'prerequisite_skill_ids',
      new_value: ['skill_1', 'skill_3'],
      old_value: ['skill_1'],
      node_id: 'node_1'
    }]);
    expect(storyNodeLastModifiedSpy)
      .toHaveBeenCalled();
  });

  it('should add/remove an acquired skill id to/from a node in the story',
    () => {
      let storyNodeLastModifiedSpy = spyOn(
        storyUpdateService, 'setStoryNodeLastModifiedMsecs');
      expect(
        _sampleStory.getStoryContents().getNodes()[0].getAcquiredSkillIds()
      ).toEqual(['skill_2']);
      storyUpdateService.addAcquiredSkillIdToNode(
        _sampleStory, 'node_1', 'skill_4');
      expect(
        _sampleStory.getStoryContents().getNodes()[0].getAcquiredSkillIds()
      ).toEqual(['skill_2', 'skill_4']);
      expect(storyUpdateService.onStoryChapterUpdateEventEmitter.emit)
        .toHaveBeenCalled();
      expect(storyNodeLastModifiedSpy)
        .toHaveBeenCalled();

      undoRedoService.undoChange(_sampleStory);
      expect(
        _sampleStory.getStoryContents().getNodes()[0].getAcquiredSkillIds()
      ).toEqual(['skill_2']);
    }
  );

  it('should create a proper backend change dict for adding an acquired ' +
    'skill id to a node',
  () => {
    let storyNodeLastModifiedSpy = spyOn(
      storyUpdateService, 'setStoryNodeLastModifiedMsecs');
    storyUpdateService.addAcquiredSkillIdToNode(
      _sampleStory, 'node_1', 'skill_4');
    expect(undoRedoService.getCommittableChangeList()).toEqual([{
      cmd: 'update_story_node_property',
      property_name: 'acquired_skill_ids',
      new_value: ['skill_2', 'skill_4'],
      old_value: ['skill_2'],
      node_id: 'node_1'
    }]);
    expect(storyNodeLastModifiedSpy)
      .toHaveBeenCalled();
  });

  it('should add/remove a destination node id to/from a node in the story',
    () => {
      expect(
        _sampleStory.getStoryContents().getNodes()[0].getDestinationNodeIds()
      ).toEqual([]);
      storyUpdateService.addDestinationNodeIdToNode(
        _sampleStory, 'node_1', 'node_2');

      // Adding an invalid destination node id should throw an error.
      expect(() => {
        storyUpdateService.addDestinationNodeIdToNode(
          _sampleStory, 'node_1', 'node_5');
      }).toThrowError('The destination node with given id doesn\'t exist');

      expect(
        _sampleStory.getStoryContents().getNodes()[0].getDestinationNodeIds()
      ).toEqual(['node_2']);

      undoRedoService.undoChange(_sampleStory);
      expect(
        _sampleStory.getStoryContents().getNodes()[0].getDestinationNodeIds()
      ).toEqual([]);
    }
  );

  it('should create a proper backend change dict for adding a destination ' +
    'node id to a node',
  () => {
    storyUpdateService.addDestinationNodeIdToNode(
      _sampleStory, 'node_1', 'node_2');
    expect(undoRedoService.getCommittableChangeList()).toEqual([{
      cmd: 'update_story_node_property',
      property_name: 'destination_node_ids',
      new_value: ['node_2'],
      old_value: [],
      node_id: 'node_1'
    }]);
  });

  it('should remove/add a prerequisite skill id from/to a node in the story',
    () => {
      let storyNodeLastModifiedSpy = spyOn(
        storyUpdateService, 'setStoryNodeLastModifiedMsecs');
      expect(
        _sampleStory.getStoryContents().getNodes()[0].getPrerequisiteSkillIds()
      ).toEqual(['skill_1']);
      storyUpdateService.removePrerequisiteSkillIdFromNode(
        _sampleStory, 'node_1', 'skill_1');
      expect(
        _sampleStory.getStoryContents().getNodes()[0].getPrerequisiteSkillIds()
      ).toEqual([]);
      expect(storyUpdateService.onStoryChapterUpdateEventEmitter.emit)
        .toHaveBeenCalled();
      expect(storyNodeLastModifiedSpy)
        .toHaveBeenCalled();

      undoRedoService.undoChange(_sampleStory);
      expect(
        _sampleStory.getStoryContents().getNodes()[0].getPrerequisiteSkillIds()
      ).toEqual(['skill_1']);
    }
  );

  it('should not remove a prerequisite skill ' +
    'from a node if given id is invalid', () => {
    expect(
      _sampleStory.getStoryContents().getNodes()[0].getPrerequisiteSkillIds()
    ).toEqual(['skill_1']);

    expect(() => {
      storyUpdateService.removePrerequisiteSkillIdFromNode(
        _sampleStory, 'node_1', 'invalid_Id');
    }).toThrowError('The given prerequisite skill is not part of the node');

    expect(
      _sampleStory.getStoryContents().getNodes()[0].getPrerequisiteSkillIds()
    ).toEqual(['skill_1']);
  });

  it('should create a proper backend change dict for removing a prerequisite ' +
    'skill id from a node',
  () => {
    let storyNodeLastModifiedSpy = spyOn(
      storyUpdateService, 'setStoryNodeLastModifiedMsecs');
    storyUpdateService.removePrerequisiteSkillIdFromNode(
      _sampleStory, 'node_1', 'skill_1');
    expect(undoRedoService.getCommittableChangeList()).toEqual([{
      cmd: 'update_story_node_property',
      property_name: 'prerequisite_skill_ids',
      new_value: [],
      old_value: ['skill_1'],
      node_id: 'node_1'
    }]);
    expect(storyNodeLastModifiedSpy)
      .toHaveBeenCalled();
  });

  it('should remove/add an acquired skill id from/to a node in the story',
    () => {
      let storyNodeLastModifiedSpy = spyOn(
        storyUpdateService, 'setStoryNodeLastModifiedMsecs');
      expect(
        _sampleStory.getStoryContents().getNodes()[0].getAcquiredSkillIds()
      ).toEqual(['skill_2']);
      storyUpdateService.removeAcquiredSkillIdFromNode(
        _sampleStory, 'node_1', 'skill_2');
      expect(
        _sampleStory.getStoryContents().getNodes()[0].getAcquiredSkillIds()
      ).toEqual([]);
      expect(storyNodeLastModifiedSpy)
        .toHaveBeenCalled();

      undoRedoService.undoChange(_sampleStory);
      expect(
        _sampleStory.getStoryContents().getNodes()[0].getAcquiredSkillIds()
      ).toEqual(['skill_2']);
    }
  );

  it('should not remove an acquired skill id ' +
    'from a node if given id is invalid', () => {
    expect(
      _sampleStory.getStoryContents().getNodes()[0].getAcquiredSkillIds()
    ).toEqual(['skill_2']);

    expect(() => {
      storyUpdateService.removeAcquiredSkillIdFromNode(
        _sampleStory, 'node_1', 'invalid_Id');
    }).toThrowError('The given acquired skill id is not part of the node');

    expect(
      _sampleStory.getStoryContents().getNodes()[0].getAcquiredSkillIds()
    ).toEqual(['skill_2']);
  });

  it('should create a proper backend change dict for removing an acquired ' +
    'skill id from a node',
  () => {
    let storyNodeLastModifiedSpy = spyOn(
      storyUpdateService, 'setStoryNodeLastModifiedMsecs');
    storyUpdateService.removeAcquiredSkillIdFromNode(
      _sampleStory, 'node_1', 'skill_2');
    expect(undoRedoService.getCommittableChangeList()).toEqual([{
      cmd: 'update_story_node_property',
      property_name: 'acquired_skill_ids',
      new_value: [],
      old_value: ['skill_2'],
      node_id: 'node_1'
    }]);
    expect(storyNodeLastModifiedSpy)
      .toHaveBeenCalled();
  });

  it('should remove/add a destination node id from/to a node in the story',
    () => {
      let storyNodeLastModifiedSpy = spyOn(
        storyUpdateService, 'setStoryNodeLastModifiedMsecs');
      expect(
        _sampleStory.getStoryContents().getNodes()[1].getDestinationNodeIds()
      ).toEqual(['node_1']);
      storyUpdateService.removeDestinationNodeIdFromNode(
        _sampleStory, 'node_2', 'node_1');
      expect(storyNodeLastModifiedSpy)
        .toHaveBeenCalled();

      expect(
        _sampleStory.getStoryContents().getNodes()[1].getDestinationNodeIds()
      ).toEqual([]);

      undoRedoService.undoChange(_sampleStory);
      expect(
        _sampleStory.getStoryContents().getNodes()[1].getDestinationNodeIds()
      ).toEqual(['node_1']);
    }
  );

  it('should not remove a destination node id from a node in the story ' +
    'if given id is invalid', () => {
    expect(
      _sampleStory.getStoryContents().getNodes()[1].getDestinationNodeIds()
    ).toEqual(['node_1']);

    expect(() => {
      storyUpdateService.removeDestinationNodeIdFromNode(
        _sampleStory, 'node_2', 'invalid_node2');
    }).toThrowError('The given destination node is not part of the node');

    expect(() => {
      storyUpdateService.removeDestinationNodeIdFromNode(
        _sampleStory, 'invalid_node1', 'invalid_node2');
    }).toThrowError('The given node doesn\'t exist');

    expect(
      _sampleStory.getStoryContents().getNodes()[1].getDestinationNodeIds()
    ).toEqual(['node_1']);
  });

  it('should create a proper backend change dict for removing a destination ' +
    'node id from a node',
  () => {
    let storyNodeLastModifiedSpy = spyOn(
      storyUpdateService, 'setStoryNodeLastModifiedMsecs');
    storyUpdateService.removeDestinationNodeIdFromNode(
      _sampleStory, 'node_2', 'node_1');
    expect(undoRedoService.getCommittableChangeList()).toEqual([{
      cmd: 'update_story_node_property',
      property_name: 'destination_node_ids',
      new_value: [],
      old_value: ['node_1'],
      node_id: 'node_2'
    }]);
    expect(storyNodeLastModifiedSpy)
      .toHaveBeenCalled();
  });

  it('should add/remove a story node', () => {
    expect(_sampleStory.getStoryContents().getNodes().length).toEqual(2);
    storyUpdateService.addStoryNode(_sampleStory, 'Title 2');
    expect(_sampleStory.getStoryContents().getNodes().length).toEqual(3);
    expect(_sampleStory.getStoryContents().getNextNodeId()).toEqual('node_4');
    expect(
      _sampleStory.getStoryContents().getNodes()[2].getId()).toEqual('node_3');
    expect(
      _sampleStory.getStoryContents().getNodes()[2].getTitle()).toEqual(
      'Title 2');

    undoRedoService.undoChange(_sampleStory);
    expect(_sampleStory.getStoryContents().getNodes().length).toEqual(2);
  });

  it('should create a proper backend change dict for adding a story node',
    () => {
      storyUpdateService.addStoryNode(_sampleStory, 'Title 2');
      expect(undoRedoService.getCommittableChangeList()).toEqual([{
        cmd: 'add_story_node',
        node_id: 'node_3',
        title: 'Title 2'
      }]);
    }
  );

  it('should remove/add a story node', () => {
    expect(() => {
      storyUpdateService.deleteStoryNode(_sampleStory, 'node_2');
    }).toThrowError('Cannot delete initial story node');
    expect(_sampleStory.getStoryContents().getNodes().length).toEqual(2);
    expect(
      _sampleStory.getStoryContents().getNodes()[1].getDestinationNodeIds()
    ).toEqual(['node_1']);
    storyUpdateService.deleteStoryNode(_sampleStory, 'node_1');
    // Initial node should not be deleted.
    storyUpdateService.deleteStoryNode(_sampleStory, 'node_2');
    expect(_sampleStory.getStoryContents().getInitialNodeId()).toEqual(null);
    expect(_sampleStory.getStoryContents().getNodes().length).toEqual(0);

    expect(() => {
      undoRedoService.undoChange(_sampleStory);
    }).toThrowError('A deleted story node cannot be restored.');
  });

  it('should create a proper backend change dict for removing a story node',
    () => {
      storyUpdateService.deleteStoryNode(_sampleStory, 'node_1');
      expect(undoRedoService.getCommittableChangeList()).toEqual([{
        cmd: 'delete_story_node',
        node_id: 'node_1'
      }]);
    }
  );

  it('should finalize a story node outline', () => {
    let storyNodeLastModifiedSpy = spyOn(
      storyUpdateService, 'setStoryNodeLastModifiedMsecs');
    expect(
      _sampleStory.getStoryContents().getNodes()[0].getOutlineStatus()
    ).toBe(false);
    storyUpdateService.finalizeStoryNodeOutline(_sampleStory, 'node_1');
    expect(
      _sampleStory.getStoryContents().getNodes()[0].getOutlineStatus()
    ).toBe(true);

    expect(storyUpdateService.onStoryChapterUpdateEventEmitter.emit)
      .toHaveBeenCalled();
    expect(storyNodeLastModifiedSpy)
      .toHaveBeenCalled();
    undoRedoService.undoChange(_sampleStory);
    expect(
      _sampleStory.getStoryContents().getNodes()[0].getOutlineStatus()
    ).toBe(false);
  });

  it('should throw an error if we try to finalize a story ' +
    'which is already finalized', () => {
    storyUpdateService.finalizeStoryNodeOutline(_sampleStory, 'node_1');
    expect(() => {
      storyUpdateService.finalizeStoryNodeOutline(_sampleStory, 'node_1');
    }).toThrowError('Node outline is already finalized.');
  });

  it('should create a proper backend change dict for finalizing a node outline',
    () => {
      let storyNodeLastModifiedSpy = spyOn(
        storyUpdateService, 'setStoryNodeLastModifiedMsecs');
      storyUpdateService.finalizeStoryNodeOutline(_sampleStory, 'node_1');
      expect(undoRedoService.getCommittableChangeList()).toEqual([{
        cmd: 'update_story_node_outline_status',
        new_value: true,
        old_value: false,
        node_id: 'node_1'
      }]);
      expect(storyNodeLastModifiedSpy)
        .toHaveBeenCalled();
    }
  );

  it('should unfinalize a story node outline', () => {
    let storyNodeLastModifiedSpy = spyOn(
      storyUpdateService, 'setStoryNodeLastModifiedMsecs');
    expect(
      _sampleStory.getStoryContents().getNodes()[1].getOutlineStatus()
    ).toBe(true);
    storyUpdateService.unfinalizeStoryNodeOutline(_sampleStory, 'node_2');
    expect(
      _sampleStory.getStoryContents().getNodes()[1].getOutlineStatus()
    ).toBe(false);
    expect(storyUpdateService.onStoryChapterUpdateEventEmitter.emit)
      .toHaveBeenCalled();
    expect(storyNodeLastModifiedSpy)
      .toHaveBeenCalled();

    undoRedoService.undoChange(_sampleStory);
    expect(
      _sampleStory.getStoryContents().getNodes()[1].getOutlineStatus()
    ).toBe(true);
  });

  it('should throw an error if we try to unfinalize a story ' +
    'with an invalid story node', () => {
    expect(() => {
      storyUpdateService.unfinalizeStoryNodeOutline(_sampleStory, 'node_1');
    }).toThrowError('Node outline is already not finalized.');
  });

  it('should create a proper backend change dict for unfinalizing a node ' +
    'outline', () => {
    let storyNodeLastModifiedSpy = spyOn(
      storyUpdateService, 'setStoryNodeLastModifiedMsecs');
    storyUpdateService.unfinalizeStoryNodeOutline(_sampleStory, 'node_2');
    expect(undoRedoService.getCommittableChangeList()).toEqual([{
      cmd: 'update_story_node_outline_status',
      new_value: false,
      old_value: true,
      node_id: 'node_2'
    }]);
    expect(storyNodeLastModifiedSpy)
      .toHaveBeenCalled();
  });

  it('should set a story node outline', () => {
    let storyNodeLastModifiedSpy = spyOn(
      storyUpdateService, 'setStoryNodeLastModifiedMsecs');
    expect(
      _sampleStory.getStoryContents().getNodes()[0].getOutline()
    ).toBe('Outline');
    storyUpdateService.setStoryNodeOutline(
      _sampleStory, 'node_1', 'new outline');
    expect(
      _sampleStory.getStoryContents().getNodes()[0].getOutline()
    ).toBe('new outline');
    expect(storyNodeLastModifiedSpy)
      .toHaveBeenCalled();

    undoRedoService.undoChange(_sampleStory);
    expect(
      _sampleStory.getStoryContents().getNodes()[0].getOutline()
    ).toBe('Outline');
  });

  it('should create a proper backend change dict for setting a node outline',
    () => {
      let storyNodeLastModifiedSpy = spyOn(
        storyUpdateService, 'setStoryNodeLastModifiedMsecs');
      storyUpdateService.setStoryNodeOutline(
        _sampleStory, 'node_1', 'new outline');
      expect(undoRedoService.getCommittableChangeList()).toEqual([{
        cmd: 'update_story_node_property',
        property_name: 'outline',
        new_value: 'new outline',
        old_value: 'Outline',
        node_id: 'node_1'
      }]);
      expect(storyNodeLastModifiedSpy)
        .toHaveBeenCalled();
    }
  );

  it('should set a story node title', () => {
    let storyNodeLastModifiedSpy = spyOn(
      storyUpdateService, 'setStoryNodeLastModifiedMsecs');
    expect(
      _sampleStory.getStoryContents().getNodes()[0].getTitle()
    ).toBe('Title 1');
    storyUpdateService.setStoryNodeTitle(
      _sampleStory, 'node_1', 'new title');
    expect(
      _sampleStory.getStoryContents().getNodes()[0].getTitle()
    ).toBe('new title');
    expect(storyNodeLastModifiedSpy)
      .toHaveBeenCalled();

    undoRedoService.undoChange(_sampleStory);
    expect(
      _sampleStory.getStoryContents().getNodes()[0].getTitle()
    ).toBe('Title 1');
  });

  it('should create a proper backend change dict for setting a node title',
    () => {
      let storyNodeLastModifiedSpy = spyOn(
        storyUpdateService, 'setStoryNodeLastModifiedMsecs');
      storyUpdateService.setStoryNodeTitle(
        _sampleStory, 'node_1', 'new title');
      expect(undoRedoService.getCommittableChangeList()).toEqual([{
        cmd: 'update_story_node_property',
        property_name: 'title',
        new_value: 'new title',
        old_value: 'Title 1',
        node_id: 'node_1'
      }]);
      expect(storyNodeLastModifiedSpy)
        .toHaveBeenCalled();
    }
  );

  it('should set a story node status', () => {
    let storyNodeLastModifiedSpy = spyOn(
      storyUpdateService, 'setStoryNodeLastModifiedMsecs');
    expect(
      _sampleStory.getStoryContents().getNodes()[0].getStatus()
    ).toBe('Published');
    storyUpdateService.setStoryNodeStatus(
      _sampleStory, 'node_1', 'Draft');
    expect(
      _sampleStory.getStoryContents().getNodes()[0].getStatus()
    ).toBe('Draft');
    expect(storyNodeLastModifiedSpy)
      .toHaveBeenCalled();

    undoRedoService.undoChange(_sampleStory);

    expect(
      _sampleStory.getStoryContents().getNodes()[0].getStatus()
    ).toBe('Published');
  });

  it('should set a story node planned publication date', () => {
    let storyNodeLastModifiedSpy = spyOn(
      storyUpdateService, 'setStoryNodeLastModifiedMsecs');
    expect(
      _sampleStory.getStoryContents().getNodes()[
        0].getPlannedPublicationDateMsecs()
    ).toBe(30);
    storyUpdateService.setStoryNodePlannedPublicationDateMsecs(
      _sampleStory, 'node_1', 40);
    expect(
      _sampleStory.getStoryContents().getNodes()[
        0].getPlannedPublicationDateMsecs()
    ).toBe(40);
    expect(storyNodeLastModifiedSpy)
      .toHaveBeenCalled();

    undoRedoService.undoChange(_sampleStory);

    expect(
      _sampleStory.getStoryContents().getNodes()[
        0].getPlannedPublicationDateMsecs()
    ).toBe(30);
  });

  it('should set a story node last modified', () => {
    mockPlatformFeatureService.
      status.SerialChapterLaunchCurriculumAdminView.isEnabled = true;
    expect(
      _sampleStory.getStoryContents().getNodes()[0].getLastModifiedMsecs()
    ).toBe(40);
    storyUpdateService.setStoryNodeLastModifiedMsecs(
      _sampleStory, 'node_1', 50);
    expect(
      _sampleStory.getStoryContents().getNodes()[0].getLastModifiedMsecs()
    ).toBe(50);

    undoRedoService.undoChange(_sampleStory);

    expect(
      _sampleStory.getStoryContents().getNodes()[0].getLastModifiedMsecs()
    ).toBe(40);
  });

  it('should set a story node first publication date', () => {
    let storyNodeLastModifiedSpy = spyOn(
      storyUpdateService, 'setStoryNodeLastModifiedMsecs');
    expect(
      _sampleStory.getStoryContents().getNodes()[
        0].getFirstPublicationDateMsecs()
    ).toBe(20);
    storyUpdateService.setStoryNodeFirstPublicationDateMsecs(
      _sampleStory, 'node_1', 30);
    expect(
      _sampleStory.getStoryContents().getNodes()[
        0].getFirstPublicationDateMsecs()
    ).toBe(30);
    expect(storyNodeLastModifiedSpy)
      .toHaveBeenCalled();

    undoRedoService.undoChange(_sampleStory);

    expect(
      _sampleStory.getStoryContents().getNodes()[
        0].getFirstPublicationDateMsecs()
    ).toBe(20);
  });

  it('should set a story node unpublishing reason', () => {
    let storyNodeLastModifiedSpy = spyOn(
      storyUpdateService, 'setStoryNodeLastModifiedMsecs');
    expect(
      _sampleStory.getStoryContents().getNodes()[0].getUnpublishingReason()
    ).toBe(null);
    storyUpdateService.setStoryNodeUnpublishingReason(
      _sampleStory, 'node_1', 'Bad Content');
    expect(
      _sampleStory.getStoryContents().getNodes()[0].getUnpublishingReason()
    ).toBe('Bad Content');
    expect(storyNodeLastModifiedSpy)
      .toHaveBeenCalled();

    undoRedoService.undoChange(_sampleStory);

    expect(
      _sampleStory.getStoryContents().getNodes()[0].getUnpublishingReason()
    ).toBe(null);
  });

  it('should set a story node description', () => {
    let storyNodeLastModifiedSpy = spyOn(
      storyUpdateService, 'setStoryNodeLastModifiedMsecs');
    expect(
      _sampleStory.getStoryContents().getNodes()[0].getDescription()
    ).toBe('Description 1');
    storyUpdateService.setStoryNodeDescription(
      _sampleStory, 'node_1', 'new description');
    expect(
      _sampleStory.getStoryContents().getNodes()[0].getDescription()
    ).toBe('new description');
    expect(storyNodeLastModifiedSpy)
      .toHaveBeenCalled();

    undoRedoService.undoChange(_sampleStory);
    expect(
      _sampleStory.getStoryContents().getNodes()[0].getDescription()
    ).toBe('Description 1');
  });

  it('should create a backend change dict for setting a node description',
    () => {
      let storyNodeLastModifiedSpy = spyOn(
        storyUpdateService, 'setStoryNodeLastModifiedMsecs');
      storyUpdateService.setStoryNodeDescription(
        _sampleStory, 'node_1', 'new description');
      expect(undoRedoService.getCommittableChangeList()).toEqual([{
        cmd: 'update_story_node_property',
        property_name: 'description',
        new_value: 'new description',
        old_value: 'Description 1',
        node_id: 'node_1'
      }]);
      expect(storyNodeLastModifiedSpy)
        .toHaveBeenCalled();
    }
  );

  it('should set the exploration id of a story node', () => {
    let storyNodeLastModifiedSpy = spyOn(
      storyUpdateService, 'setStoryNodeLastModifiedMsecs');
    expect(
      _sampleStory.getStoryContents().getNodes()[0].getExplorationId()
    ).toBe('exp_id');
    storyUpdateService.setStoryNodeExplorationId(
      _sampleStory, 'node_1', 'exp_2');
    expect(
      _sampleStory.getStoryContents().getNodes()[0].getExplorationId()
    ).toBe('exp_2');
    expect(storyNodeLastModifiedSpy)
      .toHaveBeenCalled();

    // Adding an already existing exploration in the story should throw an
    // error.
    expect(() => {
      storyUpdateService.setStoryNodeExplorationId(
        _sampleStory, 'node_1', 'exp_1');
    }).toThrowError('The given exploration already exists in the story.');

    undoRedoService.undoChange(_sampleStory);
    expect(
      _sampleStory.getStoryContents().getNodes()[0].getExplorationId()
    ).toBe('exp_id');
  });

  it('should create a proper backend change dict for setting the exploration ' +
    'id of a node', () => {
    let storyNodeLastModifiedSpy = spyOn(
      storyUpdateService, 'setStoryNodeLastModifiedMsecs');
    storyUpdateService.setStoryNodeExplorationId(
      _sampleStory, 'node_1', 'exp_2');
    expect(undoRedoService.getCommittableChangeList()).toEqual([{
      cmd: 'update_story_node_property',
      property_name: 'exploration_id',
      new_value: 'exp_2',
      old_value: 'exp_id',
      node_id: 'node_1'
    }]);
    expect(storyNodeLastModifiedSpy)
      .toHaveBeenCalled();
  });

  it('should set/unset the initial node of the story', () => {
    expect(
      _sampleStory.getStoryContents().getInitialNodeId()).toEqual('node_2');
    storyUpdateService.setInitialNodeId(_sampleStory, 'node_1');
    expect(
      _sampleStory.getStoryContents().getInitialNodeId()).toEqual('node_1');

    undoRedoService.undoChange(_sampleStory);
    expect(
      _sampleStory.getStoryContents().getInitialNodeId()).toEqual('node_2');
  });

  it('should create a proper backend change dict for setting initial node',
    () => {
      storyUpdateService.setInitialNodeId(_sampleStory, 'node_1');
      expect(undoRedoService.getCommittableChangeList()).toEqual([{
        cmd: 'update_story_contents_property',
        property_name: 'initial_node_id',
        new_value: 'node_1',
        old_value: 'node_2'
      }]);
    }
  );

  it('should set/unset changes to a story\'s title', () => {
    expect(_sampleStory.getTitle()).toEqual('Story title');
    storyUpdateService.setStoryTitle(_sampleStory, 'new title');
    expect(_sampleStory.getTitle()).toEqual('new title');

    undoRedoService.undoChange(_sampleStory);
    expect(_sampleStory.getTitle()).toEqual('Story title');
  });

  it('should create a proper backend change dict for changing title',
    () => {
      storyUpdateService.setStoryTitle(_sampleStory, 'new title');
      expect(undoRedoService.getCommittableChangeList()).toEqual([{
        cmd: 'update_story_property',
        property_name: 'title',
        new_value: 'new title',
        old_value: 'Story title'
      }]);
    }
  );

  it('should set/unset changes to a story\'s description', () => {
    expect(_sampleStory.getDescription()).toEqual('Story description');
    storyUpdateService.setStoryDescription(_sampleStory, 'new description');
    expect(_sampleStory.getDescription()).toEqual('new description');

    undoRedoService.undoChange(_sampleStory);
    expect(_sampleStory.getDescription()).toEqual('Story description');
  });

  it('should create a proper backend change dict for changing descriptions',
    () => {
      storyUpdateService.setStoryDescription(_sampleStory, 'new description');
      expect(undoRedoService.getCommittableChangeList()).toEqual([{
        cmd: 'update_story_property',
        property_name: 'description',
        new_value: 'new description',
        old_value: 'Story description'
      }]);
    }
  );

  it('should set/unset changes to a story\'s notes', () => {
    expect(_sampleStory.getNotes()).toEqual('Story notes');
    storyUpdateService.setStoryNotes(_sampleStory, 'new notes');
    expect(_sampleStory.getNotes()).toEqual('new notes');

    undoRedoService.undoChange(_sampleStory);
    expect(_sampleStory.getNotes()).toEqual('Story notes');
  });

  it('should create a proper backend change dict for changing notes',
    () => {
      storyUpdateService.setStoryNotes(_sampleStory, 'new notes');
      expect(undoRedoService.getCommittableChangeList()).toEqual([{
        cmd: 'update_story_property',
        property_name: 'notes',
        new_value: 'new notes',
        old_value: 'Story notes'
      }]);
    }
  );

  it('should set/unset changes to a story\'s language code', () => {
    expect(_sampleStory.getLanguageCode()).toEqual('en');
    storyUpdateService.setStoryLanguageCode(_sampleStory, 'fi');
    expect(_sampleStory.getLanguageCode()).toEqual('fi');

    undoRedoService.undoChange(_sampleStory);
    expect(_sampleStory.getLanguageCode()).toEqual('en');
  });

  it('should create a proper backend change dict for changing language codes',
    () => {
      storyUpdateService.setStoryLanguageCode(_sampleStory, 'fi');
      expect(undoRedoService.getCommittableChangeList()).toEqual([{
        cmd: 'update_story_property',
        property_name: 'language_code',
        new_value: 'fi',
        old_value: 'en'
      }]);
    }
  );

  it('should rearrange node in story when calling ' +
    '\'rearrangeNodeInStory\'', () => {
    storyUpdateService.rearrangeNodeInStory(
      _sampleStory, 0, 1);
    expect(
      _sampleStory.getStoryContents().getNodes()[0].getId()).toBe('node_2');

    undoRedoService.undoChange(_sampleStory);
    expect(
      _sampleStory.getStoryContents().getNodes()[0].getId()).toBe('node_1');
  });

  it('should set story node thumbnail background color when calling ' +
    '\'setStoryNodeThumbnailBgColor\'', () => {
    let storyNodeLastModifiedSpy = spyOn(
      storyUpdateService, 'setStoryNodeLastModifiedMsecs');
    storyUpdateService.setStoryNodeThumbnailBgColor(
      _sampleStory, 'node_1', 'red');
    expect(_sampleStory.getStoryContents().getNodes()[0].getThumbnailBgColor())
      .toBe('red');
    expect(storyNodeLastModifiedSpy)
      .toHaveBeenCalled();

    undoRedoService.undoChange(_sampleStory);
    expect(_sampleStory.getStoryContents().getNodes()[0].getThumbnailBgColor())
      .toBe('blue');
  });

  it('should set story node thumbnail file name when calling ' +
    '\'setStoryNodeThumbnailFilename\'', () => {
    let storyNodeLastModifiedSpy = spyOn(
      storyUpdateService, 'setStoryNodeLastModifiedMsecs');
    storyUpdateService.setStoryNodeThumbnailFilename(
      _sampleStory, 'node_1', 'newName');
    expect(
      _sampleStory.getStoryContents().getNodes()[0].getThumbnailFilename())
      .toBe('newName');
    expect(storyNodeLastModifiedSpy)
      .toHaveBeenCalled();

    undoRedoService.undoChange(_sampleStory);
    expect(
      _sampleStory.getStoryContents().getNodes()[0].getThumbnailFilename())
      .toBe('fileName');
  });

  it('should set story meta tag content when calling ' +
    '\'setStoryMetaTagContent\'', () => {
    storyUpdateService.setStoryMetaTagContent(
      _sampleStory, 'newTag');
    expect(_sampleStory.getMetaTagContent()).toBe('newTag');

    undoRedoService.undoChange(_sampleStory);
    expect(_sampleStory.getMetaTagContent()).toBe('meta');
  });

  it('should set thumbnail background color when calling ' +
    '\'setThumbnailBgColor\'', () => {
    storyUpdateService.setThumbnailBgColor(
      _sampleStory, 'red');
    expect(_sampleStory.getThumbnailBgColor()).toBe('red');

    undoRedoService.undoChange(_sampleStory);
    expect(_sampleStory.getThumbnailBgColor()).toBe('blue');
  });

  it('should set thumbnail file name when calling ' +
    '\'setThumbnailFilename\'', () => {
    storyUpdateService.setThumbnailFilename(
      _sampleStory, 'newName');
    expect(_sampleStory.getThumbnailFilename()).toBe('newName');

    undoRedoService.undoChange(_sampleStory);
    expect(_sampleStory.getThumbnailFilename()).toBe('fileName');
  });

  it('should set story url fragment when calling ' +
    '\'setStoryUrlFragment\'', () => {
    storyUpdateService.setStoryUrlFragment(
      _sampleStory, 'newUrl');
    expect(_sampleStory.getUrlFragment()).toBe('newUrl');

    undoRedoService.undoChange(_sampleStory);
    expect(_sampleStory.getUrlFragment()).toBe('url');
  });

  it('should update story editor browser tabs unsaved changes status', () => {
    let storyEditorBrowserTabsInfo = EntityEditorBrowserTabsInfo.create(
      'story', 'story_id', 2, 1, false);
    spyOn(
      localStorageService, 'getEntityEditorBrowserTabsInfo'
    ).and.returnValue(storyEditorBrowserTabsInfo);
    spyOn(
      localStorageService, 'updateEntityEditorBrowserTabsInfo'
    ).and.callFake(() => {});

    expect(
      storyEditorBrowserTabsInfo.doesSomeTabHaveUnsavedChanges()
    ).toBeFalse();

    storyUpdateService.setStoryDescription(_sampleStory, 'new description');

    expect(
      storyEditorBrowserTabsInfo.doesSomeTabHaveUnsavedChanges()
    ).toBeTrue();
  });
});
