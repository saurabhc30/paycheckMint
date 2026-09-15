/* =========================================================
   PaycheckMint — 2026 Tax Rules
   File: tax-rules-2026.js

   This file contains tax data only.
   Calculation logic belongs in tax-engine.js.

   IMPORTANT:
   These rules are intended for paycheck estimates.
   State rates are simplified planning estimates and are
   NOT a substitute for official state withholding tables.
   ========================================================= */

window.PaycheckMintTaxRules = {
    year: 2026,

    currency: "USD",

    /* ---------------------------------------------------------
       Federal income tax
       2026 federal standard deductions and brackets.
       --------------------------------------------------------- */

    federal: {
        standardDeduction: {
            single: 16100,
            married: 32200,
            hoh: 24150
        },

        brackets: {
            single: [
                { upTo: 12400, rate: 0.10 },
                { upTo: 50400, rate: 0.12 },
                { upTo: 105700, rate: 0.22 },
                { upTo: 201775, rate: 0.24 },
                { upTo: 256225, rate: 0.32 },
                { upTo: 640600, rate: 0.35 },
                { upTo: Infinity, rate: 0.37 }
            ],

            married: [
                { upTo: 24800, rate: 0.10 },
                { upTo: 100800, rate: 0.12 },
                { upTo: 211400, rate: 0.22 },
                { upTo: 403550, rate: 0.24 },
                { upTo: 512450, rate: 0.32 },
                { upTo: 768700, rate: 0.35 },
                { upTo: Infinity, rate: 0.37 }
            ],

            hoh: [
                { upTo: 17700, rate: 0.10 },
                { upTo: 67450, rate: 0.12 },
                { upTo: 107350, rate: 0.22 },
                { upTo: 204750, rate: 0.24 },
                { upTo: 256200, rate: 0.32 },
                { upTo: 640600, rate: 0.35 },
                { upTo: Infinity, rate: 0.37 }
            ]
        },

        /*
         * Simplified dependent credit used by PaycheckMint's
         * estimator.
         *
         * This is intentionally kept separate from the federal
         * bracket data so the engine can later be upgraded to
         * full Form W-4 / IRS withholding logic.
         */
        dependentCredit: 2000
    },

    /* ---------------------------------------------------------
       FICA
       --------------------------------------------------------- */

    fica: {
        socialSecurity: {
            employeeRate: 0.062,
            wageBase: 184500
        },

        medicare: {
            employeeRate: 0.0145
        },

        additionalMedicare: {
            employeeRate: 0.009,
            threshold: 200000
        }
    },

    /* ---------------------------------------------------------
       Overtime
       --------------------------------------------------------- */

    overtime: {
        defaultMultiplier: 1.5,

        /*
         * Federal overtime deduction introduced for qualified
         * overtime compensation for applicable tax years.
         *
         * This data is provided separately because overtime
         * deduction treatment should not simply be treated as
         * "all overtime is tax free."
         */
        qualifiedOvertimeDeduction: {
            single: 12500,
            married: 25000
        }
    },

    /* ---------------------------------------------------------
       State income-tax planning rates
       
       These are simplified rates used for estimation only.
       They are NOT official state withholding percentages.
       --------------------------------------------------------- */

    states: {
        none: {
            name: "No state tax",
            rate: 0
        },

        al: {
            name: "Alabama",
            rate: 0.0400
        },

        az: {
            name: "Arizona",
            rate: 0.0250
        },

        ca: {
            name: "California",
            rate: 0.0450
        },

        co: {
            name: "Colorado",
            rate: 0.0440
        },

        fl: {
            name: "Florida",
            rate: 0
        },

        ga: {
            name: "Georgia",
            rate: 0.0400
        },

        il: {
            name: "Illinois",
            rate: 0.0495
        },

        ma: {
            name: "Massachusetts",
            rate: 0.0500
        },

        mi: {
            name: "Michigan",
            rate: 0.0425
        },

        nc: {
            name: "North Carolina",
            rate: 0.0399
        },

        nj: {
            name: "New Jersey",
            rate: 0.0400
        },

        ny: {
            name: "New York",
            rate: 0.0450
        },

        oh: {
            name: "Ohio",
            rate: 0.0300
        },

        or: {
            name: "Oregon",
            rate: 0.0700
        },

        pa: {
            name: "Pennsylvania",
            rate: 0.0307
        },

        tn: {
            name: "Tennessee",
            rate: 0
        },

        tx: {
            name: "Texas",
            rate: 0
        },

        va: {
            name: "Virginia",
            rate: 0.0350
        },

        wa: {
            name: "Washington",
            rate: 0
        },

        other: {
            name: "Other state",
            rate: 0.0400
        }
    },

    /* ---------------------------------------------------------
       Pay frequency
       --------------------------------------------------------- */

    payPeriods: {
        weekly: 52,
        biweekly: 26,
        semimonthly: 24,
        monthly: 12,
        quarterly: 4,
        semiannually: 2,
        annually: 1
    },

    /* ---------------------------------------------------------
       Calculator defaults
       --------------------------------------------------------- */

    defaults: {
        filing: "single",

        frequency: "biweekly",

        overtimeMultiplier: 1.5,

        dependents: 0,

        state: "none"
    },

    /* ---------------------------------------------------------
       Metadata
       --------------------------------------------------------- */

    metadata: {
        title: "PaycheckMint 2026 Tax Rules",

        description:
            "Centralized 2026 tax-rule data used by PaycheckMint paycheck calculators.",

        disclaimer:
            "PaycheckMint provides estimates for educational and planning purposes. " +
            "Actual withholding may differ based on Form W-4 elections, state and local " +
            "rules, deductions, benefits, year-to-date wages, and other circumstances.",

        federalSource:
            "https://www.irs.gov/publications/p15t",

        generalPayrollSource:
            "https://www.irs.gov/publications/p15",

        ficaSource:
            "https://www.irs.gov/taxtopics/tc751",

        w4Source:
            "https://www.irs.gov/forms-pubs/about-form-w-4"
    }
};