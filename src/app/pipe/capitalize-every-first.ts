import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'capitalizeEveryFirst'
})
export class CapitalizeEveryFirstPipe implements PipeTransform {

  transform(value: string): string {
    if (!value) {
      return value;
    }
    return value.replace(/\b\w/g, (char) => char.toUpperCase());
  }

}