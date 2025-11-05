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

import {Change, TopicChange, BackendChangeObject, DomainObject} from 'domain/editor/undo_redo/change.model';
import {UndoRedoService} from 'domain/editor/undo_redo/undo-redo.service';
import {TopicDomainConstants} from 'domain/topic/topic-domain.constants';
import {Topic} from 'domain/topic/topic-object.model';
import {ShortSkillSummary} from 'core/templates/domain/skill/short-skill-summary.model';
import {SubtitledHtml} from 'core/templates/domain/exploration/subtitled-html.model';
import {SubtopicPage} from 'core/templates/domain/topic/subtopic-page.model';
import {RecordedVoiceovers} from 'core/templates/domain/exploration/recorded-voiceovers.model';
import {Subtopic} from 'domain/topic/subtopic.model';
import {StudyGuide} from './study-guide.model';
import {StudyGuideSection} from './study-guide-sections.model';

type TopicUpdateApply = (changeDict: BackendChangeObject, topic: Topic) => void;
type TopicUpdateReverse = (changeDict: BackendChangeObject, topic: Topic) => void;
// For property changes on a subtopic we actually operate on Topic (the domain
// object that contains subtopics), so these callbacks accept Topic.
type SubtopicPropertyApply = (
  changeDict: BackendChangeObject,
  topic: Topic
) => void;
type SubtopicPropertyReverse = (
  changeDict: BackendChangeObject,
  topic: Topic
) => void;
// For updates that operate on a SubtopicPage object (page contents, audio).
type SubtopicPageUpdateApply = (
  changeDict: BackendChangeObject,
  subtopicPage: SubtopicPage
) => void;
type SubtopicPageUpdateReverse = (
  changeDict: BackendChangeObject,
  subtopicPage: SubtopicPage
) => void;
type StudyGuideUpdateApply = (
  changeDict: BackendChangeObject,
  studyGuide: StudyGuide
) => void;
type StudyGuideUpdateReverse = (
  changeDict: BackendChangeObject,
  studyGuide: StudyGuide
) => void;

@Injectable({
  providedIn: 'root',
})
export class TopicUpdateService {
  constructor(private undoRedoService: UndoRedoService) {}

  // Creates a change using an apply function, reverse function, a change
  // command and related parameters. The change is applied to a given
  // entity. entity can be a topic object or a subtopic page object.
  private _applyChange<D extends DomainObject>(
    entity: D,
    command: string,
    params: Record<string, unknown>,
    apply: (backendChangeObject: BackendChangeObject, domainObject: D) => void,
    reverse: (backendChangeObject: BackendChangeObject, domainObject: D) => void
  ): void {
    // cloneDeep returns Record<string, unknown>; cast via unknown to satisfy TS.
    const changeDict: BackendChangeObject = cloneDeep(params) as unknown as BackendChangeObject;
    // command may be a string constant from TopicDomainConstants; assert to union member.
    changeDict.cmd = command as BackendChangeObject['cmd'];
    const changeObj = new Change(changeDict, apply as any, reverse as any);
    this.undoRedoService.applyChange(changeObj, entity);
  }

  private _getParameterFromChangeDict(changeDict: BackendChangeObject, paramName: string) {
    // BackendChangeObject doesn't necessarily have an index signature for arbitrary keys.
    // Use dynamic access via any; callers will cast the result to the expected type.
    return (changeDict as any)[paramName];
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
        // Explicitly allow null for old_value using any-compatible type.
        old_value: (cloneDeep(oldValue) ?? null) as unknown as string | string[] | boolean | null,
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
    apply: SubtopicPropertyApply,
    reverse: SubtopicPropertyReverse
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
      apply as any,
      reverse as any
    );
  }

  private _applySubtopicPagePropertyChange(
    subtopicPage: SubtopicPage,
    propertyName: string,
    subtopicId: number,
    newValue: any,
    oldValue: any,
    apply: SubtopicPageUpdateApply,
    reverse: SubtopicPageUpdateReverse
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
      apply as any,
      reverse as any
    );
  }

  private _applyStudyGuidePropertyChange(
    studyGuide: StudyGuide,
    propertyName: string,
    subtopicId: number,
    newValue: any,
    oldValue: any,
    apply: StudyGuideUpdateApply,
    reverse: StudyGuideUpdateReverse
  ): void {
    this._applyChange(
      studyGuide,
      TopicDomainConstants.CMD_UPDATE_STUDY_GUIDE_PROPERTY,
      {
        subtopic_id: subtopicId,
        property_name: propertyName,
        new_value: cloneDeep(newValue),
        old_value: cloneDeep(oldValue),
      },
      apply as any,
      reverse as any
    );
  }

  private _getNewPropertyValueFromChangeDict(changeDict: BackendChangeObject) {
    return this._getParameterFromChangeDict(changeDict, 'new_value');
  }

  private _getSubtopicIdFromChangeDict(changeDict: BackendChangeObject) {
    return this._getParameterFromChangeDict(changeDict, 'subtopic_id');
  }

  // These functions are associated with updates available in
  // core.domain.topic_services.apply_change_list.

  /**
   * Changes the name of a topic and records the change in the
   * undo/redo service.
   */
  setTopicName(topic: Topic, name: string): void {
    const oldName = cloneDeep(topic.getName());
    this._applyTopicPropertyChange(
      topic,
      TopicDomainConstants.TOPIC_PROPERTY_NAME,
      name,
      oldName,
      (changeDict: BackendChangeObject, topicObj: Topic) => {
        // ---- Apply ----
        const newName = this._getNewPropertyValueFromChangeDict(changeDict) as string;
        topicObj.setName(newName);
      },
      (changeDict: BackendChangeObject, topicObj: Topic) => {
        // ---- Undo ----
        topicObj.setName(oldName);
      }
    );
  }

  /**
   * Changes the abbreviated name of a topic and records the change in the
   * undo/redo service.
   */
  setAbbreviatedTopicName(topic: Topic, abbreviatedName: string): void {
    // ensure non-null string for old value
    const oldAbbreviatedName = cloneDeep(topic.getAbbreviatedName()) ?? '';
    this._applyTopicPropertyChange(
      topic,
      TopicDomainConstants.TOPIC_PROPERTY_ABBREVIATED_NAME,
      abbreviatedName,
      oldAbbreviatedName,
      (changeDict: BackendChangeObject, topicObj: Topic) => {
        // ---- Apply ----
        const newAbbrev = this._getNewPropertyValueFromChangeDict(changeDict) as string;
        topicObj.setAbbreviatedName(newAbbrev);
      },
      (changeDict: BackendChangeObject, topicObj: Topic) => {
        // ---- Undo ----
        topicObj.setAbbreviatedName(oldAbbreviatedName);
      }
    );
  }

  /**
   * Changes the meta tag content of a topic and records the change in the
   * undo/redo service.
   */
  setMetaTagContent(topic: Topic, metaTagContent: string): void {
    const oldMetaTagContent = cloneDeep(topic.getMetaTagContent());
    this._applyTopicPropertyChange(
      topic,
      TopicDomainConstants.TOPIC_PROPERTY_META_TAG_CONTENT,
      metaTagContent,
      oldMetaTagContent,
      (changeDict: BackendChangeObject, topicObj: Topic) => {
        // ---- Apply ----
        const newMeta = this._getNewPropertyValueFromChangeDict(changeDict) as string;
        topicObj.setMetaTagContent(newMeta);
      },
      (changeDict: BackendChangeObject, topicObj: Topic) => {
        // ---- Undo ----
        topicObj.setMetaTagContent(oldMetaTagContent);
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
    const oldPracticeTabIsDisplayed = cloneDeep(
      topic.getPracticeTabIsDisplayed()
    );
    this._applyTopicPropertyChange(
      topic,
      TopicDomainConstants.TOPIC_PROPERTY_PRACTICE_TAB_IS_DISPLAYED,
      practiceTabIsDisplayed,
      oldPracticeTabIsDisplayed,
      (changeDict: BackendChangeObject, topicObj: Topic) => {
        // ---- Apply ----
        const newVal = this._getNewPropertyValueFromChangeDict(changeDict) as boolean;
        topicObj.setPracticeTabIsDisplayed(newVal);
      },
      (changeDict: BackendChangeObject, topicObj: Topic) => {
        // ---- Undo ----
        topicObj.setPracticeTabIsDisplayed(oldPracticeTabIsDisplayed);
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
    // ensure non-null string for old value
    const oldPageTitleFragmentForWeb = cloneDeep(
      topic.getPageTitleFragmentForWeb()
    ) ?? '';
    this._applyTopicPropertyChange(
      topic,
      TopicDomainConstants.TOPIC_PROPERTY_PAGE_TITLE_FRAGMENT_FOR_WEB,
      pageTitleFragmentForWeb,
      oldPageTitleFragmentForWeb,
      (changeDict: BackendChangeObject, topicObj: Topic) => {
        // ---- Apply ----
        const newVal = this._getNewPropertyValueFromChangeDict(changeDict) as string;
        topicObj.setPageTitleFragmentForWeb(newVal);
      },
      (changeDict: BackendChangeObject, topicObj: Topic) => {
        // ---- Undo ----
        topicObj.setPageTitleFragmentForWeb(oldPageTitleFragmentForWeb);
      }
    );
  }

  /**
   * Changes the url fragment of a topic and records the change in the
   * undo/redo service.
   */
  setTopicUrlFragment(topic: Topic, urlFragment: string): void {
    // ensure non-null string for old value
    const oldUrlFragment = cloneDeep(topic.getUrlFragment()) ?? '';
    this._applyTopicPropertyChange(
      topic,
      TopicDomainConstants.TOPIC_PROPERTY_URL_FRAGMENT,
      urlFragment,
      oldUrlFragment,
      (changeDict: BackendChangeObject, topicObj: Topic) => {
        // ---- Apply ----
        const newUrlFragment = this._getNewPropertyValueFromChangeDict(changeDict) as string;
        topicObj.setUrlFragment(newUrlFragment);
      },
      (changeDict: BackendChangeObject, topicObj: Topic) => {
        // ---- Undo ----
        topicObj.setUrlFragment(oldUrlFragment);
      }
    );
  }

  /**
   * Changes the thumbnail filename of a topic and records the change in the
   * undo/redo service.
   */
  setTopicThumbnailFilename(topic: Topic, thumbnailFilename: string): void {
    // ensure non-null string for old value
    const oldThumbnailFilename = cloneDeep(topic.getThumbnailFilename()) ?? '';
    this._applyTopicPropertyChange(
      topic,
      TopicDomainConstants.TOPIC_PROPERTY_THUMBNAIL_FILENAME,
      thumbnailFilename,
      oldThumbnailFilename,
      (changeDict: BackendChangeObject, topicObj: Topic) => {
        // ---- Apply ----
        const newFilename = this._getNewPropertyValueFromChangeDict(changeDict) as string;
        topicObj.setThumbnailFilename(newFilename);
      },
      (changeDict: BackendChangeObject, topicObj: Topic) => {
        // ---- Undo ----
        topicObj.setThumbnailFilename(oldThumbnailFilename);
      }
    );
  }

  /**
   * Changes the thumbnail background color of a topic and records the
   * change in the undo/redo service.
   */
  setTopicThumbnailBgColor(topic: Topic, thumbnailBgColor: string): void {
    // ensure non-null string for old value
    const oldThumbnailBgColor = cloneDeep(topic.getThumbnailBgColor()) ?? '';
    this._applyTopicPropertyChange(
      topic,
      TopicDomainConstants.TOPIC_PROPERTY_THUMBNAIL_BG_COLOR,
      thumbnailBgColor,
      oldThumbnailBgColor,
      (changeDict: BackendChangeObject, topicObj: Topic) => {
        // ---- Apply ----
        const newColor = this._getNewPropertyValueFromChangeDict(changeDict) as string;
        topicObj.setThumbnailBgColor(newColor);
      },
      (changeDict: BackendChangeObject, topicObj: Topic) => {
        // ---- Undo ----
        topicObj.setThumbnailBgColor(oldThumbnailBgColor);
      }
    );
  }

  /**
   * Changes the description of a topic and records the change in the
   * undo/redo service.
   */
  setTopicDescription(topic: Topic, description: string): void {
    const oldDescription = cloneDeep(topic.getDescription());
    this._applyTopicPropertyChange(
      topic,
      TopicDomainConstants.TOPIC_PROPERTY_DESCRIPTION,
      description,
      oldDescription,
      (changeDict: BackendChangeObject, topicObj: Topic) => {
        // ---- Apply ----
        const newVal = this._getNewPropertyValueFromChangeDict(changeDict) as string;
        topicObj.setDescription(newVal);
      },
      (changeDict: BackendChangeObject, topicObj: Topic) => {
        // ---- Undo ----
        topicObj.setDescription(oldDescription);
      }
    );
  }

  /**
   * Changes the language code of a topic and records the change in
   * the undo/redo service.
   */
  setTopicLanguageCode(topic: Topic, languageCode: string): void {
    const oldLanguageCode = cloneDeep(topic.getLanguageCode());
    this._applyTopicPropertyChange(
      topic,
      TopicDomainConstants.TOPIC_PROPERTY_LANGUAGE_CODE,
      languageCode,
      oldLanguageCode,
      (changeDict: BackendChangeObject, topicObj: Topic) => {
        // ---- Apply ----
        const newVal = this._getNewPropertyValueFromChangeDict(changeDict) as string;
        topicObj.setLanguageCode(newVal);
      },
      (changeDict: BackendChangeObject, topicObj: Topic) => {
        // ---- Undo ----
        topicObj.setLanguageCode(oldLanguageCode);
      }
    );
  }

  /**
   * Creates a subtopic and adds it to the topic and records the change in
   * the undo/redo service.
   */
  addSubtopic(topic: Topic, title: string, urlFragment: string): void {
    const nextSubtopicId = topic.getNextSubtopicId();
    this._applyChange(
      topic,
      TopicDomainConstants.CMD_ADD_SUBTOPIC,
      {
        subtopic_id: nextSubtopicId,
        title,
        url_fragment: urlFragment,
      },
      (changeDict: BackendChangeObject, topicObj: Topic) => {
        // ---- Apply ----
        topicObj.addSubtopic(title);
      },
      (changeDict: BackendChangeObject, topicObj: Topic) => {
        // ---- Undo ----
        const subtopicId = this._getSubtopicIdFromChangeDict(changeDict) as number;
        // deleteSubtopic expects two args in this codebase (id, newlyCreated).
        topicObj.deleteSubtopic(subtopicId, true);
      }
    );
  }

  /**
   * @param {Topic} topic - The topic object to be edited.
   * @param {number} subtopicId - The id of the subtopic to delete.
   */
  deleteSubtopic(topic: Topic, subtopicId: number): void {
    const subtopic = topic.getSubtopicById(subtopicId);
    if (!subtopic) {
      throw new Error(`Subtopic with id ${subtopicId} doesn't exist`);
    }
    let newlyCreated = false;
    const changeList = this.undoRedoService.getCommittableChangeList();
    for (let i = 0; i < changeList.length; i++) {
      const _changeList = changeList[i] as TopicChange;
      if (
        _changeList.cmd === TopicDomainConstants.CMD_ADD_SUBTOPIC &&
        _changeList.subtopic_id === subtopicId
      ) {
        newlyCreated = true;
      }
    }
    if (newlyCreated) {
      // Get the current change list.
      const currentChangeList: Change[] = this.undoRedoService.getChangeList();
      const indicesToDelete: number[] = [];
      // Loop over the current changelist and handle all the cases where
      // a skill moved into the subtopic or moved out of it.
      for (let i = 0; i < currentChangeList.length; i++) {
        let changeDict: BackendChangeObject = currentChangeList[i].getBackendChangeObject();
        if (
          changeDict.cmd === TopicDomainConstants.CMD_MOVE_SKILL_ID_TO_SUBTOPIC
        ) {
          // If a skill was moved into the subtopic, then that change is
          // modified to have the skill move into the uncategorized section
          // since after this delete, it would be as if this subtopic never
          // existed.
          if ((changeDict as any).new_subtopic_id === subtopicId) {
            // If the origin of the move operation was the uncategorized
            // section itself, delete that change, since no change is to be
            // done following the previous comment.
            if ((changeDict as any).old_subtopic_id === null) {
              indicesToDelete.push(i);
            } else {
              // Change the move operation to the deleted subtopic to a
              // remove operation, to move that skill into the uncategorized
              // section from its origin.
              const _changeDict: TopicChange = {
                cmd: TopicDomainConstants.CMD_REMOVE_SKILL_ID_FROM_SUBTOPIC,
                subtopic_id: (changeDict as any).old_subtopic_id,
                skill_id: (changeDict as any).skill_id,
              };
              changeDict = _changeDict as BackendChangeObject;
            }
          } else if ((changeDict as any).old_subtopic_id === subtopicId) {
            // Any operation where a skill was moved out of this subtopic
            // would now be equivalent to a move out from the uncategorized
            // section, as a newly created subtopic wouldn't have any skills
            // of its own initially, and any skills moved into it have been
            // shifted to the uncategorized section.
            (changeDict as any).old_subtopic_id = null;
          }
        } else if (
          changeDict.cmd ===
          TopicDomainConstants.CMD_REMOVE_SKILL_ID_FROM_SUBTOPIC
        ) {
          // If a skill was removed from this subtopic, then that change
          // should be deleted, since all skills moved into the subtopic
          // have already been moved into the uncategorized section.
          if ((changeDict as any).subtopic_id === subtopicId) {
            indicesToDelete.push(i);
          }
        }
        currentChangeList[i].setBackendChangeObject(changeDict);
      }
      for (let i = 0; i < currentChangeList.length; i++) {
        const backendChangeDict: BackendChangeObject = currentChangeList[i].getBackendChangeObject();
        // Check presence of member equivalent of hasOwnProperty
        // https://www.typescriptlang.org/docs/handbook/advanced-types.html
        if ('subtopic_id' in (backendChangeDict as any)) {
          if ((backendChangeDict as any).subtopic_id === subtopicId) {
            // The indices in the change list corresponding to changes to
            // the currently deleted and newly created subtopic are to be
            // removed from the list.
            indicesToDelete.push(i);
            continue;
          }
          // When a newly created subtopic is deleted, the subtopics created
          // after it would have their id reduced by 1.
          if ((backendChangeDict as any).subtopic_id != null && (backendChangeDict as any).subtopic_id > subtopicId) {
            (backendChangeDict as any).subtopic_id--;
          }
        }
        if ('old_subtopic_id' in (backendChangeDict as any)) {
          if ((backendChangeDict as any).old_subtopic_id != null && (backendChangeDict as any).old_subtopic_id > subtopicId) {
            (backendChangeDict as any).old_subtopic_id--;
          }
        }
        if ('new_subtopic_id' in (backendChangeDict as any)) {
          if ((backendChangeDict as any).new_subtopic_id != null && (backendChangeDict as any).new_subtopic_id > subtopicId) {
            (backendChangeDict as any).new_subtopic_id--;
          }
        }
        // Apply the above id reduction changes to the backend change.
        currentChangeList[i].setBackendChangeObject(backendChangeDict);
      }
      // The new change list is found by deleting the above found elements.
      const newChangeList = currentChangeList.filter(change => {
        const changeObjectIndex = currentChangeList.indexOf(change);
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
      (changeDict: BackendChangeObject, topicObj: Topic) => {
        // ---- Apply ----
        topicObj.deleteSubtopic(subtopicId, newlyCreated);
      },
      (changeDict: BackendChangeObject, topicObj: Topic) => {
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
    oldSubtopicId: number | null,
    newSubtopicId: number,
    skillSummary: ShortSkillSummary
  ): void {
    if (newSubtopicId === null || newSubtopicId === undefined) {
      throw new Error('New subtopic cannot be null');
    }
    let oldSubtopic: Subtopic | null = null;
    if (oldSubtopicId !== null && oldSubtopicId !== undefined) {
      oldSubtopic = topic.getSubtopicById(oldSubtopicId);
    }
    const newSubtopic = topic.getSubtopicById(newSubtopicId)!;
    this._applyChange(
      topic,
      TopicDomainConstants.CMD_MOVE_SKILL_ID_TO_SUBTOPIC,
      {
        old_subtopic_id: oldSubtopicId,
        new_subtopic_id: newSubtopicId,
        skill_id: skillSummary.getId(),
      },
      (changeDict: BackendChangeObject, topicObj: Topic) => {
        // ---- Apply ----
        if (oldSubtopicId === null || oldSubtopicId === undefined) {
          topicObj.removeUncategorizedSkill(skillSummary.getId());
        } else {
          oldSubtopic!.removeSkill(skillSummary.getId());
        }
        newSubtopic.addSkill(
          skillSummary.getId(),
          skillSummary.getDescription()
        );
      },
      (changeDict: BackendChangeObject, topicObj: Topic) => {
        // ---- Undo ----
        newSubtopic.removeSkill(skillSummary.getId());
        if (oldSubtopicId === null || oldSubtopicId === undefined) {
          topicObj.addUncategorizedSkill(
            skillSummary.getId(),
            skillSummary.getDescription()
          );
        } else {
          oldSubtopic!.addSkill(
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
    const subtopic = topic.getSubtopicById(subtopicId)!;
    this._applyChange(
      topic,
      TopicDomainConstants.CMD_REMOVE_SKILL_ID_FROM_SUBTOPIC,
      {
        subtopic_id: subtopicId,
        skill_id: skillSummary.getId(),
      },
      (changeDict: BackendChangeObject, topicObj: Topic) => {
        // ---- Apply ----
        subtopic.removeSkill(skillSummary.getId());
        if (!topicObj.hasUncategorizedSkill(skillSummary.getId())) {
          topicObj.addUncategorizedSkill(
            skillSummary.getId(),
            skillSummary.getDescription()
          );
        }
      },
      (changeDict: BackendChangeObject, topicObj: Topic) => {
        // ---- Undo ----
        subtopic.addSkill(skillSummary.getId(), skillSummary.getDescription());
        topicObj.removeUncategorizedSkill(skillSummary.getId());
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
    const subtopic = topic.getSubtopicById(subtopicId);
    if (!subtopic) {
      throw new Error(`Subtopic with id ${subtopicId} doesn't exist`);
    }
    // ensure non-null string for old value
    const oldThumbnailFilename = cloneDeep(subtopic.getThumbnailFilename()) ?? '';
    this._applySubtopicPropertyChange(
      topic,
      TopicDomainConstants.SUBTOPIC_PROPERTY_THUMBNAIL_FILENAME,
      subtopicId,
      thumbnailFilename,
      oldThumbnailFilename,
      (changeDict: BackendChangeObject, topicObj: Topic) => {
        // ---- Apply ----
        const newVal = this._getNewPropertyValueFromChangeDict(changeDict) as string;
        subtopic.setThumbnailFilename(newVal);
      },
      (changeDict: BackendChangeObject, topicObj: Topic) => {
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
    const subtopic = topic.getSubtopicById(subtopicId);
    if (!subtopic) {
      throw new Error(`Subtopic with id ${subtopicId} doesn't exist`);
    }
    // ensure non-null string for old value
    const oldUrlFragment = cloneDeep(subtopic.getUrlFragment()) ?? '';
    this._applySubtopicPropertyChange(
      topic,
      TopicDomainConstants.SUBTOPIC_PROPERTY_URL_FRAGMENT,
      subtopicId,
      urlFragment,
      oldUrlFragment,
      (changeDict: BackendChangeObject, topicObj: Topic) => {
        // ---- Apply ----
        const newVal = this._getNewPropertyValueFromChangeDict(changeDict) as string;
        subtopic.setUrlFragment(newVal);
      },
      (changeDict: BackendChangeObject, topicObj: Topic) => {
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
    const subtopic = topic.getSubtopicById(subtopicId);
    if (!subtopic) {
      throw new Error(`Subtopic with id ${subtopicId} doesn't exist`);
    }
    // ensure non-null string for old value
    const oldThumbnailBgColor = cloneDeep(subtopic.getThumbnailBgColor()) ?? '';
    this._applySubtopicPropertyChange(
      topic,
      TopicDomainConstants.SUBTOPIC_PROPERTY_THUMBNAIL_BG_COLOR,
      subtopicId,
      thumbnailBgColor,
      oldThumbnailBgColor,
      (changeDict: BackendChangeObject, topicObj: Topic) => {
        // ---- Apply ----
        const newVal = this._getNewPropertyValueFromChangeDict(changeDict) as string;
        subtopic.setThumbnailBgColor(newVal);
      },
      (changeDict: BackendChangeObject, topicObj: Topic) => {
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
    const subtopic = topic.getSubtopicById(subtopicId);
    if (!subtopic) {
      throw new Error(`Subtopic with id ${subtopicId} doesn't exist`);
    }
    const oldTitle = cloneDeep(subtopic.getTitle());
    this._applySubtopicPropertyChange(
      topic,
      TopicDomainConstants.SUBTOPIC_PROPERTY_TITLE,
      subtopicId,
      title,
      oldTitle,
      (changeDict: BackendChangeObject, topicObj: Topic) => {
        // ---- Apply ----
        const newVal = this._getNewPropertyValueFromChangeDict(changeDict) as string;
        subtopic.setTitle(newVal);
      },
      (changeDict: BackendChangeObject, topicObj: Topic) => {
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
    const oldSubtitledHtml = cloneDeep(
      subtopicPage.getPageContents().getSubtitledHtml()
    );
    this._applySubtopicPagePropertyChange(
      subtopicPage,
      TopicDomainConstants.SUBTOPIC_PAGE_PROPERTY_PAGE_CONTENTS_HTML,
      subtopicId,
      newSubtitledHtml.toBackendDict(),
      oldSubtitledHtml.toBackendDict(),
      (changeDict: BackendChangeObject, subtopicPageObj: SubtopicPage) => {
        // ---- Apply ----
        subtopicPageObj.getPageContents().setSubtitledHtml(newSubtitledHtml);
      },
      (changeDict: BackendChangeObject, subtopicPageObj: SubtopicPage) => {
        // ---- Undo ----
        subtopicPageObj.getPageContents().setSubtitledHtml(oldSubtitledHtml);
      }
    );
  }

  // Use new and old value vars.
  addSection(
    studyGuide: StudyGuide,
    newSection: StudyGuideSection,
    subtopicId: number
  ): void {
    const oldSections = cloneDeep(studyGuide.getSections());
    const newSections = cloneDeep(oldSections);
    newSections.push(newSection);
    this.updateSections(studyGuide, newSections, subtopicId);
  }

  updateSections(
    studyGuide: StudyGuide,
    newSections: StudyGuideSection[],
    subtopicId: number
  ): void {
    const oldSections = cloneDeep(studyGuide.getSections());
    this._applyStudyGuidePropertyChange(
      studyGuide,
      TopicDomainConstants.STUDY_GUIDE_PROPERTY_SECTIONS,
      subtopicId,
      newSections.map(section => section.toBackendDict()),
      oldSections.map(section => section.toBackendDict()),
      (changeDict: BackendChangeObject, studyGuideObj: StudyGuide) => {
        studyGuideObj.setSections(newSections);
      },
      (changeDict: BackendChangeObject, studyGuideObj: StudyGuide) => {
        studyGuideObj.setSections(oldSections);
      }
    );
  }

  updateSection(
    studyGuide: StudyGuide,
    sectionIndex: number,
    newSectionHeadingPlaintext: string,
    newSectionContentHtml: string,
    subtopicId: number
  ): void {
    const newSections = cloneDeep(studyGuide.getSections());
    newSections[sectionIndex].setHeadingPlaintext(newSectionHeadingPlaintext);
    newSections[sectionIndex].setContentHtml(newSectionContentHtml);
    this.updateSections(studyGuide, newSections, subtopicId);
  }

  deleteSection(
    studyGuide: StudyGuide,
    sectionIndex: number,
    subtopicId: number
  ): void {
    const oldSections = cloneDeep(studyGuide.getSections());
    const newSections = cloneDeep(oldSections);
    newSections.splice(sectionIndex, 1);
    this.updateSections(studyGuide, newSections, subtopicId);
  }

  setSubtopicPageContentsAudio(
    subtopicPage: SubtopicPage,
    subtopicId: number,
    newRecordedVoiceovers: RecordedVoiceovers
  ): void {
    const oldRecordedVoiceovers = cloneDeep(
      subtopicPage.getPageContents().getRecordedVoiceovers()
    );
    this._applySubtopicPagePropertyChange(
      subtopicPage,
      TopicDomainConstants.SUBTOPIC_PAGE_PROPERTY_PAGE_CONTENTS_AUDIO,
      subtopicId,
      newRecordedVoiceovers.toBackendDict(),
      oldRecordedVoiceovers.toBackendDict(),
      (changeDict: BackendChangeObject, subtopicPageObj: SubtopicPage) => {
        // ---- Apply ----
        subtopicPageObj
          .getPageContents()
          .setRecordedVoiceovers(newRecordedVoiceovers);
      },
      (changeDict: BackendChangeObject, subtopicPageObj: SubtopicPage) => {
        // ---- Undo ----
        subtopicPageObj
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
      (changeDict: BackendChangeObject, topicObj: Topic) => {
        // ---- Apply ----
        topicObj.removeAdditionalStory(storyId);
      },
      (changeDict: BackendChangeObject, topicObj: Topic) => {
        // ---- Undo ----
        topicObj.addAdditionalStory(storyId);
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
      (changeDict: BackendChangeObject, topicObj: Topic) => {
        // ---- Apply ----
        topicObj.removeCanonicalStory(storyId);
      },
      (changeDict: BackendChangeObject, topicObj: Topic) => {
        // ---- Undo ----
        topicObj.addCanonicalStory(storyId);
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
      (changeDict: BackendChangeObject, topicObj: Topic) => {
        // ---- Apply ----
        topicObj.rearrangeCanonicalStory(fromIndex, toIndex);
      },
      (changeDict: BackendChangeObject, topicObj: Topic) => {
        // ---- Undo ----
        topicObj.rearrangeCanonicalStory(toIndex, fromIndex);
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
      (changeDict: BackendChangeObject, topicObj: Topic) => {
        // ---- Apply ----
        topicObj.rearrangeSkillInSubtopic(subtopicId, fromIndex, toIndex);
      },
      (changeDict: BackendChangeObject, topicObj: Topic) => {
        // ---- Undo ----
        topicObj.rearrangeSkillInSubtopic(subtopicId, toIndex, fromIndex);
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
      (changeDict: BackendChangeObject, topicObj: Topic) => {
        // ---- Apply ----
        topicObj.rearrangeSubtopic(fromIndex, toIndex);
      },
      (changeDict: BackendChangeObject, topicObj: Topic) => {
        // ---- Undo ----
        topicObj.rearrangeSubtopic(toIndex, fromIndex);
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
      (changeDict: BackendChangeObject, topicObj: Topic) => {
        // ---- Apply ----
        const newSkillId = this._getParameterFromChangeDict(
          changeDict,
          'uncategorized_skill_id'
        ) as string;
        topicObj.removeUncategorizedSkill(newSkillId);
      },
      (changeDict: BackendChangeObject, topicObj: Topic) => {
        // ---- Undo ----
        const newSkillId = this._getParameterFromChangeDict(
          changeDict,
          'uncategorized_skill_id'
        ) as string;
        topicObj.addUncategorizedSkill(newSkillId, skillSummary.getDescription());
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
    const oldSkillSummariesForDiagnosticTest = cloneDeep(
      topic.getSkillSummariesForDiagnosticTest()
    );
    const oldSkillIdsForDiagnosticTest = oldSkillSummariesForDiagnosticTest.map(
      (skillSummary: ShortSkillSummary) => skillSummary.getId()
    );
    const newSkillIdsForDiagnosticTest = newSkillSummariesForDiagnosticTest.map(
      (skillSummary: ShortSkillSummary) => skillSummary.getId()
    );

    this._applyTopicPropertyChange(
      topic,
      TopicDomainConstants.TOPIC_PROPERTY_SKILL_IDS_FOR_DIAGNOSTIC_TEST,
      newSkillIdsForDiagnosticTest,
      oldSkillIdsForDiagnosticTest,
      (changeDict: BackendChangeObject, topicObj: Topic) => {
        topicObj.setSkillSummariesForDiagnosticTest(
          newSkillSummariesForDiagnosticTest
        );
      },
      (changeDict: BackendChangeObject, topicObj: Topic) => {
        topicObj.setSkillSummariesForDiagnosticTest(
          oldSkillSummariesForDiagnosticTest
        );
      }
    );
  }
}
