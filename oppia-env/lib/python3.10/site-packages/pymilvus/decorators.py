import datetime
import functools
import logging
import time
from typing import Any, Callable, Optional

import grpc

from .exceptions import ErrorCode, MilvusException
from .grpc_gen import common_pb2

LOGGER = logging.getLogger(__name__)
WARNING_COLOR = "\033[93m{}\033[0m"


def deprecated(func: Any):
    @functools.wraps(func)
    def inner(*args, **kwargs):
        LOGGER.warning(
            WARNING_COLOR.format(
                "[WARNING] PyMilvus: ",
                "class Milvus will be deprecated soon, please use Collection/utility instead",
            )
        )
        return func(*args, **kwargs)

    return inner


# Reference: https://grpc.github.io/grpc/python/grpc.html#grpc-status-code
IGNORE_RETRY_CODES = (
    grpc.StatusCode.DEADLINE_EXCEEDED,
    grpc.StatusCode.PERMISSION_DENIED,
    grpc.StatusCode.UNAUTHENTICATED,
    grpc.StatusCode.INVALID_ARGUMENT,
    grpc.StatusCode.ALREADY_EXISTS,
    grpc.StatusCode.RESOURCE_EXHAUSTED,
    grpc.StatusCode.UNIMPLEMENTED,
)


def retry_on_rpc_failure(
    *,
    retry_times: int = 75,
    initial_back_off: float = 0.01,
    max_back_off: float = 3,
    back_off_multiplier: int = 3,
):
    def wrapper(func: Any):
        @functools.wraps(func)
        @error_handler(func_name=func.__name__)
        @tracing_request()
        def handler(*args, **kwargs):
            # This has to make sure every timeout parameter is passing
            # throught kwargs form as `timeout=10`
            _timeout = kwargs.get("timeout")
            _retry_times = kwargs.get("retry_times")
            _retry_on_rate_limit = kwargs.get("retry_on_rate_limit", True)

            retry_timeout = _timeout if _timeout is not None and isinstance(_timeout, int) else None
            final_retry_times = (
                _retry_times
                if _retry_times is not None and isinstance(_retry_times, int)
                else retry_times
            )
            counter = 1
            back_off = initial_back_off
            start_time = time.time()

            def timeout(start_time: Optional[float] = None) -> bool:
                """If timeout is valid, use timeout as the retry limits,
                If timeout is None, use final_retry_times as the retry limits.
                """
                if retry_timeout is not None:
                    return time.time() - start_time >= retry_timeout
                return counter > final_retry_times

            to_msg = (
                f"[{func.__name__}] Retry timeout: {retry_timeout}s"
                if retry_timeout is not None
                else f"[{func.__name__}] Retry run out of {final_retry_times} retry times"
            )

            while True:
                try:
                    return func(*args, **kwargs)
                except grpc.RpcError as e:
                    # Do not retry on these codes
                    if e.code() in IGNORE_RETRY_CODES:
                        raise e from e
                    if timeout(start_time):
                        raise MilvusException(e.code, f"{to_msg}, message={e.details()}") from e

                    if counter > 3:
                        retry_msg = (
                            f"[{func.__name__}] retry:{counter}, cost: {back_off:.2f}s, "
                            f"reason: <{e.__class__.__name__}: {e.code()}, {e.details()}>"
                        )
                        # retry msg uses info level
                        LOGGER.info(retry_msg)

                    time.sleep(back_off)
                    back_off = min(back_off * back_off_multiplier, max_back_off)
                except MilvusException as e:
                    if timeout(start_time):
                        LOGGER.warning(WARNING_COLOR.format(to_msg))
                        raise MilvusException(
                            code=e.code, message=f"{to_msg}, message={e.message}"
                        ) from e
                    if _retry_on_rate_limit and (
                        e.code == ErrorCode.RATE_LIMIT or e.compatible_code == common_pb2.RateLimit
                    ):
                        time.sleep(back_off)
                        back_off = min(back_off * back_off_multiplier, max_back_off)
                    else:
                        raise e from e
                except Exception as e:
                    raise e from e
                finally:
                    counter += 1

        return handler

    return wrapper


def error_handler(func_name: str = ""):
    def wrapper(func: Callable):
        @functools.wraps(func)
        def handler(*args, **kwargs):
            inner_name = func_name
            if inner_name == "":
                inner_name = func.__name__
            record_dict = {}
            try:
                record_dict["RPC start"] = str(datetime.datetime.now())
                return func(*args, **kwargs)
            except MilvusException as e:
                record_dict["RPC error"] = str(datetime.datetime.now())
                LOGGER.error(f"RPC error: [{inner_name}], {e}, <Time:{record_dict}>")
                raise e from e
            except grpc.FutureTimeoutError as e:
                record_dict["gRPC timeout"] = str(datetime.datetime.now())
                LOGGER.error(
                    f"grpc Timeout: [{inner_name}], <{e.__class__.__name__}: "
                    f"{e.code()}, {e.details()}>, <Time:{record_dict}>"
                )
                raise e from e
            except grpc.RpcError as e:
                record_dict["gRPC error"] = str(datetime.datetime.now())
                LOGGER.error(
                    f"grpc RpcError: [{inner_name}], <{e.__class__.__name__}: "
                    f"{e.code()}, {e.details()}>, <Time:{record_dict}>"
                )
                raise e from e
            except Exception as e:
                record_dict["Exception"] = str(datetime.datetime.now())
                LOGGER.error(f"Unexpected error: [{inner_name}], {e}, <Time: {record_dict}>")
                raise MilvusException(message=f"Unexpected error, message=<{e!s}>") from e

        return handler

    return wrapper


def tracing_request():
    def wrapper(func: Callable):
        @functools.wraps(func)
        def handler(self: Callable, *args, **kwargs):
            level = kwargs.get("log-level", kwargs.get("log_level"))
            if level:
                self.set_onetime_loglevel(level)
            return func(self, *args, **kwargs)

        return handler

    return wrapper


def ignore_unimplemented(default_return_value: Any):
    def wrapper(func: Callable):
        @functools.wraps(func)
        def handler(*args, **kwargs):
            try:
                return func(*args, **kwargs)
            except grpc.RpcError as e:
                if e.code() == grpc.StatusCode.UNIMPLEMENTED:
                    LOGGER.debug(f"{func.__name__} unimplemented, ignore it")
                    return default_return_value
                raise e from e
            except Exception as e:
                raise e from e

        return handler

    return wrapper


def upgrade_reminder(func: Callable):
    @functools.wraps(func)
    def handler(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except grpc.RpcError as e:
            if e.code() == grpc.StatusCode.UNIMPLEMENTED:
                msg = (
                    "Incorrect port or sdk is incompatible with server, "
                    "please check your port or downgrade your sdk or upgrade your server"
                )
                raise MilvusException(message=msg) from e
            raise e from e
        except Exception as e:
            raise e from e

    return handler
