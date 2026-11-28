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

  it('should render one decorative element for each confetti piece', () => {
    fixture.detectChanges();
    const stage = fixture.nativeElement.querySelector('.confetti-stage');
    const pieces = fixture.nativeElement.querySelectorAll('.confetti-piece');

    expect(component.confettiPieces.length).toBeGreaterThan(0);
    expect(pieces.length).toBe(component.confettiPieces.length);
    expect(stage.getAttribute('aria-hidden')).toBe('true');
  });

  it('should show the correct feedback', () => {
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector('.e2e-test-correct-feedback')
    ).not.toBeNull();
  });
});
