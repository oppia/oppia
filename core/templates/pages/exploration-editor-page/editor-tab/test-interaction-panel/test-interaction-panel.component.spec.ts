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
 * @fileoverview Unit tests for testInteractionPanel.
 */

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, waitForAsync, TestBed } from '@angular/core/testing';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ExplorationStatesService } from 'pages/exploration-editor-page/services/exploration-states.service';
import { CurrentInteractionService } from 'pages/exploration-player-page/services/current-interaction.service';
import { TestInteractionPanel } from './test-interaction-panel.component';

class MockNgbModal {
  close() {
    return Promise.resolve();
  }
}

class MockExplorationStatesService {
  getState(item1: string) {
    return {
      interaction: {
        id: 'TextInput'
      }
    };
  }
}

describe('Test Interaction Panel Component', () => {
  let component: TestInteractionPanel;
  let fixture: ComponentFixture<TestInteractionPanel>;
  let currentInteractionService: CurrentInteractionService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        TestInteractionPanel
      ],
      providers: [
        {
          provide: NgbModal,
          useClass: MockNgbModal
        },
        {
          provide: ExplorationStatesService,
          useClass: MockExplorationStatesService
        },
        CurrentInteractionService
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TestInteractionPanel);
    component = fixture.componentInstance;

    currentInteractionService = TestBed.inject(CurrentInteractionService);

    fixture.detectChanges();
  });

  it('should initialize controller properties after its initialization',
    () => {
      spyOn(currentInteractionService, 'isSubmitButtonDisabled')
        .and.returnValue(false);

      component.stateName = 'TextInput';
      component.ngOnInit();
      let isSubmitButtonDisabled = component.isSubmitButtonDisabled();

      expect(component.interactionIsInline).toEqual(true);
      expect(isSubmitButtonDisabled).toEqual(false);
    });

  it('should submit answer when clicking on button', () => {
    spyOn(currentInteractionService, 'submitAnswer')
      .and.stub();

    component.stateName = 'TextInput';
    component.ngOnInit();
    component.onSubmitAnswerFromButton();

    expect(component.interactionIsInline).toEqual(true);
    expect(currentInteractionService.submitAnswer).toHaveBeenCalled();
  });
});
