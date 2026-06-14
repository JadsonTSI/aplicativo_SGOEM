// screens/LoginScreen.js
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { API_BASE } from '../apiConfig';

const C = {
  gold:'#C9A84C', goldPale:'#F5E9C8', goldD:'#9A7A30',
  ink:'#0F0D0A', cream:'#FDFAF3', surf:'#F2EDE2',
  mute:'#8A7E70', line:'#E2D8C8',
  red:'#C0392B', redBg:'#FDECEA',
};

export default function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState('');
  const [senha,    setSenha]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [erro,     setErro]     = useState('');

  const handleLogin = async () => {
    if (!username.trim()) { setErro('Digite seu usuario.'); return; }
    if (!senha.trim())    { setErro('Digite sua senha.');   return; }
    setLoading(true);
    setErro('');
    try {
      const axios = require('axios').default;

      const formData = new FormData();
      formData.append('username', username.trim().toLowerCase());
      formData.append('senha', senha);

      const res = await axios.post(`${API_BASE}/contas/api/login/`, formData, {
        timeout: 10000,
        headers: { 'Content-Type':'multipart/form-data' },
        validateStatus: s => s < 500,
      });

      if (res.data.sucesso === true) {
        await AsyncStorage.setItem('sessionid', 'logado');
        await AsyncStorage.setItem('username', username.trim());
        await AsyncStorage.setItem('userType', res.data.tipo || 'gerente');
        onLogin();
      } else {
        setErro(res.data.erro || 'Usuario ou senha incorretos.');
      }
    } catch (err) {
      if (err.code === 'ECONNABORTED') {
        setErro('Servidor demorou demais.');
      } else if (err.code === 'ERR_NETWORK' || err.code === 'ECONNREFUSED') {
        setErro('Nao foi possivel conectar. Verifique o IP e se o Django esta rodando.');
      } else {
        setErro('Usuario ou senha incorretos.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.ink} />
      <ScrollView
        contentContainerStyle={{ flexGrow:1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={s.darkPanel}>
          <View style={s.logoRing}>
            <View style={s.logoCircle}>
              <Text style={s.logoNote}>A</Text>
            </View>
          </View>
          <Text style={s.logoTitle}>ABANFAR BF</Text>
          <Text style={s.logoOrg}>Associacao de Bandas e Fanfarras</Text>
          <View style={s.ornament}>
            <View style={s.ornamentLine}/>
            <Text style={s.ornamentDot}>*</Text>
            <View style={s.ornamentLine}/>
          </View>
          <Text style={s.logoTagline}>Sistema de Gestao Musical</Text>
        </View>

        <View style={s.formPanel}>
          <Text style={s.formTitle}>Entrar na sua conta</Text>
          <Text style={s.formSub}>Use as mesmas credenciais do sistema web</Text>

          {erro !== '' && (
            <View style={s.erroBox}>
              <Text style={s.erroText}>{erro}</Text>
            </View>
          )}

          <Text style={s.fieldLabel}>Usuario</Text>
          <TextInput
            style={s.input}
            value={username}
            onChangeText={t => { setUsername(t); setErro(''); }}
            placeholder="Nome de usuario"
            placeholderTextColor={C.mute}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
            blurOnSubmit={false}
          />

          <Text style={s.fieldLabel}>Senha</Text>
          <TextInput
            style={s.input}
            value={senha}
            onChangeText={t => { setSenha(t); setErro(''); }}
            placeholder="Senha"
            placeholderTextColor={C.mute}
            secureTextEntry={false}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
            blurOnSubmit={false}
            onSubmitEditing={handleLogin}
          />

          <TouchableOpacity
            style={[s.btnLogin, loading && { opacity:0.75 }]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color={C.ink} size="small" />
              : <Text style={s.btnLoginText}>Entrar</Text>
            }
          </TouchableOpacity>

          <View style={s.secBox}>
            <Text style={s.secTitle}>Como sua senha e protegida</Text>
            <Text style={s.secText}>
              Sua senha nunca e armazenada em texto simples. O Django a converte em hash criptografico antes de salvar no banco.
            </Text>
          </View>

          <Text style={s.accessTitle}>Tipos de acesso</Text>
          <View style={s.accessRow}>
            {[
              { role:'Gerente',   desc:'Controle total' },
              { role:'Professor', desc:'Ensaios e grupos' },
              { role:'Aluno',     desc:'Painel proprio' },
            ].map(a => (
              <View key={a.role} style={s.accessCard}>
                <Text style={s.accessRole}>{a.role}</Text>
                <Text style={s.accessDesc}>{a.desc}</Text>
              </View>
            ))}
          </View>

          <Text style={s.footer}>ABANFAR BF {new Date().getFullYear()}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:         { flex:1, backgroundColor:C.ink },
  darkPanel:    { backgroundColor:C.ink, paddingTop:52, paddingBottom:48, paddingHorizontal:28, alignItems:'center', minHeight:240 },
  logoRing:     { width:84, height:84, borderRadius:42, borderWidth:1.5, borderColor:C.gold+'44', alignItems:'center', justifyContent:'center', marginBottom:16 },
  logoCircle:   { width:68, height:68, borderRadius:34, borderWidth:2, borderColor:C.gold, alignItems:'center', justifyContent:'center' },
  logoNote:     { fontSize:30, color:C.gold, fontWeight:'900' },
  logoTitle:    { fontSize:24, fontWeight:'900', color:'#fff', letterSpacing:2.5, marginBottom:5 },
  logoOrg:      { fontSize:11, color:'#5A5450', letterSpacing:0.4, marginBottom:16, textAlign:'center' },
  ornament:     { flexDirection:'row', alignItems:'center', gap:8, marginBottom:10 },
  ornamentLine: { width:40, height:1, backgroundColor:C.gold, opacity:0.35 },
  ornamentDot:  { fontSize:10, color:C.gold, opacity:0.6 },
  logoTagline:  { fontSize:11, color:C.gold, letterSpacing:2, textTransform:'uppercase', fontWeight:'600' },
  formPanel:    { backgroundColor:C.cream, borderTopLeftRadius:28, borderTopRightRadius:28, padding:28, paddingBottom:60, flex:1, marginTop:-24, elevation:12 },
  formTitle:    { fontSize:24, fontWeight:'900', color:C.ink, marginBottom:5 },
  formSub:      { fontSize:13, color:C.mute, marginBottom:22, lineHeight:18 },
  erroBox:      { backgroundColor:C.redBg, borderWidth:1, borderColor:C.red+'55', borderRadius:12, padding:13, marginBottom:16 },
  erroText:     { fontSize:12, color:C.red, fontWeight:'600', lineHeight:18 },
  fieldLabel:   { fontSize:11, color:C.mute, fontWeight:'700', letterSpacing:0.9, textTransform:'uppercase', marginBottom:7 },
  input:        { backgroundColor:C.surf, borderWidth:1.5, borderColor:C.line, borderRadius:13, paddingHorizontal:14, paddingVertical:12, fontSize:15, color:C.ink, marginBottom:16 },
  btnLogin:     { backgroundColor:C.gold, borderRadius:14, padding:17, alignItems:'center', marginTop:4, marginBottom:22, elevation:6 },
  btnLoginText: { fontSize:16, fontWeight:'900', color:C.ink, letterSpacing:0.5 },
  secBox:       { backgroundColor:C.goldPale+'AA', borderWidth:1, borderColor:C.gold+'44', borderRadius:13, padding:14, marginBottom:24 },
  secTitle:     { fontSize:12, fontWeight:'800', color:C.goldD, marginBottom:6 },
  secText:      { fontSize:11, color:C.goldD, lineHeight:18 },
  accessTitle:  { fontSize:10, color:C.mute, fontWeight:'700', letterSpacing:1, textTransform:'uppercase', textAlign:'center', marginBottom:10 },
  accessRow:    { flexDirection:'row', gap:8, marginBottom:28 },
  accessCard:   { flex:1, backgroundColor:C.surf, borderWidth:1, borderColor:C.line, borderRadius:13, padding:11, alignItems:'center', gap:3 },
  accessRole:   { fontSize:11, fontWeight:'800', color:C.ink },
  accessDesc:   { fontSize:9, color:C.mute, textAlign:'center', lineHeight:13 },
  footer:       { fontSize:10, color:C.mute, textAlign:'center', lineHeight:16 },
});