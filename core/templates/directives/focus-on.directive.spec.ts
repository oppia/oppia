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
 * @fileoverview Unit tests for Focus on directive.
 */

import { Component, EventEmitter } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { FocusManagerService } from 'services/stateful/focus-manager.service';
import { FocusOnDirective } from './focus-on.directive';

@Component({
  selector: 'mock-comp-a',
  template: '<div [oppiaFocusOn]="label" id="label"></div>'
})
class MockCompA {
  label: 'label';
}

fdescribe('Focus on directive', () => {
  let component: MockCompA;
  let fixture: ComponentFixture<MockCompA>;
  let directiveInstance: FocusOnDirective;
  let mockEventEmitter = new EventEmitter();
  let focusManagerService: FocusManagerService = null;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [MockCompA, FocusOnDirective]
    }).compileComponents();
    focusManagerService = TestBed.inject(FocusManagerService);
    spyOnProperty(focusManagerService, 'onFocus')
      .and.returnValue(mockEventEmitter);

    fixture = TestBed.createComponent(MockCompA);
    component = fixture.componentInstance;
    fixture.detectChanges();

    const directiveEl = fixture.debugElement.query(
      By.directive(FocusOnDirective));
    expect(directiveEl).not.toBeNull();
    directiveInstance = directiveEl.injector.get(FocusOnDirective);
  }));
  afterEach(() => {
    directiveInstance.ngOnDestroy();
  })
  it('should focus on the given label', fakeAsync(
    () => {
    let element = fixture.debugElement.nativeElement
      .querySelector('.oppia-lost-changes')
      mockEventEmitter.emit('label');
      tick();
    }));
});