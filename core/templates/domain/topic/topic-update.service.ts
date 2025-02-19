// Copyright 2020 The Oppia Authors. All Rights Reserved.
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

import {Injectable} from '@angular/core';

import cloneDeep from 'lodash/cloneDeep';

import {Change, TopicChange} from 'domain/editor/undo_redo/change.model';
import {UndoRedoService} from 'domain/editor/undo_redo/undo-redo.service';
import {TopicDomainConstants} from 'domain/topic/topic-domain.constants';
import {Topic} from 'domain/topic/topic-object.model';
import {ShortSkillSummary} from 'core/templates/domain/skill/short-skill-summary.model';
import {SubtitledHtml} from 'core/templates/domain/exploration/subtitled-html.model';
import {SubtopicPage} from 'core/templates/domain/topic/subtopic-page.model';
import {RecordedVoiceovers} from 'core/templates/domain/exploration/recorded-voiceovers.model';
import {Subtopic} from 'domain/topic/subtopic.model';

type TopicUpdateApply = (topicChange: TopicChange, topic: Topic) => void;
type TopicUpdateReverse = (topicChange: TopicChange, topic: Topic) => void;
type SubtopicUpdateApply = (
  topicChange: TopicChange,
  subtopicPage: SubtopicPage
) => void;
type SubtopicUpdateReverse = (
  topicChange: TopicChange,
  subtopicPage: SubtopicPage
) => void;

@Injectable({
  providedIn: 'root',
})
export class TopicUpdateService {
  constructor(private undoRedoService: UndoRedoService) {}
  // Creates a change using an apply function, reverse function, a change
  // command and related parameters. The change is applied to a given
  // topic.
  // entity can be a topic object or a subtopic page object.
  private _applyChange(
    entity,
    command: string,
    params,
    apply: TopicUpdateApply | SubtopicUpdateApply,
    reverse: TopicUpdateReverse | SubtopicUpdateReverse
  ) {
    let changeDict = cloneDeep(params);
    changeDict.cmd = command;
    let changeObj = new Change(changeDict, apply, reverse);
    this.undoRedoService.applyChange(changeObj, entity);
  }

  private _getParameterFromChangeDict(changeDict, paramName: string) {
    return changeDict[paramName];
  }

  // Applies a topic property change, specifically. See _applyChange()
  // for details on the other behavior of this function.
  private _applyTopicPropertyChange(
    topic: Topic,
    propertyName: string,
    newValue: string | string[] | boolean,
    oldValue: string | string[] | boolean,
    apply: TopicUpdateApply,
    reverse: TopicUpdateReverse
  ) {
    this._applyChange(
      topic,
      TopicDomainConstants.CMD_UPDATE_TOPIC_PROPERTY,
      {
        property_name: propertyName,
        new_value: cloneDeep(newValue),
        old_value: cloneDeep(oldValue) || null,
      },
      apply,
      reverse
    );
  }

  private _applySubtopicPropertyChange(
    topic: Topic,
    propertyName: string,
    subtopicId: number,
    newValue: string,
    oldValue: string,
    apply: SubtopicUpdateApply,
    reverse: SubtopicUpdateReverse
  ) {
    this._applyChange(
      topic,
      TopicDomainConstants.CMD_UPDATE_SUBTOPIC_PROPERTY,
      {
        subtopic_id: subtopicId,
        property_name: propertyName,
        new_value: cloneDeep(newValue),
        old_value: cloneDeep(oldValue),
      },
      apply,
      reverse
    );
  }

  private _applySubtopicPagePropertyChange(
    subtopicPage: SubtopicPage,
    propertyName: string,
    subtopicId: number,
    newValue,
    oldValue,
    apply: SubtopicUpdateApply,
    reverse: SubtopicUpdateReverse
  ): void {
    this._applyChange(
      subtopicPage,
      TopicDomainConstants.CMD_UPDATE_SUBTOPIC_PAGE_PROPERTY,
      {
        subtopic_id: subtopicId,
        property_name: propertyName,
        new_value: cloneDeep(newValue),
        old_value: cloneDeep(oldValue),
      },
      apply,
      reverse
    );
  }

  private _getNewPropertyValueFromChangeDict(changeDict) {
    return this._getParameterFromChangeDict(changeDict, 'new_value');
  }

  private _getSubtopicIdFromChangeDict(changeDict) {
    return this._getParameterFromChangeDict(changeDict, 'subtopic_id');
  }

  // These functions are associated with updates available in
  // core.domain.topic_services.apply_change_list.

  /**
   * Changes the name of a topic and records the change in the
   * undo/redo service.
   */
  setTopicName(topic: Topic, name: string): void {
    let oldName = cloneDeep(topic.getName());
    this._applyTopicPropertyChange(
      topic,
      TopicDomainConstants.TOPIC_PROPERTY_NAME,
      name,
      oldName,
      (changeDict, topic) => {
        // ---- Apply ----
        let name = this._getNewPropertyValueFromChangeDict(changeDict);
        topic.setName(name);
      },
      (changeDict, topic) => {
        // ---- Undo ----
        topic.setName(oldName);
      }
    );
  }

  /**
   * Changes the abbreviated name of a topic and records the change in the
   * undo/redo service.
   */
  setAbbreviatedTopicName(topic: Topic, abbreviatedName: string): void {
    let oldAbbreviatedName = cloneDeep(topic.getAbbreviatedName());
    this._applyTopicPropertyChange(
      topic,
      TopicDomainConstants.TOPIC_PROPERTY_ABBREVIATED_NAME,
      abbreviatedName,
      oldAbbreviatedName,
      (changeDict, topic) => {
        // ---- Apply ----
        let name = this._getNewPropertyValueFromChangeDict(changeDict);
        topic.setAbbreviatedName(name);
      },
      (changeDict, topic) => {
        // ---- Undo ----
        topic.setAbbreviatedName(oldAbbreviatedName);
      }
    );
  }

  /**
   * Changes the meta tag content of a topic and records the change in the
   * undo/redo service.
   */
  setMetaTagContent(topic: Topic, metaTagContent: string): void {
    let oldMetaTagContent = cloneDeep(topic.getMetaTagContent());
    this._applyTopicPropertyChange(
      topic,
      TopicDomainConstants.TOPIC_PROPERTY_META_TAG_CONTENT,
      metaTagContent,
      oldMetaTagContent,
      (changeDict, topic) => {
        // ---- Apply ----
        let metaTagContent =
          this._getNewPropertyValueFromChangeDict(changeDict);
        topic.setMetaTagContent(metaTagContent);
      },
      (changeDict, topic) => {
        // ---- Undo ----
        topic.setMetaTagContent(oldMetaTagContent);
      }
    );
  }

  /**
   * Changes the 'practice tab is displayed' property of a topic and
   * records the change in the undo/redo service.
   */
  setPracticeTabIsDisplayed(
    topic: Topic,
    practiceTabIsDisplayed: boolean
  ): void {
    let oldPracticeTabIsDisplayed = cloneDeep(
      topic.getPracticeTabIsDisplayed()
    );
    this._applyTopicPropertyChange(
      topic,
      TopicDomainConstants.TOPIC_PROPERTY_PRACTICE_TAB_IS_DISPLAYED,
      practiceTabIsDisplayed,
      oldPracticeTabIsDisplayed,
      (changeDict, topic) => {
        // ---- Apply ----
        let practiceTabIsDisplayed =
          this._getNewPropertyValueFromChangeDict(changeDict);
        topic.setPracticeTabIsDisplayed(practiceTabIsDisplayed);
      },
      (changeDict, topic) => {
        // ---- Undo ----
        topic.setPracticeTabIsDisplayed(oldPracticeTabIsDisplayed);
      }
    );
  }

  /**
   * Changes the page title fragment of a topic and records the change in the
   * undo/redo service.
   */
  setPageTitleFragmentForWeb(
    topic: Topic,
    pageTitleFragmentForWeb: string
  ): void {
    let oldPageTitleFragmentForWeb = cloneDeep(
      topic.getPageTitleFragmentForWeb()
    );
    this._applyTopicPropertyChange(
      topic,
      TopicDomainConstants.TOPIC_PROPERTY_PAGE_TITLE_FRAGMENT_FOR_WEB,
      pageTitleFragmentForWeb,
      oldPageTitleFragmentForWeb,
      (changeDict, topic) => {
        // ---- Apply ----
        var pageTitleFragmentForWeb =
          this._getNewPropertyValueFromChangeDict(changeDict);
        topic.setPageTitleFragmentForWeb(pageTitleFragmentForWeb);
      },
      (changeDict, topic) => {
        // ---- Undo ----
        topic.setPageTitleFragmentForWeb(oldPageTitleFragmentForWeb);
      }
    );
  }

  /**
   * Changes the url fragment of a topic and records the change in the
   * undo/redo service.
   */
  setTopicUrlFragment(topic: Topic, urlFragment: string): void {
    let oldUrlFragment = cloneDeep(topic.getUrlFragment());
    this._applyTopicPropertyChange(
      topic,
      TopicDomainConstants.TOPIC_PROPERTY_URL_FRAGMENT,
      urlFragment,
      oldUrlFragment,
      (changeDict, topic) => {
        // ---- Apply ----
        let newUrlFragment =
          this._getNewPropertyValueFromChangeDict(changeDict);
        topic.setUrlFragment(newUrlFragment);
      },
      (changeDict, topic) => {
        // ---- Undo ----
        topic.setUrlFragment(oldUrlFragment);
      }
    );
  }

  /**
   * Changes the thumbnail filename of a topic and records the change in the
   * undo/redo service.
   */
  setTopicThumbnailFilename(topic: Topic, thumbnailFilename: string): void {
    let oldThumbnailFilename = cloneDeep(topic.getThumbnailFilename());
    this._applyTopicPropertyChange(
      topic,
      TopicDomainConstants.TOPIC_PROPERTY_THUMBNAIL_FILENAME,
      thumbnailFilename,
      oldThumbnailFilename,
      (changeDict, topic) => {
        // ---- Apply ----
        let thumbnailFilename =
          this._getNewPropertyValueFromChangeDict(changeDict);
        topic.setThumbnailFilename(thumbnailFilename);
      },
      (changeDict, topic) => {
        // ---- Undo ----
        topic.setThumbnailFilename(oldThumbnailFilename);
      }
    );
  }

  /**
   * Changes the thumbnail background color of a topic and records the
   * change in the undo/redo service.
   */
  setTopicThumbnailBgColor(topic: Topic, thumbnailBgColor: string): void {
    let oldThumbnailBgColor = cloneDeep(topic.getThumbnailBgColor());
    this._applyTopicPropertyChange(
      topic,
      TopicDomainConstants.TOPIC_PROPERTY_THUMBNAIL_BG_COLOR,
      thumbnailBgColor,
      oldThumbnailBgColor,
      (changeDict, topic) => {
        // ---- Apply ----
        let thumbnailBgColor =
          this._getNewPropertyValueFromChangeDict(changeDict);
        topic.setThumbnailBgColor(thumbnailBgColor);
      },
      (changeDict, topic) => {
        // ---- Undo ----
        topic.setThumbnailBgColor(oldThumbnailBgColor);
      }
    );
  }

  /**
   * Changes the description of a topic and records the change in the
   * undo/redo service.
   */
  setTopicDescription(topic: Topic, description: string): void {
    let oldDescription = cloneDeep(topic.getDescription());
    this._applyTopicPropertyChange(
      topic,
      TopicDomainConstants.TOPIC_PROPERTY_DESCRIPTION,
      description,
      oldDescription,
      (changeDict, topic) => {
        // ---- Apply ----
        var description = this._getNewPropertyValueFromChangeDict(changeDict);
        topic.setDescription(description);
      },
      (changeDict, topic) => {
        // ---- Undo ----
        topic.setDescription(oldDescription);
      }
    );
  }

  /**
   * Changes the language code of a topic and records the change in
   * the undo/redo service.
   */
  setTopicLanguageCode(topic: Topic, languageCode: string): void {
    let oldLanguageCode = cloneDeep(topic.getLanguageCode());
    this._applyTopicPropertyChange(
      topic,
      TopicDomainConstants.TOPIC_PROPERTY_LANGUAGE_CODE,
      languageCode,
      oldLanguageCode,
      (changeDict, topic) => {
        // ---- Apply ----
        let languageCode = this._getNewPropertyValueFromChangeDict(changeDict);
        topic.setLanguageCode(languageCode);
      },
      (changeDict, topic) => {
        // ---- Undo ----
        topic.setLanguageCode(oldLanguageCode);
      }
    );
  }

  /**
   * Creates a subtopic and adds it to the topic and records the change in
   * the undo/redo service.
   */
  addSubtopic(topic: Topic, title: string, urlFragment: string): void {
    let nextSubtopicId = topic.getNextSubtopicId();
    this._applyChange(
      topic,
      TopicDomainConstants.CMD_ADD_SUBTOPIC,
      {
        subtopic_id: nextSubtopicId,
        title: title,
        url_fragment: urlFragment,
      },
      (changeDict, topic) => {
        // ---- Apply ----
        topic.addSubtopic(title);
      },
      (changeDict, topic) => {
        // ---- Undo ----
        let subtopicId = this._getSubtopicIdFromChangeDict(changeDict);
        topic.deleteSubtopic(subtopicId);
      }
    );
  }

  /**
   * @param {Topic} topic - The topic object to be edited.
   * @param {number} subtopicId - The id of the subtopic to delete.
   */
  deleteSubtopic(topic: Topic, subtopicId: number): void {
    let subtopic = topic.getSubtopicById(subtopicId);
    if (!subtopic) {
      throw new Error(`Subtopic with id ${subtopicId} doesn\'t exist`);
    }
    let newlyCreated = false;
    let changeList = this.undoRedoService.getCommittableChangeList();
    for (let i = 0; i < changeList.length; i++) {
      let _changeList = changeList[i] as TopicChange;
      if (
        _changeList.cmd === 'add_subtopic' &&
        _changeList.subtopic_id === subtopicId
      ) {
        newlyCreated = true;
      }
    }
    if (newlyCreated) {
      // Get the current change list.
      let currentChangeList: Change[] = this.undoRedoService.getChangeList();
      let indicesToDelete = [];
      // Loop over the current changelist and handle all the cases where
      // a skill moved into the subtopic or moved out of it.
      for (var i = 0; i < currentChangeList.length; i++) {
        let changeDict = currentChangeList[i].getBackendChangeObject();
        if (
          changeDict.cmd === TopicDomainConstants.CMD_MOVE_SKILL_ID_TO_SUBTOPIC
        ) {
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
              let _changeDict: TopicChange = {
                cmd: TopicDomainConstants.CMD_REMOVE_SKILL_ID_FROM_SUBTOPIC,
                subtopic_id: changeDict.old_subtopic_id,
                skill_id: changeDict.skill_id,
              };
              changeDict = _changeDict;
            }
          } else if (changeDict.old_subtopic_id === subtopicId) {
            // Any operation where a skill was moved out of this subtopic
            // would now be equivalent to a move out from the uncategorized
            // section, as a newly created subtopic wouldn't have any skills
            // of its own initially, and any skills moved into it have been
            // shifted to the uncategorized section.
            changeDict.old_subtopic_id = null;
          }
        } else if (
          changeDict.cmd ===
          TopicDomainConstants.CMD_REMOVE_SKILL_ID_FROM_SUBTOPIC
        ) {
          // If a skill was removed from this subtopic, then that change
          // should be deleted, since all skills moved into the subtopic
          // have already been moved into the uncategorized section.
          if (changeDict.subtopic_id === subtopicId) {
            indicesToDelete.push(i);
          }
        }
        currentChangeList[i].setBackendChangeObject(changeDict);
      }
      for (let i = 0; i < currentChangeList.length; i++) {
        let backendChangeDict = currentChangeList[i].getBackendChangeObject();
        // Check presence of member equivalent of hasOwnProperty
        // https://www.typescriptlang.org/docs/handbook/advanced-types.html
        if ('subtopic_id' in backendChangeDict) {
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
        if ('old_subtopic_id' in backendChangeDict) {
          if (backendChangeDict.old_subtopic_id > subtopicId) {
            backendChangeDict.old_subtopic_id--;
          }
        }
        if ('new_subtopic_id' in backendChangeDict) {
          if (backendChangeDict.new_subtopic_id > subtopicId) {
            backendChangeDict.new_subtopic_id--;
          }
        }
        // Apply the above id reduction changes to the backend change.
        currentChangeList[i].setBackendChangeObject(backendChangeDict);
      }
      // The new change list is found by deleting the above found elements.
      let newChangeList = currentChangeList.filter(change => {
        let changeObjectIndex = currentChangeList.indexOf(change);
        // Return all elements that were not deleted.
        return indicesToDelete.indexOf(changeObjectIndex) === -1;
      });
      // The new changelist is set.
      this.undoRedoService.setChangeList(newChangeList);
      topic.deleteSubtopic(subtopicId, newlyCreated);
      return;
    }
    this._applyChange(
      topic,
      TopicDomainConstants.CMD_DELETE_SUBTOPIC,
      {
        subtopic_id: subtopicId,
      },
      (changeDict, topic) => {
        // ---- Apply ----
        topic.deleteSubtopic(subtopicId, newlyCreated);
      },
      (changeDict, topic) => {
        // ---- Undo ----
        throw new Error('A deleted subtopic cannot be restored');
      }
    );
  }

  /**
   * Moves a skill to a subtopic from either another subtopic or
   * uncategorized skills and records the change in the undo/redo service.
   */
  moveSkillToSubtopic(
    topic: Topic,
    oldSubtopicId: number,
    newSubtopicId: number,
    skillSummary: ShortSkillSummary
  ): void {
    if (!newSubtopicId) {
      throw new Error('New subtopic cannot be null');
    }
    let oldSubtopic: Subtopic | null;
    if (oldSubtopicId) {
      oldSubtopic = topic.getSubtopicById(oldSubtopicId);
    }
    let newSubtopic = topic.getSubtopicById(newSubtopicId);
    this._applyChange(
      topic,
      TopicDomainConstants.CMD_MOVE_SKILL_ID_TO_SUBTOPIC,
      {
        old_subtopic_id: oldSubtopicId,
        new_subtopic_id: newSubtopicId,
        skill_id: skillSummary.getId(),
      },
      (changeDict, topic) => {
        // ---- Apply ----
        if (!oldSubtopicId) {
          topic.removeUncategorizedSkill(skillSummary.getId());
        } else {
          oldSubtopic.removeSkill(skillSummary.getId());
        }
        newSubtopic.addSkill(
          skillSummary.getId(),
          skillSummary.getDescription()
        );
      },
      (changeDict, topic) => {
        // ---- Undo ----
        newSubtopic.removeSkill(skillSummary.getId());
        if (oldSubtopicId === null) {
          topic.addUncategorizedSkill(
            skillSummary.getId(),
            skillSummary.getDescription()
          );
        } else {
          oldSubtopic.addSkill(
            skillSummary.getId(),
            skillSummary.getDescription()
          );
        }
      }
    );
  }

  /**
   * Moves a skill from a subtopic to uncategorized skills
   * and records the change in the undo/redo service.
   */
  removeSkillFromSubtopic(
    topic: Topic,
    subtopicId: number,
    skillSummary: ShortSkillSummary
  ): void {
    let subtopic = topic.getSubtopicById(subtopicId);
    this._applyChange(
      topic,
      TopicDomainConstants.CMD_REMOVE_SKILL_ID_FROM_SUBTOPIC,
      {
        subtopic_id: subtopicId,
        skill_id: skillSummary.getId(),
      },
      (changeDict, topic) => {
        // ---- Apply ----
        subtopic.removeSkill(skillSummary.getId());
        if (!topic.hasUncategorizedSkill(skillSummary.getId())) {
          topic.addUncategorizedSkill(
            skillSummary.getId(),
            skillSummary.getDescription()
          );
        }
      },
      (changeDict, topic) => {
        // ---- Undo ----
        subtopic.addSkill(skillSummary.getId(), skillSummary.getDescription());
        topic.removeUncategorizedSkill(skillSummary.getId());
      }
    );
  }

  /**
   * Changes the thumbnail filename of a subtopic and records the change in
   * the undo/redo service.
   */
  setSubtopicThumbnailFilename(
    topic: Topic,
    subtopicId: number,
    thumbnailFilename: string
  ): void {
    let subtopic = topic.getSubtopicById(subtopicId);
    if (!subtopic) {
      throw new Error(`Subtopic with id ${subtopicId} doesn\'t exist`);
    }
    let oldThumbnailFilename = cloneDeep(subtopic.getThumbnailFilename());
    this._applySubtopicPropertyChange(
      topic,
      TopicDomainConstants.SUBTOPIC_PROPERTY_THUMBNAIL_FILENAME,
      subtopicId,
      thumbnailFilename,
      oldThumbnailFilename,
      (changeDict, topic) => {
        // ---- Apply ----
        let thumbnailFilename =
          this._getNewPropertyValueFromChangeDict(changeDict);
        subtopic.setThumbnailFilename(thumbnailFilename);
      },
      (changeDict, topic) => {
        // ---- Undo ----
        subtopic.setThumbnailFilename(oldThumbnailFilename);
      }
    );
  }

  /**
   * Changes the url fragment of a subtopic and records the change in
   * the undo/redo service.
   */
  setSubtopicUrlFragment(
    topic: Topic,
    subtopicId: number,
    urlFragment: string
  ): void {
    let subtopic = topic.getSubtopicById(subtopicId);
    if (!subtopic) {
      throw new Error(`Subtopic with id ${subtopicId} doesn\'t exist`);
    }
    let oldUrlFragment = cloneDeep(subtopic.getUrlFragment());
    this._applySubtopicPropertyChange(
      topic,
      TopicDomainConstants.SUBTOPIC_PROPERTY_URL_FRAGMENT,
      subtopicId,
      urlFragment,
      oldUrlFragment,
      (changeDict, topic) => {
        // ---- Apply ----
        let newUrlFragment =
          this._getNewPropertyValueFromChangeDict(changeDict);
        subtopic.setUrlFragment(newUrlFragment);
      },
      (changeDict, topic) => {
        // ---- Undo ----
        subtopic.setUrlFragment(oldUrlFragment);
      }
    );
  }

  /**
   * Changes the thumbnail background color of a subtopic and records
   * the change in the undo/redo service.
   */
  setSubtopicThumbnailBgColor(
    topic: Topic,
    subtopicId: number,
    thumbnailBgColor: string
  ): void {
    let subtopic = topic.getSubtopicById(subtopicId);
    if (!subtopic) {
      throw new Error(`Subtopic with id ${subtopicId} doesn\'t exist`);
    }
    let oldThumbnailBgColor = cloneDeep(subtopic.getThumbnailBgColor());
    this._applySubtopicPropertyChange(
      topic,
      TopicDomainConstants.SUBTOPIC_PROPERTY_THUMBNAIL_BG_COLOR,
      subtopicId,
      thumbnailBgColor,
      oldThumbnailBgColor,
      (changeDict, topic) => {
        // ---- Apply ----
        let thumbnailBgColor =
          this._getNewPropertyValueFromChangeDict(changeDict);
        subtopic.setThumbnailBgColor(thumbnailBgColor);
      },
      (changeDict, topic) => {
        // ---- Undo ----
        subtopic.setThumbnailBgColor(oldThumbnailBgColor);
      }
    );
  }

  /**
   * Changes the title of a subtopic and records the change in
   * the undo/redo service.
   */
  setSubtopicTitle(topic: Topic, subtopicId: number, title: string): void {
    let subtopic = topic.getSubtopicById(subtopicId);
    if (!subtopic) {
      throw new Error(`Subtopic with id ${subtopicId} doesn\'t exist`);
    }
    let oldTitle = cloneDeep(subtopic.getTitle());
    this._applySubtopicPropertyChange(
      topic,
      TopicDomainConstants.SUBTOPIC_PROPERTY_TITLE,
      subtopicId,
      title,
      oldTitle,
      (changeDict, topic) => {
        // ---- Apply ----
        let title = this._getNewPropertyValueFromChangeDict(changeDict);
        subtopic.setTitle(title);
      },
      (changeDict, topic) => {
        // ---- Undo ----
        subtopic.setTitle(oldTitle);
      }
    );
  }

  setSubtopicPageContentsHtml(
    subtopicPage: SubtopicPage,
    subtopicId: number,
    newSubtitledHtml: SubtitledHtml
  ): void {
    let oldSubtitledHtml = cloneDeep(
      subtopicPage.getPageContents().getSubtitledHtml()
    );
    this._applySubtopicPagePropertyChange(
      subtopicPage,
      TopicDomainConstants.SUBTOPIC_PAGE_PROPERTY_PAGE_CONTENTS_HTML,
      subtopicId,
      newSubtitledHtml.toBackendDict(),
      oldSubtitledHtml.toBackendDict(),
      (changeDict, subtopicPage) => {
        // ---- Apply ----
        subtopicPage.getPageContents().setSubtitledHtml(newSubtitledHtml);
      },
      (changeDict, subtopicPage) => {
        // ---- Undo ----
        subtopicPage.getPageContents().setSubtitledHtml(oldSubtitledHtml);
      }
    );
  }

  setSubtopicPageContentsAudio(
    subtopicPage: SubtopicPage,
    subtopicId: number,
    newRecordedVoiceovers: RecordedVoiceovers
  ): void {
    let oldRecordedVoiceovers = cloneDeep(
      subtopicPage.getPageContents().getRecordedVoiceovers()
    );
    this._applySubtopicPagePropertyChange(
      subtopicPage,
      TopicDomainConstants.SUBTOPIC_PAGE_PROPERTY_PAGE_CONTENTS_AUDIO,
      subtopicId,
      newRecordedVoiceovers.toBackendDict(),
      oldRecordedVoiceovers.toBackendDict(),
      (changeDict, subtopicPage) => {
        // ---- Apply ----
        subtopicPage
          .getPageContents()
          .setRecordedVoiceovers(newRecordedVoiceovers);
      },
      (changeDict, subtopicPage) => {
        // ---- Undo ----
        subtopicPage
          .getPageContents()
          .setRecordedVoiceovers(oldRecordedVoiceovers);
      }
    );
  }

  /**
   * Removes an additional story id from a topic and records the change
   * in the undo/redo service.
   */
  removeAdditionalStory(topic: Topic, storyId: string): void {
    this._applyChange(
      topic,
      TopicDomainConstants.CMD_DELETE_ADDITIONAL_STORY,
      {
        story_id: storyId,
      },
      (changeDict, topic) => {
        // ---- Apply ----
        topic.removeAdditionalStory(storyId);
      },
      (changeDict, topic) => {
        // ---- Undo ----
        topic.addAdditionalStory(storyId);
      }
    );
  }

  /**
   * Removes an canonical story id from a topic and records the change
   * in the undo/redo service.
   */
  removeCanonicalStory(topic: Topic, storyId: string): void {
    this._applyChange(
      topic,
      TopicDomainConstants.CMD_DELETE_CANONICAL_STORY,
      {
        story_id: storyId,
      },
      (changeDict, topic) => {
        // ---- Apply ----
        topic.removeCanonicalStory(storyId);
      },
      (changeDict, topic) => {
        // ---- Undo ----
        topic.addCanonicalStory(storyId);
      }
    );
  }

  /**
   * Rearranges or moves a canonical story to another position and
   * records the change in undo/redo service.
   */
  rearrangeCanonicalStory(
    topic: Topic,
    fromIndex: number,
    toIndex: number
  ): void {
    this._applyChange(
      topic,
      TopicDomainConstants.CMD_REARRANGE_CANONICAL_STORY,
      {
        from_index: fromIndex,
        to_index: toIndex,
      },
      (changeDict, topic) => {
        // ---- Apply ----
        topic.rearrangeCanonicalStory(fromIndex, toIndex);
      },
      (changeDict, topic) => {
        // ---- Undo ----
        topic.rearrangeCanonicalStory(toIndex, fromIndex);
      }
    );
  }

  /**
   * Rearranges or moves a skill in a subtopic to another position and
   * records the change in undo/redo service.
   */
  rearrangeSkillInSubtopic(
    topic: Topic,
    subtopicId: number,
    fromIndex: number,
    toIndex: number
  ): void {
    this._applyChange(
      topic,
      TopicDomainConstants.CMD_REARRANGE_SKILL_IN_SUBTOPIC,
      {
        subtopic_id: subtopicId,
        from_index: fromIndex,
        to_index: toIndex,
      },
      (changeDict, topic) => {
        // ---- Apply ----
        topic.rearrangeSkillInSubtopic(subtopicId, fromIndex, toIndex);
      },
      (changeDict, topic) => {
        // ---- Undo ----
        topic.rearrangeSkillInSubtopic(subtopicId, toIndex, fromIndex);
      }
    );
  }

  /**
   * Rearranges a subtopic to another position and records the change in
   * undo/redo service.
   */
  rearrangeSubtopic(topic: Topic, fromIndex: number, toIndex: number): void {
    this._applyChange(
      topic,
      TopicDomainConstants.CMD_REARRANGE_SUBTOPIC,
      {
        from_index: fromIndex,
        to_index: toIndex,
      },
      (changeDict, topic) => {
        // ---- Apply ----
        topic.rearrangeSubtopic(fromIndex, toIndex);
      },
      (changeDict, topic) => {
        // ---- Undo ----
        topic.rearrangeSubtopic(toIndex, fromIndex);
      }
    );
  }

  /**
   * Removes an uncategorized skill from a topic and records the change
   * in the undo/redo service.
   */
  removeUncategorizedSkill(
    topic: Topic,
    skillSummary: ShortSkillSummary
  ): void {
    this._applyChange(
      topic,
      TopicDomainConstants.CMD_REMOVE_UNCATEGORIZED_SKILL_ID,
      {
        uncategorized_skill_id: skillSummary.getId(),
      },
      (changeDict, topic) => {
        // ---- Apply ----
        let newSkillId = this._getParameterFromChangeDict(
          changeDict,
          'uncategorized_skill_id'
        );
        topic.removeUncategorizedSkill(newSkillId);
      },
      (changeDict, topic) => {
        // ---- Undo ----
        let newSkillId = this._getParameterFromChangeDict(
          changeDict,
          'uncategorized_skill_id'
        );
        topic.addUncategorizedSkill(newSkillId, skillSummary.getDescription());
      }
    );
  }

  /**
   * Update the skill ids for the diagnostic test from a topic and records
   * the change in the undo/redo service.
   */
  updateDiagnosticTestSkills(
    topic: Topic,
    newSkillSummariesForDiagnosticTest: ShortSkillSummary[]
  ): void {
    let oldSkillSummariesForDiagnosticTest = cloneDeep(
      topic.getSkillSummariesForDiagnosticTest()
    );
    let oldSkillIdsForDiagnosticTest = oldSkillSummariesForDiagnosticTest.map(
      (skillSummary: ShortSkillSummary) => {
        return skillSummary.getId();
      }
    );
    let newSkillIdsForDiagnosticTest = newSkillSummariesForDiagnosticTest.map(
      (skillSummary: ShortSkillSummary) => {
        return skillSummary.getId();
      }
    );

    this._applyTopicPropertyChange(
      topic,
      TopicDomainConstants.TOPIC_PROPERTY_SKILL_IDS_FOR_DIAGNOSTIC_TEST,
      newSkillIdsForDiagnosticTest,
      oldSkillIdsForDiagnosticTest,
      (changeDict, topic) => {
        topic.setSkillSummariesForDiagnosticTest(
          newSkillSummariesForDiagnosticTest
        );
      },
      (changeDict, topic) => {
        topic.setSkillSummariesForDiagnosticTest(
          oldSkillSummariesForDiagnosticTest
        );
      }
    );
  }
}
