// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the end chapter celebration
 * check mark component.
 */

import { ComponentFixture, waitForAsync, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { EndChapterCheckMarkComponent } from './end-chapter-check-mark.component';

describe('End chapter check mark component', function() {
  let component: EndChapterCheckMarkComponent;
  let fixture: ComponentFixture<EndChapterCheckMarkComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [EndChapterCheckMarkComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EndChapterCheckMarkComponent);
    component = fixture.componentInstance;
  });

  it('should check if component is initialized', () => {
    expect(component).toBeDefined();
  });

  it('should animate the check mark', fakeAsync(() => {
    expect(component.circleIsShown).toBe(false);
    expect(component.innerTickIsShown).toBe(false);

    component.animateCheckMark();

    tick(501);
    expect(component.circleIsShown).toBe(true);

    tick(751);
    expect(component.innerTickIsShown).toBe(true);

    tick(2301);
    expect(component.circleIsShown).toBe(false);

    tick(2551);
    expect(component.innerTickIsShown).toBe(false);
  }));
});
