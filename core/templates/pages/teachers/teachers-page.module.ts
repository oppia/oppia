import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TeachersPageComponent } from './teachers-page.component';

const routes: Routes = [
  { path: 'teachers', component: TeachersPageComponent }
];

@NgModule({
  declarations: [TeachersPageComponent],
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TeachersPageModule {}
