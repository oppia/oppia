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

import python_utils


class JobRunResult(python_utils.OBJECT):
    """Encapsulates the result of a job run.

    The stdout and stderr are string values analogous to a program's stdout and
    stderr pipes (reserved for standard output and errors, respectively).
    """

    __slots__ = ('_stdout', '_stderr')

    def __init__(self, stdout='', stderr=''):
        """Initializes a new JobRunResult instance.

        Args:
            stdout: str. The standard output from a job run. Base classes may
                pass None to avoid assigning a value if they use their own
                attributes.
            stderr: str. The error output from a job run. Base classes may pass
                None to avoid assigning a value if they use their own
                attributes.

        Raises:
            ValueError. When stdout=None or stderr=None while the instance is
                not a subclass of JobRunResult.
        """
        if self.__class__ is JobRunResult and None in (stdout, stderr):
            raise ValueError('stdout=%r and stderr=%r must not be None')
        if stdout is not None:
            self._stdout = stdout
        if stderr is not None:
            self._stderr = stderr

    @property
    def stdout(self):
        """Returns the standard output of the job result.

        Returns:
            str. The standard output of the job result.
        """
        return self._stdout

    @property
    def stderr(self):
        """Returns the error output of the job result.

        Returns:
            str. The error output of the job result.
        """
        return self._stderr

    @classmethod
    def concat(cls, job_run_results):
        """Concatenates the sequence of job runs into a new JobRunResult.

        Args:
            job_run_results: list(JobRunResult). The results to concatenate.

        Returns:
            JobRunResult. A new JobRunResult instance with all stdout and stderr
            values concatenated together with newline delimiters.
        """
        stdout = '\n'.join(r.stdout for r in job_run_results if r.stdout)
        stderr = '\n'.join(r.stderr for r in job_run_results if r.stderr)
        # NOTE: We can't use `cls` because derived classes are allowed to have
        # different __init__ arguments, so only the base class is guaranteed to
        # support `stdout` and `stderr` as arguments.
        return JobRunResult(stdout=stdout, stderr=stderr)

    def len_in_bytes(self):
        """Returns the number of bytes encoded by the JobRunResult instance.

        NOTE: This includes the null-character used by Cloud NDB to terminate
        all strings, meaning that the empty string has a size of 1 and all other
        strings have 1 extra byte in their length.

        Returns:
            int. The number of bytes encoded by the JobRunResult instance.
        """
        length = sum(len(s.encode('utf-8')) for s in (self.stdout, self.stderr))
        return length + 2

    def __repr__(self):
        return 'JobRunResult(stdout=%r, stderr=%r)' % (
            self._stdout, self._stderr)

    def __hash__(self):
        return hash((self._stdout, self._stderr))

    def __eq__(self, other):
        return (
            (self._stdout, self._stderr) == (other._stdout, other._stderr) # pylint: disable=protected-access
            if self.__class__ is other.__class__ else NotImplemented)

    def __ne__(self, other):
        return (
            not (self == other)
            if self.__class__ is other.__class__ else NotImplemented)

    def __getstate__(self):
        """Called by pickle to get the value that uniquely defines self."""
        return (self._stdout, self._stderr)

    def __setstate__(self, state):
        """Called by pickle to build an instance from __getstate__'s value."""
        self._stdout, self._stderr = state
