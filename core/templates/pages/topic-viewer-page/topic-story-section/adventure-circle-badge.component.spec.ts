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
    expect(component.title).toBe('');
  });

  it('should update circleClass when size changes', () => {
    component.size = 'md';
    expect(component.circleClass).toBe('adventure-circle-badge');

    component.size = 'sm';
    expect(component.circleClass).toBe(
      'adventure-circle-badge adventure-circle-badge--sm'
    );
  });

  it('should render the icon when an icon name is provided', () => {
    component.iconName = 'check';
    component.label = '1';
    fixture.detectChanges();

    const badgeElement = fixture.nativeElement.querySelector(
      '.adventure-circle-badge'
    );
    const iconElement = badgeElement.querySelector('i.material-icons');
    expect(iconElement.textContent.trim()).toBe('check');
    expect(
      badgeElement.querySelector('.adventure-circle-badge-label')
    ).toBeNull();
  });

  it('should render the label when no icon name is provided', () => {
    component.iconName = '';
    component.label = '1';
    fixture.detectChanges();

    const badgeElement = fixture.nativeElement.querySelector(
      '.adventure-circle-badge'
    );
    expect(
      badgeElement
        .querySelector('.adventure-circle-badge-label')
        .textContent.trim()
    ).toBe('1');
    expect(badgeElement.querySelector('i.material-icons')).toBeNull();
  });

  it('should use the explicit title for the tooltip', () => {
    component.title = 'Go to lesson 1';
    component.label = '1';
    component.iconName = '';
    fixture.detectChanges();

    const badgeElement = fixture.nativeElement.querySelector(
      '.adventure-circle-badge'
    );
    expect(badgeElement.getAttribute('title')).toBe('Go to lesson 1');
  });

  it('should fall back to the label for the tooltip when no title is provided', () => {
    component.title = '';
    component.label = '1';
    component.iconName = '';
    fixture.detectChanges();

    const badgeElement = fixture.nativeElement.querySelector(
      '.adventure-circle-badge'
    );
    expect(badgeElement.getAttribute('title')).toBe('1');
  });

  it('should fall back to the icon name for the tooltip when no title or label is provided', () => {
    component.title = '';
    component.label = '';
    component.iconName = 'done';
    fixture.detectChanges();

    const badgeElement = fixture.nativeElement.querySelector(
      '.adventure-circle-badge'
    );
    expect(badgeElement.getAttribute('title')).toBe('done');
  });
});
