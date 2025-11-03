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

import {
  Component,
  ComponentFactoryResolver,
  ComponentRef,
  SimpleChange,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {InteractionDisplayComponent} from './interaction-display.component';

@Component({
  // Host component used to obtain a real ViewContainerRef for tests.
  template: '<ng-template #vc></ng-template>',
})
class HostComponent {
  @ViewChild('vc', {read: ViewContainerRef, static: true})
  vcr!: ViewContainerRef;
}

describe('Interaction display', () => {
  let fixture: ComponentFixture<InteractionDisplayComponent>;
  let componentInstance: InteractionDisplayComponent;
  let componentFactoryResolver: ComponentFactoryResolver;
  let hostFixture: ComponentFixture<HostComponent>;
  let hostVcr: ViewContainerRef;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [InteractionDisplayComponent, HostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(InteractionDisplayComponent);
    componentInstance = fixture.componentInstance;
    componentFactoryResolver = TestBed.inject(ComponentFactoryResolver);
    hostFixture = TestBed.createComponent(HostComponent);
    // Trigger initial lifecycle so @ViewChild resolves.
    hostFixture.detectChanges();
    hostVcr = hostFixture.componentInstance.vcr;
  }));

  it('should create', () => {
    expect(componentInstance).toBeDefined();
  });

  it('should build interaction using htmlData', () => {
    componentInstance.htmlData =
      '<oppia-interactive-text-input rows-with-value="1" ' +
      'placeholder-with-value="{&amp;quot;unicode_str&amp;quot;:&amp;quot;}"' +
      '[last-answer]="null"></oppia-interactive-text-input>';

    let setAttributeSpy = jasmine.createSpy('setAttribute');
    let mockComponentRef = {
      changeDetectorRef: {
        detectChanges: () => {},
      },
      location: {
        nativeElement: {
          setAttribute: setAttributeSpy,
        },
      },
      instance: {},
    };

    // Use a real ViewContainerRef from HostComponent to avoid unsafe casts.
    componentInstance.viewContainerRef = hostVcr;
    spyOn(componentFactoryResolver, 'resolveComponentFactory');
    spyOn(hostVcr, 'createComponent')
      // Unknown type is used here because the type of the component
      // is not known. This is because the component is dynamically
      // created.
      .and.returnValue(mockComponentRef as ComponentRef<unknown>);

    componentInstance.buildInteraction();

    expect(setAttributeSpy).toHaveBeenCalled();
    // Verify that setAttribute was called with the correct arguments.
    expect(setAttributeSpy.calls.count()).toBeGreaterThan(0);
  });

  it('should build interaction using htmlData and parentScope', () => {
    let lastAnswer = 'last-answer';
    componentInstance.htmlData =
      '<oppia-interactive-text-input rows-with-value="1" ' +
      'placeholder-with-value="{&amp;quot;unicode_str&amp;quot;:&amp;quot;}"' +
      '[last-answer]="lastAnswer"></oppia-interactive-text-input>';

    let setAttributeSpy = jasmine.createSpy('setAttribute');
    let mockComponentRef = {
      changeDetectorRef: {
        detectChanges: () => {},
      },
      location: {
        nativeElement: {
          setAttribute: setAttributeSpy,
        },
      },
      instance: {
        lastAnswer: '',
      },
    };

    // Use a real ViewContainerRef from HostComponent to avoid unsafe casts.
    componentInstance.viewContainerRef = hostVcr;
    componentInstance.parentScope = {
      lastAnswer,
    };

    spyOn(componentFactoryResolver, 'resolveComponentFactory');
    spyOn(hostVcr, 'createComponent')
      // Unknown type is used here because the type of the component
      // is not known. This is because the component is dynamically
      // created.
      .and.returnValue(mockComponentRef as ComponentRef<unknown>);

    componentInstance.buildInteraction();

    expect(setAttributeSpy).toHaveBeenCalled();
    // Verify that setAttribute was called with the correct arguments.
    expect(setAttributeSpy.calls.count()).toBeGreaterThan(0);
    expect(mockComponentRef.instance.lastAnswer).toEqual(lastAnswer);
  });

  it('should invoke interactioni after view is initialized', () => {
    spyOn(componentInstance, 'buildInteraction');

    componentInstance.ngAfterViewInit();

    expect(componentInstance.buildInteraction).toHaveBeenCalled();
  });

  it('should rebuild interaction if htmlData is updated', () => {
    // Use the real ViewContainerRef from HostComponent.
    componentInstance.viewContainerRef = hostVcr;
    spyOn(componentInstance, 'buildInteraction');

    componentInstance.ngOnChanges({
      htmlData: new SimpleChange('previousValue', 'newValue', true),
    });

    expect(componentInstance.buildInteraction).toHaveBeenCalled();
  });

  it('should not rebuild interaction if htmlData has not changed', () => {
    componentInstance.viewContainerRef = hostVcr;
    spyOn(componentInstance, 'buildInteraction');

    componentInstance.ngOnChanges({
      htmlData: new SimpleChange('sameValue', 'sameValue', false),
    });

    expect(componentInstance.buildInteraction).not.toHaveBeenCalled();
  });

  it('should not rebuild interaction if viewContainerRef is not initialized', () => {
    spyOn(componentInstance, 'buildInteraction');

    componentInstance.ngOnChanges({
      htmlData: new SimpleChange('previousValue', 'newValue', true),
    });

    expect(componentInstance.buildInteraction).not.toHaveBeenCalled();
  });

  it('should not build interaction when htmlData is empty', () => {
    componentInstance.htmlData = '';
    componentInstance.viewContainerRef = hostVcr;
    spyOn(hostVcr, 'createComponent');

    componentInstance.buildInteraction();

    expect(hostVcr.createComponent).not.toHaveBeenCalled();
  });

  it('should not build interaction when tag is not in mapping', () => {
    componentInstance.htmlData = '<unknown-tag></unknown-tag>';
    componentInstance.viewContainerRef = hostVcr;
    spyOn(hostVcr, 'createComponent');

    componentInstance.buildInteraction();

    expect(hostVcr.createComponent).not.toHaveBeenCalled();
  });

  it('should handle savedSolution bracketed binding', () => {
    let savedSolution = 'saved-solution-value';
    componentInstance.htmlData =
      '<oppia-interactive-text-input ' +
      '[saved-solution]="savedSolution"></oppia-interactive-text-input>';

    let setAttributeSpy = jasmine.createSpy('setAttribute');
    let mockComponentRef = {
      changeDetectorRef: {
        detectChanges: () => {},
      },
      location: {
        nativeElement: {
          setAttribute: setAttributeSpy,
        },
      },
      instance: {
        savedSolution: '',
      },
    };

    componentInstance.viewContainerRef = hostVcr;
    componentInstance.parentScope = {
      lastAnswer: null,
      savedSolution,
    };

    spyOn(componentFactoryResolver, 'resolveComponentFactory');
    spyOn(hostVcr, 'createComponent').and.returnValue(
      mockComponentRef as ComponentRef<unknown>
    );

    componentInstance.buildInteraction();

    expect(mockComponentRef.instance.savedSolution).toEqual(savedSolution);
  });

  it('should handle savedSolution as null when undefined in parentScope', () => {
    componentInstance.htmlData =
      '<oppia-interactive-text-input ' +
      '[saved-solution]="savedSolution"></oppia-interactive-text-input>';

    let mockComponentRef = {
      changeDetectorRef: {
        detectChanges: () => {},
      },
      location: {
        nativeElement: {
          setAttribute: jasmine.createSpy('setAttribute'),
        },
      },
      instance: {
        savedSolution: 'initial-value',
      },
    };

    componentInstance.viewContainerRef = hostVcr;
    componentInstance.parentScope = {
      lastAnswer: null,
      // Saved Solution is intentionally undefined.
    };

    spyOn(componentFactoryResolver, 'resolveComponentFactory');
    spyOn(hostVcr, 'createComponent').and.returnValue(
      mockComponentRef as ComponentRef<unknown>
    );

    componentInstance.buildInteraction();

    expect(mockComponentRef.instance.savedSolution).toBeNull();
  });

  it('should handle savedSolution as null when parentScope is undefined', () => {
    componentInstance.htmlData =
      '<oppia-interactive-text-input ' +
      '[saved-solution]="savedSolution"></oppia-interactive-text-input>';

    let mockComponentRef = {
      changeDetectorRef: {
        detectChanges: () => {},
      },
      location: {
        nativeElement: {
          setAttribute: jasmine.createSpy('setAttribute'),
        },
      },
      instance: {
        savedSolution: 'initial-value',
      },
    };

    componentInstance.viewContainerRef = hostVcr;
    // Parent Scope is intentionally undefined.

    spyOn(componentFactoryResolver, 'resolveComponentFactory');
    spyOn(hostVcr, 'createComponent').and.returnValue(
      mockComponentRef as ComponentRef<unknown>
    );

    componentInstance.buildInteraction();

    expect(mockComponentRef.instance.savedSolution).toBeNull();
  });

  it('should not set lastAnswer if instance does not have that property', () => {
    componentInstance.htmlData =
      '<oppia-interactive-text-input ' +
      '[last-answer]="lastAnswer"></oppia-interactive-text-input>';

    let mockComponentRef = {
      changeDetectorRef: {
        detectChanges: () => {},
      },
      location: {
        nativeElement: {
          setAttribute: jasmine.createSpy('setAttribute'),
        },
      },
      instance: {},
    };

    componentInstance.viewContainerRef = hostVcr;
    componentInstance.parentScope = {
      lastAnswer: 'some-answer',
    };

    spyOn(componentFactoryResolver, 'resolveComponentFactory');
    spyOn(hostVcr, 'createComponent').and.returnValue(
      mockComponentRef as ComponentRef<unknown>
    );

    componentInstance.buildInteraction();

    expect('lastAnswer' in mockComponentRef.instance).toBeFalse();
  });

  it('should not set savedSolution if instance does not have that property', () => {
    componentInstance.htmlData =
      '<oppia-interactive-text-input ' +
      '[saved-solution]="savedSolution"></oppia-interactive-text-input>';

    let mockComponentRef = {
      changeDetectorRef: {
        detectChanges: () => {},
      },
      location: {
        nativeElement: {
          setAttribute: jasmine.createSpy('setAttribute'),
        },
      },
      instance: {},
    };

    componentInstance.viewContainerRef = hostVcr;
    componentInstance.parentScope = {
      lastAnswer: null,
      savedSolution: 'some-solution',
    };

    spyOn(componentFactoryResolver, 'resolveComponentFactory');
    spyOn(hostVcr, 'createComponent').and.returnValue(
      mockComponentRef as ComponentRef<unknown>
    );

    componentInstance.buildInteraction();

    expect('savedSolution' in mockComponentRef.instance).toBeFalse();
  });

  it('should handle lastAnswer as null when parentScope is undefined', () => {
    componentInstance.htmlData =
      '<oppia-interactive-text-input ' +
      '[last-answer]="lastAnswer"></oppia-interactive-text-input>';

    let mockComponentRef = {
      changeDetectorRef: {
        detectChanges: () => {},
      },
      location: {
        nativeElement: {
          setAttribute: jasmine.createSpy('setAttribute'),
        },
      },
      instance: {
        lastAnswer: 'initial-value',
      },
    };

    componentInstance.viewContainerRef = hostVcr;
    // Parent Scope is intentionally undefined.

    spyOn(componentFactoryResolver, 'resolveComponentFactory');
    spyOn(hostVcr, 'createComponent').and.returnValue(
      mockComponentRef as ComponentRef<unknown>
    );

    componentInstance.buildInteraction();

    expect(mockComponentRef.instance.lastAnswer).toBeNull();
  });

  it('should clear viewContainerRef when htmlData changes', () => {
    componentInstance.viewContainerRef = hostVcr;
    spyOn(hostVcr, 'clear');
    spyOn(componentInstance, 'buildInteraction');

    componentInstance.ngOnChanges({
      htmlData: new SimpleChange('oldValue', 'newValue', false),
    });

    expect(hostVcr.clear).toHaveBeenCalled();
    expect(componentInstance.buildInteraction).toHaveBeenCalled();
  });
});
