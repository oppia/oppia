import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ServicesConstants } from 'services/services.constants';
@Injectable({
  providedIn: 'root'
})
export class PromoBarBackendApiService {
    constructor(
        private http: HttpClient
    ) {}
    static makeRequest(): Promise<{}> {
        var promoBarData = {
            promoBarEnabled: false,
            promoBarMessage: ''
        };
        return this.http.get('/promo_bar_handler', { observe: 'response' })
        .toPromise()
        .then(
          (response) => {
            promoBarData.promoBarEnabled = response.data.promo_bar_enabled;
            promoBarData.promoBarMessage = response.data.promo_bar_message;
            return promoBarData;
          }
        );
    }
}