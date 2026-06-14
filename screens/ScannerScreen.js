// screens/ScannerScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, Animated, Easing, Modal, StatusBar, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_BASE } from '../apiConfig';

const C = {
  gold: '#C9A84C', goldL: '#E8C96A', goldPale: '#F5E9C8', goldD: '#9A7A30',
  ink: '#0F0D0A', soft: '#2A2520', cream: '#FDFAF3', surf: '#F2EDE2',
  mute: '#8A7E70', line: '#E2D8C8',
  green: '#2D7A4F', greenBg: '#E8F5EE',
  red: '#C0392B',   redBg: '#FDECEA',
  blue: '#1A5FAB',  blueBg: '#EAF1FB',
  amber: '#B8620A', amberBg: '#FDF3E3',
};

const hoje = () => new Date().toLocaleDateString('pt-BR');
const hora  = () => new Date().toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' });

const Pill = ({ label, bg, color }) => (
  <View style={{ backgroundColor:bg, paddingHorizontal:10, paddingVertical:3, borderRadius:20, alignSelf:'flex-start' }}>
    <Text style={{ color, fontSize:11, fontWeight:'700', letterSpacing:0.4 }}>{label}</Text>
  </View>
);

const InfoRow = ({ label, value, valueColor }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={[styles.infoValue, valueColor && { color:valueColor }]}>{value}</Text>
  </View>
);

const SectionTitle = ({ text }) => (
  <View style={styles.sectionTitleWrap}>
    <View style={styles.sectionLine} />
    <Text style={styles.sectionTitleText}>{text}</Text>
    <View style={styles.sectionLine} />
  </View>
);

const RFIDWave = ({ active, onPress }) => {
  const rings = [useRef(new Animated.Value(0)).current,
                 useRef(new Animated.Value(0)).current,
                 useRef(new Animated.Value(0)).current];

  useEffect(() => {
    if (!active) return;
    const anims = rings.map((r, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 500),
          Animated.timing(r, { toValue:1, duration:1600, easing:Easing.out(Easing.ease), useNativeDriver:true }),
          Animated.timing(r, { toValue:0, duration:0, useNativeDriver:true }),
        ])
      )
    );
    anims.forEach(a => a.start());
    return () => anims.forEach(a => a.stop());
  }, [active]);

  return (
    <View style={styles.waveContainer}>
      {rings.map((r, i) => (
        <Animated.View key={i} style={[
          styles.waveRing,
          {
            opacity: r.interpolate({ inputRange:[0,0.3,1], outputRange:[0,0.6,0] }),
            transform:[{ scale: r.interpolate({ inputRange:[0,1], outputRange:[1,2.2] }) }],
          }
        ]} />
      ))}
      <TouchableOpacity style={styles.waveCore} onPress={onPress} activeOpacity={0.85}>
        <Text style={{ fontSize:12, fontWeight:'900', color:C.ink, letterSpacing:1 }}>RFID</Text>
      </TouchableOpacity>
    </View>
  );
};

export default function ScannerScreen() {
  const [phase,      setPhase]      = useState('idle');
  const [found,      setFound]      = useState(null);
  const [alunoSel,   setAlunoSel]   = useState(null);
  const [alunoModal, setAlunoModal] = useState(false);
  const [alunos,     setAlunos]     = useState([]);
  const [stats,      setStats]      = useState({ disponiveis:0, emprestados:0, vencidos:0 });
  const [historico,  setHistorico]  = useState([]);
  const timerRef = useRef(null);

  const carregarAlunos = async () => {
    try {
      const axios = require('axios').default;
      const res = await axios.get(`${API_BASE}/alunos/api/listar/`);
      setAlunos(res.data);
    } catch (err) {
      console.log('Erro ao buscar alunos:', err);
    }
  };

  const carregarStatsEHistorico = async () => {
    try {
      const axios = require('axios').default;
      const pRes = await axios.get(`${API_BASE}/instrumentos/api/painel/`);
      setStats({
        disponiveis: pRes.data.instrumentos.disponiveis,
        emprestados: pRes.data.instrumentos.emprestados,
        vencidos: pRes.data.emprestimos.vencidos
      });

      const hRes = await axios.get(`${API_BASE}/instrumentos/api/emprestimos/`);
      const mapped = hRes.data.map(h => ({
        id: h.id,
        nome: h.instrumento,
        ident: h.identificador,
        acao: h.devolvido ? 'devolucao' : 'retirada',
        quem: h.aluno,
        hora: h.devolvido ? (h.data_devolucao || hoje()) : h.data_emprestimo,
        rfid: h.rfid
      }));
      setHistorico(mapped.slice(0, 5));
    } catch (err) {
      console.log('Erro ao carregar estatísticas/histórico:', err);
    }
  };

  useEffect(() => {
    carregarAlunos();
    carregarStatsEHistorico();
  }, []);

  const tagsRFIDs = ['A1B2C3D4', 'E5F6G7H8', 'I9J0K1L2', 'M3N4O5P6', 'Y5Z6A7B8', 'C9D0E1F2', 'G3H4I5J6'];

  const simularLeitura = () => {
    setPhase('scanning'); setFound(null); setAlunoSel(null);
    timerRef.current = setTimeout(async () => {
      try {
        const randomRfid = tagsRFIDs[Math.floor(Math.random() * tagsRFIDs.length)];
        const axios = require('axios').default;
        const res = await axios.get(`${API_BASE}/instrumentos/api/buscar-rfid/${randomRfid}/`);
        setFound(res.data);
        setPhase(res.data.disponivel ? 'found_disponivel' : 'found_emprestado');
      } catch (err) {
        console.log('Erro ao ler RFID:', err);
        setPhase('idle');
        Alert.alert('Não encontrado', 'Tag RFID simulada não foi encontrada no banco.');
      }
    }, 2200);
  };

  const registrarRetirada = async () => {
    if (!alunoSel) return;
    try {
      const axios = require('axios').default;
      const res = await axios.post(`${API_BASE}/instrumentos/api/retirada/`, {
        rfid: found.rfid,
        aluno_id: alunoSel.id
      }, {
        headers: { 'Content-Type': 'application/json' }
      });

      if (res.data.sucesso) {
        setPhase('ok_retirada');
        carregarStatsEHistorico();
      } else {
        Alert.alert('Erro', res.data.erro || 'Erro ao registrar.');
      }
    } catch (err) {
      Alert.alert('Erro', err.response?.data?.erro || 'Erro ao conectar ao servidor.');
    }
  };

  const registrarDevolucao = async () => {
    try {
      const axios = require('axios').default;
      const res = await axios.post(`${API_BASE}/instrumentos/api/devolucao/`, {
        rfid: found.rfid
      }, {
        headers: { 'Content-Type': 'application/json' }
      });

      if (res.data.sucesso) {
        setPhase('ok_devolucao');
        carregarStatsEHistorico();
      } else {
        Alert.alert('Erro', res.data.erro || 'Erro ao registrar.');
      }
    } catch (err) {
      Alert.alert('Erro', err.response?.data?.erro || 'Erro ao conectar ao servidor.');
    }
  };

  const reset = () => { clearTimeout(timerRef.current); setPhase('idle'); setFound(null); setAlunoSel(null); };
  useEffect(() => () => clearTimeout(timerRef.current), []);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={C.ink} />

      <View style={styles.topbar}>
        <View>
          <Text style={styles.topbarLabel}>ABANFAR BF</Text>
          <Text style={styles.topbarTitle}>Scanner RFID</Text>
          <Text style={styles.topbarSub}>ESP32 + RC522 — Deposito</Text>
        </View>
        <View style={styles.iotBadge}>
          <View style={styles.dotGreen} />
          <Text style={styles.iotText}>Online</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {phase === 'idle' && (
          <>
            <View style={styles.infoBanner}>
              <Text style={styles.infoBannerTitle}>RFID - Como funciona</Text>
              <Text style={styles.infoBannerText}>
                O leitor ESP32+RC522 fica fixo na entrada do deposito. Quando um instrumento com tag RFID passa pelo leitor, o sistema registra automaticamente a{' '}
                <Text style={{ fontWeight:'800' }}>retirada ou devolucao</Text>
                {' '}com data, hora e aluno no banco de dados Django.
              </Text>
            </View>

            <View style={styles.scanBtnWrap}>
              <RFIDWave active={false} onPress={simularLeitura} />
            </View>
            <Text style={styles.scanTitle}>Iniciar Leitura</Text>
            <Text style={styles.scanSub}>Toque para simular o ESP32{'\n'}lendo a tag RFID do instrumento</Text>

            <View style={styles.statsRow}>
              {[
                { n:stats.disponiveis,  l:'Disponiveis', c:C.green, bg:C.greenBg },
                { n:stats.emprestados,  l:'Emprestados', c:C.blue,  bg:C.blueBg  },
                { n:stats.vencidos,     l:'Vencidos',   c:C.red,   bg:C.redBg   },
              ].map(s => (
                <View key={s.l} style={[styles.statCard, { backgroundColor:s.bg }]}>
                  <Text style={[styles.statN, { color:s.c }]}>{s.n}</Text>
                  <Text style={[styles.statL, { color:s.c }]}>{s.l}</Text>
                </View>
              ))}
            </View>

            <SectionTitle text="Movimentacoes Recentes" />
            {historico.length > 0 ? (
              historico.map(h => (
                <View key={h.id} style={styles.histItem}>
                  <View style={[styles.histIcon, { backgroundColor: h.acao==='retirada' ? C.blueBg : C.greenBg }]}>
                    <Text style={{ fontSize:16, color: h.acao==='retirada' ? C.blue : C.green }}>{h.acao==='retirada' ? '↗' : '↙'}</Text>
                  </View>
                  <View style={styles.histInfo}>
                    <Text style={styles.histNome}>{h.nome}</Text>
                    <Text style={styles.histSub}>{h.quem} · {h.hora}</Text>
                    <Text style={styles.histRfid}>{h.ident} · {h.rfid}</Text>
                  </View>
                  <Pill label={h.acao==='retirada' ? 'Saida' : 'Entrada'}
                    bg={h.acao==='retirada' ? C.blueBg : C.greenBg}
                    color={h.acao==='retirada' ? C.blue : C.green} />
                </View>
              ))
            ) : (
              <View style={{ alignItems:'center', padding:20 }}>
                <Text style={{ fontSize:12, color:C.mute }}>Nenhuma movimentação hoje.</Text>
              </View>
            )}
          </>
        )}

        {phase === 'scanning' && (
          <View style={styles.centerBlock}>
            <RFIDWave active={true} />
            <Text style={styles.phaseTitle}>Lendo tag RFID...</Text>
            <Text style={styles.phaseSub}>ESP32 emitindo campo eletromagnetico{'\n'}13.56 MHz · ISO/IEC 14443A</Text>
            <View style={styles.dotsRow}>
              {[0,1,2,3].map(i => <View key={i} style={styles.dot} />)}
            </View>
            <TouchableOpacity style={styles.btnOutline} onPress={reset}>
              <Text style={styles.btnOutlineText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        )}

        {phase === 'found_disponivel' && found && (
          <>
            <View style={styles.tagFound}>
              <Text style={{ fontSize:16, color:C.green }}>OK</Text>
              <View style={{ flex:1 }}>
                <Text style={[styles.tagFoundTitle, { color:C.green }]}>Tag lida pelo ESP32</Text>
                <Text style={[styles.tagFoundRfid, { color:C.green }]}>{found.rfid}</Text>
              </View>
            </View>
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={{ flex:1 }}>
                  <Text style={styles.cardIdent}>{found.identificador}</Text>
                  <Text style={styles.cardName}>{found.nome}</Text>
                  <Text style={styles.cardNaipe}>{found.naipe}</Text>
                </View>
                <Pill label="Disponivel" bg={C.greenBg} color={C.green} />
              </View>
              <Text style={styles.rfidMono}>RFID: {found.rfid}</Text>
            </View>
            <Text style={styles.fieldLabel}>Quem esta retirando?</Text>
            <TouchableOpacity style={[styles.selectBtn, alunoSel && { borderColor:C.gold }]} onPress={() => setAlunoModal(true)}>
              <Text style={[styles.selectBtnText, !alunoSel && { color:C.mute }]}>
                {alunoSel ? `${alunoSel.nome} — ${alunoSel.matricula}` : 'Selecione o aluno...'}
              </Text>
              <Text style={{ color:C.mute }}>v</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btnPrimary, !alunoSel && styles.btnDisabled]} onPress={() => alunoSel && setPhase('confirm_retirada')} disabled={!alunoSel}>
              <Text style={styles.btnPrimaryText}>Registrar Retirada</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnOutline} onPress={reset}>
              <Text style={styles.btnOutlineText}>Cancelar</Text>
            </TouchableOpacity>
          </>
        )}

        {phase === 'found_emprestado' && found && (
          <>
            <View style={[styles.tagFound, { backgroundColor:C.blueBg, borderColor:C.blue+'44' }]}>
              <Text style={{ fontSize:16, color:C.blue }}>RFID</Text>
              <View style={{ flex:1 }}>
                <Text style={[styles.tagFoundTitle, { color:C.blue }]}>Tag lida — instrumento emprestado</Text>
                <Text style={[styles.tagFoundRfid, { color:C.blue }]}>{found.rfid}</Text>
              </View>
            </View>
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={{ flex:1 }}>
                  <Text style={styles.cardIdent}>{found.identificador}</Text>
                  <Text style={styles.cardName}>{found.nome}</Text>
                  <Text style={styles.cardNaipe}>{found.naipe}</Text>
                </View>
                <Pill label="Emprestado" bg={C.blueBg} color={C.blue} />
              </View>
              {found.emprestado_para && (
                <View style={styles.alunoBox}>
                  <Text style={{ fontSize:16 }}>👤</Text>
                  <View>
                    <Text style={styles.alunoBoxLabel}>Em posse de</Text>
                    <Text style={styles.alunoBoxName}>{found.emprestado_para}</Text>
                  </View>
                </View>
              )}
            </View>
            <TouchableOpacity style={[styles.btnPrimary, { backgroundColor:C.green }]} onPress={() => setPhase('confirm_devolucao')}>
              <Text style={styles.btnPrimaryText}>Registrar Devolucao</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnOutline} onPress={reset}>
              <Text style={styles.btnOutlineText}>Cancelar</Text>
            </TouchableOpacity>
          </>
        )}

        {phase === 'confirm_retirada' && found && (
          <View style={styles.centerBlock}>
            <Text style={{ fontSize:48, marginBottom:16 }}>📖</Text>
            <Text style={styles.phaseTitle}>Confirmar Retirada?</Text>
            <View style={[styles.card, { width:'100%', marginTop:16 }]}>
              <InfoRow label="Instrumento" value={found.nome} />
              <InfoRow label="Identificador" value={found.identificador} />
              <InfoRow label="Aluno" value={alunoSel?.nome || '—'} valueColor={C.gold} />
              <InfoRow label="Data/Hora" value={`${hoje()} ${hora()}`} />
            </View>
            <View style={styles.modelNote}>
              <Text style={styles.modelNoteText}>devolvido = False{'\n'}InstrumentoEmprestimo criado</Text>
            </View>
            <TouchableOpacity style={styles.btnPrimary} onPress={registrarRetirada}>
              <Text style={styles.btnPrimaryText}>Confirmar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnOutline} onPress={() => setPhase('found_disponivel')}>
              <Text style={styles.btnOutlineText}>Voltar</Text>
            </TouchableOpacity>
          </View>
        )}

        {phase === 'confirm_devolucao' && found && (
          <View style={styles.centerBlock}>
            <Text style={{ fontSize:48, marginBottom:16 }}>↩</Text>
            <Text style={styles.phaseTitle}>Confirmar Devolucao?</Text>
            <View style={[styles.card, { width:'100%', marginTop:16 }]}>
              <InfoRow label="Instrumento" value={found.nome} />
              <InfoRow label="Identificador" value={found.identificador} />
              <InfoRow label="Devolvido por" value={found.emprestado_para || '—'} valueColor={C.green} />
              <InfoRow label="Data/Hora" value={`${hoje()} ${hora()}`} />
            </View>
            <View style={styles.modelNote}>
              <Text style={styles.modelNoteText}>devolvido = True{'\n'}data_devolucao = {hoje()}</Text>
            </View>
            <TouchableOpacity style={[styles.btnPrimary, { backgroundColor:C.green }]} onPress={registrarDevolucao}>
              <Text style={styles.btnPrimaryText}>Confirmar Devolucao</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnOutline} onPress={() => setPhase('found_emprestado')}>
              <Text style={styles.btnOutlineText}>Voltar</Text>
            </TouchableOpacity>
          </View>
        )}

        {phase === 'ok_retirada' && (
          <View style={styles.centerBlock}>
            <View style={[styles.okCircle, { borderColor:C.gold, backgroundColor:C.goldPale }]}>
              <Text style={{ fontSize:28 }}>OK</Text>
            </View>
            <Text style={styles.phaseTitle}>Retirada registrada!</Text>
            <Text style={styles.phaseSub}>{found?.nome}</Text>
            <Text style={[styles.phaseSub, { color:C.ink, fontWeight:'700' }]}>Aluno: {alunoSel?.nome}</Text>
            <Text style={[styles.modelNoteText, { color:C.green, marginTop:8, marginBottom:20 }]}>
              devolvido=False · data={hoje()}
            </Text>
            <TouchableOpacity style={styles.btnPrimary} onPress={simularLeitura}>
              <Text style={styles.btnPrimaryText}>Nova leitura</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnOutline} onPress={reset}>
              <Text style={styles.btnOutlineText}>Voltar ao inicio</Text>
            </TouchableOpacity>
          </View>
        )}

        {phase === 'ok_devolucao' && (
          <View style={styles.centerBlock}>
            <View style={[styles.okCircle, { borderColor:C.green, backgroundColor:C.greenBg }]}>
              <Text style={{ fontSize:28 }}>OK</Text>
            </View>
            <Text style={styles.phaseTitle}>Devolucao registrada!</Text>
            <Text style={styles.phaseSub}>{found?.nome}</Text>
            <Text style={[styles.modelNoteText, { color:C.green, marginTop:8, marginBottom:20 }]}>
              devolvido=True{'\n'}data_devolucao={hoje()}
            </Text>
            <TouchableOpacity style={styles.btnPrimary} onPress={simularLeitura}>
              <Text style={styles.btnPrimaryText}>Nova leitura</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnOutline} onPress={reset}>
              <Text style={styles.btnOutlineText}>Voltar ao inicio</Text>
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>

      <Modal visible={alunoModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Selecionar Aluno</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {alunos.map(a => (
                <TouchableOpacity key={a.id} style={[styles.alunoOption, alunoSel?.id===a.id && styles.alunoOptionActive]}
                  onPress={() => { setAlunoSel(a); setAlunoModal(false); }}>
                  <View style={styles.alunoAvatar}>
                    <Text style={styles.alunoAvatarText}>{a.nome[0]}</Text>
                  </View>
                  <View>
                    <Text style={styles.alunoOptionName}>{a.nome}</Text>
                    <Text style={styles.alunoOptionMat}>Matricula: {a.matricula}</Text>
                  </View>
                  {alunoSel?.id===a.id && <Text style={{ marginLeft:'auto', color:C.gold, fontSize:18 }}>✓</Text>}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.modalClose} onPress={() => setAlunoModal(false)}>
              <Text style={styles.modalCloseText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:            { flex:1, backgroundColor:C.ink },
  scroll:          { flex:1, backgroundColor:C.surf },
  scrollContent:   { padding:16, paddingBottom:100 },
  topbar:          { backgroundColor:C.ink, padding:16, paddingTop:12, borderBottomWidth:2, borderBottomColor:C.gold, flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start' },
  topbarLabel:     { fontSize:9, color:C.gold, letterSpacing:2, fontWeight:'800', textTransform:'uppercase', marginBottom:2 },
  topbarTitle:     { fontSize:18, fontWeight:'900', color:'#fff' },
  topbarSub:       { fontSize:11, color:'#6A6058', marginTop:2 },
  iotBadge:        { flexDirection:'row', alignItems:'center', gap:5, backgroundColor:'rgba(45,122,79,.2)', paddingHorizontal:10, paddingVertical:5, borderRadius:8 },
  dotGreen:        { width:7, height:7, borderRadius:4, backgroundColor:C.green },
  iotText:         { fontSize:11, color:C.green, fontWeight:'700' },
  infoBanner:      { backgroundColor:C.goldPale, borderWidth:1, borderColor:C.gold+'44', borderRadius:12, padding:14, marginBottom:16 },
  infoBannerTitle: { fontSize:12, fontWeight:'800', color:C.goldD, marginBottom:6 },
  infoBannerText:  { fontSize:12, color:C.goldD, lineHeight:18 },
  scanBtnWrap:     { alignItems:'center', marginTop:24, marginBottom:8 },
  waveContainer:   { width:120, height:120, alignItems:'center', justifyContent:'center' },
  waveRing:        { position:'absolute', width:80, height:80, borderRadius:40, borderWidth:2, borderColor:C.gold },
  waveCore:        { width:70, height:70, borderRadius:35, backgroundColor:C.gold, alignItems:'center', justifyContent:'center', shadowColor:C.gold, shadowOffset:{width:0,height:0}, shadowOpacity:0.5, shadowRadius:12, elevation:8 },
  scanBtn:         { position:'absolute', width:70, height:70, borderRadius:35, backgroundColor:C.gold, alignItems:'center', justifyContent:'center' },
  scanBtnIcon:     { fontSize:14, fontWeight:'900', color:C.ink },
  scanTitle:       { fontSize:18, fontWeight:'900', color:C.ink, textAlign:'center', marginTop:12 },
  scanSub:         { fontSize:12, color:C.mute, textAlign:'center', lineHeight:18, marginTop:4, marginBottom:20 },
  statsRow:        { flexDirection:'row', gap:8, marginBottom:20 },
  statCard:        { flex:1, borderRadius:12, padding:12, alignItems:'center' },
  statN:           { fontSize:22, fontWeight:'900', lineHeight:26 },
  statL:           { fontSize:10, fontWeight:'600', marginTop:2 },
  sectionTitleWrap:{ flexDirection:'row', alignItems:'center', gap:8, marginBottom:10 },
  sectionLine:     { flex:1, height:1, backgroundColor:C.line },
  sectionTitleText:{ fontSize:10, color:C.mute, fontWeight:'700', letterSpacing:1.2, textTransform:'uppercase' },
  histItem:        { flexDirection:'row', alignItems:'center', gap:10, paddingVertical:10, borderBottomWidth:1, borderBottomColor:C.line },
  histIcon:        { width:36, height:36, borderRadius:18, alignItems:'center', justifyContent:'center' },
  histInfo:        { flex:1 },
  histNome:        { fontSize:13, fontWeight:'700', color:C.ink },
  histSub:         { fontSize:11, color:C.mute, marginTop:1 },
  histRfid:        { fontSize:10, color:C.mute, fontFamily:'monospace', marginTop:1 },
  centerBlock:     { alignItems:'center', paddingTop:24 },
  phaseTitle:      { fontSize:18, fontWeight:'900', color:C.ink, textAlign:'center', marginTop:12 },
  phaseSub:        { fontSize:12, color:C.mute, textAlign:'center', lineHeight:18, marginTop:6 },
  dotsRow:         { flexDirection:'row', gap:6, marginTop:16, marginBottom:20 },
  dot:             { width:8, height:8, borderRadius:4, backgroundColor:C.gold, opacity:0.4 },
  tagFound:        { flexDirection:'row', alignItems:'center', gap:10, backgroundColor:C.greenBg, borderWidth:1, borderColor:C.green+'44', borderRadius:12, padding:12, marginBottom:14 },
  tagFoundTitle:   { fontSize:11, fontWeight:'700', textTransform:'uppercase', letterSpacing:0.6 },
  tagFoundRfid:    { fontSize:11, fontFamily:'monospace', marginTop:2 },
  card:            { backgroundColor:C.cream, borderWidth:1, borderColor:C.line, borderRadius:14, padding:14, marginBottom:12 },
  cardHeader:      { flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 },
  cardIdent:       { fontSize:10, color:C.gold, fontWeight:'700', letterSpacing:1, textTransform:'uppercase', marginBottom:3 },
  cardName:        { fontSize:16, fontWeight:'900', color:C.ink, lineHeight:20 },
  cardNaipe:       { fontSize:11, color:C.mute, marginTop:2 },
  rfidMono:        { fontSize:11, color:C.mute, fontFamily:'monospace' },
  alunoBox:        { flexDirection:'row', alignItems:'center', gap:10, backgroundColor:C.blueBg, borderRadius:10, padding:10, marginTop:8 },
  alunoBoxLabel:   { fontSize:10, color:C.blue, fontWeight:'700', textTransform:'uppercase' },
  alunoBoxName:    { fontSize:14, fontWeight:'800', color:C.ink },
  fieldLabel:      { fontSize:11, color:C.mute, fontWeight:'700', textTransform:'uppercase', letterSpacing:0.8, marginBottom:6 },
  selectBtn:       { backgroundColor:C.cream, borderWidth:1.5, borderColor:C.line, borderRadius:12, padding:13, flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:12 },
  selectBtnText:   { fontSize:14, color:C.ink },
  btnPrimary:      { backgroundColor:C.gold, borderRadius:12, padding:14, alignItems:'center', marginBottom:8, width:'100%' },
  btnPrimaryText:  { fontSize:14, fontWeight:'800', color:C.ink, letterSpacing:0.3 },
  btnDisabled:     { backgroundColor:C.line },
  btnOutline:      { borderWidth:1, borderColor:C.line, borderRadius:12, padding:12, alignItems:'center', marginBottom:8, width:'100%' },
  btnOutlineText:  { fontSize:13, color:C.mute, fontWeight:'600' },
  infoRow:         { flexDirection:'row', justifyContent:'space-between', paddingVertical:8, borderBottomWidth:1, borderBottomColor:C.line },
  infoLabel:       { fontSize:13, color:C.mute },
  infoValue:       { fontSize:13, fontWeight:'700', color:C.ink, textAlign:'right', flex:1, marginLeft:8 },
  modelNote:       { backgroundColor:C.surf, borderRadius:10, padding:12, marginTop:10, marginBottom:16, width:'100%' },
  modelNoteText:   { fontSize:12, color:C.mute, lineHeight:18 },
  okCircle:        { width:70, height:70, borderRadius:35, borderWidth:2, alignItems:'center', justifyContent:'center', marginBottom:12 },
  modalOverlay:    { flex:1, backgroundColor:'rgba(0,0,0,.5)', justifyContent:'flex-end' },
  modalSheet:      { backgroundColor:C.cream, borderTopLeftRadius:20, borderTopRightRadius:20, padding:20, maxHeight:'70%' },
  modalHandle:     { width:40, height:4, backgroundColor:C.line, borderRadius:2, alignSelf:'center', marginBottom:16 },
  modalTitle:      { fontSize:16, fontWeight:'900', color:C.ink, marginBottom:16 },
  modalClose:      { backgroundColor:C.surf, borderRadius:12, padding:13, alignItems:'center', marginTop:12 },
  modalCloseText:  { fontSize:14, color:C.mute, fontWeight:'600' },
  alunoOption:     { flexDirection:'row', alignItems:'center', gap:12, padding:12, borderRadius:12, marginBottom:6, backgroundColor:C.surf },
  alunoOptionActive:{ backgroundColor:C.goldPale, borderWidth:1, borderColor:C.gold+'44' },
  alunoOptionName: { fontSize:14, fontWeight:'700', color:C.ink },
  alunoOptionMat:  { fontSize:11, color:C.mute, marginTop:1 },
  alunoAvatar:     { width:38, height:38, borderRadius:19, backgroundColor:C.goldPale, borderWidth:1.5, borderColor:C.gold, alignItems:'center', justifyContent:'center' },
  alunoAvatarText: { fontSize:15, fontWeight:'900', color:C.goldD },
});