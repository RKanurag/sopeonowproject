// Global variables
let doctorData = [];
let currentPage = 1;
let itemsPerPage = 4;
let chartInstances = {};
let dashboardData = null;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Fetch data from management.json
    fetchDashboardData();
});

// Fetch dashboard data from management.json
function fetchDashboardData() {
    // Show loading state
    showLoadingState();
    
    // Fetch data from media/management.json
    fetch('/media/management.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch management.json');
            }
            return response.json();
        })
        .then(data => {
            console.log('Data loaded successfully:', data);
            dashboardData = data;
            
            // Initialize all components
            initializeDashboard(data);
        })
        .catch(error => {
            console.error('Error fetching dashboard data:', error);
            showErrorState('Failed to load dashboard data. Please check if management.json exists in the media folder.');
        });
}

// Show loading state
function showLoadingState() {
    // Show loading in doctor statistics
    const doctorContainer = document.getElementById('doctorDataRowsContainer');
    if (doctorContainer) {
        doctorContainer.innerHTML = '<p class="text-center text-muted p-5">Loading dashboard data...</p>';
    }
    
    // Show loading in charts
    const chartContainers = ['.triagebyintervalmap', '.traigebyzonemap', '.patientsbyInterval', '.patientsbyDoctor'];
    chartContainers.forEach(selector => {
        const container = document.querySelector(selector);
        if (container) {
            container.innerHTML = '<div class="d-flex justify-content-center align-items-center h-100"><div class="spinner-border text-light" role="status"><span class="visually-hidden">Loading...</span></div></div>';
        }
    });
}

// Show error state
function showErrorState(message) {
    // Show error in doctor statistics
    const doctorContainer = document.getElementById('doctorDataRowsContainer');
    if (doctorContainer) {
        doctorContainer.innerHTML = `<p class="text-center text-danger p-5">${message}</p>`;
    }
    
    // Show error in charts
    const chartContainers = ['.triagebyintervalmap', '.traigebyzonemap', '.patientsbyInterval', '.patientsbyDoctor'];
    chartContainers.forEach(selector => {
        const container = document.querySelector(selector);
        if (container) {
            container.innerHTML = `<div class="d-flex justify-content-center align-items-center h-100 text-danger">${message}</div>`;
        }
    });
}

// Initialize dashboard with fetched data
function initializeDashboard(data) {
    try {
        // Log data for verification
        console.log('Dashboard Data Structure:', data);
        verifyDataMapping(data);
        
        // Initialize doctor statistics
        initializeDoctorStatistics(data);
        
        // Initialize all charts with a small delay to ensure DOM is ready
        setTimeout(() => {
            initializeCharts(data);
        }, 100);
        
        // Setup modal functionality
        setupModalFunctionality();
        
        // Update dynamic values
        updateDynamicValues(data);
        
        // Setup responsive behavior
        setupResponsiveBehavior();
        
    } catch (error) {
        console.error('Error initializing dashboard:', error);
        showErrorState('Error initializing dashboard components');
    }
}

// Verify data mapping for debugging
function verifyDataMapping(data) {
    console.log('=== DATA VERIFICATION ===');
    
    // Verify Key Metrics
    console.log('Key Metrics:', {
        'Total Visits': data.key_metrics?.total?.count,
        'Registration Time': formatTime(data.key_metrics?.registration?.time || 0),
        'Triage Done Time': formatTime(data.key_metrics?.triage_done?.time || 0),
        'Consultation Time': formatTime(data.key_metrics?.cons_done?.time || 0),
        'In Zone Time': formatTime(data.key_metrics?.in_zone?.time || 0),
        'IP Transfers': {
            'Completed': data.key_metrics?.ip_transfers?.completed?.count || 0,
            'In Progress': data.key_metrics?.ip_transfers?.inprogress?.count || 0,
            'Total': data.key_metrics?.ip_transfers?.total_count || 'Not calculated - will calculate',
            'Calculated Total': (data.key_metrics?.ip_transfers?.completed?.count || 0) + (data.key_metrics?.ip_transfers?.inprogress?.count || 0)
        }
    });
    
    // Verify Zone Statistics
    console.log('Zone Statistics:', {
        'Green Zone': {
            'Total Visits': data.zonestats?.green?.total_visits_count,
            'Active': data.zonestats?.green?.active_count,
            'Discharged': data.zonestats?.green?.discharge_count
        },
        'Yellow Zone': {
            'Total Visits': data.zonestats?.yellow?.total_visits_count,
            'Active': data.zonestats?.yellow?.active_count,
            'Discharged': data.zonestats?.yellow?.discharge_count
        },
        'Red Zone': {
            'Total Visits': data.zonestats?.red?.total_visits_count,
            'Active': data.zonestats?.red?.active_count,
            'Discharged': data.zonestats?.red?.discharge_count
        }
    });
    
    // Verify Graph Data
    if (data.graphs?.AccidentEmergency) {
        console.log('Graph Data Available:', {
            'Triage Data': data.graphs.AccidentEmergency.triage?.['comparison-1'] ? 'Yes' : 'No',
            'Zone Data': data.graphs.AccidentEmergency.Zone?.['barpie-1'] ? 'Yes' : 'No',
            'Interval Data': data.graphs.AccidentEmergency.interval?.['barline-1'] ? 'Yes' : 'No',
            'Doctor Data': data.graphs.AccidentEmergency.Doctor?.['barline-1'] ? 'Yes' : 'No'
        });
        
        // Show triage data structure
        if (data.graphs.AccidentEmergency.triage?.['comparison-1']) {
            const triageData = data.graphs.AccidentEmergency.triage['comparison-1'];
            console.log('Triage Chart Series:', triageData.y.map(series => ({
                name: series.name,
                type: series.type,
                dataPoints: series.data.length,
                sampleData: series.data.slice(0, 3)
            })));
        }
    }
    
    // Verify Doctor Statistics
    console.log('Doctor Statistics:', {
        'Total Doctors': data.docstats?.length || 0,
        'Sample Doctors': data.docstats?.slice(0, 3).map(doc => ({
            name: doc.doc_name,
            patients: doc.count,
            avgTime: formatTime(doc.avg_visit_tm)
        }))
    });
    
    console.log('=== END VERIFICATION ===');
}

// Setup responsive behavior
function setupResponsiveBehavior() {
    // Set initial items per page to 4
    itemsPerPage = 4;
    
    // Calculate items per page based on available height
    function calculateItemsPerPage() {
        const container = document.getElementById('doctorTableContainerImg');
        if (container) {
            const availableHeight = container.offsetHeight - 60; // Subtract header height
            const rowHeight = 65; // Approximate height of each doctor row
            const calculatedItems = Math.floor(availableHeight / rowHeight);
            // Only update if it's a significant change and keep it between 2 and 4
            const newItemsPerPage = Math.max(2, Math.min(4, calculatedItems));
            
            // Only update if there's a significant change
            if (Math.abs(newItemsPerPage - itemsPerPage) >= 1) {
                itemsPerPage = newItemsPerPage;
                renderDoctorTable();
                setupPagination();
            }
        }
    }
    
    // Only recalculate on actual window resize, not during search
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            calculateItemsPerPage();
        }, 250); // Debounce resize events
    });
    
    // Don't calculate initially - keep it at 4
    // calculateItemsPerPage();
}

// Initialize Doctor Statistics
function initializeDoctorStatistics(data) {
    if (data.docstats && Array.isArray(data.docstats)) {
        doctorData = data.docstats;
        console.log('Doctor data loaded:', doctorData);
        renderDoctorTable();
        setupDoctorSearch();
        setupPagination();
    } else {
        console.error('No doctor statistics found in data');
        document.getElementById('doctorDataRowsContainer').innerHTML = '<p class="text-center text-muted p-3">No doctor data available</p>';
    }
}

// Render doctor table
function renderDoctorTable() {
    const container = document.getElementById('doctorDataRowsContainer');
    if (!container) return;
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageData = doctorData.slice(startIndex, endIndex);
    
    container.innerHTML = '';
    
    if (pageData.length === 0) {
        container.innerHTML = '<p class="text-center text-muted p-3">No doctors found</p>';
        return;
    }
    
    pageData.forEach(doctor => {
        const timeInSeconds = doctor.avg_visit_tm || 0;
        const timeFormatted = formatTime(timeInSeconds);
        const timeClass = getTimeClass(timeInSeconds);
        
        const row = document.createElement('div');
        row.className = 'doctor-data-row';
        row.innerHTML = `
            <div class="doctor-name-cell">${doctor.doc_name}</div>
            <div class="patients-cell">
                <span class="patients-lozenge">${doctor.count}</span>
            </div>
            <div class="time-cell">
                <i class="far fa-clock"></i>
                <span class="time-value ${timeClass}">${timeFormatted}</span>
            </div>
        `;
        container.appendChild(row);
    });
}

// Format time from seconds
function formatTime(seconds) {
    const totalSeconds = parseInt(seconds, 10) || 0;
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    
    // Always return HH:MM format (no seconds)
    if (hours > 0) {
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    } else {
        return `${minutes.toString().padStart(2, '0')}:${Math.floor(totalSeconds % 60).toString().padStart(2, '0')}`;
    }
}

// Format time for modal display based on chart type
function formatTimeForModal(seconds, chartType) {
    const totalSeconds = parseInt(seconds, 10) || 0;
    
    if (chartType === 'interval') {
        // For patients by interval - show HH:MM
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    } else {
        // For triage and consultation - show MM:SS
        const minutes = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
}

// Get time class based on duration
function getTimeClass(seconds) {
    if (seconds < 1800) return 'text-success';
    else if (seconds < 3600) return 'text-warning';
    else return 'text-danger';
}

// Setup doctor search
function setupDoctorSearch() {
    const searchInput = document.getElementById('doctorSearchInputImg');
    if (!searchInput) return;
    
    searchInput.addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase();
        
        if (searchTerm === '') {
            doctorData = dashboardData.docstats || [];
        } else {
            const allDoctors = dashboardData.docstats || [];
            doctorData = allDoctors.filter(doctor => 
                doctor.doc_name.toLowerCase().includes(searchTerm)
            );
        }
        
        currentPage = 1;
        renderDoctorTable();
        setupPagination();
    });
}

// Setup pagination
function setupPagination() {
    const container = document.getElementById('doctorPaginationContainerImg');
    if (!container) return;
    
    const totalPages = Math.ceil(doctorData.length / itemsPerPage);
    
    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }
    
    let paginationHTML = '<nav><ul class="pagination justify-content-center">';
    
    // Previous button
    paginationHTML += `
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="return changePage(${currentPage - 1})" aria-label="Previous">
                <span aria-hidden="true">&laquo;</span>
            </a>
        </li>
    `;
    
    // Page numbers
    let startPage = Math.max(1, currentPage - 1);
    let endPage = Math.min(totalPages, currentPage + 1);
    
    if (startPage > 1) {
        paginationHTML += `
            <li class="page-item">
                <a class="page-link" href="#" onclick="return changePage(1)">1</a>
            </li>
        `;
        if (startPage > 2) {
            paginationHTML += `
                <li class="page-item disabled">
                    <span class="page-link">...</span>
                </li>
            `;
        }
    }
    
    for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `
            <li class="page-item ${i === currentPage ? 'active' : ''}">
                <a class="page-link" href="#" onclick="return changePage(${i})">${i}</a>
            </li>
        `;
    }
    
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            paginationHTML += `
                <li class="page-item disabled">
                    <span class="page-link">...</span>
                </li>
            `;
        }
        paginationHTML += `
            <li class="page-item">
                <a class="page-link" href="#" onclick="return changePage(${totalPages})">${totalPages}</a>
            </li>
        `;
    }
    
    // Next button
    paginationHTML += `
        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="return changePage(${currentPage + 1})" aria-label="Next">
                <span aria-hidden="true">&raquo;</span>
            </a>
        </li>
    `;
    
    paginationHTML += '</ul></nav>';
    container.innerHTML = paginationHTML;
}

// Change page function - make it global
window.changePage = function(page) {
    const totalPages = Math.ceil(doctorData.length / itemsPerPage);
    if (page >= 1 && page <= totalPages) {
        currentPage = page;
        renderDoctorTable();
        setupPagination();
    }
    return false;
}

// Initialize all charts
function initializeCharts(data) {
    console.log('Initializing charts with data:', data);
    
    // Clear loading spinners
    const chartContainers = ['.triagebyintervalmap', '.traigebyzonemap', '.patientsbyInterval', '.patientsbyDoctor'];
    chartContainers.forEach(selector => {
        const container = document.querySelector(selector);
        if (container) {
            container.innerHTML = '';
        }
    });
    
    // Chart options with modern styling
    const defaultOptions = {
        chart: {
            toolbar: {
                show: false,  // Hide toolbar in small cards
                tools: {
                    download: true,
                    selection: true,
                    zoom: true,
                    zoomin: true,
                    zoomout: true,
                    pan: true,
                    reset: true
                }
            },
            animations: {
                enabled: true,
                easing: 'easeinout',
                speed: 800
            }
        },
        stroke: {
            curve: 'smooth',  // This makes lines wavy/smooth
            width: [0, 3, 0, 3] // No stroke for bars, 3px for lines
        },
        markers: {
            size: [0, 5, 0, 5], // No markers for bars, 5px for lines
            hover: {
                size: [0, 7, 0, 7]
            }
        },
        grid: {
            borderColor: '#f1f1f1',
            strokeDashArray: 5
        },
        tooltip: {
            theme: 'dark',
            x: {
                show: true
            }
        }
    };
    
    // 1. Triage by Interval Chart
    const triageContainer = document.querySelector(".triagebyintervalmap");
    if (triageContainer && data.graphs?.AccidentEmergency?.triage?.['comparison-1']) {
        const triageData = data.graphs.AccidentEmergency.triage['comparison-1'];
        
        // Fix the series names to be more descriptive
        const fixedSeries = triageData.y.map((item, index) => {
            let fixedName = item.name;
            // Add context to differentiate between count and time
            if (item.type === 'line') {
                fixedName = item.name + ' (Time)';
            } else if (item.type === 'column') {
                fixedName = item.name + ' (Count)';
            }
            
            return {
                name: fixedName,
                type: item.type === 'column' ? 'bar' : item.type,
                data: item.data
            };
        });
        
        const triageChart = new ApexCharts(triageContainer, {
            ...defaultOptions,
            series: fixedSeries,
            chart: {
                ...defaultOptions.chart,
                type: 'line',
                height: '100%',
                background: 'transparent',
                foreColor: '#333'
            },
            xaxis: {
                categories: triageData.x,
                labels: {
                    style: {
                        colors: '#333',
                        fontSize: '9px'
                    },
                    rotate: -45,
                    formatter: function(value) {
                        // Truncate labels for small cards
                        if (value && value.length > 8) {
                            return value.substring(0, 5) + '...';
                        }
                        return value;
                    }
                }
            },
            yaxis: [
                {
                    title: {
                        text: 'Patients Count',
                        style: {
                            color: '#333'
                        }
                    },
                    labels: {
                        style: {
                            colors: '#333'
                        }
                    }
                },
                {
                    opposite: true,
                    title: {
                        text: 'Time (MM:SS)',
                        style: {
                            color: '#333'
                        }
                    },
                    labels: {
                        style: {
                            colors: '#333'
                        },
                        formatter: function(value) {
                            return formatTime(value);
                        }
                    }
                }
            ],
            colors: ['#00E396', '#FEB019', '#008FFB', '#FF4560'],
legend: {
    labels: {
        colors: '#333'
    },
    position: 'top',
    horizontalAlign: 'center',
    offsetY: -15
},
            title: {
                text: triageData.title || 'Triage Time By Interval',
                align: 'center',
                style: {
                    color: '#333',
                    fontSize: '16px'
                }
            },
            plotOptions: {
                bar: {
                    borderRadius: 5,
                    columnWidth: '50%'
                }
            },
            stroke: {
                curve: 'smooth',
                width: [0, 3, 0, 3] // No stroke for bars, 3px for lines
            }
        });
        triageChart.render();
        chartInstances['triageInterval'] = triageChart;
    }
    
    // 2. Patients by Zone Chart
    const zoneContainer = document.querySelector(".traigebyzonemap");
    if (zoneContainer && data.graphs?.AccidentEmergency?.Zone?.['barpie-1']) {
        const zoneData = data.graphs.AccidentEmergency.Zone['barpie-1'];
        const zoneChart = new ApexCharts(zoneContainer, {
            series: zoneData.pie.y,
            chart: {
                type: 'donut',
                height: '100%',
                toolbar: {
                    show: false
                },
                animations: {
                    enabled: true,
                    easing: 'easeinout',
                    speed: 800
                },
                // Add padding to avoid overlap
            },
            labels: zoneData.pie.x,
            colors: ['#FF4560', '#FEB019', '#00E396', '#775DD0'],
            title: {
                text: zoneData.title || 'Patients by Zone',
                align: 'center',
                offsetY: 10 // Shift title down to avoid overlap
            },
            dataLabels: {
                enabled: true,
                formatter: function(val, opts) {
                    const name = opts.w.globals.labels[opts.seriesIndex];
                    const value = opts.w.globals.series[opts.seriesIndex];
                    return name + ': ' + value;
                }
            },
            legend: {
                position: 'bottom'
            },
            plotOptions: {
                pie: {
                    donut: {
                        size: '65%',
                        labels: {
                            show: true,
                            total: {
                                show: true,
                                label: 'Total',
                                formatter: function(w) {
                                    return w.globals.series.reduce((a, b) => a + b, 0);
                                }
                            }
                        }
                    }
                }
            },
            stroke: {
                show: false  // No stroke for donut chart
            },
            grid: {
                show: false  // No grid for donut chart
            }
        });
        zoneChart.render();
        chartInstances['zoneDistribution'] = zoneChart;
    }
    
    // 3. Patients by Interval Chart
    const intervalContainer = document.querySelector(".patientsbyInterval");
    if (intervalContainer && data.graphs?.AccidentEmergency?.interval?.['barline-1']) {
        const intervalData = data.graphs.AccidentEmergency.interval['barline-1'];
    const intervalChart = new ApexCharts(intervalContainer, {
        ...defaultOptions,
        series: intervalData.y.map(item => ({
            name: item.name,
            type: item.type === 'column' ? 'bar' : item.type,
            data: item.data
        })),
        chart: {
            ...defaultOptions.chart,
            type: 'line',
            height: '100%'
        },
        xaxis: {
            categories: intervalData.x,
            labels: {
                rotate: -45,
                style: {
                    fontSize: '9px'
                },
                formatter: function(value) {
                    // Truncate labels for small cards
                    if (value && value.length > 8) {
                        return value.substring(0, 5) + '...';
                    }
                    return value;
                }
            }
        },
        yaxis: [
            {
                title: {
                    text: 'Total Visits'
                }
            },
            {
                opposite: true,
                title: {
                    text: 'Average Time'
                },
                labels: {
                    formatter: function(value) {
                        return formatTime(value);
                    }
                }
            }
        ],
        colors: ['#008FFB', '#FEB019'],
        title: {
            text: intervalData.title || 'Patients By Interval',
            align: 'center'
        },
        stroke: {
            curve: 'smooth',
            width: [0, 3]
        },
        plotOptions: {
            bar: {
                borderRadius: 5,
                columnWidth: '50%'
            }
        }
    });
    intervalChart.render();
    chartInstances['patientsInterval'] = intervalChart;
    }
    
    // 4. Consultation by Doctor Chart
    const doctorContainer = document.querySelector(".patientsbyDoctor");
    if (doctorContainer && data.graphs?.AccidentEmergency?.Doctor?.['barline-1']) {
        const doctorData = data.graphs.AccidentEmergency.Doctor['barline-1'];
    const doctorChart = new ApexCharts(doctorContainer, {
        ...defaultOptions,
        series: doctorData.y.map(item => ({
            name: item.name,
            type: item.type === 'column' ? 'bar' : item.type,
            data: item.data
        })),
        chart: {
            ...defaultOptions.chart,
            type: 'line',
            height: '100%'
        },
        xaxis: {
            categories: doctorData.x,
            labels: {
                rotate: -45,
                style: {
                    fontSize: '8px'
                },
                formatter: function(value) {
                    // Truncate doctor names for small cards
                    if (value && value.length > 12) {
                        // Show first name and initial of last name
                        const parts = value.split(' ');
                        if (parts.length > 1) {
                            // Keep full first name if it's short
                            if (parts[0].length <= 7) {
                                return parts[0] + ' ' + parts[1].charAt(0) + '.';
                            } else {
                                return parts[0].substring(0, 7) + '...';
                            }
                        }
                        return value.substring(0, 10) + '...';
                    }
                    return value;
                }
            }
        },
        yaxis: [
            {
                title: {
                    text: 'Total Visits'
                }
            },
            {
                opposite: true,
                title: {
                    text: 'Average Time'
                },
                labels: {
                    formatter: function(value) {
                        return formatTime(value);
                    }
                }
            }
        ],
        colors: ['#00E396', '#FF4560'],
        title: {
            text: doctorData.title || 'Consultation by Doctor',
            align: 'center'
        },
        stroke: {
            curve: 'smooth',
            width: [0, 3]
        },
        plotOptions: {
            bar: {
                borderRadius: 5,
                columnWidth: '50%'
            }
        }
    });
    doctorChart.render();
    chartInstances['doctorConsultation'] = doctorChart;
    }
}

// Setup modal functionality
function setupModalFunctionality() {
    // Create modal HTML with centered styling
    const modalHTML = `
        <div class="modal fade" id="chartModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-xl modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="chartModalTitle">Chart Details</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <div id="modalChartContainer" style="height: 500px;"></div>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Add click handlers to charts
    const chartContainers = [
        { selector: '.triagebyintervalmap', key: 'triageInterval', title: 'Triage Time By Interval - Detailed View' },
        { selector: '.traigebyzonemap', key: 'zoneDistribution', title: 'Patients by Zone - Detailed View' },
        { selector: '.patientsbyInterval', key: 'patientsInterval', title: 'Patients By Interval - Detailed View' },
        { selector: '.patientsbyDoctor', key: 'doctorConsultation', title: 'Consultation by Doctor - Detailed View' }
    ];
    
    chartContainers.forEach(({ selector, key, title }) => {
        const element = document.querySelector(selector);
        if (element) {
            element.style.cursor = 'pointer';
            element.addEventListener('click', () => showChartModal(key, title));
        }
    });
}

// Show chart in modal
function showChartModal(chartKey, title) {
    const modal = new bootstrap.Modal(document.getElementById('chartModal'));
    document.getElementById('chartModalTitle').textContent = title;
    
    // Clear previous chart
    const modalContainer = document.getElementById('modalChartContainer');
    modalContainer.innerHTML = '';
    
    // Clone chart options and render in modal
    if (chartInstances[chartKey]) {
        const options = JSON.parse(JSON.stringify(chartInstances[chartKey].opts));
        options.chart.height = 500;
        
        // Enable full toolbar for modal view
        options.chart.toolbar.show = true;
        options.chart.toolbar.tools = {
            download: true,
            selection: true,
            zoom: true,
            zoomin: true,
            zoomout: true,
            pan: true,
            reset: true,
            menu: true,
            customIcons: []
        };
        
        // Enable zoom and pan
        options.chart.zoom = {
            enabled: true,
            type: 'x',
            autoScaleYaxis: true
        };
        
        // Remove label truncation for modal view
        if (options.xaxis?.labels?.formatter) {
            delete options.xaxis.labels.formatter;
        }
        
        // Increase font size for better readability in modal
        if (options.xaxis?.labels?.style) {
            options.xaxis.labels.style.fontSize = '12px';
        }
        
        // Remove background for modal view
        if (options.chart.background) {
            delete options.chart.background;
            options.chart.foreColor = '#373d3f';
        }
        
        // Fix colors and formatters for modal view
        if (options.xaxis?.labels?.style?.colors) {
            options.xaxis.labels.style.colors = '#373d3f';
        }
        if (options.yaxis) {
            if (Array.isArray(options.yaxis)) {
                options.yaxis.forEach((axis, index) => {
                    if (axis.labels?.style?.colors) {
                        axis.labels.style.colors = '#373d3f';
                    }
                    if (axis.title?.style?.color) {
                        axis.title.style.color = '#373d3f';
                    }
                    // Update time format in title and formatter based on chart type
                    if (axis.opposite && (axis.title?.text?.includes('Time') || axis.title?.text?.includes('Average Time'))) {
                        if (chartKey === 'patientsInterval') {
                            axis.title.text = 'Average Time (HH:MM)';
                            axis.labels.formatter = function(value) {
                                return formatTimeForModal(value, 'interval');
                            };
                        } else if (chartKey === 'triageInterval' || chartKey === 'doctorConsultation') {
                            axis.title.text = axis.title.text.includes('Average') ? 'Average Time (MM:SS)' : 'Time (MM:SS)';
                            axis.labels.formatter = function(value) {
                                return formatTimeForModal(value, 'triage');
                            };
                        }
                    }
                });
            } else {
                if (options.yaxis.labels?.style?.colors) {
                    options.yaxis.labels.style.colors = '#373d3f';
                }
            }
        }
        if (options.legend?.labels?.colors) {
            options.legend.labels.colors = '#373d3f';
        }
        if (options.title?.style?.color) {
            options.title.style.color = '#373d3f';
        }
        
        // Enhance options for modal view
        options.chart.animations.enabled = true;
        
        const modalChart = new ApexCharts(modalContainer, options);
        modalChart.render();
        
        // Clean up on modal close
        document.getElementById('chartModal').addEventListener('hidden.bs.modal', function () {
            modalChart.destroy();
        }, { once: true });
    }
    
    modal.show();
}

// Update dynamic values
function updateDynamicValues(data) {
    // Calculate IP transfers total if not present
    if (data.key_metrics?.ip_transfers && !data.key_metrics.ip_transfers.total_count) {
        const completed = data.key_metrics.ip_transfers.completed?.count || 0;
        const inprogress = data.key_metrics.ip_transfers.inprogress?.count || 0;
        data.key_metrics.ip_transfers.total_count = completed + inprogress;
    }
    
    // Update all the dynamic values with proper time formatting
    const updates = {
        'registrationtime': data.key_metrics?.registration?.time || 0,
        'timetotriage': data.key_metrics?.triage_done?.time || 0,
        'timetoconsult': data.key_metrics?.cons_done?.time || 0,
        'inzoneTime': data.key_metrics?.in_zone?.time || 0,
        'treatmenttime': data.key_metrics?.treatment?.time || 0,
        'labprocessingtime': 0, // Not in provided data
        'radiologyprocessingtime': 0, // Not in provided data
        'iptransferstime': data.key_metrics?.ip_transfers?.completed?.time || 0,
        'iptransferscount': data.key_metrics?.ip_transfers?.total_count || (data.key_metrics?.ip_transfers?.completed?.count || 0) + (data.key_metrics?.ip_transfers?.inprogress?.count || 0),
        'totalvisits': data.key_metrics?.total?.count || 0,
        'visittime': data.completed?.avg_act_tm || 0,
        'insurancecount': data.completed?.Payor?.Insurance?.count || 0,
        'insurancetime': data.completed?.Payor?.Insurance?.time || 0,
        'selfpaycount': data.completed?.Payor?.Self_Pay?.count || 0,
        'selfpaytime': data.completed?.Payor?.Self_Pay?.time || 0,
        'internationalcount': data.completed?.Residency?.International?.count || 0,
        'internationaltime': data.completed?.Residency?.International?.time || 0,
        'localcount': data.completed?.Residency?.Local?.count || 0,
        'localtime': data.completed?.Residency?.Local?.time || 0,
        'waitingfortriagecount': data.inprogress?.pdTriage?.count || 0,
        'waitingfortriagetime': data.inprogress?.pdTriage?.time || 0,
        'waitingforconsultationcount': data.inprogress?.pdConsultation?.count || 0,
        'waitingforconsultationtime': data.inprogress?.pdConsultation?.time || 0,
        // Zone statistics
        'totalVisitsGreen': data.zonestats?.green?.total_visits_count || 0,
        'totalVisitsYellow': data.zonestats?.yellow?.total_visits_count || 0,
        'totalVisitsRed': data.zonestats?.red?.total_visits_count || 0,
        'activeGreen': data.zonestats?.green?.active_count || 0,
        'activeYellow': data.zonestats?.yellow?.active_count || 0,
        'activeRed': data.zonestats?.red?.active_count || 0,
        'dischargedGreen': data.zonestats?.green?.discharge_count || 0,
        'dischargedYellow': data.zonestats?.yellow?.discharge_count || 0,
        'dischargedRed': data.zonestats?.red?.discharge_count || 0,
        'avgTriageTimeGreen': data.zonestats?.green?.avg_triage_tm || 0,
        'avgTriageTimeYellow': data.zonestats?.yellow?.avg_triage_tm || 0,
        'avgTriageTimeRed': data.zonestats?.red?.avg_triage_tm || 0,
        'avgHoldTimeGreen': data.zonestats?.green?.avg_cons_tm || 0,
        'avgHoldTimeYellow': data.zonestats?.yellow?.avg_cons_tm || 0,
        'avgHoldTimeRed': data.zonestats?.red?.avg_cons_tm || 0,
        'avgVisitTimeGreen': data.zonestats?.green?.avg_visit_tm || 0,
        'avgVisitTimeYellow': data.zonestats?.yellow?.avg_visit_tm || 0,
        'avgVisitTimeRed': data.zonestats?.red?.avg_visit_tm || 0
    };
    
    // Log the updates for debugging
    console.log('Dynamic Updates:', {
        'IP Transfers Count': updates.iptransferscount,
        'IP Transfers Time': formatTime(updates.iptransferstime),
        'Total Visits': updates.totalvisits,
        'Insurance Count': updates.insurancecount,
        'Self Pay Count': updates.selfpaycount,
        'Waiting for Triage': updates.waitingfortriagecount,
        'Waiting for Consultation': updates.waitingforconsultationcount
    });
    
    // Update DOM elements
    Object.entries(updates).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            if (id.includes('time') || id.includes('Time')) {
                element.textContent = formatTime(value);
                // Preserve existing classes except old time classes, then add new time class
                const timeClasses = ['text-success', 'text-warning', 'text-danger'];
                // Remove old time classes
                timeClasses.forEach(tc => element.classList.remove(tc));
                // Add new time class
                element.classList.add(getTimeClass(value));
            } else {
                element.textContent = value;
            }
        } else {
            console.warn(`Element with id '${id}' not found in DOM`);
        }
    });
}

// Auto-refresh functionality (optional - refresh every 5 minutes)
function setupAutoRefresh() {
    setInterval(() => {
        fetchDashboardData();
    }, 5 * 60 * 1000); // 5 minutes
}

// Uncomment if you want auto-refresh
// setupAutoRefresh();