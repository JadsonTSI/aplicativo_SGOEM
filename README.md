# 🎵 ABANFAR BF — App Mobile

> Sistema de Gestão Musical para Associações de Bandas e Fanfarras  
> **React Native + Expo + Django + IoT RFID (ESP32 + RC522)**

---

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Pré-requisitos](#pré-requisitos)
- [Instalação do App](#instalação-do-app)
- [Configurando o Backend Django](#configurando-o-backend-django)
- [Rodando o Projeto](#rodando-o-projeto)
- [Estrutura de Arquivos](#estrutura-de-arquivos)
- [Telas do App](#telas-do-app)
- [Variáveis de Configuração](#variáveis-de-configuração)
- [Gerando o APK](#gerando-o-apk)
- [Problemas Comuns](#problemas-comuns)

---

## 🎯 Visão Geral

O ABANFAR BF é um app mobile que digitaliza a gestão de instrumentos musicais de uma banda/fanfarra. Ele se integra com:

- **Backend Django** para autenticação, banco de dados e API REST
- **Hardware ESP32 + RC522** para leitura automática de tags RFID nos instrumentos
- **AsyncStorage** para manter a sessão do usuário no celular

### Funcionalidades

| Tela | O que faz |
|------|-----------|
| 🔐 Login | Autenticação com o sistema Django (gerente, professor ou aluno) |
| 📡 Scanner RFID | Registra retirada e devolução de instrumentos via leitor IoT |
| 🎵 Estoque | Lista todos os instrumentos com situação em tempo real |
| 📋 Empréstimos | Controla quem está com cada instrumento e alertas de atraso |
| 🎼 Ensaios | Agenda de ensaios por grupo musical |
| 📊 Painel | Dashboard com resumo, gráficos e alertas |

---

## ⚙️ Pré-requisitos

Instale as seguintes ferramentas **antes** de começar:

### No computador

| Ferramenta | Versão mínima | Link |
|-----------|---------------|------|
| Node.js | 18+ | https://nodejs.org |
| Python | 3.10+ | https://python.org |
| Git | qualquer | https://git-scm.com |
| VS Code (recomendado) | qualquer | https://code.visualstudio.com |

### No celular

- **Expo Go** — disponível na [Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent) (Android) ou [App Store](https://apps.apple.com/app/expo-go/id982107779) (iPhone)

> ⚠️ **Importante:** O celular e o computador precisam estar na **mesma rede WiFi**.

---

## 📱 Instalação do App

### 1. Clonar ou criar o projeto

```bash
npx create-expo-app@latest abanfar-app --template blank
cd abanfar-app
```

### 2. Instalar as dependências

```bash
npm install \
  @react-navigation/native@^7.2.4 \
  @react-navigation/bottom-tabs@^7.4.0 \
  @react-navigation/native-stack@^7.2.4 \
  --legacy-peer-deps

npm install \
  react-native-screens \
  react-native-safe-area-context \
  @react-native-async-storage/async-storage \
  axios \
  --legacy-peer-deps
```

### 3. Verificar versões do package.json

O Expo SDK 54 exige versões específicas. Confirme que seu `package.json` tem:

```json
{
  "expo": "~54.0.0",
  "react": "19.1.0",
  "react-native": "0.81.5",
  "react-native-screens": "~4.16.0",
  "react-native-safe-area-context": "~5.6.0"
}
```

Se as versões estiverem erradas, execute:

```bash
npx expo install --fix
```

### 4. Criar a pasta de telas

```bash
mkdir screens
```

Coloque os arquivos dentro de `screens/`:

```
screens/
├── LoginScreen.js
├── ScannerScreen.js
├── InstrumentosScreen.js
├── EmprestimosScreen.js
├── EnsaiosScreen.js
└── PainelScreen.js
```

### 5. Criar o arquivo index.js

Na **raiz** do projeto, crie o arquivo `index.js`:

```js
import { registerRootComponent } from 'expo';
import { enableScreens } from 'react-native-screens';
import App from './App';

enableScreens();
registerRootComponent(App);
```

### 6. Atualizar o package.json

Confirme que o campo `main` aponta para `index.js`:

```json
{
  "main": "index.js"
}
```

### 7. Criar o babel.config.js

Na raiz do projeto, crie o arquivo `babel.config.js`:

```js
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
  };
};
```

### 8. Configurar o app.json

Abra o `app.json` e garanta que o bloco `android` tem:

```json
{
  "expo": {
    "newArchEnabled": false,
    "android": {
      "softwareKeyboardLayoutMode": "pan",
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      }
    }
  }
}
```

---

## 🐍 Configurando o Backend Django

### 1. Criar e ativar o ambiente virtual

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Mac / Linux
python3 -m venv venv
source venv/bin/activate
```

### 2. Instalar dependências Python

```bash
pip install django djangorestframework
```

### 3. Configurar o settings.py

```python
# Permitir conexões de qualquer IP (só durante desenvolvimento)
ALLOWED_HOSTS = ['*']
```

### 4. Criar a rota de login para o app mobile

No `views.py` da sua app `contas`, adicione:

```python
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from django.contrib.auth import authenticate, login

@csrf_exempt
def login_api(request):
    if request.method == "POST":
        username = request.POST.get("username")
        senha = request.POST.get("senha")
        user = authenticate(request, username=username, password=senha)
        if user:
            login(request, user)
            perfil = Perfil.objects.get(user=user)
            return JsonResponse({"sucesso": True, "tipo": perfil.tipo})
        return JsonResponse({"erro": "Credenciais inválidas"}, status=401)
```

No `urls.py` da app `contas`:

```python
path('api/login/', views.login_api, name='login_api'),
```

### 5. Descobrir o IP do computador

```bash
# Windows
ipconfig
# Procure: "Endereço IPv4" — ex: 192.168.1.100

# Mac / Linux
ifconfig
# Procure: "inet" — ex: 192.168.1.100
```

### 6. Iniciar o servidor Django

```bash
# Rode em 0.0.0.0 para aceitar conexões do celular
python manage.py runserver 0.0.0.0:8000
```

---

## ▶️ Rodando o Projeto

### 1. Atualizar o IP no app

No arquivo `screens/LoginScreen.js`, troque o IP pelo seu:

```js
const API_BASE = 'http://192.168.1.100:8000'; // ← SEU IP AQUI
```

### 2. Iniciar o Expo

```bash
npx expo start --clear
```

### 3. Abrir no celular

1. Abra o **Expo Go** no celular
2. **Android:** toque em "Scan QR Code" e aponte para o QR Code do terminal
3. **iPhone:** abra a câmera normal e aponte para o QR Code

O app vai abrir automaticamente! 🎉

### 4. Login

Use as mesmas credenciais criadas no Django:

```bash
# Criar um superusuário no Django (se ainda não tiver)
python manage.py createsuperuser
```

---

## 📁 Estrutura de Arquivos

```
abanfar-app/
│
├── index.js                  # Ponto de entrada (registerRootComponent)
├── App.js                    # Navegação principal + autenticação
├── app.json                  # Configurações do Expo
├── package.json              # Dependências do projeto
├── babel.config.js           # Configuração do Babel
│
└── screens/
    ├── LoginScreen.js        # Autenticação com Django
    ├── ScannerScreen.js      # Scanner RFID IoT (ESP32)
    ├── InstrumentosScreen.js # Estoque de instrumentos
    ├── EmprestimosScreen.js  # Controle de empréstimos
    ├── EnsaiosScreen.js      # Agenda de ensaios
    └── PainelScreen.js       # Dashboard geral
```

---

## 📱 Telas do App

### 🔐 Login
- Autentica com usuario e senha do Django
- Identifica o tipo do usuário (gerente, professor, aluno)
- Salva a sessão localmente (sem precisar logar toda vez)

### 📡 Scanner RFID
- Simula/processa leitura de tags RFID via ESP32 + RC522
- Registra **retirada** (instrumento saindo) ou **devolução** (instrumento entrando)
- Exibe histórico de movimentações do dia

### 🎵 Estoque
- Lista todos os instrumentos com status em tempo real
- Filtros: Todos / Disponíveis / Emprestados / Inativos
- Busca por nome ou identificador
- Toque no card para ver detalhes e histórico

### 📋 Empréstimos
- Mostra quem está com cada instrumento
- Alertas em vermelho para empréstimos vencidos
- Botão para registrar devolução via RFID

### 🎼 Ensaios
- Agenda de ensaios agrupada por data
- Filtros: Ativos / Cancelados / Todos
- Detalhes com lista de alunos por grupo

### 📊 Painel Geral
- KPIs: instrumentos, alunos, emprestados, vencidos
- Status do IoT (ESP32 online/offline)
- Alertas recentes e próximo ensaio
- Gráficos de disponibilidade e condição do estoque
- Botão **Sair** para encerrar a sessão

---

## 🔧 Variáveis de Configuração

| Arquivo | Variável | Descrição |
|---------|----------|-----------|
| `screens/LoginScreen.js` | `API_BASE` | IP e porta do servidor Django |
| `app.json` | `newArchEnabled` | Manter `false` para Expo Go |
| `app.json` | `softwareKeyboardLayoutMode` | Manter `"pan"` para Android |

---

## 📦 Gerando o APK

Quando o app estiver pronto para distribuição:

```bash
# 1. Instalar o EAS CLI
npm install -g eas-cli

# 2. Fazer login na conta Expo (crie em expo.dev se não tiver)
eas login

# 3. Configurar o build
eas build:configure

# 4. Gerar o APK Android
eas build --platform android --profile preview
```

Aguarde 5 a 10 minutos. O arquivo `.apk` estará disponível para download e instalação direta no celular.

> 💡 **Dica:** Com o APK instalado, o bug do teclado com campo de senha é resolvido automaticamente — o `secureTextEntry` funciona perfeitamente fora do Expo Go.

---

## 🚨 Problemas Comuns

### App não abre no celular
```
✅ Verifique se o celular e o computador estão na mesma rede WiFi
```

### Tela em branco ao abrir
```bash
npx expo start --clear
```

### Erro de versão de dependências
```bash
rmdir /s /q node_modules   # Windows
rm -rf node_modules        # Mac/Linux

del package-lock.json      # Windows
rm package-lock.json       # Mac/Linux

npm install --legacy-peer-deps
npx expo start --clear
```

### "PlatformConstants could not be found"
```
✅ Versão do React Native incompatível com o Expo SDK
✅ Verifique as versões no package.json e execute: npx expo install --fix
```

### "Project is incompatible with this version of Expo Go"
```
✅ Expo Go instalado é SDK 54 mas o projeto usa outra versão
✅ Execute: npx expo install --fix  para alinhar as versões
```

### Não conecta ao Django
```
✅ Use o IP da rede local (ex: 192.168.1.100), NUNCA "localhost"
✅ Execute: python manage.py runserver 0.0.0.0:8000
✅ Verifique ALLOWED_HOSTS = ['*'] no settings.py
```

### Login retorna "usuário ou senha incorretos"
```
✅ Confirme que a rota /contas/api/login/ existe no Django
✅ Confirme que o @csrf_exempt está no decorator da view
✅ Confirme que o IP em API_BASE está correto
```

### Teclado fecha sozinho no campo de senha
```
✅ Known issue do Expo Go com secureTextEntry no Android
✅ Será resolvido automaticamente ao gerar o APK final
```

---

## 🛠️ Tecnologias

- **[React Native](https://reactnative.dev/)** — Framework mobile
- **[Expo](https://expo.dev/)** — Plataforma de desenvolvimento
- **[React Navigation v7](https://reactnavigation.org/)** — Navegação entre telas
- **[Django](https://www.djangoproject.com/)** — Backend e API REST
- **[AsyncStorage](https://react-native-async-storage.github.io/async-storage/)** — Armazenamento local
- **[Axios](https://axios-http.com/)** — Requisições HTTP
- **ESP32 + RC522** — Hardware IoT para leitura RFID

---

## 📄 Licença

Projeto Integrador II — ABANFAR BF  
Associação de Bandas e Fanfarras
