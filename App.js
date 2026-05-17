import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

import LoginScreen        from './screens/LoginScreen';
import ScannerScreen      from './screens/ScannerScreen';
import InstrumentosScreen from './screens/InstrumentosScreen';
import EmprestimosScreen  from './screens/EmprestimosScreen';
import EnsaiosScreen      from './screens/EnsaiosScreen';
import PainelScreen       from './screens/PainelScreen';

const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();

function MainApp({ onLogout }) {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Scanner"      component={ScannerScreen} />
      <Tab.Screen name="Instrumentos" component={InstrumentosScreen} />
      <Tab.Screen name="Emprestimos"  component={EmprestimosScreen} />
      <Tab.Screen name="Ensaios"      component={EnsaiosScreen} />
      <Tab.Screen name="Painel">
        {props => <PainelScreen {...props} onLogout={onLogout} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

export default function App() {
  const [auth, setAuth] = useState(null);

  useEffect(() => {
    AsyncStorage.getItem('sessionid')
      .then(s => setAuth(s ? 'logado' : 'deslogado'))
      .catch(() => setAuth('deslogado'));
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.removeItem('sessionid');
    await AsyncStorage.removeItem('username');
    await AsyncStorage.removeItem('userType');
    setAuth('deslogado');
  };

  if (auth === null) {
    return (
      <SafeAreaProvider>
        <View style={{ flex:1, alignItems:'center', justifyContent:'center', backgroundColor:'#0F0D0A' }}>
          <ActivityIndicator color="#C9A84C" />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {auth === 'deslogado'
            ? <Stack.Screen name="Login">
                {props => <LoginScreen {...props} onLogin={() => setAuth('logado')} />}
              </Stack.Screen>
            : <Stack.Screen name="MainApp">
                {props => <MainApp {...props} onLogout={handleLogout} />}
              </Stack.Screen>
          }
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}