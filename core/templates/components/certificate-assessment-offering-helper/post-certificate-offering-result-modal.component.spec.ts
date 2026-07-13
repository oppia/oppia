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
 * @fileoverview Unit tests for PostCertificateOfferingResultModalComponent.
 */

import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {PostCertificateOfferingResultModalComponent} from './post-certificate-offering-result-modal.component';
import {Clipboard} from '@angular/cdk/clipboard';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {CERTIFICATE_OFFERING_RESULT_ACTIONS} from 'domain/certificate-assessment/certificate-assessment-domain.constants';

describe('Post certificate offering result modal component', () => {
  let component: PostCertificateOfferingResultModalComponent;
  let ngbActiveModal: jasmine.SpyObj<NgbActiveModal>;
  let clipboard: jasmine.SpyObj<Clipboard>;
  let urlInterpolationService: jasmine.SpyObj<UrlInterpolationService>;

  beforeEach(() => {
    ngbActiveModal = jasmine.createSpyObj('NgbActiveModal', ['dismiss']);
    clipboard = jasmine.createSpyObj('Clipboard', ['copy']);
    urlInterpolationService = jasmine.createSpyObj('UrlInterpolationService', [
      'getStaticImageUrl',
    ]);
    urlInterpolationService.getStaticImageUrl.and.returnValue(
      '/avatar/oppia_avatar_large_100px.svg'
    );
    component = new PostCertificateOfferingResultModalComponent(
      ngbActiveModal,
      clipboard,
      urlInterpolationService
    );
  });

  it('should expose created state by default', () => {
    expect(component.action).toBe(CERTIFICATE_OFFERING_RESULT_ACTIONS.CREATED);
    expect(component.certificateName).toBe(
      'Everyday Arithmetic & Number Confidence'
    );
    expect(component.certificateUrl).toContain('/certificate-offering/');
    expect(component.getOppiaLargeAvatarUrl()).toBe(
      '/avatar/oppia_avatar_large_100px.svg'
    );
    expect(component.certificateActionMessage).toBe('has been created.');
  });

  it('should expose updated state when configured', () => {
    component.action = CERTIFICATE_OFFERING_RESULT_ACTIONS.UPDATED;

    expect(component.action).toBe(CERTIFICATE_OFFERING_RESULT_ACTIONS.UPDATED);
    expect(component.certificateActionMessage).toBe('has been updated.');
  });

  it('should copy the certificate url', () => {
    component.copyCertificateUrl();

    expect(clipboard.copy).toHaveBeenCalledWith(component.certificateUrl);
  });

  it('should dismiss the modal', () => {
    component.dismiss();

    expect(ngbActiveModal.dismiss).toHaveBeenCalled();
  });
});
