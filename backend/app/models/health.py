from typing import Literal

from pydantic import BaseModel, Field


class HealthAlert(BaseModel):
    """
    Represents a dataset quality issue detected during analysis.
    """

    severity: Literal["info", "warning", "critical"] = Field(
        ...,
        description="Severity level of the detected issue."
    )

    title: str = Field(
        ...,
        min_length=1,
        description="Short title describing the issue."
    )

    message: str = Field(
        ...,
        min_length=1,
        description="Detailed explanation of the issue."
    )


class Recommendation(BaseModel):
    """
    Represents a recommended action for improving dataset quality.
    """

    priority: Literal["low", "medium", "high"] = Field(
        ...,
        description="Priority level of the recommendation."
    )

    title: str = Field(
        ...,
        min_length=1,
        description="Short recommendation title."
    )

    action: str = Field(
        ...,
        min_length=1,
        description="Recommended action for the user."
    )


class IssueSummary(BaseModel):
    """
    Stores a summary of detected dataset quality issues.
    """

    missing_cells: int = Field(
        ...,
        ge=0,
        description="Total number of missing cells."
    )

    duplicate_rows: int = Field(
        ...,
        ge=0,
        description="Total number of duplicate rows."
    )

    empty_columns: int = Field(
        ...,
        ge=0,
        description="Number of completely empty columns."
    )

    constant_columns: int = Field(
        ...,
        ge=0,
        description="Number of columns containing only one unique value."
    )


class HealthResponse(BaseModel):
    """
    Complete dataset health report.
    """

    health_score: float = Field(
        ...,
        ge=0,
        le=100,
        description="Overall dataset health score."
    )

    quality: Literal["excellent", "good", "fair", "poor"] = Field(
        ...,
        description="Overall dataset quality classification."
    )

    issues: IssueSummary = Field(
        ...,
        description="Summary of detected dataset quality issues."
    )

    alerts: list[HealthAlert] = Field(
        default_factory=list,
        description="Detected dataset quality alerts."
    )

    recommendations: list[Recommendation] = Field(
        default_factory=list,
        description="Recommended actions for improving data quality."
    )