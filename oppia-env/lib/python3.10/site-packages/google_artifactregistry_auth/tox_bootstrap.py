import logging

import pluggy

from tox import __version__

hookimpl = pluggy.HookimplMarker("tox")

tox_version_major = int(__version__.split(".")[0])
package_name = "keyrings.google-artifactregistry-auth"

if tox_version_major > 3:

    @hookimpl
    def tox_on_install(tox_env):
        req = extract_requirement_from_tox_requires(tox_env)

        if req:
            tox_env.installer.install(
                [req],
                "GoogleArtifactRegistry",
                "keyring_deps",
            )


    def extract_requirement_from_tox_requires(tox_env):
        req = None
        try:
            req = next(
                req for req in tox_env.core["requires"] if req.name == package_name
            )
        except KeyError:
            pass
        except StopIteration:
            pass
        if not req:
            logging.warning(
                "Tox core option 'requires' is missing or does not specify"
                " %s. Package will not be installed in testenv",
                package_name,
            )
        return req

else:

    @hookimpl
    def tox_testenv_install_deps(venv, action):
        venv._install(venv.envconfig.config.requires, action=action)
