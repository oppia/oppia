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

import { ElementRef } from '@angular/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { SharedPipesModule } from 'filters/shared-pipes.module';
import { FocusManagerService } from 'services/stateful/focus-manager.service';
import { PlayerPositionService } from '../services/player-position.service';
import { FlagExplorationModalComponent } from './flag-exploration-modal.component';
import { MockTranslatePipe } from 'tests/unit-test-utils';

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
      imports: [
        HttpClientTestingModule,
        SharedPipesModule,
        FormsModule
      ],
      declarations: [
        FlagExplorationModalComponent,
        MockTranslatePipe
      ],
      providers: [
        NgbActiveModal,
        FocusManagerService,
        {
          provide: PlayerPositionService,
          useClass: MockPlayerPositionService
        }
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FlagExplorationModalComponent);
    component = fixture.component;
    focusManagerService = TestBed.inject(FocusManagerService);
    ngbActiveModal = TestBed.inject(NgbActiveModal);
  });

  it('should create', () => {
    expect(component).toBeDefined();
    expect(component.stateName).toEqual(stateName);
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
      state: stateName
    });
  });

  it('should handle tab key press for first radio', () => {
    const mockSecondRadio = new ElementRef(document.createElement('input'));
    const mockThirdRadio = new ElementRef(document.createElement('input'));
    const event = new KeyboardEvent('keydown', { key: 'Tab' });

    component.secondRadio = mockSecondRadio;
    component.thirdRadio = mockThirdRadio;

    spyOn(component.secondRadio.nativeElement, 'focus');
    spyOn(component.thirdRadio.nativeElement, 'focus');

    component.handleTabForFirstRadio(event);

    expect(component.secondRadio.nativeElement.focus)
      .toHaveBeenCalled();
    expect(component.thirdRadio.nativeElement.focus)
      .not.toHaveBeenCalled();
  });

  it('should handle tab key press for second radio', () => {
    const mockFirstRadio = new ElementRef(document.createElement('input'));
    const mockThirdRadio = new ElementRef(document.createElement('input'));
    const event = new KeyboardEvent('keydown', { key: 'Tab' });

    component.firstRadio = mockFirstRadio;
    component.thirdRadio = mockThirdRadio;

    spyOn(component.firstRadio.nativeElement, 'focus');
    spyOn(component.thirdRadio.nativeElement, 'focus');

    component.handleTabForSecondRadio(event);

    expect(component.firstRadio.nativeElement.focus)
      .not.toHaveBeenCalled();
    expect(component.thirdRadio.nativeElement.focus)
      .toHaveBeenCalled();
  });

  it('should handle shift+tab key press for second radio', () => {
    const mockFirstRadio = new ElementRef(document.createElement('input'));
    const mockThirdRadio = new ElementRef(document.createElement('input'));
    const event = new KeyboardEvent(
      'keydown', { key: 'Tab', shiftKey: true });

    component.firstRadio = mockFirstRadio;
    component.thirdRadio = mockThirdRadio;

    spyOn(component.firstRadio.nativeElement, 'focus');
    spyOn(component.thirdRadio.nativeElement, 'focus');

    component.handleTabForSecondRadio(event);

    expect(component.firstRadio.nativeElement.focus)
      .toHaveBeenCalled();
    expect(component.thirdRadio.nativeElement.focus)
      .not.toHaveBeenCalled();
  });

  it('should handle shift+tab key press for third radio', () => {
    const mockFirstRadio = new ElementRef(document.createElement('input'));
    const mockSecondRadio = new ElementRef(document.createElement('input'));
    const event = new KeyboardEvent(
      'keydown', { key: 'Tab', shiftKey: true });

    component.firstRadio = mockFirstRadio;
    component.secondRadio = mockSecondRadio;

    spyOn(component.firstRadio.nativeElement, 'focus');
    spyOn(component.secondRadio.nativeElement, 'focus');

    component.handleTabForThirdRadio(event);

    expect(component.firstRadio.nativeElement.focus)
      .not.toHaveBeenCalled();
    expect(component.secondRadio.nativeElement.focus)
      .toHaveBeenCalled();
  });
});
