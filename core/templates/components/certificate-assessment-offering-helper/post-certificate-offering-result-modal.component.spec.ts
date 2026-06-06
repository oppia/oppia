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

describe('Post certificate offering result modal component', () => {
  let component: PostCertificateOfferingResultModalComponent;
  let ngbActiveModal: jasmine.SpyObj<NgbActiveModal>;

  beforeEach(() => {
    ngbActiveModal = jasmine.createSpyObj('NgbActiveModal', ['dismiss']);
    component = new PostCertificateOfferingResultModalComponent(ngbActiveModal);
  });

  it('should expose created copy by default', () => {
    expect(component.modalTitle).toBe('Certificate Created');
    expect(component.bodyText).toContain('created successfully');
  });

  it('should expose updated copy when configured', () => {
    component.action = 'updated';

    expect(component.modalTitle).toBe('Certificate Updated');
    expect(component.bodyText).toContain('updated successfully');
  });

  it('should dismiss on cancel', () => {
    component.cancel();

    expect(ngbActiveModal.dismiss).toHaveBeenCalled();
  });
});
