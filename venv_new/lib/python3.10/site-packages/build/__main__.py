# SPDX-License-Identifier: MIT

from __future__ import annotations

import argparse
import contextlib
import contextvars
import json
import os
import platform
import shutil
import subprocess
import sys
import tempfile
import textwrap
import traceback
import warnings

from collections.abc import Iterator, Mapping, Sequence
from functools import partial
from typing import Any, NoReturn, TextIO

import pyproject_hooks

import build

from . import ProjectBuilder, _ctx
from . import env as _env
from ._exceptions import BuildBackendException, BuildException, FailedProcessError
from ._types import ConfigSettings, Distribution, StrPath, SubprocessRunner
from .env import DefaultIsolatedEnv


_COLORS = {
    'red': '\33[91m',
    'green': '\33[92m',
    'yellow': '\33[93m',
    'bold': '\33[1m',
    'dim': '\33[2m',
    'underline': '\33[4m',
    'reset': '\33[0m',
}
_NO_COLORS = dict.fromkeys(_COLORS, '')


_styles = contextvars.ContextVar('_styles', default=_COLORS)


def _init_colors() -> None:
    if 'NO_COLOR' in os.environ:
        if 'FORCE_COLOR' in os.environ:
            warnings.warn('Both NO_COLOR and FORCE_COLOR environment variables are set, disabling color', stacklevel=2)
        _styles.set(_NO_COLORS)
    elif 'FORCE_COLOR' in os.environ or sys.stdout.isatty():
        return
    _styles.set(_NO_COLORS)


def _cprint(fmt: str = '', msg: str = '', file: TextIO | None = None) -> None:
    print(fmt.format(msg, **_styles.get()), file=file, flush=True)


def _showwarning(
    message: Warning | str,
    category: type[Warning],
    filename: str,
    lineno: int,
    file: TextIO | None = None,
    line: str | None = None,
) -> None:  # pragma: no cover
    _cprint('{yellow}WARNING{reset} {}', str(message), file)


def _make_logger() -> _ctx.Logger:
    max_terminal_width = shutil.get_terminal_size().columns - 2
    if max_terminal_width <= 0:  # pragma: no cover
        max_terminal_width = 78

    fill = partial(textwrap.fill, subsequent_indent='  ', width=max_terminal_width)

    def log(message: str, *, origin: tuple[str, ...] | None = None) -> None:
        if _ctx.verbosity >= -1:
            if origin is None:
                (first, *rest) = message.splitlines()
                _cprint('{bold}{}{reset}', fill(first, initial_indent='* '), file=sys.stderr)
                for line in rest:
                    print(fill(line, initial_indent='  '), file=sys.stderr)

            elif origin[0] == 'subprocess':
                initial_indent = '> ' if origin[1] == 'cmd' else '< '
                for line in message.splitlines():
                    _cprint('{dim}{}{reset}', fill(line, initial_indent=initial_indent), file=sys.stderr)

    return log


def _setup_cli(*, verbosity: int) -> None:
    warnings.showwarning = _showwarning

    if platform.system() == 'Windows':
        try:
            import colorama

            colorama.init()
        except ModuleNotFoundError:
            pass

    _init_colors()

    _ctx.LOGGER.set(_make_logger())
    _ctx.VERBOSITY.set(verbosity)


def _error(msg: str, code: int = 1) -> NoReturn:  # pragma: no cover
    """
    Print an error message and exit. Will color the output when writing to a TTY.

    :param msg: Error message
    :param code: Error code
    """
    _cprint('{red}ERROR{reset} {}', msg, file=sys.stderr)
    raise SystemExit(code)


def _format_dep_chain(dep_chain: Sequence[str]) -> str:
    return ' -> '.join(dep.partition(';')[0].strip() for dep in dep_chain)


@contextlib.contextmanager
def _bootstrap_build_env(
    isolation: bool,
    srcdir: StrPath,
    distribution: Distribution,
    config_settings: ConfigSettings | None,
    skip_dependency_check: bool,
    installer: _env.Installer,
    runner: SubprocessRunner | None = None,
) -> Iterator[ProjectBuilder]:
    if isolation:
        with DefaultIsolatedEnv(installer=installer) as env:
            make_builder = partial(ProjectBuilder.from_isolated_env, env, srcdir)
            if runner:
                make_builder = partial(make_builder, runner=runner)
            builder = make_builder()

            # first install the build dependencies
            env.install(builder.build_system_requires)
            # then get the extra required dependencies from the backend (which was installed in the call above :P)
            env.install(builder.get_requires_for_build(distribution, config_settings))

            yield builder

    else:
        make_builder = partial(ProjectBuilder, srcdir)
        if runner:
            make_builder = partial(make_builder, runner=runner)
        builder = make_builder()

        if not skip_dependency_check:
            missing = builder.check_dependencies(distribution, config_settings)
            if missing:
                dependencies = ''.join(
                    '\n\t' + dep for deps in missing for dep in (deps[0], _format_dep_chain(deps[1:])) if dep
                )
                _cprint()
                _error(f'Missing dependencies:{dependencies}')

        yield builder


def _build(
    isolation: bool,
    srcdir: StrPath,
    outdir: StrPath,
    distribution: Distribution,
    config_settings: ConfigSettings | None,
    skip_dependency_check: bool,
    installer: _env.Installer,
) -> str:
    with _bootstrap_build_env(
        isolation,
        srcdir,
        distribution,
        config_settings,
        skip_dependency_check,
        installer,
        pyproject_hooks.quiet_subprocess_runner if _ctx.verbosity < 0 else None,
    ) as builder:
        return builder.build(distribution, outdir, config_settings)


@contextlib.contextmanager
def _handle_build_error() -> Iterator[None]:
    try:
        yield
    except (BuildException, FailedProcessError) as e:
        _error(str(e))
    except BuildBackendException as e:
        if isinstance(e.exception, subprocess.CalledProcessError):
            _cprint()
            _error(str(e))

        if e.exc_info:
            tb_lines = traceback.format_exception(
                e.exc_info[0],
                e.exc_info[1],
                e.exc_info[2],
                limit=-1,
            )
            tb = ''.join(tb_lines)
        else:  # pragma: no cover
            tb = traceback.format_exc(-1)  # type: ignore[unreachable]
        _cprint('\n{dim}{}{reset}\n', tb.strip('\n'))
        _error(str(e))
    except Exception as e:  # pragma: no cover
        tb = traceback.format_exc().strip('\n')
        _cprint('\n{dim}{}{reset}\n', tb)
        _error(str(e))


def _natural_language_list(elements: Sequence[str]) -> str:
    if len(elements) == 0:
        msg = 'no elements'
        raise IndexError(msg)
    elif len(elements) == 1:
        return elements[0]
    else:
        return '{} and {}'.format(
            ', '.join(elements[:-1]),
            elements[-1],
        )


def build_package(
    srcdir: StrPath,
    outdir: StrPath,
    distributions: Sequence[Distribution],
    config_settings: ConfigSettings | None = None,
    isolation: bool = True,
    skip_dependency_check: bool = False,
    installer: _env.Installer = 'pip',
) -> list[str]:
    """
    Run the build process.

    :param srcdir: Source directory
    :param outdir: Output directory
    :param distribution: Distribution to build (sdist or wheel)
    :param config_settings: Configuration settings to be passed to the backend
    :param isolation: Isolate the build in a separate environment
    :param skip_dependency_check: Do not perform the dependency check
    """
    built: list[str] = []
    for distribution in distributions:
        out = _build(isolation, srcdir, outdir, distribution, config_settings, skip_dependency_check, installer)
        built.append(os.path.basename(out))
    return built


def build_package_via_sdist(
    srcdir: StrPath,
    outdir: StrPath,
    distributions: Sequence[Distribution],
    config_settings: ConfigSettings | None = None,
    isolation: bool = True,
    skip_dependency_check: bool = False,
    installer: _env.Installer = 'pip',
) -> list[str]:
    """
    Build a sdist and then the specified distributions from it.

    :param srcdir: Source directory
    :param outdir: Output directory
    :param distribution: Distribution to build (only wheel)
    :param config_settings: Configuration settings to be passed to the backend
    :param isolation: Isolate the build in a separate environment
    :param skip_dependency_check: Do not perform the dependency check
    """
    from ._compat import tarfile

    if 'sdist' in distributions:
        msg = 'Only binary distributions are allowed but sdist was specified'
        raise ValueError(msg)

    sdist = _build(isolation, srcdir, outdir, 'sdist', config_settings, skip_dependency_check, installer)

    sdist_name = os.path.basename(sdist)
    sdist_out = tempfile.mkdtemp(prefix='build-via-sdist-')
    built: list[str] = []
    if distributions:
        # extract sdist
        with tarfile.TarFile.open(sdist) as t:
            t.extractall(sdist_out)
            try:
                _ctx.log(f'Building {_natural_language_list(distributions)} from sdist')
                srcdir = os.path.join(sdist_out, sdist_name[: -len('.tar.gz')])
                for distribution in distributions:
                    out = _build(isolation, srcdir, outdir, distribution, config_settings, skip_dependency_check, installer)
                    built.append(os.path.basename(out))
            finally:
                shutil.rmtree(sdist_out, ignore_errors=True)
    return [sdist_name, *built]


def _build_metadata(
    srcdir: StrPath,
    outdir: StrPath,
    distributions: Sequence[Distribution],
    config_settings: ConfigSettings | None = None,
    isolation: bool = True,
    skip_dependency_check: bool = False,
    installer: _env.Installer = 'pip',
) -> list[str]:
    import packaging.metadata

    def run_subprocess(cmd: Sequence[StrPath], cwd: str | None = None, extra_environ: Mapping[str, str] | None = None) -> None:
        env = os.environ.copy()
        if extra_environ:
            env.update(extra_environ)
        _ctx.run_subprocess(cmd, cwd, env)

    with (
        _bootstrap_build_env(
            isolation, srcdir, 'wheel', config_settings, skip_dependency_check, installer, runner=run_subprocess
        ) as builder,
        tempfile.TemporaryDirectory() as tempdir,
        open(
            os.path.join(builder.metadata_path(tempdir), 'METADATA'),
            'rb',
        ) as metadata_file,
    ):
        valid_metadata, _ = packaging.metadata.parse_email(metadata_file.read())
    print(
        json.dumps(valid_metadata, ensure_ascii=False, indent=2),
    )

    return []


def main_parser() -> argparse.ArgumentParser:
    """
    Construct the main parser.
    """

    class NegativeCountAction(argparse.Action):
        def __init__(
            self,
            option_strings: Sequence[str],
            dest: str,
            default: Any = None,
            help: str | None = None,
        ) -> None:
            super().__init__(
                option_strings=option_strings,
                dest=dest,
                nargs=0,
                default=default,
                help=help,
            )

        def __call__(
            self,
            parser: argparse.ArgumentParser,
            namespace: object,
            values: str | Sequence[Any] | None,
            option_string: str | None = None,
        ) -> None:
            setattr(namespace, self.dest, getattr(namespace, self.dest, 0) - 1)

    formatter_class = argparse.RawDescriptionHelpFormatter

    make_parser = partial(
        argparse.ArgumentParser,
        add_help=False,
        description="""\
    A simple, correct Python build frontend.

    By default, a source distribution (sdist) is built from the project root
    and a binary distribution (wheel) is built from the sdist.
    If this is undesirable, you can pass `--sdist` and/or `--wheel`
    to build distributions independently of each other.
    """.rstrip(),
        # Prevent argparse from taking up the entire width of the terminal window
        # which impedes readability. Also keep the description formatted.
        formatter_class=formatter_class,
    )
    if sys.version_info >= (3, 14):
        make_parser = partial(make_parser, suggest_on_error=True)

    parser = make_parser()
    parser.add_argument(
        'srcdir',
        type=str,
        nargs='?',
        default=os.getcwd(),
        help='source directory (defaults to the current working directory)',
    )

    global_group = parser.add_argument_group('global options')
    global_group.add_argument(
        '-h',
        '--help',
        action='help',
        default=argparse.SUPPRESS,
        help='show this help message and exit',
    )
    global_group.add_argument(
        '--version',
        '-V',
        action='version',
        version=f'build {build.__version__} ({",".join(build.__path__)})',
    )
    verbosity_exclusive_group = global_group.add_mutually_exclusive_group()
    verbosity_exclusive_group.add_argument(
        '--quiet',
        '-q',
        dest='verbosity',
        action=NegativeCountAction,
        default=0,
        help='reduce verbosity',
    )
    verbosity_exclusive_group.add_argument(
        '--verbose',
        '-v',
        dest='verbosity',
        action='count',
        default=0,
        help='increase verbosity',
    )

    build_group = parser.add_argument_group('build options')
    build_group.add_argument(
        '--outdir',
        '-o',
        type=str,
        help=f'output directory (defaults to {{srcdir}}{os.sep}dist).  Cannot be used together with ``--metadata``',
        metavar='PATH',
    )
    build_group.add_argument(
        '--sdist',
        '-s',
        dest='distributions',
        action='append_const',
        const='sdist',
        help='build a source distribution (disables the default behavior)',
    )
    build_group.add_argument(
        '--wheel',
        '-w',
        dest='distributions',
        action='append_const',
        const='wheel',
        help='build a wheel (disables the default behavior)',
    )
    build_group.add_argument(
        '--metadata',
        action='store_true',
        help="print out a wheel's metadata in JSON format. Cannot be used in conjunction with ``--sdist`` or ``--wheel``",
    )
    config_exclusive_group = build_group.add_mutually_exclusive_group()
    config_exclusive_group.add_argument(
        '--config-setting',
        '-C',
        dest='config_settings',
        action='append',
        help='settings to pass to the backend.  Multiple settings can be provided. '
        'Settings beginning with a hyphen will erroneously be interpreted as options to build if separated '
        'by a space; use ``--config-setting=--my-setting -C--my-other-setting`` instead',
        metavar='KEY[=VALUE]',
    )
    config_exclusive_group.add_argument(
        '--config-json',
        dest='config_json',
        help='settings to pass to the backend as a JSON object. '
        'This is an alternative to ``--config-setting`` that allows complex nested structures. '
        'Cannot be used together with ``--config-setting``',
        metavar='JSON_STRING',
    )

    install_group = parser.add_argument_group('installation options')
    env_exclusive_group = install_group.add_mutually_exclusive_group()
    env_exclusive_group.add_argument(
        '--installer',
        choices=_env.INSTALLERS,
        help='Python package installer to use (defaults to pip)',
    )
    env_exclusive_group.add_argument(
        '--no-isolation',
        '-n',
        action='store_true',
        help='disable building the project in an isolated virtual environment. '
        'Build dependencies must be installed separately when this option is used',
    )
    install_group.add_argument(
        '--skip-dependency-check',
        '-x',
        action='store_true',
        help='do not check that build dependencies are installed',
    )

    return parser


def _parse_config_settings(raw_config_settings: list[str]) -> dict[str, Any]:
    config_settings = dict[str, Any]()

    for arg in raw_config_settings:
        setting, _, value = arg.partition('=')
        if setting not in config_settings:
            config_settings[setting] = value
        else:
            if not isinstance(config_settings[setting], list):
                config_settings[setting] = [config_settings[setting]]

            config_settings[setting].append(value)

    return config_settings


def main(cli_args: Sequence[str], prog: str | None = None) -> None:
    """
    Parse the CLI arguments and invoke the build process.

    :param cli_args: CLI arguments
    :param prog: Program name to show in help text
    """
    parser = main_parser()
    if prog:
        parser.prog = prog
    args = parser.parse_args(cli_args)

    _setup_cli(verbosity=args.verbosity)

    config_settings = dict[str, Any]()

    # Handle --config-json
    if args.config_json:
        try:
            config_settings = json.loads(args.config_json)
            if not isinstance(config_settings, dict):
                _error('--config-json must contain a JSON object (dict), not a list or primitive value')
        except json.JSONDecodeError as e:
            _error(f'Invalid JSON in --config-json: {e}')

    # Handle --config-setting (original logic)
    elif args.config_settings:
        config_settings = _parse_config_settings(args.config_settings)

    # outdir is relative to srcdir only if omitted.
    outdir = os.path.join(args.srcdir, 'dist') if args.outdir is None else args.outdir

    if args.metadata and args.distributions:
        parser.error('--metadata: not allowed with --sdist or --wheel')
    elif args.metadata:
        build = partial(_build_metadata, distributions=['wheel'])
    elif args.distributions:
        build = partial(build_package, distributions=args.distributions)
    else:
        build = partial(build_package_via_sdist, distributions=['wheel'])

    with _handle_build_error():
        built = build(
            args.srcdir,
            outdir,
            config_settings=config_settings,
            isolation=not args.no_isolation,
            skip_dependency_check=args.skip_dependency_check,
            installer=args.installer,
        )
        if _ctx.verbosity >= -1 and built:
            artifact_list = _natural_language_list(
                ['{underline}{}{reset}{bold}{green}'.format(artifact, **_styles.get()) for artifact in built]
            )
            _cprint('{bold}{green}Successfully built {}{reset}', artifact_list)


def entrypoint() -> None:
    main(sys.argv[1:])


if __name__ == '__main__':  # pragma: no cover
    main(sys.argv[1:], 'python -m build')


__all__ = [
    'main',
    'main_parser',
]
