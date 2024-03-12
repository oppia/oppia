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
 * @fileoverview Component for revert exploration modal.
 */

import {Component, Input, ViewChild, ElementRef} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';

import {ConfirmOrCancelModal} from 'components/common-layout-directives/common-elements/confirm-or-cancel-modal.component';
import {ExplorationDataService} from 'pages/exploration-editor-page/services/exploration-data.service';

@Component({
  selector: 'oppia-revert-exploration-modal',
  templateUrl: './revert-exploration-modal.component.html',
})
export class RevertExplorationModalComponent extends ConfirmOrCancelModal {
  // This property is initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() version!: string;
  @ViewChild('revertExploration') revertExplorationHeadingRef!: ElementRef;

  constructor(
    private ngbActiveModal: NgbActiveModal,
    private explorationDataService: ExplorationDataService
  ) {
    super(ngbActiveModal);
  }

  getExplorationUrl(version: string): string {
    return (
      '/explore/' + this.explorationDataService.explorationId + '?v=' + version
    );
  }

  ngAfterViewInit(): void {
    this.revertExplorationHeadingRef?.nativeElement.focus();
  }
}
