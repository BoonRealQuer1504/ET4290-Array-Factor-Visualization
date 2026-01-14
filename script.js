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

    // 2. Biểu đồ Polar (Xoay 0 độ lên đỉnh, lưới tròn)
    polarChart = new Chart(document.getElementById('polarChart').getContext('2d'), {
        type: 'radar',
        data: { labels: [], datasets: [] },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            startAngle: -90, 
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

        // Xóa các dataset cũ để vẽ đè cái mới (hoặc bấm Clear All để sạch hoàn toàn)
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

        // Quét 360 độ để hình tròn đầy đủ
        for (let th = 0; th <= 360; th += 1) {
            const th_rad = (th * Math.PI) / 180;
            // Dùng Math.sin để búp chính nằm ngang giống mẫu bạn gửi
            const psi = (2 * Math.PI * d_lambda * Math.sin(th_rad)) + beta_rad;

            const af = Math.abs(psi) < 1e-10 
                ? 1 
                : Math.abs( Math.sin((N * psi) / 2) / (N * Math.sin(psi / 2)) );
            
            let db = 20 * Math.log10(af + 1e-12);
            if (db < -40) db = -40;

            theta.push(th > 180 ? th - 360 : th);
            pattern_dB.push(db);
            polarLabels.push(th % 30 === 0 ? th + "°" : "");
        }

        const color = `blue`;

        // Vẽ Cartesian
        chart.data.datasets.push({
            label: `N=${N}, β=${beta_deg}°`,
            data: theta.map((th, i) => ({ x: th, y: pattern_dB[i] })),
            borderColor: color,
            borderWidth: 2,
            pointRadius: 0
        });
        chart.update();

        // Vẽ Polar
        polarChart.data.labels = polarLabels;
        polarChart.data.datasets.push({
            data: pattern_dB,
            borderColor: color,
            borderWidth: 2,
            pointRadius: 0
        });
        polarChart.update();

        // Cập nhật các hàm phụ trợ
        calculatePerformance(theta, pattern_dB, N, d_lambda);
        updateTableHorizontal(theta, pattern_dB);
    });

    // ... (Hàm clearBtn, calculatePerformance và updateTableHorizontal giữ nguyên như trước)
    document.getElementById('clearBtn').addEventListener('click', () => {
        chart.data.datasets = []; chart.update();
        polarChart.data.datasets = []; polarChart.update();
        document.getElementById('resultsTable').innerHTML = '';
        ['hpbw-val', 'sll-val', 'fnbw-val', 'dir-val'].forEach(id => document.getElementById(id).innerText = '-');
    });

    function updateTableHorizontal(theta, dB) {
        let filtered = theta.map((th, i) => ({th, db: dB[i]})).filter(v => v.th >= -180 && v.th <= 180 && v.th % 20 === 0);
        let html = '<div style="overflow-x: auto;"><table border="1" style="width:100%; border-collapse: collapse;">';
        html += '<tr style="background:#eee;"><th>θ</th>' + filtered.map(v => `<td>${v.th}</td>`).join('') + '</tr>';
        html += '<tr><th>dB</th>' + filtered.map(v => `<td>${v.db.toFixed(1)}</td>`).join('') + '</tr></table></div>';
        document.getElementById('resultsTable').innerHTML = html;
    }

    function calculatePerformance(theta, dB, N, d_lambda) {
        const directivity = 10 * Math.log10(2 * N * d_lambda);
        document.getElementById('dir-val').innerText = directivity.toFixed(1);
        // Các thông số khác bạn có thể tự update logic tìm kiếm đỉnh
    }
});