import {Injectable} from '@angular/core';


@Injectable({
  providedIn: 'root'
})
export class FilterService {
  filter(originalArray: Array<any>, properties: Array<any>): Array<any> {
    var filteredArray = originalArray.filter((item) => {
        for(let key in properties){
            if(originalArray[key])
        }
    });
  }
}
