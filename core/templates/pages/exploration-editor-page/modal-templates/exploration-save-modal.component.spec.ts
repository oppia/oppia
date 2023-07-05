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

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, waitForAsync, TestBed } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ExplorationSaveModalComponent } from './exploration-save-modal.component';

class MockActiveModal {
  close(): void {
    return;
  }

  dismiss(): void {
    return;
  }
}

describe('Exploration Save Modal component', () => {
  let component: ExplorationSaveModalComponent;
  let fixture: ComponentFixture<ExplorationSaveModalComponent>;
  let isExplorationPrivate = true;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        ExplorationSaveModalComponent
      ],
      providers: [
        {
          provide: NgbActiveModal,
          useClass: MockActiveModal
        },
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ExplorationSaveModalComponent);
    component = fixture.componentInstance;

    // This throws "Argument of type 'null' is not assignable to parameter of
    // type 'DiffNodeData'." We need to suppress this error because of the need
    // to test validations. This error is thrown because the diffData is null
    // when the component is initialized.
    // @ts-ignore
    component.diffData = null;
    component.isExplorationPrivate = isExplorationPrivate;

    fixture.detectChanges();
  });

  it('should initialize component properties after component is initialized',
    () => {
      expect(component.showDiff).toBe(false);
      expect(component.diffData).toBe(null);
      expect(component.isExplorationPrivate).toBe(isExplorationPrivate);
      expect(component.earlierVersionHeader).toBe('Last saved');
      expect(component.laterVersionHeader).toBe('New changes');
    });

  it('should toggle exploration diff visibility when clicking on toggle diff' +
    ' button', () => {
    expect(component.showDiff).toBe(false);
    component.onClickToggleDiffButton();
    expect(component.showDiff).toBe(true);
    component.onClickToggleDiffButton();
    expect(component.showDiff).toBe(false);
  });
});
