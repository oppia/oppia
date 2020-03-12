import { UpgradedServices } from "services/UpgradedServices";
// ^^^ This block is to be removed.

import { TranslatorProviderForTests } from "tests/test.extras";
import {
  HttpClientTestingModule,
  HttpTestingController
} from "@angular/common/http/testing";
import { TestBed, fakeAsync, flushMicrotasks } from "@angular/core/testing";
import { TopicsAndSkillsDashboardBackendApiService } from "../topics_and_skills_dashboard/topics-and-skills-dashboard-backend-api.service";
import { UrlInterpolationService } from "../utilities/url-interpolation.service";

describe("Topics and Skills Dashboard backend API service", () => {
  let TopicsAndSkillsDashboardBackendApiService: TopicsAndSkillsDashboardBackendApiService = null;
  let httpTestingController: HttpTestingController;

  var SAMPLE_TOPIC_ID = "hyuy4GUlvTqJ";

  var TOPICS_AND_SKILLS_DASHBOARD_DATA_URL =
    "/topics_and_skills_dashboard/data";

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    httpTestingController = TestBed.get(HttpTestingController);
    TopicsAndSkillsDashboardBackendApiService = TestBed.get(
      TopicsAndSkillsDashboardBackendApiService
    );
    var sampleDataResults = {
      topic_summary_dicts: [
        {
          id: SAMPLE_TOPIC_ID,
          name: "Sample Name",
          language_code: "en",
          version: 1,
          canonical_story_count: 3,
          additional_story_count: 0,
          uncategorized_skill_count: 3,
          subtopic_count: 3,
          topic_model_created_on: 1466178691847.67,
          topic_model_last_updated: 1466178759209.839
        }
      ],
      skill_summary_dicts: []
    };

    afterEach(() => {
      httpTestingController.verify();
    });

    it("should use rejection handler if dashboard data backend request failed", fakeAsync(() => {
      var successHandler = jasmine.createSpy("success");
      var failHandler = jasmine.createSpy("fail");

      TopicsAndSkillsDashboardBackendApiService.fetchDasboardData().subscribe(
        successHandler,
        failHandler
      );
      var req = httpTestingController.expectOne(
        TOPICS_AND_SKILLS_DASHBOARD_DATA_URL,
        "Error Loading dashboard data."
      );
      expect(req.request.method).toEqual("GET");

      expect(successHandler).toHaveBeenCalled();
      expect(failHandler).not.toHaveBeenCalled();
    }));

    it(
      "should successfully fetch topics and skills dashboard data from the " +
        "backend",
      fakeAsync(() => {
        var successHandler = jasmine.createSpy("success");
        var failHandler = jasmine.createSpy("fail");

        TopicsAndSkillsDashboardBackendApiService.fetchDasboardData().subscribe(
          successHandler,
          failHandler
        );
        var req = httpTestingController.expectOne(
          TOPICS_AND_SKILLS_DASHBOARD_DATA_URL
        );
        expect(req.request.method).toEqual("GET");
        req.flush(sampleDataResults);

        flushMicrotasks();

        expect(successHandler).toHaveBeenCalled();
        expect(failHandler).not.toHaveBeenCalled();
      })
    );
  });
});
