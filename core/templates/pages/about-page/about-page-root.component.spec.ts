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
 * @fileoverview Unit tests for the about page root component.
 */

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MetaTagCustomizationService } from 'services/contextual/meta-tag-customization.service';
import { PageTitleService } from 'services/page-title.service';

import { MockTranslatePipe } from 'tests/unit-test-utils';
import { AboutPageRootComponent } from './about-page-root.component';

describe('About Root Page', () => {
  let fixture: ComponentFixture<AboutPageRootComponent>;
  let component: AboutPageRootComponent;
  let pageTitleService: PageTitleService;
  let metaTagCustomizationService: MetaTagCustomizationService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        AboutPageRootComponent,
        MockTranslatePipe
      ],
      providers: [
        PageTitleService,
        MetaTagCustomizationService
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AboutPageRootComponent);
    component = fixture.componentInstance;
    pageTitleService = TestBed.inject(PageTitleService);
    metaTagCustomizationService = TestBed.inject(MetaTagCustomizationService);
  });

  it('should successfully instantiate the component',
    () => {
      expect(component).toBeDefined();
    });

  it('should initialize', () => {
    spyOn(pageTitleService, 'setPageTitle');
    spyOn(metaTagCustomizationService, 'addOrReplaceMetaTags');
    component.ngOnInit();
    expect(pageTitleService.setPageTitle).toHaveBeenCalled();
    expect(metaTagCustomizationService.addOrReplaceMetaTags).toHaveBeenCalled();
  });
});
