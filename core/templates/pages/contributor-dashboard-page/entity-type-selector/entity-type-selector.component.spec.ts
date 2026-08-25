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
import {AppConstants} from 'app.constants';
import {ContributorDashboardConstants} from 'pages/contributor-dashboard-page/contributor-dashboard-page.constants';

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

  it('should offer one option per selectable content type', () => {
    expect(component.entityTypeOptions).toEqual([
      {
        id: ContributorDashboardConstants.ENTITY_TYPE_SENTINEL_ALL,
        label: 'All',
      },
      {id: AppConstants.ENTITY_TYPE.EXPLORATION, label: 'Lessons'},
      {id: AppConstants.ENTITY_TYPE.SKILL, label: 'Skills'},
    ]);
  });

  it('should default to all and report that to the parent when no entity type is provided', () => {
    spyOn(component.setActiveEntityType, 'emit');
    component.activeEntityType = '';

    component.ngOnInit();

    expect(component.activeEntityType).toBe(
      ContributorDashboardConstants.ENTITY_TYPE_SENTINEL_ALL
    );
    expect(component.setActiveEntityType.emit).toHaveBeenCalledWith(
      ContributorDashboardConstants.ENTITY_TYPE_SENTINEL_ALL
    );
  });

  it('should keep the provided entity type on init', () => {
    spyOn(component.setActiveEntityType, 'emit');
    component.activeEntityType = AppConstants.ENTITY_TYPE.SKILL;

    component.ngOnInit();

    expect(component.activeEntityType).toBe(AppConstants.ENTITY_TYPE.SKILL);
    expect(component.setActiveEntityType.emit).toHaveBeenCalledWith(
      AppConstants.ENTITY_TYPE.SKILL
    );
  });

  it('should toggle dropdown visibility', () => {
    expect(component.dropdownShown).toBeFalse();

    component.toggleDropdown();
    expect(component.dropdownShown).toBeTrue();

    component.toggleDropdown();
    expect(component.dropdownShown).toBeFalse();
  });

  it('should select an option, emit it and close the dropdown', () => {
    spyOn(component.setActiveEntityType, 'emit');
    component.activeEntityType =
      ContributorDashboardConstants.ENTITY_TYPE_SENTINEL_ALL;
    component.dropdownShown = true;

    component.selectOption(AppConstants.ENTITY_TYPE.SKILL);

    expect(component.activeEntityType).toBe(AppConstants.ENTITY_TYPE.SKILL);
    expect(component.setActiveEntityType.emit).toHaveBeenCalledWith(
      AppConstants.ENTITY_TYPE.SKILL
    );
    expect(component.dropdownShown).toBeFalse();
  });

  it('should return the label of the active entity type', () => {
    component.activeEntityType =
      ContributorDashboardConstants.ENTITY_TYPE_SENTINEL_ALL;
    expect(component.getActiveEntityTypeLabel()).toBe('All');

    component.activeEntityType = AppConstants.ENTITY_TYPE.EXPLORATION;
    expect(component.getActiveEntityTypeLabel()).toBe('Lessons');

    component.activeEntityType = AppConstants.ENTITY_TYPE.SKILL;
    expect(component.getActiveEntityTypeLabel()).toBe('Skills');

    // An entity type with no option of its own falls back to the "All" label
    // rather than showing an empty selector.
    component.activeEntityType = AppConstants.ENTITY_TYPE.TOPIC;
    expect(component.getActiveEntityTypeLabel()).toBe('All');
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
