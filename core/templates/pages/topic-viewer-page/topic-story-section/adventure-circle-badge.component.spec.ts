// Copyright 2026 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
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

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default input values', () => {
    expect(component.label).toBe('');
    expect(component.iconName).toBe('');
    expect(component.backgroundColor).toBe('#fff');
    expect(component.borderColor).toBe('#7f8c8d');
    expect(component.textColor).toBe('#334155');
    expect(component.size).toBe('md');
  });

  it('should return default class when size is md', () => {
    component.size = 'md';

    expect(component.circleClass).toBe('adventure-circle-badge');
  });

  it('should return small class when size is sm', () => {
    component.size = 'sm';

    expect(component.circleClass).toBe(
      'adventure-circle-badge adventure-circle-badge--sm'
    );
  });

  it('should update input properties', () => {
    component.label = '1';
    component.iconName = 'done';
    component.backgroundColor = '#000000';
    component.borderColor = '#111111';
    component.textColor = '#ffffff';
    component.size = 'sm';

    expect(component.label).toBe('1');
    expect(component.iconName).toBe('done');
    expect(component.backgroundColor).toBe('#000000');
    expect(component.borderColor).toBe('#111111');
    expect(component.textColor).toBe('#ffffff');
    expect(component.size).toBe('sm');
  });

  it('should update circleClass when size changes', () => {
    component.size = 'md';
    expect(component.circleClass).toBe('adventure-circle-badge');

    component.size = 'sm';
    expect(component.circleClass).toBe(
      'adventure-circle-badge adventure-circle-badge--sm'
    );
  });
});
