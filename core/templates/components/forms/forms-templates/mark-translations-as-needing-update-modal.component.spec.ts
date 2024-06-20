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

import {NO_ERRORS_SCHEMA} from '@angular/core';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {ComponentFixture, waitForAsync, TestBed} from '@angular/core/testing';
import {
  NgbActiveModal,
  NgbModal,
  NgbModalRef,
} from '@ng-bootstrap/ng-bootstrap';
import {MarkTranslationsAsNeedingUpdateModalComponent} from './mark-translations-as-needing-update-modal.component';
import {PlatformFeatureService} from 'services/platform-feature.service';
import {ModifyTranslationsModalComponent} from '../../../pages/exploration-editor-page/modal-templates/exploration-modify-translations-modal.component';

class MockActiveModal {
  close(): void {
    return;
  }

  dismiss(): void {
    return;
  }
}

class MockPlatformFeatureService {
  status = {
    ExplorationEditorCanModifyTranslations: {
      isEnabled: false,
    },
  };
}

export class MockNgbModalRef {
  componentInstance = {
    contentId: null,
  };
}

describe('Mark Translations As Needing Update Modal Component', () => {
  let component: MarkTranslationsAsNeedingUpdateModalComponent;
  let fixture: ComponentFixture<MarkTranslationsAsNeedingUpdateModalComponent>;
  let ngbActiveModal: NgbActiveModal;
  let ngbModal: NgbModal;
  let mockPlatformFeatureService = new MockPlatformFeatureService();
  let ngbModalRef: MockNgbModalRef = new MockNgbModalRef();

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [MarkTranslationsAsNeedingUpdateModalComponent],
      providers: [
        {
          provide: NgbActiveModal,
          useClass: MockActiveModal,
        },
        {
          provide: PlatformFeatureService,
          useValue: mockPlatformFeatureService,
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(
      MarkTranslationsAsNeedingUpdateModalComponent
    );
    component = fixture.componentInstance;
    fixture.detectChanges();

    ngbActiveModal = TestBed.inject(NgbActiveModal);
    ngbModal = TestBed.inject(NgbModal);
  }));

  it('should check whether component is initialized', () => {
    expect(component).toBeDefined();
  });

  it('should check feature flag when initialized', () => {
    mockPlatformFeatureService.status.ExplorationEditorCanModifyTranslations.isEnabled =
      true;
    expect(component.modifyTranslationsFeatureFlagIsEnabled).toBeFalse();

    component.ngOnInit();

    expect(component.modifyTranslationsFeatureFlagIsEnabled).toBeTrue();
  });

  it('should call markNeedingUpdateHandler', () => {
    const handlerWithSpy = jasmine.createSpy();
    component.markNeedsUpdateHandler = handlerWithSpy;
    component.contentId = 'contentId_1';

    component.markNeedsUpdate();

    expect(handlerWithSpy).toHaveBeenCalledOnceWith('contentId_1');
  });

  it('should open the ModifyTranslations modal', () => {
    component.contentId = 'content0';
    const modalSpy = spyOn(ngbModal, 'open').and.returnValue(
      ngbModalRef as NgbModalRef
    );

    component.openModifyTranslationsModal();

    expect(modalSpy).toHaveBeenCalledWith(ModifyTranslationsModalComponent, {
      backdrop: 'static',
      windowClass: 'oppia-modify-translations-modal',
    });
    expect(ngbModalRef.componentInstance.contentId).toBe('content0');
  });

  it('should call removeTranslations', () => {
    const handlerWithSpy = jasmine.createSpy();
    component.removeHandler = handlerWithSpy;
    component.contentId = 'contentId_1';

    component.removeTranslations();

    expect(handlerWithSpy).toHaveBeenCalledOnceWith('contentId_1');
  });

  it('should dismiss the modal when cancel is called', () => {
    const dismissSpy = spyOn(ngbActiveModal, 'dismiss');
    component.cancel();

    expect(dismissSpy).toHaveBeenCalled();
  });
});
