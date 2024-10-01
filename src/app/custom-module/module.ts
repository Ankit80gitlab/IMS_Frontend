import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CapitalizeEveryFirstPipe } from 'app/pipe/capitalize-every-first';
import { CapitalizeFirstPipe } from 'app/pipe/capitalize-first';

@NgModule({
  declarations: [CapitalizeEveryFirstPipe,CapitalizeFirstPipe],
  imports: [CommonModule],
  exports: [CapitalizeEveryFirstPipe,CapitalizeFirstPipe]
})
export class CustomPipesModule { }