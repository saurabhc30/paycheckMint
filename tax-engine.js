/* =========================================================
   PaycheckMint — Tax Engine
   File: tax-engine.js

   Requires:
     tax-rules-2026.js

   Usage:
     const result = PaycheckMintTax.calculate({...});

   IMPORTANT:
   This engine provides estimates. It is not a full IRS
   Form W-4 withholding implementation or state/local
   withholding system.
   ========================================================= */

(function (window) {
  "use strict";

  const RULES = window.PaycheckMintTaxRules;

  if (!RULES) {
    console.error(
      "PaycheckMint tax engine: tax-rules-2026.js was not loaded."
    );
    return;
  }

  /* =========================================================
     Helpers
     ========================================================= */

  function number(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function positive(value) {
    return Math.max(0, number(value));
  }

  function round(value) {
    return Math.round((number(value) + Number.EPSILON) * 100) / 100;
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function getFilingStatus(filing) {
    if (
      filing === "married" ||
      filing === "mfj" ||
      filing === "marriedFilingJointly"
    ) {
      return "married";
    }

    if (
      filing === "hoh" ||
      filing === "headOfHousehold"
    ) {
      return "hoh";
    }

    return "single";
  }

  function getPayPeriods(frequency) {
    return (
      RULES.payPeriods[frequency] ||
      RULES.payPeriods.biweekly
    );
  }

  function getStateRule(state) {
    return (
      RULES.states[state] ||
      RULES.states.other
    );
  }

  /* =========================================================
     Federal income tax
     ========================================================= */

  function calculateFederalTax(taxableIncome, filing) {
    const status = getFilingStatus(filing);

    const brackets =
      RULES.federal.brackets[status] ||
      RULES.federal.brackets.single;

    let remaining = Math.max(0, taxableIncome);
    let previousLimit = 0;
    let tax = 0;

    for (const bracket of brackets) {
      if (remaining <= 0) {
        break;
      }

      const upperLimit = bracket.upTo;

      const bracketWidth =
        upperLimit === Infinity
          ? remaining
          : Math.max(0, upperLimit - previousLimit);

      const taxableInBracket =
        Math.min(remaining, bracketWidth);

      tax += taxableInBracket * bracket.rate;

      remaining -= taxableInBracket;

      if (upperLimit !== Infinity) {
        previousLimit = upperLimit;
      }
    }

    return round(Math.max(0, tax));
  }

  /* =========================================================
     Federal taxable income
     ========================================================= */

  function calculateFederalTaxableIncome(
    annualGross,
    pretaxDeductions,
    filing
  ) {
    const status = getFilingStatus(filing);

    const standardDeduction =
      RULES.federal.standardDeduction[status] ||
      RULES.federal.standardDeduction.single;

    return round(
      Math.max(
        0,
        annualGross -
          positive(pretaxDeductions) -
          standardDeduction
      )
    );
  }

  /* =========================================================
     Dependent credit
     ========================================================= */

  function calculateDependentCredit(dependents) {
    const count = Math.floor(
      positive(dependents)
    );

    return round(
      count * RULES.federal.dependentCredit
    );
  }

  /* =========================================================
     FICA
     ========================================================= */

  function calculateFica(
    annualGross,
    additionalMedicareOverride = 0
  ) {
    const gross = positive(annualGross);

    const socialSecurityTaxable =
      Math.min(
        gross,
        RULES.fica.socialSecurity.wageBase
      );

    const socialSecurity =
      socialSecurityTaxable *
      RULES.fica.socialSecurity.employeeRate;

    const medicare =
      gross *
      RULES.fica.medicare.employeeRate;

    const additionalMedicare =
      Math.max(
        0,
        gross -
          RULES.fica.additionalMedicare.threshold
      ) *
      RULES.fica.additionalMedicare.employeeRate;

    const additionalOverride =
      positive(additionalMedicareOverride);

    const totalAdditionalMedicare =
      additionalMedicare +
      additionalOverride;

    return {
      socialSecurity: round(socialSecurity),
      medicare: round(medicare),
      additionalMedicare: round(
        totalAdditionalMedicare
      ),
      total: round(
        socialSecurity +
        medicare +
        totalAdditionalMedicare
      )
    };
  }

  /* =========================================================
     State tax
     ========================================================= */

  function calculateStateTax(
    taxableIncome,
    state,
    extraState = 0
  ) {
    const stateRule = getStateRule(state);

    const baseTax =
      positive(taxableIncome) *
      positive(stateRule.rate);

    return round(
      baseTax +
      positive(extraState)
    );
  }

  /* =========================================================
     Hourly → annual gross
     ========================================================= */

  function calculateHourlyGross({
    hourlyRate = 0,
    hoursPerWeek = 40,
    overtimeHoursPerWeek = 0,
    overtimeMultiplier
  } = {}) {
    const rate = positive(hourlyRate);

    const regularHours =
      positive(hoursPerWeek);

    const overtimeHours =
      positive(overtimeHoursPerWeek);

    const multiplier =
      positive(overtimeMultiplier) ||
      RULES.overtime.defaultMultiplier;

    const regularWeeklyPay =
      rate * regularHours;

    const overtimeWeeklyPay =
      rate *
      multiplier *
      overtimeHours;

    const weeklyGross =
      regularWeeklyPay +
      overtimeWeeklyPay;

    return {
      regularWeeklyPay: round(
        regularWeeklyPay
      ),

      overtimeWeeklyPay: round(
        overtimeWeeklyPay
      ),

      weeklyGross: round(
        weeklyGross
      ),

      annualGross: round(
        weeklyGross * 52
      )
    };
  }

  /* =========================================================
     Frequency conversion
     ========================================================= */

  function annualToPeriod(
    annualAmount,
    frequency
  ) {
    const periods =
      getPayPeriods(frequency);

    return round(
      positive(annualAmount) / periods
    );
  }

  function periodToAnnual(
    periodAmount,
    frequency
  ) {
    const periods =
      getPayPeriods(frequency);

    return round(
      positive(periodAmount) * periods
    );
  }

  /* =========================================================
     Annual paycheck calculation
     ========================================================= */

  function calculate({
    annualGross = 0,

    state = "none",

    filing = "single",

    dependents = 0,

    frequency = "biweekly",

    pretax = {},

    posttax = {},

    extraFederal = 0,

    extraState = 0,

    additionalMedicare = 0,

    otherAdjustments = 0,

    overtimeDeduction = 0
  } = {}) {
    const gross = positive(annualGross);

    /* -------------------------------------------------------
       Pre-tax deductions
       ------------------------------------------------------- */

    const pretaxTotal = round(
      positive(pretax.retirement401k) +
      positive(pretax.healthInsurance) +
      positive(pretax.hsa) +
      positive(pretax.fsa) +
      positive(pretax.other)
    );

    /*
     * Prevent deductions from exceeding gross income.
     */
    const usablePretax =
      Math.min(
        pretaxTotal,
        gross
      );

    /* -------------------------------------------------------
       Federal taxable income
       ------------------------------------------------------- */

    const federalTaxableBeforeOvertime =
      calculateFederalTaxableIncome(
        gross,
        usablePretax,
        filing
      );

    /*
     * Qualified overtime deduction is kept separate.
     * It should only be supplied when the overtime amount
     * is actually eligible.
     */
    const qualifiedOvertime =
      clamp(
        positive(overtimeDeduction),
        0,
        gross
      );

    const federalTaxableIncome = round(
      Math.max(
        0,
        federalTaxableBeforeOvertime -
          qualifiedOvertime
      )
    );

    /* -------------------------------------------------------
       Federal tax
       ------------------------------------------------------- */

    const federalBeforeCredits =
      calculateFederalTax(
        federalTaxableIncome,
        filing
      );

    const dependentCredit =
      calculateDependentCredit(
        dependents
      );

    const federalTax = round(
      Math.max(
        0,
        federalBeforeCredits -
          dependentCredit +
          positive(extraFederal)
      )
    );

    /* -------------------------------------------------------
       FICA
       ------------------------------------------------------- */

    const fica =
      calculateFica(
        gross,
        additionalMedicare
      );

    /* -------------------------------------------------------
       State tax
       ------------------------------------------------------- */

    const stateTax =
      calculateStateTax(
        Math.max(
          0,
          gross - usablePretax
        ),
        state,
        extraState
      );

    /* -------------------------------------------------------
       Post-tax deductions
       ------------------------------------------------------- */

    const posttaxTotal = round(
      positive(posttax.roth401k) +
      positive(posttax.loanRepayment) +
      positive(posttax.garnishments) +
      positive(posttax.other)
    );

    /* -------------------------------------------------------
       Total taxes
       ------------------------------------------------------- */

    const totalTaxes = round(
      federalTax +
      fica.total +
      stateTax
    );

    /* -------------------------------------------------------
       Annual net pay
       ------------------------------------------------------- */

    const annualNet = round(
      Math.max(
        0,
        gross -
          federalTax -
          fica.total -
          stateTax -
          usablePretax -
          posttaxTotal -
          positive(otherAdjustments)
      )
    );

    /* -------------------------------------------------------
       Pay-period values
       ------------------------------------------------------- */

    const periodGross =
      annualToPeriod(
        gross,
        frequency
      );

    const periodFederal =
      annualToPeriod(
        federalTax,
        frequency
      );

    const periodFica =
      annualToPeriod(
        fica.total,
        frequency
      );

    const periodState =
      annualToPeriod(
        stateTax,
        frequency
      );

    const periodPretax =
      annualToPeriod(
        usablePretax,
        frequency
      );

    const periodPosttax =
      annualToPeriod(
        posttaxTotal,
        frequency
      );

    const periodNet =
      annualToPeriod(
        annualNet,
        frequency
      );

    /* -------------------------------------------------------
       Standard pay summaries
       ------------------------------------------------------- */

    const weeklyPay =
      annualToPeriod(
        annualNet,
        "weekly"
      );

    const biweeklyPay =
      annualToPeriod(
        annualNet,
        "biweekly"
      );

    const semimonthlyPay =
      annualToPeriod(
        annualNet,
        "semimonthly"
      );

    const monthlyPay =
      annualToPeriod(
        annualNet,
        "monthly"
      );

    /* -------------------------------------------------------
       Effective tax rate
       ------------------------------------------------------- */

    const effectiveTaxRate =
      gross > 0
        ? round(
            (totalTaxes / gross) * 100
          )
        : 0;

    const totalDeductions =
      round(
        usablePretax +
        posttaxTotal +
        positive(otherAdjustments)
      );

    /* -------------------------------------------------------
       Chart values
       ------------------------------------------------------- */

    const chart = {
      net: annualNet,
      federal: federalTax,
      fica: fica.total,
      state: stateTax,
      deductions: totalDeductions
    };

    return {
      year: RULES.year,

      frequency,

      periodsPerYear:
        getPayPeriods(frequency),

      gross: {
        annual: round(gross),
        period: periodGross
      },

      taxableIncome: {
        federal: federalTaxableIncome,
        state: round(
          Math.max(
            0,
            gross - usablePretax
          )
        )
      },

      federal: {
        tax: federalTax,
        beforeCredits: federalBeforeCredits,
        dependentCredit,
        extra: round(
          positive(extraFederal)
        )
      },

      fica: {
        socialSecurity:
          fica.socialSecurity,

        medicare:
          fica.medicare,

        additionalMedicare:
          fica.additionalMedicare,

        total: fica.total
      },

      state: {
        tax: stateTax,

        rate:
          getStateRule(state).rate,

        name:
          getStateRule(state).name
      },

      deductions: {
        pretax: usablePretax,
        posttax: posttaxTotal,
        otherAdjustments:
          positive(otherAdjustments),

        total: totalDeductions
      },

      taxes: {
        federal: federalTax,
        fica: fica.total,
        state: stateTax,
        total: totalTaxes
      },

      net: {
        annual: annualNet,
        period: periodNet,
        weekly: weeklyPay,
        biweekly: biweeklyPay,
        semimonthly: semimonthlyPay,
        monthly: monthlyPay
      },

      effectiveTaxRate,

      chart
    };
  }

  /* =========================================================
     Public API
     ========================================================= */

  window.PaycheckMintTax = {

    version: "2026.1",

    rules: RULES,

    calculate,

    calculateFederalTax,

    calculateFederalTaxableIncome,

    calculateDependentCredit,

    calculateFica,

    calculateStateTax,

    calculateHourlyGross,

    annualToPeriod,

    periodToAnnual,

    getPayPeriods,

    getStateRule,

    getFilingStatus
  };

})(window);