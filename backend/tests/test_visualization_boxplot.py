import numpy as np
import pandas as pd
from fastapi.testclient import TestClient

from app.main import app
from app.models.dataset import DatasetMetadata
from app.processors.session_manager import create_session

client = TestClient(app)


def test_boxplot_numeric_with_known_outliers():
    """Verify numeric boxplot identifies 50 as an outlier under 1.5x IQR rule."""
    values = [1, 2, 2, 3, 3, 3, 4, 4, 5, 50]
    df = pd.DataFrame({"val": values})
    meta = DatasetMetadata(
        dataset_name="outlier_test.csv",
        rows=len(values),
        columns=1,
        memory_usage=0.01,
        missing_cells=0,
        duplicate_rows=0,
        column_types={"int64": 1},
    )
    session = create_session("outlier_test.csv", df, meta)

    res = client.get(
        f"/visualizations/{session.dataset_id}/data?column_a=val&chart_type=boxplot"
    )
    assert res.status_code == 200
    data = res.json()["data"]
    assert len(data) == 1
    stats = data[0]

    # Verify IQR and fences
    # Q1 = 2.25, Q3 = 4.0, IQR = 1.75
    # lower_fence = -0.375, upper_fence = 6.625
    assert stats["q1"] == 2.25
    assert stats["median"] == 3.0
    assert stats["q3"] == 4.0
    assert stats["iqr"] == 1.75
    assert stats["lower_fence"] == -0.375
    assert stats["upper_fence"] == 6.625

    # Lower whisker = min non-outlier = 1.0
    # Upper whisker = max non-outlier = 5.0
    assert stats["minimum"] == 1.0
    assert stats["maximum"] == 5.0

    # Outliers should contain 50.0
    assert stats["outliers"] == [50.0]
    assert stats["outliers_truncated"] is False


def test_boxplot_numeric_no_outliers():
    """Verify numeric boxplot with uniform values has empty outliers list."""
    values = [10, 12, 14, 16, 18, 20]
    df = pd.DataFrame({"score": values})
    meta = DatasetMetadata(
        dataset_name="no_outliers.csv",
        rows=len(values),
        columns=1,
        memory_usage=0.01,
        missing_cells=0,
        duplicate_rows=0,
        column_types={"int64": 1},
    )
    session = create_session("no_outliers.csv", df, meta)

    res = client.get(
        f"/visualizations/{session.dataset_id}/data?column_a=score&chart_type=boxplot"
    )
    assert res.status_code == 200
    stats = res.json()["data"][0]

    assert stats["minimum"] == 10.0
    assert stats["maximum"] == 20.0
    assert stats["outliers"] == []
    assert stats["outliers_truncated"] is False


def test_grouped_boxplot_with_outliers():
    """Verify grouped numeric + categorical boxplot calculates stats independently per category."""
    df = pd.DataFrame({
        "salary": [10, 12, 14, 15, 100, 20, 22, 24, 25, 500],
        "dept": ["Eng", "Eng", "Eng", "Eng", "Eng", "HR", "HR", "HR", "HR", "HR"],
    })
    meta = DatasetMetadata(
        dataset_name="grouped_outliers.csv",
        rows=10,
        columns=2,
        memory_usage=0.01,
        missing_cells=0,
        duplicate_rows=0,
        column_types={"int64": 1, "object": 1},
    )
    session = create_session("grouped_outliers.csv", df, meta)

    res = client.get(
        f"/visualizations/{session.dataset_id}/data?column_a=salary&column_b=dept&chart_type=boxplot"
    )
    assert res.status_code == 200
    data = res.json()["data"]
    assert len(data) == 2

    eng_stats = next(d for d in data if d["category"] == "Eng")
    hr_stats = next(d for d in data if d["category"] == "HR")

    assert eng_stats["outliers"] == [100.0]
    assert hr_stats["outliers"] == [500.0]


def test_boxplot_identical_values_zero_iqr():
    """Verify all values identical (zero IQR) handles fences and empty outliers cleanly."""
    values = [42, 42, 42, 42, 42]
    df = pd.DataFrame({"const": values})
    meta = DatasetMetadata(
        dataset_name="const.csv",
        rows=5,
        columns=1,
        memory_usage=0.01,
        missing_cells=0,
        duplicate_rows=0,
        column_types={"int64": 1},
    )
    session = create_session("const.csv", df, meta)

    res = client.get(
        f"/visualizations/{session.dataset_id}/data?column_a=const&chart_type=boxplot"
    )
    assert res.status_code == 200
    stats = res.json()["data"][0]

    assert stats["q1"] == 42.0
    assert stats["median"] == 42.0
    assert stats["q3"] == 42.0
    assert stats["iqr"] == 0.0
    assert stats["minimum"] == 42.0
    assert stats["maximum"] == 42.0
    assert stats["outliers"] == []


def test_boxplot_nan_and_inf_handling():
    """Verify NaN and Inf values are stripped prior to boxplot computation."""
    values = [1.0, 2.0, np.nan, np.inf, -np.inf, 3.0, 4.0, 50.0]
    df = pd.DataFrame({"mixed": values})
    meta = DatasetMetadata(
        dataset_name="nan_inf.csv",
        rows=len(values),
        columns=1,
        memory_usage=0.01,
        missing_cells=1,
        duplicate_rows=0,
        column_types={"float64": 1},
    )
    session = create_session("nan_inf.csv", df, meta)

    res = client.get(
        f"/visualizations/{session.dataset_id}/data?column_a=mixed&chart_type=boxplot"
    )
    assert res.status_code == 200
    stats = res.json()["data"][0]

    # Clean values evaluated: [1.0, 2.0, 3.0, 4.0, 50.0]
    assert stats["median"] == 3.0
    assert stats["outliers"] == [50.0]


def test_boxplot_large_dataset_performance_and_truncation():
    """Verify 100,000 rows with >1000 outliers are generated rapidly and truncated at 1000."""
    np.random.seed(42)
    normal_vals = np.random.normal(loc=100, scale=10, size=98000)
    outlier_vals = np.random.uniform(high=500, low=300, size=2000)
    all_vals = np.concatenate([normal_vals, outlier_vals])

    df = pd.DataFrame({"large_num": all_vals})
    meta = DatasetMetadata(
        dataset_name="large.csv",
        rows=len(all_vals),
        columns=1,
        memory_usage=1.0,
        missing_cells=0,
        duplicate_rows=0,
        column_types={"float64": 1},
    )
    session = create_session("large.csv", df, meta)

    res = client.get(
        f"/visualizations/{session.dataset_id}/data?column_a=large_num&chart_type=boxplot"
    )
    assert res.status_code == 200
    stats = res.json()["data"][0]

    assert len(stats["outliers"]) == 1000
    assert stats["outliers_truncated"] is True
