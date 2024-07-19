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
 * @fileoverview Modal component asking user whether to select appropriate
 * changes for the translation.
 */

import {Component, Input} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {ConfirmOrCancelModal} from 'components/common-layout-directives/common-elements/confirm-or-cancel-modal.component';
import {PlatformFeatureService} from 'services/platform-feature.service';
import {ModifyTranslationsModalComponent} from 'pages/exploration-editor-page/modal-templates/exploration-modify-translations-modal.component';
import {EntityTranslationsService} from 'services/entity-translations.services';

@Component({
  selector: 'oppia-mark-translations-as-needing-update-modal',
  templateUrl: './mark-translations-as-needing-update-modal.component.html',
})
export class MarkTranslationsAsNeedingUpdateModalComponent extends ConfirmOrCancelModal {
  @Input() contentId!: string;
  @Input() contentValue!: string;
  @Input() markNeedsUpdateHandler!: (contentId: string) => void;
  @Input() removeHandler!: (contentId: string) => void;

  modifyTranslationsFeatureFlagIsEnabled: boolean = false;

  constructor(
    private ngbActiveModal: NgbActiveModal,
    private ngbModal: NgbModal,
    private platformFeatureService: PlatformFeatureService,
    private entityTranslationsService: EntityTranslationsService
  ) {
    super(ngbActiveModal);
  }

  ngOnInit(): void {
    this.modifyTranslationsFeatureFlagIsEnabled =
      this.platformFeatureService.status.ExplorationEditorCanModifyTranslations.isEnabled;
  }

  markNeedsUpdate(): void {
    this.markNeedsUpdateHandler(this.contentId);
    this.ngbActiveModal.close();
  }

  openModifyTranslationsModal(): void {
    if (this.doesContentHaveDisplayableTranslations()) {
      const modalRef = this.ngbModal.open(ModifyTranslationsModalComponent, {
        backdrop: 'static',
        windowClass: 'oppia-modify-translations-modal',
      });
      modalRef.componentInstance.contentId = this.contentId;
      modalRef.componentInstance.contentValue = this.contentValue;
      modalRef.result.then(
        result => {
          this.ngbActiveModal.close();
        },
        () => {
          // Note to developers:
          // This callback is triggered when the Cancel button is clicked.
          // No further action is needed.
        }
      );
    } else {
      this.ngbActiveModal.close();
    }
  }

  doesContentHaveDisplayableTranslations(): boolean {
    // Check if at least one translation is editable by lesson creator.
    for (let language in this.entityTranslationsService
      .languageCodeToLatestEntityTranslations) {
      let translationContent =
        this.entityTranslationsService.languageCodeToLatestEntityTranslations[
          language
        ].getWrittenTranslation(this.contentId);
      if (translationContent && !translationContent.needsUpdate) {
        return true;
      }
    }
    return false;
  }

  removeTranslations(): void {
    this.removeHandler(this.contentId);
    this.ngbActiveModal.close();
  }

  cancel(): void {
    this.ngbActiveModal.dismiss();
  }
}
