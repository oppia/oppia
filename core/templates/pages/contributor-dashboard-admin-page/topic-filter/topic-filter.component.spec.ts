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
import { MockTranslatePipe } from 'tests/unit-test-utils';
import { ComponentFixture, fakeAsync, TestBed, tick, waitForAsync} from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MaterialModule } from 'modules/material.module';
import { TopicFilterComponent } from './topic-filter.component';
import { MatAutocompleteTrigger } from '@angular/material/autocomplete';
/**
 * @fileoverview Unit tests for Topic Filter Component.
 */

describe('Topic Filter component', () => {
  let component: TopicFilterComponent;
  let fixture: ComponentFixture<TopicFilterComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        FormsModule,
        ReactiveFormsModule,
        MaterialModule,
        BrowserAnimationsModule
      ],
      declarations: [
        TopicFilterComponent,
        MockTranslatePipe,
      ],
      providers: []
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TopicFilterComponent);
    component = fixture.componentInstance;
    component.autoTrigger = {
      closePanel() {
        return;
      }
    } as MatAutocompleteTrigger;
  });

  it('should be defined', () => {
    expect(component).toBeDefined();
  });

  it('should initialize topic filter and select a topic and exec search',
    fakeAsync(
      () => {
        spyOn(component.selectionsChange, 'emit');
        component.selectedTopics = ['topic1', 'topic2'];
        component.listOfDefaultTopics = [
          'topic1', 'topic2', 'topic3', 'topic4'];

        fixture.detectChanges();
        component.ngOnInit();

        expect(component.filteredTopics).toBeDefined();
        expect(component.topicFilter).toBeDefined();
        expect(component.searchDropDownTopics).toEqual(['topic3', 'topic4']);
      })
  );

  it('should filter topics', () => {
    component.searchDropDownTopics = ['math'];
    expect(component.filter('math')).toEqual(['math']);
    expect(component.filter('oppia')).toEqual([]);
  });

  it('should remove topic from selected topics and execute search', () => {
    spyOn(component.selectionsChange, 'emit');
    spyOn(component, 'refreshSearchDropDownTopics');
    component.selectedTopics = ['topic1', 'topic2', 'topic3'];

    component.deselectTopic('topic1');

    expect(component.selectedTopics).toEqual(['topic2', 'topic3']);
  });
});
