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
 * @fileoverview Unit tests for ClassroomNavigationLinksComponent.
 */

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import {AssetsBackendApiService} from 'services/assets-backend-api.service';
import {MockTranslatePipe} from 'tests/unit-test-utils';
import {ClassroomBackendApiService} from 'domain/classroom/classroom-backend-api.service';
import {ClassroomNavigationLinksComponent} from './classroom-navigation-links.component';

describe('ClassroomNavigationLinksComponent', () => {
  let component: ClassroomNavigationLinksComponent;
  let fixture: ComponentFixture<ClassroomNavigationLinksComponent>;
  let classroomBackendApiService: jasmine.SpyObj<ClassroomBackendApiService>;
  let assetsBackendApiService: jasmine.SpyObj<AssetsBackendApiService>;

  const dummyClassroomSummaries = [
    {
      classroom_id: 'math',
      name: 'math',
      url_fragment: 'math',
      teaser_text: 'Learn math',
      is_published: true,
      thumbnail_filename: 'thumbnail.svg',
      thumbnail_bg_color: 'transparent',
    },
    {
      classroom_id: 'science',
      name: 'science',
      url_fragment: 'science',
      teaser_text: 'Learn science',
      is_published: true,
      thumbnail_filename: 'thumbnail.svg',
      thumbnail_bg_color: 'transparent',
    },
  ];

  beforeEach(async () => {
    const classroomBackendApiServiceSpy = jasmine.createSpyObj(
      'ClassroomBackendApiService',
      ['getAllClassroomsSummaryAsync']
    );
    const assetsBackendApiServiceSpy = jasmine.createSpyObj(
      'AssetsBackendApiService',
      ['getThumbnailUrlForPreview']
    );

    await TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [ClassroomNavigationLinksComponent, MockTranslatePipe],
      providers: [
        {
          provide: ClassroomBackendApiService,
          useValue: classroomBackendApiServiceSpy,
        },
        {
          provide: AssetsBackendApiService,
          useValue: assetsBackendApiServiceSpy,
        },
      ],
    }).compileComponents();

    classroomBackendApiService = TestBed.inject(
      ClassroomBackendApiService
    ) as jasmine.SpyObj<ClassroomBackendApiService>;
    assetsBackendApiService = TestBed.inject(
      AssetsBackendApiService
    ) as jasmine.SpyObj<AssetsBackendApiService>;
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ClassroomNavigationLinksComponent);
    component = fixture.componentInstance;
  });

  it('should set component properties on initialization', fakeAsync(() => {
    classroomBackendApiService.getAllClassroomsSummaryAsync.and.returnValue(
      Promise.resolve(dummyClassroomSummaries)
    );

    expect(component.classroomSummaries.length).toEqual(0);
    expect(component.isLoading).toBeTrue();

    component.ngOnInit();
    tick();

    expect(component.classroomSummaries.length).toEqual(2);
    expect(component.isLoading).toBeFalse();
  }));

  it('should get classroom thumbnail', () => {
    const classroomId = 'math';
    const thumbnailFilename = 'thumbnail.svg';

    assetsBackendApiService.getThumbnailUrlForPreview.and.returnValue(
      '/thumbnail/thumbnail.svg'
    );

    const result = component.getClassroomThumbnail(
      classroomId,
      thumbnailFilename
    );

    expect(result).toContain('thumbnail.svg');
    expect(
      assetsBackendApiService.getThumbnailUrlForPreview
    ).toHaveBeenCalledWith(jasmine.any(String), classroomId, thumbnailFilename);
  });
});
