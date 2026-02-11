import { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { evaluatePrice, submitPrice } from '@/services/api';
import { saveToHistory } from '@/services/storage';
import { PriceEvaluation } from '@/types';

interface ReceiptItem {
  name: string;
  price: number;
  quantity?: number;
}

export default function ReceiptScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const scannedRef = useRef(false);
  const router = useRouter();
  const [receiptItems, setReceiptItems] = useState<ReceiptItem[]>([]);
  const [processing, setProcessing] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>
          Vi trenger tilgang til kameraet for å skanne kvitteringer
        </Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Gi tilgang</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleReceiptScanned = async () => {
    if (scannedRef.current || processing) return;

    scannedRef.current = true;
    setProcessing(true);

    try {
      // Real AI receipt processing
      // 1. Capture the image from camera
      // 2. Send to your AI backend for OCR and product extraction
      // 3. Parse structured response with product names and prices

      // API call to your backend for receipt processing
      const API_URL = 'https://1price-project-production.up.railway.app';

      // For now, we'll use a placeholder - you'd implement actual image capture
      // and send it to your backend for AI processing
      const response = await fetch(`${API_URL}/api/receipt/scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // In real implementation, you'd send the captured image here
        body: JSON.stringify({
          // image: capturedImageData,
          placeholder: 'receipt_scan_request'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to scan receipt');
      }

      const data = await response.json();
      const receiptItems: ReceiptItem[] = data.items || [];

      setReceiptItems(receiptItems);

      Alert.alert(
        'Kvittering skannet!',
        `Fant ${receiptItems.length} produkter på kvitteringen`,
        [{ text: 'OK', style: 'default' }]
      );
    } catch (error) {
      // Fallback to manual entry if AI scanning fails
      Alert.alert(
        'AI-skanning feilet',
        'Kunne ikke skanne kvitteringen automatisk. Vil du legge inn produktene manuelt?',
        [
          { text: 'Avbryt', style: 'cancel' },
          {
            text: 'Manuell innføring',
            onPress: () => {
              // Navigate to manual entry or show manual input form
              router.push('/scanner');
            }
          }
        ]
      );
    } finally {
      setProcessing(false);
      setTimeout(() => {
        scannedRef.current = false;
      }, 2000);
    }
  };

  const handleAnalyzeAll = async () => {
    setAnalyzing(true);

    try {
      for (const item of receiptItems) {
        const evaluation = await evaluatePrice({
          barcode: '', // Receipt items might not have barcodes
          price: item.price,
          currency: 'NOK',
        });

        await saveToHistory(evaluation);
      }

      Alert.alert(
        'Suksess!',
        `Analyserte og lagret ${receiptItems.length} produkter i historikken`,
        [
          { text: 'Se historikk', onPress: () => router.push('/history') },
          {
            text: 'Skann ny', onPress: () => {
              setReceiptItems([]);
              setAnalyzing(false);
            }, style: 'cancel'
          }
        ]
      );
    } catch (error) {
      Alert.alert(
        'Feil',
        'Kunne ikke analysere alle produktene. Noen er lagret.'
      );
    } finally {
      setAnalyzing(false);
    }
  };

  const handleRemoveItem = (index: number) => {
    setReceiptItems(prev => prev.filter((_, i) => i !== index));
  };

  const getTotalAmount = () => {
    return receiptItems.reduce((total, item) => total + (item.price * (item.quantity || 1)), 0);
  };

  if (receiptItems.length > 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Kvitteringsresultater</Text>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Kvitteringsoversikt</Text>
            <Text style={styles.summaryAmount}>{getTotalAmount().toFixed(2)} NOK</Text>
            <Text style={styles.summarySubtitle}>{receiptItems.length} produkter</Text>
          </View>

          <View style={styles.itemsList}>
            {receiptItems.map((item, index) => (
              <View key={index} style={styles.itemCard}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemPrice}>{item.price.toFixed(2)} NOK</Text>
                  {item.quantity && item.quantity > 1 && (
                    <Text style={styles.itemQuantity}>Antall: {item.quantity}</Text>
                  )}
                </View>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemoveItem(index)}
                >
                  <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.analyzeButton, analyzing && styles.buttonDisabled]}
              onPress={handleAnalyzeAll}
              disabled={analyzing}
            >
              <Ionicons name="analytics-outline" size={24} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.analyzeButtonText}>
                {analyzing ? 'Analyserer...' : 'Analyser alle'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.newScanButton}
              onPress={() => setReceiptItems([])}
            >
              <Ionicons name="camera-outline" size={24} color="#8966d8" style={{ marginRight: 8 }} />
              <Text style={styles.newScanButtonText}>Skann ny kvittering</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Tilbake</Text>
      </View>

      <CameraView
        style={styles.camera}
        onBarcodeScanned={handleReceiptScanned}
        barcodeScannerSettings={{
          barcodeTypes: [], // We'll use image capture instead of barcode scanning
        }}
      >
        <View style={styles.overlay}>
          <View style={styles.scanArea}>
            <Ionicons name="receipt-outline" size={48} color="#fff" />
            <Text style={styles.scanText}>
              Plasser kvitteringen i rammen
            </Text>
            <Text style={styles.scanSubtext}>
              Trykk for å skanne
            </Text>
          </View>
          <TouchableOpacity
            style={styles.captureButton}
            onPress={handleReceiptScanned}
            disabled={processing}
          >
            <Ionicons name="camera" size={32} color="#fff" />
          </TouchableOpacity>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    backgroundColor: '#8966d8',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scanArea: {
    width: 320,
    height: 550,
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    marginTop: 80,
  },
  scanText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  scanSubtext: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginTop: 8,
  },
  captureButton: {
    backgroundColor: '#8966d8',
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  message: {
    textAlign: 'center',
    paddingHorizontal: 40,
    color: '#333',
    fontSize: 16,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#8966d8',
    padding: 18,
    borderRadius: 14,
    marginHorizontal: 40,
    shadowColor: '#8966d8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  summaryCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  summaryAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#8966d8',
    marginBottom: 4,
  },
  summarySubtitle: {
    fontSize: 14,
    color: '#666',
  },
  itemsList: {
    marginBottom: 20,
  },
  itemCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8966d8',
  },
  itemQuantity: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  removeButton: {
    padding: 8,
  },
  actionButtons: {
    gap: 12,
    marginBottom: 20,
  },
  analyzeButton: {
    backgroundColor: '#8966d8',
    padding: 18,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8966d8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  analyzeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  newScanButton: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#8966d8',
  },
  newScanButtonText: {
    color: '#8966d8',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
