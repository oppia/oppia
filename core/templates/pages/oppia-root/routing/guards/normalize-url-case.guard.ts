import {Injectable} from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import {stat} from 'fs';
import {Observable} from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class NormalizeUrlCaseGuard implements CanActivate {
  constructor(private router: Router) {}
  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean | UrlTree {
    const originalUrl = state.url;
    const lowercasedUrl = originalUrl.toLowerCase();

    if (originalUrl !== lowercasedUrl) {
      return this.router.parseUrl(lowercasedUrl);
    }

    return true;
  }
}
