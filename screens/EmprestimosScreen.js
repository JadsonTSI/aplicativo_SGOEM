// screens/EmprestimosScreen.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, StatusBar, Modal, Alert, ActivityIndicator,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { API_BASE } from '../apiConfig';
import axios from 'axios';

const C = {
  gold:'#C9A84C', goldL:'#E8C96A', goldPale:'#F5E9C8', goldD:'#9A7A30',
  ink:'#0F0D0A', soft:'#2A2520', cream:'#FDFAF3', surf:'#F2EDE2',
  mute:'#8A7E70', line:'#E2D8C8',
  green:'#2D7A4F', greenBg:'#E8F5EE',
  red:'#C0392B',   redBg:'#FDECEA',
  blue:'#1A5FAB',  blueBg:'#EAF1FB',
  amber:'#B8620A', amberBg:'#FDF3E3',
};

const hoje = () => new Date().toLocaleDateString('pt-BR');

const Pill = ({ label, bg, color }) => (
  <View style={{ backgroundColor:bg, paddingHorizontal:10, paddingVertical:3,
    borderRadius:20, alignSelf:'flex-start' }}>
    <Text style={{ color, fontSize:10, fontWeight:'700' }}>{label}</Text>
  </View>
);

// ── MODAL DEVOLUÇÃO COM RFID ──────────────────────────────────────────────────
const DevolucaoModal = ({ emp, onClose, onConfirm }) => {
  const [fase, setFase] = useState('info'); // info | rfid | ok
  const [error, setError] = useState('');

  const simularRFID = async () => {
    setFase('rfid');
    setError('');
    
    // Simular a leitura do RFID aguardando 2 segundos
    setTimeout(async () => {
      try {
        const res = await axios.post(`${API_BASE}/instrumentos/api/devolucao/`, {
          rfid: emp.rfid,
        }, {
          headers: { 'Content-Type': 'application/json' }
        });

        if (res.data.sucesso) {
          setFase('ok');
          onConfirm();
        } else {
          setError(res.data.erro || 'Erro desconhecido ao devolver.');
          setFase('info');
        }
      } catch (err) {
        setError(err.response?.data?.erro || 'Erro de rede ou servidor.');
        setFase('info');
      }
    }, 2000);
  };

  const devolverManualmente = async () => {
    setError('');
    try {
      const res = await axios.post(`${API_BASE}/instrumentos/api/devolucao/`, {
        rfid: emp.rfid,
      }, {
        headers: { 'Content-Type': 'application/json' }
      });

      if (res.data.sucesso) {
        setFase('ok');
        onConfirm();
      } else {
        Alert.alert('Erro', res.data.erro || 'Erro ao registrar devolução.');
      }
    } catch (err) {
      Alert.alert('Erro', err.response?.data?.erro || 'Erro ao conectar ao servidor.');
    }
  };

  return (
    <Modal visible transparent animationType="slide">
      <View style={{ flex:1, backgroundColor:'rgba(0,0,0,.55)', justifyContent:'flex-end' }}>
        <View style={{ backgroundColor:C.cream, borderTopLeftRadius:24,
          borderTopRightRadius:24, padding:22 }}>
          <View style={{ width:40, height:4, backgroundColor:C.line,
            borderRadius:2, alignSelf:'center', marginBottom:18 }} />

          {fase === 'info' && (
            <>
              <Text style={{ fontSize:10, color:C.gold, fontWeight:'800',
                letterSpacing:1.2, textTransform:'uppercase', marginBottom:3 }}>
                IoT RFID
              </Text>
              <Text style={{ fontSize:17, fontWeight:'900', color:C.ink, marginBottom:14 }}>
                Registrar Devolução
              </Text>

              {error !== '' && (
                <View style={{ backgroundColor:C.redBg, borderWidth:1, borderColor:C.red+'44', borderRadius:10, padding:10, marginBottom:10 }}>
                  <Text style={{ color:C.red, fontSize:12, fontWeight:'600' }}>{error}</Text>
                </View>
              )}

              <View style={{ backgroundColor:C.surf, borderRadius:12, padding:12, marginBottom:14 }}>
                <Text style={{ fontSize:11, color:C.mute, marginBottom:3 }}>Instrumento</Text>
                <Text style={{ fontSize:15, fontWeight:'800', color:C.ink }}>{emp.instrumento}</Text>
                <Text style={{ fontSize:11, color:C.gold, fontFamily:'monospace', marginTop:2 }}>
                  {emp.identificador} (RFID: {emp.rfid || 'Sem RFID'})
                </Text>
                <Text style={{ fontSize:11, color:C.mute, marginTop:4 }}>
                  Aluno: <Text style={{ fontWeight:'700', color:C.ink }}>{emp.aluno}</Text>
                </Text>
                {emp.dias_atraso > 0 && (
                  <View style={{ backgroundColor:C.redBg, borderRadius:8,
                    padding:8, marginTop:8 }}>
                    <Text style={{ fontSize:11, color:C.red, fontWeight:'700' }}>
                      ⚠️ {emp.dias_atraso} dias de atraso
                    </Text>
                  </View>
                )}
              </View>

              <View style={{ backgroundColor:C.goldPale, borderRadius:10, padding:10, marginBottom:14 }}>
                <Text style={{ fontSize:11, color:C.goldD, lineHeight:17 }}>
                  📡 O ESP32+RC522 no depósito vai ler a tag RFID do instrumento
                  e registrar a devolução automaticamente.
                </Text>
              </View>

              <TouchableOpacity onPress={simularRFID}
                style={{ backgroundColor:C.green, borderRadius:12, padding:14,
                  alignItems:'center', marginBottom:8 }}>
                <Text style={{ fontSize:14, fontWeight:'800', color:'#fff' }}>
                  📡  Confirmar via RFID
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={devolverManualmente}
                style={{ backgroundColor:C.surf, borderWidth:1, borderColor:C.line,
                  borderRadius:12, padding:13, alignItems:'center', marginBottom:8 }}>
                <Text style={{ fontSize:13, color:C.mute }}>Registrar manualmente</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose}
                style={{ padding:10, alignItems:'center' }}>
                <Text style={{ fontSize:13, color:C.mute }}>Cancelar</Text>
              </TouchableOpacity>
            </>
          )}

          {fase === 'rfid' && (
            <View style={{ alignItems:'center', paddingVertical:24 }}>
              <Text style={{ fontSize:48, marginBottom:12 }}>📡</Text>
              <Text style={{ fontSize:16, fontWeight:'800', color:C.ink, marginBottom:6 }}>
                Aguardando leitura…
              </Text>
              <Text style={{ fontSize:12, color:C.mute, textAlign:'center', lineHeight:18 }}>
                Aproxime o instrumento do leitor{'\n'}ESP32+RC522 no depósito
              </Text>
            </View>
          )}

          {fase === 'ok' && (
            <View style={{ alignItems:'center', paddingVertical:20 }}>
              <View style={{ width:64, height:64, borderRadius:32,
                backgroundColor:C.greenBg, borderWidth:2, borderColor:C.green,
                alignItems:'center', justifyContent:'center', marginBottom:12 }}>
                <Text style={{ fontSize:26 }}>✅</Text>
              </View>
              <Text style={{ fontSize:16, fontWeight:'900', color:C.ink, marginBottom:6 }}>
                Devolução registrada!
              </Text>
              <Text style={{ fontSize:11, color:C.green, marginBottom:4,
                fontFamily:'monospace' }}>devolvido = True</Text>
              <Text style={{ fontSize:11, color:C.green, fontFamily:'monospace',
                marginBottom:20 }}>data_devolucao = {hoje()}</Text>
              <TouchableOpacity onPress={onClose}
                style={{ backgroundColor:C.gold, borderRadius:12, padding:13,
                  paddingHorizontal:32 }}>
                <Text style={{ fontSize:13, fontWeight:'800', color:C.ink }}>Fechar</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

// ── TELA PRINCIPAL ────────────────────────────────────────────────────────────
export default function EmprestimosScreen() {
  const [dados,    setDados]    = useState([]);
  const [filtro,   setFiltro]   = useState('ativos');
  const [devModal, setDevModal] = useState(null);
  const [loading,  setLoading]  = useState(true);

  const carregarEmprestimos = async () => {
    try {
      const res = await axios.get(`${API_BASE}/instrumentos/api/emprestimos/`);
      if (Array.isArray(res.data)) {
        setDados(res.data);
      } else {
        console.log('Dados de empréstimos inválidos (não é array):', res.data);
      }
    } catch (err) {
      console.log('Erro ao buscar empréstimos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarEmprestimos();
  }, []);

  const filtered = dados.filter(e =>
    filtro==='ativos'     ? !e.devolvido && e.dias_atraso===0 :
    filtro==='vencidos'   ? !e.devolvido && e.dias_atraso>0 :
    filtro==='devolvidos' ? e.devolvido : true
  );

  const ativos   = dados.filter(e => !e.devolvido && e.dias_atraso===0).length;
  const vencidos = dados.filter(e => !e.devolvido && e.dias_atraso>0).length;
  const devolvidos = dados.filter(e => e.devolvido).length;

  const TABS = [['ativos','Ativos'],['vencidos','Vencidos'],
                ['devolvidos','Devolvidos'],['todos','Todos']];

  if (loading) {
    return (
      <SafeAreaView style={{ flex:1, backgroundColor:C.ink, justifyContent:'center', alignItems:'center' }}>
        <StatusBar barStyle="light-content" backgroundColor={C.ink} />
        <ActivityIndicator size="large" color={C.gold} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex:1, backgroundColor:C.ink }}>
      <StatusBar barStyle="light-content" backgroundColor={C.ink} />

      {/* TOPBAR */}
      <View style={{ backgroundColor:C.ink, padding:16, paddingTop:12,
        borderBottomWidth:2, borderBottomColor:C.gold,
        flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start' }}>
        <View>
          <Text style={{ fontSize:9, color:C.gold, letterSpacing:2, fontWeight:'800',
            textTransform:'uppercase', marginBottom:2 }}>ABANFAR BF</Text>
          <Text style={{ fontSize:18, fontWeight:'900', color:'#fff' }}>Empréstimos</Text>
          <Text style={{ fontSize:11, color:'#6A6058', marginTop:2 }}>
            InstrumentoEmprestimo
          </Text>
        </View>
        <View style={{ alignItems:'flex-end', gap:3 }}>
          {vencidos > 0 && (
            <View style={{ backgroundColor:C.redBg, borderRadius:8,
              paddingHorizontal:8, paddingVertical:3 }}>
              <Text style={{ fontSize:11, color:C.red, fontWeight:'700' }}>
                {vencidos} vencido{vencidos>1?'s':''}
              </Text>
            </View>
          )}
          <View style={{ backgroundColor:C.blueBg, borderRadius:8,
            paddingHorizontal:8, paddingVertical:3 }}>
            <Text style={{ fontSize:11, color:C.blue, fontWeight:'700' }}>
              {ativos} ativo{ativos>1?'s':''}
            </Text>
          </View>
        </View>
      </View>

      <View style={{ flex:1, backgroundColor:C.surf }}>
        {/* Stats */}
        <View style={{ flexDirection:'row', gap:8, padding:16, paddingBottom:8 }}>
          {[
            { n:ativos,    l:'Ativos',     c:C.blue,  bg:C.blueBg  },
            { n:vencidos,  l:'Vencidos',   c:C.red,   bg:C.redBg   },
            { n:devolvidos,l:'Devolvidos', c:C.green, bg:C.greenBg },
          ].map(s => (
            <View key={s.l} style={{ flex:1, backgroundColor:s.bg,
              borderRadius:12, padding:10, alignItems:'center' }}>
              <Text style={{ fontSize:22, fontWeight:'900', color:s.c }}>{s.n}</Text>
              <Text style={{ fontSize:10, color:s.c, fontWeight:'600', marginTop:1 }}>
                {s.l}
              </Text>
            </View>
          ))}
        </View>

        {/* Alerta vencidos */}
        {vencidos > 0 && (
          <View style={{ marginHorizontal:16, backgroundColor:C.redBg,
            borderWidth:1, borderColor:C.red+'33', borderRadius:12,
            padding:12, marginBottom:8, flexDirection:'row', gap:8 }}>
            <Text style={{ fontSize:18 }}>⚠️</Text>
            <View style={{ flex:1 }}>
              <Text style={{ fontSize:12, fontWeight:'700', color:C.red, marginBottom:4 }}>
                {vencidos} empréstimo(s) com prazo vencido
              </Text>
              {dados.filter(e=>!e.devolvido&&e.dias_atraso>0).map(e => (
                <Text key={e.id} style={{ fontSize:11, color:C.red }}>
                  • {e.aluno} (+{e.dias_atraso}d) — {e.instrumento}
                </Text>
              ))}
            </View>
          </View>
        )}

        {/* Tabs */}
        <View style={{ flexDirection:'row', marginHorizontal:16, marginBottom:10,
          backgroundColor:C.cream, borderRadius:10, padding:3,
          borderWidth:1, borderColor:C.line }}>
          {TABS.map(([v,l]) => (
            <TouchableOpacity key={v} onPress={() => setFiltro(v)}
              style={{ flex:1, backgroundColor: filtro===v ? C.ink : 'transparent',
                borderRadius:8, paddingVertical:8, alignItems:'center' }}>
              <Text style={{ fontSize:11, fontWeight: filtro===v ? '800' : '500',
                color: filtro===v ? C.gold : C.mute }}>{l}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Lista */}
        <ScrollView contentContainerStyle={{ padding:16, paddingTop:4, paddingBottom:100 }}
          showsVerticalScrollIndicator={false}>
          {filtered.length === 0 && (
            <View style={{ alignItems:'center', padding:40 }}>
              <Text style={{ fontSize:36, opacity:0.2, marginBottom:8 }}>📋</Text>
              <Text style={{ fontSize:13, color:C.mute }}>
                Nenhum empréstimo nesta categoria.
              </Text>
            </View>
          )}

          {filtered.map(e => (
            <View key={e.id} style={{ backgroundColor:C.cream, borderWidth:1,
              borderColor:C.line, borderRadius:14, padding:13, marginBottom:10,
              borderLeftWidth:3,
              borderLeftColor: e.devolvido ? C.green : e.dias_atraso>0 ? C.red : C.blue }}>

              {/* Header */}
              <View style={{ flexDirection:'row', justifyContent:'space-between',
                alignItems:'flex-start', marginBottom:8 }}>
                <View style={{ flex:1, marginRight:8 }}>
                  <Text style={{ fontSize:15, fontWeight:'800', color:C.ink }}>{e.aluno}</Text>
                  <Text style={{ fontSize:11, color:C.mute }}>Matrícula: {e.matricula}</Text>
                </View>
                <Pill
                  label={e.devolvido ? 'Devolvido' : e.dias_atraso>0 ? 'Vencido' : 'Ativo'}
                  bg={e.devolvido ? C.greenBg : e.dias_atraso>0 ? C.redBg : C.blueBg}
                  color={e.devolvido ? C.green : e.dias_atraso>0 ? C.red : C.blue}
                />
              </View>

              {/* Instrumento */}
              <Text style={{ fontSize:13, color:C.soft, fontWeight:'600', marginBottom:2 }}>
                🎵 {e.instrumento}
              </Text>
              <Text style={{ fontSize:10, color:C.gold, fontFamily:'monospace',
                marginBottom:10 }}>{e.identificador} (RFID: {e.rfid || 'Sem RFID'})</Text>

              {/* Datas */}
              <View style={{ flexDirection:'row', gap:12, marginBottom:10 }}>
                <View style={{ flex:1, backgroundColor:C.surf, borderRadius:8, padding:8 }}>
                  <Text style={{ fontSize:10, color:C.mute }}>📅 Retirada</Text>
                  <Text style={{ fontSize:12, fontWeight:'700', color:C.ink, marginTop:2 }}>
                    {e.data_emprestimo}
                  </Text>
                </View>
                <View style={{ flex:1, backgroundColor: e.dias_atraso>0 ? C.redBg : C.surf,
                  borderRadius:8, padding:8 }}>
                  <Text style={{ fontSize:10, color: e.dias_atraso>0 ? C.red : C.mute }}>
                    {e.devolvido ? '✅ Devolvido' : '📅 Prazo'}
                  </Text>
                  <Text style={{ fontSize:12, fontWeight:'700',
                    color: e.dias_atraso>0 ? C.red : C.ink, marginTop:2 }}>
                    {e.data_devolucao || (e.dias_atraso>0 ? `+${e.dias_atraso}d atraso` : 'Em dia')}
                  </Text>
                </View>
              </View>

              {/* Model info */}
              <View style={{ backgroundColor:C.surf, borderRadius:8, padding:8,
                marginBottom:10 }}>
                <Text style={{ fontSize:10, color:C.mute, fontFamily:'monospace' }}>
                  devolvido = {e.devolvido ? 'True' : 'False'}
                  {e.data_devolucao
                    ? `  |  data_devolucao = "${e.data_devolucao}"`
                    : '  |  data_devolucao = null'}
                </Text>
              </View>

              {/* Ação */}
              {!e.devolvido && (
                <TouchableOpacity onPress={() => setDevModal(e)}
                  style={{ backgroundColor:C.green, borderRadius:10, padding:11,
                    alignItems:'center', flexDirection:'row', justifyContent:'center', gap:6 }}>
                  <Text style={{ fontSize:16 }}>📡</Text>
                  <Text style={{ fontSize:13, fontWeight:'700', color:'#fff' }}>
                    Registrar Devolução via RFID
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </ScrollView>
      </View>

      {devModal && (
        <DevolucaoModal
          emp={devModal}
          onClose={() => setDevModal(null)}
          onConfirm={() => { carregarEmprestimos(); }}
        />
      )}
    </SafeAreaView>
  );
}