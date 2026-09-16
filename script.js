/* =========================================================
   PaycheckMint — Main Calculator
   File: script.js

   Requires:
   1. tax-rules-2026.js
   2. tax-engine.js
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    "use strict";

    /* ---------------------------------------------------------
       Check tax engine
       --------------------------------------------------------- */

    if (!window.PaycheckMintTax) {
        console.error(
            "PaycheckMint: tax-engine.js was not loaded."
        );
        return;
    }

    /* ---------------------------------------------------------
       Helpers
       --------------------------------------------------------- */

    const $ = (id) => document.getElementById(id);

    const number = (value) => {
        const n = Number(value);
        return Number.isFinite(n) ? n : 0;
    };

    const positive = (value) =>
        Math.max(0, number(value));

    const currency = (value) =>
        new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            maximumFractionDigits: 0
        }).format(Math.max(0, number(value)));

    const currencyExact = (value) =>
        new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(Math.max(0, number(value)));

    /* ---------------------------------------------------------
       Calculator elements
       --------------------------------------------------------- */

    const salaryMode = $("salaryMode");
    const hourlyMode = $("hourlyMode");

    const salaryInput = $("salary");

    const hourlyRate = $("hourlyRate");
    const hoursWeek = $("hoursWeek");
    const overtimeWeek = $("overtimeWeek");

    const frequency = $("frequency");
    const state = $("state");
    const filing = $("filing");
    const dependents = $("dependents");

    /* Pre-tax */

    const retirement401k = $("retirement401k");
    const hsa = $("hsa");
    const fsa = $("fsa");
    const healthInsurance = $("healthInsurance");
    const otherPretax = $("otherPretax");

    const pretaxTotal = $("pretaxTotal");

    /* Advanced */

    const extraFederal = $("extraFederal");
    const extraState = $("extraState");
    const additionalMedicare = $("additionalMedicare");
    const otherAdjustments = $("otherAdjustments");

    /* Post-tax */

    const roth401k = $("roth401k");
    const loanRepayment = $("loanRepayment");
    const garnishments = $("garnishments");
    const otherPosttax = $("otherPosttax");

    const posttaxTotal = $("posttaxTotal");

    /* Calculate */

    const calculateButton = $("calculate");

    /* Results */

    const takeHome = $("takeHome");
    const resultPeriod = $("resultPeriod");

    const paycheckChart = $("paycheckChart");
    const chartNet = $("chartNet");

    const legendNet = $("legendNet");
    const legendFederal = $("legendFederal");
    const legendFica = $("legendFica");
    const legendState = $("legendState");
    const legendDeductions = $("legendDeductions");

    const grossPay = $("grossPay");
    const federalTax = $("federalTax");
    const fica = $("fica");
    const stateTax = $("stateTax");
    const preTaxResult = $("preTaxResult");
    const postTaxResult = $("postTaxResult");

    const weeklyPay = $("weeklyPay");
    const biweeklyPay = $("biweeklyPay");
    const semimonthlyPay = $("semimonthlyPay");
    const monthlyPay = $("monthlyPay");
    const annualPay = $("annualPay");

    /* ---------------------------------------------------------
       Mode
       --------------------------------------------------------- */

    let mode = "salary";

    function setMode(newMode) {
        mode = newMode;

        const salaryFields = $("salaryFields");
        const hourlyFields = $("hourlyFields");

        // Show / hide the correct input section
        if (salaryFields) {
            salaryFields.hidden = newMode !== "salary";
        }

        if (hourlyFields) {
            hourlyFields.hidden = newMode !== "hourly";
        }

        // Update Salary button
        if (salaryMode) {
            salaryMode.classList.toggle(
                "active",
                newMode === "salary"
            );

            salaryMode.setAttribute(
                "aria-pressed",
                newMode === "salary"
            );
        }

        // Update Hourly button
        if (hourlyMode) {
            hourlyMode.classList.toggle(
                "active",
                newMode === "hourly"
            );

            hourlyMode.setAttribute(
                "aria-pressed",
                newMode === "hourly"
            );
        }

        calculate();
    }

    salaryMode?.addEventListener("click", () => {
        setMode("salary");
    });

    hourlyMode?.addEventListener("click", () => {
        setMode("hourly");
    });

    /* ---------------------------------------------------------
       Totals for deduction fields
       --------------------------------------------------------- */

    function updateDeductionTotals() {
        const pretax =
            positive(retirement401k?.value) +
            positive(hsa?.value) +
            positive(fsa?.value) +
            positive(healthInsurance?.value) +
            positive(otherPretax?.value);

        const posttax =
            positive(roth401k?.value) +
            positive(loanRepayment?.value) +
            positive(garnishments?.value) +
            positive(otherPosttax?.value);

        if (pretaxTotal) {
            pretaxTotal.textContent =
                currencyExact(pretax);
        }

        if (posttaxTotal) {
            posttaxTotal.textContent =
                currencyExact(posttax);
        }

        return {
            pretax,
            posttax
        };
    }

    /* ---------------------------------------------------------
       Get hourly annual gross
       --------------------------------------------------------- */

    function getHourlyAnnualGross() {
        const rate = positive(hourlyRate?.value);
        const regularHours = positive(hoursWeek?.value) || 40;
        const overtimeHours = positive(overtimeWeek?.value);
        const overtimeMultiplier = 1.5;

        const regularWeeklyPay = rate * regularHours;
        const overtimeWeeklyPay =
            rate * overtimeMultiplier * overtimeHours;

        const weeklyGross =
            regularWeeklyPay + overtimeWeeklyPay;

        return weeklyGross * 52;
    }

    /* ---------------------------------------------------------
       Calculate
       --------------------------------------------------------- */

    function calculate() {
        updateDeductionTotals();

        let annualGross = 0;

        if (mode === "hourly") {
            annualGross =
                getHourlyAnnualGross();
        } else {
            annualGross =
                positive(salaryInput?.value);
        }

        const pretax = {
            retirement401k:
                positive(retirement401k?.value),

            healthInsurance:
                positive(healthInsurance?.value),

            hsa:
                positive(hsa?.value),

            fsa:
                positive(fsa?.value),

            other:
                positive(otherPretax?.value)
        };

        const posttax = {
            roth401k:
                positive(roth401k?.value),

            loanRepayment:
                positive(loanRepayment?.value),

            garnishments:
                positive(garnishments?.value),

            other:
                positive(otherPosttax?.value)
        };

        /* -------------------------------------------------------
           Shared tax engine
           ------------------------------------------------------- */

        const result =
            PaycheckMintTax.calculate({
                annualGross,

                state:
                    state?.value || "none",

                filing:
                    filing?.value || "single",

                dependents:
                    positive(dependents?.value),

                frequency:
                    frequency?.value || "biweekly",

                pretax,

                posttax,

                extraFederal:
                    positive(extraFederal?.value),

                extraState:
                    positive(extraState?.value),

                additionalMedicare:
                    positive(additionalMedicare?.value),

                otherAdjustments:
                    positive(otherAdjustments?.value)
            });

        /* -------------------------------------------------------
           Result period
           ------------------------------------------------------- */

        const selectedFrequency =
            frequency?.value || "biweekly";

        const frequencyLabels = {
            weekly: "weekly",
            biweekly: "biweekly",
            semimonthly: "semimonthly",
            monthly: "monthly",
            quarterly: "quarterly",
            semiannually: "semiannually",
            annually: "annually"
        };

        if (takeHome) {
            takeHome.textContent =
                currency(result.net.period);
        }

        if (resultPeriod) {
            resultPeriod.textContent =
                `Estimated ${frequencyLabels[selectedFrequency] || "pay"} take-home`;
        }

        /* -------------------------------------------------------
           Breakdown
           ------------------------------------------------------- */

        if (grossPay) {
            grossPay.textContent =
                currency(result.gross.period);
        }

        if (federalTax) {
            federalTax.textContent =
                currency(
                    result.federal.tax /
                    result.periodsPerYear
                );
        }

        if (fica) {
            fica.textContent =
                currency(
                    result.fica.total /
                    result.periodsPerYear
                );
        }

        if (stateTax) {
            stateTax.textContent =
                currency(
                    result.state.tax /
                    result.periodsPerYear
                );
        }

        if (preTaxResult) {
            preTaxResult.textContent =
                currency(
                    result.deductions.pretax /
                    result.periodsPerYear
                );
        }

        if (postTaxResult) {
            postTaxResult.textContent =
                currency(
                    result.deductions.posttax /
                    result.periodsPerYear
                );
        }

        /* -------------------------------------------------------
           Pay summary
           ------------------------------------------------------- */

        if (weeklyPay) {
            weeklyPay.textContent =
                currency(result.net.weekly);
        }

        if (biweeklyPay) {
            biweeklyPay.textContent =
                currency(result.net.biweekly);
        }

        if (semimonthlyPay) {
            semimonthlyPay.textContent =
                currency(result.net.semimonthly);
        }

        if (monthlyPay) {
            monthlyPay.textContent =
                currency(result.net.monthly);
        }

        if (annualPay) {
            annualPay.textContent =
                currency(result.net.annual);
        }

        /* -------------------------------------------------------
           Chart
           ------------------------------------------------------- */

        updateChart(result);

        /* -------------------------------------------------------
           Public result
           ------------------------------------------------------- */

        window.paycheckMintResult = result;

        return result;
    }

    /* ---------------------------------------------------------
       Donut chart
       --------------------------------------------------------- */

    function updateChart(result) {
        if (!paycheckChart) {
            return;
        }

        const net =
            Math.max(0, result.net.annual);

        const federal =
            Math.max(0, result.federal.tax);

        const ficaTax =
            Math.max(0, result.fica.total);

        const stateTaxAmount =
            Math.max(0, result.state.tax);

        const deductions =
            Math.max(
                0,
                result.deductions.total
            );

        const total =
            net +
            federal +
            ficaTax +
            stateTaxAmount +
            deductions;

        if (total <= 0) {
            paycheckChart.style.background =
                "var(--line)";
        } else {
            const netEnd =
                (net / total) * 100;

            const federalEnd =
                netEnd +
                (federal / total) * 100;

            const ficaEnd =
                federalEnd +
                (ficaTax / total) * 100;

            const stateEnd =
                ficaEnd +
                (stateTaxAmount / total) * 100;

            paycheckChart.style.background =
                `conic-gradient(
          var(--chart-net) 0 ${netEnd}%,
          var(--chart-federal) ${netEnd}% ${federalEnd}%,
          var(--chart-fica) ${federalEnd}% ${ficaEnd}%,
          var(--chart-state) ${ficaEnd}% ${stateEnd}%,
          var(--chart-deductions) ${stateEnd}% 100%
        )`;
        }

        if (chartNet) {
            chartNet.textContent =
                currency(net);
        }

        /* -------------------------------------------------------
           Legend
           ------------------------------------------------------- */

        if (legendNet) {
            legendNet.textContent =
                currency(net);
        }

        if (legendFederal) {
            legendFederal.textContent =
                currency(federal);
        }

        if (legendFica) {
            legendFica.textContent =
                currency(ficaTax);
        }

        if (legendState) {
            legendState.textContent =
                currency(stateTaxAmount);
        }

        if (legendDeductions) {
            legendDeductions.textContent =
                currency(deductions);
        }
    }

    /* ---------------------------------------------------------
       Calculate button
       --------------------------------------------------------- */

    calculateButton?.addEventListener(
        "click",
        calculate
    );

    /* ---------------------------------------------------------
       Live calculation
       --------------------------------------------------------- */

    const inputs =
        document.querySelectorAll(
            "input, select"
        );

    inputs.forEach((input) => {
        input.addEventListener(
            "input",
            calculate
        );

        input.addEventListener(
            "change",
            calculate
        );
    });

    /* ---------------------------------------------------------
       Advanced options
       --------------------------------------------------------- */

    const advanced =
        document.querySelector(
            ".advanced-options"
        );

    if (advanced) {
        advanced.addEventListener(
            "toggle",
            calculate
        );
    }

    /* ---------------------------------------------------------
       Initial mode
       --------------------------------------------------------- */

    setMode("salary");

    /* ---------------------------------------------------------
       Initial calculation
       --------------------------------------------------------- */

    calculate();
});