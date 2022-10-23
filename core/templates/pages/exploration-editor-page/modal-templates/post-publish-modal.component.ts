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
 * @fileoverview Component for the Post Publish Modal.
 */

import { Component, OnInit } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { ContextService } from 'services/context.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import { ConfirmOrCancelModal } from 'components/common-layout-directives/common-elements/confirm-or-cancel-modal.component';

@Component({
  selector: 'oppia-post-publish-modal',
  templateUrl: './post-publish-modal.component.html'
})

export class PostPublishModalComponent
  extends ConfirmOrCancelModal implements OnInit {
  number = '1';
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  congratsImgUrl!: string;
  explorationLink!: string;
  explorationId!: string;
  explorationLinkCopied: boolean = false;
  constructor(
    private ngbActiveModal: NgbActiveModal,
    private urlInterpolationService: UrlInterpolationService,
    private contextService: ContextService,
    private windowRef: WindowRef,
  ) {
    super(ngbActiveModal);
  }

  ngOnInit(): void {
    this.congratsImgUrl = this.urlInterpolationService.getStaticImageUrl(
      '/general/congrats.svg');
    this.explorationId = (this.contextService.getExplorationId());
    this.explorationLinkCopied = false;
    this.explorationLink =
     this.windowRef.nativeWindow.location.protocol + '//' +
      this.windowRef.nativeWindow.location.host +
       '/explore/' + this.explorationId;
  }

  cancel(): void {
    this.ngbActiveModal.dismiss();
  }
}

angular.module('oppia').factory('oppiaPostPublishModal',
  downgradeComponent({
    component: PostPublishModalComponent
  }) as angular.IDirectiveFactory);
