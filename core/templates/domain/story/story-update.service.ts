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
 * @fileoverview Service to build changes to a story. These changes may
 * then be used by other services, such as a backend API service to update the
 * story in the backend. This service also registers all changes with the
 * undo/redo service.
 */

require('domain/editor/undo_redo/ChangeObjectFactory.ts');
require('domain/editor/undo_redo/undo-redo.service.ts');
require('domain/story/story-domain.constants.ajs.ts');

angular.module('oppia').factory('StoryUpdateService', [
  'AlertsService', 'ChangeObjectFactory', 'StoryEditorStateService',
  'UndoRedoService', 'CMD_ADD_STORY_NODE', 'CMD_DELETE_STORY_NODE',
  'CMD_UPDATE_STORY_CONTENTS_PROPERTY', 'CMD_UPDATE_STORY_NODE_OUTLINE_STATUS',
  'CMD_UPDATE_STORY_NODE_PROPERTY', 'CMD_UPDATE_STORY_PROPERTY',
  'INITIAL_NODE_ID', 'NODE', 'STORY_NODE_PROPERTY_ACQUIRED_SKILL_IDS',
  'STORY_NODE_PROPERTY_DESCRIPTION', 'STORY_NODE_PROPERTY_DESTINATION_NODE_IDS',
  'STORY_NODE_PROPERTY_EXPLORATION_ID',
  'STORY_NODE_PROPERTY_OUTLINE', 'STORY_NODE_PROPERTY_PREREQUISITE_SKILL_IDS',
  'STORY_NODE_PROPERTY_THUMBNAIL_BG_COLOR',
  'STORY_NODE_PROPERTY_THUMBNAIL_FILENAME', 'STORY_NODE_PROPERTY_TITLE',
  'STORY_PROPERTY_DESCRIPTION', 'STORY_PROPERTY_LANGUAGE_CODE',
  'STORY_PROPERTY_NOTES', 'STORY_PROPERTY_THUMBNAIL_BG_COLOR',
  'STORY_PROPERTY_THUMBNAIL_FILENAME', 'STORY_PROPERTY_TITLE',
  'STORY_PROPERTY_URL_FRAGMENT', function(
      AlertsService, ChangeObjectFactory, StoryEditorStateService,
      UndoRedoService, CMD_ADD_STORY_NODE, CMD_DELETE_STORY_NODE,
      CMD_UPDATE_STORY_CONTENTS_PROPERTY, CMD_UPDATE_STORY_NODE_OUTLINE_STATUS,
      CMD_UPDATE_STORY_NODE_PROPERTY, CMD_UPDATE_STORY_PROPERTY,
      INITIAL_NODE_ID, NODE, STORY_NODE_PROPERTY_ACQUIRED_SKILL_IDS,
      STORY_NODE_PROPERTY_DESCRIPTION, STORY_NODE_PROPERTY_DESTINATION_NODE_IDS,
      STORY_NODE_PROPERTY_EXPLORATION_ID,
      STORY_NODE_PROPERTY_OUTLINE, STORY_NODE_PROPERTY_PREREQUISITE_SKILL_IDS,
      STORY_NODE_PROPERTY_THUMBNAIL_BG_COLOR,
      STORY_NODE_PROPERTY_THUMBNAIL_FILENAME, STORY_NODE_PROPERTY_TITLE,
      STORY_PROPERTY_DESCRIPTION, STORY_PROPERTY_LANGUAGE_CODE,
      STORY_PROPERTY_NOTES, STORY_PROPERTY_THUMBNAIL_BG_COLOR,
      STORY_PROPERTY_THUMBNAIL_FILENAME, STORY_PROPERTY_TITLE,
      STORY_PROPERTY_URL_FRAGMENT) {
    // Creates a change using an apply function, reverse function, a change
    // command and related parameters. The change is applied to a given
    // story.
    var _applyChange = function(story, command, params, apply, reverse) {
      var changeDict = angular.copy(params);
      changeDict.cmd = command;
      var changeObj = ChangeObjectFactory.create(changeDict, apply, reverse);
      try {
        UndoRedoService.applyChange(changeObj, story);
      } catch (err) {
        AlertsService.addWarning(err.message);
        throw err;
      }
    };

    var _getParameterFromChangeDict = function(changeDict, paramName) {
      return changeDict[paramName];
    };

    var _getNodeIdFromChangeDict = function(changeDict) {
      return _getParameterFromChangeDict(changeDict, 'node_id');
    };

    var _getStoryNode = function(storyContents, nodeId) {
      var storyNodeIndex = storyContents.getNodeIndex(nodeId);
      if (storyNodeIndex === -1) {
        throw new Error('The given node doesn\'t exist');
      }
      return storyContents.getNodes()[storyNodeIndex];
    };

    // Applies a story property change, specifically. See _applyChange()
    // for details on the other behavior of this function.
    var _applyStoryPropertyChange = function(
        story, propertyName, oldValue, newValue, apply, reverse) {
      _applyChange(story, CMD_UPDATE_STORY_PROPERTY, {
        property_name: propertyName,
        new_value: angular.copy(newValue),
        old_value: angular.copy(oldValue)
      }, apply, reverse);
    };

    var _applyStoryContentsPropertyChange = function(
        story, propertyName, oldValue, newValue, apply, reverse) {
      _applyChange(story, CMD_UPDATE_STORY_CONTENTS_PROPERTY, {
        property_name: propertyName,
        new_value: angular.copy(newValue),
        old_value: angular.copy(oldValue)
      }, apply, reverse);
    };

    var _applyStoryNodePropertyChange = function(
        story, propertyName, nodeId, oldValue, newValue, apply, reverse) {
      _applyChange(story, CMD_UPDATE_STORY_NODE_PROPERTY, {
        node_id: nodeId,
        property_name: propertyName,
        new_value: angular.copy(newValue),
        old_value: angular.copy(oldValue)
      }, apply, reverse);
    };

    var _getNewPropertyValueFromChangeDict = function(changeDict) {
      return _getParameterFromChangeDict(changeDict, 'new_value');
    };

    // These functions are associated with updates available in
    // core.domain.story_services.apply_change_list.
    return {
      /**
       * Changes the title of a story and records the change in the
       * undo/redo service.
       */
      setStoryTitle: function(story, title) {
        var oldTitle = angular.copy(story.getTitle());
        _applyStoryPropertyChange(
          story, STORY_PROPERTY_TITLE, oldTitle, title,
          function(changeDict, story) {
            // ---- Apply ----
            var title = _getNewPropertyValueFromChangeDict(changeDict);
            story.setTitle(title);
          }, function(changeDict, story) {
            // ---- Undo ----
            story.setTitle(oldTitle);
          });
      },

      /**
       * Changes the url fragment of a story and records the change in the
       * undo/redo service.
       */
      setStoryUrlFragment: function(story, urlFragment) {
        var oldUrlFragment = angular.copy(story.getUrlFragment());
        _applyStoryPropertyChange(
          story, STORY_PROPERTY_URL_FRAGMENT, oldUrlFragment, urlFragment,
          function(changeDict, story) {
            // ---- Apply ----
            var newUrlFragment = _getNewPropertyValueFromChangeDict(changeDict);
            story.setUrlFragment(newUrlFragment);
          }, function(changeDict, story) {
            // ---- Undo ----
            story.setUrlFragment(oldUrlFragment);
          });
      },

      /**
       * Changes the thumbnail filename of a story and records the change
       * in the undo/redo service.
       */
      setThumbnailFilename: function(story, newThumbnailFilename) {
        var oldThumbnailFilename = angular.copy(story.getThumbnailFilename());
        _applyStoryPropertyChange(
          story, STORY_PROPERTY_THUMBNAIL_FILENAME, oldThumbnailFilename,
          newThumbnailFilename, function(changeDict, story) {
            // ---- Apply ----
            var thumbnailFilename = (
              _getNewPropertyValueFromChangeDict(changeDict));
            story.setThumbnailFilename(thumbnailFilename);
          }, function(changeDict, story) {
            // ---- Undo ----
            story.setThumbnailFilename(oldThumbnailFilename);
          });
      },

      /**
       * Changes the thumbnail background color of a story and records the
       * change in the undo/redo service.
       */
      setThumbnailBgColor: function(story, newThumbnailBgColor) {
        var oldThumbnailBgColor = angular.copy(story.getThumbnailBgColor());
        _applyStoryPropertyChange(
          story, STORY_PROPERTY_THUMBNAIL_BG_COLOR, oldThumbnailBgColor,
          newThumbnailBgColor, function(changeDict, story) {
            // ---- Apply ----
            var thumbnailBgColor = (
              _getNewPropertyValueFromChangeDict(changeDict));
            story.setThumbnailBgColor(thumbnailBgColor);
          }, function(changeDict, story) {
            // ---- Undo ----
            story.setThumbnailBgColor(oldThumbnailBgColor);
          });
      },

      /**
       * Changes the description of a story and records the change in the
       * undo/redo service.
       */
      setStoryDescription: function(story, description) {
        var oldDescription = angular.copy(story.getDescription());
        _applyStoryPropertyChange(
          story, STORY_PROPERTY_DESCRIPTION, oldDescription, description,
          function(changeDict, story) {
            // ---- Apply ----
            var description = _getNewPropertyValueFromChangeDict(changeDict);
            story.setDescription(description);
          }, function(changeDict, story) {
            // ---- Undo ----
            story.setDescription(oldDescription);
          });
      },

      /**
       * Changes the notes for a story and records the change in the
       * undo/redo service.
       */
      setStoryNotes: function(story, notes) {
        var oldNotes = angular.copy(story.getNotes());
        _applyStoryPropertyChange(
          story, STORY_PROPERTY_NOTES, oldNotes, notes,
          function(changeDict, story) {
            // ---- Apply ----
            var notes = _getNewPropertyValueFromChangeDict(changeDict);
            story.setNotes(notes);
          }, function(changeDict, story) {
            // ---- Undo ----
            story.setNotes(oldNotes);
          });
      },

      /**
       * Changes the language code of a story and records the change in
       * the undo/redo service.
       */
      setStoryLanguageCode: function(story, languageCode) {
        var oldLanguageCode = angular.copy(story.getLanguageCode());
        _applyStoryPropertyChange(
          story, STORY_PROPERTY_LANGUAGE_CODE, oldLanguageCode, languageCode,
          function(changeDict, story) {
            // ---- Apply ----
            var languageCode = _getNewPropertyValueFromChangeDict(changeDict);
            story.setLanguageCode(languageCode);
          }, function(changeDict, story) {
            // ---- Undo ----
            story.setLanguageCode(oldLanguageCode);
          });
      },

      /**
       * Sets the initial node of the story and records the change in
       * the undo/redo service.
       */
      setInitialNodeId: function(story, newInitialNodeId) {
        var oldInitialNodeId =
          angular.copy(story.getStoryContents().getInitialNodeId());
        _applyStoryContentsPropertyChange(
          story, INITIAL_NODE_ID, oldInitialNodeId,
          newInitialNodeId,
          function(changeDict, story) {
            // ---- Apply ----
            story.getStoryContents().setInitialNodeId(newInitialNodeId);
          }, function(changeDict, story) {
            // ---- Undo ----
            story.getStoryContents().setInitialNodeId(oldInitialNodeId);
          });
      },

      /**
       * Creates a story node, adds it to the story and records the change in
       * the undo/redo service.
       */
      addStoryNode: function(story, nodeTitle) {
        var nextNodeId = story.getStoryContents().getNextNodeId();
        _applyChange(story, CMD_ADD_STORY_NODE, {
          node_id: nextNodeId,
          title: nodeTitle
        }, function(changeDict, story) {
          // ---- Apply ----
          story.getStoryContents().addNode(nodeTitle);
          StoryEditorStateService.setExpIdsChanged();
        }, function(changeDict, story) {
          // ---- Undo ----
          var nodeId = _getNodeIdFromChangeDict(changeDict);
          story.getStoryContents().deleteNode(nodeId);
          StoryEditorStateService.setExpIdsChanged();
        });
      },

      /**
       * Removes a story node, and records the change in the undo/redo service.
       */
      deleteStoryNode: function(story, nodeId) {
        var nodeIndex = story.getStoryContents().getNodeIndex(nodeId);
        _applyChange(story, CMD_DELETE_STORY_NODE, {
          node_id: nodeId
        }, function(changeDict, story) {
          // ---- Apply ----
          story.getStoryContents().deleteNode(nodeId);
          StoryEditorStateService.setExpIdsChanged();
        }, function(changeDict, story) {
          // ---- Undo ----
          throw new Error('A deleted story node cannot be restored.');
        });
      },

      /**
       * Marks the node outline of a node as finalized and records the change
       * in the undo/redo service.
       */
      finalizeStoryNodeOutline: function(story, nodeId) {
        var storyNode = _getStoryNode(story.getStoryContents(), nodeId);
        if (storyNode.getOutlineStatus()) {
          throw new Error('Node outline is already finalized.');
        }
        _applyChange(story, CMD_UPDATE_STORY_NODE_OUTLINE_STATUS, {
          node_id: nodeId,
          old_value: false,
          new_value: true
        }, function(changeDict, story) {
          // ---- Apply ----
          story.getStoryContents().markNodeOutlineAsFinalized(nodeId);
        }, function(changeDict, story) {
          // ---- Undo ----
          story.getStoryContents().markNodeOutlineAsNotFinalized(nodeId);
        });
      },

      /**
       * Marks the node outline of a node as not finalized and records the
       * change in the undo/redo service.
       */
      unfinalizeStoryNodeOutline: function(story, nodeId) {
        var storyNode = _getStoryNode(story.getStoryContents(), nodeId);
        if (!storyNode.getOutlineStatus()) {
          throw new Error('Node outline is already not finalized.');
        }
        _applyChange(story, CMD_UPDATE_STORY_NODE_OUTLINE_STATUS, {
          node_id: nodeId,
          old_value: true,
          new_value: false
        }, function(changeDict, story) {
          // ---- Apply ----
          story.getStoryContents().markNodeOutlineAsNotFinalized(nodeId);
        }, function(changeDict, story) {
          // ---- Undo ----
          story.getStoryContents().markNodeOutlineAsFinalized(nodeId);
        });
      },

      /**
       * Sets the outline of a node of the story and records the change
       * in the undo/redo service.
       */
      setStoryNodeOutline: function(story, nodeId, newOutline) {
        var storyNode = _getStoryNode(story.getStoryContents(), nodeId);
        var oldOutline = storyNode.getOutline();

        _applyStoryNodePropertyChange(
          story, STORY_NODE_PROPERTY_OUTLINE, nodeId,
          oldOutline, newOutline,
          function(changeDict, story) {
            // ---- Apply ----
            story.getStoryContents().setNodeOutline(nodeId, newOutline);
          }, function(changeDict, story) {
            // ---- Undo ----
            story.getStoryContents().setNodeOutline(
              nodeId, oldOutline);
          });
      },

      /**
       * Sets the title of a node of the story and records the change
       * in the undo/redo service.
       */
      setStoryNodeTitle: function(story, nodeId, newTitle) {
        var storyNode = _getStoryNode(story.getStoryContents(), nodeId);
        var oldTitle = storyNode.getTitle();

        _applyStoryNodePropertyChange(
          story, STORY_NODE_PROPERTY_TITLE, nodeId,
          oldTitle, newTitle,
          function(changeDict, story) {
            // ---- Apply ----
            story.getStoryContents().setNodeTitle(nodeId, newTitle);
          }, function(changeDict, story) {
            // ---- Undo ----
            story.getStoryContents().setNodeTitle(nodeId, oldTitle);
          });
      },

      /**
       * Sets the description of a node of the story and records the change
       * in the undo/redo service.
       */
      setStoryNodeDescription: function(story, nodeId, newDescription) {
        var storyNode = _getStoryNode(story.getStoryContents(), nodeId);
        var oldDescription = storyNode.getDescription();

        _applyStoryNodePropertyChange(
          story, STORY_NODE_PROPERTY_DESCRIPTION, nodeId,
          oldDescription, newDescription,
          function(changeDict, story) {
            // ---- Apply ----
            story.getStoryContents().setNodeDescription(nodeId, newDescription);
          }, function(changeDict, story) {
            // ---- Undo ----
            story.getStoryContents().setNodeDescription(nodeId, oldDescription);
          });
      },

      /**
       * Sets the thumbnail filename of a node of the story and records the
       * change in the undo/redo service.
       */
      setStoryNodeThumbnailFilename: function(
          story, nodeId, newThumbnailFilename) {
        var storyNode = _getStoryNode(story.getStoryContents(), nodeId);
        var oldThumbnailFilename = storyNode.getThumbnailFilename();

        _applyStoryNodePropertyChange(
          story, STORY_NODE_PROPERTY_THUMBNAIL_FILENAME, nodeId,
          oldThumbnailFilename, newThumbnailFilename,
          function(changeDict, story) {
            // ---- Apply ----
            storyNode.setThumbnailFilename(newThumbnailFilename);
          }, function(changeDict, story) {
            // ---- Undo ----
            storyNode.setThumbnailFilename(oldThumbnailFilename);
          });
      },

      /**
       * Sets the thumbnail background color of a node of the story and records
       * the change in the undo/redo service.
       */
      setStoryNodeThumbnailBgColor: function(
          story, nodeId, newThumbnailBgColor) {
        var storyNode = _getStoryNode(story.getStoryContents(), nodeId);
        var oldThumbnailBgColor = storyNode.getThumbnailBgColor();

        _applyStoryNodePropertyChange(
          story, STORY_NODE_PROPERTY_THUMBNAIL_BG_COLOR, nodeId,
          oldThumbnailBgColor, newThumbnailBgColor,
          function(changeDict, story) {
            // ---- Apply ----
            storyNode.setThumbnailBgColor(newThumbnailBgColor);
          }, function(changeDict, story) {
            // ---- Undo ----
            storyNode.setThumbnailBgColor(oldThumbnailBgColor);
          });
      },

      /**
       * Sets the id of the exploration that of a node of the story is linked
       * to and records the change in the undo/redo service.
       */
      setStoryNodeExplorationId: function(story, nodeId, newExplorationId) {
        var storyNode = _getStoryNode(story.getStoryContents(), nodeId);
        var oldExplorationId = storyNode.getExplorationId();

        _applyStoryNodePropertyChange(
          story, STORY_NODE_PROPERTY_EXPLORATION_ID, nodeId,
          oldExplorationId, newExplorationId,
          function(changeDict, story) {
            // ---- Apply ----
            story.getStoryContents().setNodeExplorationId(
              nodeId, newExplorationId);
            StoryEditorStateService.setExpIdsChanged();
          }, function(changeDict, story) {
            // ---- Undo ----
            story.getStoryContents().setNodeExplorationId(
              nodeId, oldExplorationId);
            StoryEditorStateService.setExpIdsChanged();
          });
      },

      /**
       * Adds a destination node id to a node of a story and records the change
       * in the undo/redo service.
       */
      addDestinationNodeIdToNode: function(story, nodeId, destinationNodeId) {
        var storyNode = _getStoryNode(story.getStoryContents(), nodeId);
        var oldDestinationNodeIds = angular.copy(
          storyNode.getDestinationNodeIds());
        var newDestinationNodeIds = angular.copy(oldDestinationNodeIds);
        newDestinationNodeIds.push(destinationNodeId);

        _applyStoryNodePropertyChange(
          story, STORY_NODE_PROPERTY_DESTINATION_NODE_IDS, nodeId,
          oldDestinationNodeIds, newDestinationNodeIds,
          function(changeDict, story) {
            // ---- Apply ----
            story.getStoryContents().addDestinationNodeIdToNode(
              nodeId, destinationNodeId);
          }, function(changeDict, story) {
            // ---- Undo ----
            story.getStoryContents().removeDestinationNodeIdFromNode(
              nodeId, destinationNodeId);
          });
      },

      /**
       * Removes a destination node id from a node of a story and records the
       * change in the undo/redo service.
       */
      removeDestinationNodeIdFromNode: function(
          story, nodeId, destinationNodeId) {
        var storyNode = _getStoryNode(story.getStoryContents(), nodeId);
        var oldDestinationNodeIds = angular.copy(
          storyNode.getDestinationNodeIds());
        var newDestinationNodeIds = angular.copy(oldDestinationNodeIds);
        var index = newDestinationNodeIds.indexOf(destinationNodeId);
        if (index === -1) {
          throw new Error('The given destination node is not part of the node');
        }
        newDestinationNodeIds.splice(index, 1);

        _applyStoryNodePropertyChange(
          story, STORY_NODE_PROPERTY_DESTINATION_NODE_IDS, nodeId,
          oldDestinationNodeIds, newDestinationNodeIds,
          function(changeDict, story) {
            // ---- Apply ----
            story.getStoryContents().removeDestinationNodeIdFromNode(
              nodeId, destinationNodeId);
            StoryEditorStateService.setExpIdsChanged();
          }, function(changeDict, story) {
            // ---- Undo ----
            story.getStoryContents().addDestinationNodeIdToNode(
              nodeId, destinationNodeId);
            StoryEditorStateService.setExpIdsChanged();
          });
      },
      /**
       * Removes a node of a story and records the change in the
       * undo/redo service.
       */
      rearrangeNodeInStory: function(story, fromIndex, toIndex) {
        _applyStoryContentsPropertyChange(
          story, NODE, fromIndex, toIndex,
          function(changeDict, story) {
            // ---- Apply ----
            story.getStoryContents().rearrangeNodeInStory(fromIndex, toIndex);
          }, function(changeDict, story) {
            // ---- Undo ----
            story.getStoryContents().rearrangeNodeInStory(fromIndex, toIndex);
          });
      },

      /**
       * Adds a prerequisite skill id to a node of a story and records the
       * change in the undo/redo service.
       */
      addPrerequisiteSkillIdToNode: function(story, nodeId, skillId) {
        var storyNode = _getStoryNode(story.getStoryContents(), nodeId);
        var oldPrerequisiteSkillIds = angular.copy(
          storyNode.getPrerequisiteSkillIds());
        var newPrerequisiteSkillIds = angular.copy(oldPrerequisiteSkillIds);
        newPrerequisiteSkillIds.push(skillId);
        _applyStoryNodePropertyChange(
          story, STORY_NODE_PROPERTY_PREREQUISITE_SKILL_IDS, nodeId,
          oldPrerequisiteSkillIds, newPrerequisiteSkillIds,
          function(changeDict, story) {
            // ---- Apply ----
            story.getStoryContents().addPrerequisiteSkillIdToNode(
              nodeId, skillId);
          }, function(changeDict, story) {
            // ---- Undo ----
            story.getStoryContents().removePrerequisiteSkillIdFromNode(
              nodeId, skillId);
          });
      },

      /**
       * Removes a prerequisite skill id from a node of a story and records the
       * change in the undo/redo service.
       */
      removePrerequisiteSkillIdFromNode: function(story, nodeId, skillId) {
        var storyNode = _getStoryNode(story.getStoryContents(), nodeId);
        var oldPrerequisiteSkillIds = angular.copy(
          storyNode.getPrerequisiteSkillIds());
        var newPrerequisiteSkillIds = angular.copy(oldPrerequisiteSkillIds);
        var index = newPrerequisiteSkillIds.indexOf(skillId);
        if (index === -1) {
          throw new Error(
            'The given prerequisite skill is not part of the node');
        }
        newPrerequisiteSkillIds.splice(index, 1);

        _applyStoryNodePropertyChange(
          story, STORY_NODE_PROPERTY_PREREQUISITE_SKILL_IDS, nodeId,
          oldPrerequisiteSkillIds, newPrerequisiteSkillIds,
          function(changeDict, story) {
            // ---- Apply ----
            story.getStoryContents().removePrerequisiteSkillIdFromNode(
              nodeId, skillId);
          }, function(changeDict, story) {
            // ---- Undo ----
            story.getStoryContents().addPrerequisiteSkillIdToNode(
              nodeId, skillId);
          });
      },

      /**
       * Adds an acquired skill id to a node of a story and records the change
       * in the undo/redo service.
       */
      addAcquiredSkillIdToNode: function(story, nodeId, skillId) {
        var storyNode = _getStoryNode(story.getStoryContents(), nodeId);
        var oldAcquiredSkillIds = angular.copy(
          storyNode.getAcquiredSkillIds());
        var newAcquiredSkillIds = angular.copy(oldAcquiredSkillIds);
        newAcquiredSkillIds.push(skillId);

        _applyStoryNodePropertyChange(
          story, STORY_NODE_PROPERTY_ACQUIRED_SKILL_IDS, nodeId,
          oldAcquiredSkillIds, newAcquiredSkillIds,
          function(changeDict, story) {
            // ---- Apply ----
            story.getStoryContents().addAcquiredSkillIdToNode(
              nodeId, skillId);
          }, function(changeDict, story) {
            // ---- Undo ----
            story.getStoryContents().removeAcquiredSkillIdFromNode(
              nodeId, skillId);
          });
      },

      /**
       * Removes an acquired skill id from a node of a story and records the
       * change in the undo/redo service.
       */
      removeAcquiredSkillIdFromNode: function(story, nodeId, skillId) {
        var storyNode = _getStoryNode(story.getStoryContents(), nodeId);
        var oldAcquiredSkillIds = angular.copy(
          storyNode.getAcquiredSkillIds());
        var newAcquiredSkillIds = angular.copy(oldAcquiredSkillIds);
        var index = newAcquiredSkillIds.indexOf(skillId);
        if (index === -1) {
          throw new Error(
            'The given acquired skill id is not part of the node');
        }
        newAcquiredSkillIds.splice(index, 1);

        _applyStoryNodePropertyChange(
          story, STORY_NODE_PROPERTY_ACQUIRED_SKILL_IDS, nodeId,
          oldAcquiredSkillIds, newAcquiredSkillIds,
          function(changeDict, story) {
            // ---- Apply ----
            story.getStoryContents().removeAcquiredSkillIdFromNode(
              nodeId, skillId);
          }, function(changeDict, story) {
            // ---- Undo ----
            story.getStoryContents().addAcquiredSkillIdToNode(
              nodeId, skillId);
          });
      }
    };
  }]);
