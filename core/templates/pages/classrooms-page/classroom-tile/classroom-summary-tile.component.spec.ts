// Copyright 2024 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for ClassroomSummaryTileComponent.
 */

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {AssetsBackendApiService} from 'services/assets-backend-api.service';
import {MockTranslatePipe} from 'tests/unit-test-utils';
import {ClassroomSummaryTileComponent} from './classroom-summary-tile.component';

describe('ClassroomSummaryTileComponent', () => {
  let component: ClassroomSummaryTileComponent;
  let fixture: ComponentFixture<ClassroomSummaryTileComponent>;

  let abas: AssetsBackendApiService;

  const dummyClassroomSummary = {
    classroom_id: 'mathclassroom',
    name: 'math',
    url_fragment: 'math',
    teaser_text: 'Learn math',
    is_published: true,
    thumbnail_filename: 'thumbnail.svg',
    thumbnail_bg_color: 'transparent',
  };

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [ClassroomSummaryTileComponent, MockTranslatePipe],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ClassroomSummaryTileComponent);
    component = fixture.componentInstance;
    abas = TestBed.inject(AssetsBackendApiService);

    component.classroomSummary = dummyClassroomSummary;
  });

  it('should set component properties on initialization', () => {
    spyOn(abas, 'getThumbnailUrlForPreview').and.returnValue(
      '/thumbnail/thumbnail.svg'
    );
    component.ngOnInit();
    expect(component.classroomThumbnailUrl).toBe('/thumbnail/thumbnail.svg');
    expect(component.classroomSummary).toEqual(dummyClassroomSummary);
  });

  it('should get classroom data', () => {
    spyOn(abas, 'getThumbnailUrlForPreview').and.returnValue(
      '/thumbnail/thumbnail.svg'
    );
    component.ngOnInit();

    expect(component.isPublished()).toBeTrue();
    expect(component.classroomThumbnailUrl).toBe('/thumbnail/thumbnail.svg');
    expect(component.getName()).toBe('math');
    expect(component.getClassroomUrl()).toBe('/learn/math');
    expect(component.getTeaserText()).toBe('Learn math');
  });

  it('should show classroom under construction image', () => {
    component.classroomSummary = {
      ...dummyClassroomSummary,
      is_published: false,
    };

    component.ngOnInit();

    expect(component.isPublished()).toBeFalse();
    expect(component.classroomThumbnailUrl).toContain(
      'classroom-under-construction.svg'
    );
    expect(component.getName()).toEqual('Coming soon');
    expect(component.getTeaserText()).toEqual(
      'We are working on more classrooms just for you. Check back soon!'
    );
  });
});
