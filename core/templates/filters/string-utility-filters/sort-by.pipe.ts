import { Injectable, Pipe, PipeTransform } from '@angular/core';

@Injectable()
@Pipe({
  name: 'sortBy',
})
export class SortByPipe implements PipeTransform {
  transform(value: any[], isDescending: boolean, sortKey?: string): any {
    console.log(value)
    if (!value || sortKey === 'default'){
      return value;
    }

    let numberArray = [];
    let stringArray = [];

    if (!sortKey) {
      numberArray = value.filter(item => typeof item === 'number').sort();
      stringArray = value.filter(item => typeof item === 'string').sort();
    } else {
      numberArray = value.filter(item => typeof item[sortKey] === 'number').sort((a, b) => a[sortKey] - b[sortKey]);
      stringArray = value
        .filter(item => typeof item[sortKey] === 'string')
        .sort((a, b) => {
          if (a[sortKey] < b[sortKey]) return -1;
          else if (a[sortKey] > b[sortKey]) return 1;
          else return 0;
        });
    }
    const sorted = numberArray.concat(stringArray);
    return !isDescending ? sorted : sorted.reverse();
  }
}
