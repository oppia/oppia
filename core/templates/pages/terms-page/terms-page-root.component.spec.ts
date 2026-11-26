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
 * @fileoverview Unit tests for the terms page root component.
 */

import {NO_ERRORS_SCHEMA} from '@angular/core';
import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {PageHeadService} from 'services/page-head.service';

import {
  TERMS_PAGE_META,
  TERMS_PAGE_TITLE,
  TermsPageRootComponent,
} from './terms-page-root.component';

describe('Terms Page Root', () => {
  let fixture: ComponentFixture<TermsPageRootComponent>;
  let component: TermsPageRootComponent;
  let pageHeadService: PageHeadService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [TermsPageRootComponent],
      providers: [PageHeadService],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TermsPageRootComponent);
    component = fixture.componentInstance;
    pageHeadService = TestBed.inject(PageHeadService);
  });

  it('should successfully instantiate the component', () => {
    expect(component).toBeDefined();
  });

  afterEach(() => {
    document.documentElement.classList.remove('oppia-angular-ready');
  });

  it('should set the static title and meta tags', () => {
    spyOn(pageHeadService, 'updateTitleAndMetaTags');

    component.ngOnInit();

    expect(pageHeadService.updateTitleAndMetaTags).toHaveBeenCalledWith(
      TERMS_PAGE_TITLE,
      TERMS_PAGE_META
    );
  });

  it('should reveal the live page after the view is initialized', () => {
    component.ngAfterViewInit();

    expect(
      document.documentElement.classList.contains('oppia-angular-ready')
    ).toBeTrue();
  });
});
