// Copyright 2026 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for ModuleEndTestCardComponent.
 */

import {NO_ERRORS_SCHEMA, SimpleChange} from '@angular/core';
import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {By} from '@angular/platform-browser';

import {ModuleEndTestCardComponent} from './module-end-test-card.component';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {WindowRef} from 'services/contextual/window-ref.service';
import {MockTranslatePipe} from 'tests/unit-test-utils';

class MockWindowRef {
  nativeWindow = {
    location: {
      assign: (url: string) => {},
    },
  };
}

describe('ModuleEndTestCardComponent', () => {
  let component: ModuleEndTestCardComponent;
  let fixture: ComponentFixture<ModuleEndTestCardComponent>;
  let urlInterpolationService: jasmine.SpyObj<UrlInterpolationService>;
  let windowRef: WindowRef;

  beforeEach(waitForAsync(() => {
    const urlInterpolationServiceSpy = jasmine.createSpyObj(
      'UrlInterpolationService',
      ['getStaticImageUrl']
    );

    TestBed.configureTestingModule({
      declarations: [ModuleEndTestCardComponent, MockTranslatePipe],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        {
          provide: UrlInterpolationService,
          useValue: urlInterpolationServiceSpy,
        },
        {
          provide: WindowRef,
          useClass: MockWindowRef,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ModuleEndTestCardComponent);
    component = fixture.componentInstance;
    urlInterpolationService = TestBed.inject(
      UrlInterpolationService
    ) as jasmine.SpyObj<UrlInterpolationService>;
    windowRef = TestBed.inject(WindowRef);
  }));

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should use provided thumbnail url on initialization', () => {
    component.thumbnailUrl = '/assets/practice-thumbnail.png';

    component.ngOnInit();

    expect(component.resolvedThumbnailUrl).toBe(
      '/assets/practice-thumbnail.png'
    );
  });

  it('should use fallback thumbnail url when thumbnail url is empty', () => {
    urlInterpolationService.getStaticImageUrl.and.returnValue(
      '/assets/fallback-thumbnail.webp'
    );

    component.thumbnailUrl = '';

    component.ngOnInit();

    expect(urlInterpolationService.getStaticImageUrl).toHaveBeenCalledWith(
      '/splash/student_desk1x.webp'
    );
    expect(component.resolvedThumbnailUrl).toBe(
      '/assets/fallback-thumbnail.webp'
    );
  });

  it('should not call UrlInterpolationService when thumbnail url is provided', () => {
    component.thumbnailUrl = '/assets/custom-thumbnail.png';

    component.ngOnInit();

    expect(urlInterpolationService.getStaticImageUrl).not.toHaveBeenCalled();
    expect(component.resolvedThumbnailUrl).toBe('/assets/custom-thumbnail.png');
  });

  it('should fall back and hide the image when thumbnail loading fails', () => {
    urlInterpolationService.getStaticImageUrl.and.returnValue(
      '/assets/fallback-thumbnail.webp'
    );
    component.thumbnailUrl = '/assets/broken-thumbnail.png';
    fixture.detectChanges();
    const thumbnail = fixture.debugElement.query(
      By.css('.module-end-test-card-image')
    );

    thumbnail.nativeElement.dispatchEvent(new Event('error'));
    fixture.detectChanges();

    expect(component.resolvedThumbnailUrl).toBe(
      '/assets/fallback-thumbnail.webp'
    );
    expect(component.isThumbnailVisible).toBeTrue();

    thumbnail.nativeElement.dispatchEvent(new Event('error'));
    fixture.detectChanges();

    expect(component.isThumbnailVisible).toBeFalse();
    expect(
      thumbnail.nativeElement.classList.contains(
        'module-end-test-card-image-hidden'
      )
    ).toBeTrue();
  });

  it('should show a new thumbnail when the input changes', () => {
    component.thumbnailUrl = '/assets/updated-thumbnail.png';
    component.isThumbnailVisible = false;

    component.ngOnChanges({
      thumbnailUrl: new SimpleChange(
        '/assets/previous-thumbnail.png',
        component.thumbnailUrl,
        false
      ),
    });

    expect(component.resolvedThumbnailUrl).toBe(
      '/assets/updated-thumbnail.png'
    );
    expect(component.isThumbnailVisible).toBeTrue();
  });

  it('should execute navigateTo when url is provided', () => {
    spyOn(windowRef.nativeWindow.location, 'assign');

    component.navigateTo('/practice/session');

    expect(windowRef.nativeWindow.location.assign).toHaveBeenCalledWith(
      '/practice/session'
    );
  });

  it('should not throw when navigating to the fallback url', () => {
    expect(() => {
      component.navigateTo('#');
    }).not.toThrowError();
  });

  it('should execute navigateTo when url is empty', () => {
    expect(() => {
      component.navigateTo('');
    }).not.toThrowError();
  });

  it('should navigate to practice when questions are available', () => {
    spyOn(component, 'navigateTo');
    component.practiceUrl = '/practice/session';
    component.hasPracticeQuestions = true;

    component.onPracticeButtonClick();

    expect(component.navigateTo).toHaveBeenCalledWith('/practice/session');
  });

  it('should not navigate when practice questions are unavailable', () => {
    spyOn(component, 'navigateTo');
    component.practiceUrl = '/practice/session';
    component.hasPracticeQuestions = false;

    component.onPracticeButtonClick();

    expect(component.navigateTo).not.toHaveBeenCalled();
  });

  it('should return provided practice description', () => {
    component.practiceDescription = 'Practice solving algebra problems.';

    expect(component.getResolvedDescription()).toBe(
      'Practice solving algebra problems.'
    );
  });

  it('should return thumbnail alt text with practice title', () => {
    component.practiceTitle = 'Fractions Practice';

    expect(component.getThumbnailAltText()).toBe(
      'Practice thumbnail for Fractions Practice'
    );
  });

  it('should return default thumbnail alt text when practice title is empty', () => {
    component.practiceTitle = '';

    expect(component.getThumbnailAltText()).toBe('Practice thumbnail');
  });
});
