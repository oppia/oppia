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
 * @fileoverview Component for add study guide section modal.
 */

import {Component} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {AppConstants} from 'app.constants';
import {ConfirmOrCancelModal} from 'components/common-layout-directives/common-elements/confirm-or-cancel-modal.component';
import {
  CALCULATION_TYPE_CHARACTER,
  HtmlLengthService,
} from 'services/html-length.service';
import {PlatformFeatureService} from 'services/platform-feature.service';

interface HtmlFormSchema {
  type: 'html' | 'unicode';
  ui_config: object;
}

@Component({
  selector: 'oppia-add-study-guide-section-modal',
  templateUrl: './add-study-guide-section.component.html',
})
export class AddStudyGuideSectionModalComponent extends ConfirmOrCancelModal {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  tempSectionHeadingPlaintext: string = '';
  tempSectionContentHtml: string = '';
  SECTION_FORM_CONTENT_SCHEMA: HtmlFormSchema = {
    type: 'html',
    ui_config: {
      rte_component_config_id: 'SKILL_AND_STUDY_GUIDE_EDITOR_COMPONENTS',
    },
  };
  SECTION_FORM_HEADING_SCHEMA: HtmlFormSchema = {
    type: 'unicode',
    ui_config: {},
  };
  studyGuideSectionCharacterLimit: number =
    AppConstants.STUDY_GUIDE_SECTION_CHARACTER_LIMIT;

  constructor(
    private ngbActiveModal: NgbActiveModal,
    private htmlLengthService: HtmlLengthService,
    private platformFeatureService: PlatformFeatureService
  ) {
    super(ngbActiveModal);
  }

  getContentSchema(): HtmlFormSchema {
    if (!this.isEnableWorkedexamplesRteComponentFeatureEnabled()) {
      this.SECTION_FORM_CONTENT_SCHEMA = {
        type: 'html',
        ui_config: {
          rte_component_config_id: 'ALL_COMPONENTS',
          rows: 100,
        },
      };
    }
    return this.SECTION_FORM_CONTENT_SCHEMA;
  }

  getHeadingSchema(): HtmlFormSchema {
    return this.SECTION_FORM_HEADING_SCHEMA;
  }

  updateLocalHeading($event: string): void {
    if (this.tempSectionHeadingPlaintext !== $event) {
      this.tempSectionHeadingPlaintext = $event;
    }
  }

  updateLocalContent($event: string): void {
    if (this.tempSectionContentHtml !== $event) {
      this.tempSectionContentHtml = $event;
    }
  }

  isEnableWorkedexamplesRteComponentFeatureEnabled(): boolean {
    return this.platformFeatureService.status.EnableWorkedExamplesRteComponent
      .isEnabled;
  }

  isSectionContentLengthExceeded(): boolean {
    return Boolean(
      this.htmlLengthService.computeHtmlLength(
        this.tempSectionContentHtml,
        CALCULATION_TYPE_CHARACTER
      ) > this.studyGuideSectionCharacterLimit
    );
  }

  saveSection(): void {
    this.ngbActiveModal.close({
      sectionHeadingPlaintext: this.tempSectionHeadingPlaintext,
      sectionContentHtml: this.tempSectionContentHtml,
    });
  }
}
