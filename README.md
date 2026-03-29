# enigma-hacker
# 💀 Enigma Hacker: ADS Edition

Um jogo de enigmas focado em lógica de programação e segurança da informação, desenvolvido com uma arquitetura "Serverless" integrada ao Supabase para ranking em tempo real.

## 🚀 Sobre o Projeto
O **Enigma Hacker** desafia os jogadores a resolverem problemas de lógica e sintaxe enquanto competem em um ranking global. O sistema conta com uma "IA Sarcástica" que reage ao desempenho do jogador com feedbacks contextuais baseados no universo de desenvolvimento de software.

### ⚙️ Mecânicas Principais:
- **Sistema de Pontuação Dinâmica:** Acertos geram combos (5, 10, 15...), enquanto erros subtraem pontos.
- **Morte Súbita:** Jogadores que atingem **-50 pontos** são automaticamente desconectados do kernel (eliminados).
- **Ranking Real-time:** Visualização instantânea das ultrapassagens e status dos adversários via Supabase Realtime.

## 🛠️ Tecnologias Utilizadas
- **Frontend:** HTML5, CSS3 (Custom Terminal Theme), JavaScript (Vanilla).
- **Backend/Database:** [Supabase](https://supabase.com/) (PostgreSQL & Realtime engine).
- **Hospedagem:** GitHub Pages.
- **Ambiente de Dev:** GitHub Codespaces.

## 📂 Estrutura do Banco de Dados (SQL)
O projeto utiliza duas tabelas principais no PostgreSQL:
1. `enigmas`: Armazena os desafios, respostas criptografadas e níveis de dificuldade.
2. `ranking`: Gerencia a pontuação, sequências de acertos (streaks) e o status de ativação dos usuários.

## 🎨 Interface (UI/UX)
A interface foi projetada para simular um terminal de comando Linux/Unix, utilizando a paleta de cores clássica `#00ff41` (Green Matrix) para garantir imersão no tema de segurança digital.

## 🛠️ Como rodar o projeto
1. Clone este repositório.
2. Configure as variáveis de ambiente `URL_SUPABASE` e `KEY_SUPABASE` no arquivo `script.js`.
3. Abra o `index.html` em qualquer navegador ou use a extensão *Live Server*.

---
Desenvolvido por [Seu Nome] - Estudante de Análise e Desenvolvimento de Sistemas (ADS).Jogo de enigmas para devs. Stack: Vanilla JS + Supabase (Realtime DB). Mecânicas de combo, ranking global e eliminação por lógica de software.
