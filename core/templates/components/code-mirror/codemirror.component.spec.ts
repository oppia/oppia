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
 * @fileoverview Unit tests for angular code mirror wrapper.
 */

import { SimpleChanges } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { CodemirrorComponent } from '@ctrl/ngx-codemirror';
import { CodeMirrorComponent } from './codemirror.component';
import { CodeMirrorModule } from './codemirror.module';

describe('Oppia CodeMirror Component', () => {
  let component: CodeMirrorComponent;
  let fixture: ComponentFixture<CodeMirrorComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [CodeMirrorModule]
    }).compileComponents();
  }));

  beforeEach(waitForAsync(() => {
    fixture = TestBed.createComponent(CodeMirrorComponent);
    component = fixture.componentInstance;
  }));

  it('should throw error if CodeMirrorComponent is undefined', fakeAsync(
    () => {
      component.codemirrorComponent = undefined;
      expect(() => {
        component.ngAfterViewInit();
        tick(1);
      }).toThrowError('CodeMirrorComponent not Found');
    }));

  it('should notify that it has loaded', fakeAsync(() => {
    const onLoadSpy = jasmine.createSpy('onLoadSpy');
    let subscription = component.onLoad.subscribe(onLoadSpy);
    component.codemirrorComponent = {
      codemirror: {}
    } as unknown as CodemirrorComponent;
    component.ngAfterViewInit();
    tick(1);
    expect(onLoadSpy).toHaveBeenCalled();
    subscription.unsubscribe();
  }));

  it('should notify that it has loaded', waitForAsync(() => {
    const valueChangeSpy = jasmine.createSpy('valueChangeSpy');
    let subscription = component.valueChange.subscribe(valueChangeSpy);
    component.updateValue('a');
    expect(valueChangeSpy).toHaveBeenCalledWith('a');
    subscription.unsubscribe();
  }));

  it ('should refresh codemirror', waitForAsync(() => {
    component.codemirror = {
      refresh: () => {
        return;
      }
    } as CodeMirror.Editor;
    const refreshSpy = spyOn(component.codemirror, 'refresh');
    const changes: SimpleChanges = {
      refresh: {
        previousValue: false,
        currentValue: true,
        firstChange: false,
        isFirstChange: () => false
      }
    };
    component.ngOnChanges(changes);
    expect(refreshSpy).toHaveBeenCalled();
  }));
});
