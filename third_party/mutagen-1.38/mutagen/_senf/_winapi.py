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

import ctypes
from ctypes import WinDLL, wintypes


shell32 = WinDLL("shell32")
kernel32 = WinDLL("kernel32")
shlwapi = WinDLL("shlwapi")

GetCommandLineW = kernel32.GetCommandLineW
GetCommandLineW.argtypes = []
GetCommandLineW.restype = wintypes.LPCWSTR

CommandLineToArgvW = shell32.CommandLineToArgvW
CommandLineToArgvW.argtypes = [
    wintypes.LPCWSTR, ctypes.POINTER(ctypes.c_int)]
CommandLineToArgvW.restype = ctypes.POINTER(wintypes.LPWSTR)

LocalFree = kernel32.LocalFree
LocalFree.argtypes = [wintypes.HLOCAL]
LocalFree.restype = wintypes.HLOCAL

# https://msdn.microsoft.com/en-us/library/windows/desktop/aa383751.aspx
LPCTSTR = ctypes.c_wchar_p
LPWSTR = wintypes.LPWSTR
LPCWSTR = ctypes.c_wchar_p
LPTSTR = LPWSTR
PCWSTR = ctypes.c_wchar_p
PCTSTR = PCWSTR
PWSTR = ctypes.c_wchar_p
PTSTR = PWSTR
LPVOID = wintypes.LPVOID
WCHAR = wintypes.WCHAR
LPSTR = ctypes.c_char_p

BOOL = wintypes.BOOL
LPBOOL = ctypes.POINTER(BOOL)
UINT = wintypes.UINT
WORD = wintypes.WORD
DWORD = wintypes.DWORD
SHORT = wintypes.SHORT
HANDLE = wintypes.HANDLE
ULONG = wintypes.ULONG
LPCSTR = wintypes.LPCSTR

STD_INPUT_HANDLE = DWORD(-10)
STD_OUTPUT_HANDLE = DWORD(-11)
STD_ERROR_HANDLE = DWORD(-12)

INVALID_HANDLE_VALUE = wintypes.HANDLE(-1).value

INTERNET_MAX_SCHEME_LENGTH = 32
INTERNET_MAX_PATH_LENGTH = 2048
INTERNET_MAX_URL_LENGTH = (
    INTERNET_MAX_SCHEME_LENGTH + len("://") + INTERNET_MAX_PATH_LENGTH)

FOREGROUND_BLUE = 0x0001
FOREGROUND_GREEN = 0x0002
FOREGROUND_RED = 0x0004
FOREGROUND_INTENSITY = 0x0008

BACKGROUND_BLUE = 0x0010
BACKGROUND_GREEN = 0x0020
BACKGROUND_RED = 0x0040
BACKGROUND_INTENSITY = 0x0080

COMMON_LVB_REVERSE_VIDEO = 0x4000
COMMON_LVB_UNDERSCORE = 0x8000

UrlCreateFromPathW = shlwapi.UrlCreateFromPathW
UrlCreateFromPathW.argtypes = [
    PCTSTR, PTSTR, ctypes.POINTER(DWORD), DWORD]
UrlCreateFromPathW.restype = ctypes.HRESULT

SetEnvironmentVariableW = kernel32.SetEnvironmentVariableW
SetEnvironmentVariableW.argtypes = [LPCTSTR, LPCTSTR]
SetEnvironmentVariableW.restype = wintypes.BOOL

GetEnvironmentVariableW = kernel32.GetEnvironmentVariableW
GetEnvironmentVariableW.argtypes = [LPCTSTR, LPTSTR, DWORD]
GetEnvironmentVariableW.restype = DWORD

GetEnvironmentStringsW = kernel32.GetEnvironmentStringsW
GetEnvironmentStringsW.argtypes = []
GetEnvironmentStringsW.restype = ctypes.c_void_p

FreeEnvironmentStringsW = kernel32.FreeEnvironmentStringsW
FreeEnvironmentStringsW.argtypes = [ctypes.c_void_p]
FreeEnvironmentStringsW.restype = ctypes.c_bool

GetStdHandle = kernel32.GetStdHandle
GetStdHandle.argtypes = [DWORD]
GetStdHandle.restype = HANDLE


class COORD(ctypes.Structure):

    _fields_ = [
        ("X", SHORT),
        ("Y", SHORT),
    ]


class SMALL_RECT(ctypes.Structure):

    _fields_ = [
        ("Left", SHORT),
        ("Top", SHORT),
        ("Right", SHORT),
        ("Bottom", SHORT),
    ]


class CONSOLE_SCREEN_BUFFER_INFO(ctypes.Structure):

    _fields_ = [
        ("dwSize", COORD),
        ("dwCursorPosition", COORD),
        ("wAttributes", WORD),
        ("srWindow", SMALL_RECT),
        ("dwMaximumWindowSize", COORD),
    ]


GetConsoleScreenBufferInfo = kernel32.GetConsoleScreenBufferInfo
GetConsoleScreenBufferInfo.argtypes = [
    HANDLE, ctypes.POINTER(CONSOLE_SCREEN_BUFFER_INFO)]
GetConsoleScreenBufferInfo.restype = BOOL

GetConsoleOutputCP = kernel32.GetConsoleOutputCP
GetConsoleOutputCP.argtypes = []
GetConsoleOutputCP.restype = UINT

SetConsoleOutputCP = kernel32.SetConsoleOutputCP
SetConsoleOutputCP.argtypes = [UINT]
SetConsoleOutputCP.restype = BOOL

GetConsoleCP = kernel32.GetConsoleCP
GetConsoleCP.argtypes = []
GetConsoleCP.restype = UINT

SetConsoleCP = kernel32.SetConsoleCP
SetConsoleCP.argtypes = [UINT]
SetConsoleCP.restype = BOOL

SetConsoleTextAttribute = kernel32.SetConsoleTextAttribute
SetConsoleTextAttribute.argtypes = [HANDLE, WORD]
SetConsoleTextAttribute.restype = BOOL

SetConsoleCursorPosition = kernel32.SetConsoleCursorPosition
SetConsoleCursorPosition.argtypes = [HANDLE, COORD]
SetConsoleCursorPosition.restype = BOOL

ReadConsoleW = kernel32.ReadConsoleW
ReadConsoleW.argtypes = [HANDLE, LPVOID, DWORD, ctypes.POINTER(DWORD), LPVOID]
ReadConsoleW.restype = BOOL

MultiByteToWideChar = kernel32.MultiByteToWideChar
MultiByteToWideChar.argtypes = [
    UINT, DWORD, LPCSTR, ctypes.c_int, LPWSTR, ctypes.c_int]
MultiByteToWideChar.restype = ctypes.c_int

WideCharToMultiByte = kernel32.WideCharToMultiByte
WideCharToMultiByte.argtypes = [
    UINT, DWORD, LPCWSTR, ctypes.c_int, LPSTR, ctypes.c_int, LPCSTR, LPBOOL]
WideCharToMultiByte.restpye = ctypes.c_int

MoveFileW = kernel32.MoveFileW
MoveFileW.argtypes = [LPCTSTR, LPCTSTR]
MoveFileW.restype = BOOL
