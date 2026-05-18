# 🎵 SGOEM — Sistema de Gestão de Ordem de Equipamentos Musicais

> App Mobile para gestão de instrumentos musicais de bandas e fanfarras  
> **React Native + Expo + Django + IoT RFID**

---

## 📋 Índice

- [Clonando o Projeto](#clonando-o-projeto)
- [Pré-requisitos](#pré-requisitos)
- [Instalação do App Mobile](#instalação-do-app-mobile)
- [Configurando o Backend Django](#configurando-o-backend-django)
- [Rodando o Projeto](#rodando-o-projeto)
- [Estrutura de Arquivos](#estrutura-de-arquivos)
- [Problemas Comuns](#problemas-comuns)

---

## 📥 Clonando o Projeto

### 1. Clonar o repositório

Abra o terminal (CMD, PowerShell ou Git Bash) e execute:

```bash
git clone https://github.com/JadsonTSI/aplicativo_SGOEM.git
```

### 2. Entrar na pasta do projeto

```bash
cd aplicativo_SGOEM
```

### 3. Ver os arquivos clonados

```bash
# Windows
dir

# Mac / Linux
ls
```

---

## ⚙️ Pré-requisitos

Instale as seguintes ferramentas **antes** de começar:

### No computador

| Ferramenta | Versão mínima | Download |
|------------|---------------|---------|
| **Node.js** | 18 ou superior | https://nodejs.org — escolha a versão **LTS** |
| **Python** | 3.10 ou superior | https://python.org — marque **"Add to PATH"** na instalação |
| **Git** | qualquer | https://git-scm.com |
| **VS Code** | qualquer (recomendado) | https://code.visualstudio.com |

### No celular

- **Expo Go** — [Play Store (Android)](https://play.google.com/store/apps/details?id=host.exp.exponent) ou [App Store (iPhone)](https://apps.apple.com/app/expo-go/id982107779)

> ⚠️ O celular e o computador precisam estar na **mesma rede WiFi**.

---

## 📱 Instalação do App Mobile

### 1. Instalar as dependências

Dentro da pasta do projeto, execute:

```bash
npm install --legacy-peer-deps
```

> Se der erro, tente:
> ```bash
> rmdir /s /q node_modules    # Windows
> rm -rf node_modules         # Mac/Linux
> npm install --legacy-peer-deps
> ```

### 2. Verificar as versões

O projeto usa **Expo SDK 54**. Confirme que o `package.json` tem:

```json
{
  "expo": "~54.0.0",
  "react": "19.1.0",
  "react-native": "0.81.5",
  "react-native-screens": "~4.16.0",
  "react-native-safe-area-context": "~5.6.0"
}
```

Se as versões estiverem desatualizadas, corrija com:

```bash
npx expo install --fix
```

### 3. Confirmar o arquivo index.js

O arquivo `index.js` na raiz deve ter:

```js
import { registerRootComponent } from 'expo';
import { enableScreens } from 'react-native-screens';
import App from './App';

enableScreens();
registerRootComponent(App);
```

### 4. Confirmar o babel.config.js

O arquivo `babel.config.js` na raiz deve ter:

```js
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
  };
};
```

---

## 🐍 Configurando o Backend Django

### 1. Entrar na pasta do backend

```bash
cd backend    # ou o nome da pasta do Django no repositório
```

### 2. Criar o ambiente virtual

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Mac / Linux
python3 -m venv venv
source venv/bin/activate
```

Você vai ver `(venv)` aparecendo no início da linha do terminal — isso significa que o ambiente está ativo.

### 3. Instalar as dependências Python

```bash
pip install -r requirements.txt
```

> Se não tiver o arquivo `requirements.txt`, instale manualmente:
> ```bash
> pip install django djangorestframework
> ```

### 4. Criar o banco de dados

```bash
python manage.py migrate
```

### 5. Criar um usuário administrador

```bash
python manage.py createsuperuser
```

Preencha usuário, email (opcional) e senha quando pedido.

### 6. Descobrir o IP do seu computador

```bash
# Windows
ipconfig
# Procure: "Endereço IPv4" — ex: 192.168.1.100

# Mac / Linux
ifconfig
# Procure: "inet" — ex: 192.168.1.100
```

Anote esse IP — você vai precisar dele no próximo passo.

### 7. Configurar o settings.py

Abra o arquivo `settings.py` do Django e confirme:

```python
ALLOWED_HOSTS = ['*']  # permite conexões do celular
```

### 8. Iniciar o servidor Django

```bash
python manage.py runserver 0.0.0.0:8000
```

> Use `0.0.0.0` (não `localhost`) para que o celular consiga acessar.

---

## ▶️ Rodando o Projeto

### 1. Atualizar o IP no app

Abra o arquivo `screens/LoginScreen.js` e troque o IP pelo que você anotou:

```js
const API_BASE = 'http://192.168.1.100:8000'; // ← SEU IP AQUI
```

### 2. Abrir dois terminais

**Terminal 1 — Django (backend):**
```bash
cd backend
venv\Scripts\activate      # Windows
source venv/bin/activate   # Mac/Linux
python manage.py runserver 0.0.0.0:8000
```

**Terminal 2 — Expo (app mobile):**
```bash
cd aplicativo_SGOEM
npx expo start --clear
```

### 3. Abrir no celular

1. Abra o **Expo Go** no celular
2. **Android:** toque em **"Scan QR Code"** e aponte para o QR Code no terminal
3. **iPhone:** abra a **câmera normal** e aponte para o QR Code

O app vai abrir automaticamente! 🎉

### 4. Fazer o login

Use o usuário e senha criados no `createsuperuser`.

---

## 📁 Estrutura de Arquivos

```
aplicativo_SGOEM/
│
├── index.js                  # Ponto de entrada do Expo
├── App.js                    # Navegação principal + autenticação
├── app.json                  # Configurações do Expo
├── package.json              # Dependências Node
├── babel.config.js           # Configuração do Babel
│
└── screens/
    ├── LoginScreen.js        # Tela de login
    ├── ScannerScreen.js      # Scanner RFID (ESP32)
    ├── InstrumentosScreen.js # Estoque de instrumentos
    ├── EmprestimosScreen.js  # Controle de empréstimos
    ├── EnsaiosScreen.js      # Agenda de ensaios
    └── PainelScreen.js       # Dashboard geral
```

---

## 🚨 Problemas Comuns

### `npm install` dá erro de conflito de versões
```bash
npm install --legacy-peer-deps
```

### App não abre no celular
```
✅ Celular e computador na mesma rede WiFi?
✅ O Expo Go está instalado e atualizado?
✅ O QR Code foi escaneado corretamente?
```

### Tela em branco
```bash
npx expo start --clear
```

### "Project is incompatible with this version of Expo Go"
```bash
npx expo install --fix
npx expo start --clear
```

### "PlatformConstants could not be found"
```bash
rmdir /s /q node_modules     # Windows
del package-lock.json        # Windows
npm install --legacy-peer-deps
npx expo start --clear
```

### App não conecta ao Django
```
✅ Django rodando com: python manage.py runserver 0.0.0.0:8000
✅ IP correto em screens/LoginScreen.js (não use "localhost")
✅ ALLOWED_HOSTS = ['*'] no settings.py
✅ Celular na mesma rede WiFi do computador
```

### Login: "Usuário ou senha incorretos"
```
✅ Criou o superusuário? (python manage.py createsuperuser)
✅ A rota /contas/api/login/ existe no Django?
✅ O decorator @csrf_exempt está na view de login da API?
```

### `(venv)` não aparece no terminal
```bash
# Windows — rode dentro da pasta do backend:
venv\Scripts\activate

# Mac/Linux:
source venv/bin/activate
```

---

## 🛠️ Tecnologias

| Tecnologia | Uso |
|-----------|-----|
| React Native + Expo | Interface mobile |
| React Navigation v7 | Navegação entre telas |
| AsyncStorage | Sessão local do usuário |
| Axios | Requisições HTTP para o Django |
| Django + Python | Backend, API REST e banco de dados |
| ESP32 + RC522 | Hardware IoT para leitura RFID |

---

## 📄 Projeto

**SGOEM — Sistema de Gestão de Ordem de Equipamentos Musicais**  
Projeto Integrador II  
Repositório: https://github.com/JadsonTSI/aplicativo_SGOEM
