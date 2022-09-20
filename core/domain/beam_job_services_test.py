# coding: utf-8
#
# Copyright 2021 The Oppia Authors. All Rights Reserved.
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

"""Unit tests for core.domain.beam_job_services."""

from __future__ import annotations

import datetime
import itertools

from core.domain import beam_job_domain
from core.domain import beam_job_services
from core.jobs import base_jobs
from core.jobs import jobs_manager
from core.jobs import registry as jobs_registry
from core.platform import models
from core.tests import test_utils

import apache_beam as beam

from typing import List, Optional

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import beam_job_models

(beam_job_models,) = models.Registry.import_models([models.Names.BEAM_JOB])


class NoOpJob(base_jobs.JobBase):
    """Simple job that returns an empty PCollection."""

    def run(self) -> beam.PCollection:
        return beam.Create([])


class BeamJobServicesTests(test_utils.TestBase):

    def test_gets_jobs_from_registry(self) -> None:
        beam_jobs = beam_job_services.get_beam_jobs()
        self.assertItemsEqual(
            [j.name for j in beam_jobs], jobs_registry.get_all_job_names())


class BeamJobRunServicesTests(test_utils.GenericTestBase):

    def setUp(self) -> None:
        super().setUp()
        self._id_iter = (str(i) for i in itertools.count())

    def create_beam_job_run_model(
        self, dataflow_job_id: str = 'abc',
        job_id: Optional[str] = None,
        job_name: str = 'FooJob',
        job_state: str = beam_job_models.BeamJobState.RUNNING.value
    ) -> beam_job_models.BeamJobRunModel:
        """Returns a new BeamJobRunModel with convenient default values.

        Args:
            dataflow_job_id: str|None. The ID of the dataflow job corresponding
                to the BeamJobRun. When this value is None, that signals that
                the job has been run synchronously (like a function call), and
                cannot be polled for updates.
            job_id: str|None. The ID of the job. If None, a value is generated.
            job_name: str. The name of the job class that implements the
                job's logic.
            job_state: str. The state of the job at the time the model was last
                updated.

        Returns:
            BeamJobRunModel. The new model.
        """
        if job_id is None:
            job_id = next(self._id_iter)
        return beam_job_models.BeamJobRunModel(
            id=job_id, dataflow_job_id=dataflow_job_id, job_name=job_name,
            latest_job_state=job_state)

    def assert_domains_equal_models(
        self,
        beam_job_runs: List[beam_job_domain.BeamJobRun],
        beam_job_run_models: List[beam_job_models.BeamJobRunModel]
    ) -> None:
        """Asserts that the domain objects have the same values as the models.

        Args:
            beam_job_runs: list(BeamJobRun). The domain objects.
            beam_job_run_models: list(BeamJobRunModel). The models.

        Raises:
            AssertionError. At least one domain object and model pair has at
                least one difference.
        """
        self.assertEqual(len(beam_job_runs), len(beam_job_run_models))
        runs = sorted(beam_job_runs, key=lambda j: j.job_id)
        # The key for sorting is defined separately because of a mypy bug.
        # A [no-any-return] is thrown if key is defined in the sort() method
        # instead. Reference: https://github.com/python/mypy/issues/9590.
        by_id = lambda model: model.id
        run_models = sorted(beam_job_run_models, key=by_id)
        for i, (run, model) in enumerate(zip(runs, run_models)):
            with self.subTest('i=%d' % i):
                self.assertEqual(run.job_id, model.id)
                self.assertEqual(run.job_name, model.job_name)
                self.assertEqual(run.job_state, model.latest_job_state)
                self.assertEqual(run.job_started_on, model.created_on)
                self.assertEqual(run.job_updated_on, model.last_updated)
                self.assertEqual(
                    run.job_is_synchronous, model.dataflow_job_id is None)

    def test_run_beam_job_using_job_name(self) -> None:
        model = beam_job_services.create_beam_job_run_model('NoOpJob')

        with self.swap_to_always_return(jobs_manager, 'run_job', value=model):
            run = beam_job_services.run_beam_job(job_name='NoOpJob')

        self.assertEqual(
            beam_job_services.get_beam_job_run_from_model(model).to_dict(),
            run.to_dict())

    def test_run_beam_job_using_job_class(self) -> None:
        model = beam_job_services.create_beam_job_run_model('NoOpJob')

        with self.swap_to_always_return(jobs_manager, 'run_job', value=model):
            run = beam_job_services.run_beam_job(job_class=NoOpJob)

        self.assertEqual(
            beam_job_services.get_beam_job_run_from_model(model).to_dict(),
            run.to_dict())

    def test_run_beam_job_without_args_raises_an_exception(self) -> None:
        with self.assertRaisesRegex(ValueError, 'Must specify the job'):
            beam_job_services.run_beam_job()

    def test_cancel_beam_job(self) -> None:
        model = beam_job_services.create_beam_job_run_model(
            'NoOpJob', dataflow_job_id='123')
        model.put()

        with self.swap_to_always_return(jobs_manager, 'cancel_job'):
            run = beam_job_services.cancel_beam_job(model.id)

        self.assertEqual(
            run.to_dict(),
            beam_job_services.get_beam_job_run_from_model(model).to_dict())

    def test_cancel_beam_job_which_does_not_exist_raises_an_error(self) -> None:
        with self.swap_to_always_return(jobs_manager, 'cancel_job'):
            with self.assertRaisesRegex(
                ValueError, 'No such job'
            ):
                beam_job_services.cancel_beam_job('123')

    def test_cancel_beam_job_which_has_no_dataflow_job_id_raises_an_error(
        self
    ) -> None:
        model = beam_job_services.create_beam_job_run_model(
            'NoOpJob', dataflow_job_id=None)
        model.put()

        with self.swap_to_always_return(jobs_manager, 'cancel_job'):
            with self.assertRaisesRegex(
                ValueError, 'cannot be cancelled'
            ):
                beam_job_services.cancel_beam_job(model.id)

    def test_get_beam_job_runs(self) -> None:
        beam_job_run_models = [
            self.create_beam_job_run_model(
                job_state=beam_job_models.BeamJobState.DONE.value),
            self.create_beam_job_run_model(
                job_state=beam_job_models.BeamJobState.RUNNING.value),
            self.create_beam_job_run_model(
                job_state=beam_job_models.BeamJobState.CANCELLED.value),
        ]

        beam_job_models.BeamJobRunModel.update_timestamps_multi(
            beam_job_run_models)
        beam_job_models.BeamJobRunModel.put_multi(beam_job_run_models)

        self.assert_domains_equal_models(
            beam_job_services.get_beam_job_runs(refresh=False),
            beam_job_run_models)

    def test_get_beam_job_runs_with_refresh(self) -> None:
        beam_job_run_models = [
            self.create_beam_job_run_model(
                job_state=beam_job_models.BeamJobState.DONE.value),
            self.create_beam_job_run_model(
                job_state=beam_job_models.BeamJobState.RUNNING.value),
            self.create_beam_job_run_model(
                job_state=beam_job_models.BeamJobState.CANCELLED.value),
        ]

        beam_job_models.BeamJobRunModel.update_timestamps_multi(
            beam_job_run_models)
        beam_job_models.BeamJobRunModel.put_multi(beam_job_run_models)

        with self.swap_to_always_return(
            jobs_manager, 'refresh_state_of_beam_job_run_model'):
            self.assert_domains_equal_models(
                beam_job_services.get_beam_job_runs(refresh=True),
                beam_job_run_models)

    def test_create_beam_job_run_model(self) -> None:
        model = beam_job_services.create_beam_job_run_model(
            'FooJob', dataflow_job_id='123')
        model.put()

        all_runs = beam_job_services.get_beam_job_runs(refresh=False)
        self.assertEqual(len(all_runs), 1)
        run = all_runs[0]
        self.assertEqual(run.job_name, 'FooJob')
        self.assertFalse(run.job_is_synchronous)

    def test_create_beam_job_run_result_model(self) -> None:
        model = beam_job_services.create_beam_job_run_result_model(
            '123', 'abc', '123')
        model.put()

        result = beam_job_services.get_beam_job_run_result('123')
        self.assertEqual(result.stdout, 'abc')
        self.assertEqual(result.stderr, '123')

    def test_is_state_terminal(self) -> None:

        now = datetime.datetime.utcnow()

        cancelled_beam_job_run = beam_job_domain.BeamJobRun(
            '123',
            'FooJob',
            beam_job_models.BeamJobState.CANCELLED.value,
            now,
            now,
            True
        )
        drained_beam_job_run = beam_job_domain.BeamJobRun(
            '123',
            'FooJob',
            beam_job_models.BeamJobState.DRAINED.value,
            now,
            now,
            True
        )
        updated_beam_job_run = beam_job_domain.BeamJobRun(
            '123',
            'FooJob',
            beam_job_models.BeamJobState.UPDATED.value,
            now,
            now,
            True
        )
        done_beam_job_run = beam_job_domain.BeamJobRun(
            '123',
            'FooJob',
            beam_job_models.BeamJobState.DONE.value,
            now,
            now,
            True
        )
        failed_beam_job_run = beam_job_domain.BeamJobRun(
            '123',
            'FooJob',
            beam_job_models.BeamJobState.FAILED.value,
            now,
            now,
            True
        )
        cancelling_beam_job_run = beam_job_domain.BeamJobRun(
            '123',
            'FooJob',
            beam_job_models.BeamJobState.CANCELLING.value,
            now,
            now,
            True
        )
        draining_beam_job_run = beam_job_domain.BeamJobRun(
            '123',
            'FooJob',
            beam_job_models.BeamJobState.DRAINING.value,
            now,
            now,
            True
        )
        pending_beam_job_run = beam_job_domain.BeamJobRun(
            '123',
            'FooJob',
            beam_job_models.BeamJobState.PENDING.value,
            now,
            now,
            True
        )
        running_beam_job_run = beam_job_domain.BeamJobRun(
            '123',
            'FooJob',
            beam_job_models.BeamJobState.RUNNING.value,
            now,
            now,
            True
        )
        stopped_beam_job_run = beam_job_domain.BeamJobRun(
            '123',
            'FooJob',
            beam_job_models.BeamJobState.STOPPED.value,
            now,
            now, True
        )
        unknown_beam_job_run = beam_job_domain.BeamJobRun(
            '123',
            'FooJob',
            beam_job_models.BeamJobState.UNKNOWN.value,
            now,
            now,
            True
        )

        self.assertTrue(beam_job_services.is_state_terminal(
            cancelled_beam_job_run.job_state
        ))
        self.assertTrue(beam_job_services.is_state_terminal(
            drained_beam_job_run.job_state
        ))
        self.assertTrue(beam_job_services.is_state_terminal(
            updated_beam_job_run.job_state
        ))
        self.assertTrue(beam_job_services.is_state_terminal(
            done_beam_job_run.job_state
        ))
        self.assertTrue(beam_job_services.is_state_terminal(
            failed_beam_job_run.job_state
        ))
        self.assertFalse(beam_job_services.is_state_terminal(
            cancelling_beam_job_run.job_state
        ))
        self.assertFalse(beam_job_services.is_state_terminal(
            draining_beam_job_run.job_state
        ))
        self.assertFalse(beam_job_services.is_state_terminal(
            pending_beam_job_run.job_state
        ))
        self.assertFalse(beam_job_services.is_state_terminal(
            running_beam_job_run.job_state
        ))
        self.assertFalse(beam_job_services.is_state_terminal(
            stopped_beam_job_run.job_state
        ))
        self.assertFalse(beam_job_services.is_state_terminal(
            unknown_beam_job_run.job_state
        ))


class GetBeamJobRunResultTests(test_utils.GenericTestBase):

    def test_get_beam_run_result(self) -> None:
        beam_job_models.BeamJobRunResultModel(
            job_id='123', stdout='abc', stderr='def').put()

        beam_job_run_result = beam_job_services.get_beam_job_run_result('123')

        self.assertEqual(beam_job_run_result.stdout, 'abc')
        self.assertEqual(beam_job_run_result.stderr, 'def')

    def test_get_beam_run_result_with_no_results(self) -> None:
        beam_job_run_result = beam_job_services.get_beam_job_run_result('123')

        self.assertEqual(beam_job_run_result.stdout, '')
        self.assertEqual(beam_job_run_result.stderr, '')

    def test_get_beam_run_result_with_result_batches(self) -> None:
        beam_job_models.BeamJobRunResultModel(job_id='123', stdout='abc').put()
        beam_job_models.BeamJobRunResultModel(job_id='123', stderr='123').put()
        beam_job_models.BeamJobRunResultModel(
            job_id='123', stdout='def', stderr='456').put()

        beam_job_run_result = beam_job_services.get_beam_job_run_result('123')

        self.assertItemsEqual(
            beam_job_run_result.stdout.split('\n'), ['abc', 'def'])
        self.assertItemsEqual(
            beam_job_run_result.stderr.split('\n'), ['123', '456'])
