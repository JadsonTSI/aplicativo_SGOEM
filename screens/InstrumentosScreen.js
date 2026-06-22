// screens/InstrumentosScreen.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  StatusBar, Modal, ActivityIndicator,
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

const statusCfg = {
  disponivel:{ label:'Disponivel', bg:C.greenBg, color:C.green, bar:C.green },
  emprestado:{ label:'Emprestado', bg:C.blueBg,  color:C.blue,  bar:C.blue  },
  inativo:   { label:'Inativo',    bg:C.surf,    color:C.mute,  bar:C.line  },
};
const condicaoCfg = {
  otimo:  { label:'Otimo',   color:'#3A8A20' },
  bom:    { label:'Bom',     color:C.blue    },
  regular:{ label:'Regular', color:C.amber   },
  ruim:   { label:'Ruim',    color:C.red     },
};

const getStatus = (i) => !i.ativo ? 'inativo' : i.disponivel ? 'disponivel' : 'emprestado';

const Pill = ({ label, bg, color, size=10 }) => (
  <View style={{ backgroundColor:bg, paddingHorizontal:9, paddingVertical:3, borderRadius:20, alignSelf:'flex-start' }}>
    <Text style={{ color, fontSize:size, fontWeight:'700' }}>{label}</Text>
  </View>
);

const InfoRow = ({ label, value }) => (
  <View style={{ flexDirection:'row', justifyContent:'space-between', paddingVertical:8, borderBottomWidth:1, borderBottomColor:C.line }}>
    <Text style={{ fontSize:13, color:C.mute }}>{label}</Text>
    <Text style={{ fontSize:13, fontWeight:'700', color:C.ink, flex:1, textAlign:'right', marginLeft:8 }}>{value}</Text>
  </View>
);

const DetalheModal = ({ inst, onClose }) => {
  if (!inst) return null;
  const st   = statusCfg[getStatus(inst)];
  const cc   = condicaoCfg[inst.condicao] || condicaoCfg.otimo;
  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={{ flex:1, backgroundColor:C.surf }} edges={['top']}>
        <View style={{ backgroundColor:C.ink, padding:16, borderBottomWidth:2, borderBottomColor:C.gold }}>
          <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start' }}>
            <View style={{ flex:1, marginRight:12 }}>
              <Text style={{ fontSize:10, color:C.gold, fontWeight:'800', letterSpacing:1.2, textTransform:'uppercase', marginBottom:3 }}>{inst.identificador}</Text>
              <Text style={{ fontSize:17, fontWeight:'900', color:'#fff', lineHeight:22 }}>{inst.nome}</Text>
              <Text style={{ fontSize:11, color:'#6A6058', marginTop:2 }}>{inst.naipe}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={{ backgroundColor:'rgba(255,255,255,.1)', width:32, height:32, borderRadius:16, alignItems:'center', justifyContent:'center' }}>
              <Text style={{ color:'#fff', fontSize:16 }}>X</Text>
            </TouchableOpacity>
          </View>
          <View style={{ flexDirection:'row', gap:8, marginTop:10, flexWrap:'wrap' }}>
            <Pill label={st.label} bg={st.bg} color={st.color} />
            <Pill label={cc.label} bg={cc.color+'18'} color={cc.color} />
            {inst.pertence_associacao && <Pill label="Patrimonio ABANFAR" bg={C.goldPale} color={C.goldD} />}
          </View>
        </View>
        <ScrollView contentContainerStyle={{ padding:16, paddingBottom:40 }}>
          <View style={{ backgroundColor:C.cream, borderWidth:1, borderColor:C.line, borderRadius:14, padding:14, marginBottom:12 }}>
            <Text style={{ fontSize:10, color:C.gold, fontWeight:'700', letterSpacing:1, textTransform:'uppercase', marginBottom:6 }}>Tag RFID</Text>
            <Text style={{ fontSize:20, fontFamily:'monospace', fontWeight:'900', color:C.ink, letterSpacing:2 }}>{inst.rfid || 'SEM TAG'}</Text>
            <Text style={{ fontSize:11, color:C.mute, marginTop:6, lineHeight:16 }}>Lida pelo ESP32+RC522 no deposito.</Text>
          </View>
          {!inst.disponivel && inst.emprestado_para && (
            <View style={{ backgroundColor:C.blueBg, borderWidth:1, borderColor:C.blue+'33', borderRadius:12, padding:12, marginBottom:12, flexDirection:'row', alignItems:'center', gap:10 }}>
              <View>
                <Text style={{ fontSize:10, color:C.blue, fontWeight:'700', textTransform:'uppercase', letterSpacing:0.6 }}>Em posse de</Text>
                <Text style={{ fontSize:15, fontWeight:'800', color:C.ink }}>{inst.emprestado_para}</Text>
                <Text style={{ fontSize:10, color:C.mute, fontFamily:'monospace', marginTop:2 }}>devolvido = False</Text>
              </View>
            </View>
          )}
          <Text style={{ fontSize:10, color:C.mute, fontWeight:'700', letterSpacing:1, textTransform:'uppercase', marginBottom:8 }}>Informacoes</Text>
          <View style={{ backgroundColor:C.cream, borderWidth:1, borderColor:C.line, borderRadius:12, padding:12, marginBottom:14 }}>
            <InfoRow label="Identificador" value={inst.identificador} />
            <InfoRow label="Naipe" value={inst.naipe} />
            <InfoRow label="Ativo" value={inst.ativo ? 'Sim' : 'Nao'} />
            <InfoRow label="Pertence a associacao" value={inst.pertence_associacao ? 'Sim' : 'Nao'} />
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

export default function InstrumentosScreen() {
  const [filtro,  setFiltro]  = useState('todos');
  const [busca,   setBusca]   = useState('');
  const [detalhe, setDetalhe] = useState(null);
  const [instrumentos, setInstrumentos] = useState([]);
  const [loading, setLoading] = useState(true);

  const carregarInstrumentos = async () => {
    try {
      const res = await axios.get(`${API_BASE}/instrumentos/api/listar/`);
      if (Array.isArray(res.data)) {
        setInstrumentos(res.data);
      } else {
        console.log('Dados de instrumentos inválidos (não é array):', res.data);
      }
    } catch (err) {
      console.log('Erro ao carregar instrumentos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarInstrumentos();
  }, []);

  const filtered = instrumentos.filter(i => {
    const st  = getStatus(i);
    const okF = filtro==='todos' ? true : st===filtro;
    const okB = !busca
      || i.nome.toLowerCase().includes(busca.toLowerCase())
      || i.identificador.toLowerCase().includes(busca.toLowerCase());
    return okF && okB;
  });

  const FILTROS = [
    { v:'todos',      l:'Todos'       },
    { v:'disponivel', l:'Disponiveis' },
    { v:'emprestado', l:'Emprestados' },
    { v:'inativo',    l:'Inativos'    },
  ];

  if (loading) {
    return (
      <SafeAreaView style={{ flex:1, backgroundColor:C.ink, justifyContent:'center', alignItems:'center' }}>
        <StatusBar barStyle="light-content" backgroundColor={C.ink} />
        <ActivityIndicator size="large" color={C.gold} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex:1, backgroundColor:C.ink }} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={C.ink} />
      <View style={{ backgroundColor:C.ink, padding:16, paddingTop:12, borderBottomWidth:2, borderBottomColor:C.gold }}>
        <Text style={{ fontSize:9, color:C.gold, letterSpacing:2, fontWeight:'800', textTransform:'uppercase', marginBottom:2 }}>ABANFAR BF</Text>
        <Text style={{ fontSize:18, fontWeight:'900', color:'#fff' }}>Estoque</Text>
        <Text style={{ fontSize:11, color:'#6A6058', marginTop:2 }}>{instrumentos.filter(i=>i.ativo).length} instrumentos ativos</Text>
      </View>

      <View style={{ flex:1, backgroundColor:C.surf }}>
        <View style={{ flexDirection:'row', gap:8, padding:16, paddingBottom:8 }}>
          {[
            { n:instrumentos.length,                                   l:'Total',       c:C.gold  },
            { n:instrumentos.filter(i=>i.disponivel&&i.ativo).length,  l:'Disponiveis', c:C.green },
            { n:instrumentos.filter(i=>!i.disponivel&&i.ativo).length, l:'Emprestados', c:C.blue  },
            { n:instrumentos.filter(i=>!i.ativo).length,               l:'Inativos',    c:C.mute  },
          ].map(s => (
            <View key={s.l} style={{ flex:1, backgroundColor:C.cream, borderWidth:1, borderColor:C.line, borderRadius:10, padding:8, alignItems:'center' }}>
              <Text style={{ fontSize:18, fontWeight:'900', color:s.c }}>{s.n}</Text>
              <Text style={{ fontSize:9, color:C.mute, marginTop:1 }}>{s.l}</Text>
            </View>
          ))}
        </View>

        <View style={{ marginHorizontal:16, marginBottom:8 }}>
          <TextInput
            value={busca} onChangeText={setBusca}
            placeholder="Buscar por nome ou identificador..."
            placeholderTextColor={C.mute}
            style={{ backgroundColor:C.cream, borderWidth:1, borderColor:C.line, borderRadius:10, padding:11, fontSize:13, color:C.ink }}
          />
        </View>

        <View style={{ height:40, marginBottom:10 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}
            style={{ paddingHorizontal:16 }}
            contentContainerStyle={{ gap:6, paddingRight:16, alignItems:'center' }}>
            {FILTROS.map(({ v, l }) => (
              <TouchableOpacity key={v} onPress={() => setFiltro(v)}
                style={{ backgroundColor: filtro===v ? C.ink : C.cream, borderWidth:1, borderColor: filtro===v ? C.gold : C.line, borderRadius:20, paddingHorizontal:14, paddingVertical:7, height:34, justifyContent:'center' }}>
                <Text style={{ fontSize:11, fontWeight:'700', color: filtro===v ? C.gold : C.mute }}>{l}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <ScrollView contentContainerStyle={{ padding:16, paddingTop:4, paddingBottom:100 }} showsVerticalScrollIndicator={false}>
          <Text style={{ fontSize:11, color:C.mute, marginBottom:10 }}>{filtered.length} resultado{filtered.length!==1?'s':''}</Text>
          {filtered.map(inst => {
            const st = statusCfg[getStatus(inst)];
            const cc = condicaoCfg[inst.condicao] || condicaoCfg.otimo;
            return (
              <TouchableOpacity key={inst.id} onPress={() => setDetalhe(inst)}
                style={{ backgroundColor:C.cream, borderWidth:1, borderColor:C.line, borderRadius:14, padding:13, marginBottom:8, borderLeftWidth:3, borderLeftColor:st.bar }}>
                <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                  <View style={{ flex:1, marginRight:8 }}>
                    <Text style={{ fontSize:10, color:C.gold, fontWeight:'700', letterSpacing:1, textTransform:'uppercase', marginBottom:2 }}>{inst.identificador}</Text>
                    <Text style={{ fontSize:14, fontWeight:'800', color:C.ink, lineHeight:18 }}>{inst.nome}</Text>
                    <Text style={{ fontSize:11, color:C.mute, marginTop:2 }}>{inst.naipe}</Text>
                  </View>
                  <Pill label={st.label} bg={st.bg} color={st.color} />
                </View>
                {inst.emprestado_para && (
                  <View style={{ backgroundColor:C.blueBg, borderRadius:8, paddingHorizontal:10, paddingVertical:5, marginBottom:8, flexDirection:'row', alignItems:'center', gap:6 }}>
                    <Text style={{ fontSize:11, color:C.blue, fontWeight:'600' }}>{inst.emprestado_para}</Text>
                  </View>
                )}
                <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center' }}>
                  <Text style={{ fontSize:10, color:C.mute, fontFamily:'monospace' }}>{inst.rfid || 'SEM TAG'}</Text>
                  <View style={{ backgroundColor:cc.color+'18', paddingHorizontal:8, paddingVertical:2, borderRadius:10 }}>
                    <Text style={{ fontSize:10, color:cc.color, fontWeight:'700' }}>{cc.label}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
          {filtered.length === 0 && (
            <View style={{ alignItems:'center', padding:40 }}>
              <Text style={{ fontSize:13, color:C.mute }}>Nenhum instrumento encontrado.</Text>
            </View>
          )}
        </ScrollView>
      </View>
      {detalhe && <DetalheModal inst={detalhe} onClose={() => setDetalhe(null)} />}
    </SafeAreaView>
  );
}