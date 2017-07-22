# -*- coding: utf-8 -*-
# Copyright 2016 Christoph Reiter
#
# Permission is hereby granted, free of charge, to any person obtaining
# a copy of this software and associated documentation files (the
# "Software"), to deal in the Software without restriction, including
# without limitation the rights to use, copy, modify, merge, publish,
# distribute, sublicense, and/or sell copies of the Software, and to
# permit persons to whom the Software is furnished to do so, subject to
# the following conditions:
#
# The above copyright notice and this permission notice shall be
# included in all copies or substantial portions of the Software.

import os
import ctypes
import collections

from ._compat import text_type, PY2
from ._fsnative import path2fsn, is_win, _fsn2legacy, fsnative
from . import _winapi as winapi


def get_windows_env_var(key):
    """Get an env var.

    Raises:
        WindowsError
    """

    if not isinstance(key, text_type):
        raise TypeError("%r not of type %r" % (key, text_type))

    buf = ctypes.create_unicode_buffer(32767)

    stored = winapi.GetEnvironmentVariableW(key, buf, 32767)
    if stored == 0:
        raise ctypes.WinError()
    return buf[:stored]


def set_windows_env_var(key, value):
    """Set an env var.

    Raises:
        WindowsError
    """

    if not isinstance(key, text_type):
        raise TypeError("%r not of type %r" % (key, text_type))

    if not isinstance(value, text_type):
        raise TypeError("%r not of type %r" % (value, text_type))

    status = winapi.SetEnvironmentVariableW(key, value)
    if status == 0:
        raise ctypes.WinError()


def del_windows_env_var(key):
    """Delete an env var.

    Raises:
        WindowsError
    """

    if not isinstance(key, text_type):
        raise TypeError("%r not of type %r" % (key, text_type))

    status = winapi.SetEnvironmentVariableW(key, None)
    if status == 0:
        raise ctypes.WinError()


def read_windows_environ():
    """Returns a unicode dict of the Windows environment.

    Raises:
        WindowsEnvironError
    """

    res = winapi.GetEnvironmentStringsW()
    if not res:
        raise ctypes.WinError()

    res = ctypes.cast(res, ctypes.POINTER(ctypes.c_wchar))

    done = []
    current = u""
    i = 0
    while 1:
        c = res[i]
        i += 1
        if c == u"\x00":
            if not current:
                break
            done.append(current)
            current = u""
            continue
        current += c

    dict_ = {}
    for entry in done:
        try:
            key, value = entry.split(u"=", 1)
        except ValueError:
            continue
        key = _norm_key(key)
        dict_[key] = value

    status = winapi.FreeEnvironmentStringsW(res)
    if status == 0:
        raise ctypes.WinError()

    return dict_


def _norm_key(key):
    assert isinstance(key, fsnative)
    if is_win:
        key = key.upper()
    return key


class Environ(collections.MutableMapping):
    """Dict[`fsnative`, `fsnative`]: Like `os.environ` but contains unicode
    keys and values under Windows + Python 2.

    Any changes made will be forwarded to `os.environ`.
    """

    def __init__(self):
        if is_win and PY2:
            try:
                env = read_windows_environ()
            except WindowsError:
                env = {}
        else:
            env = os.environ
        self._env = env

    def __getitem__(self, key):
        key = _norm_key(path2fsn(key))
        return self._env[key]

    def __setitem__(self, key, value):
        key = _norm_key(path2fsn(key))
        value = path2fsn(value)

        if is_win and PY2:
            # this calls putenv, so do it first and replace later
            try:
                os.environ[_fsn2legacy(key)] = _fsn2legacy(value)
            except OSError:
                raise ValueError

            try:
                set_windows_env_var(key, value)
            except WindowsError:
                # py3+win fails for invalid keys. try to do the same
                raise ValueError
        try:
            self._env[key] = value
        except OSError:
            raise ValueError

    def __delitem__(self, key):
        key = _norm_key(path2fsn(key))

        if is_win and PY2:
            try:
                del_windows_env_var(key)
            except WindowsError:
                pass

            try:
                del os.environ[_fsn2legacy(key)]
            except KeyError:
                pass

        del self._env[key]

    def __iter__(self):
        return iter(self._env)

    def __len__(self):
        return len(self._env)

    def __repr__(self):
        return repr(self._env)

    def copy(self):
        return self._env.copy()


environ = Environ()


def getenv(key, value=None):
    """Like `os.getenv` but returns unicode under Windows + Python 2

    Args:
        key (pathlike): The env var to get
        value (object): The value to return if the env var does not exist
    Returns:
        `fsnative` or `object`:
            The env var or the passed value if it doesn't exist
    """

    key = path2fsn(key)
    if is_win and PY2:
        return environ.get(key, value)
    return os.getenv(key, value)


def unsetenv(key):
    """Like `os.unsetenv` but takes unicode under Windows + Python 2

    Args:
        key (pathlike): The env var to unset
    """

    key = path2fsn(key)
    if is_win:
        # python 3 has no unsetenv under Windows -> use our ctypes one as well
        try:
            del_windows_env_var(key)
        except WindowsError:
            pass
    else:
        os.unsetenv(key)


def putenv(key, value):
    """Like `os.putenv` but takes unicode under Windows + Python 2

    Args:
        key (pathlike): The env var to get
        value (pathlike): The value to set
    Raises:
        ValueError
    """

    key = path2fsn(key)
    value = path2fsn(value)

    if is_win and PY2:
        try:
            set_windows_env_var(key, value)
        except WindowsError:
            # py3 + win fails here
            raise ValueError
    else:
        try:
            os.putenv(key, value)
        except OSError:
            # win + py3 raise here for invalid keys which is probably a bug.
            # ValueError seems better
            raise ValueError
