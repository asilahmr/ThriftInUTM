// SalesDashboard.js
import React, { useEffect, useState, useRef } from 'react';
import { View, Text, ScrollView, Dimensions, ActivityIndicator, Button, Pressable, TouchableOpacity } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { captureRef } from 'react-native-view-shot';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import ViewShot from 'react-native-view-shot';
// import axios from 'axios'; // REMOVED: Use shared api
import api from '../utils/api'; // ADDED
import styles from './styles/styles';
// import API_BASE from '../config'; // REMOVED
import MonthFilter from './MonthFilter';

export default function SalesDashboard({ route, navigation }) {
  const { role = 'student', userId } = route?.params || {}; // Default role to student to prevent crash
  const screenWidth = Dimensions.get("window").width;

  const [dashboardData, setDashboardData] = useState({
    total_revenue: 0,
    total_items_sold: 0,
    top_products: [],
    sales_trends: [],
    top_sellers: [],
  });
  const [loading, setLoading] = useState(true);

  // Filter State
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [filter, setFilter] = useState({ type: 'all', month: null, year: null, label: 'All Time' });

  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, value: 0, date: "" });
  const studentChartRef = useRef();
  const adminChartRef = useRef();

  // Determine if the Export Report button should be disabled
  const isExportDisabled =
    !dashboardData.sales_trends ||
    dashboardData.sales_trends.length === 0 ||
    dashboardData.total_items_sold === 0;

  // ---------------- Fetch Dashboard Data ----------------
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      if (role === 'student' && !userId) {
        setDashboardData(prev => ({ ...prev }));
        setLoading(false);
        return;
      }

      // Build query params
      const params = {};
      if (filter.type !== 'all') {
        params.type = filter.type;
        if (filter.month) params.month = filter.month;
        if (filter.year) params.year = filter.year;
      }

      const salesUrl = role === 'admin'
        ? `/api/sales/admin`
        : `/api/sales/user/${userId}`;

      // Use api.get instead of axios.get
      const salesResponse = await api.get(salesUrl, { params });

      let trendsData = [];
      const trendsUrl = role === 'admin'
        ? `/api/sales/trends`
        : `/api/sales/trends/${userId}`;

      const trendsResponse = await api.get(trendsUrl, { params });
      trendsData = trendsResponse.data;

      let updatedDashboard = { ...salesResponse.data, sales_trends: trendsData };

      // fetch top buyers if admin
      if (role === 'admin') {
        const buyersResponse = await api.get(`/api/buying/admin`, { params });
        updatedDashboard.top_buyers = buyersResponse.data.topBuyers;
      }

      setDashboardData(updatedDashboard);
      setLoading(false);
    } catch (error) {
      console.error('Fetch dashboard error:', error);
      setLoading(false);
    }
  };

  useEffect(() => { fetchDashboardData(); }, [filter]);

  // ---------------- Export PDF Report via expo-print ----------------
  const exportReport = async () => {
    try {
      // Wait 300-500ms to ensure chart is fully rendered
      await new Promise(res => setTimeout(res, 500));

      // Capture chart
      const chartBase64 = await captureRef(
        role === 'student' ? studentChartRef.current : adminChartRef.current,
        { format: 'png', quality: 1, result: 'base64' }
      );

      // Build HTML
      const htmlContent = `
        <html>
          <head>
            <style>
              body { font-family: Arial; padding: 10px; }
              h2 { color: #c70000; }
              table { width: 100%; border-collapse: collapse; margin-top: 10px; }
              th, td { border: 1px solid #ddd; padding: 6px; text-align: center; }
              th { background-color: #c70000; color: white; }
              img { width: 100%; margin-top: 10px; }
              .header-info { margin-bottom: 20px; color: #555; }
            </style>
          </head>
          <body>
            <h2>Sales Report (${(role || 'STUDENT').toUpperCase()})</h2>
            <div class="header-info">
              <p>Period: ${filter.label}</p>
            </div>
            <p><b>Total Revenue:</b> RM ${parseFloat(dashboardData.total_revenue).toFixed(2)}</p>
            <p><b>Total Items Sold:</b> ${dashboardData.total_items_sold}</p>
            
            <h3>Top Categories</h3>
            <table>
              <tr><th>Category</th><th>Items Sold</th><th>Revenue</th></tr>
              ${dashboardData.top_categories?.map(cat => `
                <tr>
                  <td>${cat.category}</td>
                  <td>${cat.items_sold}</td>
                  <td>RM ${parseFloat(cat.revenue).toFixed(2)}</td>
                </tr>`).join('')}
            </table>

            ${role === 'admin' && dashboardData.top_sellers?.length > 0 ? `
            <h3>Top Sellers</h3>
            <table>
              <tr><th>Seller</th><th>Items Sold</th><th>Revenue</th></tr>
              ${dashboardData.top_sellers.map(seller => `
                <tr>
                  <td>${seller.name}</td>
                  <td>${seller.sold_count}</td>
                  <td>RM ${seller.revenue}</td>
                </tr>`).join('')}
            </table>` : ''}

            ${role === 'admin' && dashboardData.top_buyers?.length > 0 ? `
            <h3>Top Buyers</h3>
            <table>
              <tr><th>Buyer</th><th>Items Bought</th><th>Total Spent</th></tr>
              ${dashboardData.top_buyers.map(buyer => `
                <tr>
                  <td>${buyer.name}</td>
                  <td>${buyer.itemsBought}</td>
                  <td>RM ${parseFloat(buyer.totalSpent).toFixed(2)}</td>
                </tr>`).join('')}
            </table>` : ''}

            <h3>Sales Trend</h3>
            <img src="data:image/png;base64,${chartBase64}" 
                style="width:75%; height:auto; display:block; margin: 0 auto;" />
          </body>
        </html>
      `;

      // Generate PDF
      const { uri } = await Print.printToFileAsync({ html: htmlContent });

      // Share PDF
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      } else {
        alert(`PDF saved to: ${uri}`);
      }
    } catch (error) {
      console.error('Export PDF error:', error);
      alert('Failed to generate PDF');
    }
  };


  // ---------------- Loading State ----------------
  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#c70000" />
      </View>
    );
  }

  if (role === 'student' && !userId) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.dashboardHeader}>Student Dashboard</Text>
        <Text style={{ color: '#800000', textAlign: 'center', padding: 20 }}>
          No student selected. The app is running but no student ID was provided.
          Contact admin or select a student to view personalized data.
        </Text>
      </View>
    );
  }

  // ---------------- Prepare Chart Data ----------------
  const trendsShown = Array.isArray(dashboardData.sales_trends) ? dashboardData.sales_trends : [];
  const monthMap = new Map();
  const labels = [];
  const datasetValues = [];

  trendsShown.forEach((t, index) => {
    const rawDate = typeof t.date === 'string' && t.date.includes('T') ? t.date.split('T')[0] : t.date;
    const parts = String(rawDate).split('-'); // [YYYY, MM, DD] or [YYYY, MM] or [YYYY]

    let label = '';

    if (parts.length === 1) {
      // Yearly aggregation: always show Year
      label = parts[0];
    } else if (parts.length === 2) {
      // Monthly aggregation: always show Month
      const d = new Date(parts[0], parts[1] - 1);
      label = d.toLocaleString('default', { month: 'short' });
    } else {
      // Daily aggregation
      // Show label only if month changed from previous data point
      const currentMonthKey = `${parts[0]}-${parts[1]}`;

      let prevMonthKey = null;
      if (index > 0) {
        const prevRaw = trendsShown[index - 1].date;
        const prevStr = typeof prevRaw === 'string' && prevRaw.includes('T') ? prevRaw.split('T')[0] : prevRaw;
        const prevParts = String(prevStr).split('-');
        if (prevParts.length >= 2) {
          prevMonthKey = `${prevParts[0]}-${prevParts[1]}`;
        }
      }

      // Label the first data point if it's the start of the series, OR if month changed
      if (index === 0 || currentMonthKey !== prevMonthKey) {
        const d = new Date(parts[0], parts[1] - 1, parts[2]);
        label = d.toLocaleString('default', { month: 'short' });
      }
    }

    const salesValue = parseFloat(t.daily_revenue) || 0;
    datasetValues.push(salesValue);
    labels.push(label);
  });

  // If no data, provide dummy for chart to not crash
  const chartDataValid = datasetValues.length > 0;
  const chartConfig = {
    backgroundGradientFrom: '#fff',
    backgroundGradientTo: '#fff',
    decimalPlaces: 2,
    color: (opacity = 1) => `rgba(199, 0, 0, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    strokeWidth: 2,
    propsForDots: { r: '4', strokeWidth: '2', stroke: '#c70000' }
  };

  const revenueNumber = parseFloat(dashboardData.total_revenue) || 0;

  // ---------------- Render ----------------
  return (
    <ScrollView style={styles.dashboardContainer}>
      {/* Filter Label & Button */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {/* Red Box for Filter Label */}
          <Text style={{ fontSize: 12, color: '#B71C1C', backgroundColor: '#ffebee', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 4, overflow: 'hidden' }}>
            Filtered: {filter.label}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => setFilterModalVisible(true)}
          style={{ backgroundColor: '#D32F2F', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 }}
        >
          <Text style={{ color: '#fff', fontWeight: '600', fontSize: 12 }}>Filter</Text>
        </TouchableOpacity>
      </View>

      <MonthFilter
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        onApply={setFilter}
        currentFilter={filter}
      />

      <View style={[styles.card, styles.centerCard]}>
        <Text style={styles.cardTitle}>Total Revenue</Text>
        <Text style={styles.statValue}>RM {revenueNumber.toFixed(2)}</Text>
      </View>

      <View style={[styles.card, styles.centerCard]}>
        <Text style={styles.cardTitle}>Total Items Sold</Text>
        <Text style={styles.statValue}>{dashboardData.total_items_sold || 0}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Top Categories</Text>
        {dashboardData.top_categories?.length > 0 ? (
          dashboardData.top_categories.map((cat, index) => {
            const params = role === 'student' ? { userId, category: cat.category } : { userId: null, category: cat.category };
            return (
              <TouchableOpacity key={index} onPress={() => navigation.navigate('CategoryProducts', params)}>
                <View style={styles.topProductRow}>
                  <Text style={styles.productName}>
                    {cat.category} - RM {parseFloat(cat.revenue).toFixed(2)}
                  </Text>
                  <Text style={styles.productSales}>
                    {cat.items_sold} sold
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })
        ) : <Text style={{ color: '#555' }}>No items sold yet.</Text>}
      </View>

      {role === 'student' && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sales Trend</Text>
          {chartDataValid ? (
            <View style={{ position: 'relative' }}>
              <ViewShot ref={studentChartRef} options={{ format: "png", quality: 1.0 }}>
                <Pressable onPress={() => setTooltip(prev => ({ ...prev, visible: false }))}>
                  <LineChart
                    data={{ labels, datasets: [{ data: datasetValues }] }}
                    width={screenWidth - 64}
                    height={260}
                    yAxisLabel="RM "
                    chartConfig={chartConfig}
                    bezier
                    style={{ marginVertical: 8, borderRadius: 16 }}
                    onDataPointClick={({ index, value, x, y }) => {
                      const chartWidth = screenWidth - 64;
                      let tooltipX = x - 50;
                      if (tooltipX < 0) tooltipX = 0;
                      if (tooltipX + 100 > chartWidth) tooltipX = chartWidth - 100;

                      const rawDate = trendsShown[index].date;
                      // Format Date for Tooltip
                      const dStr = String(rawDate);
                      // could be YYYY-MM-DD, YYYY-MM, or YYYY
                      let dateDisplay = dStr;
                      if (dStr.includes('-')) {
                        const parts = dStr.split('-');
                        if (parts.length === 3) {
                          const d = new Date(parts[0], parts[1] - 1, parts[2]);
                          dateDisplay = `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })} ${d.getFullYear()}`;
                        } else if (parts.length === 2) {
                          const d = new Date(parts[0], parts[1] - 1);
                          dateDisplay = `${d.toLocaleString('default', { month: 'long' })} ${parts[0]}`;
                        }
                      }

                      setTooltip({
                        visible: true,
                        x: tooltipX,
                        y: y - 60,
                        value,
                        date: dateDisplay
                      });

                      setTimeout(() => {
                        setTooltip(prev => ({ ...prev, visible: false }));
                      }, 4000);
                    }}
                  />
                </Pressable>
                {tooltip.visible && (
                  <View style={{
                    position: 'absolute',
                    top: tooltip.y,
                    left: tooltip.x,
                    backgroundColor: '#c70000',
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 6,
                    elevation: 4,
                    alignItems: 'center',
                    zIndex: 999
                  }}>
                    <Text style={{ fontWeight: 'bold', color: '#fff', fontSize: 12 }}>Total Sales: RM {tooltip.value.toFixed(2)}</Text>
                    <Text style={{ color: '#fff', fontSize: 12 }}>{tooltip.date}</Text>
                  </View>
                )}
              </ViewShot>
            </View>
          ) : <Text style={{ margin: 10, textAlign: 'center' }}>No trend data available for this period.</Text>}
        </View>
      )}

      {role === 'admin' && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Global Sales Trend</Text>
          {chartDataValid ? (
            <View style={{ position: 'relative' }}>
              <ViewShot ref={adminChartRef} options={{ format: "png", quality: 1.0 }}>
                <Pressable onPress={() => setTooltip(prev => ({ ...prev, visible: false }))}>
                  <LineChart
                    data={{ labels, datasets: [{ data: datasetValues }] }}
                    width={screenWidth - 64}
                    height={260}
                    yAxisLabel="RM "
                    chartConfig={chartConfig}
                    bezier
                    style={{ marginVertical: 8, borderRadius: 16 }}
                    onDataPointClick={({ index, value, x, y }) => {
                      const chartWidth = screenWidth - 64;
                      // Copied tooltip logic
                      let tooltipX = x - 50;
                      if (tooltipX < 0) tooltipX = 0;
                      if (tooltipX + 100 > chartWidth) tooltipX = chartWidth - 100;

                      const rawDate = trendsShown[index].date;
                      const dStr = String(rawDate);
                      let dateDisplay = dStr;
                      if (dStr.includes('-')) {
                        const parts = dStr.split('-');
                        if (parts.length === 3) {
                          const d = new Date(parts[0], parts[1] - 1, parts[2]);
                          dateDisplay = `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })} ${d.getFullYear()}`;
                        } else if (parts.length === 2) {
                          const d = new Date(parts[0], parts[1] - 1);
                          dateDisplay = `${d.toLocaleString('default', { month: 'long' })} ${parts[0]}`;
                        }
                      }

                      setTooltip({
                        visible: true,
                        x: tooltipX,
                        y: y - 60,
                        value,
                        date: dateDisplay
                      });
                      setTimeout(() => { setTooltip(prev => ({ ...prev, visible: false })); }, 4000);
                    }}
                  />
                </Pressable>
                {tooltip.visible && (
                  <View style={{
                    position: 'absolute',
                    top: tooltip.y,
                    left: tooltip.x,
                    backgroundColor: '#c70000',
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 6,
                    elevation: 4,
                    alignItems: 'center',
                    zIndex: 999
                  }}>
                    <Text style={{ fontWeight: 'bold', color: '#fff', fontSize: 12 }}>Total Sales: RM {tooltip.value.toFixed(2)}</Text>
                    <Text style={{ color: '#fff', fontSize: 12 }}>{tooltip.date}</Text>
                  </View>
                )}
              </ViewShot>
            </View>
          ) : <Text style={{ margin: 10, textAlign: 'center' }}>No trend data available for this period.</Text>}
        </View>
      )}

      {role === 'admin' && dashboardData.top_sellers?.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Top Sellers</Text>
          {dashboardData.top_sellers.map((seller, index) => (
            <View key={index} style={styles.topProductRow}>
              <Text style={styles.productName}>{seller.name}</Text>
              <Text style={styles.productSales}>RM {seller.revenue} ({seller.sold_count} sold)</Text>
            </View>
          ))}
        </View>
      )}

      {role === 'admin' && dashboardData.top_buyers?.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Top Buyers</Text>
          {dashboardData.top_buyers.map((buyer, index) => (
            <View key={index} style={styles.topProductRow}>
              <Text style={styles.productName}>{buyer.name}</Text>
              <Text style={styles.productSales}>
                RM {parseFloat(buyer.totalSpent).toFixed(2)} ({buyer.itemsBought} items)
              </Text>
            </View>
          ))}
        </View>
      )}


      <View style={{ margin: 20 }}>
        <Button
          title="Export Report"
          onPress={exportReport}
          color={isExportDisabled ? "#ccc" : "#c70000"}
          disabled={isExportDisabled}
        />
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}