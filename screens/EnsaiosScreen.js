// screens/EnsaiosScreen.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StatusBar, Modal, ActivityIndicator,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { API_BASE } from '../apiConfig';

const C = {
  gold:'#C9A84C', goldL:'#E8C96A', goldPale:'#F5E9C8', goldD:'#9A7A30',
  ink:'#0F0D0A', soft:'#2A2520', cream:'#FDFAF3', surf:'#F2EDE2',
  mute:'#8A7E70', line:'#E2D8C8',
  green:'#2D7A4F', greenBg:'#E8F5EE',
  red:'#C0392B',   redBg:'#FDECEA',
  blue:'#1A5FAB',  blueBg:'#EAF1FB',
  amber:'#B8620A', amberBg:'#FDF3E3',
};

const formatarData = (d) => {
  if (!d) return '';
  const parts = d.split('-');
  if (parts.length !== 3) return d;
  const [y,m,day] = parts;
  return `${day}/${m}/${y}`;
};

const Pill = ({ label, bg, color }) => (
  <View style={{ backgroundColor:bg, paddingHorizontal:10, paddingVertical:3,
    borderRadius:20, alignSelf:'flex-start' }}>
    <Text style={{ color, fontSize:10, fontWeight:'700' }}>{label}</Text>
  </View>
);

// ── DETALHE ENSAIO ────────────────────────────────────────────────────────────
const EnsaioDetalhe = ({ ensaio, onClose }) => {
  const alunos = ensaio.alunos || [];
  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={{ flex:1, backgroundColor:C.surf }}>
        {/* Header */}
        <View style={{ backgroundColor:C.ink, padding:16,
          borderBottomWidth:2, borderBottomColor:C.gold }}>
          <View style={{ flexDirection:'row', justifyContent:'space-between',
            alignItems:'flex-start' }}>
            <View style={{ flex:1, marginRight:12 }}>
              <Text style={{ fontSize:10, color:C.gold, fontWeight:'800',
                letterSpacing:1.2, textTransform:'uppercase', marginBottom:3 }}>
                EnsaiosproModel
              </Text>
              <Text style={{ fontSize:18, fontWeight:'900', color:'#fff', lineHeight:22 }}>
                {ensaio.nome}
              </Text>
              <Text style={{ fontSize:11, color:'#6A6058', marginTop:2 }}>
                {ensaio.dia_semana}
              </Text>
            </View>
            <View style={{ flexDirection:'row', alignItems:'center', gap:8 }}>
              <Pill
                label={ensaio.cancelado ? 'Cancelado' : 'Ativo'}
                bg={ensaio.cancelado ? C.redBg : C.greenBg}
                color={ensaio.cancelado ? C.red : C.green}
              />
              <TouchableOpacity onPress={onClose}
                style={{ backgroundColor:'rgba(255,255,255,.1)',
                  width:32, height:32, borderRadius:16,
                  alignItems:'center', justifyContent:'center' }}>
                <Text style={{ color:'#fff', fontSize:16 }}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <ScrollView contentContainerStyle={{ padding:16, paddingBottom:40 }}>
          {/* Info grid */}
          <View style={{ flexDirection:'row', flexWrap:'wrap', gap:8, marginBottom:16 }}>
            {[
              ['📅 Data',    formatarData(ensaio.data)],
              ['⏰ Início',  ensaio.inicio            ],
              ['🏁 Fim',     ensaio.fim               ],
              ['📍 Local',   ensaio.local             ],
              ['📆 Dia',     ensaio.dia_semana        ],
              ['🔔 Status',  ensaio.cancelado ? 'Cancelado' : 'Ativo'],
            ].map(([k,v]) => (
              <View key={k} style={{ width:'47%', backgroundColor:C.cream,
                borderWidth:1, borderColor:C.line, borderRadius:10, padding:10 }}>
                <Text style={{ fontSize:10, color:C.mute, marginBottom:3 }}>{k}</Text>
                <Text style={{ fontSize:13, fontWeight:'700', color:C.ink }}>{v}</Text>
              </View>
            ))}
          </View>

          {/* Alunos esperados */}
          <Text style={{ fontSize:10, color:C.mute, fontWeight:'700',
            letterSpacing:1, textTransform:'uppercase', marginBottom:8 }}>
            Alunos do Grupo ({alunos.length})
          </Text>

          {alunos.length === 0 ? (
            <View style={{ backgroundColor:C.cream, borderWidth:1, borderColor:C.line,
              borderRadius:12, padding:14, alignItems:'center' }}>
              <Text style={{ color:C.mute, fontSize:13 }}>
                Nenhum aluno vinculado a este grupo.
              </Text>
            </View>
          ) : (
            alunos.map((a, i) => (
              <View key={i} style={{ flexDirection:'row', alignItems:'center', gap:10,
                backgroundColor:C.cream, borderWidth:1, borderColor:C.line,
                borderRadius:10, padding:10, marginBottom:6 }}>
                <View style={{ width:34, height:34, borderRadius:17,
                  backgroundColor:C.goldPale, borderWidth:1.5, borderColor:C.gold,
                  alignItems:'center', justifyContent:'center' }}>
                  <Text style={{ fontSize:13, fontWeight:'900', color:C.goldD }}>
                    {a.nome[0]}
                  </Text>
                </View>
                <View>
                  <Text style={{ fontSize:13, fontWeight:'700', color:C.ink }}>{a.nome}</Text>
                  <Text style={{ fontSize:10, color:C.mute }}>Matrícula: {a.matricula}</Text>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

// ── TELA PRINCIPAL ────────────────────────────────────────────────────────────
export default function EnsaiosScreen() {
  const [filtro,  setFiltro]  = useState('ativos');
  const [detalhe, setDetalhe] = useState(null);
  const [ensaios, setEnsaios] = useState([]);
  const [loading, setLoading] = useState(true);

  const carregarEnsaios = async () => {
    try {
      const axios = require('axios').default;
      const res = await axios.get(`${API_BASE}/professores/api/ensaios/`);
      setEnsaios(res.data);
    } catch (err) {
      console.log('Erro ao carregar ensaios:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarEnsaios();
  }, []);

  const filtered = ensaios.filter(e =>
    filtro === 'ativos'     ? !e.cancelado :
    filtro === 'cancelados' ? e.cancelado  : true
  );

  // Agrupa por data
  const porData = filtered.reduce((acc, e) => {
    const key = formatarData(e.data);
    if (!acc[key]) acc[key] = [];
    acc[key].push(e);
    return acc;
  }, {});

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
        borderBottomWidth:2, borderBottomColor:C.gold }}>
        <Text style={{ fontSize:9, color:C.gold, letterSpacing:2, fontWeight:'800',
          textTransform:'uppercase', marginBottom:2 }}>ABANFAR BF</Text>
        <Text style={{ fontSize:18, fontWeight:'900', color:'#fff' }}>Ensaios</Text>
        <Text style={{ fontSize:11, color:'#6A6058', marginTop:2 }}>EnsaiosproModel</Text>
      </View>

      <View style={{ flex:1, backgroundColor:C.surf }}>
        {/* Stats */}
        <View style={{ flexDirection:'row', gap:8, padding:16, paddingBottom:8 }}>
          {[
            { n:ensaios.filter(e=>!e.cancelado).length, l:'Ativos',     c:C.green, bg:C.greenBg },
            { n:ensaios.filter(e=>e.cancelado).length,  l:'Cancelados', c:C.red,   bg:C.redBg   },
            { n:ensaios.length,                          l:'Total',      c:C.gold,  bg:C.goldPale},
          ].map(s => (
            <View key={s.l} style={{ flex:1, backgroundColor:s.bg, borderRadius:12,
              padding:10, alignItems:'center' }}>
              <Text style={{ fontSize:20, fontWeight:'900', color:s.c }}>{s.n}</Text>
              <Text style={{ fontSize:10, fontWeight:'600', color:s.c, marginTop:1 }}>
                {s.l}
              </Text>
            </View>
          ))}
        </View>

        {/* Filtros */}
        <View style={{ flexDirection:'row', marginHorizontal:16, marginBottom:12,
          backgroundColor:C.cream, borderRadius:10, padding:3,
          borderWidth:1, borderColor:C.line }}>
          {[['ativos','✅ Ativos'],['cancelados','❌ Cancelados'],['todos','Todos']].map(([v,l]) => (
            <TouchableOpacity key={v} onPress={() => setFiltro(v)}
              style={{ flex:1, backgroundColor: filtro===v ? C.ink : 'transparent',
                borderRadius:8, paddingVertical:8, alignItems:'center' }}>
              <Text style={{ fontSize:11, fontWeight: filtro===v ? '800' : '500',
                color: filtro===v ? C.gold : C.mute }}>{l}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Lista agrupada por data */}
        <ScrollView contentContainerStyle={{ padding:16, paddingTop:4, paddingBottom:100 }}
          showsVerticalScrollIndicator={false}>
          {Object.entries(porData).map(([data, ensaiosData]) => (
            <View key={data}>
              {/* Separador de data */}
              <View style={{ flexDirection:'row', alignItems:'center', gap:8, marginBottom:8 }}>
                <View style={{ flex:1, height:1, backgroundColor:C.line }} />
                <View style={{ backgroundColor:C.ink, borderRadius:10,
                  paddingHorizontal:10, paddingVertical:4 }}>
                  <Text style={{ fontSize:10, color:C.gold, fontWeight:'700',
                    letterSpacing:0.8 }}>{data}</Text>
                </View>
                <View style={{ flex:1, height:1, backgroundColor:C.line }} />
              </View>

              {ensaiosData.map(e => (
                <TouchableOpacity key={e.id} onPress={() => setDetalhe(e)}
                  style={{ backgroundColor:C.cream, borderWidth:1, borderColor:C.line,
                    borderRadius:14, padding:13, marginBottom:10,
                    borderLeftWidth:3,
                    borderLeftColor: e.cancelado ? C.line : C.gold,
                    opacity: e.cancelado ? 0.65 : 1 }}>

                  <View style={{ flexDirection:'row', justifyContent:'space-between',
                    alignItems:'flex-start', marginBottom:10 }}>
                    <View style={{ flex:1, marginRight:8 }}>
                      <Text style={{ fontSize:15, fontWeight:'900', color:C.ink }}>
                        {e.nome}
                      </Text>
                      <Text style={{ fontSize:11, color:C.mute, marginTop:2 }}>
                        {e.dia_semana}
                      </Text>
                    </View>
                    <Pill
                      label={e.cancelado ? 'Cancelado' : 'Ativo'}
                      bg={e.cancelado ? C.redBg : C.greenBg}
                      color={e.cancelado ? C.red : C.green}
                    />
                  </View>

                  <View style={{ flexDirection:'row', gap:8 }}>
                    {[
                      ['⏰', `${e.inicio} – ${e.fim}`],
                      ['📍', e.local],
                    ].map(([icon, val]) => (
                      <View key={icon} style={{ flex:1, backgroundColor:C.surf,
                        borderRadius:8, padding:8,
                        flexDirection:'row', alignItems:'center', gap:5 }}>
                        <Text style={{ fontSize:13 }}>{icon}</Text>
                        <Text style={{ fontSize:12, color:C.soft, fontWeight:'600' }}>
                          {val}
                        </Text>
                      </View>
                    ))}
                  </View>

                  {/* Alunos esperados */}
                  <View style={{ marginTop:10, flexDirection:'row', alignItems:'center', gap:6 }}>
                    <View style={{ flexDirection:'row' }}>
                      {(e.alunos||[]).slice(0,4).map((a, i) => (
                        <View key={i} style={{ width:24, height:24, borderRadius:12,
                          backgroundColor:C.goldPale, borderWidth:1.5, borderColor:C.gold,
                          marginLeft: i>0 ? -6 : 0, alignItems:'center',
                          justifyContent:'center' }}>
                          <Text style={{ fontSize:9, fontWeight:'900', color:C.goldD }}>
                            {a.nome[0]}
                          </Text>
                        </View>
                      ))}
                    </View>
                    <Text style={{ fontSize:11, color:C.mute }}>
                      {(e.alunos||[]).length} aluno{(e.alunos||[]).length!==1?'s':''}
                    </Text>
                    <Text style={{ marginLeft:'auto', fontSize:11, color:C.mute }}>
                      Ver detalhes →
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ))}

          {Object.keys(porData).length === 0 && (
            <View style={{ alignItems:'center', padding:40 }}>
              <Text style={{ fontSize:36, opacity:0.2, marginBottom:8 }}>🎼</Text>
              <Text style={{ fontSize:13, color:C.mute }}>
                Nenhum ensaio encontrado.
              </Text>
            </View>
          )}
        </ScrollView>
      </View>

      {detalhe && <EnsaioDetalhe ensaio={detalhe} onClose={() => setDetalhe(null)} />}
    </SafeAreaView>
  );
}