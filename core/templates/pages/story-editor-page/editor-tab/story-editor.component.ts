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
 * @fileoverview Controller for the main story editor.
 */

import {Subscription} from 'rxjs';
import {SavePendingChangesModalComponent} from 'components/save-pending-changes/save-pending-changes-modal.component';
import {Component, OnDestroy, OnInit} from '@angular/core';
import {AppConstants} from 'app.constants';
import {WindowRef} from 'services/contextual/window-ref.service';
import {StoryEditorStateService} from '../services/story-editor-state.service';
import {StoryUpdateService} from 'domain/story/story-update.service';
import {WindowDimensionsService} from 'services/contextual/window-dimensions.service';
import {AlertsService} from 'services/alerts.service';
import {FocusManagerService} from 'services/stateful/focus-manager.service';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {StoryNode} from 'domain/story/story-node.model';
import {StoryEditorNavigationService} from '../services/story-editor-navigation.service';
import {UndoRedoService} from 'domain/editor/undo_redo/undo-redo.service';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {NewChapterTitleModalComponent} from '../modal-templates/new-chapter-title-modal.component';
import {DeleteChapterModalComponent} from '../modal-templates/delete-chapter-modal.component';
import {Story} from 'domain/story/story.model';
import {StoryContents} from 'domain/story/story-contents-object.model';
import {CdkDragDrop, moveItemInArray} from '@angular/cdk/drag-drop';
import {PlatformFeatureService} from 'services/platform-feature.service';
import {DateTimeFormatService} from 'services/date-time-format.service';
import constants from 'assets/constants';

@Component({
  selector: 'oppia-story-editor',
  templateUrl: './story-editor.component.html',
})
export class StoryEditorComponent implements OnInit, OnDestroy {
  story: Story;
  storyContents: StoryContents;
  disconnectedNodes: string[];
  linearNodesList: StoryNode[];
  nodes: StoryNode[];
  allowedBgColors = AppConstants.ALLOWED_THUMBNAIL_BG_COLORS.story;

  initialNodeId: string;
  notesEditorIsShown: boolean;
  storyTitleEditorIsShown: boolean;
  editableTitle: string;
  editableUrlFragment: string;
  editableMetaTagContent: string;
  initialStoryUrlFragment: string;
  editableNotes: string;
  editableDescription: string;
  editableDescriptionIsEmpty: boolean;
  storyDescriptionChanged: boolean;
  storyUrlFragmentExists: boolean;
  idOfNodeToEdit: string;
  dragStartIndex: number;
  nodeBeingDragged: StoryNode;
  mainStoryCardIsShown: boolean;
  storyPreviewCardIsShown: boolean;
  chaptersListIsShown: boolean;
  selectedChapterIndex: number;
  chapterIsPublishable: boolean[];
  selectedChapterIndexInPublishUptoDropdown: number;
  publishedChaptersDropErrorIsShown: boolean = false;
  NOTES_SCHEMA = {
    type: 'html',
    ui_config: {
      startupFocusEnabled: false,
    },
  };
  generatedUrlPrefix: string;

  constructor(
    private alertsService: AlertsService,
    private windowRef: WindowRef,
    private focusManagerService: FocusManagerService,
    private storyEditorStateService: StoryEditorStateService,
    private ngbModal: NgbModal,
    private storyUpdateService: StoryUpdateService,
    private windowDimensionsService: WindowDimensionsService,
    private storyEditorNavigationService: StoryEditorNavigationService,
    private undoRedoService: UndoRedoService,
    private urlInterpolationService: UrlInterpolationService,
    private platformFeatureService: PlatformFeatureService,
    private dateTimeFormatService: DateTimeFormatService
  ) {}

  directiveSubscriptions = new Subscription();
  MAX_CHARS_IN_STORY_DESCRIPTION = AppConstants.MAX_CHARS_IN_STORY_DESCRIPTION;

  MAX_CHARS_IN_STORY_TITLE = AppConstants.MAX_CHARS_IN_STORY_TITLE;

  MAX_CHARS_IN_STORY_URL_FRAGMENT =
    AppConstants.MAX_CHARS_IN_STORY_URL_FRAGMENT;

  MAX_CHARS_IN_META_TAG_CONTENT = AppConstants.MAX_CHARS_IN_META_TAG_CONTENT;

  hostname = this.windowRef.nativeWindow.location.hostname;
  TOPIC_EDITOR_URL_TEMPLATE = '/topic_editor/<topic_id>';
  validUrlFragmentRegex = new RegExp(AppConstants.VALID_URL_FRAGMENT_REGEX);

  _init(): void {
    this.story = this.storyEditorStateService.getStory();
    if (this.story) {
      this.storyContents = this.story.getStoryContents();
    }
    if (this.storyContents) {
      this.setNodeToEdit(this.storyContents.getInitialNodeId());
    }
    this._initEditor();
  }

  rearrangeNodeInList(fromIndex: number, toIndex: number): void {
    moveItemInArray(this.linearNodesList, fromIndex, toIndex);
    if (fromIndex === 0) {
      this.storyUpdateService.setInitialNodeId(
        this.story,
        this.story.getStoryContents().getNodes()[toIndex].getId()
      );
    }
    if (fromIndex === 0) {
      this.storyUpdateService.setInitialNodeId(
        this.story,
        this.story.getStoryContents().getNodes()[toIndex].getId()
      );
    }
    this.storyUpdateService.rearrangeNodeInStory(
      this.story,
      fromIndex,
      toIndex
    );
    this._initEditor();
  }

  getMediumStyleLocaleDateString(millisSinceEpoch: number): string {
    const options = {
      dateStyle: 'medium',
    } as Intl.DateTimeFormatOptions;
    let date = new Date(millisSinceEpoch);
    return date.toLocaleDateString(undefined, options);
  }

  isDragAndDropDisabled(node: StoryNode): boolean {
    return (
      node.getStatus() === constants.STORY_NODE_STATUS_PUBLISHED ||
      window.innerWidth <= 425
    );
  }

  drop(event: CdkDragDrop<string[]>): void {
    if (this.linearNodesList[event.currentIndex].getStatus() === 'Published') {
      this.publishedChaptersDropErrorIsShown = true;
      setTimeout(() => {
        this.publishedChaptersDropErrorIsShown = false;
      }, 5000);
      return;
    }
    this.rearrangeNodeInList(event.previousIndex, event.currentIndex);
  }

  moveNodeUpInStory(index: number): void {
    this.toggleChapterEditOptions(-1);
    this.rearrangeNodeInList(index, index - 1);
  }

  moveNodeDownInStory(index: number): void {
    this.toggleChapterEditOptions(-1);
    this.rearrangeNodeInList(index, index + 1);
  }

  isSerialChapterFeatureFlagEnabled(): boolean {
    return this.platformFeatureService.status
      .SerialChapterLaunchCurriculumAdminView.isEnabled;
  }

  _initEditor(): void {
    this.generatedUrlPrefix = `${this.hostname}/learn/${this.getClassroomUrlFragment()}/${this.getTopicUrlFragment()}/story`;
    this.story = this.storyEditorStateService.getStory();
    if (this.story) {
      this.storyContents = this.story.getStoryContents();
      this.disconnectedNodes = [];
      this.linearNodesList = [];
      this.nodes = [];
      if (this.storyContents && this.storyContents.getNodes().length > 0) {
        this.nodes = this.storyContents.getNodes();
        this.initialNodeId = this.storyContents.getInitialNodeId();
        this.linearNodesList = this.storyContents.getLinearNodesList();
        this.chapterIsPublishable = [];
        this.linearNodesList.forEach((node, index) => {
          if (node.getStatus() === 'Published') {
            this.chapterIsPublishable.push(true);
            this.selectedChapterIndexInPublishUptoDropdown = index;
          } else if (
            node.getStatus() === 'Ready To Publish' &&
            ((index !== 0 && this.chapterIsPublishable[index - 1]) ||
              index === 0)
          ) {
            this.chapterIsPublishable.push(true);
          } else {
            this.chapterIsPublishable.push(false);
          }
        });
        this.updatePublishUptoChapterSelection(
          this.selectedChapterIndexInPublishUptoDropdown
        );
      }
      this.notesEditorIsShown = false;
      this.storyTitleEditorIsShown = false;
      this.editableTitle = this.story.getTitle();
      this.editableUrlFragment = this.story.getUrlFragment();
      this.editableMetaTagContent = this.story.getMetaTagContent();
      this.initialStoryUrlFragment = this.story.getUrlFragment();
      this.editableNotes = this.story.getNotes();
      this.editableDescription = this.story.getDescription();
      this.editableDescriptionIsEmpty = this.editableDescription === '';
      this.storyDescriptionChanged = false;
      this.storyUrlFragmentExists = false;
    }
  }

  setNodeToEdit(nodeId: string): void {
    this.idOfNodeToEdit = nodeId;
  }

  openNotesEditor(): void {
    this.notesEditorIsShown = true;
  }

  closeNotesEditor(): void {
    this.notesEditorIsShown = false;
  }

  isInitialNode(nodeId: string): boolean {
    return this.story.getStoryContents().getInitialNodeId() === nodeId;
  }

  deleteNode(nodeId: string): void {
    if (this.isInitialNode(nodeId)) {
      this.alertsService.addInfoMessage(
        'Cannot delete the first chapter of a story.',
        3000
      );
      return;
    }
    this.ngbModal
      .open(DeleteChapterModalComponent, {
        backdrop: true,
      })
      .result.then(
        () => {
          this.storyUpdateService.deleteStoryNode(this.story, nodeId);
          this._initEditor();
          this.storyEditorStateService.onRecalculateAvailableNodes.emit();
        },
        () => {
          // Note to developers:
          // This callback is triggered when the Cancel button is clicked.
          // No further action is needed.
        }
      );
  }

  onStoryEditorUrlFragmentChange(urlFragment: string): void {
    this.editableUrlFragment = urlFragment;
    this.updateStoryUrlFragment(urlFragment);
  }

  createNode(): void {
    let nodeTitles = this.linearNodesList.map(node => {
      return node.getTitle();
    });
    const modalRef = this.ngbModal.open(NewChapterTitleModalComponent, {
      backdrop: 'static',
      windowClass: 'create-new-chapter',
    });
    modalRef.componentInstance.nodeTitles = nodeTitles;
    modalRef.result.then(
      () => {
        this._initEditor();
        // If the first node is added, open it just after creation.
        if (this.story.getStoryContents().getNodes().length === 1) {
          this.setNodeToEdit(this.story.getStoryContents().getInitialNodeId());
        } else {
          let nodesArray = this.story.getStoryContents().getNodes();
          let nodesLength = nodesArray.length;
          let secondLastNodeId = nodesArray[nodesLength - 2].getId();
          let lastNodeId = nodesArray[nodesLength - 1].getId();
          this.storyUpdateService.addDestinationNodeIdToNode(
            this.story,
            secondLastNodeId,
            lastNodeId
          );
        }
        this.storyEditorStateService.onRecalculateAvailableNodes.emit();
      },
      () => {
        // Note to developers:
        // This callback is triggered when the Cancel button is clicked.
        // No further action is needed.
      }
    );
  }

  updateNotes(newNotes: string): void {
    if (newNotes !== this.story.getNotes()) {
      this.storyUpdateService.setStoryNotes(this.story, newNotes);
      this._initEditor();
    }
  }

  navigateToChapterWithId(id: string, index: number): void {
    this.storyEditorNavigationService.navigateToChapterEditorWithId(id, index);
  }

  updateStoryDescriptionStatus(description: string): void {
    this.editableDescriptionIsEmpty = description === '';
    this.storyDescriptionChanged = true;
  }

  updateStoryMetaTagContent(newMetaTagContent: string): void {
    if (newMetaTagContent !== this.story.getMetaTagContent()) {
      this.storyUpdateService.setStoryMetaTagContent(
        this.story,
        newMetaTagContent
      );
    }
  }

  returnToTopicEditorPage(): void {
    if (this.undoRedoService.getChangeCount() > 0) {
      const modalRef = this.ngbModal.open(SavePendingChangesModalComponent, {
        backdrop: true,
      });

      modalRef.componentInstance.body =
        'Please save all pending changes ' + 'before returning to the topic.';

      modalRef.result.then(
        () => {},
        () => {
          // Note to developers:
          // This callback is triggered when the Cancel button is clicked.
          // No further action is needed.
        }
      );
    } else {
      const topicId = this.storyEditorStateService
        .getStory()
        .getCorrespondingTopicId();
      this.windowRef.nativeWindow.open(
        this.urlInterpolationService.interpolateUrl(
          this.TOPIC_EDITOR_URL_TEMPLATE,
          {
            topic_id: topicId,
          }
        ),
        '_self'
      );
    }
  }

  getClassroomUrlFragment(): string {
    return this.storyEditorStateService.getClassroomUrlFragment();
  }

  getTopicUrlFragment(): string {
    return this.storyEditorStateService.getTopicUrlFragment();
  }

  getTopicName(): string {
    return this.storyEditorStateService.getTopicName();
  }

  updateStoryTitle(newTitle: string): void {
    if (newTitle !== this.story.getTitle()) {
      this.storyUpdateService.setStoryTitle(this.story, newTitle);
    }
  }

  updateStoryUrlFragment(newUrlFragment: string): void {
    if (newUrlFragment === this.initialStoryUrlFragment) {
      this.storyUrlFragmentExists = false;
      return;
    }
    if (newUrlFragment) {
      this.storyEditorStateService.updateExistenceOfStoryUrlFragment(
        newUrlFragment,
        () => {
          this.storyUrlFragmentExists =
            this.storyEditorStateService.getStoryWithUrlFragmentExists();
          this.storyUpdateService.setStoryUrlFragment(
            this.story,
            newUrlFragment
          );
        },
        () => {
          return;
        }
      );
    } else {
      this.storyUpdateService.setStoryUrlFragment(this.story, newUrlFragment);
    }
  }

  updateStoryThumbnailFilename(newThumbnailFilename: string): void {
    if (newThumbnailFilename !== this.story.getThumbnailFilename()) {
      this.storyUpdateService.setThumbnailFilename(
        this.story,
        newThumbnailFilename
      );
    }
  }

  updateStoryThumbnailBgColor(newThumbnailBgColor: string): void {
    if (newThumbnailBgColor !== this.story.getThumbnailBgColor()) {
      this.storyUpdateService.setThumbnailBgColor(
        this.story,
        newThumbnailBgColor
      );
    }
  }

  updateStoryDescription(newDescription: string): void {
    if (newDescription !== this.story.getDescription()) {
      this.storyUpdateService.setStoryDescription(this.story, newDescription);
    }
  }

  updatePublishUptoChapterSelection(chapterIndex: number): void {
    this.storyEditorStateService.setSelectedChapterIndexInPublishUptoDropdown(
      chapterIndex
    );
    if (Number(chapterIndex) === -1) {
      if (
        this.linearNodesList.length &&
        this.linearNodesList[0].getStatus() === 'Published'
      ) {
        this.storyEditorStateService.setChaptersAreBeingPublished(false);
        this.storyEditorStateService.setNewChapterPublicationIsDisabled(false);
      } else {
        this.storyEditorStateService.setChaptersAreBeingPublished(true);
        this.storyEditorStateService.setNewChapterPublicationIsDisabled(true);
      }
      return;
    }

    let nextChapterIndex = Number(chapterIndex) + 1;

    if (
      this.linearNodesList[chapterIndex].getStatus() === 'Published' &&
      nextChapterIndex < this.linearNodesList.length &&
      this.linearNodesList[nextChapterIndex].getStatus() === 'Published'
    ) {
      this.storyEditorStateService.setChaptersAreBeingPublished(false);
    } else {
      this.storyEditorStateService.setChaptersAreBeingPublished(true);
    }

    if (
      this.linearNodesList.length === 0 ||
      (chapterIndex === 0 && !this.chapterIsPublishable[0]) ||
      (this.linearNodesList[chapterIndex].getStatus() === 'Published' &&
        (nextChapterIndex === this.linearNodesList.length ||
          this.linearNodesList[nextChapterIndex].getStatus() !== 'Published'))
    ) {
      this.storyEditorStateService.setNewChapterPublicationIsDisabled(true);
    } else {
      this.storyEditorStateService.setNewChapterPublicationIsDisabled(false);
    }
  }

  togglePreview(): void {
    this.storyPreviewCardIsShown = !this.storyPreviewCardIsShown;
  }

  toggleChapterEditOptions(chapterIndex: number): void {
    this.selectedChapterIndex =
      this.selectedChapterIndex === chapterIndex ? -1 : chapterIndex;
  }

  toggleChapterLists(): void {
    if (this.windowDimensionsService.isWindowNarrow()) {
      this.chaptersListIsShown = !this.chaptersListIsShown;
    }
  }

  toggleStoryEditorCard(): void {
    if (this.windowDimensionsService.isWindowNarrow()) {
      this.mainStoryCardIsShown = !this.mainStoryCardIsShown;
    }
  }

  ngOnInit(): void {
    this.storyPreviewCardIsShown = false;
    this.mainStoryCardIsShown = true;
    this.selectedChapterIndexInPublishUptoDropdown = -1;
    this.chaptersListIsShown = !this.windowDimensionsService.isWindowNarrow();
    this.directiveSubscriptions.add(
      this.storyEditorStateService.onViewStoryNodeEditor.subscribe(
        (nodeId: string) => this.setNodeToEdit(nodeId)
      )
    );

    this.directiveSubscriptions.add(
      this.storyEditorStateService.onStoryInitialized.subscribe(() => {
        this._init();
        this.focusManagerService.setFocus('metaTagInputField');
      })
    );
    this.directiveSubscriptions.add(
      this.storyEditorStateService.onStoryReinitialized.subscribe(() =>
        this._initEditor()
      )
    );

    this._init();
    this._initEditor();
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }
}
