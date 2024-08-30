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
 * @fileoverview Unit tests for CardDisplayComponent
 */

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {FormsModule} from '@angular/forms';
import {waitForAsync, ComponentFixture, TestBed} from '@angular/core/testing';
import {MockTranslatePipe} from 'tests/unit-test-utils';
import {ContentToggleButtonComponent} from '../content-toggle-button/content-toggle-button.component';
import {CardDisplayComponent} from './card-display.component';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {By} from '@angular/platform-browser';
class MockTranslateService {
  instant(key: string): string {
    return key;
  }
}

describe('CardDisplayComponent', () => {
  let component: CardDisplayComponent;
  let childComponent: ContentToggleButtonComponent;
  let fixture: ComponentFixture<CardDisplayComponent>;
  let childFixture: ComponentFixture<ContentToggleButtonComponent>;
  let scrollLeftSetterSpy: jasmine.Spy;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [FormsModule, HttpClientTestingModule],
      declarations: [
        CardDisplayComponent,
        ContentToggleButtonComponent,
        MockTranslatePipe,
      ],
      providers: [
        {
          provide: TranslateService,
          useClass: MockTranslateService,
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CardDisplayComponent);
    component = fixture.componentInstance;
    childFixture = TestBed.createComponent(ContentToggleButtonComponent);
    childComponent = childFixture.componentInstance;
    TestBed.inject(TranslateService);

    component.numCards = 5;
    component.tabType = 'home';
    component.headingI18n = 'I18N_LEARNER_DASHBOARD_HOME_SAVED_SECTION';
    component.isLanguageRTL = false;
    fixture.detectChanges();

    spyOnProperty(
      component.cards.nativeElement,
      'offsetWidth',
      'get'
    ).and.returnValue(400);

    scrollLeftSetterSpy = spyOnProperty(
      component.cards.nativeElement,
      'scrollLeft',
      'set'
    );
  });

  it('should return 0 shifts for getMaxShifts if container can fit cards perfectly', () => {
    component.numCards = 2;

    expect(component.getMaxShifts(650)).toEqual(0);
  });

  it('should return correct number of shifts for getMaxShifts if container cannot fit cards', () => {
    expect(component.getMaxShifts(400)).toEqual(4);
  });

  describe('LTR: ', () => {
    beforeEach(() => {
      component.isLanguageRTL = false;
      fixture.detectChanges();
    });

    describe('when shifting to next card', () => {
      it('should add (cardWidth - 32) if first shift', () => {
        component.moveCard(1);

        fixture.detectChanges();

        expect(scrollLeftSetterSpy.calls.mostRecent().args[0]).toBe(200);
      });

      it('should add cardWidth if not first or last shift', () => {
        spyOnProperty(
          component.cards.nativeElement,
          'scrollLeft',
          'get'
        ).and.returnValue(200);

        component.currentShift = 1;
        component.moveCard(2);

        fixture.detectChanges();

        expect(scrollLeftSetterSpy.calls.mostRecent().args[0]).toBe(432);
      });

      it('should add remainder if last shift, setting scrollLeft = div width', () => {
        spyOnProperty(
          component.cards.nativeElement,
          'scrollLeft',
          'get'
        ).and.returnValue(664);

        component.currentShift = 3;
        component.moveCard(4);

        fixture.detectChanges();

        expect(scrollLeftSetterSpy.calls.mostRecent().args[0]).toBe(756.5);
      });
    });

    describe('when shifting to previous card', () => {
      it('should subtract remainder if from last shift', () => {
        spyOnProperty(
          component.cards.nativeElement,
          'scrollLeft',
          'get'
        ).and.returnValue(756.5);

        component.currentShift = 4;
        component.moveCard(3);

        fixture.detectChanges();

        expect(scrollLeftSetterSpy.calls.mostRecent().args[0]).toBe(664);
      });

      it('should subtract cardWidth if not first or last shift', () => {
        spyOnProperty(
          component.cards.nativeElement,
          'scrollLeft',
          'get'
        ).and.returnValue(664);

        component.currentShift = 3;
        component.moveCard(2);

        fixture.detectChanges();

        expect(scrollLeftSetterSpy.calls.mostRecent().args[0]).toBe(432);
      });

      it('should subtract (cardWidth - 32) to reset scrollLeft = 0', () => {
        spyOnProperty(
          component.cards.nativeElement,
          'scrollLeft',
          'get'
        ).and.returnValue(200);

        component.currentShift = 1;
        component.moveCard(0);

        fixture.detectChanges();

        expect(scrollLeftSetterSpy.calls.mostRecent().args[0]).toBe(0);
      });
    });
  });

  describe('RTL: ', () => {
    beforeEach(() => {
      component.isLanguageRTL = true;
      fixture.detectChanges();
    });

    describe('when shifting to next card', () => {
      it('should subtract (cardWidth - 32) if first shift', () => {
        component.moveCard(1);

        fixture.detectChanges();

        expect(scrollLeftSetterSpy.calls.mostRecent().args[0]).toBe(-200);
      });

      it('should subtract by cardWidth if not first or last shift', () => {
        spyOnProperty(
          component.cards.nativeElement,
          'scrollLeft',
          'get'
        ).and.returnValue(-200);

        component.currentShift = 1;
        component.moveCard(2);

        fixture.detectChanges();

        expect(scrollLeftSetterSpy.calls.mostRecent().args[0]).toBe(-432);
      });

      it('should subtract remainder if last shift, setting scrollLeft = -div width', () => {
        spyOnProperty(
          component.cards.nativeElement,
          'scrollLeft',
          'get'
        ).and.returnValue(-664);

        component.currentShift = 3;
        component.moveCard(4);

        fixture.detectChanges();

        expect(scrollLeftSetterSpy.calls.mostRecent().args[0]).toBe(-756.5);
      });
    });

    describe('when shifting to previous card', () => {
      it('should add remainder if from last card', () => {
        spyOnProperty(
          component.cards.nativeElement,
          'scrollLeft',
          'get'
        ).and.returnValue(-756.5);

        component.currentShift = 4;
        component.moveCard(3);

        fixture.detectChanges();

        expect(scrollLeftSetterSpy.calls.mostRecent().args[0]).toBe(-664);
      });

      it('should add cardWidth if not first or last shift', () => {
        spyOnProperty(
          component.cards.nativeElement,
          'scrollLeft',
          'get'
        ).and.returnValue(-664);

        component.currentShift = 3;
        component.moveCard(2);

        fixture.detectChanges();

        expect(scrollLeftSetterSpy.calls.mostRecent().args[0]).toBe(-432);
      });

      it('should add (cardWidth - 32) to reset scrollLeft = 0', () => {
        spyOnProperty(
          component.cards.nativeElement,
          'scrollLeft',
          'get'
        ).and.returnValue(-200);

        component.currentShift = 1;
        component.moveCard(0);

        fixture.detectChanges();

        expect(scrollLeftSetterSpy.calls.mostRecent().args[0]).toBe(0);
      });
    });
  });

  it('should handle event emitted by content toggle button', () => {
    component.tabType = 'progress';
    fixture.detectChanges();

    spyOn(component, 'handleToggleState').and.callThrough();
    const button = fixture.debugElement.query(
      By.directive(ContentToggleButtonComponent)
    ).componentInstance;
    button.toggle();

    fixture.detectChanges();

    expect(component.handleToggleState).toHaveBeenCalledWith(true);
    expect(component.toggleState).toBeTrue();
  });

  it('should return empty string for getVisibility if tabType is not progress', () => {
    expect(component.getVisibility()).toEqual('');
  });

  it('should return hidden class for getVisibility if tabType is progress', () => {
    component.tabType = 'progress';

    fixture.detectChanges();

    expect(component.getVisibility()).toEqual('card-display-content-hidden');
  });

  it('should return shown class for getVisibility after toggling if tabType is progress', () => {
    component.tabType = 'progress';
    fixture.detectChanges();
    const button = fixture.debugElement.query(
      By.directive(ContentToggleButtonComponent)
    ).componentInstance;
    button.toggle();

    fixture.detectChanges();

    expect(component.toggleState).toBeTrue();
    expect(component.getVisibility()).toEqual('card-display-content-shown');
  });
});
