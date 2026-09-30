/* ==========================================================================
   PAYCHECKMINT - MAIN JAVASCRIPT
   ========================================================================== */

document.addEventListener("DOMContentLoaded", function () {
    loadSharedComponents();
});

/**
 * Loads shared navbar and footer components asynchronously,
 * then initializes all interactive components after injection.
 */
async function loadSharedComponents() {
    const navbar = document.getElementById("site-navbar");
    const footer = document.getElementById("site-footer");

    // Always fetch relative to the domain root regardless of subpage depth
    const root = window.location.origin;

    try {
        const requests = [];

        if (navbar) {
            requests.push(
                fetch(`${root}/components/navbar.html`)
                    .then(res => {
                        if (!res.ok) throw new Error(`Navbar HTTP ${res.status}`);
                        return res.text();
                    })
                    .then(html => { navbar.innerHTML = html; })
            );
        }

        if (footer) {
            requests.push(
                fetch(`${root}/components/footer.html`)
                    .then(res => {
                        if (!res.ok) throw new Error(`Footer HTTP ${res.status}`);
                        return res.text();
                    })
                    .then(html => { footer.innerHTML = html; })
            );
        }

        await Promise.all(requests);
    } catch (err) {
        console.error("Component fetch failed:", err);
    }
}

document.addEventListener("DOMContentLoaded", loadSharedComponents);

/**
 * Handles Navbar Dropdowns, Mobile Menu Navigation, and Accessibility
 */
function initializeNavbar() {
    const dropdowns = document.querySelectorAll(".pm-nav-dropdown");
    const header = document.getElementById("site-header");

    // Toggle Desktop & Touch Dropdowns
    dropdowns.forEach(dropdown => {
        const button = dropdown.querySelector(".pm-nav-dropdown-button");

        if (button) {
            button.addEventListener("click", function (event) {
                event.stopPropagation();
                const isOpen = dropdown.classList.contains("is-open");

                // Close all other dropdowns
                dropdowns.forEach(d => {
                    d.classList.remove("is-open");
                    const btn = d.querySelector(".pm-nav-dropdown-button");
                    if (btn) btn.setAttribute("aria-expanded", "false");
                });

                // Toggle current
                if (!isOpen) {
                    dropdown.classList.add("is-open");
                    button.setAttribute("aria-expanded", "true");
                }
            });
        }
    });

    // Close dropdowns when clicking outside
    document.addEventListener("click", function (event) {
        if (!event.target.closest(".pm-nav-dropdown")) {
            dropdowns.forEach(dropdown => {
                dropdown.classList.remove("is-open");
                const button = dropdown.querySelector(".pm-nav-dropdown-button");
                if (button) button.setAttribute("aria-expanded", "false");
            });
        }
    });

    // Mobile Navigation Drawer Toggle
    const mobileToggle = document.getElementById("mobileToggle");
    const mobileNav = document.getElementById("mobileNav");

    if (mobileToggle && mobileNav) {
        mobileToggle.addEventListener("click", function (event) {
            event.stopPropagation();
            const isOpen = mobileNav.classList.toggle("is-open");
            mobileToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
        });
    }

    // Mobile Submenu Dropdown Toggle
    const mobileFinanceToggle = document.getElementById("mobileFinanceToggle");
    const mobileFinanceLinks = document.getElementById("mobileFinanceLinks");

    if (mobileFinanceToggle && mobileFinanceLinks) {
        mobileFinanceToggle.addEventListener("click", function (event) {
            event.stopPropagation();
            const isOpen = mobileFinanceLinks.classList.toggle("is-open");
            mobileFinanceToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
        });
    }

    // Header scroll behavior (Shadow on scroll)
    if (header) {
        window.addEventListener("scroll", function () {
            if (window.scrollY > 20) {
                header.classList.add("is-scrolled");
            } else {
                header.classList.remove("is-scrolled");
            }
        }, { passive: true });
    }
}

/**
 * Handles Global Site Search Toggle, Keyboard Events, and Query Filtering
 */
function setupSearch() {
    const searchToggle = document.getElementById("searchToggle");
    const mobileSearchButton = document.getElementById("mobileSearchButton");
    const searchPanel = document.getElementById("searchPanel");
    const searchInput = document.getElementById("siteSearch");
    const searchClose = document.getElementById("searchClose");
    const searchResults = document.getElementById("searchResults");
    const mobileNav = document.getElementById("mobileNav");

    if (!searchPanel || !searchInput) return;

    function openSearchPanel() {
        searchPanel.classList.add("is-open");
        if (searchToggle) {
            searchToggle.setAttribute("aria-expanded", "true");
            searchToggle.setAttribute("aria-label", "Close search");
        }
        setTimeout(() => searchInput.focus(), 100);
    }

    function closeSearchPanel() {
        searchPanel.classList.remove("is-open");
        if (searchToggle) {
            searchToggle.setAttribute("aria-expanded", "false");
            searchToggle.setAttribute("aria-label", "Open search");
        }
        searchInput.value = "";
        if (searchResults) searchResults.innerHTML = "";
    }

    // Toggle Search Bar Panel
    if (searchToggle) {
        searchToggle.addEventListener("click", function (event) {
            event.preventDefault();
            event.stopPropagation();

            if (searchPanel.classList.contains("is-open")) {
                closeSearchPanel();
            } else {
                openSearchPanel();
            }
        });
    }

    // Mobile Search Button in Drawer
    if (mobileSearchButton) {
        mobileSearchButton.addEventListener("click", function (event) {
            event.preventDefault();
            if (mobileNav) mobileNav.classList.remove("is-open");
            openSearchPanel();
        });
    }

    // Close Search Panel Button
    if (searchClose) {
        searchClose.addEventListener("click", function (event) {
            event.preventDefault();
            closeSearchPanel();
        });
    }

    // Prevent clicks inside search panel from bubbling up to document
    searchPanel.addEventListener("click", function (event) {
        event.stopPropagation();
    });

    // Close on Escape Key
    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape" && searchPanel.classList.contains("is-open")) {
            closeSearchPanel();
        }
    });

    // Close when clicking outside search panel
    document.addEventListener("click", function (event) {
        if (!searchPanel.contains(event.target) && (!searchToggle || !searchToggle.contains(event.target))) {
            if (searchPanel.classList.contains("is-open")) {
                closeSearchPanel();
            }
        }
    });

    // Live Search Filter Routine
    const searchablePages = [
        { title: "Paycheck Tax Calculator", url: "/paycheck-tax-calculator/", description: "Calculate accurate net pay and taxes." },
        { title: "Take-Home Pay Calculator", url: "/take-home-pay-calculator/", description: "Estimate your actual paycheck total after deductions." },
        { title: "Hourly Paycheck Calculator", url: "/hourly-paycheck-calculator/", description: "Calculate income based on hourly wage and hours worked." },
        { title: "Overtime Pay Calculator", url: "/overtime-pay-calculator/", description: "Compute overtime rates and total extra wages." },
        { title: "Salary Paycheck Calculator", url: "/salary-paycheck-calculator/", description: "Break down annual salary into per-paycheck earnings." },
        { title: "Income Overview", url: "/income/", description: "Learn about taxable income, gross wages, and take-home pay." },
        { title: "Finance Overview", url: "/finance/", description: "Guides on managing personal finances and budgeting strategies." },
        { title: "Budgeting Guides", url: "/finance/budgeting/", description: "Strategies for budgeting your paycheck effectively." }
    ];

    searchInput.addEventListener("input", function () {
        if (!searchResults) return;

        const query = this.value.trim().toLowerCase();

        if (query.length === 0) {
            searchResults.innerHTML = "";
            return;
        }

        const filteredResults = searchablePages.filter(page =>
            page.title.toLowerCase().includes(query) ||
            page.description.toLowerCase().includes(query)
        );

        renderSearchResults(filteredResults, query);
    });

    function renderSearchResults(results, query) {
        if (!searchResults) return;

        if (results.length === 0) {
            searchResults.innerHTML = `<p class="pm-search-no-results">No results found for "${escapeHTML(query)}"</p>`;
            return;
        }

        const html = results.map(item => `
            <a href="${item.url}" class="pm-search-result-item">
                <span class="pm-search-result-title">${escapeHTML(item.title)}</span>
                <span class="pm-search-result-desc">${escapeHTML(item.description)}</span>
            </a>
        `).join("");

        searchResults.innerHTML = html;
    }

    function escapeHTML(str) {
        return str.replace(/[&<>'"]/g,
            tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
        );
    }
}