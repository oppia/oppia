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
 * @fileoverview Component for editing blog author details.
 */

import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ConfirmOrCancelModal } from 'components/common-layout-directives/common-elements/confirm-or-cancel-modal.component';

@Component({
  selector: 'oppia-blog-author-details-editor',
  templateUrl: './author-detail-editor-modal.component.html',
  styleUrls: []
})
export class BlogAuthorDetailsEditorComponent extends ConfirmOrCancelModal {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  authorNameEditorIsOpen: boolean = false;
  authorBioEditorIsOpen: boolean = false;
  authorName!: string;
  authorBio!: string;
  constructor(
      ngbActiveModal: NgbActiveModal,
  ) {
    super(ngbActiveModal);
  }

  cancel(): void {
    super.cancel();
  }

  save(): void {
    let authorDetails = {
      authorName: this.authorName,
      authorBio: this.authorBio
    };
    super.confirm(authorDetails);
  }
}
