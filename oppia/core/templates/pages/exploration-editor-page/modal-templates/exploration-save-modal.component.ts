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
 * @fileoverview Component for exploration save modal.
 */

import {Component, Input} from '@angular/core';
import {
  NgbActiveModal,
  NgbModal,
  NgbModalRef,
} from '@ng-bootstrap/ng-bootstrap';
import {ConfirmOrCancelModal} from 'components/common-layout-directives/common-elements/confirm-or-cancel-modal.component';
import {AppConstants} from 'app.constants';
import {DiffNodeData} from 'components/version-diff-visualization/version-diff-visualization.component';
import {StateDiffModalComponent} from './state-diff-modal.component';
import {PlatformFeatureService} from 'services/platform-feature.service';

@Component({
  selector: 'oppia-exploration-save-modal',
  templateUrl: './exploration-save-modal.component.html',
})
export class ExplorationSaveModalComponent extends ConfirmOrCancelModal {
  earlierVersionHeader: string = 'Last saved';
  laterVersionHeader: string = 'New changes';
  commitMessage: string = '';
  showDiff: boolean = false;
  MAX_COMMIT_MESSAGE_LENGTH = String(AppConstants.MAX_COMMIT_MESSAGE_LENGTH);
  modifyTranslationsFeatureFlagIsEnabled: boolean = false;

  // These properties below are initialized using Angular lifecycle hooks
  // where we need to do non-null assertion. For more information see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() isExplorationPrivate!: boolean;
  @Input() diffData!: DiffNodeData;

  constructor(
    private ngbActiveModal: NgbActiveModal,
    private ngbModal: NgbModal,
    private platformFeatureService: PlatformFeatureService
  ) {
    super(ngbActiveModal);
  }

  ngOnInit(): void {
    this.modifyTranslationsFeatureFlagIsEnabled =
      this.platformFeatureService.status.ExplorationEditorCanModifyTranslations.isEnabled;
  }

  onClickToggleDiffButton(): void {
    this.showDiff = !this.showDiff;
  }

  showStateDiffModalForTranslations(): void {
    let modalRef: NgbModalRef = this.ngbModal.open(StateDiffModalComponent, {
      backdrop: true,
      windowClass: 'state-diff-modal',
      size: 'xl',
    });

    modalRef.componentInstance.showingTranslationChanges = true;
    modalRef.componentInstance.headers = {
      leftPane: this.earlierVersionHeader,
      rightPane: this.laterVersionHeader,
    };

    modalRef.result.then(
      () => {},
      () => {}
    );
  }
}
