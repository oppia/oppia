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
// @ts-nocheck
/**
 * @fileoverview Unit tests for ModuleNavigationComponent.
 */

import {ElementRef, NO_ERRORS_SCHEMA, SimpleChange} from '@angular/core';
import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
  waitForAsync,
} from '@angular/core/testing';
import {CommonModule} from '@angular/common';

import {MockTranslateModule} from 'tests/unit-test-utils';
import {ModuleNavigationComponent} from './module-navigation.component';
import {ModuleCircleBadgeComponent} from './module-circle-badge.component';

const createScrollWrapper = (
  scrollWidth: number,
  clientWidth: number,
  scrollLeft: number
): ElementRef<HTMLElement> => {
  const nativeElement = document.createElement('div');
  Object.defineProperty(nativeElement, 'scrollWidth', {value: scrollWidth});
  Object.defineProperty(nativeElement, 'clientWidth', {value: clientWidth});
  Object.defineProperty(nativeElement, 'scrollLeft', {value: scrollLeft});
  return {nativeElement};
};

describe('ModuleNavigationComponent', () => {
  let component: ModuleNavigationComponent;
  let fixture: ComponentFixture<ModuleNavigationComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ModuleNavigationComponent, ModuleCircleBadgeComponent],
      imports: [CommonModule, MockTranslateModule],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ModuleNavigationComponent);
    component = fixture.componentInstance;
  }));

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should not mark any lesson as active when no explicit active lesson exists', () => {
    component.activeLessonNumber = null;

    expect(component.isActiveLesson(1)).toBe(false);
    expect(component.isActiveLesson(2)).toBe(false);
  });

  it('should mark matching lesson as active when active lesson is provided', () => {
    component.activeLessonNumber = 3;

    expect(component.isActiveLesson(3)).toBe(true);
    expect(component.isActiveLesson(2)).toBe(false);
  });

  it('should show lesson number as label for each lesson badge', () => {
    component.moduleGroups = [
      {
        lessons: [
          {lessonNumber: 1, isCompleted: true},
          {lessonNumber: 2, isCompleted: false},
        ],
        accentColor: '#000',
        showPractice: false,
        isPracticeCompleted: false,
        arcId: '1',
      },
    ];

    expect(component.moduleGroups[0].lessons[0].lessonNumber).toBe(1);
    expect(component.moduleGroups[0].lessons[1].lessonNumber).toBe(2);
  });

  it('should emit lessonSelected event when onLessonClick is called', () => {
    spyOn(component.lessonSelected, 'emit');

    component.onLessonClick(5, 2);

    expect(component.lessonSelected.emit).toHaveBeenCalledWith({
      lessonNumber: 5,
      moduleIndex: 2,
    });
  });

  it('should emit practiceSelected event when onPracticeClick is called', () => {
    spyOn(component.practiceSelected, 'emit');

    component.onPracticeClick('2');

    expect(component.practiceSelected.emit).toHaveBeenCalledWith('2');
  });

  it('should return edit icon for practice badge', () => {
    expect(component.getPracticeBadgeIconName()).toBe('edit');
  });

  it('should report the last lesson as completed when it is completed', () => {
    const moduleGroup = {
      lessons: [
        {lessonNumber: 1, isCompleted: true},
        {lessonNumber: 2, isCompleted: true},
      ],
      accentColor: '#000',
      showPractice: true,
      isPracticeCompleted: false,
      arcId: '1',
    };

    expect(component.isLastLessonCompleted(moduleGroup)).toBe(true);
  });

  it('should report the last lesson as not completed when it is not completed', () => {
    const moduleGroup = {
      lessons: [
        {lessonNumber: 1, isCompleted: true},
        {lessonNumber: 2, isCompleted: false},
      ],
      accentColor: '#000',
      showPractice: true,
      isPracticeCompleted: false,
      arcId: '1',
    };

    expect(component.isLastLessonCompleted(moduleGroup)).toBe(false);
  });

  it('should report no completed last lesson when the module group has no lessons', () => {
    const moduleGroup = {
      lessons: [],
      accentColor: '#000',
      showPractice: true,
      isPracticeCompleted: false,
      arcId: '1',
    };

    expect(component.isLastLessonCompleted(moduleGroup)).toBe(false);
  });

  it('should mark matching practice arc as active when one is provided', () => {
    component.activePracticeArcId = 'arc-2';

    expect(component.isActivePractice('arc-2')).toBe(true);
    expect(component.isActivePractice('arc-1')).toBe(false);
  });

  it('should report no active practice when none is provided', () => {
    component.activePracticeArcId = '';

    expect(component.isActivePractice('arc-1')).toBe(false);
  });

  it('should clear timeouts and stop scheduled updates on destroy', fakeAsync(() => {
    component.scrollWrapper = createScrollWrapper(500, 200, 0);

    component.ngAfterViewInit();

    tick(50);
    expect(component.showRightArrow).toBe(true);

    component.ngOnDestroy();

    tick(1000);
  }));

  it('should update arrows on window resize', () => {
    component.scrollWrapper = createScrollWrapper(500, 200, 0);

    component.onWindowResize();

    expect(component.showLeftArrow).toBe(false);
    expect(component.showRightArrow).toBe(true);
  });

  it('should update arrows on scroll', () => {
    component.scrollWrapper = createScrollWrapper(500, 200, 10);

    component.onScroll();

    expect(component.showLeftArrow).toBe(true);
    expect(component.showRightArrow).toBe(true);
  });

  it('should scroll left and update arrows', fakeAsync(() => {
    const scrollWrapper = createScrollWrapper(500, 200, 100);
    const scrollBySpy = spyOn(scrollWrapper.nativeElement, 'scrollBy');
    component.scrollWrapper = scrollWrapper;

    component.scrollLeft();

    expect(scrollBySpy).toHaveBeenCalledWith({
      left: -200,
      behavior: 'smooth',
    });

    tick(500);
  }));

  it('should scroll right and update arrows', fakeAsync(() => {
    const scrollWrapper = createScrollWrapper(500, 200, 100);
    const scrollBySpy = spyOn(scrollWrapper.nativeElement, 'scrollBy');
    component.scrollWrapper = scrollWrapper;

    component.scrollRight();

    expect(scrollBySpy).toHaveBeenCalledWith({
      left: 200,
      behavior: 'smooth',
    });

    tick(500);
  }));

  it('should not crash when scrollWrapper is not defined for scrollLeft', () => {
    expect(component.scrollWrapper).toBeUndefined();

    expect(() => component.scrollLeft()).not.toThrowError();
  });

  it('should not crash when scrollWrapper is not defined for scrollRight', () => {
    expect(component.scrollWrapper).toBeUndefined();

    expect(() => component.scrollRight()).not.toThrowError();
  });

  it('should update arrows after ngAfterViewInit', fakeAsync(() => {
    component.scrollWrapper = createScrollWrapper(500, 200, 0);

    component.ngAfterViewInit();

    tick(500);

    expect(component.showRightArrow).toBe(true);
    expect(component.showLeftArrow).toBe(false);
  }));

  it('should schedule arrow updates on ngOnChanges when moduleGroups change', fakeAsync(() => {
    component.scrollWrapper = createScrollWrapper(500, 200, 100);

    component.ngOnChanges({
      moduleGroups: new SimpleChange(
        [],
        [
          {
            lessons: [{lessonNumber: 1, isCompleted: false}],
            accentColor: '#000',
            showPractice: true,
            isPracticeCompleted: false,
            arcId: '1',
          },
        ],
        false
      ),
    });

    tick(300);

    expect(component.showLeftArrow).toBe(true);
    expect(component.showRightArrow).toBe(true);
  }));

  it('should not schedule arrow updates on ngOnChanges when moduleGroups do not change', fakeAsync(() => {
    component.scrollWrapper = createScrollWrapper(500, 200, 0);

    component.showLeftArrow = false;
    component.showRightArrow = false;

    component.ngOnChanges({
      activeLessonNumber: new SimpleChange(null, 1, false),
    });

    tick(500);

    expect(component.showLeftArrow).toBe(false);
    expect(component.showRightArrow).toBe(false);
  }));

  it('should hide arrows when there is no overflow', () => {
    component.scrollWrapper = createScrollWrapper(200, 200, 0);

    component.onScroll();

    expect(component.showLeftArrow).toBe(false);
    expect(component.showRightArrow).toBe(false);
  });

  it('should hide both arrows when scroll is near the end', () => {
    component.scrollWrapper = createScrollWrapper(500, 200, 300);

    component.onScroll();

    expect(component.showLeftArrow).toBe(true);
    expect(component.showRightArrow).toBe(false);
  });

  it('should show right arrow but not left when scroll is at start', () => {
    component.scrollWrapper = createScrollWrapper(500, 200, 0);

    component.onScroll();

    expect(component.showLeftArrow).toBe(false);
    expect(component.showRightArrow).toBe(true);
  });

  it('should emit masteryChallengeClicked event when onMasteryClick is called', () => {
    spyOn(component.masteryChallengeClicked, 'emit');

    component.onMasteryClick();

    expect(component.masteryChallengeClicked.emit).toHaveBeenCalled();
  });

  it('should not update arrows when scrollWrapper nativeElement is null', () => {
    component.scrollWrapper = createScrollWrapper(500, 200, 0);
    Object.defineProperty(component.scrollWrapper, 'nativeElement', {
      value: null,
    });

    expect(() => component.onScroll()).not.toThrowError();
  });

  it('should not update arrows when scrollWrapper is undefined', () => {
    expect(component.scrollWrapper).toBeUndefined();

    expect(() => component.onScroll()).not.toThrowError();
  });
});
