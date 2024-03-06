import { Location } from '@angular/common';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';

import { AppConstants } from 'app.constants';
import { CollectionPlayerAuthGuard } from './collection-player-auth.guard';
import { AccessValidationBackendApiService } from 'pages/oppia-root/routing/access-validation-backend-api.service';

class MockAccessValidationBackendApiService {
  validateAccessToCollectionPlayerPage(collectionId: string) {
    return Promise.resolve();
  }
}

class MockRouter {
  navigate(commands: string[]): Promise<boolean> {
    return Promise.resolve(true);
  }
}

describe('CollectionPlayerAuthGuard', () => {
  let guard: CollectionPlayerAuthGuard;
  let accessValidationBackendApiService: AccessValidationBackendApiService;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [
        CollectionPlayerAuthGuard,
        { provide: AccessValidationBackendApiService,
          useClass: MockAccessValidationBackendApiService },
        { provide: Router, useClass: MockRouter },
        Location,
      ],
    });

    guard = TestBed.inject(CollectionPlayerAuthGuard);
    accessValidationBackendApiService = TestBed.inject(
      AccessValidationBackendApiService);
    router = TestBed.inject(Router);
  });

  it('should allow access if validation succeeds', fakeAsync(() => {
    const validateAccessSpy = spyOn(
      accessValidationBackendApiService, 'validateAccessToCollectionPlayerPage')
      .and.returnValue(Promise.resolve());
    const navigateSpy = spyOn(router, 'navigate').
      and.returnValue(Promise.resolve(true));

    let canActivateResult: boolean | null = null;

    guard.canActivate(new ActivatedRouteSnapshot(), {} as RouterStateSnapshot)
      .then((result) => {
        canActivateResult = result;
      });

    tick();

    expect(canActivateResult).toBeTrue();
    expect(validateAccessSpy).toHaveBeenCalled();
    expect(navigateSpy).not.toHaveBeenCalled();
  }));

  it('should redirect to 401 page if validation fails', fakeAsync(() => {
    spyOn(
      accessValidationBackendApiService, 'validateAccessToCollectionPlayerPage')
      .and.returnValue(Promise.reject());
    const navigateSpy = spyOn(router, 'navigate').
      and.returnValue(Promise.resolve(true));

    let canActivateResult: boolean | null = null;

    guard.canActivate(new ActivatedRouteSnapshot(), {} as RouterStateSnapshot)
      .then((result) => {
        canActivateResult = result;
      });

    tick();

    expect(canActivateResult).toBeFalse();
    expect(navigateSpy).toHaveBeenCalledWith(
      [`${AppConstants.PAGES_REGISTERED_WITH_FRONTEND.ERROR.ROUTE}/401`]);
  }));
});
