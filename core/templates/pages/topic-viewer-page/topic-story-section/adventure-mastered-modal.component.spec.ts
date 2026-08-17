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
 * @fileoverview Unit tests for AdventureMasteredModalComponent.
 */

import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';

import {MockTranslatePipe} from 'tests/unit-test-utils';

import {AdventureMasteredModalComponent} from './adventure-mastered-modal.component';

describe('AdventureMasteredModalComponent', () => {
  let component: AdventureMasteredModalComponent;
  let fixture: ComponentFixture<AdventureMasteredModalComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [AdventureMasteredModalComponent, MockTranslatePipe],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AdventureMasteredModalComponent);
    component = fixture.componentInstance;
    component.title = 'Adventure 1 mastered';
    component.message = 'You have completed all lessons in this adventure';
  });

  it('should emit continue when onContinue is called', () => {
    spyOn(component.continue, 'emit');

    component.onContinue();

    expect(component.continue.emit).toHaveBeenCalled();
  });

  it('should emit continue when Escape is pressed', () => {
    spyOn(component.continue, 'emit');

    component.onDocumentKeydown(new KeyboardEvent('keydown', {key: 'Escape'}));

    expect(component.continue.emit).toHaveBeenCalled();
  });

  it('should ignore non-Escape keys', () => {
    spyOn(component.continue, 'emit');

    component.onDocumentKeydown(new KeyboardEvent('keydown', {key: 'Enter'}));

    expect(component.continue.emit).not.toHaveBeenCalled();
  });
});
