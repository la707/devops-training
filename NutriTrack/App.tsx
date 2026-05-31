import 'react-native-gesture-handler';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NutritionProvider } from './src/context/NutritionContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NutritionProvider>
        <AppNavigator />
      </NutritionProvider>
    </GestureHandlerRootView>
  );
}
