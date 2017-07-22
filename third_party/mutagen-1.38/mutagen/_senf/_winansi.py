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
import re
import atexit

from . import _winapi as winapi


def ansi_parse(code):
    """Returns command, (args)"""

    return code[-1:], tuple([int(v or "0") for v in code[2:-1].split(";")])


def ansi_split(text, _re=re.compile(u"(\x1b\[(\d*;?)*\S)")):
    """Yields (is_ansi, text)"""

    for part in _re.split(text):
        if part:
            yield (bool(_re.match(part)), part)


class AnsiCommand(object):
    TEXT = "m"

    MOVE_UP = "A"
    MOVE_DOWN = "B"
    MOVE_FORWARD = "C"
    MOVE_BACKWARD = "D"

    SET_POS = "H"
    SET_POS_ALT = "f"

    SAVE_POS = "s"
    RESTORE_POS = "u"


class TextAction(object):
    RESET_ALL = 0

    SET_BOLD = 1
    SET_DIM = 2
    SET_ITALIC = 3
    SET_UNDERLINE = 4
    SET_BLINK = 5
    SET_BLINK_FAST = 6
    SET_REVERSE = 7
    SET_HIDDEN = 8

    RESET_BOLD = 21
    RESET_DIM = 22
    RESET_ITALIC = 23
    RESET_UNDERLINE = 24
    RESET_BLINK = 25
    RESET_BLINK_FAST = 26
    RESET_REVERSE = 27
    RESET_HIDDEN = 28

    FG_BLACK = 30
    FG_RED = 31
    FG_GREEN = 32
    FG_YELLOW = 33
    FG_BLUE = 34
    FG_MAGENTA = 35
    FG_CYAN = 36
    FG_WHITE = 37

    FG_DEFAULT = 39

    FG_LIGHT_BLACK = 90
    FG_LIGHT_RED = 91
    FG_LIGHT_GREEN = 92
    FG_LIGHT_YELLOW = 93
    FG_LIGHT_BLUE = 94
    FG_LIGHT_MAGENTA = 95
    FG_LIGHT_CYAN = 96
    FG_LIGHT_WHITE = 97

    BG_BLACK = 40
    BG_RED = 41
    BG_GREEN = 42
    BG_YELLOW = 43
    BG_BLUE = 44
    BG_MAGENTA = 45
    BG_CYAN = 46
    BG_WHITE = 47

    BG_DEFAULT = 49

    BG_LIGHT_BLACK = 100
    BG_LIGHT_RED = 101
    BG_LIGHT_GREEN = 102
    BG_LIGHT_YELLOW = 103
    BG_LIGHT_BLUE = 104
    BG_LIGHT_MAGENTA = 105
    BG_LIGHT_CYAN = 106
    BG_LIGHT_WHITE = 107


class AnsiState(object):

    def __init__(self):
        self.default_attrs = None

        self.bold = False
        self.bg_light = False
        self.fg_light = False

        self.saved_pos = (0, 0)

    def do_text_action(self, attrs, action):
        # In case the external state has changed, apply it it to ours.
        # Mostly the first time this is called.
        if attrs & winapi.FOREGROUND_INTENSITY and not self.fg_light \
                and not self.bold:
            self.fg_light = True
        if attrs & winapi.BACKGROUND_INTENSITY and not self.bg_light:
            self.bg_light = True

        dark_fg = {
            TextAction.FG_BLACK: 0,
            TextAction.FG_RED: winapi.FOREGROUND_RED,
            TextAction.FG_GREEN: winapi.FOREGROUND_GREEN,
            TextAction.FG_YELLOW:
                winapi.FOREGROUND_GREEN | winapi.FOREGROUND_RED,
            TextAction.FG_BLUE: winapi.FOREGROUND_BLUE,
            TextAction.FG_MAGENTA: winapi.FOREGROUND_BLUE |
                winapi.FOREGROUND_RED,
            TextAction.FG_CYAN:
                winapi.FOREGROUND_BLUE | winapi.FOREGROUND_GREEN,
            TextAction.FG_WHITE:
                winapi.FOREGROUND_BLUE | winapi.FOREGROUND_GREEN |
                winapi.FOREGROUND_RED,
        }

        dark_bg = {
            TextAction.BG_BLACK: 0,
            TextAction.BG_RED: winapi.BACKGROUND_RED,
            TextAction.BG_GREEN: winapi.BACKGROUND_GREEN,
            TextAction.BG_YELLOW:
                winapi.BACKGROUND_GREEN | winapi.BACKGROUND_RED,
            TextAction.BG_BLUE: winapi.BACKGROUND_BLUE,
            TextAction.BG_MAGENTA:
                winapi.BACKGROUND_BLUE | winapi.BACKGROUND_RED,
            TextAction.BG_CYAN:
                winapi.BACKGROUND_BLUE | winapi.BACKGROUND_GREEN,
            TextAction.BG_WHITE:
                winapi.BACKGROUND_BLUE | winapi.BACKGROUND_GREEN |
                winapi.BACKGROUND_RED,
        }

        light_fg = {
            TextAction.FG_LIGHT_BLACK: 0,
            TextAction.FG_LIGHT_RED: winapi.FOREGROUND_RED,
            TextAction.FG_LIGHT_GREEN: winapi.FOREGROUND_GREEN,
            TextAction.FG_LIGHT_YELLOW:
                winapi.FOREGROUND_GREEN | winapi.FOREGROUND_RED,
            TextAction.FG_LIGHT_BLUE: winapi.FOREGROUND_BLUE,
            TextAction.FG_LIGHT_MAGENTA:
                winapi.FOREGROUND_BLUE | winapi.FOREGROUND_RED,
            TextAction.FG_LIGHT_CYAN:
                winapi.FOREGROUND_BLUE | winapi.FOREGROUND_GREEN,
            TextAction.FG_LIGHT_WHITE:
                winapi.FOREGROUND_BLUE | winapi.FOREGROUND_GREEN |
                winapi.FOREGROUND_RED,
        }

        light_bg = {
            TextAction.BG_LIGHT_BLACK: 0,
            TextAction.BG_LIGHT_RED: winapi.BACKGROUND_RED,
            TextAction.BG_LIGHT_GREEN: winapi.BACKGROUND_GREEN,
            TextAction.BG_LIGHT_YELLOW:
                winapi.BACKGROUND_GREEN | winapi.BACKGROUND_RED,
            TextAction.BG_LIGHT_BLUE: winapi.BACKGROUND_BLUE,
            TextAction.BG_LIGHT_MAGENTA:
                winapi.BACKGROUND_BLUE | winapi.BACKGROUND_RED,
            TextAction.BG_LIGHT_CYAN:
                winapi.BACKGROUND_BLUE | winapi.BACKGROUND_GREEN,
            TextAction.BG_LIGHT_WHITE:
                winapi.BACKGROUND_BLUE | winapi.BACKGROUND_GREEN |
                winapi.BACKGROUND_RED,
        }

        if action == TextAction.RESET_ALL:
            attrs = self.default_attrs
            self.bold = self.fg_light = self.bg_light = False
        elif action == TextAction.SET_BOLD:
            self.bold = True
        elif action == TextAction.RESET_BOLD:
            self.bold = False
        elif action == TextAction.SET_DIM:
            self.bold = False
        elif action == TextAction.SET_REVERSE:
            attrs |= winapi.COMMON_LVB_REVERSE_VIDEO
        elif action == TextAction.RESET_REVERSE:
            attrs &= ~winapi.COMMON_LVB_REVERSE_VIDEO
        elif action == TextAction.SET_UNDERLINE:
            attrs |= winapi.COMMON_LVB_UNDERSCORE
        elif action == TextAction.RESET_UNDERLINE:
            attrs &= ~winapi.COMMON_LVB_UNDERSCORE
        elif action == TextAction.FG_DEFAULT:
            attrs = (attrs & ~0xF) | (self.default_attrs & 0xF)
            self.fg_light = False
        elif action == TextAction.BG_DEFAULT:
            attrs = (attrs & ~0xF0) | (self.default_attrs & 0xF0)
            self.bg_light = False
        elif action in dark_fg:
            attrs = (attrs & ~0xF) | dark_fg[action]
            self.fg_light = False
        elif action in dark_bg:
            attrs = (attrs & ~0xF0) | dark_bg[action]
            self.bg_light = False
        elif action in light_fg:
            attrs = (attrs & ~0xF) | light_fg[action]
            self.fg_light = True
        elif action in light_bg:
            attrs = (attrs & ~0xF0) | light_bg[action]
            self.bg_light = True

        if self.fg_light or self.bold:
            attrs |= winapi.FOREGROUND_INTENSITY
        else:
            attrs &= ~winapi.FOREGROUND_INTENSITY

        if self.bg_light:
            attrs |= winapi.BACKGROUND_INTENSITY
        else:
            attrs &= ~winapi.BACKGROUND_INTENSITY

        return attrs

    def apply(self, handle, code):
        buffer_info = winapi.CONSOLE_SCREEN_BUFFER_INFO()
        if not winapi.GetConsoleScreenBufferInfo(handle,
                                                 ctypes.byref(buffer_info)):
            return

        attrs = buffer_info.wAttributes

        # We take the first attrs we see as default
        if self.default_attrs is None:
            self.default_attrs = attrs
            # Make sure that like with linux terminals the program doesn't
            # affect the prompt after it exits
            atexit.register(
                winapi.SetConsoleTextAttribute, handle, self.default_attrs)

        cmd, args = ansi_parse(code)
        if cmd == AnsiCommand.TEXT:
            for action in args:
                attrs = self.do_text_action(attrs, action)
            winapi.SetConsoleTextAttribute(handle, attrs)
        elif cmd in (AnsiCommand.MOVE_UP, AnsiCommand.MOVE_DOWN,
                     AnsiCommand.MOVE_FORWARD, AnsiCommand.MOVE_BACKWARD):

            coord = buffer_info.dwCursorPosition
            x, y = coord.X, coord.Y

            amount = max(args[0], 1)

            if cmd == AnsiCommand.MOVE_UP:
                y -= amount
            elif cmd == AnsiCommand.MOVE_DOWN:
                y += amount
            elif cmd == AnsiCommand.MOVE_FORWARD:
                x += amount
            elif cmd == AnsiCommand.MOVE_BACKWARD:
                x -= amount

            x = max(x, 0)
            y = max(y, 0)
            winapi.SetConsoleCursorPosition(handle, winapi.COORD(x, y))
        elif cmd in (AnsiCommand.SET_POS, AnsiCommand.SET_POS_ALT):
            args = list(args)
            while len(args) < 2:
                args.append(0)
            x, y = args[:2]

            win_rect = buffer_info.srWindow
            x += win_rect.Left - 1
            y += win_rect.Top - 1

            x = max(x, 0)
            y = max(y, 0)
            winapi.SetConsoleCursorPosition(handle, winapi.COORD(x, y))
        elif cmd == AnsiCommand.SAVE_POS:
            win_rect = buffer_info.srWindow
            coord = buffer_info.dwCursorPosition
            x, y = coord.X, coord.Y
            x -= win_rect.Left
            y -= win_rect.Top
            self.saved_pos = (x, y)
        elif cmd == AnsiCommand.RESTORE_POS:
            win_rect = buffer_info.srWindow
            x, y = self.saved_pos
            x += win_rect.Left
            y += win_rect.Top
            winapi.SetConsoleCursorPosition(handle, winapi.COORD(x, y))
