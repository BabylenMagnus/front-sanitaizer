export interface Finding {
  schema: string
  table: string
  column: string
  entity_type: string
  hit_ratio: number
  source: string
  sample_size: number
  identity_linked: boolean
  auto_applied: boolean
  language: string
}

export interface RowCountRow {
  table_name: string
  original_count: number
  transformed_count: number
}

export interface DiversitySnapshot {
  distinct_city: number
  total_addresses: number
}

export interface SampleSet {
  employee: { businessentityid: number; nationalidnumber: string }[]
  identity: {
    businessentityid: number
    firstname: string
    lastname: string
    emailaddress: string
  }[]
  creditcard: { creditcardid: number; cardnumber: string }[]
  address_city: { addressid: number; city: string }[]
  salesorderheader: { salesorderid: number; accountnumber: string }[]
}

export interface PipelineRunData {
  meta: {
    generatedAt: string
    dataset: string
    sourceRepo: string
  }
  report: Finding[]
  rowCounts: RowCountRow[]
  metrics: {
    tablesChecked: number
    rowCountMismatches: number
    fkConstraintsRestored: number
    diversityOriginal: DiversitySnapshot
    diversityTransformed: DiversitySnapshot
  }
  samples: {
    original: SampleSet
    transformed: SampleSet
  }
  logs: {
    detector: string
    generator: string
    dump: string
    restore: string
  }
}
