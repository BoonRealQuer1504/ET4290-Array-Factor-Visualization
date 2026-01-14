let chart;
let polarChart;

document.addEventListener("DOMContentLoaded", function () {
    // 1. Biểu đồ Cartesian
    chart = new Chart(document.getElementById('patternChart').getContext('2d'), {
        type: 'line',
        data: { datasets: [] },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { type: 'linear', min: -180, max: 180, title: { display: true, text: 'Góc θ (độ)' }, ticks: { stepSize: 30 } },
                y: { min: -40, max: 0, title: { display: true, text: 'Gain (dB)' } }
            },
            plugins: { legend: { position: 'top' } }
        }
    });

    // 2. Biểu đồ Polar (Đã sửa startAngle: 0 để 0 độ ở hướng 12 giờ)
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

    document.getElementById('arrayForm').addEventListener('submit', function (e) {
        e.preventDefault();

        chart.data.datasets = [];
        polarChart.data.datasets = [];

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

        // Quét 360 độ để lấy dữ liệu
        for (let th = 0; th <= 360; th += 1) {
            const th_rad = (th * Math.PI) / 180;
            const psi = (2 * Math.PI * d_lambda * Math.cos(th_rad)) + beta_rad;

            const af = Math.abs(psi) < 1e-10 
                ? 1 
                : Math.abs( Math.sin((N * psi) / 2) / (N * Math.sin(psi / 2)) );
            
            let db = 20 * Math.log10(af + 1e-12);
            if (db < -40) db = -40;

            // Dữ liệu cho Polar (0 đến 360)
            polarData.push(db);
            polarLabels.push(th % 30 === 0 ? th + "°" : "");

            // Dữ liệu cho Cartesian (Chuyển sang dải -180 đến 180)
            theta.push(th > 180 ? th - 360 : th);
            pattern_dB.push(db);
        }

        const color = `blue`;

        // Sắp xếp dữ liệu Cartesian theo X tăng dần để không bị đường kẻ ngang nối ngược
        const sortedData = theta.map((th, i) => ({ x: th, y: pattern_dB[i] }))
                                .sort((a, b) => a.x - b.x);

        // Vẽ Cartesian
        chart.data.datasets.push({
            label: `N=${N}, β=${beta_deg}°`,
            data: sortedData,
            borderColor: color,
            borderWidth: 2,
            pointRadius: 0
        });
        chart.update();

        // Vẽ Polar
        polarChart.data.labels = polarLabels;
        polarChart.data.datasets.push({
            data: polarData,
            borderColor: color,
            borderWidth: 2,
            pointRadius: 0
        });
        polarChart.update();

        calculatePerformance(theta, pattern_dB, N, d_lambda);
        updateTableHorizontal(theta, pattern_dB);
    });

    document.getElementById('clearBtn').addEventListener('click', () => {
        chart.data.datasets = []; chart.update();
        polarChart.data.datasets = []; polarChart.update();
        document.getElementById('resultsTable').innerHTML = '';
        ['hpbw-val', 'sll-val', 'fnbw-val', 'dir-val'].forEach(id => document.getElementById(id).innerText = '-');
    });

    function updateTableHorizontal(theta, dB) {
        let filtered = theta.map((th, i) => ({th, db: dB[i]}))
                            .filter(v => v.th >= -180 && v.th <= 180 && v.th % 20 === 0)
                            .sort((a, b) => a.th - b.th);
        let html = '<div style="overflow-x: auto;"><table border="1" style="width:100%; border-collapse: collapse;">';
        html += '<tr style="background:#eee;"><th>θ</th>' + filtered.map(v => `<td>${v.th}</td>`).join('') + '</tr>';
        html += '<tr><th>dB</th>' + filtered.map(v => `<td>${v.db.toFixed(1)}</td>`).join('') + '</tr></table></div>';
        document.getElementById('resultsTable').innerHTML = html;
    }

    function calculatePerformance(theta, dB, N, d_lambda) {
        const maxDB = Math.max(...dB);
        const centerIdx = dB.indexOf(maxDB);

        let left3dB = centerIdx;
        while (left3dB > 0 && dB[left3dB] > maxDB - 3) left3dB--;
        let right3dB = centerIdx;
        while (right3dB < dB.length - 1 && dB[right3dB] > maxDB - 3) right3dB++;
        const hpbw = Math.abs(theta[right3dB] - theta[left3dB]);

        let leftNull = centerIdx;
        while (leftNull > 0 && dB[leftNull] >= dB[leftNull - 1]) leftNull--;
        let rightNull = centerIdx;
        while (rightNull < dB.length - 1 && dB[rightNull] >= dB[rightNull + 1]) rightNull++;
        const fnbw = Math.abs(theta[rightNull] - theta[leftNull]);

        let maxSideLobe = -Infinity;
        for (let i = 0; i < dB.length; i++) {
            if (i < leftNull || i > rightNull) {
                if (dB[i] > maxSideLobe) maxSideLobe = dB[i];
            }
        }
        const sllRelative = maxSideLobe - maxDB;

        const directivityVal = 2 * N * d_lambda;
        const directivityDB = 10 * Math.log10(directivityVal);

        document.getElementById('hpbw-val').innerText = (hpbw > 0) ? hpbw.toFixed(2) : "N/A";
        document.getElementById('sll-val').innerText = (isFinite(sllRelative) && sllRelative < 0) ? sllRelative.toFixed(2) : "N/A";
        document.getElementById('fnbw-val').innerText = (fnbw > 0) ? fnbw.toFixed(2) : "N/A";
        document.getElementById('dir-val').innerText = (directivityDB > 0) ? directivityDB.toFixed(2) : "N/A";
    }
});