// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for ExplorationSaveModalcomponent.
 */

import {NO_ERRORS_SCHEMA} from '@angular/core';
import {
  ComponentFixture,
  waitForAsync,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import {
  NgbActiveModal,
  NgbModal,
  NgbModalRef,
} from '@ng-bootstrap/ng-bootstrap';
import {ExplorationSaveModalComponent} from './exploration-save-modal.component';
import {PlatformFeatureService} from 'services/platform-feature.service';

class MockActiveModal {
  close(): void {
    return;
  }

  dismiss(): void {
    return;
  }
}

class MockNgbModalRef {
  componentInstance = {
    showingTranslationChanges: false,
    headers: {
      leftPane: null,
      rightPane: null,
    },
  };
  result = Promise.resolve();
}

class MockPlatformFeatureService {
  status = {
    ExplorationEditorCanModifyTranslations: {
      isEnabled: true,
    },
  };
}

describe('Exploration Save Modal component', () => {
  let component: ExplorationSaveModalComponent;
  let fixture: ComponentFixture<ExplorationSaveModalComponent>;
  let isExplorationPrivate = true;
  let ngbModal: NgbModal;
  let ngbModalRef: MockNgbModalRef = new MockNgbModalRef();

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ExplorationSaveModalComponent],
      providers: [
        {
          provide: NgbActiveModal,
          useClass: MockActiveModal,
        },
        {
          provide: PlatformFeatureService,
          useClass: MockPlatformFeatureService,
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ExplorationSaveModalComponent);
    component = fixture.componentInstance;
    ngbModal = TestBed.inject(NgbModal);

    // This throws "Argument of type 'null' is not assignable to parameter of
    // type 'DiffNodeData'." We need to suppress this error because of the need
    // to test validations. This error is thrown because the diffData is null
    // when the component is initialized.
    // @ts-ignore
    component.diffData = null;
    component.isExplorationPrivate = isExplorationPrivate;

    fixture.detectChanges();
  });

  it('should initialize component properties after component is initialized', () => {
    expect(component.showDiff).toBe(false);
    expect(component.diffData).toBe(null);
    expect(component.isExplorationPrivate).toBe(isExplorationPrivate);
    expect(component.earlierVersionHeader).toBe('Last saved');
    expect(component.laterVersionHeader).toBe('New changes');
  });

  it(
    'should toggle exploration diff visibility when clicking on toggle diff' +
      ' button',
    () => {
      expect(component.showDiff).toBe(false);
      component.onClickToggleDiffButton();
      expect(component.showDiff).toBe(true);
      component.onClickToggleDiffButton();
      expect(component.showDiff).toBe(false);
    }
  );

  it('should show state diff modal for translation changes', fakeAsync(() => {
    spyOn(ngbModal, 'open').and.returnValue(ngbModalRef as NgbModalRef);

    component.showStateDiffModalForTranslations();
    tick();

    expect(ngbModal.open).toHaveBeenCalled();
    expect(ngbModalRef.componentInstance.showingTranslationChanges).toBeTrue();
    expect(ngbModalRef.componentInstance.headers).toEqual({
      leftPane: 'Last saved',
      rightPane: 'New changes',
    });
  }));
});
