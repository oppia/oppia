import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { BreadcrumbComponent } from './breadcrumb.component';
import { WindowRef } from 'services/contextual/window-ref.service';

describe('BreadcrumbComponent', () => {
  let component: BreadcrumbComponent;
  let fixture: ComponentFixture<BreadcrumbComponent>;
  let windowRef: WindowRef;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      declarations: [BreadcrumbComponent],
      providers: [WindowRef]
    }).compileComponents();

    windowRef = TestBed.inject(WindowRef);
    fixture = TestBed.createComponent(BreadcrumbComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show all items on desktop', () => {
    // Mock desktop width
    spyOnProperty(windowRef.nativeWindow, 'innerWidth').and.returnValue(1024);
    component.ngOnInit();

    const items = [
      { label: 'Home', url: '/', level: 1 },
      { label: 'Math', url: '/math', level: 2 },
      { label: 'Place Values', url: '/math/place-values', level: 3 }
    ];
    component.items = items;

    const displayItems = component.getDisplayItems();
    expect(displayItems.length).toBe(3);
    expect(displayItems).toEqual(items);
  });

  it('should show only parent item on mobile', () => {
    // Mock mobile width
    spyOnProperty(windowRef.nativeWindow, 'innerWidth').and.returnValue(375);
    component.ngOnInit();

    const items = [
      { label: 'Home', url: '/', level: 1 },
      { label: 'Math', url: '/math', level: 2 },
      { label: 'Place Values', url: '/math/place-values', level: 3 }
    ];
    component.items = items;

    const displayItems = component.getDisplayItems();
    expect(displayItems.length).toBe(1);
    expect(displayItems[0]).toEqual(items[1]); // Should show 'Math' as parent of 'Place Values'
  });

  it('should limit to 3 levels on desktop', () => {
    // Mock desktop width
    spyOnProperty(windowRef.nativeWindow, 'innerWidth').and.returnValue(1024);
    component.ngOnInit();

    const items = [
      { label: 'Home', url: '/', level: 1 },
      { label: 'Math', url: '/math', level: 2 },
      { label: 'Place Values', url: '/math/place-values', level: 3 },
      { label: 'Extra', url: '/math/place-values/extra', level: 4 }
    ];
    component.items = items;

    const displayItems = component.getDisplayItems();
    expect(displayItems.length).toBe(3);
    expect(displayItems).toEqual(items.slice(-3));
  });
}); 