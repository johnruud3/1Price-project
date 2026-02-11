import { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getHistory, clearHistory } from '@/services/storage';
import { ScanHistoryItem } from '@/types';

export default function HistoryScreen() {
  const router = useRouter();
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filterPeriod, setFilterPeriod] = useState<'all' | 'day' | 'week' | 'month'>('all');

  const loadHistory = async () => {
    const data = await getHistory();
    setHistory(data);
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  };

  const handleClearHistory = () => {
    Alert.alert(
      'Slett historikk',
      'Er du sikker på at du vil slette all historikk?',
      [
        { text: 'Avbryt', style: 'cancel' },
        {
          text: 'Slett',
          style: 'destructive',
          onPress: async () => {
            await clearHistory();
            setHistory([]);
          },
        },
      ]
    );
  };

  // API returns English: good | average | expensive
  const getEvaluationColor = (evaluation: string) => {
    switch (evaluation) {
      case 'good':
        return '#34C759';
      case 'average':
        return '#FF9500';
      case 'expensive':
        return '#FF3B30';
      default:
        return '#999';
    }
  };

  const getEvaluationEmoji = (evaluation: string) => {
    switch (evaluation) {
      case 'good':
        return '✅';
      case 'average':
        return '⚠️';
      case 'expensive':
        return '❌';
      default:
        return '❓';
    }
  };

  const getEvaluationLabel = (evaluation: string) => {
    switch (evaluation) {
      case 'good':
        return 'Bra';
      case 'average':
        return 'Gjennomsnittlig';
      case 'expensive':
        return 'Dyrt';
      default:
        return evaluation;
    }
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('nb-NO', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getFilteredHistory = () => {
    const now = new Date();
    const filterDate = new Date();

    switch (filterPeriod) {
      case 'day':
        filterDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        filterDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        filterDate.setMonth(now.getMonth() - 1);
        break;
      default:
        return history;
    }

    return history.filter(item => new Date(item.timestamp) >= filterDate);
  };

  const calculateTotalSpent = () => {
    const filteredHistory = getFilteredHistory();
    return filteredHistory.reduce((total, item) => total + item.price, 0);
  };

  const getFilterLabel = () => {
    switch (filterPeriod) {
      case 'day':
        return 'I dag';
      case 'week':
        return 'Denne uken';
      case 'month':
        return 'Denne måneden';
      default:
        return 'Totalt';
    }
  };

  const renderItem = ({ item }: { item: ScanHistoryItem }) => (
    <View style={styles.historyItem}>
      <View style={styles.itemHeader}>
        <Text style={styles.productName}>{item.product.name}</Text>
        <Text style={styles.timestamp}>{formatDate(item.timestamp)}</Text>
      </View>

      <View style={styles.itemContent}>
        <View style={styles.priceSection}>
          <Text style={styles.price}>{item.price} NOK</Text>
          <Text
            style={[
              styles.evaluation,
              { color: getEvaluationColor(item.evaluation) },
            ]}
          >
            {getEvaluationEmoji(item.evaluation)} {getEvaluationLabel(item.evaluation)}
          </Text>
        </View>
      </View>

      {item.product.brand && (
        <Text style={styles.brand}>{item.product.brand}</Text>
      )}
    </View>
  );

  const filteredHistory = getFilteredHistory();
  const totalSpent = calculateTotalSpent();

  return (
    <View style={styles.container}>
      {history.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>📊</Text>
          <Text style={styles.emptyText}>Ingen skanninger ennå</Text>
          <Text style={styles.emptySubtext}>
            Skann ditt første produkt for å se historikk
          </Text>
          <TouchableOpacity
            style={styles.scanButton}
            onPress={() => router.push('/scanner')}
          >
            <Text style={styles.scanButtonText}>Skann produkt</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.spendingSummary}>
            <View style={styles.spendingHeader}>
              <Text style={styles.spendingTitle}>Varer skannet:</Text>
              <TouchableOpacity
                style={styles.filterButton}
                onPress={() => {
                  const periods: Array<'all' | 'day' | 'week' | 'month'> = ['all', 'day', 'week', 'month'];
                  const currentIndex = periods.indexOf(filterPeriod);
                  const nextIndex = (currentIndex + 1) % periods.length;
                  setFilterPeriod(periods[nextIndex]);
                }}
              >
                <Text style={styles.filterText}>{getFilterLabel()}</Text>
                <Ionicons name="chevron-down" size={16} color="#8966d8" />
              </TouchableOpacity>
            </View>
            <Text style={styles.spendingAmount}>{totalSpent.toFixed(2)} NOK</Text>
            <Text style={styles.spendingSubtitle}>
              {filteredHistory.length} {filteredHistory.length === 1 ? 'varer' : 'varer'}
            </Text>
          </View>

          <FlatList
            data={filteredHistory}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            refreshing={refreshing}
            onRefresh={handleRefresh}
          />

          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.clearButton}
              onPress={handleClearHistory}
            >
              <Text style={styles.clearButtonText}>Slett historikk</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  listContent: {
    padding: 16,
  },
  historyItem: {
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
  },
  itemContent: {
    marginBottom: 4,
  },
  priceSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  evaluation: {
    fontSize: 14,
    fontWeight: '600',
  },
  brand: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  emptySubtext: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  scanButton: {
    backgroundColor: '#8966d8',
    padding: 18,
    borderRadius: 14,
    paddingHorizontal: 32,
    shadowColor: '#8966d8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  clearButton: {
    backgroundColor: '#EF4444',
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  spendingSummary: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  spendingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  spendingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  filterText: {
    fontSize: 14,
    color: '#8966d8',
    fontWeight: '600',
  },
  spendingAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#8966d8',
    marginBottom: 4,
  },
  spendingSubtitle: {
    fontSize: 14,
    color: '#666',
  },
});
