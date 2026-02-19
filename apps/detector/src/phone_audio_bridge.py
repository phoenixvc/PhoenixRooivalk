#!/usr/bin/env python3
"""
Phone Audio Bridge — WiFi-to-Audio PWM relay.

Serves a web page that generates servo PWM signals through the phone's
headphone jack using the Web Audio API. No app installation needed —
just open the URL in the phone's browser.

Architecture:
    Laptop (this script) <--WebSocket--> Phone browser (Web Audio API)
    Phone headphone jack --> transistor circuit --> servos

The laptop sends yaw/pitch commands over WebSocket.
The phone's browser generates 50Hz PWM waveforms as audio output.
Left channel = yaw, right channel = pitch.

Usage:
    python phone_audio_bridge.py [--port 8765] [--host 0.0.0.0]

Then open the printed URL on the phone's browser and tap "Start Audio".

Can also receive UDP commands from the turret controller:
    transport_type: wifi_udp
    wifi_host: "<this machine's IP>"
    wifi_port: 8765

NOTE: This module controls pan/tilt positioning only.
      It does NOT control any firing or engagement mechanism.
"""

import argparse
import asyncio
import base64
import hashlib
import ipaddress
import json
import logging
import socket
import struct
import threading

logger = logging.getLogger("drone_detector.phone_bridge")

# Current servo positions shared between UDP receiver and WebSocket
_yaw: float = 0.0
_pitch: float = 0.0
_lock = threading.Lock()

# Connected WebSocket clients
_ws_clients: set = set()

# The HTML page served to the phone's browser
BRIDGE_HTML = """<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
<title>Servo PWM Bridge</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    background: #1a1a2e; color: #eee;
    display: flex; flex-direction: column; align-items: center;
    min-height: 100vh; padding: 20px;
  }
  h1 { font-size: 1.4em; margin-bottom: 10px; color: #e94560; }
  .status { font-size: 0.9em; color: #888; margin-bottom: 20px; }
  .status.connected { color: #4ecca3; }
  .status.error { color: #e94560; }
  #startBtn {
    font-size: 1.2em; padding: 15px 40px; border: none; border-radius: 8px;
    background: #e94560; color: white; cursor: pointer; margin: 20px 0;
  }
  #startBtn:disabled { background: #555; cursor: default; }
  #startBtn.active { background: #4ecca3; }
  .meters { width: 100%; max-width: 400px; }
  .meter { margin: 15px 0; }
  .meter label { display: block; font-size: 0.85em; color: #888; margin-bottom: 4px; }
  .meter .bar-bg {
    height: 30px; background: #16213e; border-radius: 4px;
    position: relative; overflow: hidden;
  }
  .meter .bar-fg {
    height: 100%; background: #e94560; border-radius: 4px;
    transition: width 0.05s linear;
    position: absolute; left: 0; top: 0;
  }
  .meter .center-line {
    position: absolute; left: 50%; top: 0; width: 2px; height: 100%;
    background: #4ecca3; z-index: 2;
  }
  .meter .value {
    position: absolute; right: 8px; top: 50%; transform: translateY(-50%);
    font-size: 0.8em; z-index: 3; color: #eee;
  }
  .info { font-size: 0.75em; color: #555; margin-top: 30px; text-align: center; line-height: 1.6; }
</style>
</head>
<body>
<h1>Servo PWM Bridge</h1>
<div id="statusText" class="status">Connecting...</div>

<button id="startBtn" onclick="startAudio()">Start Audio</button>

<div class="meters">
  <div class="meter">
    <label>YAW (Left channel) — <span id="yawPulse">1500</span>μs</label>
    <div class="bar-bg">
      <div class="center-line"></div>
      <div id="yawBar" class="bar-fg" style="width:50%"></div>
      <div id="yawVal" class="value">0.00</div>
    </div>
  </div>
  <div class="meter">
    <label>PITCH (Right channel) — <span id="pitchPulse">1500</span>μs</label>
    <div class="bar-bg">
      <div class="center-line"></div>
      <div id="pitchBar" class="bar-fg" style="width:50%"></div>
      <div id="pitchVal" class="value">0.00</div>
    </div>
  </div>
</div>

<div class="info">
  Plug headphones/cable into this phone.<br>
  Left channel = Yaw servo, Right channel = Pitch servo.<br>
  Keep this tab active and screen on.
</div>

<script>
// Servo PWM constants
const SERVO_FREQ = 50;           // 50Hz
const SAMPLE_RATE = 48000;
const SAMPLES_PER_PERIOD = SAMPLE_RATE / SERVO_FREQ; // 960
const MIN_PULSE_US = 1000;
const MAX_PULSE_US = 2000;
const MIN_PULSE_SAMPLES = Math.round(SAMPLE_RATE * MIN_PULSE_US / 1e6); // 48
const MAX_PULSE_SAMPLES = Math.round(SAMPLE_RATE * MAX_PULSE_US / 1e6); // 96

let audioCtx = null;
let wsConn = null;
let yaw = 0.0, pitch = 0.0;
let audioRunning = false;

function rateToPulseSamples(rate) {
  const norm = (rate + 1.0) / 2.0; // 0..1
  return Math.round(MIN_PULSE_SAMPLES + norm * (MAX_PULSE_SAMPLES - MIN_PULSE_SAMPLES));
}

function updateDisplay() {
  const yawPct = ((yaw + 1) / 2) * 100;
  const pitchPct = ((pitch + 1) / 2) * 100;
  document.getElementById('yawBar').style.width = yawPct + '%';
  document.getElementById('pitchBar').style.width = pitchPct + '%';
  document.getElementById('yawVal').textContent = yaw.toFixed(2);
  document.getElementById('pitchVal').textContent = pitch.toFixed(2);
  document.getElementById('yawPulse').textContent = Math.round(1500 + yaw * 500);
  document.getElementById('pitchPulse').textContent = Math.round(1500 + pitch * 500);
}

// AudioWorklet processor code (inline, registered as a blob URL)
const WORKLET_CODE = `
class PwmProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.phase = 0;
    this.yawPulse = 72;
    this.pitchPulse = 72;
    this.port.onmessage = (e) => {
      this.yawPulse = e.data.yawPulse;
      this.pitchPulse = e.data.pitchPulse;
    };
  }
  static get parameterDescriptors() { return []; }
  process(inputs, outputs) {
    const out = outputs[0];
    const outL = out[0], outR = out[1];
    const spp = ${SAMPLES_PER_PERIOD};
    for (let i = 0; i < outL.length; i++) {
      const p = (this.phase + i) % spp;
      outL[i] = p < this.yawPulse ? -1.0 : 1.0;
      outR[i] = p < this.pitchPulse ? -1.0 : 1.0;
    }
    this.phase = (this.phase + outL.length) % spp;
    return true;
  }
}
registerProcessor('pwm-processor', PwmProcessor);
`;

let workletNode = null;

async function startAudio() {
  if (audioRunning) return;
  const btn = document.getElementById('startBtn');

  audioCtx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: SAMPLE_RATE });

  // Prefer AudioWorklet (modern API), fall back to ScriptProcessor (deprecated but universal)
  if (audioCtx.audioWorklet) {
    try {
      const blob = new Blob([WORKLET_CODE], { type: 'application/javascript' });
      const url = URL.createObjectURL(blob);
      await audioCtx.audioWorklet.addModule(url);
      URL.revokeObjectURL(url);
      workletNode = new AudioWorkletNode(audioCtx, 'pwm-processor', { outputChannelCount: [2] });
      workletNode.connect(audioCtx.destination);
      console.log('Using AudioWorklet');
    } catch(e) {
      console.warn('AudioWorklet failed, falling back to ScriptProcessor:', e);
      _startScriptProcessor();
    }
  } else {
    _startScriptProcessor();
  }

  audioRunning = true;
  btn.textContent = 'Audio Active';
  btn.classList.add('active');
  btn.disabled = true;
}

function _startScriptProcessor() {
  // Fallback: ScriptProcessor (deprecated but still works everywhere)
  const bufSize = 1024;
  const processor = audioCtx.createScriptProcessor(bufSize, 0, 2);
  let phase = 0;

  processor.onaudioprocess = function(e) {
    const outL = e.outputBuffer.getChannelData(0);
    const outR = e.outputBuffer.getChannelData(1);
    const yawPulse = rateToPulseSamples(yaw);
    const pitchPulse = rateToPulseSamples(pitch);

    for (let i = 0; i < bufSize; i++) {
      const posInPeriod = (phase + i) % SAMPLES_PER_PERIOD;
      outL[i] = posInPeriod < yawPulse ? -1.0 : 1.0;
      outR[i] = posInPeriod < pitchPulse ? -1.0 : 1.0;
    }
    phase = (phase + bufSize) % SAMPLES_PER_PERIOD;
  };

  processor.connect(audioCtx.destination);
  console.log('Using ScriptProcessor (fallback)');
}

function connectWS() {
  const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
  const url = proto + '//' + location.host + '/ws';
  wsConn = new WebSocket(url);

  wsConn.onopen = function() {
    document.getElementById('statusText').textContent = 'Connected';
    document.getElementById('statusText').className = 'status connected';
  };

  wsConn.onmessage = function(evt) {
    try {
      if (typeof evt.data !== 'string') return;
      const data = JSON.parse(evt.data);
      if (data.yaw_rate !== undefined) yaw = Math.max(-1, Math.min(1, data.yaw_rate));
      if (data.pitch_rate !== undefined) pitch = Math.max(-1, Math.min(1, data.pitch_rate));
      updateDisplay();
      // Update AudioWorklet node if active
      if (workletNode) {
        workletNode.port.postMessage({
          yawPulse: rateToPulseSamples(yaw),
          pitchPulse: rateToPulseSamples(pitch),
        });
      }
    } catch(e) {
      console.warn('WS message error:', e, evt.data);
    }
  };

  wsConn.onclose = function() {
    document.getElementById('statusText').textContent = 'Disconnected — reconnecting...';
    document.getElementById('statusText').className = 'status error';
    setTimeout(connectWS, 2000);
  };

  wsConn.onerror = function() {
    wsConn.close();
  };
}

connectWS();
updateDisplay();
</script>
</body>
</html>"""


def get_local_ip() -> str:
    """
    Get this machine's local IP address.

    Tries multiple methods to work on air-gapped networks
    (e.g., laptop hotspot with no internet).
    """
    # Method 1: Connect to external host (works when internet available)
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
            s.settimeout(0.5)
            s.connect(("8.8.8.8", 80))
            ip = s.getsockname()[0]
            if ip and ip != "0.0.0.0":  # nosec B104 — comparison, not bind
                return ip
    except Exception:
        pass

    # Method 2: Scan local interfaces (works on hotspot / no internet)
    try:
        import subprocess
        result = subprocess.run(
            ["hostname", "-I"],
            capture_output=True, text=True, timeout=2,
        )
        if result.returncode == 0:
            ips = result.stdout.strip().split()
            for ip in ips:
                try:
                    if ipaddress.ip_address(ip).is_private and ip != "127.0.0.1":
                        return ip
                except ValueError:
                    continue
            if ips:
                return ips[0]
    except Exception:
        pass

    # Method 3: Use socket.getaddrinfo on hostname
    try:
        hostname = socket.gethostname()
        for info in socket.getaddrinfo(hostname, None, socket.AF_INET):
            ip = info[4][0]
            if ip != "127.0.0.1":
                return ip
    except Exception:
        pass

    return "127.0.0.1"


MAX_HEADER_BYTES = 16384  # 16 KiB — reject oversized/malformed requests


async def websocket_handler(reader, writer):
    """Handle a WebSocket connection from a phone browser."""
    # Read the HTTP upgrade request (bounded to prevent resource exhaustion)
    request = b""
    while True:
        line = await reader.readline()
        if not line:
            # EOF — client disconnected mid-headers
            writer.close()
            await writer.wait_closed()
            return
        request += line
        if line == b"\r\n":
            break
        if len(request) > MAX_HEADER_BYTES:
            logger.warning("Rejecting request: headers exceed %d bytes", MAX_HEADER_BYTES)
            writer.write(b"HTTP/1.1 400 Bad Request\r\nContent-Length: 0\r\n\r\n")
            await writer.drain()
            writer.close()
            await writer.wait_closed()
            return

    # Extract WebSocket key
    ws_key = None
    for line in request.decode("utf-8", errors="ignore").split("\r\n"):
        if line.lower().startswith("sec-websocket-key:"):
            ws_key = line.split(":", 1)[1].strip()

    if ws_key is None:
        # Not a WebSocket upgrade — serve the HTML page
        if b"GET / " in request or b"GET /index.html" in request:
            body = BRIDGE_HTML.encode("utf-8")
            response = (
                f"HTTP/1.1 200 OK\r\n"
                f"Content-Type: text/html; charset=utf-8\r\n"
                f"Content-Length: {len(body)}\r\n"
                f"Connection: close\r\n"
                f"\r\n"
            ).encode() + body
        else:
            response = b"HTTP/1.1 404 Not Found\r\nContent-Length: 0\r\n\r\n"
        writer.write(response)
        await writer.drain()
        writer.close()
        await writer.wait_closed()
        return

    # Complete WebSocket handshake
    accept = base64.b64encode(
        hashlib.sha1(  # noqa: S324  # nosec B324 — required by RFC 6455
            (ws_key + "258EAFA5-E914-47DA-95CA-5AB9E3F14388").encode()
        ).digest()
    ).decode()
    handshake = (
        f"HTTP/1.1 101 Switching Protocols\r\n"
        f"Upgrade: websocket\r\n"
        f"Connection: Upgrade\r\n"
        f"Sec-WebSocket-Accept: {accept}\r\n"
        f"\r\n"
    )
    writer.write(handshake.encode())
    await writer.drain()

    client_id = id(writer)
    _ws_clients.add(writer)
    logger.info(f"Phone connected (WebSocket client {client_id})")

    try:
        while True:
            # Detect client disconnection before attempting to write.
            # at_eof() is set by the transport when the TCP connection closes.
            if reader.at_eof():
                break

            # Send current position as JSON
            with _lock:
                data = json.dumps({"yaw_rate": _yaw, "pitch_rate": _pitch})

            payload = data.encode("utf-8")
            # WebSocket frame: text, unmasked
            if len(payload) < 126:
                frame = bytes([0x81, len(payload)]) + payload
            else:
                frame = bytes([0x81, 126]) + struct.pack(">H", len(payload)) + payload

            writer.write(frame)
            await writer.drain()
            await asyncio.sleep(0.033)  # ~30Hz update rate
    except (ConnectionError, asyncio.CancelledError):
        pass
    finally:
        _ws_clients.discard(writer)
        writer.close()
        await writer.wait_closed()
        logger.info(f"Phone disconnected (client {client_id})")


def udp_listener(port: int):
    """
    Listen for UDP commands from the turret controller.

    Expected JSON format: {"yaw_rate": 0.5, "pitch_rate": -0.3, ...}
    This is the same format sent by WifiUdpTransport.
    """
    global _yaw, _pitch

    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    sock.bind(("0.0.0.0", port))  # nosec B104 — intentional for LAN
    sock.settimeout(1.0)

    logger.info(f"UDP listener on port {port}")

    while True:
        try:
            data, addr = sock.recvfrom(1024)
            cmd = json.loads(data.decode("utf-8"))
            with _lock:
                _yaw = max(-1.0, min(1.0, cmd.get("yaw_rate", 0.0)))
                _pitch = max(-1.0, min(1.0, cmd.get("pitch_rate", 0.0)))
        except socket.timeout:
            continue
        except json.JSONDecodeError:
            logger.warning(f"Invalid JSON from {addr}")
        except Exception:
            logger.exception("UDP listener error (continuing)")


def _print_qr_code(url: str) -> None:
    """Print a QR code to the terminal if qrcode is installed."""
    try:
        import qrcode  # type: ignore[import-untyped]

        qr = qrcode.QRCode(border=1)
        qr.add_data(url)
        qr.make(fit=True)
        qr.print_ascii(invert=True)
    except ImportError:
        print("  (Install 'qrcode' for a scannable QR code: pip install qrcode)")


async def run_server(host: str, port: int):
    """Run the WebSocket/HTTP server."""
    server = await asyncio.start_server(websocket_handler, host, port)
    local_ip = get_local_ip()
    url = f"http://{local_ip}:{port}"

    print()
    print("=" * 60)
    print("  PHONE AUDIO PWM BRIDGE")
    print("=" * 60)
    print()
    print("  Open this URL on the phone's browser:")
    print()
    print(f"    {url}")
    print()
    _print_qr_code(url)
    print()
    print("  Then tap 'Start Audio' and plug in the headphone cable.")
    print()
    print(f"  UDP listener on port {port} (for wifi_udp transport)")
    print(f"  WebSocket on ws://{local_ip}:{port}/ws")
    print()
    print("  Press Ctrl+C to stop.")
    print()

    async with server:
        await server.serve_forever()


def main():
    parser = argparse.ArgumentParser(
        description="Phone Audio PWM Bridge — WiFi to servo control via phone browser",
    )
    parser.add_argument(
        "--port",
        type=int,
        default=8765,
        help="Server port for HTTP/WebSocket/UDP (default: 8765)",
    )
    parser.add_argument(
        "--host",
        default="0.0.0.0",  # nosec B104 — intentional for LAN access
        help="Bind address (default: 0.0.0.0 for LAN access)",
    )
    args = parser.parse_args()

    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(name)s %(levelname)s: %(message)s",
    )

    # Start UDP listener in background thread
    udp_thread = threading.Thread(
        target=udp_listener,
        args=(args.port,),
        daemon=True,
    )
    udp_thread.start()

    # Run async WebSocket/HTTP server
    try:
        asyncio.run(run_server(args.host, args.port))
    except KeyboardInterrupt:
        print("\nStopping...")


if __name__ == "__main__":
    main()
