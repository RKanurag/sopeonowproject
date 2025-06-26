document.addEventListener('DOMContentLoaded', function () {
    const jsonDataElement = document.getElementById('django-data');
    if (!jsonDataElement) {
        console.error('Django data script tag not found!');
        return;
    }
    const ALL_DATA = JSON.parse(jsonDataElement.textContent);

    // Helper to format seconds to HH:MM for chart labels/tooltips
    function formatSecondsToHHMM(seconds) {
        if (seconds === null || seconds === undefined || isNaN(seconds)) return '00:00';
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }

    let modalChart = null; // To keep track of the chart instance in the modal

    // Function to show chart in modal
    function showChartInModal(optionsProvider, chartTitle) {
        const modalElement = document.getElementById('chartModal');
        const chartModalLabel = document.getElementById('chartModalLabel');
        const modalChartContainer = document.getElementById('modalChartContainer');
        
        chartModalLabel.textContent = chartTitle || 'Chart Details';
        modalChartContainer.innerHTML = ''; // Clear previous chart

        const modalChartOptions = optionsProvider(true); // true for modal version (potentially more details)
        
        if (modalChart) {
            modalChart.destroy();
        }
        modalChart = new ApexCharts(modalChartContainer, modalChartOptions);
        modalChart.render();

        const bsModal = new bootstrap.Modal(modalElement);
        bsModal.show();
    }
    
    // Ensure modal chart is destroyed when modal is hidden
    const chartModalElement = document.getElementById('chartModal');
    chartModalElement.addEventListener('hidden.bs.modal', function () {
        if (modalChart) {
            modalChart.destroy();
            modalChart = null;
        }
    });


    // --- Chart Configurations ---

    // 1. Triage Time By Interval Chart
    function getTriageTimeByIntervalChartOptions(isModal = false) {
        const chartData = ALL_DATA.graphs.AccidentEmergency.triage['comparison-1'];
        return {
            series: [
                { name: chartData.y[0].name + ' (Count)', type: 'column', data: chartData.y[0].data },
                { name: chartData.y[1].name + ' (Time)', type: 'line', data: chartData.y[1].data },
                // { name: chartData.y[2].name + ' (Count)', type: 'column', data: chartData.y[2].data }, // Triage Not Done - Count
                // { name: chartData.y[3].name + ' (Time)', type: 'line', data: chartData.y[3].data }  // Triage Not Done - Time (all zeros)
            ],
            chart: {
                height: isModal ? 400 : '100%',
                type: 'line', // ApexCharts will handle mixed types within series
                toolbar: { show: isModal },
                 events: {
                    dataPointSelection: function(event, chartContext, config) {
                        if (!isModal) { // Prevent re-opening modal from modal chart
                           showChartInModal(getTriageTimeByIntervalChartOptions, chartData.title);
                        }
                    }
                }
            },
            stroke: { width: [0, 3], curve: 'smooth' }, // Column, Line
            title: { text: chartData.title, align: 'left', style: { fontSize: isModal ? '16px' : '12px' } },
            xaxis: { categories: chartData.x, labels: { style: { fontSize: isModal ? '12px' : '9px' } } },
            yaxis: [
                { seriesName: chartData.y[0].name + ' (Count)', title: { text: 'Patient Count' }, labels: { style: { fontSize: isModal ? '12px' : '9px' } } },
                { seriesName: chartData.y[1].name + ' (Time)', opposite: true, title: { text: 'Avg Time (HH:MM)' }, labels: { formatter: (val) => formatSecondsToHHMM(val), style: { fontSize: isModal ? '12px' : '9px' } } }
            ],
            tooltip: {
                shared: true,
                intersect: false,
                y: {
                    formatter: function (val, { seriesIndex }) {
                        if (seriesIndex === 1 ) { // Time series
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


    // 2. Patients by Zone Chart (Donut)
    function getPatientsByZoneChartOptions(isModal = false) {
        const chartData = ALL_DATA.graphs.AccidentEmergency.Zone['barpie-1'].pie;
        return {
            series: chartData.y,
            chart: {
                type: 'donut',
                height: isModal ? 400 : '100%',
                toolbar: { show: isModal },
                 events: {
                    dataPointSelection: function(event, chartContext, config) {
                         if (!isModal) {
                            showChartInModal(getPatientsByZoneChartOptions, "Patients by Zone");
                         }
                    }
                }
            },
            title: { text: "Patients by Zone", align: 'left', style: { fontSize: isModal ? '16px' : '12px' } },
            labels: chartData.x,
            responsive: [{
                breakpoint: 480,
                options: { chart: { width: 200 }, legend: { position: 'bottom' } }
            }],
            legend: { fontSize: isModal ? '13px' : '10px', position: isModal? 'right' : 'bottom' },
            tooltip: {
                y: {
                    formatter: function (val, { seriesIndex }) {
                        return `${val} patients, Avg Time: ${formatSecondsToHHMM(chartData.time[seriesIndex])}`;
                    }
                }
            },
            dataLabels: { enabled: !isModal } // Show data labels on small chart, maybe not on modal
        };
    }
    if (document.getElementById('patientsByZoneChart') && ALL_DATA.graphs?.AccidentEmergency?.Zone?.['barpie-1']?.pie) {
        const patientsByZoneChart = new ApexCharts(document.getElementById('patientsByZoneChart'), getPatientsByZoneChartOptions());
        patientsByZoneChart.render();
    }

    // 3. Patients By Interval Chart
    function getPatientsByIntervalChartOptions(isModal = false) {
        const chartData = ALL_DATA.graphs.AccidentEmergency.interval['barline-1'];
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
                            showChartInModal(getPatientsByIntervalChartOptions, chartData.title);
                         }
                    }
                }
            },
            stroke: { width: [0, 3], curve: 'smooth' },
            title: { text: chartData.title, align: 'left', style: { fontSize: isModal ? '16px' : '12px' } },
            xaxis: { categories: chartData.x, labels: { style: { fontSize: isModal ? '12px' : '9px' } } },
            yaxis: [
                { seriesName: chartData.y[0].name, title: { text: 'Patient Count' }, labels: { style: { fontSize: isModal ? '12px' : '9px' } } },
                { seriesName: chartData.y[1].name, opposite: true, title: { text: 'Avg Time (HH:MM)' }, labels: { formatter: (val) => formatSecondsToHHMM(val), style: { fontSize: isModal ? '12px' : '9px' } } }
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

    // 4. Consultation by Doctor Chart (Patients by Doctor)
    function getConsultationByDoctorChartOptions(isModal = false) {
        const chartData = ALL_DATA.graphs.AccidentEmergency.Doctor['barline-1'];
        // Sort data by patient count for better readability if desired, or use as is
        // For modal, maybe show all doctors. For small chart, maybe top N.
        // Here, we'll use all data from JSON for simplicity.
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
                            showChartInModal(getConsultationByDoctorChartOptions, chartData.title); // Or a more specific title
                         }
                    }
                }
            },
            stroke: { width: [0, 3], curve: 'smooth' },
            title: { text: chartData.title, align: 'left', style: { fontSize: isModal ? '16px' : '12px' } },
            xaxis: { 
                categories: chartData.x, 
                labels: { 
                    rotate: isModal ? -45 : -60, // Rotate labels more on smaller chart
                    rotateAlways: true,
                    trim: true,
                    maxHeight: isModal ? 100 : 60,
                    style: { fontSize: isModal ? '11px' : '8px' } 
                } 
            },
            yaxis: [
                { seriesName: chartData.y[0].name, title: { text: 'Visits' }, labels: { style: { fontSize: isModal ? '12px' : '9px' } } },
                { seriesName: chartData.y[1].name, opposite: true, title: { text: 'Avg Time (HH:MM)' }, labels: { formatter: (val) => formatSecondsToHHMM(val), style: { fontSize: isModal ? '12px' : '9px' } } }
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
    const rowsPerPage = 4;
    let currentPage = 1;
    let filteredDoctors = [...doctorData];

    const doctorTableContainer = document.getElementById('doctorDataRowsContainer');
    const paginationContainer = document.getElementById('doctorPaginationContainerImg');
    const searchInput = document.getElementById('doctorSearchInputImg');

    function renderDoctorTable() {
        doctorTableContainer.innerHTML = ''; // Clear existing rows
        const start = (currentPage - 1) * rowsPerPage;
        const end = start + rowsPerPage;
        const paginatedDoctors = filteredDoctors.slice(start, end);

        if (paginatedDoctors.length === 0 && filteredDoctors.length > 0) { // If current page is empty but data exists
             doctorTableContainer.innerHTML = '<p class="text-center text-muted p-3">No doctors on this page.</p>';
        } else if (paginatedDoctors.length === 0 && filteredDoctors.length === 0) {
             doctorTableContainer.innerHTML = '<p class="text-center text-muted p-3">No doctors found matching your search.</p>';
        }


        paginatedDoctors.forEach(doc => {
            const row = document.createElement('div');
            row.className = 'doctor-data-row';
            row.innerHTML = `
                <div class="doctor-name-cell">${doc.doc_name}</div>
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

    function setupPagination() {
        paginationContainer.innerHTML = '';
        const pageCount = Math.ceil(filteredDoctors.length / rowsPerPage);
        if (pageCount <= 1) return;

        const ul = document.createElement('ul');
        ul.className = 'pagination pagination-sm';

        // Previous button
        const prevLi = document.createElement('li');
        prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
        prevLi.innerHTML = `<a class="page-link" href="#" aria-label="Previous"><span aria-hidden="true">«</span></a>`;
        prevLi.addEventListener('click', (e) => {
            e.preventDefault();
            if (currentPage > 1) {
                currentPage--;
                renderDoctorTable();
                setupPagination();
            }
        });
        ul.appendChild(prevLi);

        // Page numbers (simplified version)
        for (let i = 1; i <= pageCount; i++) {
            const li = document.createElement('li');
            li.className = `page-item ${i === currentPage ? 'active' : ''}`;
            li.innerHTML = `<a class="page-link" href="#">${i}</a>`;
            li.addEventListener('click', (e) => {
                e.preventDefault();
                currentPage = i;
                renderDoctorTable();
                setupPagination();
            });
            ul.appendChild(li);
        }
        
        // Next button
        const nextLi = document.createElement('li');
        nextLi.className = `page-item ${currentPage === pageCount ? 'disabled' : ''}`;
        nextLi.innerHTML = `<a class="page-link" href="#" aria-label="Next"><span aria-hidden="true">»</span></a>`;
        nextLi.addEventListener('click', (e) => {
            e.preventDefault();
            if (currentPage < pageCount) {
                currentPage++;
                renderDoctorTable();
                setupPagination();
            }
        });
        ul.appendChild(nextLi);

        paginationContainer.appendChild(ul);
    }
    
    if (searchInput) {
        searchInput.addEventListener('input', function () {
            const searchTerm = this.value.toLowerCase();
            filteredDoctors = doctorData.filter(doc => doc.doc_name.toLowerCase().includes(searchTerm));
            currentPage = 1; // Reset to first page
            renderDoctorTable();
            setupPagination();
        });
    }

    // Initial render for doctor table
    if (doctorTableContainer) {
        renderDoctorTable();
        setupPagination();
    }

}); // End DOMContentLoaded