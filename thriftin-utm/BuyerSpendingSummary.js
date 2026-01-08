import React, { useEffect, useState, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Button, Pressable } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import ViewShot from 'react-native-view-shot';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import API_BASE from './config';

const screenWidth = Dimensions.get('window').width;

const BuyerSpendingSummary = ({ route, navigation }) => {
  const { userId } = route.params;

  const [loading, setLoading] = useState(true);
  const [totalSpending, setTotalSpending] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [categories, setCategories] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [chartWidth, setChartWidth] = useState(screenWidth - 32);
  const [chartReady, setChartReady] = useState(false);
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, value: 0, date: '', });

  const chartRef = useRef();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/buying/user/${userId}`);
      const data = await response.json();

      const itemsArray = Array.isArray(data.items) ? data.items : Array.isArray(data) ? data : [];
      const normalizedItems = itemsArray.map(item => ({
        name: item.name || item.productName,
        category: item.category,
        amount: Number(item.amount || item.totalSpent || item.price),
        sold_at: item.sold_at || item.soldAt
      }));

      setAllItems(normalizedItems);
      setTotalSpending(Number(data.totalSpending) || 0);
      setTotalItems(Number(data.totalItems) || 0);
      setCategories(Array.isArray(data.topCategories) ? data.topCategories : []);
      setTrendData(Array.isArray(data.trend) ? data.trend : []);
      setLoading(false);
    } catch (error) {
      console.log('Fetch BuyerSpendingSummary error:', error);
      setLoading(false);
    }
  };

  const handleCategoryPress = async (category) => {
    try {
      const response = await fetch(`${API_BASE}/api/buying/user/${userId}/category/${encodeURIComponent(category)}`);
      const itemsForCategory = await response.json();

      const normalizedItems = itemsForCategory.map(item => ({
        name: item.name || item.productName,
        category: category,
        amount: Number(item.amount || item.totalSpent || item.price),
        sold_at: item.sold_at || item.soldAt
      }));

      navigation.navigate('BuyerCategoryDetail', {
        userId,
        category,
        items: normalizedItems
      });
    } catch (error) {
      console.log('Error fetching category items:', error);
      navigation.navigate('BuyerCategoryDetail', {
        userId,
        category,
        items: []
      });
    }
  };

  const exportReport = async () => {
    try {
      if (!chartReady) {
        alert('Chart is still loading, please wait a moment.');
        return;
      }

      // Wait a bit to ensure the chart renders completely
      await new Promise(res => setTimeout(res, 1000)); // 1 second

      // Capture the chart
      const chartUri = chartRef.current ? await chartRef.current.capture() : null;

      if (!chartUri) {
        alert('Chart not ready for export yet.');
        return;
      }

      // Convert captured URI to Base64 for HTML embedding
      let chartBase64 = '';
      if (chartUri.startsWith('file://')) {
        const response = await fetch(chartUri);
        const blob = await response.blob();
        const reader = new FileReader();
        chartBase64 = await new Promise((resolve) => {
          reader.onloadend = () => resolve(reader.result.split(',')[1]);
          reader.readAsDataURL(blob);
        });
      }

      const htmlContent = `
        <html>
          <head>
            <style>
              body { font-family: Arial; padding: 10px; }
              h2 { color: #c70000; }
              table { width: 100%; border-collapse: collapse; margin-top: 10px; }
              th, td { border: 1px solid #ddd; padding: 6px; text-align: center; }
              th { background-color: #c70000; color: white; }
              img { width: 100%; max-width: 100%; height: auto; margin-top: 10px; }
            </style>
          </head>
          <body>
            <h2>Buyer Spending Summary (STUDENT)</h2>
            <p><b>Total Spending:</b> RM ${totalSpending.toFixed(2)}</p>
            <p><b>Total Items Bought:</b> ${totalItems}</p>

            <h3>Top Categories</h3>
            <table>
              <tr><th>Category</th><th>Items Bought</th><th>Total Spent</th></tr>
              ${categories.map(cat => `
                <tr>
                  <td>${cat.category}</td>
                  <td>${cat.itemsBought}</td>
                  <td>RM ${Number(cat.totalSpent).toFixed(2)}</td>
                </tr>`).join('')}
            </table>

            <h3>Buying Trend</h3>
            ${chartBase64 ? `<img src="data:image/png;base64,${chartBase64}" />` : '<p>Chart not available</p>'}
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html: htmlContent });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      } else {
        alert(`PDF saved to: ${uri}`);
      }

    } catch (error) {
      console.log('Export PDF error:', error);
      alert('Failed to generate PDF');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  const isExportDisabled = trendData.length === 0 || totalSpending === 0 || totalItems === 0;
  const formattedTrend = trendData.map(t => {
    // Robust parsing: handle both ISO string (with T) and YYYY-MM-DD
    const dateStr = typeof t.date === 'string' && t.date.includes('T') ? t.date.split('T')[0] : t.date;
    const parts = String(dateStr).split('-');
    const d = new Date(parts[0], parts[1] - 1, parts[2]); // Year, Month (0-index), Day
    return {
      day: d.getDate(),
      month: d.toLocaleString('default', { month: 'short' }),
      year: d.getFullYear(),
      total: Number(t.total) || 0,
    };
  });

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Buyer Spending Summary (STUDENT)</Text>

      <View style={[styles.card, styles.centerCard]}>
        <Text style={styles.cardTitle}>Total Spending</Text>
        <Text style={styles.cardValue}>RM {totalSpending.toFixed(2)}</Text>
      </View>

      <View style={[styles.card, styles.centerCard]}>
        <Text style={styles.cardTitle}>Total Items Bought</Text>
        <Text style={styles.cardValue}>{totalItems}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Top Categories</Text>
        {categories.length === 0 ? (
          <Text>No categories available.</Text>
        ) : (
          categories.map((cat, index) => (
            <TouchableOpacity
              key={index}
              style={styles.categoryItem}
              onPress={() => handleCategoryPress(cat.category)}
            >
              <Text style={styles.categoryText}>
                {cat.category} - RM {Number(cat.totalSpent).toFixed(2)}
              </Text>
              <Text style={styles.categoryCount}>
                {cat.itemsBought} item
              </Text>
            </TouchableOpacity>
          ))
        )}
      </View>

      <View
        style={styles.card}
        onLayout={(e) => setChartWidth(e.nativeEvent.layout.width - 16)}
      >
        <Text style={styles.cardTitle}>Buying Trend</Text>
        {trendData.length > 0 ? (
          <ViewShot ref={chartRef} options={{ format: 'png', quality: 1.0 }}>
            <View
              onLayout={() => setChartReady(true)}
              style={{ backgroundColor: '#fff' }}
            >
              <Pressable onPress={() => setTooltip(prev => ({ ...prev, visible: false }))}>
                <LineChart
                  data={{
                    labels: formattedTrend.map((t, index) => {
                      if (index === 0 || formattedTrend[index - 1].month !== t.month) {
                        return `${t.month}`;
                      }
                      return ``;
                    }),
                    datasets: [
                      {
                        data: formattedTrend.map(t => t.total),
                      },
                    ],
                  }}
                  width={chartWidth}
                  height={220}
                  yAxisLabel="RM "
                  chartConfig={{
                    backgroundColor: '#fff',
                    backgroundGradientFrom: '#fff',
                    backgroundGradientTo: '#fff',
                    decimalPlaces: 2,
                    color: (opacity = 1) => `rgba(199,0,0,${opacity})`,
                    labelColor: (opacity = 1) => `rgba(0,0,0,${opacity})`,
                    propsForDots: {
                      r: '4',
                      strokeWidth: '2',
                      stroke: '#c70000',
                    },
                  }}
                  bezier
                  style={{ marginVertical: 8, borderRadius: 16 }}
                  decorator={() =>
                    tooltip.visible ? (
                      <View
                        style={{
                          position: 'absolute',
                          top: tooltip.y - 30,
                          left: tooltip.x - 40,
                          backgroundColor: '#c70000',
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          borderRadius: 6,
                        }}
                      >
                        <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold', textAlign: 'center' }}>
                          Total Spend: RM {tooltip.value.toFixed(2)}
                        </Text>
                        <Text style={{ color: '#fff', fontSize: 12, textAlign: 'center' }}>
                          {tooltip.date}
                        </Text>
                      </View>
                    ) : null
                  }
                  onDataPointClick={({ value, x, y, index }) => {
                    const t = formattedTrend[index];
                    const dateLabel = `${t.day} ${t.month} ${t.year}`;

                    setTooltip({
                      visible: true,
                      x,
                      y,
                      value,
                      date: dateLabel,
                    });
                    // Auto-hide tooltip after 4 seconds
                    setTimeout(() => {
                      setTooltip(prev => ({ ...prev, visible: false }));
                    }, 4000);
                  }}
                />
              </Pressable>
            </View>
          </ViewShot>
        ) : (
          <Text style={{ textAlign: 'center', marginTop: 8 }}>No trend data available.</Text>
        )}
      </View>

      <View style={{ margin: 20 }}>
        <Button
          title="Export Report"
          onPress={exportReport}
          color={isExportDisabled ? '#ccc' : '#c70000'}
          disabled={isExportDisabled}
        />
      </View>
    </ScrollView>
  );
};

export default BuyerSpendingSummary;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f5f5f5' },
  header: { fontSize: 22, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  centerCard: { alignItems: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  cardValue: { fontSize: 20, fontWeight: 'bold' },
  categoryItem: {
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#ccc',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryText: { fontSize: 16 },
  categoryCount: { fontSize: 16, color: '#555' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
