# Copyright (c) Microsoft. All rights reserved.
# See https://aka.ms/csspeech/license for the full license information.

import ctypes
from enum import Enum
import os
import platform
import weakref


load_library = ctypes.cdll
if os.name == 'nt':
    library_name = "Microsoft.CognitiveServices.Speech.core.dll"
    load_library = ctypes.windll
elif platform.system() == 'Linux':
    library_name = "libMicrosoft.CognitiveServices.Speech.core.so"
else:
    library_name = "libMicrosoft.CognitiveServices.Speech.core.dylib"
lib_path = os.path.join(os.path.dirname(__file__), library_name)
_sdk_lib = load_library.LoadLibrary(lib_path)
_spx_handle = ctypes.c_void_p
_spx_hr = ctypes.c_size_t
_data_ptr = ctypes.POINTER(ctypes.c_uint8)
max_uint32 = ctypes.c_uint32(2**32 - 1)


def __char_pointer_to_string(ptr: ctypes.POINTER(ctypes.c_char)):
    if ptr is None:
        return None
    c_ptr = ctypes.cast(ptr, ctypes.c_char_p)
    return c_ptr.value.decode(encoding='utf-8')


def __try_get_error(error_handle: _spx_handle):
    _sdk_lib.error_get_error_code.restype = _spx_hr
    code = _sdk_lib.error_get_error_code(error_handle)
    if code == 0:
        return
    _sdk_lib.error_get_call_stack.restype = ctypes.POINTER(ctypes.c_char)
    r_callstack = _sdk_lib.error_get_call_stack(error_handle)
    callstack = __char_pointer_to_string(r_callstack)
    _sdk_lib.error_get_message.restype = ctypes.POINTER(ctypes.c_char)
    r_what = _sdk_lib.error_get_message(error_handle)
    what = __char_pointer_to_string(r_what)
    message = "Exception with error code: %s%s" % (
        callstack if callstack is not None else "",
        what if what is not None else code
    )
    _sdk_lib.error_release(error_handle)
    raise RuntimeError(message)


def _raise_if_failed(hr: _spx_hr):
    if hr != 0:
        __try_get_error(_spx_handle(hr))
        raise RuntimeError(hr)


def _call_hr_fn(*args, fn):
    fn.restype = _spx_hr
    hr = fn(*args) if len(args) > 0 else fn()
    _raise_if_failed(hr)


def _call_string_function_and_free(*args, fn) -> str:
    fn.restype = ctypes.POINTER(ctypes.c_char)
    ptr = fn(*args) if len(args) > 0 else fn()
    if ptr is None:
        return None
    value = ctypes.cast(ptr, ctypes.c_char_p)
    string_value = value.value.decode(encoding='utf-8')
    _sdk_lib.property_bag_free_string(ptr)
    return string_value


def _call_bool_fn(*args, fn):
    fn.restype = ctypes.c_bool
    return fn(*args) if len(args) > 0 else fn()


def _c_str(string: str) -> bytes:
    if string is None:
        return None
    return string.encode('utf-8')


def _identity(item):
    return item


def _release_if_valid(test_fn, release_fn, handle: _spx_handle):
    if _call_bool_fn(fn=test_fn, *[handle]):
        release_fn(handle)


class _Handle():
    def __init__(self, handle: _spx_handle, test_fn, release_fn):
        self.__handle = handle
        self.__test_fn = test_fn
        self.__release_fn = release_fn

    def __del__(self):
        if self.__test_fn is None:
            self.__release_fn(self.__handle)
        elif self.__test_fn(self.__handle):
            self.__release_fn(self.__handle)

    def get(self) -> _spx_handle:
        return self.__handle


class _CallbackContext():
    def __init__(self, obj):
        self.__obj = weakref.ref(obj)

    def get(self):
        return self.__obj()


def _unpack_context(context: ctypes.c_void_p):
    obj = ctypes.cast(context, ctypes.py_object).value
    return obj.get()


class LogLevel(Enum):
    """
    Defines different log levels
    """

    Error = 0x02
    Warning = 0x04
    Info = 0x08
    Verbose = 0x10


def _trace_message(level: LogLevel, title: str, file: str, line: int, message: str):
    c_level = ctypes.c_int(level.value)
    c_title = _c_str(title)
    c_file = _c_str(file)
    c_line = ctypes.c_int(line)
    c_message = _c_str(message)
    _sdk_lib.diagnostics_log_trace_string(c_level, c_title, c_file, c_line, c_message)
