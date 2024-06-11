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
import {CardDisplayComponent} from './card-display.component';
import {NO_ERRORS_SCHEMA} from '@angular/core';

describe('CardDisplayComponent', () => {
  let component: CardDisplayComponent;
  let fixture: ComponentFixture<CardDisplayComponent>;
  let scrollLeftSetterSpy: jasmine.Spy;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [FormsModule, HttpClientTestingModule],
      declarations: [CardDisplayComponent, MockTranslatePipe],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CardDisplayComponent);
    component = fixture.componentInstance;

    component.numCards = 5;
    component.tabType = 'home';
    component.headingI18n = 'I18N_LEARNER_DASHBOARD_HOME_SAVED_SECTION';
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

  describe('when shifting cards container to the right', () => {
    it('should shift by (cardWidth - 32) if first shift to the right', () => {
      component.nextCard(1);

      fixture.detectChanges();

      expect(scrollLeftSetterSpy.calls.mostRecent().args[0]).toBe(200);
    });

    it('should shift by cardWidth if not first shift or last to the right', () => {
      spyOnProperty(
        component.cards.nativeElement,
        'scrollLeft',
        'get'
      ).and.returnValue(200);

      component.currentShift = 1;
      component.nextCard(2);

      fixture.detectChanges();

      expect(scrollLeftSetterSpy.calls.mostRecent().args[0]).toBe(432);
    });

    it('should shift by remainder needed to show last card if last shift to the right', () => {
      spyOnProperty(
        component.cards.nativeElement,
        'scrollLeft',
        'get'
      ).and.returnValue(664);

      component.currentShift = 3;
      component.nextCard(4);

      fixture.detectChanges();

      expect(scrollLeftSetterSpy.calls.mostRecent().args[0]).toBe(756.5);
    });
  });

  describe('when shifting cards container to the left', () => {
    it('should shift by remainder needed to show last if first shift', () => {
      spyOnProperty(
        component.cards.nativeElement,
        'scrollLeft',
        'get'
      ).and.returnValue(756.5);

      component.currentShift = 4;
      component.nextCard(3);

      fixture.detectChanges();

      expect(scrollLeftSetterSpy.calls.mostRecent().args[0]).toBe(664);
    });

    it('should shift by cardWidth if not first shift or last', () => {
      spyOnProperty(
        component.cards.nativeElement,
        'scrollLeft',
        'get'
      ).and.returnValue(664);

      component.currentShift = 3;
      component.nextCard(2);

      fixture.detectChanges();

      expect(scrollLeftSetterSpy.calls.mostRecent().args[0]).toBe(432);
    });

    it('should shift by (cardWidth - 32) if last shift', () => {
      spyOnProperty(
        component.cards.nativeElement,
        'scrollLeft',
        'get'
      ).and.returnValue(200);

      component.currentShift = 1;
      component.nextCard(0);

      fixture.detectChanges();

      expect(scrollLeftSetterSpy.calls.mostRecent().args[0]).toBe(0);
    });
  });
});
