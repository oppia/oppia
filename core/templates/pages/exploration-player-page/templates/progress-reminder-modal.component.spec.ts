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
 * @fileoverview Unit tests for the progress reminder modal component.
 */

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { MockTranslatePipe } from 'tests/unit-test-utils';
import { ProgressReminderModalComponent } from './progress-reminder-modal.component';
import { I18nLanguageCodeService } from 'services/i18n-language-code.service';

describe('Progress reminder modal component', () => {
  let fixture: ComponentFixture<ProgressReminderModalComponent>;
  let component: ProgressReminderModalComponent;
  let i18nLanguageCodeService: I18nLanguageCodeService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        ProgressReminderModalComponent,
        MockTranslatePipe
      ],
      providers: [
        NgbActiveModal,
        I18nLanguageCodeService
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProgressReminderModalComponent);
    component = fixture.componentInstance;
    i18nLanguageCodeService = TestBed.get(I18nLanguageCodeService);
  });

  it('should initialize the component', () => {
    component.checkpointCount = 4;
    component.completedCheckpointsCount = 2;

    component.ngOnInit();

    expect(component.checkpointStatusArray).toEqual(
      ['completed', 'completed', 'in-progress', 'incomplete']);
  });

  it('should determine if language is RTL', () => {
    const i18nSpy = spyOn(
      i18nLanguageCodeService, 'isLanguageRTL').and.returnValues(true);

    expect(component.isLanguageRTL()).toBe(true);

    i18nSpy.and.returnValue(false);

    expect(component.isLanguageRTL()).toBe(false);
  });

  it('should get completed progress-bar width', () => {
    component.checkpointCount = 3;
    component.completedCheckpointsCount = 0;

    expect(component.getCompletedProgressBarWidth()).toEqual(0);

    component.completedCheckpointsCount = 1;

    expect(component.getCompletedProgressBarWidth()).toEqual(25);

    component.completedCheckpointsCount = 2;

    expect(component.getCompletedProgressBarWidth()).toEqual(75);
  });

  it('should get progress in fractional form as a string', () => {
    component.checkpointCount = 3;
    component.completedCheckpointsCount = 0;

    expect(component.getProgressInFractionForm()).toEqual('0/3');

    component.completedCheckpointsCount = 1;

    expect(component.getProgressInFractionForm()).toEqual('1/3');

    component.completedCheckpointsCount = 2;

    expect(component.getProgressInFractionForm()).toEqual('2/3');
  });
});
