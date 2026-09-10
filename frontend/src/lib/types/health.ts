export type AlertSeverity = 'info' | 'warning' | 'critical';
export type RecommendationPriority = 'low' | 'medium' | 'high';
export type QualityRating = 'excellent' | 'good' | 'fair' | 'poor';

export interface HealthAlert {
  severity: AlertSeverity;
  title: string;
  message: string;
}

export interface Recommendation {
  priority: RecommendationPriority;
  title: string;
  action: string;
}

export interface IssueSummary {
  missing_cells: number;
  duplicate_rows: number;
  empty_columns: number;
  constant_columns: number;
}

export interface HealthResponse {
  health_score: number;
  quality: QualityRating;
  issues: IssueSummary;
  alerts: HealthAlert[];
  recommendations: Recommendation[];
}
