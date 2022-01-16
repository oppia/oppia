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
 * @fileoverview Unit tests for skill editor save modal.
 */

import { ChangeDetectorRef, NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { SkillEditorSaveModalComponent } from './skill-editor-save-modal.component';

class MockChangeDetectorRef {
  detectChanges(): void {}
}

describe('Skill editor save modal component', () => {
  let fixture: ComponentFixture<SkillEditorSaveModalComponent>;
  let componentInstance: SkillEditorSaveModalComponent;
  let changeDetectorRef: MockChangeDetectorRef = new MockChangeDetectorRef();

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        SkillEditorSaveModalComponent
      ],
      providers: [
        NgbActiveModal,
        {
          provide: ChangeDetectorRef,
          useValue: changeDetectorRef
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SkillEditorSaveModalComponent);
    componentInstance = fixture.componentInstance;
    changeDetectorRef = TestBed.inject(ChangeDetectorRef);
  });

  // This component have no more frontend tests as it inherits the
  // ConfirmOrCancelModalComponent and doesn't have any additional
  // functionality. Please see the ConfirmOrCancelModalComponent for more tests.
  it('should create', () => {
    expect(componentInstance).toBeDefined();
  });

  it('should not disable button if user enters text in textarea', () => {
    spyOn(changeDetectorRef, 'detectChanges').and.callThrough();

    componentInstance.updateSaveDraftButton();

    expect(changeDetectorRef.detectChanges).toHaveBeenCalledTimes(0);
  });
});
