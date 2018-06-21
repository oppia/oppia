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
 * @fileoverview Service to build changes to a topic. These changes may
 * then be used by other services, such as a backend API service to update the
 * topic in the backend. This service also registers all changes with the
 * undo/redo service.
 */

// These should match the constants defined in core.domain.topic_domain.

oppia.constant('CMD_ADD_SUBTOPIC', 'add_subtopic');
oppia.constant('CMD_DELETE_SUBTOPIC', 'delete_subtopic');
oppia.constant('CMD_ADD_UNCATEGORIZED_SKILL_ID', 'add_uncategorized_skill_id');
oppia.constant(
  'CMD_REMOVE_UNCATEGORIZED_SKILL_ID', 'remove_uncategorized_skill_id');
oppia.constant('CMD_MOVE_SKILL_ID_TO_SUBTOPIC', 'move_skill_id_to_subtopic');
oppia.constant(
  'CMD_REMOVE_SKILL_ID_FROM_SUBTOPIC', 'remove_skill_id_from_subtopic');

oppia.constant('CMD_UPDATE_TOPIC_PROPERTY', 'update_topic_property');
oppia.constant('CMD_UPDATE_SUBTOPIC_PROPERTY', 'update_subtopic_property');

oppia.constant('TOPIC_PROPERTY_NAME', 'name');
oppia.constant('TOPIC_PROPERTY_DESCRIPTION', 'description');
oppia.constant('TOPIC_PROPERTY_CANONICAL_STORY_IDS', 'canonical_story_ids');
oppia.constant('TOPIC_PROPERTY_ADDITIONAL_STORY_IDS', 'additional_story_ids');
oppia.constant('TOPIC_PROPERTY_LANGUAGE_CODE', 'language_code');

oppia.constant('SUBTOPIC_PROPERTY_TITLE', 'title');

oppia.factory('TopicUpdateService', [
  'ChangeObjectFactory', 'UndoRedoService',
  'CMD_ADD_SUBTOPIC', 'CMD_DELETE_SUBTOPIC',
  'CMD_ADD_UNCATEGORIZED_SKILL_ID', 'CMD_REMOVE_UNCATEGORIZED_SKILL_ID',
  'CMD_MOVE_SKILL_ID_TO_SUBTOPIC', 'CMD_REMOVE_SKILL_ID_FROM_SUBTOPIC',
  'CMD_UPDATE_TOPIC_PROPERTY', 'CMD_UPDATE_SUBTOPIC_PROPERTY',
  'TOPIC_PROPERTY_NAME', 'TOPIC_PROPERTY_DESCRIPTION',
  'TOPIC_PROPERTY_CANONICAL_STORY_IDS', 'TOPIC_PROPERTY_ADDITIONAL_STORY_IDS',
  'TOPIC_PROPERTY_LANGUAGE_CODE', 'SUBTOPIC_PROPERTY_TITLE', function(
      ChangeObjectFactory, UndoRedoService,
      CMD_ADD_SUBTOPIC, CMD_DELETE_SUBTOPIC,
      CMD_ADD_UNCATEGORIZED_SKILL_ID, CMD_REMOVE_UNCATEGORIZED_SKILL_ID,
      CMD_MOVE_SKILL_ID_TO_SUBTOPIC, CMD_REMOVE_SKILL_ID_FROM_SUBTOPIC,
      CMD_UPDATE_TOPIC_PROPERTY, CMD_UPDATE_SUBTOPIC_PROPERTY,
      TOPIC_PROPERTY_NAME, TOPIC_PROPERTY_DESCRIPTION,
      TOPIC_PROPERTY_CANONICAL_STORY_IDS, TOPIC_PROPERTY_ADDITIONAL_STORY_IDS,
      TOPIC_PROPERTY_LANGUAGE_CODE, SUBTOPIC_PROPERTY_TITLE) {
    // Creates a change using an apply function, reverse function, a change
    // command and related parameters. The change is applied to a given
    // topic.
    var _applyChange = function(topic, command, params, apply, reverse) {
      var changeDict = angular.copy(params);
      changeDict.cmd = command;
      var changeObj = ChangeObjectFactory.create(changeDict, apply, reverse);
      UndoRedoService.applyChange(changeObj, topic);
    };

    var _getParameterFromChangeDict = function(changeDict, paramName) {
      return changeDict[paramName];
    };

    // Applies a topic property change, specifically. See _applyChange()
    // for details on the other behavior of this function.
    var _applyTopicPropertyChange = function(
        topic, propertyName, newValue, oldValue, apply, reverse) {
      _applyChange(topic, CMD_UPDATE_TOPIC_PROPERTY, {
        property_name: propertyName,
        new_value: angular.copy(newValue),
        old_value: angular.copy(oldValue),
        change_affects_subtopic_page: false
      }, apply, reverse);
    };

    var _applySubtopicPropertyChange = function(
        topic, propertyName, subtopicId, newValue, oldValue, apply, reverse) {
      _applyChange(topic, CMD_UPDATE_SUBTOPIC_PROPERTY, {
        subtopic_id: subtopicId,
        property_name: propertyName,
        new_value: angular.copy(newValue),
        old_value: angular.copy(oldValue),
        change_affects_subtopic_page: false
      }, apply, reverse);
    };

    var _getNewPropertyValueFromChangeDict = function(changeDict) {
      return _getParameterFromChangeDict(changeDict, 'new_value');
    };

    var _checkIfSkillIdInList = function(skillId, skillIdList) {
      if (skillIdList.indexOf(skillId) === -1) {
        return false;
      }
      return true;
    };

    var _getSubtopicIdFromChangeDict = function(changeDict) {
      return _getParameterFromChangeDict(changeDict, 'subtopic_id');
    };

    // These functions are associated with updates available in
    // core.domain.topic_services.apply_change_list.
    return {
      /**
       * Changes the name of a topic and records the change in the
       * undo/redo service.
       */
      setTopicName: function(topic, name) {
        var oldName = angular.copy(topic.getName());
        _applyTopicPropertyChange(
          topic, TOPIC_PROPERTY_NAME, name, oldName,
          function(changeDict, topic) {
            // Apply
            var name = _getNewPropertyValueFromChangeDict(changeDict);
            topic.setName(name);
          }, function(changeDict, topic) {
            // Undo.
            topic.setName(oldName);
          });
      },

      /**
       * Changes the description of a topic and records the change in the
       * undo/redo service.
       */
      setTopicDescription: function(topic, description) {
        var oldDescription = angular.copy(topic.getDescription());
        _applyTopicPropertyChange(
          topic, TOPIC_PROPERTY_DESCRIPTION, description, oldDescription,
          function(changeDict, topic) {
            // Apply
            var description = _getNewPropertyValueFromChangeDict(changeDict);
            topic.setDescription(description);
          }, function(changeDict, topic) {
            // Undo.
            topic.setDescription(oldDescription);
          });
      },

      /**
       * Changes the language code of a topic and records the change in
       * the undo/redo service.
       */
      setTopicLanguageCode: function(topic, languageCode) {
        var oldLanguageCode = angular.copy(topic.getLanguageCode());
        _applyTopicPropertyChange(
          topic, TOPIC_PROPERTY_LANGUAGE_CODE, languageCode,
          oldLanguageCode,
          function(changeDict, topic) {
            // Apply.
            var languageCode = _getNewPropertyValueFromChangeDict(changeDict);
            topic.setLanguageCode(languageCode);
          }, function(changeDict, topic) {
            // Undo.
            topic.setLanguageCode(oldLanguageCode);
          });
      },

      /**
       * Creates a subtopic and adds it to the topic and records the change in
       * the undo/redo service.
       */
      addSubtopic: function(topic, title) {
        var nextSubtopicId = topic.getNextSubtopicId();
        _applyChange(topic, CMD_ADD_SUBTOPIC, {
          subtopic_id: nextSubtopicId,
          title: title,
          change_affects_subtopic_page: false
        }, function(changeDict, topic) {
          // Apply.
          topic.addSubtopic(title);
        }, function(changeDict, topic) {
          // Undo.
          var subtopicId = _getSubtopicIdFromChangeDict(changeDict);
          topic.deleteSubtopic(subtopicId);
        });
      },

      /**
       * @param {Topic} topic - The topic object to be edited.
       * @param {number} subtopicId - The id of the subtopic to delete.
       */
      deleteSubtopic: function(topic, subtopicId) {
        var subtopic = topic.getSubtopicById(subtopicId);
        if (!subtopic) {
          throw Error('Subtopic doesn\'t exist');
        }
        var title = subtopic.getTitle();
        var skillIds = subtopic.getSkillIds();
        var newlyCreated = false;
        var changeList = UndoRedoService.getCommittableChangeList();
        for (var i = 0; i < changeList.length; i++) {
          if (changeList[i].cmd === 'add_subtopic' &&
              changeList[i].subtopic_id === subtopicId) {
            newlyCreated = true;
          }
        }
        _applyChange(topic, CMD_DELETE_SUBTOPIC, {
          subtopic_id: subtopicId,
          change_affects_subtopic_page: false
        }, function(changeDict, topic) {
          // Apply.
          topic.deleteSubtopic(subtopicId, newlyCreated);
        }, function(changeDict, topic) {
          // Undo.
          throw Error('A deleted subtopic cannot be restored');
        });
        if (newlyCreated) {
          // Get the current change list.
          var currentChangeList = UndoRedoService.getChangeList();
          var indicesToDelete = [];
          for (var i = 0; i < currentChangeList.length; i++) {
            var backendChangeDict =
              currentChangeList[i].getBackendChangeObject();
            if (backendChangeDict.subtopic_id === subtopicId) {
              // The indices in the change list corresponding to changes to the
              // currently deleted and newly created subtopic are to be removed
              // from the list.
              indicesToDelete.push(i);
              continue;
            }
            // When a newly created subtopic is deleted, the subtopics created
            // after it would have their id reduced by 1.
            if (backendChangeDict.subtopic_id > subtopicId) {
              backendChangeDict.subtopic_id--;
            }
            // Apply the above id reduction changes to the backend change.
            currentChangeList[i].setBackendChangeObject(backendChangeDict);
          }
          // The new change list is found by deleting the above found elements.
          var newChangeList = currentChangeList.filter(function(change) {
            var changeObjectIndex = currentChangeList.indexOf(change);
            // Return all elements that were not deleted.
            return (indicesToDelete.indexOf(changeObjectIndex) === -1);
          });
          // The new changelist is set.
          UndoRedoService.setChangeList(newChangeList);
        }
      },

      /**
       * Moves a skill id to a subtopic from either another subtopic or
       * uncategorized skill ids and records the change in
       * the undo/redo service.
       */
      moveSkillIdToSubtopic: function(
          topic, oldSubtopicId, newSubtopicId, skillId) {
        if (newSubtopicId === null) {
          throw Error('New subtopic cannot be null');
        }
        if (oldSubtopicId !== null) {
          var oldSubtopic = topic.getSubtopicById(oldSubtopicId);
        }
        var newSubtopic = topic.getSubtopicById(newSubtopicId);
        _applyChange(topic, CMD_MOVE_SKILL_ID_TO_SUBTOPIC, {
          old_subtopic_id: oldSubtopicId,
          new_subtopic_id: newSubtopicId,
          skill_id: skillId,
          change_affects_subtopic_page: false
        }, function(changeDict, topic) {
          // Apply.
          if (oldSubtopicId === null) {
            topic.removeUncategorizedSkillId(skillId);
          } else {
            oldSubtopic.removeSkillId(skillId);
          }
          newSubtopic.addSkillId(skillId);
        }, function(changeDict, topic) {
          // Undo.
          newSubtopic.removeSkillId(skillId);
          if (oldSubtopicId === null) {
            topic.addUncategorizedSkillId(skillId);
          } else {
            oldSubtopic.addSkillId(skillId);
          }
        });
      },

      /**
       * Moves a skill id from a subtopic to uncategorized skill ids and records
       * the change in the undo/redo service.
       */
      removeSkillIdFromSubtopic: function(topic, subtopicId, skillId) {
        var subtopic = topic.getSubtopicById(subtopicId);
        _applyChange(topic, CMD_REMOVE_SKILL_ID_FROM_SUBTOPIC, {
          subtopic_id: subtopicId,
          skill_id: skillId,
          change_affects_subtopic_page: false
        }, function(changeDict, topic) {
          // Apply.
          subtopic.removeSkillId(skillId);
          if (!_checkIfSkillIdInList(skillId, subtopic.getSkillIds())) {
            topic.addUncategorizedSkillId(skillId);
          }
        }, function(changeDict, topic) {
          // Undo.
          subtopic.addSkillId(skillId);
          topic.removeUncategorizedSkillId(skillId);
        });
      },

      /**
       * Changes the title of a subtopic and records the change in
       * the undo/redo service.
       */
      setSubtopicTitle: function(topic, subtopicId, title) {
        var subtopic = topic.getSubtopicById(subtopicId);
        if (!subtopic) {
          throw Error('Subtopic doesn\'t exist');
        }
        var oldTitle = angular.copy(subtopic.getTitle());
        _applySubtopicPropertyChange(
          topic, SUBTOPIC_PROPERTY_TITLE, subtopicId, title, oldTitle,
          function(changeDict, topic) {
            // Apply.
            var title = _getNewPropertyValueFromChangeDict(changeDict);
            subtopic.setTitle(title);
          }, function(changeDict, topic) {
            // Undo.
            subtopic.setTitle(oldTitle);
          });
      },

      /**
       * Adds an additional story id to a topic and records the change
       * in the undo/redo service.
       */
      addAdditionalStoryId: function(topic, storyId) {
        var oldAdditionalStoryIdsList = angular.copy(
          topic.getAdditionalStoryIds());
        var newAdditionalStoryIdsList = angular.copy(oldAdditionalStoryIdsList);
        newAdditionalStoryIdsList.push(storyId);
        _applyTopicPropertyChange(
          topic, TOPIC_PROPERTY_ADDITIONAL_STORY_IDS, newAdditionalStoryIdsList,
          oldAdditionalStoryIdsList,
          function(changeDict, topic) {
            // Apply.
            topic.addAdditionalStoryId(storyId);
          }, function(changeDict, topic) {
            // Undo.
            topic.removeAdditionalStoryId(storyId);
          });
      },

      /**
       * Removes an additional story id from a topic and records the change
       * in the undo/redo service.
       */
      removeAdditionalStoryId: function(topic, storyId) {
        var oldAdditionalStoryIdsList = angular.copy(
          topic.getAdditionalStoryIds());
        var newAdditionalStoryIdsList = angular.copy(oldAdditionalStoryIdsList);
        var index = newAdditionalStoryIdsList.indexOf(storyId);
        if (index === -1) {
          throw Error(
            'Given story id is not present in additional stories of topic.');
        }
        newAdditionalStoryIdsList.splice(index, 1);
        _applyTopicPropertyChange(
          topic, TOPIC_PROPERTY_ADDITIONAL_STORY_IDS, newAdditionalStoryIdsList,
          oldAdditionalStoryIdsList,
          function(changeDict, topic) {
            // Apply.
            topic.removeAdditionalStoryId(storyId);
          }, function(changeDict, topic) {
            // Undo.
            topic.addAdditionalStoryId(storyId);
          });
      },

      /**
       * Adds a canonical story id to a topic and records the change
       * in the undo/redo service.
       */
      addCanonicalStoryId: function(topic, storyId) {
        var oldCanonicalStoryIdsList = angular.copy(
          topic.getCanonicalStoryIds());
        newCanonicalStoryIdsList = angular.copy(oldCanonicalStoryIdsList);
        newCanonicalStoryIdsList.push(storyId);
        _applyTopicPropertyChange(
          topic, TOPIC_PROPERTY_CANONICAL_STORY_IDS, newCanonicalStoryIdsList,
          oldCanonicalStoryIdsList,
          function(changeDict, topic) {
            // Apply.
            topic.addCanonicalStoryId(storyId);
          }, function(changeDict, topic) {
            // Undo.
            topic.removeCanonicalStoryId(storyId);
          });
      },

      /**
       * Removes an canonical story id from a topic and records the change
       * in the undo/redo service.
       */
      removeCanonicalStoryId: function(topic, storyId) {
        var oldCanonicalStoryIdsList = angular.copy(
          topic.getCanonicalStoryIds());
        var newCanonicalStoryIdsList = angular.copy(oldCanonicalStoryIdsList);
        var index = newCanonicalStoryIdsList.indexOf(storyId);
        if (index === -1) {
          throw Error(
            'Given story id is not present in additional stories of topic.');
        }
        newCanonicalStoryIdsList.splice(index, 1);
        _applyTopicPropertyChange(
          topic, TOPIC_PROPERTY_CANONICAL_STORY_IDS, newCanonicalStoryIdsList,
          oldCanonicalStoryIdsList,
          function(changeDict, topic) {
            // Apply.
            topic.removeCanonicalStoryId(storyId);
          }, function(changeDict, topic) {
            // Undo.
            topic.addCanonicalStoryId(storyId);
          });
      },

      /**
       * Adds an uncategorized skill id to a topic and records the change
       * in the undo/redo service.
       */
      addUncategorizedSkillId: function(topic, skillId) {
        _applyChange(topic, CMD_ADD_UNCATEGORIZED_SKILL_ID, {
          new_uncategorized_skill_id: skillId,
          change_affects_subtopic_page: false
        }, function(changeDict, topic) {
          // Apply.
          var newSkillId = _getParameterFromChangeDict(
            changeDict, 'new_uncategorized_skill_id');
          topic.addUncategorizedSkillId(newSkillId);
        }, function(changeDict, topic) {
          // Undo.
          var newSkillId = _getParameterFromChangeDict(
            changeDict, 'new_uncategorized_skill_id');
          topic.removeUncategorizedSkillId(newSkillId);
        });
      },

      /**
       * Removes an uncategorized skill id to a topic and records the change
       * in the undo/redo service.
       */
      removeUncategorizedSkillId: function(topic, skillId) {
        _applyChange(topic, CMD_REMOVE_UNCATEGORIZED_SKILL_ID, {
          uncategorized_skill_id: skillId,
          change_affects_subtopic_page: false
        }, function(changeDict, topic) {
          // Apply.
          var newSkillId = _getParameterFromChangeDict(
            changeDict, 'uncategorized_skill_id');
          topic.removeUncategorizedSkillId(newSkillId);
        }, function(changeDict, topic) {
          // Undo.
          var newSkillId = _getParameterFromChangeDict(
            changeDict, 'uncategorized_skill_id');
          topic.addUncategorizedSkillId(newSkillId);
        });
      }
    };
  }]);
