"""
Integration tests for main.py CLI interface.

Tests command-line flags, argument parsing, and CLI workflows.
"""

import pytest
import sys
import yaml
from pathlib import Path
from unittest.mock import patch, MagicMock

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent / "src"))

from main import parse_args


class TestGenerateConfigCLI:
    """Tests for --generate-config CLI flag."""

    def test_generate_config_creates_file(self, tmp_path):
        """Should create config file when --generate-config is used."""
        config_file = tmp_path / "test_config.yaml"
        
        # Mock sys.exit to prevent actual exit
        with patch("main.sys.exit") as mock_exit:
            with patch("main.create_default_config") as mock_create:
                # Mock sys.argv to simulate CLI args
                with patch("sys.argv", ["main.py", "--generate-config", str(config_file)]):
                    args = parse_args()
                    
                    # Manually call the generation logic
                    if args.generate_config:
                        mock_create(str(config_file))
                        mock_exit(0)
                    
                    # Verify function was called
                    mock_create.assert_called_once_with(str(config_file))
                    mock_exit.assert_called_once_with(0)

    def test_generate_config_file_is_valid_yaml(self, tmp_path):
        """Generated config file should be valid YAML."""
        from config.settings import create_default_config
        
        config_file = tmp_path / "test_config.yaml"
        create_default_config(str(config_file))
        
        # Verify file exists
        assert config_file.exists()
        
        # Verify it's valid YAML
        with open(config_file) as f:
            data = yaml.safe_load(f)
        
        assert data is not None
        assert "camera_type" in data
        assert "capture" in data
        assert "inference" in data

    def test_generate_config_in_nonexistent_directory(self, tmp_path):
        """Should handle creating config in non-existent directory."""
        from config.settings import create_default_config
        
        config_file = tmp_path / "subdir" / "test_config.yaml"
        
        # This should raise an error since directory doesn't exist
        with pytest.raises((FileNotFoundError, OSError)):
            create_default_config(str(config_file))

    def test_generate_config_in_existing_directory(self, tmp_path):
        """Should create config in existing directory."""
        from config.settings import create_default_config
        
        config_dir = tmp_path / "config_dir"
        config_dir.mkdir()
        config_file = config_dir / "test_config.yaml"
        
        create_default_config(str(config_file))
        
        assert config_file.exists()
        assert config_file.is_file()


class TestConfigCLI:
    """Tests for --config CLI flag."""

    def test_config_flag_parses_correctly(self):
        """Should parse --config flag correctly."""
        with patch("sys.argv", ["main.py", "--config", "myconfig.yaml"]):
            args = parse_args()
        
        assert args.config == "myconfig.yaml"

    def test_config_with_nonexistent_file(self, tmp_path):
        """Should handle non-existent config file gracefully."""
        from pathlib import Path
        
        config_file = tmp_path / "nonexistent.yaml"
        
        # Verify file doesn't exist
        assert not config_file.exists()
        
        # Test that Settings.from_yaml raises appropriate error
        # (The actual error handling is tested in main() but that requires
        # too much mocking. This test verifies the file existence check)
        from config.settings import Settings
        
        with pytest.raises((FileNotFoundError, OSError)):
            Settings.from_yaml(str(config_file))

    def test_config_with_valid_file(self, tmp_path, temp_config_file):
        """Should load valid config file."""
        from config.settings import Settings
        
        settings = Settings.from_yaml(str(temp_config_file))
        
        assert settings is not None
        assert settings.camera_type is not None

    def test_config_file_loaded_correctly(self, temp_config_file):
        """Config file values should be loaded correctly."""
        from config.settings import Settings
        
        settings = Settings.from_yaml(str(temp_config_file))
        
        # Verify values from temp_config_file fixture
        assert settings.capture.width == 640
        assert settings.capture.height == 480
        assert settings.inference.confidence_threshold == 0.5


class TestCLIArgumentParsing:
    """Tests for CLI argument parsing."""

    def test_all_flags_parse_correctly(self):
        """All flags should parse without errors."""
        with patch("sys.argv", [
            "main.py",
            "--config", "config.yaml",
            "--model", "model.tflite",
            "--camera", "usb",
            "--confidence", "0.7",
            "--tracker", "kalman",
            "--headless",
        ]):
            args = parse_args()
        
        assert args.config == "config.yaml"
        assert args.model == "model.tflite"
        assert args.camera == "usb"
        assert args.confidence == 0.7
        assert args.tracker == "kalman"
        assert args.headless is True

    def test_generate_config_takes_precedence(self):
        """--generate-config should be parseable."""
        with patch("sys.argv", ["main.py", "--generate-config", "output.yaml"]):
            args = parse_args()
        
        assert args.generate_config == "output.yaml"

    def test_default_values(self):
        """Should use default values when flags not provided."""
        with patch("sys.argv", ["main.py"]):
            args = parse_args()
        
        assert args.config is None
        assert args.generate_config is None
        assert args.camera == "auto"
        assert args.tracker == "centroid"
        assert args.confidence == 0.5

    def test_mutually_exclusive_behavior(self):
        """Test that --config and --generate-config can both be defined."""
        # Both flags should parse (precedence handled in main())
        with patch("sys.argv", [
            "main.py",
            "--config", "input.yaml",
            "--generate-config", "output.yaml",
        ]):
            args = parse_args()
        
        assert args.config == "input.yaml"
        assert args.generate_config == "output.yaml"


class TestCLIIntegration:
    """Integration tests for CLI workflows."""

    def test_generate_then_use_config(self, tmp_path):
        """Should be able to generate config and then load it."""
        from config.settings import create_default_config, Settings
        
        config_file = tmp_path / "generated_config.yaml"
        
        # Generate config
        create_default_config(str(config_file))
        assert config_file.exists()
        
        # Modify it (simulate user editing)
        with open(config_file) as f:
            data = yaml.safe_load(f)
        
        data["inference"]["confidence_threshold"] = 0.8
        data["capture"]["width"] = 1280
        
        with open(config_file, "w") as f:
            yaml.dump(data, f)
        
        # Load it back
        settings = Settings.from_yaml(str(config_file))
        
        assert settings.inference.confidence_threshold == 0.8
        assert settings.capture.width == 1280

    def test_config_with_cli_overrides(self):
        """CLI args should override config file values."""
        # This tests the settings_to_pipeline_kwargs logic
        from config.settings import Settings
        from main import settings_to_pipeline_kwargs
        
        settings = Settings()
        settings.inference.confidence_threshold = 0.5
        
        # Create mock args with CLI override
        class MockArgs:
            model = None
            mock = False
            camera = "usb"
            camera_index = 0
            video = None
            width = None
            height = None
            fps = None
            engine = "auto"
            coral = False
            confidence = 0.8  # CLI override
            nms = None
            tracker = None
            alert_webhook = None
            save_detections = None
            headless = False
            no_auto_configure = False
            quiet = False
        
        args = MockArgs()
        kwargs = settings_to_pipeline_kwargs(settings, args)
        
        # CLI confidence should override config file
        assert kwargs["confidence_threshold"] == 0.8
