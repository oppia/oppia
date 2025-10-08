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
 * @fileoverview Component for create new subtopic modal controller.
 */

import {Component, OnInit} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {ConfirmOrCancelModal} from 'components/common-layout-directives/common-elements/confirm-or-cancel-modal.component';
import {WindowRef} from 'services/contextual/window-ref.service';
import {AppConstants} from 'app.constants';
import cloneDeep from 'lodash/cloneDeep';
import {PlatformFeatureService} from 'services/platform-feature.service';
import {Topic} from 'domain/topic/topic-object.model';
import {SubtopicPage} from 'domain/topic/subtopic-page.model';
import {TopicUpdateService} from 'domain/topic/topic-update.service';
import {TopicEditorStateService} from 'pages/topic-editor-page/services/topic-editor-state.service';
import {SubtopicValidationService} from 'pages/topic-editor-page/services/subtopic-validation.service';
import {StudyGuide} from 'domain/topic/study-guide.model';
import {
  CALCULATION_TYPE_CHARACTER,
  HtmlLengthService,
} from 'services/html-length.service';

@Component({
  selector: 'oppia-create-new-subtopic-modal',
  templateUrl: './create-new-subtopic-modal.component.html',
})
export class CreateNewSubtopicModalComponent
  extends ConfirmOrCancelModal
  implements OnInit
{
  // These properties below are initialized using Angular lifecycle hooks
  // where we need to do non-null assertion. For more information see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  hostname!: string;
  classroomUrlFragment!: string | null;
  topic!: Topic;
  SUBTOPIC_PAGE_SCHEMA!: object;
  htmlData!: string;
  sectionHeadingPlaintext!: string;
  sectionContentHtml!: string;
  schemaEditorIsShown!: boolean;
  editableThumbnailFilename!: string;
  editableThumbnailBgColor!: string;
  editableUrlFragment!: string;
  allowedBgColors!: readonly string[];
  subtopicId!: number;
  subtopicTitle!: string;
  // Null when no error is raised.
  errorMsg!: string | null;
  subtopicUrlFragmentExists!: boolean;
  subtopicPage!: SubtopicPage;
  studyGuide!: StudyGuide;
  MAX_CHARS_IN_SUBTOPIC_URL_FRAGMENT!: number;
  MAX_CHARS_IN_SUBTOPIC_TITLE!: number;
  MAX_CHARS_IN_STUDY_GUIDE_SECTION_HEADING!: number;
  generatedUrlPrefix!: string;
  studyGuideSectionCharacterLimit: number =
    AppConstants.STUDY_GUIDE_SECTION_CHARACTER_LIMIT;

  constructor(
    private ngbActiveModal: NgbActiveModal,
    private subtopicValidationService: SubtopicValidationService,
    private topicUpdateService: TopicUpdateService,
    private topicEditorStateService: TopicEditorStateService,
    private platformFeatureService: PlatformFeatureService,
    private htmlLengthService: HtmlLengthService,
    private windowRef: WindowRef
  ) {
    super(ngbActiveModal);
  }

  ngOnInit(): void {
    this.topic = this.topicEditorStateService.getTopic();
    this.hostname = this.windowRef.nativeWindow.location.hostname;
    this.classroomUrlFragment =
      this.topicEditorStateService.getClassroomUrlFragment();
    this.SUBTOPIC_PAGE_SCHEMA = {
      type: 'html',
      ui_config: {
        rte_component_config_id: 'SKILL_AND_STUDY_GUIDE_EDITOR_COMPONENTS',
        rows: 100,
      },
    };
    this.htmlData = '';
    this.sectionHeadingPlaintext = '';
    this.sectionContentHtml = '';
    this.schemaEditorIsShown = false;
    this.editableThumbnailFilename = '';
    this.editableThumbnailBgColor = '';
    this.editableUrlFragment = '';
    this.allowedBgColors = AppConstants.ALLOWED_THUMBNAIL_BG_COLORS.subtopic;
    this.subtopicId = this.topic.getNextSubtopicId();
    this.MAX_CHARS_IN_SUBTOPIC_TITLE = AppConstants.MAX_CHARS_IN_SUBTOPIC_TITLE;
    this.MAX_CHARS_IN_SUBTOPIC_URL_FRAGMENT =
      AppConstants.MAX_CHARS_IN_SUBTOPIC_URL_FRAGMENT;
    this.MAX_CHARS_IN_STUDY_GUIDE_SECTION_HEADING =
      AppConstants.MAX_CHARS_IN_STUDY_GUIDE_SECTION_HEADING;
    this.subtopicTitle = '';
    this.errorMsg = null;
    this.subtopicUrlFragmentExists = false;
    this.generatedUrlPrefix = `${this.hostname}/learn/${this.classroomUrlFragment} /${this.topic.getUrlFragment()}/studyguide`;
  }

  getSchema(): object {
    if (!this.isEnableWorkedexamplesRteComponentFeatureEnabled()) {
      this.SUBTOPIC_PAGE_SCHEMA = {
        type: 'html',
        ui_config: {
          rte_component_config_id: 'ALL_COMPONENTS',
          rows: 100,
        },
      };
    }
    return this.SUBTOPIC_PAGE_SCHEMA;
  }

  showSchemaEditor(): void {
    this.schemaEditorIsShown = true;
  }

  addSubtopic(): void {
    this.topicUpdateService.addSubtopic(
      this.topic,
      this.subtopicTitle,
      this.editableUrlFragment
    );

    this.topicUpdateService.setSubtopicThumbnailFilename(
      this.topic,
      this.subtopicId,
      this.editableThumbnailFilename
    );

    this.topicUpdateService.setSubtopicThumbnailBgColor(
      this.topic,
      this.subtopicId,
      this.editableThumbnailBgColor
    );
  }

  updateSubtopicThumbnailFilename(newThumbnailFilename: string): void {
    this.editableThumbnailFilename = newThumbnailFilename;
  }

  updateSubtopicThumbnailBgColor(newThumbnailBgColor: string): void {
    this.editableThumbnailBgColor = newThumbnailBgColor;
  }

  resetErrorMsg(): void {
    this.errorMsg = null;
  }

  isSectionContentLengthExceeded(): boolean {
    return Boolean(
      this.htmlLengthService.computeHtmlLength(
        this.sectionContentHtml,
        CALCULATION_TYPE_CHARACTER
      ) > this.studyGuideSectionCharacterLimit
    );
  }

  isSubtopicValid(): boolean {
    if (this.isShowRestructuredStudyGuidesFeatureEnabled()) {
      return Boolean(
        this.editableThumbnailFilename &&
          this.subtopicTitle &&
          this.sectionHeadingPlaintext &&
          this.sectionContentHtml &&
          this.editableUrlFragment &&
          this.isUrlFragmentValid()
      );
    } else {
      return Boolean(
        this.editableThumbnailFilename &&
          this.subtopicTitle &&
          this.htmlData &&
          this.editableUrlFragment &&
          this.isUrlFragmentValid()
      );
    }
  }

  cancel(): void {
    this.topicEditorStateService.deleteSubtopicPage(
      this.topic.getId(),
      this.subtopicId
    );
    this.topicEditorStateService.onTopicReinitialized.emit();
    this.ngbActiveModal.dismiss('cancel');
  }

  isUrlFragmentValid(): boolean {
    return this.subtopicValidationService.isUrlFragmentValid(
      this.editableUrlFragment.trim()
    );
  }

  isShowRestructuredStudyGuidesFeatureEnabled(): boolean {
    return this.platformFeatureService.status.ShowRestructuredStudyGuides
      .isEnabled;
  }

  isEnableWorkedexamplesRteComponentFeatureEnabled(): boolean {
    return this.platformFeatureService.status.EnableWorkedExamplesRteComponent
      .isEnabled;
  }

  checkSubtopicExistence(): void {
    this.subtopicUrlFragmentExists =
      this.subtopicValidationService.doesSubtopicWithUrlFragmentExist(
        this.editableUrlFragment
      );
  }

  onUrlFragmentChange(urlFragment: string): void {
    this.editableUrlFragment = urlFragment;
    this.checkSubtopicExistence();
  }

  save(): void {
    if (
      !this.subtopicValidationService.checkValidSubtopicName(this.subtopicTitle)
    ) {
      this.errorMsg = 'A subtopic with this title already exists';
      return;
    }

    this.addSubtopic();

    this.topicUpdateService.setSubtopicTitle(
      this.topic,
      this.subtopicId,
      this.subtopicTitle
    );
    this.topicUpdateService.setSubtopicUrlFragment(
      this.topic,
      this.subtopicId,
      this.editableUrlFragment
    );

    if (this.isShowRestructuredStudyGuidesFeatureEnabled()) {
      this.studyGuide = StudyGuide.createDefault(
        this.topic.getId(),
        this.subtopicId
      );

      let sections = cloneDeep(this.studyGuide.getSections());
      let section = sections[0];
      section.setHeadingPlaintext(this.sectionHeadingPlaintext);
      section.setContentHtml(this.sectionContentHtml);
      this.topicUpdateService.updateSection(
        this.studyGuide,
        0,
        this.sectionHeadingPlaintext,
        this.sectionContentHtml,
        this.subtopicId
      );
      this.studyGuide.setSections([section]);
      this.topicEditorStateService.setStudyGuide(this.studyGuide);
    } else {
      this.subtopicPage = SubtopicPage.createDefault(
        this.topic.getId(),
        this.subtopicId
      );

      let subtitledHtml = cloneDeep(
        this.subtopicPage.getPageContents().getSubtitledHtml()
      );
      subtitledHtml.html = this.htmlData;
      this.topicUpdateService.setSubtopicPageContentsHtml(
        this.subtopicPage,
        this.subtopicId,
        subtitledHtml
      );
      this.subtopicPage.getPageContents().setHtml(this.htmlData);
      this.topicEditorStateService.setSubtopicPage(this.subtopicPage);
    }
    this.topicUpdateService.setSubtopicTitle(
      this.topic,
      this.subtopicId,
      this.subtopicTitle
    );
    this.ngbActiveModal.close(this.subtopicId);
  }

  localValueChange(event: string): void {
    this.htmlData = event;
  }
  localContentValueChange(event: string): void {
    this.sectionContentHtml = event;
  }
}
