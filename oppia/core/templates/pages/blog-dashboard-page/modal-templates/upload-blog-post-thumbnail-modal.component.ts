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
 * @fileoverview Component for uploading thumbnail image modal.
 */

import {Component} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {ConfirmOrCancelModal} from 'components/common-layout-directives/common-elements/confirm-or-cancel-modal.component';
import {AppConstants} from 'app.constants';

@Component({
  selector: 'oppia-blog-post-thumbnail-upload-modal',
  templateUrl: './upload-blog-post-thumbnail-modal.component.html',
})
export class UploadBlogPostThumbnailModalComponent extends ConfirmOrCancelModal {
  ALLOWED_IMAGE_EXTENSIONS = AppConstants.ALLOWED_IMAGE_FORMATS;
  ALLOWED_IMAGE_SIZE_IN_KB = AppConstants.MAX_ALLOWED_IMAGE_SIZE_IN_KB_FOR_BLOG;
  constructor(ngbActiveModal: NgbActiveModal) {
    super(ngbActiveModal);
  }

  cancel(): void {
    super.cancel();
  }

  save(imageDataUrl: string): void {
    super.confirm(imageDataUrl);
  }
}
