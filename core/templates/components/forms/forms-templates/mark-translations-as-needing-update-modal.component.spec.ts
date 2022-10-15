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
 * @fileoverview Unit Test for Mark Audio As Needing Update Modal Component.
 */

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, waitForAsync, TestBed } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ChangeListService } from 'pages/exploration-editor-page/services/change-list.service';
import { MarkTranslationsAsNeedingUpdateModalComponent } from './mark-translations-as-needing-update-modal.component';

class MockActiveModal {
  close(): void {
    return;
  }

  dismiss(): void {
    return;
  }
}

describe('Mark Translations As Needing Update Modal Component', () => {
  let component: MarkTranslationsAsNeedingUpdateModalComponent;
  let fixture: (
        ComponentFixture<MarkTranslationsAsNeedingUpdateModalComponent>);
  let changeListService: ChangeListService;
  let ngbActiveModal: NgbActiveModal;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [
        MarkTranslationsAsNeedingUpdateModalComponent
      ],
      providers: [{
        provide: NgbActiveModal,
        useClass: MockActiveModal
      }],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(
      MarkTranslationsAsNeedingUpdateModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    changeListService = TestBed.inject(ChangeListService);
    ngbActiveModal = TestBed.inject(NgbActiveModal);
  }));

  it('should check whether component is initialized', () => {
    expect(component).toBeDefined();
  });

  it('should call markTranslationsAsNeedingUpdate', () => {
    const changeListSpy = spyOn(
      changeListService, 'markTranslationsAsNeedingUpdate'
    ).and.callThrough();
    component.markNeedsUpdate();

    expect(changeListSpy).toHaveBeenCalled();
  });

  it('should call removeTranslations', () => {
    const changeListSpy = spyOn(
      changeListService, 'removeTranslations'
    ).and.callThrough();
    component.removeTranslations();

    expect(changeListSpy).toHaveBeenCalled();
  });

  it('should dismiss the modal when cancel is called', () => {
    const dismissSpy = spyOn(ngbActiveModal, 'dismiss');
    component.cancel();

    expect(dismissSpy).toHaveBeenCalled();
  });
});
