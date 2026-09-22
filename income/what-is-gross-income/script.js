(function () {
    "use strict";

    const $ = (id) => document.getElementById(id);

    const form = $("grossIncomeForm");
    const incomeType = $("incomeType");

    const hourlyFields = $("hourlyFields");
    const salaryFields = $("salaryFields");

    const calculatorResult = $("calculatorResult");

    const annualResult = $("annualResult");
    const weeklyResult = $("weeklyResult");
    const biweeklyResult = $("biweeklyResult");
    const monthlyResult = $("monthlyResult");
    const hourlyResult = $("hourlyResult");

    const currency = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0
    });

    function number(id) {
        const value = parseFloat($(id).value);
        return Number.isFinite(value) ? Math.max(0, value) : 0;
    }

    function updateIncomeFields() {
        const hourly = incomeType.value === "hourly";

        hourlyFields.hidden = !hourly;
        salaryFields.hidden = hourly;
    }

    function calculateGrossIncome() {
        let regularAnnual = 0;
        let overtimeAnnual = 0;

        if (incomeType.value === "hourly") {
            const rate = number("hourlyRate");
            const hours = number("hoursPerWeek");
            const weeks = number("weeksPerYear");

            const overtimeHours = number("overtimeHours");
            const overtimeMultiplier = number("overtimeMultiplier");

            regularAnnual = rate * hours * weeks;

            overtimeAnnual =
                rate *
                overtimeHours *
                overtimeMultiplier *
                weeks;
        } else {
            regularAnnual = number("annualSalary");
        }

        const bonus = number("bonus");
        const commission = number("commission");
        const tips = number("tips");
        const otherIncome = number("otherIncome");

        const annual =
            regularAnnual +
            overtimeAnnual +
            bonus +
            commission +
            tips +
            otherIncome;

        const weekly = annual / 52;
        const biweekly = annual / 26;
        const monthly = annual / 12;

        let hourly = 0;

        if (incomeType.value === "hourly") {
            const hours = number("hoursPerWeek");

            if (hours > 0) {
                hourly = annual / (hours * 52);
            }
        } else {
            hourly = annual / (40 * 52);
        }

        annualResult.textContent = currency.format(annual);
        weeklyResult.textContent = currency.format(weekly);
        biweeklyResult.textContent = currency.format(biweekly);
        monthlyResult.textContent = currency.format(monthly);
        hourlyResult.textContent = currency.format(hourly);

        calculatorResult.hidden = false;
    }

    incomeType.addEventListener("change", updateIncomeFields);

    form.addEventListener("submit", function (event) {
        event.preventDefault();
        calculateGrossIncome();
    });

    updateIncomeFields();
    calculateGrossIncome();

})();