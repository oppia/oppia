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

import {Component} from '@angular/core';
import {AppConstants} from 'app.constants';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {ConfirmOrCancelModal} from 'components/common-layout-directives/common-elements/confirm-or-cancel-modal.component';

@Component({
  selector: 'oppia-blog-author-details-editor',
  templateUrl: './author-detail-editor-modal.component.html',
})
export class BlogAuthorDetailsEditorComponent extends ConfirmOrCancelModal {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  authorNameEditorIsOpen: boolean = false;
  authorBioEditorIsOpen: boolean = false;
  authorName!: string;
  authorBio!: string;
  prevAuthorBio!: string;
  constructor(ngbActiveModal: NgbActiveModal) {
    super(ngbActiveModal);
  }

  cancel(): void {
    if (this.prevAuthorBio.length !== 0) {
      super.cancel();
    }
  }

  validateAuthorDetails(): string[] {
    let issues: string[] = [];
    const validAuthorNameRegex = new RegExp(
      AppConstants.VALID_AUTHOR_NAME_REGEX
    );
    if (this.authorName.trim().length === 0) {
      issues.push('Author Name should not be empty.');
    } else if (this.authorName.length < AppConstants.MIN_AUTHOR_NAME_LENGTH) {
      issues.push(
        'Author Name should not be less than ' +
          `${AppConstants.MIN_AUTHOR_NAME_LENGTH} characters.`
      );
    } else if (this.authorName.length > AppConstants.MAX_AUTHOR_NAME_LENGTH) {
      issues.push(
        'Author Name should not be more than ' +
          `${AppConstants.MAX_AUTHOR_NAME_LENGTH} characters.`
      );
    } else if (!validAuthorNameRegex.test(this.authorName)) {
      issues.push(
        'Author Name can only have alphanumeric characters and spaces.'
      );
    }

    if (this.authorBio.trim().length === 0) {
      issues.push('Author Bio should not be empty.');
    } else if (this.authorBio.length < AppConstants.MIN_CHARS_IN_AUTHOR_BIO) {
      issues.push(
        'Author Bio should not be less than ' +
          `${AppConstants.MIN_CHARS_IN_AUTHOR_BIO} characters.`
      );
    } else if (this.authorBio.length > AppConstants.MAX_CHARS_IN_AUTHOR_BIO) {
      issues.push(
        'Author Bio should not be more than ' +
          `${AppConstants.MAX_CHARS_IN_AUTHOR_BIO} characters.`
      );
    }
    return issues;
  }

  save(): void {
    let authorDetails = {
      authorName: this.authorName,
      authorBio: this.authorBio,
    };
    if (this.validateAuthorDetails().length === 0) {
      super.confirm(authorDetails);
    }
  }
}
