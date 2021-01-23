# coding: utf-8
#
# Copyright 2020 The Oppia Authors. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS-IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Unit tests for core.domain.recommendations_validators."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import datetime
import json

from core.domain import exp_domain
from core.domain import exp_services
from core.domain import prod_validation_jobs_one_off
from core.domain import recommendations_services
from core.platform import models
from core.tests import test_utils
import python_utils

datastore_services = models.Registry.import_datastore_services()

(
    exp_models,
    recommendations_models) = (
        models.Registry.import_models([
            models.NAMES.exploration,
            models.NAMES.recommendations]))


class ExplorationRecommendationsModelValidatorTests(
        test_utils.AuditJobsTestBase):

    def setUp(self):
        super(ExplorationRecommendationsModelValidatorTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.user_id = self.get_user_id_from_email(self.OWNER_EMAIL)

        explorations = [exp_domain.Exploration.create_default_exploration(
            '%s' % i,
            title='title %d' % i,
            category='category%d' % i,
        ) for i in python_utils.RANGE(6)]

        for exp in explorations:
            exp_services.save_new_exploration(self.user_id, exp)

        recommendations_services.set_exploration_recommendations(
            '0', ['3', '4'])
        recommendations_services.set_exploration_recommendations('1', ['5'])

        self.model_instance_0 = (
            recommendations_models.ExplorationRecommendationsModel.get_by_id(
                '0'))
        self.model_instance_1 = (
            recommendations_models.ExplorationRecommendationsModel.get_by_id(
                '1'))

        self.job_class = (
            prod_validation_jobs_one_off
            .ExplorationRecommendationsModelAuditOneOffJob)

    def test_standard_model(self):
        expected_output = [(
            u'[u\'fully-validated ExplorationRecommendationsModel\', 2]')]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance_0.created_on = (
            self.model_instance_0.last_updated + datetime.timedelta(days=1))
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for time field relation check '
                'of ExplorationRecommendationsModel\', '
                '[u\'Entity id %s: The created_on field has a value '
                '%s which is greater than the value '
                '%s of last_updated field\']]') % (
                    self.model_instance_0.id, self.model_instance_0.created_on,
                    self.model_instance_0.last_updated),
            u'[u\'fully-validated ExplorationRecommendationsModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.model_instance_1.delete()
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'ExplorationRecommendationsModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance_0.id, self.model_instance_0.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=False, literal_eval=False)

    def test_model_with_missing_recommended_exploration(self):
        exp_models.ExplorationModel.get_by_id('3').delete(
            self.user_id, '', [{}])
        expected_output = [
            (
                u'[u\'failed validation check for exploration_ids field '
                'check of ExplorationRecommendationsModel\', '
                '[u"Entity id 0: based on field exploration_ids having value '
                '3, expected model ExplorationModel with '
                'id 3 but it doesn\'t exist"]]'
            ),
            u'[u\'fully-validated ExplorationRecommendationsModel\', 1]']

        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_id_in_recommended_ids(self):
        self.model_instance_0.recommended_exploration_ids = ['0', '4']
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for item exploration id check '
                'of ExplorationRecommendationsModel\', '
                '[u\'Entity id 0: The exploration id: 0 for which the '
                'entity is created is also present in the recommended '
                'exploration ids for entity\']]'
            ),
            u'[u\'fully-validated ExplorationRecommendationsModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)


class TopicSimilaritiesModelValidatorTests(test_utils.AuditJobsTestBase):

    def setUp(self):
        super(TopicSimilaritiesModelValidatorTests, self).setUp()

        self.model_instance = recommendations_models.TopicSimilaritiesModel(
            id=recommendations_models.TOPIC_SIMILARITIES_ID)

        content_dict = {
            'Art': {'Art': '1.0', 'Biology': '0.8', 'Chemistry': '0.1'},
            'Biology': {'Art': '0.8', 'Biology': '1.0', 'Chemistry': '0.5'},
            'Chemistry': {'Art': '0.1', 'Biology': '0.5', 'Chemistry': '1.0'},
        }
        self.content = json.dumps(content_dict)

        self.model_instance.content = self.content
        self.model_instance.update_timestamps()
        self.model_instance.put()

        self.job_class = (
            prod_validation_jobs_one_off.TopicSimilaritiesModelAuditOneOffJob)

    def test_standard_model(self):
        expected_output = [(
            u'[u\'fully-validated TopicSimilaritiesModel\', 1]')]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance.created_on = (
            self.model_instance.last_updated + datetime.timedelta(days=1))
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [
            (
                u'[u\'failed validation check for time field relation check '
                'of TopicSimilaritiesModel\', '
                '[u\'Entity id %s: The created_on field has a value '
                '%s which is greater than the value '
                '%s of last_updated field\']]') % (
                    self.model_instance.id, self.model_instance.created_on,
                    self.model_instance.last_updated)]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'TopicSimilaritiesModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance.id, self.model_instance.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=False, literal_eval=False)

    def test_model_with_invalid_id(self):
        model_with_invalid_id = recommendations_models.TopicSimilaritiesModel(
            id='invalid', content=self.content)
        self.model_instance.update_timestamps()
        model_with_invalid_id.put()

        expected_output = [
            (
                u'[u\'failed validation check for model id check of '
                'TopicSimilaritiesModel\', '
                '[u\'Entity id invalid: Entity id does not match regex '
                'pattern\']]'
            ),
            u'[u\'fully-validated TopicSimilaritiesModel\', 1]']

        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_topic_similarities_columns(self):
        content_dict = {
            'Art': {'Art': '1.0', 'Biology': '0.5'},
            'Biology': {}
        }
        self.model_instance.content = json.dumps(content_dict)
        self.model_instance.update_timestamps()
        self.model_instance.put()

        expected_output = [(
            u'[u\'failed validation check for topic similarity check '
            'of TopicSimilaritiesModel\', '
            '[u"Entity id topics: Topic similarity validation for '
            'content: {u\'Biology\': {}, u\'Art\': {u\'Biology\': u\'0.5\', '
            'u\'Art\': u\'1.0\'}} fails with error: Length of topic '
            'similarities columns: 1 does not match length of '
            'topic list: 2."]]')]

        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_topic(self):
        content_dict = {
            'Art': {'Art': '1.0', 'invalid': '0.5'},
            'invalid': {'Art': '0.5', 'invalid': '1.0'}
        }
        self.model_instance.content = json.dumps(content_dict)
        self.model_instance.update_timestamps()
        self.model_instance.put()

        expected_output = [(
            u'[u\'failed validation check for topic similarity check '
            'of TopicSimilaritiesModel\', '
            '[u"Entity id topics: Topic similarity validation for '
            'content: {u\'Art\': {u\'Art\': u\'1.0\', u\'invalid\': u\'0.5\'}, '
            'u\'invalid\': {u\'Art\': u\'0.5\', u\'invalid\': u\'1.0\'}} '
            'fails with error: Topic invalid not in list of known topics."]]')]

        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_invalid_topic_similarities_rows(self):
        content_dict = {
            'Art': {'Art': '1.0', 'Biology': '0.5'}
        }
        self.model_instance.content = json.dumps(content_dict)
        self.model_instance.update_timestamps()
        self.model_instance.put()

        expected_output = [(
            u'[u\'failed validation check for topic similarity check '
            'of TopicSimilaritiesModel\', [u"Entity id topics: '
            'Topic similarity validation for content: {u\'Art\': '
            '{u\'Biology\': u\'0.5\', u\'Art\': u\'1.0\'}} fails with '
            'error: Length of topic similarities rows: 2 does not match '
            'length of topic list: 1."]]')]

        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_invalid_similarity_type(self):
        content_dict = {
            'Art': {'Art': 'one', 'Biology': 0.5},
            'Biology': {'Art': 0.5, 'Biology': 1.0}
        }
        self.model_instance.content = json.dumps(content_dict)
        self.model_instance.update_timestamps()
        self.model_instance.put()

        expected_output = [(
            u'[u\'failed validation check for topic similarity '
            'check of TopicSimilaritiesModel\', '
            '[u"Entity id topics: Topic similarity validation for '
            'content: {u\'Biology\': {u\'Biology\': 1.0, u\'Art\': 0.5}, '
            'u\'Art\': {u\'Biology\': 0.5, u\'Art\': u\'one\'}} '
            'fails with error: Expected similarity to be a float, '
            'received one"]]')]

        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_similarity_value(self):
        content_dict = {
            'Art': {'Art': 10.0, 'Biology': 0.5},
            'Biology': {'Art': 0.5, 'Biology': 1.0}
        }
        self.model_instance.content = json.dumps(content_dict)
        self.model_instance.update_timestamps()
        self.model_instance.put()

        expected_output = [(
            u'[u\'failed validation check for topic similarity check '
            'of TopicSimilaritiesModel\', '
            '[u"Entity id topics: Topic similarity validation for '
            'content: {u\'Biology\': {u\'Biology\': 1.0, u\'Art\': 0.5}, '
            'u\'Art\': {u\'Biology\': 0.5, u\'Art\': 10.0}} '
            'fails with error: Expected similarity to be between '
            '0.0 and 1.0, received 10.0"]]')]

        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_assymetric_content(self):
        content_dict = {
            'Art': {'Art': 1.0, 'Biology': 0.5},
            'Biology': {'Art': 0.6, 'Biology': 1.0}
        }
        self.model_instance.content = json.dumps(content_dict)
        self.model_instance.update_timestamps()
        self.model_instance.put()

        expected_output = [(
            u'[u\'failed validation check for topic similarity '
            'check of TopicSimilaritiesModel\', '
            '[u"Entity id topics: Topic similarity validation for '
            'content: {u\'Biology\': {u\'Biology\': 1.0, u\'Art\': 0.6}, '
            'u\'Art\': {u\'Biology\': 0.5, u\'Art\': 1.0}} fails with error: '
            'Expected topic similarities to be symmetric."]]')]

        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)
