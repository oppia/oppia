# Copyright 2019 The Oppia Authors. All Rights Reserved.
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

"""Tests for Oppia storage model audit jobs."""
from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import inspect

from core.domain import prod_validation_jobs_one_off
from core.platform import models
from core.tests import test_utils


# This list includes statistics models. The statistics models are included here
# because the audit jobs for statistics models are defined in
# core/domain/stats_jobs_one_off.py. These jobs should be updated and moved to
# core/domain/prod_validation_jobs_one_off.py and the statistics model
# class names can then be removed from this list.
# The corresponding issue is #7100.
MODEL_CLASS_NAMES_TO_EXCLUDE = {
    'StateCounterModel',
    'AnswerSubmittedEventLogEntryModel',
    'ExplorationActualStartEventLogEntryModel',
    'SolutionHitEventLogEntryModel',
    'StartExplorationEventLogEntryModel',
    'MaybeLeaveExplorationEventLogEntryModel',
    'CompleteExplorationEventLogEntryModel',
    'RateExplorationEventLogEntryModel',
    'StateHitEventLogEntryModel',
    'StateCompleteEventLogEntryModel',
    'LeaveForRefresherExplorationEventLogEntryModel',
    'ExplorationStatsModel',
    'ExplorationIssuesModel',
    'PlaythroughModel',
    'LearnerAnswerDetailsModel',
    'ExplorationAnnotationsModel',
    'StateAnswersModel',
    'StateAnswersCalcOutputModel',
}


class StorageModelAuditJobsTest(test_utils.GenericTestBase):
    """Tests for Oppia storage model audit jobs."""

    def test_all_models_have_audit_jobs(self):
        all_model_module_names = []

        # As models.NAMES is an enum, it cannot be iterated. So we use the
        # __dict__ property which can be iterated.
        for name in models.NAMES.__dict__:
            if '__' not in name:
                all_model_module_names.append(name)

        names_of_ndb_model_subclasses = []
        for module_name in all_model_module_names:
            # We skip base models since there are no specific audit jobs
            # for base models. The audit jobs for subclasses of base models
            # cover the test cases for base models, so extra audit jobs
            # for base models are not required.
            if module_name == 'base_model':
                continue
            (module, ) = models.Registry.import_models([module_name])
            for member_name, member_obj in inspect.getmembers(module):
                if inspect.isclass(member_obj):
                    clazz = getattr(module, member_name)
                    if clazz.__name__ in MODEL_CLASS_NAMES_TO_EXCLUDE:
                        continue
                    all_base_classes = [
                        base_class.__name__ for base_class in inspect.getmro(
                            clazz)]
                    if 'Model' in all_base_classes:
                        names_of_ndb_model_subclasses.append(clazz.__name__)

        names_of_all_audit_job_classes = []
        for name, clazz in inspect.getmembers(
                prod_validation_jobs_one_off, predicate=inspect.isclass):
            all_base_classes = [
                base_class.__name__ for base_class in inspect.getmro(clazz)]
            if 'ProdValidationAuditOneOffJob' in all_base_classes:
                names_of_all_audit_job_classes.append(name)

        model_class_names_with_missing_audit_jobs = [
            model_class_name
            for model_class_name in names_of_ndb_model_subclasses if (
                model_class_name + 'AuditOneOffJob' not in (
                    names_of_all_audit_job_classes))]
        self.assertFalse(
            model_class_names_with_missing_audit_jobs,
            msg=(
                'Following model classes do not have an audit job: %s' % (
                    (', ').join(model_class_names_with_missing_audit_jobs))))
