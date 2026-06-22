// screens/PainelScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StatusBar, Animated, Easing, ActivityIndicator,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { API_BASE } from '../apiConfig';
import { VerticalBarChart, DoughnutChart, NaipeProgressList } from '../components/Graficos';

const C = {
  gold:'#C9A84C', goldL:'#E8C96A', goldPale:'#F5E9C8', goldD:'#9A7A30',
  ink:'#0F0D0A', soft:'#2A2520', cream:'#FDFAF3', surf:'#F2EDE2',
  mute:'#8A7E70', line:'#E2D8C8',
  green:'#2D7A4F', greenBg:'#E8F5EE',
  red:'#C0392B',   redBg:'#FDECEA',
  blue:'#1A5FAB',  blueBg:'#EAF1FB',
  amber:'#B8620A', amberBg:'#FDF3E3',
};

const STATS_INIT = {
  instrumentos: { total:0, disponiveis:0, emprestados:0, inativos:0, pertence_assoc:0, com_rfid:0, sem_rfid:0 },
  emprestimos:  { ativos:0, vencidos:0, devolvidos:0, total:0 },
  alunos:       { total:0, naipes:{} },
  ensaios:      { total:0, ativos:0, cancelados:0 },
  condicoes:    { labels: ['Ótimo', 'Bom', 'Regular', 'Ruim'], data: [0, 0, 0, 0] },
  atividade:    { labels: [], emprestimos: [], scans: [] },
  grupos:       [],
  instrumentos_naipes: [],
  alunos_mais_emprestimos: [],
};

const KpiCard = ({ label, value, sub, color, half }) => (
  <View style={{ backgroundColor:C.cream, borderWidth:1, borderColor:C.line,
    borderRadius:14, padding:13, flex:half ? 1 : undefined, borderTopWidth:3, borderTopColor:color }}>
    <Text style={{ fontSize:26, fontWeight:'900', color, lineHeight:28 }}>{value}</Text>
    <Text style={{ fontSize:11, color:C.mute, marginTop:3 }}>{label}</Text>
    {sub && <Text style={{ fontSize:10, color:C.mute, marginTop:1 }}>{sub}</Text>}
  </View>
);

const ProgressBar = ({ value, max, color = C.gold }) => (
  <View style={{ height:5, backgroundColor:C.line, borderRadius:3, overflow:'hidden', marginTop:4 }}>
    <View style={{ width:`${max > 0 ? (value/max)*100 : 0}%`, height:'100%', backgroundColor:color, borderRadius:3 }} />
  </View>
);

const PulsingDot = ({ color = C.green }) => {
  const anim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue:0.3, duration:800, useNativeDriver:true, easing:Easing.ease }),
        Animated.timing(anim, { toValue:1,   duration:800, useNativeDriver:true, easing:Easing.ease }),
      ])
    ).start();
  }, []);
  return <Animated.View style={{ width:8, height:8, borderRadius:4, backgroundColor:color, opacity:anim }} />;
};

export default function PainelScreen({ onLogout }) {
  const [secao, setSecao] = useState('geral');
  const [stats, setStats] = useState(STATS_INIT);
  const [alertas, setAlertas] = useState([]);
  const [proxEnsaio, setProxEnsaio] = useState(null);
  const [loading, setLoading] = useState(true);

  const carregarDados = async () => {
    try {
      const res = await axios.get(`${API_BASE}/instrumentos/api/painel/`);
      if (res.data && res.data.instrumentos && res.data.alunos && res.data.emprestimos && res.data.ensaios) {
        setStats(res.data);
        setAlertas(res.data.alertas || []);
        setProxEnsaio(res.data.proximo_ensaio);
      } else {
        console.log('Dados do painel inválidos (resposta inesperada):', res.data);
      }
    } catch (err) {
      console.log('Erro ao carregar dados do painel:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

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

      <View style={{ backgroundColor:C.ink, padding:16, paddingTop:12, borderBottomWidth:2, borderBottomColor:C.gold }}>
        <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start' }}>
          <View>
            <Text style={{ fontSize:9, color:C.gold, letterSpacing:2, fontWeight:'800', textTransform:'uppercase', marginBottom:2 }}>ABANFAR BF</Text>
            <Text style={{ fontSize:18, fontWeight:'900', color:'#fff' }}>Painel Geral</Text>
            <Text style={{ fontSize:11, color:'#6A6058', marginTop:2 }}>Visao geral do sistema</Text>
          </View>
          <TouchableOpacity onPress={onLogout}
            style={{ backgroundColor:C.redBg, borderWidth:1, borderColor:C.red+'44',
              borderRadius:10, paddingHorizontal:12, paddingVertical:8, marginTop:4 }}>
            <Text style={{ fontSize:11, color:C.red, fontWeight:'700' }}>Sair</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ backgroundColor:C.ink, borderBottomWidth:1, borderBottomColor:'#1E1A14' }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal:16, gap:4, paddingVertical:10 }}>
          {[['geral','Geral'],['instrumentos','Instrumentos'],['emprestimos','Emprestimos'],['alunos','Alunos']].map(([v,l]) => (
            <TouchableOpacity key={v} onPress={() => setSecao(v)}
              style={{ backgroundColor:secao===v ? C.gold : 'rgba(255,255,255,.07)',
                borderRadius:20, paddingHorizontal:14, paddingVertical:7 }}>
              <Text style={{ fontSize:12, fontWeight:secao===v ? '800' : '500',
                color:secao===v ? C.ink : '#6A6058' }}>{l}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={{ flex:1, backgroundColor:C.surf }}
        contentContainerStyle={{ padding:16, paddingBottom:100 }}
        showsVerticalScrollIndicator={false}>

        {secao === 'geral' && (
          <>
            <View style={{ backgroundColor:C.ink, borderWidth:1, borderColor:C.gold+'33', borderRadius:16, padding:14, marginBottom:14 }}>
              <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                <Text style={{ fontSize:14, fontWeight:'800', color:'#fff' }}>ESP32 + RC522</Text>
                <View style={{ flexDirection:'row', alignItems:'center', gap:5 }}>
                  <PulsingDot color={C.green} />
                  <Text style={{ fontSize:11, color:C.green, fontWeight:'700' }}>Online</Text>
                </View>
              </View>
              <View style={{ flexDirection:'row', gap:8 }}>
                {[{ l:'Broker',v:'MQTT',c:'#5B9CF6' },{ l:'RFID',v:'13.56 MHz',c:C.gold },{ l:'Scans',v:'Ativo',c:C.green }].map(s => (
                  <View key={s.l} style={{ flex:1, backgroundColor:'rgba(255,255,255,.06)', borderRadius:10, padding:9 }}>
                    <Text style={{ fontSize:9, color:'#5A5450', textTransform:'uppercase', letterSpacing:0.6 }}>{s.l}</Text>
                    <Text style={{ fontSize:12, fontWeight:'800', color:s.c, marginTop:2 }}>{s.v}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={{ flexDirection:'row', gap:8, marginBottom:8 }}>
              <KpiCard half label="Instrumentos" value={stats.instrumentos.total} sub="cadastrados" color={C.gold} />
              <KpiCard half label="Alunos Ativos" value={stats.alunos.total} sub="matriculados" color={C.green} />
            </View>
            <View style={{ flexDirection:'row', gap:8, marginBottom:14 }}>
              <KpiCard half label="Emprestados" value={stats.instrumentos.emprestados} sub="instrumentos" color={C.blue} />
              <KpiCard half label="Vencidos" value={stats.emprestimos.vencidos} sub="emprestimos" color={C.red} />
            </View>

            <View style={{ backgroundColor:C.cream, borderWidth:1, borderColor:C.line, borderRadius:14, padding:14, marginBottom:14 }}>
              <Text style={{ fontSize:13, fontWeight:'800', color:C.ink, marginBottom:8 }}>Disponibilidade de Instrumentos</Text>
              <DoughnutChart data={[
                { label: 'Disponíveis', value: stats.instrumentos.disponiveis, color: C.green },
                { label: 'Emprestados', value: stats.instrumentos.emprestados, color: C.blue },
              ]} />
            </View>

            <Text style={{ fontSize:10, color:C.mute, fontWeight:'700', letterSpacing:1, textTransform:'uppercase', marginBottom:8 }}>Alertas recentes</Text>
            {alertas.length > 0 ? (
              alertas.map(a => (
                <View key={a.id} style={{ backgroundColor:a.grave ? C.redBg : C.cream,
                  borderWidth:1, borderColor:a.grave ? C.red+'33' : C.line,
                  borderRadius:12, padding:11, marginBottom:8 }}>
                  <Text style={{ fontSize:12, color:a.grave ? C.red : C.soft,
                    fontWeight:a.grave ? '700' : '500', lineHeight:17 }}>{a.msg}</Text>
                </View>
              ))
            ) : (
              <View style={{ backgroundColor:C.cream, borderWidth:1, borderColor:C.line, borderRadius:12, padding:14, marginBottom:8 }}>
                <Text style={{ fontSize:12, color:C.mute, textAlign:'center' }}>Nenhum alerta recente.</Text>
              </View>
            )}

            <Text style={{ fontSize:10, color:C.mute, fontWeight:'700', letterSpacing:1, textTransform:'uppercase', marginTop:6, marginBottom:8 }}>Proximo ensaio</Text>
            {proxEnsaio ? (
              <View style={{ backgroundColor:C.cream, borderWidth:1, borderColor:C.line, borderRadius:14, padding:13, borderLeftWidth:3, borderLeftColor:C.gold }}>
                <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                  <Text style={{ fontSize:15, fontWeight:'900', color:C.ink }}>{proxEnsaio.nome}</Text>
                  <View style={{ backgroundColor:C.greenBg, paddingHorizontal:9, paddingVertical:3, borderRadius:20 }}>
                    <Text style={{ fontSize:10, fontWeight:'700', color:C.green }}>{proxEnsaio.dia}</Text>
                  </View>
                </View>
                <View style={{ flexDirection:'row', gap:8 }}>
                  {[[proxEnsaio.data],[proxEnsaio.inicio],[proxEnsaio.local]].map((v, i) => (
                    <View key={i} style={{ flex:1, backgroundColor:C.surf, borderRadius:8, padding:8 }}>
                      <Text style={{ fontSize:11, color:C.ink, fontWeight:'700', textAlign:'center' }}>{v}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : (
              <View style={{ backgroundColor:C.cream, borderWidth:1, borderColor:C.line, borderRadius:14, padding:14 }}>
                <Text style={{ fontSize:12, color:C.mute, textAlign:'center' }}>Nenhum ensaio agendado.</Text>
              </View>
            )}
          </>
        )}

        {secao === 'instrumentos' && (
          <>
            <View style={{ flexDirection:'row', gap:8, marginBottom:14 }}>
              {[
                { n:stats.instrumentos.total,       l:'Total',       c:C.gold,  bg:C.goldPale },
                { n:stats.instrumentos.disponiveis, l:'Disponiveis', c:C.green, bg:C.greenBg  },
                { n:stats.instrumentos.emprestados, l:'Emprestados', c:C.blue,  bg:C.blueBg   },
                { n:stats.instrumentos.inativos,    l:'Inativos',    c:C.mute,  bg:C.surf     },
              ].map(s => (
                <View key={s.l} style={{ flex:1, backgroundColor:s.bg, borderRadius:12, padding:10, alignItems:'center' }}>
                  <Text style={{ fontSize:20, fontWeight:'900', color:s.c }}>{s.n}</Text>
                  <Text style={{ fontSize:9, color:s.c, marginTop:1, fontWeight:'600' }}>{s.l}</Text>
                </View>
              ))}
            </View>
            <View style={{ backgroundColor:C.cream, borderWidth:1, borderColor:C.line, borderRadius:14, padding:14, marginBottom:14 }}>
              <Text style={{ fontSize:13, fontWeight:'800', color:C.ink, marginBottom:14 }}>Disponibilidade por naipe</Text>
              {stats.instrumentos_naipes && stats.instrumentos_naipes.length > 0 ? (
                stats.instrumentos_naipes.map((n, idx) => {
                  const cores = [C.blue, C.green, C.amber, C.goldD, C.gold, '#8E44AD', '#16A085'];
                  const color = cores[idx % cores.length];
                  return (
                    <View key={n.naipe} style={{ marginBottom:12 }}>
                      <View style={{ flexDirection:'row', justifyContent:'space-between', marginBottom:4 }}>
                        <Text style={{ fontSize:13, color:C.soft }}>{n.naipe}</Text>
                        <Text style={{ fontSize:12, color:color, fontWeight:'700' }}>{n.disp}/{n.total}</Text>
                      </View>
                      <ProgressBar value={n.disp} max={n.total} color={color} />
                    </View>
                  );
                })
              ) : (
                <Text style={{ fontSize:12, color:C.mute, textAlign:'center', paddingVertical:10 }}>Sem dados por naipe.</Text>
              )}
            </View>
            <View style={{ backgroundColor:C.cream, borderWidth:1, borderColor:C.line, borderRadius:14, padding:14 }}>
              <Text style={{ fontSize:13, fontWeight:'800', color:C.ink, marginBottom:14 }}>Condicao do estoque</Text>
              <VerticalBarChart
                height={150}
                color={C.green}
                data={
                  stats.condicoes && stats.condicoes.data
                    ? [
                        { l: 'Ótimo', v: stats.condicoes.data[0] },
                        { l: 'Bom', v: stats.condicoes.data[1] },
                        { l: 'Regular', v: stats.condicoes.data[2] },
                        { l: 'Ruim', v: stats.condicoes.data[3] },
                      ]
                    : [
                        { l: 'Ótimo', v: 0 },
                        { l: 'Bom', v: 0 },
                        { l: 'Regular', v: 0 },
                        { l: 'Ruim', v: 0 },
                      ]
                }
              />
            </View>
          </>
        )}

        {secao === 'emprestimos' && (
          <>
            <View style={{ flexDirection:'row', gap:8, marginBottom:14 }}>
              {[
                { n:stats.emprestimos.ativos,    l:'Ativos',    c:C.blue,  bg:C.blueBg  },
                { n:stats.emprestimos.vencidos,  l:'Vencidos',  c:C.red,   bg:C.redBg   },
                { n:stats.emprestimos.devolvidos,l:'Devolvidos',c:C.green, bg:C.greenBg },
              ].map(s => (
                <View key={s.l} style={{ flex:1, backgroundColor:s.bg, borderRadius:12, padding:10, alignItems:'center' }}>
                  <Text style={{ fontSize:22, fontWeight:'900', color:s.c }}>{s.n}</Text>
                  <Text style={{ fontSize:10, color:s.c, fontWeight:'600', marginTop:1 }}>{s.l}</Text>
                </View>
              ))}
            </View>
            <View style={{ backgroundColor:C.cream, borderWidth:1, borderColor:C.line, borderRadius:14, padding:14, marginBottom:14 }}>
              <Text style={{ fontSize:13, fontWeight:'800', color:C.ink, marginBottom:14 }}>Empréstimos Recentes (Últimos 7 dias)</Text>
              <VerticalBarChart
                height={150}
                color={C.blue}
                data={
                  stats.atividade && stats.atividade.labels && stats.atividade.labels.length > 0
                    ? stats.atividade.labels.map((label, idx) => ({
                        l: label.split('/')[0],
                        v: stats.atividade.emprestimos[idx] || 0
                      }))
                    : [
                        { l: 'Dom', v: 0 },
                        { l: 'Seg', v: 0 },
                        { l: 'Ter', v: 0 },
                        { l: 'Qua', v: 0 },
                        { l: 'Qui', v: 0 },
                        { l: 'Sex', v: 0 },
                        { l: 'Sáb', v: 0 },
                      ]
                }
              />
            </View>

            <View style={{ backgroundColor:C.cream, borderWidth:1, borderColor:C.line, borderRadius:14, padding:14, marginBottom:14 }}>
              <Text style={{ fontSize:13, fontWeight:'800', color:C.ink, marginBottom:8 }}>Etiquetas RFID no Estoque</Text>
              <DoughnutChart
                size={110}
                strokeWidth={16}
                data={[
                  { label: 'Com Etiqueta', value: stats.instrumentos.com_rfid || 0, color: C.gold },
                  { label: 'Sem Etiqueta', value: stats.instrumentos.sem_rfid || 0, color: C.mute },
                ]}
              />
            </View>
            <View style={{ backgroundColor:C.cream, borderWidth:1, borderColor:C.line, borderRadius:14, padding:14 }}>
              <Text style={{ fontSize:13, fontWeight:'800', color:C.ink, marginBottom:14 }}>Alunos com mais empréstimos</Text>
              {stats.alunos_mais_emprestimos && stats.alunos_mais_emprestimos.length > 0 ? (
                stats.alunos_mais_emprestimos.map((a, i) => {
                  const maxVal = Math.max(...stats.alunos_mais_emprestimos.map(x => x.total), 1);
                  const color = i === 0 ? C.gold : C.mute;
                  return (
                    <View key={a.nome} style={{ flexDirection:'row', alignItems:'center', gap:10, marginBottom:10 }}>
                      <View style={{ width:22, height:22, borderRadius:11,
                        backgroundColor:i===0 ? C.goldPale : C.surf,
                        borderWidth:i===0 ? 1.5 : 0, borderColor:C.gold,
                        alignItems:'center', justifyContent:'center' }}>
                        <Text style={{ fontSize:10, fontWeight:'900', color:i===0 ? C.goldD : C.mute }}>#{i+1}</Text>
                      </View>
                      <View style={{ flex:1 }}>
                        <View style={{ flexDirection:'row', justifyContent:'space-between', marginBottom:3 }}>
                          <Text style={{ fontSize:13, color:C.ink, fontWeight:'700' }}>{a.nome}</Text>
                          <Text style={{ fontSize:12, color:color, fontWeight:'800' }}>{a.total} emp.</Text>
                        </View>
                        <ProgressBar value={a.total} max={maxVal} color={color} />
                      </View>
                    </View>
                  );
                })
              ) : (
                <Text style={{ fontSize:12, color:C.mute, textAlign:'center', paddingVertical:10 }}>Nenhum empréstimo registrado.</Text>
              )}
            </View>
          </>
        )}

        {secao === 'alunos' && (
          <>
            <View style={{ flexDirection:'row', gap:8, marginBottom:14 }}>
              {[
                { n:stats.alunos.total, l:'Total',   c:C.gold,  bg:C.goldPale },
                { n:stats.alunos.total, l:'Ativos',  c:C.green, bg:C.greenBg  },
                { n:0,                  l:'Inativos',c:C.mute,  bg:C.surf     },
              ].map(s => (
                <View key={s.l} style={{ flex:1, backgroundColor:s.bg, borderRadius:12, padding:10, alignItems:'center' }}>
                  <Text style={{ fontSize:22, fontWeight:'900', color:s.c }}>{s.n}</Text>
                  <Text style={{ fontSize:10, color:s.c, fontWeight:'600', marginTop:1 }}>{s.l}</Text>
                </View>
              ))}
            </View>
            <View style={{ backgroundColor:C.cream, borderWidth:1, borderColor:C.line, borderRadius:14, padding:14, marginBottom:14 }}>
              <Text style={{ fontSize:13, fontWeight:'800', color:C.ink, marginBottom:14 }}>Alunos por Naipe</Text>
              {Object.entries(stats.alunos.naipes).length > 0 ? (
                <NaipeProgressList
                  data={Object.entries(stats.alunos.naipes).map(([naipe, n]) => ({
                    label: naipe,
                    value: n,
                    color: C.gold
                  }))}
                />
              ) : (
                <View style={{ padding:10 }}>
                  <Text style={{ fontSize:12, color:C.mute, textAlign:'center' }}>Sem dados de naipes.</Text>
                </View>
              )}
            </View>

            <View style={{ backgroundColor:C.cream, borderWidth:1, borderColor:C.line, borderRadius:14, padding:14, marginBottom:14 }}>
              <Text style={{ fontSize:13, fontWeight:'800', color:C.ink, marginBottom:8 }}>Alunos por Grupo Musical</Text>
              {stats.grupos && stats.grupos.length > 0 ? (
                <DoughnutChart
                  size={120}
                  strokeWidth={16}
                  data={stats.grupos.map((g, idx) => {
                    const cores = [C.gold, C.blue, '#8E44AD', '#16A085', '#2C3E50', '#D35400', '#27AE60'];
                    return {
                      label: g.label,
                      value: g.value,
                      color: cores[idx % cores.length],
                    };
                  })}
                />
              ) : (
                <View style={{ padding:10 }}>
                  <Text style={{ fontSize:12, color:C.mute, textAlign:'center' }}>Sem dados de grupos.</Text>
                </View>
              )}
            </View>
          </>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}