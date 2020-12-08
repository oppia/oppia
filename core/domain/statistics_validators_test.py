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

"""Unit tests for core.domain.statistics_validators."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import datetime

from core.domain import config_domain
from core.domain import prod_validation_jobs_one_off
from core.platform import models
from core.tests import test_utils

(stats_models,) = models.Registry.import_models([models.NAMES.statistics])


class PlaythroughModelValidatorTests(test_utils.AuditJobsTestBase):
    def setUp(self):
        super(PlaythroughModelValidatorTests, self).setUp()
        self.exp = self.save_new_valid_exploration('EXP_ID', 'owner_id')
        self.job_class = (
            prod_validation_jobs_one_off
            .PlaythroughModelAuditOneOffJob)

    def create_playthrough(self):
        """Helper method to create and return a simple playthrough model."""
        playthrough_id = stats_models.PlaythroughModel.create(
            self.exp.id, self.exp.version, issue_type='EarlyQuit',
            issue_customization_args={
                'state_name': {'value': 'state_name'},
                'time_spent_in_exp_in_msecs': {'value': 200},
            },
            actions=[])
        return stats_models.PlaythroughModel.get(playthrough_id)

    def create_exp_issues_with_playthroughs(self, playthrough_ids_list):
        """Helper method to create and return an ExplorationIssuesModel instance
        with the given sets of playthrough ids as reference issues.
        """
        return stats_models.ExplorationIssuesModel.create(
            self.exp.id, self.exp.version, unresolved_issues=[
                {
                    'issue_type': 'EarlyQuit',
                    'issue_customization_args': {
                        'state_name': {'value': 'state_name'},
                        'time_spent_in_exp_in_msecs': {'value': 200},
                    },
                    'playthrough_ids': list(playthrough_ids),
                    'schema_version': 1,
                    'is_valid': True,
                }
                for playthrough_ids in playthrough_ids_list
            ])

    def test_output_for_valid_playthrough(self):
        self.set_config_property(
            config_domain.WHITELISTED_EXPLORATION_IDS_FOR_PLAYTHROUGHS,
            [self.exp.id])
        playthrough = self.create_playthrough()
        self.create_exp_issues_with_playthroughs([[playthrough.id]])

        expected_output = [u'[u\'fully-validated PlaythroughModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_output_for_pre_released_playthrough(self):
        self.set_config_property(
            config_domain.WHITELISTED_EXPLORATION_IDS_FOR_PLAYTHROUGHS,
            [self.exp.id])
        playthrough = self.create_playthrough()
        # Set created_on to a date which is definitely before GSoC 2018.
        playthrough.created_on = datetime.datetime(2017, 12, 31)
        playthrough.update_timestamps()
        playthrough.put()
        self.create_exp_issues_with_playthroughs([[playthrough.id]])

        expected_output = [
            (
                u'[u\'failed validation check for create datetime check of '
                'PlaythroughModel\', [u\'Entity id %s: released on '
                '2017-12-31, which is before the GSoC 2018 submission '
                'deadline (2018-09-01) and should therefore not exist.\']]' % (
                    playthrough.id,)
            )
        ]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_output_for_non_whitelisted_playthrough(self):
        self.set_config_property(
            config_domain.WHITELISTED_EXPLORATION_IDS_FOR_PLAYTHROUGHS,
            [self.exp.id + 'differentiated'])
        playthrough = self.create_playthrough()
        self.create_exp_issues_with_playthroughs([[playthrough.id]])

        expected_output = [
            (
                u'[u\'failed validation check for exploration id check of '
                'PlaythroughModel\', [u\'Entity id %s: recorded in '
                'exploration_id:EXP_ID which has not been curated for '
                'recording.\']]' % (playthrough.id,)
            )
        ]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_output_for_bad_schema_playthrough(self):
        self.set_config_property(
            config_domain.WHITELISTED_EXPLORATION_IDS_FOR_PLAYTHROUGHS,
            [self.exp.id])
        playthrough = self.create_playthrough()
        playthrough.actions.append({'bad schema key': 'bad schema value'})
        playthrough.update_timestamps()
        playthrough.put()
        self.create_exp_issues_with_playthroughs([[playthrough.id]])

        expected_output = [
            (
                u'[u\'failed validation check for domain object check of '
                'PlaythroughModel\', [u"Entity id %s: '
                'Entity fails domain validation with the error u\''
                'schema_version\'"]]' % (playthrough.id,)
            )
        ]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_output_for_missing_reference(self):
        self.set_config_property(
            config_domain.WHITELISTED_EXPLORATION_IDS_FOR_PLAYTHROUGHS,
            [self.exp.id])
        playthrough = self.create_playthrough()
        self.create_exp_issues_with_playthroughs([
            [playthrough.id + '-different'],
        ])
        expected_output = [
            (
                u'[u\'failed validation check for reference check of '
                'PlaythroughModel\', [u\'Entity id %s: not referenced'
                ' by any issue of the corresponding exploration '
                '(id=%s, version=%s).\']]' % (
                    playthrough.id, playthrough.exp_id, playthrough.exp_version
                )
            )
        ]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_output_for_multiple_references(self):
        self.set_config_property(
            config_domain.WHITELISTED_EXPLORATION_IDS_FOR_PLAYTHROUGHS,
            [self.exp.id])
        playthrough = self.create_playthrough()
        self.create_exp_issues_with_playthroughs(
            [[playthrough.id], [playthrough.id]])
        expected_output = [
            (
                u'[u\'failed validation check for reference check of '
                'PlaythroughModel\', [u\'Entity id %s: referenced by '
                'more than one issues of the corresponding exploration '
                '(id=%s, version=%s), issue indices: [0, 1].\']]' % (
                    playthrough.id, self.exp.id, self.exp.version)
            )
        ]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_output_for_duplicate_references_in_one_issue(self):
        self.set_config_property(
            config_domain.WHITELISTED_EXPLORATION_IDS_FOR_PLAYTHROUGHS,
            [self.exp.id])
        playthrough = self.create_playthrough()
        self.create_exp_issues_with_playthroughs(
            [[playthrough.id, playthrough.id]])
        expected_output = [
            (
                u'[u\'failed validation check for reference check of '
                'PlaythroughModel\', [u\'Entity id %s: referenced multiple '
                'times in an issue (index=0) of the corresponding exploration '
                '(id=%s, version=%s), duplicated id indices: [0, 1].\']]' % (
                    playthrough.id, self.exp.id, self.exp.version)
            )
        ]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_missing_exp_issues_model_failure(self):
        self.set_config_property(
            config_domain.WHITELISTED_EXPLORATION_IDS_FOR_PLAYTHROUGHS,
            [self.exp.id])
        playthrough = self.create_playthrough()
        exp_issues_id = (
            stats_models.ExplorationIssuesModel.get_entity_id(
                self.exp.id, self.exp.version)
        )
        exp_issues = stats_models.ExplorationIssuesModel.get_by_id(
            exp_issues_id)

        exp_issues.delete()
        expected_output = [
            (
                u'[u\'failed validation check for exp_issues_ids '
                'field check of PlaythroughModel\', '
                '[u"Entity id %s: based on '
                'field exp_issues_ids having value '
                '%s, expected model ExplorationIssuesModel '
                'with id %s but it doesn\'t exist"]]') % (
                    playthrough.id, exp_issues_id, exp_issues_id)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)
