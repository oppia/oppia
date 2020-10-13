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
 * @fileoverview Service to build changes to a topic. These changes may
 * then be used by other services, such as a backend API service to update the
 * topic in the backend. This service also registers all changes with the
 * undo/redo service.
 * The addCanonicalStory and addAdditionalStory functions are not present here
 * as this process is carried out in the backend when a story is created, as a
 * story would always be linked to a topic.
 */

import { Change } from 'domain/editor/undo_redo/change.model';

require('domain/editor/undo_redo/undo-redo.service.ts');
require('domain/topic/topic-domain.constants.ajs.ts');

angular.module('oppia').factory('TopicUpdateService', [
  'UndoRedoService',
  'CMD_ADD_SUBTOPIC', 'CMD_DELETE_ADDITIONAL_STORY',
  'CMD_DELETE_CANONICAL_STORY', 'CMD_DELETE_SUBTOPIC',
  'CMD_MOVE_SKILL_ID_TO_SUBTOPIC', 'CMD_REARRANGE_CANONICAL_STORY',
  'CMD_REARRANGE_SKILL_IN_SUBTOPIC',
  'CMD_REARRANGE_SUBTOPIC',
  'CMD_REMOVE_SKILL_ID_FROM_SUBTOPIC',
  'CMD_REMOVE_UNCATEGORIZED_SKILL_ID', 'CMD_UPDATE_SUBTOPIC_PAGE_PROPERTY',
  'CMD_UPDATE_SUBTOPIC_PROPERTY', 'CMD_UPDATE_TOPIC_PROPERTY',
  'SUBTOPIC_PAGE_PROPERTY_PAGE_CONTENTS_AUDIO',
  'SUBTOPIC_PAGE_PROPERTY_PAGE_CONTENTS_HTML',
  'SUBTOPIC_PROPERTY_THUMBNAIL_BG_COLOR',
  'SUBTOPIC_PROPERTY_THUMBNAIL_FILENAME', 'SUBTOPIC_PROPERTY_TITLE',
  'SUBTOPIC_PROPERTY_URL_FRAGMENT',
  'TOPIC_PROPERTY_ABBREVIATED_NAME', 'TOPIC_PROPERTY_DESCRIPTION',
  'TOPIC_PROPERTY_LANGUAGE_CODE', 'TOPIC_PROPERTY_META_TAG_CONTENT',
  'TOPIC_PROPERTY_NAME', 'TOPIC_PROPERTY_PRACTICE_TAB_IS_DISPLAYED',
  'TOPIC_PROPERTY_THUMBNAIL_BG_COLOR',
  'TOPIC_PROPERTY_THUMBNAIL_FILENAME',
  'TOPIC_PROPERTY_URL_FRAGMENT', function(
      UndoRedoService,
      CMD_ADD_SUBTOPIC, CMD_DELETE_ADDITIONAL_STORY,
      CMD_DELETE_CANONICAL_STORY, CMD_DELETE_SUBTOPIC,
      CMD_MOVE_SKILL_ID_TO_SUBTOPIC, CMD_REARRANGE_CANONICAL_STORY,
      CMD_REARRANGE_SKILL_IN_SUBTOPIC,
      CMD_REARRANGE_SUBTOPIC,
      CMD_REMOVE_SKILL_ID_FROM_SUBTOPIC,
      CMD_REMOVE_UNCATEGORIZED_SKILL_ID, CMD_UPDATE_SUBTOPIC_PAGE_PROPERTY,
      CMD_UPDATE_SUBTOPIC_PROPERTY, CMD_UPDATE_TOPIC_PROPERTY,
      SUBTOPIC_PAGE_PROPERTY_PAGE_CONTENTS_AUDIO,
      SUBTOPIC_PAGE_PROPERTY_PAGE_CONTENTS_HTML,
      SUBTOPIC_PROPERTY_THUMBNAIL_BG_COLOR,
      SUBTOPIC_PROPERTY_THUMBNAIL_FILENAME, SUBTOPIC_PROPERTY_TITLE,
      SUBTOPIC_PROPERTY_URL_FRAGMENT,
      TOPIC_PROPERTY_ABBREVIATED_NAME, TOPIC_PROPERTY_DESCRIPTION,
      TOPIC_PROPERTY_LANGUAGE_CODE, TOPIC_PROPERTY_META_TAG_CONTENT,
      TOPIC_PROPERTY_NAME, TOPIC_PROPERTY_PRACTICE_TAB_IS_DISPLAYED,
      TOPIC_PROPERTY_THUMBNAIL_BG_COLOR,
      TOPIC_PROPERTY_THUMBNAIL_FILENAME,
      TOPIC_PROPERTY_URL_FRAGMENT) {
    // Creates a change using an apply function, reverse function, a change
    // command and related parameters. The change is applied to a given
    // topic.
    // entity can be a topic object or a subtopic page object.
    var _applyChange = function(entity, command, params, apply, reverse) {
      var changeDict = angular.copy(params);
      changeDict.cmd = command;
      var changeObj = new Change(changeDict, apply, reverse);
      UndoRedoService.applyChange(changeObj, entity);
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
        old_value: angular.copy(oldValue) || null
      }, apply, reverse);
    };

    var _applySubtopicPropertyChange = function(
        topic, propertyName, subtopicId, newValue, oldValue, apply, reverse) {
      _applyChange(topic, CMD_UPDATE_SUBTOPIC_PROPERTY, {
        subtopic_id: subtopicId,
        property_name: propertyName,
        new_value: angular.copy(newValue),
        old_value: angular.copy(oldValue)
      }, apply, reverse);
    };

    var _applySubtopicPagePropertyChange = function(
        subtopicPage, propertyName, subtopicId, newValue, oldValue, apply,
        reverse) {
      _applyChange(subtopicPage, CMD_UPDATE_SUBTOPIC_PAGE_PROPERTY, {
        subtopic_id: subtopicId,
        property_name: propertyName,
        new_value: angular.copy(newValue),
        old_value: angular.copy(oldValue)
      }, apply, reverse);
    };

    var _getNewPropertyValueFromChangeDict = function(changeDict) {
      return _getParameterFromChangeDict(changeDict, 'new_value');
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
            // ---- Apply ----
            var name = _getNewPropertyValueFromChangeDict(changeDict);
            topic.setName(name);
          }, function(changeDict, topic) {
            // ---- Undo ----
            topic.setName(oldName);
          });
      },

      /**
       * Changes the abbreviated name of a topic and records the change in the
       * undo/redo service.
       */
      setAbbreviatedTopicName: function(topic, abbreviatedName) {
        var oldAbbreviatedName = angular.copy(topic.getAbbreviatedName());
        _applyTopicPropertyChange(
          topic, TOPIC_PROPERTY_ABBREVIATED_NAME,
          abbreviatedName, oldAbbreviatedName,
          function(changeDict, topic) {
            // ---- Apply ----
            var name = _getNewPropertyValueFromChangeDict(changeDict);
            topic.setAbbreviatedName(name);
          }, function(changeDict, topic) {
            // ---- Undo ----
            topic.setAbbreviatedName(oldAbbreviatedName);
          });
      },

      /**
       * Changes the meta tag content of a topic and records the change in the
       * undo/redo service.
       */
      setMetaTagContent: function(topic, metaTagContent) {
        var oldMetaTagContent = angular.copy(topic.getMetaTagContent());
        _applyTopicPropertyChange(
          topic, TOPIC_PROPERTY_META_TAG_CONTENT,
          metaTagContent, oldMetaTagContent,
          function(changeDict, topic) {
            // ---- Apply ----
            var metaTagContent = _getNewPropertyValueFromChangeDict(
              changeDict);
            topic.setMetaTagContent(metaTagContent);
          }, function(changeDict, topic) {
            // ---- Undo ----
            topic.setMetaTagContent(oldMetaTagContent);
          });
      },

      /**
       * Changes the 'practice tab is displayed' property of a topic and
       * records the change in the undo/redo service.
       */
      setPracticeTabIsDisplayed: function(topic, practiceTabIsDisplayed) {
        var oldPracticeTabIsDisplayed = angular.copy(
          topic.getPracticeTabIsDisplayed());
        _applyTopicPropertyChange(
          topic, TOPIC_PROPERTY_PRACTICE_TAB_IS_DISPLAYED,
          practiceTabIsDisplayed, oldPracticeTabIsDisplayed,
          function(changeDict, topic) {
            // ---- Apply ----
            var practiceTabIsDisplayed = _getNewPropertyValueFromChangeDict(
              changeDict);
            topic.setPracticeTabIsDisplayed(practiceTabIsDisplayed);
          }, function(changeDict, topic) {
            // ---- Undo ----
            topic.setPracticeTabIsDisplayed(oldPracticeTabIsDisplayed);
          });
      },

      /**
       * Changes the url fragment of a topic and records the change in the
       * undo/redo service.
       */
      setTopicUrlFragment: function(topic, urlFragment) {
        var oldUrlFragment = angular.copy(topic.getUrlFragment());
        _applyTopicPropertyChange(
          topic, TOPIC_PROPERTY_URL_FRAGMENT,
          urlFragment, oldUrlFragment,
          function(changeDict, topic) {
            // ---- Apply ----
            var newUrlFragment = (
              _getNewPropertyValueFromChangeDict(changeDict));
            topic.setUrlFragment(newUrlFragment);
          }, function(changeDict, topic) {
            // ---- Undo ----
            topic.setUrlFragment(oldUrlFragment);
          });
      },

      /**
       * Changes the thumbnail filename of a topic and records the change in the
       * undo/redo service.
       */
      setTopicThumbnailFilename: function(topic, thumbnailFilename) {
        var oldThumbnailFilename = angular.copy(topic.getThumbnailFilename());
        _applyTopicPropertyChange(
          topic, TOPIC_PROPERTY_THUMBNAIL_FILENAME,
          thumbnailFilename, oldThumbnailFilename,
          function(changeDict, topic) {
            // ---- Apply ----
            var thumbnailFilename = (
              _getNewPropertyValueFromChangeDict(changeDict));
            topic.setThumbnailFilename(thumbnailFilename);
          }, function(changeDict, topic) {
            // ---- Undo ----
            topic.setThumbnailFilename(oldThumbnailFilename);
          });
      },

      /**
       * Changes the thumbnail background color of a topic and records the
       * change in the undo/redo service.
       */
      setTopicThumbnailBgColor: function(topic, thumbnailBgColor) {
        var oldThumbnailBgColor = angular.copy(topic.getThumbnailBgColor());
        _applyTopicPropertyChange(
          topic, TOPIC_PROPERTY_THUMBNAIL_BG_COLOR,
          thumbnailBgColor, oldThumbnailBgColor,
          function(changeDict, topic) {
            // ---- Apply ----
            var thumbnailBgColor = (
              _getNewPropertyValueFromChangeDict(changeDict));
            topic.setThumbnailBgColor(thumbnailBgColor);
          }, function(changeDict, topic) {
            // ---- Undo ----
            topic.setThumbnailBgColor(oldThumbnailBgColor);
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
            // ---- Apply ----
            var description = _getNewPropertyValueFromChangeDict(changeDict);
            topic.setDescription(description);
          }, function(changeDict, topic) {
            // ---- Undo ----
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
            // ---- Apply ----
            var languageCode = _getNewPropertyValueFromChangeDict(changeDict);
            topic.setLanguageCode(languageCode);
          }, function(changeDict, topic) {
            // ---- Undo ----
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
          title: title
        }, function(changeDict, topic) {
          // ---- Apply ----
          topic.addSubtopic(title);
        }, function(changeDict, topic) {
          // ---- Undo ----
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
          throw new Error('Subtopic doesn\'t exist');
        }
        var newlyCreated = false;
        var changeList = UndoRedoService.getCommittableChangeList();
        for (var i = 0; i < changeList.length; i++) {
          if (changeList[i].cmd === 'add_subtopic' &&
              changeList[i].subtopic_id === subtopicId) {
            newlyCreated = true;
          }
        }
        if (newlyCreated) {
          // Get the current change list.
          var currentChangeList = UndoRedoService.getChangeList();
          var indicesToDelete = [];
          // Loop over the current changelist and handle all the cases where
          // a skill moved into the subtopic or moved out of it.
          for (var i = 0; i < currentChangeList.length; i++) {
            var changeDict =
              currentChangeList[i].getBackendChangeObject();
            if (changeDict.cmd === CMD_MOVE_SKILL_ID_TO_SUBTOPIC) {
              // If a skill was moved into the subtopic, then that change is
              // modified to have the skill move into the uncategorized section
              // since after this delete, it would be as if this subtopic never
              // existed.
              if (changeDict.new_subtopic_id === subtopicId) {
                // If the origin of the move operation was the uncategorized
                // section itself, delete that change, since no change is to be
                // done following the previous comment.
                if (changeDict.old_subtopic_id === null) {
                  indicesToDelete.push(i);
                } else {
                  // Change the move operation to the deleted subtopic to a
                  // remove operation, to move that skill into the uncategorized
                  // section from its origin.
                  changeDict.cmd = CMD_REMOVE_SKILL_ID_FROM_SUBTOPIC;
                  changeDict.subtopic_id = changeDict.old_subtopic_id;
                  delete changeDict.old_subtopic_id;
                  delete changeDict.new_subtopic_id;
                }
              } else if (changeDict.old_subtopic_id === subtopicId) {
                // Any operation where a skill was moved out of this subtopic
                // would now be equivalent to a move out from the uncategorized
                // section, as a newly created subtopic wouldn't have any skills
                // of its own initially, and any skills moved into it have been
                // shifted to the uncategorized section.
                changeDict.old_subtopic_id = null;
              }
            } else if (changeDict.cmd === CMD_REMOVE_SKILL_ID_FROM_SUBTOPIC) {
              // If a skill was removed from this subtopic, then that change
              // should be deleted, since all skills moved into the subtopic
              // have already been moved into the uncategorized section.
              if (changeDict.subtopic_id === subtopicId) {
                indicesToDelete.push(i);
              }
            }
            currentChangeList[i].setBackendChangeObject(changeDict);
          }
          for (var i = 0; i < currentChangeList.length; i++) {
            var backendChangeDict =
              currentChangeList[i].getBackendChangeObject();
            if (backendChangeDict.hasOwnProperty('subtopic_id')) {
              if (backendChangeDict.subtopic_id === subtopicId) {
                // The indices in the change list corresponding to changes to
                // the currently deleted and newly created subtopic are to be
                // removed from the list.
                indicesToDelete.push(i);
                continue;
              }
              // When a newly created subtopic is deleted, the subtopics created
              // after it would have their id reduced by 1.
              if (backendChangeDict.subtopic_id > subtopicId) {
                backendChangeDict.subtopic_id--;
              }
            }
            if (backendChangeDict.hasOwnProperty('old_subtopic_id')) {
              if (backendChangeDict.old_subtopic_id > subtopicId) {
                backendChangeDict.old_subtopic_id--;
              }
            }
            if (backendChangeDict.hasOwnProperty('new_subtopic_id')) {
              if (backendChangeDict.new_subtopic_id > subtopicId) {
                backendChangeDict.new_subtopic_id--;
              }
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
          topic.deleteSubtopic(subtopicId, newlyCreated);
          return;
        }
        _applyChange(topic, CMD_DELETE_SUBTOPIC, {
          subtopic_id: subtopicId
        }, function(changeDict, topic) {
          // ---- Apply ----
          topic.deleteSubtopic(subtopicId, newlyCreated);
        }, function(changeDict, topic) {
          // ---- Undo ----
          throw new Error('A deleted subtopic cannot be restored');
        });
      },

      /**
       * Moves a skill to a subtopic from either another subtopic or
       * uncategorized skills and records the change in the undo/redo service.
       */
      moveSkillToSubtopic: function(
          topic, oldSubtopicId, newSubtopicId, skillSummary) {
        if (newSubtopicId === null) {
          throw new Error('New subtopic cannot be null');
        }
        if (oldSubtopicId !== null) {
          var oldSubtopic = topic.getSubtopicById(oldSubtopicId);
        }
        var newSubtopic = topic.getSubtopicById(newSubtopicId);
        _applyChange(topic, CMD_MOVE_SKILL_ID_TO_SUBTOPIC, {
          old_subtopic_id: oldSubtopicId,
          new_subtopic_id: newSubtopicId,
          skill_id: skillSummary.getId()
        }, function(changeDict, topic) {
          // ---- Apply ----
          if (oldSubtopicId === null) {
            topic.removeUncategorizedSkill(skillSummary.getId());
          } else {
            oldSubtopic.removeSkill(skillSummary.getId());
          }
          newSubtopic.addSkill(
            skillSummary.getId(), skillSummary.getDescription());
        }, function(changeDict, topic) {
          // ---- Undo ----
          newSubtopic.removeSkill(skillSummary.getId());
          if (oldSubtopicId === null) {
            topic.addUncategorizedSkill(
              skillSummary.getId(), skillSummary.getDescription());
          } else {
            oldSubtopic.addSkill(
              skillSummary.getId(), skillSummary.getDescription());
          }
        });
      },

      /**
       * Moves a skill from a subtopic to uncategorized skills
       * and records the change in the undo/redo service.
       */
      removeSkillFromSubtopic: function(topic, subtopicId, skillSummary) {
        var subtopic = topic.getSubtopicById(subtopicId);
        _applyChange(topic, CMD_REMOVE_SKILL_ID_FROM_SUBTOPIC, {
          subtopic_id: subtopicId,
          skill_id: skillSummary.getId()
        }, function(changeDict, topic) {
          // ---- Apply ----
          subtopic.removeSkill(skillSummary.getId());
          if (!topic.hasUncategorizedSkill(skillSummary.getId())) {
            topic.addUncategorizedSkill(
              skillSummary.getId(), skillSummary.getDescription());
          }
        }, function(changeDict, topic) {
          // ---- Undo ----
          subtopic.addSkill(
            skillSummary.getId(), skillSummary.getDescription());
          topic.removeUncategorizedSkill(skillSummary.getId());
        });
      },

      /**
       * Changes the thumbnail filename of a subtopic and records the change in
       * the undo/redo service.
       */
      setSubtopicThumbnailFilename: function(
          topic, subtopicId, thumbnailFilename) {
        var subtopic = topic.getSubtopicById(subtopicId);
        if (!subtopic) {
          throw new Error('Subtopic doesn\'t exist');
        }
        var oldThumbnailFilename = angular.copy(
          subtopic.getThumbnailFilename());
        _applySubtopicPropertyChange(
          topic, SUBTOPIC_PROPERTY_THUMBNAIL_FILENAME, subtopicId,
          thumbnailFilename, oldThumbnailFilename,
          function(changeDict, topic) {
            // ---- Apply ----
            var thumbnailFilename = (
              _getNewPropertyValueFromChangeDict(changeDict));
            subtopic.setThumbnailFilename(thumbnailFilename);
          }, function(changeDict, topic) {
            // ---- Undo ----
            subtopic.setThumbnailFilename(oldThumbnailFilename);
          });
      },

      /**
       * Changes the url fragment of a subtopic and records the change in
       * the undo/redo service.
       */
      setSubtopicUrlFragment: function(topic, subtopicId, urlFragment) {
        var subtopic = topic.getSubtopicById(subtopicId);
        if (!subtopic) {
          throw new Error('Subtopic doesn\'t exist');
        }
        var oldUrlFragment = angular.copy(subtopic.getUrlFragment());
        _applySubtopicPropertyChange(
          topic, SUBTOPIC_PROPERTY_URL_FRAGMENT, subtopicId,
          urlFragment, oldUrlFragment,
          function(changeDict, topic) {
            // ---- Apply ----
            var newUrlFragment = (
              _getNewPropertyValueFromChangeDict(changeDict));
            subtopic.setUrlFragment(newUrlFragment);
          }, function(changeDict, topic) {
            // ---- Undo ----
            subtopic.setUrlFragment(oldUrlFragment);
          });
      },

      /**
       * Changes the thumbnail background color of a subtopic and records
       * the change in the undo/redo service.
       */
      setSubtopicThumbnailBgColor: function(
          topic, subtopicId, thumbnailBgColor) {
        var subtopic = topic.getSubtopicById(subtopicId);
        if (!subtopic) {
          throw new Error('Subtopic doesn\'t exist');
        }
        var oldThumbnailBgColor = angular.copy(
          subtopic.getThumbnailBgColor());
        _applySubtopicPropertyChange(
          topic, SUBTOPIC_PROPERTY_THUMBNAIL_BG_COLOR, subtopicId,
          thumbnailBgColor, oldThumbnailBgColor,
          function(changeDict, topic) {
            // ---- Apply ----
            var thumbnailBgColor = (
              _getNewPropertyValueFromChangeDict(changeDict));
            subtopic.setThumbnailBgColor(thumbnailBgColor);
          }, function(changeDict, topic) {
            // ---- Undo ----
            subtopic.setThumbnailBgColor(oldThumbnailBgColor);
          });
      },

      /**
       * Changes the title of a subtopic and records the change in
       * the undo/redo service.
       */
      setSubtopicTitle: function(topic, subtopicId, title) {
        var subtopic = topic.getSubtopicById(subtopicId);
        if (!subtopic) {
          throw new Error('Subtopic doesn\'t exist');
        }
        var oldTitle = angular.copy(subtopic.getTitle());
        _applySubtopicPropertyChange(
          topic, SUBTOPIC_PROPERTY_TITLE, subtopicId, title, oldTitle,
          function(changeDict, topic) {
            // ---- Apply ----
            var title = _getNewPropertyValueFromChangeDict(changeDict);
            subtopic.setTitle(title);
          }, function(changeDict, topic) {
            // ---- Undo ----
            subtopic.setTitle(oldTitle);
          });
      },

      setSubtopicPageContentsHtml: function(
          subtopicPage, subtopicId, newSubtitledHtml) {
        var oldSubtitledHtml = angular.copy(
          subtopicPage.getPageContents().getSubtitledHtml());
        _applySubtopicPagePropertyChange(
          subtopicPage, SUBTOPIC_PAGE_PROPERTY_PAGE_CONTENTS_HTML, subtopicId,
          newSubtitledHtml.toBackendDict(), oldSubtitledHtml.toBackendDict(),
          function(changeDict, subtopicPage) {
            // ---- Apply ----
            subtopicPage.getPageContents().setSubtitledHtml(newSubtitledHtml);
          }, function(changeDict, subtopicPage) {
            // ---- Undo ----
            subtopicPage.getPageContents().setSubtitledHtml(oldSubtitledHtml);
          });
      },

      setSubtopicPageContentsAudio: function(
          subtopicPage, subtopicId, newRecordedVoiceovers) {
        var oldRecordedVoiceovers = angular.copy(
          subtopicPage.getPageContents().getRecordedVoiceovers());
        _applySubtopicPagePropertyChange(
          subtopicPage, SUBTOPIC_PAGE_PROPERTY_PAGE_CONTENTS_AUDIO, subtopicId,
          newRecordedVoiceovers.toBackendDict(),
          oldRecordedVoiceovers.toBackendDict(),
          function(changeDict, subtopicPage) {
            // ---- Apply ----
            subtopicPage.getPageContents().setRecordedVoiceovers(
              newRecordedVoiceovers);
          }, function(changeDict, subtopicPage) {
            // ---- Undo ----
            subtopicPage.getPageContents().setRecordedVoiceovers(
              oldRecordedVoiceovers);
          });
      },

      /**
       * Removes an additional story id from a topic and records the change
       * in the undo/redo service.
       */
      removeAdditionalStory: function(topic, storyId) {
        _applyChange(topic, CMD_DELETE_ADDITIONAL_STORY, {
          story_id: storyId
        }, function(changeDict, topic) {
          // ---- Apply ----
          topic.removeAdditionalStory(storyId);
        }, function(changeDict, topic) {
          // ---- Undo ----
          topic.addAdditionalStory(storyId);
        });
      },

      /**
       * Removes an canonical story id from a topic and records the change
       * in the undo/redo service.
       */
      removeCanonicalStory: function(topic, storyId) {
        _applyChange(topic, CMD_DELETE_CANONICAL_STORY, {
          story_id: storyId
        }, function(changeDict, topic) {
          // ---- Apply ----
          topic.removeCanonicalStory(storyId);
        }, function(changeDict, topic) {
          // ---- Undo ----
          topic.addCanonicalStory(storyId);
        });
      },

      /**
       * Rearranges or moves a canonical story to another position and
       * records the change in undo/redo service.
       */
      rearrangeCanonicalStory: function(topic, fromIndex, toIndex) {
        _applyChange(topic, CMD_REARRANGE_CANONICAL_STORY, {
          from_index: fromIndex,
          to_index: toIndex
        }, function(changeDict, topic) {
          // ---- Apply ----
          topic.rearrangeCanonicalStory(fromIndex, toIndex);
        }, function(changeDict, topic) {
          // ---- Undo ----
          topic.rearrangeCanonicalStory(toIndex, fromIndex);
        });
      },
      /**
       * Rearranges or moves a skill in a subtopic to another position and
       * records the change in undo/redo service.
       */
      rearrangeSkillInSubtopic: function(
          topic, subtopicId, fromIndex, toIndex) {
        _applyChange(topic, CMD_REARRANGE_SKILL_IN_SUBTOPIC, {
          subtopic_id: subtopicId,
          from_index: fromIndex,
          to_index: toIndex
        }, function(changeDict, topic) {
          // ---- Apply ----
          topic.rearrangeSkillInSubtopic(subtopicId, fromIndex, toIndex);
        }, function(changeDict, topic) {
          // ---- Undo ----
          topic.rearrangeSkillInSubtopic(subtopicId, toIndex, fromIndex);
        });
      },
      /**
       * Rearranges a subtopic to another position and records the change in
       * undo/redo service.
       */
      rearrangeSubtopic: function(
          topic, fromIndex, toIndex) {
        _applyChange(topic, CMD_REARRANGE_SUBTOPIC, {
          from_index: fromIndex,
          to_index: toIndex
        }, function(changeDict, topic) {
          // ---- Apply ----
          topic.rearrangeSubtopic(fromIndex, toIndex);
        }, function(changeDict, topic) {
          // ---- Undo ----
          topic.rearrangeSubtopic(toIndex, fromIndex);
        });
      },

      /**
       * Removes an uncategorized skill from a topic and records the change
       * in the undo/redo service.
       */
      removeUncategorizedSkill: function(topic, skillSummary) {
        _applyChange(topic, CMD_REMOVE_UNCATEGORIZED_SKILL_ID, {
          uncategorized_skill_id: skillSummary.getId()
        }, function(changeDict, topic) {
          // ---- Apply ----
          var newSkillId = _getParameterFromChangeDict(
            changeDict, 'uncategorized_skill_id');
          topic.removeUncategorizedSkill(newSkillId);
        }, function(changeDict, topic) {
          // ---- Undo ----
          var newSkillId = _getParameterFromChangeDict(
            changeDict, 'uncategorized_skill_id');
          topic.addUncategorizedSkill(
            newSkillId, skillSummary.getDescription());
        });
      }
    };
  }]);
