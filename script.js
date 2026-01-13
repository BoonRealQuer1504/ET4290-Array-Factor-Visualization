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
                x: { type: 'linear', min: -90, max: 90, title: { display: true, text: 'Góc θ (độ)' }, ticks: { stepSize: 10 } },
                y: { min: -50, max: 0, title: { display: true, text: 'Normalized Gain (dB)' } }
            }
        }
    });

    const form = document.getElementById('arrayForm');
    form.addEventListener('submit', function (e) {
        e.preventDefault();

        const N = parseInt(document.getElementById('N').value);
        const d_meter = parseFloat(document.getElementById('d_meter').value);
        const f_GHz = parseFloat(document.getElementById('f').value);
        const beta_deg = parseFloat(document.getElementById('beta_deg').value);

        // Tính toán các thông số lambda và d/lambda
        const c = 3e8;
        const lambda = c / (f_GHz * 1e9);
        const d_lambda = d_meter / lambda;
        const beta_rad = (beta_deg * Math.PI) / 180;

        // Cập nhật hiển thị thông tin
        document.getElementById('info').innerHTML = `λ = <strong>${lambda.toFixed(4)}</strong> m | d/λ = <strong>${d_lambda.toFixed(3)}</strong> | β = <strong>${beta_deg}°</strong>`;

        const theta = [];
        const af_values = [];
        let max_af = 0;

        for (let th = -90; th <= 90; th += 1) {
            const th_rad = (th * Math.PI) / 180;
            // Công thức psi tổng quát có beta: ψ = kd*sin(θ) + β
            const psi = (2 * Math.PI * d_lambda * Math.sin(th_rad)) + beta_rad;

            const af = Math.abs(psi) < 1e-10 
                ? 1 
                : Math.abs( Math.sin((N * psi) / 2) / (N * Math.sin(psi / 2)) );
            
            af_values.push(af);
            if (af > max_af) max_af = af;
            theta.push(th);
        }

        const pattern_dB = af_values.map(v => 20 * Math.log10(v / max_af + 1e-12));

        const color = `hsl(${Math.random() * 360}, 70%, 50%)`;
        chart.data.datasets.push({
            label: `N=${N}, β=${beta_deg}°, d/λ=${d_lambda.toFixed(3)}`,
            data: theta.map((th, i) => ({ x: th, y: pattern_dB[i] })),
            borderColor: color,
            borderWidth: 2,
            pointRadius: 0,
            fill: false
        });
        chart.update();

        calculatePerformance(theta, pattern_dB, N, d_lambda);

        updateTableHorizontal(
            theta.filter((_, i) => i % 10 === 0),
            pattern_dB.filter((_, i) => i % 10 === 0)
        );
    });

    // Hàm vẽ bảng nằm ngang
    function updateTableHorizontal(theta, dB) {
        let html = '<div style="overflow-x: auto; margin-top: 15px;">';
        html += '<table border="1" style="margin: 0 auto; border-collapse: collapse; white-space: nowrap; width: 100%;">';
        
        // Dòng góc Theta
        html += '<tr style="background: #f8f9fa;"><th>θ (°)</th>';
        theta.forEach(th => { html += `<td style="padding: 8px; border: 1px solid #ddd;">${th}</td>`; });
        html += '</tr>';

        // Dòng giá trị dB
        html += '<tr><th>dB</th>';
        dB.forEach(val => { html += `<td style="padding: 8px; border: 1px solid #ddd;">${val.toFixed(1)}</td>`; });
        html += '</tr>';

        html += '</table></div>';
        document.getElementById('resultsTable').innerHTML = html;
    }

    document.getElementById('clearBtn').addEventListener('click', () => {
        chart.data.datasets = [];
        chart.update();
        document.getElementById('resultsTable').innerHTML = '';
        document.getElementById('info').innerHTML = '';
    });


    function calculatePerformance(theta, dB, N, d_lambda) {
        // 1. Tìm HPBW (Half-Power Beamwidth - 3dB)
        let startIndex = -1, endIndex = -1;
        for (let i = 0; i < dB.length; i++) {
            if (dB[i] >= -3) {
                if (startIndex === -1) startIndex = i;
                endIndex = i;
            }
        }
        const hpbw = theta[endIndex] - theta[startIndex];

        // 2. Tìm SLL (Side Lobe Level)
        // Tìm đỉnh lớn nhất nằm ngoài vùng búp chính (giả định búp chính rộng khoảng 2*HPBW)
        let maxSideLobe = -99;
        const mainLobeHalfWidth = Math.max(hpbw, 10); 
        const centerIdx = dB.indexOf(Math.max(...dB));
        
        for (let i = 0; i < dB.length; i++) {
            // Loại bỏ vùng búp chính để tìm búp phụ
            if (Math.abs(theta[i] - theta[centerIdx]) > mainLobeHalfWidth) {
                if (dB[i] > maxSideLobe) maxSideLobe = dB[i];
            }
        }

        // 3. Tìm FNBW (First Null Beamwidth)
        // Quét từ đỉnh sang hai bên để tìm điểm cực tiểu đầu tiên
        let leftNull = centerIdx, rightNull = centerIdx;
        while (leftNull > 0 && dB[leftNull] > dB[leftNull-1]) leftNull--;
        while (rightNull < dB.length - 1 && dB[rightNull] > dB[rightNull+1]) rightNull++;
        const fnbw = theta[rightNull] - theta[leftNull];

        // 4. Ước tính Directivity (D0) theo công thức Krauss hoặc chuẩn mảng
        // Với mảng tuyến tính: D0 ≈ 2 * N * (d/lambda)
        const directivity = 10 * Math.log10(2 * N * d_lambda);

        // Hiển thị ra giao diện
        document.getElementById('hpbw-val').innerText = hpbw > 0 ? hpbw.toFixed(1) : "N/A";
        document.getElementById('sll-val').innerText = maxSideLobe > -99 ? maxSideLobe.toFixed(1) : "N/A";
        document.getElementById('fnbw-val').innerText = fnbw > 0 ? fnbw.toFixed(1) : "N/A";
        document.getElementById('dir-val').innerText = directivity > 0 ? directivity.toFixed(1) : "N/A";
    }


    
});