import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class ExplorationEditActivityService {
  constructor(private http: HttpClient) {}

  recordEdit(explorationId: string, stateName: string) {
    return this.http.post(`/createhandler/edit_activity/${explorationId}`, {
      state_name: stateName,
    });
  }

  getActiveEditors(explorationId: string) {
    return this.http.get(`/createhandler/edit_activity/${explorationId}`);
  }
}
