// --- 1. Main Line Chart Configuration (Chart.js) ---
const ctx = document.getElementById('resourceChart').getContext('2d');

// Data generation to mimic the video curve
// Days 1-10 (Historical), Days 11-14 (Forecast)
const labels = ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7', 'Day 8', 'Day 9', 'Day 10', 'Day 11', 'Day 12', 'Day 13', 'Day 14'];

const resourceChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: labels,
        datasets: [
            // --- BEDS ---
            {
                label: 'Beds',
                data: [45, 48, 47, 50, 52, 51, 53, 55, 54, 56, null, null, null, null],
                borderColor: '#00f0b5',
                tension: 0.4,
                borderWidth: 2,
                pointRadius: 0
            },
            {
                label: 'Beds (Forecast)',
                data: [null, null, null, null, null, null, null, null, null, 56, 58, 60, 62, 65],
                borderColor: '#00f0b5',
                borderDash: [5, 5],
                tension: 0.4,
                borderWidth: 2,
                pointRadius: 0
            },
            // --- ICU ---
            {
                label: 'ICU',
                data: [70, 72, 75, 74, 78, 80, 82, 85, 87, 88, null, null, null, null],
                borderColor: '#E31A1A',
                tension: 0.4,
                borderWidth: 2,
                pointRadius: 0
            },
            {
                label: 'ICU (Forecast)',
                data: [null, null, null, null, null, null, null, null, null, 88, 90, 92, 95, 97],
                borderColor: '#E31A1A',
                borderDash: [5, 5],
                tension: 0.4,
                borderWidth: 2,
                pointRadius: 0
            },
            // --- VENTS ---
            {
                label: 'Ventilators',
                data: [30, 32, 35, 33, 36, 38, 37, 40, 42, 45, null, null, null, null],
                borderColor: '#0a1f44',
                tension: 0.4,
                borderWidth: 2,
                pointRadius: 0
            },
            {
                label: 'Ventilators (Forecast)',
                data: [null, null, null, null, null, null, null, null, null, 45, 46, 47, 48, 50],
                borderColor: '#0a1f44',
                borderDash: [5, 5],
                tension: 0.4,
                borderWidth: 2,
                pointRadius: 0
            }
        ]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false }, // Using custom legend
            tooltip: { mode: 'index', intersect: false }
        },
        scales: {
            y: {
                beginAtZero: true,
                max: 100,
                grid: { color: '#F0F0F0' },
                ticks: { callback: function (value) { return value + '%' } }
            },
            x: {
                grid: { display: false }
            }
        }
    }
});

// --- 2. Feature Importance Bar Chart ---
const featureCtx = document.getElementById('featureChart').getContext('2d');
const featureChart = new Chart(featureCtx, {
    type: 'bar',
    data: {
        labels: ['7-Day Admission', 'Seasonal Pattern', 'Discharge Rate', 'Emerg. Arrivals'],
        datasets: [{
            label: 'Importance %',
            data: [34, 22, 18, 14],
            backgroundColor: ['#00f0b5', '#0a1f44', '#e6fff9', '#e6fff9'],
            borderRadius: 5,
            barThickness: 15
        }]
    },
    options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
            x: { display: false, max: 40 },
            y: { grid: { display: false } }
        }
    }
});

// --- 3. Simulation Logic ---
const currentRisk = 97; // Base risk at 0 beds added
const riskPerBed = 2.5; // Each bed lowers risk by 2.5%

function updateSimulation(val) {
    val = parseInt(val);
    document.getElementById('bedCountDisplay').innerText = val;

    // Calculate new risk
    let newRisk = currentRisk - (val * riskPerBed);
    newRisk = Math.max(0, newRisk).toFixed(0); // Ensure non-negative and round

    // Update DOM
    const riskEl = document.getElementById('projectedRiskVal');
    riskEl.innerText = newRisk + "%";

    // Update Label Color based on threshold
    const labelEl = document.getElementById('projectedLabel');
    if (newRisk > 90) {
        labelEl.className = "status-tag tag-crit";
        labelEl.innerText = "CRITICAL";
        riskEl.style.color = "var(--status-critical)";
    } else if (newRisk > 70) {
        labelEl.className = "status-tag tag-risk";
        labelEl.innerText = "HIGH RISK";
        riskEl.style.color = "#FFB547";
    } else {
        labelEl.className = "status-tag tag-stable";
        labelEl.innerText = "MANAGED";
        riskEl.style.color = "var(--status-stable)";
    }

    // Update Text Badge
    const reductionAmount = (currentRisk - newRisk).toFixed(1);
    document.getElementById('reductionText').innerHTML =
        `Adding <strong>${val}</strong> beds reduces ICU risk by <strong>${reductionAmount}%</strong>`;
}

// Helper for +/- buttons
function updateSlider(change) {
    const slider = document.getElementById('bedSlider');
    let currentVal = parseInt(slider.value);
    let newVal = currentVal + change;

    if (newVal >= slider.min && newVal <= slider.max) {
        slider.value = newVal;
        updateSimulation(newVal);
    }
}

// --- 4. Accordion Logic ---
function toggleAlert(element) {
    // Close all others (optional, mimic video behavior where others stay)
    // element.classList.toggle('open'); 

    // For video accuracy: just toggle specific class
    if (element.classList.contains('open')) {
        element.classList.remove('open');
    } else {
        element.classList.add('open');
    }
}
