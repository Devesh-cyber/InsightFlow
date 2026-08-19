export type RelationshipAnalysisType =
  | 'numeric_numeric'
  | 'categorical_categorical'
  | 'numeric_categorical';

export type RelationshipDirection =
  | 'positive'
  | 'negative'
  | 'none';

export interface RelationshipResult {
  column_a: string;
  column_b: string;
  column_a_type: string;
  column_b_type: string;
  analysis_type: RelationshipAnalysisType;
  strength: string | null;
  direction: RelationshipDirection | null;
  correlation: number | null;
  association: number | null;
  sample_size: number;
  result: Record<string, unknown>;
}
