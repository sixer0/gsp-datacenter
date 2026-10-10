#!/bin/bash
# GSP Bridge HQ launcher (Windows) — baca env dari ../.env lalu jalankan bridge.mjs.
# Hanya mengekspor variabel yang dibutuhkan bridge; aman untuk dipanggil berulang.
cd /c/Users/TRIAL/gsp-datacenter/hermes-bridge || exit 1

export DATABASE_URL="$(grep '^DATABASE_URL=' ../.env | head -1 | cut -d= -f2- | tr -d '"')"
export HERMES_BOARD="$(grep '^HERMES_BOARD=' ../.env | head -1 | cut -d= -f2- | tr -d '"')"
export HERMES_BIN="$(grep '^HERMES_BIN=' ../.env | head -1 | cut -d= -f2- | tr -d '"')"
export HERMES_WIKI="$(grep '^HERMES_WIKI=' ../.env | head -1 | cut -d= -f2- | tr -d '"')"
export BRIEF_HOUR="$(grep '^BRIEF_HOUR=' ../.env | head -1 | cut -d= -f2- | tr -d '"')"
export BRIDGE_RUN_TIMEOUT_MS=3600000
# Kredensial kilocode dibaca dari Hermes home .env — WAJIB agar dispatch ber-profil
# (hermes -p gsp-* -z) tidak gagal 'No usable credentials for provider kilocode'.
export KILOCODE_API_KEY="$(grep '^KILOCODE_API_KEY=' 'C:/Users/TRIAL/AppData/Local/hermes/.env' | head -1 | cut -d= -f2- | tr -d '"')"

if [ -z "$DATABASE_URL" ]; then
  echo "FATAL: DATABASE_URL kosong" >&2
  exit 1
fi

exec node bridge.mjs >> bridge.out.log 2>> bridge.err.log
