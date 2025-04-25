import { TestBed } from '@angular/core/testing';
import { BreadcrumbService } from './breadcrumb.service';
import { BreadcrumbItem } from './breadcrumb.component';

describe('BreadcrumbService', () => {
  let service: BreadcrumbService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BreadcrumbService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should set and get breadcrumbs', () => {
    const items: BreadcrumbItem[] = [
      { label: 'Home', url: '/', level: 1 },
      { label: 'Math', url: '/math', level: 2 }
    ];

    service.setBreadcrumbs(items);
    expect(service.getCurrentBreadcrumbs()).toEqual(items);
  });

  it('should clear breadcrumbs', () => {
    const items: BreadcrumbItem[] = [
      { label: 'Home', url: '/', level: 1 },
      { label: 'Math', url: '/math', level: 2 }
    ];

    service.setBreadcrumbs(items);
    service.clearBreadcrumbs();
    expect(service.getCurrentBreadcrumbs()).toEqual([]);
  });

  it('should sort breadcrumbs by level', () => {
    const unsortedItems: BreadcrumbItem[] = [
      { label: 'Math', url: '/math', level: 2 },
      { label: 'Home', url: '/', level: 1 }
    ];

    const expectedSortedItems: BreadcrumbItem[] = [
      { label: 'Home', url: '/', level: 1 },
      { label: 'Math', url: '/math', level: 2 }
    ];

    service.setBreadcrumbs(unsortedItems);
    expect(service.getCurrentBreadcrumbs()).toEqual(expectedSortedItems);
  });

  it('should update breadcrumb at specific level', () => {
    const items: BreadcrumbItem[] = [
      { label: 'Home', url: '/', level: 1 },
      { label: 'Math', url: '/math', level: 2 }
    ];

    service.setBreadcrumbs(items);
    service.updateBreadcrumbLevel(2, { label: 'Updated Math' });

    const expected = [
      { label: 'Home', url: '/', level: 1 },
      { label: 'Updated Math', url: '/math', level: 2 }
    ];

    expect(service.getCurrentBreadcrumbs()).toEqual(expected);
  });

  it('should emit updates through observable', (done) => {
    const items: BreadcrumbItem[] = [
      { label: 'Home', url: '/', level: 1 },
      { label: 'Math', url: '/math', level: 2 }
    ];

    service.breadcrumbs$.subscribe((breadcrumbs) => {
      expect(breadcrumbs).toEqual(items);
      done();
    });

    service.setBreadcrumbs(items);
  });
}); 