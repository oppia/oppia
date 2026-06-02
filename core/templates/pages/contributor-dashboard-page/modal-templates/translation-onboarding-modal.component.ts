// Copyright 2026 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Initial translation onboarding modal for contributors.
 */

import {Component, OnInit} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';

@Component({
  selector: 'oppia-translation-onboarding-modal',
  templateUrl: './translation-onboarding-modal.component.html',
})
export class TranslationOnboardingModalComponent implements OnInit {
  // This property is initialized using an Angular lifecycle hook and we need
  // to do a non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  oppiaAvatarImageUrl!: string;

  constructor(
    private activeModal: NgbActiveModal,
    private urlInterpolationService: UrlInterpolationService
  ) {}

  ngOnInit(): void {
    this.oppiaAvatarImageUrl = this.urlInterpolationService.getStaticImageUrl(
      '/avatar/oppia_avatar_tutorial.svg'
    );
  }

  skipTour(): void {
    this.activeModal.dismiss('skip');
  }

  beginTour(): void {
    this.activeModal.close('begin');
  }
}
