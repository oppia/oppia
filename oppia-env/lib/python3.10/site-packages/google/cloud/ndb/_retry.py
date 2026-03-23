# Copyright 2018 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Retry functions."""

import functools
import itertools

from google.api_core import retry as core_retry
from google.api_core import exceptions as core_exceptions
from google.cloud.ndb import exceptions
from google.cloud.ndb import tasklets

_DEFAULT_INITIAL_DELAY = 1.0  # seconds
_DEFAULT_MAXIMUM_DELAY = 60.0  # seconds
_DEFAULT_DELAY_MULTIPLIER = 2.0
_DEFAULT_RETRIES = 3


def wraps_safely(obj, attr_names=functools.WRAPPER_ASSIGNMENTS):
    """Python 2.7 functools.wraps has a bug where attributes like ``module``
    are not copied to the wrappers and thus cause attribute errors. This
    wrapper prevents that problem."""
    return functools.wraps(
        obj, assigned=(name for name in attr_names if hasattr(obj, name))
    )


def retry_async(callback, retries=_DEFAULT_RETRIES):
    """Decorator for retrying functions or tasklets asynchronously.

    The `callback` will be called up to `retries + 1` times. Any transient
    API errors (internal server errors) raised by `callback` will be caught and
    `callback` will be retried until the call either succeeds, raises a
    non-transient error, or the number of retries is exhausted.

    See: :func:`google.api_core.retry.if_transient_error` for information on
    what kind of errors are considered transient.

    Args:
        callback (Callable): The function to be tried. May be a tasklet.
        retries (Integer): Number of times to retry `callback`. Will try up to
            `retries + 1` times.

    Returns:
        tasklets.Future: Result will be the return value of `callback`.
    """

    @tasklets.tasklet
    @wraps_safely(callback)
    def retry_wrapper(*args, **kwargs):
        from google.cloud.ndb import context as context_module

        sleep_generator = core_retry.exponential_sleep_generator(
            _DEFAULT_INITIAL_DELAY,
            _DEFAULT_MAXIMUM_DELAY,
            _DEFAULT_DELAY_MULTIPLIER,
        )

        for sleep_time in itertools.islice(sleep_generator, retries + 1):
            context = context_module.get_context()
            if not context.in_retry():
                # We need to be able to identify if we are inside a nested
                # retry. Here, we set the retry state in the context. This is
                # used for deciding if an exception should be raised
                # immediately or passed up to the outer retry block.
                context.set_retry_state(repr(callback))
            try:
                result = callback(*args, **kwargs)
                if isinstance(result, tasklets.Future):
                    result = yield result
            except exceptions.NestedRetryException as e:
                error = e
            except BaseException as e:
                # `e` is removed from locals at end of block
                error = e  # See: https://goo.gl/5J8BMK

                if not is_transient_error(error):
                    # If we are in an inner retry block, use special nested
                    # retry exception to bubble up to outer retry. Else, raise
                    # actual exception.
                    if context.get_retry_state() != repr(callback):
                        message = getattr(error, "message", str(error))
                        raise exceptions.NestedRetryException(message)
                    else:
                        raise error
            else:
                raise tasklets.Return(result)
            finally:
                # No matter what, if we are exiting the top level retry,
                # clear the retry state in the context.
                if context.get_retry_state() == repr(callback):  # pragma: NO BRANCH
                    context.clear_retry_state()

            yield tasklets.sleep(sleep_time)

        # Unknown errors really want to show up as None, so manually set the error.
        if isinstance(error, core_exceptions.Unknown):
            error = "google.api_core.exceptions.Unknown"

        raise core_exceptions.RetryError(
            "Maximum number of {} retries exceeded while calling {}".format(
                retries, callback
            ),
            cause=error,
        )

    return retry_wrapper


# Possibly we should include DeadlineExceeded. The caveat is that I think the
# timeout is enforced on the client side, so it might be possible that a Commit
# request times out on the client side, but still writes data on the server
# side, in which case we don't want to retry, since we can't commit the same
# transaction more than once. Some more research is needed here. If we discover
# that a DeadlineExceeded error guarantees the operation was cancelled, then we
# can add DeadlineExceeded to our retryable errors. Not knowing the answer,
# it's best not to take that risk.
TRANSIENT_ERRORS = (
    core_exceptions.ServiceUnavailable,
    core_exceptions.InternalServerError,
    core_exceptions.Aborted,
    core_exceptions.Unknown,
)


def is_transient_error(error):
    """Determine whether an error is transient.

    Returns:
        bool: True if error is transient, else False.
    """
    if core_retry.if_transient_error(error):
        return True

    return isinstance(error, TRANSIENT_ERRORS)
