# Instruções e Diretrizes para Agentes de Inteligência Artificial

Bem-vindo ao repositório do **The Map Game**! Se você é um agente IA auxiliando no desenvolvimento deste projeto, siga as orientações e diretrizes arquiteturais abaixo para garantir consistência e performance no código gerado.

## 1. Visão de Domínio
Este projeto é um jogo de estratégia em mapa-múndi 3D, com suporte a modo multiplayer utilizando conexão via websockets estaduais.
A regra de ouro arquitetural é: **O Estado do jogo é sempre recebido do Servidor**. 
As funções deste cliente são estritamente orientadas à apresentação e entrada de dados:
- O cliente **NÃO** deve calcular regras de negócio, processar validações complexas ou alterar o estado base do jogo localmente.
- O cliente **DEVE** atuar de forma reativa, recebendo o "State" oficial validado pelo servidor (via Colyseus), renderizando essas informações de forma fluida (usando Three.js + HTML), e convertendo ações do usuário em mensagens simples enviadas de volta ao servidor.

## 2. Padrões de Arquitetura e Engenharia
- **Desacoplamento e Injeção de Dependências:** Tudo que estiver em `src/lib/` é agnóstico. Não adicione lógica de províncias, facções ou exércitos ali. Da mesma forma, injete a dependência de rede genérica nas classes de negócio em `src/game/`.
- **Three.js (Visual) vs DOM (UI):** 
  - Não utilize a engine 3D (Three.js) para desenhar menus ou interfaces ricas. Textos, tooltips e botões devem ser desenvolvidos com elementos de DOM, criados ou instanciados dentro de `src/game/ui` e posicionados via CSS estático ou propriedades calculadas por cima do Canvas.
  - Reserve o motor 3D apenas para as malhas, iluminação, terreno (Globe) e efeitos visuais imersivos de jogo (ex: partículas, unidades no terreno).
- **Sistema Local de Eventos:** Utilize o serviço `GameNetworkService` para expor observadores que permitam às entidades visuais reagirem passivamente a atualizações de rede, evitando importar serviços ou adaptadores diretamente para dentro das instâncias do Three.js.

## 3. Qualidade de Código (TypeScript)
- O projeto adota validação rígida de tipos (`"strict": true` em mente). 
- Modifique e crie interfaces apropriadas em pastas de `types/`. Abomine a conversão ou uso direto com tipo `any`.
- Exporte apropriadamente classes e tipos, utilizando abordagens ECMAScript module patterns. Assegure a organização correta de imports de acordo com o linter (`eslint-plugin-simple-import-sort`).

## 4. Performance 3D
Por ser um mapa com grande carga visual, com potenciais milhares de divisões (províncias):
- **Otimização de Renderização:** Nunca recrie geometrias complexas ou instancie milhares de materiais dentro do ciclo do `onFrame`. Operações pesadas devem ocorrer na inicialização e o estado pode ser passado via manipulação direta do buffer ou via uniformes em Shaders customizados.
- **Raycasting Seguro:** Tenha cautela em intersecções de raio geradas pelo clique. Limite o raycaster apenas para meshes/grupos específicos onde sabidamente ocorreu interesse do usuário.
- **Gerenciamento de Memória:** Toda classe ou Entity que possua uma função de `dispose()` ou `unload()` precisa necessariamente desalocar recursos na placa de vídeo, utilizando `geometry.dispose()`, `material.dispose()`, além de também limpar EventListeners adicionados no DOM.

## 5. Arquivos Raw do Mapa
A malha visual é frequentemente gerada/baseada em uma "leitura ao vivo" via rede ou carregamento de arquivos estáticos.
- Entenda que modificações na leitura desses assets (`MapParser`) devem considerar possíveis falhas de conexão ou processamento demorado. 
- Mantenha a natureza assíncrona robusta.

## 6. Fluxo de Trabalho e Ações
- Não incorpore novos pacotes no `package.json` a não ser que estritamente solicitado e validado pelos steps de segurança (caso utilize SecureCoder e plugins afins).
- Antes de grandes reestruturações, descreva o plano e garanta que está modificando pequenas porções progressivas e modulares para que o review por parte do desenvolvedor humano seja produtivo.
- Teste toda refatoração relacionada à rede via instâncias locais se configuradas.
