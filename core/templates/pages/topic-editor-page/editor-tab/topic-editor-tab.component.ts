// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for the main topic editor.
 */

import {ChangeSubtopicAssignmentModalComponent} from '../modal-templates/change-subtopic-assignment-modal.component';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {SavePendingChangesModalComponent} from 'components/save-pending-changes/save-pending-changes-modal.component';
import {Subscription} from 'rxjs';
import {AppConstants} from 'app.constants';
import cloneDeep from 'lodash/cloneDeep';
import {Component, OnDestroy, OnInit} from '@angular/core';
import {FormControl} from '@angular/forms';
import {WindowRef} from 'services/contextual/window-ref.service';
import {TopicEditorStateService} from '../services/topic-editor-state.service';
import {FocusManagerService} from 'services/stateful/focus-manager.service';
import {TopicsAndSkillsDashboardBackendApiService} from 'domain/topics_and_skills_dashboard/topics-and-skills-dashboard-backend-api.service';
import {WindowDimensionsService} from 'services/contextual/window-dimensions.service';
import {ImageUploadHelperService} from 'services/image-upload-helper.service';
import {ContextService} from 'services/context.service';
import {TopicUpdateService} from 'domain/topic/topic-update.service';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {StorySummary} from 'domain/story/story-summary.model';
import {EntityCreationService} from '../services/entity-creation.service';
import {UndoRedoService} from 'domain/editor/undo_redo/undo-redo.service';
import {ShortSkillSummary} from 'domain/skill/short-skill-summary.model';
import {StoryCreationBackendApiService} from 'components/entity-creation-services/story-creation-backend-api.service';
import {TopicEditorRoutingService} from '../services/topic-editor-routing.service';
import {PageTitleService} from 'services/page-title.service';
import {Subtopic} from 'domain/topic/subtopic.model';
import {CdkDragDrop, moveItemInArray} from '@angular/cdk/drag-drop';
import {Topic} from 'domain/topic/topic-object.model';
import {TopicRights} from 'domain/topic/topic-rights.model';
import {RearrangeSkillsInSubtopicsModalComponent} from '../modal-templates/rearrange-skills-in-subtopics-modal.component';

@Component({
  selector: 'oppia-topic-editor-tab',
  templateUrl: './topic-editor-tab.component.html',
})
export class TopicEditorTabComponent implements OnInit, OnDestroy {
  skillCreationIsAllowed: boolean;
  topic: Topic;
  skillQuestionCountDict: object;
  topicRights: TopicRights;
  topicNameEditorIsShown: boolean;
  topicDataHasLoaded: boolean;
  editableName: string;
  editableMetaTagContent: string;
  editablePageTitleFragmentForWeb: string;
  editablePracticeIsDisplayed: boolean;
  initialTopicName: string;
  initialTopicUrlFragment: string;
  editableTopicUrlFragment: string;
  editableDescription: string;
  allowedBgColors;
  topicNameExists: boolean;
  topicUrlFragmentExists: boolean;
  hostname: string;
  availableSkillSummariesForDiagnosticTest: ShortSkillSummary[];
  selectedSkillSummariesForDiagnosticTest: ShortSkillSummary[];
  diagnosticTestSkillsDropdownIsShown: boolean;
  topicPreviewCardIsShown: boolean;
  SUBTOPIC_LIST: string;
  SKILL_LIST: string;
  STORY_LIST: string;
  subtopicCardSelectedIndexes: {};
  subtopicsListIsShown: boolean;
  selectedSkillEditOptionsIndex: {};
  editableDescriptionIsEmpty: boolean;
  topicDescriptionChanged: boolean;
  subtopics: Subtopic[];
  subtopicQuestionCountDict: {};
  uncategorizedSkillSummaries: ShortSkillSummary[];
  editableThumbnailDataUrl: string;
  canonicalStorySummaries: StorySummary[];
  mainTopicCardIsShown: boolean;
  storiesListIsShown: boolean;
  uncategorizedEditOptionsIndex: number;
  subtopicEditOptionsAreShown: number;
  skillOptionDialogueBox: boolean = true;
  maxCharsInTopicName!: number;
  MAX_CHARS_IN_TOPIC_URL_FRAGMENT!: number;
  maxCharsInTopicDescription!: number;
  maxCharsInPageTitleFragmentForWeb!: number;
  maxCharsInMetaTagContent!: number;
  minCharsInPageTitleFragmentForWeb!: number;
  skillForDiagnosticTestFormControl = new FormControl(null);
  classroomUrlFragment: string | null = null;
  classroomName: string | null = null;
  curriculumAdminUsernames: string[] = [];
  generatedUrlPrefix: string;

  constructor(
    private contextService: ContextService,
    private entityCreationService: EntityCreationService,
    private focusManagerService: FocusManagerService,
    private imageUploadHelperService: ImageUploadHelperService,
    private ngbModal: NgbModal,
    private pageTitleService: PageTitleService,
    private storyCreationBackendApiService: StoryCreationBackendApiService,
    private topicsAndSkillsDashboardBackendApiService: TopicsAndSkillsDashboardBackendApiService,
    private topicEditorStateService: TopicEditorStateService,
    private topicEditorRoutingService: TopicEditorRoutingService,
    private topicUpdateService: TopicUpdateService,
    private undoRedoService: UndoRedoService,
    private urlInterpolationService: UrlInterpolationService,
    private windowDimensionsService: WindowDimensionsService,
    private windowRef: WindowRef
  ) {}

  directiveSubscriptions = new Subscription();
  validUrlFragmentRegex = new RegExp(AppConstants.VALID_URL_FRAGMENT_REGEX);

  drop(event: CdkDragDrop<Subtopic[]>): void {
    moveItemInArray(this.subtopics, event.previousIndex, event.currentIndex);

    this.topicUpdateService.rearrangeSubtopic(
      this.topic,
      event.previousIndex,
      event.currentIndex
    );
    this.initEditor();
  }

  initEditor(): void {
    this.skillCreationIsAllowed =
      this.topicEditorStateService.isSkillCreationAllowed();
    this.topic = this.topicEditorStateService.getTopic();
    this.skillQuestionCountDict =
      this.topicEditorStateService.getSkillQuestionCountDict();
    this.topicRights = this.topicEditorStateService.getTopicRights();
    this.topicNameEditorIsShown = false;
    if (this.topicEditorStateService.hasLoadedTopic()) {
      this.topicDataHasLoaded = true;
      this.focusManagerService.setFocus('addStoryBtn');
    }
    this.editableName = this.topic.getName();
    this.editableMetaTagContent = this.topic.getMetaTagContent();
    this.editablePageTitleFragmentForWeb =
      this.topic.getPageTitleFragmentForWeb();
    this.editablePracticeIsDisplayed = this.topic.getPracticeTabIsDisplayed();
    this.initialTopicName = this.topic.getName();
    this.initialTopicUrlFragment = this.topic.getUrlFragment();
    this.editableTopicUrlFragment = this.topic.getUrlFragment();
    this.editableDescription = this.topic.getDescription();
    this.allowedBgColors = AppConstants.ALLOWED_THUMBNAIL_BG_COLORS.topic;
    this.topicNameExists = false;
    this.topicUrlFragmentExists = false;
    this.hostname = this.windowRef.nativeWindow.location.hostname;

    this.availableSkillSummariesForDiagnosticTest =
      this.getEligibleSkillSummariesForDiagnosticTest();
    this.selectedSkillSummariesForDiagnosticTest =
      this.topic.getSkillSummariesForDiagnosticTest();
    this.diagnosticTestSkillsDropdownIsShown = false;

    this.editableDescriptionIsEmpty = this.editableDescription === '';
    this.topicDescriptionChanged = false;
    this.subtopics = this.topic.getSubtopics();
    this.subtopicQuestionCountDict = {};
    this.subtopics.map(subtopic => {
      const subtopicId = subtopic.getId();
      this.subtopicQuestionCountDict[subtopicId] = 0;
      subtopic.getSkillSummaries().map(skill => {
        this.subtopicQuestionCountDict[subtopicId] +=
          this.skillQuestionCountDict[skill.id];
      });
    });
    this.uncategorizedSkillSummaries =
      this.topic.getUncategorizedSkillSummaries();
    this.editableThumbnailDataUrl =
      this.imageUploadHelperService.getTrustedResourceUrlForThumbnailFilename(
        this.topic.getThumbnailFilename(),
        this.contextService.getEntityType(),
        this.contextService.getEntityId()
      );
    this.generatedUrlPrefix = `${this.hostname}/learn/${this.classroomUrlFragment}`;
  }

  getEligibleSkillSummariesForDiagnosticTest(): ShortSkillSummary[] {
    let availableSkillSummaries =
      this.topic.getAvailableSkillSummariesForDiagnosticTest();

    let eligibleSkillSummaries = availableSkillSummaries.filter(
      skillSummary =>
        this.skillQuestionCountDict[skillSummary.getId()] >=
        AppConstants.MIN_QUESTION_COUNT_FOR_A_DIAGNOSTIC_TEST_SKILL
    );
    return eligibleSkillSummaries;
  }

  addSkillForDiagnosticTest(): void {
    let skillToAdd = this.skillForDiagnosticTestFormControl.value;
    this.skillForDiagnosticTestFormControl.setValue(null);
    this.selectedSkillSummariesForDiagnosticTest.push(skillToAdd);

    let skillSummary = this.availableSkillSummariesForDiagnosticTest.find(
      skill => skill.getId() === skillToAdd.getId()
    );
    if (skillSummary) {
      let index =
        this.availableSkillSummariesForDiagnosticTest.indexOf(skillSummary);
      this.availableSkillSummariesForDiagnosticTest.splice(index, 1);
    }

    this.topicUpdateService.updateDiagnosticTestSkills(
      this.topic,
      cloneDeep(this.selectedSkillSummariesForDiagnosticTest)
    );
    this.diagnosticTestSkillsDropdownIsShown = false;
  }

  removeSkillFromDiagnosticTest(skillToRemove: ShortSkillSummary): void {
    let skillSummary = this.selectedSkillSummariesForDiagnosticTest.find(
      skill => skill.getId() === skillToRemove.getId()
    );
    if (skillSummary) {
      let index =
        this.selectedSkillSummariesForDiagnosticTest.indexOf(skillSummary);
      this.selectedSkillSummariesForDiagnosticTest.splice(index, 1);
    }

    this.availableSkillSummariesForDiagnosticTest.push(skillToRemove);

    this.topicUpdateService.updateDiagnosticTestSkills(
      this.topic,
      cloneDeep(this.selectedSkillSummariesForDiagnosticTest)
    );
  }

  isAssignedToAClassroom(): boolean {
    return Boolean(this.classroomUrlFragment && this.classroomName);
  }

  _initStorySummaries(): void {
    this.canonicalStorySummaries =
      this.topicEditorStateService.getCanonicalStorySummaries();
  }

  // This is added because when we create a skill from the topic
  // editor, it gets assigned to that topic, and to reflect that
  // change, we need to fetch the topic again from the backend.
  refreshTopic(): void {
    this.topicEditorStateService.loadTopic(this.topic.getId());
  }

  getStaticImageUrl(imagePath: string): string {
    return this.urlInterpolationService.getStaticImageUrl(imagePath);
  }

  toggleSubtopicCard(index: string | number): void {
    this.skillOptionDialogueBox = true;
    if (this.subtopicCardSelectedIndexes[index]) {
      this.subtopicCardSelectedIndexes[index] = false;
      return;
    }
    this.subtopicCardSelectedIndexes[index] = true;
  }

  reassignSkillsInSubtopics(): void {
    this.ngbModal
      .open(RearrangeSkillsInSubtopicsModalComponent, {
        backdrop: 'static',
        windowClass: 'rearrange-skills-modal',
        size: 'xl',
      })
      .result.then(
        () => {
          this.initEditor();
        },
        () => {
          // Note to developers:
          // This callback is triggered when the Cancel button is clicked.
          // No further action is needed.
        }
      );
  }

  createCanonicalStory(): void {
    if (this.undoRedoService.getChangeCount() > 0) {
      const modalRef = this.ngbModal.open(SavePendingChangesModalComponent, {
        backdrop: true,
      });

      modalRef.componentInstance.body =
        'Please save all pending changes ' + 'before exiting the topic editor.';

      modalRef.result.then(
        () => {},
        () => {
          // Note to developers:
          // This callback is triggered when the Cancel button is clicked.
          // No further action is needed.
        }
      );
    } else {
      this.storyCreationBackendApiService.createNewCanonicalStory();
    }
  }

  createSkill(): void {
    if (this.undoRedoService.getChangeCount() > 0) {
      const modalRef = this.ngbModal.open(SavePendingChangesModalComponent, {
        backdrop: true,
      });

      modalRef.componentInstance.body =
        'Please save all pending changes ' + 'before exiting the topic editor.';

      modalRef.result.then(
        () => {},
        () => {
          // Note to developers:
          // This callback is triggered when the Cancel button is clicked.
          // No further action is needed.
        }
      );
    } else {
      this.entityCreationService.createSkill();
    }
  }

  createSubtopic(): void {
    this.entityCreationService.createSubtopic();
  }

  updateTopicDescriptionStatus(description: string): void {
    this.editableDescriptionIsEmpty = description === '';
    this.topicDescriptionChanged = true;
  }

  updateTopicName(newName: string): void {
    if (newName === this.initialTopicName) {
      this.topicNameExists = false;
      return;
    }
    if (newName) {
      this.topicEditorStateService.updateExistenceOfTopicName(newName, () => {
        this.topicNameExists =
          this.topicEditorStateService.getTopicWithNameExists();
        this.topicUpdateService.setTopicName(this.topic, newName);
        this.topicNameEditorIsShown = false;
      });
    } else {
      this.topicUpdateService.setTopicName(this.topic, newName);
      this.topicNameEditorIsShown = false;
    }
  }

  updateTopicUrlFragment(newTopicUrlFragment: string): void {
    if (newTopicUrlFragment === this.initialTopicUrlFragment) {
      this.topicUrlFragmentExists = false;
      return;
    }
    if (newTopicUrlFragment) {
      this.topicEditorStateService.updateExistenceOfTopicUrlFragment(
        newTopicUrlFragment,
        () => {
          this.topicUrlFragmentExists =
            this.topicEditorStateService.getTopicWithUrlFragmentExists();
          this.topicUpdateService.setTopicUrlFragment(
            this.topic,
            newTopicUrlFragment
          );
        },
        () => {
          this.topicUpdateService.setTopicUrlFragment(
            this.topic,
            newTopicUrlFragment
          );
        }
      );
    } else {
      this.topicUpdateService.setTopicUrlFragment(
        this.topic,
        newTopicUrlFragment
      );
    }
  }

  onChangeTopicEditorUrlFragment(urlFragment: string): void {
    this.editableTopicUrlFragment = urlFragment;
    this.updateTopicUrlFragment(urlFragment);
  }

  updateTopicThumbnailFilename(newThumbnailFilename: string): void {
    if (newThumbnailFilename === this.topic.getThumbnailFilename()) {
      return;
    }
    this.topicUpdateService.setTopicThumbnailFilename(
      this.topic,
      newThumbnailFilename
    );
  }

  updateTopicThumbnailBgColor(newThumbnailBgColor: string): void {
    if (newThumbnailBgColor === this.topic.getThumbnailBgColor()) {
      return;
    }
    this.topicUpdateService.setTopicThumbnailBgColor(
      this.topic,
      newThumbnailBgColor
    );
  }

  updateTopicDescription(newDescription: string): void {
    if (newDescription !== this.topic.getDescription()) {
      this.topicUpdateService.setTopicDescription(this.topic, newDescription);
    }
  }

  updateTopicMetaTagContent(newMetaTagContent: string): void {
    if (newMetaTagContent !== this.topic.getMetaTagContent()) {
      this.topicUpdateService.setMetaTagContent(this.topic, newMetaTagContent);
    }
  }

  updateTopicPageTitleFragmentForWeb(
    newTopicPageTitleFragmentForWeb: string
  ): void {
    let currentValue = this.topic.getPageTitleFragmentForWeb();
    if (newTopicPageTitleFragmentForWeb !== currentValue) {
      this.topicUpdateService.setPageTitleFragmentForWeb(
        this.topic,
        newTopicPageTitleFragmentForWeb
      );
    }
  }

  // Only update the topic if 1) the creator is turning off the
  // practice tab or 2) the creator is turning on the practice tab
  // and it has enough practice questions.
  updatePracticeTabIsDisplayed(newPracticeTabIsDisplayed: boolean): void {
    if (
      !newPracticeTabIsDisplayed ||
      this.doesTopicHaveMinimumPracticeQuestions()
    ) {
      this.topicUpdateService.setPracticeTabIsDisplayed(
        this.topic,
        newPracticeTabIsDisplayed
      );
      this.editablePracticeIsDisplayed = newPracticeTabIsDisplayed;
    }
  }

  doesTopicHaveMinimumPracticeQuestions(): boolean {
    const skillQuestionCounts = Object.values(this.skillQuestionCountDict);
    const numberOfPracticeQuestions = skillQuestionCounts.reduce(
      (a: number, b: number) => a + b,
      0
    );
    return (
      numberOfPracticeQuestions >=
      AppConstants.TOPIC_MINIMUM_QUESTIONS_TO_PRACTICE
    );
  }

  deleteUncategorizedSkillFromTopic(skillSummary: ShortSkillSummary): void {
    this.topicUpdateService.removeUncategorizedSkill(this.topic, skillSummary);
    this.removeSkillFromDiagnosticTest(skillSummary);
    this.initEditor();
  }

  removeSkillFromSubtopic(
    subtopicId: number,
    skillSummary: ShortSkillSummary
  ): void {
    this.skillOptionDialogueBox = true;
    this.selectedSkillEditOptionsIndex = {};
    this.topicUpdateService.removeSkillFromSubtopic(
      this.topic,
      subtopicId,
      skillSummary
    );
    this.initEditor();
  }

  removeSkillFromTopic(
    subtopicId: number,
    skillSummary: ShortSkillSummary
  ): void {
    this.skillOptionDialogueBox = true;
    this.selectedSkillEditOptionsIndex = {};
    this.topicUpdateService.removeSkillFromSubtopic(
      this.topic,
      subtopicId,
      skillSummary
    );
    this.deleteUncategorizedSkillFromTopic(skillSummary);
  }

  togglePreview(): void {
    this.topicPreviewCardIsShown = !this.topicPreviewCardIsShown;
  }

  deleteSubtopic(subtopicId: number): void {
    this.topicEditorStateService.deleteSubtopicPage(
      this.topic.getId(),
      subtopicId
    );
    this.topicUpdateService.deleteSubtopic(this.topic, subtopicId);
    this.initEditor();
  }

  navigateToSubtopic(subtopicId: number, subtopicName: string): void {
    this.pageTitleService.setNavbarTitleForMobileView('Subtopic Editor');
    this.pageTitleService.setNavbarSubtitleForMobileView(subtopicName);
    this.topicEditorRoutingService.navigateToSubtopicEditorWithId(subtopicId);
  }

  getSkillEditorUrl(skillId: string): string {
    var SKILL_EDITOR_URL_TEMPLATE = '/skill_editor/<skillId>';
    return this.urlInterpolationService.interpolateUrl(
      SKILL_EDITOR_URL_TEMPLATE,
      {
        skillId: skillId,
      }
    );
  }

  navigateToSkill(skillId: string): void {
    this.topicEditorRoutingService.navigateToSkillEditorWithId(skillId);
  }

  getPreviewFooter(): string {
    var canonicalStoriesLength = this.topic.getCanonicalStoryIds().length;
    if (canonicalStoriesLength === 0 || canonicalStoriesLength > 1) {
      return canonicalStoriesLength + ' Stories';
    }
    return '1 Story';
  }

  togglePreviewListCards(listType: string = null): void {
    if (!this.windowDimensionsService.isWindowNarrow()) {
      return;
    }
    if (listType === this.SUBTOPIC_LIST) {
      this.subtopicsListIsShown = !this.subtopicsListIsShown;
    } else if (listType === this.STORY_LIST) {
      this.storiesListIsShown = !this.storiesListIsShown;
    } else {
      this.mainTopicCardIsShown = !this.mainTopicCardIsShown;
    }
  }

  showSubtopicEditOptions(index: number): void {
    this.subtopicEditOptionsAreShown =
      this.subtopicEditOptionsAreShown === index ? null : index;
  }

  toggleUncategorizedSkillOptions(index: number): void {
    this.uncategorizedEditOptionsIndex =
      this.uncategorizedEditOptionsIndex === index ? null : index;
  }

  changeSubtopicAssignment(
    oldSubtopicId: number,
    skillSummary: ShortSkillSummary
  ): void {
    this.skillOptionDialogueBox = true;
    const modalRef: NgbModalRef = this.ngbModal.open(
      ChangeSubtopicAssignmentModalComponent,
      {
        backdrop: 'static',
        windowClass: 'oppia-change-subtopic-assignment-modal',
        size: 'xl',
      }
    );
    modalRef.componentInstance.subtopics = this.subtopics;
    modalRef.result.then(
      newSubtopicId => {
        if (oldSubtopicId === newSubtopicId) {
          return;
        }
        this.topicUpdateService.moveSkillToSubtopic(
          this.topic,
          oldSubtopicId,
          newSubtopicId,
          skillSummary
        );
        this.initEditor();
      },
      () => {
        // Note to developers:
        // This callback is triggered when the Cancel button is clicked.
        // No further action is needed.
      }
    );
  }

  showSkillEditOptions(
    subtopicIndex: string | number = null,
    skillIndex: number = null
  ): void {
    if (subtopicIndex === null && skillIndex === null) {
      this.skillOptionDialogueBox = true;
      return;
    } else {
      this.skillOptionDialogueBox = false;
    }

    if (Object.keys(this.selectedSkillEditOptionsIndex).length) {
      this.selectedSkillEditOptionsIndex = {};
      return;
    }
    this.selectedSkillEditOptionsIndex[subtopicIndex] = {};
    this.selectedSkillEditOptionsIndex[subtopicIndex] = {
      [skillIndex]: true,
    };
  }

  presentDiagnosticTestSkillDropdown(): void {
    this.diagnosticTestSkillsDropdownIsShown = true;
  }

  removeDiagnosticTestSkillDropdown(): void {
    this.diagnosticTestSkillsDropdownIsShown = false;
  }

  ngOnInit(): void {
    this.focusManagerService.setFocus('addStoryBtn');
    this.topicPreviewCardIsShown = false;
    this.SUBTOPIC_LIST = 'subtopic';
    this.SKILL_LIST = 'skill';
    this.STORY_LIST = 'story';
    this.topicDataHasLoaded = false;
    this.subtopicCardSelectedIndexes = {};
    this.selectedSkillEditOptionsIndex = {};
    this.subtopicsListIsShown = !this.windowDimensionsService.isWindowNarrow();
    this.storiesListIsShown = !this.windowDimensionsService.isWindowNarrow();
    this.classroomUrlFragment =
      this.topicEditorStateService.getClassroomUrlFragment();
    this.classroomName = this.topicEditorStateService.getClassroomName();
    this.curriculumAdminUsernames =
      this.topicEditorStateService.getCurriculumAdminUsernames();
    this.directiveSubscriptions.add(
      this.topicEditorStateService.onTopicInitialized.subscribe(() =>
        this.initEditor()
      )
    );
    this.directiveSubscriptions.add(
      this.topicEditorStateService.onTopicReinitialized.subscribe(() =>
        this.initEditor()
      )
    );
    this.mainTopicCardIsShown = true;

    this.directiveSubscriptions.add(
      this.topicEditorStateService.onStorySummariesInitialized.subscribe(() =>
        this._initStorySummaries()
      )
    );
    this.directiveSubscriptions.add(
      this.topicsAndSkillsDashboardBackendApiService.onTopicsAndSkillsDashboardReinitialized.subscribe(
        () => {
          this.refreshTopic();
        }
      )
    );
    this.initEditor();
    this._initStorySummaries();
    this.maxCharsInTopicName = AppConstants.MAX_CHARS_IN_TOPIC_NAME;
    this.MAX_CHARS_IN_TOPIC_URL_FRAGMENT =
      AppConstants.MAX_CHARS_IN_TOPIC_URL_FRAGMENT;
    this.maxCharsInTopicDescription =
      AppConstants.MAX_CHARS_IN_TOPIC_DESCRIPTION;
    this.maxCharsInPageTitleFragmentForWeb =
      AppConstants.MAX_CHARS_IN_PAGE_TITLE_FRAGMENT_FOR_WEB;
    this.maxCharsInMetaTagContent = AppConstants.MAX_CHARS_IN_META_TAG_CONTENT;
    this.minCharsInPageTitleFragmentForWeb =
      AppConstants.MIN_CHARS_IN_PAGE_TITLE_FRAGMENT_FOR_WEB;
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }
}
