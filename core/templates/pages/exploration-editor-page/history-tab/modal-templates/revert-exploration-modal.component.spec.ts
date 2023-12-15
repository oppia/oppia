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
 * @fileoverview Unit tests for the RevertExplorationModalComponent.
 */

import { NO_ERRORS_SCHEMA, ElementRef } from '@angular/core';
import { ComponentFixture, waitForAsync, TestBed } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { ExplorationDataService } from 'pages/exploration-editor-page/services/exploration-data.service';
import { RevertExplorationModalComponent } from './revert-exploration-modal.component';

class MockActiveModal {
  close(): void {
    return;
  }

  dismiss(): void {
    return;
  }
}

class MockExplorationDataService {
  explorationId: string = 'exp1';
}

describe('Revert Exploration Modal Component', function() {
  let component: RevertExplorationModalComponent;
  let fixture: ComponentFixture<RevertExplorationModalComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        RevertExplorationModalComponent
      ],
      providers: [{
        provide: NgbActiveModal,
        useClass: MockActiveModal
      },
      {
        provide: ExplorationDataService,
        useClass: MockExplorationDataService
      }],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RevertExplorationModalComponent);
    component = fixture.componentInstance;

    TestBed.inject(NgbActiveModal);
    component.version = '1';
  });

  it('should initialize properties after component is initialized', () => {
    expect(component.version).toBe('1');
  });

  it('should get exploration url when exploration id is provided', () => {
    expect(component.getExplorationUrl('0')).toBe('/explore/exp1?v=0');
    expect(component.getExplorationUrl('1')).toBe('/explore/exp1?v=1');
  });

  it('should focus on modal header when the modal is finished loading', () => {
    const mockElementRef = new ElementRef(document.createElement('h3'));
    component.revertExplorationHeadingRef = mockElementRef;
    spyOn(component.revertExplorationHeadingRef.nativeElement, 'focus');

    component.ngAfterViewInit();

    expect(
      component.revertExplorationHeadingRef.nativeElement.focus
    ).toHaveBeenCalled();
  });
});
