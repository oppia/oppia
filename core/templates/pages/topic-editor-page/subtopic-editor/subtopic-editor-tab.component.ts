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
 * @fileoverview Component for the Subtopic Editor Tab.
 */

import {CdkDragDrop, moveItemInArray} from '@angular/cdk/drag-drop';
import {Component, OnDestroy, OnInit} from '@angular/core';
import {AppConstants} from 'app.constants';
import {QuestionBackendApiService} from 'domain/question/question-backend-api.service';
import {ShortSkillSummary} from 'domain/skill/short-skill-summary.model';
import {SubtopicPage} from 'domain/topic/subtopic-page.model';
import {Subtopic} from 'domain/topic/subtopic.model';
import {TopicUpdateService} from 'domain/topic/topic-update.service';
import {Topic} from 'domain/topic/topic-object.model';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {Subscription} from 'rxjs';
import {WindowDimensionsService} from 'services/contextual/window-dimensions.service';
import {WindowRef} from 'services/contextual/window-ref.service';
import {SubtopicValidationService} from '../services/subtopic-validation.service';
import {TopicEditorRoutingService} from '../services/topic-editor-routing.service';
import {TopicEditorStateService} from '../services/topic-editor-state.service';
import cloneDeep from 'lodash/cloneDeep';
import {StudyGuide} from 'domain/topic/study-guide.model';
import {PlatformFeatureService} from 'services/platform-feature.service';
import {StudyGuideSection} from 'domain/topic/study-guide-sections.model';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {DeleteStudyGuideSectionComponent} from 'pages/topic-editor-page/subtopic-editor/delete-study-guide-section-modal.component';
import {AddStudyGuideSectionModalComponent} from 'pages/topic-editor-page/subtopic-editor/add-study-guide-section.component';

@Component({
  selector: 'oppia-subtopic-editor-tab',
  templateUrl: './subtopic-editor-tab.component.html',
})
export class SubtopicEditorTabComponent implements OnInit, OnDestroy {
  hostname: string;
  topic: Topic;
  classroomUrlFragment: string;
  subtopic: Subtopic;
  subtopicId: number;
  errorMsg: string;
  subtopicUrlFragmentIsValid: boolean;
  subtopicUrlFragmentExists: boolean;
  skillIds: string[];
  questionCount: number;
  skillQuestionCountDict: object;
  editableTitle: string;
  editableThumbnailFilename: string;
  editableThumbnailBgColor: string;
  initialSubtopicUrlFragment: string;
  editableUrlFragment: string;
  subtopicPage: SubtopicPage;
  studyGuide: StudyGuide;
  activeSectionIndex: number = -1;
  allowedBgColors;
  htmlData: string;
  sections: StudyGuideSection[];
  isEditable: boolean = false;
  uncategorizedSkillSummaries: ShortSkillSummary[];
  schemaEditorIsShown: boolean;
  htmlDataBeforeUpdate: string;
  toIndex: number;
  fromIndex: number;
  subtopicPreviewCardIsShown: boolean;
  skillsListIsShown: boolean;
  subtopicEditorCardIsShown: boolean;
  sectionsListIsShown: boolean;
  selectedSkillEditOptionsIndex: number;
  maxCharsInSubtopicTitle!: number;
  MAX_CHARS_IN_SUBTOPIC_URL_FRAGMENT!: number;
  SUBTOPIC_PAGE_SCHEMA: {
    type: string;
    ui_config: {
      rte_component_config_id: string;
      rows: number;
    };
  };
  generatedUrlPrefix: string;

  constructor(
    private questionBackendApiService: QuestionBackendApiService,
    private subtopicValidationService: SubtopicValidationService,
    private topicEditorRoutingService: TopicEditorRoutingService,
    private ngbModal: NgbModal,
    private topicEditorStateService: TopicEditorStateService,
    private topicUpdateService: TopicUpdateService,
    private urlInterpolationService: UrlInterpolationService,
    private windowDimensionsService: WindowDimensionsService,
    private platformFeatureService: PlatformFeatureService,
    private windowRef: WindowRef
  ) {}

  directiveSubscriptions = new Subscription();
  SKILL_EDITOR_URL_TEMPLATE = '/skill_editor/<skillId>';

  initEditor(): void {
    this.hostname = this.windowRef.nativeWindow.location.hostname;
    this.topic = this.topicEditorStateService.getTopic();
    this.classroomUrlFragment =
      this.topicEditorStateService.getClassroomUrlFragment();
    this.generatedUrlPrefix = `${this.hostname}/learn/${this.classroomUrlFragment}/${this.topic.getUrlFragment()}/studyguide`;
    this.subtopicId = this.topicEditorRoutingService.getSubtopicIdFromUrl();
    this.subtopic = this.topic.getSubtopicById(this.subtopicId);
    if (!this.subtopic) {
      this.topicEditorRoutingService.navigateToMainTab();
    }
    this.errorMsg = null;
    this.subtopicUrlFragmentExists = false;
    this.subtopicUrlFragmentIsValid = false;
    if (this.topic.getId() && this.subtopic) {
      if (this.isShowRestructuredStudyGuidesFeatureEnabled()) {
        this.topicEditorStateService.loadStudyGuide(
          this.topic.getId(),
          this.subtopicId
        );
      } else {
        this.topicEditorStateService.loadSubtopicPage(
          this.topic.getId(),
          this.subtopicId
        );
      }
      this.skillIds = this.subtopic.getSkillIds();
      this.questionCount = 0;
      if (this.skillIds.length) {
        this.questionBackendApiService
          .fetchTotalQuestionCountForSkillIdsAsync(this.skillIds)
          .then(questionCount => {
            this.questionCount = questionCount;
          });
      }
      this.skillQuestionCountDict =
        this.topicEditorStateService.getSkillQuestionCountDict();
      this.editableTitle = this.subtopic.getTitle();
      this.editableThumbnailFilename = this.subtopic.getThumbnailFilename();
      this.editableThumbnailBgColor = this.subtopic.getThumbnailBgColor();
      this.editableUrlFragment = this.subtopic.getUrlFragment();
      this.initialSubtopicUrlFragment = this.subtopic.getUrlFragment();
      if (this.isShowRestructuredStudyGuidesFeatureEnabled()) {
        this.studyGuide = this.topicEditorStateService.getStudyGuide();
      } else {
        this.subtopicPage = this.topicEditorStateService.getSubtopicPage();
      }
      this.allowedBgColors = AppConstants.ALLOWED_THUMBNAIL_BG_COLORS.subtopic;
      if (this.isShowRestructuredStudyGuidesFeatureEnabled()) {
        var sections = this.studyGuide.getSections();
        this.sections = sections;
      } else {
        var pageContents = this.subtopicPage.getPageContents();
        this.htmlData = pageContents.getHtml();
      }
      this.uncategorizedSkillSummaries =
        this.topic.getUncategorizedSkillSummaries();
      this.subtopicUrlFragmentIsValid =
        this.subtopicValidationService.isUrlFragmentValid(
          this.editableUrlFragment
        );
    }
  }

  isEnableWorkedexamplesRteComponentFeatureEnabled(): boolean {
    return this.platformFeatureService.status.EnableWorkedExamplesRteComponent
      .isEnabled;
  }

  updateSubtopicTitle(title: string): void {
    if (title === this.subtopic.getTitle()) {
      return;
    }

    if (!this.subtopicValidationService.checkValidSubtopicName(title)) {
      this.errorMsg = 'A subtopic with this title already exists';
      return;
    }

    this.topicUpdateService.setSubtopicTitle(
      this.topic,
      this.subtopic.getId(),
      title
    );
    this.editableTitle = title;
  }

  drop(event: CdkDragDrop<string[]>): void {
    moveItemInArray(
      this.subtopic.getSkillSummaries(),
      event.previousIndex,
      event.currentIndex
    );
    this.topicUpdateService.rearrangeSkillInSubtopic(
      this.topic,
      this.subtopic.getId(),
      event.previousIndex,
      event.currentIndex
    );
  }

  onSubtopicUrlFragmentChange(urlFragment: string): void {
    this.editableUrlFragment = urlFragment;
    this.updateSubtopicUrlFragment(urlFragment);
  }

  updateSubtopicUrlFragment(urlFragment: string): void {
    this.subtopicUrlFragmentIsValid =
      this.subtopicValidationService.isUrlFragmentValid(urlFragment);
    if (urlFragment === this.initialSubtopicUrlFragment) {
      this.subtopicUrlFragmentExists = false;
      return;
    }

    this.subtopicUrlFragmentExists =
      this.subtopicValidationService.doesSubtopicWithUrlFragmentExist(
        urlFragment
      );
    if (!this.subtopicUrlFragmentIsValid || this.subtopicUrlFragmentExists) {
      return;
    }

    this.topicUpdateService.setSubtopicUrlFragment(
      this.topic,
      this.subtopic.getId(),
      urlFragment
    );
    this.editableUrlFragment = urlFragment;
  }

  updateSubtopicThumbnailFilename(newThumbnailFilename: string): void {
    var oldThumbnailFilename = this.subtopic.getThumbnailFilename();
    if (newThumbnailFilename === oldThumbnailFilename) {
      return;
    }
    this.topicUpdateService.setSubtopicThumbnailFilename(
      this.topic,
      this.subtopic.getId(),
      newThumbnailFilename
    );
    this.editableThumbnailFilename = newThumbnailFilename;
  }

  updateSubtopicThumbnailBgColor(newThumbnailBgColor: string): void {
    var oldThumbnailBgColor = this.subtopic.getThumbnailBgColor();
    if (newThumbnailBgColor === oldThumbnailBgColor) {
      return;
    }
    this.topicUpdateService.setSubtopicThumbnailBgColor(
      this.topic,
      this.subtopic.getId(),
      newThumbnailBgColor
    );
    this.editableThumbnailBgColor = newThumbnailBgColor;
  }

  resetErrorMsg(): void {
    this.errorMsg = null;
  }

  isSkillDeleted(skillSummary: ShortSkillSummary): boolean {
    return skillSummary.getDescription() === null;
  }

  isShowRestructuredStudyGuidesFeatureEnabled(): boolean {
    return this.platformFeatureService.status.ShowRestructuredStudyGuides
      .isEnabled;
  }

  getSkillEditorUrl(skillId: string): string {
    return this.urlInterpolationService.interpolateUrl(
      this.SKILL_EDITOR_URL_TEMPLATE,
      {
        skillId: skillId,
      }
    );
  }

  updateHtmlData(): void {
    if (this.htmlData !== this.subtopicPage.getPageContents().getHtml()) {
      var subtitledHtml = cloneDeep(
        this.subtopicPage.getPageContents().getSubtitledHtml()
      );
      subtitledHtml.html = this.htmlData;
      this.topicUpdateService.setSubtopicPageContentsHtml(
        this.subtopicPage,
        this.subtopic.getId(),
        subtitledHtml
      );
      this.topicEditorStateService.setSubtopicPage(this.subtopicPage);
      this.schemaEditorIsShown = false;
    }
  }

  cancelHtmlDataChange(): void {
    this.htmlData = this.htmlDataBeforeUpdate;
    this.updateHtmlData();
    this.schemaEditorIsShown = false;
  }

  showSchemaEditor(): void {
    this.schemaEditorIsShown = true;
    this.htmlDataBeforeUpdate = cloneDeep(this.htmlData);
  }

  toggleSubtopicPreview(): void {
    this.subtopicPreviewCardIsShown = !this.subtopicPreviewCardIsShown;
  }

  togglePreviewSkillCard(): void {
    if (!this.windowDimensionsService.isWindowNarrow()) {
      return;
    }
    this.skillsListIsShown = !this.skillsListIsShown;
  }

  toggleSubtopicEditorCard(): void {
    if (!this.windowDimensionsService.isWindowNarrow()) {
      return;
    }
    this.subtopicEditorCardIsShown = !this.subtopicEditorCardIsShown;
  }

  toggleSectionsList(): void {
    if (!this.windowDimensionsService.isWindowNarrow()) {
      return;
    }
    this.sectionsListIsShown = !this.sectionsListIsShown;
  }

  showSkillEditOptions(index: number): void {
    this.selectedSkillEditOptionsIndex =
      this.selectedSkillEditOptionsIndex === index ? -1 : index;
  }

  removeSkillFromSubtopic(skillSummary: ShortSkillSummary): void {
    this.selectedSkillEditOptionsIndex = -1;
    this.topicUpdateService.removeSkillFromSubtopic(
      this.topic,
      this.subtopicId,
      skillSummary
    );
    this.initEditor();
  }

  removeSkillFromTopic(skillSummary: ShortSkillSummary): void {
    this.selectedSkillEditOptionsIndex = -1;
    this.topicUpdateService.removeSkillFromSubtopic(
      this.topic,
      this.subtopicId,
      skillSummary
    );
    this.topicUpdateService.removeUncategorizedSkill(this.topic, skillSummary);
    this.initEditor();
  }

  navigateToTopicEditor(): void {
    this.topicEditorRoutingService.navigateToMainTab();
  }

  changeActiveSectionIndex(idx: number): void {
    if (idx === this.activeSectionIndex) {
      this.sections = this.studyGuide.getSections();
      this.activeSectionIndex = -1;
    } else {
      this.activeSectionIndex = idx;
    }
  }

  openAddSectionModal(): void {
    this.ngbModal
      .open(AddStudyGuideSectionModalComponent, {
        backdrop: 'static',
      })
      .result.then(
        result => {
          let contentIdIndex = this.studyGuide.getNextContentIdIndex();
          let newSection = StudyGuideSection.create(
            result.sectionHeadingPlaintext,
            result.sectionContentHtml,
            `section_heading_${contentIdIndex}`,
            `section_content_${contentIdIndex + 1}`
          );
          this.studyGuide.setNextContentIdIndex(contentIdIndex + 2);
          this.topicUpdateService.addSection(
            this.studyGuide,
            newSection,
            this.subtopicId
          );
          this.sections.push(newSection);
          this.studyGuide.setSections(this.sections);
          this.topicEditorStateService.setStudyGuide(this.studyGuide);
        },
        () => {
          // Note to developers:
          // This callback is triggered when the Cancel button is clicked.
          // No further action is needed.
        }
      );
  }

  deleteSection(index: number, evt: string): void {
    this.ngbModal
      .open(DeleteStudyGuideSectionComponent, {
        backdrop: 'static',
      })
      .result.then(
        () => {
          let newSections = cloneDeep(this.sections);
          newSections.splice(index, 1);
          this.topicUpdateService.deleteSection(
            this.studyGuide,
            index,
            this.subtopicId
          );
          this.sections = newSections;
          this.studyGuide.setSections(this.sections);
          this.topicEditorStateService.setStudyGuide(this.studyGuide);
          this.activeSectionIndex = -1;
        },
        () => {
          // Note to developers:
          // This callback is triggered when the Cancel button is clicked.
          // No further action is needed.
        }
      );
  }

  ngOnInit(): void {
    const rteComponents =
      this.isEnableWorkedexamplesRteComponentFeatureEnabled()
        ? 'SKILL_AND_STUDY_GUIDE_EDITOR_COMPONENTS'
        : 'ALL_COMPONENTS';
    this.SUBTOPIC_PAGE_SCHEMA = {
      type: 'html',
      ui_config: {rte_component_config_id: rteComponents, rows: 100},
    };
    this.htmlData = '';
    this.sections = [];
    this.sectionsListIsShown = !this.windowDimensionsService.isWindowNarrow();
    this.skillsListIsShown = !this.windowDimensionsService.isWindowNarrow();
    this.subtopicPreviewCardIsShown = false;
    this.subtopicEditorCardIsShown = true;
    this.schemaEditorIsShown = false;
    if (this.isShowRestructuredStudyGuidesFeatureEnabled()) {
      this.directiveSubscriptions.add(
        this.topicEditorStateService.onStudyGuideLoaded.subscribe(() => {
          this.studyGuide = this.topicEditorStateService.getStudyGuide();
          this.sections = this.studyGuide.getSections();
        })
      );
    } else {
      this.directiveSubscriptions.add(
        this.topicEditorStateService.onSubtopicPageLoaded.subscribe(() => {
          this.subtopicPage = this.topicEditorStateService.getSubtopicPage();
          var pageContents = this.subtopicPage.getPageContents();
          this.htmlData = pageContents.getHtml();
        })
      );
    }
    this.directiveSubscriptions.add(
      this.topicEditorStateService.onTopicInitialized.subscribe(() => {
        this.initEditor();
      })
    );
    this.directiveSubscriptions.add(
      this.topicEditorStateService.onTopicReinitialized.subscribe(() => {
        this.initEditor();
      })
    );
    if (this.topicEditorStateService.hasLoadedTopic()) {
      this.initEditor();
    }
    this.maxCharsInSubtopicTitle = AppConstants.MAX_CHARS_IN_SUBTOPIC_TITLE;
    this.MAX_CHARS_IN_SUBTOPIC_URL_FRAGMENT =
      AppConstants.MAX_CHARS_IN_SUBTOPIC_URL_FRAGMENT;
    this.isEditable = true;
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }
}
