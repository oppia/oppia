// Copyright 2026 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the new correctness footer component.
 */

import {NO_ERRORS_SCHEMA} from '@angular/core';
import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {MockTranslatePipe} from 'tests/unit-test-utils';
import {NewEndChapterConfettiComponent} from '../conversation-display-components/new-end-chapter-confetti.component';
import {NewCorrectnessFooterComponent} from './new-correctness-footer.component';

describe('NewCorrectnessFooterComponent', () => {
  let component: NewCorrectnessFooterComponent;
  let fixture: ComponentFixture<NewCorrectnessFooterComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [NewCorrectnessFooterComponent, MockTranslatePipe],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NewCorrectnessFooterComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeDefined();
  });

  it('should animate the confetti after the view is initialized', () => {
    const animateConfettiSpy = jasmine.createSpy('animateConfetti');
    component.answerConfetti = {
      animateConfetti: animateConfettiSpy,
    } as unknown as NewEndChapterConfettiComponent;

    component.ngAfterViewInit();

    expect(animateConfettiSpy).toHaveBeenCalledTimes(1);
  });
});
