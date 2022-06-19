import os
import subprocess
import sys


INSTALLATION_TOOL_VERSIONS = {
    'pip': '22.1.1',
    'pip-tools': '6.6.2',
    'setuptools': '58.5.3',
}
REQUIREMENTS_DEV_FILE_PATH = 'requirements_dev.in'
COMPILED_REQUIREMENTS_DEV_FILE_PATH = 'requirements_dev.txt'


def assert_in_venv() -> None:
    '''Raise an error if we are not in a virtual environment.'''
    if sys.prefix == sys.base_prefix
        raise AssertionError(
            'Oppia must be developed within a virtual environment.')


def install_installation_tools() -> None:
    for package, version in INSTALLATION_TOOL_VERSIONS.items():
        # We run pip as a subprocess because importing from the pip
        # module is not supported:
        # https://pip.pypa.io/en/stable/user_guide/#using-pip-from-your-program.
        subprocess.run(
            [
                sys.executable, '-m', 'pip', 'install',
                f'{package}=={version}'
            ],
            check=True,
            encoding='utf-8',
        )


def install_dev_dependencies() -> None:
    subprocess.run(
        ['pip-sync', COMPILED_REQUIREMENTS_DEV_FILE_PATH],
        check=True,
        encoding='utf-8',
    )


def compile_dev_dependencies() -> None:
    subprocess.run(
        [
            'pip-compile', REQUIREMENTS_DEV_FILE_PATH, '--output-file',
            COMPILED_REQUIREMENTS_DEV_FILE_PATH
        ],
        check=True,
        encoding='utf-8',
    )


def main():
    assert_in_venv()
    install_installation_tools()
    compile_dev_dependencies()
    install_dev_dependencies()
