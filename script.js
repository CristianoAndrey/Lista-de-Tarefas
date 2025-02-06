const GIST_ID = 'ff6700242489a5eb36a5929293d8c869'; // Substitua pelo ID do seu Gist
const GITHUB_TOKEN = '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'; // Substitua pelo novo token de acesso

let pontos = 0;
let nivel = 1;
const pontosParaProximoNivel = 100;

document.addEventListener('DOMContentLoaded', () => {
    carregarDados();
});

async function salvarDados() {
    const listas = [];
    document.querySelectorAll('.lista').forEach(lista => {
        const tarefas = [];
        lista.querySelectorAll('.tarefa').forEach(tarefa => {
            tarefas.push({
                texto: tarefa.querySelector('span').textContent,
                prioridade: tarefa.querySelector('input[type="checkbox"]').getAttribute('data-prioridade'),
                completa: tarefa.classList.contains('completa'),
            });
        });

        listas.push({
            titulo: lista.querySelector('.lista-titulo').textContent,
            tarefas: tarefas
        });
    });

    const dados = { listas, pontos, nivel };

    try {
        const response = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                files: {
                    'data.json': {
                        content: JSON.stringify(dados, null, 2),
                    },
                },
            }),
        });

        if (!response.ok) throw new Error('Erro ao salvar dados');
        console.log('Dados salvos com sucesso!');
    } catch (error) {
        console.error('Erro ao salvar dados:', error);
    }
}

async function carregarDados() {
    try {
        const response = await fetch(`https://api.github.com/gists/${GIST_ID}`);
        if (!response.ok) throw new Error('Erro ao carregar dados');

        const data = await response.json();
        const dados = JSON.parse(data.files['data.json'].content);

        const { listas, pontos: pontosSalvos, nivel: nivelSalvo } = dados;

        pontos = pontosSalvos || 0;
        nivel = nivelSalvo || 1;

        const listasContainer = document.getElementById('listas-container');
        listasContainer.innerHTML = '';

        listas.forEach(listaData => {
            const novaLista = criarNovaListaElement(listaData.titulo);
            listasContainer.appendChild(novaLista);

            listaData.tarefas.forEach(tarefa => {
                adicionarTarefaExistente(novaLista, tarefa);
            });
        });

        atualizarInterface();
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
    }
}

// ... (restante do código permanece igual)
