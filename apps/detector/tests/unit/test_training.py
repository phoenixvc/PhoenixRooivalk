"""
Unit tests for training-related utilities.

Tests model validation, dataset configuration, and export detection functions.
"""

import json
import tempfile
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest
import yaml


class TestModelValidation:
    """Tests for model name validation in train.py."""

    def test_yolov5n_corrected_to_yolov8n(self):
        """Old yolov5n.pt should be corrected to yolov8n.pt."""
        # Import the validation function
        import sys
        sys.path.insert(0, str(Path(__file__).parents[2] / 'azure-ml'))

        from train import validate_model, MODEL_CORRECTIONS

        assert MODEL_CORRECTIONS.get('yolov5n.pt') == 'yolov8n.pt'
        result = validate_model('yolov5n.pt')
        assert result == 'yolov8n.pt'

    def test_yolov8n_passes_through(self):
        """Valid yolov8n.pt should pass through unchanged."""
        import sys
        sys.path.insert(0, str(Path(__file__).parents[2] / 'azure-ml'))

        from train import validate_model

        result = validate_model('yolov8n.pt')
        assert result == 'yolov8n.pt'

    def test_supported_models_defined(self):
        """Ensure supported models are properly defined."""
        import sys
        sys.path.insert(0, str(Path(__file__).parents[2] / 'azure-ml'))

        from train import SUPPORTED_MODELS

        assert 'yolov8n.pt' in SUPPORTED_MODELS
        assert 'yolov8s.pt' in SUPPORTED_MODELS
        assert 'yolov5nu.pt' in SUPPORTED_MODELS


class TestDatasetValidation:
    """Tests for dataset YAML validation."""

    def test_valid_dataset_yaml(self, tmp_path):
        """Valid dataset.yaml should pass validation."""
        dataset_yaml = tmp_path / 'dataset.yaml'
        dataset_yaml.write_text("""
path: ./data
train: images/train
val: images/val
nc: 10
names:
  0: drone
  1: bird
""")

        import sys
        sys.path.insert(0, str(Path(__file__).parents[2] / 'azure-ml'))

        from train import validate_dataset

        result = validate_dataset(str(dataset_yaml))
        assert result == dataset_yaml

    def test_missing_required_fields(self, tmp_path):
        """Dataset missing required fields should raise error."""
        dataset_yaml = tmp_path / 'dataset.yaml'
        dataset_yaml.write_text("""
path: ./data
train: images/train
# Missing: val, nc, names
""")

        import sys
        sys.path.insert(0, str(Path(__file__).parents[2] / 'azure-ml'))

        from train import validate_dataset

        with pytest.raises(ValueError, match="missing required fields"):
            validate_dataset(str(dataset_yaml))

    def test_nonexistent_file_raises(self, tmp_path):
        """Nonexistent dataset file should raise FileNotFoundError."""
        import sys
        sys.path.insert(0, str(Path(__file__).parents[2] / 'azure-ml'))

        from train import validate_dataset

        with pytest.raises(FileNotFoundError):
            validate_dataset(str(tmp_path / 'nonexistent.yaml'))


class TestExportDetection:
    """Tests for finding exported model files."""

    def test_find_tflite_int8(self, tmp_path):
        """Should find TFLite INT8 exports."""
        weights_dir = tmp_path / 'weights'
        weights_dir.mkdir()
        (weights_dir / 'best_int8.tflite').write_text('dummy')

        import sys
        sys.path.insert(0, str(Path(__file__).parents[2] / 'azure-ml'))

        from train import find_exported_models

        exports = find_exported_models(weights_dir)
        assert 'tflite_int8' in exports

    def test_find_onnx(self, tmp_path):
        """Should find ONNX exports."""
        weights_dir = tmp_path / 'weights'
        weights_dir.mkdir()
        (weights_dir / 'best.onnx').write_text('dummy')

        import sys
        sys.path.insert(0, str(Path(__file__).parents[2] / 'azure-ml'))

        from train import find_exported_models

        exports = find_exported_models(weights_dir)
        assert 'onnx' in exports

    def test_prefer_int8_over_float16(self, tmp_path):
        """Should prefer INT8 TFLite over float16."""
        weights_dir = tmp_path / 'weights'
        weights_dir.mkdir()
        (weights_dir / 'best_int8.tflite').write_text('dummy')
        (weights_dir / 'best_float16.tflite').write_text('dummy')

        import sys
        sys.path.insert(0, str(Path(__file__).parents[2] / 'azure-ml'))

        from train import find_exported_models

        exports = find_exported_models(weights_dir)
        assert 'tflite_int8' in exports
        # Both should be found
        assert 'tflite_float16' in exports

    def test_empty_directory(self, tmp_path):
        """Empty directory should return empty dict."""
        weights_dir = tmp_path / 'weights'
        weights_dir.mkdir()

        import sys
        sys.path.insert(0, str(Path(__file__).parents[2] / 'azure-ml'))

        from train import find_exported_models

        exports = find_exported_models(weights_dir)
        assert exports == {}


class TestDatasetConfigs:
    """Tests for dataset configuration files."""

    def test_mvp_config_valid(self):
        """MVP dataset config should be valid YAML."""
        config_path = Path(__file__).parents[2] / 'configs' / 'dataset-mvp.yaml'

        with open(config_path) as f:
            config = yaml.safe_load(f)

        assert config['nc'] == 10
        assert len(config['names']) == 10
        assert 'drone' in config['names'].values()
        assert config['alert_classes'] == [0]

    def test_full_config_valid(self):
        """Full dataset config should be valid YAML."""
        config_path = Path(__file__).parents[2] / 'configs' / 'dataset-full.yaml'

        with open(config_path) as f:
            config = yaml.safe_load(f)

        assert config['nc'] == 27
        assert len(config['names']) == 27
        assert 'drone_multirotor' in config['names'].values()
        assert len(config['alert_classes']) == 5

    def test_mvp_to_full_mapping(self):
        """MVP config should have mapping to full taxonomy."""
        config_path = Path(__file__).parents[2] / 'configs' / 'dataset-mvp.yaml'

        with open(config_path) as f:
            config = yaml.safe_load(f)

        assert 'full_taxonomy_mapping' in config
        # drone (0) should map to multiple full classes
        assert len(config['full_taxonomy_mapping'][0]) > 1


class TestDownloadScripts:
    """Tests for dataset download utilities."""

    def test_roboflow_datasets_defined(self):
        """Roboflow datasets should be properly configured."""
        import sys
        sys.path.insert(0, str(Path(__file__).parents[2] / 'scripts'))

        from download_public_datasets import ROBOFLOW_DATASETS

        assert 'drone-detection' in ROBOFLOW_DATASETS
        assert 'workspace' in ROBOFLOW_DATASETS['drone-detection']
        assert 'project' in ROBOFLOW_DATASETS['drone-detection']

    def test_direct_downloads_defined(self):
        """Direct download URLs should be defined."""
        import sys
        sys.path.insert(0, str(Path(__file__).parents[2] / 'scripts'))

        from download_public_datasets import DIRECT_DOWNLOADS

        assert 'coco-annotations-2017' in DIRECT_DOWNLOADS
        assert DIRECT_DOWNLOADS['coco-annotations-2017']['url'].startswith('http')

    def test_class_mappings_defined(self):
        """Class mappings should be defined for all sources."""
        import sys
        sys.path.insert(0, str(Path(__file__).parents[2] / 'scripts'))

        from download_public_datasets import CLASS_MAPPINGS

        assert 'coco' in CLASS_MAPPINGS
        assert 'roboflow' in CLASS_MAPPINGS
        assert CLASS_MAPPINGS['coco']['bird'] == 'bird_small'


class TestValidationScript:
    """Tests for model validation utilities."""

    def test_benchmark_result_dataclass(self):
        """BenchmarkResult should be properly structured."""
        import sys
        sys.path.insert(0, str(Path(__file__).parents[2] / 'scripts'))

        from validate_model import BenchmarkResult

        result = BenchmarkResult(
            format='PyTorch',
            file_size_mb=6.5,
            load_time_ms=100.0,
            inference_time_ms=50.0,
            fps=20.0,
            memory_mb=256.0,
        )

        assert result.format == 'PyTorch'
        assert result.fps == 20.0

    def test_validation_result_dataclass(self):
        """ValidationResult should be properly structured."""
        import sys
        sys.path.insert(0, str(Path(__file__).parents[2] / 'scripts'))

        from validate_model import ValidationResult

        result = ValidationResult(
            model_path='test.pt',
            dataset='data.yaml',
            mAP50=0.85,
            mAP50_95=0.65,
            precision=0.90,
            recall=0.80,
            f1=0.85,
            per_class_ap={'drone': 0.90, 'bird': 0.80},
        )

        assert result.mAP50 == 0.85
        assert 'drone' in result.per_class_ap

    def test_validate_model_files(self, tmp_path):
        """Should detect available model formats."""
        import sys
        sys.path.insert(0, str(Path(__file__).parents[2] / 'scripts'))

        from validate_model import validate_model_files

        # Create mock model files
        (tmp_path / 'drone-detector.pt').write_text('dummy')
        (tmp_path / 'drone-detector.onnx').write_text('dummy')
        (tmp_path / 'drone-detector_int8.tflite').write_text('dummy')

        models = validate_model_files(tmp_path)

        assert 'pytorch' in models
        assert 'onnx' in models
        assert 'tflite' in models
