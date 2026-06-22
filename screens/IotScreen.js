// screens/IotScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  StatusBar, StyleSheet, ActivityIndicator, Alert, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_BASE } from '../apiConfig';
import axios from 'axios';

const C = {
  gold: '#C9A84C', goldL: '#E8C96A', goldPale: '#F5E9C8', goldD: '#9A7A30',
  ink: '#0F0D0A', soft: '#2A2520', cream: '#FDFAF3', surf: '#F2EDE2',
  mute: '#8A7E70', line: '#E2D8C8',
  green: '#2D7A4F', greenBg: '#E8F5EE',
  red: '#C0392B',   redBg: '#FDECEA',
  blue: '#1A5FAB',  blueBg: '#EAF1FB',
  amber: '#B8620A', amberBg: '#FDF3E3',
};

const condicaoCfg = {
  otimo:   { label: 'Ótimo',   color: '#3A8A20' },
  bom:     { label: 'Bom',     color: C.blue    },
  regular: { label: 'Regular', color: C.amber   },
  ruim:    { label: 'Ruim',    color: C.red     },
};

export default function IotScreen() {
  const [ultimoScan, setUltimoScan] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Modals e listas
  const [instSemRfid, setInstSemRfid] = useState([]);
  const [alunos, setAlunos] = useState([]);
  
  // Estados para vínculo
  const [vinculoModal, setVinculoModal] = useState(false);
  const [buscaInst, setBuscaInst] = useState('');
  
  // Estados para empréstimo
  const [emprestimoModal, setEmprestimoModal] = useState(false);
  const [buscaAluno, setBuscaAluno] = useState('');
  
  // Estados de estatísticas
  const [stats, setStats] = useState({ total: 0, comRfid: 0, semRfid: 0 });

  // Referência para polling automático
  const timerRef = useRef(null);

  const carregarUltimoScan = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/instrumentos/api/iot/ultimo-scan/`);
      setUltimoScan(res.data);
    } catch (err) {
      console.log('Erro ao carregar último scan:', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const carregarEstatisticasEListas = async () => {
    try {
      
      // 1. Listar instrumentos ativos
      const instRes = await axios.get(`${API_BASE}/instrumentos/api/listar/`);
      if (Array.isArray(instRes.data)) {
        const total = instRes.data.length;
        const comRfid = instRes.data.filter(i => i.rfid && i.rfid.trim() !== '').length;
        setStats({
          total,
          comRfid,
          semRfid: total - comRfid
        });
      } else {
        console.log('Dados de instrumentos inválidos (não é array):', instRes.data);
      }

      // 2. Listar instrumentos sem RFID
      const semRfidRes = await axios.get(`${API_BASE}/instrumentos/api/iot/sem-rfid/`);
      if (Array.isArray(semRfidRes.data)) {
        setInstSemRfid(semRfidRes.data);
      } else {
        console.log('Dados de instrumentos sem RFID inválidos:', semRfidRes.data);
      }

      // 3. Listar alunos
      const alunosRes = await axios.get(`${API_BASE}/alunos/api/listar/`);
      if (Array.isArray(alunosRes.data)) {
        setAlunos(alunosRes.data);
      } else {
        console.log('Dados de alunos inválidos:', alunosRes.data);
      }

    } catch (err) {
      console.log('Erro ao carregar estatísticas/listas:', err);
    }
  };

  // Poll automático de 3 em 3 segundos para ler tags aproximadas no ESP32 físico
  useEffect(() => {
    carregarUltimoScan(true);
    carregarEstatisticasEListas();

    timerRef.current = setInterval(() => {
      carregarUltimoScan(false);
      carregarEstatisticasEListas();
    }, 3000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Simular leitura do ESP32 via software (POST na API)
  const simularLeituraESP32 = async () => {
    try {
      const tagsFalsas = ['04B8C1A2', '04A9E2F8', '04F5E6D7', '04C2D1F9', '0432F1A5'];
      const tagSorteada = tagsFalsas[Math.floor(Math.random() * tagsFalsas.length)];
      
      const res = await axios.post(`${API_BASE}/instrumentos/api/iot/scan/`, {
        rfid: tagSorteada
      });

      if (res.data.sucesso) {
        Alert.alert('Simulação ESP32', `Tag RFID/NFC '${tagSorteada}' escaneada pelo leitor simulado!`);
        carregarUltimoScan(true);
      }
    } catch (err) {
      Alert.alert('Erro na Simulação', 'Não foi possível conectar à API de simulação.');
    }
  };

  // Vincular tag lida ao instrumento
  const vincularTag = async (instrumentoId) => {
    if (!ultimoScan?.rfid) return;
    try {
      const res = await axios.post(`${API_BASE}/instrumentos/api/iot/vincular/`, {
        rfid: ultimoScan.rfid,
        instrumento_id: instrumentoId
      });

      if (res.data.sucesso) {
        Alert.alert('Sucesso', 'Etiqueta NFC vinculada com sucesso ao instrumento!');
        setVinculoModal(false);
        setBuscaInst('');
        carregarUltimoScan(true);
        carregarEstatisticasEListas();
      }
    } catch (err) {
      Alert.alert('Erro ao Vincular', err.response?.data?.erro || 'Erro na requisição.');
    }
  };

  // Desvincular tag lida
  const desvincularTag = async () => {
    if (!ultimoScan?.rfid) return;
    Alert.alert(
      'Desvincular Etiqueta',
      `Tem certeza que deseja remover esta etiqueta do instrumento '${ultimoScan.instrumento.nome}'? Ele não poderá mais ser escaneado no depósito.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await axios.post(`${API_BASE}/instrumentos/api/iot/desvincular/`, {
                rfid: ultimoScan.rfid
              });

              if (res.data.sucesso) {
                Alert.alert('Sucesso', 'Etiqueta desvinculada com sucesso!');
                carregarUltimoScan(true);
                carregarEstatisticasEListas();
              }
            } catch (err) {
              Alert.alert('Erro ao Desvincular', 'Ocorreu um erro no servidor.');
            }
          }
        }
      ]
    );
  };

  // Realizar Empréstimo Rápido
  const realizarEmprestimoRapido = async (alunoId) => {
    if (!ultimoScan?.rfid) return;
    try {
      const res = await axios.post(`${API_BASE}/instrumentos/api/retirada/`, {
        rfid: ultimoScan.rfid,
        aluno_id: alunoId
      });

      if (res.data.sucesso) {
        Alert.alert('Sucesso', 'Empréstimo registrado com sucesso!');
        setEmprestimoModal(false);
        setBuscaAluno('');
        carregarUltimoScan(true);
      }
    } catch (err) {
      Alert.alert('Erro no Empréstimo', err.response?.data?.erro || 'Erro na requisição.');
    }
  };

  // Realizar Devolução Rápida
  const realizarDevolucaoRapida = async () => {
    if (!ultimoScan?.rfid) return;
    try {
      const res = await axios.post(`${API_BASE}/instrumentos/api/devolucao/`, {
        rfid: ultimoScan.rfid
      });

      if (res.data.sucesso) {
        Alert.alert('Sucesso', 'Devolução registrada com sucesso!');
        carregarUltimoScan(true);
      }
    } catch (err) {
      Alert.alert('Erro na Devolução', err.response?.data?.erro || 'Erro na requisição.');
    }
  };

  // Filtragem local para os modais
  const instrumentosFiltrados = instSemRfid.filter(i =>
    i.nome.toLowerCase().includes(buscaInst.toLowerCase()) ||
    i.identificador.toLowerCase().includes(buscaInst.toLowerCase())
  );

  const alunosFiltrados = alunos.filter(a =>
    `${a.nome} ${a.sobrenome}`.toLowerCase().includes(buscaAluno.toLowerCase()) ||
    (a.matricula && a.matricula.toLowerCase().includes(buscaAluno.toLowerCase()))
  );

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: C.ink, justifyContent: 'center', alignItems: 'center' }}>
        <StatusBar barStyle="light-content" backgroundColor={C.ink} />
        <ActivityIndicator size="large" color={C.gold} />
      </SafeAreaView>
    );
  }

  const isTagNova = ultimoScan && ultimoScan.rfid && !ultimoScan.vinculado;
  const isTagVinculada = ultimoScan && ultimoScan.rfid && ultimoScan.vinculado;

  // Determinar se o ESP32 está conectado (se houve scan nos últimos 5 minutos)
  const isIotOnline = () => {
    if (!ultimoScan?.timestamp) return false;
    const diffMs = new Date() - new Date(ultimoScan.timestamp);
    return diffMs < 5 * 60 * 1000; // 5 minutos
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={C.ink} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerLabel}>ABANFAR BF</Text>
          <Text style={styles.headerTitle}>Painel IoT</Text>
          <Text style={styles.headerSub}>Controle de RFID/NFC — Gerente</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: isIotOnline() ? C.greenBg : C.redBg }]}>
          <View style={[styles.statusDot, { backgroundColor: isIotOnline() ? C.green : C.red }]} />
          <Text style={[styles.statusText, { color: isIotOnline() ? C.green : C.red }]}>
            {isIotOnline() ? 'Leitor Ativo' : 'Aguardando'}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Status Geral das Etiquetas */}
        <View style={styles.statsRow}>
          {[
            { n: stats.total,   l: 'Instrumentos', c: C.gold  },
            { n: stats.comRfid, l: 'Com Etiqueta', c: C.green },
            { n: stats.semRfid, l: 'Sem Etiqueta', c: C.red   },
          ].map(s => (
            <View key={s.l} style={styles.statCard}>
              <Text style={[styles.statN, { color: s.c }]}>{s.n}</Text>
              <Text style={styles.statL}>{s.l}</Text>
            </View>
          ))}
        </View>

        {/* Card Principal de Leitura */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Etiqueta Sob o Leitor</Text>
          <Text style={styles.sectionSub}>Aproxime a etiqueta NTAG215 do leitor físico</Text>
        </View>

        {!ultimoScan || !ultimoScan.rfid ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Nenhuma etiqueta aproximada recentemente.</Text>
            <Text style={styles.emptySub}>Aproxime uma etiqueta do leitor ESP32 ou use o simulador abaixo.</Text>
          </View>
        ) : (
          <View style={[
            styles.scanCard,
            isTagNova && { borderLeftColor: C.red },
            isTagVinculada && { borderLeftColor: C.green }
          ]}>
            <View style={styles.scanHeaderRow}>
              <Text style={styles.tagLabel}>UID DA ETIQUETA (NFC)</Text>
              <Text style={styles.timestampText}>
                Há {Math.round((new Date() - new Date(ultimoScan.timestamp)) / 1000)} seg
              </Text>
            </View>
            <Text style={styles.tagUid}>{ultimoScan.rfid}</Text>

            {/* TAG NOVA (PENDENTE DE VÍNCULO) */}
            {isTagNova && (
              <View style={styles.novaTagBox}>
                <View style={styles.alertHeader}>
                  <Text style={styles.alertTitle}>ETIQUETA NÃO VINCULADA</Text>
                  <Text style={styles.alertSub}>Esta etiqueta NTAG215 está em branco no sistema.</Text>
                </View>
                <TouchableOpacity style={styles.btnVincular} onPress={() => setVinculoModal(true)}>
                  <Text style={styles.btnVincularText}>Vincular a um Instrumento</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* TAG JÁ VINCULADA A UM INSTRUMENTO */}
            {isTagVinculada && (
              <View style={styles.vinculadoBox}>
                <View style={styles.instrumentoResumo}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.instIdentificador}>{ultimoScan.instrumento.identificador}</Text>
                    <Text style={styles.instNome}>{ultimoScan.instrumento.nome}</Text>
                    <Text style={styles.instNaipe}>Naipe: {ultimoScan.instrumento.naipe}</Text>
                  </View>
                  <View style={styles.instInfoRight}>
                    <Text style={[styles.instCondicao, { color: (condicaoCfg[ultimoScan.instrumento.condicao] || condicaoCfg.otimo).color }]}>
                      {(condicaoCfg[ultimoScan.instrumento.condicao] || condicaoCfg.otimo).label}
                    </Text>
                    <View style={[
                      styles.statusPill,
                      { backgroundColor: ultimoScan.instrumento.disponivel ? C.greenBg : C.blueBg }
                    ]}>
                      <Text style={[
                        styles.statusPillText,
                        { color: ultimoScan.instrumento.disponivel ? C.green : C.blue }
                      ]}>
                        {ultimoScan.instrumento.disponivel ? 'Disponível' : 'Emprestado'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Exibir para quem está emprestado */}
                {!ultimoScan.instrumento.disponivel && ultimoScan.instrumento.emprestado_para && (
                  <View style={styles.emprestadoParaBox}>
                    <Text style={styles.emprestadoLabel}>Em posse de:</Text>
                    <Text style={styles.emprestadoNome}>{ultimoScan.instrumento.emprestado_para}</Text>
                  </View>
                )}

                {/* AÇÕES DE MOVIMENTAÇÃO RÁPIDA */}
                <View style={styles.acoesContainer}>
                  {ultimoScan.instrumento.disponivel ? (
                    <TouchableOpacity style={styles.btnRetirada} onPress={() => setEmprestimoModal(true)}>
                      <Text style={styles.btnActionText}>Retirada Rápida</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity style={styles.btnDevolucao} onPress={realizarDevolucaoRapida}>
                      <Text style={styles.btnActionText}>Receber Devolução</Text>
                    </TouchableOpacity>
                  )}
                  
                  <TouchableOpacity style={styles.btnDesvincular} onPress={desvincularTag}>
                    <Text style={styles.btnDesvincularText}>Desvincular</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Lote de Etiquetas / Informações de Adesivos */}
        <View style={styles.loteBox}>
          <Text style={styles.loteTitle}>Estoque de Etiquetas Adesivas</Text>
          <Text style={styles.loteText}>
            Cole as etiquetas adesivas NTAG215 de 13.56MHz nos instrumentos novos. Depois, aproxime do leitor e clique em "Vincular" para registrar no estoque de instrumentos.
          </Text>
          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Etiquetas Vinculadas</Text>
              <Text style={styles.progressPercent}>
                {stats.total > 0 ? Math.round((stats.comRfid / stats.total) * 100) : 0}% ({stats.comRfid}/{stats.total})
              </Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[
                styles.progressBarFill,
                { width: `${stats.total > 0 ? (stats.comRfid / stats.total) * 100 : 0}%` }
              ]} />
            </View>
          </View>
        </View>

        {/* Ferramentas de Teste e Simulação */}
        <View style={styles.simuladorBox}>
          <Text style={styles.simuladorTitle}>Simulador de Hardware</Text>
          <Text style={styles.simuladorText}>
            Caso não esteja com o leitor ESP32 ligado na tomada agora, use o botão de simulação para gerar scans de teste diretamente na API.
          </Text>
          <TouchableOpacity style={styles.btnSimular} onPress={simularLeituraESP32}>
            <Text style={styles.btnSimularText}>Simular Scan do ESP32</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* MODAL DE VÍNCULO DE INSTRUMENTO */}
      <Modal visible={vinculoModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setVinculoModal(false)}>
        <SafeAreaView style={styles.modalContainer} edges={['top']}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Vincular ao Instrumento</Text>
            <TouchableOpacity style={styles.btnFecharModal} onPress={() => setVinculoModal(false)}>
              <Text style={styles.btnFecharText}>Voltar</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.modalBody}>
            <Text style={styles.modalHelp}>Selecione qual instrumento receberá a etiqueta '{ultimoScan?.rfid}'</Text>
            <TextInput
              style={styles.modalSearch}
              placeholder="Buscar instrumento por nome ou ID..."
              placeholderTextColor={C.mute}
              value={buscaInst}
              onChangeText={setBuscaInst}
            />
            <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
              {instrumentosFiltrados.length === 0 ? (
                <Text style={styles.noResultsText}>Nenhum instrumento sem tag encontrado.</Text>
              ) : (
                instrumentosFiltrados.map(i => (
                  <TouchableOpacity key={i.id} style={styles.selecaoCard} onPress={() => vincularTag(i.id)}>
                    <View>
                      <Text style={styles.selecaoIdentificador}>{i.identificador}</Text>
                      <Text style={styles.selecaoNome}>{i.nome}</Text>
                      <Text style={styles.selecaoNaipe}>{i.naipe}</Text>
                    </View>
                    <Text style={styles.selecaoAcao}>Selecionar →</Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>

      {/* MODAL DE SELEÇÃO DE ALUNO PARA EMPRÉSTIMO */}
      <Modal visible={emprestimoModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setEmprestimoModal(false)}>
        <SafeAreaView style={styles.modalContainer} edges={['top']}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Empréstimo Rápido</Text>
            <TouchableOpacity style={styles.btnFecharModal} onPress={() => setEmprestimoModal(false)}>
              <Text style={styles.btnFecharText}>Voltar</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.modalBody}>
            <Text style={styles.modalHelp}>Escolha o aluno que está retirando o instrumento '{ultimoScan?.instrumento?.nome}'</Text>
            <TextInput
              style={styles.modalSearch}
              placeholder="Buscar aluno por nome ou matrícula..."
              placeholderTextColor={C.mute}
              value={buscaAluno}
              onChangeText={setBuscaAluno}
            />
            <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
              {alunosFiltrados.length === 0 ? (
                <Text style={styles.noResultsText}>Nenhum aluno encontrado.</Text>
              ) : (
                alunosFiltrados.map(a => (
                  <TouchableOpacity key={a.id} style={styles.selecaoCard} onPress={() => realizarEmprestimoRapido(a.id)}>
                    <View>
                      <Text style={styles.selecaoNome}>{a.nome} {a.sobrenome}</Text>
                      <Text style={styles.selecaoNaipe}>Matrícula: {a.matricula || 'N/D'}</Text>
                    </View>
                    <Text style={styles.selecaoAcaoLink}>Emprestar →</Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.ink },
  header: {
    backgroundColor: C.ink,
    padding: 16,
    paddingTop: 12,
    borderBottomWidth: 2,
    borderBottomColor: C.gold,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLabel: { fontSize: 9, color: C.gold, letterSpacing: 2, fontWeight: '800', textTransform: 'uppercase', marginBottom: 2 },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#fff' },
  headerSub: { fontSize: 11, color: '#6A6058', marginTop: 2 },
  
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase' },

  scroll: { flex: 1, backgroundColor: C.surf },
  scrollContent: { padding: 16, paddingBottom: 60 },

  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  statCard: {
    flex: 1,
    backgroundColor: C.cream,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  statN: { fontSize: 20, fontWeight: '900' },
  statL: { fontSize: 9, color: C.mute, marginTop: 2, fontWeight: '700', textTransform: 'uppercase' },

  sectionHeader: { marginBottom: 12 },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: C.ink, textTransform: 'uppercase', letterSpacing: 0.8 },
  sectionSub: { fontSize: 11, color: C.mute, marginTop: 1 },

  emptyCard: {
    backgroundColor: C.cream,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyText: { fontSize: 13, fontWeight: '700', color: C.mute, textAlign: 'center' },
  emptySub: { fontSize: 11, color: C.mute, textAlign: 'center', marginTop: 6, lineHeight: 16 },

  scanCard: {
    backgroundColor: C.cream,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 14,
    padding: 16,
    borderLeftWidth: 5,
    borderLeftColor: C.gold,
    marginBottom: 20,
    elevation: 3,
  },
  scanHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  tagLabel: { fontSize: 9, color: C.mute, fontWeight: '800', letterSpacing: 0.8 },
  timestampText: { fontSize: 9, color: C.mute },
  tagUid: {
    fontFamily: 'monospace',
    fontSize: 22,
    fontWeight: 'bold',
    color: C.ink,
    letterSpacing: 2,
    textAlign: 'center',
    backgroundColor: C.surf,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.line,
    marginVertical: 8,
  },

  novaTagBox: {
    marginTop: 12,
    backgroundColor: C.redBg,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: C.red + '22',
  },
  alertHeader: { marginBottom: 10 },
  alertTitle: { fontSize: 11, fontWeight: '800', color: C.red, letterSpacing: 0.8 },
  alertSub: { fontSize: 11, color: C.red, marginTop: 2 },
  btnVincular: {
    backgroundColor: C.gold,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  btnVincularText: { fontSize: 13, fontWeight: '800', color: C.ink },

  vinculadoBox: { marginTop: 8 },
  instrumentoResumo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  instIdentificador: { fontSize: 9, color: C.gold, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },
  instNome: { fontSize: 16, fontWeight: '900', color: C.ink, marginTop: 1 },
  instNaipe: { fontSize: 11, color: C.mute, marginTop: 1 },
  instInfoRight: { alignItems: 'flex-end', gap: 4 },
  instCondicao: { fontSize: 11, fontWeight: '800' },
  statusPill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  statusPillText: { fontSize: 9, fontWeight: '800', textTransform: 'uppercase' },

  emprestadoParaBox: {
    backgroundColor: C.blueBg,
    borderRadius: 8,
    padding: 10,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: C.blue + '22',
  },
  emprestadoLabel: { fontSize: 9, color: C.blue, fontWeight: '800' },
  emprestadoNome: { fontSize: 13, fontWeight: '800', color: C.ink, marginTop: 1 },

  acoesContainer: { flexDirection: 'row', gap: 8, marginTop: 12 },
  btnRetirada: {
    flex: 2,
    backgroundColor: C.blue,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  btnDevolucao: {
    flex: 2,
    backgroundColor: C.green,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  btnActionText: { fontSize: 13, fontWeight: '800', color: '#fff' },
  btnDesvincular: {
    flex: 1,
    backgroundColor: C.surf,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  btnDesvincularText: { fontSize: 12, fontWeight: '700', color: C.red },

  loteBox: {
    backgroundColor: C.cream,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  loteTitle: { fontSize: 13, fontWeight: '800', color: C.ink, textTransform: 'uppercase', marginBottom: 4 },
  loteText: { fontSize: 11, color: C.mute, lineHeight: 16, marginBottom: 12 },
  progressContainer: { marginTop: 4 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  progressLabel: { fontSize: 10, color: C.mute, fontWeight: '600' },
  progressPercent: { fontSize: 10, color: C.ink, fontWeight: '800' },
  progressBarBg: { height: 6, backgroundColor: C.surf, borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: C.green, borderRadius: 3 },

  simuladorBox: {
    backgroundColor: C.cream,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 14,
    padding: 16,
    borderStyle: 'dashed',
    marginBottom: 30,
  },
  simuladorTitle: { fontSize: 13, fontWeight: '800', color: C.mute, textTransform: 'uppercase', marginBottom: 4 },
  simuladorText: { fontSize: 11, color: C.mute, lineHeight: 16, marginBottom: 12 },
  btnSimular: {
    backgroundColor: C.soft,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  btnSimularText: { fontSize: 13, fontWeight: '800', color: C.gold },

  /* MODAL */
  modalContainer: { flex: 1, backgroundColor: C.surf },
  modalHeader: {
    backgroundColor: C.ink,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: C.gold,
  },
  modalTitle: { fontSize: 16, fontWeight: '900', color: '#fff' },
  btnFecharModal: { backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  btnFecharText: { color: '#fff', fontSize: 12 },
  modalBody: { flex: 1, padding: 16 },
  modalHelp: { fontSize: 12, color: C.mute, marginBottom: 12, lineHeight: 16 },
  modalSearch: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 8,
    padding: 10,
    fontSize: 13,
    color: C.ink,
    marginBottom: 16,
  },
  noResultsText: { fontSize: 12, color: C.mute, textAlign: 'center', marginTop: 24 },
  
  selecaoCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  selecaoIdentificador: { fontSize: 9, color: C.gold, fontWeight: '800', textTransform: 'uppercase' },
  selecaoNome: { fontSize: 14, fontWeight: '800', color: C.ink, marginTop: 1 },
  selecaoNaipe: { fontSize: 11, color: C.mute, marginTop: 1 },
  selecaoAcao: { fontSize: 12, fontWeight: '700', color: C.goldD },
  selecaoAcaoLink: { fontSize: 12, fontWeight: '700', color: C.blue },
});
