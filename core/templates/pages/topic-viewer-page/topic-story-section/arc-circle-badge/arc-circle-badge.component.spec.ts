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
 * @fileoverview Unit tests for ArcCircleBadgeComponent.
 */

import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';

import {ArcCircleBadgeComponent} from './arc-circle-badge.component';

describe('ArcCircleBadgeComponent', () => {
  let component: ArcCircleBadgeComponent;
  let fixture: ComponentFixture<ArcCircleBadgeComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ArcCircleBadgeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ArcCircleBadgeComponent);
    component = fixture.componentInstance;
  }));

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should return default circle class when size is md', () => {
    component.size = 'md';

    expect(component.circleClass).toBe('arc-circle-badge');
  });

  it('should return compact circle class when size is sm', () => {
    component.size = 'sm';

    expect(component.circleClass).toBe('arc-circle-badge arc-circle-badge--sm');
  });
});
