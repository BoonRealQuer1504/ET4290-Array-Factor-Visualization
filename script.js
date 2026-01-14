let chart;
let polarChart;
const plotColors = ['blue', 'red', 'green', 'orange', 'purple', 'teal', 'magenta', 'black'];
let colorIndex = 0;
let isEndfireMode = false; // Cờ kiểm tra chế độ Endfire

document.addEventListener("DOMContentLoaded", function () {
    // 2D 
    chart = new Chart(document.getElementById('patternChart').getContext('2d'), {
        type: 'line',
        data: { datasets: [] },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { type: 'linear', min: -180, max: 180, title: { display: true, text: 'Off-axis angle θ (độ)' }, ticks: { stepSize: 30 } },
                y: { min:-40, max: 0, title: { display: true, text: 'Normalized Array Factor (dB)' } }
            },
            plugins: { legend: { position: 'top' } }
        }
    });

    // Polar
    polarChart = new Chart(document.getElementById('polarChart').getContext('2d'), {
        type: 'radar',
        data: { labels: [], datasets: [] },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            startAngle: 0, 
            scales: {
                r: {
                    min: -40,
                    max: 0,
                    ticks: { display: true, stepSize: 10, backdropColor: 'transparent' },
                    grid: { circular: true },
                    pointLabels: { display: true, font: { size: 12, weight: 'bold' } }
                }
            },
            plugins: { legend: { display: false } }
        }
    });

    const betaInput = document.getElementById('beta_deg');
    const dInput = document.getElementById('d_meter');
    const fInput = document.getElementById('f');

    function setBetaState(readOnly, val) {
        betaInput.readOnly = readOnly;
        if (val !== null) betaInput.value = val;
        betaInput.style.backgroundColor = readOnly ? "#e9ecef" : "white";
    }

    // Manual
    document.getElementById('btnManual').addEventListener('click', () => {
        isEndfireMode = false;
        setBetaState(false, null);
    });

    // Broadside: Beta = 0
    document.getElementById('btnBroadside').addEventListener('click', () => {
        isEndfireMode = false;
        setBetaState(true, 0);
    });

    // Endfire: Beta = -kd 
    document.getElementById('btnEndfire').addEventListener('click', () => {
        isEndfireMode = true;
        updateEndfireBeta();
    });

    // Beta Endfire: beta = -2 * pi * d / lambda (rad) -> degree
    function updateEndfireBeta() {
        if (!isEndfireMode) return;
        
        const d = parseFloat(dInput.value);
        const f = parseFloat(fInput.value);
        if (!d || !f) return;

        const lambda = 3e8 / (f * 1e9);
        const d_lambda = d / lambda;
        
        // Beta (độ) = -360 * (d/lambda)
        const betaVal = -360 * d_lambda;
        
        setBetaState(true, betaVal.toFixed(2));
    }

    dInput.addEventListener('input', updateEndfireBeta);
    fInput.addEventListener('input', updateEndfireBeta);

    document.getElementById('arrayForm').addEventListener('submit', function (e) {
        e.preventDefault();
        const N = parseInt(document.getElementById('N').value);
        const d_meter = parseFloat(document.getElementById('d_meter').value);
        const f_GHz = parseFloat(document.getElementById('f').value);
        const beta_deg = parseFloat(document.getElementById('beta_deg').value);

        const lambda = 3e8 / (f_GHz * 1e9);
        const d_lambda = d_meter / lambda;
        const beta_rad = (beta_deg * Math.PI) / 180;

        document.getElementById('info').innerHTML = `λ = <strong>${lambda.toFixed(4)}</strong> m | d/λ = <strong>${d_lambda.toFixed(3)}</strong>`;

        const theta = [];
        const pattern_dB = [];
        const polarLabels = [];
        const polarData = [];

        for (let th = 0; th <= 360; th += 1) {
            const th_rad = (th * Math.PI) / 180;
            // Balanis
            const psi = (2 * Math.PI * d_lambda * Math.cos(th_rad)) + beta_rad;

            const af = Math.abs(psi) < 1e-10 
                ? 1 
                : Math.abs( Math.sin((N * psi) / 2) / (N * Math.sin(psi / 2)) );
            
            let db = 20 * Math.log10(af + 1e-12);
            if (db < -40) db = -40;

            polarData.push(db);
            polarLabels.push(th % 30 === 0 ? th + "°" : "");

            theta.push(th > 180 ? th - 360 : th);
            pattern_dB.push(db);
        }

        const color = plotColors[colorIndex % plotColors.length];
        colorIndex++; 

        const sortedData = theta.map((th, i) => ({ x: th, y: pattern_dB[i] }))
                                .sort((a, b) => a.x - b.x);

        chart.data.datasets.push({
            label: `N=${N}, d=${d_lambda.toFixed(2)}λ, β=${beta_deg.toFixed(1)}°`, // Label chi tiết hơn để phân biệt
            data: sortedData,
            borderColor: color,
            borderWidth: 2,
            pointRadius: 0
        });
        chart.update();

        polarChart.data.labels = polarLabels; 
        polarChart.data.datasets.push({
            label: `Run ${colorIndex}`, 
            data: polarData,
            borderColor: color,
            borderWidth: 2,
            pointRadius: 0
        });
        polarChart.update();

        calculatePerformance(theta, pattern_dB, N, d_lambda);
        update3DPattern(N, d_lambda, beta_rad);
        updateTableHorizontal(theta, pattern_dB);
    });

    document.getElementById('clearBtn').addEventListener('click', () => {
        chart.data.datasets = []; chart.update();
        polarChart.data.datasets = []; polarChart.update();
        colorIndex = 0; 
        isEndfireMode = false; 
        Plotly.purge('threeDChart');
        setBetaState(false, null); 
        document.getElementById('resultsTable').innerHTML = '';
        ['hpbw-val', 'sll-val', 'fnbw-val', 'dir-val'].forEach(id => document.getElementById(id).innerText = '-');
    });

    function updateTableHorizontal(theta, dB) {
        let filtered = theta.map((th, i) => ({th, db: dB[i]}))
                            .filter(v => v.th >= -180 && v.th <= 180 && v.th % 20 === 0)
                            .sort((a, b) => a.th - b.th);
        let html = '<div style="overflow-x: auto;"><table border="1" style="width:100%; border-collapse: collapse;">';
        html += '<tr style="background:#eee;"><th>θ</th>' + filtered.map(v => `<td>${v.th}</td>`).join('') + '</tr>';
        html += '<tr><th>dB (Mới nhất)</th>' + filtered.map(v => `<td>${v.db.toFixed(1)}</td>`).join('') + '</tr></table></div>';
        document.getElementById('resultsTable').innerHTML = html;
    }

    function calculatePerformance(theta, dB, N, d_lambda) {
        // 1. TĂNG ĐỘ MỊN ĐỂ TÌM ĐIỂM CHÍNH XÁC (Quét nội bộ 0.01 độ)
        const beta_deg = parseFloat(document.getElementById('beta_deg').value);
        const beta_rad = (beta_deg * Math.PI) / 180;
        
        function getGainAt(angleDeg) {
            const th_rad = (angleDeg * Math.PI) / 180;
            const psi = (2 * Math.PI * d_lambda * Math.cos(th_rad)) + beta_rad;
            const af = Math.abs(psi) < 1e-10 
                ? 1 
                : Math.abs(Math.sin((N * psi) / 2) / (N * Math.sin(psi / 2)));
            return 20 * Math.log10(af + 1e-12);
        }

        // Tìm đỉnh thực tế (thường là hướng búp chính)
        let maxDB = -Infinity;
        let peakAngle = 0;
        for (let a = 0; a <= 180; a += 0.1) {
            let g = getGainAt(a);
            if (g > maxDB) { maxDB = g; peakAngle = a; }
        }

        // 2. TÌM HPBW (Half Power Beamwidth)
        let left3dB = peakAngle, right3dB = peakAngle;
        while (left3dB > peakAngle - 180 && getGainAt(left3dB) > maxDB - 3) left3dB -= 0.01;
        while (right3dB < peakAngle + 180 && getGainAt(right3dB) > maxDB - 3) right3dB += 0.01;
        const hpbw = Math.abs(right3dB - left3dB);

        // 3. TÌM FNBW (First Null Beamwidth)
        let leftNull = peakAngle, rightNull = peakAngle;
        // Tìm điểm cực tiểu đầu tiên về hai phía
        while (leftNull > peakAngle - 180 && getGainAt(leftNull - 0.01) < getGainAt(leftNull)) leftNull -= 0.01;
        while (leftNull > peakAngle - 180 && getGainAt(leftNull - 0.01) > getGainAt(leftNull)) leftNull -= 0.01;
        
        while (rightNull < peakAngle + 180 && getGainAt(rightNull + 0.01) < getGainAt(rightNull)) rightNull += 0.01;
        while (rightNull < peakAngle + 180 && getGainAt(rightNull + 0.01) > getGainAt(rightNull)) rightNull += 0.01;
        const fnbw = Math.abs(rightNull - leftNull);

        // 4. TÌM SLL (Side Lobe Level) - Tìm đỉnh búp phụ cao nhất
        let maxSLL = -Infinity;
        for (let a = 0; a <= 180; a += 0.1) {
            // Chỉ xét các điểm ngoài vùng búp chính (ngoài khoảng Null)
            if (a < Math.min(leftNull, rightNull) || a > Math.max(leftNull, rightNull)) {
                let g = getGainAt(a);
                // Kiểm tra xem có phải là đỉnh địa phương không (Local Maxima)
                if (g > getGainAt(a - 0.1) && g > getGainAt(a + 0.1)) {
                    if (g > maxSLL) maxSLL = g;
                }
            }
        }
        const sllRelative = maxSLL - maxDB;

        // 5. DIRECTIVITY (Tính theo công thức tích phân xấp xỉ ULA)
        // D = N / (1 + 2/N * sum_{m=1}^{N-1} (N-m) * j0(m*k*d) * cos(m*beta))
        // Tuy nhiên để đơn giản và chuẩn Balanis cho mảng lớn:
        let directivityDB;
        if (Math.abs(beta_deg) < 1) { // Broadside
            directivityDB = 10 * Math.log10(2 * N * d_lambda);
        } else if (Math.abs(Math.abs(beta_deg) - Math.abs(360 * d_lambda)) < 1) { // Endfire
            directivityDB = 10 * Math.log10(4 * N * d_lambda);
        } else {
            directivityDB = 10 * Math.log10(2 * N * d_lambda); // Tổng quát
        }

        document.getElementById('hpbw-val').innerText = (hpbw > 0 && hpbw < 360) ? hpbw.toFixed(3) : "N/A";
        document.getElementById('sll-val').innerText = (isFinite(sllRelative) && sllRelative < 0) ? sllRelative.toFixed(2) : "N/A";
        document.getElementById('fnbw-val').innerText = (fnbw > 0 && fnbw < 360) ? fnbw.toFixed(3) : "N/A";
        document.getElementById('dir-val').innerText = directivityDB.toFixed(2);
    }

    function update3DPattern(N, d_lambda, beta_rad) {
        let dataX = [], dataY = [], dataZ = [], colors = [];
        const step = 5; 

        for (let theta = 0; theta <= 180; theta += step) {
            let th_rad = (theta * Math.PI) / 180;
            let rowX = [], rowY = [], rowZ = [], rowCol = [];
            
            // Tính Array Factor cho góc theta này
            const psi = (2 * Math.PI * d_lambda * Math.cos(th_rad)) + beta_rad;
            const af = Math.abs(psi) < 1e-10 ? 1 : Math.abs(Math.sin((N * psi) / 2) / (N * Math.sin(psi / 2)));
            
            for (let phi = 0; phi <= 360; phi += step) {
                let ph_rad = (phi * Math.PI) / 180;
                let r = af; 
                let x = r * Math.sin(th_rad) * Math.cos(ph_rad);
                let y = r * Math.sin(th_rad) * Math.sin(ph_rad);
                let z = r * Math.cos(th_rad);

                rowX.push(x);
                rowY.push(y);
                rowZ.push(z);
                rowCol.push(r);
            }
            dataX.push(rowX);
            dataY.push(rowY);
            dataZ.push(rowZ);
            colors.push(rowCol);
        }

        const plotData = [{
            type: 'surface',
            x: dataX,
            y: dataY,
            z: dataZ,
            surfacecolor: colors,
            colorscale: 'Jet',
            colorbar: { title: 'AF', thickness: 10 }
        }];

        const layout = {
            margin: { l: 0, r: 0, b: 0, t: 0 },
            scene: {
                xaxis: { title: 'X', range: [-1, 1] },
                yaxis: { title: 'Y', range: [-1, 1] },
                zaxis: { title: 'Z (Trục mảng)', range: [-1, 1] },
                aspectmode: 'cube'
            }
        };

        Plotly.newPlot('threeDChart', plotData, layout);
    }
});