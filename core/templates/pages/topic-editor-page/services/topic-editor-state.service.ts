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
 * @fileoverview Service to maintain the state of a single topic shared
 * throughout the topic editor. This service provides functionality for
 * retrieving the topic, saving it, and listening for changes.
 */

import { EventEmitter, Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';
import { UndoRedoService } from 'domain/editor/undo_redo/undo-redo.service';
import { Rubric, RubricBackendDict } from 'domain/skill/rubric.model';
import { SkillSummaryBackendDict } from 'domain/skill/skill-summary.model';
import { EditableStoryBackendApiService } from 'domain/story/editable-story-backend-api.service';
import { StorySummary, StorySummaryBackendDict } from 'domain/story/story-summary.model';
import { EditableTopicBackendApiService } from 'domain/topic/editable-topic-backend-api.service';
import { SubtopicPage, SubtopicPageBackendDict } from 'domain/topic/subtopic-page.model';
import { SkillIdToDescriptionMap } from 'domain/topic/subtopic.model';
import { TopicRightsBackendApiService } from 'domain/topic/topic-rights-backend-api.service';
import { TopicRights, TopicRightsBackendDict } from 'domain/topic/topic-rights.model';
import { Topic, TopicBackendDict } from 'domain/topic/topic-object.model';
import cloneDeep from 'lodash/cloneDeep';
import { AlertsService } from 'services/alerts.service';
import { TopicDeleteCanonicalStoryChange, TopicDeleteAdditionalStoryChange }
  from 'domain/editor/undo_redo/change.model';
import { LoaderService } from 'services/loader.service';
import { SubtopicPageContents } from 'domain/topic/subtopic-page-contents.model';

interface GroupedSkillSummaryDict {
  current: SkillSummaryBackendDict[];
  others: SkillSummaryBackendDict[];
}

@Injectable({
  providedIn: 'root'
})
export class TopicEditorStateService {
  // These properties below are initialized using Angular lifecycle hooks
  // where we need to do non-null assertion. For more information see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  private _topic!: Topic;
  private _topicRights!: TopicRights;
  private _subtopicPage!: SubtopicPage;
  // The array that caches all the subtopic pages loaded by the user.
  private _cachedSubtopicPages: SubtopicPage[] = [];
  // The array that stores all the ids of the subtopic pages that were not
  // loaded from the backend i.e those that correspond to newly created
  // subtopics (and not loaded from the backend).
  private _newSubtopicPageIds: string[] = [];
  private _topicIsInitialized: boolean = false;
  private _topicIsLoading: boolean = false;
  private _topicIsBeingSaved: boolean = false;
  private _topicWithNameExists: boolean = false;
  private _topicWithUrlFragmentExists: boolean = false;
  private _canonicalStorySummaries: StorySummary[] = [];
  private _skillIdToRubricsObject: Record<string, Rubric[]> = {};
  private _skillQuestionCountDict: Record<string, number> = {};
  private _groupedSkillSummaries: GroupedSkillSummaryDict = {
    current: [],
    others: []
  };

  private _skillCreationIsAllowed: boolean = false;
  private _classroomUrlFragment: string = 'staging';
  private _storySummariesInitializedEventEmitter: EventEmitter<void> = (
    new EventEmitter());

  private _subtopicPageLoadedEventEmitter: EventEmitter<void> = (
    new EventEmitter());

  private _topicInitializedEventEmitter: EventEmitter<void> = (
    new EventEmitter());

  private _topicReinitializedEventEmitter: EventEmitter<void> = (
    new EventEmitter());

  constructor(
    private alertsService: AlertsService,
    private editableStoryBackendApiService: EditableStoryBackendApiService,
    private editableTopicBackendApiService: EditableTopicBackendApiService,
    private topicRightsBackendApiService: TopicRightsBackendApiService,
    private loaderService: LoaderService,
    private undoRedoService: UndoRedoService
  ) {
    this._topicRights = new TopicRights(false, false, false);
    this._subtopicPage = new SubtopicPage(
      'id', 'topic_id', SubtopicPageContents.createDefault(), 'en');
  }

  private _getSubtopicPageId(topicId: string, subtopicId: number): string {
    if (topicId !== null && subtopicId !== null) {
      return topicId.toString() + '-' + subtopicId.toString();
    }
    return '';
  }

  private _updateGroupedSkillSummaries(
      groupedSkillSummaries: {
        [topicName: string]: SkillSummaryBackendDict[];
      }
  ): void {
    this._groupedSkillSummaries.current = [];
    this._groupedSkillSummaries.others = [];

    for (let idx in groupedSkillSummaries[this._topic.getName()]) {
      this._groupedSkillSummaries.current.push(
        groupedSkillSummaries[this._topic.getName()][idx]);
    }
    for (let name in groupedSkillSummaries) {
      if (name === this._topic.getName()) {
        continue;
      }
      let skillSummaries = groupedSkillSummaries[name];
      for (let idx in skillSummaries) {
        this._groupedSkillSummaries.others.push(skillSummaries[idx]);
      }
    }
  }

  private _getSubtopicIdFromSubtopicPageId(subtopicPageId: string): number {
    // The subtopic page id consists of the topic id of length 12, a hyphen
    // and a subtopic id (which is a number).
    return parseInt(subtopicPageId.slice(13));
  }

  private _setTopic(topic: Topic): void {
    this._topic = topic.createCopyFromTopic();
    // Reset the subtopic pages list after setting new topic.
    this._cachedSubtopicPages.length = 0;
    if (this._topicIsInitialized) {
      this._topicIsInitialized = true;
      this._topicReinitializedEventEmitter.emit();
    } else {
      this._topicIsInitialized = true;
      this._topicInitializedEventEmitter.emit();
    }
  }

  private _getSubtopicPageIndex(subtopicPageId: string): number | null {
    for (let i = 0; i < this._cachedSubtopicPages.length; i++) {
      if (this._cachedSubtopicPages[i].getId() === subtopicPageId) {
        return i;
      }
    }
    return null;
  }

  private _updateClassroomUrlFragment(classroomUrlFragment: string): void {
    this._classroomUrlFragment = classroomUrlFragment;
  }

  private _updateTopic(
      newBackendTopicDict: TopicBackendDict,
      skillIdToDescriptionDict: SkillIdToDescriptionMap): void {
    this._setTopic(
      Topic.create(
        newBackendTopicDict, skillIdToDescriptionDict));
  }

  private _updateSkillIdToRubricsObject(
      skillIdToRubricsObject: Record<string, RubricBackendDict[]>): void {
    for (let skillId in skillIdToRubricsObject) {
      // Skips deleted skills.
      if (skillIdToRubricsObject[skillId]) {
        let rubrics = skillIdToRubricsObject[skillId].map(
          (rubric: RubricBackendDict) => {
            return Rubric.createFromBackendDict(rubric);
          });
        this._skillIdToRubricsObject[skillId] = rubrics;
      }
    }
  }

  private _setSubtopicPage(subtopicPage: SubtopicPage): void {
    this._subtopicPage.copyFromSubtopicPage(subtopicPage);
    this._cachedSubtopicPages.push(cloneDeep(subtopicPage));
    this._subtopicPageLoadedEventEmitter.emit();
  }

  private _updateSubtopicPage(
      newBackendSubtopicPageObject: SubtopicPageBackendDict): void {
    this._setSubtopicPage(SubtopicPage.createFromBackendDict(
      newBackendSubtopicPageObject));
  }

  private _setTopicRights(topicRights: TopicRights): void {
    this._topicRights.copyFromTopicRights(topicRights);
  }

  private _updateTopicRights(
      newBackendTopicRightsObject: TopicRightsBackendDict): void {
    this._setTopicRights(TopicRights.createFromBackendDict(
      newBackendTopicRightsObject));
  }

  private _setCanonicalStorySummaries(
      canonicalStorySummaries: StorySummaryBackendDict[]): void {
    this._canonicalStorySummaries = canonicalStorySummaries.map(
      (storySummaryDict) => {
        return StorySummary.createFromBackendDict(
          storySummaryDict);
      });
    this._storySummariesInitializedEventEmitter.emit();
  }

  private _setTopicWithNameExists(topicWithNameExists: boolean): void {
    this._topicWithNameExists = topicWithNameExists;
  }

  private _setTopicWithUrlFragmentExists(
      topicWithUrlFragmentExists: boolean): void {
    this._topicWithUrlFragmentExists = topicWithUrlFragmentExists;
  }

  /**
   * Loads, or reloads, the topic stored by this service given a
   * specified topic ID. See setTopic() for more information on
   * additional behavior of this function.
   */
  loadTopic(topicId: string): void {
    this._topicIsLoading = true;
    this.loaderService.showLoadingScreen('Loading Topic Editor');
    let topicDataPromise = this.editableTopicBackendApiService
      .fetchTopicAsync(topicId);
    let storyDataPromise = this.editableTopicBackendApiService
      .fetchStoriesAsync(topicId);
    let topicRightsPromise = this.topicRightsBackendApiService
      .fetchTopicRightsAsync(topicId);
    Promise.all([
      topicDataPromise,
      storyDataPromise,
      topicRightsPromise
    ]).then(([
      newBackendTopicObject,
      canonicalStorySummaries,
      newBackendTopicRightsObject
    ]) => {
      this._updateTopic(
        newBackendTopicObject.topicDict,
        newBackendTopicObject.skillIdToDescriptionDict
      );
      this._skillCreationIsAllowed = (
        newBackendTopicObject.skillCreationIsAllowed);
      this._skillQuestionCountDict = (
        newBackendTopicObject.skillQuestionCountDict);
      this._updateGroupedSkillSummaries(
        newBackendTopicObject.groupedSkillSummaries);
      this._updateGroupedSkillSummaries(
        newBackendTopicObject.groupedSkillSummaries);
      this._updateSkillIdToRubricsObject(
        newBackendTopicObject.skillIdToRubricsDict);
      this._updateClassroomUrlFragment(
        newBackendTopicObject.classroomUrlFragment);
      this._updateTopicRights(newBackendTopicRightsObject);
      this._setCanonicalStorySummaries(canonicalStorySummaries);
      this._topicIsLoading = false;
      this.loaderService.hideLoadingScreen();
    }, (error) => {
      this.alertsService.addWarning(
        error || 'There was an error when loading the topic editor.');
      this._topicIsLoading = false;
    });
  }

  getGroupedSkillSummaries(): object {
    return cloneDeep(this._groupedSkillSummaries);
  }

  getSkillQuestionCountDict(): object {
    return this._skillQuestionCountDict;
  }

  /**
   * Returns whether the topic name already exists on the server.
   */
  getTopicWithNameExists(): boolean {
    return this._topicWithNameExists;
  }

  /**
   * Returns whether the topic URL fragment already exists on the server.
   */
  getTopicWithUrlFragmentExists(): boolean {
    return this._topicWithUrlFragmentExists;
  }

  /**
   * Loads, or reloads, the subtopic page stored by this service given a
   * specified topic ID and subtopic ID.
   */
  loadSubtopicPage(topicId: string, subtopicId: number): void {
    let subtopicPageId = this._getSubtopicPageId(topicId, subtopicId);
    let pageIndex = this._getSubtopicPageIndex(subtopicPageId);
    if (pageIndex !== null) {
      this._subtopicPage = cloneDeep(
        this._cachedSubtopicPages[pageIndex]);
      this._subtopicPageLoadedEventEmitter.emit();
      return;
    }
    this.loaderService.showLoadingScreen('Loading Subtopic Editor');
    this.editableTopicBackendApiService.fetchSubtopicPageAsync(
      topicId, subtopicId).then(
      (newBackendSubtopicPageObject) => {
        this._updateSubtopicPage(newBackendSubtopicPageObject);
        this.loaderService.hideLoadingScreen();
      },
      (error) => {
        this.alertsService.addWarning(
          error || 'There was an error when loading the topic.');
      });
  }

  /**
   * Returns whether this service is currently attempting to load the
   * topic maintained by this service.
   */
  isLoadingTopic(): boolean {
    return this._topicIsLoading;
  }

  /**
   * Returns whether a topic has yet been loaded using either
   * loadTopic() or setTopic().
   */
  hasLoadedTopic(): boolean {
    return this._topicIsInitialized;
  }

  getSkillIdToRubricsObject(): object {
    return this._skillIdToRubricsObject;
  }

  /**
   * Returns the current topic to be shared among the topic
   * editor. Please note any changes to this topic will be propogated
   * to all bindings to it. This topic object will be retained for the
   * lifetime of the editor. This function never returns null, though it may
   * return an empty topic object if the topic has not yet been
   * loaded for this editor instance.
   */
  getTopic(): Topic {
    return this._topic;
  }

  /**
   * Returns whether the user can create a skill via the topic editor.
   */
  isSkillCreationAllowed(): boolean {
    return this._skillCreationIsAllowed;
  }

  getCanonicalStorySummaries(): StorySummary[] {
    return this._canonicalStorySummaries;
  }

  /**
   * Returns the current subtopic page to be shared among the topic
   * editor. Please note any changes to this subtopic page will be
   * propogated to all bindings to it. This subtopic page object will be
   * retained for the lifetime of the editor. This function never returns
   * null, though it may return an empty subtopic page object if the topic
   * has not yet been loaded for this editor instance.
   */
  getSubtopicPage(): SubtopicPage {
    return this._subtopicPage;
  }

  getCachedSubtopicPages(): SubtopicPage[] {
    return this._cachedSubtopicPages;
  }

  /**
   * Returns the current topic rights to be shared among the topic
   * editor. Please note any changes to this topic rights will be
   * propogated to all bindings to it. This topic rights object will
   * be retained for the lifetime of the editor. This function never returns
   * null, though it may return an empty topic rights object if the
   * topic rights has not yet been loaded for this editor instance.
   */
  getTopicRights(): TopicRights {
    return this._topicRights;
  }

  /**
   * Sets the topic stored within this service, propogating changes to
   * all bindings to the topic returned by getTopic(). The first
   * time this is called it will fire a global event based on
   * onTopicInitialized. All subsequent
   * calls will similarly fire a onTopicReinitialized event.
   */
  setTopic(topic: Topic): void {
    this._setTopic(topic);
  }

  /**
   * Sets the updated subtopic page object in the correct position in the
   * _cachedSubtopicPages list.
   */
  setSubtopicPage(subtopicPage: SubtopicPage): void {
    let pageIndex = this._getSubtopicPageIndex(subtopicPage.getId());
    if (pageIndex !== null) {
      this._cachedSubtopicPages[pageIndex] = cloneDeep(subtopicPage);
      this._subtopicPage.copyFromSubtopicPage(subtopicPage);
    } else {
      this._setSubtopicPage(subtopicPage);
      this._newSubtopicPageIds.push(subtopicPage.getId());
    }
  }

  deleteSubtopicPage(topicId: string, subtopicId: number): void {
    let subtopicPageId = this._getSubtopicPageId(topicId, subtopicId);
    let index = this._getSubtopicPageIndex(subtopicPageId);
    let newIndex = this._newSubtopicPageIds.indexOf(subtopicPageId);
    // If index is null, that means the corresponding subtopic page was
    // never loaded from the backend and not that the subtopic page doesn't
    // exist at all. So, not required to throw an error here.
    // Also, since newSubtopicPageIds will only have the ids of a subset of
    // the pages in the _subtopicPages array, the former need not be edited
    // either, in this case.
    if (index === null) {
      if (newIndex === -1) {
        return;
      }
    } else {
      this._cachedSubtopicPages.splice(index, 1);
    }
    // If the deleted subtopic page corresponded to a newly created
    // subtopic, then the 'subtopicId' part of the id of all subsequent
    // subtopic pages should be decremented to make it in sync with the
    // their corresponding subtopic ids.
    if (newIndex !== -1) {
      this._newSubtopicPageIds.splice(newIndex, 1);
      for (let i = 0; i < this._cachedSubtopicPages.length; i++) {
        let newSubtopicId = this._getSubtopicIdFromSubtopicPageId(
          this._cachedSubtopicPages[i].getId());
        if (newSubtopicId > subtopicId) {
          newSubtopicId--;
          this._cachedSubtopicPages[i].setId(
            this._getSubtopicPageId(topicId, newSubtopicId));
        }
      }
      for (let i = 0; i < this._newSubtopicPageIds.length; i++) {
        let newSubtopicId = this._getSubtopicIdFromSubtopicPageId(
          this._newSubtopicPageIds[i]);
        if (newSubtopicId > subtopicId) {
          newSubtopicId--;
          this._newSubtopicPageIds[i] = this._getSubtopicPageId(
            topicId, newSubtopicId);
        }
      }
    }
  }

  /**
   * Sets the topic rights stored within this service, propogating
   * changes to all bindings to the topic returned by
   * getTopicRights().
   */
  setTopicRights(topicRights: TopicRights): void {
    this._setTopicRights(topicRights);
  }

  /**
   * Attempts to save the current topic given a commit message. This
   * function cannot be called until after a topic has been initialized
   * in this service. Returns false if a save is not performed due to no
   * changes pending, or true if otherwise. This function, upon success,
   * will clear the UndoRedoService of pending changes. This function also
   * shares behavior with setTopic(), when it succeeds.
   */
  saveTopic(commitMessage: string, successCallback: () => void): boolean {
    if (!this._topicIsInitialized) {
      this.alertsService.fatalWarning(
        'Cannot save a topic before one is loaded.');
    }

    // Don't attempt to save the topic if there are no changes pending.
    if (!this.undoRedoService.hasChanges()) {
      return false;
    }
    this._topicIsBeingSaved = true;
    this.editableTopicBackendApiService.updateTopicAsync(
      this._topic.getId(), this._topic.getVersion(),
      commitMessage, this.undoRedoService.getCommittableChangeList()).then(
      (topicBackendObject) => {
        this._updateTopic(
          topicBackendObject.topicDict,
          topicBackendObject.skillIdToDescriptionDict
        );
        this._updateSkillIdToRubricsObject(
          topicBackendObject.skillIdToRubricsDict);
        let changeList = this.undoRedoService.getCommittableChangeList();
        for (let i = 0; i < changeList.length; i++) {
          if (changeList[i].cmd === 'delete_canonical_story' ||
              changeList[i].cmd === 'delete_additional_story') {
            this.editableStoryBackendApiService.deleteStoryAsync((
              changeList[i] as TopicDeleteAdditionalStoryChange |
              TopicDeleteCanonicalStoryChange).story_id);
          }
        }
        this.undoRedoService.clearChanges();
        this._topicIsBeingSaved = false;
        if (successCallback) {
          successCallback();
        }
      }, (error) => {
        this.alertsService.addWarning(
          error || 'There was an error when saving the topic.');
        this._topicIsBeingSaved = false;
      });
    return true;
  }

  /**
   * Returns whether this service is currently attempting to save the
   * topic maintained by this service.
   */
  isSavingTopic(): boolean {
    return this._topicIsBeingSaved;
  }

  get onTopicInitialized(): EventEmitter<void> {
    return this._topicInitializedEventEmitter;
  }

  get onTopicReinitialized(): EventEmitter<void> {
    return this._topicReinitializedEventEmitter;
  }

  /**
   * Returns the classroom name for the topic.
   */
  getClassroomUrlFragment(): string {
    return this._classroomUrlFragment;
  }

  /**
   * Attempts to set the boolean variable _topicWithNameExists based
   * on the value returned by doesTopicWithNameExistAsync and
   * executes the success callback provided. No arguments are passed to the
   * success callback. Execution of the success callback indicates that the
   * async backend call was successful and that _topicWithNameExists
   * has been successfully updated.
   */
  updateExistenceOfTopicName(
      topicName: string, successCallback: () => void): void {
    this.editableTopicBackendApiService.doesTopicWithNameExistAsync(
      topicName).then((topicNameExists) => {
      this._setTopicWithNameExists(topicNameExists);
      if (successCallback) {
        successCallback();
      }
    }, (error) => {
      this.alertsService.addWarning(
        error ||
        'There was an error when checking if the topic name ' +
        'exists for another topic.');
    });
  }

  /**
   * Attempts to set the boolean variable _topicWithUrlFragmentExists based
   * on the value returned by doesTopicWithUrlFragmentExistAsync and
   * executes the success callback provided. No arguments are passed to the
   * success callback. Execution of the success callback indicates that the
   * async backend call was successful and that _topicWithUrlFragmentExists
   * has been successfully updated.
   */
  updateExistenceOfTopicUrlFragment(
      topicUrlFragment: string,
      successCallback: () => void,
      errorCallback: () => void
  ): void {
    this.editableTopicBackendApiService.doesTopicWithUrlFragmentExistAsync(
      topicUrlFragment).then((topicUrlFragmentExists) => {
      this._setTopicWithUrlFragmentExists(topicUrlFragmentExists);
      if (successCallback) {
        successCallback();
      }
    }, (errorResponse) => {
      if (errorCallback) {
        errorCallback();
      }
      /**
       * This backend api service uses a HTTP link which is generated with
       * the help of inputted url fragment. So, whenever a url fragment is
       * entered against the specified reg-ex(or rules) wrong HTTP link is
       * generated and causes server to respond with 400 error. Because
       * server also checks for reg-ex match.
       */
      if (errorResponse.status !== 400) {
        this.alertsService.addWarning(
          errorResponse.message ||
          'There was an error when checking if the topic url fragment ' +
          'exists for another topic.');
      }
    });
  }

  get onStorySummariesInitialized(): EventEmitter<void> {
    return this._storySummariesInitializedEventEmitter;
  }

  get onSubtopicPageLoaded(): EventEmitter<void> {
    return this._subtopicPageLoadedEventEmitter;
  }
}

angular.module('oppia').factory('TopicEditorStateService',
  downgradeInjectable(TopicEditorStateService));
