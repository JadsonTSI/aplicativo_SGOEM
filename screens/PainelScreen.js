// screens/PainelScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StatusBar, Animated, Easing,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

const C = {
  gold:'#C9A84C', goldL:'#E8C96A', goldPale:'#F5E9C8', goldD:'#9A7A30',
  ink:'#0F0D0A', soft:'#2A2520', cream:'#FDFAF3', surf:'#F2EDE2',
  mute:'#8A7E70', line:'#E2D8C8',
  green:'#2D7A4F', greenBg:'#E8F5EE',
  red:'#C0392B',   redBg:'#FDECEA',
  blue:'#1A5FAB',  blueBg:'#EAF1FB',
  amber:'#B8620A', amberBg:'#FDF3E3',
};

const STATS = {
  instrumentos: { total:10, disponiveis:6, emprestados:3, inativos:1, pertence_assoc:10 },
  emprestimos:  { ativos:3, vencidos:1, devolvidos:5, total:9 },
  alunos:       { total:7, naipes:{ Cordas:3, Madeiras:3, Metais:1, Percussao:0 } },
  ensaios:      { total:6, ativos:5, cancelados:1 },
};

const ALERTAS = [
  { id:1, grave:true,  msg:'Prazo vencido: Clarinete — Ana Silva (+5 dias)' },
  { id:2, grave:false, msg:'Saxofone Yamaha devolvido por Carlos Lima' },
  { id:3, grave:false, msg:'Ensaio Banda Musical hoje as 19:00 — Sala 1' },
];

const PROX_ENSAIO = {
  nome:'Banda Musical', data:'15/05/2026',
  inicio:'19:00', local:'Sala 1', dia:'Hoje',
};

const MiniBarChart = ({ data, color = C.gold }) => {
  const max = Math.max(...data.map(d => d.v));
  return (
    <View style={{ flexDirection:'row', alignItems:'flex-end', gap:4, height:50 }}>
      {data.map((d, i) => (
        <View key={i} style={{ flex:1, alignItems:'center', gap:3 }}>
          <View style={{ width:'100%', height:Math.max(4, (d.v/max)*40),
            backgroundColor:color, borderRadius:3, opacity:i===data.length-1 ? 1 : 0.5 }} />
          <Text style={{ fontSize:8, color:C.mute }}>{d.l}</Text>
        </View>
      ))}
    </View>
  );
};

const ProgressBar = ({ value, max, color = C.gold }) => (
  <View style={{ height:5, backgroundColor:C.line, borderRadius:3, overflow:'hidden', marginTop:4 }}>
    <View style={{ width:`${(value/max)*100}%`, height:'100%', backgroundColor:color, borderRadius:3 }} />
  </View>
);

const KpiCard = ({ label, value, sub, color, half }) => (
  <View style={{ backgroundColor:C.cream, borderWidth:1, borderColor:C.line,
    borderRadius:14, padding:13, flex:half ? 1 : undefined, borderTopWidth:3, borderTopColor:color }}>
    <Text style={{ fontSize:26, fontWeight:'900', color, lineHeight:28 }}>{value}</Text>
    <Text style={{ fontSize:11, color:C.mute, marginTop:3 }}>{label}</Text>
    {sub && <Text style={{ fontSize:10, color:C.mute, marginTop:1 }}>{sub}</Text>}
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
                {[{ l:'Broker',v:'MQTT',c:'#5B9CF6' },{ l:'RFID',v:'13.56 MHz',c:C.gold },{ l:'Scans',v:'12 hoje',c:C.green }].map(s => (
                  <View key={s.l} style={{ flex:1, backgroundColor:'rgba(255,255,255,.06)', borderRadius:10, padding:9 }}>
                    <Text style={{ fontSize:9, color:'#5A5450', textTransform:'uppercase', letterSpacing:0.6 }}>{s.l}</Text>
                    <Text style={{ fontSize:12, fontWeight:'800', color:s.c, marginTop:2 }}>{s.v}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={{ flexDirection:'row', gap:8, marginBottom:8 }}>
              <KpiCard half label="Instrumentos" value={STATS.instrumentos.total} sub="cadastrados" color={C.gold} />
              <KpiCard half label="Alunos Ativos" value={STATS.alunos.total} sub="matriculados" color={C.green} />
            </View>
            <View style={{ flexDirection:'row', gap:8, marginBottom:14 }}>
              <KpiCard half label="Emprestados" value={STATS.instrumentos.emprestados} sub="instrumentos" color={C.blue} />
              <KpiCard half label="Vencidos" value={STATS.emprestimos.vencidos} sub="emprestimos" color={C.red} />
            </View>

            <Text style={{ fontSize:10, color:C.mute, fontWeight:'700', letterSpacing:1, textTransform:'uppercase', marginBottom:8 }}>Alertas recentes</Text>
            {ALERTAS.map(a => (
              <View key={a.id} style={{ backgroundColor:a.grave ? C.redBg : C.cream,
                borderWidth:1, borderColor:a.grave ? C.red+'33' : C.line,
                borderRadius:12, padding:11, marginBottom:8 }}>
                <Text style={{ fontSize:12, color:a.grave ? C.red : C.soft,
                  fontWeight:a.grave ? '700' : '500', lineHeight:17 }}>{a.msg}</Text>
              </View>
            ))}

            <Text style={{ fontSize:10, color:C.mute, fontWeight:'700', letterSpacing:1, textTransform:'uppercase', marginTop:6, marginBottom:8 }}>Proximo ensaio</Text>
            <View style={{ backgroundColor:C.cream, borderWidth:1, borderColor:C.line, borderRadius:14, padding:13, borderLeftWidth:3, borderLeftColor:C.gold }}>
              <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                <Text style={{ fontSize:15, fontWeight:'900', color:C.ink }}>{PROX_ENSAIO.nome}</Text>
                <View style={{ backgroundColor:C.greenBg, paddingHorizontal:9, paddingVertical:3, borderRadius:20 }}>
                  <Text style={{ fontSize:10, fontWeight:'700', color:C.green }}>{PROX_ENSAIO.dia}</Text>
                </View>
              </View>
              <View style={{ flexDirection:'row', gap:8 }}>
                {[[PROX_ENSAIO.data],[PROX_ENSAIO.inicio],[PROX_ENSAIO.local]].map((v, i) => (
                  <View key={i} style={{ flex:1, backgroundColor:C.surf, borderRadius:8, padding:8 }}>
                    <Text style={{ fontSize:11, color:C.ink, fontWeight:'700', textAlign:'center' }}>{v}</Text>
                  </View>
                ))}
              </View>
            </View>
          </>
        )}

        {secao === 'instrumentos' && (
          <>
            <View style={{ flexDirection:'row', gap:8, marginBottom:14 }}>
              {[
                { n:STATS.instrumentos.total,       l:'Total',       c:C.gold,  bg:C.goldPale },
                { n:STATS.instrumentos.disponiveis, l:'Disponiveis', c:C.green, bg:C.greenBg  },
                { n:STATS.instrumentos.emprestados, l:'Emprestados', c:C.blue,  bg:C.blueBg   },
                { n:STATS.instrumentos.inativos,    l:'Inativos',    c:C.mute,  bg:C.surf     },
              ].map(s => (
                <View key={s.l} style={{ flex:1, backgroundColor:s.bg, borderRadius:12, padding:10, alignItems:'center' }}>
                  <Text style={{ fontSize:20, fontWeight:'900', color:s.c }}>{s.n}</Text>
                  <Text style={{ fontSize:9, color:s.c, marginTop:1, fontWeight:'600' }}>{s.l}</Text>
                </View>
              ))}
            </View>
            <View style={{ backgroundColor:C.cream, borderWidth:1, borderColor:C.line, borderRadius:14, padding:14, marginBottom:14 }}>
              <Text style={{ fontSize:13, fontWeight:'800', color:C.ink, marginBottom:14 }}>Disponibilidade por naipe</Text>
              {[
                { naipe:'Cordas',   disp:3, total:4, c:C.blue  },
                { naipe:'Madeiras', disp:2, total:4, c:C.green },
                { naipe:'Metais',   disp:1, total:1, c:C.amber },
                { naipe:'Percussao',disp:2, total:2, c:C.goldD },
              ].map(n => (
                <View key={n.naipe} style={{ marginBottom:12 }}>
                  <View style={{ flexDirection:'row', justifyContent:'space-between', marginBottom:4 }}>
                    <Text style={{ fontSize:13, color:C.soft }}>{n.naipe}</Text>
                    <Text style={{ fontSize:12, color:n.c, fontWeight:'700' }}>{n.disp}/{n.total}</Text>
                  </View>
                  <ProgressBar value={n.disp} max={n.total} color={n.c} />
                </View>
              ))}
            </View>
            <View style={{ backgroundColor:C.cream, borderWidth:1, borderColor:C.line, borderRadius:14, padding:14 }}>
              <Text style={{ fontSize:13, fontWeight:'800', color:C.ink, marginBottom:14 }}>Condicao do estoque</Text>
              <MiniBarChart color={C.gold} data={[{ l:'Otimo',v:5 },{ l:'Bom',v:3 },{ l:'Regular',v:1 },{ l:'Ruim',v:1 }]} />
            </View>
          </>
        )}

        {secao === 'emprestimos' && (
          <>
            <View style={{ flexDirection:'row', gap:8, marginBottom:14 }}>
              {[
                { n:STATS.emprestimos.ativos,    l:'Ativos',    c:C.blue,  bg:C.blueBg  },
                { n:STATS.emprestimos.vencidos,  l:'Vencidos',  c:C.red,   bg:C.redBg   },
                { n:STATS.emprestimos.devolvidos,l:'Devolvidos',c:C.green, bg:C.greenBg },
              ].map(s => (
                <View key={s.l} style={{ flex:1, backgroundColor:s.bg, borderRadius:12, padding:10, alignItems:'center' }}>
                  <Text style={{ fontSize:22, fontWeight:'900', color:s.c }}>{s.n}</Text>
                  <Text style={{ fontSize:10, color:s.c, fontWeight:'600', marginTop:1 }}>{s.l}</Text>
                </View>
              ))}
            </View>
            <View style={{ backgroundColor:C.cream, borderWidth:1, borderColor:C.line, borderRadius:14, padding:14, marginBottom:14 }}>
              <Text style={{ fontSize:13, fontWeight:'800', color:C.ink, marginBottom:14 }}>Emprestimos por semana (maio)</Text>
              <MiniBarChart color={C.blue} data={[{ l:'S1',v:4 },{ l:'S2',v:6 },{ l:'S3',v:3 },{ l:'S4',v:5 }]} />
            </View>
            <View style={{ backgroundColor:C.cream, borderWidth:1, borderColor:C.line, borderRadius:14, padding:14 }}>
              <Text style={{ fontSize:13, fontWeight:'800', color:C.ink, marginBottom:14 }}>Alunos com mais emprestimos</Text>
              {[
                { nome:'Ana Silva',   n:3, c:C.gold },
                { nome:'Carlos Lima', n:2, c:C.mute },
                { nome:'Maria Costa', n:2, c:C.mute },
                { nome:'Sofia Rocha', n:1, c:C.mute },
              ].map((a, i) => (
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
                      <Text style={{ fontSize:12, color:a.c, fontWeight:'800' }}>{a.n}</Text>
                    </View>
                    <ProgressBar value={a.n} max={3} color={a.c} />
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        {secao === 'alunos' && (
          <>
            <View style={{ flexDirection:'row', gap:8, marginBottom:14 }}>
              {[
                { n:STATS.alunos.total, l:'Total',   c:C.gold,  bg:C.goldPale },
                { n:7,                  l:'Ativos',  c:C.green, bg:C.greenBg  },
                { n:0,                  l:'Inativos',c:C.mute,  bg:C.surf     },
              ].map(s => (
                <View key={s.l} style={{ flex:1, backgroundColor:s.bg, borderRadius:12, padding:10, alignItems:'center' }}>
                  <Text style={{ fontSize:22, fontWeight:'900', color:s.c }}>{s.n}</Text>
                  <Text style={{ fontSize:10, color:s.c, fontWeight:'600', marginTop:1 }}>{s.l}</Text>
                </View>
              ))}
            </View>
            <View style={{ backgroundColor:C.cream, borderWidth:1, borderColor:C.line, borderRadius:14, padding:14, marginBottom:14 }}>
              <Text style={{ fontSize:13, fontWeight:'800', color:C.ink, marginBottom:14 }}>Alunos por naipe</Text>
              {Object.entries(STATS.alunos.naipes).map(([naipe, n]) => (
                <View key={naipe} style={{ marginBottom:12 }}>
                  <View style={{ flexDirection:'row', justifyContent:'space-between', marginBottom:4 }}>
                    <Text style={{ fontSize:13, color:C.soft }}>{naipe}</Text>
                    <Text style={{ fontSize:12, color:C.gold, fontWeight:'700' }}>{n}</Text>
                  </View>
                  <ProgressBar value={n} max={3} color={C.gold} />
                </View>
              ))}
            </View>
            <View style={{ backgroundColor:C.cream, borderWidth:1, borderColor:C.line, borderRadius:14, padding:14 }}>
              <Text style={{ fontSize:13, fontWeight:'800', color:C.ink, marginBottom:14 }}>Alunos por grupo musical</Text>
              <MiniBarChart color={C.green} data={[{ l:'Banda',v:3 },{ l:'Cordas',v:2 },{ l:'Flautas',v:1 },{ l:'Metais',v:1 }]} />
            </View>
          </>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}