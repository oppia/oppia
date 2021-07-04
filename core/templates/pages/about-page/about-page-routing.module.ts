
import { NgModule } from '@angular/core';
import { Route, RouterModule } from '@angular/router';
import { AboutPageRootComponent } from './about-page-root.component';

const routes: Route[] = [
  {
    path: '',
    component: AboutPageRootComponent
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

export class AboutPageRoutingModule {}
