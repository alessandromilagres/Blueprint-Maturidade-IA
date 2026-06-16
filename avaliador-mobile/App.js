import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api';
const TOKEN_KEY = 'blueprint_mobile_token';
const USER_KEY = 'blueprint_mobile_usuario';
const SCORE_OPTIONS = [1, 2, 3, 4, 5];

function isPendente(avaliacao) {
  return String(avaliacao?.status || '').toLowerCase() !== 'finalizada';
}

function statusLabel(status) {
  return String(status || 'pendente').toLowerCase() === 'finalizada' ? 'Concluida' : 'Pendente';
}

function parseJsonArray(value) {
  if (!value) return [];
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function respostasToMap(respostas = []) {
  return respostas.reduce((acc, resposta) => {
    acc[resposta.id] = {
      id: resposta.id,
      pontuacao: resposta.pontuacao,
      semInformacao: resposta.semInformacao === true,
      observacoes: resposta.observacoes || ''
    };
    return acc;
  }, {});
}

function produtoRespostasToMap(respostas = []) {
  return respostas.reduce((acc, resposta) => {
    acc[resposta.id] = {
      id: resposta.id,
      pontuacao: resposta.pontuacao,
      observacoes: resposta.observacoes || ''
    };
    return acc;
  }, {});
}

function confirmAsync(title, message) {
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
      { text: 'Continuar', style: 'default', onPress: () => resolve(true) }
    ]);
  });
}

async function readJson(response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Resposta invalida do servidor (HTTP ${response.status}).`);
  }
}

function makeApi({ token, onUnauthorized }) {
  async function request(endpoint, options = {}) {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {})
      }
    });

    const data = await readJson(response);

    if (response.status === 401) {
      onUnauthorized?.();
      throw new Error('Sessao expirada. Faça login novamente.');
    }

    if (!response.ok) {
      throw new Error(data?.error || data?.message || `Erro HTTP ${response.status}`);
    }

    return data;
  }

  return {
    login: (email, senha) =>
      request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, senha })
      }),
    me: () => request('/auth/me'),
    listarAvaliacoes: () => request('/avaliacoes'),
    listarAvaliacoesProduto: () => request('/avaliacoes-produto'),
    listarAreas: () => request('/areas'),
    buscarAvaliacao: (id) => request(`/avaliacoes/${id}`),
    salvarAvaliacao: (id, respostas, areasRecusadas) =>
      request(`/avaliacoes/${id}/respostas`, {
        method: 'PUT',
        body: JSON.stringify({ respostas, areasRecusadas: areasRecusadas || [] })
      }),
    finalizarAvaliacao: (id) =>
      request(`/avaliacoes/${id}/finalizar`, {
        method: 'PUT',
        body: JSON.stringify({})
      }),
    buscarAvaliacaoProduto: (id) => request(`/avaliacoes-produto/${id}`),
    salvarAvaliacaoProduto: (id, respostasObrigatorias, respostasVerticais) =>
      request(`/avaliacoes-produto/${id}/respostas`, {
        method: 'PUT',
        body: JSON.stringify({ respostasObrigatorias, respostasVerticais })
      }),
    finalizarAvaliacaoProduto: (id) =>
      request(`/avaliacoes-produto/${id}/finalizar`, { method: 'PUT' })
  };
}

export default function App() {
  const [token, setToken] = useState(null);
  const [usuario, setUsuario] = useState(null);
  const [booting, setBooting] = useState(true);
  const [route, setRoute] = useState({ name: 'home' });

  const logout = async () => {
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
    setToken(null);
    setUsuario(null);
    setRoute({ name: 'home' });
  };

  const api = useMemo(() => makeApi({ token, onUnauthorized: logout }), [token]);

  useEffect(() => {
    async function boot() {
      try {
        const [[, savedToken], [, savedUser]] = await AsyncStorage.multiGet([TOKEN_KEY, USER_KEY]);
        if (savedToken) {
          setToken(savedToken);
          if (savedUser) setUsuario(JSON.parse(savedUser));
        }
      } catch {
        await logout();
      } finally {
        setBooting(false);
      }
    }
    boot();
  }, []);

  async function handleLogin(email, senha) {
    const data = await makeApi({ token: null }).login(email, senha);
    await AsyncStorage.multiSet([
      [TOKEN_KEY, data.token],
      [USER_KEY, JSON.stringify(data.usuario)]
    ]);
    setToken(data.token);
    setUsuario(data.usuario);
  }

  if (booting) {
    return <FullScreenLoader message="Abrindo Blueprint IA..." />;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      {!token ? (
        <LoginScreen onLogin={handleLogin} />
      ) : route.name === 'project' ? (
        <ProjectAssessmentScreen
          api={api}
          id={route.id}
          onBack={() => setRoute({ name: 'home' })}
          onCompleted={() => setRoute({ name: 'completed' })}
        />
      ) : route.name === 'product' ? (
        <ProductAssessmentScreen
          api={api}
          id={route.id}
          onBack={() => setRoute({ name: 'home' })}
          onCompleted={() => setRoute({ name: 'completed' })}
        />
      ) : route.name === 'completed' ? (
        <CompletedScreen onHome={() => setRoute({ name: 'home' })} />
      ) : (
        <HomeScreen
          api={api}
          usuario={usuario}
          onLogout={logout}
          onOpen={(item) => setRoute({ name: item.tipo, id: item.avaliacaoId })}
        />
      )}
    </SafeAreaView>
  );
}

function FullScreenLoader({ message }) {
  return (
    <View style={styles.centered}>
      <ActivityIndicator size="large" color="#93c5fd" />
      <Text style={styles.centeredText}>{message}</Text>
    </View>
  );
}

function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    setError('');
    setLoading(true);
    try {
      await onLogin(email.trim(), senha);
    } catch (err) {
      setError(err.message || 'Nao foi possivel fazer login.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.screen}>
      <View style={styles.loginCard}>
        <Text style={styles.brand}>Blueprint IA</Text>
        <Text style={styles.title}>App do Avaliador</Text>
        <Text style={styles.subtitle}>Entre para responder suas avaliacoes pendentes pelo celular.</Text>

        {error ? <Text style={styles.errorBox}>{error}</Text> : null}

        <Text style={styles.label}>Email</Text>
        <TextInput
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          placeholder="seu@email.com"
          placeholderTextColor="#94a3b8"
          style={styles.input}
        />

        <Text style={styles.label}>Senha</Text>
        <TextInput
          secureTextEntry
          value={senha}
          onChangeText={setSenha}
          placeholder="Sua senha"
          placeholderTextColor="#94a3b8"
          style={styles.input}
        />

        <PrimaryButton disabled={loading || !email || !senha} onPress={submit}>
          {loading ? 'Entrando...' : 'Entrar'}
        </PrimaryButton>
      </View>
    </KeyboardAvoidingView>
  );
}

function HomeScreen({ api, usuario, onLogout, onOpen }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [items, setItems] = useState([]);

  async function load() {
    setError('');
    const [avaliacoes, avaliacoesProduto] = await Promise.all([
      api.listarAvaliacoes(),
      api.listarAvaliacoesProduto()
    ]);

    const normalized = [
      ...(Array.isArray(avaliacoes)
        ? avaliacoes.map((avaliacao) => ({
            key: `project-${avaliacao.id}`,
            tipo: 'project',
            avaliacaoId: avaliacao.id,
            titulo: avaliacao.projeto?.nome || 'Assessment de maturidade',
            subtitulo: avaliacao.projeto?.empresa?.nome || 'Projeto',
            status: avaliacao.status,
            updatedAt: avaliacao.updatedAt || avaliacao.createdAt
          }))
        : []),
      ...(Array.isArray(avaliacoesProduto)
        ? avaliacoesProduto.map((avaliacao) => ({
            key: `product-${avaliacao.id}`,
            tipo: 'product',
            avaliacaoId: avaliacao.id,
            titulo: avaliacao.produto?.nome || 'Avaliacao de produto',
            subtitulo: avaliacao.produto?.projeto?.nome || 'Produto IA-First',
            status: avaliacao.status,
            updatedAt: avaliacao.updatedAt || avaliacao.createdAt
          }))
        : [])
    ].sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));

    setItems(normalized);
  }

  useEffect(() => {
    load()
      .catch((err) => setError(err.message || 'Nao foi possivel carregar suas avaliacoes.'))
      .finally(() => setLoading(false));
  }, []);

  async function refresh() {
    setRefreshing(true);
    try {
      await load();
    } catch (err) {
      setError(err.message || 'Nao foi possivel atualizar.');
    } finally {
      setRefreshing(false);
    }
  }

  const pendentes = items.filter(isPendente);
  const concluidas = items.filter((item) => !isPendente(item));

  if (loading) return <FullScreenLoader message="Localizando suas avaliacoes..." />;

  return (
    <ScrollView
      style={styles.screen}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.headerKicker}>Blueprint IA</Text>
          <Text style={styles.headerTitle}>Ola, {usuario?.nome || 'Avaliador'}</Text>
          <Text style={styles.headerSubtitle}>Escolha uma avaliacao para continuar.</Text>
        </View>
        <Pressable onPress={onLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Sair</Text>
        </Pressable>
      </View>

      {error ? <Text style={styles.errorBox}>{error}</Text> : null}

      <SectionTitle title="Pendentes" count={pendentes.length} />
      {pendentes.length === 0 ? (
        <EmptyState text="Nenhuma avaliacao pendente no momento." />
      ) : (
        pendentes.map((item) => <AssessmentCard key={item.key} item={item} onPress={() => onOpen(item)} />)
      )}

      {concluidas.length > 0 ? (
        <>
          <SectionTitle title="Concluidas" count={concluidas.length} />
          {concluidas.map((item) => <AssessmentCard key={item.key} item={item} />)}
        </>
      ) : null}
    </ScrollView>
  );
}

function ProjectAssessmentScreen({ api, id, onBack, onCompleted }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [avaliacao, setAvaliacao] = useState(null);
  const [areas, setAreas] = useState([]);
  const [currentAreaIndex, setCurrentAreaIndex] = useState(0);
  const [respostas, setRespostas] = useState({});
  const [areasRecusadas, setAreasRecusadas] = useState([]);
  const [lastSavedAt, setLastSavedAt] = useState(null);

  async function load() {
    const [avaliacaoData, areasData] = await Promise.all([api.buscarAvaliacao(id), api.listarAreas()]);
    const selected = parseJsonArray(avaliacaoData.areasSelecionadas);
    const selectedIds = selected.length ? selected.map((x) => Number(x)) : areasData.map((area) => area.id);
    setAvaliacao(avaliacaoData);
    setAreas(areasData.filter((area) => selectedIds.includes(area.id)));
    setAreasRecusadas(parseJsonArray(avaliacaoData.areasRecusadas).map((x) => Number(x)));
    setRespostas(respostasToMap(avaliacaoData.respostas));
  }

  useEffect(() => {
    load()
      .catch((err) => setError(err.message || 'Nao foi possivel abrir a avaliacao.'))
      .finally(() => setLoading(false));
  }, [id]);

  const currentArea = areas[currentAreaIndex];
  const progresso = useMemo(() => {
    let total = 0;
    let respondidas = 0;
    areas.forEach((area) => {
      if (areasRecusadas.includes(area.id)) return;
      (area.perguntas || []).forEach((pergunta) => {
        total += 1;
        const resposta = avaliacao?.respostas?.find((r) => r.perguntaId === pergunta.id);
        const atual = resposta ? respostas[resposta.id] : null;
        if (atual && (atual.semInformacao || atual.pontuacao != null)) respondidas += 1;
      });
    });
    return { total, respondidas, percentual: total ? Math.round((respondidas / total) * 100) : 0 };
  }, [areas, areasRecusadas, respostas, avaliacao]);

  async function save(showAlert = true) {
    setSaving(true);
    try {
      const atualizada = await api.salvarAvaliacao(id, Object.values(respostas), areasRecusadas);
      setAvaliacao((prev) => ({ ...prev, ...atualizada }));
      if (Array.isArray(atualizada.respostas)) setRespostas(respostasToMap(atualizada.respostas));
      setLastSavedAt(new Date());
      if (showAlert) Alert.alert('Progresso salvo', 'Suas respostas foram registradas.');
    } finally {
      setSaving(false);
    }
  }

  async function finalizar() {
    const message =
      progresso.respondidas < progresso.total
        ? `Voce respondeu ou justificou ${progresso.respondidas} de ${progresso.total} perguntas. Deseja finalizar mesmo assim?`
        : 'Depois de finalizar, nao sera possivel alterar as respostas. Deseja continuar?';
    const ok = await confirmAsync('Finalizar avaliacao', message);
    if (!ok) return;

    setSaving(true);
    try {
      await api.salvarAvaliacao(id, Object.values(respostas), areasRecusadas);
      await api.finalizarAvaliacao(id);
      onCompleted();
    } catch (err) {
      Alert.alert('Erro ao finalizar', err.message || 'Tente novamente.');
    } finally {
      setSaving(false);
    }
  }

  function updateResposta(respostaId, patch) {
    setRespostas((prev) => ({
      ...prev,
      [respostaId]: { ...prev[respostaId], ...patch }
    }));
  }

  function toggleAreaRecusada(areaId) {
    setAreasRecusadas((prev) =>
      prev.includes(areaId) ? prev.filter((idArea) => idArea !== areaId) : [...prev, areaId]
    );
  }

  if (loading) return <FullScreenLoader message="Abrindo avaliacao..." />;
  if (error) return <ErrorScreen message={error} onBack={onBack} />;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <TopBar title="Assessment de Maturidade" subtitle={avaliacao?.projeto?.nome} onBack={onBack} />
      <ProgressCard progresso={progresso} lastSavedAt={lastSavedAt} />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabs}>
        {areas.map((area, index) => (
          <Pressable
            key={area.id}
            onPress={() => setCurrentAreaIndex(index)}
            style={[styles.tab, index === currentAreaIndex && styles.tabActive]}
          >
            <Text style={[styles.tabText, index === currentAreaIndex && styles.tabTextActive]}>{area.nome}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {currentArea ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{currentArea.nome}</Text>
          {currentArea.descricao ? <Text style={styles.muted}>{currentArea.descricao}</Text> : null}
          <CheckRow
            checked={areasRecusadas.includes(currentArea.id)}
            label="Nao estou apto(a) a responder este grupo de perguntas."
            onPress={() => toggleAreaRecusada(currentArea.id)}
          />
        </View>
      ) : null}

      {currentArea?.perguntas?.map((pergunta) => {
        const resposta = avaliacao?.respostas?.find((r) => r.perguntaId === pergunta.id);
        if (!resposta) return null;
        const atual = respostas[resposta.id] || {};
        const disabled = areasRecusadas.includes(currentArea.id);

        return (
          <QuestionCard key={pergunta.id} disabled={disabled}>
            <Text style={styles.questionNumber}>Pergunta {pergunta.numero}</Text>
            <Text style={styles.questionText}>{pergunta.texto}</Text>
            {pergunta.criterios ? <Text style={styles.criteria}>{pergunta.criterios}</Text> : null}
            <ScorePicker
              value={atual.pontuacao}
              disabled={disabled || atual.semInformacao}
              onChange={(pontuacao) => updateResposta(resposta.id, { pontuacao, semInformacao: false })}
            />
            <CheckRow
              checked={atual.semInformacao === true}
              label="Nao tenho informacao suficiente para responder."
              onPress={() =>
                updateResposta(resposta.id, {
                  semInformacao: !atual.semInformacao,
                  pontuacao: !atual.semInformacao ? null : atual.pontuacao
                })
              }
            />
            <TextInput
              multiline
              value={atual.observacoes || ''}
              onChangeText={(observacoes) => updateResposta(resposta.id, { observacoes })}
              placeholder="Observacoes ou evidencias..."
              placeholderTextColor="#94a3b8"
              style={styles.textarea}
              editable={!disabled}
            />
          </QuestionCard>
        );
      })}

      <FooterActions
        saving={saving}
        canPrev={currentAreaIndex > 0}
        canNext={currentAreaIndex < areas.length - 1}
        onPrev={() => setCurrentAreaIndex((index) => Math.max(0, index - 1))}
        onNext={() => setCurrentAreaIndex((index) => Math.min(areas.length - 1, index + 1))}
        onSave={() => save(true).catch((err) => Alert.alert('Erro ao salvar', err.message))}
        onFinish={finalizar}
      />
    </ScrollView>
  );
}

function ProductAssessmentScreen({ api, id, onBack, onCompleted }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [avaliacao, setAvaliacao] = useState(null);
  const [respostasObrigatorias, setRespostasObrigatorias] = useState({});
  const [respostasVerticais, setRespostasVerticais] = useState({});
  const [lastSavedAt, setLastSavedAt] = useState(null);

  async function load() {
    const data = await api.buscarAvaliacaoProduto(id);
    setAvaliacao(data);
    setRespostasObrigatorias(produtoRespostasToMap(data.respostasObrigatorias));
    setRespostasVerticais(produtoRespostasToMap(data.respostasVerticais));
  }

  useEffect(() => {
    load()
      .catch((err) => setError(err.message || 'Nao foi possivel abrir a avaliacao.'))
      .finally(() => setLoading(false));
  }, [id]);

  const progresso = useMemo(() => {
    const obrigatoriasTotal = avaliacao?.perguntasObrigatorias?.length || 0;
    const verticaisTotal =
      avaliacao?.verticais?.reduce((total, vertical) => total + (vertical.perguntas?.length || 0), 0) || 0;
    const obrigatoriasRespondidas = Object.values(respostasObrigatorias).filter((r) => r.pontuacao != null).length;
    const verticaisRespondidas = Object.values(respostasVerticais).filter((r) => r.pontuacao != null).length;
    const total = obrigatoriasTotal + verticaisTotal;
    const respondidas = obrigatoriasRespondidas + verticaisRespondidas;
    return { total, respondidas, percentual: total ? Math.round((respondidas / total) * 100) : 0 };
  }, [avaliacao, respostasObrigatorias, respostasVerticais]);

  async function save(showAlert = true) {
    setSaving(true);
    try {
      const atualizada = await api.salvarAvaliacaoProduto(
        id,
        Object.values(respostasObrigatorias),
        Object.values(respostasVerticais)
      );
      setAvaliacao((prev) => ({ ...prev, ...atualizada }));
      setLastSavedAt(new Date());
      if (showAlert) Alert.alert('Progresso salvo', 'Suas respostas foram registradas.');
    } finally {
      setSaving(false);
    }
  }

  async function finalizar() {
    const obrigatoriasTotal = avaliacao?.perguntasObrigatorias?.length || 0;
    const obrigatoriasRespondidas = Object.values(respostasObrigatorias).filter((r) => r.pontuacao != null).length;
    if (obrigatoriasRespondidas < obrigatoriasTotal) {
      Alert.alert('Perguntas obrigatorias', `Responda as ${obrigatoriasTotal} perguntas obrigatorias antes de finalizar.`);
      return;
    }

    const message =
      progresso.respondidas < progresso.total
        ? `Voce respondeu ${progresso.respondidas} de ${progresso.total} perguntas. Deseja finalizar mesmo assim?`
        : 'Depois de finalizar, nao sera possivel alterar as respostas. Deseja continuar?';
    const ok = await confirmAsync('Finalizar avaliacao', message);
    if (!ok) return;

    setSaving(true);
    try {
      await api.salvarAvaliacaoProduto(id, Object.values(respostasObrigatorias), Object.values(respostasVerticais));
      await api.finalizarAvaliacaoProduto(id);
      onCompleted();
    } catch (err) {
      Alert.alert('Erro ao finalizar', err.message || 'Tente novamente.');
    } finally {
      setSaving(false);
    }
  }

  function updateObrigatoria(idResposta, patch) {
    setRespostasObrigatorias((prev) => ({ ...prev, [idResposta]: { ...prev[idResposta], ...patch } }));
  }

  function updateVertical(idResposta, patch) {
    setRespostasVerticais((prev) => ({ ...prev, [idResposta]: { ...prev[idResposta], ...patch } }));
  }

  if (loading) return <FullScreenLoader message="Abrindo avaliacao..." />;
  if (error) return <ErrorScreen message={error} onBack={onBack} />;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <TopBar title="Avaliacao de Produto" subtitle={avaliacao?.produto?.nome} onBack={onBack} />
      <ProgressCard progresso={progresso} lastSavedAt={lastSavedAt} />

      {avaliacao?.perguntasObrigatorias?.length ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Transformacao Agentica</Text>
          <Text style={styles.muted}>Perguntas obrigatorias universais do produto.</Text>
        </View>
      ) : null}

      {avaliacao?.perguntasObrigatorias?.map((pergunta) => {
        const resposta = avaliacao.respostasObrigatorias?.find((r) => r.perguntaObrigatoriaId === pergunta.id);
        if (!resposta) return null;
        const atual = respostasObrigatorias[resposta.id] || {};
        return (
          <QuestionCard key={`ob-${pergunta.id}`}>
            <Text style={styles.questionNumber}>{pergunta.categoria || 'Obrigatoria'}</Text>
            <Text style={styles.questionText}>{pergunta.texto}</Text>
            {pergunta.criterios ? <Text style={styles.criteria}>{pergunta.criterios}</Text> : null}
            <ScorePicker value={atual.pontuacao} onChange={(pontuacao) => updateObrigatoria(resposta.id, { pontuacao })} />
            <TextInput
              multiline
              value={atual.observacoes || ''}
              onChangeText={(observacoes) => updateObrigatoria(resposta.id, { observacoes })}
              placeholder="Observacoes ou evidencias..."
              placeholderTextColor="#94a3b8"
              style={styles.textarea}
            />
          </QuestionCard>
        );
      })}

      {avaliacao?.verticais?.map((vertical) => (
        <View key={vertical.id}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{vertical.nome}</Text>
            {vertical.descricao ? <Text style={styles.muted}>{vertical.descricao}</Text> : null}
          </View>
          {vertical.perguntas?.map((pergunta) => {
            const resposta = avaliacao.respostasVerticais?.find((r) => r.perguntaProdutoId === pergunta.id);
            if (!resposta) return null;
            const atual = respostasVerticais[resposta.id] || {};
            return (
              <QuestionCard key={`ve-${pergunta.id}`}>
                <Text style={styles.questionNumber}>{pergunta.categoria || vertical.nome}</Text>
                <Text style={styles.questionText}>{pergunta.texto}</Text>
                <ScorePicker value={atual.pontuacao} onChange={(pontuacao) => updateVertical(resposta.id, { pontuacao })} />
                <TextInput
                  multiline
                  value={atual.observacoes || ''}
                  onChangeText={(observacoes) => updateVertical(resposta.id, { observacoes })}
                  placeholder="Observacoes ou evidencias..."
                  placeholderTextColor="#94a3b8"
                  style={styles.textarea}
                />
              </QuestionCard>
            );
          })}
        </View>
      ))}

      <View style={styles.actions}>
        <SecondaryButton disabled={saving} onPress={() => save(true).catch((err) => Alert.alert('Erro ao salvar', err.message))}>
          {saving ? 'Salvando...' : 'Salvar'}
        </SecondaryButton>
        <PrimaryButton disabled={saving} onPress={finalizar}>
          Finalizar
        </PrimaryButton>
      </View>
    </ScrollView>
  );
}

function CompletedScreen({ onHome }) {
  return (
    <View style={styles.screen}>
      <View style={[styles.content, styles.completedWrap]}>
        <View style={styles.completedIcon}>
          <Text style={styles.completedIconText}>✓</Text>
        </View>
        <Text style={styles.title}>Obrigado pela participacao!</Text>
        <Text style={styles.subtitle}>
          Sua avaliacao foi concluida e suas respostas foram registradas com sucesso.
        </Text>
        <PrimaryButton onPress={onHome}>Voltar para minhas avaliacoes</PrimaryButton>
      </View>
    </View>
  );
}

function ErrorScreen({ message, onBack }) {
  return (
    <View style={styles.screen}>
      <View style={styles.content}>
        <Text style={styles.title}>Nao foi possivel continuar</Text>
        <Text style={styles.errorBox}>{message}</Text>
        <PrimaryButton onPress={onBack}>Voltar</PrimaryButton>
      </View>
    </View>
  );
}

function TopBar({ title, subtitle, onBack }) {
  return (
    <View style={styles.topBar}>
      <Pressable onPress={onBack} style={styles.backButton}>
        <Text style={styles.backText}>‹</Text>
      </Pressable>
      <View style={{ flex: 1 }}>
        <Text style={styles.topTitle}>{title}</Text>
        {subtitle ? <Text style={styles.topSubtitle}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

function ProgressCard({ progresso, lastSavedAt }) {
  return (
    <View style={styles.card}>
      <View style={styles.progressHeader}>
        <Text style={styles.cardTitle}>Progresso</Text>
        <Text style={styles.muted}>
          {progresso.respondidas}/{progresso.total} ({progresso.percentual}%)
        </Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progresso.percentual}%` }]} />
      </View>
      {lastSavedAt ? (
        <Text style={styles.savedText}>
          Salvo as {lastSavedAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
        </Text>
      ) : null}
    </View>
  );
}

function FooterActions({ saving, canPrev, canNext, onPrev, onNext, onSave, onFinish }) {
  return (
    <View style={styles.footer}>
      <View style={styles.row}>
        <SecondaryButton disabled={!canPrev || saving} onPress={onPrev}>
          Anterior
        </SecondaryButton>
        <SecondaryButton disabled={!canNext || saving} onPress={onNext}>
          Proxima
        </SecondaryButton>
      </View>
      <View style={styles.actions}>
        <SecondaryButton disabled={saving} onPress={onSave}>
          {saving ? 'Salvando...' : 'Salvar'}
        </SecondaryButton>
        <PrimaryButton disabled={saving} onPress={onFinish}>
          Finalizar
        </PrimaryButton>
      </View>
    </View>
  );
}

function AssessmentCard({ item, onPress }) {
  return (
    <Pressable disabled={!onPress} onPress={onPress} style={[styles.assessmentCard, !onPress && styles.assessmentCardDisabled]}>
      <View style={styles.assessmentIcon}>
        <Text style={styles.assessmentIconText}>{item.tipo === 'product' ? 'P' : 'A'}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.assessmentTitle}>{item.titulo}</Text>
        <Text style={styles.assessmentSubtitle}>{item.subtitulo}</Text>
      </View>
      <View style={[styles.badge, isPendente(item) ? styles.badgePending : styles.badgeDone]}>
        <Text style={styles.badgeText}>{statusLabel(item.status)}</Text>
      </View>
    </Pressable>
  );
}

function SectionTitle({ title, count }) {
  return (
    <View style={styles.sectionTitle}>
      <Text style={styles.sectionTitleText}>{title}</Text>
      <Text style={styles.sectionCount}>{count}</Text>
    </View>
  );
}

function EmptyState({ text }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

function QuestionCard({ children, disabled }) {
  return <View style={[styles.questionCard, disabled && styles.disabledCard]}>{children}</View>;
}

function ScorePicker({ value, onChange, disabled }) {
  return (
    <View style={styles.scoreRow}>
      {SCORE_OPTIONS.map((score) => (
        <Pressable
          key={score}
          disabled={disabled}
          onPress={() => onChange(score)}
          style={[styles.scoreButton, value === score && styles.scoreButtonActive, disabled && styles.scoreDisabled]}
        >
          <Text style={[styles.scoreText, value === score && styles.scoreTextActive]}>{score}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function CheckRow({ checked, label, onPress }) {
  return (
    <Pressable onPress={onPress} style={styles.checkRow}>
      <View style={[styles.checkbox, checked && styles.checkboxActive]}>
        {checked ? <Text style={styles.checkmark}>✓</Text> : null}
      </View>
      <Text style={styles.checkLabel}>{label}</Text>
    </Pressable>
  );
}

function PrimaryButton({ children, onPress, disabled }) {
  return (
    <Pressable disabled={disabled} onPress={onPress} style={[styles.primaryButton, disabled && styles.buttonDisabled]}>
      <Text style={styles.primaryButtonText}>{children}</Text>
    </Pressable>
  );
}

function SecondaryButton({ children, onPress, disabled }) {
  return (
    <Pressable disabled={disabled} onPress={onPress} style={[styles.secondaryButton, disabled && styles.buttonDisabled]}>
      <Text style={styles.secondaryButtonText}>{children}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0f172a'
  },
  screen: {
    flex: 1,
    backgroundColor: '#0f172a'
  },
  content: {
    padding: 18,
    paddingBottom: 40
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f172a'
  },
  centeredText: {
    marginTop: 14,
    color: '#e2e8f0',
    fontSize: 16
  },
  loginCard: {
    margin: 18,
    marginTop: 90,
    padding: 22,
    borderRadius: 24,
    backgroundColor: '#ffffff'
  },
  brand: {
    color: '#2563eb',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4
  },
  title: {
    color: '#0f172a',
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8
  },
  subtitle: {
    color: '#64748b',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 22
  },
  label: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 14,
    paddingHorizontal: 14,
    marginBottom: 14,
    color: '#0f172a',
    backgroundColor: '#f8fafc'
  },
  textarea: {
    minHeight: 86,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 14,
    padding: 12,
    marginTop: 14,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
    textAlignVertical: 'top'
  },
  errorBox: {
    padding: 12,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#fee2e2',
    color: '#991b1b',
    marginBottom: 14
  },
  header: {
    padding: 20,
    borderRadius: 24,
    backgroundColor: '#2563eb',
    marginBottom: 22,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start'
  },
  headerKicker: {
    color: '#bfdbfe',
    fontSize: 13,
    fontWeight: '700'
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '800',
    marginTop: 4
  },
  headerSubtitle: {
    color: '#dbeafe',
    marginTop: 4
  },
  logoutButton: {
    marginLeft: 'auto',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.16)'
  },
  logoutText: {
    color: '#ffffff',
    fontWeight: '700'
  },
  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 8
  },
  sectionTitleText: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '800'
  },
  sectionCount: {
    marginLeft: 8,
    color: '#93c5fd',
    fontWeight: '800'
  },
  empty: {
    padding: 20,
    borderRadius: 18,
    backgroundColor: '#1e293b'
  },
  emptyText: {
    color: '#cbd5e1',
    textAlign: 'center'
  },
  assessmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    marginBottom: 10
  },
  assessmentCardDisabled: {
    opacity: 0.72
  },
  assessmentIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center'
  },
  assessmentIconText: {
    color: '#1d4ed8',
    fontWeight: '900'
  },
  assessmentTitle: {
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '800'
  },
  assessmentSubtitle: {
    color: '#64748b',
    marginTop: 2
  },
  badge: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999
  },
  badgePending: {
    backgroundColor: '#fef3c7'
  },
  badgeDone: {
    backgroundColor: '#dcfce7'
  },
  badgeText: {
    color: '#334155',
    fontSize: 11,
    fontWeight: '800'
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1e293b'
  },
  backText: {
    color: '#ffffff',
    fontSize: 34,
    lineHeight: 36
  },
  topTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '900'
  },
  topSubtitle: {
    color: '#cbd5e1',
    marginTop: 3
  },
  card: {
    padding: 16,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    marginBottom: 14
  },
  cardTitle: {
    color: '#0f172a',
    fontSize: 17,
    fontWeight: '900',
    marginBottom: 4
  },
  muted: {
    color: '#64748b',
    lineHeight: 20
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  progressTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: '#e2e8f0',
    marginTop: 10,
    overflow: 'hidden'
  },
  progressFill: {
    height: 10,
    borderRadius: 999,
    backgroundColor: '#2563eb'
  },
  savedText: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 8
  },
  tabs: {
    marginBottom: 14
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#1e293b',
    marginRight: 8
  },
  tabActive: {
    backgroundColor: '#2563eb'
  },
  tabText: {
    color: '#cbd5e1',
    fontWeight: '800'
  },
  tabTextActive: {
    color: '#ffffff'
  },
  questionCard: {
    padding: 16,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    marginBottom: 14
  },
  disabledCard: {
    opacity: 0.55
  },
  questionNumber: {
    color: '#2563eb',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    marginBottom: 8
  },
  questionText: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 23
  },
  criteria: {
    color: '#475569',
    backgroundColor: '#f1f5f9',
    borderRadius: 14,
    padding: 12,
    marginTop: 12,
    lineHeight: 19
  },
  scoreRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16
  },
  scoreButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc'
  },
  scoreButtonActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb'
  },
  scoreDisabled: {
    opacity: 0.4
  },
  scoreText: {
    color: '#334155',
    fontSize: 18,
    fontWeight: '900'
  },
  scoreTextActive: {
    color: '#ffffff'
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    borderRadius: 14,
    backgroundColor: '#f8fafc',
    marginTop: 14
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#94a3b8',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff'
  },
  checkboxActive: {
    borderColor: '#2563eb',
    backgroundColor: '#2563eb'
  },
  checkmark: {
    color: '#ffffff',
    fontWeight: '900'
  },
  checkLabel: {
    flex: 1,
    color: '#334155',
    lineHeight: 20
  },
  footer: {
    gap: 12
  },
  row: {
    flexDirection: 'row',
    gap: 10
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
    marginBottom: 20
  },
  primaryButton: {
    flex: 1,
    minHeight: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
    paddingHorizontal: 14
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 15
  },
  secondaryButton: {
    flex: 1,
    minHeight: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 14
  },
  secondaryButtonText: {
    color: '#0f172a',
    fontWeight: '900',
    fontSize: 15
  },
  buttonDisabled: {
    opacity: 0.45
  },
  completedWrap: {
    flex: 1,
    justifyContent: 'center'
  },
  completedIcon: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18
  },
  completedIconText: {
    color: '#ffffff',
    fontSize: 42,
    fontWeight: '900'
  }
});
