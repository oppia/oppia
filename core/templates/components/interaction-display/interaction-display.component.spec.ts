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
 * @fileoverview Unit tests for interaction display component.
 */

import { ComponentFactoryResolver, ComponentRef, SimpleChange, ViewContainerRef } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { InteractionDisplayComponent } from './interaction-display.component';

describe('Interaction display', () => {
  let fixture: ComponentFixture<InteractionDisplayComponent>;
  let componentInstance: InteractionDisplayComponent;
  let componentFactoryResolver: ComponentFactoryResolver;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [InteractionDisplayComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(InteractionDisplayComponent);
    componentInstance = fixture.componentInstance;
    componentFactoryResolver = TestBed.inject(ComponentFactoryResolver);
  }));

  it('should create', () => {
    expect(componentInstance).toBeDefined();
  });

  it('should build interaction using htmlData', () => {
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
      // Unknown type is used here because the type of the component
      // is not known. This is because the component is dynamically
      // created.
      .and.returnValue(mockComponentRef as ComponentRef<unknown>);

    componentInstance.buildInteraction();

    expect(setAttributeSpy).toHaveBeenCalled();
    expect(mockComponentRef.instance.placeholderWithValue.length)
      .toBeGreaterThan(0);
  });

  it('should build interaction using htmlData and parentScope', () => {
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
      // Unknown type is used here because the type of the component
      // is not known. This is because the component is dynamically
      // created.
      .and.returnValue(mockComponentRef as ComponentRef<unknown>);

    componentInstance.buildInteraction();

    expect(setAttributeSpy).toHaveBeenCalled();
    expect(mockComponentRef.instance.placeholderWithValue.length)
      .toBeGreaterThan(0);
    expect(mockComponentRef.instance.lastAnswer).toEqual(lastAnswer);
  });

  it('should invoke interactioni after view is initialized', () => {
    spyOn(componentInstance, 'buildInteraction');

    componentInstance.ngAfterViewInit();

    expect(componentInstance.buildInteraction).toHaveBeenCalled();
  });

  it('should rebuild interaction if htmlData is updated', () => {
    componentInstance.viewContainerRef = {
      clear: () => {}
    } as ViewContainerRef;
    spyOn(componentInstance, 'buildInteraction');

    componentInstance.ngOnChanges({
      htmlData: new SimpleChange('previousValue', 'newValue', true)
    });

    expect(componentInstance.buildInteraction).toHaveBeenCalled();
  });
});
