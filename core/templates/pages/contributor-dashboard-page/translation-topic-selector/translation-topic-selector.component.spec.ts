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

import {waitForAsync, ComponentFixture, TestBed} from '@angular/core/testing';

import {
  TranslationTopicSelectorComponent,
  // eslint-disable-next-line max-len
} from 'pages/contributor-dashboard-page/translation-topic-selector/translation-topic-selector.component';
import {
  ALL_TOPICS_OPTION,
  ContributionOpportunitiesBackendApiService,
  TranslatableTopicsPerClassroom,
  // eslint-disable-next-line max-len
} from 'pages/contributor-dashboard-page/services/contribution-opportunities-backend-api.service';
import {ContributorDashboardConstants} from 'pages/contributor-dashboard-page/contributor-dashboard-page.constants';

describe('Translation topic selector', () => {
  let component: TranslationTopicSelectorComponent;
  let fixture: ComponentFixture<TranslationTopicSelectorComponent>;

  const topicsPerClassroom: TranslatableTopicsPerClassroom[] = [
    {
      classroom: 'Class 1',
      topics: [
        {id: 'topic_id_1', name: 'Topic 1'},
        {id: 'topic_id_2', name: 'Topic 2'},
      ],
    },
    {classroom: 'Class 2', topics: [{id: 'topic_id_3', name: 'Topic 3'}]},
    {
      classroom: '',
      topics: [ALL_TOPICS_OPTION, {id: 'topic_id_4', name: 'Topic 4'}],
    },
  ];

  let contributionOpportunitiesBackendApiServiceStub: Partial<ContributionOpportunitiesBackendApiService> =
    {
      fetchTranslatableTopicsPerClassroomAsync: async () =>
        Promise.resolve(topicsPerClassroom),
    };

  let clickDropdown: () => void;
  let getDropdownOptionsContainer: () => HTMLElement;

  beforeEach(waitForAsync(() => {
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

  it('should initialize the active topic to "All" and emit it', () => {
    const newFixture = TestBed.createComponent(
      TranslationTopicSelectorComponent
    );
    const newComponent = newFixture.componentInstance;
    spyOn(newComponent.setActiveTopicId, 'emit');

    newFixture.detectChanges();

    expect(newComponent.activeTopicId).toBe(
      ContributorDashboardConstants.TOPIC_SENTINEL_ID_ALL
    );
    expect(newComponent.setActiveTopicId.emit).toHaveBeenCalledWith(
      ContributorDashboardConstants.TOPIC_SENTINEL_ID_ALL
    );
    const dropdown = newFixture.nativeElement.querySelector(
      '.oppia-translation-topic-selector-inner-container'
    );
    expect(dropdown.firstChild.textContent.trim()).toBe('All');
  });

  it('should display the name of the active topic', async () => {
    await fixture.whenStable();

    component.activeTopicId = 'topic_id_3';
    fixture.detectChanges();

    const dropdown = fixture.nativeElement.querySelector(
      '.oppia-translation-topic-selector-inner-container'
    );
    expect(dropdown.firstChild.textContent.trim()).toBe('Topic 3');
  });

  it('should display nothing for an unknown active topic ID', async () => {
    await fixture.whenStable();

    component.activeTopicId = 'unknown_topic_id';

    expect(component.getActiveTopicName()).toBe('');
  });

  it('should highlight the option for the active topic', async () => {
    await fixture.whenStable();
    component.activeTopicId = 'topic_id_2';
    clickDropdown();

    const selectedOptions = fixture.debugElement.nativeElement.querySelectorAll(
      '.oppia-translation-topic-selector-dropdown-option-selected'
    );
    expect(selectedOptions.length).toBe(1);
    expect(selectedOptions[0].textContent.trim()).toBe('Topic 2');
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

  it('should emit the topic ID when an option is selected', () => {
    spyOn(component.setActiveTopicId, 'emit');

    component.selectOption('topic_id_1');
    fixture.detectChanges();

    expect(component.setActiveTopicId.emit).toHaveBeenCalledWith('topic_id_1');
  });

  it('should emit the topic ID when an option is clicked', async () => {
    await fixture.whenStable();
    spyOn(component.setActiveTopicId, 'emit');
    clickDropdown();

    const options: HTMLElement[] = Array.from(
      fixture.debugElement.nativeElement.querySelectorAll(
        '.oppia-translation-topic-selector-dropdown-option'
      )
    );
    const topic4Option = options.find(
      option => option.textContent?.trim() === 'Topic 4'
    );
    topic4Option?.click();

    expect(component.setActiveTopicId.emit).toHaveBeenCalledWith('topic_id_4');
    expect(component.dropdownShown).toBe(false);
  });
});
