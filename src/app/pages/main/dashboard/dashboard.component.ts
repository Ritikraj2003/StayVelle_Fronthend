import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { FormsModule } from '@angular/forms';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import * as am5 from '@amcharts/amcharts5';
import * as am5percent from '@amcharts/amcharts5/percent';
import * as am5xy from '@amcharts/amcharts5/xy';
import am5themes_Animated from '@amcharts/amcharts5/themes/Animated';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [DatePipe],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {

  // View mode
  currentView: 'monthly' | 'weekly' = 'monthly';

  // Date state
  currentDate: Date = new Date(); // The anchor date (like Feb 2026)

  // Top Filter state
  filterStartDateStr: string = '';
  filterEndDateStr: string = '';

  // Summary cards (global dashboard summary)
  stats: any = {
    totalRevenue: 0,
    totalBookings: 0,
    checkIns: 0,
    cancellations: 0,
    availableRooms: 0
  };

  // Chart.js instances
  private monthlyRevenueRoot?: am5.Root;
  private roomOccupancyRoot?: am5.Root;
  private monthlyCancellationChart?: Chart;
  private paymentModeChart?: Chart;

  // amCharts roots
  private bookingStatusRoot?: am5.Root;
  private dailyRevenueRoot?: am5.Root;
  private paymentModeRoot?: am5.Root;

  dailyStats: any[] = [];

  // Calendar Grid
  weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  calendarGrid: any[] = []; // Array of day objects
  currentUser: any = null;

  constructor(
    private apiService: ApiService,
    private datePipe: DatePipe
  ) { }

  ngOnInit(): void {
    this.currentUser = JSON.parse(localStorage.getItem('current_user') || '{}')?.username || '';
    // Initialize: both From and To default to today
    const today = this.datePipe.transform(new Date(), 'yyyy-MM-dd')!;
    this.filterStartDateStr = today;
    this.filterEndDateStr = today;

    // Default load
    this.loadDashboardData();
  }

  // --- Date Navigation Methods ---

  get displayDateTitle(): string {
    if (this.currentView === 'monthly') {
      return this.datePipe.transform(this.currentDate, 'MMMM yyyy') || '';
    } else {
      const { start, end } = this.getWeeklyRange(this.currentDate);
      return `${this.datePipe.transform(start, 'dd MMM yyyy')} - ${this.datePipe.transform(end, 'dd MMM yyyy')}`;
    }
  }

  get displayCurrentDateRight(): string {
    return this.datePipe.transform(new Date(), 'dd MMM yyyy') || '';
  }

  onFilterDateChange(): void {
    if (!this.filterStartDateStr || !this.filterEndDateStr) {
      return;
    }

    const start = new Date(this.filterStartDateStr);
    const end = new Date(this.filterEndDateStr);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return;
    }

    // If dates are in wrong order, swap them
    if (start > end) {
      this.filterStartDateStr = this.datePipe.transform(end, 'yyyy-MM-dd') || '';
      this.filterEndDateStr = this.datePipe.transform(start, 'yyyy-MM-dd') || '';
    }

    this.loadTopStats();
  }

  get parsedDateRangeStr(): string {
    if (this.filterStartDateStr && this.filterEndDateStr) {
      const start = new Date(this.filterStartDateStr);
      const end = new Date(this.filterEndDateStr);

      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        return `${this.datePipe.transform(start, 'dd/MM/yyyy')} to ${this.datePipe.transform(end, 'dd/MM/yyyy')}`;
      }
    }

    return '';
  }

  previous(): void {
    if (this.currentView === 'monthly') {
      this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() - 1, 1);
    } else {
      this.currentDate.setDate(this.currentDate.getDate() - 7);
      this.currentDate = new Date(this.currentDate);
    }
    this.loadCalendarData();
  }

  next(): void {
    if (this.currentView === 'monthly') {
      this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 1);
    } else {
      this.currentDate.setDate(this.currentDate.getDate() + 7);
      this.currentDate = new Date(this.currentDate);
    }
    this.loadCalendarData();
  }

  setView(view: 'monthly' | 'weekly'): void {
    this.currentView = view;
    this.loadCalendarData();
  }

  // --- Data Loading ---

  getCurrentRange() {
    if (this.currentView === 'monthly') {
      return this.getMonthlyRange(this.currentDate);
    } else {
      return this.getWeeklyRange(this.currentDate);
    }
  }

  getMonthlyRange(date: Date) {
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    return { start, end };
  }

  getWeeklyRange(date: Date) {
    // Assuming week starts on Sunday (0)
    const dayOfWeek = date.getDay();
    const start = new Date(date);
    start.setDate(date.getDate() - dayOfWeek);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    return { start, end };
  }

  loadDashboardData(): void {
    this.loadTopStats();
    this.loadCalendarData();
  }

  loadTopStats(): void {
    if (!this.filterStartDateStr || !this.filterEndDateStr) return;

    // Load global dashboard (summary + graphs) using the top filter dates
    this.apiService.getDashboardOverview(this.filterStartDateStr, this.filterEndDateStr).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const overview = res.data;
          if (overview.summary) {
            this.stats = {
              totalRevenue: overview.summary.totalRevenue ?? 0,
              totalBookings: overview.summary.totalBookings ?? 0,
              checkIns: overview.summary.checkIns ?? 0,
              cancellations: overview.summary.cancellations ?? 0,
              availableRooms: overview.summary.availableRooms ?? 0
            };
          }

          if (overview.graphs) {
            this.updateCharts(overview.graphs);
          }
        }
      },
      error: (err) => console.error("Error fetching stats", err)
    });
  }

  loadCalendarData(): void {
    const { start, end } = this.getCurrentRange();
    const startStr = this.datePipe.transform(start, 'yyyy-MM-dd')!;
    const endStr = this.datePipe.transform(end, 'yyyy-MM-dd')!;

    // Load Calendar
    this.apiService.getDashboardCalendar(startStr, endStr).subscribe({
      next: (res) => {
        if (res.success) {
          this.dailyStats = res.data.dailyStats;
          this.generateCalendarGrid();
        }
      },
      error: (err) => console.error("Error fetching calendar", err)
    });
  }

  // --- Calendar Grid Generation ---

  generateCalendarGrid(): void {
    this.calendarGrid = [];
    const { start, end } = this.getCurrentRange();

    if (this.currentView === 'monthly') {
      // Pad empty days at start of month
      const firstDayOfMonth = start.getDay();
      for (let i = 0; i < firstDayOfMonth; i++) {
        this.calendarGrid.push({ isEmpty: true });
      }

      // Fill days
      let currentDateIterator = new Date(start);
      while (currentDateIterator <= end) {
        this.pushDayToGrid(new Date(currentDateIterator));
        currentDateIterator.setDate(currentDateIterator.getDate() + 1);
      }

      // Pad empty days at end of month to complete the week (multiple of 7 columns)
      const lastDayOfMonth = end.getDay();
      for (let i = lastDayOfMonth; i < 6; i++) {
        this.calendarGrid.push({ isEmpty: true });
      }
    }
    else {
      // Weekly view
      let currentDateIterator = new Date(start);
      while (currentDateIterator <= end) {
        this.pushDayToGrid(new Date(currentDateIterator));
        currentDateIterator.setDate(currentDateIterator.getDate() + 1);
      }
    }
  }

  pushDayToGrid(date: Date): void {
    const dateStr = this.datePipe.transform(date, 'yyyy-MM-dd');
    // Find API data for this date
    const dataForDay = this.dailyStats.find(d => {
      const apiDateStr = this.datePipe.transform(new Date(d.date), 'yyyy-MM-dd');
      return apiDateStr === dateStr;
    });

    this.calendarGrid.push({
      isEmpty: false,
      date: date,
      day: date.getDate(),
      isToday: dateStr === this.datePipe.transform(new Date(), 'yyyy-MM-dd'),
      stats: dataForDay || null
    });
  }

  /* --- Chart Rendering (Chart.js) ---

  private updateCharts(graphs: any): void {
    this.renderMonthlyRevenueChart(graphs?.monthlyRevenueTrend || []);
    this.renderDailyRevenueChart(graphs?.dailyRevenueTrend || []);
    this.renderBookingStatusChart(graphs?.bookingStatusDistribution || []);
    this.renderRoomOccupancyChart(graphs?.roomOccupancyOverview || []);
    this.renderMonthlyCancellationChart(graphs?.monthlyCancellationTrend || []);
    this.renderPaymentModeChart(graphs?.paymentModeDistribution || []);
  }

  // Per-day revenue (amCharts XY) - Y axis: money, X axis: date
  private renderDailyRevenueChart(data: any[]): void {
    const container = document.getElementById('dailyRevenueChart');
    if (!container) return;

    if (this.dailyRevenueRoot) {
      this.dailyRevenueRoot.dispose();
      this.dailyRevenueRoot = undefined;
    }

    const root = am5.Root.new(container);
    this.dailyRevenueRoot = root;

    root.setThemes([
      am5themes_Animated.new(root)
    ]);

    const chart = root.container.children.push(am5xy.XYChart.new(root, {
      panX: true,
      panY: false,
      wheelX: 'panX',
      wheelY: 'zoomX',
      scrollbarX: am5.Scrollbar.new(root, { orientation: 'horizontal' }),
      pinchZoomX: true,
      paddingLeft: 0
    }));

    const cursor = chart.set('cursor', am5xy.XYCursor.new(root, {}));
    cursor.lineY.set('visible', false);

    // X axis (dates as categories)
    const xRenderer = am5xy.AxisRendererX.new(root, {
      minGridDistance: 20,
      minorGridEnabled: true
    });

    xRenderer.labels.template.setAll({
      rotation: -45,
      centerY: am5.p50,
      centerX: 0
    });

    xRenderer.grid.template.setAll({
      visible: false
    });

    const xAxis = chart.xAxes.push(am5xy.CategoryAxis.new(root, {
      maxDeviation: 0.3,
      categoryField: 'category',
      renderer: xRenderer,
      tooltip: am5.Tooltip.new(root, {})
    }));

    // Y axis (money)
    const yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, {
      maxDeviation: 0.3,
      renderer: am5xy.AxisRendererY.new(root, {})
    }));

    const series = chart.series.push(am5xy.ColumnSeries.new(root, {
      xAxis,
      yAxis,
      valueYField: 'value',
      categoryXField: 'category',
      adjustBulletPosition: false,
      tooltip: am5.Tooltip.new(root, {
        labelText: '{valueY}'
      })
    }));

    series.columns.template.setAll({
      width: am5.percent(60)
    });

    series.bullets.push(() => {
      return am5.Bullet.new(root, {
        locationY: 1,
        sprite: am5.Circle.new(root, {
          radius: 5,
          fill: series.get('fill')
        })
      });
    });

    // Map API data into chart data
    const chartData = (data || []).map((item: any) => ({
      category: this.datePipe.transform(item.date, 'dd MMM') || '',
      value: item.netRevenue ?? 0
    }));

    xAxis.data.setAll(chartData);
    series.data.setAll(chartData);

    series.appear(1000);
    chart.appear(1000, 100);
  }

  private renderMonthlyRevenueChart(data: any[]): void {
    const canvas = document.getElementById('monthlyRevenueChart') as HTMLCanvasElement | null;
    if (!canvas) return;

    if (this.monthlyRevenueChart) {
      this.monthlyRevenueChart.destroy();
    }

    const labels = data.map(d => d.label);
    const values = data.map(d => d.netRevenue);

    const config: ChartConfiguration<'line'> = {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Net Revenue',
            data: values,
            borderColor: '#4e73df',
            backgroundColor: 'rgba(78, 115, 223, 0.08)',
            tension: 0.4,
            fill: true,
            pointRadius: 3,
            pointBackgroundColor: '#4e73df'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top'
          }
        },
        scales: {
          y: {
            beginAtZero: true
      this.bookingStatusRoot = undefined;
    }

    const root = am5.Root.new(container);
    this.bookingStatusRoot = root;

    root.setThemes([
      am5themes_Animated.new(root)
    ]);

    const chart = root.container.children.push(
      am5percent.PieChart.new(root, {
        endAngle: 270,
        layout: root.verticalLayout,
        innerRadius: am5.percent(60)
      })
    );

    const series = chart.series.push(
      am5percent.PieSeries.new(root, {
        valueField: 'value',
        categoryField: 'category',
        endAngle: 270
      })
    );

    series.set('colors', am5.ColorSet.new(root, {
      colors: [
        am5.color(0x73556e),
        am5.color(0x9fa1a6),
        am5.color(0xf2aa6b),
        am5.color(0xf28f6b),
        am5.color(0xa95a52),
        am5.color(0xe35b5d),
        am5.color(0xffa446)
      ]
    }));

    const gradient = am5.RadialGradient.new(root, {
      stops: [
        { color: am5.color(0x000000) },
        { color: am5.color(0x000000) },
        {}
      ]
    });

    series.slices.template.setAll({
      fillGradient: gradient,
      strokeWidth: 2,
      stroke: am5.color(0xffffff),
      cornerRadius: 10,
      shadowOpacity: 0.1,
      shadowOffsetX: 2,
      shadowOffsetY: 2,
      shadowColor: am5.color(0x000000),
      fillPattern: am5.GrainPattern.new(root, {
        maxOpacity: 0.2,
        density: 0.5,
        colors: [am5.color(0x000000)]
      })
    });


    series.slices.template.setAll({
      fillGradient: gradient,
      strokeWidth: 2,
      stroke: am5.color(0xffffff),
      cornerRadius: 10,
      shadowOpacity: 0.1,
    series.ticks.template.setAll({
      strokeOpacity: 0.4,
      strokeDasharray: [2, 2]
    });

    series.states.create('hidden', {
      endAngle: -90
    });

    const chartData = (data || []).map((item: any) => ({
      category: item.status,
      value: item.count
    }));

    series.data.setAll(chartData);

    const legend = chart.children.push(am5.Legend.new(root, {
      centerX: am5.percent(50),
      x: am5.percent(50),
      marginTop: 15,
      marginBottom: 15
    }));

    legend.markerRectangles.template.adapters.add('fillGradient', () => undefined);
    legend.data.setAll(series.dataItems);

    series.appear(1000, 100);
  }


  private renderMonthlyCancellationChart(data: any[]): void {
    const canvas = document.getElementById('monthlyCancellationChart') as HTMLCanvasElement | null;
    if (!canvas) return;

    if (this.monthlyCancellationChart) {
      this.monthlyCancellationChart.destroy();
    }

    const labels = data.map(d => d.label);
    const values = data.map(d => d.cancellationCount);

    const config: ChartConfiguration<'bar'> = {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Cancellations',
            data: values,
            backgroundColor: '#e74a3b'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    };

    this.monthlyCancellationChart = new Chart(canvas, config);
  }

  private renderPaymentModeChart(data: any[]): void {
    const canvas = document.getElementById('paymentModeChart') as HTMLCanvasElement | null;
    if (!canvas) return;

    if (this.paymentModeChart) {
      this.paymentModeChart.destroy();
    }

    const labels = data.map(d => d.paymentMode);
    const values = data.map(d => d.amount);

    const config: ChartConfiguration<'doughnut'> = {
      type: 'doughnut',
      data: {
        labels,
        datasets: [
          {
            data: values,
            backgroundColor: ['#36b9cc', '#4e73df', '#1cc88a', '#f6c23e', '#e74a3b'],
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom'
          }
        }
      }
    };

    this.paymentModeChart = new Chart(canvas, config);
  }

  */

  private renderRoomOccupancyChart(data: any[]): void {
    const container = document.getElementById('roomOccupancyChart');
    if (!container) return;

    if (this.roomOccupancyRoot) {
      this.roomOccupancyRoot.dispose();
      this.roomOccupancyRoot = undefined;
    }

    if (!data || data.length === 0) return;

    const root = am5.Root.new(container);
    this.roomOccupancyRoot = root;
    root.setThemes([am5themes_Animated.new(root)]);

    const chart = root.container.children.push(
      am5xy.XYChart.new(root, {
        panX: false,
        panY: false,
        wheelX: 'none',
        wheelY: 'none',
        paddingLeft: 0,
        paddingRight: 10,
        layout: root.verticalLayout
      })
    );

    // Hover cursor
    const cursor = chart.set('cursor', am5xy.XYCursor.new(root, { behavior: 'none' }));
    cursor.lineX.set('visible', false);
    cursor.lineY.set('visible', false);

    // X axis — room types
    const xRenderer = am5xy.AxisRendererX.new(root, { minGridDistance: 20, cellStartLocation: 0.2, cellEndLocation: 0.8 });
    xRenderer.labels.template.setAll({ fontSize: 12, fill: am5.color(0x555555) });
    xRenderer.grid.template.setAll({ strokeOpacity: 0 });

    const xAxis = chart.xAxes.push(
      am5xy.CategoryAxis.new(root, {
        categoryField: 'roomType',
        renderer: xRenderer
      })
    );

    // Y axis — booking count
    const yRenderer = am5xy.AxisRendererY.new(root, {});
    yRenderer.labels.template.setAll({ fontSize: 11 });
    yRenderer.grid.template.setAll({ strokeDasharray: [3, 3], stroke: am5.color(0xdddddd) });

    chart.yAxes.push(
      am5xy.ValueAxis.new(root, { min: 0, strictMinMax: false, renderer: yRenderer })
    );
    const yAxis = chart.yAxes.getIndex(0) as am5xy.ValueAxis<am5xy.AxisRendererY>;

    // Single series — bookings per room type
    const series = chart.series.push(
      am5xy.ColumnSeries.new(root, {
        name: 'Bookings',
        xAxis,
        yAxis,
        valueYField: 'bookingCount',
        categoryXField: 'roomType',
        tooltip: am5.Tooltip.new(root, {
          labelText: '[bold]{categoryX}[/]\n{valueY} bookings',
          getFillFromSprite: true
        })
      })
    );

    series.columns.template.setAll({
      width: am5.percent(60),
      cornerRadiusTL: 6,
      cornerRadiusTR: 6,
      fill: am5.color(0x4e73df),
      stroke: am5.color(0x4e73df),
      strokeOpacity: 0
    });

    // Gradient fill per column by value
    series.set('heatRules', [{
      target: series.columns.template,
      dataField: 'valueY',
      min: am5.color(0x6fa3f8),
      max: am5.color(0x1a3fc4),
      key: 'fill'
    }]);

    // Value label above each bar
    series.bullets.push(() =>
      am5.Bullet.new(root, {
        locationY: 1,
        sprite: am5.Label.new(root, {
          text: '{valueY}',
          populateText: true,
          fill: am5.color(0x333333),
          fontSize: 12,
          fontWeight: '600',
          centerX: am5.percent(50),
          centerY: am5.percent(100),
          dy: -6
        })
      })
    );

    // Map data
    const chartData = (data || []).map((item: any) => ({
      roomType: item.roomType ?? '',
      bookingCount: item.bookingCount ?? 0
    }));

    xAxis.data.setAll(chartData);
    series.data.setAll(chartData);

    series.appear(1000);
    chart.appear(1000, 100);
  }

  // --- Chart Rendering (Chart.js + amCharts) ---


  private updateCharts(graphs: any): void {
    this.renderMonthlyRevenueChart(graphs?.monthlyRevenueTrend || []);
    this.renderDailyRevenueChart(graphs?.dailyRevenueTrend || []);
    this.renderBookingStatusChart(graphs?.bookingStatusDistribution || []);
    this.renderRoomOccupancyChart(graphs?.roomOccupancyOverview || []);
    this.renderMonthlyCancellationChart(graphs?.monthlyCancellationTrend || []);
    this.renderPaymentModeChart(graphs?.paymentModeDistribution || []);
  }

  private renderMonthlyRevenueChart(data: any[]): void {
    const container = document.getElementById('monthlyRevenueChart');
    if (!container) return;

    if (this.monthlyRevenueRoot) {
      this.monthlyRevenueRoot.dispose();
      this.monthlyRevenueRoot = undefined;
    }

    const root = am5.Root.new(container);
    this.monthlyRevenueRoot = root;

    root.setThemes([am5themes_Animated.new(root)]);

    // Disable auto-created legend from theme
    root.container.set('background', am5.Rectangle.new(root, { fill: am5.color(0xffffff), fillOpacity: 0 }));

    const chart = root.container.children.push(
      am5xy.XYChart.new(root, {
        paddingRight: 80,
        paddingLeft: 0,
        layout: root.verticalLayout
      })
    );

    chart.setAll({
      paddingTop: 10
    });

    // Y axis — months as categories
    const yRenderer = am5xy.AxisRendererY.new(root, {});
    yRenderer.grid.template.setAll({ strokeOpacity: 0 });
    yRenderer.labels.template.setAll({
      fontSize: 12,
      fill: am5.color(0x555555),
      paddingRight: 8
    });

    const yAxis = chart.yAxes.push(
      am5xy.CategoryAxis.new(root, {
        categoryField: 'month',
        renderer: yRenderer,
        tooltip: am5.Tooltip.new(root, {})
      })
    );

    // X axis — revenue values (hidden labels/grid, only one line at end visible via bullet)
    const xRenderer = am5xy.AxisRendererX.new(root, {});
    xRenderer.labels.template.setAll({
      visible: false
    });
    xRenderer.grid.template.setAll({ strokeOpacity: 0 });

    const xAxis = chart.xAxes.push(
      am5xy.ValueAxis.new(root, {
        renderer: xRenderer,
        min: 0,
        extraMax: 0.15,
        strictMinMax: true
      })
    );

    // Series — horizontal columns
    const series = chart.series.push(
      am5xy.ColumnSeries.new(root, {
        xAxis,
        yAxis,
        valueXField: 'revenue',
        categoryYField: 'month',
        tooltip: am5.Tooltip.new(root, {
          pointerOrientation: 'vertical',
          dy: -30,
          labelText: '₹{valueX}'
        })
      })
    );

    const columnTemplate = series.columns.template;
    columnTemplate.setAll({
      height: am5.percent(50),
      maxHeight: 50,
      cornerRadiusTR: 10,
      cornerRadiusBR: 10,
      cornerRadiusTL: 60,
      cornerRadiusBL: 60,
      strokeOpacity: 0
    });

    // Gradient fill: yellow → green (like the reference)
    series.set('heatRules', [{
      target: columnTemplate,
      dataField: 'valueX',
      min: am5.color(0xe5dc36),
      max: am5.color(0x5faa46),
      key: 'fill'
    }]);


    // Cursor — hide both lines (no crosshair)
    const cursor = chart.set('cursor', am5xy.XYCursor.new(root, {}));
    cursor.lineX.set('visible', false);
    cursor.lineY.set('visible', false);
    cursor.setAll({ behavior: 'none' });

    // Map data: months on Y, revenue on X (reversed order so highest is at bottom)
    const chartData = (data || []).map((item: any) => ({
      month: item.label ?? '',
      revenue: item.netRevenue ?? 0
    })).reverse();

    yAxis.data.setAll(chartData);
    series.data.setAll(chartData);

    // Hide any legend auto-created by the animated theme
    chart.children.each((child) => {
      if (child instanceof am5.Legend) {
        child.set('visible', false);
      }
    });

    series.appear(1000);
    chart.appear(1000, 100);
  }

  // Per-day revenue (amCharts XY) - Y axis: money, X axis: date
  private renderDailyRevenueChart(data: any[]): void {
    const container = document.getElementById('dailyRevenueChart');
    if (!container) return;

    if (this.dailyRevenueRoot) {
      this.dailyRevenueRoot.dispose();
      this.dailyRevenueRoot = undefined;
    }

    const root = am5.Root.new(container);
    this.dailyRevenueRoot = root;

    root.setThemes([
      am5themes_Animated.new(root)
    ]);

    const chart = root.container.children.push(am5xy.XYChart.new(root, {
      panX: true,
      panY: false,
      wheelX: 'panX',
      wheelY: 'zoomX',
      scrollbarX: am5.Scrollbar.new(root, { orientation: 'horizontal' }),
      pinchZoomX: true,
      paddingLeft: 0
    }));

    const cursor = chart.set('cursor', am5xy.XYCursor.new(root, {}));
    cursor.lineY.set('visible', false);

    // X axis (dates as categories)
    const xRenderer = am5xy.AxisRendererX.new(root, {
      minGridDistance: 20,
      minorGridEnabled: true
    });

    xRenderer.labels.template.setAll({
      rotation: -45,
      centerY: am5.p50,
      centerX: 0
    });

    xRenderer.grid.template.setAll({
      visible: false
    });

    const xAxis = chart.xAxes.push(am5xy.CategoryAxis.new(root, {
      maxDeviation: 0.3,
      categoryField: 'category',
      renderer: xRenderer,
      tooltip: am5.Tooltip.new(root, {})
    }));

    // Y axis (money)
    const yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, {
      maxDeviation: 0.3,
      renderer: am5xy.AxisRendererY.new(root, {})
    }));

    const series = chart.series.push(am5xy.ColumnSeries.new(root, {
      xAxis,
      yAxis,
      valueYField: 'value',
      categoryXField: 'category',
      adjustBulletPosition: false,
      tooltip: am5.Tooltip.new(root, {
        labelText: '{valueY}'
      })
    }));

    series.columns.template.setAll({
      width: am5.percent(60)
    });

    series.bullets.push(() => {
      return am5.Bullet.new(root, {
        locationY: 1,
        sprite: am5.Circle.new(root, {
          radius: 5,
          fill: series.get('fill')
        })
      });
    });

    // Map API data into chart data
    const chartData = (data || []).map((item: any) => ({
      category: this.datePipe.transform(item.date, 'dd MMM') || '',
      value: item.netRevenue ?? 0
    }));

    xAxis.data.setAll(chartData);
    series.data.setAll(chartData);

    series.appear(1000);
    chart.appear(1000, 100);
  }

  private renderBookingStatusChart(data: any[]): void {
    const container = document.getElementById('bookingStatusChart');
    if (!container) return;

    if (this.bookingStatusRoot) {
      this.bookingStatusRoot.dispose();
      this.bookingStatusRoot = undefined;
    }

    const root = am5.Root.new(container);
    this.bookingStatusRoot = root;

    root.setThemes([
      am5themes_Animated.new(root)
    ]);

    const chart = root.container.children.push(
      am5percent.PieChart.new(root, {
        endAngle: 270,
        layout: root.verticalLayout,
        innerRadius: am5.percent(60)
      })
    );

    const series = chart.series.push(
      am5percent.PieSeries.new(root, {
        valueField: 'value',
        categoryField: 'category',
        endAngle: 270
      })
    );

    // Use clean, solid colors for each status
    series.set('colors', am5.ColorSet.new(root, {
      colors: [
        am5.color(0xe74a3b), // Cancelled
        am5.color(0x4e73df), // CheckedOut
        am5.color(0xf6c23e), // Reserved
        am5.color(0x1cc88a)  // Others if present
      ]
    }));

    // Simple slice styling (no dark gradient / grain)
    series.slices.template.setAll({
      strokeWidth: 2,
      stroke: am5.color(0xffffff),
      cornerRadius: 10,
      shadowOpacity: 0.15,
      shadowOffsetX: 2,
      shadowOffsetY: 2,
      shadowColor: am5.color(0x000000),
      tooltipText: '{category}: {value}'
    });

    // Show actual counts instead of percentages in labels
    series.labels.template.setAll({
      text: '{category}: {value}',
      fontSize: 12
    });

    series.ticks.template.setAll({
      strokeOpacity: 0.4,
      strokeDasharray: [2, 2]
    });

    series.states.create('hidden', {
      endAngle: -90
    });

    const chartData = (data || []).map((item: any) => ({
      category: item.status,
      value: item.count
    }));

    series.data.setAll(chartData);

    const legend = chart.children.push(am5.Legend.new(root, {
      centerX: am5.percent(50),
      x: am5.percent(50),
      marginTop: 15,
      marginBottom: 15
    }));

    legend.markerRectangles.template.adapters.add('fillGradient', () => undefined);
    // Legend shows counts (values), not percentages
    legend.valueLabels.template.setAll({
      text: '{value}'
    });
    legend.data.setAll(series.dataItems);

    series.appear(1000, 100);
  }

  // (duplicate removed — see renderRoomOccupancyChart above)

  private renderMonthlyCancellationChart(data: any[]): void {
    const canvas = document.getElementById('monthlyCancellationChart') as HTMLCanvasElement | null;
    if (!canvas) return;

    if (this.monthlyCancellationChart) {
      this.monthlyCancellationChart.destroy();
    }

    const labels = data.map(d => d.label);
    const values = data.map(d => d.cancellationCount);

    const config: ChartConfiguration<'bar'> = {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Cancellations',
            data: values,
            backgroundColor: '#e74a3b'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    };

    this.monthlyCancellationChart = new Chart(canvas, config);
  }

  private renderPaymentModeChart(data: any[]): void {
    const container = document.getElementById('paymentModeChart');
    if (!container) return;

    if (this.paymentModeRoot) {
      this.paymentModeRoot.dispose();
      this.paymentModeRoot = undefined;
    }

    const root = am5.Root.new(container);
    this.paymentModeRoot = root;

    root.setThemes([
      am5themes_Animated.new(root)
    ]);

    const chart = root.container.children.push(
      am5percent.PieChart.new(root, {
        endAngle: 270,
        layout: root.verticalLayout,
        innerRadius: am5.percent(60)
      })
    );

    const series = chart.series.push(
      am5percent.PieSeries.new(root, {
        valueField: 'value',
        categoryField: 'category',
        endAngle: 270
      })
    );

    // Colors analogous to booking status chart
    series.set('colors', am5.ColorSet.new(root, {
      colors: [
        am5.color(0x4e73df), // Card / Online
        am5.color(0x1cc88a), // Cash
        am5.color(0xf6c23e), // UPI / Wallet
        am5.color(0xe74a3b)  // Others / Refunds
      ]
    }));

    // Clean slice styling
    series.slices.template.setAll({
      strokeWidth: 2,
      stroke: am5.color(0xffffff),
      cornerRadius: 10,
      shadowOpacity: 0.15,
      shadowOffsetX: 2,
      shadowOffsetY: 2,
      shadowColor: am5.color(0x000000),
      tooltipText: '{category}: {value}'
    });

    // Show actual amount values, not percentages
    series.labels.template.setAll({
      text: '{category}: {value}',
      fontSize: 12
    });

    const chartData = (data || []).map((item: any) => ({
      category: item.paymentMode,
      value: item.amount ?? 0
    }));

    series.data.setAll(chartData);

    const legend = chart.children.push(am5.Legend.new(root, {
      centerX: am5.percent(50),
      x: am5.percent(50),
      marginTop: 15,
      marginBottom: 15
    }));

    legend.markerRectangles.template.adapters.add('fillGradient', () => undefined);
    legend.valueLabels.template.setAll({
      text: '{value}'
    });
    legend.data.setAll(series.dataItems);

    series.appear(1000, 100);
  }

}
