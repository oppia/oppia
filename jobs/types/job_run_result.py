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

"""Objects for holding onto the results produced by Apache Beam jobs."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import heapq

import python_utils
import utils

MAX_OUTPUT_BYTES = 1000000


class JobRunResult(python_utils.OBJECT):
    """Encapsulates the result of a job run.

    The stdout and stderr are string values analogous to a program's stdout and
    stderr pipes (reserved for standard output and errors, respectively).
    """

    __slots__ = ('stdout', 'stderr')

    def __init__(self, stdout='', stderr=''):
        """Initializes a new JobRunResult instance.

        Args:
            stdout: str. The standard output from a job run.
            stderr: str. The error output from a job run.
        """
        if not stdout and not stderr:
            raise ValueError('JobRunResult instances must not be empty')

        self.stdout, self.stderr = stdout, stderr

        if self.len_in_bytes() > MAX_OUTPUT_BYTES:
            raise ValueError(
                'JobRunResult must not exceed %d bytes' % MAX_OUTPUT_BYTES)

    @classmethod
    def as_stdout(cls, value, use_repr=False):
        """Returns a new JobRunResult with a stdout value.

        Args:
            value: *. The input value to convert into a stdout result. Types are
                always casted to string using '%s' formatting.
            use_repr: bool. Whether to use the `repr` of the value.

        Returns:
            JobRunResult. A JobRunResult with the given value as its stdout.
        """
        str_value = ('%r' if use_repr else '%s') % (value,)
        return JobRunResult(stdout=str_value)

    @classmethod
    def as_stderr(cls, value, use_repr=False):
        """Returns a new JobRunResult with a stderr value.

        Args:
            value: *. The input value to convert into a stderr result. Types are
                always casted to string using '%s' formatting.
            use_repr: bool. Whether to use the `repr` of the value.

        Returns:
            JobRunResult. A JobRunResult with the given value as its stderr.
        """
        str_value = ('%r' if use_repr else '%s') % (value,)
        return JobRunResult(stderr=str_value)

    @classmethod
    def accumulate(cls, results):
        """Accumulates results into bigger ones that maintain the size limit.

        The len_in_bytes() of each result is always less than MAX_OUTPUT_BYTES.

        Args:
            results: list(JobRunResult). The results to concatenate.

        Returns:
            list(JobRunResult). JobRunResult instances with stdout and stderr
            values concatenated together with newline delimiters. Each
            individual item maintains the size limit.
        """
        if not results:
            return []

        results_heap = []
        for i, result in enumerate(results):
            # Use i as a tie-breaker so that results, which don't implement the
            # comparison operators, don't get compared with one another.
            heapq.heappush(results_heap, (result.len_in_bytes(), i, result))

        batches = []
        latest_batch_size, _, smallest = heapq.heappop(results_heap)
        batches.append([smallest])

        while results_heap:
            result_size, _, next_smallest = heapq.heappop(results_heap)
            # Compensates for the '\n' delimiter used to concatenate results.
            # Results are never empty, so we either need two '\n' bytes (when
            # stdout and stderr are both non-empty), or 1 (since at most one of
            # them is empty).
            padding = 2 if next_smallest.stdout and next_smallest.stderr else 1

            if latest_batch_size + padding + result_size < MAX_OUTPUT_BYTES:
                latest_batch_size += padding + result_size
                batches[-1].append(next_smallest)
            else:
                latest_batch_size = result_size
                batches.append([next_smallest])

        batched_results = []
        for batch in batches:
            stdout = '\n'.join(r.stdout for r in batch if r.stdout)
            stderr = '\n'.join(r.stderr for r in batch if r.stderr)
            batched_results.append(JobRunResult(stdout=stdout, stderr=stderr))
        return batched_results

    def len_in_bytes(self):
        """Returns the number of bytes encoded by the JobRunResult instance.

        Returns:
            int. The number of bytes encoded by the JobRunResult instance.
        """
        output_bytes = (
            python_utils.convert_to_bytes(s) for s in (self.stdout, self.stderr)
        )
        return sum(len(output) for output in output_bytes)

    def __repr__(self):
        return '%s(stdout=%s, stderr=%s)' % (
            self.__class__.__name__,
            utils.quoted(self.stdout), utils.quoted(self.stderr))

    def __hash__(self):
        return hash((self.stdout, self.stderr))

    def __eq__(self, other):
        return (
            (self.stdout, self.stderr) == (other.stdout, other.stderr) # pylint: disable=protected-access
            if self.__class__ is other.__class__ else NotImplemented)

    def __ne__(self, other):
        return (
            not (self == other)
            if self.__class__ is other.__class__ else NotImplemented)

    def __getstate__(self):
        """Called by pickle to get the value that uniquely defines self."""
        return self.stdout, self.stderr

    def __setstate__(self, state):
        """Called by pickle to build an instance from __getstate__'s value."""
        self.stdout, self.stderr = state
