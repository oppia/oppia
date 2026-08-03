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
 * @fileoverview Unit tests for EntityTypeSelectorComponent.
 */

import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {EntityTypeSelectorComponent} from './entity-type-selector.component';
import {ElementRef} from '@angular/core';

describe('EntityTypeSelectorComponent', () => {
  let component: EntityTypeSelectorComponent;
  let fixture: ComponentFixture<EntityTypeSelectorComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [EntityTypeSelectorComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EntityTypeSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should initialize activeEntityType to exploration if not provided', () => {
    component.activeEntityType = '';
    component.ngOnInit();
    expect(component.activeEntityType).toBe('exploration');
  });

  it('should toggle dropdown visibility', () => {
    expect(component.dropdownShown).toBeFalse();
    component.toggleDropdown();
    expect(component.dropdownShown).toBeTrue();
    component.toggleDropdown();
    expect(component.dropdownShown).toBeFalse();
  });

  it('should select an option and emit the event', () => {
    spyOn(component.setActiveEntityType, 'emit');
    component.selectOption('skill');
    expect(component.activeEntityType).toBe('skill');
    expect(component.setActiveEntityType.emit).toHaveBeenCalledWith('skill');
    expect(component.dropdownShown).toBeFalse();
  });

  it('should return correct label for active entity type', () => {
    component.activeEntityType = 'exploration';
    expect(component.getActiveEntityTypeLabel()).toBe('Lessons');

    component.activeEntityType = 'skill';
    expect(component.getActiveEntityTypeLabel()).toBe('Skills');

    component.activeEntityType = 'unknown';
    expect(component.getActiveEntityTypeLabel()).toBe('Lessons');
  });

  it('should close dropdown when clicking outside component', () => {
    component.dropdownShown = true;
    const dummyElement = document.createElement('div');
    component.dropdownRef = new ElementRef(document.createElement('div'));

    const event = new MouseEvent('click', {bubbles: true});
    Object.defineProperty(event, 'target', {value: dummyElement});

    component.onDocumentClick(event);
    expect(component.dropdownShown).toBeFalse();
  });

  it('should not close dropdown when clicking inside component', () => {
    component.dropdownShown = true;
    const insideElement = document.createElement('div');
    const container = document.createElement('div');
    container.appendChild(insideElement);
    component.dropdownRef = new ElementRef(container);

    const event = new MouseEvent('click', {bubbles: true});
    Object.defineProperty(event, 'target', {value: insideElement});

    component.onDocumentClick(event);
    expect(component.dropdownShown).toBeTrue();
  });
});
