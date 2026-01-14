document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById('planarForm');
    const btnCalcPhase = document.getElementById('btnCalcPhase');
    const btnAddCut = document.getElementById('btnAddCut');
    const btnClearAll = document.getElementById('btnClearAll');

    // Khởi tạo đồ thị Polar trống với thang dB
    initPolarChart();

    // 1. Tính pha β tự động
    btnCalcPhase.addEventListener('click', function() {
        const theta0 = parseFloat(document.getElementById('theta0').value) * Math.PI / 180;
        const phi0 = parseFloat(document.getElementById('phi0').value) * Math.PI / 180;
        const f = parseFloat(document.getElementById('f').value);
        const dx = parseFloat(document.getElementById('dx').value);
        const dy = parseFloat(document.getElementById('dy').value);
        const k = (2 * Math.PI) / (3e8 / (f * 1e9));

        const bx = -k * dx * Math.sin(theta0) * Math.cos(phi0);
        const by = -k * dy * Math.sin(theta0) * Math.sin(phi0);

        document.getElementById('betax').value = (bx * 180 / Math.PI).toFixed(2);
        document.getElementById('betay').value = (by * 180 / Math.PI).toFixed(2);
    });

    // 2. Vẽ 3D khi nhấn Submit
    form.addEventListener('submit', function (e) {
        e.preventDefault();
        const p = getParams();
        document.getElementById('info').innerHTML = `Bước sóng λ = ${p.lambda.toFixed(4)}m | dx = ${(p.dx/p.lambda).toFixed(2)}λ | dy = ${(p.dy/p.lambda).toFixed(2)}λ`;
        
        updateUVPlot(p);
        updateRealSpacePlot(p);
    });

    // 3. Vẽ thêm mặt cắt Polar (dB)
    btnAddCut.addEventListener('click', function() {
        addPolarTrace(parseFloat(document.getElementById('phiCut').value), getParams());
    });

    // 4. Reset toàn bộ
    btnClearAll.addEventListener('click', function() {
        location.reload();
    });

    // --- HÀM HỖ TRỢ ---
    function getParams() {
        const f = parseFloat(document.getElementById('f').value);
        const lambda = 3e8 / (f * 1e9);
        return {
            M: parseInt(document.getElementById('M').value),
            N: parseInt(document.getElementById('N').value),
            dx: parseFloat(document.getElementById('dx').value),
            dy: parseFloat(document.getElementById('dy').value),
            k: (2 * Math.PI) / lambda,
            bx: parseFloat(document.getElementById('betax').value) * Math.PI / 180,
            by: parseFloat(document.getElementById('betay').value) * Math.PI / 180,
            lambda: lambda
        };
    }

    function calculateAF(thRad, phRad, p) {
        const psix = p.k * p.dx * Math.sin(thRad) * Math.cos(phRad) + p.bx;
        const psiy = p.k * p.dy * Math.sin(thRad) * Math.sin(phRad) + p.by;
        const afX = Math.abs(psix) < 1e-9 ? 1 : Math.abs(Math.sin(p.M * psix / 2) / (p.M * Math.sin(psix / 2)));
        const afY = Math.abs(psiy) < 1e-9 ? 1 : Math.abs(Math.sin(p.N * psiy / 2) / (p.N * Math.sin(psiy / 2)));
        return afX * afY;
    }

    function initPolarChart() {
        const layout = {
            title: 'Radiation Pattern (dB Scale)',
            polar: {
                radialaxis: { range: [-40, 0], ticksuffix: ' dB', dtick: 10, visible: true },
                angularaxis: { direction: "clockwise", rotation: 90 }
            }
        };
        Plotly.newPlot('polarChart', [], layout);
    }

    function addPolarTrace(phiDeg, p) {
        let rDB = [], thetaDeg = [];
        for (let th = -180; th <= 180; th += 0.5) {
            let af = calculateAF(Math.abs(th * Math.PI / 180), phiDeg * Math.PI / 180, p);
            let db = 20 * Math.log10(af + 1e-6); // Tránh log(0)
            rDB.push(db < -40 ? -40 : db);
            thetaDeg.push(th);
        }
        Plotly.addTraces('polarChart', {
            type: 'scatterpolar', mode: 'lines', r: rDB, theta: thetaDeg,
            name: `φ = ${phiDeg}°`
        });
    }

    function updateUVPlot(p) {
        let z = [], uArr = [], vArr = [];
        const res = 100;
        for (let i = 0; i <= res; i++) {
            let u = -1 + (2 * i) / res;
            uArr.push(u);
            let row = [];
            for (let j = 0; j <= res; j++) {
                let v = -1 + (2 * j) / res;
                if (i === 0) vArr.push(v);
                if (u*u + v*v <= 1.001) {
                    const psix = p.k * p.dx * u + p.bx;
                    const psiy = p.k * p.dy * v + p.by;
                    const afX = Math.abs(psix) < 1e-9 ? 1 : Math.abs(Math.sin(p.M * psix / 2) / (p.M * Math.sin(psix / 2)));
                    const afY = Math.abs(psiy) < 1e-9 ? 1 : Math.abs(Math.sin(p.N * psiy / 2) / (p.N * Math.sin(psiy / 2)));
                    row.push(afX * afY);
                } else row.push(0);
            }
            z.push(row);
        }
        Plotly.newPlot('uvChart', [{z:z, x:uArr, y:vArr, type:'surface', colorscale:'Jet'}], {scene:{xaxis:{title:'u'}, yaxis:{title:'v'}}});
    }

    function updateRealSpacePlot(p) {
        let x = [], y = [], z = [], c = [];
        const step = 4;
        for (let th = 0; th <= 90; th += step) {
            let thR = th * Math.PI / 180, rx = [], ry = [], rz = [], rc = [];
            for (let ph = 0; ph <= 360; ph += step) {
                let phR = ph * Math.PI / 180, r = calculateAF(thR, phR, p);
                rx.push(r * Math.sin(thR) * Math.cos(phR));
                ry.push(r * Math.sin(thR) * Math.sin(phR));
                rz.push(r * Math.cos(thR));
                rc.push(r);
            }
            x.push(rx); y.push(ry); z.push(rz); c.push(rc);
        }
        Plotly.newPlot('realSpaceChart', [{x:x, y:y, z:z, surfacecolor:c, type:'surface', colorscale:'Jet'}], {scene:{aspectmode:'cube'}});
    }

    form.dispatchEvent(new Event('submit'));
});