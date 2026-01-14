import React, { useState, useMemo, useRef } from "react";
import { View, Text, ScrollView, TouchableOpacity, Dimensions, Modal, Alert, Platform, } from "react-native";
import { LineChart, PieChart, BarChart } from "react-native-chart-kit";
import { captureRef } from 'react-native-view-shot';
import ViewShot from 'react-native-view-shot';

// platform checks use Platform from react-native

const screenWidth = Dimensions.get("window").width;

// ---------- Configuration ----------
import API_BASE from "../config";

// ---------- Helpers ----------
// ---------- Helpers ----------
const pad = (n) => String(n).padStart(2, "0");

// Parse date string (handles ISO or YYYY-MM-DD)
const parseDate = (d) => {
  if (!d) return new Date();
  const date = new Date(d);
  return isNaN(date.getTime()) ? new Date() : date;
};

// Format YYYY-MM-DD
const fmtYMD = (d) => {
  const date = parseDate(d);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

// Start of day comparison
const isSameDay = (d1, d2) => {
  return d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();
};

const isSameMonth = (d1, d2) => {
  return d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth();
};

// ---------- Aggregation ----------
function aggregate(activities, totalRegisteredUsers = 0, timeFilter = 'all') {
  // If totalRegisteredUsers is passed (from server), use it. 
  // Otherwise fallback to unique users in the activity list.
  const uniqueInList = new Set(activities.map((a) => a.userId)).size;
  const totalUsers = totalRegisteredUsers > 0 ? totalRegisteredUsers : uniqueInList;

  // Active users = unique users in filtered activities
  const activeUsers = new Set(activities.map((a) => a.userId)).size;

  const sessionsSum = activities.reduce((s, a) => s + (a.sessions || 0), 0);
  const avgSessionDuration =
    activities.length > 0
      ? Math.round(
        activities.reduce((s, a) => s + (a.duration || 0), 0) / activities.length
      )
      : 0;

  const engagementRate =
    totalUsers > 0 ? `${Math.round((activeUsers / totalUsers) * 100)}%` : "0%";

  let counts = [];
  let labels = [];
  let tooltipLabels = [];

  // Determine latest date in the (filtered) dataset for anchoring "All Time"
  // Default to today if empty
  const maxDate = activities.length > 0
    ? new Date(Math.max(...activities.map(a => parseDate(a.date).getTime())))
    : new Date();

  // --- CHART LOGIC ---
  if (timeFilter === 'today') {
    // 24 Hours (0..23)
    labels = Array(24).fill(""); // No labels requested
    counts = Array(24).fill(0);
    activities.forEach(a => {
      const h = parseDate(a.date).getHours();
      if (h >= 0 && h < 24) counts[h] += (a.sessions || 0);
    });
    for (let h = 0; h < 24; h++) {
      const d = new Date(); d.setHours(h); d.setMinutes(0);
      tooltipLabels.push(d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }));
    }

  } else if (timeFilter === 'thisMonth') {
    // Days in Month (1..31)
    const daysInMonth = new Date(maxDate.getFullYear(), maxDate.getMonth() + 1, 0).getDate();
    const monthName = maxDate.toLocaleString('default', { month: 'long' });

    labels = Array(daysInMonth).fill(""); // No labels requested
    counts = Array(daysInMonth).fill(0);

    activities.forEach(a => {
      const day = parseDate(a.date).getDate();
      if (day >= 1 && day <= daysInMonth) {
        counts[day - 1] += (a.sessions || 0);
      }
    });
    for (let d = 1; d <= daysInMonth; d++) {
      tooltipLabels.push(`${d} ${monthName}`);
    }

  } else {
    // 'all' -> Last 6 Months ending at maxDate
    for (let i = 5; i >= 0; i--) {
      // Calculate target month year
      const d = new Date(maxDate.getFullYear(), maxDate.getMonth() - i, 1);

      const monStr = d.toLocaleString("default", { month: "short" });
      labels.push(monStr);
      tooltipLabels.push(d.toLocaleString("default", { month: "long" }));

      // Sum sessions for this month/year
      const countForMonth = activities
        .filter((a) => isSameMonth(parseDate(a.date), d))
        .reduce((s, a) => s + (a.sessions || 0), 0);
      counts.push(countForMonth);
    }
  }

  return {
    totalUsers,
    activeUsers,
    monthlySessions: sessionsSum,
    avgSessionDuration,
    engagementRate,
    loginTrend: counts,
    chartLabels: labels,
    tooltipLabels: tooltipLabels,
    trendMode: timeFilter,
  };
}

// ---------- Stat Card ----------
function StatCard({ label, value }) {
  return (
    <View
      style={{
        width: "48%",
        backgroundColor: "#f9f9f9",
        borderRadius: 12,
        padding: 14,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 1 },
      }}
    >
      <Text style={{ fontSize: 20, fontWeight: "700", color: "#B71C1C" }}>
        {value}
      </Text>
      <Text style={{ color: "#555", marginTop: 6 }}>{label}</Text>
    </View>
  );
}

export default function UserActivityDashboard() {
  const [loading, setLoading] = useState(true);
  const [serverTotalUsers, setServerTotalUsers] = useState(0);
  const [rawActivities, setRawActivities] = useState([]); // from API
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, value: 0, label: "" });

  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [dashboardLabel, setDashboardLabel] = useState("All Time");

  // Filters State
  const [timeFilter, setTimeFilter] = useState('all'); // 'today', 'thisMonth', 'all'
  const [degreeFilter, setDegreeFilter] = useState('All');
  const [yearFilter, setYearFilter] = useState('All');

  const [filteredActivities, setFilteredActivities] = useState([]);
  const [filteredAgg, setFilteredAgg] = useState({});

  const [selectedIndex, setSelectedIndex] = useState(null);
  const clickHandledRef = useRef(false);

  // Chart Refs
  const trendChartRef = useRef();
  const degreeChartRef = useRef();
  const yearChartRef = useRef();


  // Constants for Filters
  const DEGREES = ['All', 'Foundation', 'Bachelor', 'Master', 'PhD'];
  const YEARS = ['All', '1st Year', '2nd Year', '3rd Year', '4th Year+'];

  // Helper: Year of Study
  const getYearOfStudy = (enrollmentYear) => {
    if (!enrollmentYear) return 'Unknown';
    const currentYear = new Date().getFullYear();
    const diff = currentYear - Number(enrollmentYear);
    if (diff < 1) return '1st Year';
    if (diff >= 4) return '4th Year+';
    return `${diff}${['st', 'nd', 'rd'][diff - 1] || 'th'} Year`;
  };

  const [userDemographics, setUserDemographics] = useState([]);

  // Fetch Data
  React.useEffect(() => {
    fetch(`${API_BASE}/api/analytics/activity`)
      .then(res => res.json())
      .then(data => {
        const activities = data.activities || [];
        setRawActivities(activities);
        const tUsers = data.totalUsers || 0;
        setServerTotalUsers(tUsers);
        setUserDemographics(data.userDemographics || []);

        // Initial Apply
        setFilteredActivities(activities);
        // Pass 'all' default
        setFilteredAgg(aggregate(activities, tUsers, 'all'));
        setLoading(false);
      })
      .catch(err => {
        console.error("Activity fetch error", err);
        setLoading(false);
      });
  }, []);

  const now = new Date(); // Current real time for filters

  // ---------- Unified Filter Logic ----------
  const applyFilters = (data, timeKey, degreeKey, yearKey) => {
    let subset = data;

    // 1. Time Filter
    // Note: We filter strictly by Current Date/Month for "Today"/"This Month" requests
    // UNLESS the user implies "Relative to data".
    // Standard Dashboard behavior is usually "Real Time".
    if (timeKey === "today") {
      subset = subset.filter(a => isSameDay(parseDate(a.date), now));
      setDashboardLabel("Today");
    } else if (timeKey === "thisMonth") {
      subset = subset.filter(a => isSameMonth(parseDate(a.date), now));
      setDashboardLabel("This Month");
    } else {
      setDashboardLabel("All Time");
    }

    // 2. Degree Filter
    if (degreeKey !== 'All') {
      subset = subset.filter(a => a.degree_type === degreeKey);
    }

    // 3. Year Filter
    if (yearKey !== 'All') {
      subset = subset.filter(a => getYearOfStudy(a.enrollment_year) === yearKey);
    }

    setFilteredActivities(subset);
    setFilteredAgg(aggregate(subset, serverTotalUsers, timeKey)); // Pass timeKey to aggregate
  };

  const handleApplyFilter = () => {
    setFilterModalVisible(false);
    applyFilters(rawActivities, timeFilter, degreeFilter, yearFilter);
  };

  const resetFilters = () => {
    setTimeFilter('all');
    setDegreeFilter('All');
    setYearFilter('All');
    setFilterModalVisible(false);
    applyFilters(rawActivities, 'all', 'All', 'All');
  };

  // ---------- Aggregation (Extended) ----------
  // We need to calc distributions for the charts.
  // CRITICAL: We now use 'userDemographics' (full population) instead of 'filteredActivities' (transactions).
  // If we wanted robust filtering, we could filter 'userDemographics' by degree/year too if needed,
  // but usually "Audience Overview" shows the *whole* audience.
  // HOWEVER, if the user explicitly Filters by Degree="Master", they might expect the charts to reflect that.
  // Let's filter 'userDemographics' based on the current *Demographic Filters* (Degree, Year) but IGNORE Time filter.

  // Color Helper
  const getColorForLabel = (label) => {
    switch (label) {
      case 'Foundation':
      case '1st Year':
        return '#F44336'; // Red
      case 'Bachelor':
      case '2nd Year':
        return '#2196F3'; // Blue
      case 'Master':
      case '3rd Year':
        return '#FBC02D'; // Yellow
      case 'PhD':
      case '4th Year+':
        return '#4CAF50'; // Green
      default:
        return '#9E9E9E'; // Grey
    }
  };

  const filteredDemographics = useMemo(() => {
    let subset = userDemographics || [];
    if (degreeFilter !== 'All') {
      subset = subset.filter(u => u.degree_type === degreeFilter);
    }
    if (yearFilter !== 'All') {
      subset = subset.filter(u => getYearOfStudy(u.enrollment_year) === yearFilter);
    }
    return subset;
  }, [userDemographics, degreeFilter, yearFilter]);

  const degreeDistribution = useMemo(() => {
    const counts = {};
    filteredDemographics.forEach(u => {
      const d = u.degree_type || 'Unknown';
      counts[d] = (counts[d] || 0) + 1;
    });
    return Object.keys(counts).map(key => ({
      name: key,
      population: counts[key],
      color: getColorForLabel(key),
      legendFontColor: "#7F7F7F",
      legendFontSize: 12
    }));
  }, [filteredDemographics]);

  const yearDistribution = useMemo(() => {
    const counts = {};
    filteredDemographics.forEach(u => {
      const y = getYearOfStudy(u.enrollment_year);
      counts[y] = (counts[y] || 0) + 1;
    });
    // Order them: 1st, 2nd, 3rd, 4th+
    const order = ['1st Year', '2nd Year', '3rd Year', '4th Year+', 'Unknown'];
    return {
      labels: order.filter(k => counts[k]),
      datasets: [{ data: order.filter(k => counts[k]).map(k => counts[k]) }]
    };
  }, [filteredDemographics]);


  // ---------- Chart labels (Trend) ----------
  // ---------- Chart labels (Trend) ----------
  const chartLabels = filteredAgg.chartLabels || [];
  const tooltipLabels = filteredAgg.tooltipLabels || [];
  const trendData = filteredAgg.loginTrend || [];
  const noData = !filteredActivities.length; // Simplified noData check

  // removed user composition visualization per request

  // CSV export removed; PDF-only export is used below

  // ---------- Export PDF ----------
  const exportPDF = async () => {
    if (noData) {
      Alert.alert('Export', 'No data available to export.');
      return;
    }
    if (Platform && Platform.OS === 'web') {
      Alert.alert('Export not supported', 'PDF export is available on mobile devices only.');
      return;
    }
    try {
      const Print = await import('expo-print');
      const Sharing = await import('expo-sharing');

      // Wait for renders
      await new Promise(res => setTimeout(res, 500));

      // Capture Charts
      const trendBase64 = trendChartRef.current ? await captureRef(trendChartRef.current, { format: 'png', quality: 0.8, result: 'base64' }) : null;
      const degreeBase64 = degreeChartRef.current ? await captureRef(degreeChartRef.current, { format: 'png', quality: 0.8, result: 'base64' }) : null;
      const yearBase64 = yearChartRef.current ? await captureRef(yearChartRef.current, { format: 'png', quality: 0.8, result: 'base64' }) : null;

      const title = `User Activity Report - ${new Date().toLocaleString()}`;

      const rows = filteredActivities.map(a => `
        <tr>
          <td>${a.date}</td>
          <td>${a.userId}</td>
          <td>${a.degree_type || '-'}</td>
          <td>${getYearOfStudy(a.enrollment_year)}</td>
          <td style="text-align:center">${a.sessions || 0}</td>
        </tr>`).join('');

      const html = `
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <style>
              body { font-family: Arial, Helvetica, sans-serif; padding: 20px }
              h1 { color: #B71C1C; text-align: center; }
              .header-info { text-align: center; color: #555; margin-bottom: 20px; }
              .kpi-container { display: flex; justify-content: space-between; margin-bottom: 20px; }
              .kpi-card { border: 1px solid #ddd; padding: 10px; border-radius: 8px; width: 23%; text-align: center; background: #f9f9f9; }
              .kpi-value { font-size: 18px; font-weight: bold; color: #B71C1C; }
              .kpi-label { font-size: 12px; color: #666; }
              .chart-section { margin-bottom: 30px; text-align: center; }
              .chart-img { width: 90%; max-width: 600px; height: auto; border: 1px solid #eee; border-radius: 8px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; font-size: 12px; }
              th { background: #B71C1C; color: white; text-align: left }
            </style>
          </head>
          <body>
            <h1>${title}</h1>
            <div class="header-info">
              <p><strong>Filters:</strong> ${dashboardLabel} | <strong>Degree:</strong> ${degreeFilter} | <strong>Year:</strong> ${yearFilter}</p>
            </div>

            <div class="kpi-container">
              <div class="kpi-card">
                <div class="kpi-value">${filteredAgg.totalUsers || 0}</div>
                <div class="kpi-label">Total Users</div>
              </div>
              <div class="kpi-card">
                <div class="kpi-value">${filteredAgg.activeUsers || 0}</div>
                <div class="kpi-label">Active (Period)</div>
              </div>
              <div class="kpi-card">
                <div class="kpi-value">${filteredAgg.avgSessionDuration || 0}m</div>
                <div class="kpi-label">Avg Session</div>
              </div>
              <div class="kpi-card">
                <div class="kpi-value">${filteredAgg.monthlySessions || 0}</div>
                <div class="kpi-label">Interactions</div>
              </div>
            </div>

            <div class="chart-section">
              <h3>Activity Trend</h3>
              ${trendBase64 ? `<img src="data:image/png;base64,${trendBase64}" class="chart-img" />` : '<p>(Chart not captured)</p>'}
            </div>

            <div class="chart-section">
              <h3>Demographics: By Degree</h3>
              ${degreeBase64 ? `<img src="data:image/png;base64,${degreeBase64}" class="chart-img" />` : '<p>(Chart not captured)</p>'}
            </div>

            <div class="chart-section">
              <h3>Demographics: By Year</h3>
              ${yearBase64 ? `<img src="data:image/png;base64,${yearBase64}" class="chart-img" />` : '<p>(Chart not captured)</p>'}
            </div>

            <h2>Detailed Activities</h2>
            <table>
              <thead><tr><th>Date</th><th>User</th><th>Degree</th><th>Year</th><th>Sessions</th></tr></thead>
              <tbody>${rows}</tbody>
            </table>
          </body>
        </html>`;

      const { uri } = await Print.printToFileAsync({ html });
      if (uri) {
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri);
        } else {
          Alert.alert('Export', 'PDF generated at: ' + uri);
        }
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Export failed', String(err));
    }
  };

  const showExportOptions = () => {
    // simplified to PDF-only export
    exportPDF();
  };

  // ---------- Render ----------


  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView style={{ flex: 1, backgroundColor: "#fff" }} contentContainerStyle={{ padding: 16 }}>
        <Text style={{ fontSize: 24, fontWeight: "800", marginBottom: 8, color: '#1a1a1a' }}>
          User Analytics
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <Text style={{ color: '#666', marginRight: 10 }}>{dashboardLabel}</Text>
          {(degreeFilter !== 'All' || yearFilter !== 'All') && (
            <Text style={{ fontSize: 12, color: '#B71C1C', backgroundColor: '#ffebee', padding: 4, borderRadius: 4 }}>
              Filtered: {degreeFilter}, {yearFilter}
            </Text>
          )}
        </View>

        {/* Action row */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
          <TouchableOpacity onPress={() => setFilterModalVisible(true)} style={{ backgroundColor: '#D32F2F', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, flexDirection: 'row', alignItems: 'center', shadowColor: '#D32F2F', shadowOpacity: 0.3, shadowRadius: 4, elevation: 4 }}>
            <Text style={{ color: '#fff', fontWeight: '600' }}>Filters & Options</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={exportPDF} disabled={noData} style={{ backgroundColor: noData ? '#f5f5f5' : '#fff', borderWidth: 1, borderColor: noData ? '#eee' : '#D32F2F', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8 }}>
            <Text style={{ color: noData ? '#bbb' : '#D32F2F', fontWeight: '600' }}>Export PDF</Text>
          </TouchableOpacity>
        </View>

        {/* KPI Cards */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20 }}>
          <StatCard label="Total Users" value={filteredAgg.totalUsers || 0} />
          <StatCard label="Active (Period)" value={filteredAgg.activeUsers || 0} />
          <StatCard label="Avg Session" value={`${filteredAgg.avgSessionDuration || 0}m`} />
          <StatCard label="Interactions" value={filteredAgg.monthlySessions || 0} />
        </View>

        {/* --- Charts Section --- */}

        {/* 1. Login Trend */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 12, color: '#333' }}>Activity Trend</Text>
          <ViewShot ref={trendChartRef} options={{ format: "png", quality: 0.8 }} style={{ backgroundColor: '#fff' }}>
            <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 8, borderWidth: 1, borderColor: '#eee' }}>
              {!noData ? (
                <View style={{ position: 'relative' }}>
                  <TouchableOpacity activeOpacity={1} onPress={() => setTooltip((p) => ({ ...p, visible: false }))}>
                    <LineChart
                      data={{ labels: chartLabels, datasets: [{ data: trendData }] }}
                      width={screenWidth - 48}
                      height={220}
                      yAxisLabel=""
                      chartConfig={{
                        backgroundColor: '#fff',
                        backgroundGradientFrom: '#fff',
                        backgroundGradientTo: '#fff',
                        decimalPlaces: 0,
                        color: (opacity = 1) => `rgba(183, 28, 28, ${opacity})`, // Red theme
                        labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                        propsForDots: { r: '4', strokeWidth: '2', stroke: '#B71C1C' }
                      }}
                      bezier
                      style={{ borderRadius: 16 }}
                      onDataPointClick={({ index, value, x, y }) => {
                        const chartWidth = screenWidth - 48;
                        let tooltipX = x - 30;
                        if (tooltipX < 0) tooltipX = 0;
                        if (tooltipX + 60 > chartWidth) tooltipX = chartWidth - 60;

                        setTooltip({
                          visible: true,
                          x: tooltipX,
                          y: y - 40,
                          value: value,
                          label: tooltipLabels[index] || ''
                        });
                      }}
                    />
                  </TouchableOpacity>
                  {tooltip.visible && (
                    <View style={{
                      position: 'absolute',
                      top: tooltip.y,
                      left: tooltip.x,
                      backgroundColor: '#B71C1C',
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 6,
                      zIndex: 10
                    }}>
                      {/* Update Tooltip Text */}
                      <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>
                        {tooltip.value} Student{tooltip.value !== 1 ? 's' : ''}
                      </Text>
                      {tooltip.label ? <Text style={{ color: '#fff', fontSize: 10 }}>{tooltip.label}</Text> : null}
                    </View>
                  )}
                </View>
              ) : <Text style={{ padding: 20, textAlign: 'center', color: '#999' }}>No data available</Text>}
            </View>
          </ViewShot>
        </View>

        {/* 2. Degree Distribution (Pie) & Year (Bar) */}
        {!noData && (
          <View>
            <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 12, color: '#333' }}>Demographics</Text>

            <View style={{ marginBottom: 20 }}>
              {/* Degree Pie */}
              <ViewShot ref={degreeChartRef} options={{ format: "png", quality: 0.8 }} style={{ backgroundColor: '#fff', marginBottom: 16 }}>
                <View style={{ backgroundColor: '#fafafa', borderRadius: 16, padding: 16 }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 10 }}>By Degree Type</Text>
                  <PieChart
                    data={degreeDistribution}
                    width={screenWidth - 64}
                    height={200}
                    chartConfig={{
                      color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                    }}
                    accessor={"population"}
                    backgroundColor={"transparent"}
                    paddingLeft={"15"}
                    center={[10, 0]}
                    absolute
                  />
                </View>
              </ViewShot>

              {/* Year Bar Chart (Custom Horizontal) */}
              {yearDistribution.labels.length > 0 && (
                <ViewShot ref={yearChartRef} options={{ format: "png", quality: 0.8 }} style={{ backgroundColor: '#fff' }}>
                  <View style={{ backgroundColor: '#fafafa', borderRadius: 16, padding: 18 }}>
                    <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 16 }}>By Year of Study</Text>

                    {(() => {
                      // Calculate max for scale
                      const dataValues = yearDistribution.datasets[0].data;
                      const maxVal = Math.max(...dataValues) || 1;

                      return yearDistribution.labels.map((label, index) => {
                        const count = dataValues[index];
                        const percentage = (count / maxVal) * 100;
                        const barColor = getColorForLabel(label); // Dynamic Color

                        return (
                          <View key={label} style={{ marginBottom: 14 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                              <Text style={{ fontSize: 14, color: '#333', fontWeight: '500' }}>{label}</Text>
                              <Text style={{ fontSize: 13, color: '#666' }}>{count} students</Text>
                            </View>
                            <View style={{ height: 10, backgroundColor: '#e0e0e0', borderRadius: 5, overflow: 'hidden' }}>
                              <View style={{
                                height: 10,
                                width: `${percentage}%`,
                                backgroundColor: barColor, // Use dynamic color
                                borderRadius: 5
                              }} />
                            </View>
                          </View>
                        );
                      });
                    })()}
                  </View>
                </ViewShot>
              )}
            </View>
          </View>
        )}

        {/* Recent Activity removed per request */}

        {/* Filter Modal */}
        <Modal
          visible={filterModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setFilterModalVisible(false)}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
            <View style={{ backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '80%' }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <Text style={{ fontSize: 20, fontWeight: '700' }}>Filter Dashboard</Text>
                <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                  <Text style={{ fontSize: 16, color: '#666' }}>Close</Text>
                </TouchableOpacity>
              </View>

              <ScrollView>
                <Text style={{ fontSize: 16, fontWeight: '600', marginTop: 10, marginBottom: 8 }}>Time Period</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                  {['today', 'thisMonth', 'all'].map(t => (
                    <TouchableOpacity key={t}
                      onPress={() => setTimeFilter(t)}
                      style={{
                        paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, marginRight: 8, marginBottom: 8,
                        backgroundColor: timeFilter === t ? '#B71C1C' : '#f0f0f0'
                      }}>
                      <Text style={{ color: timeFilter === t ? '#fff' : '#333', capitalize: 'yes' }}>
                        {t === 'today' ? 'Today' : t === 'thisMonth' ? 'This Month' : 'All Time'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={{ fontSize: 16, fontWeight: '600', marginTop: 16, marginBottom: 8 }}>Degree Type</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                  {DEGREES.map(d => (
                    <TouchableOpacity key={d}
                      onPress={() => setDegreeFilter(d)}
                      style={{
                        paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, marginRight: 8, marginBottom: 8,
                        backgroundColor: degreeFilter === d ? '#B71C1C' : '#f0f0f0'
                      }}>
                      <Text style={{ color: degreeFilter === d ? '#fff' : '#333' }}>{d}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={{ fontSize: 16, fontWeight: '600', marginTop: 16, marginBottom: 8 }}>Year of Study</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                  {YEARS.map(y => (
                    <TouchableOpacity key={y}
                      onPress={() => setYearFilter(y)}
                      style={{
                        paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, marginRight: 8, marginBottom: 8,
                        backgroundColor: yearFilter === y ? '#B71C1C' : '#f0f0f0'
                      }}>
                      <Text style={{ color: yearFilter === y ? '#fff' : '#333' }}>{y}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              <View style={{ marginTop: 24, flexDirection: 'row' }}>
                <TouchableOpacity onPress={resetFilters} style={{ flex: 1, padding: 14, borderRadius: 12, backgroundColor: '#f5f5f5', marginRight: 10, alignItems: 'center' }}>
                  <Text style={{ fontWeight: '600', color: '#555' }}>Reset</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleApplyFilter} style={{ flex: 2, padding: 14, borderRadius: 12, backgroundColor: '#B71C1C', alignItems: 'center' }}>
                  <Text style={{ fontWeight: '600', color: '#fff' }}>Apply Filters</Text>
                </TouchableOpacity>
              </View>
              <View style={{ height: 20 }} />
            </View>
          </View>
        </Modal>
      </ScrollView>
    </View>
  );
}