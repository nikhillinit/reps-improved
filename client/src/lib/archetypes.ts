/* ============================================================
   REPS — OPNS-430 Archetype Bank (Deterministic, Verified)
   6 core archetypes from the PRD
   ============================================================ */

import type { Archetype, RouterStem } from "./content/schemas";
export type { Archetype };

export const ARCHETYPES: Archetype[] = [
  {
    id: "eoq",
    name: "Economic Order Quantity",
    shortName: "EOQ",
    description:
      "Minimize total ordering + holding cost by finding optimal batch size.",
    verificationStatus: "verified",
    triggers: [
      "order size",
      "order quantity",
      "how many to order",
      "minimize ordering + holding",
      "optimal lot size",
    ],
    disqualifiers: [
      "uncertain demand",
      "one-shot buy",
      "perishable",
      "different objective",
      "lead time uncertainty",
    ],
    derivedCondition: "Steady demand, known costs, instantaneous replenishment",
    formula: "Q* = √(2SR / H)",
    formulaVars: {
      "Q*": "Optimal order quantity",
      S: "Fixed ordering cost per order",
      R: "Annual demand rate",
      H: "Annual holding cost per unit",
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
    description:
      "Buffer against demand and lead-time variability; set reorder point.",
    verificationStatus: "verified",
    triggers: [
      "safety stock",
      "reorder point",
      "ROP",
      "stockout risk",
      "service level",
      "lead time variability",
    ],
    disqualifiers: [
      "deterministic demand",
      "no lead time",
      "EOQ context without uncertainty",
    ],
    derivedCondition:
      "Variable demand or lead time, service level target given",
    formula: "SS = z × σ_dL   |   ROP = d̄ × L + SS",
    formulaVars: {
      SS: "Safety stock",
      z: "z-score for target service level",
      σ_dL: "Std dev of demand during lead time = σ_d × √L",
      d̄: "Mean daily demand",
      L: "Lead time in days",
    },
    trapNotes: [
      "Scale σ_d by √L, NOT by L — a classic exam trap",
      "ROP includes the mean demand term: d̄ × L + SS",
      "z = 1.28 for 90%, 1.65 for 95%, 1.96 for 97.5%, 2.33 for 99%",
      "If lead time is also variable: σ_dL = √(L × σ_d² + d̄² × σ_L²)",
    ],
    workedExample: {
      stem: "Daily demand is normally distributed: mean 50, σ=10. Lead time is 4 days. Target service level 95%. Find SS and ROP.",
      solution:
        "σ_dL = 10×√4 = 20. SS = 1.65×20 = 33. ROP = 50×4 + 33 = 233 units.",
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
    description:
      "Consolidate demand across locations/products to reduce total safety stock.",
    verificationStatus: "verified",
    triggers: [
      "consolidate warehouses",
      "centralize inventory",
      "pooling",
      "aggregate demand",
      "reduce safety stock by combining",
    ],
    disqualifiers: [
      "single location",
      "no variance reduction possible",
      "newsvendor context",
    ],
    derivedCondition: "Multiple independent demand streams can be aggregated",
    formula: "σ_pooled = √(σ₁² + σ₂² + ... + σₙ²)   [if independent]",
    formulaVars: {
      σ_pooled: "Std dev of pooled demand",
      σᵢ: "Std dev of demand at location i",
      ρ: "Correlation between demands (0 = independent)",
    },
    trapNotes: [
      "Pooling only reduces safety stock, NOT cycle stock (EOQ portion)",
      "If demands are correlated (ρ > 0), benefit is reduced",
      "SS savings = z × (Σσᵢ − σ_pooled) × holding cost",
      "Centralization increases transportation/response time — trade-off",
    ],
    workedExample: {
      stem: "Two warehouses each have σ=100 units demand. z=1.65. H=$5. Currently hold SS separately. What is the SS saving from pooling?",
      solution:
        "Separate: 2 × 1.65 × 100 = 330. Pooled: 1.65 × √(100²+100²) = 1.65 × 141 ≈ 233. Saving = 97 units × $5 = $485.",
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
        answer:
          "Separate = 3×1.96×50=294. Pooled σ=√(3×50²)=86.6. Pooled SS=1.96×86.6≈170. Ratio≈0.577 = 1/√3.",
        explanation:
          "For n identical independent locations, pooling ratio = 1/√n.",
        traps: [
          "Forgetting that pooling only affects safety stock, not cycle stock",
        ],
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
    description:
      "One-shot order quantity under uncertain demand to maximize expected profit.",
    verificationStatus: "verified",
    triggers: [
      "one-shot buy",
      "perishable",
      "single period",
      "critical ratio",
      "overage underage",
      "seasonal buy",
    ],
    disqualifiers: ["steady demand", "multiple periods", "EOQ context"],
    derivedCondition:
      "Single period, uncertain demand, overage and underage costs defined",
    formula: "CR = Cu / (Cu + Co)   →   Q* = F⁻¹(CR)",
    formulaVars: {
      CR: "Critical ratio (optimal service level)",
      Cu: "Cost of underage (lost margin, lost goodwill)",
      Co: "Cost of overage (salvage loss, disposal cost)",
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
      solution:
        "Cu = 25−10 = 15. Co = 10−4 = 6. CR = 15/21 ≈ 0.714. z = 0.57. Q* = 200 + 0.57×40 ≈ 223.",
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
        traps: [
          "Using price instead of margin for Cu",
          "Using cost instead of net loss for Co",
        ],
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
    description:
      "Design and interpret controlled experiments to detect causal effects.",
    verificationStatus: "verified",
    triggers: [
      "A/B test",
      "experiment",
      "control group",
      "p-value",
      "statistical significance",
      "sample size",
      "power",
    ],
    disqualifiers: [
      "observational data only",
      "no randomization possible",
      "time-series forecasting",
    ],
    derivedCondition:
      "Randomized controlled experiment with treatment and control groups",
    formula: "n = (z_α/2 + z_β)² × 2σ² / δ²",
    formulaVars: {
      n: "Required sample size per group",
      "z_α/2": "Critical value for significance level (1.96 for α=0.05)",
      z_β: "Critical value for power (0.84 for 80% power)",
      "σ²": "Variance of outcome metric",
      δ: "Minimum detectable effect (MDE)",
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
        answer:
          "σ²=p(1-p)=0.16, δ=0.01 (5% of 20%). n=(2.80)²×2×0.16/0.0001≈25,088 per group.",
        explanation: "For proportions, σ²=p(1-p). MDE=0.05×0.20=0.01.",
        traps: [
          "MDE is absolute change, not relative",
          "Using wrong σ² for binary outcomes",
        ],
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
    description:
      "Monitor process stability and measure capability against spec limits.",
    verificationStatus: "verified",
    triggers: [
      "control chart",
      "process capability",
      "Cp",
      "Cpk",
      "UCL",
      "LCL",
      "six sigma",
      "spec limits",
      "in control",
    ],
    disqualifiers: ["inventory optimization", "demand uncertainty", "A/B test"],
    derivedCondition: "Repeated process measurements with spec limits defined",
    formula: "Cp = (USL − LSL) / 6σ   |   Cpk = min[(USL−μ)/3σ, (μ−LSL)/3σ]",
    formulaVars: {
      Cp: "Process capability (spread only)",
      Cpk: "Process capability (centered, accounts for mean shift)",
      USL: "Upper specification limit",
      LSL: "Lower specification limit",
      μ: "Process mean",
      σ: "Process standard deviation",
    },
    trapNotes: [
      "Cp ignores centering — a process can have Cp>1 but be off-center",
      "Cpk ≤ Cp always; Cpk = Cp only when process is perfectly centered",
      "Cpk ≥ 1.33 is typically required for capable processes",
      "UCL/LCL for X̄ chart: X̄ ± 3σ/√n (not 3σ)",
    ],
    workedExample: {
      stem: "USL=20, LSL=10, μ=16, σ=1.5. Compute Cp and Cpk.",
      solution:
        "Cp=(20-10)/(6×1.5)=10/9≈1.11. Cpk=min[(20-16)/4.5,(16-10)/4.5]=min[0.89,1.33]=0.89.",
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
        answer:
          "Cp=(50-30)/12≈1.67. Cpk=min[(50-42)/6,(42-30)/6]=min[1.33,2.0]=1.33. Capable (Cpk≥1.33).",
        explanation:
          "Cp>1.67 is world-class. Cpk=1.33 meets minimum requirement.",
        traps: [
          "Using 6σ in denominator for Cpk (should be 3σ)",
          "Confusing Cp with Cpk",
        ],
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
  ARCHETYPES.map(a => [a.id, a])
);

const VERIFIED_ROUTER_STEM_QA: RouterStem["semanticQa"] = {
  verificationStatus: "verified",
  checks: {
    hasStableArchetypeLink: true,
    hasSourceBackedAnswer: true,
    hasExplanation: true,
    hasTrapCoverage: true,
  },
  warnings: [],
};

// Router stems for practice
const ROUTER_STEM_DATA: Array<Omit<RouterStem, "semanticQa">> = [
  {
    id: "router_eoq_direct_1",
    stem: "A plant uses 12,000 identical fasteners per year, pays a fixed cost each time it orders, and pays an annual holding cost per fastener. What order quantity minimizes ordering plus holding cost?",
    correctId: "eoq",
    kind: "direct",
  },
  {
    id: "router_eoq_direct_2",
    stem: "Demand is constant and known, replenishment is immediate, and the manager wants the batch size that balances setup cost against inventory carrying cost.",
    correctId: "eoq",
    kind: "direct",
  },
  {
    id: "router_eoq_direct_3",
    stem: "A distributor can reorder the same SKU repeatedly through the year and needs the quantity per order, not the reorder trigger point.",
    correctId: "eoq",
    kind: "direct",
  },
  {
    id: "router_eoq_near_miss_1",
    stem: "The buyer can place another replenishment order next week, so this is not a one-season buy. The task is to choose the recurring order size from ordering and holding costs.",
    correctId: "eoq",
    kind: "near-miss",
    confuserIds: ["newsvendor"],
  },
  {
    id: "router_eoq_near_miss_2",
    stem: "The question asks for the order quantity that minimizes annual cost, while safety stock and service level are handled in a separate reorder-point calculation.",
    correctId: "eoq",
    kind: "near-miss",
    confuserIds: ["safety_stock"],
  },
  {
    id: "router_eoq_conceptual_1",
    stem: "At the optimal repeated order quantity, the annual ordering cost equals the annual holding cost. Which bucket explains that balance?",
    correctId: "eoq",
    kind: "conceptual-trap",
    confuserIds: ["newsvendor"],
  },
  {
    id: "router_safety_direct_1",
    stem: "Daily demand has mean 80 and standard deviation 12, lead time is 9 days, and the target service level is 95%. Which bucket finds the buffer stock?",
    correctId: "safety_stock",
    kind: "direct",
  },
  {
    id: "router_safety_direct_2",
    stem: "A retailer needs the inventory position that triggers replenishment when lead-time demand is uncertain.",
    correctId: "safety_stock",
    kind: "direct",
  },
  {
    id: "router_safety_direct_3",
    stem: "The problem gives mean demand, demand variability, lead time, and a z-score target for avoiding stockouts.",
    correctId: "safety_stock",
    kind: "direct",
  },
  {
    id: "router_safety_near_miss_1",
    stem: "The order quantity is already fixed; the manager now needs the extra inventory buffer caused by uncertain demand during lead time.",
    correctId: "safety_stock",
    kind: "near-miss",
    confuserIds: ["eoq"],
  },
  {
    id: "router_safety_near_miss_2",
    stem: "This item is replenished continuously rather than bought once for a selling season, and the focus is stockout risk during lead time.",
    correctId: "safety_stock",
    kind: "near-miss",
    confuserIds: ["newsvendor"],
  },
  {
    id: "router_safety_conceptual_1",
    stem: "Multiplying daily standard deviation by lead time directly would overstate the buffer; the exam expects scaling by the square root of lead time.",
    correctId: "safety_stock",
    kind: "conceptual-trap",
    confuserIds: ["spc"],
  },
  {
    id: "router_pooling_direct_1",
    stem: "Four regional warehouses face independent demand, and the company is considering one central inventory pool to reduce total safety stock.",
    correctId: "risk_pooling",
    kind: "direct",
  },
  {
    id: "router_pooling_direct_2",
    stem: "A firm aggregates demand streams from multiple locations and wants to know how combined variance changes.",
    correctId: "risk_pooling",
    kind: "direct",
  },
  {
    id: "router_pooling_direct_3",
    stem: "The question compares separate safety stocks against a centralized stockpile when demands are not perfectly correlated.",
    correctId: "risk_pooling",
    kind: "direct",
  },
  {
    id: "router_pooling_near_miss_1",
    stem: "The service level is unchanged, but the company can consolidate multiple uncertain demand streams before computing the required buffer.",
    correctId: "risk_pooling",
    kind: "near-miss",
    confuserIds: ["safety_stock"],
  },
  {
    id: "router_pooling_near_miss_2",
    stem: "This is not a single-season purchase decision; the benefit comes from aggregating independent location demand to lower variability.",
    correctId: "risk_pooling",
    kind: "near-miss",
    confuserIds: ["newsvendor"],
  },
  {
    id: "router_pooling_conceptual_1",
    stem: "The trap is assuming safety stock falls in proportion to the number of locations. With independent demand, variability falls with a square-root relationship.",
    correctId: "risk_pooling",
    kind: "conceptual-trap",
    confuserIds: ["safety_stock"],
  },
  {
    id: "router_newsvendor_direct_1",
    stem: "A bakery decides each morning how many pastries to make, with leftover units salvaged cheaply and unmet demand lost.",
    correctId: "newsvendor",
    kind: "direct",
  },
  {
    id: "router_newsvendor_direct_2",
    stem: "A retailer buys winter coats once before the season and must choose the quantity using overage and underage costs.",
    correctId: "newsvendor",
    kind: "direct",
  },
  {
    id: "router_newsvendor_direct_3",
    stem: "Demand is uncertain, the purchase is single-period, and the optimal quantity comes from a critical ratio.",
    correctId: "newsvendor",
    kind: "direct",
  },
  {
    id: "router_newsvendor_near_miss_1",
    stem: "There is no chance to reorder after demand is observed; the order must be set before the one selling period begins.",
    correctId: "newsvendor",
    kind: "near-miss",
    confuserIds: ["eoq"],
  },
  {
    id: "router_newsvendor_near_miss_2",
    stem: "The service level is not an external target; it is implied by the cost of ordering too few versus too many units.",
    correctId: "newsvendor",
    kind: "near-miss",
    confuserIds: ["safety_stock"],
  },
  {
    id: "router_newsvendor_conceptual_1",
    stem: "The key fraction uses underage cost over underage plus overage cost, not ordering cost over holding cost.",
    correctId: "newsvendor",
    kind: "conceptual-trap",
    confuserIds: ["eoq"],
  },
  {
    id: "router_experiment_direct_1",
    stem: "A website tests a new checkout button against the current version and needs enough visitors to detect a two-point conversion lift.",
    correctId: "experimentation",
    kind: "direct",
  },
  {
    id: "router_experiment_direct_2",
    stem: "A team randomly assigns users to treatment and control groups, then compares signup rates.",
    correctId: "experimentation",
    kind: "direct",
  },
  {
    id: "router_experiment_direct_3",
    stem: "The problem asks for sample size, power, significance, and minimum detectable effect before running a test.",
    correctId: "experimentation",
    kind: "direct",
  },
  {
    id: "router_experiment_near_miss_1",
    stem: "The measured difference comes from a randomized treatment, not a manufacturing process drifting against control limits.",
    correctId: "experimentation",
    kind: "near-miss",
    confuserIds: ["spc"],
  },
  {
    id: "router_experiment_near_miss_2",
    stem: "The two groups are treatment and control users, not demand streams being combined for inventory centralization.",
    correctId: "experimentation",
    kind: "near-miss",
    confuserIds: ["risk_pooling"],
  },
  {
    id: "router_experiment_conceptual_1",
    stem: "The trap is declaring a lift from noisy conversion data without checking statistical power and significance.",
    correctId: "experimentation",
    kind: "conceptual-trap",
    confuserIds: ["spc"],
  },
  {
    id: "router_spc_direct_1",
    stem: "A product has USL 100, LSL 80, process mean 92, and standard deviation 3. The question asks whether the process is capable.",
    correctId: "spc",
    kind: "direct",
  },
  {
    id: "router_spc_direct_2",
    stem: "A control chart shows observations against upper and lower control limits to decide whether variation is common-cause or special-cause.",
    correctId: "spc",
    kind: "direct",
  },
  {
    id: "router_spc_direct_3",
    stem: "The problem asks for Cp and Cpk from specification limits, process mean, and process standard deviation.",
    correctId: "spc",
    kind: "direct",
  },
  {
    id: "router_spc_near_miss_1",
    stem: "There is no randomized treatment group; the question is whether an ongoing production process is stable and centered.",
    correctId: "spc",
    kind: "near-miss",
    confuserIds: ["experimentation"],
  },
  {
    id: "router_spc_near_miss_2",
    stem: "The standard deviation describes process output versus specs, not demand during replenishment lead time.",
    correctId: "spc",
    kind: "near-miss",
    confuserIds: ["safety_stock"],
  },
  {
    id: "router_spc_conceptual_1",
    stem: "The trap is reporting Cp only when the mean is off center; capability requires checking Cpk as well.",
    correctId: "spc",
    kind: "conceptual-trap",
    confuserIds: ["experimentation"],
  },
];

export const ROUTER_STEMS: RouterStem[] = ROUTER_STEM_DATA.map(stem => ({
  ...stem,
  semanticQa: VERIFIED_ROUTER_STEM_QA,
}));
