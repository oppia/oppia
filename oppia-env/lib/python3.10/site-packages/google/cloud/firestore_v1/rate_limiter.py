# Copyright 2021 Google LLC All rights reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import datetime
import warnings
from typing import Optional


def utcnow():
    """
    google.cloud.firestore_v1.rate_limiter.utcnow() is deprecated.
    Use datetime.datetime.now(datetime.timezone.utc) instead.
    """
    warnings.warn(
        "google.cloud.firestore_v1.rate_limiter.utcnow() is deprecated. "
        "Use datetime.datetime.now(datetime.timezone.utc) instead.",
        DeprecationWarning,
    )
    return datetime.datetime.utcnow()


default_initial_tokens: int = 500
default_phase_length: int = 60 * 5  # 5 minutes
microseconds_per_second: int = 1000000


class RateLimiter:
    """Implements 5/5/5 ramp-up via Token Bucket algorithm.

    5/5/5 is a ramp up strategy that starts with a budget of 500 operations per
    second. Additionally, every 5 minutes, the maximum budget can increase by
    50%. Thus, at 5:01 into a long bulk-writing process, the maximum budget
    becomes 750 operations per second. At 10:01, the budget becomes 1,125
    operations per second.

    The Token Bucket algorithm uses the metaphor of a bucket, or pile, or really
    any container, if we're being honest, of tokens from which a user is able
    to draw. If there are tokens available, you can do the thing. If there are not,
    you can not do the thing. Additionally, tokens replenish at a fixed rate.

    Usage:

        rate_limiter = RateLimiter()
        tokens = rate_limiter.take_tokens(20)

        if not tokens:
            queue_retry()
        else:
            for _ in range(tokens):
                my_operation()

    Args:
        initial_tokens (Optional[int]): Starting size of the budget. Defaults
            to 500.
        phase_length (Optional[int]): Number of seconds, after which, the size
            of the budget can increase by 50%. Such an increase will happen every
            [phase_length] seconds if operation requests continue consistently.
    """

    def __init__(
        self,
        initial_tokens: int = default_initial_tokens,
        global_max_tokens: Optional[int] = None,
        phase_length: int = default_phase_length,
    ):
        # Tracks the volume of operations during a given ramp-up phase.
        self._operations_this_phase: int = 0

        # If provided, this enforces a cap on the maximum number of writes per
        # second we can ever attempt, regardless of how many 50% increases the
        # 5/5/5 rule would grant.
        self._global_max_tokens = global_max_tokens

        self._start: Optional[datetime.datetime] = None
        self._last_refill: Optional[datetime.datetime] = None

        # Current number of available operations. Decrements with every
        # permitted request and refills over time.
        self._available_tokens: int = initial_tokens

        # Maximum size of the available operations. Can increase by 50%
        # every [phase_length] number of seconds.
        self._maximum_tokens: int = self._available_tokens

        if self._global_max_tokens is not None:
            self._available_tokens = min(
                self._available_tokens, self._global_max_tokens
            )
            self._maximum_tokens = min(self._maximum_tokens, self._global_max_tokens)

        # Number of seconds after which the [_maximum_tokens] can increase by 50%.
        self._phase_length: int = phase_length

        # Tracks how many times the [_maximum_tokens] has increased by 50%.
        self._phase: int = 0

    def _start_clock(self):
        utcnow = datetime.datetime.now(datetime.timezone.utc)
        self._start = self._start or utcnow
        self._last_refill = self._last_refill or utcnow

    def take_tokens(self, num: int = 1, allow_less: bool = False) -> int:
        """Returns the number of available tokens, up to the amount requested."""
        self._start_clock()
        self._check_phase()
        self._refill()

        minimum_tokens = 1 if allow_less else num

        if self._available_tokens >= minimum_tokens:
            _num_to_take = min(self._available_tokens, num)
            self._available_tokens -= _num_to_take
            self._operations_this_phase += _num_to_take
            return _num_to_take
        return 0

    def _check_phase(self) -> None:
        """Increments or decrements [_phase] depending on traffic.

        Every [_phase_length] seconds, if > 50% of available traffic was used
        during the window, increases [_phase], otherwise, decreases [_phase].

        This is a no-op unless a new [_phase_length] number of seconds since the
        start was crossed since it was last called.
        """
        if self._start is None:
            raise TypeError("RateLimiter error: unset _start value")
        age: datetime.timedelta = (
            datetime.datetime.now(datetime.timezone.utc) - self._start
        )

        # Uses integer division to calculate the expected phase. We start in
        # Phase 0, so until [_phase_length] seconds have passed, this will
        # not resolve to 1.
        expected_phase: int = age.seconds // self._phase_length

        # Short-circuit if we are still in the expected phase.
        if expected_phase == self._phase:
            return

        operations_last_phase: int = self._operations_this_phase
        self._operations_this_phase = 0

        previous_phase: int = self._phase
        self._phase = expected_phase

        # No-op if we did nothing for an entire phase
        if operations_last_phase and self._phase > previous_phase:
            self._increase_maximum_tokens()

    def _increase_maximum_tokens(self) -> None:
        self._maximum_tokens = round(self._maximum_tokens * 1.5)
        if self._global_max_tokens is not None:
            self._maximum_tokens = min(self._maximum_tokens, self._global_max_tokens)

    def _refill(self) -> None:
        """Replenishes any tokens that should have regenerated since the last
        operation."""
        if self._last_refill is None:
            raise TypeError("RateLimiter error: unset _last_refill value")
        now: datetime.datetime = datetime.datetime.now(datetime.timezone.utc)
        time_since_last_refill: datetime.timedelta = now - self._last_refill

        if time_since_last_refill:
            self._last_refill = now

            # If we haven't done anything for 1s, then we know for certain we
            # should reset to max capacity.
            if time_since_last_refill.seconds >= 1:
                self._available_tokens = self._maximum_tokens

            # If we have done something in the last 1s, then we know we should
            # allocate proportional tokens.
            else:
                _percent_of_max: float = (
                    time_since_last_refill.microseconds / microseconds_per_second
                )
                new_tokens: int = round(_percent_of_max * self._maximum_tokens)

                # Add the number of provisioned tokens, capped at the maximum size.
                self._available_tokens = min(
                    self._maximum_tokens,
                    self._available_tokens + new_tokens,
                )
