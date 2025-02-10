// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the translation topic selector component.
 */

import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {
  TranslationTopicSelectorComponent,
  // eslint-disable-next-line max-len
} from 'pages/contributor-dashboard-page/translation-topic-selector/translation-topic-selector.component';
import {
  ContributionOpportunitiesBackendApiService,
  // eslint-disable-next-line max-len
} from 'pages/contributor-dashboard-page/services/contribution-opportunities-backend-api.service';

describe('Translation language selector', () => {
  let component: TranslationTopicSelectorComponent;
  let fixture: ComponentFixture<TranslationTopicSelectorComponent>;

  const topicsPerClassroomBackendDict = [
    {classroom: 'Class 1', topics: ['Topic 1', 'Topic 2']},
    {classroom: 'Class 2', topics: ['Topic 3']},
    {classroom: '', topics: ['All', 'Topic 4']},
  ];

  let contributionOpportunitiesBackendApiServiceStub: Partial<ContributionOpportunitiesBackendApiService> =
    {
      fetchTranslatableTopicNamesPerClassroomAsync: async () =>
        Promise.resolve(topicsPerClassroomBackendDict),
    };

  let clickDropdown: () => void;
  let getDropdownOptionsContainer: () => HTMLElement;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [TranslationTopicSelectorComponent],
      providers: [
        {
          provide: ContributionOpportunitiesBackendApiService,
          useValue: contributionOpportunitiesBackendApiServiceStub,
        },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TranslationTopicSelectorComponent);
    component = fixture.componentInstance;
    component.activeTopicName = 'All';
    fixture.detectChanges();
  });

  beforeEach(() => {
    clickDropdown = () => {
      fixture.debugElement.nativeElement
        .querySelector('.oppia-translation-topic-selector-inner-container')
        .click();
      fixture.detectChanges();
    };

    getDropdownOptionsContainer = () => {
      return fixture.debugElement.nativeElement.querySelector(
        '.oppia-translation-topic-selector-dropdown-container'
      );
    };
  });

  it('should correctly initialize dropdown activeTopicName', () => {
    const dropdown = fixture.nativeElement.querySelector(
      '.oppia-translation-topic-selector-inner-container'
    );

    expect(dropdown.firstChild.textContent.trim()).toBe('All');
  });

  it('should correctly display topics organized by classroom', async () => {
    await fixture.whenStable();
    expect(component.topicsPerClassroomMap).toBeTruthy();

    clickDropdown();
    expect(component.dropdownShown).toBe(true);

    const classroomLabels = fixture.debugElement.nativeElement.querySelectorAll(
      '.oppia-translation-topic-selector-dropdown-label'
    );

    // Only Class 1 and Class 2 should have labels.
    expect(classroomLabels.length).toBe(2);
    expect(classroomLabels[0].textContent).toBe('Class 1');
    expect(classroomLabels[1].textContent).toBe('Class 2');

    const allOptions = fixture.debugElement.nativeElement.querySelectorAll(
      '.oppia-translation-topic-selector-dropdown-option'
    );

    // Total topics across all classrooms.
    expect(allOptions.length).toBe(5);
  });

  it('should correctly show and hide the dropdown', () => {
    expect(component.dropdownShown).toBe(false);
    expect(getDropdownOptionsContainer()).toBeFalsy();

    clickDropdown();
    expect(component.dropdownShown).toBe(true);
    expect(getDropdownOptionsContainer()).toBeTruthy();

    clickDropdown();
    expect(component.dropdownShown).toBe(false);
    expect(getDropdownOptionsContainer()).toBeFalsy();

    clickDropdown();
    expect(component.dropdownShown).toBe(true);
    expect(getDropdownOptionsContainer()).toBeTruthy();

    let fakeClickAwayEvent = new MouseEvent('click');
    Object.defineProperty(fakeClickAwayEvent, 'target', {
      value: document.createElement('div'),
    });
    component.onDocumentClick(fakeClickAwayEvent);
    fixture.detectChanges();
    expect(component.dropdownShown).toBe(false);
    expect(getDropdownOptionsContainer()).toBeFalsy();
  });

  it('should correctly select and indicate selection of an option', () => {
    spyOn(component.setActiveTopicName, 'emit');

    component.selectOption('Topic 1');
    fixture.detectChanges();

    expect(component.setActiveTopicName.emit).toHaveBeenCalledWith('Topic 1');
  });
});
