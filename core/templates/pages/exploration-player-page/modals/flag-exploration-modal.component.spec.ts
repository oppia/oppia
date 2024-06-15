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
 * @fileoverview Unit tests for FlagExplorationModalComponent.
 */

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {FormsModule} from '@angular/forms';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {SharedPipesModule} from 'filters/shared-pipes.module';
import {FocusManagerService} from 'services/stateful/focus-manager.service';
import {PlayerPositionService} from '../services/player-position.service';
import {FlagExplorationModalComponent} from './flag-exploration-modal.component';
import {MockTranslatePipe} from 'tests/unit-test-utils';

describe('Flag Exploration modal', () => {
  let component: FlagExplorationModalComponent;
  let fixture: ComponentFixture<FlagExplorationModalComponent>;
  let stateName: string = 'test_state';
  let focusManagerService: FocusManagerService;
  let ngbActiveModal: NgbActiveModal;

  class MockPlayerPositionService {
    getCurrentStateName(): string {
      return stateName;
    }
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, SharedPipesModule, FormsModule],
      declarations: [FlagExplorationModalComponent, MockTranslatePipe],
      providers: [
        NgbActiveModal,
        FocusManagerService,
        {
          provide: PlayerPositionService,
          useClass: MockPlayerPositionService,
        },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FlagExplorationModalComponent);
    component = fixture.componentInstance;
    focusManagerService = TestBed.inject(FocusManagerService);
    ngbActiveModal = TestBed.inject(NgbActiveModal);
  });

  it('should create', () => {
    expect(component).toBeDefined();
  });

  it('should show flag message textarea', () => {
    spyOn(focusManagerService, 'setFocus');
    component.showFlagMessageTextarea(true);
    expect(component.flagMessageTextareaIsShown).toBeTrue();
    expect(focusManagerService.setFocus).toHaveBeenCalled();
  });

  it('should submit report', () => {
    let flag = true;
    let flagMessageTextareaIsShown = true;
    spyOn(ngbActiveModal, 'close');
    component.flagMessageTextareaIsShown = flagMessageTextareaIsShown;
    component.flag = flag;
    component.submitReport();
    expect(ngbActiveModal.close).toHaveBeenCalledWith({
      report_type: flag,
      report_text: flagMessageTextareaIsShown,
      state: stateName,
    });
  });
});
