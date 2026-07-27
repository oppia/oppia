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
import {By} from '@angular/platform-browser';

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

  it('should render icon when iconName is provided', () => {
    component.iconName = 'school';
    component.label = '';
    fixture.detectChanges();

    const iconEl = fixture.debugElement.query(By.css('i.material-icons'));
    expect(iconEl).toBeTruthy();
    expect(iconEl.nativeElement.textContent.trim()).toBe('school');

    const labelEl = fixture.debugElement.query(
      By.css('.adventure-circle-badge-label')
    );
    expect(labelEl).toBeNull();
  });

  it('should render label text when iconName is not provided', () => {
    component.iconName = '';
    component.label = '5';
    fixture.detectChanges();

    const labelEl = fixture.debugElement.query(
      By.css('.adventure-circle-badge-label')
    );
    expect(labelEl).toBeTruthy();
    expect(labelEl.nativeElement.textContent.trim()).toBe('5');

    const iconEl = fixture.debugElement.query(By.css('i.material-icons'));
    expect(iconEl).toBeNull();
  });

  it('should apply ngStyle dynamic colors to the badge', () => {
    component.backgroundColor = '#ff0000';
    component.borderColor = '#00ff00';
    component.textColor = '#0000ff';
    fixture.detectChanges();

    const badgeEl = fixture.debugElement.query(
      By.css('.adventure-circle-badge')
    );
    const styles = badgeEl.nativeElement.style;
    expect(styles.backgroundColor).toBe('rgb(255, 0, 0)');
    expect(styles.borderColor).toBe('rgb(0, 255, 0)');
    expect(styles.color).toBe('rgb(0, 0, 255)');
  });

  it('should set aria-label to label when label is provided', () => {
    component.label = '3';
    component.iconName = '';
    fixture.detectChanges();

    const badgeEl = fixture.debugElement.query(
      By.css('.adventure-circle-badge')
    );
    expect(badgeEl.nativeElement.getAttribute('aria-label')).toBe('3');
  });

  it('should set aria-label to iconName when label is empty', () => {
    component.label = '';
    component.iconName = 'star';
    fixture.detectChanges();

    const badgeEl = fixture.debugElement.query(
      By.css('.adventure-circle-badge')
    );
    expect(badgeEl.nativeElement.getAttribute('aria-label')).toBe('star');
  });

  it('should apply sm size class to the rendered element', () => {
    component.size = 'sm';
    fixture.detectChanges();

    const badgeEl = fixture.debugElement.query(
      By.css('.adventure-circle-badge')
    );
    expect(badgeEl.nativeElement.classList).toContain(
      'adventure-circle-badge--sm'
    );
  });

  it('should not apply sm size class when size is md', () => {
    component.size = 'md';
    fixture.detectChanges();

    const badgeEl = fixture.debugElement.query(
      By.css('.adventure-circle-badge')
    );
    expect(badgeEl.nativeElement.classList).not.toContain(
      'adventure-circle-badge--sm'
    );
  });
});
