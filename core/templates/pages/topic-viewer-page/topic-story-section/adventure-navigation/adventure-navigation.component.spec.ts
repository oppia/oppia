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
 * @fileoverview Unit tests for AdventureNavigationComponent.
 */

import {NO_ERRORS_SCHEMA, SimpleChange} from '@angular/core';
import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
  waitForAsync,
} from '@angular/core/testing';

import {MockTranslateModule} from 'tests/unit-test-utils';
import {AdventureNavigationComponent} from './adventure-navigation.component';

describe('AdventureNavigationComponent', () => {
  let component: AdventureNavigationComponent;
  let fixture: ComponentFixture<AdventureNavigationComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [AdventureNavigationComponent],
      imports: [MockTranslateModule],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(AdventureNavigationComponent);
    component = fixture.componentInstance;
  }));

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should mark first lesson as active when no explicit active lesson exists', () => {
    component.activeLessonNumber = null;

    expect(component.isActiveLesson(1)).toBeTrue();
    expect(component.isActiveLesson(2)).toBeFalse();
  });

  it('should mark matching lesson as active when active lesson is provided', () => {
    component.activeLessonNumber = 3;

    expect(component.isActiveLesson(3)).toBeTrue();
    expect(component.isActiveLesson(2)).toBeFalse();
  });

  it('should emit lessonSelected event when onLessonClick is called', () => {
    spyOn(component.lessonSelected, 'emit');

    component.onLessonClick(5);

    expect(component.lessonSelected.emit).toHaveBeenCalledWith(5);
  });

  it('should emit practiceSelected event when onPracticeClick is called', () => {
    spyOn(component.practiceSelected, 'emit');

    component.onPracticeClick(2);

    expect(component.practiceSelected.emit).toHaveBeenCalledWith(2);
  });

  it('should clear all timeouts on destroy', () => {
    component.scrollCheckTimeouts = [
      setTimeout(() => {}, 1000),
      setTimeout(() => {}, 2000),
    ];

    component.ngOnDestroy();

    expect(component.scrollCheckTimeouts).toEqual([]);
  });

  it('should update arrows on window resize', () => {
    const mockElement = {
      scrollWidth: 500,
      clientWidth: 200,
      scrollLeft: 0,
    };
    component.scrollWrapper = {nativeElement: mockElement} as never;

    component.onWindowResize();

    expect(component.showLeftArrow).toBeFalse();
    expect(component.showRightArrow).toBeTrue();
  });

  it('should update arrows on scroll', () => {
    const mockElement = {
      scrollWidth: 500,
      clientWidth: 200,
      scrollLeft: 10,
    };
    component.scrollWrapper = {nativeElement: mockElement} as never;

    component.onScroll();

    expect(component.showLeftArrow).toBeTrue();
    expect(component.showRightArrow).toBeTrue();
  });

  it('should scroll left and update arrows', fakeAsync(() => {
    const mockElement = {
      scrollWidth: 500,
      clientWidth: 200,
      scrollLeft: 100,
      scrollBy: jasmine.createSpy('scrollBy'),
    };
    component.scrollWrapper = {nativeElement: mockElement} as never;

    component.scrollLeft();

    expect(mockElement.scrollBy).toHaveBeenCalledWith({
      left: -200,
      behavior: 'smooth',
    });

    tick(500);
  }));

  it('should scroll right and update arrows', fakeAsync(() => {
    const mockElement = {
      scrollWidth: 500,
      clientWidth: 200,
      scrollLeft: 100,
      scrollBy: jasmine.createSpy('scrollBy'),
    };
    component.scrollWrapper = {nativeElement: mockElement} as never;

    component.scrollRight();

    expect(mockElement.scrollBy).toHaveBeenCalledWith({
      left: 200,
      behavior: 'smooth',
    });

    tick(500);
  }));

  it('should not crash when scrollWrapper is not defined for scrollLeft', () => {
    component.scrollWrapper = undefined as never;

    expect(() => component.scrollLeft()).not.toThrowError();
  });

  it('should not crash when scrollWrapper is not defined for scrollRight', () => {
    component.scrollWrapper = undefined as never;

    expect(() => component.scrollRight()).not.toThrowError();
  });

  it('should update arrows after ngAfterViewInit', fakeAsync(() => {
    const mockElement = {
      scrollWidth: 500,
      clientWidth: 200,
      scrollLeft: 0,
    };
    component.scrollWrapper = {nativeElement: mockElement} as never;

    component.ngAfterViewInit();

    tick(500);

    expect(component.showRightArrow).toBeTrue();
    expect(component.showLeftArrow).toBeFalse();
  }));

  it('should schedule arrow updates on ngOnChanges when adventureGroups change', fakeAsync(() => {
    const mockElement = {
      scrollWidth: 500,
      clientWidth: 200,
      scrollLeft: 100,
    };
    component.scrollWrapper = {nativeElement: mockElement} as never;

    component.ngOnChanges({
      adventureGroups: new SimpleChange(
        [],
        [{lessonNumbers: [1], accentColor: '#000'}],
        false
      ),
    });

    tick(300);

    expect(component.showLeftArrow).toBeTrue();
    expect(component.showRightArrow).toBeTrue();
  }));

  it('should not schedule arrow updates on ngOnChanges when adventureGroups do not change', () => {
    spyOn(component, 'updateArrows' as never);

    component.ngOnChanges({
      activeLessonNumber: new SimpleChange(null, 1, false),
    });

    expect(
      (component as unknown as Record<string, unknown>).updateArrows
    ).not.toHaveBeenCalled();
  });

  it('should hide arrows when there is no overflow', () => {
    const mockElement = {
      scrollWidth: 200,
      clientWidth: 200,
      scrollLeft: 0,
    };
    component.scrollWrapper = {nativeElement: mockElement} as never;

    component.onScroll();

    expect(component.showLeftArrow).toBeFalse();
    expect(component.showRightArrow).toBeFalse();
  });

  it('should hide both arrows when scroll is near the end', () => {
    const mockElement = {
      scrollWidth: 500,
      clientWidth: 200,
      scrollLeft: 300,
    };
    component.scrollWrapper = {nativeElement: mockElement} as never;

    component.onScroll();

    expect(component.showLeftArrow).toBeTrue();
    expect(component.showRightArrow).toBeFalse();
  });

  it('should show right arrow but not left when scroll is at start', () => {
    const mockElement = {
      scrollWidth: 500,
      clientWidth: 200,
      scrollLeft: 0,
    };
    component.scrollWrapper = {nativeElement: mockElement} as never;

    component.onScroll();

    expect(component.showLeftArrow).toBeFalse();
    expect(component.showRightArrow).toBeTrue();
  });

  it('should not update arrows when scrollWrapper nativeElement is null', () => {
    component.scrollWrapper = {nativeElement: null} as never;

    expect(() => component.onScroll()).not.toThrowError();
  });

  it('should not update arrows when scrollWrapper is undefined', () => {
    component.scrollWrapper = undefined as never;

    expect(() => component.onScroll()).not.toThrowError();
  });
});
