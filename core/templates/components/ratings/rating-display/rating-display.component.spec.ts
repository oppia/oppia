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
 * @fileoverview Unit tests for rating display component.
 */

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { RatingDisplayComponent } from './rating-display.component';

describe('Rating display component', () => {
  let componentInstance: RatingDisplayComponent;
  let fixture: ComponentFixture<RatingDisplayComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [],
      declarations: [
        RatingDisplayComponent
      ],
      providers: [],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RatingDisplayComponent);
    componentInstance = fixture.componentInstance;
  });

  it('should initialize component properties correctly', () => {
    spyOn(componentInstance, 'displayValue');

    componentInstance.ngOnInit();

    expect(componentInstance.status).toEqual(componentInstance.STATUS_INACTIVE);
  });

  it('should display value when user reaches end of exploration', () => {
    componentInstance.ngOnInit();

    componentInstance.status = componentInstance.STATUS_ACTIVE;

    componentInstance.displayValue(4);


    expect(componentInstance.stars).toBeDefined();
  });

  it('should update rating value when user provides new rating', () => {
    componentInstance.isEditable = true;
    componentInstance.status = componentInstance.STATUS_ACTIVE;

    spyOn(componentInstance, 'displayValue');
    spyOn(componentInstance.edit, 'emit');

    componentInstance.clickStar(4);

    expect(componentInstance.status).toEqual(
      componentInstance.STATUS_RATING_SET);
    expect(componentInstance.ratingValue).toEqual(4);
    expect(componentInstance.edit.emit).toHaveBeenCalled();
  });

  it('should highlight star when user hovers over it', () => {
    componentInstance.isEditable = true;
    componentInstance.status = componentInstance.STATUS_ACTIVE;

    spyOn(componentInstance, 'displayValue');

    componentInstance.enterStar(2);

    expect(componentInstance.status).toEqual(componentInstance.STATUS_ACTIVE);
    expect(componentInstance.displayValue).toHaveBeenCalledWith(2);
  });

  it('should stop highlighting star if user is not hovering anymore', () => {
    spyOn(componentInstance, 'displayValue');

    componentInstance.leaveArea();

    expect(componentInstance.displayValue).toHaveBeenCalled();
  });
});
