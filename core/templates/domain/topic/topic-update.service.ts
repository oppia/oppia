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
 * @fileoverview Service to build changes to a topic These changes may
 * then be used by other services, such as a backend API service to update the
 * topic in the backend This service also registers all changes with the
 * undo/redo service
 */

import {Injectable} from '@angular/core';

import cloneDeep from 'lodash/cloneDeep';

import {
  BackendChangeObject,
  Change,
  DomainObject,
  TopicChange,
} from 'domain/editor/undo_redo/change.model';
import {UndoRedoService} from 'domain/editor/undo_redo/undo-redo.service';
import {TopicDomainConstants} from 'domain/topic/topic-domain.constants';
import {Topic} from 'domain/topic/topic-object.model';
import {ShortSkillSummary} from 'core/templates/domain/skill/short-skill-summary.model';
import {
  SubtitledHtml,
  SubtitledHtmlBackendDict,
} from 'core/templates/domain/exploration/subtitled-html.model';
import {SubtopicPage} from 'core/templates/domain/topic/subtopic-page.model';
import {
  RecordedVoiceovers,
  RecordedVoiceOverBackendDict,
} from 'core/templates/domain/exploration/recorded-voiceovers.model';
import {StudyGuide} from 'core/templates/domain/topic/study-guide.model';
import {
  StudyGuideSection,
  StudyGuideSectionBackendDict,
} from 'core/templates/domain/topic/study-guide-sections.model';

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
type TopicPropertyValue =
  | string
  | string[]
  | boolean
  | number
  | null
  | SubtitledHtmlBackendDict
  | RecordedVoiceOverBackendDict
  | readonly StudyGuideSectionBackendDict[];

type TopicUpdateApply = (
  topicChange: TopicChange,
  domainObject: DomainObject
) => void;
type TopicUpdateReverse = (
  topicChange: TopicChange,
  domainObject: DomainObject
) => void;
type SubtopicUpdateApply = (
  topicChange: TopicChange,
  domainObject: DomainObject
) => void;
type SubtopicUpdateReverse = (
  topicChange: TopicChange,
  domainObject: DomainObject
) => void;
type StudyGuideUpdateApply = (
  topicChange: TopicChange,
  domainObject: DomainObject
) => void;
type StudyGuideUpdateReverse = (
  topicChange: TopicChange,
  domainObject: DomainObject
) => void;

@Injectable({
  providedIn: 'root',
})
export class TopicUpdateService {
  constructor(private undoRedoService: UndoRedoService) {}

  private _applyChange(
    entity: Topic | SubtopicPage | StudyGuide,
    command: string,
    params: Record<string, TopicPropertyValue>,
    apply: (
      backendChangeObject: TopicChange,
      domainObject: DomainObject
    ) => void,
    reverse: (
      backendChangeObject: TopicChange,
      domainObject: DomainObject
    ) => void
  ): void {
    let changeDict = cloneDeep(params) as Partial<TopicChange>;
    changeDict.cmd = command as TopicChange['cmd'];
    let changeObj = new Change(
      changeDict as Partial<TopicChange> as TopicChange,
      apply as (
        backendChangeObject: BackendChangeObject,
        domainObject: DomainObject
      ) => void,
      reverse as (
        backendChangeObject: BackendChangeObject,
        domainObject: DomainObject
      ) => void
    );
    this.undoRedoService.applyChange(changeObj, entity);
  }

  private _applyTopicPropertyChange(
    topic: Topic,
    propertyName: string,
    newValue: TopicPropertyValue,
    oldValue: TopicPropertyValue,
    apply: TopicUpdateApply,
    reverse: TopicUpdateReverse
  ): void {
    this._applyChange(
      topic,
      TopicDomainConstants.CMD_UPDATE_TOPIC_PROPERTY,
      {
        property_name: propertyName,
        new_value: cloneDeep(newValue),
        old_value: cloneDeep(oldValue),
      },
      apply as (
        backendChangeObject: TopicChange,
        domainObject: DomainObject
      ) => void,
      reverse as (
        backendChangeObject: BackendChangeObject,
        domainObject: DomainObject
      ) => void
    );
  }

  private _applySubtopicPropertyChange(
    topic: Topic,
    propertyName: string,
    subtopicId: number,
    newValue: TopicPropertyValue,
    oldValue: TopicPropertyValue,
    apply: TopicUpdateApply,
    reverse: TopicUpdateReverse
  ): void {
    this._applyChange(
      topic,
      TopicDomainConstants.CMD_UPDATE_SUBTOPIC_PROPERTY,
      {
        subtopic_id: subtopicId,
        property_name: propertyName,
        new_value: cloneDeep(newValue),
        old_value: cloneDeep(oldValue),
      },
      apply as (
        backendChangeObject: TopicChange,
        domainObject: DomainObject
      ) => void,
      reverse as (
        backendChangeObject: BackendChangeObject,
        domainObject: DomainObject
      ) => void
    );
  }

  private _applySubtopicPagePropertyChange(
    subtopicPage: SubtopicPage,
    propertyName: string,
    subtopicId: number,
    newValue: TopicPropertyValue,
    oldValue: TopicPropertyValue,
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
      apply as (
        backendChangeObject: TopicChange,
        domainObject: DomainObject
      ) => void,
      reverse as (
        backendChangeObject: BackendChangeObject,
        domainObject: DomainObject
      ) => void
    );
  }

  private _applyStudyGuidePropertyChange(
    studyGuide: StudyGuide,
    propertyName: string,
    subtopicId: number,
    newValue: TopicPropertyValue,
    oldValue: TopicPropertyValue,
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
      apply as (
        backendChangeObject: TopicChange,
        domainObject: DomainObject
      ) => void,
      reverse as (
        backendChangeObject: BackendChangeObject,
        domainObject: DomainObject
      ) => void
    );
  }

  setTopicName(topic: Topic, name: string): void {
    const oldName = topic.getName();
    this._applyTopicPropertyChange(
      topic,
      TopicDomainConstants.TOPIC_PROPERTY_NAME,
      name,
      oldName,
      (changeDict: TopicChange, domainObject: DomainObject) => {
        const topicObj = domainObject as Topic;
        topicObj.setName(changeDict.new_value as string);
      },
      () => {
        topic.setName(oldName);
      }
    );
  }

  setAbbreviatedTopicName(topic: Topic, abbreviatedName: string): void {
    const oldAbbreviatedName = topic.getAbbreviatedName();
    this._applyTopicPropertyChange(
      topic,
      TopicDomainConstants.TOPIC_PROPERTY_ABBREVIATED_NAME,
      abbreviatedName,
      oldAbbreviatedName,
      (changeDict: TopicChange, domainObject: DomainObject) => {
        const topicObj = domainObject as Topic;
        topicObj.setAbbreviatedName(changeDict.new_value as string);
      },
      () => {
        topic.setAbbreviatedName(oldAbbreviatedName);
      }
    );
  }

  setMetaTagContent(topic: Topic, metaTagContent: string): void {
    const oldMetaTagContent = topic.getMetaTagContent();
    this._applyTopicPropertyChange(
      topic,
      TopicDomainConstants.TOPIC_PROPERTY_META_TAG_CONTENT,
      metaTagContent,
      oldMetaTagContent,
      (changeDict: TopicChange, domainObject: DomainObject) => {
        const topicObj = domainObject as Topic;
        topicObj.setMetaTagContent(changeDict.new_value as string);
      },
      () => {
        topic.setMetaTagContent(oldMetaTagContent);
      }
    );
  }

  setPracticeTabIsDisplayed(
    topic: Topic,
    practiceTabIsDisplayed: boolean
  ): void {
    const oldPracticeTabIsDisplayed = topic.getPracticeTabIsDisplayed();
    this._applyTopicPropertyChange(
      topic,
      TopicDomainConstants.TOPIC_PROPERTY_PRACTICE_TAB_IS_DISPLAYED,
      practiceTabIsDisplayed,
      oldPracticeTabIsDisplayed,
      (changeDict: TopicChange, domainObject: DomainObject) => {
        const topicObj = domainObject as Topic;
        topicObj.setPracticeTabIsDisplayed(changeDict.new_value as boolean);
      },
      () => {
        topic.setPracticeTabIsDisplayed(oldPracticeTabIsDisplayed);
      }
    );
  }

  setPageTitleFragmentForWeb(
    topic: Topic,
    pageTitleFragmentForWeb: string
  ): void {
    const oldPageTitleFragmentForWeb = topic.getPageTitleFragmentForWeb();
    this._applyTopicPropertyChange(
      topic,
      TopicDomainConstants.TOPIC_PROPERTY_PAGE_TITLE_FRAGMENT_FOR_WEB,
      pageTitleFragmentForWeb,
      oldPageTitleFragmentForWeb,
      (changeDict: TopicChange, domainObject: DomainObject) => {
        const topicObj = domainObject as Topic;
        topicObj.setPageTitleFragmentForWeb(changeDict.new_value as string);
      },
      () => {
        topic.setPageTitleFragmentForWeb(oldPageTitleFragmentForWeb);
      }
    );
  }

  setTopicUrlFragment(topic: Topic, urlFragment: string): void {
    const oldUrlFragment = topic.getUrlFragment();
    this._applyTopicPropertyChange(
      topic,
      TopicDomainConstants.TOPIC_PROPERTY_URL_FRAGMENT,
      urlFragment,
      oldUrlFragment,
      (changeDict: TopicChange, domainObject: DomainObject) => {
        const topicObj = domainObject as Topic;
        topicObj.setUrlFragment(changeDict.new_value as string);
      },
      () => {
        topic.setUrlFragment(oldUrlFragment);
      }
    );
  }

  setTopicThumbnailFilename(topic: Topic, thumbnailFilename: string): void {
    const oldThumbnailFilename = topic.getThumbnailFilename();
    this._applyTopicPropertyChange(
      topic,
      TopicDomainConstants.TOPIC_PROPERTY_THUMBNAIL_FILENAME,
      thumbnailFilename,
      oldThumbnailFilename,
      (changeDict: TopicChange, domainObject: DomainObject) => {
        const topicObj = domainObject as Topic;
        topicObj.setThumbnailFilename(changeDict.new_value as string);
      },
      () => {
        topic.setThumbnailFilename(oldThumbnailFilename);
      }
    );
  }

  setTopicThumbnailBgColor(topic: Topic, thumbnailBgColor: string): void {
    const oldThumbnailBgColor = topic.getThumbnailBgColor();
    this._applyTopicPropertyChange(
      topic,
      TopicDomainConstants.TOPIC_PROPERTY_THUMBNAIL_BG_COLOR,
      thumbnailBgColor,
      oldThumbnailBgColor,
      (changeDict: TopicChange, domainObject: DomainObject) => {
        const topicObj = domainObject as Topic;
        topicObj.setThumbnailBgColor(changeDict.new_value as string);
      },
      () => {
        topic.setThumbnailBgColor(oldThumbnailBgColor);
      }
    );
  }

  setTopicDescription(topic: Topic, description: string): void {
    const oldDescription = topic.getDescription();
    this._applyTopicPropertyChange(
      topic,
      TopicDomainConstants.TOPIC_PROPERTY_DESCRIPTION,
      description,
      oldDescription,
      (changeDict: TopicChange, domainObject: DomainObject) => {
        const topicObj = domainObject as Topic;
        topicObj.setDescription(changeDict.new_value as string);
      },
      () => {
        topic.setDescription(oldDescription);
      }
    );
  }

  setTopicLanguageCode(topic: Topic, languageCode: string): void {
    const oldLanguageCode = topic.getLanguageCode();
    this._applyTopicPropertyChange(
      topic,
      TopicDomainConstants.TOPIC_PROPERTY_LANGUAGE_CODE,
      languageCode,
      oldLanguageCode,
      (changeDict: TopicChange, domainObject: DomainObject) => {
        const topicObj = domainObject as Topic;
        topicObj.setLanguageCode(changeDict.new_value as string);
      },
      () => {
        topic.setLanguageCode(oldLanguageCode);
      }
    );
  }

  addSubtopic(topic: Topic, title: string, urlFragment: string): void {
    const nextSubtopicId = topic.getNextSubtopicId();
    this._applyChange(
      topic,
      TopicDomainConstants.CMD_ADD_SUBTOPIC,
      {
        subtopic_id: nextSubtopicId,
        title: title,
        url_fragment: urlFragment,
      },
      (changeDict: TopicChange, domainObject: DomainObject) => {
        const topicObj = domainObject as Topic;
        topicObj.addSubtopic(title);
      },
      (changeDict: TopicChange, domainObject: DomainObject) => {
        const topicObj = domainObject as Topic;
        const subtopicId = changeDict.subtopic_id as number;
        topicObj.deleteSubtopic(subtopicId, true);
      }
    );
  }

  deleteSubtopic(topic: Topic, subtopicId: number): void {
    const subtopic = topic.getSubtopicById(subtopicId);
    if (!subtopic) {
      throw new Error(`Subtopic with id ${subtopicId} doesn\'t exist`);
    }
    let newlyCreated = false;
    const changeList = this.undoRedoService.getCommittableChangeList();
    for (let i = 0; i < changeList.length; i++) {
      const topicChange = changeList[i] as TopicChange;
      if (
        topicChange.cmd === 'add_subtopic' &&
        topicChange.subtopic_id === subtopicId
      ) {
        newlyCreated = true;
      }
    }
    if (newlyCreated) {
      const currentChangeList: Change[] = this.undoRedoService.getChangeList();
      const indicesToDelete: number[] = [];
      for (let i = 0; i < currentChangeList.length; i++) {
        let changeDict = currentChangeList[
          i
        ].getBackendChangeObject() as TopicChange;
        if (
          changeDict.cmd === TopicDomainConstants.CMD_MOVE_SKILL_ID_TO_SUBTOPIC
        ) {
          if (changeDict.new_subtopic_id === subtopicId) {
            if (changeDict.old_subtopic_id === null) {
              indicesToDelete.push(i);
            } else {
              const _changeDict: TopicChange = {
                cmd: TopicDomainConstants.CMD_REMOVE_SKILL_ID_FROM_SUBTOPIC,
                subtopic_id: changeDict.old_subtopic_id,
                skill_id: changeDict.skill_id,
              } as TopicChange;
              changeDict = _changeDict;
            }
          } else if (changeDict.old_subtopic_id === subtopicId) {
            changeDict.old_subtopic_id = null;
          }
        } else if (
          changeDict.cmd ===
          TopicDomainConstants.CMD_REMOVE_SKILL_ID_FROM_SUBTOPIC
        ) {
          if (changeDict.subtopic_id === subtopicId) {
            indicesToDelete.push(i);
          }
        }
        currentChangeList[i].setBackendChangeObject(changeDict);
      }
      for (let i = 0; i < currentChangeList.length; i++) {
        const backendChangeDict = currentChangeList[
          i
        ].getBackendChangeObject() as TopicChange;
        if ('subtopic_id' in backendChangeDict) {
          if (backendChangeDict.subtopic_id === subtopicId) {
            indicesToDelete.push(i);
            continue;
          }
          if (
            backendChangeDict.subtopic_id !== undefined &&
            backendChangeDict.subtopic_id > subtopicId
          ) {
            backendChangeDict.subtopic_id--;
          }
        }
        if ('old_subtopic_id' in backendChangeDict) {
          if (
            backendChangeDict.old_subtopic_id !== null &&
            backendChangeDict.old_subtopic_id !== undefined &&
            backendChangeDict.old_subtopic_id > subtopicId
          ) {
            backendChangeDict.old_subtopic_id--;
          }
        }
        if ('new_subtopic_id' in backendChangeDict) {
          if (
            backendChangeDict.new_subtopic_id !== undefined &&
            backendChangeDict.new_subtopic_id > subtopicId
          ) {
            backendChangeDict.new_subtopic_id--;
          }
        }
        currentChangeList[i].setBackendChangeObject(backendChangeDict);
      }
      const newChangeList = currentChangeList.filter(
        (change, idx) => indicesToDelete.indexOf(idx) === -1
      );
      this.undoRedoService.setChangeList(newChangeList);
      topic.deleteSubtopic(subtopicId, newlyCreated);
      return;
    }
    this._applyChange(
      topic,
      TopicDomainConstants.CMD_DELETE_SUBTOPIC,
      {subtopic_id: subtopicId},
      (changeDict: TopicChange, domainObject: DomainObject) => {
        const topicObj = domainObject as Topic;
        topicObj.deleteSubtopic(subtopicId, newlyCreated);
      },
      () => {
        throw new Error('A deleted subtopic cannot be restored');
      }
    );
  }

  moveSkillToSubtopic(
    topic: Topic,
    oldSubtopicId: number | null,
    newSubtopicId: number,
    skillSummary: ShortSkillSummary
  ): void {
    if (newSubtopicId === null) {
      throw new Error('New subtopic cannot be null');
    }
    const newSubtopic = topic.getSubtopicById(newSubtopicId);
    if (!newSubtopic) {
      throw new Error(`Subtopic with id ${newSubtopicId} doesn't exist`);
    }

    this._applyChange(
      topic,
      TopicDomainConstants.CMD_MOVE_SKILL_ID_TO_SUBTOPIC,
      {
        old_subtopic_id: oldSubtopicId,
        new_subtopic_id: newSubtopicId,
        skill_id: skillSummary.getId(),
      },
      (changeDict: TopicChange, domainObject: DomainObject) => {
        const t = domainObject as Topic;
        if (oldSubtopicId === null) {
          t.removeUncategorizedSkill(skillSummary.getId());
        } else {
          const oldSubtopic = t.getSubtopicById(oldSubtopicId);
          if (oldSubtopic) {
            oldSubtopic.removeSkill(skillSummary.getId());
          }
        }
        const targetSubtopic = t.getSubtopicById(newSubtopicId);
        if (targetSubtopic) {
          targetSubtopic.addSkill(
            skillSummary.getId(),
            skillSummary.getDescription()
          );
        }
      },
      () => {
        const targetSubtopic = topic.getSubtopicById(newSubtopicId);
        if (targetSubtopic) {
          targetSubtopic.removeSkill(skillSummary.getId());
        }
        if (oldSubtopicId === null) {
          topic.addUncategorizedSkill(
            skillSummary.getId(),
            skillSummary.getDescription()
          );
        } else {
          const oldSubtopic = topic.getSubtopicById(oldSubtopicId);
          if (oldSubtopic) {
            oldSubtopic.addSkill(
              skillSummary.getId(),
              skillSummary.getDescription()
            );
          }
        }
      }
    );
  }

  removeSkillFromSubtopic(
    topic: Topic,
    subtopicId: number,
    skillSummary: ShortSkillSummary
  ): void {
    const subtopic = topic.getSubtopicById(subtopicId);
    if (!subtopic) {
      throw new Error(`Subtopic with id ${subtopicId} doesn't exist`);
    }
    this._applyChange(
      topic,
      TopicDomainConstants.CMD_REMOVE_SKILL_ID_FROM_SUBTOPIC,
      {
        subtopic_id: subtopicId,
        skill_id: skillSummary.getId(),
      },
      (changeDict: TopicChange, domainObject: DomainObject) => {
        const t = domainObject as Topic;
        const sub = t.getSubtopicById(subtopicId);
        if (sub) {
          sub.removeSkill(skillSummary.getId());
        }
        if (!t.hasUncategorizedSkill(skillSummary.getId())) {
          t.addUncategorizedSkill(
            skillSummary.getId(),
            skillSummary.getDescription()
          );
        }
      },
      () => {
        const t = topic;
        const sub = t.getSubtopicById(subtopicId);
        if (sub) {
          sub.addSkill(skillSummary.getId(), skillSummary.getDescription());
        }
        t.removeUncategorizedSkill(skillSummary.getId());
      }
    );
  }

  setSubtopicThumbnailFilename(
    topic: Topic,
    subtopicId: number,
    thumbnailFilename: string | null
  ): void {
    const subtopic = topic.getSubtopicById(subtopicId);
    if (!subtopic) {
      throw new Error(`Subtopic with id ${subtopicId} doesn\'t exist`);
    }
    const oldThumbnailFilename = subtopic.getThumbnailFilename();
    this._applySubtopicPropertyChange(
      topic,
      TopicDomainConstants.SUBTOPIC_PROPERTY_THUMBNAIL_FILENAME,
      subtopicId,
      thumbnailFilename,
      oldThumbnailFilename,
      (changeDict: TopicChange, domainObject: DomainObject) => {
        if (
          changeDict.cmd !== TopicDomainConstants.CMD_UPDATE_SUBTOPIC_PROPERTY
        ) {
          return;
        }
        const topicObj = domainObject as Topic;
        const sub = topicObj.getSubtopicById(subtopicId);
        if (sub) {
          sub.setThumbnailFilename(changeDict.new_value as string | null);
        }
      },
      () => {
        const sub = topic.getSubtopicById(subtopicId);
        if (sub) {
          sub.setThumbnailFilename(oldThumbnailFilename);
        }
      }
    );
  }

  setSubtopicUrlFragment(
    topic: Topic,
    subtopicId: number,
    urlFragment: string | null
  ): void {
    const subtopic = topic.getSubtopicById(subtopicId);
    if (!subtopic) {
      throw new Error(`Subtopic with id ${subtopicId} doesn\'t exist`);
    }
    const oldUrlFragment = subtopic.getUrlFragment();
    this._applySubtopicPropertyChange(
      topic,
      TopicDomainConstants.SUBTOPIC_PROPERTY_URL_FRAGMENT,
      subtopicId,
      urlFragment,
      oldUrlFragment,
      (changeDict: TopicChange, domainObject: DomainObject) => {
        if (
          changeDict.cmd !== TopicDomainConstants.CMD_UPDATE_SUBTOPIC_PROPERTY
        ) {
          return;
        }
        const topicObj = domainObject as Topic;
        const sub = topicObj.getSubtopicById(subtopicId);
        if (sub) {
          sub.setUrlFragment(changeDict.new_value as string | null);
        }
      },
      () => {
        const sub = topic.getSubtopicById(subtopicId);
        if (sub) {
          sub.setUrlFragment(oldUrlFragment);
        }
      }
    );
  }

  setSubtopicThumbnailBgColor(
    topic: Topic,
    subtopicId: number,
    thumbnailBgColor: string | null
  ): void {
    const subtopic = topic.getSubtopicById(subtopicId);
    if (!subtopic) {
      throw new Error(`Subtopic with id ${subtopicId} doesn\'t exist`);
    }
    const oldThumbnailBgColor = subtopic.getThumbnailBgColor();
    this._applySubtopicPropertyChange(
      topic,
      TopicDomainConstants.SUBTOPIC_PROPERTY_THUMBNAIL_BG_COLOR,
      subtopicId,
      thumbnailBgColor,
      oldThumbnailBgColor,
      (changeDict: TopicChange, domainObject: DomainObject) => {
        if (
          changeDict.cmd !== TopicDomainConstants.CMD_UPDATE_SUBTOPIC_PROPERTY
        ) {
          return;
        }
        const topicObj = domainObject as Topic;
        const sub = topicObj.getSubtopicById(subtopicId);
        if (sub) {
          sub.setThumbnailBgColor(changeDict.new_value as string | null);
        }
      },
      () => {
        const sub = topic.getSubtopicById(subtopicId);
        if (sub) {
          sub.setThumbnailBgColor(oldThumbnailBgColor);
        }
      }
    );
  }

  setSubtopicTitle(topic: Topic, subtopicId: number, title: string): void {
    const subtopic = topic.getSubtopicById(subtopicId);
    if (!subtopic) {
      throw new Error(`Subtopic with id ${subtopicId} doesn\'t exist`);
    }
    const oldTitle = subtopic.getTitle();
    this._applySubtopicPropertyChange(
      topic,
      TopicDomainConstants.SUBTOPIC_PROPERTY_TITLE,
      subtopicId,
      title,
      oldTitle,
      (changeDict: TopicChange, domainObject: DomainObject) => {
        const topicObj = domainObject as Topic;
        const sub = topicObj.getSubtopicById(subtopicId);
        if (sub) {
          sub.setTitle(title);
        }
      },
      () => {
        const sub = topic.getSubtopicById(subtopicId);
        if (sub) {
          sub.setTitle(oldTitle);
        }
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
      (changeDict: TopicChange, domainObject: DomainObject) => {
        const subtopicPageObj = domainObject as SubtopicPage;
        subtopicPageObj.getPageContents().setSubtitledHtml(newSubtitledHtml);
      },
      () => {
        subtopicPage.getPageContents().setSubtitledHtml(oldSubtitledHtml);
      }
    );
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
      newSections.map(s => s.toBackendDict()),
      oldSections.map(s => s.toBackendDict()),
      (changeDict: TopicChange, domainObject: DomainObject) => {
        const studyGuideObj = domainObject as StudyGuide;
        studyGuideObj.setSections(newSections);
      },
      () => {
        studyGuide.setSections(oldSections);
      }
    );
  }

  addSection(
    studyGuide: StudyGuide,
    newSection: StudyGuideSection,
    subtopicId: number
  ): void {
    const newSections = cloneDeep(studyGuide.getSections());
    newSections.push(newSection);
    this.updateSections(studyGuide, newSections, subtopicId);
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
    const newSections = cloneDeep(studyGuide.getSections());
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
      (changeDict: TopicChange, domainObject: DomainObject) => {
        const subtopicPageObj = domainObject as SubtopicPage;
        subtopicPageObj
          .getPageContents()
          .setRecordedVoiceovers(newRecordedVoiceovers);
      },
      () => {
        subtopicPage
          .getPageContents()
          .setRecordedVoiceovers(oldRecordedVoiceovers);
      }
    );
  }

  removeAdditionalStory(topic: Topic, storyId: string): void {
    this._applyChange(
      topic,
      TopicDomainConstants.CMD_DELETE_ADDITIONAL_STORY,
      {story_id: storyId},
      (changeDict: TopicChange, domainObject: DomainObject) => {
        const topicObj = domainObject as Topic;
        topicObj.removeAdditionalStory(storyId);
      },
      () => {
        topic.addAdditionalStory(storyId);
      }
    );
  }

  removeCanonicalStory(topic: Topic, storyId: string): void {
    this._applyChange(
      topic,
      TopicDomainConstants.CMD_DELETE_CANONICAL_STORY,
      {story_id: storyId},
      (changeDict: TopicChange, domainObject: DomainObject) => {
        const topicObj = domainObject as Topic;
        topicObj.removeCanonicalStory(storyId);
      },
      () => {
        topic.addCanonicalStory(storyId);
      }
    );
  }

  rearrangeCanonicalStory(
    topic: Topic,
    fromIndex: number,
    toIndex: number
  ): void {
    this._applyChange(
      topic,
      TopicDomainConstants.CMD_REARRANGE_CANONICAL_STORY,
      {from_index: fromIndex, to_index: toIndex},
      (changeDict: TopicChange, domainObject: DomainObject) => {
        const topicObj = domainObject as Topic;
        topicObj.rearrangeCanonicalStory(fromIndex, toIndex);
      },
      () => {
        topic.rearrangeCanonicalStory(toIndex, fromIndex);
      }
    );
  }

  rearrangeSkillInSubtopic(
    topic: Topic,
    subtopicId: number,
    fromIndex: number,
    toIndex: number
  ): void {
    this._applyChange(
      topic,
      TopicDomainConstants.CMD_REARRANGE_SKILL_IN_SUBTOPIC,
      {subtopic_id: subtopicId, from_index: fromIndex, to_index: toIndex},
      (changeDict: TopicChange, domainObject: DomainObject) => {
        const topicObj = domainObject as Topic;
        topicObj.rearrangeSkillInSubtopic(subtopicId, fromIndex, toIndex);
      },
      () => {
        topic.rearrangeSkillInSubtopic(subtopicId, toIndex, fromIndex);
      }
    );
  }

  rearrangeSubtopic(topic: Topic, fromIndex: number, toIndex: number): void {
    this._applyChange(
      topic,
      TopicDomainConstants.CMD_REARRANGE_SUBTOPIC,
      {from_index: fromIndex, to_index: toIndex},
      (changeDict: TopicChange, domainObject: DomainObject) => {
        const topicObj = domainObject as Topic;
        topicObj.rearrangeSubtopic(fromIndex, toIndex);
      },
      () => {
        topic.rearrangeSubtopic(toIndex, fromIndex);
      }
    );
  }

  removeUncategorizedSkill(
    topic: Topic,
    skillSummary: ShortSkillSummary
  ): void {
    const skillId = skillSummary.getId();
    this._applyChange(
      topic,
      TopicDomainConstants.CMD_REMOVE_UNCATEGORIZED_SKILL_ID,
      {uncategorized_skill_id: skillId},
      (changeDict: TopicChange, domainObject: DomainObject) => {
        const topicObj = domainObject as Topic;
        topicObj.removeUncategorizedSkill(skillId);
      },
      () => {
        topic.addUncategorizedSkill(skillId, skillSummary.getDescription());
      }
    );
  }

  updateDiagnosticTestSkills(
    topic: Topic,
    newSkillSummaries: ShortSkillSummary[]
  ): void {
    const oldSkillSummaries = cloneDeep(
      topic.getSkillSummariesForDiagnosticTest()
    );
    const oldIds = oldSkillSummaries.map(s => s.getId());
    const newIds = newSkillSummaries.map(s => s.getId());

    this._applyTopicPropertyChange(
      topic,
      TopicDomainConstants.TOPIC_PROPERTY_SKILL_IDS_FOR_DIAGNOSTIC_TEST,
      newIds,
      oldIds,
      (changeDict: TopicChange, domainObject: DomainObject) => {
        const topicObj = domainObject as Topic;
        topicObj.setSkillSummariesForDiagnosticTest(newSkillSummaries);
      },
      () => {
        topic.setSkillSummariesForDiagnosticTest(oldSkillSummaries);
      }
    );
  }
}
