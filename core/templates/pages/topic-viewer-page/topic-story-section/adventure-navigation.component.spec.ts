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

import {ElementRef, NO_ERRORS_SCHEMA, SimpleChange} from '@angular/core';
import {By} from '@angular/platform-browser';
import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
  waitForAsync,
} from '@angular/core/testing';

import {MockTranslateModule} from 'tests/unit-test-utils';
import {AdventureNavigationComponent} from './adventure-navigation.component';
import {AdventureCircleBadgeComponent} from './adventure-circle-badge.component';

describe('AdventureNavigationComponent', () => {
  let component: AdventureNavigationComponent;
  let fixture: ComponentFixture<AdventureNavigationComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        AdventureNavigationComponent,
        AdventureCircleBadgeComponent,
      ],
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

    expect(component.isActiveLesson(1)).toBe(true);
    expect(component.isActiveLesson(2)).toBe(false);
  });

  it('should mark matching lesson as active when active lesson is provided', () => {
    component.activeLessonNumber = 3;

    expect(component.isActiveLesson(3)).toBe(true);
    expect(component.isActiveLesson(2)).toBe(false);
  });

  it('should show a check icon for completed lessons in the navigation', () => {
    component.adventureGroups = [
      {
        lessons: [
          {lessonNumber: 1, isCompleted: false},
          {lessonNumber: 2, isCompleted: true},
        ],
        accentColor: '#27a844',
        showPractice: false,
        isPracticeCompleted: false,
        arcId: '1',
      },
    ];

    fixture.detectChanges();

    const badges = fixture.debugElement.queryAll(
      By.directive(AdventureCircleBadgeComponent)
    );
    expect(badges.length).toBe(3);
    expect(badges[0].componentInstance.iconName).toBe('');
    expect(badges[1].componentInstance.iconName).toBe('check');
  });

  it('should emit lessonSelected event when onLessonClick is called', () => {
    spyOn(component.lessonSelected, 'emit');

    component.onLessonClick(5, 2);

    expect(component.lessonSelected.emit).toHaveBeenCalledWith({
      lessonNumber: 5,
      adventureIndex: 2,
    });
  });

  it('should emit practiceSelected event when onPracticeClick is called', () => {
    spyOn(component.practiceSelected, 'emit');

    component.onPracticeClick('2');

    expect(component.practiceSelected.emit).toHaveBeenCalledWith('2');
  });

  it('should show a check icon for completed practice in navigation', () => {
    component.adventureGroups = [
      {
        lessons: [{lessonNumber: 1, isCompleted: true}],
        accentColor: '#27a844',
        showPractice: true,
        isPracticeCompleted: true,
        arcId: '1',
      },
    ];

    fixture.detectChanges();

    const badges = fixture.debugElement.queryAll(
      By.directive(AdventureCircleBadgeComponent)
    );
    expect(badges.length).toBe(3);
    expect(badges[1].componentInstance.iconName).toBe('check');
  });

  it('should clear timeouts and stop scheduled updates on destroy', fakeAsync(() => {
    const mockElement = {
      scrollWidth: 500,
      clientWidth: 200,
      scrollLeft: 0,
    };
    component.scrollWrapper = {
      nativeElement: mockElement,
    } as unknown as ElementRef<HTMLElement>;

    component.ngAfterViewInit();

    tick(50);
    expect(component.showRightArrow).toBe(true);

    component.ngOnDestroy();

    tick(1000);
  }));

  it('should update arrows on window resize', () => {
    const mockElement = {
      scrollWidth: 500,
      clientWidth: 200,
      scrollLeft: 0,
    };
    component.scrollWrapper = {
      nativeElement: mockElement,
    } as unknown as ElementRef<HTMLElement>;

    component.onWindowResize();

    expect(component.showLeftArrow).toBe(false);
    expect(component.showRightArrow).toBe(true);
  });

  it('should update arrows on scroll', () => {
    const mockElement = {
      scrollWidth: 500,
      clientWidth: 200,
      scrollLeft: 10,
    };
    component.scrollWrapper = {
      nativeElement: mockElement,
    } as unknown as ElementRef<HTMLElement>;

    component.onScroll();

    expect(component.showLeftArrow).toBe(true);
    expect(component.showRightArrow).toBe(true);
  });

  it('should scroll left and update arrows', fakeAsync(() => {
    const mockElement = {
      scrollWidth: 500,
      clientWidth: 200,
      scrollLeft: 100,
      scrollBy: jasmine.createSpy('scrollBy'),
    };
    component.scrollWrapper = {
      nativeElement: mockElement,
    } as unknown as ElementRef<HTMLElement>;

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
    component.scrollWrapper = {
      nativeElement: mockElement,
    } as unknown as ElementRef<HTMLElement>;

    component.scrollRight();

    expect(mockElement.scrollBy).toHaveBeenCalledWith({
      left: 200,
      behavior: 'smooth',
    });

    tick(500);
  }));

  it('should not crash when scrollWrapper is not defined for scrollLeft', () => {
    component.scrollWrapper = undefined as unknown as ElementRef<HTMLElement>;

    expect(() => component.scrollLeft()).not.toThrowError();
  });

  it('should not crash when scrollWrapper is not defined for scrollRight', () => {
    component.scrollWrapper = undefined as unknown as ElementRef<HTMLElement>;

    expect(() => component.scrollRight()).not.toThrowError();
  });

  it('should update arrows after ngAfterViewInit', fakeAsync(() => {
    const mockElement = {
      scrollWidth: 500,
      clientWidth: 200,
      scrollLeft: 0,
    };
    component.scrollWrapper = {
      nativeElement: mockElement,
    } as unknown as ElementRef<HTMLElement>;

    component.ngAfterViewInit();

    tick(500);

    expect(component.showRightArrow).toBe(true);
    expect(component.showLeftArrow).toBe(false);
  }));

  it('should schedule arrow updates on ngOnChanges when adventureGroups change', fakeAsync(() => {
    const mockElement = {
      scrollWidth: 500,
      clientWidth: 200,
      scrollLeft: 100,
    };
    component.scrollWrapper = {
      nativeElement: mockElement,
    } as unknown as ElementRef<HTMLElement>;

    component.ngOnChanges({
      adventureGroups: new SimpleChange(
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

  it('should not schedule arrow updates on ngOnChanges when adventureGroups do not change', fakeAsync(() => {
    const mockElement = {
      scrollWidth: 500,
      clientWidth: 200,
      scrollLeft: 0,
    };
    component.scrollWrapper = {
      nativeElement: mockElement,
    } as unknown as ElementRef<HTMLElement>;

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
    const mockElement = {
      scrollWidth: 200,
      clientWidth: 200,
      scrollLeft: 0,
    };
    component.scrollWrapper = {
      nativeElement: mockElement,
    } as unknown as ElementRef<HTMLElement>;

    component.onScroll();

    expect(component.showLeftArrow).toBe(false);
    expect(component.showRightArrow).toBe(false);
  });

  it('should hide both arrows when scroll is near the end', () => {
    const mockElement = {
      scrollWidth: 500,
      clientWidth: 200,
      scrollLeft: 300,
    };
    component.scrollWrapper = {
      nativeElement: mockElement,
    } as unknown as ElementRef<HTMLElement>;

    component.onScroll();

    expect(component.showLeftArrow).toBe(true);
    expect(component.showRightArrow).toBe(false);
  });

  it('should show right arrow but not left when scroll is at start', () => {
    const mockElement = {
      scrollWidth: 500,
      clientWidth: 200,
      scrollLeft: 0,
    };
    component.scrollWrapper = {
      nativeElement: mockElement,
    } as unknown as ElementRef<HTMLElement>;

    component.onScroll();

    expect(component.showLeftArrow).toBe(false);
    expect(component.showRightArrow).toBe(true);
  });

  it('should not update arrows when scrollWrapper nativeElement is null', () => {
    component.scrollWrapper = {
      nativeElement: null,
    } as unknown as ElementRef<HTMLElement>;

    expect(() => component.onScroll()).not.toThrowError();
  });

  it('should not update arrows when scrollWrapper is undefined', () => {
    component.scrollWrapper = undefined as unknown as ElementRef<HTMLElement>;

    expect(() => component.onScroll()).not.toThrowError();
  });
});
