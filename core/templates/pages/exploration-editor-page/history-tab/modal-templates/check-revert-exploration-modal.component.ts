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
 * @fileoverview Component for revert exploration modal.
 */

import {Component, Input, OnInit} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';

import {CheckRevertService} from 'pages/exploration-editor-page/history-tab/services/check-revert.service';

@Component({
  selector: 'oppia-check-revert-exploration-modal',
  templateUrl: './check-revert-exploration-modal.component.html',
})
export class CheckRevertExplorationModalComponent implements OnInit {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() version!: string;

  details: string = '';

  constructor(
    private ngbActiveModal: NgbActiveModal,
    private checkRevertService: CheckRevertService
  ) {}

  ngOnInit(): void {
    this.checkRevertService.detailsEventEmitter.subscribe(details => {
      this.details = details;
    });
  }

  close(): void {
    this.ngbActiveModal.close();
  }
}
