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
 * @fileoverview Unit tests for ModuleCircleBadgeComponent.
 */

import {TestBed, waitForAsync} from '@angular/core/testing';

import {ModuleCircleBadgeComponent} from './module-circle-badge.component';

describe('ModuleCircleBadgeComponent', () => {
  let component: ModuleCircleBadgeComponent;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ModuleCircleBadgeComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(ModuleCircleBadgeComponent);
    component = fixture.componentInstance;
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default input values', () => {
    expect(component.label).toBe('');
    expect(component.iconName).toBe('');
    expect(component.iconImageUrl).toBe('');
    expect(component.backgroundColor).toBe('#fff');
    expect(component.borderColor).toBe('#7f8c8d');
    expect(component.textColor).toBe('#334155');
    expect(component.size).toBe('md');
    expect(component.title).toBe('');
    expect(component.getAriaLabel()).toBe('');
    expect(component.getTooltipText()).toBe('');
  });

  it('should update circleClass when size changes', () => {
    component.size = 'md';
    expect(component.circleClass).toBe('module-circle-badge');

    component.size = 'sm';
    expect(component.circleClass).toBe(
      'module-circle-badge module-circle-badge--sm'
    );
  });

  it('should use the label for the aria label when present', () => {
    component.label = '1';
    component.iconName = 'check';

    expect(component.getAriaLabel()).toBe('1');
  });

  it('should fall back to the icon name for the aria label when no label is present', () => {
    component.label = '';
    component.iconName = 'done';

    expect(component.getAriaLabel()).toBe('done');
  });

  it('should use the explicit title for the tooltip', () => {
    component.title = 'Go to lesson 1';
    component.label = '1';
    component.iconName = 'check';

    expect(component.getTooltipText()).toBe('Go to lesson 1');
  });

  it('should fall back to the label for the tooltip when no title is provided', () => {
    component.title = '';
    component.label = '1';
    component.iconName = 'check';

    expect(component.getTooltipText()).toBe('1');
  });

  it('should fall back to the icon name for the tooltip when no title or label is provided', () => {
    component.title = '';
    component.label = '';
    component.iconName = 'done';

    expect(component.getTooltipText()).toBe('done');
  });

  it('should report the icon as shown when an icon name is provided', () => {
    component.iconName = 'check';
    component.label = '1';

    expect(component.hasIcon).toBeTrue();
    expect(component.getAriaLabel()).toBe('1');
  });

  it('should report the label as shown when no icon name is provided', () => {
    component.iconName = '';
    component.label = '1';

    expect(component.hasIcon).toBeFalse();
    expect(component.getAriaLabel()).toBe('1');
  });

  it('should use the icon image url when an icon image is provided', () => {
    component.iconImageUrl = '/assets/images/icons/practice_pencil.svg';

    expect(component.hasIcon).toBeTrue();
    expect(component.hasIconImage).toBeTrue();
  });

  it('should not use an icon image when none is provided', () => {
    component.iconImageUrl = '';

    expect(component.hasIconImage).toBeFalse();
  });
});
