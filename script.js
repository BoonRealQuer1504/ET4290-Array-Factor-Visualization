// script.js - ĐÃ SỬA CÔNG THỨC AF ĐÚNG 100%
let chart;

document.addEventListener("DOMContentLoaded", function () {
    const canvas = document.getElementById('patternChart');
    const ctx = canvas.getContext('2d');

    chart = new Chart(ctx, {
        type: 'line',
        data: { datasets: [] },
        options: {
            responsive: false,
            maintainAspectRatio: false,
            animation: { duration: 0 },
            scales: {
                x: { type: 'linear', min: -90, max: 90,
                    title: { display: true, text: 'θ (degrees)' },
                    ticks: { stepSize: 10, callback: v => v + '°' }
                },
                y: { min: -50, max: 0,
                    title: { display: true, text: 'Normalized Gain (dB)' },
                    ticks: { stepSize: 10, callback: v => v + ' dB' }
                }
            },
            plugins: { legend: { position: 'top' } }
        }
    });

    const form = document.getElementById('arrayForm');
    form.addEventListener('submit', function (e) {
        e.preventDefault();

        const N = parseInt(document.getElementById('N').value);
        const d_meter = parseFloat(document.getElementById('d_meter').value);
        const f_GHz = parseFloat(document.getElementById('f').value);

        if (isNaN(N) || isNaN(d_meter) || isNaN(f_GHz) || N < 1 || d_meter <= 0 || f_GHz <= 0) {
            alert("Nhập lại!");
            return;
        }

        const c = 3e8;
        const lambda = c / (f_GHz * 1e9);
        const d_lambda = d_meter / lambda;

        document.getElementById('info').innerHTML = `λ = ${lambda.toFixed(4)} m | d/λ = <strong>${d_lambda.toFixed(3)}</strong>`;

        const theta = [];
        const pattern_dB = [];
        let max_af = 0;
        const af_values = [];

        for (let th = -90; th <= 90; th += 1) {
            theta.push(th);
            const psi = 2 * Math.PI * d_lambda * Math.cos(th * Math.PI / 180);
            const af = Math.abs(psi) < 1e-10 
                ? 1 
                : Math.abs( Math.sin( (N * psi) / 2 ) / ( N * Math.sin( psi / 2 ) ) );
            af_values.push(af);
            if (af > max_af) max_af = af;
        }

        for (let i = 0; i < af_values.length; i++) {
            pattern_dB.push(20 * Math.log10(af_values[i] / max_af + 1e-12));
        }

        const color = `hsl(${Math.random() * 360}, 70%, 50%)`;
        const dataPoints = theta.map((th, i) => ({ x: th, y: pattern_dB[i] }));

        chart.data.datasets.push({
            label: `N=${N}, d=${d_meter}m, f=${f_GHz}GHz (d/λ=${d_lambda.toFixed(3)})`,
            data: dataPoints,
            borderColor: color,
            fill: false,
            tension: 0.1,
            pointRadius: 0
        });
        chart.update();

        updateTable(
            theta.filter((_, i) => i % 5 === 0),
            pattern_dB.filter((_, i) => i % 5 === 0),
            d_lambda
        );
    });

    document.getElementById('clearBtn').addEventListener('click', () => {
        chart.data.datasets = [];
        chart.update();
        document.getElementById('resultsTable').innerHTML = '';
        document.getElementById('info').innerHTML = '';
    });

    function updateTable(theta, dB, d_lambda) {
        let html = '<table border="1" style="margin:10px auto;"><tr><th>θ (°)</th><th>dB</th></tr>';
        theta.forEach((th, i) => {
            html += `<tr><td>${th}</td><td>${dB[i].toFixed(2)}</td></tr>`;
        });
        html += `<tr><td colspan="2">d/λ = ${d_lambda.toFixed(3)}</td></tr></table>`;
        document.getElementById('resultsTable').innerHTML = html;
    }
});