import { NgModule } from '@angular/core';
import { Route, RouterModule } from '@angular/router';
import { ErrorPageRootComponent } from './error-page-root.component';

const routes: Route[] = [
  {
    path: '',
    component: ErrorPageRootComponent
  }
];

@NgModule({
  imports: [
    RouterModule.forChild(routes)
  ],
  exports: [
    RouterModule
  ]
})

export class ErrorPageRoutingModule {}
