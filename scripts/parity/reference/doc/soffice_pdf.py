# -*- coding: utf-8 -*-
"""DOCX -> PDF through LibreOffice for the S64 reference adapter.

Contract: masterplan/01_specs.md section 8.4 (same command line as the S92 service):
argument array without a shell, a throw-away ``-env:UserInstallation`` profile per
job (the user's default profile is never used, HKCU is never written), a hard
timeout with ``taskkill /PID <pid> /T /F`` tree-kill, and success only when the
exit code is 0 AND the PDF exists, is non-empty and starts with ``%PDF-``.
"""
import os
import shutil
import subprocess
import time
import uuid

DEFAULT_SOFFICE = r"C:\Program Files\LibreOffice\program\soffice.com"
DEFAULT_TIMEOUT_S = 180.0
_STDERR_TAIL = 2048


def soffice_path():
    return os.environ.get("SOFFICE_PATH") or DEFAULT_SOFFICE


def timeout_s():
    raw = os.environ.get("REF_DOC_SOFFICE_TIMEOUT_S")
    try:
        return float(raw) if raw else DEFAULT_TIMEOUT_S
    except ValueError:
        return DEFAULT_TIMEOUT_S


def _file_uri(path):
    return "file:///" + os.path.abspath(path).replace("\\", "/").lstrip("/")


def _tree_kill(pid):
    """Kill soffice.com and its soffice.bin child (pattern bridge.mjs:60-98)."""
    try:
        subprocess.run(["taskkill", "/PID", str(pid), "/T", "/F"],
                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
                       timeout=30, creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0))
    except Exception:  # noqa: BLE001 - kill is best effort, outcome reported by caller
        pass


def convert(docx_path, pdf_path, work_root):
    """Convert ``docx_path`` to ``pdf_path``. Never raises; returns a result dict:
    {ok, errorCode, exe, command, exitCode, timedOut, durationMs, stderrTail, bytes}."""
    exe = soffice_path()
    res = {"ok": False, "errorCode": None, "exe": exe, "command": None,
           "exitCode": None, "timedOut": False, "durationMs": 0,
           "stderrTail": "", "bytes": 0, "timeoutS": timeout_s()}
    if not os.path.isfile(exe):
        res["errorCode"] = "PDF_ENGINE_UNAVAILABLE"
        res["stderrTail"] = "soffice tidak ditemukan: %s (set SOFFICE_PATH)" % exe
        return res
    job = os.path.join(work_root, ".soffice-job-" + uuid.uuid4().hex[:12])
    profile = os.path.join(job, "lo-profile")
    outdir = os.path.join(job, "out")
    indir = os.path.join(job, "in")
    t0 = time.monotonic()
    try:
        os.makedirs(profile)
        os.makedirs(outdir)
        os.makedirs(indir)
        src = os.path.join(indir, os.path.basename(docx_path))
        shutil.copyfile(docx_path, src)
        cmd = [exe, "--headless", "--norestore", "--nologo", "--nodefault", "--nolockcheck",
               "-env:UserInstallation=" + _file_uri(profile),
               "--convert-to", "pdf", "--outdir", outdir, src]
        res["command"] = cmd
        proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                                cwd=job,
                                creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0))
        try:
            _out, err = proc.communicate(timeout=res["timeoutS"])
        except subprocess.TimeoutExpired:
            res["timedOut"] = True
            _tree_kill(proc.pid)
            try:
                proc.kill()
            except Exception:  # noqa: BLE001
                pass
            try:
                _out, err = proc.communicate(timeout=15)
            except Exception:  # noqa: BLE001
                err = b""
        res["exitCode"] = proc.returncode
        res["stderrTail"] = (err or b"")[-_STDERR_TAIL:].decode("utf-8", "replace")
        produced = os.path.join(outdir, os.path.splitext(os.path.basename(src))[0] + ".pdf")
        if res["timedOut"]:
            res["errorCode"] = "RENDER_TIMEOUT"
            return res
        if proc.returncode == 0 and os.path.isfile(produced) and os.path.getsize(produced) > 0:
            with open(produced, "rb") as fh:
                magic = fh.read(5)
            if magic == b"%PDF-":
                shutil.move(produced, pdf_path)
                res["ok"] = True
                res["bytes"] = os.path.getsize(pdf_path)
                return res
        res["errorCode"] = "PDF_CONVERT_FAILED"
        return res
    except Exception as ex:  # noqa: BLE001 - converted to a reported failure
        res["errorCode"] = res["errorCode"] or "PDF_CONVERT_FAILED"
        res["stderrTail"] = (res["stderrTail"] + "\n" + repr(ex))[-_STDERR_TAIL:]
        return res
    finally:
        res["durationMs"] = int((time.monotonic() - t0) * 1000)
        shutil.rmtree(job, ignore_errors=True)
