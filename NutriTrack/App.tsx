import 'react-native-gesture-handler';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NutritionProvider } from './src/context/NutritionContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NutritionProvider>
          <AppNavigator />
        </NutritionProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
