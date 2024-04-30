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
    const mockDivElement = document.createElement('div');
    mockDivElement.style.width = '400px';
    const mockDivElementRef = {nativeElement: mockDivElement};
    component.cards = mockDivElementRef as any;
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should return 0 shifts for getMaxShifts if container can fit cards perfectly', () => {
    component.numCards = 2;

    expect(component.getMaxShifts(650)).toEqual(0);
  });

  it('should return correct number of shifts for getMaxShifts if container cannot fit cards', () => {
    expect(component.getMaxShifts(400)).toEqual(4);
  });

  describe('when shifting cards container to the right', () => {
    it('should shift by (cardWidth - 32) if first shift', () => {
      const cardsElement = component.cards.nativeElement;
      spyOn(cardsElement, 'scrollLeft');
    });

    it('should shift by cardWidth if not first shift or last', () => {});

    it('should shift by remainder needed to show last card if last shift', () => {});
  });

  describe('when shifting cards container to the left', () => {
    it('should shift by remainder needed to show last if first shift', () => {});

    it('should shift by cardWidth if not first shift or last', () => {});

    it('should shift by (cardWidth - 32) if last shift', () => {});
  });
});
