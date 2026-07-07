// Copyright 2026 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Post-action modal for certificate offering create and update
 * flows.
 */

import {Clipboard} from '@angular/cdk/clipboard';
import {Component, Input} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {
  CERTIFICATE_OFFERING_RESULT_ACTIONS,
  CertificateOfferingResultAction,
} from 'domain/certificate-assessment/certificate-assessment-domain.constants';
import './post-certificate-offering-result-modal.component.css';

@Component({
  selector: 'oppia-post-certificate-offering-result-modal',
  templateUrl: './post-certificate-offering-result-modal.component.html',
})
export class PostCertificateOfferingResultModalComponent {
  @Input() action: CertificateOfferingResultAction =
    CERTIFICATE_OFFERING_RESULT_ACTIONS.CREATED;

  // TODO(#24717 - M1.14): Replace with dynamic values once backend is wired up.
  @Input() certificateName: string = 'Everyday Arithmetic & Number Confidence';
  @Input() certificateUrl: string =
    'https://www.oppia.org/certificate-offering/math/tYHbzfYwyzOP';

  constructor(
    private ngbActiveModal: NgbActiveModal,
    private clipboard: Clipboard,
    private urlInterpolationService: UrlInterpolationService
  ) {}

  getOppiaLargeAvatarUrl(): string {
    return this.urlInterpolationService.getStaticImageUrl(
      '/avatar/oppia_avatar_large_100px.svg'
    );
  }

  copyCertificateUrl(): void {
    this.clipboard.copy(this.certificateUrl);
  }

  get certificateActionMessage(): string {
    return this.action === CERTIFICATE_OFFERING_RESULT_ACTIONS.CREATED
      ? 'has been created.'
      : 'has been updated.';
  }

  dismiss(): void {
    this.ngbActiveModal.dismiss();
  }
}
