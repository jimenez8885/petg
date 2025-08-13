// Info prompt text for each slider (plain text for browser alert)
const sliderInfo = {
    'halfLife': 'Tracer Half-life: The time it takes for half of the radioactive tracer to decay. Shorter half-life means the tracer signal fades faster.',
    'tumorKin': 'Tumor Uptake Rate (k_in): How quickly the tumor tissue absorbs the tracer from the blood. Higher values make the tumor "light up" more.',
    'healthyKin': 'Healthy Tissue Uptake Rate (k_in): How quickly healthy tissue absorbs the tracer. Lower values make the tumor stand out more.',
    'dose': 'Injected Dose: The total amount of radioactive tracer injected. Higher doses increase the overall signal.',
    'noise': 'Detector Noise Level: Simulates random fluctuations in detected signal, similar to real PET scan measurements.'
};

function showSystemPrompt(id) {
    alert(sliderInfo[id]);
}
// Download chart data as CSV
function downloadCSV() {
    if (!curveData) return;
    let csv = 'Time (s),Tumor Activity,Healthy Activity\n';
    for (let i = 0; i < curveData.time_points.length; i++) {
        csv += `${curveData.time_points[i]},${curveData.avg_tumor[i]},${curveData.avg_healthy[i]}\n`;
    }
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pet_tracer_activity.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
    document.getElementById('downloadData').addEventListener('click', downloadCSV);
// PET Tracer Uptake Visualization
// Loads activity_map.json and activity_curves.json, renders heatmap and chart

let currentTimeIdx = 0;
let heatmapCanvas = document.getElementById('heatmap');
let ctx = heatmapCanvas.getContext('2d');
let chart = null;

// Color mapping for heatmap (blue-black-red-yellow)
function getColor(val, min, max) {
    const norm = (val - min) / (max - min);
    const r = Math.min(255, Math.max(0, Math.floor(255 * norm)));
    const g = Math.min(255, Math.max(0, Math.floor(255 * norm * 0.8)));
    const b = Math.min(255, Math.max(0, Math.floor(255 * (1 - norm))));
    return `rgb(${r},${g},${b})`;
}

// Draw heatmap for a given time index
function drawHeatmap(timeIdx) {
    const grid = activityData.activity[timeIdx];
    const size = activityData.grid_size;
    // Find min/max for color scaling
    let min = Infinity, max = -Infinity;
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            const v = grid[i][j];
            if (v < min) min = v;
            if (v > max) max = v;
        }
    }
    // Draw pixels
    const scale = heatmapCanvas.width / size;
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            ctx.fillStyle = getColor(grid[i][j], min, max);
            ctx.fillRect(j * scale, i * scale, scale, scale);
        }
    }
}

// Draw activity curves
function drawChart() {
    const labels = curveData.time_points;
    const tumor = curveData.avg_tumor;
    const healthy = curveData.avg_healthy;
    if (chart) chart.destroy();
    chart = new Chart(document.getElementById('activityChart').getContext('2d'), {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Tumor',
                    data: tumor,
                    borderColor: 'red',
                    fill: false
                },
                {
                    label: 'Healthy',
                    data: healthy,
                    borderColor: 'blue',
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'top' },
                title: { display: true, text: 'Average Activity Over Time' }
            },
            scales: {
                x: { title: { display: true, text: 'Time (s)' } },
                y: { title: { display: true, text: 'Activity' } }
            }
        }
    });
}

// Update time slider and heatmap
function updateTime(idx) {
    currentTimeIdx = idx;
    drawHeatmap(idx);
    document.getElementById('timeVal').textContent = activityData.time_points[idx];
}

// Initialize visualization
function init() {
    if (!activityData || !curveData) {
        alert('Please paste your simulation data into index.html as instructed.');
        return;
    }
    // Set time slider
    const timeSlider = document.getElementById('timeSlider');
    timeSlider.max = activityData.time_points.length - 1;
    timeSlider.value = 0;
    timeSlider.addEventListener('input', (e) => {
        updateTime(Number(e.target.value));
    });
    updateTime(0);
    drawChart();
}

// Sliders: update displayed value
['halfLife','tumorKin','healthyKin','dose','noise'].forEach(id => {
    const slider = document.getElementById(id);
    const valSpan = document.getElementById(id+'Val');
    slider.addEventListener('input', () => {
        valSpan.textContent = slider.value;
        // For now, just update display. Dynamic simulation can be added later.
    });
});

// Simulation parameters
const GRID_SIZE = 50;
const t_max = 600;
const dt = 1;

function getSliderValue(id) {
    return parseFloat(document.getElementById(id).value);
}

// Randomly generate tumor shape (center, radius, optionally irregular)
function createTissueType() {
    // Random center and radius
    const centerX = Math.floor(Math.random() * (GRID_SIZE * 0.6) + GRID_SIZE * 0.2);
    const centerY = Math.floor(Math.random() * (GRID_SIZE * 0.6) + GRID_SIZE * 0.2);
    const radius = Math.floor(Math.random() * 6) + 6; // radius 6-12
    // Optionally add irregularity
    const tissue_type = [];
    for (let i = 0; i < GRID_SIZE; i++) {
        tissue_type[i] = [];
        for (let j = 0; j < GRID_SIZE; j++) {
            let dist = Math.sqrt((i - centerX) ** 2 + (j - centerY) ** 2);
            // Add some random irregularity
            let irr = Math.sin(i * 0.3 + j * 0.2) * 2 + Math.random() * 2;
            if (dist + irr < radius) {
                tissue_type[i][j] = 1;
            } else {
                tissue_type[i][j] = 0;
            }
        }
    }
    return tissue_type;
}

function plasmaInput(t, dose, tau=60) {
    return dose * Math.exp(-t / tau);
}

function runSimulation() {
    // Get parameters from sliders
    const k_in_healthy = getSliderValue('healthyKin');
    const k_out_healthy = 0.02; // fixed for now
    const k_in_tumor = getSliderValue('tumorKin');
    const k_out_tumor = 0.005; // fixed for now
    const half_life_min = getSliderValue('halfLife');
    const half_life = half_life_min * 60;
    const lambda_decay = Math.log(2) / half_life;
    const injected_dose = getSliderValue('dose');
    const noise_level = getSliderValue('noise');

    const time_points = [];
    for (let t = 0; t <= t_max; t += dt) time_points.push(t);
    const tissue_type = createTissueType();
    // activity[time][i][j]
    const activity = Array(time_points.length).fill().map(() => Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(0)));

    for (let i = 0; i < GRID_SIZE; i++) {
        for (let j = 0; j < GRID_SIZE; j++) {
            const isTumor = tissue_type[i][j] === 1;
            const k_in = isTumor ? k_in_tumor : k_in_healthy;
            const k_out = isTumor ? k_out_tumor : k_out_healthy;
            let A = 0.0;
            for (let t_idx = 0; t_idx < time_points.length; t_idx++) {
                const t = time_points[t_idx];
                const Cp = plasmaInput(t, injected_dose);
                const dA = k_in * Cp - k_out * A - lambda_decay * A;
                A += dA * dt;
                // Poisson noise
                const noisy_A = noise_level > 0 ? poissonSample(Math.max(A, 0) * noise_level) / Math.max(noise_level, 1e-6) : A;
                activity[t_idx][i][j] = noisy_A;
            }
        }
    }

    // Compute average activity for tumor and healthy tissue
    const avg_tumor = [];
    const avg_healthy = [];
    for (let t_idx = 0; t_idx < time_points.length; t_idx++) {
        let tumor_sum = 0, tumor_count = 0, healthy_sum = 0, healthy_count = 0;
        for (let i = 0; i < GRID_SIZE; i++) {
            for (let j = 0; j < GRID_SIZE; j++) {
                if (tissue_type[i][j] === 1) {
                    tumor_sum += activity[t_idx][i][j];
                    tumor_count++;
                } else {
                    healthy_sum += activity[t_idx][i][j];
                    healthy_count++;
                }
            }
        }
        avg_tumor.push(tumor_sum / tumor_count);
        avg_healthy.push(healthy_sum / healthy_count);
    }

    // Tumor detection logic: stricter criteria
    let peakIdx = avg_tumor.indexOf(Math.max(...avg_tumor));
    let tumorPeak = avg_tumor[peakIdx];
    let healthyPeak = avg_healthy[peakIdx];
    let detectionResult = '';
    // Require tumor to be at least 30% brighter than healthy,
    // absolute tumor activity > 50,
    // and difference > 20 units
    if (
        tumorPeak > healthyPeak * 1.3 &&
        tumorPeak > 50 &&
        (tumorPeak - healthyPeak) > 20
    ) {
        detectionResult = 'Tumor detected!';
    } else {
        detectionResult = 'Tumor not detected. Try adjusting the settings.';
    }

    // Set global data
    activityData = {
        grid_size: GRID_SIZE,
        time_points: time_points,
        activity: activity,
        tissue_type: tissue_type
    };
    curveData = {
        time_points: time_points,
        avg_tumor: avg_tumor,
        avg_healthy: avg_healthy
    };
    // Show detection result
    const resultDiv = document.getElementById('detection-result');
    if (resultDiv) {
        resultDiv.textContent = detectionResult;
        resultDiv.style.color = detectionResult.includes('detected') ? '#2ecc40' : '#d7263d';
        resultDiv.style.background = detectionResult.includes('detected') ? '#f6fff6' : '#fff6f6';
    }
}

// Poisson random sample (Knuth's algorithm)
function poissonSample(lambda) {
    if (lambda <= 0) return 0;
    let L = Math.exp(-lambda);
    let k = 0;
    let p = 1;
    do {
        k++;
        p *= Math.random();
    } while (p > L);
    return k - 1;
}

function startSimulationAndRender() {
    runSimulation();
    // Set time slider
    const timeSlider = document.getElementById('timeSlider');
    timeSlider.max = activityData.time_points.length - 1;
    timeSlider.value = 0;
    timeSlider.addEventListener('input', (e) => {
        updateTime(Number(e.target.value));
    });
    updateTime(0);
    drawChart();
}

window.onload = () => {
    document.getElementById('startSim').addEventListener('click', startSimulationAndRender);
    // Sliders: update displayed value
    ['halfLife','tumorKin','healthyKin','dose','noise'].forEach(id => {
        const slider = document.getElementById(id);
        const valSpan = document.getElementById(id+'Val');
        slider.addEventListener('input', () => {
            valSpan.textContent = slider.value;
        });
        // Info icon click
        const infoIcon = document.getElementById('info-' + id);
        if (infoIcon) {
            infoIcon.addEventListener('click', (e) => {
                showSystemPrompt(id);
                e.stopPropagation();
            });
        }
    });
    // Optionally, run simulation on load
    startSimulationAndRender();
};
