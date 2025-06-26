document.addEventListener('DOMContentLoaded', function () {
    const jsonDataElement = document.getElementById('django-data');
    if (!jsonDataElement) {
        console.error('Django data script tag not found!');
        return;
    }
    const ALL_DATA = JSON.parse(jsonDataElement.textContent);

    function formatSecondsToHHMM(seconds) {
        if (seconds === null || seconds === undefined || isNaN(seconds)) return '00:00';
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }

    let modalChart = null;

    function showChartInModal(optionsProvider, chartTitleForModal) {
        const modalElement = document.getElementById('chartModal');
        const chartModalLabel = document.getElementById('chartModalLabel');
        const modalChartContainer = document.getElementById('modalChartContainer');
        
        chartModalLabel.textContent = chartTitleForModal || 'Chart Details';
        modalChartContainer.innerHTML = ''; 

        const modalChartOptions = optionsProvider(true); 
        
        if (modalChart) {
            modalChart.destroy();
        }
        modalChart = new ApexCharts(modalChartContainer, modalChartOptions);
        modalChart.render().catch(function(err) {
            console.error("Error rendering modal chart:", err);
            modalChartContainer.innerHTML = `<p class="text-danger text-center">Error loading chart.</p>`;
        });

        const bsModal = new bootstrap.Modal(modalElement);
        bsModal.show();
    }
    
    const chartModalElement = document.getElementById('chartModal');
    chartModalElement.addEventListener('hidden.bs.modal', function () {
        if (modalChart) {
            modalChart.destroy();
            modalChart = null;
        }
    });

    function getCommonGridSettings(isModal = false) {
        return {
            show: true,
            borderColor: '#e0e0e0', // Light grid lines
            strokeDashArray: isModal ? 0 : 3, // Dashed for small, solid for modal
            xaxis: { lines: { show: false } }, // Generally hide vertical grid lines
            yaxis: { lines: { show: true } }, // Show horizontal grid lines
            padding: { top: 5, right: isModal ? 20 : 10, bottom: 0, left: isModal ? 20 : 10 }
        };
    }
    
    const zoneColors = ['#E96064', '#F0B752', '#63B979', '#B0BEC5']; // Red, Yellow, Green, Pending

    // --- Chart Configurations ---

    // 1. Triage Time By Interval Chart
    function getTriageTimeByIntervalChartOptions(isModal = false) {
        const chartData = ALL_DATA.graphs.AccidentEmergency.triage['comparison-1'];
        const chartDisplayTitle = chartData.title;
        return {
            series: [
                { name: chartData.y[0].name + ' (Count)', type: 'column', data: chartData.y[0].data },
                { name: chartData.y[1].name + ' (Time)', type: 'line', data: chartData.y[1].data },
            ],
            chart: {
                height: isModal ? 400 : '100%',
                type: 'line', 
                toolbar: { show: isModal },
                 events: {
                    dataPointSelection: function(event, chartContext, config) {
                        if (!isModal) { 
                           showChartInModal(getTriageTimeByIntervalChartOptions, chartDisplayTitle);
                        }
                    }
                }
            },
            grid: getCommonGridSettings(isModal),
            stroke: { 
                width: [0, isModal ? 2.5 : 2.2], // Line width: 2.2 for dashboard, 2.5 for modal
                curve: 'smooth' // Ensure smooth curve
            },
            markers: { 
                size: isModal ? 4.5 : 3.5, // Marker size: 3.5 for dashboard, 4.5 for modal
                strokeWidth: 0, // No border on markers for cleaner look
                hover: {
                    size: isModal ? 6.5 : 5.5 // Slightly larger on hover
                }
            },
            title: { 
                text: chartDisplayTitle, 
                show: !isModal, 
                align: 'left', 
                style: { fontSize: '12px', fontWeight: '500', color: '#333' } 
            },
            xaxis: { categories: chartData.x, labels: { style: { fontSize: isModal ? '12px' : '9px' } }, tooltip: { enabled: false } },
            yaxis: [
                { seriesName: chartData.y[0].name + ' (Count)', title: { text: 'Patient Count', style: {fontSize: isModal? '11px' : '9px'} }, labels: { style: { fontSize: isModal ? '12px' : '9px' } } },
                { seriesName: chartData.y[1].name + ' (Time)', opposite: true, title: { text: 'Avg Time (HH:MM)', style: {fontSize: isModal? '11px' : '9px'} }, labels: { formatter: (val) => formatSecondsToHHMM(val), style: { fontSize: isModal ? '12px' : '9px' } } }
            ],
            tooltip: {
                shared: true,
                intersect: false,
                y: {
                    formatter: function (val, { seriesIndex }) {
                        if (seriesIndex === 1 ) { 
                            return formatSecondsToHHMM(val) + " (Avg Time)";
                        }
                        return val + " (Patients)";
                    }
                }
            },
            legend: { fontSize: isModal ? '13px' : '10px', offsetY: isModal ? 0 : 5, position: 'top' },
            dataLabels: { enabled: false }
        };
    }
    if (document.getElementById('triageTimeByIntervalChart') && ALL_DATA.graphs?.AccidentEmergency?.triage?.['comparison-1']) {
        const triageTimeChart = new ApexCharts(document.getElementById('triageTimeByIntervalChart'), getTriageTimeByIntervalChartOptions());
        triageTimeChart.render();
    }

    // 2. Patients by Zone Chart (Donut) - No line series here
    function getPatientsByZoneChartOptions(isModal = false) {
        const chartData = ALL_DATA.graphs.AccidentEmergency.Zone['barpie-1'].pie;
        const chartDisplayTitle = "Patients by Zone"; 
        return {
            series: chartData.y,
            colors: zoneColors,
            chart: {
                type: 'donut',
                height: isModal ? 400 : '100%',
                toolbar: { show: isModal },
                 events: {
                    dataPointSelection: function(event, chartContext, config) {
                         if (!isModal) {
                            showChartInModal(getPatientsByZoneChartOptions, chartDisplayTitle);
                         }
                    }
                }
            },
            title: { 
                text: chartDisplayTitle, 
                show: !isModal, 
                align: 'left', 
                style: { fontSize: '12px', fontWeight: '500', color: '#333' } 
            },
            labels: chartData.x, 
            responsive: [{
                breakpoint: 480,
                options: { chart: { width: 200 }, legend: { position: 'bottom' } }
            }],
            legend: { 
                fontSize: isModal ? '13px' : '10px', 
                position: isModal? 'right' : 'bottom',
                markers: {
                    fillColors: zoneColors 
                }
            },
            tooltip: {
                y: {
                    formatter: function (val, { seriesIndex, w }) {
                        const zoneName = w.globals.labels[seriesIndex];
                        return `${zoneName}: ${val} patients, Avg Time: ${formatSecondsToHHMM(chartData.time[seriesIndex])}`;
                    }
                }
            },
            dataLabels: { 
                enabled: !isModal,
                formatter: function (val, opts) {
                    // Show only if percentage is significant to avoid clutter
                    return val > 3 ? opts.w.globals.labels[opts.seriesIndex] + ": " + val.toFixed(0) : ''
                },
                style: {
                    fontSize: '10px',
                    colors: ["#333"]
                },
                dropShadow: {
                  enabled: false,
                }
            },
            plotOptions: {
                pie: {
                    donut: {
                        size: isModal ? '60%' : '65%', 
                        labels: {
                            show: isModal, 
                            total: {
                                show: true,
                                label: 'Total',
                                fontSize: isModal ? '18px' : '16px',
                                formatter: function (w) {
                                    return w.globals.seriesTotals.reduce((a, b) => {
                                        return a + b
                                    }, 0)
                                }
                            },
                            value: { // This refers to the value of the currently hovered segment when total is shown
                                show: true,
                                fontSize: isModal ? '16px' : '14px',
                                offsetY: isModal ? 0 : -2, // Adjust offset if needed
                            }
                        }
                    }
                }
            }
        };
    }
    if (document.getElementById('patientsByZoneChart') && ALL_DATA.graphs?.AccidentEmergency?.Zone?.['barpie-1']?.pie) {
        const patientsByZoneChart = new ApexCharts(document.getElementById('patientsByZoneChart'), getPatientsByZoneChartOptions());
        patientsByZoneChart.render();
    }

    // 3. Patients By Interval Chart
    function getPatientsByIntervalChartOptions(isModal = false) {
        const chartData = ALL_DATA.graphs.AccidentEmergency.interval['barline-1'];
        const chartDisplayTitle = chartData.title;
        return {
            series: [
                { name: chartData.y[0].name, type: 'column', data: chartData.y[0].data },
                { name: chartData.y[1].name, type: 'line', data: chartData.y[1].data }
            ],
            chart: {
                height: isModal ? 400 : '100%',
                type: 'line',
                toolbar: { show: isModal },
                 events: {
                    dataPointSelection: function(event, chartContext, config) {
                         if (!isModal) {
                            showChartInModal(getPatientsByIntervalChartOptions, chartDisplayTitle);
                         }
                    }
                }
            },
            grid: getCommonGridSettings(isModal),
            stroke: { 
                width: [0, isModal ? 2.5 : 2.2], 
                curve: 'smooth' 
            },
            markers: { 
                size: isModal ? 4.5 : 3.5,
                strokeWidth: 0,
                hover: {
                    size: isModal ? 6.5 : 5.5
                }
            },
            title: { 
                text: chartDisplayTitle, 
                show: !isModal, 
                align: 'left', 
                style: { fontSize: '12px', fontWeight: '500', color: '#333' } 
            },
            xaxis: { categories: chartData.x, labels: { style: { fontSize: isModal ? '12px' : '9px' } }, tooltip: {enabled: false} },
            yaxis: [
                { seriesName: chartData.y[0].name, title: { text: 'Patient Count', style: {fontSize: isModal? '11px' : '9px'} }, labels: { style: { fontSize: isModal ? '12px' : '9px' } } },
                { seriesName: chartData.y[1].name, opposite: true, title: { text: 'Avg Time (HH:MM)', style: {fontSize: isModal? '11px' : '9px'} }, labels: { formatter: (val) => formatSecondsToHHMM(val), style: { fontSize: isModal ? '12px' : '9px' } } }
            ],
            tooltip: {
                shared: true,
                intersect: false,
                y: {
                    formatter: function (val, { seriesIndex }) {
                        if (seriesIndex === 1) return formatSecondsToHHMM(val) + " (Avg Time)";
                        return val + " (Patients)";
                    }
                }
            },
            legend: { fontSize: isModal ? '13px' : '10px', offsetY: isModal ? 0 : 5, position: 'top' },
            dataLabels: { enabled: false }
        };
    }
    if (document.getElementById('patientsByIntervalChart') && ALL_DATA.graphs?.AccidentEmergency?.interval?.['barline-1']) {
        const patientsByIntervalChart = new ApexCharts(document.getElementById('patientsByIntervalChart'), getPatientsByIntervalChartOptions());
        patientsByIntervalChart.render();
    }

    // 4. Consultation by Doctor Chart
    function getConsultationByDoctorChartOptions(isModal = false) {
        const chartData = ALL_DATA.graphs.AccidentEmergency.Doctor['barline-1'];
        const chartDisplayTitle = chartData.title; 
        return {
            series: [
                { name: chartData.y[0].name, type: 'column', data: chartData.y[0].data },
                { name: chartData.y[1].name, type: 'line', data: chartData.y[1].data }
            ],
            chart: {
                height: isModal ? 400 : '100%',
                type: 'line',
                toolbar: { show: isModal },
                events: {
                    dataPointSelection: function(event, chartContext, config) {
                         if (!isModal) {
                            showChartInModal(getConsultationByDoctorChartOptions, chartDisplayTitle); 
                         }
                    }
                }
            },
            grid: getCommonGridSettings(isModal),
            stroke: { 
                width: [0, isModal ? 2.5 : 2.2], 
                curve: 'smooth' 
            },
            markers: { 
                size: isModal ? 4.5 : 3.5,
                strokeWidth: 0,
                hover: {
                    size: isModal ? 6.5 : 5.5
                }
            },
            title: { 
                text: chartDisplayTitle, 
                show: !isModal, 
                align: 'left', 
                style: { fontSize: '12px', fontWeight: '500', color: '#333' } 
            },
            xaxis: { 
                categories: chartData.x, 
                labels: { 
                    rotate: isModal ? -45 : -60, 
                    rotateAlways: true,
                    trim: true,
                    maxHeight: isModal ? 100 : 60,
                    style: { fontSize: isModal ? '11px' : '8px' } 
                },
                tooltip: {enabled: false}
            },
            yaxis: [
                { seriesName: chartData.y[0].name, title: { text: 'Visits', style: {fontSize: isModal? '11px' : '9px'} }, labels: { style: { fontSize: isModal ? '12px' : '9px' } } },
                { seriesName: chartData.y[1].name, opposite: true, title: { text: 'Avg Time (HH:MM)', style: {fontSize: isModal? '11px' : '9px'} }, labels: { formatter: (val) => formatSecondsToHHMM(val), style: { fontSize: isModal ? '12px' : '9px' } } }
            ],
            tooltip: {
                shared: true,
                intersect: false,
                y: {
                    formatter: function (val, { seriesIndex }) {
                        if (seriesIndex === 1) return formatSecondsToHHMM(val) + " (Avg Time)";
                        return val + " (Visits)";
                    }
                }
            },
            legend: { fontSize: isModal ? '13px' : '10px', offsetY: isModal ? 0 : 5, position: 'top' },
            dataLabels: { enabled: false }
        };
    }
     if (document.getElementById('consultationByDoctorChart') && ALL_DATA.graphs?.AccidentEmergency?.Doctor?.['barline-1']) {
        const consultationByDoctorChart = new ApexCharts(document.getElementById('consultationByDoctorChart'), getConsultationByDoctorChartOptions());
        consultationByDoctorChart.render();
    }

    // --- Doctor Statistics Table Logic ---
    const doctorData = ALL_DATA.docstats || [];
    let currentPage = 1;
    let filteredDoctors = [...doctorData];
    let rowsPerPage = 4; 

    const doctorTableContainer = document.getElementById('doctorDataRowsContainer');
    const doctorTableWrapper = document.getElementById('doctorTableContainerImg');
    const paginationContainer = document.getElementById('doctorPaginationContainerImg');
    const searchInput = document.getElementById('doctorSearchInputImg');

    function calculateRowsPerPage() {
        if (doctorTableWrapper) {
            const availableHeight = doctorTableWrapper.clientHeight;
            const singleRowHeight = 44; // From CSS: 40px height + 4px margin-bottom
            if (availableHeight > singleRowHeight) {
                rowsPerPage = Math.max(1, Math.floor(availableHeight / singleRowHeight));
            } else {
                rowsPerPage = 1; 
            }
        } else {
            rowsPerPage = 4; // Fallback if container not found
        }
    }

    function renderDoctorTable() {
        doctorTableContainer.innerHTML = ''; 
        const start = (currentPage - 1) * rowsPerPage;
        const end = start + rowsPerPage;
        const paginatedDoctors = filteredDoctors.slice(start, end);

        if (paginatedDoctors.length === 0) {
            if (filteredDoctors.length > 0) {
                 doctorTableContainer.innerHTML = '<p class="text-center text-muted p-3">No doctors on this page.</p>';
            } else if (searchInput && searchInput.value !== "") {
                 doctorTableContainer.innerHTML = '<p class="text-center text-muted p-3">No doctors found matching your search.</p>';
            } else {
                 doctorTableContainer.innerHTML = '<p class="text-center text-muted p-3">No doctor data available.</p>';
            }
        } else {
            paginatedDoctors.forEach(doc => {
                const row = document.createElement('div');
                row.className = 'doctor-data-row';
                row.innerHTML = `
                    <div class="doctor-name-cell" title="${doc.doc_name}">${doc.doc_name}</div>
                    <div class="patients-cell">
                        <span class="patients-lozenge">${doc.count}</span>
                    </div>
                    <div class="time-cell">
                        <i class="far fa-clock"></i>
                        <span class="time-value ${doc.avg_visit_tm > 3600 ? 'text-danger' : 'text-success'}">
                            ${formatSecondsToHHMM(doc.avg_visit_tm)}
                        </span>
                    </div>
                `;
                doctorTableContainer.appendChild(row);
            });
        }
    }

    function setupPagination() {
        paginationContainer.innerHTML = '';
        const pageCount = Math.ceil(filteredDoctors.length / rowsPerPage);
        if (pageCount <= 1) return;

        const ul = document.createElement('ul');
        ul.className = 'pagination pagination-sm';

        const prevLi = document.createElement('li');
        prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
        prevLi.innerHTML = `<a class="page-link" href="#" aria-label="Previous"><span aria-hidden="true">«</span></a>`;
        prevLi.addEventListener('click', (e) => { e.preventDefault(); if (currentPage > 1) { currentPage--; renderDoctorTable(); setupPagination(); } });
        ul.appendChild(prevLi);

        const maxPagesToShow = 3; 
        let startPage, endPage;
        if (pageCount <= maxPagesToShow) { startPage = 1; endPage = pageCount; } 
        else {
            if (currentPage <= Math.ceil(maxPagesToShow / 2)) { startPage = 1; endPage = maxPagesToShow; } 
            else if (currentPage + Math.floor(maxPagesToShow / 2) >= pageCount) { startPage = pageCount - maxPagesToShow + 1; endPage = pageCount; } 
            else { startPage = currentPage - Math.floor(maxPagesToShow / 2); endPage = currentPage + Math.floor(maxPagesToShow / 2); }
        }
        
        if (startPage > 1) {
            const firstLi = document.createElement('li'); firstLi.className = 'page-item';
            firstLi.innerHTML = `<a class="page-link" href="#">1</a>`;
            firstLi.addEventListener('click', (e) => { e.preventDefault(); currentPage = 1; renderDoctorTable(); setupPagination(); });
            ul.appendChild(firstLi);
            if (startPage > 2) {
                 const dotsLi = document.createElement('li'); dotsLi.className = 'page-item disabled';
                 dotsLi.innerHTML = `<span class="page-link">...</span>`; ul.appendChild(dotsLi);
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            const li = document.createElement('li'); li.className = `page-item ${i === currentPage ? 'active' : ''}`;
            li.innerHTML = `<a class="page-link" href="#">${i}</a>`;
            li.addEventListener('click', (e) => { e.preventDefault(); currentPage = i; renderDoctorTable(); setupPagination(); });
            ul.appendChild(li);
        }

        if (endPage < pageCount) {
            if (endPage < pageCount - 1) {
                const dotsLi = document.createElement('li'); dotsLi.className = 'page-item disabled';
                dotsLi.innerHTML = `<span class="page-link">...</span>`; ul.appendChild(dotsLi);
            }
            const lastLi = document.createElement('li'); lastLi.className = 'page-item';
            lastLi.innerHTML = `<a class="page-link" href="#">${pageCount}</a>`;
            lastLi.addEventListener('click', (e) => { e.preventDefault(); currentPage = pageCount; renderDoctorTable(); setupPagination(); });
            ul.appendChild(lastLi);
        }
        
        const nextLi = document.createElement('li');
        nextLi.className = `page-item ${currentPage === pageCount ? 'disabled' : ''}`;
        nextLi.innerHTML = `<a class="page-link" href="#" aria-label="Next"><span aria-hidden="true">»</span></a>`;
        nextLi.addEventListener('click', (e) => { e.preventDefault(); if (currentPage < pageCount) { currentPage++; renderDoctorTable(); setupPagination(); } });
        ul.appendChild(nextLi);
        paginationContainer.appendChild(ul);
    }
    
    if (searchInput) {
        searchInput.addEventListener('input', function () {
            const searchTerm = this.value.toLowerCase();
            filteredDoctors = doctorData.filter(doc => doc.doc_name.toLowerCase().includes(searchTerm));
            currentPage = 1; 
            renderDoctorTable();
            setupPagination();
        });
    }

    if (doctorTableContainer && doctorTableWrapper) {
        calculateRowsPerPage(); 
        renderDoctorTable();
        setupPagination();
    }
});