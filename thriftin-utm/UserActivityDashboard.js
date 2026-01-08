import React, { useState, useMemo, useRef } from "react";
import { View, Text, ScrollView, TouchableOpacity, Dimensions, Modal, Alert, Platform, } from "react-native";
import { LineChart } from "react-native-chart-kit";
// platform checks use Platform from react-native

const screenWidth = Dimensions.get("window").width;

// ---------- Configuration ----------
import API_BASE from "./config";

// ---------- Helpers ----------
const pad = (n) => String(n).padStart(2, "0");
const fmt = (d) => {
  const dt = new Date(d);
  const y = dt.getFullYear();
  const m = pad(dt.getMonth() + 1);
  const day = pad(dt.getDate());
  return `${y}-${m}-${day}`;
};
function lastSixMonthsLabels() {
  const labels = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    labels.push(d.toLocaleString("default", { month: "short" }));
  }
  return labels;
}

// ---------- Aggregation ----------
function aggregate(activities, totalRegisteredUsers = 0) {
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

  // Monthly login trend for last 6 months
  const now = new Date();
  const counts = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = pad(d.getMonth() + 1);
    const prefix = `${year}-${month}`;
    const countForMonth = activities
      .filter((a) => a.date.startsWith(prefix))
      .reduce((s, a) => s + (a.sessions || 0), 0);
    counts.push(countForMonth);
  }

  return {
    totalUsers,
    activeUsers,
    monthlySessions: sessionsSum,
    avgSessionDuration,
    engagementRate,
    loginTrend: counts,
    trendMode: "monthly",
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

  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [dashboardLabel, setDashboardLabel] = useState("All Time");

  // These drive the UI
  const [filteredActivities, setFilteredActivities] = useState([]);
  const [filteredAgg, setFilteredAgg] = useState({});

  const [selectedIndex, setSelectedIndex] = useState(null);
  const clickHandledRef = useRef(false);

  // Fetch Data
  React.useEffect(() => {
    fetch(`${API_BASE}/api/analytics/activity`)
      .then(res => res.json())
      .then(data => {
        const activities = data.activities || [];
        setRawActivities(activities);
        setServerTotalUsers(data.totalUsers || 0);

        // Initial state: All Time
        setFilteredActivities(activities);
        setFilteredAgg(aggregate(activities, data.totalUsers));
        setLoading(false);
      })
      .catch(err => {
        console.error("Activity fetch error", err);
        setLoading(false);
      });
  }, []);

  const now = new Date();
  const todayStr = fmt(now);
  const thisMonthPrefix = `${now.getFullYear()}-${pad(now.getMonth() + 1)}`;

  // ---------- Predefined Filters ----------
  const applyPredefined = (key) => {
    setFilterModalVisible(false);
    let subset = [];

    if (key === "today") {
      setDashboardLabel("Today");
      subset = rawActivities.filter(a => a.date === todayStr);
    } else if (key === "thisMonth") {
      setDashboardLabel("This Month");
      subset = rawActivities.filter(a => a.date.startsWith(thisMonthPrefix));
    } else {
      setDashboardLabel("All Time");
      subset = rawActivities;
    }

    setFilteredActivities(subset);
    setFilteredAgg(aggregate(subset, serverTotalUsers));
  };


  // ---------- Chart labels ----------
  const chartLabels = useMemo(() => lastSixMonthsLabels(), [filteredAgg]);

  const trendData = filteredAgg.loginTrend || [];
  const noData =
    Array.isArray(trendData)
      ? trendData.every((v) => v === 0)
      : true && filteredAgg.monthlySessions === 0;

  // removed user composition visualization per request

  // CSV export removed; PDF-only export is used below

  // ---------- Export PDF ----------
  const exportPDF = async () => {
    if (noData || !filteredActivities.length) {
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
      const title = `User Activity Report - ${new Date().toLocaleString()}`;
      const rows = filteredActivities.map(a => `
        <tr>
          <td>${a.date}</td>
          <td>${a.userId}</td>
          <td style="text-align:center">${a.sessions || 0}</td>
          <td style="text-align:center">${a.duration || 0}</td>
        </tr>`).join('');

      const html = `
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <style>
              body { font-family: Arial, Helvetica, sans-serif; padding: 20px }
              h1 { color: #B71C1C }
              table { width: 100%; border-collapse: collapse }
              th, td { border: 1px solid #ddd; padding: 8px }
              th { background: #f4f4f4; text-align: left }
            </style>
          </head>
          <body>
            <h1>${title}</h1>
            <p><strong>Period:</strong> ${dashboardLabel}</p>
            <ul>
              <li>Total users: ${filteredAgg.totalUsers}</li>
              <li>Active users: ${filteredAgg.activeUsers}</li>
              <li>Avg session duration: ${filteredAgg.avgSessionDuration} mins</li>
              <li>Login sessions: ${filteredAgg.monthlySessions}</li>
            </ul>
            <h2>Activities</h2>
            <table>
              <thead><tr><th>Date</th><th>User</th><th>Sessions</th><th>Duration</th></tr></thead>
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
        <Text style={{ fontSize: 22, fontWeight: "700", marginBottom: 8 }}>
          User Activity Dashboard
        </Text>
        <Text style={{ color: '#666', marginBottom: 12 }}>{dashboardLabel}</Text>

        {/* Action row */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
          <View style={{ flexDirection: 'row' }}>
            <TouchableOpacity onPress={() => setFilterModalVisible(true)} style={{ backgroundColor: '#D32F2F', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, marginRight: 10 }}>
              <Text style={{ color: '#fff', fontWeight: '600' }}>Filter</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={showExportOptions} disabled={noData || !filteredActivities.length} style={{ backgroundColor: noData ? '#eee' : '#B71C1C', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12 }}>
              <Text style={{ color: noData ? '#999' : '#fff', fontWeight: '600' }}>Export PDF</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* KPI Cards */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 14 }}>
          <StatCard label="Total Users" value={filteredAgg.totalUsers || 0} />
          <StatCard label="Active Users (Period)" value={filteredAgg.activeUsers || 0} />
          <StatCard label="Avg Session (mins)" value={filteredAgg.avgSessionDuration || 0} />
          <StatCard label="Login Sessions" value={filteredAgg.monthlySessions || 0} />
        </View>

        {/* Charts row */}
        <View style={{ marginBottom: 16 }}>
          <View style={{ backgroundColor: '#fff', padding: 16, borderRadius: 12, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5, elevation: 3, alignItems: 'center' }}>
            <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 8, alignSelf: 'flex-start' }}>Login Trend (last 6 months)</Text>
            {noData ? (
              <Text style={{ color: '#555', textAlign: 'center', paddingVertical: 30 }}>No activity data available for the selected date.</Text>
            ) : (
              <TouchableOpacity activeOpacity={1} onPress={() => {
                // Clear selection when tapping outside a data point
                if (clickHandledRef.current) {
                  clickHandledRef.current = false;
                  return;
                }
                setSelectedIndex(null);
              }} style={{ position: 'relative' }}>
                <LineChart
                  data={{ labels: chartLabels, datasets: [{ data: trendData }] }}
                  width={screenWidth - 64} // full width minus card padding
                  height={220}
                  yAxisLabel=""
                  chartConfig={{
                    backgroundColor: '#fff',
                    backgroundGradientFrom: '#fff',
                    backgroundGradientTo: '#fff',
                    decimalPlaces: 0,
                    color: (opacity = 1) => `rgba(199,0,0,${opacity})`,
                    labelColor: (opacity = 1) => `rgba(0,0,0,${opacity})`,
                    strokeWidth: 2,
                    propsForDots: { r: '4', strokeWidth: '2', stroke: '#c70000' }
                  }}
                  bezier
                  style={{ marginVertical: 8, borderRadius: 16 }}
                  onDataPointClick={(data) => {
                    clickHandledRef.current = true;
                    setSelectedIndex(data.index);
                    // auto-hide tooltip
                    setTimeout(() => {
                      setSelectedIndex(null);
                      clickHandledRef.current = false;
                    }, 4000);
                  }}
                  renderDotContent={({ x, y, index }) => {
                    if (selectedIndex === index) {
                      const val = trendData[index];
                      return (
                        <View key={`point-label-${index}`} style={{
                          position: 'absolute',
                          left: x - 20,
                          top: y - 50,
                          backgroundColor: '#c70000',
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          borderRadius: 6,
                          alignItems: 'center',
                          zIndex: 999
                        }}>
                          <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>{val} logins</Text>
                        </View>
                      );
                    }
                    return null;
                  }}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Recent Activity removed per request */}

        {/* Filter Modal */}
        <Modal
          visible={filterModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setFilterModalVisible(false)}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', padding: 20 }}>
            <View style={{ backgroundColor: 'white', borderRadius: 12, padding: 18 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 12 }}>Filter Activity</Text>

              <TouchableOpacity onPress={() => applyPredefined('today')} style={{ paddingVertical: 12, borderRadius: 10, marginBottom: 8, backgroundColor: '#f7f7f7' }}>
                <Text style={{ fontWeight: '600' }}>Today</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => applyPredefined('thisMonth')} style={{ paddingVertical: 12, borderRadius: 10, marginBottom: 8, backgroundColor: '#f7f7f7' }}>
                <Text style={{ fontWeight: '600' }}>This Month</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => applyPredefined('all')} style={{ paddingVertical: 12, borderRadius: 10, marginBottom: 8, backgroundColor: '#f7f7f7' }}>
                <Text style={{ fontWeight: '600' }}>All Time</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => { setFilterModalVisible(false); setFilteredActivities(rawActivities); setFilteredAgg(aggregate(rawActivities, serverTotalUsers)); setDashboardLabel('All Time'); }} style={{ marginTop: 10, paddingVertical: 12, borderRadius: 10, backgroundColor: '#eee' }}>
                <Text style={{ textAlign: 'center', color: '#444' }}>Reset</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </View>
  );
}
