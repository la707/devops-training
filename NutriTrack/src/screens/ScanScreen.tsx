import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ActivityIndicator,
  Alert, ScrollView, TextInput,
} from 'react-native';
import { CameraView, Camera, BarcodeScanningResult } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useNutrition } from '../context/NutritionContext';
import { FoodItem, MealEntry, MealType } from '../types';
import { scaleNutrients } from '../utils/nutritionCalculator';
import { MEAL_TYPE_LABELS } from '../data/foodDatabase';
import { formatDate } from '../utils/dateUtils';

// Open Food Facts API
const OFF_API = 'https://world.openfoodfacts.org/api/v0/product';

interface OffProduct {
  product_name?: string;
  product_name_fr?: string;
  nutriments?: {
    'energy-kcal_100g'?: number;
    'energy-kcal'?: number;
    carbohydrates_100g?: number;
    proteins_100g?: number;
    fat_100g?: number;
    fiber_100g?: number;
    sodium_100g?: number;
    sugars_100g?: number;
  };
  serving_size?: string;
  quantity?: string;
  brands?: string;
  image_front_small_url?: string;
}

const parseServing = (servingStr?: string): number => {
  if (!servingStr) return 100;
  const match = servingStr.match(/(\d+(?:[.,]\d+)?)/);
  return match ? parseFloat(match[1].replace(',', '.')) : 100;
};

const buildFoodItemFromOff = (barcode: string, product: OffProduct): FoodItem => {
  const n = product.nutriments || {};
  const serving = parseServing(product.serving_size);
  const name = product.product_name_fr || product.product_name || `Produit ${barcode}`;

  return {
    id: `barcode_${barcode}`,
    name: name.trim(),
    category: 'autres',
    servingSize: serving,
    servingUnit: product.serving_size ? product.serving_size.replace(/[\d.,]/g, '').trim() || 'g' : 'g',
    emoji: '📦',
    nutrients: {
      calories: Math.round(n['energy-kcal_100g'] || n['energy-kcal'] || 0),
      carbs: Math.round((n.carbohydrates_100g || 0) * 10) / 10,
      proteins: Math.round((n.proteins_100g || 0) * 10) / 10,
      fats: Math.round((n.fat_100g || 0) * 10) / 10,
      fiber: Math.round((n.fiber_100g || 0) * 10) / 10,
      sodium: Math.round((n.sodium_100g || 0) * 1000),
      sugar: Math.round((n.sugars_100g || 0) * 10) / 10,
    },
  };
};

export default function ScanScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { date, mealType } = (route.params || {}) as { date?: string; mealType?: MealType };

  const { addEntry } = useNutrition();

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanning, setScanning] = useState(true);
  const [loading, setLoading] = useState(false);
  const [scannedFood, setScannedFood] = useState<FoodItem | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [quantity, setQuantity] = useState('');
  const [manualBarcode, setManualBarcode] = useState('');
  const [showManual, setShowManual] = useState(false);
  const lastScan = useRef<string>('');

  useEffect(() => {
    Camera.requestCameraPermissionsAsync().then(({ status }) => {
      setHasPermission(status === 'granted');
    });
  }, []);

  const fetchProduct = useCallback(async (barcode: string) => {
    if (loading) return;
    setLoading(true);
    setNotFound(false);
    setScannedFood(null);
    try {
      const res = await fetch(`${OFF_API}/${barcode}.json`);
      const data = await res.json();
      if (data.status === 1 && data.product) {
        const food = buildFoodItemFromOff(barcode, data.product);
        setScannedFood(food);
        setQuantity(String(food.servingSize));
        setScanning(false);
      } else {
        setNotFound(true);
        setScanning(false);
      }
    } catch {
      Alert.alert('Erreur réseau', 'Impossible de récupérer les informations. Vérifiez votre connexion.');
      setScanning(true);
    } finally {
      setLoading(false);
    }
  }, [loading]);

  const handleBarcodeScanned = useCallback(({ data }: BarcodeScanningResult) => {
    if (!scanning || loading || data === lastScan.current) return;
    lastScan.current = data;
    fetchProduct(data);
  }, [scanning, loading, fetchProduct]);

  const handleAddToLog = () => {
    if (!scannedFood) return;
    const qty = parseFloat(quantity) || scannedFood.servingSize;
    const entry: MealEntry = {
      id: `${Date.now()}-${Math.random()}`,
      foodItemId: scannedFood.id,
      foodItem: scannedFood,
      quantity: qty,
      mealType: mealType || 'dejeuner',
      timestamp: new Date().toISOString(),
      date: date || formatDate(new Date()),
    };
    addEntry(entry);
    navigation.goBack();
  };

  const handleRescan = () => {
    lastScan.current = '';
    setScannedFood(null);
    setNotFound(false);
    setLoading(false);
    setScanning(true);
  };

  const handleManualSearch = () => {
    if (!manualBarcode.trim()) return;
    fetchProduct(manualBarcode.trim());
  };

  // Permission denied
  if (hasPermission === false) {
    return (
      <LinearGradient colors={['#E8F4FD', '#F0F8FF']} style={{ flex: 1 }}>
        <SafeAreaView style={styles.centered}>
          <Text style={styles.permIcon}>📷</Text>
          <Text style={styles.permTitle}>Accès caméra requis</Text>
          <Text style={styles.permSub}>
            Autorisez l'accès à la caméra dans les réglages de votre téléphone pour utiliser le scanner.
          </Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backBtnText}>Retour</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (hasPermission === null) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  const previewNutrients = scannedFood
    ? scaleNutrients(scannedFood.nutrients, parseFloat(quantity) || scannedFood.servingSize, scannedFood.servingSize)
    : null;

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Camera */}
        {scanning && (
          <View style={{ flex: 1 }}>
            <CameraView
              style={StyleSheet.absoluteFill}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ['ean8', 'ean13', 'qr', 'upc_a', 'upc_e', 'code128', 'code39', 'datamatrix'] }}
              onBarcodeScanned={handleBarcodeScanned}
            />

            {/* Overlay */}
            <View style={styles.overlay}>
              {/* Top bar */}
              <View style={styles.topBar}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
                  <Text style={styles.closeBtnText}>✕</Text>
                </TouchableOpacity>
                <Text style={styles.scanTitle}>Scanner un produit</Text>
                <TouchableOpacity onPress={() => setShowManual(!showManual)} style={styles.manualBtn}>
                  <Text style={styles.manualBtnText}>Manuel</Text>
                </TouchableOpacity>
              </View>

              {/* Manual barcode input */}
              {showManual && (
                <View style={styles.manualBox}>
                  <TextInput
                    style={styles.manualInput}
                    placeholder="Entrer un code-barres..."
                    placeholderTextColor="rgba(255,255,255,0.5)"
                    value={manualBarcode}
                    onChangeText={setManualBarcode}
                    keyboardType="numeric"
                    returnKeyType="search"
                    onSubmitEditing={handleManualSearch}
                  />
                  <TouchableOpacity style={styles.manualSearchBtn} onPress={handleManualSearch}>
                    <Text style={styles.manualSearchText}>Rechercher</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Viewfinder */}
              <View style={styles.viewfinderArea}>
                <View style={styles.viewfinder}>
                  <View style={[styles.corner, styles.topLeft]} />
                  <View style={[styles.corner, styles.topRight]} />
                  <View style={[styles.corner, styles.bottomLeft]} />
                  <View style={[styles.corner, styles.bottomRight]} />
                </View>
                {loading && (
                  <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color="#fff" />
                    <Text style={styles.loadingText}>Recherche du produit...</Text>
                  </View>
                )}
              </View>

              {/* Bottom hint */}
              <View style={styles.bottomHint}>
                <Text style={styles.hintText}>
                  📦 Pointez la caméra vers le code-barres du produit
                </Text>
                {mealType && (
                  <Text style={styles.hintMeal}>
                    Ajout pour : {MEAL_TYPE_LABELS[mealType]}
                  </Text>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Result panel */}
        {!scanning && (
          <LinearGradient colors={['#E8F4FD', '#F0F8FF', '#E6F3FF']} style={{ flex: 1 }}>
            <View style={styles.resultHeader}>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Text style={styles.back}>‹ Retour</Text>
              </TouchableOpacity>
              <Text style={styles.resultTitle}>Produit scanné</Text>
              <TouchableOpacity onPress={handleRescan}>
                <Text style={styles.rescanBtn}>🔄 Rescanner</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.resultScroll}>
              {loading && (
                <View style={styles.centeredBlock}>
                  <ActivityIndicator size="large" color="#2196F3" />
                  <Text style={styles.loadingTextDark}>Recherche en cours...</Text>
                </View>
              )}

              {notFound && !loading && (
                <View style={styles.notFoundBox}>
                  <Text style={styles.notFoundEmoji}>🤔</Text>
                  <Text style={styles.notFoundTitle}>Produit non trouvé</Text>
                  <Text style={styles.notFoundSub}>
                    Ce produit n'est pas encore dans la base Open Food Facts.
                  </Text>
                  <TouchableOpacity style={styles.addManualBtn} onPress={() => navigation.navigate('AddFood')}>
                    <Text style={styles.addManualBtnText}>+ Ajouter manuellement</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.addManualBtn, { backgroundColor: '#E8F4FD', marginTop: 8 }]} onPress={handleRescan}>
                    <Text style={[styles.addManualBtnText, { color: '#2196F3' }]}>🔄 Scanner à nouveau</Text>
                  </TouchableOpacity>
                </View>
              )}

              {scannedFood && !loading && (
                <>
                  {/* Product card */}
                  <View style={styles.productCard}>
                    <View style={styles.productHeader}>
                      <Text style={styles.productEmoji}>{scannedFood.emoji}</Text>
                      <View style={styles.productInfo}>
                        <Text style={styles.productName}>{scannedFood.name}</Text>
                        <View style={styles.offBadge}>
                          <Text style={styles.offBadgeText}>📦 Open Food Facts</Text>
                        </View>
                      </View>
                    </View>

                    {/* Big calorie */}
                    <View style={styles.calBig}>
                      <Text style={styles.calBigLabel}>Pour 100g</Text>
                      <View style={styles.calBigRow}>
                        <Text style={styles.calBigValue}>{scannedFood.nutrients.calories}</Text>
                        <Text style={styles.calBigUnit}> kcal</Text>
                      </View>
                    </View>

                    {/* Macros grid */}
                    <View style={styles.macrosGrid}>
                      {[
                        { label: 'Glucides', value: scannedFood.nutrients.carbs, unit: 'g', color: '#4CAF50', emoji: '🌾' },
                        { label: 'Protéines', value: scannedFood.nutrients.proteins, unit: 'g', color: '#FF9800', emoji: '🥩' },
                        { label: 'Graisses', value: scannedFood.nutrients.fats, unit: 'g', color: '#FFC107', emoji: '🧈' },
                        { label: 'Fibres', value: scannedFood.nutrients.fiber || 0, unit: 'g', color: '#9C27B0', emoji: '🌿' },
                        { label: 'Sucres', value: scannedFood.nutrients.sugar || 0, unit: 'g', color: '#E91E63', emoji: '🍬' },
                        { label: 'Sel', value: Math.round((scannedFood.nutrients.sodium || 0) / 10) / 100, unit: 'g', color: '#607D8B', emoji: '🧂' },
                      ].map((m) => (
                        <View key={m.label} style={styles.macroCell}>
                          <Text style={styles.macroCellEmoji}>{m.emoji}</Text>
                          <Text style={[styles.macroCellValue, { color: m.color }]}>
                            {m.value}{m.unit}
                          </Text>
                          <Text style={styles.macroCellLabel}>{m.label}</Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  {/* Quantity selector */}
                  <View style={styles.qtyCard}>
                    <Text style={styles.qtyTitle}>Quantité consommée</Text>
                    <View style={styles.qtyRow}>
                      <TouchableOpacity
                        style={styles.qtyAdjBtn}
                        onPress={() => setQuantity(String(Math.max(1, (parseFloat(quantity) || scannedFood.servingSize) - 10)))}
                      >
                        <Text style={styles.qtyAdjText}>−</Text>
                      </TouchableOpacity>
                      <TextInput
                        style={styles.qtyInput}
                        value={quantity}
                        onChangeText={setQuantity}
                        keyboardType="numeric"
                        selectTextOnFocus
                      />
                      <Text style={styles.qtyUnit}>g</Text>
                      <TouchableOpacity
                        style={styles.qtyAdjBtn}
                        onPress={() => setQuantity(String((parseFloat(quantity) || scannedFood.servingSize) + 10))}
                      >
                        <Text style={styles.qtyAdjText}>+</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Quick quantities */}
                    <View style={styles.quickQtys}>
                      {[50, 100, 150, 200].map((q) => (
                        <TouchableOpacity
                          key={q}
                          style={[styles.quickQtyBtn, parseFloat(quantity) === q && styles.quickQtyBtnActive]}
                          onPress={() => setQuantity(String(q))}
                        >
                          <Text style={[styles.quickQtyText, parseFloat(quantity) === q && styles.quickQtyTextActive]}>
                            {q}g
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Preview for quantity */}
                  {previewNutrients && (
                    <View style={styles.previewCard}>
                      <Text style={styles.previewTitle}>
                        Pour {quantity || scannedFood.servingSize}g
                      </Text>
                      <View style={styles.previewRow}>
                        {[
                          { label: 'Calories', value: previewNutrients.calories, unit: 'kcal', color: '#2196F3' },
                          { label: 'Glucides', value: previewNutrients.carbs, unit: 'g', color: '#4CAF50' },
                          { label: 'Protéines', value: previewNutrients.proteins, unit: 'g', color: '#FF9800' },
                          { label: 'Graisses', value: previewNutrients.fats, unit: 'g', color: '#FFC107' },
                        ].map((n) => (
                          <View key={n.label} style={styles.previewCell}>
                            <Text style={[styles.previewValue, { color: n.color }]}>{Math.round(n.value)}</Text>
                            <Text style={styles.previewUnit}>{n.unit}</Text>
                            <Text style={styles.previewLabel}>{n.label}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* Add button */}
                  <TouchableOpacity style={styles.addBtn} onPress={handleAddToLog}>
                    <Text style={styles.addBtnText}>
                      ✅ Ajouter au journal{mealType ? ` (${MEAL_TYPE_LABELS[mealType]})` : ''}
                    </Text>
                  </TouchableOpacity>
                </>
              )}

              <View style={{ height: 40 }} />
            </ScrollView>
          </LinearGradient>
        )}
      </SafeAreaView>
    </View>
  );
}

const CORNER_SIZE = 24;
const CORNER_THICKNESS = 3;

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  permIcon: { fontSize: 48 },
  permTitle: { fontSize: 20, fontWeight: '700', color: '#1A2B4B' },
  permSub: { fontSize: 14, color: '#8A9BB5', textAlign: 'center', lineHeight: 20 },
  backBtn: { backgroundColor: '#2196F3', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12, marginTop: 8 },
  backBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  // Scanner overlay
  overlay: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  closeBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  scanTitle: { color: '#fff', fontSize: 17, fontWeight: '700' },
  manualBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)' },
  manualBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  manualBox: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 12,
    gap: 8,
  },
  manualInput: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#fff',
  },
  manualSearchBtn: {
    backgroundColor: '#2196F3',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  manualSearchText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  viewfinderArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewfinder: {
    width: 250,
    height: 180,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
  },
  topLeft: {
    top: 0, left: 0,
    borderTopWidth: CORNER_THICKNESS, borderLeftWidth: CORNER_THICKNESS,
    borderColor: '#2196F3',
    borderTopLeftRadius: 6,
  },
  topRight: {
    top: 0, right: 0,
    borderTopWidth: CORNER_THICKNESS, borderRightWidth: CORNER_THICKNESS,
    borderColor: '#2196F3',
    borderTopRightRadius: 6,
  },
  bottomLeft: {
    bottom: 0, left: 0,
    borderBottomWidth: CORNER_THICKNESS, borderLeftWidth: CORNER_THICKNESS,
    borderColor: '#2196F3',
    borderBottomLeftRadius: 6,
  },
  bottomRight: {
    bottom: 0, right: 0,
    borderBottomWidth: CORNER_THICKNESS, borderRightWidth: CORNER_THICKNESS,
    borderColor: '#2196F3',
    borderBottomRightRadius: 6,
  },
  loadingOverlay: {
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    gap: 10,
  },
  loadingText: { color: '#fff', fontSize: 14 },
  bottomHint: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 16,
    alignItems: 'center',
    gap: 4,
  },
  hintText: { color: '#fff', fontSize: 14, textAlign: 'center' },
  hintMeal: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },

  // Result screen
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  back: { fontSize: 16, color: '#2196F3', fontWeight: '600' },
  resultTitle: { fontSize: 17, fontWeight: '700', color: '#1A2B4B' },
  rescanBtn: { fontSize: 13, color: '#2196F3', fontWeight: '600' },
  resultScroll: { paddingHorizontal: 16 },
  centeredBlock: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  loadingTextDark: { fontSize: 15, color: '#4A5B72' },

  notFoundBox: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 10,
  },
  notFoundEmoji: { fontSize: 48 },
  notFoundTitle: { fontSize: 20, fontWeight: '700', color: '#1A2B4B' },
  notFoundSub: { fontSize: 14, color: '#8A9BB5', textAlign: 'center' },
  addManualBtn: {
    backgroundColor: '#2196F3',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginTop: 4,
  },
  addManualBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  productCard: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  productHeader: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', marginBottom: 14 },
  productEmoji: { fontSize: 32 },
  productInfo: { flex: 1, gap: 6 },
  productName: { fontSize: 16, fontWeight: '700', color: '#1A2B4B' },
  offBadge: {
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  offBadgeText: { fontSize: 10, color: '#E65100', fontWeight: '600' },
  calBig: {
    alignItems: 'center',
    backgroundColor: '#EBF5FD',
    borderRadius: 14,
    paddingVertical: 12,
    marginBottom: 14,
  },
  calBigLabel: { fontSize: 12, color: '#8A9BB5', marginBottom: 2 },
  calBigRow: { flexDirection: 'row', alignItems: 'baseline' },
  calBigValue: { fontSize: 42, fontWeight: '800', color: '#2196F3' },
  calBigUnit: { fontSize: 18, color: '#2196F3', fontWeight: '400' },
  macrosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  macroCell: { width: '33.3%', alignItems: 'center', paddingVertical: 8, gap: 2 },
  macroCellEmoji: { fontSize: 16 },
  macroCellValue: { fontSize: 15, fontWeight: '700' },
  macroCellLabel: { fontSize: 10, color: '#8A9BB5' },

  qtyCard: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  qtyTitle: { fontSize: 15, fontWeight: '700', color: '#1A2B4B', marginBottom: 12 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 12 },
  qtyAdjBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F4FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyAdjText: { fontSize: 22, color: '#2196F3', fontWeight: '700', lineHeight: 26 },
  qtyInput: {
    borderWidth: 2,
    borderColor: '#2196F3',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 24,
    fontWeight: '800',
    color: '#1A2B4B',
    minWidth: 80,
    textAlign: 'center',
  },
  qtyUnit: { fontSize: 16, color: '#8A9BB5', fontWeight: '500' },
  quickQtys: { flexDirection: 'row', gap: 8, justifyContent: 'center' },
  quickQtyBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F0F8FF',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  quickQtyBtnActive: { borderColor: '#2196F3', backgroundColor: '#EBF5FD' },
  quickQtyText: { fontSize: 13, color: '#4A5B72', fontWeight: '600' },
  quickQtyTextActive: { color: '#2196F3' },

  previewCard: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  previewTitle: { fontSize: 14, fontWeight: '600', color: '#4A5B72', marginBottom: 10 },
  previewRow: { flexDirection: 'row', justifyContent: 'space-around' },
  previewCell: { alignItems: 'center', gap: 2 },
  previewValue: { fontSize: 20, fontWeight: '800' },
  previewUnit: { fontSize: 10, color: '#8A9BB5' },
  previewLabel: { fontSize: 10, color: '#8A9BB5' },

  addBtn: {
    backgroundColor: '#2196F3',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 8,
  },
  addBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
