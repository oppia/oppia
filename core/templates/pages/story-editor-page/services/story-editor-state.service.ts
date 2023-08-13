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
 * @fileoverview Service to maintain the state of a single story shared
 * throughout the story editor. This service provides functionality for
 * retrieving the story, saving it, and listening for changes.
 */

import { EventEmitter, Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';

import { StoryChange } from 'domain/editor/undo_redo/change.model';
import { UndoRedoService } from 'domain/editor/undo_redo/undo-redo.service';
import { SkillSummaryBackendDict } from 'domain/skill/skill-summary.model';
import { Story, StoryBackendDict } from 'domain/story/story.model';
import { EditableStoryBackendApiService } from 'domain/story/editable-story-backend-api.service';
import { AlertsService } from 'services/alerts.service';
import { LoaderService } from 'services/loader.service';

@Injectable({
  providedIn: 'root'
})
export class StoryEditorStateService {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion, for more information see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  _story!: Story;
  _topicName!: string;
  _classroomUrlFragment!: string;
  _topicUrlFragment!: string;
  _storyIsInitialized: boolean = false;
  _storyIsLoading: boolean = false;
  _storyIsBeingSaved: boolean = false;
  _storyIsPublished: boolean = false;
  _skillSummaries: SkillSummaryBackendDict[] = [];
  _expIdsChanged: boolean = false;
  _storyWithUrlFragmentExists: boolean = false;
  _currentNodeIsPublishable: boolean = false;
  _selectedChapterIndexInPublishUptoDropdown: number = 0;
  _chaptersAreBeingPublished: boolean = true;
  _newChapterPublicationIsDisabled: boolean = true;
  _chapterStatusIsBeingChanged: boolean = false;

  _storyInitializedEventEmitter = new EventEmitter();
  _storyReinitializedEventEmitter = new EventEmitter();
  _viewStoryNodeEditorEventEmitter = new EventEmitter();
  _recalculateAvailableNodesEventEmitter = new EventEmitter();

  constructor(
    private alertsService: AlertsService,
    private editableStoryBackendApiService: EditableStoryBackendApiService,
    private loaderService: LoaderService,
    private undoRedoService: UndoRedoService) {}

  private _setStory(story: Story): void {
    if (!this._story) {
      // The Story is set directly for the first load.
      this._story = story;
    } else {
      // After first initialization, the story object will be retained for
      // the lifetime of the editor and on every data reload or update, the new
      // contents will be copied into the same retained object.
      this._story.copyFromStory(story);
    }
    if (this._storyIsInitialized) {
      this._storyReinitializedEventEmitter.emit();
    } else {
      this._storyInitializedEventEmitter.emit();
      this._storyIsInitialized = true;
    }
  }

  private _setSkillSummaries(skillSummaries: SkillSummaryBackendDict[]): void {
    this._skillSummaries = angular.copy(skillSummaries);
  }

  private _setTopicName(topicName: string): void {
    this._topicName = topicName;
  }

  private _setStoryPublicationStatus(storyIsPublished: boolean): void {
    this._storyIsPublished = storyIsPublished;
  }

  private _updateStory(newBackendStoryObject: StoryBackendDict): void {
    this._setStory(
      Story.createFromBackendDict(newBackendStoryObject));
  }

  private _setStoryWithUrlFragmentExists(
      storyWithUrlFragmentExists: boolean): void {
    this._storyWithUrlFragmentExists = storyWithUrlFragmentExists;
  }

  private _setClassroomUrlFragment(classroomUrlFragment: string): void {
    this._classroomUrlFragment = classroomUrlFragment;
  }

  private _setTopicUrlFragment(topicUrlFragment: string): void {
    this._topicUrlFragment = topicUrlFragment;
  }

  /**
   * Loads, or reloads, the story stored by this service given a
   * specified story ID. See setStory() for more information on
   * additional behavior of this function.
   */
  loadStory(storyId: string): void {
    this._storyIsLoading = true;
    this.loaderService.showLoadingScreen('Loading Story Editor');
    this.editableStoryBackendApiService.fetchStoryAsync(storyId).then(
      (newBackendStoryObject) => {
        this._setTopicName(newBackendStoryObject.topicName);
        this._setStoryPublicationStatus(
          newBackendStoryObject.storyIsPublished);
        this._setSkillSummaries(newBackendStoryObject.skillSummaries);
        this._updateStory(newBackendStoryObject.story);
        this._storyIsLoading = false;
        this._setClassroomUrlFragment(
          newBackendStoryObject.classroomUrlFragment);
        this._setTopicUrlFragment(newBackendStoryObject.topicUrlFragment);
        this.loaderService.hideLoadingScreen();
      }, error => {
        this.alertsService.addWarning(
          error || 'There was an error when loading the story.');
        this._storyIsLoading = false;
      });
  }

  /**
   * Returns whether this service is currently attempting to load the
   * story maintained by this service.
   */
  isLoadingStory(): boolean {
    return this._storyIsLoading;
  }

  /**
   * Returns whether a story has yet been loaded using either
   * loadStory() or setStory().
   */
  hasLoadedStory(): boolean {
    return this._storyIsInitialized;
  }

  setExpIdsChanged(): void {
    this._expIdsChanged = true;
  }

  resetExpIdsChanged(): void {
    this._expIdsChanged = false;
  }

  areAnyExpIdsChanged(): boolean {
    return this._expIdsChanged;
  }

  /**
   * Returns the current story to be shared among the story
   * editor. Please note any changes to this story will be propogated
   * to all bindings to it. This story object will be retained for the
   * lifetime of the editor. This function never returns null, though it may
   * return an empty story object if the story has not yet been
   * loaded for this editor instance.
   */
  getStory(): Story {
    return this._story;
  }

  getSkillSummaries(): SkillSummaryBackendDict[] {
    return this._skillSummaries;
  }

  /**
   * Sets the story stored within this service, propogating changes to
   * all bindings to the story returned by getStory(). The first
   * time this is called it will fire a global event based on the
   * next() function of the _storyInitializedEventEmitter. All subsequent
   * calls will similarly fire a next() function of the
   * _storyReinitializedEventEmitter.
   */
  setStory(story: Story): void {
    this._setStory(story);
  }

  getTopicName(): string {
    return this._topicName;
  }

  isStoryPublished(): boolean {
    return this._storyIsPublished;
  }

  /**
   * Attempts to save the current story given a commit message. This
   * function cannot be called until after a story has been initialized
   * in this service. Returns false if a save is not performed due to no
   * changes pending, or true if otherwise. This function, upon success,
   * will clear the UndoRedoService of pending changes. This function also
   * shares behavior with setStory(), when it succeeds.
   */
  saveStory(
      commitMessage: string,
      successCallback: (value?: Object) => void,
      errorCallback: (value: string) => void): boolean {
    if (!this._storyIsInitialized) {
      this.alertsService.fatalWarning(
        'Cannot save a story before one is loaded.');
    }

    // Don't attempt to save the story if there are no changes pending.
    if (!this.undoRedoService.hasChanges()) {
      return false;
    }
    this._storyIsBeingSaved = true;
    this.editableStoryBackendApiService.updateStoryAsync(
      this._story.getId(), this._story.getVersion(), commitMessage,
      this.undoRedoService.getCommittableChangeList() as StoryChange[]
    ).then(
      (storyBackendObject) => {
        this._updateStory(storyBackendObject);
        this.undoRedoService.clearChanges();
        this._storyIsBeingSaved = false;
        this.setChapterStatusIsChanging(false);
        if (successCallback) {
          successCallback();
        }
      }, error => {
        let errorMessage = error || 'There was an error when saving the story.';
        this.alertsService.addWarning(errorMessage);
        this._storyIsBeingSaved = false;
        this.setChapterStatusIsChanging(false);
        if (errorCallback) {
          errorCallback(errorMessage);
        }
      });
    return true;
  }

  saveChapter(
      successCallback: () => void, errorCallback: () => void): void {
    this.saveStory(
      'Changed Chapter Status', successCallback, errorCallback);
  }

  getTopicUrlFragment(): string {
    return this._topicUrlFragment;
  }

  getClassroomUrlFragment(): string {
    return this._classroomUrlFragment;
  }

  changeStoryPublicationStatus(
      newStoryStatusIsPublic: boolean,
      successCallback: (value?: Object) => void): boolean {
    const storyId = this._story.getId();
    if (!storyId || !this._storyIsInitialized) {
      this.alertsService.fatalWarning(
        'Cannot publish a story before one is loaded.');
      return false;
    }
    this.editableStoryBackendApiService.changeStoryPublicationStatusAsync(
      storyId, newStoryStatusIsPublic).then(
      (storyBackendObject) => {
        this._setStoryPublicationStatus(newStoryStatusIsPublic);
        if (successCallback) {
          successCallback();
        }
      }, error => {
        this.alertsService.addWarning(
          error ||
          'There was an error when publishing/unpublishing the story.');
      });
    return true;
  }

  /**
   * Returns whether this service is currently attempting to save the
   * story maintained by this service.
   */
  isSavingStory(): boolean {
    return this._storyIsBeingSaved;
  }

  isChangingChapterStatus(): boolean {
    return this._chapterStatusIsBeingChanged;
  }

  setChapterStatusIsChanging(chapterStatusIsChanging: boolean): void {
    this._chapterStatusIsBeingChanged = chapterStatusIsChanging;
  }

  setCurrentNodeAsPublishable(currentNodeIsPublishable: boolean): void {
    this._currentNodeIsPublishable = currentNodeIsPublishable;
  }

  isCurrentNodePublishable(): boolean {
    return this._currentNodeIsPublishable;
  }

  setSelectedChapterIndexInPublishUptoDropdown(chapterIndex: number): void {
    this._selectedChapterIndexInPublishUptoDropdown = chapterIndex;
  }

  getSelectedChapterIndexInPublishUptoDropdown(): number {
    return this._selectedChapterIndexInPublishUptoDropdown;
  }

  setChaptersAreBeingPublished(chaptersAreBeingPublished: boolean): void {
    this._chaptersAreBeingPublished = chaptersAreBeingPublished;
  }

  areChaptersBeingPublished(): boolean {
    return this._chaptersAreBeingPublished;
  }

  setNewChapterPublicationIsDisabled(
      chapterPublicationIsDisabled: boolean): void {
    this._newChapterPublicationIsDisabled = chapterPublicationIsDisabled;
  }

  getNewChapterPublicationIsDisabled(): boolean {
    return this._newChapterPublicationIsDisabled;
  }

  get onStoryInitialized(): EventEmitter<string> {
    return this._storyInitializedEventEmitter;
  }

  get onStoryReinitialized(): EventEmitter<string> {
    return this._storyReinitializedEventEmitter;
  }

  get onViewStoryNodeEditor(): EventEmitter<string> {
    return this._viewStoryNodeEditorEventEmitter;
  }

  get onRecalculateAvailableNodes(): EventEmitter<string> {
    return this._recalculateAvailableNodesEventEmitter;
  }

  /**
   * Returns whether the story URL fragment already exists on the server.
   */
  getStoryWithUrlFragmentExists(): boolean {
    return this._storyWithUrlFragmentExists;
  }

  /**
   * Attempts to set the boolean variable _storyWithUrlFragmentExists based
   * on the value returned by doesStoryWithUrlFragmentExistAsync and
   * executes the success callback provided. No arguments are passed to the
   * success callback. Execution of the success callback indicates that the
   * async backend call was successful and that _storyWithUrlFragmentExists
   * has been successfully updated.
   */
  updateExistenceOfStoryUrlFragment(
      storyUrlFragment: string,
      successCallback: (value?: Object) => void): void {
    this.editableStoryBackendApiService.doesStoryWithUrlFragmentExistAsync(
      storyUrlFragment).then(
      (storyUrlFragmentExists) => {
        this._setStoryWithUrlFragmentExists(storyUrlFragmentExists);
        if (successCallback) {
          successCallback();
        }
      }, error => {
        this.alertsService.addWarning(
          error ||
          'There was an error when checking if the story url fragment ' +
          'exists for another story.');
      });
  }
}

angular.module('oppia').factory(
  'StoryEditorStateService', downgradeInjectable(StoryEditorStateService));
