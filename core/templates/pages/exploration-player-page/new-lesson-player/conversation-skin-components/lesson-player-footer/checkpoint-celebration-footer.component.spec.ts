// Copyright 2025 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for CheckpointCelebrationFooterComponent.
 */

import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import {NO_ERRORS_SCHEMA} from '@angular/core';

import {CheckpointCelebrationFooterComponent} from './checkpoint-celebration-footer.component';
import {NewEndChapterConfettiComponent} from '../conversation-display-components/new-end-chapter-confetti.component';

describe('CheckpointCelebrationFooterComponent', () => {
  let component: CheckpointCelebrationFooterComponent;
  let fixture: ComponentFixture<CheckpointCelebrationFooterComponent>;
  let mockConfettiComponent: jasmine.SpyObj<NewEndChapterConfettiComponent>;

  beforeEach(async () => {
    mockConfettiComponent = jasmine.createSpyObj(
      'NewEndChapterConfettiComponent',
      ['animateConfetti']
    );

    await TestBed.configureTestingModule({
      declarations: [CheckpointCelebrationFooterComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CheckpointCelebrationFooterComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have confettiComponent ViewChild defined', () => {
    component.confettiComponent = mockConfettiComponent;
    fixture.detectChanges();

    expect(component.confettiComponent).toBeDefined();
  });

  it('should call animateConfetti on confetti component after view init', fakeAsync(() => {
    component.confettiComponent = mockConfettiComponent;

    component.ngAfterViewInit();

    tick(0);

    expect(mockConfettiComponent.animateConfetti).toHaveBeenCalled();
  }));

  it('should call animateConfetti with setTimeout delay of 0', fakeAsync(() => {
    component.confettiComponent = mockConfettiComponent;
    spyOn(window, 'setTimeout').and.callThrough();

    component.ngAfterViewInit();

    expect(window.setTimeout).toHaveBeenCalledWith(jasmine.any(Function), 0);

    tick(0);
    expect(mockConfettiComponent.animateConfetti).toHaveBeenCalled();
  }));

  it('should ensure confetti animation is triggered asynchronously', fakeAsync(() => {
    component.confettiComponent = mockConfettiComponent;

    component.ngAfterViewInit();

    expect(mockConfettiComponent.animateConfetti).not.toHaveBeenCalled();

    tick(0);
    expect(mockConfettiComponent.animateConfetti).toHaveBeenCalledTimes(1);
  }));

  it('should work correctly when called multiple times', fakeAsync(() => {
    component.confettiComponent = mockConfettiComponent;

    component.ngAfterViewInit();
    component.ngAfterViewInit();

    tick(0);

    expect(mockConfettiComponent.animateConfetti).toHaveBeenCalledTimes(2);
  }));
});
