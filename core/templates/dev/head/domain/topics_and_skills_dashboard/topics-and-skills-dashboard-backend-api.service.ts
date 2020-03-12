import { downgradeInjectable } from "@angular/upgrade/static";
import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { TopicsAndSkillsDashboardDomainConstants as mergeSkillsUrl } from "../topics_and_skills_dashboard/topics-and-skills-dashboard-domain.constants";
import { Observable } from "rxjs";

@Injectable({
  providedIn: "root"
})
export class TopicsAndSkillsDashboardBackendApiService {
  constructor(private http: HttpClient) {}

  fetchDasboardData(): Observable<any> {
    return this.http.get<any>("/topics_and_skills_dashboard/data");
  }

  mergeSkills(oldSkillId, newSkillId): Observable<any> {
    var mergeSkillsData = {
      old_skill_id: oldSkillId,
      new_skill_id: newSkillId
    };
    return this.http.post<any>(
      mergeSkillsUrl.MERGE_SKILLS_URL,
      mergeSkillsData
    );
  }
}

angular
  .module("oppia")
  .factory(
    "TopicsAndSkillsDashboardBackendApiService",
    downgradeInjectable(TopicsAndSkillsDashboardBackendApiService)
  );
