// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the about page.
 */

import { TestBed } from '@angular/core/testing';

import { AboutPageComponent } from './about-page.component';
import { SiteAnalyticsService } from 'services/site-analytics.service';
import { UrlInterpolationService } from
  'domain/utilities/url-interpolation.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import { MockTranslatePipe } from 'tests/unit-test-utils';


describe('About Page', () => {
  const siteAnalyticsService = new SiteAnalyticsService(
    new WindowRef());
  beforeEach(async() => {
    TestBed.configureTestingModule({
      declarations: [AboutPageComponent,
        MockTranslatePipe],
      providers: [
        { provide: SiteAnalyticsService, useValue: siteAnalyticsService },
        UrlInterpolationService,
        {
          provide: WindowRef,
          useValue: {
            nativeWindow: {
              location: {
                href: ''
              }
            }
          }
        }
      ]
    }).compileComponents();
    const aboutPageComponent = TestBed.createComponent(AboutPageComponent);
    component = aboutPageComponent.componentInstance;
  });
  beforeEach(angular.mock.module('oppia'));
  let component = null;

  it('should successfully instantiate the component',
    () => {
      expect(component).toBeDefined();
    });

  it('should return correct static image url when calling getStaticImageUrl',
    () => {
      expect(component.getStaticImageUrl('/path/to/image')).toBe(
        '/assets/images/path/to/image');
    });

  it('should redirect guest user to the login page when they click' +
  'create lesson button', () => {
    spyOn(
      siteAnalyticsService, 'registerCreateLessonButtonEvent')
      .and.callThrough();
    component.onClickCreateLessonButton();

    expect(siteAnalyticsService.registerCreateLessonButtonEvent)
      .toHaveBeenCalledWith();
    expect(component.windowRef.nativeWindow.location.href).toBe(
      '/creator-dashboard?mode=create');
  });

  it('should register correct event on calling onClickVisitClassroomButton',
    () => {
      spyOn(
        siteAnalyticsService, 'registerClickVisitClassroomButtonEvent')
        .and.callThrough();
      component.onClickVisitClassroomButton();

      expect(siteAnalyticsService.registerClickVisitClassroomButtonEvent)
        .toHaveBeenCalledWith();
      expect(component.windowRef.nativeWindow.location.href).toBe(
        '/learn/math');
    });

  it('should register correct event on calling onClickBrowseLibraryButton',
    () => {
      spyOn(
        siteAnalyticsService, 'registerClickBrowseLibraryButtonEvent')
        .and.callThrough();

      component.onClickBrowseLibraryButton();

      expect(siteAnalyticsService.registerClickBrowseLibraryButtonEvent)
        .toHaveBeenCalledWith();
      expect(component.windowRef.nativeWindow.location.href)
        .toBe('/community-library');
    });
});
