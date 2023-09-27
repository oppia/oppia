import { Injectable } from '@angular/core';
import { UserService } from 'services/user.service';
import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { UserInfo } from 'domain/user/user-info.model';
import { AdminPageRootComponent } from '../admin-page-root.component';
import { Error404PageComponent } from 'pages/error-pages/error-404/error-404-page.component';

@Injectable({
    providedIn: 'root'
})
export class AdminPermissionResolver implements Resolve<any> {
    constructor(private userService: UserService, private router: Router) { }

    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<UserInfo> {
        return this.userService.getUserInfoAsync().then((userInfo) => {
            if (userInfo.isSuperAdmin()) {
                route.routeConfig!.component = AdminPageRootComponent;
            } else {
                route.routeConfig!.component = Error404PageComponent;
            }
            return userInfo;
        });
    }
}
