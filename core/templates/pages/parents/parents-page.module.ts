import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ParentsPageComponent } from './parents-page.component';

const routes: Routes = [
  { path: 'parents', component: ParentsPageComponent }
];

@NgModule({
  declarations: [ParentsPageComponent],
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ParentsPageModule {}
