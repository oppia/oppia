// Copyright 2025 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for the study guide section editor.
 */

import {ChangeDetectorRef, Component, Input, OnInit} from '@angular/core';
import {StudyGuideSection} from 'domain/topic/study-guide-sections.model';
import {TopicUpdateService} from 'domain/topic/topic-update.service';
import {TopicEditorStateService} from '../services/topic-editor-state.service';
import {
  CALCULATION_TYPE_CHARACTER,
  HtmlLengthService,
} from 'services/html-length.service';
import {AppConstants} from 'app.constants';
import {PlatformFeatureService} from 'services/platform-feature.service';

interface HtmlFormSchema {
  type: 'html' | 'unicode';
  ui_config: object;
}

interface Container {
  sectionHeadingPlaintext: string;
  sectionContentHtml: string;
}

@Component({
  selector: 'oppia-study-guide-section-editor',
  templateUrl: './study-guide-section-editor.component.html',
})
export class StudyGuideSectionEditorComponent implements OnInit {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() index!: number;
  @Input() isEditable!: boolean;
  @Input() section!: StudyGuideSection;
  container!: Container;
  tempSectionHeadingPlaintext!: string;
  tempSectionContentHtml!: string;
  // Below properties are empty strings when the editor is closed.
  originalSectionHeading!: string;
  originalSectionContent!: string;
  headingEditorIsOpen: boolean = false;
  contentEditorIsOpen: boolean = false;
  STUDY_GUIDE_SECTION_HEADING_FORM_SCHEMA: HtmlFormSchema = {
    type: 'unicode',
    ui_config: {},
  };
  STUDY_GUIDE_SECTION_CONTENT_FORM_SCHEMA: HtmlFormSchema = {
    type: 'html',
    ui_config: {
      rte_component_config_id: 'SKILL_AND_STUDY_GUIDE_EDITOR_COMPONENTS',
    },
  };
  studyGuideSectionCharacterLimit: number =
    AppConstants.STUDY_GUIDE_SECTION_CHARACTER_LIMIT;

  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    private topicEditorStateService: TopicEditorStateService,
    private topicUpdateService: TopicUpdateService,
    private htmlLengthService: HtmlLengthService,
    private platformFeatureService: PlatformFeatureService
  ) {}

  ngOnInit(): void {
    this.container = {
      sectionHeadingPlaintext: this.section.getHeadingText(),
      sectionContentHtml: this.section.getContentHtml(),
    };
  }

  // Remove this function when the schema-based editor
  // is migrated to Angular 2+.
  getContentSchema(): HtmlFormSchema {
    if (!this.isEnableWorkedexamplesRteComponentFeatureEnabled()) {
      this.STUDY_GUIDE_SECTION_CONTENT_FORM_SCHEMA = {
        type: 'html',
        ui_config: {
          rte_component_config_id: 'ALL_COMPONENTS',
          rows: 100,
        },
      };
    }
    return this.STUDY_GUIDE_SECTION_CONTENT_FORM_SCHEMA;
  }

  getHeadingSchema(): HtmlFormSchema {
    return this.STUDY_GUIDE_SECTION_HEADING_FORM_SCHEMA;
  }

  isEnableWorkedexamplesRteComponentFeatureEnabled(): boolean {
    return this.platformFeatureService.status.EnableWorkedExamplesRteComponent
      .isEnabled;
  }

  updateLocalHeading($event: string): void {
    if (this.container.sectionHeadingPlaintext !== $event) {
      this.container.sectionHeadingPlaintext = $event;
      this.changeDetectorRef.detectChanges();
    }
  }

  updateLocalContent($event: string): void {
    if (this.container.sectionContentHtml !== $event) {
      this.container.sectionContentHtml = $event;
      this.changeDetectorRef.detectChanges();
    }
  }

  isSectionContentLengthExceeded(): boolean {
    return Boolean(
      this.htmlLengthService.computeHtmlLength(
        this.container.sectionContentHtml,
        CALCULATION_TYPE_CHARACTER
      ) > this.studyGuideSectionCharacterLimit
    );
  }

  openHeadingEditor(): void {
    if (this.isEditable) {
      this.originalSectionHeading = this.container.sectionHeadingPlaintext;
      this.headingEditorIsOpen = true;
    }
  }

  openContentEditor(): void {
    if (this.isEditable) {
      this.originalSectionContent = this.container.sectionContentHtml;
      this.contentEditorIsOpen = true;
    }
  }

  saveSection(inHeadingEditor: boolean): void {
    if (inHeadingEditor) {
      this.headingEditorIsOpen = false;
    } else {
      this.contentEditorIsOpen = false;
    }
    let contentHasChanged =
      this.originalSectionHeading !== this.container.sectionHeadingPlaintext ||
      this.originalSectionContent !== this.container.sectionContentHtml;
    this.originalSectionHeading = '';
    this.originalSectionContent = '';

    if (contentHasChanged) {
      let studyGuide = this.topicEditorStateService.getStudyGuide();
      let subtopicId = studyGuide.getId().slice(-1);
      this.topicUpdateService.updateSection(
        studyGuide,
        this.index,
        this.container.sectionHeadingPlaintext,
        this.container.sectionContentHtml,
        Number(subtopicId)
      );
      this.topicEditorStateService.setStudyGuide(studyGuide);
    }
  }

  cancelEditHeading(): void {
    if (this.originalSectionHeading === '') {
      return;
    }
    this.container.sectionHeadingPlaintext = this.originalSectionHeading;
    this.originalSectionHeading = '';
    this.headingEditorIsOpen = false;
  }

  cancelEditContent(): void {
    if (this.originalSectionContent === '') {
      return;
    }
    this.container.sectionContentHtml = this.originalSectionContent;
    this.originalSectionContent = '';
    this.contentEditorIsOpen = false;
  }
}
