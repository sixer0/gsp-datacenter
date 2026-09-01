#!/bin/bash
# Worker-2 sementara untuk kontrak LP (dibunuh setelah misi selesai). Klaim atomik
# SKIP LOCKED (SEC-005) membuat instance kedua aman; log terpisah.
cd /c/Users/TRIAL/gsp-datacenter/hermes-bridge || exit 1
export DATABASE_URL="$(grep '^DATABASE_URL=' ../.env | head -1 | cut -d= -f2- | tr -d '"')"
export HERMES_BOARD="$(grep '^HERMES_BOARD=' ../.env | head -1 | cut -d= -f2- | tr -d '"')"
export HERMES_BIN="$(grep '^HERMES_BIN=' ../.env | head -1 | cut -d= -f2- | tr -d '"')"
export HERMES_WIKI="$(grep '^HERMES_WIKI=' ../.env | head -1 | cut -d= -f2- | tr -d '"')"
export BRIDGE_RUN_TIMEOUT_MS=1800000
export KILOCODE_API_KEY="$(grep '^KILOCODE_API_KEY=' 'C:/Users/TRIAL/AppData/Local/hermes/.env' | head -1 | cut -d= -f2- | tr -d '"')"
exec node bridge.mjs >> bridge2.out.log 2>> bridge2.err.log
