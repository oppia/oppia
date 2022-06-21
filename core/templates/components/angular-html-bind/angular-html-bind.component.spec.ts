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
 * @fileoverview Unit tests for angular html bind components.
 */

import { ComponentFactoryResolver, ComponentRef, ViewContainerRef } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { AngularHtmlBindComponent } from './angular-html-bind.component';

describe('Angular html bind', () => {
  let fixture: ComponentFixture<AngularHtmlBindComponent>;
  let componentInstance: AngularHtmlBindComponent;
  let componentFactoryResolver: ComponentFactoryResolver;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [AngularHtmlBindComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(AngularHtmlBindComponent);
    componentInstance = fixture.componentInstance;
    componentFactoryResolver = TestBed.inject(ComponentFactoryResolver);
  }));

  it('should create', () => {
    expect(componentInstance).toBeDefined();
  });

  it('should obtain camel case property from hyphen', () => {
    expect(componentInstance.camelCaseFromHyphen('[last-answer]')).toEqual(
      'lastAnswer');
    expect(componentInstance.camelCaseFromHyphen('placeholder-value')).toEqual(
      'placeholderValue');
  });

  it('should replace trailing \' &nbsp; &nbsp;' +
  ' %nbsp;</p>\' with just \'</p>\'. with </p>', () => {
    componentInstance.ngOnChanges({
      htmlData: {
        previousValue: null,
        currentValue: '<p>\&nbsp\;<\/p>\n\n',
        isFirstChange: () => true,
        firstChange: true
      }
    });

    expect(componentInstance.htmlData).toEqual('');
  });

  it('should create interaction using htmlData', () => {
    componentInstance.htmlData = (
      '<oppia-interactive-text-input rows-with-value="1" ' +
      'placeholder-with-value="{&amp;quot;unicode_str&amp;quot;:&amp;quot;}"' +
      '[last-answer]="null"></oppia-interactive-text-input>');

    let setAttributeSpy = jasmine.createSpy('setAttribute');
    let mockComponentRef = {
      changeDetectorRef: {
        detectChanges: () => {}
      },
      location: {
        nativeElement: {
          setAttribute: setAttributeSpy
        }
      },
      instance: {
        placeholderWithValue: ''
      }
    };

    componentInstance.viewContainerRef = {
      createComponent: null
    } as ViewContainerRef;
    spyOn(componentFactoryResolver, 'resolveComponentFactory');
    spyOn(componentInstance.viewContainerRef, 'createComponent')
      .and.returnValue(mockComponentRef as ComponentRef<unknown>);

    componentInstance.ngAfterViewInit();

    expect(setAttributeSpy).toHaveBeenCalled();
    expect(mockComponentRef.instance.placeholderWithValue.length)
      .toBeGreaterThan(0);
  });

  it('should create interaction using htmlData and parentScope', () => {
    let lastAnswer = 'last-answer';
    componentInstance.htmlData = (
      '<oppia-interactive-text-input rows-with-value="1" ' +
      'placeholder-with-value="{&amp;quot;unicode_str&amp;quot;:&amp;quot;}"' +
      '[last-answer]="lastAnswer"></oppia-interactive-text-input>');

    let setAttributeSpy = jasmine.createSpy('setAttribute');
    let mockComponentRef = {
      changeDetectorRef: {
        detectChanges: () => {}
      },
      location: {
        nativeElement: {
          setAttribute: setAttributeSpy
        }
      },
      instance: {
        placeholderWithValue: '',
        lastAnswer: '',
      }
    };

    componentInstance.viewContainerRef = {
      createComponent: null
    } as ViewContainerRef;
    componentInstance.parentScope = {
      lastAnswer,
    };

    spyOn(componentFactoryResolver, 'resolveComponentFactory');
    spyOn(componentInstance.viewContainerRef, 'createComponent')
      .and.returnValue(mockComponentRef as ComponentRef<unknown>);

    componentInstance.ngAfterViewInit();

    expect(setAttributeSpy).toHaveBeenCalled();
    expect(mockComponentRef.instance.placeholderWithValue.length)
      .toBeGreaterThan(0);
    expect(mockComponentRef.instance.lastAnswer).toEqual(lastAnswer);
  });
});
