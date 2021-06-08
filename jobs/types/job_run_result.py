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

"""Error classes for model audits."""

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
            stdout: str. The standard output from a job run.
            stderr: str. The error output from a job run.
        """
        self._stdout, self._stderr = stdout, stderr

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

    def __getstate__(self):
        """Called by pickle to get the value that uniquely defines self."""
        return (self._stdout, self._stderr)

    def __setstate__(self, state):
        """Called by pickle to build an instance from __getstate__'s value."""
        self._stdout, self._stderr = state

    def __eq__(self, other):
        return (
            (self._stdout, self._stderr) == (other._stdout, other._stderr) # pylint: disable=protected-access
            if self.__class__ is other.__class__ else NotImplemented)

    def __ne__(self, other):
        return (
            not (self == other)
            if self.__class__ is other.__class__ else NotImplemented)

    def __hash__(self):
        return hash((self._stdout, self._stderr))

    def __repr__(self):
        return 'JobRunResult(stdout=%r, stderr=%r)' % (
            self._stdout, self._stderr)
