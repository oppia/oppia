// oppia/core/templates/pages/oppia-root/routing/guards/normalize-url-case.guard.ts
import {Injectable} from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';

@Injectable({providedIn: 'root'})
export class NormalizeUrlCaseGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(
    _route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean | UrlTree {
    const originalUrl = state.url;
    const lowerUrl = originalUrl.toLowerCase();

    // Fast-path: already lowercase → continue navigation.
    if (originalUrl === lowerUrl) {
      return true;
    }
    // Otherwise, issue an in-app redirect that replaces the current history
    // entry (so the Back button behaves naturally).
    return this.router.parseUrl(lowerUrl);
  }
}
