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
 * @fileoverview Unit tests for audio slider component.
 */

import {NO_ERRORS_SCHEMA} from '@angular/core';
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  waitForAsync,
} from '@angular/core/testing';
import {AudioSliderComponent} from './audio-slider.component';

describe('Audio Slider Component', () => {
  let fixture: ComponentFixture<AudioSliderComponent>;
  let component: AudioSliderComponent;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [AudioSliderComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(waitForAsync(() => {
    fixture = TestBed.createComponent(AudioSliderComponent);
    component = fixture.componentInstance;
  }));

  it('should emit value when slider value changes', fakeAsync(() => {
    const valueChangeSpy = spyOn(component.valueChange, 'emit');
    const eventPayload = {value: 5};
    component.setDuration(eventPayload);
    expect(valueChangeSpy).toHaveBeenCalledWith(eventPayload);
  }));
});
