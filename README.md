# 🤖 Multimodal API Integrator

> Uma aplicação React Native multimodal para interação com IA, integração de APIs REST e funcionalidades avançadas de voz e texto.

[🇵🇹 Português](#português) | [🇬🇧 English](#english)

---

## 🇵🇹 Português

### 📋 Sobre o Projeto

O **Multimodal API Integrator** é uma aplicação React Native desenvolvida com Expo que permite interação multimodal com agentes de IA através de APIs REST. A aplicação oferece funcionalidades avançadas de chat com suporte a texto e voz, incluindo transcrição de fala, síntese de voz, detecção de idioma e streaming de respostas em tempo real.

### ✨ Características Principais

#### 🎤 **Funcionalidades de Voz**
- **Gravação de Áudio**: Gravação de alta qualidade com feedback visual
- **Speech-to-Text (STT)**: Transcrição automática com suporte a múltiplos idiomas
- **Text-to-Speech (TTS)**: Síntese de voz para respostas da IA
- **Detecção de Idioma**: Identificação automática do idioma falado
- **Playback de Áudio**: Reprodução das mensagens de voz gravadas

#### 💬 **Sistema de Chat Inteligente**
- **Chat em Tempo Real**: Streaming de respostas da IA palavra por palavra
- **Persistência Local**: Histórico de conversas salvo localmente
- **Navegação por Modos**: Acesso dedicado a chat de texto e voz
- **Scroll Automático**: Interface que acompanha automaticamente novas mensagens
- **Indicadores Visuais**: Estados de carregamento, digitação e processamento

#### 🔧 **Configurações Avançadas**
- **Configuração de APIs**: Interface para configurar endpoints e credenciais
- **Seleção de Voz**: Múltiplas opções de vozes para TTS
- **Modelos STT**: Configuração de diferentes modelos de reconhecimento
- **Idioma Padrão**: Definição de idioma padrão para processamento

#### 🎨 **Interface de Usuário**
- **Design Responsivo**: Interface adaptativa e moderna
- **Background Personalizado**: Imagem de fundo com transparência
- **Navegação Intuitiva**: Tabs organizadas com controle de visibilidade
- **Feedback Visual**: Animações e indicadores de estado

### 📱 Estrutura da Aplicação

```
application/
├── app/
│   ├── (tabs)/
│   │   ├── index.js          # Tela principal com navegação
│   │   ├── chatRoom.js       # Interface de chat multimodal
│   │   └── settings-screen.js # Configurações da aplicação
│   └── _layout.tsx           # Layout e navegação principal
├── components/
│   ├── MessageList.js        # Lista de mensagens com playback
│   └── chatComponent.js      # Componentes de chat
├── scripts/
│   ├── utils.js             # Funções utilitárias para APIs
│   ├── handleComunication.js # Streaming de texto para texto
│   └── sentimentAnalysis.js # Análise de sentimento
├── constants/
│   └── api_configurations.json # Configurações de APIs
└── assets/                  # Recursos visuais e áudio
```

### 🚀 Instalação e Configuração

#### Pré-requisitos
- Node.js (v16 ou superior)
- Expo CLI
- React Native development environment
- Dispositivo iOS/Android ou emulador

#### Instalação
```bash
# Clone o repositório
git clone https://github.com/JCadizor/multimodal-api-integrator.git

# Navegue para a pasta da aplicação
cd multimodal-api-integrator/application

# Instale as dependências
npm install

# Inicie o servidor de desenvolvimento
npx expo start
```

#### Configuração das APIs
1. Abra a aplicação e navegue para "Configurações"
2. Configure os seguintes parâmetros:
   - **Hostname da API**: Endereço do servidor
   - **Porta da API**: Porta do servidor
   - **Voz Preferida**: Selecione entre as opções disponíveis
   - **Modelo STT**: Escolha o modelo de reconhecimento
   - **Idioma Padrão**: Defina o idioma principal

### 🔌 APIs Integradas

#### Text-to-Speech (TTS)
- Múltiplas vozes disponíveis
- Qualidade de áudio profissional
- Suporte a diferentes idiomas

#### Speech-to-Text (STT)
- 16 modelos diferentes disponíveis
- Transcrição em tempo real
- Suporte a múltiplos idiomas

#### Language Detection
- Detecção automática de idioma
- Re-transcrição com idioma detectado
- Fallback para idioma padrão

#### Text-to-Text Streaming
- Resposta da IA em tempo real
- Streaming palavra por palavra
- Contexto de conversa mantido

### 📊 Funcionalidades Técnicas

#### Gerenciamento de Estado
- AsyncStorage para persistência
- Estados reativos com React Hooks
- Sincronização em tempo real

#### Processamento de Áudio
- Gravação com Expo AV
- Processamento de arquivos de áudio
- Playback com controles avançados

#### Streaming e APIs
- Fetch com suporte a streaming
- Tratamento robusto de erros
- Reconexão automática

### 🛠️ Tecnologias Utilizadas

- **Frontend**: React Native, Expo
- **Navegação**: Expo Router
- **Estado**: React Hooks, AsyncStorage
- **Áudio**: Expo AV
- **Ícones**: Material Icons
- **HTTP**: Expo Fetch
- **Styling**: StyleSheet (React Native)

### 📸 Screenshots

*[Screenshots da aplicação seriam inseridos aqui]*

### 🤝 Contribuição

Contribuições são bem-vindas! Por favor:

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

### 📄 Licença

Este projeto está licenciado sob a MIT License - veja o arquivo [LICENSE](LICENSE) para detalhes.

### 👥 Autores

- **JCadizor** - [GitHub](https://github.com/JCadizor)

---

## 🇬🇧 English

### 📋 About the Project

**Multimodal API Integrator** is a React Native application built with Expo that enables multimodal interaction with AI agents through REST APIs. The application offers advanced chat functionality with text and voice support, including speech transcription, voice synthesis, language detection, and real-time response streaming.

### ✨ Key Features

#### 🎤 **Voice Capabilities**
- **Audio Recording**: High-quality recording with visual feedback
- **Speech-to-Text (STT)**: Automatic transcription with multi-language support
- **Text-to-Speech (TTS)**: Voice synthesis for AI responses
- **Language Detection**: Automatic identification of spoken language
- **Audio Playback**: Playback of recorded voice messages

#### 💬 **Intelligent Chat System**
- **Real-time Chat**: AI response streaming word by word
- **Local Persistence**: Conversation history saved locally
- **Mode Navigation**: Dedicated access to text and voice chat
- **Auto-scroll**: Interface automatically follows new messages
- **Visual Indicators**: Loading, typing, and processing states

#### 🔧 **Advanced Configuration**
- **API Setup**: Interface for configuring endpoints and credentials
- **Voice Selection**: Multiple voice options for TTS
- **STT Models**: Configuration of different recognition models
- **Default Language**: Setting default language for processing

#### 🎨 **User Interface**
- **Responsive Design**: Adaptive and modern interface
- **Custom Background**: Background image with transparency
- **Intuitive Navigation**: Organized tabs with visibility control
- **Visual Feedback**: Animations and state indicators

### 📱 Application Structure

```
application/
├── app/
│   ├── (tabs)/
│   │   ├── index.js          # Main screen with navigation
│   │   ├── chatRoom.js       # Multimodal chat interface
│   │   └── settings-screen.js # Application settings
│   └── _layout.tsx           # Main layout and navigation
├── components/
│   ├── MessageList.js        # Message list with playback
│   └── chatComponent.js      # Chat components
├── scripts/
│   ├── utils.js             # Utility functions for APIs
│   ├── handleComunication.js # Text-to-text streaming
│   └── sentimentAnalysis.js # Sentiment analysis
├── constants/
│   └── api_configurations.json # API configurations
└── assets/                  # Visual and audio resources
```

### 🚀 Installation and Setup

#### Prerequisites
- Node.js (v16 or higher)
- Expo CLI
- React Native development environment
- iOS/Android device or emulator

#### Installation
```bash
# Clone the repository
git clone https://github.com/JCadizor/multimodal-api-integrator.git

# Navigate to the application folder
cd multimodal-api-integrator/application

# Install dependencies
npm install

# Start the development server
npx expo start
```

#### API Configuration
1. Open the application and navigate to "Settings"
2. Configure the following parameters:
   - **API Hostname**: Server address
   - **API Port**: Server port
   - **Preferred Voice**: Select from available options
   - **STT Model**: Choose recognition model
   - **Default Language**: Set primary language

### 🔌 Integrated APIs

#### Text-to-Speech (TTS)
- Multiple voices available
- Professional audio quality
- Multi-language support

#### Speech-to-Text (STT)
- 16 different models available
- Real-time transcription
- Multi-language support

#### Language Detection
- Automatic language identification
- Re-transcription with detected language
- Fallback to default language

#### Text-to-Text Streaming
- Real-time AI responses
- Word-by-word streaming
- Conversation context maintained

### 📊 Technical Features

#### State Management
- AsyncStorage for persistence
- Reactive states with React Hooks
- Real-time synchronization

#### Audio Processing
- Recording with Expo AV
- Audio file processing
- Playback with advanced controls

#### Streaming and APIs
- Fetch with streaming support
- Robust error handling
- Automatic reconnection

### 🛠️ Technologies Used

- **Frontend**: React Native, Expo
- **Navigation**: Expo Router
- **State**: React Hooks, AsyncStorage
- **Audio**: Expo AV
- **Icons**: Material Icons
- **HTTP**: Expo Fetch
- **Styling**: StyleSheet (React Native)

### 📸 Screenshots

*[Application screenshots would be inserted here]*

### 🤝 Contributing

Contributions are welcome! Please:

1. Fork the project
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

### 👥 Authors

- **JCadizor** - [GitHub](https://github.com/JCadizor)

---

### 🔗 Links Úteis / Useful Links

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/docs/getting-started)
- [React Navigation](https://reactnavigation.org/)

### 📞 Suporte / Support

Para questões técnicas ou suporte, por favor abra uma [issue](https://github.com/JCadizor/multimodal-api-integrator/issues) no repositório.

For technical questions or support, please open an [issue](https://github.com/JCadizor/multimodal-api-integrator/issues) in the repository.
