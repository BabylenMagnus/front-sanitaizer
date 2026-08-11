#!/usr/bin/env bash
# Server-side deploy script for sanitaizer-web.
#
# Lives on VDSina at /root/deploy-sanitaizer-web.sh — deploy.py SSHes in and runs it.
# /root/sanitaizer-web is a real git checkout of
# git@github.com:BabylenMagnus/front-sanitaizer.git (converted from a manual
# tar/scp deploy on 2026-08-11 — see project_wiki/wiki/deployment.md).
# This local copy (deploy/deploy-sanitaizer-web.sh) is a reference mirror,
# same pattern as Tanuki's: the server copy is authoritative, verify against
# it (ssh root@89.110.92.49 cat /root/deploy-sanitaizer-web.sh) before
# trusting this one during an incident.
#
# NEXT_PUBLIC_* vars must be exported explicitly before `bun run build` —
# .env-file loading was confirmed NOT to work reliably for this bun/next
# combination on this server (see project_wiki/wiki/deployment.md, incident
# 2026-08-11): `next start` didn't pick up DATABASE_URL from .env at runtime,
# and NEXT_PUBLIC_BETTER_AUTH_URL wasn't inlined into the client bundle at
# build time either. Runtime vars are set directly in the systemd unit
# (Environment=); build-time vars are exported here.
set -euo pipefail

cd /root/sanitaizer-web

git fetch origin
git reset --hard origin/master

export PATH="/root/.bun/bin:$PATH"
bun install

export BASE_URL=https://www.sanitaizer.cheesy-pizza.ru
export NEXT_PUBLIC_BETTER_AUTH_URL=https://www.sanitaizer.cheesy-pizza.ru
bun run build

systemctl restart sanitaizer-web
