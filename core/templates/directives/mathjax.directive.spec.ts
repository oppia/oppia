import {Component} from '@angular/core';
import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {MathJaxDirective} from './mathjax.directive';
import {InsertScriptService} from 'services/insert-script.service';
import {By} from '@angular/platform-browser';

/**
 * @fileoverview Unit tests for mathjax directive
 */

@Component({
  selector: 'mock-comp-a',
  template: '  <span [oppiaMathJax]="expr"></span>',
})
class MockCompA {
  expr: string = '/frac{x}{y}';
}

const mockMathJaxHub = {
  Queue: () => {
    return;
  },
};
const mockMathJs = {
  Hub: mockMathJaxHub,
};

describe('MathJax directive', () => {
  let component: MockCompA;
  let fixture: ComponentFixture<MockCompA>;
  let mockInsertScriptService: jasmine.SpyObj<InsertScriptService>;
  const originalMathJax = window.MathJax;

  beforeEach(waitForAsync(() => {
    mockInsertScriptService = jasmine.createSpyObj('InsertScriptService', [
      'loadScript',
    ]);
    TestBed.configureTestingModule({
      declarations: [MockCompA, MathJaxDirective],
      providers: [
        {provide: InsertScriptService, useValue: mockInsertScriptService},
      ],
    }).compileComponents();
  }));

  beforeEach(waitForAsync(() => {
    fixture = TestBed.createComponent(MockCompA);
    component = fixture.componentInstance;
    window.MathJax = mockMathJs as unknown as typeof MathJax;

    mockInsertScriptService.loadScript.and.callFake((script, callback) => {
      // Simulate script loaded.
      callback();
    });

    // Trigger Angular's change detection.
    fixture.detectChanges();
  }));

  afterEach(() => {
    window.MathJax = originalMathJax;
  });

  it('should re-render math expr when expr changes', waitForAsync(() => {
    const spy = spyOn(mockMathJaxHub, 'Queue');
    component.expr = '/frac{z}{y}';
    fixture.detectChanges();

    expect(spy).toHaveBeenCalled();

    const el = fixture.debugElement.query(By.directive(MathJaxDirective));

    const scriptTag = el.nativeElement.querySelector('script[type="math/tex"]');
    expect(scriptTag).not.toBeNull();
    expect(scriptTag.textContent).toContain('/frac{z}{y}');
  }));
});
