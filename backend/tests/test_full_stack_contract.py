"""
Exercises the real HTTP contract for every endpoint the frontend calls,
end to end, using a session seeded directly (bypassing /upload, which
needs a live Supabase project for Storage + Postgres and can't run in
this environment). Everything downstream of upload is tested for real:
Overview -> Health -> Columns -> Relationships -> Visualizations ->
Cleaning recommendations -> preview -> apply -> history -> Export.
"""
import pandas as pd
from fastapi.testclient import TestClient

from app.main import app
from app.models.dataset import DatasetMetadata
from app.processors.session_manager import create_session
from tests.conftest import DEFAULT_TEST_USER_ID as USER_ID

client = TestClient(app)


def _seed_session():
    df = pd.DataFrame(
        {
            "age": [25, 30, 22, 40, None, 30, 25, 100],
            "city": ["NYC", "LA", "NYC", "SF", "LA", "NYC", "NYC", "NYC"],
            "signed_up": pd.to_datetime(
                ["2024-01-01", "2024-02-01", "2024-01-15", "2024-03-01",
                 "2024-01-20", "2024-02-15", "2024-01-05", "2024-04-01"]
            ),
        }
    )
    meta = DatasetMetadata(
        dataset_name="customers.csv",
        rows=len(df),
        columns=len(df.columns),
        memory_usage=0.02,
        missing_cells=int(df.isna().sum().sum()),
        duplicate_rows=int(df.duplicated().sum()),
        column_types={"float64": 1, "object": 1, "datetime64[ns]": 1},
    )
    return create_session("customers.csv", df, meta, user_id=USER_ID)


def test_full_analysis_and_cleaning_contract():
    session = _seed_session()
    ds_id = session.dataset_id

    # Overview
    res = client.get(f"/overview/{ds_id}")
    assert res.status_code == 200
    body = res.json()
    assert body["metadata"]["rows"] == 8
    assert "completeness_percentage" in body
    assert isinstance(body["preview"], list)

    # Health
    res = client.get(f"/health/{ds_id}")
    assert res.status_code == 200
    body = res.json()
    assert 0 <= body["health_score"] <= 100
    assert body["quality"] in {"excellent", "good", "fair", "poor"}

    # Columns
    res = client.get(f"/columns/{ds_id}/diagnosis")
    assert res.status_code == 200
    columns = res.json()
    assert any(c["column_name"] == "age" for c in columns)

    res = client.get(f"/columns/{ds_id}/analysis", params={"column_name": "age"})
    assert res.status_code == 200
    assert res.json()["statistics"] is not None

    # Relationships
    res = client.get(f"/relationships/{ds_id}/analysis", params={"column_a": "age", "column_b": "city"})
    assert res.status_code == 200
    assert res.json()["analysis_type"] == "numeric_categorical"

    # Visualizations
    res = client.get(f"/visualizations/{ds_id}/options", params={"column_a": "age"})
    assert res.status_code == 200
    chart_types = {c["chart_type"] for c in res.json()["available_charts"]}
    assert "histogram" in chart_types

    res = client.get(
        f"/visualizations/{ds_id}/data",
        params={"column_a": "age", "chart_type": "histogram"},
    )
    assert res.status_code == 200
    assert res.json()["data"]

    # Cleaning: recommendations -> preview -> apply -> history
    res = client.get(f"/cleaning/{ds_id}/recommendations")
    assert res.status_code == 200
    recommendations = res.json()["recommendations"]
    assert any(r["column"] == "age" for r in recommendations)

    preview_req = {"operation": "fill_missing_mean", "column_name": "age"}
    res = client.post(f"/cleaning/{ds_id}/preview", json=preview_req)
    assert res.status_code == 200
    assert res.json()["rows_before"] == res.json()["rows_after"] == 8

    res = client.post(f"/cleaning/{ds_id}", json=preview_req)
    assert res.status_code == 200
    assert res.json()["is_modified"] is True

    res = client.get(f"/cleaning/{ds_id}/history")
    assert res.status_code == 200
    assert len(res.json()["history"]) == 1
    assert res.json()["history"][0]["operation"] == "fill_missing_mean"

    # Export (streamed file, not JSON)
    res = client.post(f"/export/{ds_id}", json={"format": "csv"})
    assert res.status_code == 200
    assert res.headers["content-type"].startswith("text/csv")
    assert "attachment" in res.headers["content-disposition"]
    assert b"age" in res.content
