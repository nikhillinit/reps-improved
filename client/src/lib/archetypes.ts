/* ============================================================
   REPS — OPNS-430 Archetype Bank (Deterministic, Verified)
   6 core archetypes from the PRD
   ============================================================ */

import type { Archetype } from "./store";
export type { Archetype };

export const ARCHETYPES: Archetype[] = [
  {
    id: "eoq",
    name: "Economic Order Quantity",
    shortName: "EOQ",
    description: "Minimize total ordering + holding cost by finding optimal batch size.",
    verificationStatus: "verified",
    triggers: ["order size", "order quantity", "how many to order", "minimize ordering + holding", "optimal lot size"],
    disqualifiers: ["uncertain demand", "one-shot buy", "perishable", "different objective", "lead time uncertainty"],
    derivedCondition: "Steady demand, known costs, instantaneous replenishment",
    formula: "Q* = √(2SR / H)",
    formulaVars: {
      "Q*": "Optimal order quantity",
      "S": "Fixed ordering cost per order",
      "R": "Annual demand rate",
      "H": "Annual holding cost per unit",
    },
    trapNotes: [
      "H is annual holding cost — do NOT use unit purchase price alone",
      "R must be in the same time units as H (both annual)",
      "EOQ assumes deterministic demand — add safety stock separately if demand is uncertain",
      "Reorder point (ROP) is separate from EOQ: ROP = d̄ × L",
    ],
    workedExample: {
      stem: "A retailer orders widgets at a fixed cost of $50/order. Annual demand is 5,000 units. Annual holding cost is $2/unit. What is the optimal order quantity?",
      solution: "Q* = √(2 × 50 × 5000 / 2) = √(250,000) ≈ 500 units",
      steps: [
        "Identify S = $50, R = 5,000, H = $2",
        "Plug into Q* = √(2SR/H)",
        "Q* = √(2 × 50 × 5000 / 2) = √250,000",
        "Q* ≈ 500 units",
      ],
    },
    practiceStems: [
      {
        id: "eoq_p1",
        text: "Annual demand is 10,000 units. Ordering cost is $100/order. Holding cost is $4/unit/year. What is Q*?",
        answer: "Q* = √(2 × 100 × 10,000 / 4) = √500,000 ≈ 707 units",
        explanation: "Apply Q* = √(2SR/H) directly. S=100, R=10000, H=4.",
        traps: ["Do not confuse H with purchase price", "Ensure R is annual"],
      },
      {
        id: "eoq_p2",
        text: "A firm has S=$200, R=8,000 units/year, H=$5/unit/year. Find Q* and the number of orders per year.",
        answer: "Q* ≈ 800 units; Orders/year = 8000/800 = 10",
        explanation: "Q* = √(2×200×8000/5) = √640,000 ≈ 800. Orders = R/Q*.",
        traps: ["Number of orders = R/Q*, not Q*/R"],
      },
    ],
    rootCauses: [
      { id: "eoq_rc1", label: "Used wrong formula" },
      { id: "eoq_rc2", label: "Misclassified bucket" },
      { id: "eoq_rc3", label: "Confused H with purchase price" },
      { id: "eoq_rc4", label: "Units mismatch (R vs H)" },
    ],
  },
  {
    id: "safety_stock",
    name: "Safety Stock / ROP",
    shortName: "Safety Stock / ROP",
    description: "Buffer against demand and lead-time variability; set reorder point.",
    verificationStatus: "verified",
    triggers: ["safety stock", "reorder point", "ROP", "stockout risk", "service level", "lead time variability"],
    disqualifiers: ["deterministic demand", "no lead time", "EOQ context without uncertainty"],
    derivedCondition: "Variable demand or lead time, service level target given",
    formula: "SS = z × σ_dL   |   ROP = d̄ × L + SS",
    formulaVars: {
      "SS": "Safety stock",
      "z": "z-score for target service level",
      "σ_dL": "Std dev of demand during lead time = σ_d × √L",
      "d̄": "Mean daily demand",
      "L": "Lead time in days",
    },
    trapNotes: [
      "Scale σ_d by √L, NOT by L — a classic exam trap",
      "ROP includes the mean demand term: d̄ × L + SS",
      "z = 1.28 for 90%, 1.65 for 95%, 1.96 for 97.5%, 2.33 for 99%",
      "If lead time is also variable: σ_dL = √(L × σ_d² + d̄² × σ_L²)",
    ],
    workedExample: {
      stem: "Daily demand is normally distributed: mean 50, σ=10. Lead time is 4 days. Target service level 95%. Find SS and ROP.",
      solution: "σ_dL = 10×√4 = 20. SS = 1.65×20 = 33. ROP = 50×4 + 33 = 233 units.",
      steps: [
        "Compute σ_dL = σ_d × √L = 10 × √4 = 20",
        "Look up z for 95% service level: z = 1.65",
        "SS = z × σ_dL = 1.65 × 20 = 33 units",
        "ROP = d̄ × L + SS = 50 × 4 + 33 = 233 units",
      ],
    },
    practiceStems: [
      {
        id: "ss_p1",
        text: "Mean daily demand = 100, σ_d = 15, lead time = 9 days, service level = 99%. Find SS.",
        answer: "σ_dL = 15×√9 = 45. SS = 2.33×45 ≈ 105 units.",
        explanation: "Scale by √L not L. z=2.33 for 99%.",
        traps: ["Scaling by L instead of √L", "Using wrong z-score"],
      },
    ],
    rootCauses: [
      { id: "ss_rc1", label: "Scaled by L instead of √L" },
      { id: "ss_rc2", label: "Forgot mean term in ROP" },
      { id: "ss_rc3", label: "Wrong z-score for service level" },
      { id: "ss_rc4", label: "Misclassified bucket" },
    ],
  },
  {
    id: "risk_pooling",
    name: "Risk Pooling",
    shortName: "Risk Pooling",
    description: "Consolidate demand across locations/products to reduce total safety stock.",
    verificationStatus: "verified",
    triggers: ["consolidate warehouses", "centralize inventory", "pooling", "aggregate demand", "reduce safety stock by combining"],
    disqualifiers: ["single location", "no variance reduction possible", "newsvendor context"],
    derivedCondition: "Multiple independent demand streams can be aggregated",
    formula: "σ_pooled = √(σ₁² + σ₂² + ... + σₙ²)   [if independent]",
    formulaVars: {
      "σ_pooled": "Std dev of pooled demand",
      "σᵢ": "Std dev of demand at location i",
      "ρ": "Correlation between demands (0 = independent)",
    },
    trapNotes: [
      "Pooling only reduces safety stock, NOT cycle stock (EOQ portion)",
      "If demands are correlated (ρ > 0), benefit is reduced",
      "SS savings = z × (Σσᵢ − σ_pooled) × holding cost",
      "Centralization increases transportation/response time — trade-off",
    ],
    workedExample: {
      stem: "Two warehouses each have σ=100 units demand. z=1.65. H=$5. Currently hold SS separately. What is the SS saving from pooling?",
      solution: "Separate: 2 × 1.65 × 100 = 330. Pooled: 1.65 × √(100²+100²) = 1.65 × 141 ≈ 233. Saving = 97 units × $5 = $485.",
      steps: [
        "Separate SS = 2 × z × σ = 2 × 1.65 × 100 = 330",
        "Pooled σ = √(100² + 100²) = √20,000 ≈ 141",
        "Pooled SS = 1.65 × 141 ≈ 233",
        "Saving = (330 − 233) × $5 = $485/period",
      ],
    },
    practiceStems: [
      {
        id: "rp_p1",
        text: "Three locations each have σ=50. Demands are independent. z=1.96. What is the ratio of pooled SS to total separate SS?",
        answer: "Separate = 3×1.96×50=294. Pooled σ=√(3×50²)=86.6. Pooled SS=1.96×86.6≈170. Ratio≈0.577 = 1/√3.",
        explanation: "For n identical independent locations, pooling ratio = 1/√n.",
        traps: ["Forgetting that pooling only affects safety stock, not cycle stock"],
      },
    ],
    rootCauses: [
      { id: "rp_rc1", label: "Used wrong formula" },
      { id: "rp_rc2", label: "Misclassified bucket" },
      { id: "rp_rc3", label: "Applied pooling to cycle stock" },
      { id: "rp_rc4", label: "Ignored demand correlation" },
    ],
  },
  {
    id: "newsvendor",
    name: "Newsvendor",
    shortName: "Newsvendor",
    description: "One-shot order quantity under uncertain demand to maximize expected profit.",
    verificationStatus: "verified",
    triggers: ["one-shot buy", "perishable", "single period", "critical ratio", "overage underage", "seasonal buy"],
    disqualifiers: ["steady demand", "multiple periods", "EOQ context"],
    derivedCondition: "Single period, uncertain demand, overage and underage costs defined",
    formula: "CR = Cu / (Cu + Co)   →   Q* = F⁻¹(CR)",
    formulaVars: {
      "CR": "Critical ratio (optimal service level)",
      "Cu": "Cost of underage (lost margin, lost goodwill)",
      "Co": "Cost of overage (salvage loss, disposal cost)",
      "F⁻¹": "Inverse CDF of demand distribution",
    },
    trapNotes: [
      "Cu = selling price − cost (not just selling price)",
      "Co = cost − salvage value (not just cost)",
      "CR > 0.5 means order more than the mean (high underage cost)",
      "If demand is Normal: Q* = μ + z × σ where z = Φ⁻¹(CR)",
    ],
    workedExample: {
      stem: "Buy price $10, sell price $25, salvage $4. Demand ~ N(200, 40). Find Q*.",
      solution: "Cu = 25−10 = 15. Co = 10−4 = 6. CR = 15/21 ≈ 0.714. z = 0.57. Q* = 200 + 0.57×40 ≈ 223.",
      steps: [
        "Cu = selling price − cost = 25 − 10 = $15",
        "Co = cost − salvage = 10 − 4 = $6",
        "CR = Cu / (Cu + Co) = 15 / 21 ≈ 0.714",
        "z = Φ⁻¹(0.714) ≈ 0.57",
        "Q* = μ + z × σ = 200 + 0.57 × 40 ≈ 223 units",
      ],
    },
    practiceStems: [
      {
        id: "nv_p1",
        text: "Cost=$8, price=$20, salvage=$2. Demand~N(500, 80). Find Q*.",
        answer: "Cu=12, Co=6, CR=12/18=0.667, z≈0.43, Q*=500+0.43×80≈534.",
        explanation: "Standard newsvendor. CR>0.5 so order above mean.",
        traps: ["Using price instead of margin for Cu", "Using cost instead of net loss for Co"],
      },
    ],
    rootCauses: [
      { id: "nv_rc1", label: "Scaled by L instead of √L" },
      { id: "nv_rc2", label: "Forgot mean term in ROP" },
      { id: "nv_rc3", label: "Used price not margin for Cu" },
      { id: "nv_rc4", label: "Misclassified bucket" },
    ],
  },
  {
    id: "experimentation",
    name: "Experimentation / A-B Testing",
    shortName: "Experimentation",
    description: "Design and interpret controlled experiments to detect causal effects.",
    verificationStatus: "verified",
    triggers: ["A/B test", "experiment", "control group", "p-value", "statistical significance", "sample size", "power"],
    disqualifiers: ["observational data only", "no randomization possible", "time-series forecasting"],
    derivedCondition: "Randomized controlled experiment with treatment and control groups",
    formula: "n = (z_α/2 + z_β)² × 2σ² / δ²",
    formulaVars: {
      "n": "Required sample size per group",
      "z_α/2": "Critical value for significance level (1.96 for α=0.05)",
      "z_β": "Critical value for power (0.84 for 80% power)",
      "σ²": "Variance of outcome metric",
      "δ": "Minimum detectable effect (MDE)",
    },
    trapNotes: [
      "Larger MDE → smaller required n (easier to detect big effects)",
      "p-value is NOT the probability the null is true",
      "Randomization must be at the right unit (user, not session, to avoid contamination)",
      "Multiple testing inflates Type I error — use Bonferroni correction",
    ],
    workedExample: {
      stem: "σ=10, MDE=2, α=0.05, power=80%. How many observations per group?",
      solution: "n = (1.96+0.84)² × 2×100 / 4 = 7.84 × 50 = 392 per group.",
      steps: [
        "z_α/2 = 1.96 (α=0.05 two-tailed), z_β = 0.84 (80% power)",
        "(z_α/2 + z_β)² = (2.80)² = 7.84",
        "2σ² = 2 × 100 = 200",
        "δ² = 2² = 4",
        "n = 7.84 × 200 / 4 = 392 per group",
      ],
    },
    practiceStems: [
      {
        id: "exp_p1",
        text: "You want to detect a 5% lift in conversion rate (baseline 20%). α=0.05, power=80%. Estimate n.",
        answer: "σ²=p(1-p)=0.16, δ=0.01 (5% of 20%). n=(2.80)²×2×0.16/0.0001≈25,088 per group.",
        explanation: "For proportions, σ²=p(1-p). MDE=0.05×0.20=0.01.",
        traps: ["MDE is absolute change, not relative", "Using wrong σ² for binary outcomes"],
      },
    ],
    rootCauses: [
      { id: "exp_rc1", label: "Used wrong formula" },
      { id: "exp_rc2", label: "Misclassified bucket" },
      { id: "exp_rc3", label: "Confused relative vs absolute MDE" },
      { id: "exp_rc4", label: "Misinterpreted p-value" },
    ],
  },
  {
    id: "spc",
    name: "SPC / Process Capability",
    shortName: "SPC / Process Capability",
    description: "Monitor process stability and measure capability against spec limits.",
    verificationStatus: "verified",
    triggers: ["control chart", "process capability", "Cp", "Cpk", "UCL", "LCL", "six sigma", "spec limits", "in control"],
    disqualifiers: ["inventory optimization", "demand uncertainty", "A/B test"],
    derivedCondition: "Repeated process measurements with spec limits defined",
    formula: "Cp = (USL − LSL) / 6σ   |   Cpk = min[(USL−μ)/3σ, (μ−LSL)/3σ]",
    formulaVars: {
      "Cp": "Process capability (spread only)",
      "Cpk": "Process capability (centered, accounts for mean shift)",
      "USL": "Upper specification limit",
      "LSL": "Lower specification limit",
      "μ": "Process mean",
      "σ": "Process standard deviation",
    },
    trapNotes: [
      "Cp ignores centering — a process can have Cp>1 but be off-center",
      "Cpk ≤ Cp always; Cpk = Cp only when process is perfectly centered",
      "Cpk ≥ 1.33 is typically required for capable processes",
      "UCL/LCL for X̄ chart: X̄ ± 3σ/√n (not 3σ)",
    ],
    workedExample: {
      stem: "USL=20, LSL=10, μ=16, σ=1.5. Compute Cp and Cpk.",
      solution: "Cp=(20-10)/(6×1.5)=10/9≈1.11. Cpk=min[(20-16)/4.5,(16-10)/4.5]=min[0.89,1.33]=0.89.",
      steps: [
        "Cp = (USL − LSL) / 6σ = (20 − 10) / 9 ≈ 1.11",
        "Upper: (USL − μ) / 3σ = (20 − 16) / 4.5 = 0.89",
        "Lower: (μ − LSL) / 3σ = (16 − 10) / 4.5 = 1.33",
        "Cpk = min(0.89, 1.33) = 0.89 → process not capable (< 1.33)",
      ],
    },
    practiceStems: [
      {
        id: "spc_p1",
        text: "USL=50, LSL=30, μ=42, σ=2. Is the process capable? Compute Cp and Cpk.",
        answer: "Cp=(50-30)/12≈1.67. Cpk=min[(50-42)/6,(42-30)/6]=min[1.33,2.0]=1.33. Capable (Cpk≥1.33).",
        explanation: "Cp>1.67 is world-class. Cpk=1.33 meets minimum requirement.",
        traps: ["Using 6σ in denominator for Cpk (should be 3σ)", "Confusing Cp with Cpk"],
      },
    ],
    rootCauses: [
      { id: "spc_rc1", label: "Scaled by L instead of √L" },
      { id: "spc_rc2", label: "Forgot mean term in ROP" },
      { id: "spc_rc3", label: "Confused Cp with Cpk" },
      { id: "spc_rc4", label: "Used 6σ for Cpk denominator" },
    ],
  },
];

export const ARCHETYPE_MAP: Record<string, Archetype> = Object.fromEntries(
  ARCHETYPES.map((a) => [a.id, a])
);

// Router stems for practice
export const ROUTER_STEMS = [
  { id: "rs1", stem: "A factory orders raw materials at $50/order. Annual demand is 4,000 units. Holding cost is $2/unit/year. How many units should they order at a time?", correctId: "eoq" },
  { id: "rs2", stem: "A retailer wants to ensure a 95% service level. Daily demand has mean 80 and std dev 12. Lead time is 9 days. How much safety stock is needed?", correctId: "safety_stock" },
  { id: "rs3", stem: "A fashion retailer buys winter coats once per season. Cost is $60, selling price $120, salvage $20. Demand is normally distributed. What is the optimal order quantity approach?", correctId: "newsvendor" },
  { id: "rs4", stem: "A company is considering consolidating its three regional warehouses into one central facility. Each warehouse faces independent demand with σ=200 units. What is the benefit?", correctId: "risk_pooling" },
  { id: "rs5", stem: "A product has USL=100, LSL=80, process mean=92, σ=3. Is the process capable?", correctId: "spc" },
  { id: "rs6", stem: "A tech company wants to test whether a new checkout button increases conversion. They need to detect a 2% absolute lift. How do they determine sample size?", correctId: "experimentation" },
  { id: "rs7", stem: "A distributor replenishes stock every time inventory hits a certain level. Demand is variable with known mean and variance. Lead time is fixed. What determines the trigger level?", correctId: "safety_stock" },
  { id: "rs8", stem: "A bakery makes croissants each morning. Unsold croissants are discarded at end of day. Demand varies. How should they decide how many to bake?", correctId: "newsvendor" },
  { id: "rs9", stem: "A manufacturer wants to minimize the sum of ordering costs and inventory holding costs. Demand is constant and known. What model applies?", correctId: "eoq" },
  { id: "rs10", stem: "A control chart shows a process with all points within 3-sigma limits but trending upward. Is the process in control?", correctId: "spc" },
  { id: "rs11", stem: "A company runs two parallel promotions on its website to see which drives more signups. They track signups per visitor. What analysis framework applies?", correctId: "experimentation" },
  { id: "rs12", stem: "An e-commerce company has 4 regional fulfillment centers. They are considering whether pooling inventory would reduce their safety stock costs.", correctId: "risk_pooling" },
];
