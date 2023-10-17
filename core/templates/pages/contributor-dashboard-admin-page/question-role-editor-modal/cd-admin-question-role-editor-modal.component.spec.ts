// Copyright 2023 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for CdAdminQuestionRoleEditorModal.
 */

import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { CdAdminQuestionRoleEditorModal } from './cd-admin-question-role-editor-modal.component';
import { LoadingDotsComponent } from '../../../components/common-layout-directives/common-elements/loading-dots.component';

describe('CdAdminQuestionRoleEditorModal', () => {
  let component: CdAdminQuestionRoleEditorModal;
  let fixture: ComponentFixture<CdAdminQuestionRoleEditorModal>;
  let ngbActiveModal: NgbActiveModal;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        FormsModule,
        HttpClientTestingModule
      ],
      declarations: [
        CdAdminQuestionRoleEditorModal,
        LoadingDotsComponent
      ],
      providers: [
        NgbActiveModal
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(
      CdAdminQuestionRoleEditorModal);
    component = fixture.componentInstance;
    ngbActiveModal = TestBed.get(NgbActiveModal);
    fixture.detectChanges();
    component.ngOnInit();
  });

  it('should properly initialize rights', () => {
    component.rights = {
      isQuestionSubmitter: true,
      isQuestionReviewer: false
    };

    fixture.detectChanges();
    component.ngOnInit();

    expect(component.rights.isQuestionSubmitter).toBeTrue();
    expect(component.rights.isQuestionReviewer).toBeFalse();
  });

  it('should properly toggle Question Submitter checkbox', () => {
    component.rights = {
      isQuestionSubmitter: true,
      isQuestionReviewer: false
    };
    fixture.detectChanges();
    component.ngOnInit();

    component.toggleQuestionSubmitter();

    expect(component.rights.isQuestionSubmitter).toBeFalse();
  });

  it('should properly toggle Question reviewer checkbox', () => {
    component.rights = {
      isQuestionSubmitter: true,
      isQuestionReviewer: false
    };
    fixture.detectChanges();
    component.ngOnInit();

    component.toggleQuestionReviewer();

    expect(component.rights.isQuestionSubmitter).toBeTrue();
  });

  it('should save and close modal and return selected rights', () => {
    component.rights = {
      isQuestionSubmitter: true,
      isQuestionReviewer: false
    };
    const modalCloseSpy = spyOn(ngbActiveModal, 'close').and.callThrough();

    component.saveAndClose();

    expect(modalCloseSpy).toHaveBeenCalledWith(component.rights);
  });

  it('should close modal without returning anything', () => {
    component.rights = {
      isQuestionSubmitter: true,
      isQuestionReviewer: false
    };
    const modalCloseSpy = spyOn(ngbActiveModal, 'dismiss').and.callThrough();

    component.close();

    expect(modalCloseSpy).toHaveBeenCalled();
  });
});
