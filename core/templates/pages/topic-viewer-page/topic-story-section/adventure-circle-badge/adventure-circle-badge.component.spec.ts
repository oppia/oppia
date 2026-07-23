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
 * @fileoverview Unit tests for AdventureCircleBadgeComponent.
 */

import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';

import {AdventureCircleBadgeComponent} from './adventure-circle-badge.component';

describe('AdventureCircleBadgeComponent', () => {
  let component: AdventureCircleBadgeComponent;
  let fixture: ComponentFixture<AdventureCircleBadgeComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [AdventureCircleBadgeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AdventureCircleBadgeComponent);
    component = fixture.componentInstance;
  }));

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should return default circle class when size is md', () => {
    component.size = 'md';

    expect(component.circleClass).toBe('adventure-circle-badge');
  });

  it('should return compact circle class when size is sm', () => {
    component.size = 'sm';

    expect(component.circleClass).toBe(
      'adventure-circle-badge adventure-circle-badge--sm'
    );
  });
});
