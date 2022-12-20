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
 * @fileoverview Component for topic editor save modal.
 */

import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { AppConstants } from 'app.constants';
import { ConfirmOrCancelModal } from 'components/common-layout-directives/common-elements/confirm-or-cancel-modal.component';

@Component({
  selector: 'oppia-topic-editor-save-modal',
  templateUrl: './topic-editor-save-modal.component.html'
})
export class TopicEditorSaveModalComponent extends ConfirmOrCancelModal
  implements OnInit {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() topicIsPublished!: boolean;
  MAX_COMMIT_MESSAGE_LENGTH!: number;
  commitMessage: string = '';
  isTopicPublished: boolean = false;

  constructor(
    private ngbActiveModal: NgbActiveModal,
  ) {
    super(ngbActiveModal);
  }

  ngOnInit(): void {
    this.isTopicPublished = this.topicIsPublished;
    this.MAX_COMMIT_MESSAGE_LENGTH = AppConstants.MAX_COMMIT_MESSAGE_LENGTH;
  }
}
