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

import {Component, EventEmitter} from '@angular/core';
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
  waitForAsync,
} from '@angular/core/testing';
import {By} from '@angular/platform-browser';
import {FocusManagerService} from 'services/stateful/focus-manager.service';
import {FocusOnDirective} from './focus-on.directive';

@Component({
  selector: 'mock-comp-a',
  template: '<div [oppiaFocusOn]="label" class="focus-label"></div>',
})
class MockCompA {
  label!: 'label';
}

describe('Focus on component', () => {
  let fixture: ComponentFixture<MockCompA>;
  let directiveInstance: FocusOnDirective;
  let mockEventEmitter = new EventEmitter();
  let focusManagerService: FocusManagerService;
  let focusSpy: jasmine.Spy;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [MockCompA, FocusOnDirective],
    }).compileComponents();
    focusManagerService = TestBed.inject(FocusManagerService);
    focusSpy = spyOnProperty(focusManagerService, 'onFocus').and.returnValue(
      mockEventEmitter
    );

    fixture = TestBed.createComponent(MockCompA);
    fixture.detectChanges();

    const directiveEl = fixture.debugElement.query(
      By.directive(FocusOnDirective)
    );
    expect(directiveEl).not.toBeNull();
    directiveInstance = directiveEl.injector.get(FocusOnDirective);
  }));

  afterEach(() => {
    directiveInstance.ngOnDestroy();
  });

  it('should successfully compile the given component', fakeAsync(() => {
    let el = (fixture.debugElement.nativeElement.getElementsByClassName(
      'focus-label'
    )[0].innerHtml = '<div class="focus-label"></div>');

    directiveInstance.focusOn = 'label';
    mockEventEmitter.emit('labelForClearingFocus');
    tick();

    expect(el).toEqual('<div class="focus-label"></div>');
  }));

  it('should focus on the given label', fakeAsync(() => {
    directiveInstance.focusOn = 'label';

    mockEventEmitter.emit('label');
    tick();

    expect(focusSpy).toHaveBeenCalled();
  }));
});
