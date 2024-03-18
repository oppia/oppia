// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
import {ElementRef} from '@angular/core';
import {MockTranslatePipe} from 'tests/unit-test-utils';
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
  waitForAsync,
} from '@angular/core/testing';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {MaterialModule} from 'modules/material.module';
import {TagFilterComponent} from './tag-filter.component';
import {MatAutocompleteTrigger} from '@angular/material/autocomplete';
import {BlogPostSearchService} from 'services/blog-search.service';
import {BlogHomePageConstants} from '../blog-home-page.constants';
/**
 * @fileoverview Unit tests for Tag Filter Component.
 */

describe('Tag Filter component', () => {
  let component: TagFilterComponent;
  let fixture: ComponentFixture<TagFilterComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        FormsModule,
        ReactiveFormsModule,
        MaterialModule,
        BrowserAnimationsModule,
      ],
      declarations: [TagFilterComponent, MockTranslatePipe],
      providers: [BlogPostSearchService],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TagFilterComponent);
    component = fixture.componentInstance;
    component.autoTrigger = {
      closePanel() {
        return;
      },
    } as MatAutocompleteTrigger;
  });

  it('should be defined', () => {
    expect(component).toBeDefined();
  });

  it('should initialize tag filter and select a tag and exec search', fakeAsync(() => {
    spyOn(component.selectionsChange, 'emit');
    component.selectedTags = ['tag1', 'tag2'];
    component.listOfDefaultTags = ['tag1', 'tag2', 'tag3', 'tag4'];

    fixture.detectChanges();
    component.ngOnInit();

    expect(component.filteredTags).toBeDefined();
    expect(component.tagFilter).toBeDefined();
    expect(component.searchDropDownTags).toEqual(['tag3', 'tag4']);

    component.tagFilterInput = {
      nativeElement: {
        value: '',
      },
    } as ElementRef;
    component.selectTag({option: {viewValue: 'tag3'}});
    // Search with applied tags will be executed only when no change in tag
    // filter is done for 1500ms. We add 1ms extra to avoid flaking of test.
    tick(BlogHomePageConstants.DEBOUNCE_TIME + 1);

    expect(component.selectedTags).toEqual(['tag1', 'tag2', 'tag3']);
    expect(component.searchDropDownTags).toEqual(['tag4']);

    component.selectTag({option: {viewValue: 'noTag'}});
    tick(1600);

    expect(component.selectionsChange.emit).toHaveBeenCalled();
  }));

  it('should filter tags', () => {
    component.searchDropDownTags = ['math'];
    expect(component.filter('math')).toEqual(['math']);
    expect(component.filter('oppia')).toEqual([]);
  });

  it('should remove tag from selected tags and execute search', () => {
    spyOn(component.selectionsChange, 'emit');
    spyOn(component, 'refreshSearchDropDownTags');
    component.selectedTags = ['tag1', 'tag2', 'tag3'];

    component.deselectTag('tag1');

    expect(component.selectedTags).toEqual(['tag2', 'tag3']);
  });
});
