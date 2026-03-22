"""Pure synchronous probe functions for measuring Anthropic API latency."""

import contextlib
import json
import secrets
import socket
import sys
import time
import urllib.error
import urllib.request
from dataclasses import dataclass

from app.core.config import (
    API_HOST,
    MESSAGES_URL,
    STATUS_COMPONENT_IDS,
    STATUS_URL,
    USER_AGENT,
    ssl_context,
)


@dataclass
class NetworkLatency:
    dns_ms: float | None = None
    connect_ms: float | None = None
    ttfb_ms: float | None = None


@dataclass
class StatusResult:
    api_status: str = "unknown"
    has_incident: bool = False


@dataclass
class TtftResult:
    ttft_ms: float | None = None
    error: str | None = None


def measure_network_latency() -> NetworkLatency:
    """DNS + TCP connect + TLS/TTFB to api.anthropic.com (no API key needed)."""
    result = NetworkLatency()

    t0 = time.perf_counter()
    try:
        addr_info = socket.getaddrinfo(API_HOST, 443, socket.AF_INET, socket.SOCK_STREAM)
        result.dns_ms = round((time.perf_counter() - t0) * 1000, 2)
        ip = str(addr_info[0][4][0])
    except OSError as e:
        print(f"  DNS failed: {e}", file=sys.stderr)
        return result

    t1 = time.perf_counter()
    try:
        sock = socket.create_connection((ip, 443), timeout=10)
        result.connect_ms = round((time.perf_counter() - t1) * 1000, 2)
    except OSError as e:
        print(f"  TCP connect failed: {e}", file=sys.stderr)
        return result

    t2 = time.perf_counter()
    try:
        tls_sock = ssl_context.wrap_socket(sock, server_hostname=API_HOST)
        request = f"GET /v1/models HTTP/1.1\r\nHost: {API_HOST}\r\nConnection: close\r\n\r\n"
        tls_sock.sendall(request.encode())
        tls_sock.recv(1024)
        result.ttfb_ms = round((time.perf_counter() - t2) * 1000, 2)
        tls_sock.close()
    except OSError as e:
        print(f"  TTFB probe failed: {e}", file=sys.stderr)
        with contextlib.suppress(Exception):
            sock.close()

    return result


def check_status_page() -> StatusResult:
    """Fetch Anthropic status page. Returns api_status and has_incident."""
    result = StatusResult()
    try:
        req = urllib.request.Request(STATUS_URL, headers={"User-Agent": USER_AGENT})
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read())

        incidents = data.get("incidents", [])
        result.has_incident = bool(incidents)

        for component in data.get("components", []):
            cid = component.get("id", "")
            if cid in STATUS_COMPONENT_IDS:
                status = component.get("status", "unknown")
                if status != "operational":
                    result.api_status = status
                    return result
                result.api_status = "operational"
    except Exception as e:
        print(f"  Status page fetch failed: {e}", file=sys.stderr)
    return result


def measure_ttft(model: str, api_key: str) -> TtftResult:
    """
    Measure time-to-first-token for a model via streaming.
    Uses random seed in prompt to defeat prompt caching.
    """
    seed = secrets.token_hex(8)
    payload = json.dumps(
        {
            "model": model,
            "max_tokens": 1,
            "messages": [{"role": "user", "content": f"Hi [seed={seed}]"}],
            "stream": True,
        }
    ).encode()

    headers = {
        "Content-Type": "application/json",
        "x-api-key": api_key,
        "anthropic-version": "2023-06-01",
        "User-Agent": USER_AGENT,
    }

    req = urllib.request.Request(MESSAGES_URL, data=payload, headers=headers, method="POST")
    t0 = time.perf_counter()

    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            while True:
                line = resp.readline()
                if not line:
                    break
                if line.startswith(b"data:"):
                    text = line[5:].strip()
                    if text and text != b"[DONE]":
                        ttft_ms = round((time.perf_counter() - t0) * 1000, 2)
                        return TtftResult(ttft_ms=ttft_ms)
        return TtftResult(error="no data chunk received")
    except urllib.error.HTTPError as e:
        body = e.read(200).decode(errors="replace")
        return TtftResult(error=f"HTTP {e.code}: {body}")
    except Exception as e:
        return TtftResult(error=str(e))
