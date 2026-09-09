#!/bin/sh
# Bootstrap stub served at https://konfidence.cloud/install.sh
#
# It fetches and runs the real installer from the konfidence repo's main branch,
# so this file never needs to change: installer logic lives in one place
# (konfidence/hack/install.sh) and the install target is chosen at runtime via
# KDEN_VERSION / KDEN_GIT_REF (passed straight through the pipe).
#
#   curl -fsSL https://konfidence.cloud/install.sh | sh
exec sh -c "$(curl -fsSL https://raw.githubusercontent.com/konfidence-project/konfidence/main/hack/install.sh)"
