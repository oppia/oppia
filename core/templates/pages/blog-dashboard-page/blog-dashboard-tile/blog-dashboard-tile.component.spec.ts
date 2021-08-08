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
 * @fileoverview Unit tests for Blog Dashboard Tile component.
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { CapitalizePipe } from 'filters/string-utility-filters/capitalize.pipe';
import { MockTranslatePipe, MockCapitalizePipe } from 'tests/unit-test-utils';
import { BlogDashboardTileComponent } from './blog-dashboard-tile.component';
import { BlogPostSummaryBackendDict, BlogPostSummary } from 'domain/blog/blog-post-summary.model';

describe('Blog Dashboard Tile Component', () => {
  let component: BlogDashboardTileComponent;
  let fixture: ComponentFixture<BlogDashboardTileComponent>;
  let sampleBlogPostSummary: BlogPostSummaryBackendDict;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ],
      declarations: [
        BlogDashboardTileComponent,
        MockTranslatePipe
      ],
      providers: [
        {
          provide: CapitalizePipe,
          useClass: MockCapitalizePipe
        },
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BlogDashboardTileComponent);
    component = fixture.componentInstance;

    sampleBlogPostSummary = {
      id: 'sampleId',
      author_username: 'test_user',
      title: 'Title',
      summary: 'Hello World',
      tags: ['news'],
      thumbnail_filename: 'image.png',
      url_fragment: 'title',
      last_updated: '11/21/2014',
      published_on: '11/21/2014',
    };
  });

  it('should create', () => {
    expect(component).toBeDefined();
  });

  it('should initialize', () => {
    component.blogPostSummary = BlogPostSummary.createFromBackendDict(
      sampleBlogPostSummary);

    component.ngOnInit();

    expect(component.lastUpdatedDateString).toEqual('November 21, 2014');
  });

  it('should get formatted date string from the timestamp in milliseconds',
    () => {
      // This corresponds to Fri, 21 Nov 2014 09:45:00 GMT.
      let DATE = '11/21/2014';
      expect(component.getDateStringInWords(DATE))
        .toBe('November 21, 2014');

      DATE = '01/16/2027';
      expect(component.getDateStringInWords(DATE))
        .toBe('January 16, 2027');

      DATE = '02/02/2018';
      expect(component.getDateStringInWords(DATE))
        .toBe('February 2, 2018');
    });
});
