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
 * @fileoverview Service to build changes to a story. These changes may
 * then be used by other services, such as a backend API service to update the
 * story in the backend. This service also registers all changes with the
 * undo/redo service.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

import { AlertsService } from 'services/alerts.service';
import { BackendChangeObject, Change } from 'domain/editor/undo_redo/change.model';
import cloneDeep from 'lodash/cloneDeep';
import { UndoRedoService } from 'domain/editor/undo_redo/undo-redo.service.ts';
import { StoryChange } from 'domain/editor/undo_redo/change.model';
import { StoryDomainConstants } from 'domain/story/story-domain.constants.ts';
import { StoryEditorStateService } from 'pages/story-editor-page/services/story-editor-state.service.ts';
import { Story } from 'domain/story/StoryObjectFactory.ts';
import { StoryContents } from 'domain/story/StoryContentsObjectFactory.ts';
import { StoryNode } from './story-node.model';

type StoryUpdateApply = (storyChange: StoryChange, story: Story) => void;
type StoryUpdateReverse = (storyChange: StoryChange, story: Story) => void;

interface Params {
  'node_id'?: string;
  'title'?: string;
  'old_value'?: string | string[] | boolean | number;
  'new_value'?: string | string[] | boolean | number;
  'property_name'?: string;
  'cmd'?: string;
}

type Command = BackendChangeObject['cmd'];

@Injectable({
  providedIn: 'root'
})
export class StoryUpdateService {
  constructor(
    private _undoRedoService: UndoRedoService,
    private _alertsService: AlertsService,
    private _storyEditorStateService: StoryEditorStateService
  ) {}
  // Creates a change using an apply function, reverse function, a change
  // command and related parameters. The change is applied to a given
  // story.
  _applyChange(
      story: Story, command: Command, params: Params,
      apply: StoryUpdateApply, reverse: StoryUpdateReverse): void {
    let changeDict = cloneDeep(params) as BackendChangeObject;
    changeDict.cmd = command;
    let changeObj = new Change(changeDict, apply, reverse);
    try {
      this._undoRedoService.applyChange(changeObj, story);
    } catch (err) {
      this._alertsService.addWarning(err.message);
      throw err;
    }
  }

  _getParameterFromChangeDict(
      changeDict: BackendChangeObject, paramName: string): string {
    return changeDict[paramName];
  }

  _getNodeIdFromChangeDict(changeDict: BackendChangeObject): string {
    return this._getParameterFromChangeDict(changeDict, 'node_id');
  }
  _getStoryNode(storyContents: StoryContents, nodeId: string): StoryNode {
    let storyNodeIndex = storyContents.getNodeIndex(nodeId);
    if (storyNodeIndex === -1) {
      throw new Error('The given node doesn\'t exist');
    }
    return storyContents.getNodes()[storyNodeIndex];
  }

  // Applies a story property change, specifically. See _applyChange()
  // for details on the other behavior of this function.
  _applyStoryPropertyChange(
      story: Story, propertyName: string,
      oldValue: string, newValue: string,
      apply: StoryUpdateApply, reverse: StoryUpdateReverse): void {
    this._applyChange(story, StoryDomainConstants.CMD_UPDATE_STORY_PROPERTY, {
      property_name: propertyName,
      new_value: cloneDeep(newValue),
      old_value: cloneDeep(oldValue)
    }, apply, reverse);
  }

  _applyStoryContentsPropertyChange(
      story: Story, propertyName: string,
      oldValue: string | number, newValue: string | number,
      apply: StoryUpdateApply, reverse: StoryUpdateReverse): void {
    this._applyChange(
      story, StoryDomainConstants.CMD_UPDATE_STORY_CONTENTS_PROPERTY, {
        property_name: propertyName,
        new_value: cloneDeep(newValue),
        old_value: cloneDeep(oldValue)
      }, apply, reverse);
  }

  _applyStoryNodePropertyChange(
      story: Story, propertyName: string,
      nodeId: string, oldValue: string | string[],
      newValue: string | string[],
      apply: StoryUpdateApply, reverse: StoryUpdateReverse): void {
    this._applyChange(
      story, StoryDomainConstants.CMD_UPDATE_STORY_NODE_PROPERTY, {
        node_id: nodeId,
        property_name: propertyName,
        new_value: cloneDeep(newValue),
        old_value: cloneDeep(oldValue)
      }, apply, reverse);
  }

  _getNewPropertyValueFromChangeDict(changeDict: BackendChangeObject): string {
    return this._getParameterFromChangeDict(changeDict, 'new_value');
  }

  // These functions are associated with updates available in
  // core.domain.story_services.apply_change_list.

  /**
   * Changes the title of a story and records the change in the
   * undo/redo service.
   */
  setStoryTitle(story: Story, title: string): void {
    let oldTitle = cloneDeep(story.getTitle());
    this._applyStoryPropertyChange(
      story, StoryDomainConstants.STORY_PROPERTY_TITLE, oldTitle, title,
      (changeDict, story) => {
        // ---- Apply ----
        let title = this._getNewPropertyValueFromChangeDict(changeDict);
        story.setTitle(title);
      }, (changeDict, story) => {
        // ---- Undo ----
        story.setTitle(oldTitle);
      });
  }

  /**
   * Changes the url fragment of a story and records the change in the
   * undo/redo service.
   */
  setStoryUrlFragment(story: Story, urlFragment: string): void {
    let oldUrlFragment = cloneDeep(story.getUrlFragment());
    this._applyStoryPropertyChange(
      story, StoryDomainConstants.STORY_PROPERTY_URL_FRAGMENT,
      oldUrlFragment, urlFragment,
      (changeDict, story) => {
        // ---- Apply ----
        let newUrlFragment = (
          this._getNewPropertyValueFromChangeDict(changeDict));
        story.setUrlFragment(newUrlFragment);
      }, (changeDict, story) => {
        // ---- Undo ----
        story.setUrlFragment(oldUrlFragment);
      });
  }

  /**
   * Changes the thumbnail filename of a story and records the change
   * in the undo/redo service.
   */
  setThumbnailFilename(story: Story, newThumbnailFilename: string): void {
    let oldThumbnailFilename = cloneDeep(story.getThumbnailFilename());
    this._applyStoryPropertyChange(
      story, StoryDomainConstants.STORY_PROPERTY_THUMBNAIL_FILENAME,
      oldThumbnailFilename, newThumbnailFilename,
      (changeDict, story) => {
        // ---- Apply ----
        let thumbnailFilename = (
          this._getNewPropertyValueFromChangeDict(changeDict));
        story.setThumbnailFilename(thumbnailFilename);
      }, (changeDict, story) => {
        // ---- Undo ----
        story.setThumbnailFilename(oldThumbnailFilename);
      });
  }

  /**
   * Changes the thumbnail background color of a story and records the
   * change in the undo/redo service.
   */
  setThumbnailBgColor(story: Story, newThumbnailBgColor: string): void {
    let oldThumbnailBgColor = cloneDeep(story.getThumbnailBgColor());
    this._applyStoryPropertyChange(
      story, StoryDomainConstants.STORY_PROPERTY_THUMBNAIL_BG_COLOR,
      oldThumbnailBgColor, newThumbnailBgColor,
      (changeDict, story) => {
        // ---- Apply ----
        let thumbnailBgColor = (
          this._getNewPropertyValueFromChangeDict(changeDict));
        story.setThumbnailBgColor(thumbnailBgColor);
      }, (changeDict, story) => {
        // ---- Undo ----
        story.setThumbnailBgColor(oldThumbnailBgColor);
      });
  }

  /**
   * Changes the description of a story and records the change in the
   * undo/redo service.
   */
  setStoryDescription(story: Story, description: string): void {
    let oldDescription = cloneDeep(story.getDescription());
    this._applyStoryPropertyChange(
      story, StoryDomainConstants.STORY_PROPERTY_DESCRIPTION,
      oldDescription, description,
      (changeDict, story) => {
        // ---- Apply ----
        let description = this._getNewPropertyValueFromChangeDict(changeDict);
        story.setDescription(description);
      }, (changeDict, story) => {
        // ---- Undo ----
        story.setDescription(oldDescription);
      });
  }

  /**
   * Changes the notes for a story and records the change in the
   * undo/redo service.
   */
  setStoryNotes(story: Story, notes: string): void {
    let oldNotes = cloneDeep(story.getNotes());
    this._applyStoryPropertyChange(
      story, StoryDomainConstants.STORY_PROPERTY_NOTES, oldNotes, notes,
      (changeDict, story) => {
        // ---- Apply ----
        let notes = this._getNewPropertyValueFromChangeDict(changeDict);
        story.setNotes(notes);
      }, (changeDict, story) => {
        // ---- Undo ----
        story.setNotes(oldNotes);
      });
  }

  /**
   * Changes the language code of a story and records the change in
   * the undo/redo service.
   */
  setStoryLanguageCode(story: Story, languageCode: string): void {
    let oldLanguageCode = cloneDeep(story.getLanguageCode());
    this._applyStoryPropertyChange(
      story, StoryDomainConstants.STORY_PROPERTY_LANGUAGE_CODE,
      oldLanguageCode, languageCode,
      (changeDict, story) => {
        // ---- Apply ----
        let languageCode = this._getNewPropertyValueFromChangeDict(changeDict);
        story.setLanguageCode(languageCode);
      }, (changeDict, story) => {
        // ---- Undo ----
        story.setLanguageCode(oldLanguageCode);
      });
  }

  /**
   * Changes the meta tag content of a story and records the change in
   * the undo/redo service.
   */
  setStoryMetaTagContent(story: Story, metaTagContent: string): void {
    let oldMetaTagContent = cloneDeep(story.getMetaTagContent());
    this._applyStoryPropertyChange(
      story, StoryDomainConstants.STORY_PROPERTY_META_TAG_CONTENT,
      oldMetaTagContent, metaTagContent,
      (changeDict, story) => {
        // ---- Apply ----
        let metaTagContent = (
          this._getNewPropertyValueFromChangeDict(changeDict));
        story.setMetaTagContent(metaTagContent);
      }, (changeDict, story) => {
        // ---- Undo ----
        story.setMetaTagContent(oldMetaTagContent);
      });
  }

  /**
   * Sets the initial node of the story and records the change in
   * the undo/redo service.
   */
  setInitialNodeId(story: Story, newInitialNodeId: string): void {
    let oldInitialNodeId =
      cloneDeep(story.getStoryContents().getInitialNodeId());
    this._applyStoryContentsPropertyChange(
      story, StoryDomainConstants.INITIAL_NODE_ID, oldInitialNodeId,
      newInitialNodeId,
      (changeDict, story) => {
        // ---- Apply ----
        story.getStoryContents().setInitialNodeId(newInitialNodeId);
      }, (changeDict, story) => {
        // ---- Undo ----
        story.getStoryContents().setInitialNodeId(oldInitialNodeId);
      });
  }

  /**
   * Creates a story node, adds it to the story and records the change in
   * the undo/redo service.
   */
  addStoryNode(story: Story, nodeTitle: string): void {
    let nextNodeId = story.getStoryContents().getNextNodeId();
    this._applyChange(story, StoryDomainConstants.CMD_ADD_STORY_NODE, {
      node_id: nextNodeId,
      title: nodeTitle
    }, (changeDict, story) => {
      // ---- Apply ----
      story.getStoryContents().addNode(nodeTitle);
      this._storyEditorStateService.setExpIdsChanged();
    }, (changeDict, story) => {
      // ---- Undo ----
      let nodeId = this._getNodeIdFromChangeDict(changeDict);
      story.getStoryContents().deleteNode(nodeId);
      this._storyEditorStateService.setExpIdsChanged();
    });
  }

  /**
   * Removes a story node, and records the change in the undo/redo service.
   */
  deleteStoryNode(story: Story, nodeId: string): void {
    this._applyChange(story, StoryDomainConstants.CMD_DELETE_STORY_NODE, {
      node_id: nodeId
    }, (changeDict, story) => {
      // ---- Apply ----
      story.getStoryContents().deleteNode(nodeId);
      this._storyEditorStateService.setExpIdsChanged();
    }, (changeDict, story) => {
      // ---- Undo ----
      throw new Error('A deleted story node cannot be restored.');
    });
  }

  /**
   * Marks the node outline of a node as finalized and records the change
   * in the undo/redo service.
   */
  finalizeStoryNodeOutline(story: Story, nodeId: string): void {
    let storyNode = this._getStoryNode(story.getStoryContents(), nodeId);
    if (storyNode.getOutlineStatus()) {
      throw new Error('Node outline is already finalized.');
    }
    this._applyChange(
      story, StoryDomainConstants.CMD_UPDATE_STORY_NODE_OUTLINE_STATUS, {
        node_id: nodeId,
        old_value: false,
        new_value: true
      }, (changeDict, story) => {
        // ---- Apply ----
        story.getStoryContents().markNodeOutlineAsFinalized(nodeId);
      }, (changeDict, story) => {
        // ---- Undo ----
        story.getStoryContents().markNodeOutlineAsNotFinalized(nodeId);
      });
  }

  /**
   * Marks the node outline of a node as not finalized and records the
   * change in the undo/redo service.
   */
  unfinalizeStoryNodeOutline(story: Story, nodeId: string): void {
    let storyNode = this._getStoryNode(story.getStoryContents(), nodeId);
    if (!storyNode.getOutlineStatus()) {
      throw new Error('Node outline is already not finalized.');
    }
    this._applyChange(
      story, StoryDomainConstants.CMD_UPDATE_STORY_NODE_OUTLINE_STATUS, {
        node_id: nodeId,
        old_value: true,
        new_value: false
      }, (changeDict, story) => {
        // ---- Apply ----
        story.getStoryContents().markNodeOutlineAsNotFinalized(nodeId);
      }, (changeDict, story) => {
        // ---- Undo ----
        story.getStoryContents().markNodeOutlineAsFinalized(nodeId);
      });
  }

  /**
   * Sets the outline of a node of the story and records the change
   * in the undo/redo service.
   */
  setStoryNodeOutline(story: Story, nodeId: string, newOutline: string): void {
    let storyNode = this._getStoryNode(story.getStoryContents(), nodeId);
    let oldOutline = storyNode.getOutline();

    this._applyStoryNodePropertyChange(
      story, StoryDomainConstants.STORY_NODE_PROPERTY_OUTLINE, nodeId,
      oldOutline, newOutline,
      (changeDict, story) => {
        // ---- Apply ----
        story.getStoryContents().setNodeOutline(nodeId, newOutline);
      }, (changeDict, story) => {
        // ---- Undo ----
        story.getStoryContents().setNodeOutline(
          nodeId, oldOutline);
      });
  }

  /**
   * Sets the title of a node of the story and records the change
   * in the undo/redo service.
   */
  setStoryNodeTitle(story: Story, nodeId: string, newTitle: string): void {
    let storyNode = this._getStoryNode(story.getStoryContents(), nodeId);
    let oldTitle = storyNode.getTitle();

    this._applyStoryNodePropertyChange(
      story, StoryDomainConstants.STORY_NODE_PROPERTY_TITLE, nodeId,
      oldTitle, newTitle,
      (changeDict, story) => {
        // ---- Apply ----
        story.getStoryContents().setNodeTitle(nodeId, newTitle);
      }, (changeDict, story) => {
        // ---- Undo ----
        story.getStoryContents().setNodeTitle(nodeId, oldTitle);
      });
  }

  /**
   * Sets the description of a node of the story and records the change
   * in the undo/redo service.
   */
  setStoryNodeDescription(
      story: Story, nodeId: string, newDescription: string): void {
    let storyNode = this._getStoryNode(story.getStoryContents(), nodeId);
    let oldDescription = storyNode.getDescription();

    this._applyStoryNodePropertyChange(
      story, StoryDomainConstants.STORY_NODE_PROPERTY_DESCRIPTION, nodeId,
      oldDescription, newDescription,
      (changeDict, story) => {
        // ---- Apply ----
        story.getStoryContents().setNodeDescription(nodeId, newDescription);
      }, (changeDict, story) => {
        // ---- Undo ----
        story.getStoryContents().setNodeDescription(nodeId, oldDescription);
      });
  }

  /**
   * Sets the thumbnail filename of a node of the story and records the
   * change in the undo/redo service.
   */
  setStoryNodeThumbnailFilename(
      story: Story, nodeId: string, newThumbnailFilename: string): void {
    let storyNode = this._getStoryNode(story.getStoryContents(), nodeId);
    let oldThumbnailFilename = storyNode.getThumbnailFilename();

    this._applyStoryNodePropertyChange(
      story, StoryDomainConstants.STORY_NODE_PROPERTY_THUMBNAIL_FILENAME,
      nodeId, oldThumbnailFilename, newThumbnailFilename,
      (changeDict, story) => {
        // ---- Apply ----
        storyNode.setThumbnailFilename(newThumbnailFilename);
      }, (changeDict, story) => {
        // ---- Undo ----
        storyNode.setThumbnailFilename(oldThumbnailFilename);
      });
  }

  /**
   * Sets the thumbnail background color of a node of the story and records
   * the change in the undo/redo service.
   */
  setStoryNodeThumbnailBgColor(
      story: Story, nodeId: string, newThumbnailBgColor: string): void {
    let storyNode = this._getStoryNode(story.getStoryContents(), nodeId);
    let oldThumbnailBgColor = storyNode.getThumbnailBgColor();

    this._applyStoryNodePropertyChange(
      story, StoryDomainConstants.STORY_NODE_PROPERTY_THUMBNAIL_BG_COLOR,
      nodeId, oldThumbnailBgColor, newThumbnailBgColor,
      (changeDict, story) => {
        // ---- Apply ----
        storyNode.setThumbnailBgColor(newThumbnailBgColor);
      }, (changeDict, story) => {
        // ---- Undo ----
        storyNode.setThumbnailBgColor(oldThumbnailBgColor);
      });
  }

  /**
   * Sets the id of the exploration that of a node of the story is linked
   * to and records the change in the undo/redo service.
   */
  setStoryNodeExplorationId(
      story: Story, nodeId: string, newExplorationId: string): void {
    let storyNode = this._getStoryNode(story.getStoryContents(), nodeId);
    let oldExplorationId = storyNode.getExplorationId();

    this._applyStoryNodePropertyChange(
      story, StoryDomainConstants.STORY_NODE_PROPERTY_EXPLORATION_ID,
      nodeId, oldExplorationId, newExplorationId,
      (changeDict, story) => {
        // ---- Apply ----
        story.getStoryContents().setNodeExplorationId(
          nodeId, newExplorationId);
        this._storyEditorStateService.setExpIdsChanged();
      }, (changeDict, story) => {
        // ---- Undo ----
        story.getStoryContents().setNodeExplorationId(
          nodeId, oldExplorationId);
        this._storyEditorStateService.setExpIdsChanged();
      });
  }

  /**
   * Adds a destination node id to a node of a story and records the change
   * in the undo/redo service.
   */
  addDestinationNodeIdToNode(
      story: Story, nodeId: string, destinationNodeId: string): void {
    let storyNode = this._getStoryNode(story.getStoryContents(), nodeId);
    let oldDestinationNodeIds = cloneDeep(
      storyNode.getDestinationNodeIds());
    let newDestinationNodeIds = cloneDeep(oldDestinationNodeIds);
    newDestinationNodeIds.push(destinationNodeId);

    this._applyStoryNodePropertyChange(
      story, StoryDomainConstants.STORY_NODE_PROPERTY_DESTINATION_NODE_IDS,
      nodeId, oldDestinationNodeIds, newDestinationNodeIds,
      (changeDict, story) => {
        // ---- Apply ----
        story.getStoryContents().addDestinationNodeIdToNode(
          nodeId, destinationNodeId);
      }, (changeDict, story) => {
        // ---- Undo ----
        story.getStoryContents().removeDestinationNodeIdFromNode(
          nodeId, destinationNodeId);
      });
  }

  /**
   * Removes a destination node id from a node of a story and records the
   * change in the undo/redo service.
   */
  removeDestinationNodeIdFromNode(
      story: Story, nodeId: string, destinationNodeId: string): void {
    let storyNode = this._getStoryNode(story.getStoryContents(), nodeId);
    let oldDestinationNodeIds = cloneDeep(
      storyNode.getDestinationNodeIds());
    let newDestinationNodeIds = cloneDeep(oldDestinationNodeIds);
    let index = newDestinationNodeIds.indexOf(destinationNodeId);
    if (index === -1) {
      throw new Error('The given destination node is not part of the node');
    }
    newDestinationNodeIds.splice(index, 1);

    this._applyStoryNodePropertyChange(
      story, StoryDomainConstants.STORY_NODE_PROPERTY_DESTINATION_NODE_IDS,
      nodeId, oldDestinationNodeIds, newDestinationNodeIds,
      (changeDict, story) => {
        // ---- Apply ----
        story.getStoryContents().removeDestinationNodeIdFromNode(
          nodeId, destinationNodeId);
        this._storyEditorStateService.setExpIdsChanged();
      }, (changeDict, story) => {
        // ---- Undo ----
        story.getStoryContents().addDestinationNodeIdToNode(
          nodeId, destinationNodeId);
        this._storyEditorStateService.setExpIdsChanged();
      });
  }
  /**
   * Removes a node of a story and records the change in the
   * undo/redo service.
   */
  rearrangeNodeInStory(story: Story, fromIndex: number, toIndex: number): void {
    this._applyStoryContentsPropertyChange(
      story, StoryDomainConstants.NODE, fromIndex, toIndex,
      (changeDict, story) => {
        // ---- Apply ----
        story.getStoryContents().rearrangeNodeInStory(fromIndex, toIndex);
      }, (changeDict, story) => {
        // ---- Undo ----
        story.getStoryContents().rearrangeNodeInStory(fromIndex, toIndex);
      });
  }

  /**
   * Adds a prerequisite skill id to a node of a story and records the
   * change in the undo/redo service.
   */
  addPrerequisiteSkillIdToNode(
      story: Story, nodeId: string, skillId: string): void {
    let storyNode = this._getStoryNode(story.getStoryContents(), nodeId);
    let oldPrerequisiteSkillIds = cloneDeep(
      storyNode.getPrerequisiteSkillIds());
    let newPrerequisiteSkillIds = cloneDeep(oldPrerequisiteSkillIds);
    newPrerequisiteSkillIds.push(skillId);
    this._applyStoryNodePropertyChange(
      story, StoryDomainConstants.STORY_NODE_PROPERTY_PREREQUISITE_SKILL_IDS,
      nodeId, oldPrerequisiteSkillIds, newPrerequisiteSkillIds,
      (changeDict, story) => {
        // ---- Apply ----
        story.getStoryContents().addPrerequisiteSkillIdToNode(
          nodeId, skillId);
      }, (changeDict, story) => {
        // ---- Undo ----
        story.getStoryContents().removePrerequisiteSkillIdFromNode(
          nodeId, skillId);
      });
  }

  /**
   * Removes a prerequisite skill id from a node of a story and records the
   * change in the undo/redo service.
   */
  removePrerequisiteSkillIdFromNode(
      story: Story, nodeId: string, skillId: string): void {
    let storyNode = this._getStoryNode(story.getStoryContents(), nodeId);
    let oldPrerequisiteSkillIds = cloneDeep(
      storyNode.getPrerequisiteSkillIds());
    let newPrerequisiteSkillIds = cloneDeep(oldPrerequisiteSkillIds);
    let index = newPrerequisiteSkillIds.indexOf(skillId);
    if (index === -1) {
      throw new Error(
        'The given prerequisite skill is not part of the node');
    }
    newPrerequisiteSkillIds.splice(index, 1);

    this._applyStoryNodePropertyChange(
      story, StoryDomainConstants.STORY_NODE_PROPERTY_PREREQUISITE_SKILL_IDS,
      nodeId, oldPrerequisiteSkillIds, newPrerequisiteSkillIds,
      (changeDict, story) => {
        // ---- Apply ----
        story.getStoryContents().removePrerequisiteSkillIdFromNode(
          nodeId, skillId);
      }, (changeDict, story) => {
        // ---- Undo ----
        story.getStoryContents().addPrerequisiteSkillIdToNode(
          nodeId, skillId);
      });
  }

  /**
   * Adds an acquired skill id to a node of a story and records the change
   * in the undo/redo service.
   */
  addAcquiredSkillIdToNode(
      story: Story, nodeId: string, skillId: string): void {
    let storyNode = this._getStoryNode(story.getStoryContents(), nodeId);
    let oldAcquiredSkillIds = cloneDeep(
      storyNode.getAcquiredSkillIds());
    let newAcquiredSkillIds = cloneDeep(oldAcquiredSkillIds);
    newAcquiredSkillIds.push(skillId);

    this._applyStoryNodePropertyChange(
      story, StoryDomainConstants.STORY_NODE_PROPERTY_ACQUIRED_SKILL_IDS,
      nodeId, oldAcquiredSkillIds, newAcquiredSkillIds,
      (changeDict, story) => {
        // ---- Apply ----
        story.getStoryContents().addAcquiredSkillIdToNode(
          nodeId, skillId);
      }, (changeDict, story) => {
        // ---- Undo ----
        story.getStoryContents().removeAcquiredSkillIdFromNode(
          nodeId, skillId);
      });
  }

  /**
   * Removes an acquired skill id from a node of a story and records the
   * change in the undo/redo service.
   */
  removeAcquiredSkillIdFromNode(
      story: Story, nodeId: string, skillId: string): void {
    let storyNode = this._getStoryNode(story.getStoryContents(), nodeId);
    let oldAcquiredSkillIds = cloneDeep(
      storyNode.getAcquiredSkillIds());
    let newAcquiredSkillIds = cloneDeep(oldAcquiredSkillIds);
    let index = newAcquiredSkillIds.indexOf(skillId);
    if (index === -1) {
      throw new Error(
        'The given acquired skill id is not part of the node');
    }
    newAcquiredSkillIds.splice(index, 1);

    this._applyStoryNodePropertyChange(
      story, StoryDomainConstants.STORY_NODE_PROPERTY_ACQUIRED_SKILL_IDS,
      nodeId, oldAcquiredSkillIds, newAcquiredSkillIds,
      (changeDict, story) => {
        // ---- Apply ----
        story.getStoryContents().removeAcquiredSkillIdFromNode(
          nodeId, skillId);
      }, (changeDict, story) => {
        // ---- Undo ----
        story.getStoryContents().addAcquiredSkillIdToNode(
          nodeId, skillId);
      });
  }
}

angular.module('oppia').factory(
  'StoryUpdateService', downgradeInjectable(StoryUpdateService));
