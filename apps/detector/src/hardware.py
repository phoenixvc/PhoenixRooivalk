#!/usr/bin/env python3
"""
Hardware detection and auto-configuration.

Detects what's available on the system and recommends optimal settings.
"""

import os
import platform
import subprocess
from pathlib import Path
from typing import Optional, Tuple

from .interfaces import HardwareProfile, AcceleratorType, PipelineConfig


def detect_hardware() -> HardwareProfile:
    """
    Detect available hardware and create a profile.

    Auto-detects:
    - Platform (Pi 4, Pi 5, desktop)
    - RAM
    - Camera type
    - Accelerators (Coral TPU)
    """
    profile = HardwareProfile()

    # Detect platform
    profile.platform = _detect_platform()
    profile.cpu_cores = os.cpu_count() or 4
    profile.ram_mb = _detect_ram_mb()

    # Detect camera
    profile.camera_type = _detect_camera()
    profile.camera_max_fps, profile.camera_max_resolution = _get_camera_capabilities(
        profile.camera_type
    )

    # Detect accelerator
    profile.accelerator = _detect_accelerator()
    profile.accelerator_available = profile.accelerator != AcceleratorType.NONE

    # Calculate recommendations
    _set_recommendations(profile)

    return profile


def _detect_platform() -> str:
    """Detect the platform type."""
    # Check for Raspberry Pi
    try:
        with open('/proc/device-tree/model', 'r') as f:
            model = f.read().lower()

            if 'raspberry pi 5' in model:
                return 'pi5'
            elif 'raspberry pi 4' in model:
                return 'pi4'
            elif 'raspberry pi 3' in model:
                return 'pi3'
            elif 'raspberry pi' in model:
                return 'pi_other'
    except FileNotFoundError:
        pass

    # Check /proc/cpuinfo for Pi
    try:
        with open('/proc/cpuinfo', 'r') as f:
            cpuinfo = f.read().lower()
            if 'raspberry pi' in cpuinfo or 'bcm2711' in cpuinfo:
                return 'pi4'
            elif 'bcm2712' in cpuinfo:
                return 'pi5'
    except FileNotFoundError:
        pass

    # Desktop/laptop fallback
    system = platform.system().lower()
    machine = platform.machine().lower()

    if system == 'linux':
        if 'arm' in machine or 'aarch64' in machine:
            return 'arm_linux'
        return 'x86_linux'
    elif system == 'darwin':
        return 'macos'
    elif system == 'windows':
        return 'windows'

    return 'unknown'


def _detect_ram_mb() -> int:
    """Detect total RAM in MB."""
    try:
        with open('/proc/meminfo', 'r') as f:
            for line in f:
                if line.startswith('MemTotal:'):
                    # Format: "MemTotal:       1929620 kB"
                    kb = int(line.split()[1])
                    return kb // 1024
    except (FileNotFoundError, ValueError, IndexError):
        pass

    # Fallback: try psutil
    try:
        import psutil
        return psutil.virtual_memory().total // (1024 * 1024)
    except ImportError:
        pass

    return 2048  # Default assumption


def _detect_camera() -> str:
    """Detect available camera type."""
    # Check for Pi Camera via libcamera
    try:
        result = subprocess.run(
            ['libcamera-hello', '--list-cameras'],
            capture_output=True,
            text=True,
            timeout=5,
        )
        output = result.stdout.lower() + result.stderr.lower()

        if 'imx708' in output:
            return 'picam_v3'
        elif 'imx219' in output:
            return 'picam_v2'
        elif 'imx477' in output:
            return 'picam_hq'
        elif 'available cameras' in output and '0 :' in output:
            return 'picam_unknown'
    except (subprocess.TimeoutExpired, FileNotFoundError, subprocess.SubprocessError):
        pass

    # Check for Picamera2
    picam = None
    try:
        from picamera2 import Picamera2
        picam = Picamera2()
        camera_info = picam.global_camera_info()

        if camera_info:
            model = camera_info[0].get('Model', '').lower()
            if 'imx708' in model:
                return 'picam_v3'
            elif 'imx219' in model:
                return 'picam_v2'
            return 'picam_unknown'
    except ImportError:
        pass
    except Exception:
        pass
    finally:
        if picam is not None:
            try:
                picam.close()
            except Exception:
                pass

    # Check for USB camera
    try:
        import cv2
        cap = cv2.VideoCapture(0)
        if cap.isOpened():
            cap.release()
            return 'usb'
    except Exception:
        pass

    return 'none'


def _get_camera_capabilities(camera_type: str) -> Tuple[int, Tuple[int, int]]:
    """Get max FPS and resolution for camera type."""
    capabilities = {
        'picam_v3': (120, (4608, 2592)),  # Up to 120fps at lower res
        'picam_v2': (60, (3280, 2464)),   # Up to 60fps at 720p
        'picam_hq': (50, (4056, 3040)),
        'picam_unknown': (30, (1920, 1080)),
        'usb': (30, (1920, 1080)),
        'none': (30, (640, 480)),
    }

    return capabilities.get(camera_type, (30, (640, 480)))


def _detect_accelerator() -> AcceleratorType:
    """Detect available hardware accelerators."""
    # Check for Coral USB
    try:
        # Look for Coral device
        result = subprocess.run(
            ['lsusb'],
            capture_output=True,
            text=True,
            timeout=5,
        )
        if '1a6e:089a' in result.stdout or 'Google Inc.' in result.stdout:
            # Verify with pycoral
            try:
                from pycoral.utils.edgetpu import list_edge_tpus
                tpus = list_edge_tpus()
                if tpus:
                    if 'pci' in str(tpus[0]).lower():
                        return AcceleratorType.CORAL_PCIE
                    return AcceleratorType.CORAL_USB
            except ImportError:
                # pycoral not installed but device present
                return AcceleratorType.CORAL_USB
    except (subprocess.TimeoutExpired, FileNotFoundError, subprocess.SubprocessError):
        pass

    # Check for Coral PCIe
    try:
        apex_path = Path('/dev/apex_0')
        if apex_path.exists():
            return AcceleratorType.CORAL_PCIE
    except Exception:
        pass

    return AcceleratorType.NONE


def _set_recommendations(profile: HardwareProfile) -> None:
    """Set recommended settings based on detected hardware."""
    # Base recommendations on platform and RAM
    if profile.platform in ('pi3', 'pi_other'):
        # Very limited - use smallest settings
        profile.recommended_capture_resolution = (320, 240)
        profile.recommended_capture_fps = 15
        profile.recommended_model_input = (192, 192)
        profile.recommended_inference_threads = 2

    elif profile.platform == 'pi4':
        if profile.ram_mb < 3000:  # 2GB or less
            profile.recommended_capture_resolution = (480, 360)
            profile.recommended_capture_fps = 24
            profile.recommended_model_input = (256, 256)
            profile.recommended_inference_threads = 4
        else:  # 4GB or 8GB
            profile.recommended_capture_resolution = (640, 480)
            profile.recommended_capture_fps = 30
            profile.recommended_model_input = (320, 320)
            profile.recommended_inference_threads = 4

    elif profile.platform == 'pi5':
        profile.recommended_capture_resolution = (640, 480)
        profile.recommended_capture_fps = 30
        profile.recommended_model_input = (320, 320)
        profile.recommended_inference_threads = 4

    else:
        # Desktop/laptop - can handle more
        profile.recommended_capture_resolution = (640, 480)
        profile.recommended_capture_fps = 30
        profile.recommended_model_input = (320, 320)
        profile.recommended_inference_threads = min(profile.cpu_cores, 8)

    # Adjust for accelerator
    if profile.accelerator_available:
        # With TPU, can use higher resolution since inference is faster
        profile.recommended_capture_resolution = (640, 480)
        profile.recommended_capture_fps = 30


def create_config_from_hardware(
    profile: Optional[HardwareProfile] = None,
    model_path: str = "",
    headless: bool = False,
    enable_tracking: bool = False,
) -> PipelineConfig:
    """
    Create pipeline configuration based on hardware profile.

    Args:
        profile: Hardware profile (auto-detected if None)
        model_path: Path to model file
        headless: Run without display
        enable_tracking: Enable object tracking

    Returns:
        Configured PipelineConfig
    """
    if profile is None:
        profile = detect_hardware()

    config = PipelineConfig(
        capture_width=profile.recommended_capture_resolution[0],
        capture_height=profile.recommended_capture_resolution[1],
        capture_fps=profile.recommended_capture_fps,
        model_path=model_path,
        model_input_size=profile.recommended_model_input[0],
        inference_threads=profile.recommended_inference_threads,
        use_accelerator=profile.accelerator_available,
        enable_tracking=enable_tracking,
        headless=headless,
    )

    return config


def print_hardware_report(profile: HardwareProfile) -> None:
    """Print a human-readable hardware report."""
    print("=" * 50)
    print("Hardware Detection Report")
    print("=" * 50)
    print(f"Platform:     {profile.platform}")
    print(f"CPU Cores:    {profile.cpu_cores}")
    print(f"RAM:          {profile.ram_mb} MB")
    print(f"Camera:       {profile.camera_type}")
    print(f"  Max FPS:    {profile.camera_max_fps}")
    print(f"  Max Res:    {profile.camera_max_resolution}")
    print(f"Accelerator:  {profile.accelerator.value}")
    print(f"  Available:  {profile.accelerator_available}")
    print("-" * 50)
    print("Recommended Settings:")
    print(f"  Capture:    {profile.recommended_capture_resolution} @ {profile.recommended_capture_fps}fps")
    print(f"  Model Input: {profile.recommended_model_input}")
    print(f"  Threads:    {profile.recommended_inference_threads}")
    print("=" * 50)


if __name__ == '__main__':
    # Run hardware detection when executed directly
    profile = detect_hardware()
    print_hardware_report(profile)
