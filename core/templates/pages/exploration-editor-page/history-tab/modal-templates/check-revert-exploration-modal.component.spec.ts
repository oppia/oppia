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
 * @fileoverview Unit tests for the CheckRevertExplorationModalComponent.
 */

import {EventEmitter} from '@angular/core';
import {ComponentFixture, waitForAsync, TestBed} from '@angular/core/testing';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';

import {CheckRevertService} from '../services/check-revert.service';
import {CheckRevertExplorationModalComponent} from './check-revert-exploration-modal.component';
import {LoadingDotsComponent} from 'components/common-layout-directives/common-elements/loading-dots.component';

class MockActiveModal {
  close(): void {
    return;
  }
}

describe('Check Revert Exploration Modal Component', function () {
  let component: CheckRevertExplorationModalComponent;
  let fixture: ComponentFixture<CheckRevertExplorationModalComponent>;
  let ngbActiveModal: NgbActiveModal;

  let mockDetailsEventEmitter = new EventEmitter();

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        CheckRevertExplorationModalComponent,
        LoadingDotsComponent,
      ],
      providers: [
        {
          provide: NgbActiveModal,
          useClass: MockActiveModal,
        },
        {
          provide: CheckRevertService,
          useValue: {
            detailsEventEmitter: mockDetailsEventEmitter,
          },
        },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CheckRevertExplorationModalComponent);
    component = fixture.componentInstance;
    component.version = '1';
    ngbActiveModal = TestBed.inject(NgbActiveModal);
  });

  it('should initialize properties after component is initialized', () => {
    expect(component.version).toBe('1');

    component.ngOnInit();
    mockDetailsEventEmitter.emit('details');

    expect(component.details).toBe('details');
  });

  it('should close', () => {
    spyOn(ngbActiveModal, 'close');

    component.close();

    expect(ngbActiveModal.close).toHaveBeenCalled();
  });
});
