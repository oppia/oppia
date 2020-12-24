import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { switchMap, take } from 'rxjs/operators';
import { AuthService } from 'services/auth.service';


@Injectable({
  providedIn: 'root'
})
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {}

  intercept<T>(
      request: HttpRequest<T>, next: HttpHandler): Observable<HttpEvent<T>> {
    return this.authService.idToken$.pipe(take(1), switchMap(idToken => {
      if (idToken !== null) {
        // Add the Authorization header to the request.
        request = request.clone({
          setHeaders: {Authorization: `Bearer ${idToken}`}
        });
      }
      // Hand over request responsibility to the next handler.
      return next.handle(request);
    }));
  }
}
